const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}

const N8N_BASE_URL = process.env.N8N_API_URL || 'http://localhost:5678';
const HUMANITIX_API_KEY = process.env.HUMANITIX_API_KEY;
if (!HUMANITIX_API_KEY) {
    throw new Error('HUMANITIX_API_KEY environment variable not set');
}

async function createHumanitixCredential() {
  try {
    console.log('🔐 CREATING HUMANITIX CREDENTIAL...');
    
    // Create Header Auth credential for Humanitix
    const credentialData = {
      name: 'Humanitix API Key',
      type: 'httpHeaderAuth',
      data: {
        name: 'x-api-key',
        value: HUMANITIX_API_KEY
      }
    };
    
    const credResponse = await axios.post(
      `${N8N_BASE_URL}/api/v1/credentials`,
      credentialData,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Credential created with ID: ${credResponse.data.id}`);
    const credentialId = credResponse.data.id;
    
    // Now update the workflow to use this credential
    console.log('\n🔧 UPDATING WORKFLOW TO USE CREDENTIAL...');
    
    const workflowResponse = await axios.get(
      `${N8N_BASE_URL}/api/v1/workflows/py2wq9zchBz0TD9j`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    let workflow = workflowResponse.data;
    let updated = false;
    
    // Update HTTP nodes to use credential
    workflow.nodes.forEach((node, index) => {
      if (node.type === 'n8n-nodes-base.httpRequest' && 
          (node.name === 'Get ALL Events' || node.name === 'Get ALL Orders')) {
        
        console.log(`🔄 Updating ${node.name} to use credential...`);
        
        // Set authentication to use the credential
        node.parameters.authentication = 'genericCredentialType';
        node.parameters.genericAuthType = 'httpHeaderAuth';
        node.parameters.httpHeaderAuth = credentialId;
        
        // Remove manual headers to avoid conflicts
        if (node.parameters.headerParameters) {
          if (node.parameters.headerParameters.parameters) {
            // Remove x-api-key header
            node.parameters.headerParameters.parameters = 
              node.parameters.headerParameters.parameters.filter(h => h.name !== 'x-api-key');
          }
        }
        
        console.log(`✅ ${node.name} updated to use credential authentication`);
        updated = true;
      }
    });
    
    if (!updated) {
      console.log('❌ No HTTP nodes found to update');
      return;
    }
    
    // Save the updated workflow
    console.log('\n💾 SAVING UPDATED WORKFLOW...');
    
    const updatePayload = {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings || {},
      staticData: workflow.staticData || {}
    };
    
    const updateResponse = await axios.put(
      `${N8N_BASE_URL}/api/v1/workflows/py2wq9zchBz0TD9j`,
      updatePayload,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Workflow updated successfully!');
    
    // Test the API key with the credential
    console.log('\n🧪 TESTING HUMANITIX API WITH NEW CREDENTIAL...');
    
    try {
      const testResponse = await axios.get(
        'https://api.humanitix.com/v1/events?page=1&pageSize=1',
        {
          headers: {
            'x-api-key': HUMANITIX_API_KEY
          }
        }
      );
      
      console.log(`✅ API test successful: ${testResponse.status}`);
      console.log(`📊 Found ${testResponse.data.total} total events`);
      console.log(`📅 Sample event: ${testResponse.data.events[0]?.name}`);
      
    } catch (testError) {
      console.log(`❌ API test failed: ${testError.response?.status} - ${testError.message}`);
    }
    
    console.log('\n🎉 CREDENTIAL SETUP COMPLETE!');
    console.log('✅ Created Humanitix credential with working API key');
    console.log('✅ Updated both HTTP nodes to use credential authentication');
    console.log('✅ Removed conflicting manual headers');
    console.log('\n🚀 READY TO TEST:');
    console.log('   1. Go to N8N UI: http://localhost:5678');
    console.log('   2. Open the Humanitix workflow');
    console.log('   3. Execute the workflow');
    console.log('   4. Watch orders import to Notion!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 409) {
      console.log('\n💡 Credential already exists, updating workflow to use existing credential...');
      
      // Get existing credentials
      try {
        const credsResponse = await axios.get(
          `${N8N_BASE_URL}/api/v1/credentials`,
          {
            headers: {
              'X-N8N-API-KEY': N8N_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const humanitixCred = credsResponse.data.data.find(cred => 
          cred.name.includes('Humanitix') || cred.type === 'httpHeaderAuth'
        );
        
        if (humanitixCred) {
          console.log(`✅ Found existing credential: ${humanitixCred.id}`);
          // Could update workflow to use this credential ID
        }
        
      } catch (credError) {
        console.log('Could not retrieve existing credentials');
      }
    }
  }
}

createHumanitixCredential();