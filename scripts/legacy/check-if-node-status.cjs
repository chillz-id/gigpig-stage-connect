const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function checkWorkflowStatus() {
  try {
    console.log('Getting workflow and checking all nodes...');
    
    const response = await axios.get(
      `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    let workflow = response.data;
    
    console.log('=== WORKFLOW ANALYSIS ===');
    console.log('Name:', workflow.name);
    console.log('Active:', workflow.active);
    console.log('Total nodes:', workflow.nodes.length);
    
    // Find key nodes in the flow
    const checkDuplicatesNode = workflow.nodes.find(node => node.name === 'Check Duplicates');
    const debugNode = workflow.nodes.find(node => node.name === 'Debug Notion Output');
    const ifNode = workflow.nodes.find(node => node.name === 'IF New Order');
    const createEntryNode = workflow.nodes.find(node => node.name === 'Create Entry');
    
    console.log('\n=== KEY NODES STATUS ===');
    
    if (checkDuplicatesNode) {
      console.log('✓ Check Duplicates node found');
      console.log('  Type:', checkDuplicatesNode.type);
      console.log('  Database ID:', checkDuplicatesNode.parameters?.databaseId);
    }
    
    if (debugNode) {
      console.log('✓ Debug Notion Output node found');
      console.log('  Type:', debugNode.type);
    }
    
    if (ifNode) {
      console.log('✓ IF New Order node found');
      console.log('  Type:', ifNode.type);
      console.log('  TypeVersion:', ifNode.typeVersion);
      console.log('  Condition:', ifNode.parameters?.conditions?.conditions?.[0]?.leftValue);
      console.log('  Operator:', ifNode.parameters?.conditions?.conditions?.[0]?.operator?.operation);
      console.log('  Right Value:', ifNode.parameters?.conditions?.conditions?.[0]?.rightValue);
    }
    
    if (createEntryNode) {
      console.log('✓ Create Entry node found');
      console.log('  Type:', createEntryNode.type);
      console.log('  Database ID:', createEntryNode.parameters?.databaseId);
      console.log('  Has properties:', !!createEntryNode.parameters?.properties);
    }
    
    console.log('\n=== NODE CONNECTIONS ===');
    console.log('Connections:', JSON.stringify(workflow.connections, null, 2));
    
    // Check if the workflow is properly connected
    console.log('\n=== FLOW ANALYSIS ===');
    if (workflow.connections['Check Duplicates']) {
      console.log('Check Duplicates connects to:', Object.keys(workflow.connections['Check Duplicates'].main[0] || {}));
    }
    
    if (workflow.connections['Debug Notion Output']) {
      console.log('Debug Notion Output connects to:', Object.keys(workflow.connections['Debug Notion Output'].main[0] || {}));
    }
    
    if (workflow.connections['IF New Order']) {
      console.log('IF New Order TRUE connects to:', workflow.connections['IF New Order'].main?.[0] || 'nowhere');
      console.log('IF New Order FALSE connects to:', workflow.connections['IF New Order'].main?.[1] || 'nowhere');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkWorkflowStatus();