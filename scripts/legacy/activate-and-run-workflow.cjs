const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function activateAndRunWorkflow() {
  try {
    console.log('🔧 ACTIVATING AND TESTING HUMANITIX WORKFLOW...');
    console.log('================================================');
    
    // First, get workflow details
    const workflowResponse = await axios.get(
      `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📋 Workflow found:', workflowResponse.data.name);
    console.log('📊 Active:', workflowResponse.data.active);
    
    // Activate if not active
    if (!workflowResponse.data.active) {
      console.log('🔄 Activating workflow...');
      await axios.post(
        `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}/activate`,
        {},
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Workflow activated');
    }
    
    // Manually trigger the workflow using the manual trigger
    console.log('🚀 Manually triggering workflow...');
    
    // Find the manual trigger node name
    const nodes = workflowResponse.data.nodes;
    const manualTrigger = nodes.find(node => node.type === 'n8n-nodes-base.manualTrigger');
    
    if (manualTrigger) {
      console.log('🎯 Found manual trigger:', manualTrigger.name);
      
      // Try to execute via webhook/trigger endpoint
      const triggerResponse = await axios.post(
        `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}/execute`,
        {}, // Empty body for manual trigger
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Workflow triggered successfully');
      
      if (triggerResponse.data?.data?.executionId) {
        const executionId = triggerResponse.data.data.executionId;
        console.log('📋 Execution ID:', executionId);
        
        // Wait for execution to complete
        console.log('⏳ Waiting for execution to complete...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        // Check execution status
        const statusResponse = await axios.get(
          `${N8N_BASE_URL}/api/v1/executions/${executionId}`,
          {
            headers: {
              'X-N8N-API-KEY': N8N_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('\n📊 EXECUTION RESULTS:');
        console.log('=====================');
        console.log('Status:', statusResponse.data?.finished ? 'COMPLETED' : 'RUNNING');
        console.log('Success:', statusResponse.data?.success);
        
        if (statusResponse.data?.data?.resultData?.runData) {
          const runData = statusResponse.data.data.resultData.runData;
          
          Object.keys(runData).forEach(nodeName => {
            const nodeData = runData[nodeName][0];
            const itemCount = nodeData?.data?.main?.[0]?.length || 0;
            console.log(`  ${nodeName}: ${itemCount} items`);
          });
          
          // Check specific nodes
          if (runData['Transform Orders']) {
            const transformData = runData['Transform Orders'][0]?.data?.main?.[0];
            if (transformData && transformData.length > 0) {
              console.log('\n🎯 TRANSFORM ORDERS OUTPUT (First item):');
              console.log('=======================================');
              const sample = transformData[0].json;
              console.log('Customer Name:', sample.properties?.Name?.title?.[0]?.text?.content);
              console.log('Email:', sample.properties?.Email?.email);
              console.log('Event Name:', sample.properties?.['Event Name']?.rich_text?.[0]?.text?.content);
            }
          }
          
          if (runData['Create Entry']) {
            console.log('\n🎉 SUCCESS: Data reached Create Entry - should be in Notion!');
          }
        }
        
        if (statusResponse.data?.data?.resultData?.error) {
          console.log('\n❌ EXECUTION ERROR:');
          console.log(JSON.stringify(statusResponse.data.data.resultData.error, null, 2));
        }
      }
      
    } else {
      console.log('⚠️ No manual trigger found in workflow');
    }
    
    console.log('\n🔗 Check Notion for new entries: https://www.notion.so/1374745b8cbe804b87a2ec93b3385e01');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.log('Full error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

activateAndRunWorkflow();