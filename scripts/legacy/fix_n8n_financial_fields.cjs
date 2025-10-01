const fs = require('fs');

console.log('🔧 FIXING N8N WORKFLOW FINANCIAL FIELDS');
console.log('=======================================');

// Read the current workflow
const workflowPath = '/root/agents/scripts/workflow_fixed.json';
let workflows;
let workflow;

try {
  const workflowData = fs.readFileSync(workflowPath, 'utf8');
  workflows = JSON.parse(workflowData);
  workflow = workflows[0]; // Get the first workflow
  console.log('✅ Loaded existing workflow from', workflowPath);
  console.log('✅ Found workflow:', workflow.name);
} catch (error) {
  console.error('❌ Error reading workflow:', error.message);
  process.exit(1);
}

// Find and update the Transform Orders node
const transformNode = workflow.nodes.find(node => node.name === 'Transform Orders');

if (!transformNode) {
  console.error('❌ Transform Orders node not found!');
  process.exit(1);
}

console.log('🔍 Found Transform Orders node, updating financial field mappings...');

// Update the JavaScript code with correct financial field mappings
transformNode.parameters.jsCode = `// Ultra-safe Transform Orders with CORRECT FINANCIAL FIELDS
const orders = $input.all();
const transformedOrders = [];

console.log('🔄 Transform Orders: Processing', orders.length, 'orders');

for (let i = 0; i < orders.length; i++) {
  const orderItem = orders[i];
  console.log('📦 Processing order item', i + 1, ':', orderItem);
  
  try {
    // Handle both direct order data and nested json structures
    let orderData, eventInfo;
    
    if (orderItem.json && orderItem.json.orders && orderItem.json.eventInfo) {
      // From "Get Event Details" format
      const ordersList = orderItem.json.orders;
      eventInfo = orderItem.json.eventInfo;
      
      for (let j = 0; j < ordersList.length; j++) {
        orderData = ordersList[j];
        transformedOrders.push(processOrder(orderData, eventInfo, j));
      }
    } else if (orderItem.json && Array.isArray(orderItem.json)) {
      // Array of orders
      for (let j = 0; j < orderItem.json.length; j++) {
        orderData = orderItem.json[j];
        eventInfo = { name: 'Unknown Event', _id: 'unknown', startDate: new Date().toISOString() };
        transformedOrders.push(processOrder(orderData, eventInfo, j));
      }
    } else if (orderItem.json) {
      // Single order
      orderData = orderItem.json;
      eventInfo = { name: 'Unknown Event', _id: 'unknown', startDate: new Date().toISOString() };
      transformedOrders.push(processOrder(orderData, eventInfo, 0));
    }
  } catch (error) {
    console.error('❌ Error processing order:', error.message);
  }
}

function processOrder(orderData, eventInfo, index) {
  console.log('🔄 Processing individual order:', orderData?._id || 'unknown');
  
  try {
    const orderId = orderData?._id || orderData?.id || 'unknown-' + Date.now();
    const eventId = orderData?.eventId || eventInfo?._id || 'unknown-event';
    
    // Safe customer name extraction
    let customerName = 'Anonymous';
    try {
      const firstName = orderData?.firstName || '';
      const lastName = orderData?.lastName || '';
      customerName = \`\${firstName} \${lastName}\`.trim() || 'Anonymous';
    } catch (e) {
      customerName = 'Anonymous';
    }
    
    const email = orderData?.email || "no-email@example.com";
    const phone = orderData?.mobile || orderData?.phone || null;
    
    // FIXED FINANCIAL FIELDS - Use correct data sources
    let grossSales = 0;
    let netSales = 0;
    let discountAmount = 0;
    let discountCode = '';
    
    try {
      // Use grossSales for Total Amount (original price before discount)
      grossSales = parseFloat(orderData?.totals?.grossSales || orderData?.purchaseTotals?.grossSales || 0);
      if (isNaN(grossSales)) grossSales = 0;
      
      // Use netSales for Net Sales (amount after discount)
      netSales = parseFloat(orderData?.totals?.netSales || orderData?.purchaseTotals?.netSales || 0);
      if (isNaN(netSales)) netSales = 0;
      
      // Extract discount information
      discountCode = orderData?.discounts?.discountCode?.code || '';
      discountAmount = parseFloat(orderData?.discounts?.discountCode?.discountAmount || orderData?.totals?.discounts || 0);
      if (isNaN(discountAmount)) discountAmount = 0;
      
      console.log(\`💰 Financial data - Gross: \${grossSales}, Net: \${netSales}, Discount: \${discountCode} (\${discountAmount})\`);
      
    } catch (e) {
      console.error('⚠️ Error extracting financial data:', e.message);
    }
    
    const totalQuantity = 1;
    
    // Safe date extraction
    let eventDate = new Date().toISOString();
    try {
      eventDate = eventInfo?.startDate || eventInfo?.date || new Date().toISOString();
    } catch (e) {
      eventDate = new Date().toISOString();
    }
    
    let orderDate = new Date().toISOString();
    try {
      orderDate = orderData?.completedAt || orderData?.createdAt || new Date().toISOString();
    } catch (e) {
      orderDate = new Date().toISOString();
    }
    
    const status = orderData?.status || orderData?.financialStatus || "completed";
    const ticketTypes = 'General Admission';
    const eventName = eventInfo?.name || eventInfo?.title || 'Unknown Event';
    
    // Create the order entry with CORRECT field mappings
    const orderEntry = {
      orderId: orderId,
      properties: {
        "Name": {
          title: [{ text: { content: customerName } }]
        },
        "Email": {
          email: email
        },
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
        // FIXED: Use gross sales for Total Amount (original price)
        "Total Amount": {
          number: grossSales
        },
        // NEW: Add Net Sales field
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
    
    // Add phone if available
    if (phone) {
      orderEntry.properties["Mobile"] = {
        phone_number: phone
      };
    }
    
    console.log(\`✅ Created order entry for: \${customerName} (Gross: $\${grossSales}, Net: $\${netSales})\`);
    return orderEntry;
    
  } catch (error) {
    console.error('❌ Error in processOrder:', error.message);
    return null;
  }
}

console.log(\`🎯 Transformed \${transformedOrders.length} orders with correct financial fields\`);
return transformedOrders.filter(order => order !== null);`;

// Save the updated workflow
const outputPath = '/root/agents/scripts/workflow_financial_fixed.json';

try {
  workflows[0] = workflow; // Update the first workflow in the array
  fs.writeFileSync(outputPath, JSON.stringify(workflows, null, 2));
  console.log('✅ Updated workflow saved to', outputPath);
  console.log('\n🔧 Key changes made:');
  console.log('   - Total Amount now uses grossSales (original price)');
  console.log('   - Added Net Sales field using netSales');
  console.log('   - Added Discount Code field');
  console.log('   - Added Discount Amount field');
  console.log('\n📋 Next steps:');
  console.log('   1. Import this workflow to N8N');
  console.log('   2. Test with historical data import');
  console.log('   3. Verify all financial fields populate correctly');
} catch (error) {
  console.error('❌ Error saving workflow:', error.message);
}

console.log('\n🎉 N8N WORKFLOW FINANCIAL FIELDS FIXED!');