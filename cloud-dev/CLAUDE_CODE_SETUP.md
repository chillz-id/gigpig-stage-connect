# Claude Code + Cloud Development Environment Setup Guide

## 🚀 What You Now Have

Your Railway Cloud Development Environment now includes:
- ✅ **VSCode in browser** (accessible via Railway URL)
- ✅ **Stand Up Sydney dev server** (port 3000)
- ✅ **Claude Code support** (when configured)
- ✅ **Git integration** with automatic cloning
- ✅ **Environment variable management**

## 🤖 Setting Up Claude Code

### Step 1: Get Access to Claude Code
Since Claude Code is in research preview:
1. Visit [Anthropic's website](https://www.anthropic.com) 
2. Check for Claude Code availability or sign up for research preview
3. Obtain your **Anthropic API Key**

### Step 2: Configure Railway Environment Variables
Add these environment variables in your Railway dashboard:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GTM_ID=your_gtm_id
PASSWORD=your_preferred_vscode_password
```

### Step 3: Install Claude Code in Your Cloud Environment
Once your environment restarts with the API key:

1. Access your Railway URL (VSCode in browser)
2. Open the terminal in VSCode
3. Install Claude Code manually if needed:
```bash
# This will be handled automatically by the startup script
# if ANTHROPIC_API_KEY is configured
```

## 🎭 Claude Code Usage Examples for Stand Up Sydney

### Comedian Management Features
```bash
# Add new comedian features
claude "Create a comedian profile component with name, bio, and social links"

# Enhance booking system
claude "Add availability checking to the comedian booking workflow"

# Create database schemas
claude "Generate Supabase table schema for comedian event bookings"
```

### Event Management
```bash
# Event lineup automation
claude "Create an event lineup builder with drag-and-drop comedian ordering"

# Ticket integration
claude "Add ticket price calculation based on comedian popularity and venue size"

# Calendar integration
claude "Integrate Google Calendar API for event scheduling"
```

### Automation & Workflows
```bash
# N8N integration prep
claude "Create webhook endpoints for N8N automation workflows"

# Notification system
claude "Build email notification system for comedian booking confirmations"

# Payment processing
claude "Add Stripe integration for comedian payout processing"
```

### Debugging & Optimization
```bash
# Fix issues
claude "Debug the Supabase authentication error in the login component"

# Performance improvements
claude "Optimize the comedian search functionality for better performance"

# Testing
claude "Create comprehensive unit tests for the booking system"
```

## 🛠️ Your Complete Development Workflow

### Traditional Approach:
```
1. Think of feature
2. Research implementation
3. Write code manually
4. Debug manually
5. Test manually
6. Deploy
```

### With Claude Code:
```
1. Think of feature
2. Ask Claude: "claude 'implement comedian search with filters'"
3. Review Claude's implementation
4. Test and iterate
5. Deploy
```

## 🌐 Access Your Environment

- **VSCode**: `https://your-railway-url.railway.app`
- **Stand Up Sydney**: `https://your-railway-url.railway.app:3000`
- **Terminal**: Available within VSCode browser interface

## 🔧 Troubleshooting

### Claude Code Not Working?
1. Check `ANTHROPIC_API_KEY` is set in Railway environment
2. Restart your Railway deployment
3. Check startup logs for Claude Code initialization

### VSCode Access Issues?
- Default password: `standupdev2025`
- Check Railway logs for actual password
- Ensure port 8080 is accessible

### Development Server Issues?
- Check port 3000 is running
- Verify environment variables are set
- Check npm install completed successfully

## 🎯 Next Steps

1. **Deploy your updated environment** (should auto-deploy from commits)
2. **Add ANTHROPIC_API_KEY** to Railway environment variables
3. **Access your cloud development environment**
4. **Start building with AI assistance!**

### Example First Commands:
```bash
# In your cloud VSCode terminal:
cd /home/developer/workspace/gigpig-stage-connect

# Try Claude Code:
claude "Explain the current project structure"
claude "Add TypeScript interfaces for comedian data"
claude "Create a simple comedian directory component"
```

---

🎭 **Your Stand Up Sydney platform is now powered by AI-driven development in the cloud!**