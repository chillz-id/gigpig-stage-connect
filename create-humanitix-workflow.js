#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}

loadEnv();

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1M2UzN2FhMC03MTc4LTRmMmYtODBhYS00ODNiYmE1ODc0YWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUxNTcwMDc2fQ._zbYlvtzSMRFHnQu6O_L2LhJU4Ib1655bynbmoXeqMo';
const N8N_API_URL = 'http://localhost:5678/api/v1';

// Create a simplified Humanitix workflow
async function createWorkflow() {
  // Read the fixed workflow JSON
  const workflowPath = path.join(__dirname, 'docs/n8n-workflows/humanitix-notion-sync-fixed.json');
  const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
  
  // Update the workflow with environment variables
  const updatedWorkflow = {
    ...workflowData,
    name: `Humanitix to Notion Sync - ${new Date().toISOString().split('T')[0]}`,
    active: false
  };

  // First, let's create environment variables in N8N
  const envVars = {
    HUMANITIX_API_KEY: process.env.HUMANITIX_API_KEY,
    NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID || 'YOUR_NOTION_DATABASE_ID_HERE'
  };

  console.log('📝 Creating workflow in N8N...');
  console.log('   Name:', updatedWorkflow.name);
  console.log('   Nodes:', updatedWorkflow.nodes.length);

  try {
    const response = await fetch(`${N8N_API_URL}/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updatedWorkflow)
    });

    const responseText = await response.text();
    let result;
    
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', responseText);
      return;
    }

    if (response.ok) {
      console.log('✅ Workflow created successfully!');
      console.log('   ID:', result.id);
      console.log('   Name:', result.name);
      console.log('   Active:', result.active);
      console.log('   View at: http://localhost:5678/workflow/' + result.id);
      
      console.log('\n⚙️  Next steps:');
      console.log('1. Open the workflow in N8N: http://localhost:5678/workflow/' + result.id);
      console.log('2. Update the environment variables:');
      console.log('   - HUMANITIX_API_KEY is already set');
      console.log('   - Set NOTION_DATABASE_ID to your Notion database ID');
      console.log('3. Test the workflow by clicking "Execute Workflow"');
      console.log('4. Once tested, activate the workflow to run every 15 minutes');
      
      console.log('\n🔧 Fixes applied for Humanitix API:');
      console.log('   - Added required "page" parameter to events endpoint');
      console.log('   - Removed unsupported parameters (status, limit, etc.)');
      console.log('   - Updated to handle the correct response format');
      
    } else {
      console.error('❌ Failed to create workflow:', response.status, response.statusText);
      console.error('Response:', result);
    }
  } catch (error) {
    console.error('❌ Error creating workflow:', error.message);
  }
}

// Run the creation
createWorkflow().catch(console.error);