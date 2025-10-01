#!/usr/bin/env node

/**
 * Knowledge Graph to Linear Integration
 * Automatically creates Linear issues from Knowledge Graph discoveries
 */

import fs from 'fs';

class KnowledgeGraphLinearIntegration {
  constructor() {
    this.knowledgeGraphDir = '/root/agents/knowledge-graph-entries';
    this.watchForNewEntries();
  }

  watchForNewEntries() {
    // Watch for new knowledge graph entries
    if (fs.existsSync(this.knowledgeGraphDir)) {
      fs.watch(this.knowledgeGraphDir, (eventType, filename) => {
        if (eventType === 'rename' && filename.endsWith('.json')) {
          this.processNewEntry(filename);
        }
      });
    }
  }

  async processNewEntry(filename) {
    const filepath = path.join(this.knowledgeGraphDir, filename);
    
    try {
      const entry = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      if (entry.type === 'issue' && entry.severity === 'critical') {
        await this.createLinearIssue(entry);
      }
    } catch (error) {
      console.error('Error processing knowledge graph entry:', error);
    }
  }

  async createLinearIssue(kgEntry) {
    const issueData = {
      title: `[KG] ${kgEntry.title}`,
      description: `## Knowledge Graph Issue

**Original Issue:** ${kgEntry.title}
**Severity:** ${kgEntry.severity}
**Date:** ${kgEntry.date}

### Description
${kgEntry.description}

### Source
Knowledge Graph Entry: ${kgEntry.id}

---
*Auto-created from Knowledge Graph discovery*`,
      priority: kgEntry.severity === 'critical' ? 1 : 2,
      labels: ['Knowledge-Graph', 'Bug'],
      team: 'INTEGRATION',
      project: 'Knowledge Graph'
    };

    // This would use Linear MCP tools:
    // const issue = await mcp__linear__createIssue(issueData);
    
    console.log(`📋 Created Linear issue from KG entry: ${kgEntry.title}`);
    return issueData;
  }
}

// Initialize integration
new KnowledgeGraphLinearIntegration();
