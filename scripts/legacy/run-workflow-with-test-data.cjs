const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function runWorkflowWithTestData() {
  try {
    console.log('🧪 RUNNING WORKFLOW WITH TEST EXECUTION...');
    console.log('==========================================');
    
    // Get workflow structure first
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
    console.log('📊 Node count:', workflowResponse.data.nodes.length);
    
    // List all nodes
    console.log('\n📋 WORKFLOW NODES:');
    console.log('==================');
    workflowResponse.data.nodes.forEach(node => {
      console.log(`- ${node.name} (${node.type})`);
    });
    
    // Try to trigger the workflow by running a specific node
    // Since this is a historical import, let's try running from the first HTTP node
    
    const httpNodes = workflowResponse.data.nodes.filter(node => node.type.includes('httpRequest'));
    console.log('\n🌐 Found HTTP nodes:', httpNodes.map(n => n.name));
    
    if (httpNodes.length > 0) {
      const firstHttpNode = httpNodes[0];
      console.log('🎯 Will try to run from:', firstHttpNode.name);
      
      // Execute the workflow starting from the first HTTP node
      try {
        const executeResponse = await axios.post(
          `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}/execute`,
          {
            // Try with an empty startingNode to run the entire workflow
            startNodes: [firstHttpNode.name]
          },
          {
            headers: {
              'X-N8N-API-KEY': N8N_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ Workflow execution started');
        
        if (executeResponse.data?.data?.executionId) {
          const executionId = executeResponse.data.data.executionId;
          console.log('📋 Execution ID:', executionId);
          
          // Wait for execution
          console.log('⏳ Waiting for execution to complete...');
          await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
          
          // Check execution results
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
          console.log('Finished:', statusResponse.data?.finished);
          console.log('Success:', statusResponse.data?.success);
          
          if (statusResponse.data?.data?.resultData?.runData) {
            const runData = statusResponse.data.data.resultData.runData;
            
            console.log('\n🔍 NODE EXECUTION SUMMARY:');
            console.log('==========================');
            Object.keys(runData).forEach(nodeName => {
              const nodeData = runData[nodeName][0];
              const itemCount = nodeData?.data?.main?.[0]?.length || 0;
              const hasError = nodeData?.error ? ' ❌' : ' ✅';
              console.log(`${hasError} ${nodeName}: ${itemCount} items`);
              
              if (nodeData?.error) {
                console.log(`   Error: ${nodeData.error.message}`);
              }
            });
            
            // Show Transform Orders output if available
            if (runData['Transform Orders']) {
              const transformData = runData['Transform Orders'][0]?.data?.main?.[0];
              if (transformData && transformData.length > 0) {
                console.log('\n🎯 TRANSFORM ORDERS SAMPLE OUTPUT:');
                console.log('==================================');
                const sample = transformData[0].json;
                console.log('✅ Customer Name (title):', sample.properties?.Name?.title?.[0]?.text?.content || 'MISSING');
                console.log('✅ Email:', sample.properties?.Email?.email || 'MISSING');
                console.log('✅ Event Name:', sample.properties?.['Event Name']?.rich_text?.[0]?.text?.content || 'MISSING');
                console.log('✅ Order ID:', sample.properties?.['Order ID']?.rich_text?.[0]?.text?.content || 'MISSING');
                console.log('✅ Total Amount:', sample.properties?.['Total Amount']?.number || 'MISSING');
                console.log('✅ Ticketing Partner:', sample.properties?.['Ticketing Partner']?.select?.name || 'MISSING');
              }
            }
            
            // Check if data reached Notion
            if (runData['Create Entry']) {
              console.log('\n🎉 SUCCESS: Data reached Create Entry node!');
              console.log('🔗 Check Notion database: https://www.notion.so/1374745b8cbe804b87a2ec93b3385e01');
            } else {
              console.log('\n⚠️ Data did not reach Create Entry node');
            }
          }
          
          if (statusResponse.data?.data?.resultData?.error) {
            console.log('\n❌ WORKFLOW ERROR:');
            console.log('==================');
            console.log(JSON.stringify(statusResponse.data.data.resultData.error, null, 2));
          }
        }
        
      } catch (execError) {
        console.log('❌ Execution error:', execError.response?.data || execError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

runWorkflowWithTestData();