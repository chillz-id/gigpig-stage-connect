#!/usr/bin/env node

/**
 * Real-time Agent Synchronization
 * Shares knowledge between agents without merging code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chokidar = require('chokidar');

class AgentSync {
  constructor() {
    this.agents = {
      frontend: {
        branch: 'feature/frontend-*',
        watchPaths: ['src/components', 'src/pages'],
        outputChannel: '.agent-comms/frontend-updates'
      },
      backend: {
        branch: 'feature/backend-*',
        watchPaths: ['src/hooks', 'src/api'],
        outputChannel: '.agent-comms/backend-updates'
      },
      testing: {
        branch: 'feature/tests-*',
        watchPaths: ['tests', 'src/**/__tests__'],
        outputChannel: '.agent-comms/test-reports'
      }
    };
  }

  // Extract TypeScript interfaces from changed files
  extractInterfaces(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const interfaceRegex = /export\s+interface\s+(\w+)\s*{[^}]+}/g;
      const typeRegex = /export\s+type\s+(\w+)\s*=\s*[^;]+;/g;
      
      const interfaces = [];
      let match;
      
      while ((match = interfaceRegex.exec(content)) !== null) {
        interfaces.push(match[0]);
      }
      
      while ((match = typeRegex.exec(content)) !== null) {
        interfaces.push(match[0]);
      }
      
      return interfaces;
    } catch (error) {
      return [];
    }
  }

  // Get current git branch
  getCurrentBranch() {
    try {
      return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  // Determine which agent is active
  getActiveAgent() {
    const branch = this.getCurrentBranch();
    
    if (branch.includes('frontend')) return 'frontend';
    if (branch.includes('backend')) return 'backend';
    if (branch.includes('test')) return 'testing';
    
    return null;
  }

  // Post update to communication channel
  postUpdate(agent, changeType, filePath, details = {}) {
    const timestamp = new Date().toISOString();
    const updateFile = path.join(
      this.agents[agent].outputChannel,
      `${timestamp.split('T')[0]}-updates.md`
    );

    const currentContent = fs.existsSync(updateFile) 
      ? fs.readFileSync(updateFile, 'utf-8') 
      : `# ${agent.toUpperCase()} Updates - ${timestamp.split('T')[0]}\n\n`;

    const update = `
## Update at ${timestamp.split('T')[1].split('.')[0]}

**Change Type**: ${changeType}
**File**: ${filePath}
**Branch**: ${this.getCurrentBranch()}

${details.description || ''}

${details.interfaces?.length ? '### New/Modified Interfaces:\n```typescript\n' + details.interfaces.join('\n\n') + '\n```' : ''}

${details.impact ? '### Impact on other agents:\n' + details.impact : ''}

---
`;

    fs.writeFileSync(updateFile, currentContent + update);
    console.log(`✅ Posted ${changeType} update for ${agent}`);
  }

  // Watch for changes and sync
  startWatching() {
    const agent = this.getActiveAgent();
    if (!agent) {
      console.log('⚠️  Not on an agent branch, watching all paths...');
      return;
    }

    console.log(`👁️  Watching as ${agent.toUpperCase()} agent...`);

    const watcher = chokidar.watch(this.agents[agent].watchPaths, {
      ignored: /(^|[\/\\])\../,
      persistent: true
    });

    watcher
      .on('add', path => this.handleFileChange('added', path, agent))
      .on('change', path => this.handleFileChange('modified', path, agent))
      .on('unlink', path => this.handleFileChange('deleted', path, agent));
  }

  // Handle file changes
  handleFileChange(changeType, filePath, agent) {
    console.log(`📝 ${changeType}: ${filePath}`);

    const details = {
      description: `File ${changeType}`,
      interfaces: this.extractInterfaces(filePath),
      impact: this.analyzeImpact(filePath, changeType)
    };

    this.postUpdate(agent, changeType, filePath, details);
    
    // Copy shared types to common location
    if (details.interfaces.length > 0) {
      this.updateSharedTypes(filePath, details.interfaces);
    }
  }

  // Analyze impact on other agents
  analyzeImpact(filePath, changeType) {
    const impacts = [];

    // Frontend changes
    if (filePath.includes('components/ui')) {
      impacts.push('- Frontend: UI component modified, check for usage');
    }
    
    // API changes
    if (filePath.includes('hooks/') || filePath.includes('api/')) {
      impacts.push('- Frontend: API interface may have changed');
      impacts.push('- Testing: New endpoints need test coverage');
    }

    // Type changes
    if (filePath.includes('types/')) {
      impacts.push('- All agents: Shared types modified');
    }

    return impacts.join('\n');
  }

  // Update shared types directory
  updateSharedTypes(filePath, interfaces) {
    if (interfaces.length === 0) return;

    const fileName = path.basename(filePath, '.ts') + '.shared.ts';
    const sharedPath = path.join('.agent-comms/shared-types', fileName);

    const content = `// Auto-extracted from ${filePath}
// Last updated: ${new Date().toISOString()}

${interfaces.join('\n\n')}
`;

    fs.writeFileSync(sharedPath, content);
    console.log(`🤝 Updated shared types: ${fileName}`);
  }

  // Check for updates from other agents
  checkForUpdates() {
    const agent = this.getActiveAgent();
    if (!agent) return;

    console.log('\n📥 Checking for updates from other agents...\n');

    Object.entries(this.agents).forEach(([name, config]) => {
      if (name === agent) return;

      const updateDir = config.outputChannel;
      const today = new Date().toISOString().split('T')[0];
      const updateFile = path.join(updateDir, `${today}-updates.md`);

      if (fs.existsSync(updateFile)) {
        const content = fs.readFileSync(updateFile, 'utf-8');
        const lines = content.split('\n');
        const recentUpdates = lines.slice(-20).join('\n');
        
        if (recentUpdates.trim()) {
          console.log(`📨 Updates from ${name.toUpperCase()}:`);
          console.log(recentUpdates);
          console.log('\n---\n');
        }
      }
    });
  }
}

// Run the sync
const sync = new AgentSync();

// Check for updates on start
sync.checkForUpdates();

// Start watching
sync.startWatching();

// Check for updates every 5 minutes
setInterval(() => {
  sync.checkForUpdates();
}, 5 * 60 * 1000);

console.log('🚀 Agent sync running... Press Ctrl+C to stop');