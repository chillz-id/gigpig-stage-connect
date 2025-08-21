#!/usr/bin/env node

// Test Humanitix orders API for each event
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}

loadEnv();

async function testOrdersAPI() {
  const apiKey = process.env.HUMANITIX_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No Humanitix API key found');
    process.exit(1);
  }

  console.log('🔍 Testing Humanitix Orders API');
  console.log('================================\n');

  const headers = {
    'X-API-Key': apiKey,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  // First, get all events
  console.log('📋 Fetching events...');
  const eventsUrl = 'https://api.humanitix.com/v1/events?page=1';
  
  try {
    const eventsResponse = await fetch(eventsUrl, { headers });
    const events = await eventsResponse.json();
    
    if (!eventsResponse.ok) {
      console.error('❌ Failed to fetch events:', events);
      return;
    }

    // Handle the response - could be an array or object
    let eventsList = [];
    if (Array.isArray(events)) {
      eventsList = events;
    } else if (events.data && Array.isArray(events.data)) {
      eventsList = events.data;
    } else if (events.events && Array.isArray(events.events)) {
      eventsList = events.events;
    } else {
      console.log('Unexpected events response structure:', Object.keys(events));
      console.log('Response:', JSON.stringify(events, null, 2).substring(0, 500));
      return;
    }

    console.log(`✅ Found ${eventsList.length} events\n`);

    // Test orders API for first 3 events
    const testEvents = eventsList.slice(0, 3);
    
    for (const event of testEvents) {
      console.log(`\n📅 Event: ${event.name}`);
      console.log(`   ID: ${event._id}`);
      console.log(`   Date: ${event.date}`);
      console.log(`   Location: ${event.location}`);
      
      // Try different order endpoints
      const orderEndpoints = [
        {
          name: 'Orders (with page)',
          url: `https://api.humanitix.com/v1/events/${event._id}/orders?page=1`
        },
        {
          name: 'Orders (no params)',
          url: `https://api.humanitix.com/v1/events/${event._id}/orders`
        },
        {
          name: 'Tickets endpoint',
          url: `https://api.humanitix.com/v1/events/${event._id}/tickets?page=1`
        }
      ];

      for (const endpoint of orderEndpoints) {
        console.log(`\n   📡 Testing: ${endpoint.name}`);
        console.log(`      URL: ${endpoint.url}`);
        
        try {
          const response = await fetch(endpoint.url, { headers });
          const responseText = await response.text();
          
          console.log(`      Status: ${response.status} ${response.statusText}`);
          
          if (response.ok) {
            let data;
            try {
              data = JSON.parse(responseText);
            } catch (e) {
              console.log('      Response (text):', responseText.substring(0, 200));
              continue;
            }
            
            if (Array.isArray(data)) {
              console.log(`      ✅ Found ${data.length} items`);
              if (data.length > 0) {
                console.log('      First item structure:', Object.keys(data[0]));
                console.log('      Sample:', JSON.stringify(data[0], null, 2).substring(0, 300) + '...');
              }
            } else if (data.data) {
              console.log(`      ✅ Found ${data.data.length} items in data property`);
            } else {
              console.log('      Response structure:', Object.keys(data));
              console.log('      Data:', JSON.stringify(data, null, 2).substring(0, 300) + '...');
            }
          } else {
            let errorData;
            try {
              errorData = JSON.parse(responseText);
              console.log('      ❌ Error:', errorData.message || responseText);
            } catch (e) {
              console.log('      ❌ Error:', responseText.substring(0, 200));
            }
          }
        } catch (error) {
          console.log(`      ❌ Request failed: ${error.message}`);
        }
      }
    }

    console.log('\n\n📊 Summary:');
    console.log('1. Events API works with page=1 parameter (required)');
    console.log('2. Check which orders endpoint format works for your events');
    console.log('3. Some events might not have any orders yet');
    console.log('4. The response format may vary - check for array vs object with data property');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testOrdersAPI().catch(console.error);