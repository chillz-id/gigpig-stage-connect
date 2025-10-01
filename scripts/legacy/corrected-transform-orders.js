// CORRECTED Transform Orders - Maps to ACTUAL Notion database fields
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
    const eventId = eventInfo._id || eventInfo.id || 'unknown-event';
    
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
    const phone = orderData.phone || buyer.phone || orderData.mobile || buyer.mobile || null;
    
    // Ultra-safe amount
    let amount = 0;
    try {
      amount = parseFloat(orderData.totals?.total || orderData.total || orderData.amount || orderData.price || 0);
      if (isNaN(amount)) amount = 0;
    } catch (e) {
      amount = 0;
    }
    
    // Ultra-safe dates
    let eventDate = new Date().toISOString();
    try {
      eventDate = eventInfo.startDate || eventInfo.date || new Date().toISOString();
    } catch (e) {
      eventDate = new Date().toISOString();
    }
    
    let orderDate = new Date().toISOString();
    try {
      orderDate = orderData.createdAt || orderData.purchaseDate || orderData.completedAt || new Date().toISOString();
    } catch (e) {
      orderDate = new Date().toISOString();
    }
    
    // Ultra-safe status
    const status = orderData.status || orderData.financialStatus || "completed";
    
    // CORRECTED: Map to ACTUAL Notion database fields
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
    console.log(`Error processing order ${i}:`, e.message);
    // Skip this order and continue
  }
}

console.log(`Successfully processed ${transformedOrders.length} orders with CORRECTED field mappings`);
return transformedOrders.map(order => ({ json: order }));