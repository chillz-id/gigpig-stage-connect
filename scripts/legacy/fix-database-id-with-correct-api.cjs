#!/usr/bin/env node
/**
 * Fix database ID mismatch using the correct N8N API key
 */

const { execSync } = require('child_process');
require('dotenv').config({ path: '/root/agents/.env' });

const fs = require('fs');

// CORRECT N8N API KEY from user
const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const N8N_API_URL = "http://localhost:5678/api/v1";

// CORRECT Database ID from user's Notion URL
const CORRECT_DATABASE_ID = "1374745b-8cbe-804b-87a2-ec93b3385e01";

async function fixDatabaseIdNow() {
  const headers = {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    console.log('🔧 Fixing Database ID with correct API key...\n');
    console.log(`✅ Correct Database ID: ${CORRECT_DATABASE_ID}`);
    console.log();

    // Get the workflow directly with correct API key
    console.log('📥 Getting workflow...');
    const getResponse = await fetch(`${N8N_API_URL}/workflows/py2wq9zchBz0TD9j`, {
      method: 'GET',
      headers
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to get workflow: ${getResponse.status}`);
    }

    const workflow = await getResponse.json();
    console.log('✅ Got workflow:', workflow.name);
    console.log('🔧 Updating database IDs...\n');

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
      
      // Fix Create Entry node with complete mappings
      if (node.name === 'Create Entry' && node.type === 'n8n-nodes-base.notion') {
        console.log('  • Fixing "Create Entry" database ID and adding property mappings');
        
        updatedNode.parameters = {
          resource: "databasePage",
          operation: "create",
          databaseId: CORRECT_DATABASE_ID,
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

    console.log(`\n✅ Fixed ${fixedCount} Notion nodes`);

    // Create updated workflow
    const updatedWorkflow = {
      name: workflow.name,
      nodes: updatedNodes,
      connections: workflow.connections,
      settings: workflow.settings
    };

    // Update the workflow
    console.log('\n💾 Updating workflow...');
    const updateResponse = await fetch(`${N8N_API_URL}/workflows/py2wq9zchBz0TD9j`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatedWorkflow)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Update failed: ${updateResponse.status} - ${errorText}`);
    }

    console.log('✅ Workflow updated successfully!');
    console.log('\n🎉 Database ID Fixed!');
    console.log('\n📋 What was fixed:');
    console.log('  ✅ Check Duplicates → correct database ID');
    console.log('  ✅ Create Entry → correct database ID + property mappings');
    console.log('\n🚀 Your data will now flow to:');
    console.log(`   https://www.notion.so/${CORRECT_DATABASE_ID.replace(/-/g, '')}`);
    console.log('\n✨ Execute the workflow now - data will appear in your Notion database!');

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.log('\n📋 If automatic fix failed, manual steps:');
    console.log('1. Open both Notion nodes in N8N');
    console.log(`2. Change Database ID to: ${CORRECT_DATABASE_ID}`);
    console.log('3. Save and test the workflow');
  }
}

fixDatabaseIdNow();