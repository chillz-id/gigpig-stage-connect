#!/usr/bin/env node

/**
 * Claude Code Comprehensive Startup Check
 * MANDATORY: Run this at the start of EVERY Claude Code session
 * 
 * Includes:
 * 1. Knowledge Graph status check
 * 2. MCP configuration verification
 * 3. Database connectivity test
 * 4. Critical system health checks
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Claude Code Startup Check - Stand Up Sydney Platform');
console.log('='.repeat(70));
console.log(`📅 Date: ${new Date().toISOString()}`);
console.log('='.repeat(70));

let criticalIssues = [];
let warnings = [];
let successChecks = [];

// 1. Check Knowledge Graph Status
console.log('\n1️⃣  Knowledge Graph Status Check');
console.log('-'.repeat(50));
try {
  // Check if knowledge graph scripts exist
  const kgPath = '/root/.claude-multi-agent/scripts/claude-graph-integration.js';
  if (existsSync(kgPath)) {
    console.log('✅ Knowledge Graph scripts found');
    successChecks.push('Knowledge Graph available');
    
    // Check for recent critical issues
    const kgEntriesPath = '/root/agents/knowledge-graph-entries';
    if (existsSync(kgEntriesPath)) {
      const entries = execSync(`find ${kgEntriesPath} -name "*.json" -mtime -7 | wc -l`).toString().trim();
      if (parseInt(entries) > 0) {
        warnings.push(`📊 ${entries} Knowledge Graph entries from last 7 days - review recommended`);
      }
    }
  } else {
    warnings.push('⚠️  Knowledge Graph scripts not found at expected location');
  }
} catch (error) {
  warnings.push('⚠️  Could not check Knowledge Graph status');
}

// 2. MCP Configuration Verification
console.log('\n2️⃣  MCP Configuration Verification');
console.log('-'.repeat(50));
try {
  const mcpConfig = JSON.parse(readFileSync('.mcp.json', 'utf8'));
  let mcpIssues = 0;
  let mcpReady = 0;
  let totalMcp = 0;
  
  for (const [serverName, config] of Object.entries(mcpConfig.mcpServers)) {
    totalMcp++;
    let hasIssue = false;
    
    if (config.env) {
      for (const [envVar, value] of Object.entries(config.env)) {
        if (typeof value === 'string') {
          if (value.includes('PLACEHOLDER') || value.includes('YOUR_') || 
              value.includes('_HERE') || value.includes('NEEDS_')) {
            mcpIssues++;
            hasIssue = true;
            criticalIssues.push(`❌ MCP ${serverName}: ${envVar} has placeholder token`);
          }
        }
      }
    }
    
    if (!hasIssue) {
      mcpReady++;
    }
  }
  
  const mcpPercentage = Math.round((mcpReady / totalMcp) * 100);
  console.log(`📊 MCP Servers: ${mcpReady}/${totalMcp} ready (${mcpPercentage}%)`);
  
  if (mcpPercentage === 100) {
    successChecks.push('✅ All MCP servers configured correctly');
  } else if (mcpPercentage >= 80) {
    warnings.push(`⚠️  ${totalMcp - mcpReady} MCP servers need tokens`);
  } else {
    criticalIssues.push(`❌ Only ${mcpPercentage}% of MCP servers ready`);
  }
  
  // Special check for Supabase Personal Access Token
  if (mcpConfig.mcpServers.supabase?.env?.SUPABASE_ACCESS_TOKEN) {
    const token = mcpConfig.mcpServers.supabase.env.SUPABASE_ACCESS_TOKEN;
    if (!token.startsWith('sbp_') || token.includes('NEEDS_')) {
      criticalIssues.push('❌ Supabase Personal Access Token missing - MCP tools won\'t work!');
    } else {
      successChecks.push('✅ Supabase MCP token configured');
    }
  }
  
} catch (error) {
  criticalIssues.push('❌ Could not read MCP configuration');
}

// 3. Database Connectivity Test
console.log('\n3️⃣  Database Connectivity Test');
console.log('-'.repeat(50));
try {
  // Check if Supabase environment variables exist
  const envContent = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
  const hasSupabaseUrl = envContent.includes('SUPABASE_URL=');
  const hasSupabaseKey = envContent.includes('SUPABASE_ANON_KEY=');
  
  if (hasSupabaseUrl && hasSupabaseKey) {
    console.log('✅ Supabase credentials found in .env');
    successChecks.push('Database credentials configured');
  } else {
    criticalIssues.push('❌ Missing Supabase credentials in .env');
  }
} catch (error) {
  warnings.push('⚠️  Could not verify database configuration');
}

// 4. Critical System Health Checks
console.log('\n4️⃣  Critical System Health Checks');
console.log('-'.repeat(50));

// Check for critical files
const criticalFiles = [
  { path: '/root/agents/package.json', name: 'Package.json' },
  { path: '/root/agents/src/App.tsx', name: 'Main App component' },
  { path: '/root/agents/vite.config.ts', name: 'Vite configuration' },
  { path: '/root/CLAUDE.md', name: 'CLAUDE.md instructions' }
];

criticalFiles.forEach(file => {
  if (existsSync(file.path)) {
    console.log(`✅ ${file.name} found`);
  } else {
    criticalIssues.push(`❌ Missing critical file: ${file.name}`);
  }
});

// Check for known critical issues from Knowledge Graph
console.log('\n5️⃣  Known Critical Issues Check');
console.log('-'.repeat(50));
const knownIssues = [
  {
    check: () => {
      // Check if profile system is properly configured
      const migrationPath = '/root/agents/supabase/migrations';
      if (existsSync(migrationPath)) {
        const hasProfileTrigger = execSync(`grep -r "handle_new_user" ${migrationPath} 2>/dev/null || echo ""`).toString();
        return hasProfileTrigger.length > 0;
      }
      return false;
    },
    issue: 'Profile creation trigger',
    warning: '⚠️  Profile creation trigger may be missing - check database'
  }
];

knownIssues.forEach(issue => {
  try {
    if (!issue.check()) {
      warnings.push(issue.warning);
    } else {
      console.log(`✅ ${issue.issue} appears configured`);
    }
  } catch (error) {
    // Silently skip if check fails
  }
});

// Summary
console.log('\n' + '='.repeat(70));
console.log('📊 STARTUP CHECK SUMMARY');
console.log('='.repeat(70));

if (successChecks.length > 0) {
  console.log('\n✅ Successful Checks:');
  successChecks.forEach(check => console.log(`   - ${check}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(warning => console.log(`   - ${warning}`));
}

if (criticalIssues.length > 0) {
  console.log('\n❌ CRITICAL ISSUES:');
  criticalIssues.forEach(issue => console.log(`   - ${issue}`));
  console.log('\n🚨 CRITICAL ISSUES FOUND - IMMEDIATE ACTION REQUIRED!');
} else {
  console.log('\n✅ No critical issues found - ready to proceed!');
}

// Recommendations
console.log('\n📋 MANDATORY NEXT STEPS:');
console.log('1. If critical issues found, address them before proceeding');
console.log('2. Before any major work, query Knowledge Graph:');
console.log('   node /root/.claude-multi-agent/scripts/claude-graph-integration.js check "your task"');
console.log('3. For MCP issues, run: node verify-mcp-ready.js');
console.log('4. Document any new issues in Knowledge Graph');

console.log('\n' + '='.repeat(70));
console.log('✅ Startup check complete!');
console.log('='.repeat(70));

// Exit with error code if critical issues found
if (criticalIssues.length > 0) {
  process.exit(1);
}