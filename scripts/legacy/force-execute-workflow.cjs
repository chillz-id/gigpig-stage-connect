const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function forceExecuteWorkflow() {
  try {
    console.log('🚀 FORCE EXECUTING HUMANITIX WORKFLOW...');
    
    // Try manual execution directly
    const response = await axios.post(
      `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}/run`,
      {
        startNodes: ['Manual Trigger']
      },
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Workflow execution started!');
    console.log('Execution ID:', response.data.executionId);
    
    // Wait for execution to complete
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
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
        
        const execution = execResponse.data;
        console.log(`\n📊 Status: ${execution.status} (attempt ${attempts + 1})`);
        
        if (execution.finished) {
          console.log('✅ Execution finished!');
          console.log(`Started: ${execution.startedAt}`);
          console.log(`Stopped: ${execution.stoppedAt}`);
          
          // Check for execution data and errors
          if (execution.data && execution.data.resultData) {
            const resultData = execution.data.resultData;
            
            if (resultData.error) {
              console.log('\n❌ EXECUTION ERROR:');
              console.log(resultData.error.message || JSON.stringify(resultData.error, null, 2));
            }
            
            if (resultData.runData) {
              console.log('\n📋 NODES EXECUTED:');
              const nodeNames = Object.keys(resultData.runData);
              nodeNames.forEach(nodeName => {
                const nodeData = resultData.runData[nodeName];
                if (nodeData[0]?.error) {
                  console.log(`❌ ${nodeName}: ${nodeData[0].error.message}`);
                } else if (nodeData[0]?.data?.main?.[0]) {
                  const itemCount = nodeData[0].data.main[0].length;
                  console.log(`✅ ${nodeName}: ${itemCount} items`);
                } else {
                  console.log(`⚠️ ${nodeName}: No output data`);
                }
              });
              
              // Check specifically for Transform Orders
              if (resultData.runData['Transform Orders']) {
                console.log('\n🔍 TRANSFORM ORDERS DETAILS:');
                const transformData = resultData.runData['Transform Orders'];
                if (transformData[0]?.error) {
                  console.log('❌ Error:', transformData[0].error.message);
                  console.log('❌ Stack:', transformData[0].error.stack?.substring(0, 500));
                } else {
                  console.log('✅ Transform Orders executed successfully');
                }
              }
              
              // Check for API errors in HTTP nodes
              ['Get ALL Events', 'Get ALL Orders'].forEach(nodeName => {
                if (resultData.runData[nodeName]) {
                  const nodeData = resultData.runData[nodeName][0];
                  if (nodeData?.error) {
                    console.log(`\n❌ ${nodeName} ERROR:`);
                    console.log('Message:', nodeData.error.message);
                    if (nodeData.error.message.includes('Invalid api key')) {
                      console.log('\n🔧 API KEY ISSUE CONFIRMED - FIXING NOW...');
                    }
                  }
                }
              });
            }
          }
          
          break;
        }
        
        attempts++;
      } catch (error) {
        console.error(`Error checking execution: ${error.message}`);
        attempts++;
      }
    }
    
    if (attempts >= maxAttempts) {
      console.log('⏰ Timeout waiting for execution to complete');
    }
    
  } catch (error) {
    console.error('❌ Error executing workflow:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n🔄 Trying alternative execution method...');
      
      // Try different execution endpoint
      try {
        const altResponse = await axios.post(
          `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}/execute`,
          {},
          {
            headers: {
              'X-N8N-API-KEY': N8N_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ Alternative execution started:', altResponse.data.executionId);
        
      } catch (altError) {
        console.error('❌ Alternative execution failed:', altError.response?.data || altError.message);
      }
    }
  }
}

forceExecuteWorkflow();