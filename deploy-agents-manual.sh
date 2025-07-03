#!/bin/bash

# Manual deployment steps for Claude Agents to DO Droplet
# Copy these commands and run them after SSH'ing into your server

echo "🚀 Claude Agent Deployment Commands"
echo "=================================="
echo ""
echo "Step 1: SSH into your droplet"
echo "ssh developer@170.64.252.55"
echo ""
echo "Step 2: Copy and run these commands on the server:"
echo ""
cat << 'DEPLOYMENT_COMMANDS'

# Navigate to home directory
cd ~

# Clone the gigpig repo if not exists
if [ ! -d "gigpig-stage-connect-fresh" ]; then
  git clone https://github.com/chillz-id/gigpig-stage-connect.git gigpig-stage-connect-fresh
fi

cd gigpig-stage-connect-fresh

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Create agent directories
mkdir -p .agent-workspaces/{frontend,backend,testing}
mkdir -p .agent-comms/{task-queue,notifications,shared}
mkdir -p .agent-sessions

# Download agent management scripts
wget https://raw.githubusercontent.com/chillz-id/gigpig-stage-connect/main/remote-agent-manager.js
wget https://raw.githubusercontent.com/chillz-id/gigpig-stage-connect/main/slack-agent-notifications.js

# Create PM2 config for agents
cat > ecosystem-agents.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'claude-dashboard',
      script: 'remote-agent-manager.js',
      instances: 1,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'claude-slack',
      script: 'slack-agent-notifications.js',
      instances: 1,
      max_memory_restart: '150M',
      env: {
        NODE_ENV: 'production',
        SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
        SLACK_CHANNEL: '#dev-agents'
      }
    }
  ]
};
EOF

# Create simple agent worker
cat > agent-worker.js << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const AGENT_TYPE = process.argv[2] || process.env.AGENT_TYPE || 'unknown';
console.log(`🤖 ${AGENT_TYPE} agent started`);

// Simple heartbeat
setInterval(() => {
  console.log(`${AGENT_TYPE} agent is alive - ${new Date().toISOString()}`);
}, 60000);

process.on('SIGTERM', () => {
  console.log(`${AGENT_TYPE} agent shutting down...`);
  process.exit(0);
});
EOF

chmod +x agent-worker.js

# Install PM2 if not already installed
npm install -g pm2

# Start the dashboard and Slack bot
pm2 start ecosystem-agents.config.js

# Save PM2 configuration
pm2 save
pm2 startup systemd -u developer --hp /home/developer

# Check status
pm2 status

echo "✅ Agent infrastructure deployed!"
echo "📊 Dashboard will be at: http://170.64.252.55:3001"

DEPLOYMENT_COMMANDS