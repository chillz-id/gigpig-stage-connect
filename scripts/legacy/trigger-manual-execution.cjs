const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function triggerWorkflowManually() {
  try {
    console.log('🎯 TRIGGERING WORKFLOW MANUALLY...');
    
    // First get the workflow to find the manual trigger node
    const workflowResponse = await axios.get(
      `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const workflow = workflowResponse.data;
    console.log(`Found workflow: ${workflow.name}`);
    
    // Find manual trigger node
    const manualTrigger = workflow.nodes.find(node => 
      node.type === 'n8n-nodes-base.manualTrigger' || 
      node.name === 'Manual Trigger'
    );
    
    if (!manualTrigger) {
      console.log('❌ No manual trigger found');
      return;
    }
    
    console.log(`✅ Found manual trigger: ${manualTrigger.name}`);
    
    // Try webhook-style execution
    const webhookUrl = `${N8N_BASE_URL}/webhook-test/${WORKFLOW_ID}`;
    console.log(`🔗 Trying webhook trigger: ${webhookUrl}`);
    
    try {
      const webhookResponse = await axios.post(webhookUrl);
      console.log('✅ Webhook trigger successful:', webhookResponse.data);
    } catch (webhookError) {
      console.log('❌ Webhook trigger failed:', webhookError.response?.status);
      
      // Try direct node execution via simulated trigger
      console.log('🔄 Trying simulated manual trigger...');
      
      const simulatedExecution = {
        workflowData: workflow,
        startNodes: [manualTrigger.name],
        executionData: {
          startData: {},
          resultData: {
            runData: {}
          }
        }
      };
      
      // Use internal execution endpoint
      try {
        const execResponse = await axios.post(
          `${N8N_BASE_URL}/rest/executions`,
          simulatedExecution,
          {
            headers: {
              'X-N8N-API-KEY': N8N_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ Simulated execution started:', execResponse.data);
        
      } catch (execError) {
        console.log('❌ Simulated execution failed:', execError.response?.data || execError.message);
        
        // Last resort: Direct API test to check if the API key works
        console.log('\n🧪 TESTING API KEY DIRECTLY...');
        
        // Get the current API key from the workflow
        const httpNodes = workflow.nodes.filter(node => 
          node.type === 'n8n-nodes-base.httpRequest'
        );
        
        for (const node of httpNodes) {
          console.log(`\n📡 Testing ${node.name}:`);
          
          if (node.parameters.headerParameters?.parameters) {
            const apiKeyHeader = node.parameters.headerParameters.parameters.find(h => h.name === 'x-api-key');
            
            if (apiKeyHeader) {
              const apiKey = apiKeyHeader.value;
              console.log(`   API Key (first 20 chars): ${apiKey.substring(0, 20)}...`);
              
              // Test this API key with curl equivalent
              try {
                const testUrl = node.parameters.url.includes('{{') 
                  ? 'https://api.humanitix.com/v1/events?page=1&pageSize=1'
                  : node.parameters.url + '?page=1&pageSize=1';
                  
                const testResponse = await axios.get(testUrl, {
                  headers: {
                    'x-api-key': apiKey
                  },
                  timeout: 10000
                });
                
                console.log(`   ✅ API test successful: ${testResponse.status}`);
                if (testResponse.data.events) {
                  console.log(`   📊 Found ${testResponse.data.events.length} events`);
                }
                
              } catch (apiError) {
                console.log(`   ❌ API test failed: ${apiError.response?.status} - ${apiError.response?.data?.message || apiError.message}`);
                
                if (apiError.response?.data?.message?.includes('Invalid api key')) {
                  console.log('\n🔧 FOUND THE PROBLEM: Invalid API key format!');
                  console.log('   The API key in the workflow is malformed or has extra characters');
                  console.log('\n💡 SOLUTION:');
                  console.log('   1. Go to N8N UI: http://localhost:5678');
                  console.log('   2. Open the workflow');
                  console.log('   3. Edit both HTTP nodes');
                  console.log('   4. DELETE the x-api-key header completely');
                  console.log('   5. ADD a fresh x-api-key header with this exact value:');
                  console.log('   const HUMANITIX_API_KEY = process.env.HUMANITIX_API_KEY;
if (!HUMANITIX_API_KEY) {
    throw new Error('HUMANITIX_API_KEY environment variable not set');
}

process.env.HUMANITIX_API_KEY');
                  
                  return; // Exit with clear instructions
                }
              }
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

triggerWorkflowManually();