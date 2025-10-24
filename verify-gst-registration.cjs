#!/usr/bin/env node

/**
 * GST Registration Verification Script
 *
 * This script:
 * 1. Queries all Xero contacts in Notion with TaxNumbers
 * 2. Checks each ABN via ABN lookup website
 * 3. Updates the GST REGISTERED checkbox in Notion
 */

const https = require('https');
const { Client } = require('@notionhq/client');

if (!process.env.NOTION_API_KEY) {
  console.error('Error: NOTION_API_KEY environment variable not set');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = '2804745b-8cbe-80e1-af9c-dc2124e9c195';

// Fetch ABN GST status from ABR website
async function checkGSTStatus(abn) {
  return new Promise((resolve, reject) => {
    const url = `https://abr.business.gov.au/ABN/View?abn=${abn}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        // Check if "Goods & Services Tax (GST):" appears with "Registered from"
        const isGSTRegistered = data.includes('Goods &amp; Services Tax (GST):') &&
                                data.includes('Registered from');
        resolve(isGSTRegistered);
      });
    }).on('error', (err) => {
      console.error(`Error checking ABN ${abn}:`, err.message);
      reject(err);
    });
  });
}

// Get all contacts with TaxNumbers from Notion
async function getAllContactsWithTaxNumbers() {
  const contacts = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'TaxNumber',
        rich_text: {
          is_not_empty: true
        }
      },
      page_size: 10,
      start_cursor: startCursor
    });

    for (const page of response.results) {
      const taxNumber = page.properties.TaxNumber.rich_text[0]?.plain_text;
      const name = page.properties.Name.title[0]?.plain_text;
      const gstRegistered = page.properties['GST REGISTERED'].checkbox;

      if (taxNumber) {
        contacts.push({
          id: page.id,
          name: name || 'Unknown',
          taxNumber,
          currentGSTStatus: gstRegistered
        });
      }
    }

    hasMore = response.has_more;
    startCursor = response.next_cursor;
  }

  return contacts;
}

// Update GST REGISTERED checkbox in Notion
async function updateGSTStatus(pageId, isRegistered) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      'GST REGISTERED': {
        checkbox: isRegistered
      }
    }
  });
}

// Main execution
async function main() {
  console.log('🔍 Fetching all contacts with TaxNumbers from Notion...\n');

  const contacts = await getAllContactsWithTaxNumbers();
  console.log(`Found ${contacts.length} contacts with TaxNumbers\n`);

  let updated = 0;
  let unchanged = 0;
  let errors = 0;

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    console.log(`[${i + 1}/${contacts.length}] Checking ${contact.name} (ABN: ${contact.taxNumber})...`);

    try {
      const isGSTRegistered = await checkGSTStatus(contact.taxNumber);

      if (isGSTRegistered !== contact.currentGSTStatus) {
        await updateGSTStatus(contact.id, isGSTRegistered);
        console.log(`  ✅ Updated: ${isGSTRegistered ? 'GST REGISTERED' : 'NOT GST REGISTERED'}\n`);
        updated++;
      } else {
        console.log(`  ℹ️  No change: ${isGSTRegistered ? 'GST REGISTERED' : 'NOT GST REGISTERED'}\n`);
        unchanged++;
      }

      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
      errors++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  Updated: ${updated}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${contacts.length}`);
}

main().catch(console.error);
