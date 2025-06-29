// MCP Server integration for Claude Code + n8n
const express = require('express');
const { Anthropic } = require('@anthropic-ai/sdk');

class MCPClaudeCodeIntegration {
  constructor() {
    this.app = express();
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    this.setupRoutes();
  }

  setupRoutes() {
    // Endpoint for n8n to trigger Claude Code analysis
    this.app.post('/analyze-code', async (req, res) => {
      try {
        const { code, repoPath, operation } = req.body;
        
        const result = await this.performClaudeCodeOperation(operation, {
          code,
          repoPath
        });
        
        res.json({
          success: true,
          result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Endpoint for GitHub webhooks to trigger analysis
    this.app.post('/github-webhook', async (req, res) => {
      const { action, pull_request, repository } = req.body;
      
      if (action === 'opened' || action === 'synchronize') {
        // Trigger n8n workflow for PR analysis
        await this.triggerN8NWorkflow('pr-analysis', {
          prUrl: pull_request.html_url,
          repoName: repository.full_name,
          changes: pull_request.diff_url
        });
      }
      
      res.json({ received: true });
    });
  }

  async performClaudeCodeOperation(operation, data) {
    const prompts = {
      analyze: `Analyze this code for optimization opportunities:\n\n${data.code}\n\nRepository: ${data.repoPath}`,
      review: `Review this code change for potential issues:\n\n${data.code}`,
      optimize: `Suggest performance optimizations for:\n\n${data.code}`,
      debug: `Help debug this code:\n\n${data.code}`
    };

    const response = await this.anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: prompts[operation] || prompts.analyze
      }]
    });

    return response.content[0].text;
  }

  async triggerN8NWorkflow(workflowName, data) {
    // Trigger n8n workflow via webhook
    const webhookUrl = `${process.env.N8N_URL}/webhook/${workflowName}`;
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to trigger n8n workflow:', error);
      throw error;
    }
  }

  start(port = 3001) {
    this.app.listen(port, () => {
      console.log(`MCP Claude Code Integration running on port ${port}`);
    });
  }
}

// Usage
const integration = new MCPClaudeCodeIntegration();
integration.start();

module.exports = { MCPClaudeCodeIntegration };