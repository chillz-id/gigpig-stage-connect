#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Load environment variables manually
const envContent = fs.readFileSync('/root/agents/.env', 'utf8');
const envLines = envContent.split('\n');
for (const line of envLines) {
    if (line.includes('=') && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        process.env[key.trim()] = value.trim();
    }
}

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = '1374745b-8cbe-804b-87a2-ec93b3385e01'; // Humanitix attendees/orders database

if (!NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN not found in environment variables');
    process.exit(1);
}

console.log('🧹 HUMANITIX NOTION DATA CLEANUP');
console.log('================================');
console.log(`📊 Database ID: ${NOTION_DATABASE_ID}`);
console.log(`🔑 Using Notion Token: ${NOTION_TOKEN.substring(0, 10)}...`);

function makeRequest(url, method = 'GET', data = null) {
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

async function queryAllPages() {
    console.log('\n📋 Step 1: Querying all existing entries...');

    let allPages = [];
    let hasMore = true;
    let nextCursor = null;

    try {
        while (hasMore) {
            const body = {
                page_size: 100
            };

            if (nextCursor) {
                body.start_cursor = nextCursor;
            }

            console.log(`   🔄 Fetching batch... (${allPages.length} pages so far)`);

            const url = `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`;
            const data = await makeRequest(url, 'POST', body);

            allPages = allPages.concat(data.results);
            hasMore = data.has_more;
            nextCursor = data.next_cursor;

            console.log(`   ✅ Fetched ${data.results.length} pages in this batch`);
        }

        console.log(`\n📊 TOTAL ENTRIES FOUND: ${allPages.length}`);
        return allPages;

    } catch (error) {
        console.error('❌ Error querying database:', error.message);
        throw error;
    }
}

async function deletePages(pages) {
    console.log(`\n🗑️  Step 2: Deleting ${pages.length} entries...`);

    let deletedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageTitle = page.properties?.Name?.title?.[0]?.text?.content ||
                         page.properties?.['Event Name']?.title?.[0]?.text?.content ||
                         'Unknown';

        try {
            console.log(`   🗑️  [${i + 1}/${pages.length}] Deleting: "${pageTitle}" (ID: ${page.id})`);

            const url = `https://api.notion.com/v1/pages/${page.id}`;
            const body = {
                archived: true
            };

            await makeRequest(url, 'PATCH', body);
            deletedCount++;

            // Small delay to respect rate limits
            if (i % 10 === 0 && i > 0) {
                console.log(`   ⏸️  Rate limit pause (processed ${i} entries)...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (error) {
            console.error(`   ❌ Failed to delete "${pageTitle}": ${error.message}`);
            errorCount++;
        }
    }

    return { deletedCount, errorCount };
}

async function verifyCleanup() {
    console.log('\n🔍 Step 3: Verifying cleanup...');

    try {
        const remainingPages = await queryAllPages();
        return remainingPages.length;
    } catch (error) {
        console.error('❌ Error verifying cleanup:', error.message);
        throw error;
    }
}

async function main() {
    try {
        // Step 1: Query all existing entries
        const allPages = await queryAllPages();

        if (allPages.length === 0) {
            console.log('\n✅ Database is already empty - no cleanup needed!');
            return;
        }

        // Show sample of what will be deleted
        console.log('\n📋 SAMPLE ENTRIES TO DELETE:');
        const sampleSize = Math.min(5, allPages.length);
        for (let i = 0; i < sampleSize; i++) {
            const page = allPages[i];
            const pageTitle = page.properties?.Name?.title?.[0]?.text?.content ||
                             page.properties?.['Event Name']?.title?.[0]?.text?.content ||
                             'Unknown';
            const eventName = page.properties?.['Event Name']?.rich_text?.[0]?.text?.content || 'Unknown Event';
            const platform = page.properties?.Platform?.select?.name ||
                           page.properties?.['Ticketing Partner']?.select?.name || 'Unknown';

            console.log(`   ${i + 1}. "${pageTitle}" - ${eventName} (${platform})`);
        }

        if (allPages.length > sampleSize) {
            console.log(`   ... and ${allPages.length - sampleSize} more entries`);
        }

        // Confirm deletion
        console.log(`\n⚠️  CONFIRMATION REQUIRED:`);
        console.log(`   This will PERMANENTLY DELETE ${allPages.length} entries from the Notion database.`);
        console.log(`   All Humanitix order data will be removed.`);
        console.log(`\n🚀 Proceeding with cleanup in 3 seconds...`);

        // Give time to cancel
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 2: Delete all entries
        const { deletedCount, errorCount } = await deletePages(allPages);

        // Step 3: Verify cleanup
        const remainingCount = await verifyCleanup();

        // Report results
        console.log('\n🎉 CLEANUP COMPLETE!');
        console.log('===================');
        console.log(`✅ Successfully deleted: ${deletedCount} entries`);
        console.log(`❌ Failed to delete: ${errorCount} entries`);
        console.log(`📊 Remaining entries: ${remainingCount}`);

        if (remainingCount === 0) {
            console.log('\n🎯 SUCCESS: Notion database is now completely clean of Humanitix data!');
            console.log('   Ready for fresh data sync implementation.');
        } else {
            console.log('\n⚠️  WARNING: Some entries may still remain.');
            console.log('   You may need to run the cleanup again or check manually.');
        }

    } catch (error) {
        console.error('\n❌ CLEANUP FAILED:', error.message);
        process.exit(1);
    }
}

main();