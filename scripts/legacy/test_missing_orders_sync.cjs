const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


console.log('🔄 TESTING SYNC OF MISSING ORDERS');
console.log('=================================');

async function testMissingOrdersSync() {
  try {
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
    
    // The two missing orders we need to import
    const missingOrders = [
      {
        eventId: '689f9f7a2482b38c232f443a', // Jordan Shanks event
        customerName: 'Max Eastwood',
        expectedTime: '2025-08-22T06:14:20.814Z'
      },
      {
        eventId: '689f9fd42482b38c232f4479', // Live from Here event  
        customerName: 'Gabrielle Wakeman',
        expectedTime: '2025-08-22T05:27:37.140Z'
      }
    ];
    
    console.log(`🎯 Searching for ${missingOrders.length} missing orders...`);
    
    // Get all recent events to find the correct ones
    const eventsResponse = await axios.get(
      'https://api.humanitix.com/v1/events?page=1&pageSize=100',
      { headers: { 'x-api-key': humanitixApiKey } }
    );
    
    const allEvents = eventsResponse.data.events;
    console.log(`📋 Found ${allEvents.length} total events to search`);
    
    const targetEvents = [
      allEvents.find(e => e.name.includes('Jordan Shanks')),
      allEvents.find(e => e.name.includes('Live from Here'))
    ];
    
    console.log('🎪 Target events found:');
    targetEvents.forEach((event, i) => {
      if (event) {
        console.log(`   ${i+1}. ${event.name} (${event._id})`);
      } else {
        console.log(`   ${i+1}. ❌ Event not found`);
      }
    });
    
    // Find and import the missing orders
    let importedCount = 0;
    
    for (let i = 0; i < targetEvents.length; i++) {
      const event = targetEvents[i];
      const expectedOrder = missingOrders[i];
      
      if (!event) {
        console.log(`\n❌ Skipping missing event for ${expectedOrder.customerName}`);
        continue;
      }
      
      console.log(`\n🔍 Searching for ${expectedOrder.customerName} in ${event.name}...`);
      
      try {
        const ordersResponse = await axios.get(
          `https://api.humanitix.com/v1/events/${event._id}/orders?page=1&pageSize=20`,
          { headers: { 'x-api-key': humanitixApiKey } }
        );
        
        const orders = ordersResponse.data.orders;
        const targetOrder = orders.find(o => 
          o.firstName?.toLowerCase().includes(expectedOrder.customerName.toLowerCase().split(' ')[0]) &&
          o.lastName?.toLowerCase().includes(expectedOrder.customerName.toLowerCase().split(' ')[1])
        );
        
        if (targetOrder) {
          console.log(`✅ Found order: ${targetOrder.firstName} ${targetOrder.lastName} (${targetOrder._id})`);
          
          // Import this order to Notion using our corrected field mapping
          const firstName = targetOrder.firstName || '';
          const lastName = targetOrder.lastName || '';
          const customerName = `${firstName} ${lastName}`.trim() || 'Anonymous';
          
          // Extract financial data correctly
          const grossSales = parseFloat(targetOrder.totals?.grossSales || targetOrder.purchaseTotals?.grossSales || 0);
          const netSales = parseFloat(targetOrder.totals?.netSales || targetOrder.purchaseTotals?.netSales || 0);
          const discountCode = targetOrder.discounts?.discountCode?.code || '';
          const discountAmount = parseFloat(targetOrder.discounts?.discountCode?.discountAmount || targetOrder.totals?.discounts || 0);
          
          console.log(`   💰 Financial: Gross $${grossSales}, Net $${netSales}, Discount ${discountCode} ($${discountAmount})`);
          
          const notionEntry = {
            parent: { database_id: notionDatabaseId },
            properties: {
              "Name": { title: [{ text: { content: customerName } }] },
              "Email": { email: targetOrder.email || "no-email@example.com" },
              "Event Name": { rich_text: [{ text: { content: event.name } }] },
              "Event ID": { rich_text: [{ text: { content: event._id } }] },
              "Event Date & Time": { date: { start: event.startDate } },
              "Order ID": { rich_text: [{ text: { content: targetOrder._id } }] },
              "Total Amount": { number: grossSales }, // FIXED: Use gross sales
              "Net Sales": { number: netSales }, // NEW: Net sales field
              "Discount Code": { rich_text: [{ text: { content: discountCode } }] }, // NEW: Discount code
              "Discount Amount": { number: discountAmount }, // NEW: Discount amount
              "Quantity": { number: 1 },
              "Ticket Type": { rich_text: [{ text: { content: "General Admission" } }] },
              "Payment Status": { rich_text: [{ text: { content: targetOrder.status || "completed" } }] },
              "Order Date": { date: { start: targetOrder.completedAt || targetOrder.createdAt } },
              "Ticketing Partner": { select: { name: "Humanitix" } },
              "Created At": { date: { start: new Date().toISOString() } },
              "Updated At": { date: { start: new Date().toISOString() } }
            }
          };
          
          // Add phone if available
          if (targetOrder.mobile) {
            notionEntry.properties["Mobile"] = { phone_number: targetOrder.mobile };
          }
          
          // Import to Notion
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
          
          console.log(`✅ Successfully imported to Notion: ${customerName}`);
          console.log(`   Notion ID: ${notionResponse.data.id}`);
          importedCount++;
          
        } else {
          console.log(`❌ Order not found for ${expectedOrder.customerName}`);
        }
        
      } catch (orderError) {
        console.log(`❌ Error fetching orders: ${orderError.message}`);
      }
    }
    
    console.log(`\n🎯 MISSING ORDER SYNC COMPLETE`);
    console.log(`   Successfully imported: ${importedCount} orders`);
    console.log(`   Missing orders should now appear in Notion with correct financial data`);
    
    if (importedCount > 0) {
      console.log('\n🔗 Check your Notion database: https://www.notion.so/1374745b8cbe804b87a2ec93b3385e01');
    }
    
  } catch (error) {
    console.error('❌ Error during missing order sync:', error.response?.data || error.message);
  }
}

testMissingOrdersSync();