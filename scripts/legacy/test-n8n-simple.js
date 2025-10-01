import dotenv from 'dotenv';
dotenv.config({ path: '/root/agents/.env' });

#!/usr/bin/env node
/**
 * Simple N8N workflow creation test
 */

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const N8N_API_URL = "http://localhost:5678/api/v1";

async function createSimpleWorkflow() {
  const workflowData = {
    name: "Test Workflow - Stand Up Sydney",
    nodes: [
      {
        id: "manual-trigger", 
        name: "Manual Trigger",
        type: "n8n-nodes-base.manualTrigger",
        position: [100, 200],
        parameters: {}
      },
      {
        id: "code-node",
        name: "Test Code",
        type: "n8n-nodes-base.code", 
        position: [300, 200],
        parameters: {
          jsCode: 'return [{ json: { message: "Hello from Stand Up Sydney!" } }];'
        }
      }
    ],
    connections: {
      "Manual Trigger": {
        main: [[{ node: "Test Code", type: "main", index: 0 }]]
      }
    },
    settings: { executionOrder: "v1" }
  };

  try {
    const response = await fetch(`${N8N_API_URL}/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Created workflow:', result.name, 'ID:', result.id);
    
    // Test activation
    const activateResponse = await fetch(`${N8N_API_URL}/workflows/${result.id}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (activateResponse.ok) {
      console.log('✅ Activated workflow:', result.id);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Failed to create workflow:', error.message);
    throw error;
  }
}

createSimpleWorkflow()
  .then(result => {
    console.log('🎉 Workflow creation successful!');
    console.log('ID:', result.id);
    console.log('Name:', result.name);
  })
  .catch(error => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  });