const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


console.log('🚀 DIRECT IMPORT TO NOTION WITH FIXED FINANCIAL FIELDS');
console.log('======================================================');

async function directImportToNotionFixed() {
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
    for (let i = 0; i < Math.min(orders.length, 3); i++) { // Import 3 orders as test
      const orderData = orders[i];
      
      console.log(`\n📤 Importing order ${i + 1}: ${orderData.firstName} ${orderData.lastName}`);
      console.log(`   💰 Gross Sales: $${orderData.totals?.grossSales || 0}`);
      console.log(`   💸 Net Sales: $${orderData.totals?.netSales || 0}`);
      console.log(`   🎟️ Discount: ${orderData.discounts?.discountCode?.code || 'None'} - $${orderData.discounts?.discountCode?.discountAmount || 0}`);
      
      // Transform order to Notion format with CORRECT financial fields
      const firstName = orderData.firstName || '';
      const lastName = orderData.lastName || '';
      const customerName = `${firstName} ${lastName}`.trim() || 'Anonymous';
      
      // Extract financial data correctly
      const grossSales = parseFloat(orderData.totals?.grossSales || orderData.purchaseTotals?.grossSales || 0);
      const netSales = parseFloat(orderData.totals?.netSales || orderData.purchaseTotals?.netSales || 0);
      const discountCode = orderData.discounts?.discountCode?.code || '';
      const discountAmount = parseFloat(orderData.discounts?.discountCode?.discountAmount || orderData.totals?.discounts || 0);
      
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
          // FIXED: Use gross sales for Total Amount (original price before discount)
          "Total Amount": {
            number: grossSales
          },
          // NEW: Add Net Sales field (amount after discount)
          "Net Sales": {
            number: netSales
          },
          // NEW: Add Discount Code field
          "Discount Code": {
            rich_text: [{ text: { content: discountCode } }]
          },
          // NEW: Add Discount Amount field
          "Discount Amount": {
            number: discountAmount
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
        
        console.log(`✅ Successfully imported: ${customerName}`);
        console.log(`   Order ID: ${orderData._id}`);
        console.log(`   Total: $${grossSales} (Net: $${netSales})`);
        if (discountCode) {
          console.log(`   Discount: ${discountCode} - $${discountAmount}`);
        }
        
      } catch (notionError) {
        console.log(`❌ Failed to import ${customerName}:`, notionError.response?.data || notionError.message);
      }
    }
    
    console.log('\n🎉 DIRECT IMPORT COMPLETE WITH CORRECT FINANCIAL DATA!');
    console.log('🔗 Check your Notion database: https://www.notion.so/1374745b8cbe804b87a2ec93b3385e01');
    console.log('\n✅ Financial fields now correctly show:');
    console.log('   - Total Amount: Gross sales (original price)');
    console.log('   - Net Sales: Amount after discount');
    console.log('   - Discount Code: The code used');
    console.log('   - Discount Amount: The discount value');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

directImportToNotionFixed();