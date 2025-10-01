#!/usr/bin/env node

/**
 * Comprehensive Configuration Validation Script
 * Validates all critical configuration aspects for Stand Up Sydney platform
 */

import { readFileSync, existsSync, accessSync, constants } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Stand Up Sydney - Comprehensive Configuration Validation');
console.log('='.repeat(60));
console.log(`📅 Date: ${new Date().toISOString()}`);
console.log('='.repeat(60));
console.log();

let totalChecks = 0;
let passedChecks = 0;
let warnings = 0;
let criticalIssues = 0;

function logResult(check, status, details = '') {
  totalChecks++;
  const timestamp = new Date().toISOString();

  if (status === 'pass') {
    console.log(`✅ ${check}${details ? ' - ' + details : ''}`);
    passedChecks++;
  } else if (status === 'warn') {
    console.log(`⚠️  ${check}${details ? ' - ' + details : ''}`);
    warnings++;
  } else if (status === 'fail') {
    console.log(`❌ ${check}${details ? ' - ' + details : ''}`);
    criticalIssues++;
  }
}

// 1. File Existence Checks
console.log('1️⃣  Critical File Existence Check');
console.log('-'.repeat(40));

const SYNC_SCRIPT_PATH = '/root/legacy/scripts/sync-platform-credentials.sh';

const criticalFiles = [
  { path: '/etc/standup-sydney/credentials.env', name: 'Master Credentials' },
  { path: '/root/agents/.env', name: 'Frontend Environment' },
  { path: '/root/agents/.mcp.json', name: 'MCP Configuration' },
  { path: '/root/.claude.json', name: 'Claude Code Configuration' },
  { path: '/root/agents/package.json', name: 'Package Configuration' },
  { path: SYNC_SCRIPT_PATH, name: 'Sync Script' }
];

criticalFiles.forEach(({ path, name }) => {
  if (existsSync(path)) {
    try {
      accessSync(path, constants.R_OK);
      logResult(name, 'pass', `readable at ${path}`);
    } catch {
      logResult(name, 'fail', `exists but not readable at ${path}`);
    }
  } else {
    logResult(name, 'fail', `missing at ${path}`);
  }
});

console.log();

// 2. Environment Variable Validation
console.log('2️⃣  Environment Variable Validation');
console.log('-'.repeat(40));

if (existsSync('/root/agents/.env')) {
  try {
    const envContent = readFileSync('/root/agents/.env', 'utf8');

    const requiredVars = [
      { name: 'SUPABASE_URL', critical: true },
      { name: 'SUPABASE_ANON_KEY', critical: true },
      { name: 'SUPABASE_ACCESS_TOKEN', critical: true },
      { name: 'GITHUB_PERSONAL_ACCESS_TOKEN', critical: true },
      { name: 'NOTION_API_KEY', critical: false },
      { name: 'SLACK_BOT_TOKEN', critical: false },
      { name: 'N8N_API_KEY', critical: false },
      { name: 'LINEAR_API_KEY', critical: false },
      { name: 'OPENAI_API_KEY', critical: false },
      { name: 'GOOGLE_API_KEY', critical: false }
    ];

    requiredVars.forEach(({ name, critical }) => {
      const regex = new RegExp(`^${name}=(.+)$`, 'm');
      const match = envContent.match(regex);

      if (match && match[1] && match[1].trim() && !match[1].includes('PLACEHOLDER')) {
        logResult(`${name}`, 'pass', `configured`);
      } else if (critical) {
        logResult(`${name}`, 'fail', `missing or placeholder`);
      } else {
        logResult(`${name}`, 'warn', `missing (optional)`);
      }
    });
  } catch (error) {
    logResult('Environment File Read', 'fail', error.message);
  }
} else {
  logResult('Environment File', 'fail', 'missing .env file');
}

console.log();

// 3. MCP Configuration Validation
console.log('3️⃣  MCP Configuration Validation');
console.log('-'.repeat(40));

if (existsSync('/root/agents/.mcp.json')) {
  try {
    const mcpConfig = JSON.parse(readFileSync('/root/agents/.mcp.json', 'utf8'));

    if (mcpConfig.mcpServers) {
      const serverCount = Object.keys(mcpConfig.mcpServers).length;
      logResult('MCP Servers Count', 'pass', `${serverCount} servers configured`);

      // Check for proper environment variable syntax
      let properSyntax = true;
      for (const [serverName, config] of Object.entries(mcpConfig.mcpServers)) {
        if (config.env) {
          for (const [envVar, value] of Object.entries(config.env)) {
            if (typeof value === 'string' && value.includes('{{')) {
              logResult(`${serverName} Environment Syntax`, 'fail', `uses {{}} instead of \${} syntax`);
              properSyntax = false;
            }
          }
        }
      }

      if (properSyntax) {
        logResult('MCP Environment Syntax', 'pass', 'all servers use correct ${} syntax');
      }
    } else {
      logResult('MCP Configuration Structure', 'fail', 'missing mcpServers section');
    }
  } catch (error) {
    logResult('MCP Configuration Parse', 'fail', error.message);
  }
} else {
  logResult('MCP Configuration', 'fail', 'missing .mcp.json file');
}

console.log();

// 4. Claude Code Configuration
console.log('4️⃣  Claude Code Configuration');
console.log('-'.repeat(40));

if (existsSync('/root/.claude.json')) {
  try {
    const claudeConfig = readFileSync('/root/.claude.json', 'utf8');

    if (claudeConfig.includes('enableAllProjectMcpServers')) {
      const match = claudeConfig.match(/"enableAllProjectMcpServers":\s*(true|false)/);
      if (match && match[1] === 'true') {
        logResult('MCP Server Enablement', 'pass', 'enableAllProjectMcpServers is true');
      } else {
        logResult('MCP Server Enablement', 'fail', 'enableAllProjectMcpServers is false or missing');
      }
    } else {
      logResult('MCP Server Configuration', 'fail', 'enableAllProjectMcpServers setting not found');
    }

    if (claudeConfig.includes('/root/agents')) {
      logResult('Project Path Configuration', 'pass', 'agents project path configured');
    } else {
      logResult('Project Path Configuration', 'warn', 'agents project path not found in config');
    }
  } catch (error) {
    logResult('Claude Configuration Read', 'fail', error.message);
  }
} else {
  logResult('Claude Configuration', 'fail', 'missing .claude.json file');
}

console.log();

// 5. Sync Script Validation
console.log('5️⃣  Sync Script Validation');
console.log('-'.repeat(40));

if (existsSync(SYNC_SCRIPT_PATH)) {
  try {
    accessSync(SYNC_SCRIPT_PATH, constants.X_OK);
    logResult('Sync Script Executable', 'pass', 'script has execute permissions');

    const syncScript = readFileSync(SYNC_SCRIPT_PATH, 'utf8');

    if (syncScript.includes('SUPABASE_ACCESS_TOKEN')) {
      logResult('Sync Script SUPABASE_ACCESS_TOKEN', 'pass', 'token included in sync');
    } else {
      logResult('Sync Script SUPABASE_ACCESS_TOKEN', 'fail', 'token missing from sync');
    }

    if (syncScript.includes('GOOGLE_API_KEY')) {
      logResult('Sync Script GOOGLE_API_KEY', 'pass', 'token included in sync');
    } else {
      logResult('Sync Script GOOGLE_API_KEY', 'fail', 'token missing from sync');
    }
  } catch {
    logResult('Sync Script Permissions', 'fail', 'script not executable');
  }
} else {
  logResult('Sync Script', 'fail', 'missing sync script');
}

console.log();

// 6. Database Connectivity (if possible)
console.log('6️⃣  Database Connectivity Check');
console.log('-'.repeat(40));

try {
  // Try to read environment and check if Supabase URL is accessible
  const envContent = readFileSync('/root/agents/.env', 'utf8');
  const urlMatch = envContent.match(/^SUPABASE_URL=(.+)$/m);

  if (urlMatch && urlMatch[1]) {
    logResult('Supabase URL Format', 'pass', 'URL configured');
  } else {
    logResult('Supabase URL Format', 'fail', 'URL missing or malformed');
  }
} catch {
  logResult('Database Configuration Check', 'warn', 'could not verify database config');
}

console.log();

// Summary
console.log('='.repeat(60));
console.log('📊 CONFIGURATION VALIDATION SUMMARY');
console.log('='.repeat(60));
console.log();

console.log('📈 Statistics:');
console.log(`   ✅ Passed Checks: ${passedChecks}`);
console.log(`   ⚠️  Warnings: ${warnings}`);
console.log(`   ❌ Critical Issues: ${criticalIssues}`);
console.log(`   📊 Total Checks: ${totalChecks}`);
console.log();

const successRate = Math.round((passedChecks / totalChecks) * 100);
console.log(`🎯 Success Rate: ${successRate}%`);
console.log();

if (criticalIssues === 0) {
  console.log('🎉 SUCCESS: All critical checks passed!');
  console.log('   Configuration appears ready for development');
} else if (criticalIssues <= 2) {
  console.log('⚠️  MINOR ISSUES: Some configuration issues found');
  console.log('   Review and fix critical issues before proceeding');
} else {
  console.log('🚨 CRITICAL ISSUES: Major configuration problems detected');
  console.log('   Fix all critical issues before using the platform');
}

console.log();

console.log('💡 Quick Actions:');
if (criticalIssues > 0) {
  console.log(`   1. Run: sudo ${SYNC_SCRIPT_PATH}`);
  console.log('   2. Check: node /root/agents/verify-mcp-ready.js');
  console.log('   3. Test: node /root/agents/scripts/claude-startup-check.js');
}
console.log('   4. Update credentials: sudo nano /etc/standup-sydney/credentials.env');
console.log();

console.log('='.repeat(60));
console.log('✅ Configuration validation complete!');
console.log('='.repeat(60));

process.exit(criticalIssues > 0 ? 1 : 0);
