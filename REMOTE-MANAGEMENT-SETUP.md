# Remote Agent Management Setup Guide

## 🎯 Overview

This system allows you to monitor and control your Claude agents from anywhere - phone, laptop, another computer. When you leave your PC on, the agents can work autonomously and notify you via Slack when tasks are complete.

## 📱 What You Get

### Real-Time Notifications
- 🔔 Slack messages when agents complete tasks
- 📊 Daily progress summaries
- ⚠️ Alerts when agents need attention
- 🎉 Task completion celebrations

### Remote Control
- 📱 Web dashboard accessible from any device
- 💬 Slack commands to assign tasks
- 📈 Real-time agent status monitoring
- 🔧 Remote merge controls

### Autonomous Operation
- 🤖 Agents work independently when you're away
- 📝 Automatic task queue management
- 💾 Progress logging and history
- 🔄 Auto-sync between agents

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd /mnt/f/AISUPERTOOLS/gigpig-stage-connect-fresh
npm install express node-cron @slack/web-api @slack/socket-mode
```

### 2. Create Slack App (Optional but Recommended)
1. Go to https://api.slack.com/apps
2. Create new app "Claude Agent Manager"
3. Add Bot Token Scopes:
   - `chat:write`
   - `chat:write.public`
   - `commands`
4. Install app to workspace
5. Copy Bot User OAuth Token

### 3. Set Environment Variables
```bash
# Add to your ~/.bashrc or ~/.zshrc
export SLACK_BOT_TOKEN="xoxb-your-bot-token-here"
export SLACK_CHANNEL="#dev-agents"
export ADMIN_PHONE="+1234567890"  # Optional for SMS
```

### 4. Start Remote Manager
```bash
# Start the remote management server
node remote-agent-manager.js

# Or with Slack integration
node slack-agent-notifications.js
```

## 📊 Web Dashboard

Access from any device: **http://your-pc-ip:3001**

### Features:
- 📈 Real-time agent status
- ✅ Recent commits from each agent
- 📋 Task assignment interface
- 🔄 Auto-refresh every 30 seconds
- 📱 Mobile-responsive design

### Screenshot Preview:
```
🤖 Claude Agent Dashboard
                                🔄 Refresh

🎨 Frontend Agent               [ACTIVE]
Branch: feature/frontend-work
Last Activity: 2 minutes ago
Recent Commits:
  abc123 feat(ui): add loading animations (2m ago)
  def456 feat(ui): update button styles (15m ago)

┌─────────────────────────────────────────────┐
│ Assign New Task:                            │
│ ┌─────────────────────────────────────────┐ │
│ │ Add dark mode toggle to settings page  │ │
│ └─────────────────────────────────────────┘ │
│           [Assign Task]                     │
└─────────────────────────────────────────────┘
```

## 💬 Slack Commands

Once Slack integration is setup, use these commands:

### `/agent-status`
```
🤖 Agent Status Report
🎨 Frontend: 🟢 active
⚙️ Backend: 🔴 idle  
✅ Testing: 🟢 active
```

### `/assign-task [agent] [task]`
```
/assign-task frontend Add loading spinners to all forms
✅ Task assigned to frontend agent
```

### `/agent-logs [agent]`
```
🎨 Recent frontend commits:
abc123 feat(ui): add spinners (5m ago)
def456 feat(ui): fix button styles (1h ago)
```

### `/merge-work`
```
Ready to merge work from:
🎨 frontend ✅ testing

[Merge All] [Cancel]
```

## 🔧 API Endpoints

For custom integrations:

### Get Agent Status
```bash
curl http://localhost:3001/api/status
```

### Assign Task via API
```bash
curl -X POST http://localhost:3001/api/agents/frontend/task \
  -H "Content-Type: application/json" \
  -d '{"task": "Add dark mode toggle"}'
```

## 📱 Mobile Usage Examples

### Away from PC Scenarios:

#### Scenario 1: At Coffee Shop
1. Open http://your-pc-ip:3001 on phone
2. See backend agent completed API work
3. Assign new task: "Add user profile endpoints"
4. Get Slack notification when complete

#### Scenario 2: On Vacation
1. Receive Slack: "🎉 Frontend agent completed login redesign"
2. Reply with: `/assign-task testing Add tests for new login flow`
3. Get daily summary: "3 tasks completed today"

#### Scenario 3: In Meeting
1. Silent Slack notification: "✅ Task completed"
2. Quick check on phone dashboard
3. Merge work remotely via Slack: `/merge-work`

## 🎪 Advanced Features

### Task Queuing
```bash
# Agents automatically pick up tasks from queue
echo "Build user dashboard" > .agent-comms/task-queue/frontend-$(date +%s).md
echo "Add user analytics API" > .agent-comms/task-queue/backend-$(date +%s).md
```

### Progress Tracking
```bash
# View progress anytime
tail -f .agent-comms/notifications.log
```

### Performance Monitoring
```bash
# Built-in metrics tracking
git log --since="1 week ago" --pretty=format:"%an %s" | sort | uniq -c
```

## 🔐 Security Considerations

### Network Access
- Dashboard runs on local network only
- Use VPN for external access
- Consider reverse proxy with authentication

### Slack Security  
- Use workspace-specific bot tokens
- Limit bot permissions to essential scopes
- Monitor bot activity in Slack audit logs

### File Permissions
```bash
# Restrict access to agent files
chmod 700 .agent-comms/
chmod 600 .agent-comms/*.log
```

## 🚨 Troubleshooting

### Common Issues:

#### "Can't connect to dashboard"
```bash
# Check if server is running
ps aux | grep "remote-agent-manager"

# Check port availability
netstat -tlnp | grep :3001
```

#### "Slack notifications not working"
```bash
# Verify environment variables
echo $SLACK_BOT_TOKEN
echo $SLACK_CHANNEL

# Test Slack connection
node -e "console.log(process.env.SLACK_BOT_TOKEN ? 'Token set' : 'No token')"
```

#### "Agents not showing activity"
```bash
# Check agent branches
git branch -a | grep feature

# Check recent commits
git log --since="1 hour ago" --all --oneline
```

## 📈 Usage Analytics

Track your productivity:

```bash
# Weekly commit summary
git log --since="1 week ago" --pretty=format:"%h %an %s" | wc -l

# Agent productivity comparison
for agent in frontend backend testing; do
  echo "$agent: $(git log feature/$agent-work --since='1 week ago' --oneline | wc -l) commits"
done
```

## 🎯 Best Practices

### Daily Routine:
1. **Morning**: Check dashboard, assign day's tasks
2. **Lunch**: Review progress, adjust priorities  
3. **Evening**: Merge completed work, plan tomorrow

### Task Assignment:
- Be specific: "Add loading animation to login button"
- Include acceptance criteria: "Should fade in over 300ms"
- Set priorities: Use Slack reactions for urgency

### Monitoring:
- Enable Slack notifications for immediate feedback
- Check dashboard 2-3 times daily
- Review weekly progress reports

This remote management system transforms your PC into an autonomous development machine that works while you're away and keeps you informed wherever you are!