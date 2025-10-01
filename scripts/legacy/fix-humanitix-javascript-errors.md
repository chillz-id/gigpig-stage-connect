# Fix JavaScript Errors in Humanitix Historical Import Workflow

## Error Analysis
The error `TypeError: Cannot read properties of undefined (reading 'name')` occurs because:
1. The code tries to access `eventInfo.name` but Humanitix API returns `eventInfo.title`
2. Missing null checks for undefined objects
3. API response structure doesn't match code expectations

## Fixes Required

### 1. Fix "Process Events" Node
The current code may be accessing undefined properties. Replace the JavaScript with:

```javascript
// Process the events response
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

console.log(`Found ${events.length} events on page ${$json.page || 1}`);

// Check if there are more pages
const hasMore = events.length === 100; // If we got a full page, there might be more

// Return events and pagination info - add null checks
return events.map(event => ({
  json: {
    event: event || {}, // Ensure event is never undefined
    hasMore,
    nextPage: hasMore ? (($json.page || 1) + 1) : null
  }
}));
```

### 2. Fix "Transform Orders" Node  
This is where the main error occurs. Replace the JavaScript with:

```javascript
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
```

### 3. Key Changes Made:
1. **Added null checks**: `eventInfo = $json.event || {}`
2. **Fixed property access**: `eventInfo.title || eventInfo.name || 'Unknown Event'`
3. **Safe array access**: Check if arrays exist before mapping
4. **Defensive programming**: All property access wrapped in safe checks
5. **Proper fallbacks**: Multiple fallback values for all properties

### 4. Apply These Fixes:
1. Open the "Humanitix Historical Import - All Time (Restored)" workflow
2. Click on the "Process Events" node and replace the JavaScript code
3. Click on the "Transform Orders" node and replace the JavaScript code  
4. Save the workflow
5. Test execution

This should resolve the `Cannot read properties of undefined (reading 'name')` error!