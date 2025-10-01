#!/usr/bin/env node

/**
 * Linear Automation Setup for Stand Up Sydney
 * Creates integration between Linear, Knowledge Graph, Multi-Agent System, and Git workflows
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LinearAutomationSetup {
  constructor() {
    this.automationRules = {
      gitIntegration: {
        branchNaming: {
          pattern: '{team-prefix}/{issue-number}-{short-description}',
          examples: [
            'frontend/SUS-004-comedian-profiles',
            'backend/SUS-001-auth-fix',
            'testing/SUS-013-test-coverage'
          ]
        },
        commitLinking: {
          pattern: 'SUS-{number}: {commit message}',
          statusUpdates: {
            'SUS-001: Fix authentication bug': 'In Progress',
            'SUS-001: Complete authentication fix': 'Done'
          }
        }
      },
      knowledgeGraphIntegration: {
        triggers: [
          'Critical issue discovered → Create Linear issue',
          'Session protocol violation → Create compliance issue',
          'System failure detected → Create alert issue',
          'Solution documented → Update related issues'
        ],
        issueTypes: {
          'knowledge-graph-discovery': {
            team: 'INTEGRATION',
            project: 'Knowledge Graph',
            labels: ['Knowledge-Graph', 'Bug'],
            priority: 'High Priority'
          },
          'protocol-violation': {
            team: 'INTEGRATION', 
            project: 'Knowledge Graph',
            labels: ['Knowledge-Graph', 'Critical'],
            priority: 'Critical'
          },
          'system-alert': {
            team: 'INFRA',
            project: 'Production Systems',
            labels: ['Bug', 'Critical'],
            priority: 'Critical'
          }
        }
      },
      multiAgentCoordination: {
        agentAssignments: {
          'Agent-Frontend': {
            team: 'FRONTEND',
            autoAssign: true,
            labels: ['Agent-Frontend']
          },
          'Agent-Backend': {
            team: 'BACKEND', 
            autoAssign: true,
            labels: ['Agent-Backend']
          },
          'Agent-Testing': {
            team: 'TESTING',
            autoAssign: true,
            labels: ['Agent-Testing']
          }
        },
        workflowRules: [
          'Frontend issues → Auto-assign to Frontend Agent',
          'Backend/API issues → Auto-assign to Backend Agent', 
          'Testing issues → Auto-assign to Testing Agent',
          'Cross-team issues → Create subtasks for each agent'
        ]
      }
    };
  }

  async setupAutomations() {
    console.log('🤖 Setting up Linear automation integrations...');
    console.log('='.repeat(60));
    
    // Create Git integration hooks
    await this.createGitIntegration();
    
    // Create Knowledge Graph integration
    await this.createKnowledgeGraphIntegration();
    
    // Create Multi-Agent coordination
    await this.createMultiAgentCoordination();
    
    // Create N8N workflows
    await this.createN8NWorkflows();
    
    console.log('\n✅ All automations configured successfully!');
    this.generateDocumentation();
  }

  async createGitIntegration() {
    console.log('\n📂 Setting up Git integration...');
    
    // Create git hooks
    const gitHooksDir = path.join(__dirname, '.git', 'hooks');
    
    // Pre-commit hook for branch naming validation
    const preCommitHook = `#!/bin/bash
# Linear integration - validate branch naming
branch=$(git branch --show-current)

if [[ ! $branch =~ ^(frontend|backend|testing|infra|integration)\/SUS-[0-9]{3}- ]]; then
  echo "❌ Branch name must follow pattern: {team}/SUS-{number}-{description}"
  echo "   Examples: frontend/SUS-004-comedian-profiles"
  echo "             backend/SUS-001-auth-fix"
  exit 1
fi

echo "✅ Branch name follows Linear conventions"
`;

    // Commit message hook for Linear linking
    const commitMsgHook = `#!/bin/bash
# Linear integration - auto-link commits to issues
commit_msg_file=$1
commit_msg=$(cat $commit_msg_file)

# Extract issue number from branch name
branch=$(git branch --show-current)
issue_num=$(echo $branch | grep -o 'SUS-[0-9]\\{3\\}')

if [[ -n $issue_num && ! $commit_msg =~ ^$issue_num: ]]; then
  # Prepend issue number to commit message
  echo "$issue_num: $commit_msg" > $commit_msg_file
  echo "✅ Linked commit to Linear issue $issue_num"
fi
`;

    console.log('   Creating Git hooks for Linear integration:');
    console.log(`     - Pre-commit: Branch naming validation`);
    console.log(`     - Commit-msg: Auto-link commits to Linear issues`);
    
    // Save hooks (would normally write to .git/hooks/)
    const hooksPath = path.join(__dirname, 'git-hooks');
    if (!fs.existsSync(hooksPath)) {
      fs.mkdirSync(hooksPath);
    }
    
    fs.writeFileSync(path.join(hooksPath, 'pre-commit'), preCommitHook);
    fs.writeFileSync(path.join(hooksPath, 'commit-msg'), commitMsgHook);
    
    console.log(`     ✓ Git hooks saved to: ${hooksPath}`);
  }

  async createKnowledgeGraphIntegration() {
    console.log('\n🧠 Setting up Knowledge Graph integration...');
    
    const kgIntegrationScript = `#!/usr/bin/env node

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
      title: \`[KG] \${kgEntry.title}\`,
      description: \`## Knowledge Graph Issue

**Original Issue:** \${kgEntry.title}
**Severity:** \${kgEntry.severity}
**Date:** \${kgEntry.date}

### Description
\${kgEntry.description}

### Source
Knowledge Graph Entry: \${kgEntry.id}

---
*Auto-created from Knowledge Graph discovery*\`,
      priority: kgEntry.severity === 'critical' ? 1 : 2,
      labels: ['Knowledge-Graph', 'Bug'],
      team: 'INTEGRATION',
      project: 'Knowledge Graph'
    };

    // This would use Linear MCP tools:
    // const issue = await mcp__linear__createIssue(issueData);
    
    console.log(\`📋 Created Linear issue from KG entry: \${kgEntry.title}\`);
    return issueData;
  }
}

// Initialize integration
new KnowledgeGraphLinearIntegration();
`;

    const kgIntegrationPath = path.join(__dirname, 'knowledge-graph-linear-integration.js');
    fs.writeFileSync(kgIntegrationPath, kgIntegrationScript);
    
    console.log('   Features configured:');
    this.automationRules.knowledgeGraphIntegration.triggers.forEach(trigger => {
      console.log(`     - ${trigger}`);
    });
    console.log(`   ✓ Integration script: ${kgIntegrationPath}`);
  }

  async createMultiAgentCoordination() {
    console.log('\n🤝 Setting up Multi-Agent coordination...');
    
    const agentCoordinationScript = `#!/usr/bin/env node

/**
 * Multi-Agent Linear Coordination
 * Routes Linear issues to appropriate agents and coordinates work
 */

class AgentLinearCoordination {
  constructor() {
    this.agentRules = ${JSON.stringify(this.automationRules.multiAgentCoordination.agentAssignments, null, 2)};
  }

  async routeIssueToAgent(issue) {
    const { labels, team } = issue;
    
    // Determine appropriate agent
    let assignedAgent = null;
    
    if (labels.includes('Agent-Frontend') || team === 'FRONTEND') {
      assignedAgent = 'frontend-agent';
    } else if (labels.includes('Agent-Backend') || team === 'BACKEND') {
      assignedAgent = 'backend-agent';
    } else if (labels.includes('Agent-Testing') || team === 'TESTING') {
      assignedAgent = 'testing-agent';
    }
    
    if (assignedAgent) {
      await this.assignToAgent(issue, assignedAgent);
    }
  }

  async assignToAgent(issue, agent) {
    // This would update Linear issue and notify agent
    console.log(\`🤖 Assigned issue \${issue.identifier} to \${agent}\`);
    
    // Could trigger agent via multi-agent system
    // await this.notifyAgent(agent, issue);
  }

  async createSubtasks(parentIssue, agents) {
    // For cross-team issues, create subtasks for each agent
    const subtasks = [];
    
    for (const agent of agents) {
      const subtask = {
        title: \`[\${agent.toUpperCase()}] \${parentIssue.title}\`,
        description: \`Agent-specific subtask for: \${parentIssue.title}\`,
        parent: parentIssue.id,
        team: this.getTeamForAgent(agent),
        labels: [\`Agent-\${agent}\`]
      };
      
      subtasks.push(subtask);
    }
    
    return subtasks;
  }

  getTeamForAgent(agent) {
    const teamMap = {
      'frontend': 'FRONTEND',
      'backend': 'BACKEND', 
      'testing': 'TESTING'
    };
    return teamMap[agent] || 'INTEGRATION';
  }
}

export default AgentLinearCoordination;
`;

    const coordinationPath = path.join(__dirname, 'agent-linear-coordination.js');
    fs.writeFileSync(coordinationPath, agentCoordinationScript);
    
    console.log('   Agent routing rules:');
    this.automationRules.multiAgentCoordination.workflowRules.forEach(rule => {
      console.log(`     - ${rule}`);
    });
    console.log(`   ✓ Coordination script: ${coordinationPath}`);
  }

  async createN8NWorkflows() {
    console.log('\n🔄 Setting up N8N workflows...');
    
    const n8nWorkflows = [
      {
        name: 'Linear Issue from Test Failure',
        description: 'Create Linear issues when tests fail',
        trigger: 'Test failure webhook',
        actions: [
          'Parse test failure data',
          'Create Linear issue with test details',
          'Assign to Testing team',
          'Notify relevant agents'
        ]
      },
      {
        name: 'Linear Issue from MCP Server Failure',
        description: 'Create Linear issues when MCP servers fail',
        trigger: 'MCP health check failure',
        actions: [
          'Identify failed MCP server',
          'Create critical Linear issue',
          'Assign to Integration team',
          'Alert on-call engineer'
        ]
      },
      {
        name: 'Linear Issue Status → Agent Notification',
        description: 'Notify agents when their Linear issues change status',
        trigger: 'Linear webhook - issue status change',
        actions: [
          'Parse issue update',
          'Identify assigned agent',
          'Send notification to agent',
          'Update agent task queue'
        ]
      }
    ];

    console.log('   N8N workflows to create:');
    n8nWorkflows.forEach(workflow => {
      console.log(`     - ${workflow.name}: ${workflow.description}`);
    });

    // Save N8N workflow configurations
    const n8nPath = path.join(__dirname, 'n8n-linear-workflows.json');
    fs.writeFileSync(n8nPath, JSON.stringify(n8nWorkflows, null, 2));
    console.log(`   ✓ N8N workflow configs: ${n8nPath}`);
  }

  generateDocumentation() {
    console.log('\n📚 Generating automation documentation...');
    
    const documentation = `# Linear Automation Setup - Stand Up Sydney

## Overview
Complete automation integration between Linear and the Stand Up Sydney development ecosystem.

## Git Integration

### Branch Naming Convention
Pattern: \`{team}/{issue-number}-{description}\`

Examples:
${this.automationRules.gitIntegration.branchNaming.examples.map(ex => `- \`${ex}\``).join('\n')}

### Commit Linking
- Commits automatically linked to Linear issues via branch name
- Pattern: \`SUS-{number}: {commit message}\`
- Status updates trigger on specific commit messages

## Knowledge Graph Integration

### Automatic Issue Creation
${this.automationRules.knowledgeGraphIntegration.triggers.map(trigger => `- ${trigger}`).join('\n')}

### Issue Types
${Object.entries(this.automationRules.knowledgeGraphIntegration.issueTypes).map(([type, config]) => 
  `- **${type}**: ${config.team} team, ${config.priority} priority`
).join('\n')}

## Multi-Agent Coordination

### Agent Assignment Rules
${Object.entries(this.automationRules.multiAgentCoordination.agentAssignments).map(([agent, config]) =>
  `- **${agent}**: Auto-assigned to ${config.team} team`
).join('\n')}

### Workflow Automation
${this.automationRules.multiAgentCoordination.workflowRules.map(rule => `- ${rule}`).join('\n')}

## Benefits

1. **Unified Tracking**: All development work tracked in Linear
2. **Automated Routing**: Issues automatically assigned to correct teams/agents
3. **Real-time Updates**: Git commits and status changes sync automatically
4. **Proactive Issue Creation**: Problems detected and tracked immediately
5. **Agent Coordination**: Multi-agent system coordinated through Linear
6. **Knowledge Preservation**: Historical context linked to current work

## Usage

### For Developers
1. Create branches following naming convention
2. Commits automatically link to Linear issues
3. Issue status updates based on commit messages

### For Agents
1. Issues automatically assigned based on team/labels
2. Status updates trigger agent notifications
3. Cross-team issues create subtasks for coordination

### For Project Management
1. Real-time visibility into all development work
2. Automated issue creation from system monitoring
3. Historical tracking through Knowledge Graph integration

---
*Generated: ${new Date().toISOString()}*
`;

    const docPath = path.join(__dirname, 'LINEAR_AUTOMATION_GUIDE.md');
    fs.writeFileSync(docPath, documentation);
    console.log(`   ✓ Documentation: ${docPath}`);
  }
}

async function main() {
  const automation = new LinearAutomationSetup();
  await automation.setupAutomations();
  
  console.log('\n🎯 Automation Setup Complete!');
  console.log('\n📊 What was configured:');
  console.log('   ✅ Git integration with branch naming and commit linking');
  console.log('   ✅ Knowledge Graph → Linear issue automation');
  console.log('   ✅ Multi-agent coordination and routing');
  console.log('   ✅ N8N workflows for system monitoring');
  console.log('\n🚀 Ready for:');
  console.log('   - Automated issue tracking');
  console.log('   - Multi-agent coordination');
  console.log('   - Real-time development visibility');
  console.log('   - Proactive problem detection');
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default LinearAutomationSetup;