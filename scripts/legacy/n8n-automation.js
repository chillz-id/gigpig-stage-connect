#!/usr/bin/env node
/**
 * Complete N8N Workflow Automation System
 * Direct API integration for Stand Up Sydney platform
 * Provides complete workflow lifecycle management
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '/root/agents/.env' });

// N8N API Configuration
const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}

const N8N_API_URL = process.env.N8N_API_URL || "http://localhost:5678/api/v1";

class N8NAutomation {
  constructor() {
    this.apiKey = N8N_API_KEY;
    this.baseUrl = N8N_API_URL;
    this.headers = {
      'X-N8N-API-KEY': this.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Core API wrapper
  async apiCall(method, endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
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
      console.error(`❌ N8N API Error [${method} ${endpoint}]:`, error.message);
      throw error;
    }
  }

  // === WORKFLOW MANAGEMENT ===
  async listWorkflows(active = null) {
    console.log('📋 Fetching N8N workflows...');
    try {
      const params = active !== null ? `?active=${active}` : '';
      const result = await this.apiCall('GET', `/workflows${params}`);

      console.log(`✅ Found ${result.data?.length || 0} workflows`);
      return {
        success: true,
        workflows: result.data || [],
        count: result.data?.length || 0
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getWorkflow(workflowId) {
    console.log(`📖 Getting workflow: ${workflowId}`);
    try {
      const result = await this.apiCall('GET', `/workflows/${workflowId}`);
      console.log(`✅ Retrieved workflow: ${result.name}`);
      return { success: true, workflow: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createWorkflow(name, nodes, connections = {}) {
    console.log(`🔨 Creating workflow: ${name}`);
    try {
      const workflowData = {
        name,
        nodes,
        connections,
        settings: { executionOrder: "v1" }
      };

      const result = await this.apiCall('POST', '/workflows', workflowData);
      console.log(`✅ Created workflow: ${result.name} (ID: ${result.id})`);
      return { success: true, workflow: result, id: result.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateWorkflow(workflowId, workflowData) {
    console.log(`✏️  Updating workflow: ${workflowId}`);
    try {
      const result = await this.apiCall('PUT', `/workflows/${workflowId}`, workflowData);
      console.log(`✅ Updated workflow: ${result.name}`);
      return { success: true, workflow: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteWorkflow(workflowId) {
    console.log(`🗑️  Deleting workflow: ${workflowId}`);
    try {
      await this.apiCall('DELETE', `/workflows/${workflowId}`);
      console.log(`✅ Deleted workflow: ${workflowId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async activateWorkflow(workflowId) {
    console.log(`▶️  Activating workflow: ${workflowId}`);
    try {
      await this.apiCall('POST', `/workflows/${workflowId}/activate`);
      console.log(`✅ Activated workflow: ${workflowId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deactivateWorkflow(workflowId) {
    console.log(`⏸️  Deactivating workflow: ${workflowId}`);
    try {
      await this.apiCall('POST', `/workflows/${workflowId}/deactivate`);
      console.log(`✅ Deactivated workflow: ${workflowId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // === WORKFLOW EXECUTION ===
  async executeWorkflow(workflowId, inputData = {}) {
    console.log(`🚀 Executing workflow: ${workflowId}`);
    try {
      const result = await this.apiCall('POST', `/workflows/${workflowId}/execute`, inputData);
      console.log(`✅ Executed workflow: ${workflowId} (Execution: ${result.executionId})`);
      return { 
        success: true, 
        executionId: result.executionId, 
        result: result 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getExecutions(workflowId, limit = 10) {
    console.log(`📊 Getting executions for workflow: ${workflowId}`);
    try {
      const result = await this.apiCall('GET', `/executions?workflowId=${workflowId}&limit=${limit}`);
      console.log(`✅ Found ${result.data?.length || 0} executions`);
      return { success: true, executions: result.data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // === WORKFLOW TEMPLATES FOR STAND UP SYDNEY ===
  getEmailMarketingTemplate() {
    return {
      name: "Email Marketing Automation",
      nodes: [
        {
          id: "trigger",
          name: "Schedule Trigger",
          type: "n8n-nodes-base.scheduleTrigger",
          position: [280, 300],
          parameters: {
            rule: { interval: [{ field: "hours", value: 24 }] }
          }
        },
        {
          id: "fetch-events", 
          name: "Fetch Upcoming Events",
          type: "n8n-nodes-base.httpRequest",
          position: [500, 300],
          parameters: {
            method: "GET",
            url: "https://pdikjpfulhhpqpxzpgtu.supabase.co/rest/v1/events?select=*&event_date=gte.now()&active=eq.true",
            sendHeaders: true,
            headerParameters: {
              parameters: [
                { name: "apikey", value: process.env.SUPABASE_ANON_KEY || "YOUR_SUPABASE_KEY" },
                { name: "Authorization", value: `Bearer ${process.env.SUPABASE_ANON_KEY || "YOUR_SUPABASE_KEY"}` }
              ]
            }
          }
        },
        {
          id: "process-events",
          name: "Process Events for Email",
          type: "n8n-nodes-base.code",
          position: [720, 300],
          parameters: {
            jsCode: `
              const events = $input.all()[0].json;
              const upcomingEvents = events.filter(event => {
                const eventDate = new Date(event.event_date);
                const daysUntil = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));
                return daysUntil >= 2 && daysUntil <= 7; // Events 2-7 days away
              });

              return upcomingEvents.map(event => ({
                json: {
                  eventName: event.event_name,
                  eventDate: event.event_date,
                  venue: event.venue_name,
                  ticketLink: event.ticket_link,
                  description: event.description
                }
              }));
            `
          }
        },
        {
          id: "send-email",
          name: "Send Marketing Email",
          type: "n8n-nodes-base.httpRequest", 
          position: [940, 300],
          parameters: {
            method: "POST",
            url: "https://api.brevo.com/v3/emailCampaigns",
            sendHeaders: true,
            headerParameters: {
              parameters: [
                { name: "api-key", value: process.env.BREVO_API_KEY || "YOUR_BREVO_API_KEY" },
                { name: "Content-Type", value: "application/json" }
              ]
            },
            sendBody: true,
            bodyParameters: {
              parameters: [
                { name: "name", value: "=Weekly Comedy Update - {{ $now.format('yyyy-MM-dd') }}" },
                { name: "subject", value: "This Week's Comedy Shows!" },
                { name: "htmlContent", value: "={{ $json.eventName }} at {{ $json.venue }} on {{ $json.eventDate }}" }
              ]
            }
          }
        }
      ],
      connections: {
        "trigger": { main: [[{ node: "fetch-events", type: "main", index: 0 }]] },
        "fetch-events": { main: [[{ node: "process-events", type: "main", index: 0 }]] },
        "process-events": { main: [[{ node: "send-email", type: "main", index: 0 }]] }
      }
    };
  }

  getTicketSalesTemplate() {
    return {
      name: "Ticket Sales Sync",
      nodes: [
        {
          id: "webhook-trigger",
          name: "Humanitix Webhook",
          type: "n8n-nodes-base.webhook",
          position: [280, 300],
          parameters: {
            httpMethod: "POST",
            path: "humanitix-webhook"
          }
        },
        {
          id: "process-sale",
          name: "Process Ticket Sale",
          type: "n8n-nodes-base.code",
          position: [500, 300],
          parameters: {
            jsCode: `
              const webhookData = $input.all()[0].json;
              return [{
                json: {
                  eventId: webhookData.event_id,
                  customerEmail: webhookData.customer.email,
                  ticketQuantity: webhookData.tickets.length,
                  totalAmount: webhookData.total_amount,
                  saleDate: webhookData.created_at,
                  platform: 'Humanitix'
                }
              }];
            `
          }
        },
        {
          id: "update-database",
          name: "Update Supabase",
          type: "n8n-nodes-base.httpRequest",
          position: [720, 300],
          parameters: {
            method: "POST",
            url: "https://pdikjpfulhhpqpxzpgtu.supabase.co/rest/v1/ticket_sales",
            sendHeaders: true,
            headerParameters: {
              parameters: [
                { name: "apikey", value: "YOUR_SUPABASE_KEY" },
                { name: "Authorization", value: "Bearer YOUR_SUPABASE_KEY" },
                { name: "Content-Type", value: "application/json" }
              ]
            },
            sendBody: true,
            jsonBody: "={{ JSON.stringify($json) }}"
          }
        }
      ],
      connections: {
        "webhook-trigger": { main: [[{ node: "process-sale", type: "main", index: 0 }]] },
        "process-sale": { main: [[{ node: "update-database", type: "main", index: 0 }]] }
      }
    };
  }

  // === WORKFLOW BUILDERS ===
  async createFromTemplate(templateName, customizations = {}) {
    console.log(`🎨 Creating workflow from template: ${templateName}`);

    let template;
    switch (templateName.toLowerCase()) {
      case 'email-marketing':
        template = this.getEmailMarketingTemplate();
        break;
      case 'ticket-sales':
        template = this.getTicketSalesTemplate();
        break;
      default:
        return { success: false, error: `Unknown template: ${templateName}` };
    }

    // Apply customizations
    if (customizations.name) {
      template.name = customizations.name;
    }

    return await this.createWorkflow(template.name, template.nodes, template.connections);
  }

  // === BATCH OPERATIONS ===
  async activateAllWorkflows() {
    console.log('🔄 Activating all workflows...');
    const { workflows } = await this.listWorkflows(false); // Get inactive workflows
    const results = [];

    for (const workflow of workflows) {
      const result = await this.activateWorkflow(workflow.id);
      results.push({ id: workflow.id, name: workflow.name, ...result });
    }

    return results;
  }

  async getWorkflowSummary() {
    console.log('📊 Getting workflow summary...');
    const all = await this.listWorkflows();
    const active = await this.listWorkflows(true);
    const inactive = await this.listWorkflows(false);

    if (!all.success || !active.success || !inactive.success) {
      return {
        success: false,
        error: 'Failed to fetch workflow data',
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      total: all.count,
      active: active.count,
      inactive: inactive.count,
      workflows: all.workflows.map(w => ({
        id: w.id,
        name: w.name,
        active: w.active,
        updatedAt: w.updatedAt
      })),
      timestamp: new Date().toISOString()
    };
  }

  // === CLI INTERFACE ===
  async handleCommand(command, args) {
    try {
      switch (command) {
        case 'list':
          return await this.listWorkflows();

        case 'create':
          const [templateName, customName] = args;
          return await this.createFromTemplate(templateName, { name: customName });

        case 'activate':
          const [workflowId] = args;
          return await this.activateWorkflow(workflowId);

        case 'execute':
          const [execWorkflowId] = args;
          return await this.executeWorkflow(execWorkflowId);

        case 'summary':
          return await this.getWorkflowSummary();

        case 'get':
          const [getWorkflowId] = args;
          return await this.getWorkflow(getWorkflowId);

        default:
          console.log('Available commands: list, create <template> [name], activate <id>, execute <id>, get <id>, summary');
          return { success: false, error: 'Unknown command' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// CLI Usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const n8n = new N8NAutomation();
  const [,, command, ...args] = process.argv;

  if (!command) {
    console.log(`
🎭 N8N Automation System - Stand Up Sydney
==========================================

Usage: node n8n-automation.js <command> [args...]

Commands:
  list                    - List all workflows
  create <template> [name] - Create workflow from template
                            Templates: email-marketing, ticket-sales
  activate <id>           - Activate workflow by ID
  execute <id>            - Execute workflow by ID  
  summary                 - Get workflow summary

Examples:
  node n8n-automation.js list
  node n8n-automation.js create email-marketing "Weekly Comedy Newsletter"
  node n8n-automation.js activate 11FV8iywUp7qsdxE
  node n8n-automation.js summary
`);
    process.exit(1);
  }

  n8n.handleCommand(command, args)
    .then(result => {
      if (result.success) {
        console.log('\n✅ Success:', JSON.stringify(result, null, 2));
      } else {
        console.error('\n❌ Error:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Fatal Error:', error.message);
      process.exit(1);
    });
}

export default N8NAutomation;