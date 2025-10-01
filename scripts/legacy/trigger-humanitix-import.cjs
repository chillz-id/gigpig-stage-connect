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
    console.log('Triggering Humanitix historical import workflow...');
    
    const response = await axios.post(
      `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}/execute`,
      {},
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Workflow triggered successfully!');
    console.log('Execution ID:', response.data.executionId);
    
    // Wait a moment then check execution status
    setTimeout(async () => {
      try {
        const execResponse = await axios.get(
          `${N8N_BASE_URL}/api/v1/executions/${response.data.executionId}`,
          {
            headers: {
              'X-N8N-API-KEY': N8N_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('\n=== EXECUTION STATUS ===');
        console.log('Status:', execResponse.data.status);
        console.log('Started:', execResponse.data.startedAt);
        console.log('Finished:', execResponse.data.stoppedAt);
        
        // Check for debug output in the execution data
        if (execResponse.data.data && execResponse.data.data.resultData) {
          console.log('\n=== LOOKING FOR DEBUG OUTPUT ===');
          const resultData = execResponse.data.data.resultData;
          
          // Look through all node outputs for our debug
          Object.keys(resultData.runData || {}).forEach(nodeName => {
            const nodeData = resultData.runData[nodeName];
            if (nodeData && nodeData[0] && nodeData[0].data) {
              console.log(`\n--- ${nodeName} ---`);
              console.log('Data:', JSON.stringify(nodeData[0].data, null, 2));
            }
          });
        }
        
      } catch (error) {
        console.error('Error checking execution:', error.response?.data || error.message);
      }
    }, 5000);
    
  } catch (error) {
    console.error('Error triggering workflow:', error.response?.data || error.message);
  }
}

triggerWorkflow();