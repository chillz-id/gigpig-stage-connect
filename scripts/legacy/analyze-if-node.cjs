require('dotenv').config({ path: '/root/agents/.env' });

#!/usr/bin/env node
/**
 * Analyze and fix the IF New Order node configuration
 */

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const N8N_API_URL = "http://localhost:5678/api/v1";

async function analyzeAndFixIfNode() {
  const headers = {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    console.log('🔍 Analyzing "IF New Order" node...\n');

    // Get the workflow
    const getResponse = await fetch(`${N8N_API_URL}/workflows/py2wq9zchBz0TD9j`, {
      method: 'GET',
      headers
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to get workflow: ${getResponse.status}`);
    }

    const workflow = await getResponse.json();
    
    // Find the IF New Order node
    const ifNode = workflow.nodes.find(node => node.name === 'IF New Order');
    
    if (!ifNode) {
      throw new Error('Could not find IF New Order node');
    }

    console.log('📋 Current IF New Order configuration:');
    console.log(JSON.stringify(ifNode.parameters, null, 2));
    console.log();

    // Analyze the issue
    console.log('🔍 Analysis:');
    if (ifNode.parameters.conditions) {
      const conditions = ifNode.parameters.conditions.conditions || [];
      if (conditions.length > 0) {
        const condition = conditions[0];
        console.log('  Current condition:');
        console.log(`    - Left Value: ${condition.leftValue || 'undefined'}`);
        console.log(`    - Operator: ${JSON.stringify(condition.operator)}`);
        console.log(`    - Right Value: ${condition.rightValue || 'undefined'}`);
        
        // The problem is likely here
        if (condition.leftValue === '={{ $json.length }}') {
          console.log('\n⚠️  PROBLEM FOUND:');
          console.log('  The node is checking {{ $json.length }} but Check Duplicates returns an array.');
          console.log('  It should check {{ $input.all().length }} or {{ $items().length }}');
        }
      } else {
        console.log('  ❌ No conditions defined!');
      }
    } else {
      console.log('  ❌ No conditions section found!');
    }

    // Create the correct configuration
    const correctIfConfig = {
      conditions: {
        options: {
          caseSensitive: true,
          leftValue: "",
          typeValidation: "strict"
        },
        conditions: [
          {
            id: "check-new",
            leftValue: "={{ $input.all().length }}",  // Correct way to check array length
            rightValue: 0,
            operator: {
              type: "number",
              operation: "equals",
              rightType: "number"
            }
          }
        ],
        combinator: "and"
      },
      options: {}
    };

    console.log('\n✅ Correct IF configuration should be:');
    console.log(JSON.stringify(correctIfConfig, null, 2));

    // Apply the fix
    console.log('\n🔧 Applying fix...');
    
    const updatedNodes = workflow.nodes.map(node => {
      if (node.name === 'IF New Order') {
        console.log('  • Fixing IF New Order condition');
        return {
          ...node,
          parameters: correctIfConfig
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
    console.log('\n🎉 IF New Order Fixed!');
    console.log('\n📋 What was fixed:');
    console.log('  ✅ Condition now properly checks if Check Duplicates returned 0 results');
    console.log('  ✅ Uses {{ $input.all().length }} == 0 to detect new orders');
    console.log('  ✅ Will route to Create Entry when no duplicates found');
    console.log('\n🚀 The workflow should now:');
    console.log('  1. Check for duplicates');
    console.log('  2. If NO duplicates (length == 0) → Create new entry');
    console.log('  3. If duplicates found (length > 0) → Skip creation');

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.log('\n📋 Manual fix for IF New Order:');
    console.log('1. Open the "IF New Order" node');
    console.log('2. Set condition:');
    console.log('   - Value 1: {{ $input.all().length }}');
    console.log('   - Operation: equals');
    console.log('   - Value 2: 0');
    console.log('3. This checks if Check Duplicates returned 0 results (new order)');
  }
}

analyzeAndFixIfNode();