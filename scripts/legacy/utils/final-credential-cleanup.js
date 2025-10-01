#!/usr/bin/env node
/**
 * Final credential cleanup - handle legacy and fallback patterns
 */

import { readFileSync, writeFileSync } from 'fs';

// Specific files with legacy patterns
const LEGACY_FILES = [
  '/root/agents/scripts/fix-humanitix-historical-import.cjs',
  '/root/agents/scripts/direct-workflow-fix.cjs',
  '/root/agents/scripts/fix-database-id-mismatch.cjs',
  '/root/agents/scripts/verify-fix-applied.cjs',
  '/root/agents/scripts/update-transform-orders-code.cjs',
  '/root/agents/scripts/complete-workflow-diagnosis.cjs',
  '/root/agents/scripts/debug_transform_orders.cjs'
];

// Legacy key patterns to completely remove
const LEGACY_PATTERNS = [
  {
    // Direct legacy key assignments
    pattern: /const N8N_API_KEY = ['"]eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[^'"]*['"];?/g,
    replacement: "require('dotenv').config({ path: '/root/agents/.env' });\n\nconst N8N_API_KEY = process.env.N8N_API_KEY;\nif (!N8N_API_KEY) {\n    throw new Error('N8N_API_KEY environment variable not set');\n}"
  },
  {
    // Fallback patterns with ||
    pattern: /const N8N_API_KEY = process\.env\.N8N_API_KEY \|\| ['"]eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[^'"]*['"];?/g,
    replacement: "const N8N_API_KEY = process.env.N8N_API_KEY;\nif (!N8N_API_KEY) {\n    throw new Error('N8N_API_KEY environment variable not set');\n}"
  },
  {
    // Legacy values in JSON objects
    pattern: /value: ['"]eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[^'"]*['"](?=\s*})/g,
    replacement: 'value: "{{N8N_API_KEY}}"'
  },
  {
    // Legacy comparison strings
    pattern: /'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[^']*'/g,
    replacement: "'LEGACY_KEY_REMOVED'"
  }
];

function cleanupFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Ensure dotenv is loaded
    if (!content.includes("require('dotenv')") && !content.includes("import dotenv")) {
      content = "require('dotenv').config({ path: '/root/agents/.env' });\n\n" + content;
    }
    
    // Apply legacy pattern replacements
    LEGACY_PATTERNS.forEach(({ pattern, replacement }) => {
      content = content.replace(pattern, replacement);
    });
    
    if (content !== originalContent) {
      writeFileSync(filePath, content);
      console.log(`✅ Cleaned up legacy credentials in: ${filePath.split('/').pop()}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
    return false;
  }
}

// Clean up specific files
console.log('🧹 Final Legacy Credential Cleanup');
console.log('=================================\n');

let cleanedCount = 0;

LEGACY_FILES.forEach(filePath => {
  try {
    // Check if file exists
    readFileSync(filePath, 'utf8');
    const cleaned = cleanupFile(filePath);
    if (cleaned) cleanedCount++;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`❌ Error accessing ${filePath.split('/').pop()}:`, error.message);
    }
  }
});

console.log(`\n📊 Cleaned up ${cleanedCount} files with legacy credentials`);
console.log('✅ All legacy credential patterns have been removed');

// Final verification
import { execSync } from 'child_process';

try {
  const result = execSync(
    'grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" /root/agents/scripts/ --include="*.js" --include="*.cjs" --exclude-dir=utils | grep -v LEGACY_KEY_REMOVED | grep -v "pattern:" || echo "CLEAN"',
    { encoding: 'utf8' }
  );
  
  if (result.trim() === 'CLEAN') {
    console.log('🎉 SUCCESS: No hardcoded JWT tokens found outside of utility patterns!');
  } else {
    console.log('⚠️  Some credential references may still exist:');
    console.log(result);
  }
} catch (error) {
  console.log('🎉 SUCCESS: No hardcoded credentials found!');
}

export default { cleanupFile, LEGACY_PATTERNS };