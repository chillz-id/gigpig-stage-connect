#!/usr/bin/env node

/**
 * Notion Eventbrite Data Recovery Script
 * This script will create a recovery tool to restore Eventbrite data that was accidentally deleted
 */

const fs = require('fs');

console.log('📝 Creating Notion Eventbrite Recovery Script');
console.log('=============================================');

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

if (!NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN not found in environment variables');
    console.log('   Please ensure NOTION_TOKEN is set in /root/agents/.env');
    process.exit(1);
}

console.log(`✅ Found Notion token: ${NOTION_TOKEN.substring(0, 10)}...`);

// Create recovery script
const recoveryScript = `#!/usr/bin/env node

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

const NOTION_TOKEN = '${NOTION_TOKEN}';

// Database IDs that were cleaned
const DATABASES = {
    'Humanitix Attendees/Orders': '1374745b-8cbe-804b-87a2-ec93b3385e01',
    'Ticket Sales (Legacy)': '2304745b-8cbe-81cd-9483-d7acc2377bd6'
};

console.log('🚨 URGENT: EVENTBRITE DATA RECOVERY');
console.log('===================================');
console.log('This script will attempt to recover accidentally deleted Eventbrite data.');
console.log('');

function makeNotionRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            method: method,
            headers: {
                'Authorization': \`Bearer \${NOTION_TOKEN}\`,
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
                        reject(new Error(\`HTTP \${res.statusCode}: \${jsonData.message || body}\`));
                    }
                } catch (e) {
                    reject(new Error(\`Parse error: \${e.message}\`));
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
    console.log('\\n🔍 Step 1: Searching for archived Eventbrite data...');

    try {
        // Search across workspace for archived Eventbrite entries
        const searchUrl = 'https://api.notion.com/v1/search';
        const searchData = {
            query: 'eventbrite OR "order.placed" OR "eventbrite.com"',
            filter: {
                value: 'page',
                property: 'object'
            },
            page_size: 100
        };

        const searchResults = await makeNotionRequest(searchUrl, 'POST', searchData);

        console.log(\`   📊 Found \${searchResults.results.length} potential Eventbrite pages\`);

        // Filter for archived/deleted pages
        const archivedPages = searchResults.results.filter(page => page.archived === true);

        console.log(\`   🗑️  Found \${archivedPages.length} archived pages that may be Eventbrite data\`);

        return archivedPages;
    } catch (error) {
        console.log(\`   ❌ Error searching: \${error.message}\`);
        return [];
    }
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
            if (/^\\d{10,}$/.test(orderId)) { // Eventbrite order IDs are long numbers
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

        return { isEventbrite: false, confidence: 'low', reason: 'No Eventbrite indicators found' };
    } catch (error) {
        return { isEventbrite: false, confidence: 'low', reason: \`Analysis error: \${error.message}\` };
    }
}

async function restorePage(page) {
    try {
        console.log(\`   🔄 Restoring page: \${getPageTitle(page)}\`);

        const url = \`https://api.notion.com/v1/pages/\${page.id}\`;
        const body = {
            archived: false
        };

        await makeNotionRequest(url, 'PATCH', body);
        console.log(\`   ✅ Successfully restored\`);
        return true;
    } catch (error) {
        console.log(\`   ❌ Failed to restore: \${error.message}\`);
        return false;
    }
}

function getPageTitle(page) {
    try {
        const props = page.properties || {};

        // Try different title field names
        const titleFields = ['Name', 'Title', 'Event Name', 'Customer Name'];

        for (const field of titleFields) {
            const prop = props[field];
            if (prop && prop.title && prop.title[0]) {
                return prop.title[0].text.content;
            }
            if (prop && prop.rich_text && prop.rich_text[0]) {
                return prop.rich_text[0].text.content;
            }
        }

        return 'Unknown Title';
    } catch (error) {
        return 'Title Error';
    }
}

async function main() {
    try {
        console.log('\\n📋 RECOVERY PROCESS STARTING...');
        console.log('This may take several minutes depending on the amount of data.');
        console.log('');

        // Step 1: Search for archived Eventbrite data
        const archivedPages = await searchForArchivedEventbriteData();

        if (archivedPages.length === 0) {
            console.log('\\n❌ NO ARCHIVED EVENTBRITE DATA FOUND');
            console.log('   Either:');
            console.log('   1. The search didn\\'t find archived Eventbrite pages');
            console.log('   2. The Eventbrite data wasn\\'t actually deleted');
            console.log('   3. The data is permanently deleted (not just archived)');
            console.log('\\n🔧 MANUAL ACTION REQUIRED:');
            console.log('   1. Log into Notion web interface');
            console.log('   2. Go to database trash/archive for:');
            console.log('      - Humanitix Attendees/Orders: 1374745b-8cbe-804b-87a2-ec93b3385e01');
            console.log('      - Ticket Sales (Legacy): 2304745b-8cbe-81cd-9483-d7acc2377bd6');
            console.log('   3. Look for entries with "Eventbrite" platform or numeric order IDs');
            console.log('   4. Restore manually');
            return;
        }

        // Step 2: Analyze each page to confirm it's Eventbrite data
        console.log('\\n🔍 Step 2: Analyzing archived pages...');

        const eventbritePages = [];

        for (let i = 0; i < archivedPages.length; i++) {
            const page = archivedPages[i];
            const analysis = await analyzePageForEventbrite(page);

            console.log(\`   [\${i + 1}/\${archivedPages.length}] \${getPageTitle(page)}: \${analysis.reason}\`);

            if (analysis.isEventbrite && analysis.confidence !== 'low') {
                eventbritePages.push({ page, analysis });
            }

            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(\`\\n📊 ANALYSIS COMPLETE: Found \${eventbritePages.length} confirmed Eventbrite pages to restore\`);

        if (eventbritePages.length === 0) {
            console.log('\\n⚠️  NO EVENTBRITE PAGES IDENTIFIED FOR RESTORATION');
            console.log('   The archived pages don\\'t appear to contain Eventbrite data.');
            console.log('   Manual review may be required.');
            return;
        }

        // Step 3: Show what will be restored
        console.log('\\n📋 EVENTBRITE PAGES TO RESTORE:');
        eventbritePages.forEach((item, i) => {
            console.log(\`   \${i + 1}. \${getPageTitle(item.page)} (\${item.analysis.confidence} confidence)\`);
        });

        // Step 4: Confirm restoration
        console.log(\`\\n⚠️  CONFIRMATION REQUIRED:\`);
        console.log(\`   This will restore \${eventbritePages.length} Eventbrite pages from trash.\`);
        console.log(\`   They will be moved back to their original databases.\`);
        console.log(\`\\n🚀 Proceeding with restoration in 5 seconds...\`);
        console.log(\`   (Press Ctrl+C to cancel)\`);

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Step 5: Restore the pages
        console.log('\\n♻️  Step 3: Restoring Eventbrite pages...');

        let restoredCount = 0;
        let errorCount = 0;

        for (let i = 0; i < eventbritePages.length; i++) {
            const { page } = eventbritePages[i];

            console.log(\`   [\${i + 1}/\${eventbritePages.length}] Restoring...\`);

            const success = await restorePage(page);
            if (success) {
                restoredCount++;
            } else {
                errorCount++;
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Final report
        console.log('\\n🎉 RECOVERY COMPLETE!');
        console.log('=====================');
        console.log(\`✅ Successfully restored: \${restoredCount} Eventbrite entries\`);
        console.log(\`❌ Failed to restore: \${errorCount} entries\`);

        if (restoredCount > 0) {
            console.log('\\n🎯 SUCCESS: Eventbrite data has been restored!');
            console.log('   The restored entries should now be visible in the Notion databases.');
            console.log('   Please verify the data and check for completeness.');
        }

        if (errorCount > 0) {
            console.log('\\n⚠️  Some entries could not be restored automatically.');
            console.log('   Manual restoration may be required for these entries.');
        }

    } catch (error) {
        console.error('\\n❌ RECOVERY FAILED:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

main();
`;

// Write the recovery script
fs.writeFileSync('/root/agents/restore-eventbrite-data.js', recoveryScript);
console.log('✅ Created recovery script: /root/agents/restore-eventbrite-data.js');

// Create manual recovery guide
const manualGuide = `# URGENT: Manual Eventbrite Data Recovery Guide

## What Happened
The cleanup script accidentally deleted ALL 2500+ entries from both Notion databases:
- Humanitix Attendees/Orders (1374745b-8cbe-804b-87a2-ec93b3385e01)
- Ticket Sales (Legacy) (2304745b-8cbe-81cd-9483-d7acc2377bd6)

It should have only deleted Humanitix data, but deleted ALL data including Eventbrite entries.

## Recovery Options

### Option 1: Automated Recovery (PREFERRED)
Run the automated recovery script:
\`\`\`bash
node /root/agents/restore-eventbrite-data.js
\`\`\`

This script will:
1. Search for archived Eventbrite pages
2. Analyze them to confirm they're Eventbrite data
3. Restore only the Eventbrite entries

### Option 2: Manual Recovery (If automated fails)

1. **Access Notion Directly**:
   - Go to https://notion.so
   - Navigate to the affected databases

2. **Check Database Trash**:
   - For each database, click on "..." menu
   - Look for "Trash" or "Archive" option
   - You should see the 2500+ deleted entries

3. **Identify Eventbrite Entries**:
   Look for entries with:
   - Platform field = "Eventbrite"
   - Order IDs that are long numbers (Eventbrite pattern)
   - Event names containing "Melbourne Comedy" or similar
   - Raw data containing "eventbrite" or "eventbriteapi.com"

4. **Restore Eventbrite Entries**:
   - Select each Eventbrite entry
   - Click "Restore" or "Unarchive"
   - Do NOT restore Humanitix entries

## How to Prevent This in Future

1. **Add Platform Filtering**: Modify cleanup scripts to filter by platform
2. **Create Backups**: Export data before running cleanup scripts
3. **Test on Sample**: Always test scripts on small datasets first
4. **Manual Verification**: Review what will be deleted before confirming

## Expected Recovery

Based on typical event data, expect to recover:
- 50-200 Eventbrite attendee records
- Customer information and order details
- Event linkages and ticket information

## Verification Steps

After recovery:
1. Count restored entries in each database
2. Verify customer data is complete
3. Check event linkages are working
4. Confirm no Humanitix data was restored
5. Test ticket sales workflows

## Support

If automated recovery fails:
1. Review the script output for error messages
2. Try manual recovery process above
3. Check Notion API rate limits (may need to wait)
4. Contact Notion support if data is permanently lost
`;

fs.writeFileSync('/root/agents/EVENTBRITE_RECOVERY_GUIDE.md', manualGuide);
console.log('✅ Created manual guide: /root/agents/EVENTBRITE_RECOVERY_GUIDE.md');

console.log('\n🎯 RECOVERY TOOLS CREATED');
console.log('========================');
console.log('');
console.log('IMMEDIATE ACTION REQUIRED:');
console.log('1. Run automated recovery: node /root/agents/restore-eventbrite-data.js');
console.log('2. If that fails, follow manual guide: /root/agents/EVENTBRITE_RECOVERY_GUIDE.md');
console.log('');
console.log('⚠️  TIME IS CRITICAL - Notion may permanently delete archived data after 30 days');
console.log('');