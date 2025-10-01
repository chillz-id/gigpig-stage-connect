const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function activateWorkflow() {
  try {
    console.log('Getting workflow data first...');
    
    // First get the workflow
    const getResponse = await axios.get(
      `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Current workflow active status:', getResponse.data.active);
    
    if (!getResponse.data.active) {
      console.log('Activating workflow...');
      
      // Update workflow with active: true
      const updatedWorkflow = {
        ...getResponse.data,
        active: true
      };
      
      const updateResponse = await axios.put(
        `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
        updatedWorkflow,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Workflow activated successfully!');
    } else {
      console.log('Workflow is already active');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

activateWorkflow();