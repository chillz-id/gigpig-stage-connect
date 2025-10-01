#!/usr/bin/env node

/**
 * URGENT: Eventbrite Data Recovery Script
 *
 * This script attempts to recover Eventbrite attendee data that was accidentally
 * deleted from Notion databases during the Humanitix cleanup process.
 *
 * WHAT HAPPENED:
 * - cleanup script deleted ALL entries from both databases (2500+ entries)
 * - Should have only deleted Humanitix data, not Eventbrite data
 * - Need to restore ONLY the Eventbrite entries from Notion's trash
 *
 * RECOVERY APPROACH:
 * 1. Query Notion's archived/deleted pages
 * 2. Filter for Eventbrite-specific entries
 * 3. Restore only the Eventbrite data
 */

const https = require('https');
const fs = require('fs');

// Load environment for Notion token
const envContent = fs.readFileSync('/root/agents/.env', 'utf8');
const envLines = envContent.split('\n');
for (const line of envLines) {
    if (line.includes('=') && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        process.env[key.trim()] = value.trim();
    }
}

const NOTION_TOKEN = process.env.NOTION_TOKEN;

// Database IDs that were cleaned
const DATABASES = {
    'Humanitix Attendees/Orders': '1374745b-8cbe-804b-87a2-ec93b3385e01',
    'Ticket Sales (Legacy)': '2304745b-8cbe-81cd-9483-d7acc2377bd6'
};

if (!NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN not found in environment variables');
    process.exit(1);
}

console.log('🚨 URGENT: EVENTBRITE DATA RECOVERY');
console.log('===================================');
console.log('This script will attempt to recover accidentally deleted Eventbrite data.');
console.log(`🔑 Using Notion Token: ${NOTION_TOKEN.substring(0, 10)}...`);
console.log('');

function makeNotionRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(jsonData);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${jsonData.message || body}`));
                    }
                } catch (e) {
                    reject(new Error(`Parse error: ${e.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function searchForArchivedEventbriteData() {
    console.log('\n🔍 Step 1: Searching for archived Eventbrite data...');

    try {
        // Search across workspace for archived Eventbrite entries
        const searchUrl = 'https://api.notion.com/v1/search';
        const searchData = {
            query: 'eventbrite OR "order.placed" OR "eventbriteapi.com"',
            filter: {
                value: 'page',
                property: 'object'
            },
            page_size: 100
        };

        const searchResults = await makeNotionRequest(searchUrl, 'POST', searchData);

        console.log(`   📊 Found ${searchResults.results.length} potential Eventbrite pages`);

        // Filter for archived/deleted pages
        const archivedPages = searchResults.results.filter(page => page.archived === true);

        console.log(`   🗑️  Found ${archivedPages.length} archived pages that may be Eventbrite data`);

        // If search didn't find archived pages, try querying databases directly for archived content
        if (archivedPages.length === 0) {
            console.log('   ⚠️  Search didn\'t find archived pages. Trying direct database queries...');
            return await queryDatabasesForArchivedData();
        }

        return archivedPages;
    } catch (error) {
        console.log(`   ❌ Error searching: ${error.message}`);
        console.log('   🔄 Falling back to direct database queries...');
        return await queryDatabasesForArchivedData();
    }
}

async function queryDatabasesForArchivedData() {
    console.log('\n🔍 Step 1b: Querying databases directly for archived data...');

    const allArchivedPages = [];

    for (const [dbName, dbId] of Object.entries(DATABASES)) {
        try {
            console.log(`   🔍 Checking ${dbName}...`);

            // Try to query for archived pages in this database
            const queryUrl = `https://api.notion.com/v1/databases/${dbId}/query`;
            const queryData = {
                filter: {
                    property: 'Platform',
                    select: {
                        equals: 'Eventbrite'
                    }
                },
                page_size: 100
            };

            const queryResults = await makeNotionRequest(queryUrl, 'POST', queryData);
            const archivedInDb = queryResults.results.filter(page => page.archived === true);

            console.log(`   📊 Found ${archivedInDb.length} archived Eventbrite pages in ${dbName}`);
            allArchivedPages.push(...archivedInDb);

        } catch (error) {
            console.log(`   ⚠️  Could not query ${dbName}: ${error.message}`);
        }
    }

    console.log(`   🗑️  Total archived Eventbrite pages found: ${allArchivedPages.length}`);
    return allArchivedPages;
}

async function analyzePageForEventbrite(page) {
    try {
        // Check page properties for Eventbrite indicators
        const props = page.properties || {};

        // Look for platform indicators
        const platformProp = props.Platform || props['Ticketing Partner'] || props.Source;
        if (platformProp && platformProp.select && platformProp.select.name === 'Eventbrite') {
            return { isEventbrite: true, confidence: 'high', reason: 'Platform field = Eventbrite' };
        }

        // Look for Eventbrite-specific order IDs (typically numeric strings)
        const orderIdProp = props['Order ID'] || props.OrderId || props.order_id;
        if (orderIdProp && orderIdProp.rich_text && orderIdProp.rich_text[0]) {
            const orderId = orderIdProp.rich_text[0].text.content;
            if (/^\d{10,}$/.test(orderId)) { // Eventbrite order IDs are long numbers
                return { isEventbrite: true, confidence: 'medium', reason: 'Numeric order ID pattern' };
            }
        }

        // Check raw data field for Eventbrite API structure
        const rawDataProp = props['Raw Data'] || props.raw_data;
        if (rawDataProp && rawDataProp.rich_text && rawDataProp.rich_text[0]) {
            const rawData = rawDataProp.rich_text[0].text.content;
            if (rawData.includes('eventbrite') || rawData.includes('eventbriteapi.com')) {
                return { isEventbrite: true, confidence: 'high', reason: 'Eventbrite in raw data' };
            }
        }

        // Check event name or customer email for Eventbrite patterns
        const eventNameProp = props['Event Name'] || props.event_name;
        if (eventNameProp && eventNameProp.rich_text && eventNameProp.rich_text[0]) {
            const eventName = eventNameProp.rich_text[0].text.content;
            if (eventName.includes('Eventbrite') || eventName.includes('Melbourne Comedy')) {
                return { isEventbrite: true, confidence: 'medium', reason: 'Event name patterns' };
            }
        }

        // Check for Eventbrite URLs in any text fields
        const textFields = Object.values(props).filter(prop =>
            prop.rich_text || prop.url || prop.title
        );

        for (const field of textFields) {
            let textContent = '';
            if (field.rich_text && field.rich_text[0]) {
                textContent = field.rich_text[0].text.content;
            } else if (field.url) {
                textContent = field.url;
            } else if (field.title && field.title[0]) {
                textContent = field.title[0].text.content;
            }

            if (textContent.includes('eventbrite.com') || textContent.includes('eventbriteapi.com')) {
                return { isEventbrite: true, confidence: 'high', reason: 'Eventbrite URL found' };
            }
        }

        return { isEventbrite: false, confidence: 'low', reason: 'No Eventbrite indicators found' };
    } catch (error) {
        return { isEventbrite: false, confidence: 'low', reason: `Analysis error: ${error.message}` };
    }
}

async function restorePage(page) {
    try {
        console.log(`   🔄 Restoring page: ${getPageTitle(page)}`);

        const url = `https://api.notion.com/v1/pages/${page.id}`;
        const body = {
            archived: false
        };

        await makeNotionRequest(url, 'PATCH', body);
        console.log(`   ✅ Successfully restored`);
        return true;
    } catch (error) {
        console.log(`   ❌ Failed to restore: ${error.message}`);
        return false;
    }
}

function getPageTitle(page) {
    try {
        const props = page.properties || {};

        // Try different title field names
        const titleFields = ['Name', 'Title', 'Event Name', 'Customer Name', 'Order ID'];

        for (const field of titleFields) {
            const prop = props[field];
            if (prop && prop.title && prop.title[0]) {
                return prop.title[0].text.content;
            }
            if (prop && prop.rich_text && prop.rich_text[0]) {
                return prop.rich_text[0].text.content;
            }
        }

        return `Page ${page.id.substring(0, 8)}`;
    } catch (error) {
        return 'Title Error';
    }
}

async function main() {
    try {
        console.log('\n📋 RECOVERY PROCESS STARTING...');
        console.log('This may take several minutes depending on the amount of data.');
        console.log('');

        // Step 1: Search for archived Eventbrite data
        const archivedPages = await searchForArchivedEventbriteData();

        if (archivedPages.length === 0) {
            console.log('\n❌ NO ARCHIVED EVENTBRITE DATA FOUND');
            console.log('   Either:');
            console.log('   1. The search didn\'t find archived Eventbrite pages');
            console.log('   2. The Eventbrite data wasn\'t actually deleted');
            console.log('   3. The data is permanently deleted (not just archived)');
            console.log('   4. The Notion API search doesn\'t include archived pages');
            console.log('\n🔧 MANUAL ACTION REQUIRED:');
            console.log('   1. Log into Notion web interface at https://notion.so');
            console.log('   2. Go to database trash/archive for:');
            console.log('      - Humanitix Attendees/Orders: 1374745b-8cbe-804b-87a2-ec93b3385e01');
            console.log('      - Ticket Sales (Legacy): 2304745b-8cbe-81cd-9483-d7acc2377bd6');
            console.log('   3. Look for entries with "Eventbrite" platform or numeric order IDs');
            console.log('   4. Restore manually by selecting entries and clicking "Restore"');
            console.log('\n📋 Expected Eventbrite patterns to look for:');
            console.log('   - Platform field = "Eventbrite"');
            console.log('   - Order IDs that are long numbers (10+ digits)');
            console.log('   - Raw data containing "eventbrite" or "eventbriteapi.com"');
            console.log('   - Event names with "Melbourne Comedy" or similar');
            return;
        }

        // Step 2: Analyze each page to confirm it's Eventbrite data
        console.log('\n🔍 Step 2: Analyzing archived pages...');

        const eventbritePages = [];

        for (let i = 0; i < archivedPages.length; i++) {
            const page = archivedPages[i];
            const analysis = await analyzePageForEventbrite(page);

            console.log(`   [${i + 1}/${archivedPages.length}] ${getPageTitle(page)}: ${analysis.reason}`);

            if (analysis.isEventbrite && analysis.confidence !== 'low') {
                eventbritePages.push({ page, analysis });
            }

            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log(`\n📊 ANALYSIS COMPLETE: Found ${eventbritePages.length} confirmed Eventbrite pages to restore`);

        if (eventbritePages.length === 0) {
            console.log('\n⚠️  NO EVENTBRITE PAGES IDENTIFIED FOR RESTORATION');
            console.log('   The archived pages don\'t appear to contain Eventbrite data.');
            console.log('   This could mean:');
            console.log('   1. Eventbrite data was not actually deleted');
            console.log('   2. Eventbrite data doesn\'t match expected patterns');
            console.log('   3. Manual review is required');
            console.log('\n🔧 RECOMMENDED ACTION:');
            console.log('   - Check both databases manually via Notion web interface');
            console.log('   - Look in trash/archive for any entries with numeric order IDs');
            console.log('   - Review recent webhook logs for Eventbrite data patterns');
            return;
        }

        // Step 3: Show what will be restored
        console.log('\n📋 EVENTBRITE PAGES TO RESTORE:');
        eventbritePages.forEach((item, i) => {
            console.log(`   ${i + 1}. ${getPageTitle(item.page)} (${item.analysis.confidence} confidence: ${item.analysis.reason})`);
        });

        // Step 4: Confirm restoration
        console.log(`\n⚠️  CONFIRMATION REQUIRED:`);
        console.log(`   This will restore ${eventbritePages.length} Eventbrite pages from trash.`);
        console.log(`   They will be moved back to their original databases.`);
        console.log(`   This action cannot be easily undone.`);
        console.log(`\n🚀 Proceeding with restoration in 5 seconds...`);
        console.log(`   (Press Ctrl+C to cancel)`);

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Step 5: Restore the pages
        console.log('\n♻️  Step 3: Restoring Eventbrite pages...');

        let restoredCount = 0;
        let errorCount = 0;

        for (let i = 0; i < eventbritePages.length; i++) {
            const { page } = eventbritePages[i];

            console.log(`   [${i + 1}/${eventbritePages.length}] Restoring...`);

            const success = await restorePage(page);
            if (success) {
                restoredCount++;
            } else {
                errorCount++;
            }

            // Rate limiting - be gentle with Notion API
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Final report
        console.log('\n🎉 RECOVERY COMPLETE!');
        console.log('=====================');
        console.log(`✅ Successfully restored: ${restoredCount} Eventbrite entries`);
        console.log(`❌ Failed to restore: ${errorCount} entries`);

        if (restoredCount > 0) {
            console.log('\n🎯 SUCCESS: Eventbrite data has been restored!');
            console.log('   The restored entries should now be visible in the Notion databases.');
            console.log('   Please verify the data and check for completeness.');
            console.log('\n📋 VERIFICATION STEPS:');
            console.log('   1. Check both databases for restored Eventbrite entries');
            console.log('   2. Verify customer names and order details are intact');
            console.log('   3. Confirm no Humanitix data was accidentally restored');
            console.log('   4. Test ticket sales reporting to ensure data integrity');
        }

        if (errorCount > 0) {
            console.log('\n⚠️  Some entries could not be restored automatically.');
            console.log('   Manual restoration may be required for these entries.');
            console.log('   Check the Notion interface for these pages and restore manually.');
        }

        if (restoredCount === 0) {
            console.log('\n❌ NO ENTRIES WERE RESTORED');
            console.log('   This could indicate:');
            console.log('   1. Eventbrite data was not in the archived results');
            console.log('   2. All Eventbrite data was already restored');
            console.log('   3. The data was permanently deleted');
            console.log('   4. API permissions or rate limits prevented restoration');
            console.log('\n🔧 NEXT STEPS:');
            console.log('   - Check Notion manually for any remaining archived data');
            console.log('   - Contact Notion support if data appears permanently lost');
            console.log('   - Review webhook logs for alternative data sources');
        }

    } catch (error) {
        console.error('\n❌ RECOVERY FAILED:', error.message);
        console.error('Stack trace:', error.stack);
        console.log('\n🔧 FALLBACK OPTIONS:');
        console.log('1. Try manual recovery via Notion web interface');
        console.log('2. Check webhook logs for original Eventbrite data');
        console.log('3. Contact Notion support for data recovery assistance');
        process.exit(1);
    }
}

main();