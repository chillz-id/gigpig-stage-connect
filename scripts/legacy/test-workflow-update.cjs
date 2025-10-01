require('dotenv').config({ path: '/root/agents/.env' });

#!/usr/bin/env node
/**
 * Test workflow update to debug the 400 error
 */

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const N8N_API_URL = "http://localhost:5678/api/v1";

async function testUpdate() {
  const headers = {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json'
  };

  try {
    // Get the workflow first
    console.log('📥 Fetching workflow...');
    const getResponse = await fetch(`${N8N_API_URL}/workflows/7w1BMGSjVVUtadjf`, {
      method: 'GET',
      headers
    });

    if (!getResponse.ok) {
      throw new Error(`GET failed: ${getResponse.status}`);
    }

    const workflow = await getResponse.json();
    console.log('✅ Got workflow:', workflow.name);

    // Try updating with minimal changes - just change the name slightly
    const updatedWorkflow = {
      ...workflow,
      name: workflow.name + ' (Updated)'
    };

    console.log('💾 Attempting update...');
    const updateResponse = await fetch(`${N8N_API_URL}/workflows/7w1BMGSjVVUtadjf`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatedWorkflow)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ Update failed:', updateResponse.status, errorText);
      throw new Error(`Update failed: ${updateResponse.status}`);
    }

    console.log('✅ Update successful!');

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testUpdate();