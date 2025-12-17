/**
 * Muzeek Contact Scraper - Autonomous Version
 *
 * Usage:
 *   MUZEEK_COOKIES="your_cookie_string" npx ts-node scripts/muzeek-scraper.ts
 *
 * Or set cookies in .env.local:
 *   MUZEEK_COOKIES="your_cookie_string"
 */

import { chromium, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

interface MuzeekContact {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  abn: string;
  bsb: string;
  accountNumber: string;
  accountName: string;
  tags: string[];
  raw?: Record<string, unknown>;
}

const OUTPUT_DIR = path.join(__dirname, 'output');

function parseCookieString(cookieStr: string, domain: string): Array<{name: string; value: string; domain: string; path: string}> {
  return cookieStr.split(';').map(pair => {
    const [name, ...valueParts] = pair.trim().split('=');
    return {
      name: name.trim(),
      value: valueParts.join('='),
      domain,
      path: '/',
    };
  }).filter(c => c.name && c.value);
}

async function setupContext(cookies: string): Promise<BrowserContext> {
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  // Parse and set cookies
  const parsedCookies = parseCookieString(cookies, '.muzeek.com');
  await context.addCookies(parsedCookies);

  // Also add for app subdomain
  const appCookies = parseCookieString(cookies, 'app.muzeek.com');
  await context.addCookies(appCookies);

  return context;
}

async function interceptAndCaptureApi(page: Page): Promise<MuzeekContact[]> {
  const capturedContacts: MuzeekContact[] = [];
  const capturedResponses: Record<string, unknown>[] = [];

  page.on('response', async (response) => {
    const url = response.url();

    // Look for API endpoints that might return contact data
    if (
      url.includes('/api/') ||
      url.includes('/contacts') ||
      url.includes('/artists') ||
      url.includes('/clients') ||
      url.includes('graphql')
    ) {
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          capturedResponses.push({ url, data });

          // Try to extract contacts from various response shapes
          const contacts = extractContactsFromResponse(data);
          if (contacts.length > 0) {
            console.log(`  📥 Found ${contacts.length} contacts from ${url}`);
            capturedContacts.push(...contacts);
          }
        }
      } catch {
        // Ignore non-JSON responses
      }
    }
  });

  return capturedContacts;
}

function extractContactsFromResponse(data: unknown): MuzeekContact[] {
  const contacts: MuzeekContact[] = [];

  if (!data || typeof data !== 'object') return contacts;

  // Handle array responses
  if (Array.isArray(data)) {
    for (const item of data) {
      const contact = parseContactObject(item);
      if (contact) contacts.push(contact);
    }
    return contacts;
  }

  const obj = data as Record<string, unknown>;

  // Handle paginated responses
  if (obj.data && Array.isArray(obj.data)) {
    for (const item of obj.data) {
      const contact = parseContactObject(item);
      if (contact) contacts.push(contact);
    }
  }

  // Handle nested structures
  if (obj.contacts && Array.isArray(obj.contacts)) {
    for (const item of obj.contacts) {
      const contact = parseContactObject(item);
      if (contact) contacts.push(contact);
    }
  }

  if (obj.artists && Array.isArray(obj.artists)) {
    for (const item of obj.artists) {
      const contact = parseContactObject(item);
      if (contact) contacts.push(contact);
    }
  }

  if (obj.results && Array.isArray(obj.results)) {
    for (const item of obj.results) {
      const contact = parseContactObject(item);
      if (contact) contacts.push(contact);
    }
  }

  return contacts;
}

function parseContactObject(obj: unknown): MuzeekContact | null {
  if (!obj || typeof obj !== 'object') return null;

  const item = obj as Record<string, unknown>;

  // Must have at least a name or email to be considered a contact
  const name = getString(item, ['name', 'fullName', 'full_name', 'displayName', 'display_name']);
  const email = getString(item, ['email', 'emailAddress', 'email_address']);

  if (!name && !email) return null;

  return {
    id: getString(item, ['id', '_id', 'contactId', 'contact_id']) || `gen-${Date.now()}-${Math.random()}`,
    name: name || '',
    firstName: getString(item, ['firstName', 'first_name', 'given_name']) || '',
    lastName: getString(item, ['lastName', 'last_name', 'family_name']) || '',
    email: email || '',
    phone: getString(item, ['phone', 'phoneNumber', 'phone_number', 'mobile', 'mobileNumber']) || '',
    abn: getString(item, ['abn', 'ABN', 'taxNumber', 'tax_number', 'businessNumber']) || '',
    bsb: getString(item, ['bsb', 'BSB', 'bankBsb', 'bank_bsb']) || '',
    accountNumber: getString(item, ['accountNumber', 'account_number', 'bankAccount', 'bank_account']) || '',
    accountName: getString(item, ['accountName', 'account_name', 'bankAccountName']) || '',
    tags: getStringArray(item, ['tags', 'labels', 'categories']),
    raw: item,
  };
}

function getString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function getStringArray(obj: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const value = obj[key];
    if (Array.isArray(value)) {
      return value.filter(v => typeof v === 'string') as string[];
    }
  }
  return [];
}

async function scrapeFromDOM(page: Page): Promise<MuzeekContact[]> {
  console.log('  🔍 Attempting DOM scraping...');

  const contacts: MuzeekContact[] = [];

  // Try to find contact elements in the DOM
  // These selectors are guesses - may need adjustment based on actual Muzeek structure
  const selectors = [
    'table tbody tr',
    '[data-testid*="contact"]',
    '[class*="contact-row"]',
    '[class*="artist-row"]',
    '.list-item',
    '[role="row"]',
  ];

  for (const selector of selectors) {
    const rows = await page.$$(selector);
    if (rows.length > 1) { // More than header row
      console.log(`  Found ${rows.length} rows with selector: ${selector}`);

      for (const row of rows) {
        try {
          const text = await row.textContent();
          if (!text) continue;

          // Try to extract email from row
          const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
          const phoneMatch = text.match(/(?:\+61|0)[2-478][\s-]?\d{4}[\s-]?\d{4}/);

          // Get all cell texts
          const cells = await row.$$('td, [role="cell"]');
          const cellTexts: string[] = [];
          for (const cell of cells) {
            const cellText = await cell.textContent();
            if (cellText?.trim()) cellTexts.push(cellText.trim());
          }

          if (emailMatch || cellTexts.length >= 2) {
            contacts.push({
              id: `dom-${contacts.length}`,
              name: cellTexts[0] || '',
              firstName: '',
              lastName: '',
              email: emailMatch?.[0] || '',
              phone: phoneMatch?.[0] || '',
              abn: '',
              bsb: '',
              accountNumber: '',
              accountName: '',
              tags: [],
            });
          }
        } catch {
          // Ignore row parsing errors
        }
      }

      if (contacts.length > 0) break;
    }
  }

  return contacts;
}

async function scrollToLoadAll(page: Page): Promise<void> {
  console.log('  📜 Scrolling to load all contacts...');

  let previousHeight = 0;
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);

    if (currentHeight === previousHeight) {
      // Try clicking "Load More" button if exists
      const loadMoreButton = await page.$('button:has-text("Load More"), button:has-text("Show More"), [class*="load-more"]');
      if (loadMoreButton) {
        await loadMoreButton.click();
        await page.waitForTimeout(2000);
      } else {
        break;
      }
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    previousHeight = currentHeight;
    attempts++;
  }
}

function deduplicateContacts(contacts: MuzeekContact[]): MuzeekContact[] {
  const seen = new Map<string, MuzeekContact>();

  for (const contact of contacts) {
    const key = contact.email || contact.name || contact.id;
    if (!seen.has(key)) {
      seen.set(key, contact);
    } else {
      // Merge with existing - keep non-empty values
      const existing = seen.get(key)!;
      for (const [k, v] of Object.entries(contact)) {
        if (v && !existing[k as keyof MuzeekContact]) {
          (existing as Record<string, unknown>)[k] = v;
        }
      }
    }
  }

  return Array.from(seen.values());
}

function saveResults(contacts: MuzeekContact[]): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Save JSON (with raw data for debugging)
  const jsonPath = path.join(OUTPUT_DIR, 'muzeek-contacts.json');
  fs.writeFileSync(jsonPath, JSON.stringify(contacts, null, 2));
  console.log(`\n💾 Saved JSON to ${jsonPath}`);

  // Save CSV (clean version for import)
  const csvHeader = 'Name,First Name,Last Name,Email,Phone,ABN,BSB,Account Number,Account Name,Tags\n';
  const csvRows = contacts.map(c =>
    [
      c.name,
      c.firstName,
      c.lastName,
      c.email,
      c.phone,
      c.abn,
      c.bsb,
      c.accountNumber,
      c.accountName,
      c.tags.join('; '),
    ].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const csvPath = path.join(OUTPUT_DIR, 'muzeek-contacts.csv');
  fs.writeFileSync(csvPath, csvHeader + csvRows);
  console.log(`💾 Saved CSV to ${csvPath}`);
}

async function main() {
  console.log('🎤 Muzeek Contact Scraper (Autonomous)\n');

  const cookies = process.env.MUZEEK_COOKIES;

  if (!cookies) {
    console.error('❌ Error: MUZEEK_COOKIES environment variable not set');
    console.log('\nUsage:');
    console.log('  MUZEEK_COOKIES="your_cookie_string" npm run scrape:muzeek');
    console.log('\nTo get cookies:');
    console.log('  1. Go to app.muzeek.com in Chrome (logged in)');
    console.log('  2. Open DevTools (F12) → Network tab');
    console.log('  3. Refresh page, click any request');
    console.log('  4. Copy the "Cookie:" header value from Request Headers');
    process.exit(1);
  }

  console.log('🔐 Setting up authenticated browser...');
  const context = await setupContext(cookies);
  const page = await context.newPage();

  // Set up API interception
  const apiContacts = await interceptAndCaptureApi(page);

  // Navigate to contacts page
  const contactsUrls = [
    'https://app.muzeek.com/contacts',
    'https://app.muzeek.com/artists',
    'https://app.muzeek.com/clients',
    'https://app.muzeek.com/roster',
  ];

  let allContacts: MuzeekContact[] = [];

  for (const url of contactsUrls) {
    console.log(`\n📍 Trying ${url}...`);

    try {
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      if (response?.status() === 200) {
        console.log(`  ✓ Page loaded successfully`);

        // Wait for content to load
        await page.waitForTimeout(3000);

        // Scroll to load all
        await scrollToLoadAll(page);

        // Try DOM scraping
        const domContacts = await scrapeFromDOM(page);
        allContacts.push(...domContacts);

        // Give time for any lazy-loaded API calls
        await page.waitForTimeout(2000);
      }
    } catch (err) {
      console.log(`  ⚠️ Could not load ${url}`);
    }
  }

  // Combine API-captured and DOM-scraped contacts
  allContacts.push(...apiContacts);

  // Deduplicate
  const uniqueContacts = deduplicateContacts(allContacts);

  console.log(`\n📊 Results:`);
  console.log(`  - API captured: ${apiContacts.length}`);
  console.log(`  - DOM scraped: ${allContacts.length - apiContacts.length}`);
  console.log(`  - Unique contacts: ${uniqueContacts.length}`);

  if (uniqueContacts.length > 0) {
    saveResults(uniqueContacts);

    // Show sample
    console.log('\n📋 Sample contacts:');
    uniqueContacts.slice(0, 3).forEach(c => {
      console.log(`  - ${c.name || c.email} ${c.abn ? `(ABN: ${c.abn})` : ''}`);
    });
  } else {
    console.log('\n⚠️ No contacts found. This could mean:');
    console.log('  - Cookies have expired (try getting fresh ones)');
    console.log('  - Muzeek uses a different URL structure');
    console.log('  - Data is loaded via WebSocket or different API');

    // Save page HTML for debugging
    const html = await page.content();
    const debugPath = path.join(OUTPUT_DIR, 'muzeek-debug.html');
    fs.writeFileSync(debugPath, html);
    console.log(`\n🔍 Saved page HTML to ${debugPath} for debugging`);

    // Take screenshot
    const screenshotPath = path.join(OUTPUT_DIR, 'muzeek-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Saved screenshot to ${screenshotPath}`);
  }

  await context.browser()?.close();
  console.log('\n✅ Done!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
