# Railway Multi-Service Setup Guide

## 🚀 Services Overview

This repository is configured for **two separate Railway services**:

### 1. **dev-preview** (Node.js/Vite Frontend)
- **Type**: Node.js buildpack
- **Purpose**: Vite development server for frontend preview
- **Configuration**: Root directory with `package.json`
- **Port**: Uses Railway's assigned `$PORT`
- **URL**: Accessible via Railway-generated domain

### 2. **claude-cde** (Cloud Development Environment)
- **Type**: Docker container
- **Purpose**: VS Code in browser for cloud development
- **Configuration**: Uses `cloud-dev/Dockerfile`
- **Port**: Uses Railway's assigned `$PORT`
- **Authentication**: Password: `standupdev2025`

## 🔧 Railway Setup Instructions

### Initial Setup
1. **Connect Repository**: Link this GitHub repo to Railway
2. **Create Services**: Railway should detect both service configurations
3. **Deploy Services**: Both services deploy independently

### Service Configuration

#### For dev-preview service:
```toml
buildCommand = "npm install"
startCommand = "npm run dev -- --host 0.0.0.0 --port $PORT"
```

#### For claude-cde service:
```toml
dockerfilePath = "cloud-dev/Dockerfile"
rootDirectory = "cloud-dev"
```

## 🔗 Access Points

- **Dev Preview**: `https://[dev-preview-service].railway.app`
- **Cloud IDE**: `https://[claude-cde-service].railway.app`
  - Login with password: `standupdev2025`
  - Workspace: `/home/developer/workspace`

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start dev server locally
npm run dev

# Build for production
npm run build
```

## 📁 Directory Structure

```
gigpig-stage-connect/
├── cloud-dev/           # CDE Docker setup
│   ├── Dockerfile       # VS Code container
│   ├── start-clean.sh   # CDE startup script
│   └── start-simple.sh  # Alternative startup
├── src/                 # Frontend source
├── public/              # Static assets
├── package.json         # Node.js dependencies
├── railway.toml         # Multi-service config
└── README.md           # This file
```

## 🔄 Deployment Workflow

1. **Push to GitHub** → Triggers Railway deployments
2. **Frontend changes** → Updates dev-preview service
3. **CDE changes** → Updates claude-cde service
4. **Both services** → Deploy independently

---

*Last updated: June 2025*
