const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function updateIFNode() {
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
    
    console.log('Found workflow:', workflow.name);
    
    // Find the IF New Order node
    const ifNodeIndex = workflow.nodes.findIndex(node => node.name === 'IF New Order');
    
    if (ifNodeIndex !== -1) {
      console.log('Found IF New Order node at index:', ifNodeIndex);
      console.log('Current node:', JSON.stringify(workflow.nodes[ifNodeIndex], null, 2));
      
      // Update only the IF node parameters while keeping everything else
      workflow.nodes[ifNodeIndex].parameters = {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: "",
            typeValidation: "strict"
          },
          resource: "boolean",
          rules: {
            rules: [
              {
                leftValue: "={{ $input.all().length }}",
                rightValue: 0,
                operation: "equal"
              }
            ],
            combinator: "and"
          }
        },
        options: {}
      };
      
      console.log('Updated IF node parameters');
      
      // Create a clean workflow object with only the necessary fields
      const cleanWorkflow = {
        id: workflow.id,
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings || {},
        staticData: workflow.staticData || {},
        tags: workflow.tags || [],
        triggerCount: workflow.triggerCount || 0,
        versionId: workflow.versionId
      };
      
      // Save the workflow
      const updateResponse = await axios.put(
        `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
        cleanWorkflow,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Workflow updated successfully!');
      console.log('The IF condition now properly checks if no duplicates were found');
      console.log('Condition: $input.all().length === 0');
      
    } else {
      console.log('IF New Order node not found');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      console.error('Detailed error:', error.response.data);
    }
  }
}

updateIFNode();