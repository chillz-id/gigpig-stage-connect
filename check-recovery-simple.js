#!/usr/bin/env node

/**
 * Simple Eventbrite Data Recovery Check
 * Uses Node.js built-in modules to check database for recovery options
 */

const https = require('https');
const fs = require('fs');

// Load environment variables
const envContent = fs.readFileSync('/root/agents/.env', 'utf8');
const envLines = envContent.split('\n');
for (const line of envLines) {
    if (line.includes('=') && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        process.env[key.trim()] = value.trim();
    }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

console.log('🔍 EVENTBRITE DATA RECOVERY ANALYSIS');
console.log('=====================================');
console.log(`📊 Checking database: ${SUPABASE_URL}`);

function makeSupabaseRequest(table, filters = '', orderBy = '', limit = '') {
    return new Promise((resolve, reject) => {
        let query = `select=*`;
        if (filters) query += `&${filters}`;
        if (orderBy) query += `&order=${orderBy}`;
        if (limit) query += `&limit=${limit}`;

        const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;

        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
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
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const data = JSON.parse(body);
                        resolve(data);
                    } else {
                        resolve({ error: { statusCode: res.statusCode, message: body } });
                    }
                } catch (e) {
                    resolve({ error: { message: `Parse error: ${e.message}` } });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ error: { message: error.message } });
        });

        req.end();
    });
}

async function checkWebhookLogs() {
    console.log('\n🔗 Step 1: Checking webhook_logs table...');

    try {
        const result = await makeSupabaseRequest(
            'webhook_logs',
            'platform=eq.eventbrite',
            'created_at.desc',
            '10'
        );

        if (result.error) {
            if (result.error.statusCode === 404 || result.error.message.includes('relation') || result.error.message.includes('does not exist')) {
                console.log('   ⚠️  webhook_logs table does not exist');
                return [];
            }
            console.log(`   ❌ Error: ${result.error.message}`);
            return [];
        }

        console.log(`   ✅ Found ${result.length} Eventbrite webhook log entries`);

        if (result.length > 0) {
            console.log('\n📋 Recent Eventbrite webhook logs:');
            result.slice(0, 5).forEach((log, i) => {
                console.log(`   ${i + 1}. ${log.event_type || 'Unknown'} - ${log.created_at} (Processed: ${log.processed})`);
            });
        }

        return result;
    } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
        return [];
    }
}

async function checkTicketSales() {
    console.log('\n🎫 Step 2: Checking ticket_sales table...');

    try {
        const result = await makeSupabaseRequest(
            'ticket_sales',
            'platform=eq.eventbrite',
            'created_at.desc',
            '10'
        );

        if (result.error) {
            if (result.error.statusCode === 404 || result.error.message.includes('relation') || result.error.message.includes('does not exist')) {
                console.log('   ⚠️  ticket_sales table does not exist');
                return [];
            }
            console.log(`   ❌ Error: ${result.error.message}`);
            return [];
        }

        console.log(`   ✅ Found ${result.length} Eventbrite ticket sales records`);

        if (result.length > 0) {
            console.log('\n💳 Recent Eventbrite ticket sales:');
            result.slice(0, 5).forEach((ticket, i) => {
                console.log(`   ${i + 1}. ${ticket.customer_name || 'Unknown'} - ${ticket.event_name || 'Unknown Event'} - $${ticket.total_amount || '0'}`);
            });
        }

        return result;
    } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
        return [];
    }
}

async function checkTicketPlatforms() {
    console.log('\n🏪 Step 3: Checking ticket_platforms table...');

    try {
        const result = await makeSupabaseRequest(
            'ticket_platforms',
            'platform=eq.eventbrite',
            'last_sync_at.desc',
            '20'
        );

        if (result.error) {
            if (result.error.statusCode === 404 || result.error.message.includes('relation') || result.error.message.includes('does not exist')) {
                console.log('   ⚠️  ticket_platforms table does not exist');
                return [];
            }
            console.log(`   ❌ Error: ${result.error.message}`);
            return [];
        }

        console.log(`   ✅ Found ${result.length} Eventbrite platform configurations`);

        if (result.length > 0) {
            console.log('\n🔧 Eventbrite platform configurations:');
            result.forEach((platform, i) => {
                console.log(`   ${i + 1}. Event ID: ${platform.event_id}, External ID: ${platform.external_event_id}`);
                console.log(`       Last Sync: ${platform.last_sync_at || 'Never'}, Last Webhook: ${platform.webhook_last_received || 'Never'}`);
            });
        }

        return result;
    } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
        return [];
    }
}

async function checkNotionBackup() {
    console.log('\n📋 Step 4: Checking for notion-related backup tables...');

    // Check common backup table patterns
    const backupTables = [
        'notion_backup',
        'notion_archive',
        'humanitix_backup',
        'ticket_backup',
        'webhook_backup'
    ];

    let foundBackups = [];

    for (const table of backupTables) {
        try {
            const result = await makeSupabaseRequest(table, '', '', '5');

            if (!result.error) {
                console.log(`   ✅ Found backup table: ${table} with ${result.length} entries`);
                foundBackups.push({ table, count: result.length, data: result });
            }
        } catch (error) {
            // Silently skip non-existent tables
        }
    }

    if (foundBackups.length === 0) {
        console.log('   ⚠️  No backup tables found');
    }

    return foundBackups;
}

function generateRecoveryPlan(webhookLogs, ticketSales, platforms, backups) {
    console.log('\n🛠️  RECOVERY RECOMMENDATIONS');
    console.log('===============================');

    let hasRecoveryOptions = false;

    if (webhookLogs.length > 0) {
        hasRecoveryOptions = true;
        console.log('✅ OPTION 1: Webhook Log Recovery');
        console.log(`   - Found ${webhookLogs.length} Eventbrite webhook logs`);
        console.log('   - Can reconstruct ticket sales from webhook payload data');
        console.log('   - Webhook logs contain full order information from Eventbrite');
        console.log('   - Recommend extracting successful webhook payloads and re-processing');

        // Show some sample data if available
        if (webhookLogs[0] && webhookLogs[0].payload) {
            console.log('   - Sample webhook payload structure available');
        }
    }

    if (ticketSales.length > 0) {
        hasRecoveryOptions = true;
        console.log('\n✅ OPTION 2: Direct Database Recovery');
        console.log(`   - Found ${ticketSales.length} existing Eventbrite ticket sales in database`);
        console.log('   - These records were NOT deleted and can be used as backup');
        console.log('   - May need to sync these back to Notion databases');
        console.log('   - Can extract customer, event, and order data from these records');
    }

    if (platforms.length > 0) {
        hasRecoveryOptions = true;
        console.log('\n✅ OPTION 3: Platform Re-sync');
        console.log(`   - Found ${platforms.length} Eventbrite platform configurations`);
        console.log('   - Can potentially re-sync data from Eventbrite API using these configurations');
        console.log('   - Would require valid Eventbrite API access tokens');
        console.log('   - Can fetch order history from Eventbrite for these events');
    }

    if (backups.length > 0) {
        hasRecoveryOptions = true;
        console.log('\n✅ OPTION 4: Backup Table Recovery');
        console.log(`   - Found ${backups.length} backup tables with data`);
        backups.forEach(backup => {
            console.log(`   - ${backup.table}: ${backup.count} entries`);
        });
        console.log('   - Check these tables for Eventbrite data that may have been preserved');
    }

    if (!hasRecoveryOptions) {
        console.log('❌ NO AUTOMATIC RECOVERY OPTIONS FOUND');
        console.log('   - No webhook logs found for Eventbrite');
        console.log('   - No ticket sales records found for Eventbrite');
        console.log('   - No platform configurations found for Eventbrite');
        console.log('   - No backup tables found');
        console.log('\n🔧 MANUAL RECOVERY REQUIRED:');
        console.log('   1. Access Notion trash/archive directly via web interface');
        console.log('   2. Look for archived pages in databases:');
        console.log('      - Humanitix Attendees/Orders: 1374745b-8cbe-804b-87a2-ec93b3385e01');
        console.log('      - Ticket Sales (Legacy): 2304745b-8cbe-81cd-9483-d7acc2377bd6');
        console.log('   3. Filter by platform="eventbrite" or look for Eventbrite-specific patterns');
        console.log('   4. Restore entries manually one by one');
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('1. Choose recovery method based on available data above');
    console.log('2. Create restoration script for chosen method');
    console.log('3. Test restoration on small sample first');
    console.log('4. Implement platform filtering to prevent future deletions');
    console.log('5. Create proper backup procedures for Notion data');
}

async function main() {
    try {
        console.log('\n🔍 Analyzing available data sources...');

        const webhookLogs = await checkWebhookLogs();
        const ticketSales = await checkTicketSales();
        const platforms = await checkTicketPlatforms();
        const backups = await checkNotionBackup();

        generateRecoveryPlan(webhookLogs, ticketSales, platforms, backups);

        console.log('\n🎯 ANALYSIS COMPLETE');
        console.log('=====================');
        console.log('Review the recommendations above and choose the best recovery approach.');
        console.log('If no automatic options are available, manual Notion recovery will be required.');

    } catch (error) {
        console.error('\n❌ ANALYSIS FAILED:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

main();