require('dotenv').config({ path: '/root/agents/.env' });

#!/usr/bin/env node
/**
 * Fix Humanitix Sync Workflows
 * Repairs authentication, API endpoints, and error handling for both workflows
 */

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const N8N_API_URL = "http://localhost:5678/api/v1";

class HumanitixWorkflowFixer {
  constructor() {
    this.headers = {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json'
    };
  }

  async apiCall(method, endpoint, data = null) {
    const url = `${N8N_API_URL}${endpoint}`;
    const options = {
      method,
      headers: this.headers
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ API Error [${method} ${endpoint}]:`, error.message);
      throw error;
    }
  }

  async getWorkflow(workflowId) {
    return await this.apiCall('GET', `/workflows/${workflowId}`);
  }

  async updateWorkflow(workflowId, workflowData) {
    return await this.apiCall('PUT', `/workflows/${workflowId}`, workflowData);
  }

  fixRealTimeSync(workflow) {
    console.log('🔧 Fixing real-time sync workflow...');
    
    // Fix Humanitix API authentication - use direct API key
    workflow.nodes.forEach(node => {
      if (node.name === 'Fetch Humanitix Events' || node.name === 'Fetch Event Orders') {
        // Update to use environment variable or direct key
        node.parameters.headerParameters.parameters = node.parameters.headerParameters.parameters.map(param => {
          if (param.name === 'x-api-key') {
            return {
              ...param,
              value: "=\\{\\{ \\$env.HUMANITIX_API_KEY \\}\\}" // Use environment variable
            };
          }
          return param;
        });
        
        // Remove credentials reference to use direct headers
        delete node.credentials;
      }
      
      // Fix Brevo API - use environment variable instead of hard-coded key
      if (node.name === 'Sync to Brevo') {
        node.parameters.headerParameters.parameters = node.parameters.headerParameters.parameters.map(param => {
          if (param.name === 'api-key') {
            return {
              ...param,
              value: "=\\{\\{ \\$env.BREVO_API_KEY \\}\\}" // Use environment variable
            };
          }
          return param;
        });
      }
    });

    // Add better error handling
    const errorHandlerNode = {
      id: "error-handler",
      name: "Error Handler",
      type: "n8n-nodes-base.code",
      position: [1600, 400],
      parameters: {
        jsCode: `
          const error = $json.error || $json;
          const errorInfo = {
            timestamp: new Date().toISOString(),
            workflow: 'Humanitix Real-time Sync',
            error: error.message || error.toString(),
            node: $json.node || 'Unknown',
            stack: error.stack || 'No stack trace'
          };
          
          console.error('❌ Workflow Error:', JSON.stringify(errorInfo, null, 2));
          
          return [{
            json: {
              ...errorInfo,
              status: 'failed',
              retryRecommended: true
            }
          }];
        `
      }
    };

    workflow.nodes.push(errorHandlerNode);

    // Improve event processing to handle larger date ranges
    workflow.nodes.forEach(node => {
      if (node.name === 'Process Events') {
        node.parameters.jsCode = `
          const events = $input.all()[0].json.events || [];
          const output = [];

          for (const event of events) {
            const eventDate = new Date(event.startDate);
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6); // Increased from 30 days to 6 months
            
            if (event.status === 'live' && eventDate > sixMonthsAgo) {
              output.push({
                eventId: event._id,
                eventName: event.title,
                eventDate: event.startDate,
                eventLocation: event.location,
                venue: event.eventLocation?.venueName || 'Unknown Venue',
                city: event.eventLocation?.city || '',
                region: event.eventLocation?.region || ''
              });
            }
          }

          console.log(\`Processing \${output.length} events for order sync\`);
          return output;
        `;
      }
    });

    return workflow;
  }

  fixHistoricalImport(workflow) {
    console.log('🔧 Fixing historical import workflow...');
    
    // Fix JavaScript syntax error
    workflow.nodes.forEach(node => {
      if (node.name === 'Set Parameters') {
        node.parameters.jsCode = node.parameters.jsCode.replace('hasMore: True', 'hasMore: true');
      }
    });

    // Fix authentication for all Humanitix API calls
    workflow.nodes.forEach(node => {
      if (node.name === 'Get ALL Events' || node.name === 'Get ALL Orders') {
        // Replace predefined credential with direct API key
        node.parameters = {
          ...node.parameters,
          method: "GET",
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: "x-api-key",
                value: "=\\{\\{ \\$env.HUMANITIX_API_KEY \\}\\}"
              },
              {
                name: "Accept",
                value: "application/json"
              }
            ]
          }
        };
        
        // Remove old authentication
        delete node.parameters.authentication;
        delete node.parameters.nodeCredentialType;
      }
    });

    // Improve pagination logic with better safety checks
    workflow.nodes.forEach(node => {
      if (node.name === 'Pagination Loop') {
        node.parameters.jsCode = `
          const currentPage = $json.currentPage || 1;
          const maxPages = 50; // Reasonable safety limit
          
          if (currentPage > maxPages) {
            console.log(\`Reached max pages limit (\${maxPages})\`);
            return [];
          }
          
          console.log(\`Processing page \${currentPage}/\${maxPages}\`);
          
          return [{
            json: {
              ...$json,
              page: currentPage
            }
          }];
        `;
      }
    });

    // Fix the process events logic
    workflow.nodes.forEach(node => {
      if (node.name === 'Process Events') {
        node.parameters.jsCode = `
          const response = $input.all()[0].json;
          let events = [];

          // Handle different response formats
          if (Array.isArray(response)) {
            events = response;
          } else if (response.events && Array.isArray(response.events)) {
            events = response.events;
          } else if (response.data && Array.isArray(response.data)) {
            events = response.data;
          }

          console.log(\`Found \${events.length} events on page \${$json.page}\`);

          // Check if there are more pages (if we got less than 100, we're done)
          const hasMore = events.length === 100;
          const nextPage = hasMore ? ($json.page + 1) : null;
          
          if (!hasMore) {
            console.log('✅ Reached end of events - no more pages');
          }

          // Return events with pagination info
          return events.map(event => ({
            json: {
              event,
              hasMore,
              nextPage,
              currentPage: $json.page
            }
          }));
        `;
      }
    });

    return workflow;
  }

  async fixWorkflows() {
    try {
      console.log('🚀 Starting Humanitix workflow repairs...\n');

      // Fix Real-time Sync Workflow
      console.log('📥 Fetching real-time sync workflow...');
      const realTimeWorkflow = await this.getWorkflow('7w1BMGSjVVUtadjf');
      const fixedRealTime = this.fixRealTimeSync(realTimeWorkflow);
      
      console.log('💾 Updating real-time sync workflow...');
      await this.updateWorkflow('7w1BMGSjVVUtadjf', fixedRealTime);
      console.log('✅ Real-time sync workflow updated\n');

      // Fix Historical Import Workflow
      console.log('📥 Fetching historical import workflow...');
      const historicalWorkflow = await this.getWorkflow('py2wq9zchBz0TD9j');
      const fixedHistorical = this.fixHistoricalImport(historicalWorkflow);
      
      console.log('💾 Updating historical import workflow...');
      await this.updateWorkflow('py2wq9zchBz0TD9j', fixedHistorical);
      console.log('✅ Historical import workflow updated\n');

      console.log('🎉 All Humanitix workflows have been repaired!');
      
      return {
        success: true,
        message: 'Both Humanitix workflows have been successfully repaired',
        repairs: [
          'Fixed authentication for Humanitix API calls',
          'Secured Brevo API key using environment variables',
          'Fixed JavaScript syntax errors',
          'Improved error handling and logging',
          'Enhanced pagination logic',
          'Extended event date range processing'
        ]
      };

    } catch (error) {
      console.error('💥 Failed to repair workflows:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Run the workflow repairs
if (require.main === module) {
  const fixer = new HumanitixWorkflowFixer();
  fixer.fixWorkflows()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Success!');
        console.log('Repairs applied:');
        result.repairs.forEach(repair => console.log(`  • ${repair}`));
      } else {
        console.error('\n❌ Failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = HumanitixWorkflowFixer;