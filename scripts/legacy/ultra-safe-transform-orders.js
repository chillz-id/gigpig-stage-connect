// Ultra-safe Transform Orders - handles ALL undefined cases
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

// Ultra-safe event name with multiple fallbacks
let eventName = 'Unknown Event';
try {
  eventName = eventInfo?.title || eventInfo?.name || eventInfo?.eventName || 'Unknown Event';
} catch (e) {
  console.log('Error getting event name:', e.message);
  eventName = 'Unknown Event';
}

console.log(`Processing ${orders.length} orders for event: ${eventName}`);

for (let i = 0; i < orders.length; i++) {
  try {
    // Ultra-safe order processing
    const orderData = orders[i] || {};
    const buyer = orderData.buyer || {};
    const tickets = Array.isArray(orderData.tickets) ? orderData.tickets : [];
    
    // Ultra-safe ticket types extraction
    let ticketTypes = 'General';
    try {
      if (tickets.length > 0) {
        const typeNames = [];
        for (const ticket of tickets) {
          const t = ticket || {};
          const ticketType = t.ticketType || t.type || {};
          const name = ticketType.name || t.name || 'General';
          typeNames.push(name);
        }
        ticketTypes = typeNames.length > 0 ? typeNames.join(', ') : 'General';
      }
    } catch (e) {
      console.log('Error processing ticket types:', e.message);
      ticketTypes = 'General';
    }
    
    // Ultra-safe quantity calculation
    let totalQuantity = 1;
    try {
      if (tickets.length > 0) {
        totalQuantity = 0;
        for (const ticket of tickets) {
          const t = ticket || {};
          const qty = parseInt(t.quantity) || 1;
          totalQuantity += qty;
        }
        if (totalQuantity === 0) totalQuantity = 1;
      }
    } catch (e) {
      console.log('Error calculating quantity:', e.message);
      totalQuantity = 1;
    }
    
    // Ultra-safe order ID
    const orderId = orderData._id || orderData.id || `unknown-${i}`;
    
    // Ultra-safe customer name
    let customerName = 'Anonymous';
    try {
      const firstName = orderData.firstName || buyer.firstName || '';
      const lastName = orderData.lastName || buyer.lastName || '';
      customerName = `${firstName} ${lastName}`.trim() || 'Anonymous';
    } catch (e) {
      customerName = 'Anonymous';
    }
    
    // Ultra-safe email
    const email = orderData.email || buyer.email || "no-email@example.com";
    
    // Ultra-safe phone
    const phone = orderData.phone || buyer.phone || null;
    
    // Ultra-safe amount
    let amount = 0;
    try {
      amount = parseFloat(orderData.total || orderData.amount || orderData.price || 0);
      if (isNaN(amount)) amount = 0;
    } catch (e) {
      amount = 0;
    }
    
    // Ultra-safe dates
    let eventDate = new Date().toISOString();
    try {
      eventDate = eventInfo.date || eventInfo.startDate || new Date().toISOString();
    } catch (e) {
      eventDate = new Date().toISOString();
    }
    
    let purchaseDate = new Date().toISOString();
    try {
      purchaseDate = orderData.createdAt || orderData.purchaseDate || new Date().toISOString();
    } catch (e) {
      purchaseDate = new Date().toISOString();
    }
    
    // Ultra-safe venue
    let venue = 'Online';
    try {
      venue = eventInfo.venue?.name || eventInfo.location?.name || eventInfo.location || 'Online';
    } catch (e) {
      venue = 'Online';
    }
    
    // Ultra-safe currency and status
    const currency = orderData.currency || eventInfo.currency || "AUD";
    const status = (orderData.status || "completed").toLowerCase();
    
    const orderEntry = {
      orderId: orderId,
      properties: {
        "Event Name": {
          title: [{ text: { content: eventName } }]
        },
        "Event Date": {
          date: { start: eventDate }
        },
        "Platform": {
          select: { name: "Humanitix" }
        },
        "Order ID": {
          rich_text: [{ text: { content: orderId } }]
        },
        "Customer Name": {
          rich_text: [{ text: { content: customerName } }]
        },
        "Customer Email": {
          email: email
        },
        "Ticket Types": {
          rich_text: [{ text: { content: ticketTypes } }]
        },
        "Quantity": {
          number: totalQuantity
        },
        "Amount": {
          number: amount
        },
        "Currency": {
          select: { name: currency }
        },
        "Status": {
          select: { name: status }
        },
        "Purchase Date": {
          date: { start: purchaseDate }
        },
        "Venue": {
          rich_text: [{ text: { content: venue } }]
        },
        "Last Sync": {
          date: { start: new Date().toISOString() }
        },
        "Notes": {
          rich_text: [{ text: { content: "Historical import - All time data" } }]
        }
      }
    };
    
    // Add phone if available
    if (phone) {
      orderEntry.properties["Customer Phone"] = {
        phone_number: phone
      };
    }
    
    transformedOrders.push(orderEntry);
    
  } catch (e) {
    console.log(`Error processing order ${i}:`, e.message);
    // Skip this order and continue
  }
}

console.log(`Successfully processed ${transformedOrders.length} orders`);
return transformedOrders.map(order => ({ json: order }));