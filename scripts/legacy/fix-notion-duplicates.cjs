#!/usr/bin/env node
/**
 * Fix the Notion Check Duplicates node configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Get N8N API credentials from environment
const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const N8N_API_URL = "http://localhost:5678/api/v1";

async function fixNotionDuplicatesNode() {
  try {
    console.log('🔧 Fixing Notion Check Duplicates node...\n');

    // Get the workflow using the working automation script
    console.log('📥 Getting workflow configuration...');
    const workflowOutput = execSync('node /root/agents/scripts/n8n-automation.js get py2wq9zchBz0TD9j', { encoding: 'utf8' });
    
    // Extract JSON from the output
    const lines = workflowOutput.split('\n');
    const jsonStartIndex = lines.findIndex(line => line.includes('✅ Success:'));
    
    if (jsonStartIndex === -1) {
      throw new Error('Could not find workflow JSON in output');
    }
    
    const jsonLines = lines.slice(jsonStartIndex + 1);
    const workflowJsonString = jsonLines.join('\n').trim();
    const response = JSON.parse(workflowJsonString);
    const workflow = response.workflow;
    
    console.log('✅ Got workflow:', workflow.name);
    
    // Find the Check Duplicates node
    const checkDuplicatesNode = workflow.nodes.find(node => node.name === 'Check Duplicates');
    
    if (!checkDuplicatesNode) {
      throw new Error('Could not find Check Duplicates node');
    }
    
    console.log('🔍 Current Check Duplicates configuration:');
    console.log(JSON.stringify(checkDuplicatesNode.parameters, null, 2));
    
    // Fix the node configuration
    console.log('🔧 Applying fix...');
    
    const updatedNodes = workflow.nodes.map(node => {
      if (node.name === 'Check Duplicates') {
        console.log('  • Fixing Check Duplicates node configuration');
        
        // Create a simplified, safe configuration
        const fixedNode = {
          ...node,
          parameters: {
            resource: "databasePage",
            operation: "getAll", 
            databaseId: "2304745b-8cbe-81cd-9483-d7acc2377bd6", // Keep existing database ID
            simplifyOutput: false,
            options: {}
            // Remove problematic filters entirely
          }
        };
        
        return fixedNode;
      }
      return node;
    });
    
    const updatedWorkflow = {
      name: workflow.name,
      nodes: updatedNodes,
      connections: workflow.connections,
      settings: workflow.settings
    };
    
    // Try to update via API
    const headers = {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    console.log('💾 Updating workflow...');
    
    try {
      const response = await fetch(`${N8N_API_URL}/workflows/py2wq9zchBz0TD9j`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedWorkflow)
      });
      
      if (!response.ok) {
        throw new Error(`API update failed: ${response.status}`);
      }
      
      console.log('✅ Workflow updated via API!');
      
    } catch (apiError) {
      console.log('⚠️  API update failed, trying curl...');
      
      // Save to temp file and use curl
      const tempFile = '/tmp/notion-fixed-workflow.json';
      fs.writeFileSync(tempFile, JSON.stringify(updatedWorkflow, null, 2));
      
      const curlCommand = `curl -s -X PUT "${N8N_API_URL}/workflows/py2wq9zchBz0TD9j" -H "X-N8N-API-KEY: process.env.N8N_API_KEY" -H "Content-Type: application/json" --data @${tempFile}`;
      
      try {
        const curlResult = execSync(curlCommand, { encoding: 'utf8' });
        const result = JSON.parse(curlResult);
        
        if (result.message && result.message !== 'Success') {
          throw new Error(`Curl update failed: ${result.message}`);
        }
        
        console.log('✅ Workflow updated via curl!');
      } catch (curlError) {
        console.log('❌ Both API and curl failed. Manual fix required.');
        console.log('\n📋 Manual fix needed:');
        console.log('1. Go to Check Duplicates node in N8N workflow');
        console.log('2. Remove all filters in the "Filters" section');
        console.log('3. Set operation to "Get All" with no conditions');
        console.log('4. Save the workflow');
        return;
      }
    }
    
    console.log('\n🎉 Notion Check Duplicates Fixed!');
    console.log('\n📋 Changes applied:');
    console.log('  ✅ Removed problematic filter configuration');
    console.log('  ✅ Set to simple "Get All" operation');
    console.log('  ✅ Kept existing database ID and credentials');
    console.log('\n🚀 The Notion error should now be resolved!');
    console.log('Try executing the workflow again.');

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.log('\n🤔 If automatic fix failed, here\'s the manual approach:');
    console.log('1. Open the "Check Duplicates" node in your N8N workflow');
    console.log('2. In the "Filters" section, remove all filter conditions');
    console.log('3. Set the operation to get all pages from the database');
    console.log('4. Save the workflow and test again');
  }
}

fixNotionDuplicatesNode();