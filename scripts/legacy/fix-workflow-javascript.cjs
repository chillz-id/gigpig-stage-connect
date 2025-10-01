#!/usr/bin/env node
/**
 * Fix JavaScript errors in Humanitix Historical Import workflow
 */

require('dotenv').config({ path: '/root/agents/.env' });

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const N8N_API_URL = "http://localhost:5678/api/v1";

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

async function fixWorkflowJavaScript() {
  const headers = {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json'
  };

  try {
    console.log('🔧 Fixing JavaScript errors in Historical Import workflow...\n');

    // Get the workflow
    console.log('📥 Fetching workflow...');
    const response = await fetch(`${N8N_API_URL}/workflows/py2wq9zchBz0TD9j`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workflow: ${response.status}`);
    }

    const workflow = await response.json();
    console.log('✅ Got workflow:', workflow.name);

    // Fix the JavaScript code in nodes
    const updateData = {
      name: workflow.name,
      nodes: workflow.nodes.map(node => {
        const updatedNode = { ...node };

        // Fix "Process Events" node
        if (node.name === 'Process Events') {
          console.log('🔧 Fixing "Process Events" JavaScript...');
          updatedNode.parameters = { ...node.parameters };
          updatedNode.parameters.jsCode = fixedProcessEventsCode;
        }

        // Fix "Transform Orders" node - THE MAIN FIX
        if (node.name === 'Transform Orders') {
          console.log('🔧 Fixing "Transform Orders" JavaScript...');
          updatedNode.parameters = { ...node.parameters };
          updatedNode.parameters.jsCode = fixedTransformOrdersCode;
        }

        return updatedNode;
      }),
      connections: workflow.connections,
      settings: workflow.settings
    };

    console.log('💾 Updating workflow with fixed JavaScript...');
    const updateResponse = await fetch(`${N8N_API_URL}/workflows/py2wq9zchBz0TD9j`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ Update failed:', updateResponse.status, errorText);
      throw new Error(`Update failed: ${updateResponse.status}`);
    }

    console.log('✅ Workflow JavaScript updated successfully!\n');
    
    console.log('🎉 JavaScript Fixes Applied!');
    console.log('\n📋 Changes made:');
    console.log('  • Fixed "Process Events" node - added null checks');
    console.log('  • Fixed "Transform Orders" node - fixed eventInfo.name → eventInfo.title');
    console.log('  • Added defensive programming throughout');
    console.log('  • Safe property access with fallbacks');
    console.log('\n✅ The workflow should now run without JavaScript errors!');
    console.log('\n🚀 Try executing the workflow again - the TypeError should be resolved.');

  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

fixWorkflowJavaScript();