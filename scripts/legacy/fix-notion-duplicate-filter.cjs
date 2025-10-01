#!/usr/bin/env node
/**
 * Fix the Notion Check Duplicates node to properly filter by Order ID
 */

const { execSync } = require('child_process');
const fs = require('fs');

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const N8N_API_URL = "http://localhost:5678/api/v1";

async function fixNotionDuplicateFilter() {
  try {
    console.log('🔧 Fixing Notion duplicate check to properly filter by Order ID...\n');

    // Create the corrected Notion node configuration for proper Order ID filtering
    const correctNotionConfig = {
      resource: "databasePage",
      operation: "getAll",
      databaseId: "2304745b-8cbe-81cd-9483-d7acc2377bd6",
      filterType: "manual",
      filters: {
        conditions: [
          {
            key: "Order ID", // This should match your Notion database field name
            condition: "rich_text",
            operation: "equals",
            value: "={{ $json.orderId }}" // Get the Order ID from the transformed data
          }
        ]
      },
      simplifyOutput: false,
      options: {}
    };

    console.log('✅ Correct Notion filter configuration:');
    console.log(JSON.stringify(correctNotionConfig, null, 2));
    console.log();

    // Attempt to get and update workflow
    try {
      const workflowOutput = execSync('node /root/agents/scripts/n8n-automation.js get py2wq9zchBz0TD9j 2>/dev/null', { encoding: 'utf8' });
      
      // Try to extract workflow data
      let workflow = null;
      
      // Look for the JSON structure in the output
      const lines = workflowOutput.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('{') && lines[i].includes('workflow')) {
          try {
            const jsonStr = lines.slice(i).join('\n');
            const parsed = JSON.parse(jsonStr);
            if (parsed.workflow) {
              workflow = parsed.workflow;
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }

      if (workflow) {
        console.log('📥 Got workflow data, updating Check Duplicates node...');
        
        // Update the Check Duplicates node
        const updatedNodes = workflow.nodes.map(node => {
          if (node.name === 'Check Duplicates') {
            console.log('  • Applying correct Order ID filter configuration');
            return {
              ...node,
              parameters: correctNotionConfig
            };
          }
          return node;
        });

        const updatedWorkflow = {
          name: workflow.name,
          nodes: updatedNodes,
          connections: workflow.connections,
          settings: workflow.settings
        };

        // Try API update
        const headers = {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        };

        const response = await fetch(`${N8N_API_URL}/workflows/py2wq9zchBz0TD9j`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(updatedWorkflow)
        });

        if (response.ok) {
          console.log('✅ Workflow updated successfully via API!');
        } else {
          throw new Error('API update failed');
        }

      } else {
        throw new Error('Could not extract workflow data');
      }

    } catch (autoError) {
      console.log('⚠️  Automatic update failed, providing manual fix instructions...\n');
      
      console.log('🔧 MANUAL FIX for Check Duplicates Node:');
      console.log('1. Open the "Check Duplicates" node in your N8N workflow');
      console.log('2. Configure it exactly as follows:');
      console.log('   • Resource: Database Page');
      console.log('   • Operation: Get All');
      console.log('   • Database: Keep your current database selection');
      console.log('   • Filter Type: Manual');
      console.log('   • Filters > Add Condition:');
      console.log('     - Property: Order ID');
      console.log('     - Condition: Text > Equals');
      console.log('     - Value: {{ $json.orderId }}');
      console.log('3. Save the workflow');
      console.log();
    }

    console.log('🎯 What This Fix Does:');
    console.log('  ✅ Properly queries Notion database for existing Order ID');
    console.log('  ✅ Uses correct field name and filter syntax');
    console.log('  ✅ Gets Order ID from transformed data ({{ $json.orderId }})');
    console.log('  ✅ Returns matching entries for duplicate detection');
    console.log();
    
    console.log('📋 Workflow Logic After Fix:');
    console.log('  1. Transform Orders → generates orderId field');
    console.log('  2. Check Duplicates → queries Notion for existing orderId');
    console.log('  3. IF New Order → checks if query returned 0 results');
    console.log('  4. Create Entry → only creates if no duplicates found');
    console.log();
    
    console.log('🚀 This preserves duplicate checking while fixing the technical error!');

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.log('\n📋 If all else fails, manual configuration:');
    console.log('Check Duplicates node settings:');
    console.log('- Resource: Database Page');
    console.log('- Operation: Get All');  
    console.log('- Filters: Property = "Order ID", Condition = "Equals", Value = "{{ $json.orderId }}"');
  }
}

fixNotionDuplicateFilter();