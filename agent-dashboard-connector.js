#!/usr/bin/env node

/**
 * Agent Dashboard Connector
 * Bridges the thoughtful agents with the cyberpunk dashboard
 */

const fs = require('fs');
const path = require('path');

class AgentDashboardConnector {
  constructor() {
    this.statusDir = '.agent-comms';
    this.agents = ['frontend', 'backend', 'testing'];
  }

  getAgentStatus() {
    const status = {};
    
    this.agents.forEach(agent => {
      const statusFile = path.join(this.statusDir, `${agent}.status`);
      const metricsFile = path.join(this.statusDir, `${agent}.metrics`);
      const tasksFile = path.join(this.statusDir, `${agent}.tasks`);
      
      // Default state
      status[agent] = {
        name: this.getAgentName(agent),
        status: 'IDLE',
        cpu: 5 + Math.random() * 10,
        ram: 10 + Math.random() * 15,
        tasks: 0,
        currentTask: null,
        lastActivity: new Date().toISOString()
      };
      
      // Read actual status if available
      if (fs.existsSync(statusFile)) {
        try {
          const data = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
          status[agent] = { ...status[agent], ...data };
        } catch (e) {
          console.error(`Error reading ${agent} status:`, e);
        }
      }
      
      // Read metrics if available
      if (fs.existsSync(metricsFile)) {
        try {
          const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
          status[agent].tasks = metrics.tasksCompleted || 0;
        } catch (e) {
          // Ignore
        }
      }
      
      // Read task counter (legacy format)
      if (fs.existsSync(tasksFile)) {
        try {
          const count = parseInt(fs.readFileSync(tasksFile, 'utf8'));
          if (!isNaN(count)) status[agent].tasks = count;
        } catch (e) {
          // Ignore
        }
      }
    });
    
    return status;
  }

  getAgentName(type) {
    const names = {
      frontend: 'NETRUNNER_01',
      backend: 'DAEMON_02',
      testing: 'GIGACHAD_420'
    };
    return names[type] || 'UNKNOWN';
  }

  updateDashboardStatus() {
    // Write a consolidated status file for the dashboard
    const status = this.getAgentStatus();
    const dashboardFile = path.join(this.statusDir, 'dashboard-status.json');
    
    fs.writeFileSync(dashboardFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      agents: status,
      system: {
        totalTasks: Object.values(status).reduce((sum, agent) => sum + agent.tasks, 0),
        activeTasks: Object.values(status).filter(agent => agent.status === 'BUSY').length,
        uptime: process.uptime()
      }
    }, null, 2));
  }

  getTaskHistory() {
    const taskDir = path.join(this.statusDir, 'task-queue');
    const history = [];
    
    if (!fs.existsSync(taskDir)) return history;
    
    const files = fs.readdirSync(taskDir);
    const completedFiles = files.filter(f => f.includes('.completed'));
    
    completedFiles.forEach(file => {
      try {
        const content = fs.readFileSync(path.join(taskDir, file), 'utf8');
        const agent = file.split('-')[0];
        const timestamp = fs.statSync(path.join(taskDir, file)).mtime;
        
        // Extract key information
        const directiveMatch = content.match(/## DIRECTIVE\n(.+)/);
        const statusMatch = content.match(/### Status: (\w+)/);
        
        history.push({
          agent: this.getAgentName(agent),
          task: directiveMatch ? directiveMatch[1] : 'Unknown task',
          status: statusMatch ? statusMatch[1] : 'COMPLETED',
          timestamp: timestamp.toISOString(),
          file
        });
      } catch (e) {
        console.error(`Error reading task ${file}:`, e);
      }
    });
    
    // Sort by timestamp, newest first
    return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Run this continuously to update dashboard
  startSync(interval = 5000) {
    console.log('🔄 Starting dashboard sync...');
    
    // Initial update
    this.updateDashboardStatus();
    
    // Regular updates
    setInterval(() => {
      this.updateDashboardStatus();
    }, interval);
    
    console.log(`✅ Dashboard connector running (updates every ${interval/1000}s)`);
  }
}

// Export for use in dashboard
module.exports = AgentDashboardConnector;

// Run standalone if called directly
if (require.main === module) {
  const connector = new AgentDashboardConnector();
  connector.startSync();
  
  // Also output current status
  console.log('\n📊 Current Agent Status:');
  const status = connector.getAgentStatus();
  Object.entries(status).forEach(([agent, data]) => {
    console.log(`\n${data.name}:`);
    console.log(`  Status: ${data.status}`);
    console.log(`  Tasks Completed: ${data.tasks}`);
    console.log(`  Current Task: ${data.currentTask || 'None'}`);
  });
  
  // Keep process alive
  process.on('SIGTERM', () => {
    console.log('\n👋 Dashboard connector shutting down...');
    process.exit(0);
  });
}