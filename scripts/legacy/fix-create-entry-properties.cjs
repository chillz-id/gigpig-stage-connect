const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function fixCreateEntryProperties() {
  try {
    console.log('Getting workflow to fix Create Entry properties...');
    
    const response = await axios.get(
      `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    let workflow = response.data;
    
    // Find the Create Entry node
    const createEntryNodeIndex = workflow.nodes.findIndex(node => node.name === 'Create Entry');
    
    if (createEntryNodeIndex !== -1) {
      console.log('Found Create Entry node, adding properties...');
      
      // Update the Create Entry node with all the property mappings
      workflow.nodes[createEntryNodeIndex].parameters = {
        "databaseId": "1374745b-8cbe-804b-87a2-ec93b3385e01",
        "simple": false,
        "properties": {
          "values": [
            {
              "key": "Order ID",
              "textValue": "={{ $json.order_id }}"
            },
            {
              "key": "Event Name", 
              "textValue": "={{ $json.event_name }}"
            },
            {
              "key": "Event Date",
              "dateValue": "={{ $json.event_date }}"
            },
            {
              "key": "Customer Name",
              "textValue": "={{ $json.customer_name }}"
            },
            {
              "key": "Customer Email", 
              "textValue": "={{ $json.customer_email }}"
            },
            {
              "key": "Customer Phone",
              "textValue": "={{ $json.customer_phone }}"
            },
            {
              "key": "Ticket Type",
              "textValue": "={{ $json.ticket_type }}"
            },
            {
              "key": "Ticket Quantity",
              "numberValue": "={{ $json.ticket_quantity }}"
            },
            {
              "key": "Total Amount",
              "numberValue": "={{ $json.total_amount }}"
            },
            {
              "key": "Currency",
              "textValue": "={{ $json.currency }}"
            },
            {
              "key": "Order Status",
              "textValue": "={{ $json.order_status }}"
            },
            {
              "key": "Order Date",
              "dateValue": "={{ $json.order_date }}"
            },
            {
              "key": "Event Venue",
              "textValue": "={{ $json.event_venue }}"
            },
            {
              "key": "Platform",
              "textValue": "={{ $json.platform }}"
            },
            {
              "key": "Raw Data",
              "textValue": "={{ JSON.stringify($json.raw_data) }}"
            },
            {
              "key": "Sync Date",
              "dateValue": "={{ $json.sync_date }}"
            }
          ]
        },
        "options": {}
      };
      
      console.log('Added all 16 property mappings to Create Entry node');
      
      // Create a minimal workflow update
      const updatePayload = {
        "id": workflow.id,
        "name": workflow.name,
        "nodes": workflow.nodes,
        "connections": workflow.connections,
        "settings": workflow.settings || {},
        "staticData": workflow.staticData || {},
        "tags": workflow.tags || [],
        "triggerCount": workflow.triggerCount || 0,
        "versionId": workflow.versionId
      };
      
      // Save the workflow
      const updateResponse = await axios.put(
        `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
        updatePayload,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Create Entry node updated successfully!');
      console.log('The node now has proper property mappings for all 16 fields');
      console.log('Orders should now be properly created in Notion when duplicates are not found');
      
    } else {
      console.log('❌ Create Entry node not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

fixCreateEntryProperties();