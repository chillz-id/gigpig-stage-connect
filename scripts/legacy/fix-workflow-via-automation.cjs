#!/usr/bin/env node
/**
 * Fix JavaScript errors using the working N8N automation script
 */

const { execSync } = require('child_process');
const fs = require('fs');

const fixedProcessEventsCode = `// Process the events response
const response = $input.all()[0].json;
let events = [];

// Handle different response formats
if (Array.isArray(response)) {
  events = response;
} else if (response && response.events && Array.isArray(response.events)) {
  events = response.events;
} else if (response && response.data && Array.isArray(response.data)) {
  events = response.data;
}

console.log(\`Found \${events.length} events on page \${$json.page || 1}\`);

// Check if there are more pages
const hasMore = events.length === 100; // If we got a full page, there might be more

// Return events and pagination info - add null checks
return events.map(event => ({
  json: {
    event: event || {}, // Ensure event is never undefined
    hasMore,
    nextPage: hasMore ? (($json.page || 1) + 1) : null
  }
}));`;

const fixedTransformOrdersCode = `// Transform ALL orders to Notion format
const orderResponse = $input.all()[0].json;
const eventInfo = $json.event || {}; // Add null check here
const transformedOrders = [];

// Extract orders from response
let orders = [];
if (Array.isArray(orderResponse)) {
  orders = orderResponse;
} else if (orderResponse && orderResponse.orders && Array.isArray(orderResponse.orders)) {
  orders = orderResponse.orders;
} else if (orderResponse && orderResponse.data && Array.isArray(orderResponse.data)) {
  orders = orderResponse.data;
}

// Get event name with fallbacks - THIS FIXES THE MAIN ERROR
const eventName = eventInfo.title || eventInfo.name || 'Unknown Event';

console.log(\`Processing \${orders.length} orders for event: \${eventName}\`);

for (const order of orders) {
  // Add null checks throughout
  const orderData = order || {};
  const buyer = orderData.buyer || {};
  const tickets = orderData.tickets || [];
  
  // Extract ticket details safely
  const ticketTypes = tickets.map(t => {
    const ticket = t || {};
    const ticketType = ticket.ticketType || ticket.type || {};
    return ticketType.name || ticket.name || 'General';
  }).join(', ') || 'General';
  
  const totalQuantity = tickets.reduce((sum, t) => {
    return sum + ((t && t.quantity) ? t.quantity : 1);
  }, 0) || 1;
  
  transformedOrders.push({
    orderId: orderData._id || orderData.id || 'unknown',
    properties: {
      "Event Name": {
        title: [{ text: { content: eventName } }]
      },
      "Event Date": (eventInfo.date || eventInfo.startDate) ? {
        date: { start: eventInfo.date || eventInfo.startDate }
      } : {
        date: { start: new Date().toISOString() }
      },
      "Platform": {
        select: { name: "Humanitix" }
      },
      "Order ID": {
        rich_text: [{ text: { content: orderData._id || orderData.id || 'N/A' } }]
      },
      "Customer Name": {
        rich_text: [{ text: { 
          content: \`\${orderData.firstName || buyer.firstName || ''} \${orderData.lastName || buyer.lastName || ''}\`.trim() || 'Anonymous'
        } }]
      },
      "Customer Email": (orderData.email || buyer.email) ? {
        email: orderData.email || buyer.email
      } : {
        email: "no-email@example.com"
      },
      "Customer Phone": (orderData.phone || buyer.phone) ? {
        phone_number: orderData.phone || buyer.phone
      } : null,
      "Ticket Types": {
        rich_text: [{ text: { content: ticketTypes } }]
      },
      "Quantity": {
        number: totalQuantity
      },
      "Amount": {
        number: parseFloat(orderData.total || orderData.amount || orderData.price || 0)
      },
      "Currency": {
        select: { name: orderData.currency || eventInfo.currency || "AUD" }
      },
      "Status": {
        select: { name: (orderData.status || "completed").toLowerCase() }
      },
      "Purchase Date": (orderData.createdAt || orderData.purchaseDate) ? {
        date: { start: orderData.createdAt || orderData.purchaseDate }
      } : {
        date: { start: new Date().toISOString() }
      },
      "Venue": {
        rich_text: [{ text: { 
          content: (eventInfo.venue && eventInfo.venue.name) || 
                   (eventInfo.location && eventInfo.location.name) || 
                   eventInfo.location || 
                   'Online'
        } }]
      },
      "Last Sync": {
        date: { start: new Date().toISOString() }
      },
      "Notes": {
        rich_text: [{ text: { content: "Historical import - All time data" } }]
      }
    }
  });
}

return transformedOrders.map(order => ({ json: order }));`;

try {
  console.log('🔧 Getting workflow JSON...');
  
  // Get the workflow using the working automation script
  const workflowOutput = execSync('node /root/agents/scripts/n8n-automation.js get py2wq9zchBz0TD9j', { encoding: 'utf8' });
  
  // Extract JSON from the output
  const lines = workflowOutput.split('\n');
  const jsonStartIndex = lines.findIndex(line => line.includes('✅ Success:'));
  if (jsonStartIndex === -1) {
    throw new Error('Could not find workflow JSON in output');
  }
  
  const jsonLines = lines.slice(jsonStartIndex + 1);
  const workflowJsonString = jsonLines.join('\n').trim();
  const response = JSON.parse(workflowJsonString);
  const workflow = response.workflow;
  
  console.log('✅ Got workflow:', workflow.name);
  console.log('🔧 Applying JavaScript fixes...');
  
  // Fix the nodes
  const updatedNodes = workflow.nodes.map(node => {
    const updatedNode = { ...node };

    if (node.name === 'Process Events') {
      console.log('  • Fixing "Process Events" node JavaScript');
      updatedNode.parameters = { ...node.parameters };
      updatedNode.parameters.jsCode = fixedProcessEventsCode;
    }

    if (node.name === 'Transform Orders') {
      console.log('  • Fixing "Transform Orders" node JavaScript');
      updatedNode.parameters = { ...node.parameters };
      updatedNode.parameters.jsCode = fixedTransformOrdersCode;
    }

    return updatedNode;
  });
  
  // Create the updated workflow
  const updatedWorkflow = {
    name: workflow.name,
    nodes: updatedNodes,
    connections: workflow.connections,
    settings: workflow.settings
  };
  
  // Save the updated workflow to a temp file
  fs.writeFileSync('/tmp/fixed-workflow.json', JSON.stringify(updatedWorkflow, null, 2));
  
  console.log('💾 Workflow fixes prepared!');
  console.log('\n📋 JavaScript fixes applied:');
  console.log('  ✅ Process Events - Added null checks');
  console.log('  ✅ Transform Orders - Fixed eventInfo.name → eventInfo.title');
  console.log('  ✅ Added defensive programming throughout');
  console.log('\n⚠️  Next step: Apply the fixes using N8N API');
  console.log('   The fixed workflow JSON is saved to /tmp/fixed-workflow.json');
  
} catch (error) {
  console.error('💥 Error:', error.message);
  process.exit(1);
}