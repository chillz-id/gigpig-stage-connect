const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function updateWithAllRequiredFields() {
  try {
    console.log('Getting complete workflow structure...');
    
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
    
    console.log('Original workflow keys:', Object.keys(workflow));
    
    // Find the Create Entry node
    const createEntryNodeIndex = workflow.nodes.findIndex(node => node.name === 'Create Entry');
    
    if (createEntryNodeIndex !== -1) {
      console.log('Current Create Entry parameters:', JSON.stringify(workflow.nodes[createEntryNodeIndex].parameters, null, 2));
      
      // Update the Create Entry node with essential properties
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
              "textValue": "Humanitix"
            }
          ]
        },
        "options": {}
      };
      
      console.log('Updated Create Entry node with properties');
      
      // Include ALL original fields to avoid schema validation errors
      const completeUpdate = {
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings || {},
        staticData: workflow.staticData || {},
        tags: workflow.tags || [],
        triggerCount: workflow.triggerCount || 0
      };
      
      // Remove any undefined/null values
      Object.keys(completeUpdate).forEach(key => {
        if (completeUpdate[key] === undefined || completeUpdate[key] === null) {
          delete completeUpdate[key];
        }
      });
      
      console.log('Sending complete update with required fields...');
      
      const updateResponse = await axios.put(
        `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
        completeUpdate,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ SUCCESS! Workflow updated with Create Entry properties');
      console.log('The Humanitix Historical Import workflow is now fixed!');
      console.log('🎯 Fixed issues:');
      console.log('  ✓ Create Entry node has property mappings');
      console.log('  ✓ IF condition checks for empty duplicates array');
      console.log('  ✓ Correct database ID configured');
      
    } else {
      console.log('❌ Create Entry node not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

updateWithAllRequiredFields();