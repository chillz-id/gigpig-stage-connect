#!/usr/bin/env node

/**
 * Fix N8N Webhook Configurations
 * Problem: Webhooks configured for GET instead of POST
 * Solution: Update webhook HTTP method to POST for Humanitix workflows
 */

const https = require('https');

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzYWYzNjQ3ZC1hMTQzLTQ3MzctOWI3Yi0zMDVkNGM4ZmE4NTYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzg5NjQ4fQ.jIPgXdpfgkUOa4We46nfaN-NgaHh4TbQIjGcwU5K57I';
const N8N_BASE_URL = 'http://localhost:5678';

// Active webhook workflows that need fixing
const WEBHOOK_WORKFLOWS = [
    '7w1BMGSjVVUtadjf', // Humanitix to Brevo Sync
    'CK9JWj9aapFu26lH', // Humanitix Events → Event Dashboard (Date Separated)
    'FMsWcRZKh4WhFWxe', // Humanitix Complete Data Sync
    'SHtfkarCza7ZAP86', // Historical Quantity Fix - One Time
    'jmCqdP8aZkzizhWm', // Simple Event Test
    'nwD76Jaj0ifRpk8H', // Humanitix Test - Webhook
];

async function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, N8N_BASE_URL);
        const options = {
            method,
            headers: {
                'X-N8N-API-KEY': N8N_API_KEY,
                'Content-Type': 'application/json',
            }
        };

        const req = require('http').request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve(result);
                } catch (e) {
                    resolve({ body, statusCode: res.statusCode });
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

async function fixWebhookWorkflow(workflowId) {
    console.log(`\n=== Processing Workflow: ${workflowId} ===`);
    
    try {
        // Get current workflow
        const workflow = await makeRequest(`/api/v1/workflows/${workflowId}`);
        
        if (workflow.statusCode && workflow.statusCode !== 200) {
            console.log(`❌ Failed to get workflow: ${workflow.body}`);
            return false;
        }

        console.log(`📋 Workflow: ${workflow.name}`);
        console.log(`🔄 Active: ${workflow.active}`);
        
        // Find webhook nodes
        const webhookNodes = workflow.nodes.filter(node => node.type === 'n8n-nodes-base.webhook');
        
        if (webhookNodes.length === 0) {
            console.log(`ℹ️  No webhook nodes found`);
            return true;
        }

        console.log(`🔍 Found ${webhookNodes.length} webhook node(s)`);
        
        let needsUpdate = false;
        
        // Check and update webhook configurations
        webhookNodes.forEach(node => {
            const currentMethod = node.parameters?.httpMethod;
            console.log(`   📡 Webhook "${node.name}": HTTP Method = ${currentMethod || 'null (defaults to GET)'}`);
            
            if (!currentMethod || currentMethod !== 'POST') {
                console.log(`   🔧 Updating to POST method`);
                if (!node.parameters) node.parameters = {};
                node.parameters.httpMethod = 'POST';
                needsUpdate = true;
            }
        });

        if (!needsUpdate) {
            console.log(`✅ No updates needed`);
            return true;
        }

        // Create update payload with only required fields
        const updatePayload = {
            id: workflow.id,
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            active: workflow.active,
            settings: workflow.settings || {},
            staticData: workflow.staticData || {}
        };

        // Update the workflow
        console.log(`🚀 Updating workflow...`);
        const result = await makeRequest(`/api/v1/workflows/${workflowId}`, 'PUT', updatePayload);
        
        if (result.statusCode && result.statusCode !== 200) {
            console.log(`❌ Update failed: ${result.body}`);
            return false;
        }

        console.log(`✅ Successfully updated workflow`);
        return true;
        
    } catch (error) {
        console.log(`❌ Error processing workflow: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🔧 N8N Webhook Configuration Fix');
    console.log('Problem: Webhooks configured for GET instead of POST');
    console.log('Solution: Update HTTP method to POST for webhook nodes\n');

    let successCount = 0;
    let totalCount = WEBHOOK_WORKFLOWS.length;

    for (const workflowId of WEBHOOK_WORKFLOWS) {
        const success = await fixWebhookWorkflow(workflowId);
        if (success) successCount++;
    }

    console.log(`\n📊 Results:`);
    console.log(`   ✅ Successful: ${successCount}/${totalCount}`);
    console.log(`   ❌ Failed: ${totalCount - successCount}/${totalCount}`);

    if (successCount === totalCount) {
        console.log(`\n🎉 All workflows updated successfully!`);
        console.log(`🔄 Webhooks should now accept POST requests from Humanitix`);
    } else {
        console.log(`\n⚠️  Some workflows failed to update. Check logs above.`);
        process.exit(1);
    }
}

// Run the script
main().catch(console.error);