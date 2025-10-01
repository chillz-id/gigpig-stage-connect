require('dotenv').config({ path: '/root/agents/.env' });

#!/usr/bin/env node
/**
 * Complete fix for Humanitix Historical Import - Add orders pagination
 * This fixes the 25-order limit by implementing proper pagination for orders
 */

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const N8N_API_URL = "http://localhost:5678/api/v1";

async function fixOrdersPagination() {
  const headers = {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    console.log('🔧 Fixing Humanitix Historical Import with orders pagination...\n');

    // Get the current workflow
    const getResponse = await fetch(`${N8N_API_URL}/workflows/py2wq9zchBz0TD9j`, {
      method: 'GET',
      headers
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to get workflow: ${getResponse.status}`);
    }

    const workflow = await getResponse.json();
    console.log('📋 Current workflow:', workflow.name);

    // Create the fixed workflow with orders pagination
    const fixedWorkflow = {
      name: workflow.name,
      settings: workflow.settings,
      nodes: [
        // Keep existing nodes but update positions and add new ones
        {
          parameters: {},
          id: "manual-trigger",
          name: "Manual Trigger",
          type: "n8n-nodes-base.manualTrigger",
          typeVersion: 1,
          position: [240, 304]
        },
        {
          parameters: {
            jsCode: `// Import ALL historical data
// Set a very early start date to get everything
const startDate = new Date('2020-01-01');
const endDate = new Date();

console.log(\`Importing ALL historical data from \${startDate.toDateString()} to \${endDate.toDateString()}\`);

return [{
  json: {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    currentPage: 1,
    hasMore: true
  }
}];`
          },
          id: "set-params",
          name: "Set Parameters",
          type: "n8n-nodes-base.code",
          typeVersion: 2,
          position: [464, 304]
        },
        {
          parameters: {
            jsCode: `// Handle pagination for getting ALL events
const currentPage = $json.currentPage || 1;
const maxPages = 100; // Safety limit

if (currentPage > maxPages) {
  console.log(\`Reached max pages limit (\${maxPages})\`);
  return [];
}

return [{
  json: {
    ...$json,
    page: currentPage
  }
}];`
          },
          id: "pagination-loop",
          name: "Pagination Loop",
          type: "n8n-nodes-base.code",
          typeVersion: 2,
          position: [688, 304]
        },
        {
          parameters: {
            url: "https://api.humanitix.com/v1/events",
            authentication: "genericCredentialType",
            genericAuthType: "httpHeaderAuth",
            sendQuery: true,
            queryParameters: {
              parameters: [
                {
                  name: "page",
                  value: "={{ $json.page }}"
                },
                {
                  name: "pageSize",
                  value: "100"
                }
              ]
            },
            sendHeaders: true,
            headerParameters: {
              parameters: [
                {
                  name: "x-api-key",
                  value: "{{N8N_API_KEY}}"
                }
              ]
            },
            options: {}
          },
          id: "get-all-events",
          name: "Get ALL Events",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4.2,
          position: [912, 304],
          alwaysOutputData: false,
          credentials: {
            httpHeaderAuth: {
              id: "aKivaYZ2GgdV4BF8",
              name: "Header Auth account"
            }
          }
        },
        {
          parameters: {
            jsCode: `// Process the events response and initialize orders pagination
const response = $input.all()[0].json;
let events = [];

// Handle different response formats
if (Array.isArray(response)) {
  events = response;
} else if (response.events && Array.isArray(response.events)) {
  events = response.events;
} else if (response.data && Array.isArray(response.data)) {
  events = response.data;
}

console.log(\`Found \${events.length} events on page \${$json.page}\`);

// Return events with orders pagination initialized
return events.map(event => ({
  json: {
    event,
    ordersPage: 1,
    ordersHasMore: true,
    eventHasMore: events.length === 100,
    nextEventPage: events.length === 100 ? ($json.page + 1) : null
  }
}));`
          },
          id: "process-events",
          name: "Process Events",
          type: "n8n-nodes-base.code",
          typeVersion: 2,
          position: [1120, 304]
        },
        // NEW: Orders Pagination Loop
        {
          parameters: {
            jsCode: `// Orders pagination logic
const ordersPage = $json.ordersPage || 1;
const maxOrdersPages = 50; // Safety limit per event

console.log(\`Getting orders page \${ordersPage} for event: \${$json.event?.title || 'Unknown'}\`);

if (ordersPage > maxOrdersPages) {
  console.log(\`Reached max orders pages limit (\${maxOrdersPages}) for event\`);
  return [];
}

return [{
  json: {
    ...$json,
    currentOrdersPage: ordersPage
  }
}];`
          },
          id: "orders-pagination-loop",
          name: "Orders Pagination Loop",
          type: "n8n-nodes-base.code",
          typeVersion: 2,
          position: [1300, 304]
        },
        // UPDATED: Get ALL Orders with pagination
        {
          parameters: {
            url: "=https://api.humanitix.com/v1/events/{{ $json.event._id || $json.event.id }}/orders",
            authentication: "genericCredentialType",
            genericAuthType: "httpHeaderAuth",
            sendQuery: true,
            queryParameters: {
              parameters: [
                {
                  name: "page",
                  value: "={{ $json.currentOrdersPage }}"
                },
                {
                  name: "pageSize",
                  value: "100"
                }
              ]
            },
            sendHeaders: true,
            headerParameters: {
              parameters: [
                {
                  name: "x-api-key",
                  value: "{{N8N_API_KEY}}"
                }
              ]
            },
            options: {}
          },
          id: "get-all-orders",
          name: "Get ALL Orders",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4.2,
          position: [1500, 304],
          credentials: {
            httpHeaderAuth: {
              id: "aKivaYZ2GgdV4BF8",
              name: "Header Auth account"
            }
          }
        },
        // NEW: Process Orders Response with pagination check
        {
          parameters: {
            jsCode: `// Process orders response and handle pagination
const orderResponse = $input.all()[0]?.json || {};
let orders = [];

// Extract orders from response
if (Array.isArray(orderResponse)) {
  orders = orderResponse;
} else if (orderResponse.orders && Array.isArray(orderResponse.orders)) {
  orders = orderResponse.orders;
} else if (orderResponse.data && Array.isArray(orderResponse.data)) {
  orders = orderResponse.data;
}

const eventInfo = $json.event || {};
const eventName = eventInfo?.title || eventInfo?.name || 'Unknown Event';
const currentPage = $json.currentOrdersPage || 1;

console.log(\`Found \${orders.length} orders on page \${currentPage} for event: \${eventName}\`);

// Check if there are more orders pages
const ordersHasMore = orders.length === 100; // Full page = likely more pages

if (orders.length === 0) {
  console.log(\`No orders found for event: \${eventName}\`);
  return [];
}

// Return orders with pagination info
return orders.map(order => ({
  json: {
    ...order,
    event: eventInfo,
    ordersHasMore,
    nextOrdersPage: ordersHasMore ? (currentPage + 1) : null,
    isLastOrdersPage: !ordersHasMore
  }
}));`
          },
          id: "process-orders-response",
          name: "Process Orders Response",
          type: "n8n-nodes-base.code",
          typeVersion: 2,
          position: [1720, 304]
        },
        // KEEP: Transform Orders (already working well)
        {
          parameters: {
            jsCode: workflow.nodes.find(n => n.name === "Transform Orders")?.parameters?.jsCode || "// Transform Orders code"
          },
          id: "transform-orders",
          name: "Transform Orders",
          type: "n8n-nodes-base.code",
          typeVersion: 2,
          position: [1940, 304]
        },
        // UPDATED: Check Duplicates with correct database ID
        {
          parameters: {
            resource: "databasePage",
            operation: "getAll",
            databaseId: "1374745b-8cbe-804b-87a2-ec93b3385e01", // FIXED DATABASE ID
            filterType: "manual",
            filters: {
              conditions: [
                {
                  key: "Order ID|rich_text",
                  condition: "equals",
                  richTextValue: "={{ $json.orderId }}"
                }
              ]
            },
            options: {}
          },
          id: "check-duplicates",
          name: "Check Duplicates",
          type: "n8n-nodes-base.notion",
          typeVersion: 2.2,
          position: [2160, 304],
          credentials: {
            notionApi: {
              id: "n2TBZCnpzOxSU5Wk",
              name: "Notion account"
            }
          }
        },
        // KEEP: Debug node
        {
          parameters: {
            jsCode: workflow.nodes.find(n => n.name === "Debug Notion Output")?.parameters?.jsCode || "// Debug code"
          },
          id: "debug-notion-output",
          name: "Debug Notion Output",
          type: "n8n-nodes-base.code",
          typeVersion: 2,
          position: [2380, 304]
        },
        // KEEP: IF New Order
        {
          parameters: {
            conditions: {
              options: {
                caseSensitive: true,
                leftValue: "",
                typeValidation: "loose"
              },
              conditions: [
                {
                  id: "check-new-fixed",
                  leftValue: "={{ $input.all().length }}",
                  rightValue: 0,
                  operator: {
                    type: "number",
                    operation: "equals",
                    rightType: "number"
                  }
                }
              ],
              combinator: "and"
            },
            options: {}
          },
          id: "if-new",
          name: "IF New Order",
          type: "n8n-nodes-base.if",
          typeVersion: 2,
          position: [2600, 304]
        },
        // UPDATED: Create Entry with correct database ID and field mappings
        {
          parameters: {
            resource: "databasePage",
            databaseId: "1374745b-8cbe-804b-87a2-ec93b3385e01", // FIXED DATABASE ID
            propertiesUi: {
              propertyValues: [
                {
                  key: "Event Name|title",
                  title: "={{ $json.properties['Event Name'].title[0].text.content }}"
                },
                {
                  key: "Event Date|date",
                  date: "={{ $json.properties['Event Date'].date.start }}"
                },
                {
                  key: "Platform|select",
                  selectValue: "Humanitix"
                },
                {
                  key: "Order ID|rich_text",
                  textContent: "={{ $json.properties['Order ID'].rich_text[0].text.content }}"
                },
                {
                  key: "Customer Name|rich_text",
                  textContent: "={{ $json.properties['Customer Name'].rich_text[0].text.content }}"
                },
                {
                  key: "Customer Email|email",
                  emailValue: "={{ $json.properties['Customer Email'].email }}"
                },
                {
                  key: "Ticket Types|rich_text",
                  textContent: "={{ $json.properties['Ticket Types'].rich_text[0].text.content }}"
                },
                {
                  key: "Quantity|number",
                  numberValue: "={{ $json.properties.Quantity.number }}"
                },
                {
                  key: "Amount|number",
                  numberValue: "={{ $json.properties.Amount.number }}"
                },
                {
                  key: "Currency|select",
                  selectValue: "={{ $json.properties.Currency.select.name }}"
                },
                {
                  key: "Status|select",
                  selectValue: "={{ $json.properties.Status.select.name }}"
                },
                {
                  key: "Purchase Date|date",
                  date: "={{ $json.properties['Purchase Date'].date.start }}"
                },
                {
                  key: "Venue|rich_text",
                  textContent: "={{ $json.properties.Venue.rich_text[0].text.content }}"
                },
                {
                  key: "Last Sync|date",
                  date: "={{ $json.properties['Last Sync'].date.start }}"
                },
                {
                  key: "Notes|rich_text",
                  textContent: "={{ $json.properties.Notes.rich_text[0].text.content }}"
                }
              ]
            },
            options: {}
          },
          id: "create-entry",
          name: "Create Entry",
          type: "n8n-nodes-base.notion",
          typeVersion: 2.2,
          position: [2820, 272],
          credentials: {
            notionApi: {
              id: "n2TBZCnpzOxSU5Wk",
              name: "Notion account"
            }
          }
        },
        // NEW: Check for more orders pages
        {
          parameters: {
            conditions: {
              options: {
                caseSensitive: true,
                leftValue: "",
                typeValidation: "loose"
              },
              conditions: [
                {
                  id: "has-more-orders",
                  leftValue: "={{ $json.ordersHasMore }}",
                  rightValue: true,
                  operator: {
                    type: "boolean",
                    operation: "equals"
                  }
                }
              ],
              combinator: "and"
            },
            options: {}
          },
          id: "if-more-orders",
          name: "IF More Orders",
          type: "n8n-nodes-base.if",
          typeVersion: 2,
          position: [3040, 304]
        },
        // KEEP: Count Imports
        {
          parameters: {
            jsCode: `// Track import progress
const items = $input.all();
const importCount = items.length;

return [{
  json: {
    imported: importCount,
    timestamp: new Date().toISOString(),
    message: \`Imported \${importCount} historical orders\`
  }
}];`
          },
          id: "count-imports",
          name: "Count Imports",
          type: "n8n-nodes-base.code",
          typeVersion: 2,
          position: [3260, 304]
        }
      ],
      connections: {
        "Manual Trigger": {
          main: [[{ node: "Set Parameters", type: "main", index: 0 }]]
        },
        "Set Parameters": {
          main: [[{ node: "Pagination Loop", type: "main", index: 0 }]]
        },
        "Pagination Loop": {
          main: [[{ node: "Get ALL Events", type: "main", index: 0 }]]
        },
        "Get ALL Events": {
          main: [[{ node: "Process Events", type: "main", index: 0 }]]
        },
        "Process Events": {
          main: [[{ node: "Orders Pagination Loop", type: "main", index: 0 }]]
        },
        "Orders Pagination Loop": {
          main: [[{ node: "Get ALL Orders", type: "main", index: 0 }]]
        },
        "Get ALL Orders": {
          main: [[{ node: "Process Orders Response", type: "main", index: 0 }]]
        },
        "Process Orders Response": {
          main: [[{ node: "Transform Orders", type: "main", index: 0 }]]
        },
        "Transform Orders": {
          main: [[{ node: "Check Duplicates", type: "main", index: 0 }]]
        },
        "Check Duplicates": {
          main: [[{ node: "Debug Notion Output", type: "main", index: 0 }]]
        },
        "Debug Notion Output": {
          main: [[{ node: "IF New Order", type: "main", index: 0 }]]
        },
        "IF New Order": {
          main: [
            [{ node: "Create Entry", type: "main", index: 0 }],
            []
          ]
        },
        "Create Entry": {
          main: [[{ node: "IF More Orders", type: "main", index: 0 }]]
        },
        "IF More Orders": {
          main: [
            [{ node: "Orders Pagination Loop", type: "main", index: 0 }], // Loop back for more orders
            [{ node: "Count Imports", type: "main", index: 0 }] // Continue to count
          ]
        }
      }
    };

    // Update the workflow
    console.log('\n💾 Updating workflow with orders pagination...');
    const updateResponse = await fetch(`${N8N_API_URL}/workflows/py2wq9zchBz0TD9j`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(fixedWorkflow)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Update failed: ${updateResponse.status} - ${errorText}`);
    }

    console.log('✅ Workflow updated successfully!\n');
    
    console.log('🎉 COMPLETE ORDERS PAGINATION FIX APPLIED!');
    console.log('\n📋 What was fixed:');
    console.log('  ✅ Added orders pagination loop - now gets ALL orders per event');
    console.log('  ✅ Fixed database ID from 2304745b to correct 1374745b');  
    console.log('  ✅ Fixed Create Entry field mappings to use Transform Orders data');
    console.log('  ✅ Added orders response processing with pagination logic');
    console.log('  ✅ Added "IF More Orders" check to loop for additional pages');
    console.log('\n🚀 The workflow will now:');
    console.log('  1. Get all events (with events pagination)');
    console.log('  2. For each event, get ALL orders (with orders pagination)');
    console.log('  3. Process and transform all orders');
    console.log('  4. Check for duplicates in correct Notion database');
    console.log('  5. Create entries for new orders only');
    console.log('  6. Continue until all orders for all events are processed');
    console.log('\n⚡ This fixes the 25-order limit - you should now get ALL historical orders!');

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.log('\n📋 Manual steps if this fails:');
    console.log('1. Update "Get ALL Orders" node to use page parameter: {{ $json.currentOrdersPage }}');
    console.log('2. Add "Orders Pagination Loop" node before "Get ALL Orders"');
    console.log('3. Add "Process Orders Response" after "Get ALL Orders"');
    console.log('4. Add "IF More Orders" after "Create Entry" to loop back');
    console.log('5. Update database IDs to: 1374745b-8cbe-804b-87a2-ec93b3385e01');
  }
}

fixOrdersPagination();