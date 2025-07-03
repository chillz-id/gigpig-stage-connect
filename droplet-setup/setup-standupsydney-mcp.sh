#!/bin/bash
# setup-standupsydney-mcp.sh
# Stand Up Sydney MCP Infrastructure Setup Script

set -e  # Exit on any error

echo "🎭 Setting up Stand Up Sydney MCP Infrastructure..."

# Phase 1: System Setup & Security
echo "📦 Phase 1: System Setup..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install base dependencies
sudo apt install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    nodejs \
    npm \
    nginx \
    git \
    curl \
    wget \
    unzip \
    ufw \
    certbot \
    python3-certbot-nginx

# Install PM2 globally
sudo npm install -g pm2

# Setup firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable

echo "✅ Phase 1 Complete - System Setup Done"

# Phase 2: Directory Structure
echo "📁 Phase 2: Creating Directory Structure..."

# Create service directories
sudo mkdir -p /opt/services/{fastmcp,n8n,nginx}
sudo chown -R $USER:$USER /opt/services

# Create FastMCP project structure
cd /opt/services/fastmcp
mkdir -p {logs,config,tools}

echo "✅ Phase 2 Complete - Directories Created"

# Phase 3: FastMCP Server Setup
echo "🐍 Phase 3: Setting up FastMCP Server..."

# Create virtual environment
cd /opt/services/fastmcp
python3.11 -m venv venv
source venv/bin/activate

# Install FastMCP and dependencies
pip install --upgrade pip
pip install fastmcp httpx psycopg2-binary python-dotenv asyncio aiofiles

# Install Playwright
pip install playwright
playwright install

echo "✅ Phase 3 Complete - FastMCP Environment Ready"

# Phase 4: N8N Setup  
echo "🔄 Phase 4: Setting up N8N..."

cd /opt/services/n8n
npm init -y
npm install n8n

# Create N8N environment file
cat > .env << 'EOF'
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:5678
EOF

echo "✅ Phase 4 Complete - N8N Installed"

echo "🎉 Basic setup complete! Ready for FastMCP server code..."
