const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });

const fs = require('fs');

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function updateCreateEntryMappings() {
  try {
    console.log('🔧 UPDATING CREATE ENTRY NODE WITH CORRECTED FIELD MAPPINGS...');
    
    // Read the corrected field mappings
    const correctMappings = JSON.parse(fs.readFileSync('/root/agents/scripts/correct-create-entry-mappings.json', 'utf8'));
    
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
    
    // Find and update Create Entry node
    const createEntryIndex = workflow.nodes.findIndex(node => node.name === 'Create Entry');
    
    if (createEntryIndex === -1) {
      console.log('❌ Create Entry node not found');
      return;
    }
    
    console.log('✅ Found Create Entry node, updating field mappings...');
    
    // Update the field mappings completely
    workflow.nodes[createEntryIndex].parameters = correctMappings.parameters;
    
    console.log('📝 Updated Create Entry node with corrected field mappings');
    
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
    
    console.log('✅ Create Entry node field mappings updated successfully!');
    
    console.log('\n🎯 CORRECTED FIELD MAPPINGS APPLIED:');
    console.log('====================================');
    console.log('✅ Name (title) ← Customer name from Transform Orders');
    console.log('✅ Email ← Customer email');
    console.log('✅ Mobile ← Customer phone (optional)');
    console.log('✅ Event Name (rich_text) ← Event name');
    console.log('✅ Event ID (rich_text) ← Event ID');
    console.log('✅ Order ID (rich_text) ← Order ID');
    console.log('✅ Total Amount (number) ← Order total');
    console.log('✅ Quantity (number) ← Ticket quantity');
    console.log('✅ Ticket Type (rich_text) ← Ticket types');
    console.log('✅ Ticketing Partner (select) ← "Humanitix"');
    console.log('✅ Payment Status (rich_text) ← Order status');
    console.log('✅ Order Date (date) ← Purchase date');
    console.log('✅ Event Date & Time (date) ← Event date');
    console.log('✅ Created At/Updated At (date) ← Sync timestamps');
    
    console.log('\n🚀 READY FOR TESTING: Run workflow with 1-2 orders to verify correct import!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

updateCreateEntryMappings();