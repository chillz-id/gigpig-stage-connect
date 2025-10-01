#!/usr/bin/env node

/**
 * Linear Webhook Handler for Knowledge Graph Synchronization
 * Captures Linear issue status changes and syncs them back to the Knowledge Graph
 * 
 * Webhook Events Handled:
 * - Issue Created
 * - Issue Updated (status changes)
 * - Issue Deleted
 * - Comment Added
 * 
 * Architecture:
 * - Express server listening for Linear webhooks
 * - Validates webhook signatures for security
 * - Updates Knowledge Graph entries when Linear issues change
 * - Maintains cross-references between Linear and KG
 */

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class LinearWebhookHandler {
  constructor() {
    this.app = express();
    this.port = process.env.LINEAR_WEBHOOK_PORT || 3030;
    this.webhookSecret = process.env.LINEAR_WEBHOOK_SECRET || 'your-webhook-secret';
    
    // Paths
    this.knowledgeEntriesDir = '/root/agents/knowledge-graph-entries';
    this.crossRefDir = '/root/agents/knowledge-graph-cross-references';
    this.webhookLogDir = '/root/agents/webhook-logs';
    
    this.setupMiddleware();
    this.setupRoutes();
    this.ensureDirectories();
  }
  
  ensureDirectories() {
    [this.knowledgeEntriesDir, this.crossRefDir, this.webhookLogDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  setupMiddleware() {
    // Raw body parser for webhook signature verification
    this.app.use('/webhook', express.raw({ type: 'application/json' }));
    this.app.use(express.json());
  }
  
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'Linear Webhook Handler'
      });
    });
    
    // Main webhook endpoint
    this.app.post('/webhook', (req, res) => {
      this.handleWebhook(req, res);
    });
    
    // Debug endpoint to list recent webhooks
    this.app.get('/webhooks/recent', (req, res) => {
      this.getRecentWebhooks(req, res);
    });
  }
  
  /**
   * Handle incoming Linear webhook
   */
  async handleWebhook(req, res) {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(req)) {
        console.warn('⚠️  Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      
      const payload = JSON.parse(req.body.toString());
      const eventType = payload.type;
      
      console.log(`📨 Received Linear webhook: ${eventType}`);
      
      // Log webhook for debugging
      this.logWebhook(payload);
      
      // Handle different event types
      switch (eventType) {
        case 'Issue':
          await this.handleIssueEvent(payload);
          break;
        case 'IssueUpdate':
          await this.handleIssueUpdate(payload);
          break;
        case 'Comment':
          await this.handleCommentEvent(payload);
          break;
        default:
          console.log(`📋 Unhandled event type: ${eventType}`);
      }
      
      res.status(200).json({ received: true });
      
    } catch (error) {
      console.error('❌ Error handling webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Verify webhook signature for security
   */
  verifyWebhookSignature(req) {
    try {
      const signature = req.headers['linear-signature'];
      if (!signature) return false;
      
      const body = req.body;
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(body)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }
  
  /**
   * Handle Issue creation events
   */
  async handleIssueEvent(payload) {
    try {
      const issue = payload.data;
      console.log(`📋 Issue event: ${issue.identifier} - ${issue.title}`);
      
      // Check if this is a KG-created issue
      if (issue.title && issue.title.startsWith('[KG]')) {
        console.log('🔄 Skipping KG-created issue to prevent loops');
        return;
      }
      
      // Create corresponding KG entry for externally created issues
      await this.createKGEntryFromLinear(issue);
      
    } catch (error) {
      console.error('❌ Error handling issue event:', error);
    }
  }
  
  /**
   * Handle Issue update events (most important for status sync)
   */
  async handleIssueUpdate(payload) {
    try {
      const issue = payload.data;
      const updatedAt = payload.updatedAt;
      
      console.log(`🔄 Issue update: ${issue.identifier} - Status: ${issue.state?.name}`);
      
      // Find corresponding KG entry
      const kgEntry = await this.findKGEntryByLinearId(issue.identifier);
      
      if (kgEntry) {
        // Update KG entry with Linear status
        await this.syncLinearStatusToKG(issue, kgEntry);
      } else {
        // Create KG entry if it doesn't exist
        await this.createKGEntryFromLinear(issue);
      }
      
    } catch (error) {
      console.error('❌ Error handling issue update:', error);
    }
  }
  
  /**
   * Handle Comment events
   */
  async handleCommentEvent(payload) {
    try {
      const comment = payload.data;
      const issue = comment.issue;
      
      console.log(`💬 Comment on ${issue.identifier}: ${comment.body.substring(0, 50)}...`);
      
      // Find corresponding KG entry
      const kgEntry = await this.findKGEntryByLinearId(issue.identifier);
      
      if (kgEntry) {
        // Add comment to KG entry
        await this.addCommentToKGEntry(kgEntry, comment);
      }
      
    } catch (error) {
      console.error('❌ Error handling comment event:', error);
    }
  }
  
  /**
   * Create KG entry from Linear issue
   */
  async createKGEntryFromLinear(linearIssue) {
    try {
      const kgId = `linear-sync-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const timestamp = new Date().toISOString();
      
      // Map Linear priority to KG severity
      const severityMap = {
        1: 'critical', // Urgent
        2: 'high',     // High
        3: 'medium',   // Medium
        4: 'low'       // Low
      };
      
      const kgEntry = {
        id: kgId,
        type: 'issue',
        severity: severityMap[linearIssue.priority] || 'medium',
        title: linearIssue.title,
        description: linearIssue.description || 'No description provided',
        date: timestamp.split('T')[0],
        timestamp: timestamp,
        status: this.mapLinearStatusToKG(linearIssue.state?.name),
        investigation_time: null,
        solution: null,
        related_files: [],
        tags: this.extractTags(linearIssue.title + ' ' + (linearIssue.description || '')),
        linear_issue_id: linearIssue.identifier,
        linear_issue_url: linearIssue.url,
        sync_source: 'linear_webhook',
        cross_references: []
      };
      
      // Save KG entry
      const filename = `${kgId}.json`;
      const filepath = path.join(this.knowledgeEntriesDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(kgEntry, null, 2));
      
      // Create cross-reference
      this.createCrossReference(kgId, linearIssue.id, 'linear-to-kg');
      
      console.log(`✅ Created KG entry from Linear: ${kgId}`);
      return kgEntry;
      
    } catch (error) {
      console.error('❌ Error creating KG entry from Linear:', error);
      return null;
    }
  }
  
  /**
   * Find KG entry by Linear issue ID
   */
  async findKGEntryByLinearId(linearIdentifier) {
    try {
      if (!fs.existsSync(this.knowledgeEntriesDir)) return null;
      
      const entries = fs.readdirSync(this.knowledgeEntriesDir)
        .filter(f => f.endsWith('.json'))
        .map(f => {
          try {
            const content = fs.readFileSync(path.join(this.knowledgeEntriesDir, f), 'utf8');
            const data = JSON.parse(content);
            return { filename: f, data };
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      
      const matchingEntry = entries.find(e => 
        e.data.linear_issue_id === linearIdentifier
      );
      
      return matchingEntry || null;
    } catch (error) {
      console.error('❌ Error finding KG entry:', error);
      return null;
    }
  }
  
  /**
   * Sync Linear status to KG entry
   */
  async syncLinearStatusToKG(linearIssue, kgEntry) {
    try {
      const originalData = kgEntry.data;
      const newStatus = this.mapLinearStatusToKG(linearIssue.state?.name);
      
      // Update KG entry
      originalData.status = newStatus;
      originalData.last_sync = new Date().toISOString();
      originalData.linear_status = linearIssue.state?.name;
      
      // If issue is marked as Done in Linear, mark as resolved in KG
      if (linearIssue.state?.name === 'Done' && !originalData.solution) {
        originalData.solution = {
          description: 'Marked as completed in Linear',
          successful: true,
          timestamp: new Date().toISOString(),
          status: 'resolved',
          source: 'linear_webhook'
        };
      }
      
      // Save updated KG entry
      const filepath = path.join(this.knowledgeEntriesDir, kgEntry.filename);
      fs.writeFileSync(filepath, JSON.stringify(originalData, null, 2));
      
      console.log(`🔄 Synced Linear status to KG: ${originalData.id} -> ${newStatus}`);
      return originalData;
      
    } catch (error) {
      console.error('❌ Error syncing Linear status to KG:', error);
      return null;
    }
  }
  
  /**
   * Add comment to KG entry
   */
  async addCommentToKGEntry(kgEntry, comment) {
    try {
      const originalData = kgEntry.data;
      
      // Initialize comments array if it doesn't exist
      if (!originalData.comments) {
        originalData.comments = [];
      }
      
      // Add comment
      originalData.comments.push({
        id: comment.id,
        body: comment.body,
        author: comment.user?.name || 'Unknown',
        timestamp: comment.createdAt,
        source: 'linear_webhook'
      });
      
      // Keep only last 10 comments to prevent file bloat
      if (originalData.comments.length > 10) {
        originalData.comments = originalData.comments.slice(-10);
      }
      
      // Save updated KG entry
      const filepath = path.join(this.knowledgeEntriesDir, kgEntry.filename);
      fs.writeFileSync(filepath, JSON.stringify(originalData, null, 2));
      
      console.log(`💬 Added comment to KG entry: ${originalData.id}`);
      return originalData;
      
    } catch (error) {
      console.error('❌ Error adding comment to KG:', error);
      return null;
    }
  }
  
  /**
   * Map Linear status to KG status
   */
  mapLinearStatusToKG(linearStatus) {
    const statusMap = {
      'Done': 'resolved',
      'In Progress': 'investigating',
      'Todo': 'open',
      'Backlog': 'open',
      'Canceled': 'closed',
      'Duplicate': 'closed'
    };
    
    return statusMap[linearStatus] || 'open';
  }
  
  /**
   * Create cross-reference entry
   */
  createCrossReference(kgId, linearId, type) {
    try {
      const crossRef = {
        id: `webhook-crossref-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        type: type,
        kg_entry_id: kgId,
        linear_issue_id: linearId,
        created_at: new Date().toISOString(),
        synchronized: true,
        source: 'webhook'
      };
      
      const filename = `${crossRef.id}.json`;
      const filepath = path.join(this.crossRefDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(crossRef, null, 2));
      
      return crossRef;
    } catch (error) {
      console.warn('⚠️  Could not create cross-reference:', error.message);
      return null;
    }
  }
  
  /**
   * Extract tags from text
   */
  extractTags(text) {
    const commonTags = [
      'mcp', 'authentication', 'database', 'github', 'api', 'error', 
      'fix', 'integration', 'security', 'credentials', 'linear', 
      'duplicate', 'refactor', 'bug', 'feature', 'performance'
    ];
    const textLower = text.toLowerCase();
    return commonTags.filter(tag => textLower.includes(tag));
  }
  
  /**
   * Log webhook for debugging
   */
  logWebhook(payload) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: payload.type,
        action: payload.action,
        data: {
          id: payload.data?.id,
          identifier: payload.data?.identifier,
          title: payload.data?.title,
          status: payload.data?.state?.name
        },
        processed: true
      };
      
      const filename = `webhook-${Date.now()}.json`;
      const filepath = path.join(this.webhookLogDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(logEntry, null, 2));
      
      // Clean up old logs (keep only last 100)
      this.cleanupWebhookLogs();
      
    } catch (error) {
      console.warn('⚠️  Could not log webhook:', error.message);
    }
  }
  
  /**
   * Clean up old webhook logs
   */
  cleanupWebhookLogs() {
    try {
      const logs = fs.readdirSync(this.webhookLogDir)
        .filter(f => f.startsWith('webhook-') && f.endsWith('.json'))
        .map(f => ({
          filename: f,
          path: path.join(this.webhookLogDir, f),
          mtime: fs.statSync(path.join(this.webhookLogDir, f)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);
      
      // Remove logs beyond the last 100
      logs.slice(100).forEach(log => {
        fs.unlinkSync(log.path);
      });
      
    } catch (error) {
      console.warn('⚠️  Could not cleanup webhook logs:', error.message);
    }
  }
  
  /**
   * Get recent webhooks for debugging
   */
  getRecentWebhooks(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      if (!fs.existsSync(this.webhookLogDir)) {
        return res.json([]);
      }
      
      const logs = fs.readdirSync(this.webhookLogDir)
        .filter(f => f.startsWith('webhook-') && f.endsWith('.json'))
        .map(f => {
          const content = fs.readFileSync(path.join(this.webhookLogDir, f), 'utf8');
          return JSON.parse(content);
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
      
      res.json(logs);
      
    } catch (error) {
      console.error('❌ Error getting recent webhooks:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Start the webhook server
   */
  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Linear Webhook Handler started on port ${this.port}`);
      console.log(`📍 Webhook endpoint: http://localhost:${this.port}/webhook`);
      console.log(`💊 Health check: http://localhost:${this.port}/health`);
      console.log(`🔍 Recent webhooks: http://localhost:${this.port}/webhooks/recent`);
    });
  }
  
  /**
   * Stop the webhook server
   */
  stop() {
    console.log('🛑 Stopping Linear Webhook Handler...');
    process.exit(0);
  }
}

// CLI Interface
if (require.main === module) {
  const handler = new LinearWebhookHandler();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => handler.stop());
  process.on('SIGTERM', () => handler.stop());
  
  // Start server
  handler.start();
  
  console.log('\n📋 Linear Webhook Handler Configuration:');
  console.log(`   Port: ${handler.port}`);
  console.log(`   Knowledge Graph Dir: ${handler.knowledgeEntriesDir}`);
  console.log(`   Cross References Dir: ${handler.crossRefDir}`);
  console.log(`   Webhook Logs Dir: ${handler.webhookLogDir}`);
  console.log('\n🔧 Setup Instructions:');
  console.log('   1. Configure Linear webhook to point to this server');
  console.log('   2. Set LINEAR_WEBHOOK_SECRET environment variable');
  console.log('   3. Ensure server is accessible from Linear (use ngrok for local development)');
  console.log('\n✅ Ready to receive Linear webhooks!');
}

module.exports = LinearWebhookHandler;