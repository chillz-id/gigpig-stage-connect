const fs = require('fs');
const { injectCredentials } = require('./utils/credentials-helper.cjs');

require('dotenv').config({ path: '/root/agents/.env' });


console.log('🔄 CREATING POLLING-BASED REAL-TIME SYNC');
console.log('=======================================');
console.log('Converting from webhook approach to API polling (since Humanitix has no native webhooks)');

// Create the polling-based real-time sync workflow
const pollingWorkflow = {
  "createdAt": new Date().toISOString(),
  "updatedAt": new Date().toISOString(),
  "id": "PollingNotionSync",
  "name": "Humanitix Polling Sync to Notion (Every 3 Minutes)",
  "active": true,
  "isArchived": false,
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes",
              "value": 3
            }
          ]
        }
      },
      "id": "polling-trigger",
      "name": "Every 3 Minutes",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "jsCode": `// Initialize polling session
const now = new Date();
const lastRunKey = 'lastHumanitixSync';

// Get last sync time (default to 10 minutes ago for first run)
let lastSyncTime = new Date(now.getTime() - (10 * 60 * 1000)); // 10 minutes ago

// Try to get actual last run time from workflow static data
try {
  const lastRun = $workflow.staticData[lastRunKey];
  if (lastRun) {
    lastSyncTime = new Date(lastRun);
  }
} catch (e) {
  console.log('First run - checking last 10 minutes');
}

// Update last sync time for next run
$workflow.staticData[lastRunKey] = now.toISOString();

console.log(\`🔍 Checking for orders since: \${lastSyncTime.toISOString()}\`);
console.log(\`📅 Current time: \${now.toISOString()}\`);

return [{
  json: {
    lastSyncTime: lastSyncTime.toISOString(),
    currentTime: now.toISOString()
  }
}];`
      },
      "id": "init-polling",
      "name": "Initialize Polling",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "https://api.humanitix.com/v1/events",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "page",
              "value": "1"
            },
            {
              "name": "pageSize", 
              "value": "50"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "x-api-key",
              "value": "{{HUMANITIX_API_KEY}}"
            }
          ]
        }
      },
      "id": "fetch-events",
      "name": "Fetch Recent Events",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [680, 300]
    },
    {
      "parameters": {
        "jsCode": `// Filter events to only check recent/active ones
const eventsResponse = $input.first().json;
const lastSyncTime = new Date($('Initialize Polling').first().json.lastSyncTime);
const events = eventsResponse.events || [];

console.log(\`📋 Processing \${events.length} events from API\`);

// Filter to recent/upcoming events (reduce API calls)
const recentEvents = events.filter(event => {
  const eventDate = new Date(event.startDate);
  const now = new Date();
  const daysDiff = (eventDate - now) / (1000 * 60 * 60 * 24);
  
  // Include events from last 7 days to next 60 days
  return daysDiff >= -7 && daysDiff <= 60;
});

console.log(\`🎯 Filtered to \${recentEvents.length} recent/upcoming events\`);

return recentEvents.map(event => ({
  json: {
    eventId: event._id,
    eventName: event.name,
    eventDate: event.startDate,
    lastSyncTime: lastSyncTime.toISOString()
  }
}));`
      },
      "id": "filter-events",
      "name": "Filter Recent Events", 
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "=https://api.humanitix.com/v1/events/{{ $json.eventId }}/orders",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "page",
              "value": "1"
            },
            {
              "name": "pageSize",
              "value": "20"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "x-api-key", 
              "value": "process.env.HUMANITIX_API_KEY"
            }
          ]
        }
      },
      "id": "fetch-orders",
      "name": "Fetch Event Orders",
      "type": "n8n-nodes-base.httpRequest", 
      "typeVersion": 4.1,
      "position": [1120, 300]
    },
    {
      "parameters": {
        "jsCode": `// Filter orders to only new ones since last sync
const ordersResponse = $input.first().json;
const orders = ordersResponse.orders || [];
const eventData = $('Filter Recent Events').item($runIndex).json;
const lastSyncTime = new Date(eventData.lastSyncTime);

console.log(\`🔍 Event: \${eventData.eventName} - \${orders.length} total orders\`);

// Find orders created since last sync
const newOrders = orders.filter(order => {
  const orderCreatedTime = new Date(order.createdAt);
  const orderCompletedTime = new Date(order.completedAt || order.createdAt);
  
  // Include if created OR completed after last sync
  return orderCreatedTime > lastSyncTime || orderCompletedTime > lastSyncTime;
});

if (newOrders.length > 0) {
  console.log(\`🚨 Found \${newOrders.length} NEW orders since last sync!\`);
  
  return newOrders.map(order => ({
    json: {
      orderData: order,
      eventData: {
        _id: eventData.eventId,
        name: eventData.eventName,
        startDate: eventData.eventDate
      }
    }
  }));
} else {
  console.log(\`✅ No new orders for \${eventData.eventName}\`);
  return [];
}`
      },
      "id": "filter-new-orders",
      "name": "Filter New Orders",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1340, 300]
    },
    {
      "parameters": {
        "jsCode": `// Transform order for Notion with CORRECT FINANCIAL FIELDS
const { orderData, eventData } = $json;

console.log(\`🔄 Processing new order: \${orderData.firstName} \${orderData.lastName} (\${orderData._id})\`);

try {
  const orderId = orderData._id || 'unknown-' + Date.now();
  const eventId = eventData._id || 'unknown-event';
  
  // Safe customer name extraction
  let customerName = 'Anonymous';
  try {
    const firstName = orderData.firstName || '';
    const lastName = orderData.lastName || '';
    customerName = \`\${firstName} \${lastName}\`.trim() || 'Anonymous';
  } catch (e) {
    customerName = 'Anonymous';
  }
  
  const email = orderData.email || "no-email@example.com";
  const phone = orderData.mobile || orderData.phone || null;
  
  // CORRECT FINANCIAL FIELDS - Use proper data sources
  let grossSales = 0;
  let netSales = 0;
  let discountAmount = 0;
  let discountCode = '';
  
  try {
    // Use grossSales for Total Amount (original price before discount)
    grossSales = parseFloat(orderData.totals?.grossSales || orderData.purchaseTotals?.grossSales || 0);
    if (isNaN(grossSales)) grossSales = 0;
    
    // Use netSales for Net Sales (amount after discount)
    netSales = parseFloat(orderData.totals?.netSales || orderData.purchaseTotals?.netSales || 0);
    if (isNaN(netSales)) netSales = 0;
    
    // Extract discount information
    discountCode = orderData.discounts?.discountCode?.code || '';
    discountAmount = parseFloat(orderData.discounts?.discountCode?.discountAmount || orderData.totals?.discounts || 0);
    if (isNaN(discountAmount)) discountAmount = 0;
    
    console.log(\`💰 Financial - Gross: \${grossSales}, Net: \${netSales}, Discount: \${discountCode} (\${discountAmount})\`);
    
  } catch (e) {
    console.error('⚠️ Error extracting financial data:', e.message);
  }
  
  // Safe date extraction
  let eventDate = new Date().toISOString();
  try {
    eventDate = eventData.startDate || new Date().toISOString();
  } catch (e) {
    eventDate = new Date().toISOString();
  }
  
  let orderDate = new Date().toISOString();
  try {
    orderDate = orderData.completedAt || orderData.createdAt || new Date().toISOString();
  } catch (e) {
    orderDate = new Date().toISOString();
  }
  
  const status = orderData.status || orderData.financialStatus || "completed";
  const ticketTypes = 'General Admission';
  const eventName = eventData.name || 'Unknown Event';
  
  // Create the Notion entry with CORRECT field mappings
  const notionEntry = {
    parent: {
      database_id: '1374745b-8cbe-804b-87a2-ec93b3385e01'
    },
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
        number: 1
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
    notionEntry.properties["Mobile"] = {
      phone_number: phone
    };
  }
  
  console.log(\`✅ Notion entry prepared for: \${customerName} (Gross: $\${grossSales}, Net: $\${netSales})\`);
  return [{ json: notionEntry }];
  
} catch (error) {
  console.error('❌ Error in transform:', error.message);
  return [];
}`
      },
      "id": "transform-for-notion",
      "name": "Transform for Notion",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1560, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.notion.com/v1/pages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer {{NOTION_API_KEY}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            },
            {
              "name": "Notion-Version",
              "value": "2022-06-28"
            }
          ]
        },
        "sendBody": true,
        "bodyContentType": "json",
        "jsonBody": "={{ $json }}",
        "options": {
          "response": {
            "response": {
              "neverError": true
            }
          }
        }
      },
      "id": "create-notion-entry",
      "name": "Create Notion Entry",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [1780, 300]
    },
    {
      "parameters": {
        "jsCode": `// Log the polling sync result
const response = $json;
const orderData = $('Filter New Orders').item($runIndex).json.orderData;

if (response.id) {
  console.log(\`✅ POLLING SYNC SUCCESS: \${orderData.firstName} \${orderData.lastName} → Notion\`);
  console.log(\`   Order ID: \${orderData._id}\`);
  console.log(\`   Notion ID: \${response.id}\`);
  
  return [{
    json: {
      success: true,
      notionId: response.id,
      orderId: orderData._id,
      customerName: \`\${orderData.firstName} \${orderData.lastName}\`,
      timestamp: new Date().toISOString(),
      source: 'polling-sync'
    }
  }];
} else {
  console.error(\`❌ POLLING SYNC FAILED: \${orderData.firstName} \${orderData.lastName}\`);
  console.error('Response:', JSON.stringify(response, null, 2));
  
  return [{
    json: {
      success: false,
      error: response,
      orderId: orderData._id,
      customerName: \`\${orderData.firstName} \${orderData.lastName}\`,
      timestamp: new Date().toISOString(),
      source: 'polling-sync'
    }
  }];
}`
      },
      "id": "log-sync-result",
      "name": "Log Sync Result",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2000, 300]
    }
  ],
  "connections": {
    "Every 3 Minutes": {
      "main": [
        [
          {
            "node": "Initialize Polling",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Initialize Polling": {
      "main": [
        [
          {
            "node": "Fetch Recent Events",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Recent Events": {
      "main": [
        [
          {
            "node": "Filter Recent Events",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Filter Recent Events": {
      "main": [
        [
          {
            "node": "Fetch Event Orders",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Event Orders": {
      "main": [
        [
          {
            "node": "Filter New Orders",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Filter New Orders": {
      "main": [
        [
          {
            "node": "Transform for Notion",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Transform for Notion": {
      "main": [
        [
          {
            "node": "Create Notion Entry",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Create Notion Entry": {
      "main": [
        [
          {
            "node": "Log Sync Result",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": {},
  "meta": {
    "instanceId": "e3a1c1c4e2a4f1b2c3d4e5f6a7b8c9d0"
  },
  "pinData": {},
  "versionId": "polling-notion-sync-v1",
  "triggerCount": 0,
  "tags": []
};

// Save the workflow
const outputPath = '/root/agents/scripts/polling_notion_sync_workflow.json';

try {
  fs.writeFileSync(outputPath, JSON.stringify([pollingWorkflow], null, 2));
  console.log('✅ Polling-based sync workflow created:', outputPath);
  
  console.log('\n🔧 Workflow features:');
  console.log('   - Runs every 3 minutes automatically');
  console.log('   - Polls Humanitix API for new orders');
  console.log('   - Tracks last sync time to avoid duplicates');
  console.log('   - Only processes recent/active events');
  console.log('   - Correct financial field mappings (gross sales, discounts)');
  console.log('   - Direct integration with Notion API');
  console.log('   - Smart filtering to minimize API calls');
  console.log();
  
  console.log('📋 How it works:');
  console.log('   1. Every 3 minutes: Trigger runs');
  console.log('   2. Track timing: Remember last sync time'); 
  console.log('   3. Get events: Fetch recent/active events only');
  console.log('   4. Get orders: Fetch orders for each event');
  console.log('   5. Filter new: Only process orders since last sync');
  console.log('   6. Transform: Apply correct financial field mappings');
  console.log('   7. Import: Create entries in Notion database');
  console.log('   8. Log results: Track success/failure');
  console.log();
  
  console.log('📈 Performance optimizations:');
  console.log('   - Only checks events from last 7 days to next 60 days');
  console.log('   - Uses timestamps to avoid duplicate imports');
  console.log('   - Processes only new orders per polling cycle');
  console.log('   - Batches API requests efficiently');
  
} catch (error) {
  console.error('❌ Error saving workflow:', error.message);
}

console.log('\n🎉 POLLING-BASED REAL-TIME SYNC CREATED!');