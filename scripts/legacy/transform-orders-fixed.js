// Transform ALL orders to Notion format
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

console.log(`Processing ${orders.length} orders for event: ${eventName}`);

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
          content: `${orderData.firstName || buyer.firstName || ''} ${orderData.lastName || buyer.lastName || ''}`.trim() || 'Anonymous'
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

return transformedOrders.map(order => ({ json: order }));