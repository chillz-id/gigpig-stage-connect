#!/usr/bin/env node

/**
 * Setup script for Humanitix to Notion N8N workflow
 * 
 * This script:
 * 1. Validates environment variables
 * 2. Tests API connections
 * 3. Creates/imports the N8N workflow
 * 4. Provides setup instructions for Notion database
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const N8N_API_URL = process.env.N8N_API_URL || 'http://localhost:5678/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY;
const HUMANITIX_API_KEY = process.env.HUMANITIX_API_KEY;
const NOTION_TOKEN = process.env.NOTION_TOKEN;

console.log('🚀 Setting up Humanitix to Notion Integration...\n');

// Validate environment variables
function validateEnvironment() {
  console.log('📋 Checking environment variables...');
  
  const required = {
    'N8N_API_KEY': N8N_API_KEY,
    'HUMANITIX_API_KEY': HUMANITIX_API_KEY,
    'NOTION_TOKEN': NOTION_TOKEN
  };

  let valid = true;
  
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      console.error(`❌ Missing ${key}`);
      valid = false;
    } else {
      console.log(`✅ ${key} configured`);
    }
  }

  if (!valid) {
    console.error('\n💡 Make sure all required environment variables are set in .env file');
    process.exit(1);
  }

  console.log('✅ All environment variables present\n');
}

// Test API connections
async function testConnections() {
  console.log('🔗 Testing API connections...');

  // Test N8N API
  try {
    const n8nResponse = await fetch(`${N8N_API_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
    
    if (n8nResponse.ok) {
      console.log('✅ N8N API connection successful');
    } else {
      throw new Error(`N8N API returned ${n8nResponse.status}`);
    }
  } catch (error) {
    console.error(`❌ N8N API connection failed: ${error.message}`);
    console.error('💡 Make sure N8N is running at http://170.64.252.55:5678');
    process.exit(1);
  }

  // Test Humanitix API
  try {
    const humanitixResponse = await fetch('https://api.humanitix.com/v1/events?limit=1', {
      headers: {
        'Authorization': `Bearer ${HUMANITIX_API_KEY}`
      }
    });
    
    if (humanitixResponse.ok) {
      console.log('✅ Humanitix API connection successful');
    } else {
      throw new Error(`Humanitix API returned ${humanitixResponse.status}`);
    }
  } catch (error) {
    console.error(`❌ Humanitix API connection failed: ${error.message}`);
    console.error('💡 Check your Humanitix API key');
    process.exit(1);
  }

  // Test Notion API
  try {
    const notionResponse = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28'
      }
    });
    
    if (notionResponse.ok) {
      console.log('✅ Notion API connection successful');
    } else {
      throw new Error(`Notion API returned ${notionResponse.status}`);
    }
  } catch (error) {
    console.error(`❌ Notion API connection failed: ${error.message}`);
    console.error('💡 Check your Notion integration token');
    process.exit(1);
  }

  console.log('✅ All API connections successful\n');
}

// Load and import workflow
async function importWorkflow() {
  console.log('📥 Importing N8N workflow...');

  const workflowPath = path.join(__dirname, '../docs/n8n-workflows/humanitix-notion-sync.json');
  
  if (!fs.existsSync(workflowPath)) {
    console.error(`❌ Workflow file not found: ${workflowPath}`);
    process.exit(1);
  }

  const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

  try {
    const response = await fetch(`${N8N_API_URL}/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify(workflowData)
    });

    if (response.ok) {
      const workflow = await response.json();
      console.log(`✅ Workflow imported successfully (ID: ${workflow.id})`);
      return workflow.id;
    } else {
      const error = await response.text();
      throw new Error(`Failed to import workflow: ${error}`);
    }
  } catch (error) {
    console.error(`❌ Workflow import failed: ${error.message}`);
    console.error('💡 The workflow might already exist or there might be a configuration issue');
    return null;
  }
}

// Print setup instructions
function printSetupInstructions(workflowId) {
  console.log('\n📝 Setup Instructions:\n');
  
  console.log('1. Create Notion Database:');
  console.log('   • Go to Notion and create a new page');
  console.log('   • Add a database with the name "Ticket Sales Tracker"');
  console.log('   • Configure properties as described in the documentation');
  console.log('   • Copy the database ID from the URL');
  console.log('');
  
  console.log('2. Configure N8N Workflow:');
  if (workflowId) {
    console.log(`   • Go to http://170.64.252.55:5678/workflow/${workflowId}`);
  } else {
    console.log('   • Go to http://170.64.252.55:5678');
    console.log('   • Import the workflow manually from:');
    console.log('     /root/agents/docs/n8n-workflows/humanitix-notion-sync.json');
  }
  console.log('   • Add environment variable: NOTION_DATABASE_ID');
  console.log('   • Test the workflow with manual trigger');
  console.log('   • Activate the workflow for automatic execution');
  console.log('');
  
  console.log('3. Test the Integration:');
  console.log('   • Run the workflow manually first');
  console.log('   • Check that orders appear in your Notion database');
  console.log('   • Verify duplicate prevention is working');
  console.log('   • Monitor for any errors in N8N execution logs');
  console.log('');
  
  console.log('🔗 Useful Links:');
  console.log(`   • N8N Dashboard: http://170.64.252.55:5678`);
  console.log('   • Documentation: /root/agents/docs/HUMANITIX_NOTION_INTEGRATION.md');
  console.log('   • Humanitix API Docs: https://docs.humanitix.com');
  console.log('   • Notion API Docs: https://developers.notion.com');
}

// Print Notion database structure
function printNotionDatabaseStructure() {
  console.log('\n📊 Notion Database Properties:\n');
  
  const properties = [
    { name: 'Event Name', type: 'Title', description: 'Name of the event' },
    { name: 'Event Date', type: 'Date', description: 'When the event occurs' },
    { name: 'Platform', type: 'Select', description: 'Source platform (Humanitix)' },
    { name: 'Order ID', type: 'Text', description: 'Unique order identifier' },
    { name: 'Customer Name', type: 'Text', description: 'Full customer name' },
    { name: 'Customer Email', type: 'Email', description: 'Customer contact email' },
    { name: 'Customer Phone', type: 'Phone', description: 'Customer phone number' },
    { name: 'Ticket Types', type: 'Text', description: 'Types of tickets purchased' },
    { name: 'Quantity', type: 'Number', description: 'Total number of tickets' },
    { name: 'Amount', type: 'Number', description: 'Total amount paid' },
    { name: 'Currency', type: 'Select', description: 'Currency (AUD, USD, EUR, GBP)' },
    { name: 'Status', type: 'Select', description: 'Order status (Paid, Pending, etc.)' },
    { name: 'Purchase Date', type: 'Date', description: 'When order was placed' },
    { name: 'Venue', type: 'Text', description: 'Event venue name' },
    { name: 'Last Sync', type: 'Date', description: 'When record was last synced' },
    { name: 'Raw Data', type: 'Text', description: 'Complete API response' }
  ];

  properties.forEach(prop => {
    console.log(`   • ${prop.name.padEnd(15)} (${prop.type.padEnd(8)}) - ${prop.description}`);
  });
}

// Main execution
async function main() {
  try {
    validateEnvironment();
    await testConnections();
    
    const workflowId = await importWorkflow();
    
    printNotionDatabaseStructure();
    printSetupInstructions(workflowId);
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('💡 Follow the instructions above to complete the configuration.');
    
  } catch (error) {
    console.error(`\n❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateEnvironment,
  testConnections,
  importWorkflow,
  printSetupInstructions,
  printNotionDatabaseStructure
};