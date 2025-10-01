#!/usr/bin/env node

/**
 * Check Supabase Database for Eventbrite Data Recovery Options
 *
 * This script will:
 * 1. Check webhook_logs table for Eventbrite webhook data
 * 2. Check ticket_sales table for any remaining Eventbrite records
 * 3. Check ticket_platforms table for Eventbrite platform configurations
 * 4. Provide recovery recommendations
 */

// Import as CommonJS since we're using ES modules but keeping it compatible
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables
const envContent = readFileSync('/root/agents/.env', 'utf8');
const envLines = envContent.split('\n');
for (const line of envLines) {
    if (line.includes('=') && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        process.env[key.trim()] = value.trim();
    }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin access

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 EVENTBRITE DATA RECOVERY ANALYSIS');
console.log('=====================================');
console.log(`📊 Checking Supabase database: ${supabaseUrl}`);

async function checkWebhookLogs() {
    console.log('\n🔗 Step 1: Checking webhook_logs table...');

    try {
        // Check if webhook_logs table exists and get Eventbrite webhook data
        const { data: webhookLogs, error } = await supabase
            .from('webhook_logs')
            .select('*')
            .eq('platform', 'eventbrite')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            if (error.code === '42P01') {
                console.log('   ⚠️  webhook_logs table does not exist');
                return [];
            }
            console.log(`   ❌ Error querying webhook_logs: ${error.message}`);
            return [];
        }

        console.log(`   ✅ Found ${webhookLogs.length} Eventbrite webhook log entries`);

        if (webhookLogs.length > 0) {
            console.log('\n📋 Recent Eventbrite webhook logs:');
            webhookLogs.slice(0, 5).forEach((log, i) => {
                console.log(`   ${i + 1}. ${log.event_type} - ${log.created_at} (Processed: ${log.processed})`);
            });
        }

        return webhookLogs;
    } catch (error) {
        console.log(`   ❌ Exception checking webhook_logs: ${error.message}`);
        return [];
    }
}

async function checkTicketSales() {
    console.log('\n🎫 Step 2: Checking ticket_sales table...');

    try {
        // Check for any remaining Eventbrite ticket sales
        const { data: eventbriteTickets, error } = await supabase
            .from('ticket_sales')
            .select('*')
            .eq('platform', 'eventbrite')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            if (error.code === '42P01') {
                console.log('   ⚠️  ticket_sales table does not exist');
                return [];
            }
            console.log(`   ❌ Error querying ticket_sales: ${error.message}`);
            return [];
        }

        console.log(`   ✅ Found ${eventbriteTickets.length} Eventbrite ticket sales records`);

        if (eventbriteTickets.length > 0) {
            console.log('\n💳 Recent Eventbrite ticket sales:');
            eventbriteTickets.slice(0, 5).forEach((ticket, i) => {
                console.log(`   ${i + 1}. ${ticket.customer_name} - ${ticket.event_name || 'Unknown Event'} - $${ticket.total_amount}`);
            });
        }

        return eventbriteTickets;
    } catch (error) {
        console.log(`   ❌ Exception checking ticket_sales: ${error.message}`);
        return [];
    }
}

async function checkTicketPlatforms() {
    console.log('\n🏪 Step 3: Checking ticket_platforms table...');

    try {
        // Check for Eventbrite platform configurations
        const { data: eventbritePlatforms, error } = await supabase
            .from('ticket_platforms')
            .select('*')
            .eq('platform', 'eventbrite')
            .order('last_sync_at', { ascending: false });

        if (error) {
            if (error.code === '42P01') {
                console.log('   ⚠️  ticket_platforms table does not exist');
                return [];
            }
            console.log(`   ❌ Error querying ticket_platforms: ${error.message}`);
            return [];
        }

        console.log(`   ✅ Found ${eventbritePlatforms.length} Eventbrite platform configurations`);

        if (eventbritePlatforms.length > 0) {
            console.log('\n🔧 Eventbrite platform configurations:');
            eventbritePlatforms.forEach((platform, i) => {
                console.log(`   ${i + 1}. Event ID: ${platform.event_id}, External ID: ${platform.external_event_id}`);
                console.log(`       Last Sync: ${platform.last_sync_at}, Last Webhook: ${platform.webhook_last_received}`);
            });
        }

        return eventbritePlatforms;
    } catch (error) {
        console.log(`   ❌ Exception checking ticket_platforms: ${error.message}`);
        return [];
    }
}

async function checkAllTables() {
    console.log('\n📋 Step 4: Checking all available tables...');

    try {
        // Get list of all tables
        const { data: tables, error } = await supabase.rpc('get_table_names');

        if (error) {
            console.log(`   ❌ Error getting table list: ${error.message}`);
            return;
        }

        console.log(`   ✅ Found ${tables.length} tables in database`);

        // Look for tables that might contain backup data
        const relevantTables = tables.filter(table =>
            table.includes('backup') ||
            table.includes('archive') ||
            table.includes('webhook') ||
            table.includes('ticket') ||
            table.includes('notion')
        );

        if (relevantTables.length > 0) {
            console.log('\n📊 Relevant tables for recovery:');
            relevantTables.forEach((table, i) => {
                console.log(`   ${i + 1}. ${table}`);
            });
        }

        return tables;
    } catch (error) {
        console.log(`   ❌ Exception checking tables: ${error.message}`);
        return [];
    }
}

async function generateRecoveryPlan(webhookLogs, ticketSales, platforms) {
    console.log('\n🛠️  RECOVERY RECOMMENDATIONS');
    console.log('===============================');

    if (webhookLogs.length > 0) {
        console.log('✅ OPTION 1: Webhook Log Recovery');
        console.log(`   - Found ${webhookLogs.length} Eventbrite webhook logs`);
        console.log('   - Can potentially reconstruct ticket sales from webhook payload data');
        console.log('   - Webhook logs contain full order information from Eventbrite');
        console.log('   - Recommend extracting successful webhook payloads and re-processing');
    }

    if (ticketSales.length > 0) {
        console.log('\n✅ OPTION 2: Direct Database Recovery');
        console.log(`   - Found ${ticketSales.length} existing Eventbrite ticket sales in database`);
        console.log('   - These records were NOT deleted and can be used as backup');
        console.log('   - May need to sync these back to Notion databases');
    }

    if (platforms.length > 0) {
        console.log('\n✅ OPTION 3: Platform Re-sync');
        console.log(`   - Found ${platforms.length} Eventbrite platform configurations`);
        console.log('   - Can potentially re-sync data from Eventbrite API using these configurations');
        console.log('   - Would require valid Eventbrite API access tokens');
    }

    if (webhookLogs.length === 0 && ticketSales.length === 0 && platforms.length === 0) {
        console.log('❌ NO AUTOMATIC RECOVERY OPTIONS FOUND');
        console.log('   - No webhook logs found for Eventbrite');
        console.log('   - No ticket sales records found for Eventbrite');
        console.log('   - No platform configurations found for Eventbrite');
        console.log('\n🔧 MANUAL RECOVERY REQUIRED:');
        console.log('   1. Access Notion trash/archive directly via web interface');
        console.log('   2. Manually identify and restore Eventbrite entries');
        console.log('   3. Look for entries with platform="eventbrite" or Eventbrite-specific patterns');
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('1. Choose recovery method based on available data');
    console.log('2. Create restoration script for chosen method');
    console.log('3. Test restoration on small sample first');
    console.log('4. Implement data validation to prevent future deletions');
}

async function main() {
    try {
        const webhookLogs = await checkWebhookLogs();
        const ticketSales = await checkTicketSales();
        const platforms = await checkTicketPlatforms();

        await checkAllTables();

        await generateRecoveryPlan(webhookLogs, ticketSales, platforms);

        console.log('\n🎯 ANALYSIS COMPLETE');
        console.log('=====================');
        console.log('Review the recommendations above and choose the best recovery approach.');

    } catch (error) {
        console.error('\n❌ ANALYSIS FAILED:', error.message);
        process.exit(1);
    }
}

main();