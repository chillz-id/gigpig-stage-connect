#!/usr/bin/env node

import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
  humanitixSecret: process.env.HUMANITIX_WEBHOOK_SECRET || 'test-secret',
  eventbriteSecret: process.env.EVENTBRITE_WEBHOOK_SECRET || 'test-secret',
};

// Sample webhook payloads
const samplePayloads = {
  humanitix: {
    'order.created': {
      event_type: 'order.created',
      data: {
        event: {
          id: 'evt_test123',
          name: 'Test Comedy Show',
          date: '2024-02-01T19:00:00Z',
        },
        order: {
          id: 'ord_test123',
          status: 'paid',
          total_amount: 50.00,
          currency: 'AUD',
          created_at: new Date().toISOString(),
          customer: {
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
          },
          tickets: [
            {
              id: 'tkt_test123',
              ticket_type_id: 'tt_general',
              ticket_type_name: 'General Admission',
              quantity: 2,
              price: 25.00,
            },
          ],
        },
      },
      timestamp: new Date().toISOString(),
    },
    'order.refunded': {
      event_type: 'order.refunded',
      data: {
        event: {
          id: 'evt_test123',
          name: 'Test Comedy Show',
          date: '2024-02-01T19:00:00Z',
        },
        order: {
          id: 'ord_test123',
          status: 'refunded',
          total_amount: 50.00,
          currency: 'AUD',
          created_at: new Date().toISOString(),
          customer: {
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
          },
          tickets: [
            {
              id: 'tkt_test123',
              ticket_type_id: 'tt_general',
              ticket_type_name: 'General Admission',
              quantity: 2,
              price: 25.00,
            },
          ],
        },
      },
      timestamp: new Date().toISOString(),
    },
  },
  eventbrite: {
    'order.placed': {
      config: {
        action: 'order.placed',
        user_id: '123456789',
        endpoint_url: 'https://your-webhook-url.com',
        webhook_id: 'webhook_123',
      },
      api_url: 'https://www.eventbriteapi.com/v3/events/123456789/orders/987654321/',
    },
    'order.refunded': {
      config: {
        action: 'order.refunded',
        user_id: '123456789',
        endpoint_url: 'https://your-webhook-url.com',
        webhook_id: 'webhook_123',
      },
      api_url: 'https://www.eventbriteapi.com/v3/events/123456789/orders/987654321/',
    },
  },
};

// Helper functions
function generateHumanitixSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

function generateEventbriteSignature(url, secret) {
  // Simplified signature - adjust based on actual Eventbrite implementation
  return crypto.createHash('sha256').update(url + secret).digest('hex');
}

async function sendWebhookRequest(platform, endpoint, payload, signature) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const data = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        [`x-${platform}-signature`]: signature,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Main function
async function testWebhook(platform, eventType, customPayload) {
  console.log(`\n🧪 Testing ${platform} webhook for event: ${eventType}`);
  console.log('=' * 50);

  // Get payload
  let payload;
  if (customPayload) {
    console.log(`📄 Loading custom payload from: ${customPayload}`);
    const payloadPath = path.resolve(customPayload);
    payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
  } else {
    payload = samplePayloads[platform]?.[eventType];
    if (!payload) {
      console.error(`❌ No sample payload found for ${platform} ${eventType}`);
      process.exit(1);
    }
  }

  // Generate signature
  let signature;
  if (platform === 'humanitix') {
    signature = generateHumanitixSignature(payload, config.humanitixSecret);
  } else if (platform === 'eventbrite') {
    const endpoint = `${config.supabaseUrl}/functions/v1/eventbrite-webhook`;
    signature = generateEventbriteSignature(endpoint, config.eventbriteSecret);
  }

  // Construct endpoint
  const endpoint = `${config.supabaseUrl}/functions/v1/${platform}-webhook`;
  
  console.log(`\n📍 Endpoint: ${endpoint}`);
  console.log(`🔐 Signature: ${signature}`);
  console.log(`\n📦 Payload:`);
  console.log(JSON.stringify(payload, null, 2));

  try {
    console.log(`\n📤 Sending webhook request...`);
    const response = await sendWebhookRequest(platform, endpoint, payload, signature);
    
    console.log(`\n📥 Response received:`);
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Headers: ${JSON.stringify(response.headers, null, 2)}`);
    console.log(`   Body: ${response.data}`);

    if (response.statusCode === 200) {
      console.log(`\n✅ Webhook test successful!`);
    } else {
      console.log(`\n⚠️  Webhook returned non-200 status code`);
    }
  } catch (error) {
    console.error(`\n❌ Error sending webhook:`, error);
  }
}

// CLI interface
function showHelp() {
  console.log(`
Webhook Testing Utility

Usage: node test-webhooks.js [options]

Options:
  --platform <platform>   Platform to test (humanitix or eventbrite)
  --event <event>        Event type to test
  --file <path>          Path to custom payload JSON file
  --list                 List available test events
  --help                 Show this help message

Examples:
  # Test Humanitix order created event
  node test-webhooks.js --platform humanitix --event order.created

  # Test Eventbrite with custom payload
  node test-webhooks.js --platform eventbrite --event order.placed --file custom-payload.json

  # List available test events
  node test-webhooks.js --list
`);
}

function listEvents() {
  console.log('\nAvailable test events:\n');
  
  Object.keys(samplePayloads).forEach(platform => {
    console.log(`${platform}:`);
    Object.keys(samplePayloads[platform]).forEach(event => {
      console.log(`  - ${event}`);
    });
    console.log('');
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  options[key] = value;
}

// Handle commands
if (options.help || args.length === 0) {
  showHelp();
} else if (options.list) {
  listEvents();
} else if (options.platform && options.event) {
  testWebhook(options.platform, options.event, options.file)
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
} else {
  console.error('❌ Invalid options. Use --help for usage information.');
  process.exit(1);
}

// Add npm scripts support
if (process.env.npm_lifecycle_event) {
  const script = process.env.npm_lifecycle_event;
  if (script === 'test:webhook:humanitix') {
    testWebhook('humanitix', 'order.created');
  } else if (script === 'test:webhook:eventbrite') {
    testWebhook('eventbrite', 'order.placed');
  }
}