#!/usr/bin/env node
/**
 * Check what the actual output format is from the Notion Check Duplicates node
 */

console.log('🔍 Analyzing Notion node output format...\n');

console.log('📚 Notion "Get All" operation typically returns one of these formats:\n');

console.log('FORMAT 1 - Array of items (most common):');
console.log('[');
console.log('  { json: { id: "xxx", properties: {...} } },');
console.log('  { json: { id: "yyy", properties: {...} } }');
console.log(']');
console.log('Check with: {{ $input.all().length }}');
console.log();

console.log('FORMAT 2 - Single object with results array:');
console.log('{');
console.log('  json: {');
console.log('    results: [...],');
console.log('    has_more: false,');
console.log('    next_cursor: null');
console.log('  }');
console.log('}');
console.log('Check with: {{ $json.results.length }}');
console.log();

console.log('FORMAT 3 - N8N items array:');
console.log('Each item as: { json: {...}, pairedItem: {...} }');
console.log('Check with: {{ $items().length }}');
console.log();

console.log('🎯 To find out which format YOUR Notion node returns:');
console.log();
console.log('OPTION 1 - Add a Code node after Check Duplicates:');
console.log('1. Add a Code node between "Check Duplicates" and "IF New Order"');
console.log('2. Use this code:');
console.log('   console.log("Input type:", typeof $input.all());');
console.log('   console.log("Input length:", $input.all().length);');
console.log('   console.log("First item:", JSON.stringify($input.all()[0]));');
console.log('   console.log("Items length:", $items().length);');
console.log('   return $input.all();');
console.log('3. Run the workflow and check the console output');
console.log();

console.log('OPTION 2 - Test with a Set node:');
console.log('1. Add a Set node after Check Duplicates');
console.log('2. Set values:');
console.log('   - inputLength: {{ $input.all().length }}');
console.log('   - itemsLength: {{ $items().length }}');
console.log('   - jsonType: {{ typeof $json }}');
console.log('   - hasResults: {{ $json.results ? true : false }}');
console.log('3. Run and see which expressions work');
console.log();

console.log('📋 Most likely correct conditions for IF New Order:');
console.log();
console.log('IF NOTION RETURNS ARRAY:');
console.log('  Left Value: {{ $input.all().length }}');
console.log('  Operation: equals');
console.log('  Right Value: 0');
console.log();

console.log('IF NOTION RETURNS OBJECT WITH RESULTS:');
console.log('  Left Value: {{ $json.results ? $json.results.length : 0 }}');
console.log('  Operation: equals');
console.log('  Right Value: 0');
console.log();

console.log('UNIVERSAL SAFE CONDITION:');
console.log('  Left Value: {{ ($json.results ? $json.results.length : 0) || ($input.all() ? $input.all().length : 0) || 0 }}');
console.log('  Operation: equals');
console.log('  Right Value: 0');
console.log();

console.log('🔧 The workflow is currently using: {{ $json.length }}');
console.log('❌ This WILL NOT WORK because $json is an object, not an array!');
console.log();
console.log('💡 Most likely fix: Use {{ $input.all().length }} == 0');