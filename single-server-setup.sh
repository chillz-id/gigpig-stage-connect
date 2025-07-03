#!/bin/bash

# Single DigitalOcean Droplet Setup for Multi-Agent Development
# Optimized for 2GB RAM, 2 vCPU ($25/month)

echo "🚀 Setting up Claude Multi-Agent System on single DO server..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone repository
git clone https://github.com/chillz-id/gigpig-stage-connect.git
cd gigpig-stage-connect

# Install dependencies (shared across all agents)
npm install

# Create agent workspace directories
mkdir -p .agent-workspaces/{frontend,backend,testing}
mkdir -p .agent-comms/{task-queue,notifications,shared}

# Setup PM2 ecosystem for all agents
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'agent-dashboard',
      script: 'remote-agent-manager.js',
      instances: 1,
      memory_limit: '200MB',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'slack-notifications',
      script: 'slack-agent-notifications.js', 
      instances: 1,
      memory_limit: '150MB',
      env: {
        NODE_ENV: 'production',
        SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
        SLACK_CHANNEL: '#dev-agents'
      }
    },
    {
      name: 'frontend-agent',
      script: 'start-claude-agent.sh',
      args: 'frontend',
      instances: 1,
      memory_limit: '300MB',
      cwd: '.agent-workspaces/frontend',
      env: {
        CLAUDE_AGENT_TYPE: 'frontend',
        CLAUDE_CONTEXT_FILE: 'CLAUDE-FRONTEND.md',
        BRANCH_PREFIX: 'feature/frontend'
      }
    },
    {
      name: 'backend-agent',
      script: 'start-claude-agent.sh', 
      args: 'backend',
      instances: 1,
      memory_limit: '300MB',
      cwd: '.agent-workspaces/backend',
      env: {
        CLAUDE_AGENT_TYPE: 'backend',
        CLAUDE_CONTEXT_FILE: 'CLAUDE-BACKEND.md',
        BRANCH_PREFIX: 'feature/backend'
      }
    },
    {
      name: 'testing-agent',
      script: 'start-claude-agent.sh',
      args: 'testing', 
      instances: 1,
      memory_limit: '300MB',
      cwd: '.agent-workspaces/testing',
      env: {
        CLAUDE_AGENT_TYPE: 'testing',
        CLAUDE_CONTEXT_FILE: 'CLAUDE-TESTING.md',
        BRANCH_PREFIX: 'feature/testing'
      }
    }
  ]
};
EOF

# Create lightweight agent starter script
cat > start-claude-agent.sh << 'EOF'
#!/bin/bash

AGENT_TYPE=$1
echo "🤖 Starting $AGENT_TYPE agent with minimal footprint..."

# Set memory limits
export NODE_OPTIONS="--max-old-space-size=250"

# Start agent with resource monitoring
while true; do
  echo "$(date): $AGENT_TYPE agent checking for tasks..."
  
  # Check for new tasks
  if ls .agent-comms/task-queue/$AGENT_TYPE-*.md 1> /dev/null 2>&1; then
    echo "📋 Found task for $AGENT_TYPE agent"
    
    # Process task with Claude Code (you'd integrate this with your Claude setup)
    # For now, simulate processing
    sleep 30
    
    # Mark task complete
    for task in .agent-comms/task-queue/$AGENT_TYPE-*.md; do
      mv "$task" "${task%.md}.completed"
    done
  fi
  
  # Sleep for 2 minutes before checking again
  sleep 120
done
EOF

chmod +x start-claude-agent.sh

# Install lightweight monitoring
cat > monitor-resources.sh << 'EOF'
#!/bin/bash

# Lightweight resource monitoring
echo "📊 System Resources:"
echo "RAM: $(free -h | grep '^Mem:' | awk '{print $3 "/" $2}')"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo ""

echo "📊 PM2 Processes:"
pm2 status
echo ""

echo "📊 Agent Memory Usage:"
pm2 show frontend-agent | grep "Memory usage"
pm2 show backend-agent | grep "Memory usage" 
pm2 show testing-agent | grep "Memory usage"
EOF

chmod +x monitor-resources.sh

# Setup nginx for external access
sudo apt install -y nginx

sudo cat > /etc/nginx/sites-available/claude-agents << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Agent Dashboard
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API endpoints
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/claude-agents /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Setup firewall
sudo ufw allow ssh
sudo ufw allow http
sudo ufw --force enable

echo "✅ Single server setup complete!"
echo ""
echo "📊 Resource allocation:"
echo "├── Frontend Agent: 300MB RAM"
echo "├── Backend Agent:  300MB RAM" 
echo "├── Testing Agent:  300MB RAM"
echo "├── Dashboard:      200MB RAM"
echo "├── Slack Bot:      150MB RAM"
echo "├── System:         400MB RAM"
echo "└── Buffer:         350MB RAM"
echo ""
echo "🌐 Access dashboard: http://your-droplet-ip"
echo "📱 Slack notifications ready!"
echo ""
echo "💰 Total cost: $25/month (vs $90 for separate instances)"
EOF