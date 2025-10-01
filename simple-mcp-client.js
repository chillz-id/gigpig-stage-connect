#!/usr/bin/env node
/**
 * Simple MCP Client for Claude Code
 * Direct integration with your existing MCP servers
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
class SimpleMCPClient {
  constructor() {
    this.mcpConfig = this.loadMCPConfig();
  }
  loadMCPConfig() {
    try {
      const configPath = '/mnt/c/Users/chill/AppData/Roaming/Claude/claude_desktop_config.json';
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.mcpServers || {};
    } catch (error) {
      console.error('Failed to load MCP config:', error.message);
      return {};
    }
  }
  // File system operations via filesystem MCP
  async readComedianPortalFile(relativePath) {
    try {
      const fullPath = path.join('/mnt/c/Users/chill/Comedian_Portal', relativePath);
      console.log(`Reading file: ${fullPath}`);
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, 'utf8');
      } else {
        throw new Error(`File not found: ${fullPath}`);
      }
    } catch (error) {
      console.error('File read error:', error.message);
      return null;
    }
  }
  async writeComedianPortalFile(relativePath, content) {
    try {
      const fullPath = path.join('/mnt/c/Users/chill/Comedian_Portal', relativePath);
      console.log(`Writing file: ${fullPath}`);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, content, 'utf8');
      return { success: true, path: fullPath };
    } catch (error) {
      console.error('File write error:', error.message);
      return { success: false, error: error.message };
    }
  }
  async listComedianPortalFiles(relativePath = '') {
    try {
      const fullPath = path.join('/mnt/c/Users/chill/Comedian_Portal', relativePath);
      console.log(`Listing directory: ${fullPath}`);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Directory not found: ${fullPath}`);
      }
      const items = fs.readdirSync(fullPath, { withFileTypes: true });
      return items.map(item => ({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file',
        path: path.join(relativePath, item.name)
      }));
    } catch (error) {
      console.error('Directory list error:', error.message);
      return [];
    }
  }
  // Supabase operations via direct SDK (since we have the token)
  async querySupabase(sql) {
    try {
      console.log(`Executing Supabase query: ${sql}`);
      // Use the Supabase client from your project
      const result = execSync(`cd /mnt/c/Users/chill/gigpig-stage-connect && node -e "
        import { createClient } from '@supabase/supabase-js';
        const supabase = createClient(process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co', 'sbp_YOUR_SUPABASE_ACCESS_TOKEN_HERE_GET_FROM_OWNER');
        const { data, error } = await supabase.rpc('execute_sql', { query: '${sql.replace(/'/g, "\\'")}' });
        console.log(JSON.stringify({ data, error }, null, 2));
      "`, { encoding: 'utf8' });
      return JSON.parse(result);
    } catch (error) {
      console.error('Supabase query error:', error.message);
      return { error: error.message };
    }
  }
  // Railway operations via API
  async getRailwayStatus() {
    try {
      console.log('Checking Railway deployment status...');
      const result = execSync(`curl -s -H "Authorization: Bearer 988acd3d-acda-4a58-bb7b-9091c0c72607" "https://backboard.railway.app/graphql" -d '{"query":"query { me { projects { edges { node { name services { edges { node { name latestDeployment { status url } } } } } } } } }"}'`, { encoding: 'utf8' });
      return JSON.parse(result);
    } catch (error) {
      console.error('Railway API error:', error.message);
      return { error: error.message };
    }
  }
  // Docker operations
  async getDockerStatus() {
    try {
      console.log('Checking Docker status...');
      const containers = execSync('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', { encoding: 'utf8' });
      const images = execSync('docker images --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}"', { encoding: 'utf8' });
      return {
        containers: containers.split('\n').filter(line => line.trim()),
        images: images.split('\n').filter(line => line.trim())
      };
    } catch (error) {
      console.error('Docker status error:', error.message);
      return { error: error.message };
    }
  }
  // Combined operations
  async getProjectStatus() {
    console.log('Getting comprehensive project status...');
    const status = {
      timestamp: new Date().toISOString(),
      gigpig: {
        files: await this.listComedianPortalFiles(),
        recentFiles: await this.getRecentFiles()
      },
      railway: await this.getRailwayStatus(),
      docker: await this.getDockerStatus(),
      currentProject: {
        path: process.cwd(),
        gitStatus: this.getGitStatus(),
        buildStatus: await this.checkBuildStatus()
      }
    };
    return status;
  }
  getGitStatus() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      const lastCommit = execSync('git log -1 --format="%h %s"', { encoding: 'utf8' }).trim();
      return {
        branch,
        lastCommit,
        hasChanges: status.length > 0,
        changedFiles: status.split('\n').filter(line => line.trim()).length
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  async checkBuildStatus() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const hasNodeModules = fs.existsSync('node_modules');
      const hasDist = fs.existsSync('dist');
      return {
        packageManager: 'npm',
        dependencies: Object.keys(packageJson.dependencies || {}).length,
        devDependencies: Object.keys(packageJson.devDependencies || {}).length,
        scripts: Object.keys(packageJson.scripts || {}),
        hasNodeModules,
        hasDist,
        ready: hasNodeModules
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  async getRecentFiles() {
    try {
      const comedianPortalPath = '/mnt/c/Users/chill/Comedian_Portal';
      if (!fs.existsSync(comedianPortalPath)) {
        return [];
      }
      const result = execSync(`find "${comedianPortalPath}" -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" | head -10`, { encoding: 'utf8' });
      return result.split('\n').filter(line => line.trim()).map(filePath => ({
        path: filePath.replace(comedianPortalPath + '/', ''),
        fullPath: filePath
      }));
    } catch (error) {
      return [];
    }
  }
}
// CLI interface
const client = new SimpleMCPClient();
const command = process.argv[2];
const args = process.argv.slice(3);
async function main() {
  try {
    switch (command) {
      case 'status':
        const status = await client.getProjectStatus();
        console.log(JSON.stringify(status, null, 2));
        break;
      case 'read':
        const filePath = args[0];
        if (!filePath) throw new Error('File path required');
        const content = await client.readComedianPortalFile(filePath);
        if (content) {
          console.log('--- File Content ---');
          console.log(content);
        }
        break;
      case 'write':
        const writeFilePath = args[0];
        const writeContent = args[1];
        if (!writeFilePath || !writeContent) throw new Error('File path and content required');
        const writeResult = await client.writeComedianPortalFile(writeFilePath, writeContent);
        console.log(JSON.stringify(writeResult, null, 2));
        break;
      case 'list':
        const listPath = args[0] || '';
        const files = await client.listComedianPortalFiles(listPath);
        console.log(JSON.stringify(files, null, 2));
        break;
      case 'query':
        const sql = args[0];
        if (!sql) throw new Error('SQL query required');
        const queryResult = await client.querySupabase(sql);
        console.log(JSON.stringify(queryResult, null, 2));
        break;
      case 'railway':
        const railwayStatus = await client.getRailwayStatus();
        console.log(JSON.stringify(railwayStatus, null, 2));
        break;
      case 'docker':
        const dockerStatus = await client.getDockerStatus();
        console.log(JSON.stringify(dockerStatus, null, 2));
        break;
      default:
        console.log(`
Available commands:
  status                     - Get comprehensive project status
  read <file>               - Read file from Comedian Portal
  write <file> <content>    - Write file to Comedian Portal  
  list [path]               - List files in Comedian Portal
  query <sql>               - Execute Supabase query
  railway                   - Check Railway deployment status
  docker                    - Check Docker status
        `);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
export { SimpleMCPClient };