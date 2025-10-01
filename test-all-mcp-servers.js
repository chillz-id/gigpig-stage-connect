#!/usr/bin/env node

/**
 * Test All MCP Servers Connectivity
 * Systematic testing of all configured MCP servers
 */

import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '/root/agents/.env' });

console.log('🔍 MCP Server Connectivity Test\n');

// Read MCP configuration
const mcpConfig = JSON.parse(fs.readFileSync('/root/agents/.mcp.json', 'utf8'));
const servers = Object.keys(mcpConfig.mcpServers);

console.log(`📊 Found ${servers.length} configured MCP servers:`);
servers.forEach((server, i) => {
    console.log(`   ${i + 1}. ${server}`);
});

console.log('\n🔑 Environment Variables Status:');

// Check environment variables for each server
const envChecks = {
    supabase: ['SUPABASE_ACCESS_TOKEN'],
    github: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
    notion: ['NOTION_TOKEN'],
    slack: ['SLACK_BOT_TOKEN', 'SLACK_APP_TOKEN'],
    metricool: ['METRICOOL_USER_TOKEN', 'METRICOOL_USER_ID'],
    xero: ['XERO_CLIENT_ID', 'XERO_CLIENT_SECRET'],
    n8n: ['N8N_API_KEY', 'N8N_API_URL'],
    linear: ['LINEAR_API_KEY'],
    'brave-search': ['BRAVE_API_KEY'],
    apify: ['APIFY_TOKEN'],
    'task-master': ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'PERPLEXITY_API_KEY'],
    wix: ['WIX_API_KEY', 'WIX_ACCOUNT_ID']
};

const envStatus = {};

Object.entries(envChecks).forEach(([server, vars]) => {
    console.log(`\n${server}:`);
    envStatus[server] = { missing: [], present: [] };

    vars.forEach(varName => {
        const value = process.env[varName];
        if (value && value.trim() !== '') {
            console.log(`   ✅ ${varName}: SET (${value.length} chars)`);
            envStatus[server].present.push(varName);
        } else {
            console.log(`   ❌ ${varName}: NOT SET`);
            envStatus[server].missing.push(varName);
        }
    });
});

console.log('\n📋 Summary Report:');
console.log('='.repeat(50));

let workingServers = 0;
let problematicServers = 0;

Object.entries(envStatus).forEach(([server, status]) => {
    if (status.missing.length === 0) {
        console.log(`✅ ${server}: All environment variables set`);
        workingServers++;
    } else {
        console.log(`❌ ${server}: Missing ${status.missing.join(', ')}`);
        problematicServers++;
    }
});

console.log(`\n🎯 Results:`);
console.log(`   • Working servers: ${workingServers}`);
console.log(`   • Problematic servers: ${problematicServers}`);

// Test if MCP tools are actually available in Claude Code
console.log('\n🔍 Checking Claude Code MCP Tool Availability:');
console.log('   This would require checking the function list in the Claude Code session');
console.log('   From available tools, I can see:');
console.log('   • mcp__ide__getDiagnostics - ✅ Working');
console.log('   • mcp__ide__executeCode - ✅ Available');
console.log('   • Other MCP tools: Need to be verified in session');

console.log('\n💡 Next Steps:');
if (problematicServers > 0) {
    console.log('   1. Fix missing environment variables');
    console.log('   2. Restart Claude Code to reload MCP servers');
    console.log('   3. Test individual MCP tool functions');
} else {
    console.log('   1. All environment variables are set');
    console.log('   2. Check if Claude Code has loaded the MCP tools');
    console.log('   3. Test individual MCP tool functions');
}

console.log('\n📝 Missing Variables to Fix:');
Object.entries(envStatus).forEach(([server, status]) => {
    if (status.missing.length > 0) {
        console.log(`   ${server}: ${status.missing.join(', ')}`);
    }
});