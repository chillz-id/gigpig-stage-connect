# Claude Code Setup Guide

## 🚀 Getting Claude Code Running

Once your Railway deployment restarts with the updated script, you'll have Claude Code properly installed and configured!

## 📋 Required Environment Variables

Make sure these are set in your Railway environment variables:

### Essential (for Claude Code):
- `ANTHROPIC_API_KEY` - Your Claude API key from Anthropic

### Optional (for MCP integrations):
- `GITHUB_TOKEN` - For GitHub MCP server
- `NOTION_TOKEN` - For Notion MCP server  
- `METRICOOL_API_KEY` - For Metricool MCP server
- `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` - Already configured

## 🖥️ Using Claude Code in VS Code

1. **Access VS Code**: Go to `https://your-railway-domain:8080`
2. **Open Terminal**: In VS Code, open a new terminal (Terminal → New Terminal)
3. **Use Claude Code**: Run commands like:

```bash
# Basic Claude Code commands
claude-code help

# Ask Claude to help with your project
claude-code "Help me understand the project structure"

# Get Claude to write code
claude-code "Create a new React component for user authentication"

# Get Claude to debug issues
claude-code "Why is my Vite build failing?"
```

## 🌐 MCP Integration

The script will automatically:
- Install and start MCP servers for GitHub, Supabase, Notion, etc.
- Start an MCP Gateway on port 8000
- Configure Claude Code to use these tools

## 🔧 Troubleshooting

### If Claude Code command not found:
```bash
# Check if it's installed
which claude-code

# Install manually if needed
npm install -g @anthropic-ai/claude-code@latest
```

### If MCP servers aren't working:
```bash
# Check what's running on MCP ports
ss -tln | grep -E ":(300[1-5]|8000)"

# Restart MCP gateway manually
cd /home/developer
mcp-gateway --config .mcp/config.json --port 8000
```

### If Claude Code can't connect:
```bash
# Check Claude Code config
cat ~/.config/claude-code/config.json

# Test API key
echo $ANTHROPIC_API_KEY
```

## 🎯 What This Gets You

With Claude Code + MCP, you can:
- 📁 **File Operations**: "Read all the React components and suggest improvements"
- 🗃️ **Database**: "Check the Supabase schema and create a new table"
- 📝 **Notion**: "Update the project roadmap in Notion"
- 📊 **Analytics**: "Get our latest social media metrics from Metricool"
- 💻 **GitHub**: "Create a PR with the changes we just made"

## 🚀 Next Steps

1. Add your `ANTHROPIC_API_KEY` to Railway environment variables
2. Redeploy (Railway will use the new script)
3. Access VS Code and start using Claude Code!

---

*This setup integrates Claude Code with your entire development workflow through MCP (Model Context Protocol), giving Claude access to your files, databases, and external services.*
