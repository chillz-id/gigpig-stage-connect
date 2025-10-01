const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function testCorrectedWorkflow() {
  try {
    console.log('🧪 TESTING CORRECTED HUMANITIX WORKFLOW...');
    console.log('===============================================');
    
    // Execute workflow with manual trigger to test just a few orders
    const executeResponse = await axios.post(
      `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}/execute`,
      {
        // Add manual test data if needed
      },
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Workflow execution triggered successfully');
    console.log('Execution ID:', executeResponse.data?.data?.executionId);
    
    // Wait a moment for execution to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check execution status
    if (executeResponse.data?.data?.executionId) {
      const executionId = executeResponse.data.data.executionId;
      
      const statusResponse = await axios.get(
        `${N8N_BASE_URL}/api/v1/executions/${executionId}`,
        {
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('📊 Execution Status:', statusResponse.data?.finished ? 'COMPLETED' : 'RUNNING');
      console.log('📊 Success:', statusResponse.data?.mode === 'manual' ? 'MANUAL TEST' : statusResponse.data?.status);
      
      if (statusResponse.data?.data?.resultData?.runData) {
        const runData = statusResponse.data.data.resultData.runData;
        
        console.log('\n🔍 WORKFLOW EXECUTION RESULTS:');
        console.log('==============================');
        
        // Check which nodes executed
        Object.keys(runData).forEach(nodeName => {
          const nodeData = runData[nodeName][0];
          console.log(`✅ ${nodeName}: ${nodeData?.data?.main?.[0]?.length || 0} items processed`);
        });
        
        // Check if data reached Create Entry
        if (runData['Create Entry']) {
          console.log('\n🎉 SUCCESS: Data successfully reached Create Entry node!');
          console.log('🎯 Field mappings should now be correct in Notion');
        }
        
        if (runData['Transform Orders']) {
          const transformData = runData['Transform Orders'][0]?.data?.main?.[0];
          if (transformData && transformData.length > 0) {
            console.log('\n📋 SAMPLE TRANSFORMED ORDER:');
            console.log('============================');
            const sample = transformData[0].json;
            console.log(`Customer Name: ${sample.properties?.Name?.title?.[0]?.text?.content || 'NOT FOUND'}`);
            console.log(`Email: ${sample.properties?.Email?.email || 'NOT FOUND'}`);
            console.log(`Event Name: ${sample.properties?.['Event Name']?.rich_text?.[0]?.text?.content || 'NOT FOUND'}`);
            console.log(`Order ID: ${sample.properties?.['Order ID']?.rich_text?.[0]?.text?.content || 'NOT FOUND'}`);
            console.log(`Amount: ${sample.properties?.['Total Amount']?.number || 'NOT FOUND'}`);
          }
        }
      }
      
    } else {
      console.log('⚠️ No execution ID returned - checking workflow status');
    }
    
    console.log('\n🔗 Check results in Notion: https://www.notion.so/1374745b8cbe804b87a2ec93b3385e01');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('💡 Workflow may need to be activated first');
    }
  }
}

testCorrectedWorkflow();