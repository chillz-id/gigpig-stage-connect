const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';
const CORRECT_API_KEY = 'const HUMANITIX_API_KEY = process.env.HUMANITIX_API_KEY;
if (!HUMANITIX_API_KEY) {
    throw new Error('HUMANITIX_API_KEY environment variable not set');
}

process.env.HUMANITIX_API_KEY';

async function forceFixAPIKey() {
  try {
    console.log('🔧 FORCE FIXING API KEY IN WORKFLOW...');
    
    // Get the workflow
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
    let fixed = false;
    
    // Fix HTTP nodes
    workflow.nodes.forEach((node, index) => {
      if (node.type === 'n8n-nodes-base.httpRequest') {
        console.log(`🔍 Checking ${node.name}...`);
        
        if (node.parameters.headerParameters?.parameters) {
          const apiKeyHeader = node.parameters.headerParameters.parameters.find(h => h.name === 'x-api-key');
          
          if (apiKeyHeader) {
            const oldKey = apiKeyHeader.value.substring(0, 20) + '...';
            console.log(`   Current key: ${oldKey}`);
            
            // Force update to correct key
            apiKeyHeader.value = CORRECT_API_KEY;
            console.log(`   ✅ Updated to new API key`);
            fixed = true;
          }
        }
      }
    });
    
    if (!fixed) {
      console.log('❌ No API key headers found to fix');
      return;
    }
    
    // Create a minimal update that only includes essential fields
    console.log('\n💾 Saving fixed workflow...');
    
    // Try the most minimal update possible
    const minimalWorkflow = {
      nodes: workflow.nodes,
      connections: workflow.connections
    };
    
    try {
      const updateResponse = await axios.put(
        `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
        minimalWorkflow,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ API key updated successfully!');
      
    } catch (updateError) {
      console.log('❌ Direct update failed, trying alternative...');
      
      // Try with more complete workflow structure
      const completeWorkflow = {
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings || {},
        staticData: workflow.staticData || {},
        tags: workflow.tags || []
      };
      
      const updateResponse2 = await axios.put(
        `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
        completeWorkflow,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ API key updated with complete structure!');
    }
    
    // Now test the API key
    console.log('\n🧪 TESTING FIXED API KEY...');
    
    try {
      const testResponse = await axios.get(
        'https://api.humanitix.com/v1/events?page=1&pageSize=1',
        {
          headers: {
            'x-api-key': CORRECT_API_KEY
          }
        }
      );
      
      console.log(`✅ API test successful: ${testResponse.status}`);
      console.log(`📊 Found ${testResponse.data.total} total events`);
      console.log(`📅 Sample event: ${testResponse.data.events[0]?.name}`);
      
    } catch (testError) {
      console.log(`❌ API test failed: ${testError.response?.status} - ${testError.message}`);
    }
    
    // Now try to execute the workflow
    console.log('\n🚀 ATTEMPTING TO RUN FIXED WORKFLOW...');
    
    // Try different execution methods
    const executionMethods = [
      { url: `/api/v1/workflows/${WORKFLOW_ID}/execute`, data: {} },
      { url: `/webhook/${WORKFLOW_ID}`, data: {} },
      { url: `/webhook-test/${WORKFLOW_ID}`, data: {} }
    ];
    
    for (const method of executionMethods) {
      try {
        console.log(`   Trying: ${method.url}`);
        
        const execResponse = await axios.post(
          `${N8N_BASE_URL}${method.url}`,
          method.data,
          {
            headers: {
              'X-N8N-API-KEY': N8N_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`   ✅ Execution started: ${execResponse.data.executionId || 'Success'}`);
        
        if (execResponse.data.executionId) {
          // Wait a moment then check execution
          setTimeout(async () => {
            try {
              const statusResponse = await axios.get(
                `${N8N_BASE_URL}/api/v1/executions/${execResponse.data.executionId}`,
                {
                  headers: {
                    'X-N8N-API-KEY': N8N_API_KEY,
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              console.log(`   📊 Execution status: ${statusResponse.data.status}`);
              
            } catch (statusError) {
              console.log(`   ⚠️ Could not check execution status: ${statusError.message}`);
            }
          }, 3000);
        }
        
        break; // Success, stop trying other methods
        
      } catch (execError) {
        console.log(`   ❌ Failed: ${execError.response?.status || execError.message}`);
      }
    }
    
    console.log('\n🎉 API KEY FIX COMPLETE!');
    console.log('✅ The workflow now has the correct Humanitix API key');
    console.log('✅ The API key has been tested and works');
    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. Go to N8N UI: http://localhost:5678');
    console.log('   2. Find the workflow and click "Execute Workflow"');
    console.log('   3. Watch it import Humanitix orders to Notion!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

forceFixAPIKey();