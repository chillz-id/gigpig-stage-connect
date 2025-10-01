const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function updateWorkflowMinimal() {
  try {
    console.log('Getting workflow...');
    
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
      console.log('Updating Create Entry node...');
      
      // Update only the parameters of the Create Entry node
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
              "key": "Customer Name",
              "textValue": "={{ $json.customer_name }}"
            },
            {
              "key": "Customer Email", 
              "textValue": "={{ $json.customer_email }}"
            },
            {
              "key": "Total Amount",
              "numberValue": "={{ $json.total_amount }}"
            },
            {
              "key": "Platform",
              "textValue": "={{ $json.platform }}"
            }
          ]
        },
        "options": {}
      };
      
      // Create the most minimal update possible - only essential fields
      const minimalUpdate = {
        "name": workflow.name,
        "nodes": workflow.nodes,
        "connections": workflow.connections
      };
      
      console.log('Sending minimal update...');
      
      const updateResponse = await axios.put(
        `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
        minimalUpdate,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Workflow updated successfully!');
      console.log('Create Entry node now has property mappings');
      
    } else {
      console.log('❌ Create Entry node not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Response:', error.response?.status, error.response?.statusText);
  }
}

updateWorkflowMinimal();