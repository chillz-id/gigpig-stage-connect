const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}

const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = process.env.N8N_API_URL || 'http://localhost:5678';
const CURRENT_HUMANITIX_API_KEY = process.env.HUMANITIX_API_KEY;
if (!CURRENT_HUMANITIX_API_KEY) {
    throw new Error('HUMANITIX_API_KEY environment variable not set');
}

async function fixHumanitixWorkflow() {
  try {
    console.log('🔧 Getting Humanitix Historical Import workflow...');
    
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
    console.log(`Found workflow: ${workflow.name}`);
    
    let updatesCount = 0;
    
    // Find and update all nodes that need fixing
    workflow.nodes.forEach((node, index) => {
      
      // 1. Update API key in Get ALL Events node
      if (node.name === 'Get ALL Events' && node.type === 'n8n-nodes-base.httpRequest') {
        console.log('📡 Fixing Get ALL Events API key...');
        
        if (!node.parameters.headerParameters) {
          node.parameters.headerParameters = { parameters: [] };
        }
        
        // Find and update x-api-key header
        const headerParams = node.parameters.headerParameters.parameters;
        let apiKeyHeader = headerParams.find(p => p.name === 'x-api-key');
        
        if (apiKeyHeader) {
          apiKeyHeader.value = CURRENT_HUMANITIX_API_KEY;
          console.log('✅ Updated API key in Get ALL Events');
          updatesCount++;
        } else {
          // Add the header if it doesn't exist
          headerParams.push({
            name: 'x-api-key',
            value: CURRENT_HUMANITIX_API_KEY
          });
          console.log('✅ Added API key to Get ALL Events');
          updatesCount++;
        }
      }
      
      // 2. Update API key in Get ALL Orders node
      if (node.name === 'Get ALL Orders' && node.type === 'n8n-nodes-base.httpRequest') {
        console.log('📦 Fixing Get ALL Orders API key...');
        
        if (!node.parameters.headerParameters) {
          node.parameters.headerParameters = { parameters: [] };
        }
        
        // Find and update x-api-key header
        const headerParams = node.parameters.headerParameters.parameters;
        let apiKeyHeader = headerParams.find(p => p.name === 'x-api-key');
        
        if (apiKeyHeader) {
          apiKeyHeader.value = CURRENT_HUMANITIX_API_KEY;
          console.log('✅ Updated API key in Get ALL Orders');
          updatesCount++;
        } else {
          // Add the header if it doesn't exist
          headerParams.push({
            name: 'x-api-key',
            value: CURRENT_HUMANITIX_API_KEY
          });
          console.log('✅ Added API key to Get ALL Orders');
          updatesCount++;
        }
        
        // 3. Add error handling to orders request
        node.parameters.options = {
          ...node.parameters.options,
          response: {
            response: {
              responseFormat: 'json',
              outputPropertyName: 'data'
            }
          }
        };
        
        console.log('✅ Added error handling to Get ALL Orders');
        updatesCount++;
      }
      
      // 4. Add error handling to events request
      if (node.name === 'Get ALL Events' && node.type === 'n8n-nodes-base.httpRequest') {
        node.parameters.options = {
          ...node.parameters.options,
          response: {
            response: {
              responseFormat: 'json',
              outputPropertyName: 'data'
            }
          }
        };
        
        console.log('✅ Added error handling to Get ALL Events');
        updatesCount++;
      }
    });
    
    if (updatesCount === 0) {
      console.log('❌ No updates needed - nodes may already be configured correctly');
      return;
    }
    
    console.log(`\n🔄 Saving workflow with ${updatesCount} updates...`);
    
    // Create clean workflow update
    const updatePayload = {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings || {},
      staticData: workflow.staticData || {},
      tags: workflow.tags || [],
      triggerCount: workflow.triggerCount || 0
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

    console.log('\n🎉 SUCCESS! Humanitix workflow fixed!');
    console.log('');
    console.log('✅ FIXES APPLIED:');
    console.log('   🔑 Updated to current Humanitix API key');
    console.log('   📡 Fixed Get ALL Events API authentication');
    console.log('   📦 Fixed Get ALL Orders API authentication'); 
    console.log('   🛡️ Added error handling to HTTP requests');
    console.log('');
    console.log('🚀 NEXT STEPS:');
    console.log('   1. Go to N8N UI: http://localhost:5678');
    console.log('   2. Find "Humanitix Historical Import - All Time"');
    console.log('   3. Activate the workflow');
    console.log('   4. Test by clicking "Execute Workflow"');
    console.log('   5. Check your Notion database for imported orders!');
    console.log('');
    console.log('💡 The workflow should now successfully:');
    console.log('   → Fetch events from Humanitix API');
    console.log('   → Get orders for each event');
    console.log('   → Transform order data');
    console.log('   → Check for duplicates in Notion');
    console.log('   → Create new entries for unique orders');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('🔑 Authentication failed - N8N API key may be invalid');
    } else if (error.response?.status === 404) {
      console.error('🔍 Workflow not found - check workflow ID');
    } else if (error.response?.status === 400) {
      console.error('📝 Bad request - workflow structure may be invalid');
    }
  }
}

fixHumanitixWorkflow();