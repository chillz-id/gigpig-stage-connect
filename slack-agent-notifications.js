#!/usr/bin/env node

/**
 * Slack MCP Integration for Claude Agent Notifications
 * Sends real-time updates when agents complete tasks or need attention
 */

const { WebClient } = require('@slack/web-api');
const { createServer } = require('@slack/socket-mode');
const fs = require('fs');
const { execSync } = require('child_process');

class SlackAgentIntegration {
  constructor() {
    this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.channel = process.env.SLACK_CHANNEL || '#dev-agents';
    this.agents = ['frontend', 'backend', 'testing'];
    
    this.commands = {
      '/agent-status': this.handleStatusCommand.bind(this),
      '/assign-task': this.handleAssignTaskCommand.bind(this),
      '/agent-logs': this.handleLogsCommand.bind(this),
      '/merge-work': this.handleMergeCommand.bind(this)
    };
  }

  // Initialize Slack integration
  async init() {
    try {
      // Test connection
      const auth = await this.slack.auth.test();
      console.log('✅ Connected to Slack as:', auth.user);
      
      // Send startup message
      await this.sendMessage('🚀 Claude Agent Manager connected to Slack!', [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Available Commands:*
• \`/agent-status\` - Check all agents
• \`/assign-task [agent] [task]\` - Assign work
• \`/agent-logs [agent]\` - View recent commits
• \`/merge-work\` - Merge completed work`
          }
        }
      ]);

      this.startMonitoring();
    } catch (error) {
      console.error('❌ Failed to connect to Slack:', error);
    }
  }

  // Send message to Slack
  async sendMessage(text, blocks = null) {
    try {
      await this.slack.chat.postMessage({
        channel: this.channel,
        text,
        blocks,
        username: 'Claude Agent Manager',
        icon_emoji: ':robot_face:'
      });
    } catch (error) {
      console.error('Failed to send Slack message:', error);
    }
  }

  // Send task completion notification
  async notifyTaskCompletion(agent, taskDescription, commitHash) {
    const agentEmojis = {
      frontend: '🎨',
      backend: '⚙️',
      testing: '✅'
    };

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${agentEmojis[agent]} Task Completed!`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Agent:*\n${agent.charAt(0).toUpperCase() + agent.slice(1)}`
          },
          {
            type: 'mrkdwn',
            text: `*Task:*\n${taskDescription}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Commit:* \`${commitHash}\``
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Changes'
            },
            value: `view_commit_${commitHash}`,
            action_id: 'view_commit'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Assign New Task'
            },
            value: `assign_task_${agent}`,
            action_id: 'assign_task'
          }
        ]
      }
    ];

    await this.sendMessage('Task completed!', blocks);
  }

  // Handle /agent-status command
  async handleStatusCommand() {
    const status = this.getAgentStatus();
    
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🤖 Agent Status Report'
        }
      }
    ];

    Object.entries(status).forEach(([agent, data]) => {
      const emoji = { frontend: '🎨', backend: '⚙️', testing: '✅' }[agent];
      const statusEmoji = data.isActive ? '🟢' : '🔴';
      
      blocks.push({
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*${emoji} ${agent.charAt(0).toUpperCase() + agent.slice(1)}*\n${statusEmoji} ${data.status}`
          },
          {
            type: 'mrkdwn',
            text: `*Last Commit:*\n\`${data.lastCommit || 'None'}\``
          }
        ]
      });
    });

    await this.sendMessage('Agent status:', blocks);
  }

  // Handle /assign-task command
  async handleAssignTaskCommand(params) {
    const [agent, ...taskParts] = params;
    const task = taskParts.join(' ');

    if (!agent || !task) {
      await this.sendMessage('❌ Usage: `/assign-task [frontend|backend|testing] [task description]`');
      return;
    }

    if (!this.agents.includes(agent)) {
      await this.sendMessage(`❌ Invalid agent. Use: ${this.agents.join(', ')}`);
      return;
    }

    // Create task file
    const taskDir = '.agent-comms/task-queue';
    if (!fs.existsSync(taskDir)) {
      fs.mkdirSync(taskDir, { recursive: true });
    }

    const taskId = Date.now().toString();
    const taskFile = `${taskDir}/${agent}-${taskId}.md`;
    const taskContent = `# Task for ${agent} Agent

**Assigned via Slack:** ${new Date().toISOString()}
**Task:** ${task}

Complete this task and delete this file when done.
`;

    fs.writeFileSync(taskFile, taskContent);

    const emoji = { frontend: '🎨', backend: '⚙️', testing: '✅' }[agent];
    await this.sendMessage(`${emoji} Task assigned to ${agent} agent: "${task}"`);
  }

  // Handle /agent-logs command
  async handleLogsCommand(params) {
    const [agent] = params;
    
    if (!agent || !this.agents.includes(agent)) {
      await this.sendMessage(`❌ Specify agent: ${this.agents.join(', ')}`);
      return;
    }

    try {
      const branch = `feature/${agent}-work`;
      const logs = execSync(
        `git log ${branch} --oneline -10 --pretty=format:"%h %s (%cr)"`,
        { encoding: 'utf-8' }
      ).split('\n');

      const emoji = { frontend: '🎨', backend: '⚙️', testing: '✅' }[agent];
      
      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} Recent ${agent} commits`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '```\n' + logs.slice(0, 5).join('\n') + '\n```'
          }
        }
      ];

      await this.sendMessage('Recent commits:', blocks);
    } catch (error) {
      await this.sendMessage(`❌ Error getting logs for ${agent}: ${error.message}`);
    }
  }

  // Handle /merge-work command
  async handleMergeCommand() {
    try {
      // Check for completed work
      const completedWork = [];
      
      for (const agent of this.agents) {
        const branch = `feature/${agent}-work`;
        try {
          const hasChanges = execSync(
            `git log dev..${branch} --oneline`,
            { encoding: 'utf-8', stdio: 'pipe' }
          ).trim();
          
          if (hasChanges) {
            completedWork.push(agent);
          }
        } catch (e) {
          // Branch doesn't exist or no changes
        }
      }

      if (completedWork.length === 0) {
        await this.sendMessage('ℹ️ No completed work to merge');
        return;
      }

      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Ready to merge work from:*\n${completedWork.map(agent => {
              const emoji = { frontend: '🎨', backend: '⚙️', testing: '✅' }[agent];
              return `${emoji} ${agent}`;
            }).join('\n')}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Merge All'
              },
              style: 'primary',
              value: 'merge_all',
              action_id: 'merge_all'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Cancel'
              },
              value: 'cancel',
              action_id: 'cancel'
            }
          ]
        }
      ];

      await this.sendMessage('Merge confirmation:', blocks);
    } catch (error) {
      await this.sendMessage(`❌ Error checking merge status: ${error.message}`);
    }
  }

  // Get agent status
  getAgentStatus() {
    const status = {};
    
    this.agents.forEach(agent => {
      try {
        const branch = `feature/${agent}-work`;
        const branchExists = this.branchExists(branch);
        
        if (branchExists) {
          const lastCommit = execSync(
            `git log ${branch} --oneline -1 --pretty=format:"%h %s"`,
            { encoding: 'utf-8', stdio: 'pipe' }
          ).trim();
          
          const recentActivity = execSync(
            `git log ${branch} --since="1 hour ago" --oneline`,
            { encoding: 'utf-8', stdio: 'pipe' }
          ).trim();
          
          status[agent] = {
            exists: true,
            lastCommit,
            isActive: recentActivity.length > 0,
            status: recentActivity.length > 0 ? 'active' : 'idle'
          };
        } else {
          status[agent] = {
            exists: false,
            lastCommit: 'No branch',
            isActive: false,
            status: 'not started'
          };
        }
      } catch (error) {
        status[agent] = {
          exists: false,
          lastCommit: 'Error',
          isActive: false,
          status: 'error'
        };
      }
    });
    
    return status;
  }

  // Check if branch exists
  branchExists(branchName) {
    try {
      execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  // Start monitoring for changes
  startMonitoring() {
    console.log('🔍 Starting Slack monitoring...');
    
    // Check for new commits every 2 minutes
    setInterval(() => {
      this.checkForNewCommits();
    }, 2 * 60 * 1000);

    // Check for completed tasks every minute
    setInterval(() => {
      this.checkForCompletedTasks();
    }, 60 * 1000);
  }

  // Check for new commits
  checkForNewCommits() {
    this.agents.forEach(agent => {
      try {
        const branch = `feature/${agent}-work`;
        
        // Check for commits in last 3 minutes
        const recentCommits = execSync(
          `git log ${branch} --since="3 minutes ago" --pretty=format:"%h %s"`,
          { encoding: 'utf-8', stdio: 'pipe' }
        ).trim();

        if (recentCommits) {
          const commits = recentCommits.split('\n');
          commits.forEach(commit => {
            const [hash, ...messageParts] = commit.split(' ');
            const message = messageParts.join(' ');
            
            this.notifyCommit(agent, message, hash);
          });
        }
      } catch (error) {
        // Ignore errors (branch might not exist)
      }
    });
  }

  // Notify about new commit
  async notifyCommit(agent, message, hash) {
    const emoji = { frontend: '🎨', backend: '⚙️', testing: '✅' }[agent];
    
    await this.sendMessage(`${emoji} *${agent}* committed: \`${hash}\` ${message}`);
  }

  // Check for completed tasks
  checkForCompletedTasks() {
    const taskDir = '.agent-comms/task-queue';
    if (!fs.existsSync(taskDir)) return;

    // Check for task completion markers
    const files = fs.readdirSync(taskDir);
    files.forEach(file => {
      if (file.endsWith('.completed')) {
        const taskInfo = file.replace('.completed', '');
        const [agent, taskId] = taskInfo.split('-');
        
        this.notifyTaskCompletion(agent, `Task ${taskId}`, 'latest');
        
        // Clean up completed marker
        fs.unlinkSync(`${taskDir}/${file}`);
      }
    });
  }
}

// Initialize if running directly
if (require.main === module) {
  const integration = new SlackAgentIntegration();
  integration.init();
  
  console.log(`
🔔 Slack Agent Integration Started!

Set these environment variables:
export SLACK_BOT_TOKEN="xoxb-your-bot-token"
export SLACK_CHANNEL="#dev-agents"

Available Slack commands:
• /agent-status - Check all agents
• /assign-task [agent] [task] - Assign work
• /agent-logs [agent] - View commits  
• /merge-work - Merge completed work
`);
}

module.exports = SlackAgentIntegration;