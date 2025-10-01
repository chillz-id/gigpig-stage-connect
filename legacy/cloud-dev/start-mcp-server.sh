#!/bin/bash
# MCP Server Hosting Script for Railway

echo "🔌 Starting MCP Server Host..."

# Create MCP directory
mkdir -p /home/developer/mcp-servers

# Install MCP servers
echo "📦 Installing MCP servers..."
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @supabase/mcp-server-supabase

# Create MCP gateway script
cat > /home/developer/mcp-servers/gateway.js << 'EOF'
const express = require('express');
const { spawn } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'MCP Gateway healthy', timestamp: new Date().toISOString() });
});

// Filesystem MCP proxy
app.post('/mcp/filesystem', (req, res) => {
  const { method, params } = req.body;
  
  const mcp = spawn('npx', [
    '@modelcontextprotocol/server-filesystem',
    process.env.MCP_WORKSPACE || '/home/developer/workspace'
  ]);
  
  mcp.stdin.write(JSON.stringify({ method, params }) + '\n');
  
  let response = '';
  mcp.stdout.on('data', (data) => {
    response += data.toString();
  });
  
  mcp.on('close', () => {
    try {
      res.json(JSON.parse(response));
    } catch (e) {
      res.status(500).json({ error: 'MCP execution failed' });
    }
  });
});

// Supabase MCP proxy
app.post('/mcp/supabase', (req, res) => {
  const { method, params } = req.body;
  
  const mcp = spawn('npx', [
    '@supabase/mcp-server-supabase',
    '--access-token', process.env.SUPABASE_TOKEN || ''
  ]);
  
  mcp.stdin.write(JSON.stringify({ method, params }) + '\n');
  
  let response = '';
  mcp.stdout.on('data', (data) => {
    response += data.toString();
  });
  
  mcp.on('close', () => {
    try {
      res.json(JSON.parse(response));
    } catch (e) {
      res.status(500).json({ error: 'Supabase MCP execution failed' });
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔌 MCP Gateway running on port ${PORT}`);
});
EOF

# Install express for MCP gateway
cd /home/developer/mcp-servers
npm init -y
npm install express

echo "✅ MCP servers ready"