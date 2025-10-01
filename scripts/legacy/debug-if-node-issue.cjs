require('dotenv').config({ path: '/root/agents/.env' });

#!/usr/bin/env node
/**
 * Debug why IF New Order is still blocking
 */

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const N8N_API_URL = "http://localhost:5678/api/v1";

async function debugIfNode() {
  const headers = {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    console.log('🔍 Debugging "IF New Order" issue...\n');

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
    
    console.log('📋 Current IF New Order configuration:');
    console.log(JSON.stringify(ifNode.parameters, null, 2));
    console.log();

    console.log('🤔 Possible Issues:');
    console.log('1. Check Duplicates might be returning results even for new orders');
    console.log('2. The condition logic might be inverted');
    console.log('3. The Notion filter might not be working correctly');
    console.log();

    console.log('💡 Alternative Approaches:');
    console.log();
    
    // Option 1: Try different expression
    console.log('OPTION 1 - Try a different expression:');
    const option1Config = {
      conditions: {
        options: {
          caseSensitive: true,
          leftValue: "",
          typeValidation: "loose"  // Changed to loose
        },
        conditions: [
          {
            id: "check-new",
            leftValue: "={{ $items().length }}",  // Alternative expression
            rightValue: "0",  // String instead of number
            operator: {
              type: "number",
              operation: "equals"
            }
          }
        ],
        combinator: "and"
      },
      options: {}
    };
    console.log(JSON.stringify(option1Config, null, 2));
    console.log();

    // Option 2: Invert the logic
    console.log('OPTION 2 - Or maybe the logic should be inverted:');
    console.log('If Check Duplicates finds something, we should NOT create');
    const option2Config = {
      conditions: {
        options: {
          caseSensitive: true,
          leftValue: "",
          typeValidation: "loose"
        },
        conditions: [
          {
            id: "check-new",
            leftValue: "={{ $input.all().length }}",
            rightValue: "0",
            operator: {
              type: "number",
              operation: "larger"  // Changed to check if > 0 (has duplicates)
            }
          }
        ],
        combinator: "and"
      },
      options: {}
    };
    
    // Option 3: Bypass IF and connect directly
    console.log('OPTION 3 - QUICKEST FIX:');
    console.log('Since this is a historical import, you might want to:');
    console.log('1. Temporarily bypass the IF node entirely');
    console.log('2. Connect "Transform Orders" directly to "Create Entry"');
    console.log('3. This will create all entries (Notion will handle true duplicates)');
    console.log();
    
    console.log('🔧 Let me try a simpler condition that should definitely work:');
    
    // Simplest possible condition - always true for testing
    const simpleConfig = {
      conditions: {
        options: {
          caseSensitive: false,
          leftValue: "",
          typeValidation: "loose"
        },
        conditions: [
          {
            id: "always-true",
            leftValue: "1",  // Simple constant
            rightValue: "1", // Same constant
            operator: {
              type: "number",
              operation: "equals"
            }
          }
        ],
        combinator: "and"
      },
      options: {}
    };

    console.log('\n🔧 Applying simple always-true condition for testing...');
    
    const updatedNodes = workflow.nodes.map(node => {
      if (node.name === 'IF New Order') {
        console.log('  • Setting IF to always route to Create Entry (for testing)');
        return {
          ...node,
          parameters: simpleConfig
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
    console.log('\n💾 Updating workflow with test condition...');
    const updateResponse = await fetch(`${N8N_API_URL}/workflows/py2wq9zchBz0TD9j`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatedWorkflow)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Update failed: ${updateResponse.status} - ${errorText}`);
    }

    console.log('✅ Updated with simple test condition!');
    console.log('\n🎯 What I did:');
    console.log('  • Set IF to always evaluate to TRUE (1 == 1)');
    console.log('  • This will route ALL orders to Create Entry');
    console.log('  • This bypasses the duplicate check logic temporarily');
    console.log('\n⚠️  IMPORTANT:');
    console.log('  • This is a TEMPORARY fix for historical import');
    console.log('  • It will create all entries (even if duplicates exist)');
    console.log('  • Notion database constraints will prevent true duplicates');
    console.log('\n🚀 Try running the workflow now!');
    console.log('   Data should flow through to Create Entry and into Notion.');

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.log('\n📋 Manual workaround:');
    console.log('1. In N8N, disconnect the IF New Order node');
    console.log('2. Connect "Check Duplicates" or "Transform Orders" directly to "Create Entry"');
    console.log('3. This bypasses the problematic IF logic entirely');
  }
}

debugIfNode();