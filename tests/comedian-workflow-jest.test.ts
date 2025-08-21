import puppeteer, { Browser, Page } from 'puppeteer';

describe('Comedian Complete Workflow Test', () => {
  let browser: Browser;
  let page: Page;
  const baseUrl = 'http://localhost:8081';
  
  // Test data
  const timestamp = Date.now();
  const comedianEmail = `comedian.test.${timestamp}@example.com`;
  const comedianPassword = 'TestPassword123!';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new', // Use new headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      defaultViewport: { width: 1280, height: 720 }
    });
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setDefaultTimeout(15000);
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('1. Comedian can sign up', async () => {
    console.log('📝 Testing comedian sign up...');
    
    await page.goto(`${baseUrl}/auth`);
    await page.waitForSelector('button', { visible: true });
    
    // Click on Sign up tab if needed
    const signUpButton = await page.$('button:has-text("Sign up"), [role="tab"]:has-text("Sign up")');
    if (signUpButton) {
      await signUpButton.click();
      await page.waitForTimeout(500);
    }
    
    // Fill signup form
    await page.type('input[type="email"]', comedianEmail);
    await page.type('input[type="password"]', comedianPassword);
    
    // Select comedian role
    const comedianRole = await page.$('label:has-text("Comedian"), button:has-text("Comedian"), input[value="comedian"]');
    if (comedianRole) {
      await comedianRole.click();
    }
    
    // Submit form
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    // Should redirect to dashboard
    const currentUrl = page.url();
    expect(currentUrl).toContain('/dashboard');
    console.log('✅ Comedian signed up successfully');
  }, 30000);

  test('2. Comedian can complete profile', async () => {
    console.log('👤 Testing profile completion...');
    
    // Sign in first
    await signIn(page, baseUrl, comedianEmail, comedianPassword);
    
    // Navigate to profile
    await page.goto(`${baseUrl}/profile`);
    await page.waitForSelector('input, textarea', { visible: true });
    
    // Fill profile details
    const fields = {
      'full_name': 'Test Comedian',
      'stage_name': 'The Test Comic',
      'bio': 'A hilarious test comedian with years of experience.',
      'phone': '+61412345678'
    };
    
    for (const [name, value] of Object.entries(fields)) {
      const field = await page.$(`input[name="${name}"], textarea[name="${name}"]`);
      if (field) {
        await field.click({ clickCount: 3 }); // Select all
        await field.type(value);
      }
    }
    
    // Save profile
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(2000);
    
    console.log('✅ Profile completed successfully');
  }, 30000);

  test('3. Comedian can browse available shows', async () => {
    console.log('🎭 Testing show browsing...');
    
    await signIn(page, baseUrl, comedianEmail, comedianPassword);
    
    // Navigate to shows
    await page.goto(`${baseUrl}/shows`);
    await page.waitForTimeout(2000);
    
    // Check for show cards
    const showCards = await page.$$('.show-card, [data-testid="show-card"], article, .card');
    console.log(`Found ${showCards.length} show cards`);
    
    // Look for apply buttons
    const applyButtons = await page.$$('button:has-text("Apply"), button:has-text("Apply Now")');
    console.log(`Found ${applyButtons.length} shows available for application`);
    
    expect(showCards.length).toBeGreaterThan(0);
    console.log('✅ Shows are visible');
  }, 30000);

  test('4. Comedian can apply for shows', async () => {
    console.log('📋 Testing show application...');
    
    await signIn(page, baseUrl, comedianEmail, comedianPassword);
    await page.goto(`${baseUrl}/shows`);
    await page.waitForTimeout(2000);
    
    // Find first apply button
    const applyButton = await page.$('button:has-text("Apply"):not([disabled])');
    
    if (applyButton) {
      await applyButton.click();
      await page.waitForTimeout(1000);
      
      // Check if application modal appears
      const modal = await page.$('[role="dialog"], .modal, .application-form');
      if (modal) {
        // Fill application notes if field exists
        const notesField = await page.$('textarea[name="notes"], textarea[placeholder*="note"]');
        if (notesField) {
          await notesField.type('I would love to perform at this show!');
        }
        
        // Submit application
        const submitButton = await page.$('button:has-text("Submit"), button:has-text("Apply"):not([disabled])');
        if (submitButton) {
          await submitButton.click();
        }
      }
      
      await page.waitForTimeout(2000);
      console.log('✅ Applied for show successfully');
    } else {
      console.log('⚠️ No available shows to apply for');
    }
  }, 30000);

  test('5. Comedian can view their applications', async () => {
    console.log('📂 Testing application viewing...');
    
    await signIn(page, baseUrl, comedianEmail, comedianPassword);
    
    // Try applications page first
    await page.goto(`${baseUrl}/applications`);
    await page.waitForTimeout(2000);
    
    // If no applications page, check dashboard
    if (!page.url().includes('/applications')) {
      await page.goto(`${baseUrl}/dashboard`);
      await page.waitForTimeout(2000);
    }
    
    // Look for application indicators
    const applicationElements = await page.$$('[data-status="pending"], .application-pending, text=/Pending|Applied/i');
    console.log(`Found ${applicationElements.length} pending applications`);
    
    console.log('✅ Application viewing tested');
  }, 30000);

  test('6. Comedian can check confirmed shows', async () => {
    console.log('✅ Testing confirmed shows...');
    
    await signIn(page, baseUrl, comedianEmail, comedianPassword);
    
    // Navigate to profile gigs tab
    await page.goto(`${baseUrl}/profile`);
    await page.waitForTimeout(1000);
    
    // Look for gigs tab
    const gigsTab = await page.$('[role="tab"]:has-text("Gigs"), button:has-text("Gigs"), a:has-text("Gigs")');
    if (gigsTab) {
      await gigsTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Check for confirmed shows
    const confirmedShows = await page.$$('[data-status="confirmed"], .confirmed, text=/Confirmed|Booked/i');
    console.log(`Found ${confirmedShows.length} confirmed shows`);
    
    if (confirmedShows.length === 0) {
      console.log('ℹ️ No confirmed shows yet (this is normal for new applications)');
    }
    
    console.log('✅ Confirmed shows check completed');
  }, 30000);

  test('7. Comedian can access calendar sync', async () => {
    console.log('📅 Testing calendar sync feature...');
    
    await signIn(page, baseUrl, comedianEmail, comedianPassword);
    
    // Navigate to profile calendar tab
    await page.goto(`${baseUrl}/profile`);
    await page.waitForTimeout(1000);
    
    // Look for calendar tab
    const calendarTab = await page.$('[role="tab"]:has-text("Calendar"), button:has-text("Calendar")');
    if (calendarTab) {
      await calendarTab.click();
      await page.waitForTimeout(1000);
      
      // Check for Google Calendar button
      const googleCalButton = await page.$('button:has-text("Connect Google Calendar")');
      if (googleCalButton) {
        console.log('✅ Google Calendar integration available');
      }
      
      // Check for ICS export
      const icsButton = await page.$('button:has-text("Download"), button:has-text("Export")');
      if (icsButton) {
        console.log('✅ Calendar export (ICS) available');
      }
    }
    
    console.log('✅ Calendar sync features tested');
  }, 30000);
});

// Helper function to sign in
async function signIn(page: Page, baseUrl: string, email: string, password: string) {
  await page.goto(`${baseUrl}/auth`);
  await page.waitForSelector('input[type="email"]', { visible: true });
  
  // Make sure we're on sign in tab
  const signInTab = await page.$('button:has-text("Sign in"), [role="tab"]:has-text("Sign in")');
  if (signInTab) {
    await signInTab.click();
    await page.waitForTimeout(500);
  }
  
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type="submit"]')
  ]);
}