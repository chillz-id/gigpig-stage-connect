#!/usr/bin/env node

/**
 * Fixed N8N Workflow Deployment Script
 * Handles N8N API format requirements
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

// Approved workflows to deploy
const APPROVED_WORKFLOWS = [
  'error-monitoring-workflow.json',
  'webhook-processing-workflow.json', 
  'humanitix-brevo-sync.json',
  'humanitix-event-sync.json',
  'multi-platform-ticket-sync.json',
  'google-auth-recovery-workflow.json',
  'flight-monitoring-workflows.json'
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
 * Clean workflow for N8N API
 */
function cleanWorkflowForAPI(workflow) {
  const cleaned = {
    name: workflow.name,
    nodes: workflow.nodes || [],
    connections: workflow.connections || {},
    staticData: workflow.staticData || {},
    settings: workflow.settings || {},
    tags: workflow.tags || []
  };
  
  // Remove any read-only or problematic fields
  delete cleaned.id;
  delete cleaned.active;
  delete cleaned.createdAt;
  delete cleaned.updatedAt;
  delete cleaned.versionId;
  
  return cleaned;
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
 * Load and clean workflow JSON file
 */
function loadWorkflow(filename) {
  const workflowPath = path.join(__dirname, 'n8n-workflows', filename);
  
  if (!fs.existsSync(workflowPath)) {
    throw new Error(`Workflow file not found: ${workflowPath}`);
  }
  
  const content = fs.readFileSync(workflowPath, 'utf8');
  const workflow = JSON.parse(content);
  
  return cleanWorkflowForAPI(workflow);
}

/**
 * Deploy a single workflow
 */
async function deployWorkflow(filename) {
  try {
    console.log(`📤 Deploying ${filename}...`);
    
    const workflow = loadWorkflow(filename);
    
    // Create workflow (inactive initially)
    const response = await makeRequest('POST', '/api/v1/workflows', workflow);
    
    if (response.id) {
      console.log(`✅ Created workflow: ${workflow.name} (ID: ${response.id})`);
      
      // Activate the workflow
      try {
        await makeRequest('PATCH', `/api/v1/workflows/${response.id}`, { active: true });
        console.log(`🟢 Activated workflow: ${workflow.name}`);
      } catch (activationError) {
        console.warn(`⚠️ Created but could not activate ${workflow.name}:`, activationError.message);
      }
      
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
 * Get existing workflows
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
 * Manual deployment instructions
 */
function showManualInstructions() {
  console.log('\n📋 Manual Deployment Instructions');
  console.log('==================================');
  console.log(`🌐 Access N8N at: ${N8N_BASE_URL}`);
  console.log('📁 Workflow files are in: ./n8n-workflows/');
  console.log('\nTo deploy manually:');
  console.log('1. Open N8N in your browser');
  console.log('2. Click "Import from file" or "New workflow"');
  console.log('3. Copy/paste the JSON content from each workflow file');
  console.log('4. Save and activate each workflow');
  console.log('\n📦 Workflows to deploy:');
  APPROVED_WORKFLOWS.forEach(filename => {
    console.log(`   - ${filename}`);
  });
}

/**
 * Main deployment function
 */
async function deployWorkflows() {
  console.log('🚀 Starting N8N Workflow Deployment (Fixed)');
  console.log('=============================================');
  
  // Test connection first
  if (!(await testConnection())) {
    console.log('\n🛠️ N8N API not accessible - showing manual instructions');
    showManualInstructions();
    return;
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
    
    if (failed.length === APPROVED_WORKFLOWS.length) {
      console.log('\n🛠️ All automated deployments failed - try manual deployment');
      showManualInstructions();
    }
  }
  
  console.log('\n🎉 N8N Workflow deployment process complete!');
  
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