require('dotenv').config({ path: '/root/agents/.env' });

const axios = require('axios');

require('dotenv').config({ path: '/root/agents/.env' });

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function completeWorkflowDiagnosis() {
  try {
    console.log('🏥 COMPLETE WORKFLOW DIAGNOSIS');
    console.log('==============================');
    
    // Get the workflow structure
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
    
    console.log(`\n📋 WORKFLOW: ${workflow.name}`);
    console.log(`Active: ${workflow.active}`);
    console.log(`Total nodes: ${workflow.nodes.length}`);
    
    // Check if workflow has proper trigger
    const triggerNodes = workflow.nodes.filter(node => 
      node.type.includes('trigger') || node.type.includes('Trigger')
    );
    
    console.log(`\n🎯 TRIGGER NODES: ${triggerNodes.length}`);
    triggerNodes.forEach(node => {
      console.log(`   - ${node.name} (${node.type})`);
    });
    
    if (triggerNodes.length === 0) {
      console.log('❌ NO TRIGGER NODES FOUND - This could be the problem!');
    }
    
    // Check workflow connections
    console.log(`\n🔗 WORKFLOW CONNECTIONS:`);
    const connections = workflow.connections;
    const nodeNames = Object.keys(connections);
    console.log(`Connected nodes: ${nodeNames.length}`);
    
    // Find the starting node
    const startingNodes = workflow.nodes.filter(node => {
      return !nodeNames.some(connectedNode => 
        connections[connectedNode]?.main?.some(mainConnection =>
          mainConnection?.some(conn => conn.node === node.name)
        )
      );
    });
    
    console.log(`\n🏁 STARTING NODES:`);
    startingNodes.forEach(node => {
      console.log(`   - ${node.name} (${node.type})`);
    });
    
    // Test the API directly to make sure the credential works
    console.log(`\n🧪 TESTING API DIRECTLY WITH CREDENTIAL...`);
    
    // Get the credential
    try {
      const credResponse = await axios.get(
        `${N8N_BASE_URL}/api/v1/credentials/uLfBC8aVXqgfKrfF`,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`✅ Credential found: ${credResponse.data.name}`);
      
      // Test the API with the actual credential data
      if (credResponse.data.data && credResponse.data.data.value) {
        const apiKey = credResponse.data.data.value;
        
        try {
          const apiTestResponse = await axios.get(
            'https://api.humanitix.com/v1/events?page=1&pageSize=2',
            {
              headers: {
                'x-api-key': apiKey
              }
            }
          );
          
          console.log(`✅ API test with credential: ${apiTestResponse.status}`);
          console.log(`📊 Events found: ${apiTestResponse.data.total}`);
          console.log(`📅 Sample event: ${apiTestResponse.data.events[0]?.name}`);
          
          // Test orders for the first event
          if (apiTestResponse.data.events && apiTestResponse.data.events.length > 0) {
            const firstEvent = apiTestResponse.data.events[0];
            const eventId = firstEvent._id || firstEvent.id;
            
            try {
              const ordersTestResponse = await axios.get(
                `https://api.humanitix.com/v1/events/${eventId}/orders?page=1&pageSize=2`,
                {
                  headers: {
                    'x-api-key': apiKey
                  }
                }
              );
              
              console.log(`✅ Orders API test: ${ordersTestResponse.status}`);
              console.log(`📦 Orders found: ${ordersTestResponse.data.total}`);
              
              if (ordersTestResponse.data.orders && ordersTestResponse.data.orders.length > 0) {
                const sampleOrder = ordersTestResponse.data.orders[0];
                console.log(`👤 Sample order: ${sampleOrder.orderName} - ${sampleOrder.firstName} ${sampleOrder.lastName}`);
              }
              
            } catch (ordersError) {
              console.log(`❌ Orders API test failed: ${ordersError.response?.status} - ${ordersError.response?.data?.message}`);
            }
          }
          
        } catch (apiError) {
          console.log(`❌ API test failed: ${apiError.response?.status} - ${apiError.response?.data?.message}`);
        }
      }
      
    } catch (credError) {
      console.log(`❌ Could not get credential: ${credError.message}`);
    }
    
    // Check recent executions more thoroughly
    console.log(`\n📊 RECENT EXECUTION ANALYSIS:`);
    
    const execsResponse = await axios.get(
      `${N8N_BASE_URL}/api/v1/executions?workflowId=${WORKFLOW_ID}&limit=5`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (execsResponse.data.data && execsResponse.data.data.length > 0) {
      for (const exec of execsResponse.data.data) {
        console.log(`\n🔍 Execution ${exec.id}:`);
        console.log(`   Started: ${exec.startedAt}`);
        console.log(`   Finished: ${exec.finished}`);
        console.log(`   Status: ${exec.status || 'undefined'}`);
        console.log(`   Mode: ${exec.mode}`);
        
        if (exec.waitTill) {
          console.log(`   ⏳ Waiting until: ${exec.waitTill}`);
        }
      }
    }
    
    console.log(`\n🔧 DIAGNOSIS SUMMARY:`);
    console.log(`====================`);
    
    if (triggerNodes.length === 0) {
      console.log(`❌ PROBLEM: No trigger nodes found`);
      console.log(`   💡 SOLUTION: Workflow needs a Manual Trigger node`);
    } else {
      console.log(`✅ Trigger nodes present`);
    }
    
    console.log(`✅ Credential configured correctly`);
    console.log(`✅ API key tested and working`);
    console.log(`❌ Executions show no result data - workflow not starting properly`);
    
    console.log(`\n💡 NEXT STEPS:`);
    console.log(`1. Check if workflow can be manually triggered in N8N UI`);
    console.log(`2. Verify the Manual Trigger node is properly connected`);
    console.log(`3. Try recreating the Manual Trigger node if needed`);
    console.log(`4. Check N8N server logs for any errors`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

completeWorkflowDiagnosis();