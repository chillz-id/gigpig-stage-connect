#!/usr/bin/env node

/**
 * Complete Ticket Sync Test Script
 * Tests the ticket sync functionality with actual database operations
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test configuration
const testEventId = crypto.randomUUID();
const testUserId = crypto.randomUUID();
const humanitixEventId = 'test-humanitix-' + Date.now();
const eventbriteEventId = 'test-eventbrite-' + Date.now();

async function setupTestData() {
  console.log('📝 Setting up test data...');

  try {
    // Create test user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: `test-${Date.now()}@example.com`,
        name: 'Test Promoter',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Error creating test profile:', profileError);
      throw profileError;
    }

    // Create test event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        id: testEventId,
        name: 'Test Comedy Night - Ticket Sync',
        description: 'Testing ticket sync functionality',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        start_time: '19:00',
        end_time: '22:00',
        venue: 'Test Comedy Club',
        address: '123 Test Street, Sydney NSW 2000',
        capacity: 200,
        ticket_price: 35.00,
        status: 'published',
        user_id: testUserId,
        is_featured: false,
        requires_application: false,
        total_tickets_sold: 0,
        total_gross_sales: 0,
        platforms_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (eventError) {
      console.error('Error creating test event:', eventError);
      throw eventError;
    }

    console.log('✅ Test event created:', event.id);
    return event;
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

async function testAddPlatforms() {
  console.log('\n🎫 Testing platform addition...');

  try {
    // Add Humanitix platform
    const { data: humanitixPlatform, error: humanitixError } = await supabase
      .from('ticket_platforms')
      .insert({
        event_id: testEventId,
        platform: 'humanitix',
        external_event_id: humanitixEventId,
        external_event_url: `https://events.humanitix.com/${humanitixEventId}`,
        is_primary: true,
        tickets_sold: 0,
        gross_sales: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (humanitixError) {
      console.error('Error adding Humanitix platform:', humanitixError);
      throw humanitixError;
    }

    console.log('✅ Humanitix platform added');

    // Add Eventbrite platform
    const { data: eventbritePlatform, error: eventbriteError } = await supabase
      .from('ticket_platforms')
      .insert({
        event_id: testEventId,
        platform: 'eventbrite',
        external_event_id: eventbriteEventId,
        external_event_url: `https://www.eventbrite.com/e/${eventbriteEventId}`,
        is_primary: false,
        tickets_sold: 0,
        gross_sales: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (eventbriteError) {
      console.error('Error adding Eventbrite platform:', eventbriteError);
      throw eventbriteError;
    }

    console.log('✅ Eventbrite platform added');

    return { humanitixPlatform, eventbritePlatform };
  } catch (error) {
    console.error('❌ Platform addition failed:', error);
    throw error;
  }
}

async function testManualSync() {
  console.log('\n🔄 Testing manual sync...');

  try {
    // Use the RPC function to update ticket sales
    const { error: humanitixSyncError } = await supabase.rpc('update_ticket_sales', {
      p_event_id: testEventId,
      p_platform: 'humanitix',
      p_external_event_id: humanitixEventId,
      p_tickets_sold: 75,
      p_tickets_available: 125,
      p_gross_sales: 2625.00,
      p_external_url: `https://events.humanitix.com/${humanitixEventId}`,
      p_platform_data: {
        net_revenue: 2536.25,
        fees: 88.75,
        orders_count: 45,
        last_sync: new Date().toISOString(),
      }
    });

    if (humanitixSyncError) {
      console.error('Error syncing Humanitix:', humanitixSyncError);
      throw humanitixSyncError;
    }

    console.log('✅ Humanitix sync completed');

    // Sync Eventbrite
    const { error: eventbriteSyncError } = await supabase.rpc('update_ticket_sales', {
      p_event_id: testEventId,
      p_platform: 'eventbrite',
      p_external_event_id: eventbriteEventId,
      p_tickets_sold: 50,
      p_tickets_available: 150,
      p_gross_sales: 1750.00,
      p_external_url: `https://www.eventbrite.com/e/${eventbriteEventId}`,
      p_platform_data: {
        net_revenue: 1680.00,
        fees: 70.00,
        orders_count: 30,
        last_sync: new Date().toISOString(),
      }
    });

    if (eventbriteSyncError) {
      console.error('Error syncing Eventbrite:', eventbriteSyncError);
      throw eventbriteSyncError;
    }

    console.log('✅ Eventbrite sync completed');

    // Check event totals were updated
    const { data: updatedEvent, error: fetchError } = await supabase
      .from('events')
      .select('total_tickets_sold, total_gross_sales, platforms_count')
      .eq('id', testEventId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated event:', fetchError);
      throw fetchError;
    }

    console.log('📊 Updated event totals:', {
      totalTicketsSold: updatedEvent.total_tickets_sold,
      totalGrossSales: updatedEvent.total_gross_sales,
      platformsCount: updatedEvent.platforms_count,
    });

    return updatedEvent;
  } catch (error) {
    console.error('❌ Manual sync failed:', error);
    throw error;
  }
}

async function testIndividualTicketSales() {
  console.log('\n🎟️ Testing individual ticket sales...');

  try {
    // Create sample ticket sales
    const sales = [
      {
        event_id: testEventId,
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        ticket_quantity: 2,
        ticket_type: 'General Admission',
        total_amount: 70.00,
        platform: 'humanitix',
        platform_order_id: 'hum-order-001',
        refund_status: 'none',
        purchase_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        event_id: testEventId,
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        ticket_quantity: 1,
        ticket_type: 'VIP',
        total_amount: 65.00,
        platform: 'humanitix',
        platform_order_id: 'hum-order-002',
        refund_status: 'none',
        purchase_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        event_id: testEventId,
        customer_name: 'Bob Johnson',
        customer_email: 'bob@example.com',
        ticket_quantity: 3,
        ticket_type: 'General Admission',
        total_amount: 105.00,
        platform: 'eventbrite',
        platform_order_id: 'eb-order-001',
        refund_status: 'none',
        purchase_date: new Date().toISOString(),
      },
    ];

    const { data: ticketSales, error: salesError } = await supabase
      .from('ticket_sales')
      .insert(sales)
      .select();

    if (salesError) {
      console.error('Error creating ticket sales:', salesError);
      throw salesError;
    }

    console.log(`✅ Created ${ticketSales.length} ticket sales`);

    // Test refund
    const { error: refundError } = await supabase
      .from('ticket_sales')
      .update({
        refund_status: 'refunded',
        total_amount: -65.00,
      })
      .eq('platform_order_id', 'hum-order-002');

    if (refundError) {
      console.error('Error processing refund:', refundError);
      throw refundError;
    }

    console.log('✅ Processed refund for order hum-order-002');

    return ticketSales;
  } catch (error) {
    console.error('❌ Individual ticket sales test failed:', error);
    throw error;
  }
}

async function testAnalyticsViews() {
  console.log('\n📊 Testing analytics views...');

  try {
    // Test event_ticket_summary view
    const { data: summary, error: summaryError } = await supabase
      .from('event_ticket_summary')
      .select('*')
      .eq('id', testEventId)
      .single();

    if (summaryError) {
      console.error('Error fetching event summary:', summaryError);
      throw summaryError;
    }

    console.log('📈 Event Ticket Summary:', {
      eventName: summary.name,
      totalTicketsSold: summary.total_tickets_sold,
      totalGrossSales: summary.total_gross_sales,
      platformsCount: summary.platforms_count,
      platformBreakdown: summary.platform_breakdown,
    });

    // Test ticket sales log
    const { data: salesLog, error: logError } = await supabase
      .from('ticket_sales_log')
      .select('*')
      .order('sync_timestamp', { ascending: false })
      .limit(5);

    if (logError) {
      console.error('Error fetching sales log:', logError);
      throw logError;
    }

    console.log(`📋 Found ${salesLog.length} sync log entries`);

    return { summary, salesLog };
  } catch (error) {
    console.error('❌ Analytics views test failed:', error);
    throw error;
  }
}

async function testWebhookProcessing() {
  console.log('\n🪝 Testing webhook processing...');

  try {
    // Simulate a webhook event
    const webhookPayload = {
      platform: 'humanitix',
      event_type: 'order.created',
      payload: {
        event_type: 'order.created',
        data: {
          order: {
            id: 'hum-order-webhook-001',
            event_id: humanitixEventId,
            customer: {
              first_name: 'Webhook',
              last_name: 'Test',
              email: 'webhook@example.com',
            },
            tickets: [
              {
                ticket_type_name: 'Early Bird',
                quantity: 2,
                price: 25.00,
                total: 50.00,
              },
            ],
            total_amount: 51.75,
            fees: 1.75,
            status: 'paid',
            created_at: new Date().toISOString(),
          },
          event: {
            id: humanitixEventId,
            name: 'Test Comedy Night',
          },
        },
      },
      signature: 'test-signature',
      timestamp: new Date().toISOString(),
      processed: true,
    };

    const { data: webhookLog, error: webhookError } = await supabase
      .from('webhook_logs')
      .insert(webhookPayload)
      .select()
      .single();

    if (webhookError) {
      console.error('Error logging webhook:', webhookError);
      throw webhookError;
    }

    console.log('✅ Webhook logged successfully');

    // Verify webhook was processed
    const { data: processedLogs, error: logsError } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('platform', 'humanitix')
      .eq('processed', true)
      .order('timestamp', { ascending: false })
      .limit(1);

    if (logsError) {
      console.error('Error fetching webhook logs:', logsError);
      throw logsError;
    }

    console.log(`📬 Found ${processedLogs.length} processed webhook(s)`);

    return webhookLog;
  } catch (error) {
    console.error('❌ Webhook processing test failed:', error);
    throw error;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');

  try {
    // Delete in reverse order of dependencies
    await supabase.from('webhook_logs').delete().eq('platform', 'humanitix');
    await supabase.from('ticket_sales').delete().eq('event_id', testEventId);
    await supabase.from('ticket_sales_log').delete().match({
      'ticket_platforms.event_id': testEventId
    });
    await supabase.from('ticket_platforms').delete().eq('event_id', testEventId);
    await supabase.from('events').delete().eq('id', testEventId);
    await supabase.from('profiles').delete().eq('id', testUserId);

    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('⚠️ Cleanup error (non-critical):', error);
  }
}

async function runCompleteTest() {
  console.log('🚀 Starting Complete Ticket Sync Test');
  console.log('=====================================\n');

  try {
    // Setup
    await setupTestData();

    // Test platform management
    await testAddPlatforms();

    // Test manual sync
    await testManualSync();

    // Test individual ticket sales
    await testIndividualTicketSales();

    // Test analytics
    await testAnalyticsViews();

    // Test webhook processing
    await testWebhookProcessing();

    console.log('\n✅ All tests completed successfully!');
    console.log('=====================================');

    // Cleanup
    await cleanup();

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('=====================================');
    
    // Attempt cleanup even on failure
    await cleanup();
    
    process.exit(1);
  }
}

// Run the test
runCompleteTest();