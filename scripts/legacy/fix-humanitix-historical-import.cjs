require('dotenv').config({ path: '/root/agents/.env' });

#!/usr/bin/env node
/**
 * Fix the Humanitix Historical Import workflow authentication
 */

require('dotenv').config({ path: '/root/agents/.env' });

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const N8N_API_URL = "http://localhost:5678/api/v1";

async function fixHistoricalImport() {
  const headers = {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json'
  };

  try {
    console.log('🔧 Fixing Humanitix Historical Import workflow authentication...\n');

    // Get the historical import workflow
    console.log('📥 Fetching historical import workflow...');
    const response = await fetch(`${N8N_API_URL}/workflows/py2wq9zchBz0TD9j`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workflow: ${response.status}`);
    }

    const workflow = await response.json();
    console.log('✅ Got workflow:', workflow.name);

    // Create update object with fixed authentication
    const updateData = {
      name: workflow.name,
      nodes: workflow.nodes.map(node => {
        const updatedNode = { ...node };

        // Fix "Get ALL Events" node authentication
        if (node.name === 'Get ALL Events') {
          console.log('🔐 Fixing "Get ALL Events" authentication...');
          updatedNode.parameters = { ...node.parameters };
          
          // Change from predefinedCredentialType to genericCredentialType
          updatedNode.parameters.authentication = "genericCredentialType";
          updatedNode.parameters.genericAuthType = "httpHeaderAuth";
          
          // Remove the old credential type reference
          delete updatedNode.parameters.nodeCredentialType;
          
          // Add header parameters for x-api-key
          updatedNode.parameters.sendHeaders = true;
          updatedNode.parameters.headerParameters = {
            parameters: [
              {
                name: "x-api-key",
                value: "={{ $credentials.httpHeaderAuth.headerValue }}"
              },
              {
                name: "Accept",
                value: "application/json"
              }
            ]
          };
        }

        // Fix "Get ALL Orders" node authentication  
        if (node.name === 'Get ALL Orders') {
          console.log('🔐 Fixing "Get ALL Orders" authentication...');
          updatedNode.parameters = { ...node.parameters };
          
          // Change from predefinedCredentialType to genericCredentialType
          updatedNode.parameters.authentication = "genericCredentialType";
          updatedNode.parameters.genericAuthType = "httpHeaderAuth";
          
          // Remove the old credential type reference
          delete updatedNode.parameters.nodeCredentialType;
          
          // Add header parameters for x-api-key
          updatedNode.parameters.sendHeaders = true;
          updatedNode.parameters.headerParameters = {
            parameters: [
              {
                name: "x-api-key",
                value: "={{ $credentials.httpHeaderAuth.headerValue }}"
              },
              {
                name: "Accept",
                value: "application/json"
              }
            ]
          };
        }

        return updatedNode;
      }),
      connections: workflow.connections,
      settings: workflow.settings
    };

    console.log('💾 Updating historical import workflow...');
    const updateResponse = await fetch(`${N8N_API_URL}/workflows/py2wq9zchBz0TD9j`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ Update failed:', updateResponse.status, errorText);
      throw new Error(`Update failed: ${updateResponse.status}`);
    }

    console.log('✅ Historical import workflow updated successfully!\n');
    
    console.log('🎉 Authentication Fix Complete!');
    console.log('\n📋 Changes applied:');
    console.log('  • Fixed "Get ALL Events" node to use Header Auth');
    console.log('  • Fixed "Get ALL Orders" node to use Header Auth');
    console.log('  • Updated authentication method from predefinedCredentialType to httpHeaderAuth');
    console.log('\n⚠️  Next steps:');
    console.log('  1. Go to N8N workflow editor');
    console.log('  2. Open the "Humanitix Historical Import - All Time (Restored)" workflow');
    console.log('  3. Set the credential for both HTTP Request nodes to your "Humanitix API Key" credential');
    console.log('  4. Save the workflow');
    console.log('  5. Test execution');

  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

fixHistoricalImport();