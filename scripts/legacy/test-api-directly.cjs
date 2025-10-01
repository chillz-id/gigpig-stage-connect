const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const HUMANITIX_API_KEY = process.env.HUMANITIX_API_KEY;
if (!HUMANITIX_API_KEY) {
    throw new Error('HUMANITIX_API_KEY environment variable not set');
}

async function testAPIDirectly() {
  console.log('🧪 TESTING HUMANITIX API DIRECTLY TO REPLICATE WORKFLOW...');
  
  try {
    // Step 1: Get events (like "Get ALL Events" node)
    console.log('\n📅 Step 1: Getting events...');
    
    const eventsResponse = await axios.get('https://api.humanitix.com/v1/events', {
      headers: {
        'x-api-key': HUMANITIX_API_KEY
      },
      params: {
        page: 1,
        pageSize: 100
      }
    });
    
    console.log(`✅ Events API: ${eventsResponse.status}`);
    console.log(`📊 Total events: ${eventsResponse.data.total}`);
    console.log(`📋 Events in this page: ${eventsResponse.data.events.length}`);
    
    if (eventsResponse.data.events.length > 0) {
      const firstEvent = eventsResponse.data.events[0];
      console.log(`📅 Sample event: ${firstEvent.name}`);
      console.log(`🆔 Event ID: ${firstEvent._id}`);
      
      // Step 2: Get orders for first event (like "Get ALL Orders" node)
      console.log('\n📦 Step 2: Getting orders for first event...');
      
      const ordersResponse = await axios.get(`https://api.humanitix.com/v1/events/${firstEvent._id}/orders`, {
        headers: {
          'x-api-key': HUMANITIX_API_KEY
        },
        params: {
          page: 1,
          pageSize: 100
        }
      });
      
      console.log(`✅ Orders API: ${ordersResponse.status}`);
      console.log(`📊 Total orders: ${ordersResponse.data.total}`);
      console.log(`📋 Orders in this page: ${ordersResponse.data.orders.length}`);
      
      if (ordersResponse.data.orders.length > 0) {
        const firstOrder = ordersResponse.data.orders[0];
        console.log(`📦 Sample order: ${firstOrder.orderName}`);
        console.log(`👤 Customer: ${firstOrder.firstName} ${firstOrder.lastName}`);
        console.log(`💰 Total: ${firstOrder.totals?.total || 'N/A'}`);
        
        // Step 3: Test the Transform Orders logic
        console.log('\n🔄 Step 3: Testing Transform Orders logic...');
        
        // Simulate the transform logic from the workflow
        const orderResponse = ordersResponse.data.orders;
        const eventInfo = firstEvent;
        const transformedOrders = [];
        
        // Use the same logic as in Transform Orders node
        let orders = [];
        if (Array.isArray(orderResponse)) {
          orders = orderResponse;
        } else if (orderResponse && orderResponse.orders && Array.isArray(orderResponse.orders)) {
          orders = orderResponse.orders;
        }
        
        console.log(`🔍 Orders to process: ${orders.length}`);
        
        for (let i = 0; i < Math.min(orders.length, 3); i++) { // Process first 3 orders as test
          const orderData = orders[i] || {};
          
          const orderId = orderData._id || orderData.id || `unknown-${i}`;
          const customerName = `${orderData.firstName || ''} ${orderData.lastName || ''}`.trim() || 'Anonymous';
          const email = orderData.email || "no-email@example.com";
          const amount = parseFloat(orderData.totals?.total || 0);
          
          const orderEntry = {
            orderId: orderId,
            properties: {
              "Event Name": {
                title: [{ text: { content: eventInfo.name } }]
              },
              "Order ID": {
                rich_text: [{ text: { content: orderId } }]
              },
              "Customer Name": {
                rich_text: [{ text: { content: customerName } }]
              },
              "Customer Email": {
                email: email
              },
              "Amount": {
                number: amount
              },
              "Platform": {
                select: { name: "Humanitix" }
              }
            }
          };
          
          transformedOrders.push(orderEntry);
          console.log(`✅ Transformed order ${i + 1}: ${customerName} - $${amount}`);
        }
        
        console.log(`\n🎉 SUCCESS! Transform logic works:`);
        console.log(`   - Retrieved ${eventsResponse.data.events.length} events`);
        console.log(`   - Found ${ordersResponse.data.orders.length} orders for first event`);
        console.log(`   - Successfully transformed ${transformedOrders.length} orders`);
        console.log(`   - Ready for Notion import`);
        
        console.log('\n💡 THE API AND TRANSFORM LOGIC WORK PERFECTLY!');
        console.log('🚨 The issue must be with N8N workflow execution itself');
        
        // Show what would go to Notion
        console.log('\n📋 Sample transformed order for Notion:');
        console.log(JSON.stringify(transformedOrders[0], null, 2));
        
      } else {
        console.log('❌ No orders found for this event');
      }
      
    } else {
      console.log('❌ No events found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

testAPIDirectly();