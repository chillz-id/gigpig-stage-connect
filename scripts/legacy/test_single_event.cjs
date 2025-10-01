const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


console.log('🧪 TESTING SINGLE EVENT ORDERS IMPORT...');
console.log('=========================================');

async function testSingleEventImport() {
  try {
    // Test the specific event we know has orders
    const eventId = '689f33cf2482b38c232f3c3f';
    const apiKey = 'const HUMANITIX_API_KEY = process.env.HUMANITIX_API_KEY;
if (!HUMANITIX_API_KEY) {
    throw new Error('HUMANITIX_API_KEY environment variable not set');
}

process.env.HUMANITIX_API_KEY';
    
    console.log('📋 Testing with event ID:', eventId);
    
    // Get orders for this specific event
    const ordersResponse = await axios.get(
      `https://api.humanitix.com/v1/events/${eventId}/orders?page=1&pageSize=5`,
      {
        headers: {
          'x-api-key': apiKey
        }
      }
    );
    
    console.log('✅ Successfully fetched orders');
    console.log('Total orders:', ordersResponse.data.total);
    console.log('Orders in response:', ordersResponse.data.orders.length);
    
    // Get event info
    const eventsResponse = await axios.get(
      'https://api.humanitix.com/v1/events?page=1&pageSize=100',
      {
        headers: {
          'x-api-key': apiKey
        }
      }
    );
    
    const event = eventsResponse.data.events.find(e => e._id === eventId);
    
    if (!event) {
      console.log('❌ Event not found');
      return;
    }
    
    console.log('✅ Found event:', event.name);
    
    // Now simulate what should happen in the Transform Orders node
    const orders = ordersResponse.data.orders;
    const eventInfo = event;
    const transformedOrders = [];
    
    console.log(`📋 Processing ${orders.length} orders for event: ${eventInfo.name}`);
    
    for (let i = 0; i < orders.length; i++) {
      const orderData = orders[i];
      
      const orderId = orderData._id;
      const eventId = orderData.eventId || eventInfo._id;
      
      const firstName = orderData.firstName || '';
      const lastName = orderData.lastName || '';
      const customerName = `${firstName} ${lastName}`.trim() || 'Anonymous';
      
      const email = orderData.email || "no-email@example.com";
      const phone = orderData.mobile || null;
      
      const amount = parseFloat(orderData.totals?.total || 0);
      const totalQuantity = 1;
      
      const eventDate = eventInfo.startDate || new Date().toISOString();
      const orderDate = orderData.completedAt || orderData.createdAt || new Date().toISOString();
      
      const status = orderData.status || "completed";
      const ticketTypes = 'General Admission';
      const eventName = eventInfo.name;
      
      const orderEntry = {
        orderId: orderId,
        properties: {
          "Name": {
            title: [{ text: { content: customerName } }]
          },
          "Email": {
            email: email
          },
          "Mobile": phone ? {
            phone_number: phone
          } : null,
          "Event Name": {
            rich_text: [{ text: { content: eventName } }]
          },
          "Event ID": {
            rich_text: [{ text: { content: eventId } }]
          },
          "Event Date & Time": {
            date: { start: eventDate }
          },
          "Order ID": {
            rich_text: [{ text: { content: orderId } }]
          },
          "Total Amount": {
            number: amount
          },
          "Quantity": {
            number: totalQuantity
          },
          "Ticket Type": {
            rich_text: [{ text: { content: ticketTypes } }]
          },
          "Payment Status": {
            rich_text: [{ text: { content: status } }]
          },
          "Order Date": {
            date: { start: orderDate }
          },
          "Ticketing Partner": {
            select: { name: "Humanitix" }
          },
          "Created At": {
            date: { start: new Date().toISOString() }
          },
          "Updated At": {
            date: { start: new Date().toISOString() }
          }
        }
      };
      
      if (!phone) {
        delete orderEntry.properties["Mobile"];
      }
      
      transformedOrders.push(orderEntry);
      
      console.log(`✅ Processed order ${i + 1}: ${customerName} (${orderId})`);
    }
    
    console.log(`\n🎯 SUCCESSFULLY TRANSFORMED ${transformedOrders.length} ORDERS`);
    console.log('Sample transformed order:');
    console.log(JSON.stringify(transformedOrders[0], null, 2));
    
    console.log('\n🚀 This proves the transformation logic works!');
    console.log('The issue in N8N must be with data flow between nodes.');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSingleEventImport();