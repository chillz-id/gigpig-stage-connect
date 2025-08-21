#!/usr/bin/env node

/**
 * Verify MCP Configuration is Ready for Testing
 * Checks that all placeholder tokens have been replaced with real values
 */

import { readFileSync } from 'fs';

console.log('🔍 Verifying MCP Configuration Readiness');
console.log('='.repeat(50));

try {
  // Read MCP configuration
  const mcpConfig = JSON.parse(readFileSync('.mcp.json', 'utf8'));
  
  let placeholderCount = 0;
  let workingTokens = 0;
  let totalServers = 0;
  
  const results = [];
  
  // Check each MCP server
  for (const [serverName, config] of Object.entries(mcpConfig.mcpServers)) {
    totalServers++;
    
    console.log(`\n📋 Checking ${serverName}:`);
    
    if (!config.env) {
      console.log('   ✅ No environment tokens required');
      results.push({ name: serverName, status: '✅ Ready', issues: [] });
      workingTokens++;
      continue;
    }
    
    const issues = [];
    let serverReady = true;
    
    for (const [envVar, value] of Object.entries(config.env)) {
      if (typeof value === 'string') {
        if (value.includes('YOUR_') || value.includes('_HERE') || value.includes('CONTACT_OWNER') || value.includes('GET_FROM')) {
          console.log(`   ❌ ${envVar}: PLACEHOLDER DETECTED`);
          placeholderCount++;
          issues.push(`${envVar}: Placeholder token`);
          serverReady = false;
        } else if (value.includes('PLACEHOLDER') || value.includes('NEEDS_')) {
          console.log(`   ⚠️  ${envVar}: Needs real token`);
          placeholderCount++;
          issues.push(`${envVar}: Needs real token`);
          serverReady = false;
        } else {
          console.log(`   ✅ ${envVar}: Token configured`);
        }
      }
    }
    
    if (serverReady) {
      workingTokens++;
    }
    
    const status = serverReady ? '✅ Ready' : (issues.length === 1 && issues[0].includes('Needs real token') ? '⚠️  Needs Token' : '❌ Not Ready');
    results.push({ name: serverName, status, issues });
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 MCP Configuration Summary:');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    console.log(`${result.status.padEnd(15)} ${result.name}`);
    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`                    - ${issue}`);
      });
    }
  });
  
  console.log('\n📈 Statistics:');
  console.log(`✅ Ready Servers: ${workingTokens}`);
  console.log(`⚠️  Need Tokens: ${totalServers - workingTokens}`);
  console.log(`❌ Placeholder Tokens Found: ${placeholderCount}`);
  console.log(`📊 Total Servers: ${totalServers}`);
  
  // Status assessment
  const readyPercentage = Math.round((workingTokens / totalServers) * 100);
  
  console.log('\n🎯 Readiness Assessment:');
  if (readyPercentage >= 80) {
    console.log(`🚀 ${readyPercentage}% READY - Most services will work!`);
  } else if (readyPercentage >= 60) {
    console.log(`🔧 ${readyPercentage}% READY - Several fixes needed`);
  } else {
    console.log(`❌ ${readyPercentage}% READY - Major configuration issues`);
  }
  
  // Next steps
  console.log('\n📋 Next Steps:');
  const needsTokens = results.filter(r => r.status.includes('Needs Token') || r.status.includes('Not Ready'));
  
  if (needsTokens.length === 0) {
    console.log('✅ All servers ready! MCP tools should work after Claude Code restart.');
  } else {
    console.log('🔧 Fix these servers for full functionality:');
    needsTokens.forEach(server => {
      console.log(`   - ${server.name}: ${server.issues.join(', ')}`);
    });
  }
  
} catch (error) {
  console.error('❌ Error reading MCP configuration:', error.message);
  process.exit(1);
}

console.log('\n✅ Configuration check complete!');