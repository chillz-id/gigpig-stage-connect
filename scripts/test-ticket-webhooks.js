#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

async function testWebhooks() {
  console.log('🎫 Testing Ticket Platform Webhooks...\n');

  // Test Humanitix webhook
  console.log('1️⃣ Testing Humanitix webhook...');
  
  const humanitixPayload = {
    event_type: 'order.created',
    data: {
      event: {
        id: 'test-event-123',
        name: 'Test Comedy Show',
        date: '2025-02-01T19:00:00Z'
      },
      order: {
        id: 'test-order-456',
        status: 'paid',
        total_amount: 5000, // $50.00
        currency: 'AUD',
        created_at: new Date().toISOString(),
        customer: {
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User'
        },
        tickets: [
          {
            id: 'ticket-1',
            ticket_type_id: 'general',
            ticket_type_name: 'General Admission',
            quantity: 2,
            price: 2500
          }
        ]
      }
    },
    timestamp: new Date().toISOString()
  };

  // Generate test signature (if secret was available)
  const webhookSecret = process.env.HUMANITIX_WEBHOOK_SECRET || 'test-secret';
  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(JSON.stringify(humanitixPayload));
  const signature = hmac.digest('hex');

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/humanitix-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'x-humanitix-signature': signature
      },
      body: JSON.stringify(humanitixPayload)
    });

    const result = await response.text();
    
    if (response.ok) {
      console.log(`  ✅ Webhook responded: ${response.status}`);
      console.log(`  📄 Response: ${result}`);
    } else {
      console.log(`  ❌ Webhook error: ${response.status}`);
      console.log(`  📄 Error: ${result}`);
    }
  } catch (error) {
    console.log(`  ❌ Connection error: ${error.message}`);
  }

  // Test Eventbrite webhook
  console.log('\n2️⃣ Testing Eventbrite webhook...');
  
  const eventbritePayload = {
    config: {
      action: 'order.placed',
      user_id: 'test-user',
      endpoint_url: `${supabaseUrl}/functions/v1/eventbrite-webhook`,
      webhook_id: 'test-webhook'
    },
    api_url: 'https://www.eventbriteapi.com/v3/events/123456/orders/789/'
  };

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/eventbrite-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'x-eventbrite-signature': 'test-signature'
      },
      body: JSON.stringify(eventbritePayload)
    });

    const result = await response.text();
    
    if (response.ok) {
      console.log(`  ✅ Webhook responded: ${response.status}`);
      console.log(`  📄 Response: ${result}`);
    } else {
      console.log(`  ❌ Webhook error: ${response.status}`);
      console.log(`  📄 Error: ${result}`);
    }
  } catch (error) {
    console.log(`  ❌ Connection error: ${error.message}`);
  }

  // Check webhook logs
  console.log('\n3️⃣ Checking webhook logs...');
  
  const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY);
  
  const { data: logs, error } = await supabase
    .from('webhook_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.log(`  ❌ Error fetching logs: ${error.message}`);
  } else if (logs && logs.length > 0) {
    console.log(`  📋 Recent webhook logs:`);
    logs.forEach(log => {
      console.log(`     - ${log.platform} | ${log.event_type} | ${log.processed ? '✅' : '❌'} | ${log.created_at}`);
    });
  } else {
    console.log(`  ℹ️  No webhook logs found`);
  }

  console.log('\n✅ Webhook testing complete!');
}

// Run the tests
testWebhooks().catch(console.error);