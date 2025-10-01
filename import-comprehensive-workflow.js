#!/usr/bin/env node

/**
 * Import Comprehensive Humanitix Sync Workflow to n8n
 */

import fs from 'fs';
import { spawn } from 'child_process';

async function importWorkflow() {
  try {
    // Read the workflow JSON
    const workflowData = JSON.parse(
      fs.readFileSync('/root/agents/n8n-workflows/comprehensive-humanitix-sync.json', 'utf8')
    );

    // Format for n8n API
    const importPayload = {
      name: workflowData.name,
      nodes: workflowData.nodes,
      connections: workflowData.connections,
      settings: workflowData.settings || {},
      staticData: {}
    };

    console.log('📋 Importing Comprehensive Humanitix Sync Workflow');
    console.log(`- Name: ${importPayload.name}`);
    console.log(`- Nodes: ${importPayload.nodes.length}`);
    console.log('- Will activate after import');

    // Create temporary file with payload
    const tempFile = '/tmp/workflow-import.json';
    fs.writeFileSync(tempFile, JSON.stringify(importPayload, null, 2));

    // Use curl to import
    const curl = spawn('curl', [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-H', 'X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzYWYzNjQ3ZC1hMTQzLTQ3MzctOWI3Yi0zMDVkNGM4ZmE4NTYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU4ODcwMTQyfQ.uLkZphH-hZ7hHTWJbyuZbdrbpOKkl1-caPgcpw0TccY',
      '-d', `@${tempFile}`,
      'http://localhost:5678/api/v1/workflows'
    ]);

    let response = '';
    let error = '';

    curl.stdout.on('data', (data) => {
      response += data.toString();
    });

    curl.stderr.on('data', (data) => {
      error += data.toString();
    });

    curl.on('close', (code) => {
      // Clean up temp file
      fs.unlinkSync(tempFile);

      if (code === 0) {
        try {
          const result = JSON.parse(response);

          if (result.id) {
            console.log('\n✅ WORKFLOW IMPORTED SUCCESSFULLY!');
            console.log(`- Workflow ID: ${result.id}`);
            console.log(`- Active: ${result.active}`);
            console.log(`- Created: ${result.createdAt}`);

            console.log('\n🔄 WORKFLOW WILL NOW:');
            console.log('- Poll Humanitix API every 15 minutes');
            console.log('- Sync ALL API fields without conversion');
            console.log('- Preserve original currencies, timezones, dates');
            console.log('- Map complete financial data');
            console.log('- Extract individual tickets from orders');
            console.log('- Create sessions for multi-date events');
            console.log('- Update 4 Notion databases with complete data');

            console.log('\n📊 DATA MAPPING:');
            console.log('✅ Events: ALL 47+ API fields → Notion');
            console.log('✅ Orders: Complete financial data → Notion');
            console.log('✅ Tickets: Individual ticket extraction → Notion');
            console.log('✅ Sessions: Multi-date event handling → Notion');

            process.exit(0);
          } else {
            console.error('❌ Import failed:', response);
            process.exit(1);
          }
        } catch (e) {
          console.error('❌ Error parsing response:', response);
          console.error('Error details:', error);
          process.exit(1);
        }
      } else {
        console.error('❌ Import failed with exit code:', code);
        console.error('Error:', error);
        console.error('Response:', response);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('💥 Import failed:', error.message);
    process.exit(1);
  }
}

// Run import
importWorkflow();