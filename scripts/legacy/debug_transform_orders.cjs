require('dotenv').config({ path: '/root/agents/.env' });

const axios = require('axios');

require('dotenv').config({ path: '/root/agents/.env' });

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function debugTransformOrders() {
  try {
    console.log('🔍 DEBUGGING TRANSFORM ORDERS EXECUTION...');
    console.log('==========================================');
    
    // Get recent executions
    const executionsResponse = await axios.get(
      `${N8N_BASE_URL}/api/v1/executions`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        },
        params: {
          filter: JSON.stringify({
            workflowId: WORKFLOW_ID
          }),
          limit: 1
        }
      }
    );
    
    if (executionsResponse.data.data.length === 0) {
      console.log('❌ No recent executions found');
      return;
    }
    
    const latestExecution = executionsResponse.data.data[0];
    console.log('📋 Latest execution ID:', latestExecution.id);
    console.log('📊 Status:', latestExecution.status);
    console.log('📊 Finished:', latestExecution.finished);
    
    // Get detailed execution data
    const executionResponse = await axios.get(
      `${N8N_BASE_URL}/api/v1/executions/${latestExecution.id}`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const execution = executionResponse.data;
    const runData = execution.data?.resultData?.runData;
    
    if (!runData) {
      console.log('❌ No run data found');
      return;
    }
    
    console.log('\n🔍 NODE EXECUTION ANALYSIS:');
    console.log('===========================');
    
    // Check each node
    Object.keys(runData).forEach(nodeName => {
      const nodeData = runData[nodeName][0];
      const itemCount = nodeData?.data?.main?.[0]?.length || 0;
      const hasError = nodeData?.error ? ' ❌' : ' ✅';
      console.log(`${hasError} ${nodeName}: ${itemCount} items`);
      
      if (nodeData?.error) {
        console.log(`   Error: ${nodeData.error.message}`);
      }
    });
    
    // Focus on Transform Orders
    if (runData['Transform Orders']) {
      const transformData = runData['Transform Orders'][0];
      console.log('\n🎯 TRANSFORM ORDERS DETAILED ANALYSIS:');
      console.log('=====================================');
      console.log('Execution Status:', transformData.executionStatus);
      console.log('Output Items:', transformData.data?.main?.[0]?.length || 0);
      
      if (transformData.error) {
        console.log('❌ Error:', transformData.error);
      }
      
      // Check input to Transform Orders (from Process Orders Response)
      if (runData['Process Orders Response']) {
        const processData = runData['Process Orders Response'][0];
        const inputItems = processData.data?.main?.[0]?.length || 0;
        console.log('Input from Process Orders Response:', inputItems, 'items');
        
        if (inputItems > 0) {
          console.log('\n📋 SAMPLE INPUT ORDER:');
          const sampleOrder = processData.data.main[0][0].json;
          console.log('Order ID:', sampleOrder._id || sampleOrder.id || 'NO ID');
          console.log('Event:', sampleOrder.event?.name || 'NO EVENT');
          console.log('Order keys:', Object.keys(sampleOrder).slice(0, 10));
        }
      }
    }
    
    // Check if any orders data was processed
    if (runData['Get ALL Orders']) {
      const ordersData = runData['Get ALL Orders'][0];
      console.log('\n📦 GET ALL ORDERS RESPONSE:');
      console.log('===========================');
      const ordersResponse = ordersData.data?.main?.[0]?.[0]?.json;
      if (ordersResponse) {
        console.log('Response type:', typeof ordersResponse);
        console.log('Response keys:', Object.keys(ordersResponse).slice(0, 10));
        
        if (ordersResponse.orders) {
          console.log('Orders array length:', ordersResponse.orders.length);
        } else if (Array.isArray(ordersResponse)) {
          console.log('Direct array length:', ordersResponse.length);
        } else {
          console.log('❌ No orders found in response');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.response?.data || error.message);
  }
}

debugTransformOrders();