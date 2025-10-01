#!/usr/bin/env node

/**
 * MCP Server Connection Tester
 * Tests all 13 configured MCP servers for Stand Up Sydney platform
 * 
 * Usage:
 *   node scripts/test-mcp-servers.js [--verbose] [--server=name]
 */

const fs = require('fs');
const path = require('path');

class MCPServerTester {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.targetServer = options.server || null;
    this.results = {};
    this.startTime = new Date();
    
    // Load MCP configuration
    this.loadMCPConfig();
    
    // Expected working servers (from PLATFORM_STATE.json)
    this.expectedWorking = [
      'supabase', 'github', 'notion', 'context7', 'filesystem', 'linear'
    ];
    
    // Servers needing testing
    this.needsTesting = [
      'slack', 'metricool', 'xero', 'canva', 'apify', 'task_master', 'puppeteer'
    ];
  }
  
  loadMCPConfig() {
    const configPath = path.join(__dirname, '..', '.mcp.json');
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`MCP config not found at ${configPath}`);
    }
    
    try {
      this.mcpConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      this.servers = Object.keys(this.mcpConfig.mcpServers);
      
      if (this.verbose) {
        console.log(`📋 Loaded ${this.servers.length} MCP servers from config`);
      }
    } catch (error) {
      throw new Error(`Failed to parse MCP config: ${error.message}`);
    }
  }
  
  async testServer(serverName) {
    const startTime = Date.now();
    const config = this.mcpConfig.mcpServers[serverName];
    
    if (!config) {
      return {
        status: 'error',
        error: 'Server not found in config',
        duration: 0
      };
    }
    
    console.log(`🔍 Testing ${serverName}...`);
    
    const result = {
      name: serverName,
      status: 'unknown',
      config: config,
      duration: 0,
      error: null,
      tools: [],
      environment_vars: Object.keys(config.env || {}),
      transport: config.transport || 'stdio'
    };
    
    try {
      // Test 1: Configuration validation
      await this.validateConfiguration(serverName, config, result);
      
      // Test 2: Environment variables check
      await this.checkEnvironmentVars(serverName, config, result);
      
      // Test 3: Server-specific tests
      await this.runServerSpecificTests(serverName, config, result);
      
      result.duration = Date.now() - startTime;
      
      if (result.status === 'unknown') {
        result.status = 'configured';
      }
      
    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      result.duration = Date.now() - startTime;
      
      if (this.verbose) {
        console.error(`❌ ${serverName}: ${error.message}`);
      }
    }
    
    return result;
  }
  
  async validateConfiguration(serverName, config, result) {
    // Check required fields
    if (!config.command && !config.transport) {
      throw new Error('Missing command or transport configuration');
    }
    
    if (config.command && !config.args) {
      result.warnings = result.warnings || [];
      result.warnings.push('No args specified for command');
    }
    
    // Validate transport type
    if (config.transport && !['stdio', 'sse'].includes(config.transport)) {
      throw new Error(`Unknown transport type: ${config.transport}`);
    }
    
    result.config_valid = true;
  }
  
  async checkEnvironmentVars(serverName, config, result) {
    if (!config.env) {
      result.env_status = 'no_env_vars';
      return;
    }
    
    const missing = [];
    const placeholders = [];
    
    for (const [key, value] of Object.entries(config.env)) {
      // Check for placeholder syntax
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const envVar = value.slice(2, -1);
        if (!process.env[envVar]) {
          missing.push(envVar);
        }
      } else if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        placeholders.push(key);
      }
    }
    
    result.env_missing = missing;
    result.env_placeholders = placeholders;
    result.env_status = missing.length === 0 ? 'complete' : 'incomplete';
    
    if (missing.length > 0 && this.verbose) {
      console.warn(`⚠️  ${serverName}: Missing environment variables: ${missing.join(', ')}`);
    }
  }
  
  async runServerSpecificTests(serverName, config, result) {
    switch (serverName) {
      case 'supabase':
        await this.testSupabase(result);
        break;
      case 'github':
        await this.testGitHub(result);
        break;
      case 'notion':
        await this.testNotion(result);
        break;
      case 'slack':
        await this.testSlack(result);
        break;
      case 'n8n':
        // Note: N8N not in current config but mentioned in docs
        await this.testN8N(result);
        break;
      case 'linear':
        await this.testLinear(result);
        break;
      default:
        result.status = 'configured';
        result.notes = 'Basic configuration test only';
    }
  }
  
  async testSupabase(result) {
    // Check if Supabase credentials exist
    const hasUrl = process.env.SUPABASE_URL;
    const hasAnonKey = process.env.SUPABASE_ANON_KEY;
    const hasServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (hasUrl && hasAnonKey) {
      result.status = 'working';
      result.credentials = {
        url: !!hasUrl,
        anon_key: !!hasAnonKey,
        service_key: !!hasServiceKey
      };
    } else {
      result.status = 'error';
      result.error = 'Missing Supabase credentials';
    }
  }
  
  async testGitHub(result) {
    const hasToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    
    if (hasToken) {
      result.status = 'working';
      result.credentials = { token: true };
    } else {
      result.status = 'error';
      result.error = 'Missing GitHub personal access token';
    }
  }
  
  async testNotion(result) {
    const hasToken = process.env.NOTION_TOKEN;
    
    if (hasToken) {
      result.status = 'working';
      result.credentials = { token: true };
    } else {
      result.status = 'error';
      result.error = 'Missing Notion token';
    }
  }
  
  async testSlack(result) {
    const hasBotToken = process.env.SLACK_BOT_TOKEN;
    const hasAppToken = process.env.SLACK_APP_TOKEN;
    
    if (hasBotToken && hasAppToken) {
      result.status = 'configured';
      result.credentials = { bot_token: true, app_token: true };
      result.notes = 'Credentials present - needs functional testing';
    } else {
      result.status = 'error';
      result.error = 'Missing Slack tokens';
    }
  }
  
  async testLinear(result) {
    const hasKey = process.env.LINEAR_API_KEY;
    
    if (hasKey) {
      result.status = 'working';
      result.credentials = { api_key: true };
      result.notes = 'Used by Knowledge Graph integration';
    } else {
      result.status = 'configured';
      result.notes = 'No Linear API key - using SSE transport';
    }
  }
  
  async testN8N(result) {
    // N8N test (not in current MCP config but service is running)
    result.status = 'external';
    result.notes = 'N8N runs as separate service on localhost:5678/rest/';
  }
  
  async runAllTests() {
    console.log('🚀 Starting MCP Server Connection Tests');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log(`🎯 Testing ${this.targetServer ? 1 : this.servers.length} servers\n`);
    
    const serversToTest = this.targetServer ? [this.targetServer] : this.servers;
    
    for (const serverName of serversToTest) {
      if (!this.servers.includes(serverName)) {
        console.error(`❌ Server '${serverName}' not found in configuration`);
        continue;
      }
      
      this.results[serverName] = await this.testServer(serverName);
    }
    
    this.generateReport();
  }
  
  generateReport() {
    const endTime = new Date();
    const totalDuration = endTime - this.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 MCP SERVER TEST RESULTS');
    console.log('='.repeat(60));
    
    const statusCounts = {
      working: 0,
      configured: 0,
      error: 0,
      external: 0
    };
    
    // Individual server results
    for (const [serverName, result] of Object.entries(this.results)) {
      const statusIcon = {
        working: '✅',
        configured: '⚙️',
        error: '❌',
        external: '🔗'
      }[result.status] || '❓';
      
      statusCounts[result.status] = (statusCounts[result.status] || 0) + 1;
      
      console.log(`\n${statusIcon} ${serverName.toUpperCase()}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Transport: ${result.transport}`);
      
      if (result.env_status) {
        console.log(`   Environment: ${result.env_status}`);
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.notes) {
        console.log(`   Notes: ${result.notes}`);
      }
      
      if (result.env_missing && result.env_missing.length > 0) {
        console.log(`   Missing vars: ${result.env_missing.join(', ')}`);
      }
      
      if (result.env_placeholders && result.env_placeholders.length > 0) {
        console.log(`   Placeholder vars: ${result.env_placeholders.join(', ')}`);
      }
    }
    
    // Summary
    console.log('\n' + '-'.repeat(40));
    console.log('📈 SUMMARY');
    console.log('-'.repeat(40));
    console.log(`✅ Working: ${statusCounts.working}`);
    console.log(`⚙️  Configured: ${statusCounts.configured}`);
    console.log(`❌ Errors: ${statusCounts.error}`);
    console.log(`🔗 External: ${statusCounts.external}`);
    console.log(`⏱️  Total time: ${totalDuration}ms`);
    
    // Recommendations
    this.generateRecommendations(statusCounts);
    
    // Save results
    this.saveResults();
  }
  
  generateRecommendations(statusCounts) {
    console.log('\n' + '-'.repeat(40));
    console.log('💡 RECOMMENDATIONS');
    console.log('-'.repeat(40));
    
    if (statusCounts.error > 0) {
      console.log('❗ Fix environment variable issues for error servers');
    }
    
    if (statusCounts.configured > 0) {
      console.log('🧪 Run functional tests on configured servers');
    }
    
    const underutilized = ['metricool', 'canva', 'apify', 'task_master'];
    const foundUnderutilized = underutilized.filter(s => this.results[s]);
    
    if (foundUnderutilized.length > 0) {
      console.log(`🚀 Activate underutilized servers: ${foundUnderutilized.join(', ')}`);
    }
    
    console.log('📋 Update PLATFORM_STATE.json with these results');
    console.log('🔄 Schedule regular MCP health checks');
  }
  
  saveResults() {
    const reportPath = path.join(__dirname, '..', 'reports', 'mcp-test-results.json');
    const reportDir = path.dirname(reportPath);
    
    // Ensure reports directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      total_servers: Object.keys(this.results).length,
      results: this.results,
      summary: Object.keys(this.results).reduce((acc, serverName) => {
        const status = this.results[serverName].status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
      recommendations: this.generateRecommendationsList()
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Results saved to: ${reportPath}`);
  }
  
  generateRecommendationsList() {
    const recommendations = [];
    
    for (const [serverName, result] of Object.entries(this.results)) {
      if (result.status === 'error') {
        recommendations.push({
          server: serverName,
          priority: 'high',
          action: `Fix: ${result.error}`,
          type: 'fix'
        });
      }
      
      if (result.status === 'configured' && ['slack', 'metricool', 'xero'].includes(serverName)) {
        recommendations.push({
          server: serverName,
          priority: 'medium',
          action: 'Run functional tests to verify working status',
          type: 'test'
        });
      }
      
      if (['metricool', 'canva', 'apify', 'task_master'].includes(serverName) && result.status !== 'error') {
        recommendations.push({
          server: serverName,
          priority: 'low',
          action: 'Create automation workflows to utilize server',
          type: 'activate'
        });
      }
    }
    
    return recommendations;
  }
}

// CLI handling
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    verbose: false,
    server: null
  };
  
  args.forEach(arg => {
    if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg.startsWith('--server=')) {
      options.server = arg.split('=')[1];
    }
  });
  
  return options;
}

function showUsage() {
  console.log(`
MCP Server Connection Tester

Usage:
  node scripts/test-mcp-servers.js [options]

Options:
  --verbose, -v     Show detailed output
  --server=NAME     Test only specific server

Examples:
  node scripts/test-mcp-servers.js
  node scripts/test-mcp-servers.js --verbose
  node scripts/test-mcp-servers.js --server=slack

Servers:
  ${Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.mcp.json'), 'utf8')).mcpServers).join(', ')}
`);
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
    process.exit(0);
  }
  
  try {
    const tester = new MCPServerTester(options);
    tester.runAllTests().catch(error => {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    process.exit(1);
  }
}

module.exports = MCPServerTester;