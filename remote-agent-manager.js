#!/usr/bin/env node

/**
 * Remote Agent Manager for Claude Multi-Agent System
 * Enables monitoring and control of agents when away from PC
 * Integrates with Slack, Discord, and SMS for notifications
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cron = require('node-cron');

class RemoteAgentManager {
  constructor() {
    this.agents = {
      frontend: {
        name: 'Frontend Agent',
        branch: 'feature/frontend-work',
        emoji: '🎨',
        lastActivity: null,
        status: 'idle'
      },
      backend: {
        name: 'Backend Agent',
        branch: 'feature/backend-work',
        emoji: '⚙️',
        lastActivity: null,
        status: 'idle'
      },
      testing: {
        name: 'Testing Agent',
        branch: 'feature/test-work',
        emoji: '✅',
        lastActivity: null,
        status: 'idle'
      }
    };

    this.notifications = {
      slack: {
        enabled: true,
        webhook: process.env.SLACK_WEBHOOK_URL,
        channel: '#dev-agents'
      },
      discord: {
        enabled: false,
        webhook: process.env.DISCORD_WEBHOOK_URL
      },
      sms: {
        enabled: false,
        service: 'twilio',
        phone: process.env.ADMIN_PHONE
      }
    };

    this.taskQueue = [];
    this.completedTasks = [];
  }

  // Initialize web dashboard and monitoring
  startServer() {
    const app = express();
    app.use(express.json());
    app.use(express.static('public'));

    // Serve agent dashboard
    app.get('/', (req, res) => {
      res.send(this.generateDashboard());
    });

    // API endpoints
    app.get('/api/agents', (req, res) => {
      res.json(this.getAgentStatus());
    });

    app.post('/api/agents/:agent/task', (req, res) => {
      const { agent } = req.params;
      const { task } = req.body;
      this.assignTask(agent, task);
      res.json({ success: true, message: `Task assigned to ${agent}` });
    });

    app.get('/api/status', (req, res) => {
      res.json({
        agents: this.agents,
        taskQueue: this.taskQueue,
        completedTasks: this.completedTasks.slice(-10),
        lastUpdate: new Date().toISOString()
      });
    });

    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`🌐 Remote Agent Manager running on http://localhost:${port}`);
      this.sendNotification('🚀 Remote Agent Manager started', 'System ready for remote control');
    });
  }

  // Generate HTML dashboard
  generateDashboard() {
    const status = this.getAgentStatus();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Claude Agent Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: system-ui; margin: 20px; background: #1a1a1a; color: #fff; }
        .agent { background: #2d2d2d; border-radius: 8px; padding: 20px; margin: 10px 0; }
        .active { border-left: 4px solid #4ade80; }
        .idle { border-left: 4px solid #64748b; }
        .working { border-left: 4px solid #f59e0b; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; }
        .status.active { background: #065f46; color: #10b981; }
        .status.idle { background: #374151; color: #9ca3af; }
        .status.working { background: #92400e; color: #f59e0b; }
        .commit { font-family: monospace; font-size: 14px; margin: 5px 0; }
        .task-form { background: #374151; padding: 15px; border-radius: 8px; margin-top: 20px; }
        input, textarea, button { padding: 8px; margin: 5px; border-radius: 4px; border: none; }
        input, textarea { background: #4b5563; color: #fff; width: 300px; }
        button { background: #7c3aed; color: #fff; cursor: pointer; }
        button:hover { background: #6d28d9; }
        .refresh { position: fixed; top: 20px; right: 20px; }
    </style>
    <script>
        function refreshDashboard() {
            location.reload();
        }
        
        function assignTask(agent) {
            const task = document.getElementById(agent + '-task').value;
            if (!task) return;
            
            fetch('/api/agents/' + agent + '/task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task })
            }).then(() => {
                alert('Task assigned to ' + agent);
                document.getElementById(agent + '-task').value = '';
            });
        }
        
        // Auto-refresh every 30 seconds
        setInterval(refreshDashboard, 30000);
    </script>
</head>
<body>
    <h1>🤖 Claude Agent Dashboard</h1>
    <button onclick="refreshDashboard()" class="refresh">🔄 Refresh</button>
    
    <div id="agents">
        ${Object.entries(this.agents).map(([key, agent]) => `
            <div class="agent ${agent.status}">
                <h3>${agent.emoji} ${agent.name}</h3>
                <span class="status ${agent.status}">${agent.status.toUpperCase()}</span>
                <p><strong>Branch:</strong> ${agent.branch}</p>
                <p><strong>Last Activity:</strong> ${agent.lastActivity || 'Never'}</p>
                
                <div class="commits">
                    <h4>Recent Commits:</h4>
                    ${status[key]?.recentCommits?.map(commit => 
                        `<div class="commit">${commit}</div>`
                    ).join('') || '<div class="commit">No commits yet</div>'}
                </div>
                
                <div class="task-form">
                    <h4>Assign New Task:</h4>
                    <textarea id="${key}-task" placeholder="Describe the task for ${agent.name}..."></textarea><br>
                    <button onclick="assignTask('${key}')">Assign Task</button>
                </div>
            </div>
        `).join('')}
    </div>
    
    <div class="task-form">
        <h3>📋 Task Queue (${this.taskQueue.length})</h3>
        ${this.taskQueue.map(task => `
            <div class="commit">${task.agent}: ${task.description}</div>
        `).join('') || '<div class="commit">No pending tasks</div>'}
    </div>
    
    <div class="task-form">
        <h3>✅ Completed Tasks (Last 10)</h3>
        ${this.completedTasks.slice(-10).map(task => `
            <div class="commit">${task.agent}: ${task.description} (${task.completedAt})</div>
        `).join('') || '<div class="commit">No completed tasks</div>'}
    </div>
</body>
</html>`;
  }

  // Get current status of all agents
  getAgentStatus() {
    const status = {};
    
    Object.entries(this.agents).forEach(([key, agent]) => {
      try {
        // Check if branch exists
        const branchExists = this.branchExists(agent.branch);
        
        if (branchExists) {
          // Get recent commits
          const commits = execSync(
            `git log ${agent.branch} --oneline -5 --pretty=format:"%h %s (%cr)"`,
            { encoding: 'utf-8', stdio: 'pipe' }
          ).split('\n').filter(line => line.trim());
          
          // Check for recent activity (commits in last hour)
          const recentActivity = execSync(
            `git log ${agent.branch} --since="1 hour ago" --oneline`,
            { encoding: 'utf-8', stdio: 'pipe' }
          ).trim();
          
          const isActive = recentActivity.length > 0;
          
          status[key] = {
            exists: true,
            recentCommits: commits,
            lastCommit: commits[0] || 'No commits',
            isActive,
            status: isActive ? 'active' : 'idle'
          };
          
          // Update agent status
          this.agents[key].status = isActive ? 'active' : 'idle';
          if (isActive) {
            this.agents[key].lastActivity = new Date().toISOString();
          }
        } else {
          status[key] = {
            exists: false,
            recentCommits: [],
            lastCommit: 'Branch not found',
            isActive: false,
            status: 'idle'
          };
        }
      } catch (error) {
        status[key] = {
          exists: false,
          recentCommits: [],
          lastCommit: 'Error checking status',
          isActive: false,
          status: 'error',
          error: error.message
        };
      }
    });
    
    return status;
  }

  // Check if git branch exists
  branchExists(branchName) {
    try {
      execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  // Send notification via configured channels
  async sendNotification(title, message, priority = 'normal') {
    const timestamp = new Date().toISOString();
    const notification = {
      title,
      message,
      timestamp,
      priority
    };

    console.log(`📱 ${title}: ${message}`);

    // Slack notification
    if (this.notifications.slack.enabled && this.notifications.slack.webhook) {
      try {
        const slackPayload = {
          channel: this.notifications.slack.channel,
          username: 'Claude Agent Manager',
          icon_emoji: ':robot_face:',
          attachments: [{
            color: priority === 'high' ? 'danger' : priority === 'medium' ? 'warning' : 'good',
            title: title,
            text: message,
            timestamp: Math.floor(Date.now() / 1000)
          }]
        };

        // Using fetch (you might need to install node-fetch)
        if (typeof fetch !== 'undefined') {
          await fetch(this.notifications.slack.webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slackPayload)
          });
        }
      } catch (error) {
        console.error('Failed to send Slack notification:', error);
      }
    }

    // Save notification to file for fallback
    const notificationFile = path.join('.agent-comms', 'notifications.log');
    fs.appendFileSync(notificationFile, JSON.stringify(notification) + '\n');
  }

  // Assign task to specific agent
  assignTask(agentKey, taskDescription) {
    const agent = this.agents[agentKey];
    if (!agent) {
      console.error(`Agent ${agentKey} not found`);
      return;
    }

    const task = {
      id: Date.now().toString(),
      agent: agentKey,
      description: taskDescription,
      assignedAt: new Date().toISOString(),
      status: 'pending'
    };

    this.taskQueue.push(task);

    // Create task file for agent to pick up
    const taskDir = path.join('.agent-comms', 'task-queue');
    if (!fs.existsSync(taskDir)) {
      fs.mkdirSync(taskDir, { recursive: true });
    }

    const taskFile = path.join(taskDir, `${agentKey}-${task.id}.md`);
    const taskContent = `# Task for ${agent.name}

**Assigned:** ${task.assignedAt}
**Priority:** Normal
**Branch:** ${agent.branch}

## Task Description
${taskDescription}

## Instructions
1. Switch to your designated branch: \`${agent.branch}\`
2. Complete the task following your domain rules
3. Commit with appropriate prefix
4. Mark task complete by deleting this file

## Status
- [ ] In Progress
- [ ] Testing
- [ ] Complete
`;

    fs.writeFileSync(taskFile, taskContent);

    this.sendNotification(
      `${agent.emoji} Task Assigned to ${agent.name}`,
      taskDescription,
      'normal'
    );

    console.log(`✅ Task assigned to ${agent.name}: ${taskDescription}`);
  }

  // Monitor for completed tasks
  checkCompletedTasks() {
    const taskDir = path.join('.agent-comms', 'task-queue');
    if (!fs.existsSync(taskDir)) return;

    // Check for deleted task files (indicates completion)
    this.taskQueue.forEach((task, index) => {
      const taskFile = path.join(taskDir, `${task.agent}-${task.id}.md`);
      
      if (!fs.existsSync(taskFile)) {
        // Task file deleted = task completed
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        
        this.completedTasks.push(task);
        this.taskQueue.splice(index, 1);

        const agent = this.agents[task.agent];
        this.sendNotification(
          `${agent.emoji} Task Completed!`,
          `${agent.name} finished: ${task.description}`,
          'high'
        );
      }
    });
  }

  // Start monitoring
  startMonitoring() {
    console.log('🔍 Starting agent monitoring...');

    // Check agent status every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      console.log('⏰ Checking agent status...');
      this.getAgentStatus();
      this.checkCompletedTasks();
    });

    // Send daily summary at 6 PM
    cron.schedule('0 18 * * *', () => {
      this.sendDailySummary();
    });

    // Check for completed tasks every minute
    cron.schedule('* * * * *', () => {
      this.checkCompletedTasks();
    });
  }

  // Send daily summary
  sendDailySummary() {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = this.completedTasks.filter(task => 
      task.completedAt && task.completedAt.startsWith(today)
    );

    const summary = `📊 Daily Agent Summary (${today})

Completed Tasks: ${todayTasks.length}
${todayTasks.map(task => `• ${this.agents[task.agent].emoji} ${task.description}`).join('\n')}

Pending Tasks: ${this.taskQueue.length}
${this.taskQueue.map(task => `• ${this.agents[task.agent].emoji} ${task.description}`).join('\n')}`;

    this.sendNotification('📊 Daily Summary', summary, 'normal');
  }
}

// Usage and startup
const manager = new RemoteAgentManager();

// Start the web server
manager.startServer();

// Start monitoring
manager.startMonitoring();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Agent Manager...');
  manager.sendNotification('🛑 Agent Manager Shutdown', 'Remote monitoring stopped');
  process.exit(0);
});

console.log(`
🤖 Claude Multi-Agent Remote Manager Started!

📱 Dashboard: http://localhost:3001
📊 API: http://localhost:3001/api/status
🔔 Notifications: ${manager.notifications.slack.enabled ? 'Slack enabled' : 'File logging only'}

Example: Assign a task remotely:
curl -X POST http://localhost:3001/api/agents/frontend/task \\
  -H "Content-Type: application/json" \\
  -d '{"task": "Add loading animations to all buttons"}'
`);