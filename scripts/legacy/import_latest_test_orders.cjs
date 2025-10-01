const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


console.log('🔄 IMPORTING LATEST TEST ORDERS');
console.log('===============================');

async function importLatestTestOrders() {
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
    
    console.log('🎯 Importing the latest test orders:');
    console.log('   - Nelson Bours (Live from Here event)');
    console.log('   - Terrence Rothacker (Rory Lowe event)');
    
    // Get events to find the correct ones
    const eventsResponse = await axios.get(
      'https://api.humanitix.com/v1/events?page=1&pageSize=100',
      { headers: { 'x-api-key': humanitixApiKey } }
    );
    
    const allEvents = eventsResponse.data.events;
    
    const targetEvents = [
      {
        event: allEvents.find(e => e.name.includes('Live from Here')),
        expectedOrder: { name: 'Nelson Bours', id: '68a818a1b31cd055758bda1b' }
      },
      {
        event: allEvents.find(e => e.name.includes('Rory Lowe') && e.name.includes('Fremantle')),
        expectedOrder: { name: 'Terrence Rothacker', id: '68a816d64d7d55a3edc8f8b0' }
      }
    ];
    
    let importedCount = 0;
    
    for (let i = 0; i < targetEvents.length; i++) {
      const { event, expectedOrder } = targetEvents[i];
      
      if (!event) {
        console.log(`\n❌ Event not found for ${expectedOrder.name}`);
        continue;
      }
      
      console.log(`\n🔍 Searching for ${expectedOrder.name} in ${event.name}...`);
      
      try {
        const ordersResponse = await axios.get(
          `https://api.humanitix.com/v1/events/${event._id}/orders?page=1&pageSize=10`,
          { headers: { 'x-api-key': humanitixApiKey } }
        );
        
        const orders = ordersResponse.data.orders;
        const targetOrder = orders.find(o => o._id === expectedOrder.id);
        
        if (targetOrder) {
          console.log(`✅ Found order: ${targetOrder.firstName} ${targetOrder.lastName} (${targetOrder._id})`);
          
          // Import to Notion with correct financial field mapping
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
              "Total Amount": { number: grossSales }, // FIXED: Gross sales
              "Net Sales": { number: netSales }, // Net after discount
              "Discount Code": { rich_text: [{ text: { content: discountCode } }] }, // Discount code
              "Discount Amount": { number: discountAmount }, // Discount value
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
          
          console.log(`✅ Successfully imported: ${customerName}`);
          console.log(`   Notion ID: ${notionResponse.data.id}`);
          console.log(`   Financial: $${grossSales} gross → $${netSales} net`);
          if (discountCode) {
            console.log(`   Discount: ${discountCode} (-$${discountAmount})`);
          }
          importedCount++;
          
        } else {
          console.log(`❌ Order ${expectedOrder.id} not found for ${expectedOrder.name}`);
        }
        
      } catch (orderError) {
        console.log(`❌ Error fetching orders: ${orderError.message}`);
      }
    }
    
    console.log(`\n🎯 IMPORT COMPLETE`);
    console.log(`   Successfully imported: ${importedCount} test orders`);
    
    if (importedCount > 0) {
      console.log('\n🔗 Check your Notion database: https://www.notion.so/1374745b8cbe804b87a2ec93b3385e01');
      console.log('\n📋 Next steps:');
      console.log('   1. Configure Humanitix webhook: http://170.64.129.59:5678/webhook/humanitix-webhook');
      console.log('   2. Test real-time sync with a new order');
    }
    
  } catch (error) {
    console.error('❌ Error during import:', error.response?.data || error.message);
  }
}

importLatestTestOrders();