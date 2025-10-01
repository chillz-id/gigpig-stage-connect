const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function debugTransformOrdersIssue() {
  try {
    console.log('🔍 DEBUGGING TRANSFORM ORDERS ISSUE');
    console.log('====================================');
    
    // Get the most recent execution
    const execsResponse = await axios.get(
      `${N8N_BASE_URL}/api/v1/executions?workflowId=${WORKFLOW_ID}&limit=1`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!execsResponse.data.data || execsResponse.data.data.length === 0) {
      console.log('❌ No executions found');
      return;
    }

    const latestExecId = execsResponse.data.data[0].id;
    console.log(`📊 Checking execution ${latestExecId}`);
    
    // Get detailed execution data
    const execResponse = await axios.get(
      `${N8N_BASE_URL}/api/v1/executions/${latestExecId}`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const execution = execResponse.data;
    console.log(`Status: ${execution.status}`);
    console.log(`Started: ${execution.startedAt}`);
    console.log(`Stopped: ${execution.stoppedAt}`);
    
    // Check if there's execution data
    if (execution.data && execution.data.resultData && execution.data.resultData.runData) {
      const runData = execution.data.resultData.runData;
      console.log(`\n📋 Nodes that executed: ${Object.keys(runData).join(', ')}`);
      
      // Check each key node
      const keyNodes = [
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
      
      keyNodes.forEach(nodeName => {
        if (runData[nodeName]) {
          const nodeData = runData[nodeName];
          console.log(`\n✅ ${nodeName}:`);
          if (nodeData[0] && nodeData[0].data) {
            const mainData = nodeData[0].data.main;
            if (mainData && mainData[0]) {
              console.log(`   - Output items: ${mainData[0].length}`);
              if (mainData[0].length > 0) {
                const firstItem = mainData[0][0];
                if (firstItem.json) {
                  const jsonKeys = Object.keys(firstItem.json);
                  console.log(`   - Data keys: ${jsonKeys.slice(0, 5).join(', ')}${jsonKeys.length > 5 ? '...' : ''}`);
                }
              }
            }
          }
          
          // Check for errors
          if (nodeData[0] && nodeData[0].error) {
            console.log(`   ❌ ERROR: ${nodeData[0].error.message}`);
          }
        } else {
          console.log(`\n❌ ${nodeName}: DID NOT EXECUTE`);
          if (nodeName === 'Transform Orders') {
            console.log('   🚨 This is where the workflow is stopping!');
          }
        }
      });
      
      // Specifically check Transform Orders input
      if (runData['Process Orders Response']) {
        const processOrdersData = runData['Process Orders Response'];
        console.log('\n🔍 Process Orders Response output:');
        if (processOrdersData[0] && processOrdersData[0].data && processOrdersData[0].data.main) {
          const mainData = processOrdersData[0].data.main[0];
          console.log(`   - Items passed to Transform Orders: ${mainData?.length || 0}`);
          if (mainData && mainData.length > 0) {
            const sample = mainData[0].json;
            console.log(`   - Sample data structure:`, JSON.stringify(sample, null, 2).substring(0, 500) + '...');
          }
        }
      }
      
    } else {
      console.log('\n❌ No execution data available - this suggests the workflow failed early');
    }
    
    // Check current workflow configuration
    console.log('\n🔧 CHECKING CURRENT WORKFLOW CONFIG...');
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
    
    // Check API keys in HTTP nodes
    const httpNodes = workflow.nodes.filter(node => 
      node.type === 'n8n-nodes-base.httpRequest'
    );
    
    httpNodes.forEach(node => {
      console.log(`\n📡 ${node.name}:`);
      if (node.parameters.headerParameters?.parameters) {
        const apiKeyHeader = node.parameters.headerParameters.parameters.find(h => h.name === 'x-api-key');
        if (apiKeyHeader) {
          const keyPreview = apiKeyHeader.value.substring(0, 20) + '...';
          console.log(`   - API Key: ${keyPreview}`);
          
          // Check if updated
          if (apiKeyHeader.value.startsWith('9f23a998')) {
            console.log(`   ✅ Using NEW API key`);
          } else if (apiKeyHeader.value.startsWith(process.env.N8N_API_KEY_LEGACY || 'legacy-key-removed')) {
            console.log(`   ❌ Still using OLD API key - UPDATE NEEDED!`);
          }
        }
      }
    });
    
    console.log('\n💡 DIAGNOSIS:');
    console.log('=============');
    if (!execution.data || !execution.data.resultData || !execution.data.resultData.runData) {
      console.log('❌ Workflow execution has no data - likely API authentication failure');
      console.log('🔧 Action: Verify API key was actually updated in both HTTP nodes');
    } else {
      console.log('✅ Some nodes executed - checking specific stopping point...');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugTransformOrdersIssue();