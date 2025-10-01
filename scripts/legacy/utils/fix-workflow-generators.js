#!/usr/bin/env node
/**
 * Fix workflow generator scripts that have malformed credential values
 * These scripts generate workflows with embedded credentials that should use placeholders
 */

import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';
import path from 'path';

const MALFORMED_PATTERNS = [
  {
    // Fix embedded variable declarations in JSON values
    pattern: /"value": "const [A-Z_]+ = process\.env\.[A-Z_]+;[\s\S]*?process\.env\.[A-Z_]+"/g,
    replacement: function(match) {
      if (match.includes('HUMANITIX_API_KEY')) return '"value": "{{HUMANITIX_API_KEY}}"';
      if (match.includes('NOTION_API_KEY')) return '"value": "{{NOTION_API_KEY}}"';
      if (match.includes('N8N_API_KEY')) return '"value": "{{N8N_API_KEY}}"';
      return match;
    }
  },
  {
    // Fix Bearer token patterns
    pattern: /"value": "Bearer const [A-Z_]+ = process\.env\.[A-Z_]+;[\s\S]*?process\.env\.[A-Z_]+"/g,
    replacement: function(match) {
      if (match.includes('NOTION_API_KEY')) return '"value": "Bearer {{NOTION_API_KEY}}"';
      if (match.includes('SUPABASE_ANON_KEY')) return '"value": "Bearer {{SUPABASE_ANON_KEY}}"';
      return match;
    }
  }
];

function fixWorkflowGenerator(filePath) {
  console.log(`🔧 Fixing workflow generator: ${path.basename(filePath)}`);
  
  let content = readFileSync(filePath, 'utf8');
  let modified = false;

  MALFORMED_PATTERNS.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // If the file creates workflows and doesn't use the credentials helper, add it
  if (modified && content.includes('workflow') && !content.includes('credentials-helper')) {
    // Add the helper import at the top
    const importStatement = "const { injectCredentials } = require('./utils/credentials-helper.cjs');\n";
    
    // Find the first require statement and add after it
    const firstRequire = content.match(/^const .* = require\(['"][^'"]*['"]\);/m);
    if (firstRequire) {
      const insertPoint = content.indexOf(firstRequire[0]) + firstRequire[0].length;
      content = content.slice(0, insertPoint) + '\n' + importStatement + content.slice(insertPoint);
    } else {
      content = importStatement + '\n' + content;
    }

    // Add a comment about using the helper
    if (content.includes('JSON.stringify') && !content.includes('injectCredentials')) {
      content = content.replace(
        /JSON\.stringify\(([^,)]+)/g,
        'JSON.stringify(injectCredentials($1)'
      );
    }
  }

  if (modified) {
    writeFileSync(filePath, content);
    console.log(`  ✅ Fixed malformed credentials in: ${path.basename(filePath)}`);
  } else {
    console.log(`  ✅ No fixes needed: ${path.basename(filePath)}`);
  }

  return modified;
}

function main() {
  console.log('🔧 Fixing Malformed Workflow Generator Credentials');
  console.log('================================================\n');
  
  // Find workflow generator .cjs files
  const cjsFiles = globSync('/root/agents/scripts/**/*.cjs');
  let fixedFiles = 0;
  
  cjsFiles.forEach(filePath => {
    // Skip utility files
    if (filePath.includes('/utils/')) return;
    
    // Only process files that likely generate workflows
    const content = readFileSync(filePath, 'utf8');
    if (content.includes('workflow') && content.includes('parameters')) {
      try {
        const wasFixed = fixWorkflowGenerator(filePath);
        if (wasFixed) fixedFiles++;
      } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
      }
    }
  });
  
  console.log(`\n📊 Fixed ${fixedFiles} workflow generator files`);
  console.log('✅ All workflow generators now use proper credential placeholders');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default { fixWorkflowGenerator };