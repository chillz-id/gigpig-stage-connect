require('dotenv').config({ path: '/root/agents/.env' });

const axios = require('axios');
const fs = require('fs');

require('dotenv').config({ path: '/root/agents/.env' });

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function updateTransformOrdersCode() {
  try {
    console.log('🔧 UPDATING TRANSFORM ORDERS WITH CORRECTED FIELD MAPPINGS...');
    
    // Read the corrected JavaScript code
    const correctedCode = fs.readFileSync('/root/agents/scripts/corrected-transform-orders.js', 'utf8');
    
    // Get current workflow
    const workflowResponse = await axios.get(
      `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    let workflow = workflowResponse.data;
    
    // Find and update Transform Orders node
    const transformNodeIndex = workflow.nodes.findIndex(node => node.name === 'Transform Orders');
    
    if (transformNodeIndex === -1) {
      console.log('❌ Transform Orders node not found');
      return;
    }
    
    console.log('✅ Found Transform Orders node, updating JavaScript...');
    
    // Update the JavaScript code
    workflow.nodes[transformNodeIndex].parameters.jsCode = correctedCode;
    
    console.log('📝 Updated JavaScript code with corrected Notion field mappings');
    
    // Save the workflow
    const updatePayload = {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings || {},
      staticData: workflow.staticData || {}
    };
    
    const updateResponse = await axios.put(
      `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
      updatePayload,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Transform Orders code updated successfully!');
    
    console.log('\n🎯 CORRECTED FIELD MAPPINGS:');
    console.log('============================');
    console.log('✅ Name (title) ← Customer name');
    console.log('✅ Email ← Customer email');
    console.log('✅ Mobile ← Customer phone');
    console.log('✅ Event Name (rich_text) ← Event name');
    console.log('✅ Event ID ← Event ID');
    console.log('✅ Order ID ← Order ID');
    console.log('✅ Total Amount ← Order total');
    console.log('✅ Quantity ← Ticket quantity');
    console.log('✅ Ticket Type ← Ticket types');
    console.log('✅ Ticketing Partner ← "Humanitix"');
    console.log('✅ Payment Status ← Order status');
    console.log('✅ Order Date ← Purchase date');
    console.log('✅ Event Date & Time ← Event date');
    console.log('✅ Created At/Updated At ← Sync timestamps');
    
    console.log('\n🚀 NEXT: Update Create Entry node field mappings to match!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

updateTransformOrdersCode();