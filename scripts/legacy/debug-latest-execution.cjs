const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const N8N_BASE_URL = 'http://localhost:5678';

async function debugLatestExecution() {
  try {
    console.log('🔍 DEBUGGING LATEST EXECUTION...');
    
    // Get latest execution
    const execResponse = await axios.get(
      `${N8N_BASE_URL}/api/v1/executions/100`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const execution = execResponse.data;
    
    console.log(`Status: ${execution.status}`);
    console.log(`Finished: ${execution.finished}`);
    console.log(`Started: ${execution.startedAt}`);
    console.log(`Stopped: ${execution.stoppedAt}`);
    
    if (execution.data && execution.data.resultData) {
      const resultData = execution.data.resultData;
      
      if (resultData.error) {
        console.log('\n❌ EXECUTION ERROR:');
        console.log(resultData.error.message);
        console.log(resultData.error.stack?.substring(0, 500));
      }
      
      if (resultData.runData) {
        console.log('\n📋 NODES THAT EXECUTED:');
        const nodeNames = Object.keys(resultData.runData);
        console.log(nodeNames.join(', '));
        
        // Check each critical node
        const criticalNodes = [
          'Manual Trigger', 
          'Set Parameters',
          'Pagination Loop',
          'Get ALL Events', 
          'Process Events',
          'Orders Pagination Loop',
          'Get ALL Orders',
          'Process Orders Response',
          'Transform Orders'
        ];
        
        criticalNodes.forEach(nodeName => {
          if (resultData.runData[nodeName]) {
            const nodeData = resultData.runData[nodeName][0];
            
            console.log(`\n✅ ${nodeName}:`);
            
            if (nodeData.error) {
              console.log(`   ❌ ERROR: ${nodeData.error.message}`);
              if (nodeData.error.message.includes('Invalid api key')) {
                console.log('   🚨 API KEY STILL INVALID!');
              }
            } else if (nodeData.data?.main?.[0]) {
              const outputCount = nodeData.data.main[0].length;
              console.log(`   📊 Output: ${outputCount} items`);
              
              // Show sample data for debugging
              if (outputCount > 0 && nodeName === 'Get ALL Events') {
                const sampleEvent = nodeData.data.main[0][0]?.json;
                if (sampleEvent) {
                  console.log(`   📅 Sample event: ${sampleEvent.name || sampleEvent.title || 'Unknown'}`);
                  console.log(`   🆔 Event ID: ${sampleEvent._id || sampleEvent.id || 'No ID'}`);
                }
              }
              
              if (outputCount > 0 && nodeName === 'Get ALL Orders') {
                const sampleOrder = nodeData.data.main[0][0]?.json;
                if (sampleOrder) {
                  console.log(`   📦 Sample order: ${sampleOrder.orderName || sampleOrder._id || 'Unknown'}`);
                  console.log(`   👤 Customer: ${sampleOrder.firstName || 'Unknown'} ${sampleOrder.lastName || ''}`);
                }
              }
              
              if (outputCount > 0 && nodeName === 'Process Orders Response') {
                const processedData = nodeData.data.main[0][0]?.json;
                console.log(`   🔄 Processed data keys: ${Object.keys(processedData || {}).join(', ')}`);
              }
              
            } else {
              console.log(`   ⚠️ No output data`);
            }
          } else {
            console.log(`\n❌ ${nodeName}: DID NOT EXECUTE`);
            if (nodeName === 'Transform Orders') {
              console.log('   🚨 WORKFLOW STOPS HERE!');
            }
          }
        });
        
        // If Transform Orders didn't execute, check what the previous node outputs
        if (!resultData.runData['Transform Orders'] && resultData.runData['Process Orders Response']) {
          console.log('\n🔍 ANALYZING PROCESS ORDERS RESPONSE OUTPUT:');
          const processData = resultData.runData['Process Orders Response'][0];
          
          if (processData.data?.main?.[0]) {
            const items = processData.data.main[0];
            console.log(`   Items passed to Transform Orders: ${items.length}`);
            
            if (items.length > 0) {
              const sampleItem = items[0];
              console.log(`   Sample item structure:`, JSON.stringify(sampleItem, null, 2).substring(0, 300) + '...');
            } else {
              console.log('   ❌ NO ITEMS TO TRANSFORM - This is why Transform Orders doesn\'t execute!');
            }
          }
        }
        
      } else {
        console.log('\n❌ No execution data - workflow failed early');
      }
      
    } else {
      console.log('\n❌ No result data available');
    }
    
    // Check if the credential is actually being used
    console.log('\n🔐 VERIFYING CREDENTIAL USAGE...');
    
    const workflowResponse = await axios.get(
      `${N8N_BASE_URL}/api/v1/workflows/py2wq9zchBz0TD9j`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const workflow = workflowResponse.data;
    const httpNodes = workflow.nodes.filter(node => 
      node.type === 'n8n-nodes-base.httpRequest'
    );
    
    httpNodes.forEach(node => {
      console.log(`\n📡 ${node.name}:`);
      console.log(`   Auth: ${node.parameters.authentication}`);
      console.log(`   Credential: ${node.parameters.httpHeaderAuth}`);
      console.log(`   URL: ${node.parameters.url}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugLatestExecution();