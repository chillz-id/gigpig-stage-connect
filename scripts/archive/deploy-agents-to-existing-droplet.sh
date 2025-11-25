#!/bin/bash

# Deploy Claude Agents to EXISTING Digital Ocean Droplet
# Server: 170.64.252.55 (SUS-GigPig)

echo "🚀 Deploying Claude Agents to existing DO droplet..."

# SSH into existing server
ssh developer@170.64.252.55 << 'ENDSSH'

echo "📦 Setting up Claude agents on existing infrastructure..."

# Navigate to home directory
cd ~

# Clone the gigpig repo if not exists
if [ ! -d "gigpig-stage-connect-fresh" ]; then
  git clone https://github.com/chillz-id/gigpig-stage-connect.git gigpig-stage-connect-fresh
fi

cd gigpig-stage-connect-fresh

# Pull latest changes
git pull origin main

# Install agent dependencies
npm install

# Create agent directories
mkdir -p .agent-workspaces/{frontend,backend,testing}
mkdir -p .agent-comms/{task-queue,notifications,shared}
mkdir -p .agent-sessions

# Copy agent management scripts from our new setup
cp remote-agent-manager.js .
cp slack-agent-notifications.js .

# Create PM2 config for agents (lightweight, using existing resources)
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
        PORT: 3001  // Different from app (8080) and n8n (5678)
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
    },
    {
      name: 'claude-frontend',
      script: 'agent-worker.js',
      args: 'frontend',
      instances: 1,
      max_memory_restart: '300M',
      cwd: '.agent-workspaces/frontend',
      env: {
        AGENT_TYPE: 'frontend',
        MCP_SERVER: 'http://localhost:3000',  // Local MCP access!
        BRANCH_PREFIX: 'feature/frontend'
      }
    },
    {
      name: 'claude-backend',
      script: 'agent-worker.js',
      args: 'backend',
      instances: 1,
      max_memory_restart: '300M',
      cwd: '.agent-workspaces/backend',
      env: {
        AGENT_TYPE: 'backend',
        MCP_SERVER: 'http://localhost:3000',  // Local MCP access!
        BRANCH_PREFIX: 'feature/backend'
      }
    },
    {
      name: 'claude-testing',
      script: 'agent-worker.js',
      args: 'testing',
      instances: 1,
      max_memory_restart: '300M',
      cwd: '.agent-workspaces/testing',
      env: {
        AGENT_TYPE: 'testing',
        MCP_SERVER: 'http://localhost:3000',  // Local MCP access!
        BRANCH_PREFIX: 'feature/testing'
      }
    }
  ]
};
EOF

# Create lightweight agent worker
cat > agent-worker.js << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AGENT_TYPE = process.argv[2] || process.env.AGENT_TYPE;
const TASK_DIR = path.join(__dirname, '../../.agent-comms/task-queue');
const MCP_SERVER = process.env.MCP_SERVER || 'http://localhost:3000';

console.log(`🤖 ${AGENT_TYPE} agent started with MCP access at ${MCP_SERVER}`);

// Main task processing loop
async function processTask() {
  const taskFiles = fs.readdirSync(TASK_DIR)
    .filter(f => f.startsWith(`${AGENT_TYPE}-`) && f.endsWith('.md'));
  
  if (taskFiles.length === 0) {
    return false;
  }
  
  const taskFile = taskFiles[0];
  const taskPath = path.join(TASK_DIR, taskFile);
  const taskContent = fs.readFileSync(taskPath, 'utf8');
  
  console.log(`📋 Processing task: ${taskFile}`);
  
  // Here you would integrate with Claude API
  // For now, simulate task processing
  console.log(`Task content: ${taskContent}`);
  
  // Mark task as completed
  const completedPath = taskPath.replace('.md', '.completed');
  fs.renameSync(taskPath, completedPath);
  
  // Notify completion
  fs.appendFileSync(
    path.join(__dirname, '../../.agent-comms/notifications.log'),
    `${new Date().toISOString()} - ${AGENT_TYPE} completed ${taskFile}\n`
  );
  
  return true;
}

// Check for tasks every 30 seconds
setInterval(async () => {
  try {
    await processTask();
  } catch (error) {
    console.error(`Error processing task: ${error.message}`);
  }
}, 30000);

// Keep process alive
process.on('SIGTERM', () => {
  console.log(`${AGENT_TYPE} agent shutting down...`);
  process.exit(0);
});
EOF

chmod +x agent-worker.js

# Update nginx to include agent dashboard
sudo tee /etc/nginx/sites-available/claude-agents << 'EOF'
server {
    listen 80;
    server_name sus-gigpig.pro agents.sus-gigpig.pro;
    
    # Main app
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # N8N automation
    location /n8n/ {
        proxy_pass http://localhost:5678/;
        proxy_set_header Host $host;
    }
    
    # Claude agent dashboard
    location /agents {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Agent API
    location /api/agents {
        proxy_pass http://localhost:3001/api;
        proxy_set_header Host $host;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/claude-agents /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Open firewall port for agent dashboard
sudo ufw allow 3001/tcp

# Start the agents with PM2
pm2 start ecosystem-agents.config.js
pm2 save
pm2 startup

echo "✅ Claude agents deployed to existing droplet!"
echo ""
echo "📊 Access points:"
echo "  Main App: http://170.64.252.55:8080"
echo "  N8N: http://170.64.252.55:5678"
echo "  Agent Dashboard: http://170.64.252.55:3001"
echo "  Via Nginx: http://sus-gigpig.pro/agents"
echo ""
echo "🔧 MCP Access: All agents can use localhost:3000"
echo "💰 Additional Cost: $0 (using existing server!)"

ENDSSH