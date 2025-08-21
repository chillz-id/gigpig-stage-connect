#!/usr/bin/env node

/**
 * Simplified Ticket Sync Test
 * Tests the core ticket sync functionality without auth dependencies
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

async function testTicketPlatformsTable() {
  console.log('\n📋 Testing ticket_platforms table...');

  try {
    // Check if table exists
    const { data, error } = await supabase
      .from('ticket_platforms')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error accessing ticket_platforms:', error);
      return false;
    }

    console.log('✅ ticket_platforms table is accessible');
    return true;
  } catch (error) {
    console.error('❌ Failed to access ticket_platforms:', error);
    return false;
  }
}

async function testTicketSalesTable() {
  console.log('\n📋 Testing ticket_sales table...');

  try {
    // Check if table exists
    const { data, error } = await supabase
      .from('ticket_sales')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error accessing ticket_sales:', error);
      return false;
    }

    console.log('✅ ticket_sales table is accessible');
    return true;
  } catch (error) {
    console.error('❌ Failed to access ticket_sales:', error);
    return false;
  }
}

async function testUpdateTicketSalesRPC() {
  console.log('\n🔄 Testing update_ticket_sales RPC function...');

  try {
    // First, get an existing event
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('id, name')
      .eq('status', 'published')
      .limit(1);

    if (eventError || !events || events.length === 0) {
      console.log('⚠️ No published events found to test with');
      return false;
    }

    const testEvent = events[0];
    console.log(`📌 Using event: ${testEvent.name} (${testEvent.id})`);

    // Test the RPC function with mock data
    const { data, error } = await supabase.rpc('update_ticket_sales', {
      p_event_id: testEvent.id,
      p_platform: 'humanitix',
      p_external_event_id: 'test-external-' + Date.now(),
      p_tickets_sold: 10,
      p_tickets_available: 90,
      p_gross_sales: 350.00,
      p_external_url: 'https://events.humanitix.com/test',
      p_platform_data: {
        test: true,
        last_sync: new Date().toISOString()
      }
    });

    if (error) {
      console.error('❌ Error calling update_ticket_sales:', error);
      return false;
    }

    console.log('✅ update_ticket_sales RPC function works');

    // Verify the platform was created/updated
    const { data: platform, error: platformError } = await supabase
      .from('ticket_platforms')
      .select('*')
      .eq('event_id', testEvent.id)
      .eq('platform', 'humanitix')
      .single();

    if (platformError) {
      console.error('❌ Error verifying platform creation:', platformError);
      return false;
    }

    console.log('✅ Platform record created/updated:', {
      platform: platform.platform,
      tickets_sold: platform.tickets_sold,
      gross_sales: platform.gross_sales
    });

    // Clean up test data
    await supabase
      .from('ticket_platforms')
      .delete()
      .eq('event_id', testEvent.id)
      .eq('platform', 'humanitix');

    return true;
  } catch (error) {
    console.error('❌ Failed to test RPC function:', error);
    return false;
  }
}

async function testEventTicketSummaryView() {
  console.log('\n📊 Testing event_ticket_summary view...');

  try {
    // Get summary for events with ticket sales
    const { data, error } = await supabase
      .from('event_ticket_summary')
      .select('*')
      .gt('platforms_count', 0)
      .limit(5);

    if (error) {
      console.error('❌ Error accessing event_ticket_summary:', error);
      return false;
    }

    console.log('✅ event_ticket_summary view is accessible');
    
    if (data && data.length > 0) {
      console.log(`📈 Found ${data.length} events with ticket sales:`);
      data.forEach(event => {
        console.log(`   - ${event.name}: ${event.total_tickets_sold} tickets, $${event.total_gross_sales}`);
      });
    } else {
      console.log('ℹ️ No events with ticket sales found');
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to access event_ticket_summary:', error);
    return false;
  }
}

async function testWebhookLogs() {
  console.log('\n🪝 Testing webhook_logs table...');

  try {
    // Insert a test webhook log
    const testLog = {
      platform: 'humanitix',
      event_type: 'test.sync',
      payload: { test: true, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
      processed: true,
      error_message: null
    };

    const { data, error } = await supabase
      .from('webhook_logs')
      .insert(testLog)
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting webhook log:', error);
      return false;
    }

    console.log('✅ webhook_logs table is functional');

    // Clean up
    await supabase
      .from('webhook_logs')
      .delete()
      .eq('id', data.id);

    return true;
  } catch (error) {
    console.error('❌ Failed to test webhook_logs:', error);
    return false;
  }
}

async function testTicketSalesLogView() {
  console.log('\n📋 Testing ticket_sales_log view...');

  try {
    const { data, error } = await supabase
      .from('ticket_sales_log')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error accessing ticket_sales_log:', error);
      return false;
    }

    console.log('✅ ticket_sales_log view is accessible');
    
    if (data && data.length > 0) {
      console.log(`📝 Found ${data.length} sync log entries`);
    } else {
      console.log('ℹ️ No sync log entries found');
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to access ticket_sales_log:', error);
    return false;
  }
}

async function testMockTicketSync() {
  console.log('\n🎟️ Testing mock ticket sync flow...');

  try {
    // Get a test event
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('id, name')
      .eq('status', 'published')
      .limit(1);

    if (eventError || !events || events.length === 0) {
      console.log('⚠️ No published events found for mock sync');
      return false;
    }

    const testEvent = events[0];
    console.log(`🎯 Using event: ${testEvent.name}`);

    // Add mock platforms
    const platforms = [
      {
        event_id: testEvent.id,
        platform: 'humanitix',
        external_event_id: 'mock-hum-' + Date.now(),
        external_event_url: 'https://events.humanitix.com/mock',
        is_primary: true,
        tickets_sold: 75,
        gross_sales: 2625.00,
        tickets_available: 125,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        event_id: testEvent.id,
        platform: 'eventbrite',
        external_event_id: 'mock-eb-' + Date.now(),
        external_event_url: 'https://www.eventbrite.com/e/mock',
        is_primary: false,
        tickets_sold: 50,
        gross_sales: 1750.00,
        tickets_available: 150,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Insert platforms
    const { data: insertedPlatforms, error: insertError } = await supabase
      .from('ticket_platforms')
      .insert(platforms)
      .select();

    if (insertError) {
      console.error('❌ Error inserting mock platforms:', insertError);
      return false;
    }

    console.log('✅ Mock platforms created');

    // Add some mock ticket sales
    const sales = [
      {
        event_id: testEvent.id,
        customer_name: 'Test Customer 1',
        customer_email: 'test1@example.com',
        ticket_quantity: 2,
        ticket_type: 'General Admission',
        total_amount: 70.00,
        platform: 'humanitix',
        platform_order_id: 'mock-order-001',
        refund_status: 'none',
        purchase_date: new Date().toISOString()
      },
      {
        event_id: testEvent.id,
        customer_name: 'Test Customer 2',
        customer_email: 'test2@example.com',
        ticket_quantity: 1,
        ticket_type: 'VIP',
        total_amount: 65.00,
        platform: 'eventbrite',
        platform_order_id: 'mock-order-002',
        refund_status: 'none',
        purchase_date: new Date().toISOString()
      }
    ];

    const { data: insertedSales, error: salesError } = await supabase
      .from('ticket_sales')
      .insert(sales)
      .select();

    if (salesError) {
      console.error('❌ Error inserting mock sales:', salesError);
      // Continue anyway to clean up platforms
    } else {
      console.log('✅ Mock ticket sales created');
    }

    // Check the event summary
    const { data: summary, error: summaryError } = await supabase
      .from('event_ticket_summary')
      .select('*')
      .eq('id', testEvent.id)
      .single();

    if (!summaryError && summary) {
      console.log('📊 Event summary after mock sync:', {
        totalTickets: summary.total_tickets_sold,
        totalRevenue: summary.total_gross_sales,
        platforms: summary.platform_breakdown
      });
    }

    // Clean up
    console.log('🧹 Cleaning up mock data...');
    
    if (insertedSales) {
      await supabase
        .from('ticket_sales')
        .delete()
        .in('id', insertedSales.map(s => s.id));
    }

    await supabase
      .from('ticket_platforms')
      .delete()
      .in('id', insertedPlatforms.map(p => p.id));

    console.log('✅ Mock sync test completed');
    return true;

  } catch (error) {
    console.error('❌ Mock sync test failed:', error);
    return false;
  }
}

async function runSimplifiedTests() {
  console.log('🚀 Starting Simplified Ticket Sync Tests');
  console.log('======================================\n');

  const results = {
    ticketPlatforms: false,
    ticketSales: false,
    updateRPC: false,
    summaryView: false,
    webhookLogs: false,
    salesLog: false,
    mockSync: false
  };

  try {
    // Test each component
    results.ticketPlatforms = await testTicketPlatformsTable();
    results.ticketSales = await testTicketSalesTable();
    results.updateRPC = await testUpdateTicketSalesRPC();
    results.summaryView = await testEventTicketSummaryView();
    results.webhookLogs = await testWebhookLogs();
    results.salesLog = await testTicketSalesLogView();
    results.mockSync = await testMockTicketSync();

    // Summary
    console.log('\n======================================');
    console.log('📊 Test Results Summary:');
    console.log('======================================');
    
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}`);
    });

    const allPassed = Object.values(results).every(r => r);
    
    if (allPassed) {
      console.log('\n🎉 All tests passed! Ticket sync system is functional.');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the errors above.');
    }

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
runSimplifiedTests();