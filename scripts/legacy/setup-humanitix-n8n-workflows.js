#!/usr/bin/env node

/**
 * N8N Humanitix Workflow Setup Script
 * 
 * This script sets up the complete N8N workflow architecture for Humanitix
 * data extraction and partner invoicing.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  n8nUrl: process.env.N8N_API_URL || 'http://localhost:5678',
  n8nApiKey: process.env.N8N_API_KEY,
  workflowsDir: path.join(__dirname, '../docs/n8n-workflows'),
  logFile: path.join(__dirname, '../logs/n8n-setup.log'),
  
  // Required environment variables
  requiredEnvVars: [
    'HUMANITIX_API_KEY',
    'NOTION_DATABASE_ID',
    'SLACK_CHANNEL'
  ],
  
  // Workflow files to import
  workflows: [
    {
      file: 'humanitix-complete-extraction.json',
      name: 'Humanitix Complete Data Extraction',
      description: 'Real-time 15-minute extraction for partner invoicing',
      schedule: '*/15 * * * *',
      autoActivate: true
    },
    {
      file: 'humanitix-historical-complete.json',
      name: 'Humanitix Historical Complete Import',
      description: 'One-time historical data import',
      schedule: null,
      autoActivate: false
    },
    {
      file: 'humanitix-partner-specific.json',
      name: 'Humanitix Partner-Specific Extraction',
      description: 'Daily partner invoicing workflow',
      schedule: '0 0 * * *',
      autoActivate: true
    },
    {
      file: 'humanitix-manual-event-extraction.json',
      name: 'Humanitix Manual Event Extraction',
      description: 'On-demand event-specific extraction',
      schedule: null,
      autoActivate: true
    }
  ]
};

class N8NWorkflowSetup {
  constructor() {
    this.setupLog = [];
    this.errors = [];
    this.createdWorkflows = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    
    console.log(logEntry);
    this.setupLog.push(logEntry);
    
    if (type === 'error') {
      this.errors.push(message);
    }
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites...');
    
    // Check if N8N is running
    try {
      const { stdout } = await execAsync(`curl -s ${CONFIG.n8nUrl}/healthz`);
      if (!stdout.includes('ok')) {
        throw new Error('N8N health check failed');
      }
      this.log('N8N instance is running');
    } catch (error) {
      this.log(`N8N is not accessible at ${CONFIG.n8nUrl}: ${error.message}`, 'error');
      return false;
    }

    // Check required environment variables
    const missingVars = CONFIG.requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingVars.length > 0) {
      this.log(`Missing required environment variables: ${missingVars.join(', ')}`, 'error');
      return false;
    }
    this.log('All required environment variables are set');

    // Check workflow files exist
    const missingFiles = CONFIG.workflows.filter(workflow => 
      !fs.existsSync(path.join(CONFIG.workflowsDir, workflow.file))
    );
    if (missingFiles.length > 0) {
      this.log(`Missing workflow files: ${missingFiles.map(w => w.file).join(', ')}`, 'error');
      return false;
    }
    this.log('All workflow files are present');

    return true;
  }

  async importWorkflow(workflowConfig) {
    this.log(`Importing workflow: ${workflowConfig.name}`);
    
    try {
      // Read workflow file
      const workflowPath = path.join(CONFIG.workflowsDir, workflowConfig.file);
      const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
      
      // Prepare import payload
      const importPayload = {
        name: workflowConfig.name,
        nodes: workflowData.nodes,
        connections: workflowData.connections,
        settings: workflowData.settings,
        tags: workflowData.tags,
        active: workflowConfig.autoActivate
      };

      // Import workflow via N8N API
      const response = await this.makeN8NRequest('POST', '/workflows', importPayload);
      
      if (response.success) {
        this.log(`Successfully imported workflow: ${workflowConfig.name}`);\n        this.createdWorkflows.push({\n          ...workflowConfig,\n          id: response.data.id,\n          imported: true\n        });\n        return response.data;\n      } else {\n        throw new Error(response.error || 'Import failed');\n      }\n    } catch (error) {\n      this.log(`Failed to import workflow ${workflowConfig.name}: ${error.message}`, 'error');\n      return null;\n    }\n  }\n\n  async makeN8NRequest(method, endpoint, data = null) {\n    try {\n      const url = `${CONFIG.n8nUrl}/api/v1${endpoint}`;\n      const options = {\n        method,\n        headers: {\n          'Content-Type': 'application/json'\n        }\n      };\n\n      if (CONFIG.n8nApiKey) {\n        options.headers['X-N8N-API-KEY'] = CONFIG.n8nApiKey;\n      }\n\n      let command = `curl -s -X ${method} \"${url}\"`;\n      \n      if (data) {\n        const jsonData = JSON.stringify(data).replace(/\"/g, '\\\"');\n        command += ` -H \"Content-Type: application/json\" -d \"${jsonData}\"`;\n      }\n\n      if (CONFIG.n8nApiKey) {\n        command += ` -H \"X-N8N-API-KEY: ${CONFIG.n8nApiKey}\"`;\n      }\n\n      const { stdout, stderr } = await execAsync(command);\n      \n      if (stderr) {\n        throw new Error(stderr);\n      }\n\n      const response = JSON.parse(stdout);\n      return { success: true, data: response };\n    } catch (error) {\n      return { success: false, error: error.message };\n    }\n  }\n\n  async activateWorkflow(workflowId) {\n    this.log(`Activating workflow: ${workflowId}`);\n    \n    try {\n      const response = await this.makeN8NRequest('POST', `/workflows/${workflowId}/activate`);\n      \n      if (response.success) {\n        this.log(`Successfully activated workflow: ${workflowId}`);\n        return true;\n      } else {\n        throw new Error(response.error || 'Activation failed');\n      }\n    } catch (error) {\n      this.log(`Failed to activate workflow ${workflowId}: ${error.message}`, 'error');\n      return false;\n    }\n  }\n\n  async validateWorkflowExecution(workflowId) {\n    this.log(`Validating workflow execution: ${workflowId}`);\n    \n    try {\n      // Get workflow executions\n      const response = await this.makeN8NRequest('GET', `/executions?workflowId=${workflowId}&limit=1`);\n      \n      if (response.success && response.data.length > 0) {\n        const execution = response.data[0];\n        if (execution.finished && !execution.stoppedAt) {\n          this.log(`Workflow ${workflowId} executed successfully`);\n          return true;\n        }\n      }\n      \n      this.log(`No successful executions found for workflow ${workflowId}`, 'warning');\n      return false;\n    } catch (error) {\n      this.log(`Failed to validate workflow ${workflowId}: ${error.message}`, 'error');\n      return false;\n    }\n  }\n\n  async setupCredentials() {\n    this.log('Setting up credentials...');\n    \n    const credentials = [\n      {\n        name: 'Humanitix API',\n        type: 'httpHeaderAuth',\n        data: {\n          name: 'X-API-Key',\n          value: process.env.HUMANITIX_API_KEY\n        }\n      },\n      {\n        name: 'Slack Webhook',\n        type: 'slackApi',\n        data: {\n          accessToken: process.env.SLACK_BOT_TOKEN\n        }\n      }\n    ];\n\n    for (const credential of credentials) {\n      try {\n        const response = await this.makeN8NRequest('POST', '/credentials', credential);\n        \n        if (response.success) {\n          this.log(`Successfully created credential: ${credential.name}`);\n        } else {\n          this.log(`Failed to create credential ${credential.name}: ${response.error}`, 'error');\n        }\n      } catch (error) {\n        this.log(`Error creating credential ${credential.name}: ${error.message}`, 'error');\n      }\n    }\n  }\n\n  async runSetup() {\n    this.log('Starting N8N Humanitix workflow setup...');\n    \n    // Check prerequisites\n    if (!(await this.checkPrerequisites())) {\n      this.log('Prerequisites check failed. Aborting setup.', 'error');\n      return false;\n    }\n\n    // Setup credentials\n    await this.setupCredentials();\n\n    // Import workflows\n    for (const workflowConfig of CONFIG.workflows) {\n      const importedWorkflow = await this.importWorkflow(workflowConfig);\n      \n      if (importedWorkflow && workflowConfig.autoActivate) {\n        await this.activateWorkflow(importedWorkflow.id);\n      }\n    }\n\n    // Create setup summary\n    const summary = {\n      timestamp: new Date().toISOString(),\n      totalWorkflows: CONFIG.workflows.length,\n      successfulImports: this.createdWorkflows.length,\n      errors: this.errors.length,\n      createdWorkflows: this.createdWorkflows,\n      setupLog: this.setupLog\n    };\n\n    // Save setup report\n    const reportPath = path.join(__dirname, '../logs/n8n-setup-report.json');\n    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));\n    \n    this.log(`Setup complete. Report saved to: ${reportPath}`);\n    \n    // Print summary\n    console.log('\\n=== SETUP SUMMARY ===');\n    console.log(`Total workflows: ${summary.totalWorkflows}`);\n    console.log(`Successful imports: ${summary.successfulImports}`);\n    console.log(`Errors: ${summary.errors.length}`);\n    \n    if (summary.errors.length > 0) {\n      console.log('\\nErrors:');\n      this.errors.forEach(error => console.log(`- ${error}`));\n    }\n    \n    console.log('\\nCreated workflows:');\n    this.createdWorkflows.forEach(workflow => {\n      console.log(`- ${workflow.name} (${workflow.file}) - ${workflow.autoActivate ? 'ACTIVE' : 'INACTIVE'}`);\n    });\n\n    return this.errors.length === 0;\n  }\n\n  async testWorkflows() {\n    this.log('Testing workflow functionality...');\n    \n    for (const workflow of this.createdWorkflows) {\n      if (workflow.file === 'humanitix-manual-event-extraction.json') {\n        // Test webhook endpoint\n        try {\n          const testPayload = {\n            extractionType: 'date-range',\n            dateRange: {\n              start: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),\n              end: new Date().toISOString()\n            },\n            outputFormat: 'summary',\n            priority: 'normal',\n            requestedBy: 'setup-test'\n          };\n\n          const webhookUrl = `${CONFIG.n8nUrl}/webhook/humanitix-manual-extraction`;\n          const response = await this.makeN8NRequest('POST', '/webhook/humanitix-manual-extraction', testPayload);\n          \n          if (response.success) {\n            this.log(`Successfully tested webhook workflow: ${workflow.name}`);\n          } else {\n            this.log(`Webhook test failed for ${workflow.name}: ${response.error}`, 'error');\n          }\n        } catch (error) {\n          this.log(`Error testing webhook workflow ${workflow.name}: ${error.message}`, 'error');\n        }\n      }\n    }\n  }\n}\n\n// Main execution\nasync function main() {\n  const setup = new N8NWorkflowSetup();\n  \n  try {\n    const success = await setup.runSetup();\n    \n    if (success) {\n      console.log('\\n✅ N8N Humanitix workflow setup completed successfully!');\n      console.log('\\nNext steps:');\n      console.log('1. Verify workflows are running in N8N dashboard');\n      console.log('2. Test manual extraction webhook:');\n      console.log(`   curl -X POST ${CONFIG.n8nUrl}/webhook/humanitix-manual-extraction \\\\`);\n      console.log('        -H \"Content-Type: application/json\" \\\\');\n      console.log('        -d \\'{\"extractionType\": \"date-range\", \"outputFormat\": \"summary\"}\\' ');\n      console.log('3. Monitor Slack channel for extraction notifications');\n      console.log('4. Check generated invoice files in the filesystem');\n      \n      // Optional: Run tests\n      if (process.argv.includes('--test')) {\n        await setup.testWorkflows();\n      }\n      \n      process.exit(0);\n    } else {\n      console.log('\\n❌ Setup failed. Check the logs for details.');\n      process.exit(1);\n    }\n  } catch (error) {\n    console.error('\\n💥 Setup crashed:', error.message);\n    process.exit(1);\n  }\n}\n\n// Run if called directly\nif (require.main === module) {\n  main();\n}\n\nmodule.exports = N8NWorkflowSetup;"