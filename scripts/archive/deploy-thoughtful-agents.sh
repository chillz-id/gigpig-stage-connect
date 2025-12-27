#!/bin/bash

# Deploy Thoughtful Claude Agents with FIFO Queue
# This script should be run on your server

echo "🧠 Deploying Thoughtful Claude Agents..."

# Create secure environment file (not in git)
cat > ~/.claude-agents-env << 'EOF'
# Claude API Configuration
export CLAUDE_API_KEY="your-api-key-here"
export AGENT_THINKING_TIME="true"
export QUEUE_MODE="FIFO"
EOF

echo "⚠️  IMPORTANT: Edit ~/.claude-agents-env and add your Claude API key"
echo ""

# Install dependencies
npm install @anthropic-ai/sdk

# Create systemd service for each agent (better for 24/7 operation)
sudo tee /etc/systemd/system/claude-frontend-agent.service << 'EOF'
[Unit]
Description=Claude Frontend Agent (NETRUNNER_01)
After=network.target

[Service]
Type=simple
User=developer
WorkingDirectory=/root/agents
EnvironmentFile=/home/developer/.claude-agents-env
ExecStart=/usr/bin/node claude-agent-brain.js frontend
Restart=always
RestartSec=30
StandardOutput=append:/var/log/claude-agents/frontend.log
StandardError=append:/var/log/claude-agents/frontend-error.log

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/claude-backend-agent.service << 'EOF'
[Unit]
Description=Claude Backend Agent (DAEMON_02)
After=network.target

[Service]
Type=simple
User=developer
WorkingDirectory=/root/agents
EnvironmentFile=/home/developer/.claude-agents-env
ExecStart=/usr/bin/node claude-agent-brain.js backend
Restart=always
RestartSec=30
StandardOutput=append:/var/log/claude-agents/backend.log
StandardError=append:/var/log/claude-agents/backend-error.log

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/claude-testing-agent.service << 'EOF'
[Unit]
Description=Claude Testing Agent (GIGACHAD_420)
After=network.target

[Service]
Type=simple
User=developer
WorkingDirectory=/root/agents
EnvironmentFile=/home/developer/.claude-agents-env
ExecStart=/usr/bin/node claude-agent-brain.js testing
Restart=always
RestartSec=30
StandardOutput=append:/var/log/claude-agents/testing.log
StandardError=append:/var/log/claude-agents/testing-error.log

[Install]
WantedBy=multi-user.target
EOF

# Create log directory
sudo mkdir -p /var/log/claude-agents
sudo chown developer:developer /var/log/claude-agents

# Create PM2 alternative (for easy management)
cat > start-thoughtful-agents.sh << 'EOF'
#!/bin/bash
source ~/.claude-agents-env

# Stop any existing agents
pm2 stop NETRUNNER_01 DAEMON_02 GIGACHAD_420 2>/dev/null

# Start thoughtful agents with proper queue
pm2 start claude-agent-brain.js --name NETRUNNER_01 -- frontend
pm2 start claude-agent-brain.js --name DAEMON_02 -- backend  
pm2 start claude-agent-brain.js --name GIGACHAD_420 -- testing

# Configure PM2 to restart on reboot
pm2 save
pm2 startup

echo "✅ Thoughtful agents deployed with FIFO queue!"
echo ""
echo "📊 View status: pm2 status"
echo "📜 View logs: pm2 logs [agent-name]"
echo "🧠 Agents will think through each task step-by-step"
EOF

chmod +x start-thoughtful-agents.sh

echo "✅ Deployment scripts created!"
echo ""
echo "Next steps:"
echo "1. Edit ~/.claude-agents-env and add your API key"
echo "2. Run: ./start-thoughtful-agents.sh"
echo "3. Or use systemd: sudo systemctl start claude-frontend-agent"
echo ""
echo "The agents will now:"
echo "- Process tasks one at a time (FIFO)"
echo "- Think through each step carefully"
echo "- Take 5-10 minutes per task for quality"
echo "- Run 24/7 with automatic restarts"