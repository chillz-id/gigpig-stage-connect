require('dotenv').config({ path: '/root/agents/.env' });

#!/usr/bin/env node
/**
 * Add a debug node to see Notion output format, then fix the IF condition
 */

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const N8N_API_URL = "http://localhost:5678/api/v1";

async function addDebugAndFix() {
  const headers = {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    console.log('🔧 Adding debug node and fixing IF condition...\n');

    // Get the workflow
    const getResponse = await fetch(`${N8N_API_URL}/workflows/py2wq9zchBz0TD9j`, {
      method: 'GET',
      headers
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to get workflow: ${getResponse.status}`);
    }

    const workflow = await getResponse.json();

    // Find relevant nodes
    const checkDuplicatesNode = workflow.nodes.find(node => node.name === 'Check Duplicates');
    const ifNode = workflow.nodes.find(node => node.name === 'IF New Order');

    if (!checkDuplicatesNode || !ifNode) {
      throw new Error('Could not find required nodes');
    }

    console.log('📍 Current positions:');
    console.log('  Check Duplicates:', checkDuplicatesNode.position);
    console.log('  IF New Order:', ifNode.position);

    // Create a debug node between Check Duplicates and IF New Order
    const debugNode = {
      parameters: {
        jsCode: `// Debug: Check what Notion returns
console.log("=== NOTION DEBUG ===");
console.log("Input all length:", $input.all().length);
console.log("Items length:", $items().length);
console.log("JSON type:", typeof $json);
console.log("Has results property:", $json.results ? true : false);
if ($json.results) {
  console.log("Results length:", $json.results.length);
}
console.log("First input item:", JSON.stringify($input.all()[0], null, 2));
console.log("=== END DEBUG ===");

// Pass data through unchanged
return $input.all();`
      },
      id: "debug-notion-output",
      name: "Debug Notion Output",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [
        1900,  // Between Check Duplicates (1792) and IF New Order (2000)
        304
      ]
    };

    // Fix the IF condition with the most likely correct expression
    const fixedIfParameters = {
      conditions: {
        options: {
          caseSensitive: true,
          leftValue: "",
          typeValidation: "loose"
        },
        conditions: [
          {
            id: "check-new-fixed",
            leftValue: "={{ $input.all().length }}",  // Most likely correct
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

    // Update nodes array
    const updatedNodes = workflow.nodes.map(node => {
      if (node.name === 'IF New Order') {
        console.log('  • Fixing IF New Order condition');
        return {
          ...node,
          parameters: fixedIfParameters
        };
      }
      return node;
    });

    // Add the debug node
    updatedNodes.push(debugNode);

    // Update connections to route through debug node
    const updatedConnections = { ...workflow.connections };

    // Check Duplicates → Debug Node
    updatedConnections["Check Duplicates"] = {
      main: [
        [
          {
            node: "Debug Notion Output",
            type: "main",
            index: 0
          }
        ]
      ]
    };

    // Debug Node → IF New Order
    updatedConnections["Debug Notion Output"] = {
      main: [
        [
          {
            node: "IF New Order",
            type: "main",
            index: 0
          }
        ]
      ]
    };

    const updatedWorkflow = {
      name: workflow.name,
      nodes: updatedNodes,
      connections: updatedConnections,
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

    console.log('✅ Updated workflow with debug node!');
    console.log('\n🎯 What I added:');
    console.log('  ✅ Debug node between Check Duplicates and IF New Order');
    console.log('  ✅ Fixed IF condition to use {{ $input.all().length }} == 0');
    console.log('  ✅ Updated connections to route through debug node');
    console.log('\n🔍 Now run the workflow and check the execution logs!');
    console.log('   The debug output will show exactly what format Notion returns.');
    console.log('   Then we can fix the IF condition with the correct expression.');
    console.log('\n📋 In N8N executions, look for console output like:');
    console.log('   "=== NOTION DEBUG ==="');
    console.log('   This will tell us the correct format and expression to use.');

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.log('\n📋 Manual steps to debug:');
    console.log('1. Add a Code node between "Check Duplicates" and "IF New Order"');
    console.log('2. Use this debug code:');
    console.log('   console.log("Input length:", $input.all().length);');
    console.log('   console.log("JSON type:", typeof $json);');
    console.log('   return $input.all();');
    console.log('3. Run workflow and check console output');
  }
}

addDebugAndFix();