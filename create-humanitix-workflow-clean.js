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

// Create a clean workflow with only required fields
async function createWorkflow() {
  // Read the fixed workflow JSON
  const workflowPath = path.join(__dirname, 'docs/n8n-workflows/humanitix-notion-sync-fixed.json');
  const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
  
  // Create a clean workflow with only required fields
  const cleanWorkflow = {
    name: `Humanitix to Notion Sync - ${new Date().toISOString().split('T')[0]}`,
    nodes: workflowData.nodes,
    connections: workflowData.connections,
    settings: {
      executionOrder: "v1"
    },
    staticData: {}
  };

  console.log('📝 Creating workflow in N8N...');
  console.log('   Name:', cleanWorkflow.name);
  console.log('   Nodes:', cleanWorkflow.nodes.length);

  try {
    const response = await fetch(`${N8N_API_URL}/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(cleanWorkflow)
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
      
      console.log('\n⚙️  Configuration needed:');
      console.log('1. Open the workflow in N8N: http://localhost:5678/workflow/' + result.id);
      console.log('2. Add these variables to the workflow:');
      console.log('   - HUMANITIX_API_KEY = ' + (process.env.HUMANITIX_API_KEY ? process.env.HUMANITIX_API_KEY.substring(0, 20) + '...' : 'NOT SET'));
      console.log('   - NOTION_DATABASE_ID = YOUR_NOTION_DATABASE_ID');
      console.log('   - SLACK_CHANNEL_ID = YOUR_SLACK_CHANNEL (optional)');
      console.log('3. Test the workflow by clicking "Execute Workflow"');
      console.log('4. Once tested, activate the workflow to run every 15 minutes');
      
      console.log('\n🔧 Key fixes applied:');
      console.log('   ✅ Added required "page" parameter to Humanitix API calls');
      console.log('   ✅ Fixed authentication to use proper header format');
      console.log('   ✅ Added event parsing step to handle array response');
      console.log('   ✅ Updated Notion nodes to v2.2 format');
      console.log('   ✅ Added proper error handling and Slack notifications');
      
      console.log('\n📊 What this workflow does:');
      console.log('   1. Runs every 15 minutes (when activated)');
      console.log('   2. Fetches all events from Humanitix');
      console.log('   3. For each event, fetches all orders');
      console.log('   4. Transforms order data to Notion format');
      console.log('   5. Checks for duplicates before creating');
      console.log('   6. Creates new entries in Notion database');
      console.log('   7. Sends success notification to Slack');
      
    } else {
      console.error('❌ Failed to create workflow:', response.status, response.statusText);
      console.error('Response:', result);
      
      if (result.message && result.message.includes('properties')) {
        console.log('\n🔍 Debugging: The workflow JSON might have invalid properties.');
        console.log('   Try removing: tags, createdAt, updatedAt, versionId, triggerCount');
      }
    }
  } catch (error) {
    console.error('❌ Error creating workflow:', error.message);
  }
}

// Run the creation
createWorkflow().catch(console.error);