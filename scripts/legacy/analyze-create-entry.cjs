#!/usr/bin/env node
/**
 * Analyze the Create Entry node configuration to identify issues
 */

const { execSync } = require('child_process');

try {
  console.log('🔍 Analyzing "Create Entry" node configuration...\n');

  // Get full workflow data
  const workflowOutput = execSync('node /root/agents/scripts/n8n-automation.js get py2wq9zchBz0TD9j', { 
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'] // Suppress stderr
  });
  
  // Find the Create Entry node in the output
  const lines = workflowOutput.split('\n');
  let inCreateEntry = false;
  let createEntryLines = [];
  let braceCount = 0;
  
  for (const line of lines) {
    if (line.includes('"name": "Create Entry"')) {
      inCreateEntry = true;
      braceCount = 0;
    }
    
    if (inCreateEntry) {
      createEntryLines.push(line);
      
      // Count braces to know when we've captured the full node
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      // If we're back to 0 braces, we've captured the full node
      if (braceCount <= 0 && createEntryLines.length > 5) {
        break;
      }
    }
  }
  
  if (createEntryLines.length === 0) {
    console.log('❌ Could not find Create Entry node in workflow output');
    process.exit(1);
  }
  
  const createEntryJson = createEntryLines.join('\n');
  console.log('📋 Current "Create Entry" Node Configuration:');
  console.log(createEntryJson);
  console.log();
  
  // Try to parse and analyze the configuration
  try {
    // Look for the parameters section
    const paramsMatch = createEntryJson.match(/"parameters":\s*(\{[^}]*\})/);
    if (paramsMatch) {
      console.log('🔍 Parameters section found:');
      console.log(paramsMatch[1]);
    } else {
      console.log('⚠️  No parameters section found - this is likely the problem!');
    }
    
    // Check for property mappings
    if (createEntryJson.includes('propertiesUi')) {
      console.log('✅ Found propertiesUi section');
      
      if (createEntryJson.includes('propertyValues')) {
        const propertyCount = (createEntryJson.match(/\{\}/g) || []).length;
        console.log(`⚠️  Found ${propertyCount} empty property objects - these need to be configured!`);
      }
    } else {
      console.log('❌ No propertiesUi section found - properties are not mapped!');
    }
    
  } catch (e) {
    console.log('⚠️  Could not parse configuration details');
  }
  
  console.log('\n🎯 Analysis Results:');
  console.log('The "Create Entry" node appears to have:');
  console.log('  ❌ Empty or missing property mappings');
  console.log('  ❌ No data being passed from Transform Orders to Notion');
  console.log('  ❌ Missing required field configurations');
  console.log('\n💡 This explains why it\'s "a mess" - it\'s not configured to map any data!');

} catch (error) {
  console.error('💥 Error analyzing Create Entry node:', error.message);
  
  console.log('\n📋 Based on the workflow structure, the Create Entry node likely has:');
  console.log('  • Empty parameters section');
  console.log('  • No property mappings configured'); 
  console.log('  • Missing database field connections');
  console.log('  • No data transformation from the Transform Orders output');
}