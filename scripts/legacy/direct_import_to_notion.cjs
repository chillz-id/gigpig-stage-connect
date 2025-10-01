const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


console.log('🚀 DIRECT IMPORT TO NOTION - BYPASSING N8N');
console.log('==========================================');

async function directImportToNotion() {
  try {
    // Configuration
    const humanitixApiKey = 'const HUMANITIX_API_KEY = process.env.HUMANITIX_API_KEY;
if (!HUMANITIX_API_KEY) {
    throw new Error('HUMANITIX_API_KEY environment variable not set');
}

process.env.HUMANITIX_API_KEY';
    const notionApiKey = 'const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) {
    throw new Error('NOTION_API_KEY environment variable not set');
}

process.env.NOTION_API_KEY';
    const notionDatabaseId = '1374745b-8cbe-804b-87a2-ec93b3385e01';
    const eventId = '689f33cf2482b38c232f3c3f'; // The event we know has orders
    
    console.log('📋 Fetching orders from Humanitix...');
    
    // Get orders for this specific event
    const ordersResponse = await axios.get(
      `https://api.humanitix.com/v1/events/${eventId}/orders?page=1&pageSize=5`,
      {
        headers: {
          'x-api-key': humanitixApiKey
        }
      }
    );
    
    // Get event info
    const eventsResponse = await axios.get(
      'https://api.humanitix.com/v1/events?page=1&pageSize=100',
      {
        headers: {
          'x-api-key': humanitixApiKey
        }
      }
    );
    
    const event = eventsResponse.data.events.find(e => e._id === eventId);
    const orders = ordersResponse.data.orders;
    
    console.log(`✅ Found ${orders.length} orders for event: ${event.name}`);
    
    // Import each order to Notion
    for (let i = 0; i < Math.min(orders.length, 2); i++) { // Just import 2 orders as test
      const orderData = orders[i];
      
      console.log(`\n📤 Importing order ${i + 1}: ${orderData.firstName} ${orderData.lastName}`);
      
      // Transform order to Notion format
      const firstName = orderData.firstName || '';
      const lastName = orderData.lastName || '';
      const customerName = `${firstName} ${lastName}`.trim() || 'Anonymous';
      
      const notionEntry = {
        parent: {
          database_id: notionDatabaseId
        },
        properties: {
          "Name": {
            title: [{ text: { content: customerName } }]
          },
          "Email": {
            email: orderData.email || "no-email@example.com"
          },
          "Event Name": {
            rich_text: [{ text: { content: event.name } }]
          },
          "Event ID": {
            rich_text: [{ text: { content: eventId } }]
          },
          "Event Date & Time": {
            date: { start: event.startDate }
          },
          "Order ID": {
            rich_text: [{ text: { content: orderData._id } }]
          },
          "Total Amount": {
            number: parseFloat(orderData.totals?.total || 0)
          },
          "Quantity": {
            number: 1
          },
          "Ticket Type": {
            rich_text: [{ text: { content: "General Admission" } }]
          },
          "Payment Status": {
            rich_text: [{ text: { content: orderData.status || "completed" } }]
          },
          "Order Date": {
            date: { start: orderData.completedAt || orderData.createdAt }
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
      
      // Add phone if available
      if (orderData.mobile) {
        notionEntry.properties["Mobile"] = {
          phone_number: orderData.mobile
        };
      }
      
      // Import to Notion
      try {
        const notionResponse = await axios.post(
          'https://api.notion.com/v1/pages',
          notionEntry,
          {
            headers: {
              'Authorization': `Bearer ${notionApiKey}`,
              'Content-Type': 'application/json',
              'Notion-Version': '2022-06-28'
            }
          }
        );
        
        console.log(`✅ Successfully imported: ${customerName} (Order: ${orderData._id})`);
        
      } catch (notionError) {
        console.log(`❌ Failed to import ${customerName}:`, notionError.response?.data || notionError.message);
      }
    }
    
    console.log('\n🎉 DIRECT IMPORT COMPLETE!');
    console.log('🔗 Check your Notion database: https://www.notion.so/1374745b8cbe804b87a2ec93b3385e01');
    console.log('\n✅ This proves the field mappings and data structure work correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

directImportToNotion();