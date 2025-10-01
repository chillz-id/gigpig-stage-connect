const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function triggerWorkflow() {
  try {
    console.log('Triggering workflow execution...');
    
    // Try different endpoint format
    const response = await axios.post(
      `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}/trigger`,
      {},
      {
        headers: {
          'Authorization': `Bearer process.env.N8N_API_KEY`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Success!', response.data);
    
  } catch (error) {
    console.error('Error with /trigger endpoint:', error.response?.data || error.message);
    
    // Try the original endpoint with Bearer auth
    try {
      console.log('Trying execute endpoint with Bearer auth...');
      
      const response2 = await axios.post(
        `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}/execute`,
        {},
        {
          headers: {
            'Authorization': `Bearer process.env.N8N_API_KEY`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Success with execute!', response2.data);
      
    } catch (error2) {
      console.error('Error with execute endpoint:', error2.response?.data || error2.message);
      
      // Try manual execution endpoint
      try {
        console.log('Trying manual execution...');
        
        const response3 = await axios.post(
          `${N8N_BASE_URL}/api/v1/executions`,
          {
            workflowId: WORKFLOW_ID,
            triggerNode: 'Manual Trigger'
          },
          {
            headers: {
              'Authorization': `Bearer process.env.N8N_API_KEY`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Success with manual execution!', response3.data);
        
      } catch (error3) {
        console.error('Error with manual execution:', error3.response?.data || error3.message);
      }
    }
  }
}

triggerWorkflow();