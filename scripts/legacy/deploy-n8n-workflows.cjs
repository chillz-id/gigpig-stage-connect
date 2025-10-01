#!/usr/bin/env node

/**
 * Deploy N8N workflows from JSON files
 * Uploads workflow JSON files to N8N instance via API
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class N8NWorkflowDeployer {
  constructor() {
    this.apiKey = process.env.N8N_API_KEY;
    this.apiUrl = process.env.N8N_API_URL || 'http://localhost:5678/rest';
    this.workflowsDir = '/root/agents/n8n-workflows';
    
    if (!this.apiKey) {
      throw new Error('N8N_API_KEY environment variable not set');
    }
  }
  
  async makeRequest(method, endpoint, data = null) {
    const url = new URL(endpoint, this.apiUrl);
    const options = {
      method,
      headers: {
        'X-N8N-API-KEY': this.apiKey,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    return new Promise((resolve, reject) => {
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request(url, options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${parsedData.message || responseData}`));
            }
          } catch (error) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(responseData);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          }
        });
      });
      
      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }
  
  async getExistingWorkflows() {
    try {
      const response = await this.makeRequest('GET', '/workflows');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching existing workflows:', error.message);
      return [];
    }
  }
  
  async deployWorkflow(workflowData, filename) {
    try {
      console.log(`\n📤 Deploying workflow: ${workflowData.name}`);
      
      // Check if workflow already exists
      const existingWorkflows = await this.getExistingWorkflows();
      const existingWorkflow = existingWorkflows.find(w => w.name === workflowData.name);
      
      if (existingWorkflow) {
        console.log(`   ⚠️  Workflow "${workflowData.name}" already exists (ID: ${existingWorkflow.id})`);
        console.log(`   🔄 Updating existing workflow...`);
        
        // Update existing workflow
        const updateData = {
          name: workflowData.name,
          nodes: workflowData.nodes,
          connections: workflowData.connections,
          settings: workflowData.settings || {},
          active: workflowData.active || false
        };
        
        const result = await this.makeRequest('PUT', `/workflows/${existingWorkflow.id}`, updateData);
        console.log(`   ✅ Updated workflow "${workflowData.name}" (ID: ${result.id})`);
        return { action: 'updated', id: result.id, name: workflowData.name };
        
      } else {
        console.log(`   📝 Creating new workflow...`);
        
        // Create new workflow
        const createData = {
          name: workflowData.name,
          nodes: workflowData.nodes,
          connections: workflowData.connections,
          settings: workflowData.settings || {},
          active: workflowData.active || false
        };
        
        const result = await this.makeRequest('POST', '/workflows', createData);
        console.log(`   ✅ Created workflow "${workflowData.name}" (ID: ${result.id})`);
        return { action: 'created', id: result.id, name: workflowData.name };
      }
      
    } catch (error) {
      console.error(`   ❌ Error deploying workflow "${workflowData.name}":`, error.message);
      return { action: 'error', name: workflowData.name, error: error.message };
    }
  }
  
  async deployFromDirectory(targetWorkflows = null) {
    console.log(`🚀 N8N Workflow Deployment Started`);
    console.log(`📂 Source directory: ${this.workflowsDir}`);
    console.log(`🔗 Target N8N: ${this.apiUrl}`);
    
    if (!fs.existsSync(this.workflowsDir)) {
      throw new Error(`Workflows directory not found: ${this.workflowsDir}`);
    }
    
    const files = fs.readdirSync(this.workflowsDir)
      .filter(file => file.endsWith('.json') && file !== 'README.json');
    
    if (files.length === 0) {
      console.log('⚠️  No workflow JSON files found');
      return [];
    }
    
    // Filter to specific workflows if specified
    const workflowsToProcess = targetWorkflows ? 
      files.filter(file => targetWorkflows.some(name => file.includes(name.toLowerCase().replace(/\s+/g, '-')))) :
      files;
    
    console.log(`📋 Found ${workflowsToProcess.length} workflow files to process:`);
    workflowsToProcess.forEach(file => console.log(`   - ${file}`));
    
    const results = [];
    
    for (const file of workflowsToProcess) {
      const filePath = path.join(this.workflowsDir, file);
      
      try {
        console.log(`\n📄 Processing: ${file}`);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const workflowData = JSON.parse(fileContent);
        
        // Validate workflow structure
        if (!workflowData.name || !workflowData.nodes) {
          console.log(`   ⚠️  Invalid workflow structure in ${file} - skipping`);
          results.push({ action: 'skipped', file, reason: 'invalid_structure' });
          continue;
        }
        
        const result = await this.deployWorkflow(workflowData, file);
        results.push({ ...result, file });
        
        // Rate limiting - wait between deployments
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Error processing ${file}:`, error.message);
        results.push({ action: 'error', file, error: error.message });
      }
    }
    
    return results;
  }
  
  printSummary(results) {
    console.log(`\n📊 Deployment Summary`);
    console.log(`${'='.repeat(50)}`);
    
    const created = results.filter(r => r.action === 'created').length;
    const updated = results.filter(r => r.action === 'updated').length;
    const errors = results.filter(r => r.action === 'error').length;
    const skipped = results.filter(r => r.action === 'skipped').length;
    
    console.log(`✅ Created: ${created}`);
    console.log(`🔄 Updated: ${updated}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📈 Total: ${results.length}`);
    
    if (errors > 0) {
      console.log(`\n❌ Errors:`);
      results.filter(r => r.action === 'error').forEach(r => {
        console.log(`   - ${r.file || r.name}: ${r.error}`);
      });
    }
    
    if (created > 0 || updated > 0) {
      console.log(`\n✅ Successfully deployed:`);
      results.filter(r => r.action === 'created' || r.action === 'updated').forEach(r => {
        console.log(`   - ${r.name} (${r.action}, ID: ${r.id})`);
      });
    }
  }
}

// CLI Interface
async function main() {
  try {
    // Load environment variables
    require('dotenv').config({ path: '/etc/standup-sydney/credentials.env' });
    
    const deployer = new N8NWorkflowDeployer();
    
    // Get command line arguments
    const targetWorkflows = process.argv.slice(2);
    
    if (targetWorkflows.length > 0) {
      console.log(`🎯 Deploying specific workflows: ${targetWorkflows.join(', ')}`);
    } else {
      console.log(`🎯 Deploying all workflows from directory`);
    }
    
    const results = await deployer.deployFromDirectory(targetWorkflows.length > 0 ? targetWorkflows : null);
    deployer.printSummary(results);
    
    const hasErrors = results.some(r => r.action === 'error');
    process.exit(hasErrors ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = N8NWorkflowDeployer;