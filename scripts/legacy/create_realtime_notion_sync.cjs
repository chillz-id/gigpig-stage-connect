const fs = require('fs');
const { injectCredentials } = require('./utils/credentials-helper.cjs');

require('dotenv').config({ path: '/root/agents/.env' });


console.log('🔄 CREATING REAL-TIME HUMANITIX TO NOTION SYNC WORKFLOW');
console.log('======================================================');

// Create the real-time webhook workflow that syncs directly to Notion
const realtimeWorkflow = {
  "createdAt": new Date().toISOString(),
  "updatedAt": new Date().toISOString(),
  "id": "RealTimeNotionSync",
  "name": "Humanitix Real-Time Sync to Notion",
  "active": true,
  "isArchived": false,
  "nodes": [
    {
      "parameters": {
        "path": "humanitix-webhook",
        "options": {}
      },
      "id": "webhook-trigger",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300],
      "webhookId": "humanitix-realtime-sync"
    },
    {
      "parameters": {
        "jsCode": `// Log webhook data for debugging
const webhookData = $json;
console.log('🎣 Webhook received:', JSON.stringify(webhookData, null, 2));

// Extract order information from webhook
let orderData, eventData;

if (webhookData.order && webhookData.event) {
  // Direct webhook format
  orderData = webhookData.order;
  eventData = webhookData.event;
} else if (webhookData.data) {
  // Nested format
  orderData = webhookData.data.order || webhookData.data;
  eventData = webhookData.data.event;
} else {
  // Raw format
  orderData = webhookData;
  eventData = null;
}

console.log('📦 Processed order data:', orderData?._id || 'No order ID');
console.log('🎪 Event data available:', !!eventData);

// If we don't have event data, we'll need to fetch it
if (!eventData && orderData?.eventId) {
  console.log('🔍 Need to fetch event data for:', orderData.eventId);
  return [{
    json: {
      needsEventFetch: true,
      orderData: orderData,
      eventId: orderData.eventId
    }
  }];
} else {
  return [{
    json: {
      needsEventFetch: false,
      orderData: orderData,
      eventData: eventData
    }
  }];
}`
      },
      "id": "process-webhook",
      "name": "Process Webhook Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.needsEventFetch }}",
              "value2": true
            }
          ]
        }
      },
      "id": "needs-event-fetch",
      "name": "Needs Event Fetch?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "=https://api.humanitix.com/v1/events/{{ $json.eventId }}",
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
      "id": "fetch-event-data",
      "name": "Fetch Event Data",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [900, 200]
    },
    {
      "parameters": {
        "jsCode": `// Combine fetched event data with order data
const eventResponse = $input.first().json;
const orderData = $('Process Webhook Data').first().json.orderData;

console.log('🎪 Fetched event:', eventResponse?.name);

return [{
  json: {
    orderData: orderData,
    eventData: eventResponse
  }
}];`
      },
      "id": "combine-event-order",
      "name": "Combine Event & Order",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1120, 200]
    },
    {
      "parameters": {
        "jsCode": `// Transform order data for Notion with CORRECT FINANCIAL FIELDS
const orderData = $json.orderData;
const eventData = $json.eventData;

console.log('🔄 Transforming order for Notion:', orderData?._id);

try {
  const orderId = orderData?._id || 'unknown-' + Date.now();
  const eventId = orderData?.eventId || eventData?._id || 'unknown-event';
  
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
  
  // CORRECT FINANCIAL FIELDS - Use proper data sources
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
    
    console.log(\`💰 Financial - Gross: \${grossSales}, Net: \${netSales}, Discount: \${discountCode} (\${discountAmount})\`);
    
  } catch (e) {
    console.error('⚠️ Error extracting financial data:', e.message);
  }
  
  const totalQuantity = 1;
  
  // Safe date extraction
  let eventDate = new Date().toISOString();
  try {
    eventDate = eventData?.startDate || eventData?.date || new Date().toISOString();
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
  const eventName = eventData?.name || eventData?.title || 'Unknown Event';
  
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
      "position": [1340, 300]
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
      "position": [1560, 300]
    },
    {
      "parameters": {
        "jsCode": `// Log the result
const response = $json;

if (response.id) {
  console.log('✅ Successfully created Notion entry:', response.id);
  return [{
    json: {
      success: true,
      notionId: response.id,
      timestamp: new Date().toISOString(),
      message: 'Order successfully synced to Notion'
    }
  }];
} else {
  console.error('❌ Failed to create Notion entry:', JSON.stringify(response, null, 2));
  return [{
    json: {
      success: false,
      error: response,
      timestamp: new Date().toISOString(),
      message: 'Failed to sync order to Notion'
    }
  }];
}`
      },
      "id": "log-result",
      "name": "Log Result",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1780, 300]
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [
        [
          {
            "node": "Process Webhook Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Process Webhook Data": {
      "main": [
        [
          {
            "node": "Needs Event Fetch?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Needs Event Fetch?": {
      "main": [
        [
          {
            "node": "Fetch Event Data",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Transform for Notion",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Event Data": {
      "main": [
        [
          {
            "node": "Combine Event & Order",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Combine Event & Order": {
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
            "node": "Log Result",
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
  "versionId": "realtime-notion-sync-v1",
  "triggerCount": 0,
  "tags": []
};

// Save the workflow
const outputPath = '/root/agents/scripts/realtime_notion_sync_workflow.json';

try {
  fs.writeFileSync(outputPath, JSON.stringify([realtimeWorkflow], null, 2));
  console.log('✅ Real-time Notion sync workflow created:', outputPath);
  
  console.log('\n🔧 Workflow features:');
  console.log('   - Webhook trigger for real-time sync');
  console.log('   - Handles both direct webhooks and nested data formats');
  console.log('   - Fetches event data if not provided in webhook');
  console.log('   - Correct financial field mappings (gross sales, discounts)');
  console.log('   - Direct integration with Notion API');
  console.log('   - Comprehensive error handling and logging');
  
  console.log('\n📋 Next steps:');
  console.log('   1. Import this workflow to N8N');
  console.log('   2. Activate the workflow');
  console.log('   3. Configure Humanitix webhook URL');
  console.log('   4. Test with sample webhook data');
  
} catch (error) {
  console.error('❌ Error saving workflow:', error.message);
}

console.log('\n🎉 REAL-TIME NOTION SYNC WORKFLOW CREATED!');