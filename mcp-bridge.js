#!/usr/bin/env node

/**
 * MCP Bridge for Claude Code
 * Connects to your existing MCP servers and provides tools to Claude Code
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPBridge {
  constructor() {
    this.servers = {};
    this.initializeServers();
  }

  initializeServers() {
    // Your MCP server configurations from Claude Desktop
    this.serverConfigs = {
      filesystem: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/mnt/c/Users/chill/Comedian_Portal'],
        description: 'File system access for Comedian Portal'
      },
      supabase: {
        command: 'npx',
        args: ['-y', '@supabase/mcp-server-supabase', '--access-token', 'sbp_497ee37f3fda4cab843130b6b85e873e1c4242b3'],
        description: 'Supabase database operations'
      },
      metricool: {
        command: 'npx',
        args: ['-y', 'mcp-metricool'],
        env: {
          METRICOOL_USER_TOKEN: 'AIRTBTNXQVUPFDHLEYFDXMVIWNGSJFXPDZMIZCOAFSIKZWHXZOZTZAXMATBHNJMR',
          METRICOOL_USER_ID: '3477256'
        },
        description: 'Metricool analytics integration'
      }
    };
  }

  async startServer(serverName) {
    const config = this.serverConfigs[serverName];
    if (!config) {
      throw new Error(`Unknown server: ${serverName}`);
    }

    console.log(`Starting MCP server: ${serverName}`);
    
    const process = spawn(config.command, config.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...config.env }
    });

    this.servers[serverName] = {
      process,
      config,
      ready: false
    };

    process.stdout.on('data', (data) => {
      console.log(`[${serverName}] ${data.toString()}`);
    });

    process.stderr.on('data', (data) => {
      console.error(`[${serverName} ERROR] ${data.toString()}`);
    });

    process.on('close', (code) => {
      console.log(`[${serverName}] Process exited with code ${code}`);
      delete this.servers[serverName];
    });

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.servers[serverName]) {
          this.servers[serverName].ready = true;
          resolve();
        } else {
          reject(new Error(`Failed to start ${serverName}`));
        }
      }, 2000);
    });
  }

  async sendMCPRequest(serverName, method, params = {}) {
    const server = this.servers[serverName];
    if (!server || !server.ready) {
      throw new Error(`Server ${serverName} not ready`);
    }

    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    };

    return new Promise((resolve, reject) => {
      server.process.stdin.write(JSON.stringify(request) + '\n');
      
      const timeout = setTimeout(() => {
        reject(new Error('MCP request timeout'));
      }, 5000);

      server.process.stdout.once('data', (data) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(data.toString());
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // File system operations
  async readFile(filePath) {
    try {
      await this.ensureServer('filesystem');
      return await this.sendMCPRequest('filesystem', 'tools/call', {
        name: 'read_file',
        arguments: { path: filePath }
      });
    } catch (error) {
      console.error('MCP filesystem read failed:', error);
      return null;
    }
  }

  async writeFile(filePath, content) {
    try {
      await this.ensureServer('filesystem');
      return await this.sendMCPRequest('filesystem', 'tools/call', {
        name: 'write_file',
        arguments: { path: filePath, content }
      });
    } catch (error) {
      console.error('MCP filesystem write failed:', error);
      return null;
    }
  }

  // Supabase operations
  async querySupabase(sql) {
    try {
      await this.ensureServer('supabase');
      return await this.sendMCPRequest('supabase', 'tools/call', {
        name: 'query',
        arguments: { sql }
      });
    } catch (error) {
      console.error('MCP supabase query failed:', error);
      return null;
    }
  }

  // Metricool operations
  async getMetricoolStats() {
    try {
      await this.ensureServer('metricool');
      return await this.sendMCPRequest('metricool', 'tools/call', {
        name: 'get_stats',
        arguments: {}
      });
    } catch (error) {
      console.error('MCP metricool failed:', error);
      return null;
    }
  }

  async ensureServer(serverName) {
    if (!this.servers[serverName] || !this.servers[serverName].ready) {
      await this.startServer(serverName);
    }
  }

  async listAvailableTools() {
    const tools = {};
    
    for (const [serverName, config] of Object.entries(this.serverConfigs)) {
      try {
        await this.ensureServer(serverName);
        const response = await this.sendMCPRequest(serverName, 'tools/list');
        tools[serverName] = {
          description: config.description,
          tools: response.result?.tools || []
        };
      } catch (error) {
        tools[serverName] = {
          description: config.description,
          error: error.message
        };
      }
    }
    
    return tools;
  }

  async cleanup() {
    for (const [serverName, server] of Object.entries(this.servers)) {
      console.log(`Stopping MCP server: ${serverName}`);
      server.process.kill();
    }
    this.servers = {};
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const bridge = new MCPBridge();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  async function main() {
    try {
      switch (command) {
        case 'list':
          const tools = await bridge.listAvailableTools();
          console.log(JSON.stringify(tools, null, 2));
          break;
          
        case 'read':
          const filePath = args[1];
          if (!filePath) throw new Error('File path required');
          const content = await bridge.readFile(filePath);
          console.log(JSON.stringify(content, null, 2));
          break;
          
        case 'query':
          const sql = args[1];
          if (!sql) throw new Error('SQL query required');
          const result = await bridge.querySupabase(sql);
          console.log(JSON.stringify(result, null, 2));
          break;
          
        case 'stats':
          const stats = await bridge.getMetricoolStats();
          console.log(JSON.stringify(stats, null, 2));
          break;
          
        default:
          console.log('Available commands: list, read <file>, query <sql>, stats');
      }
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      await bridge.cleanup();
    }
  }
  
  main();
}

export { MCPBridge };