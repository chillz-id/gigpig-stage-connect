# 🚀 Phase 1 Deployment Guide - Stand Up Sydney MCP Infrastructure

## What We've Created

### 📁 Files Ready for Deployment:
1. **setup-standupsydney-mcp.sh** - Main setup script
2. **.env.template** - Environment variables template  
3. **nginx-standupsydney.conf** - Nginx configuration
4. **ecosystem.config.js** - PM2 process management

## 🔧 Phase 1 Implementation Steps

### Step 1: Clone Repository to Droplet
```bash
# SSH into your droplet
ssh root@170.64.252.55

# Clone the repository
cd /root
git clone https://github.com/chillz-id/gigpig-stage-connect.git
cd gigpig-stage-connect/droplet-setup
```

### Step 2: Execute Setup Script
```bash
# Make script executable
chmod +x setup-standupsydney-mcp.sh

# Run the setup script (this covers Phases 1-4)
./setup-standupsydney-mcp.sh
```

### Step 3: Configure Environment Variables
```bash
# Copy template to proper location
cp .env.template /opt/services/fastmcp/.env

# Edit the environment file with your actual values
nano /opt/services/fastmcp/.env
```

### Step 4: Setup Nginx Configuration
```bash
# Copy nginx config
sudo cp nginx-standupsydney.conf /etc/nginx/sites-available/standupsydney
sudo ln -s /etc/nginx/sites-available/standupsydney /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Copy PM2 Configuration
```bash
# Copy PM2 ecosystem config
cp ecosystem.config.js /opt/services/
```

## 🎯 Expected Results After Phase 1

✅ **System Dependencies Installed:**
- Python 3.11 + pip + venv
- Node.js + npm + PM2
- Nginx web server
- Git, curl, wget, certbot
- UFW firewall configured

✅ **Directory Structure Created:**
```
/opt/services/
├── fastmcp/
│   ├── logs/
│   ├── config/
│   ├── tools/
│   └── venv/
├── n8n/
└── nginx/
```

✅ **Security Configuration:**
- UFW firewall enabled (SSH, HTTP, HTTPS only)
- System updated to latest packages

✅ **Services Prepared:**
- FastMCP Python environment ready
- N8N automation platform installed
- PM2 process manager ready

## 🔍 Verification Commands

```bash
# Check Python version
python3.11 --version

# Check Node.js and PM2
node --version
pm2 --version

# Check firewall status
sudo ufw status

# Verify directory structure
ls -la /opt/services/

# Check if FastMCP venv was created
ls -la /opt/services/fastmcp/venv/
```

## ⚠️ Prerequisites You Need

Before continuing to Phase 2, please ensure you have:

1. **Supabase Project URL and Anon Key**
2. **GitHub Personal Access Token**
3. **Notion Integration Token**
4. **Notion Database IDs** (Events & Comedians)
5. **Metricool API Key**

## 🚦 Phase 1 Status Check

After running the setup script, you should see:
- ✅ Phase 1 Complete - System Setup Done
- ✅ Phase 2 Complete - Directories Created  
- ✅ Phase 3 Complete - FastMCP Environment Ready
- ✅ Phase 4 Complete - N8N Installed

## 📋 Ready for Phase 2

Once Phase 1 is complete and verified, we'll move to:
- **Phase 2:** FastMCP Server Implementation
- **Phase 3:** N8N Integration & Testing
- **Phase 4:** SSL Configuration & Claude Code Integration

---

**Status:** Ready to deploy Phase 1! 🎭

## 🚀 Quick Deploy Commands

```bash
# One-liner to get started:
ssh root@170.64.252.55 "cd /root && git clone https://github.com/chillz-id/gigpig-stage-connect.git && cd gigpig-stage-connect/droplet-setup && chmod +x setup-standupsydney-mcp.sh && ./setup-standupsydney-mcp.sh"
```