const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function activateAndTriggerWorkflow() {
  try {
    // First activate the workflow
    console.log('Activating Humanitix Historical Import workflow...');
    
    const activateResponse = await axios.patch(
      `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
      { active: true },
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Workflow activated successfully!');
    
    // Wait a moment then trigger manually
    setTimeout(async () => {
      try {
        console.log('Triggering workflow manually...');
        
        const triggerResponse = await axios.post(
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
        console.log('Execution ID:', triggerResponse.data.executionId);
        
        // Wait for execution to complete
        setTimeout(async () => {
          try {
            const execResponse = await axios.get(
              `${N8N_BASE_URL}/api/v1/executions/${triggerResponse.data.executionId}`,
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
            
            // Look for debug output
            if (execResponse.data.data && execResponse.data.data.resultData) {
              console.log('\n=== CHECKING FOR DEBUG OUTPUT ===');
              const resultData = execResponse.data.data.resultData;
              
              // Specifically look for Debug Notion Output node
              if (resultData.runData && resultData.runData['Debug Notion Output']) {
                console.log('\n=== DEBUG NOTION OUTPUT FOUND ===');
                const debugData = resultData.runData['Debug Notion Output'];
                console.log('Debug output:', JSON.stringify(debugData, null, 2));
              }
              
              // Also check IF New Order node to see what it received
              if (resultData.runData && resultData.runData['IF New Order']) {
                console.log('\n=== IF NEW ORDER NODE ===');
                const ifData = resultData.runData['IF New Order'];
                console.log('IF node data:', JSON.stringify(ifData, null, 2));
              }
              
              // Check Check Duplicates node output
              if (resultData.runData && resultData.runData['Check Duplicates']) {
                console.log('\n=== CHECK DUPLICATES OUTPUT ===');
                const checkData = resultData.runData['Check Duplicates'];
                console.log('Check duplicates data:', JSON.stringify(checkData, null, 2));
              }
            }
            
          } catch (error) {
            console.error('Error checking execution:', error.response?.data || error.message);
          }
        }, 10000); // Wait 10 seconds for execution
        
      } catch (error) {
        console.error('Error triggering workflow:', error.response?.data || error.message);
      }
    }, 2000); // Wait 2 seconds after activation
    
  } catch (error) {
    console.error('Error activating workflow:', error.response?.data || error.message);
  }
}

activateAndTriggerWorkflow();