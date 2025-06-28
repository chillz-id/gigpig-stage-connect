#!/bin/bash
# Railway start script for Claude Code + MCP environment

echo "🚀 Starting Stand Up Sydney Development Environment..."

# Start MCP servers in background
echo "📡 Starting MCP servers..."

# GitHub MCP Server
mcp-server-github --port 3001 &

# Filesystem MCP Server  
mcp-server-filesystem --port 3002 &

# Notion MCP Server (if available)
# mcp-server-notion --port 3003 &

# Wait for MCP servers to start
sleep 5

# Clone the Stand Up Sydney repository if not exists
if [ ! -d "/home/developer/workspace/gigpig-stage-connect" ]; then
    echo "📂 Cloning Stand Up Sydney repository..."
    cd /home/developer/workspace
    git clone https://github.com/chillz-id/gigpig-stage-connect.git
    cd gigpig-stage-connect
    npm install
fi

# Set up environment variables from Railway secrets
cd /home/developer/workspace/gigpig-stage-connect
cat > .env.local << EOF
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
VITE_GTM_ID=${VITE_GTM_ID}
EOF

# Start code-server (VSCode in browser)
echo "💻 Starting code-server on port 8080..."
code-server \
    --bind-addr 0.0.0.0:8080 \
    --auth password \
    --password ${PASSWORD:-standupdev2025} \
    --disable-telemetry \
    /home/developer/workspace &

# Start the development server
cd /home/developer/workspace/gigpig-stage-connect
echo "🎭 Starting Stand Up Sydney dev server on port 3000..."
npm run dev -- --host 0.0.0.0 --port 3000 &

echo "✅ All services started!"
echo "🌐 VSCode: https://your-app.railway.app:8080"
echo "🎪 Stand Up Sydney: https://your-app.railway.app:3000"

# Keep container running
wait