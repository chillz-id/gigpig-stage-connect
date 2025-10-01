const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function fixIFCondition() {
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
    const ifNode = workflow.nodes.find(node => node.name === 'IF New Order');
    
    if (ifNode) {
      console.log('Found IF New Order node');
      console.log('Current condition:', ifNode.parameters?.conditions?.options?.caseSensitive);
      console.log('Current rules:', JSON.stringify(ifNode.parameters?.conditions?.options?.rules, null, 2));
      
      // Based on N8N Notion node behavior, when no records are found, it returns an empty array
      // So we need to check if the input from Check Duplicates is an empty array
      // The correct condition should be: $input.all().length === 0
      
      ifNode.parameters = {
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
      
      console.log('Updated IF condition to check if $input.all().length === 0');
      
      // Save the workflow
      const updateResponse = await axios.put(
        `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
        workflow,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Workflow updated successfully!');
      console.log('The IF condition now checks if no duplicates were found (empty array from Notion)');
      
    } else {
      console.log('IF New Order node not found');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

fixIFCondition();