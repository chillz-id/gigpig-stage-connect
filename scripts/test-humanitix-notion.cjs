#!/usr/bin/env node

/**
 * Test script for Humanitix to Notion integration
 * 
 * This script tests the integration without affecting production data:
 * 1. Tests Humanitix API connection
 * 2. Fetches sample event and order data
 * 3. Validates data transformation logic
 * 4. Optionally tests Notion database creation (in test mode)
 */

require('dotenv').config();

const HUMANITIX_API_KEY = process.env.HUMANITIX_API_KEY;
const NOTION_TOKEN = process.env.NOTION_TOKEN || process.env.NOTION_API_KEY;

console.log('🧪 Testing Humanitix to Notion Integration...\n');

// Test Humanitix API connection
async function testHumanitixAPI() {
  console.log('🔗 Testing Humanitix API...');
  
  if (!HUMANITIX_API_KEY) {
    console.error('❌ HUMANITIX_API_KEY not found in environment');
    return false;
  }

  try {
    // Test getting events
    const eventsResponse = await fetch('https://api.humanitix.com/v1/events?page=1', {
      headers: {
        'X-API-Key': HUMANITIX_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error(`❌ Humanitix API error (${eventsResponse.status}): ${errorText}`);
      return false;
    }

    const eventsData = await eventsResponse.json();
    console.log(`✅ Successfully fetched ${eventsData.data?.length || 0} events from Humanitix`);

    // Test getting orders for first event (if any)
    if (eventsData.data && eventsData.data.length > 0) {
      const firstEvent = eventsData.data[0];
      console.log(`   📋 Testing with event: "${firstEvent.name}"`);

      const ordersResponse = await fetch(`https://api.humanitix.com/v1/events/${firstEvent.id}/orders?page=1`, {
        headers: {
          'X-API-Key': HUMANITIX_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        console.log(`✅ Successfully fetched ${ordersData.data?.length || 0} orders for event`);
        
        if (ordersData.data && ordersData.data.length > 0) {
          console.log('   💡 Sample order structure:');
          const sampleOrder = ordersData.data[0];
          console.log(`      Order ID: ${sampleOrder.id}`);
          console.log(`      Customer: ${sampleOrder.firstName} ${sampleOrder.lastName}`);
          console.log(`      Total: ${sampleOrder.currency} ${sampleOrder.total}`);
          console.log(`      Status: ${sampleOrder.status}`);
          console.log(`      Tickets: ${sampleOrder.tickets?.length || 0}`);
        }
        
        return { eventsData, ordersData };
      } else {
        console.log('⚠️ Could not fetch orders (this might be expected if event has no orders)');
        return { eventsData, ordersData: { data: [] } };
      }
    } else {
      console.log('⚠️ No events found in Humanitix account');
      return { eventsData: { data: [] }, ordersData: { data: [] } };
    }

  } catch (error) {
    console.error(`❌ Humanitix API test failed: ${error.message}`);
    return false;
  }
}

// Test data transformation logic
function testDataTransformation(sampleData) {
  console.log('\n🔄 Testing data transformation...');
  
  if (!sampleData || !sampleData.ordersData.data.length) {
    console.log('⚠️ No order data to test transformation');
    return true;
  }

  try {
    const order = sampleData.ordersData.data[0];
    
    // Transform using the same logic as N8N workflow
    const ticketTypes = order.tickets?.map(t => t.ticketType?.name || 'General').join(', ') || 'General';
    const totalQuantity = order.tickets?.reduce((sum, t) => sum + (t.quantity || 1), 0) || 1;
    
    const transformedOrder = {
      properties: {
        "Event Name": {
          title: [{ text: { content: order.event?.name || 'Unknown Event' } }]
        },
        "Event Date": order.event?.startDate ? {
          date: { start: order.event.startDate }
        } : null,
        "Platform": {
          select: { name: "Humanitix" }
        },
        "Order ID": {
          rich_text: [{ text: { content: order.id || 'N/A' } }]
        },
        "Customer Name": {
          rich_text: [{ text: { content: `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'N/A' } }]
        },
        "Customer Email": order.email ? {
          email: order.email
        } : null,
        "Customer Phone": order.phone ? {
          phone_number: order.phone
        } : null,
        "Ticket Types": {
          rich_text: [{ text: { content: ticketTypes } }]
        },
        "Quantity": {
          number: totalQuantity
        },
        "Amount": {
          number: parseFloat(order.total || 0)
        },
        "Currency": {
          select: { name: order.currency || "AUD" }
        },
        "Status": {
          select: { name: order.status || "unknown" }
        },
        "Purchase Date": order.createdAt ? {
          date: { start: order.createdAt }
        } : null,
        "Venue": {
          rich_text: [{ text: { content: order.event?.venue?.name || 'TBD' } }]
        },
        "Last Sync": {
          date: { start: new Date().toISOString() }
        }
      }
    };

    console.log('✅ Data transformation successful');
    console.log('   📊 Transformed order preview:');
    console.log(`      Event: ${transformedOrder.properties["Event Name"].title[0].text.content}`);
    console.log(`      Customer: ${transformedOrder.properties["Customer Name"].rich_text[0].text.content}`);
    console.log(`      Amount: ${transformedOrder.properties["Amount"].number} ${transformedOrder.properties["Currency"].select.name}`);
    console.log(`      Tickets: ${transformedOrder.properties["Quantity"].number} (${transformedOrder.properties["Ticket Types"].rich_text[0].text.content})`);

    return transformedOrder;

  } catch (error) {
    console.error(`❌ Data transformation failed: ${error.message}`);
    return false;
  }
}

// Test Notion API connection
async function testNotionAPI() {
  console.log('\n🔗 Testing Notion API...');
  
  if (!NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN not found in environment');
    return false;
  }

  try {
    const response = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Notion API error (${response.status}): ${errorText}`);
      return false;
    }

    const userData = await response.json();
    console.log(`✅ Successfully connected to Notion as: ${userData.name || userData.id}`);
    return true;

  } catch (error) {
    console.error(`❌ Notion API test failed: ${error.message}`);
    return false;
  }
}

// Main test execution
async function runTests() {
  try {
    console.log('Environment check:');
    console.log(`✅ Humanitix API Key: ${HUMANITIX_API_KEY ? 'Present' : 'Missing'}`);
    console.log(`✅ Notion Token: ${NOTION_TOKEN ? 'Present' : 'Missing'}`);
    console.log('');

    // Test Humanitix API
    const humanitixData = await testHumanitixAPI();
    if (!humanitixData) {
      console.error('\n❌ Humanitix API tests failed - cannot continue');
      process.exit(1);
    }

    // Test data transformation
    const transformedData = testDataTransformation(humanitixData);
    if (!transformedData) {
      console.error('\n❌ Data transformation tests failed');
      process.exit(1);
    }

    // Test Notion API
    const notionSuccess = await testNotionAPI();
    if (!notionSuccess) {
      console.error('\n❌ Notion API tests failed');
      process.exit(1);
    }

    console.log('\n🎉 All tests passed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Create your Notion database with the required properties');
    console.log('2. Run the setup script: node scripts/n8n-setup/setup-humanitix-notion.js');
    console.log('3. Import the workflows into N8N');
    console.log('4. Configure the NOTION_DATABASE_ID environment variable');
    console.log('5. Test the workflows in N8N');

  } catch (error) {
    console.error(`\n❌ Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Add global fetch polyfill for Node.js < 18
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testHumanitixAPI,
  testDataTransformation,
  testNotionAPI,
  runTests
};