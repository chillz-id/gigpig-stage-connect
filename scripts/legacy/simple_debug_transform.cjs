const fs = require('fs');

console.log('🔧 ADDING DEBUG TO TRANSFORM ORDERS...');
console.log('======================================');

// Read the workflow
const workflow = JSON.parse(fs.readFileSync('/root/agents/scripts/workflow_clean.json', 'utf8'));

// Find Transform Orders node
const transformNode = workflow.nodes.find(node => node.name === 'Transform Orders');

if (!transformNode) {
  console.log('❌ Transform Orders node not found');
  process.exit(1);
}

console.log('✅ Found Transform Orders node');

// Simple debug JavaScript code to see what's being received
const debugJavaScript = `// DEBUG Transform Orders - Check what data we receive
console.log("=== TRANSFORM ORDERS DEBUG ===");
console.log("Input all:", $input.all());
console.log("Input all length:", $input.all().length);

if ($input.all().length > 0) {
  const firstInput = $input.all()[0];
  console.log("First input type:", typeof firstInput);
  console.log("First input json:", firstInput.json);
  console.log("First input json type:", typeof firstInput.json);
  
  if (firstInput.json) {
    console.log("First input json keys:", Object.keys(firstInput.json));
  }
}

console.log("Current item (\$json):", $json);
console.log("Current item type:", typeof $json);
if ($json && typeof $json === 'object') {
  console.log("Current item keys:", Object.keys($json));
}

console.log("=== END DEBUG ===");

// Return the input unchanged for now
return $input.all();`;

// Replace the JavaScript code
transformNode.parameters.jsCode = debugJavaScript;

console.log('✅ Added debug logging to Transform Orders');

// Update workflow metadata
workflow.updatedAt = new Date().toISOString();
workflow.name = 'Humanitix Historical Import - All Time (Debug)';

// Save the debug workflow
fs.writeFileSync('/root/agents/scripts/workflow_debug.json', JSON.stringify([workflow], null, 2));

console.log('✅ Debug workflow saved as workflow_debug.json');
console.log('🚀 Ready to import and test!');