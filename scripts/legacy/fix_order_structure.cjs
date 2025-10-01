const fs = require('fs');

console.log('🔧 FIXING ORDER DATA STRUCTURE HANDLING...');
console.log('===========================================');

// Read the workflow
const workflow = JSON.parse(fs.readFileSync('/root/agents/scripts/workflow_clean.json', 'utf8'));

// Find Transform Orders node
const transformNode = workflow.nodes.find(node => node.name === 'Transform Orders');

if (!transformNode) {
  console.log('❌ Transform Orders node not found');
  process.exit(1);
}

console.log('✅ Found Transform Orders node');

// The CORRECTED JavaScript code that handles the ACTUAL Humanitix order structure
const correctedJavaScript = `// CORRECTED Transform Orders - Handles ACTUAL Humanitix order structure
const orderResponse = $input.all()[0]?.json || {};
const eventInfo = $json?.event || {};
const transformedOrders = [];

// Ultra-safe extract orders from response
let orders = [];
try {
  if (Array.isArray(orderResponse)) {
    orders = orderResponse;
  } else if (orderResponse && orderResponse.orders && Array.isArray(orderResponse.orders)) {
    orders = orderResponse.orders;
  } else if (orderResponse && orderResponse.data && Array.isArray(orderResponse.data)) {
    orders = orderResponse.data;
  }
} catch (e) {
  console.log('Error extracting orders:', e.message);
  orders = [];
}

// Ultra-safe event name
let eventName = 'Unknown Event';
try {
  eventName = eventInfo?.name || eventInfo?.title || eventInfo?.eventName || 'Unknown Event';
} catch (e) {
  console.log('Error getting event name:', e.message);
  eventName = 'Unknown Event';
}

console.log(\`Processing \${orders.length} orders for event: \${eventName}\`);

for (let i = 0; i < orders.length; i++) {
  try {
    // Ultra-safe order processing
    const orderData = orders[i] || {};
    
    // CORRECTED: Use actual Humanitix order structure
    const orderId = orderData._id || orderData.id || \`unknown-\${i}\`;
    const eventId = orderData.eventId || eventInfo._id || eventInfo.id || 'unknown-event';
    
    // Ultra-safe customer name - use actual Humanitix fields
    let customerName = 'Anonymous';
    try {
      const firstName = orderData.firstName || '';
      const lastName = orderData.lastName || '';
      customerName = \`\${firstName} \${lastName}\`.trim() || 'Anonymous';
    } catch (e) {
      customerName = 'Anonymous';
    }
    
    // Ultra-safe email and phone from actual Humanitix structure
    const email = orderData.email || "no-email@example.com";
    const phone = orderData.mobile || orderData.phone || null;
    
    // Ultra-safe amount - use actual Humanitix totals structure
    let amount = 0;
    try {
      amount = parseFloat(orderData.totals?.total || orderData.total || 0);
      if (isNaN(amount)) amount = 0;
    } catch (e) {
      amount = 0;
    }
    
    // Default quantity (Humanitix doesn't have ticket array structure)
    const totalQuantity = 1;
    
    // Ultra-safe dates
    let eventDate = new Date().toISOString();
    try {
      eventDate = eventInfo.startDate || eventInfo.date || new Date().toISOString();
    } catch (e) {
      eventDate = new Date().toISOString();
    }
    
    let orderDate = new Date().toISOString();
    try {
      orderDate = orderData.completedAt || orderData.createdAt || new Date().toISOString();
    } catch (e) {
      orderDate = new Date().toISOString();
    }
    
    // Ultra-safe status
    const status = orderData.status || orderData.financialStatus || "completed";
    
    // Default ticket type
    const ticketTypes = 'General Admission';
    
    // CORRECTED: Map to ACTUAL Notion database fields with proper data
    const orderEntry = {
      orderId: orderId, // Keep this for duplicate checking
      properties: {
        // TITLE FIELD - Customer Name (not event name!)
        "Name": {
          title: [{ text: { content: customerName } }]
        },
        
        // CONTACT INFO
        "Email": {
          email: email
        },
        "Mobile": phone ? {
          phone_number: phone
        } : null,
        
        // EVENT INFO
        "Event Name": {
          rich_text: [{ text: { content: eventName } }]
        },
        "Event ID": {
          rich_text: [{ text: { content: eventId } }]
        },
        "Event Date & Time": {
          date: { start: eventDate }
        },
        
        // ORDER INFO
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
        
        // PLATFORM INFO
        "Ticketing Partner": {
          select: { name: "Humanitix" }
        },
        
        // METADATA
        "Created At": {
          date: { start: new Date().toISOString() }
        },
        "Updated At": {
          date: { start: new Date().toISOString() }
        }
      }
    };
    
    // Remove null phone field if no phone
    if (!phone) {
      delete orderEntry.properties["Mobile"];
    }
    
    transformedOrders.push(orderEntry);
    
  } catch (e) {
    console.log(\`Error processing order \${i}:\`, e.message);
    // Skip this order and continue
  }
}

console.log(\`Successfully processed \${transformedOrders.length} orders with CORRECTED field mappings\`);
return transformedOrders.map(order => ({ json: order }));`;

// Replace the JavaScript code
transformNode.parameters.jsCode = correctedJavaScript;

console.log('🎯 APPLIED ORDER STRUCTURE FIXES:');
console.log('=================================');
console.log('✅ Fixed order data extraction to use actual Humanitix structure');
console.log('✅ Removed references to non-existent tickets array');
console.log('✅ Uses orderData.firstName/lastName directly');
console.log('✅ Uses orderData.totals.total for amount');
console.log('✅ Uses orderData.mobile for phone');
console.log('✅ Uses orderData.completedAt for order date');
console.log('✅ Default quantity = 1 (no ticket array)');

// Update workflow metadata
workflow.updatedAt = new Date().toISOString();
workflow.name = 'Humanitix Historical Import - All Time (Structure Fixed)';

// Save the corrected workflow
fs.writeFileSync('/root/agents/scripts/workflow_structure_fixed.json', JSON.stringify([workflow], null, 2));

console.log('✅ Structure-corrected workflow saved as workflow_structure_fixed.json');
console.log('🚀 Ready to import back to N8N!');