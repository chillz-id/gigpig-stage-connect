#!/usr/bin/env node

/**
 * N8N Workflow Deployment Script
 * Automatically deploys 7 approved workflows to N8N via REST API
 * 
 * Usage: node deploy-n8n-workflows.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load environment variables
require('dotenv').config({ path: '/etc/standup-sydney/credentials.env' });

const N8N_API_KEY = process.env.N8N_API_KEY;
const N8N_BASE_URL = 'http://localhost:5678';

if (!N8N_API_KEY) {
  console.error('❌ N8N_API_KEY not found in /etc/standup-sydney/credentials.env');
  process.exit(1);
}

// Approved workflows to deploy (skipping Database Sync, Competitor Monitoring, Content Gen, Social Media)
const APPROVED_WORKFLOWS = [
  'error-monitoring-workflow.json',
  'webhook-processing-workflow.json', 
  'humanitix-brevo-sync.json',
  'humanitix-event-sync.json',
  'multi-platform-ticket-sync.json',
  'google-auth-recovery-workflow.json',
  'flight-monitoring-workflows.json'
];

// Workflows to skip
const SKIPPED_WORKFLOWS = [
  'database-sync-workflow.json',      // Too noisy - creates Linear/Slack notifications for every DB change
  'competitor-monitoring-workflow.json', // Not needed per user request
  'content-generation-workflow.json',    // Save for custom build later
  'social-media-automation-workflow.json' // Save for custom build later
];

/**
 * Make HTTP request to N8N API
 */
function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, N8N_BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Test N8N connection
 */
async function testConnection() {
  try {
    console.log('🔍 Testing N8N connection...');
    await makeRequest('GET', '/api/v1/workflows');
    console.log('✅ N8N API connection successful');
    return true;
  } catch (error) {
    console.error('❌ N8N API connection failed:', error.message);
    return false;
  }
}

/**
 * Load workflow JSON file
 */
function loadWorkflow(filename) {
  const workflowPath = path.join(__dirname, 'n8n-workflows', filename);
  
  if (!fs.existsSync(workflowPath)) {
    throw new Error(`Workflow file not found: ${workflowPath}`);
  }
  
  const content = fs.readFileSync(workflowPath, 'utf8');
  return JSON.parse(content);
}

/**
 * Deploy a single workflow
 */
async function deployWorkflow(filename) {
  try {
    console.log(`📤 Deploying ${filename}...`);
    
    const workflow = loadWorkflow(filename);
    
    // Ensure workflow is inactive initially
    workflow.active = false;
    
    // Create workflow
    const response = await makeRequest('POST', '/api/v1/workflows', workflow);
    
    if (response.id) {
      console.log(`✅ Created workflow: ${workflow.name} (ID: ${response.id})`);
      
      // Activate the workflow
      await makeRequest('PATCH', `/api/v1/workflows/${response.id}`, { active: true });
      console.log(`🟢 Activated workflow: ${workflow.name}`);
      
      return {
        filename,
        name: workflow.name,
        id: response.id,
        status: 'deployed'
      };
    } else {
      throw new Error('No workflow ID returned');
    }
    
  } catch (error) {
    console.error(`❌ Failed to deploy ${filename}:`, error.message);
    return {
      filename,
      name: filename,
      id: null,
      status: 'failed',
      error: error.message
    };
  }
}

/**
 * Check if workflow already exists
 */
async function getExistingWorkflows() {
  try {
    const response = await makeRequest('GET', '/api/v1/workflows');
    return response.data || response || [];
  } catch (error) {
    console.warn('⚠️ Could not fetch existing workflows:', error.message);
    return [];
  }
}

/**
 * Main deployment function
 */
async function deployWorkflows() {
  console.log('🚀 Starting N8N Workflow Deployment');
  console.log('=====================================');
  
  // Test connection first
  if (!(await testConnection())) {
    process.exit(1);
  }
  
  // Get existing workflows
  const existingWorkflows = await getExistingWorkflows();
  console.log(`📋 Found ${existingWorkflows.length} existing workflows`);
  
  const results = [];
  
  console.log('\n📦 Deploying approved workflows:');
  for (const filename of APPROVED_WORKFLOWS) {
    const result = await deployWorkflow(filename);
    results.push(result);
    
    // Brief pause between deployments
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Report results
  console.log('\n📊 Deployment Summary');
  console.log('=====================');
  
  const successful = results.filter(r => r.status === 'deployed');
  const failed = results.filter(r => r.status === 'failed');
  
  console.log(`✅ Successfully deployed: ${successful.length}`);
  successful.forEach(r => console.log(`   - ${r.name} (${r.id})`));
  
  if (failed.length > 0) {
    console.log(`❌ Failed to deploy: ${failed.length}`);
    failed.forEach(r => console.log(`   - ${r.filename}: ${r.error}`));
  }
  
  console.log(`\n⏭️ Skipped workflows (as planned): ${SKIPPED_WORKFLOWS.length}`);
  SKIPPED_WORKFLOWS.forEach(filename => console.log(`   - ${filename}`));
  
  console.log('\n🎉 N8N Workflow deployment complete!');
  console.log(`🌐 Access N8N at: ${N8N_BASE_URL}`);
  
  return {
    total: APPROVED_WORKFLOWS.length,
    successful: successful.length,
    failed: failed.length,
    results
  };
}

// Run deployment if called directly
if (require.main === module) {
  deployWorkflows().catch(error => {
    console.error('💥 Deployment failed:', error);
    process.exit(1);
  });
}

module.exports = { deployWorkflows, makeRequest, testConnection };