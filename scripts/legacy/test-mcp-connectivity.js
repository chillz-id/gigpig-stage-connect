#!/usr/bin/env node

/**
 * MCP Connectivity Testing Script
 * Tests each MCP server to verify they can start and respond
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';

console.log('🔌 MCP Connectivity Testing');
console.log('='.repeat(50));
console.log(`📅 Date: ${new Date().toISOString()}`);
console.log('='.repeat(50));
console.log();

// Load MCP configuration
const mcpConfig = JSON.parse(readFileSync('/root/agents/.mcp.json', 'utf8'));

async function testMcpServer(serverName, config) {
  console.log(`📋 Testing ${serverName}:`);

  return new Promise((resolve) => {
    try {
      // For HTTP-based servers, we can't test the same way
      if (config.url) {
        console.log(`   ℹ️  HTTP server at ${config.url} - cannot test startup`);
        resolve({ name: serverName, status: 'http-server', testable: false });
        return;
      }

      if (!config.command) {
        console.log(`   ℹ️  No command specified - cannot test`);
        resolve({ name: serverName, status: 'no-command', testable: false });
        return;
      }

      // Set up environment
      const env = { ...process.env };
      if (config.env) {
        // Load current .env file for variable resolution
        const envContent = readFileSync('/root/agents/.env', 'utf8');
        for (const [key, value] of Object.entries(config.env)) {
          if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
            const envVar = value.slice(2, -1);
            const envMatch = envContent.match(new RegExp(`^${envVar}=(.+)$`, 'm'));
            if (envMatch) {
              env[key] = envMatch[1];
            } else {
              console.log(`   ❌ Environment variable ${envVar} not found`);
              resolve({ name: serverName, status: 'env-missing', testable: false });
              return;
            }
          } else {
            env[key] = value;
          }
        }
      }

      const child = spawn(config.command, config.args || [], {
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      // Send a simple request to test if the server responds
      setTimeout(() => {
        try {
          const testMessage = JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
              protocolVersion: "2024-11-05",
              capabilities: {},
              clientInfo: {
                name: "test-client",
                version: "1.0.0"
              }
            }
          }) + '\n';

          child.stdin.write(testMessage);
        } catch (e) {
          console.log(`   ❌ Failed to send test message: ${e.message}`);
        }
      }, 1000);

      const timeout = setTimeout(() => {
        child.kill();
        console.log(`   ⏰ Timeout - server did not respond within 3 seconds`);
        resolve({ name: serverName, status: 'timeout', testable: true });
      }, 3000);

      child.on('exit', (code, signal) => {
        clearTimeout(timeout);
        if (signal === 'SIGTERM') {
          return; // Timeout already handled
        }

        if (code === 0) {
          console.log(`   ✅ Server started and exited cleanly`);
          resolve({ name: serverName, status: 'success', testable: true });
        } else {
          console.log(`   ❌ Server exited with code ${code}`);
          if (errorOutput) {
            console.log(`   📝 Error output: ${errorOutput.substring(0, 100)}...`);
          }
          resolve({ name: serverName, status: 'error', testable: true, error: errorOutput });
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        console.log(`   ❌ Failed to start: ${error.message}`);
        resolve({ name: serverName, status: 'failed', testable: true, error: error.message });
      });

      // If we get any output, it's probably working
      setTimeout(() => {
        if (output.length > 0 || errorOutput.length > 0) {
          clearTimeout(timeout);
          child.kill();
          console.log(`   ✅ Server responded (got output)`);
          resolve({ name: serverName, status: 'responsive', testable: true });
        }
      }, 2000);

    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      resolve({ name: serverName, status: 'test-error', testable: true, error: error.message });
    }
  });
}

async function runAllTests() {
  console.log('🚀 Starting MCP server tests...\n');

  const results = [];
  const servers = Object.entries(mcpConfig.mcpServers);

  for (const [serverName, config] of servers) {
    const result = await testMcpServer(serverName, config);
    results.push(result);
    console.log(); // Add spacing between tests
  }

  // Summary
  console.log('='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));

  const testableServers = results.filter(r => r.testable);
  const successfulServers = results.filter(r => r.status === 'success' || r.status === 'responsive');
  const failedServers = results.filter(r => r.status === 'error' || r.status === 'failed' || r.status === 'timeout');
  const httpServers = results.filter(r => r.status === 'http-server');

  console.log();
  console.log(`📈 Statistics:`);
  console.log(`   📊 Total servers: ${results.length}`);
  console.log(`   🧪 Testable servers: ${testableServers.length}`);
  console.log(`   ✅ Working servers: ${successfulServers.length}`);
  console.log(`   ❌ Failed servers: ${failedServers.length}`);
  console.log(`   🌐 HTTP servers: ${httpServers.length}`);

  if (failedServers.length > 0) {
    console.log();
    console.log('❌ Failed servers:');
    failedServers.forEach(server => {
      console.log(`   - ${server.name}: ${server.status}`);
      if (server.error) {
        console.log(`     Error: ${server.error.substring(0, 100)}...`);
      }
    });
  }

  if (successfulServers.length > 0) {
    console.log();
    console.log('✅ Working servers:');
    successfulServers.forEach(server => {
      console.log(`   - ${server.name}`);
    });
  }

  console.log();
  const successRate = Math.round((successfulServers.length / testableServers.length) * 100);
  console.log(`🎯 Success rate: ${successRate}% (${successfulServers.length}/${testableServers.length} testable servers)`);

  console.log();
  console.log('💡 Next steps:');
  console.log('   1. Fix any failed servers');
  console.log('   2. Restart Claude Code to load MCP tools');
  console.log('   3. Test MCP tool accessibility in Claude Code session');

  console.log();
  console.log('='.repeat(50));
  console.log('🧪 MCP connectivity test complete!');
  console.log('='.repeat(50));
}

runAllTests().catch(console.error);