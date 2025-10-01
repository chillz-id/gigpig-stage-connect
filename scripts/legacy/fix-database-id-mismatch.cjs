require('dotenv').config({ path: '/root/agents/.env' });

#!/usr/bin/env node
/**
 * Fix database ID mismatch in Humanitix Historical Import workflow
 */

const { execSync } = require('child_process');
const fs = require('fs');

// CORRECT Database ID from user's Notion URL
const CORRECT_DATABASE_ID = "1374745b-8cbe-804b-87a2-ec93b3385e01";
const WRONG_DATABASE_ID = "2304745b-8cbe-81cd-9483-d7acc2377bd6";

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const N8N_API_URL = "http://localhost:5678/api/v1";

async function fixDatabaseId() {
  try {
    console.log('🔧 Fixing Database ID Mismatch in Humanitix workflow...\n');
    console.log(`❌ Wrong Database ID: ${WRONG_DATABASE_ID}`);
    console.log(`✅ Correct Database ID: ${CORRECT_DATABASE_ID}`);
    console.log();

    // Get the workflow using the automation script
    console.log('📥 Getting workflow configuration...');
    const workflowOutput = execSync('node /root/agents/scripts/n8n-automation.js get py2wq9zchBz0TD9j', { 
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    // Parse the workflow JSON from output
    let workflow = null;
    try {
      // Find the JSON in the output
      const lines = workflowOutput.split('\n');
      const jsonStartIndex = lines.findIndex(line => line.includes('✅ Success:'));
      
      if (jsonStartIndex !== -1) {
        const jsonLines = lines.slice(jsonStartIndex + 1);
        const jsonStr = jsonLines.join('\n').trim();
        const response = JSON.parse(jsonStr);
        workflow = response.workflow;
      }
    } catch (parseError) {
      // Alternative parsing method
      const match = workflowOutput.match(/\{[\s\S]*"workflow"[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        workflow = parsed.workflow || parsed;
      }
    }

    if (!workflow) {
      throw new Error('Could not parse workflow from output');
    }

    console.log('✅ Got workflow:', workflow.name);
    console.log('🔧 Updating database IDs in Notion nodes...\n');

    // Update all nodes with correct database ID
    let fixedCount = 0;
    const updatedNodes = workflow.nodes.map(node => {
      const updatedNode = { ...node };
      
      // Fix Check Duplicates node
      if (node.name === 'Check Duplicates' && node.type === 'n8n-nodes-base.notion') {
        console.log('  • Fixing "Check Duplicates" database ID');
        updatedNode.parameters = {
          ...node.parameters,
          databaseId: CORRECT_DATABASE_ID,
          resource: "databasePage",
          operation: "getAll",
          filterType: "manual",
          filters: {
            conditions: [
              {
                key: "Order ID",
                condition: "rich_text",
                operation: "equals",
                value: "={{ $json.orderId }}"
              }
            ]
          },
          simplifyOutput: false,
          options: {}
        };
        fixedCount++;
      }
      
      // Fix Create Entry node
      if (node.name === 'Create Entry' && node.type === 'n8n-nodes-base.notion') {
        console.log('  • Fixing "Create Entry" database ID');
        
        // Complete property mappings with correct database ID
        updatedNode.parameters = {
          resource: "databasePage",
          operation: "create",
          databaseId: CORRECT_DATABASE_ID, // CORRECT DATABASE ID
          propertiesUi: {
            propertyValues: [
              { key: "Event Name", type: "title", title: "={{ $json.properties['Event Name'].title[0].text.content }}" },
              { key: "Event Date", type: "date", date: "={{ $json.properties['Event Date'].date.start }}" },
              { key: "Platform", type: "select", select: "={{ $json.properties.Platform.select.name }}" },
              { key: "Order ID", type: "rich_text", rich_text: "={{ $json.properties['Order ID'].rich_text[0].text.content }}" },
              { key: "Customer Name", type: "rich_text", rich_text: "={{ $json.properties['Customer Name'].rich_text[0].text.content }}" },
              { key: "Customer Email", type: "email", email: "={{ $json.properties['Customer Email'].email }}" },
              { key: "Customer Phone", type: "phone_number", phone_number: "={{ $json.properties['Customer Phone'] ? $json.properties['Customer Phone'].phone_number : '' }}" },
              { key: "Ticket Types", type: "rich_text", rich_text: "={{ $json.properties['Ticket Types'].rich_text[0].text.content }}" },
              { key: "Quantity", type: "number", number: "={{ $json.properties.Quantity.number }}" },
              { key: "Amount", type: "number", number: "={{ $json.properties.Amount.number }}" },
              { key: "Currency", type: "select", select: "={{ $json.properties.Currency.select.name }}" },
              { key: "Status", type: "select", select: "={{ $json.properties.Status.select.name }}" },
              { key: "Purchase Date", type: "date", date: "={{ $json.properties['Purchase Date'].date.start }}" },
              { key: "Venue", type: "rich_text", rich_text: "={{ $json.properties.Venue.rich_text[0].text.content }}" },
              { key: "Last Sync", type: "date", date: "={{ $json.properties['Last Sync'].date.start }}" },
              { key: "Notes", type: "rich_text", rich_text: "={{ $json.properties.Notes.rich_text[0].text.content }}" }
            ]
          },
          options: {}
        };
        fixedCount++;
      }
      
      return updatedNode;
    });

    if (fixedCount === 0) {
      throw new Error('No Notion nodes found to fix');
    }

    console.log(`\n✅ Fixed ${fixedCount} Notion nodes with correct database ID`);

    // Create updated workflow
    const updatedWorkflow = {
      name: workflow.name,
      nodes: updatedNodes,
      connections: workflow.connections,
      settings: workflow.settings
    };

    // Try to update via API
    console.log('\n💾 Updating workflow via API...');
    
    const headers = {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    try {
      const response = await fetch(`${N8N_API_URL}/workflows/py2wq9zchBz0TD9j`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedWorkflow)
      });

      if (response.ok) {
        console.log('✅ Workflow updated successfully via API!');
      } else {
        throw new Error(`API update failed: ${response.status}`);
      }
    } catch (apiError) {
      // Try curl as backup
      console.log('⚠️  API failed, trying curl...');
      const tempFile = '/tmp/fixed-database-id-workflow.json';
      fs.writeFileSync(tempFile, JSON.stringify(updatedWorkflow, null, 2));
      
      const curlCmd = `curl -s -X PUT "${N8N_API_URL}/workflows/py2wq9zchBz0TD9j" -H "X-N8N-API-KEY: process.env.N8N_API_KEY" -H "Content-Type: application/json" --data @${tempFile}`;
      
      try {
        const curlResult = execSync(curlCmd, { encoding: 'utf8' });
        if (curlResult.includes('error') || curlResult.includes('unauthorized')) {
          throw new Error('Curl update failed');
        }
        console.log('✅ Workflow updated via curl!');
      } catch (curlError) {
        console.log('❌ Both API and curl failed');
        console.log('\n📋 Manual fix required:');
        console.log('1. Open both Notion nodes in your workflow');
        console.log(`2. Change Database ID to: ${CORRECT_DATABASE_ID}`);
        console.log('3. Save the workflow');
        return;
      }
    }

    console.log('\n🎉 Database ID Fixed Successfully!');
    console.log('\n📋 What was fixed:');
    console.log('  ✅ Check Duplicates node → correct database');
    console.log('  ✅ Create Entry node → correct database');
    console.log('  ✅ Complete property mappings added');
    console.log('\n🚀 Your data will now flow to the CORRECT Notion database!');
    console.log(`   Database: https://www.notion.so/${CORRECT_DATABASE_ID.replace(/-/g, '')}`);
    console.log('\nTry executing the workflow now - data should appear in your Notion view!');

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.log('\n📋 Manual Database ID Fix:');
    console.log('1. Open your N8N workflow');
    console.log('2. Edit "Check Duplicates" node:');
    console.log(`   • Change Database ID to: ${CORRECT_DATABASE_ID}`);
    console.log('3. Edit "Create Entry" node:');
    console.log(`   • Change Database ID to: ${CORRECT_DATABASE_ID}`);
    console.log('4. Save the workflow and test');
  }
}

fixDatabaseId();