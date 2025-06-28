#!/bin/bash
# Railway start script for Cloud Development Environment with Claude Code

echo "🚀 Starting Stand Up Sydney Development Environment with Claude Code..."

# Super aggressive port cleanup - FORCE port 3000 to be available
free_port_3000() {
    echo "⚡️ Aggressively freeing port 3000..."
    
    # Kill ALL node/npm processes (nuclear option)
    pkill -9 -f "node" 2>/dev/null || true
    pkill -9 -f "npm" 2>/dev/null || true
    pkill -9 -f "vite" 2>/dev/null || true
    pkill -9 -f "code-server" 2>/dev/null || true
    
    # Wait for processes to die
    sleep 3
    
    # Try to find what's using port 3000 and kill it
    for i in {1..5}; do
        if ss -tln 2>/dev/null | grep -q ":3000 " || netstat -tln 2>/dev/null | grep -q ":3000 "; then
            echo "  Attempt $i: Port 3000 still busy, killing processes..."
            # Try multiple methods to find the PID
            PORT_PID=$(ss -tlnp 2>/dev/null | grep ":3000 " | grep -o 'pid=[0-9]*' | cut -d'=' -f2 | head -1)
            if [ -z "$PORT_PID" ]; then
                PORT_PID=$(netstat -tlnp 2>/dev/null | grep ":3000 " | awk '{print $7}' | cut -d'/' -f1 | head -1)
            fi
            if [ ! -z "$PORT_PID" ] && [ "$PORT_PID" != "-" ]; then
                echo "  Killing PID $PORT_PID using port 3000"
                kill -9 "$PORT_PID" 2>/dev/null || true
            fi
            sleep 2
        else
            echo "✅ Port 3000 is now free!"
            return 0
        fi
    done
    
    echo "⚠️ Port 3000 cleanup completed"
}

# Run aggressive cleanup
free_port_3000

# Clone the Stand Up Sydney repository if not exists
if [ ! -d "/home/developer/workspace/gigpig-stage-connect" ]; then
    echo "📦 Cloning Stand Up Sydney repository..."
    cd /home/developer/workspace
    
    # Use GitHub token for private repository access
    if [ ! -z "${GITHUB_TOKEN}" ]; then
        echo "🔑 Using GitHub token for private repository access"
        git clone https://${GITHUB_TOKEN}@github.com/chillz-id/gigpig-stage-connect.git
    else
        echo "❌ GITHUB_TOKEN not found! Cannot clone private repository."
        echo "   Add GITHUB_TOKEN to Railway environment variables"
        exit 1
    fi
    
    cd gigpig-stage-connect
    npm install
    echo "✅ Repository cloned and dependencies installed"
fi

# Set up environment variables from Railway secrets
cd /home/developer/workspace/gigpig-stage-connect
cat > .env.local << EOF
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
VITE_GTM_ID=${VITE_GTM_ID}
EOF

echo "✅ Environment variables configured"

# Store Railway port and create isolated environment for code-server
RAILWAY_MAIN_PORT="$PORT"
echo "🎯 RAILWAY PORT MANAGEMENT:"
echo "  - Railway assigned PORT: $RAILWAY_MAIN_PORT (for Vite main app)"
echo "  - Code-server will be FORCED to port 8080"

# Install Claude Code if API key is provided
if [ ! -z "${ANTHROPIC_API_KEY}" ]; then
    echo "🤖 Installing Claude Code..."
    
    # Install Claude Code npm package globally
    npm install -g @anthropic-ai/claude-code@latest 2>/dev/null || {
        echo "⚠️ Claude Code npm package not available yet, installing from alternative source..."
        # Alternative installation method for research preview
        curl -fsSL https://raw.githubusercontent.com/anthropics/claude-code/main/install.sh | bash 2>/dev/null || {
            echo "ℹ️ Claude Code installer not available, setting up manual configuration..."
        }
    }
    
    # Set up Claude Code configuration directory
    mkdir -p /home/developer/.config/claude-code
    
    # Create Claude Code config file
    cat > /home/developer/.config/claude-code/config.json << EOF
{
  "api_key": "${ANTHROPIC_API_KEY}",
  "workspace": "/home/developer/workspace/gigpig-stage-connect",
  "mcp_config": "/home/developer/.mcp/config.json",
  "auto_start_mcp": true,
  "model": "claude-sonnet-4-20250514"
}
EOF
    
    echo "✅ Claude Code configuration created"
else
    echo "⚠️ ANTHROPIC_API_KEY not found - Claude Code will not be configured"
    echo "   Add ANTHROPIC_API_KEY to Railway environment variables to enable Claude Code"
fi

# Install MCP servers if not already installed
echo "🔧 Installing MCP servers..."

# Install MCP servers globally
npm install -g @anthropic-ai/mcp-server-github@latest 2>/dev/null || echo "⚠️ MCP GitHub server not available"
npm install -g @anthropic-ai/mcp-server-filesystem@latest 2>/dev/null || echo "⚠️ MCP Filesystem server not available"
npm install -g @anthropic-ai/mcp-server-supabase@latest 2>/dev/null || echo "⚠️ MCP Supabase server not available"
npm install -g @anthropic-ai/mcp-server-notion@latest 2>/dev/null || echo "⚠️ MCP Notion server not available"
npm install -g @anthropic-ai/mcp-server-metricool@latest 2>/dev/null || echo "⚠️ MCP Metricool server not available"

# Start MCP Gateway and servers if Claude Code is configured
if [ ! -z "${ANTHROPIC_API_KEY}" ]; then
    echo "🌐 Starting MCP Gateway and servers..."
    
    # Start MCP servers in background
    if command -v mcp-server-github >/dev/null 2>&1 && [ ! -z "${GITHUB_TOKEN}" ]; then
        echo "  Starting GitHub MCP server on port 3001..."
        GITHUB_TOKEN="${GITHUB_TOKEN}" mcp-server-github --port 3001 &
        MCP_GITHUB_PID=$!
    fi
    
    if command -v mcp-server-filesystem >/dev/null 2>&1; then
        echo "  Starting Filesystem MCP server on port 3002..."
        ALLOWED_DIRECTORIES="/home/developer/workspace" mcp-server-filesystem --port 3002 &
        MCP_FS_PID=$!
    fi
    
    if command -v mcp-server-supabase >/dev/null 2>&1 && [ ! -z "${VITE_SUPABASE_URL}" ]; then
        echo "  Starting Supabase MCP server on port 3003..."
        SUPABASE_URL="${VITE_SUPABASE_URL}" SUPABASE_KEY="${VITE_SUPABASE_ANON_KEY}" mcp-server-supabase --port 3003 &
        MCP_SUPABASE_PID=$!
    fi
    
    if command -v mcp-server-notion >/dev/null 2>&1 && [ ! -z "${NOTION_TOKEN}" ]; then
        echo "  Starting Notion MCP server on port 3004..."
        NOTION_TOKEN="${NOTION_TOKEN}" mcp-server-notion --port 3004 &
        MCP_NOTION_PID=$!
    fi
    
    if command -v mcp-server-metricool >/dev/null 2>&1 && [ ! -z "${METRICOOL_API_KEY}" ]; then
        echo "  Starting Metricool MCP server on port 3005..."
        METRICOOL_API_KEY="${METRICOOL_API_KEY}" mcp-server-metricool --port 3005 &
        MCP_METRICOOL_PID=$!
    fi
    
    # Wait for MCP servers to start
    sleep 5
    
    # Start MCP Gateway
    if command -v mcp-gateway >/dev/null 2>&1; then
        echo "  Starting MCP Gateway on port 8000..."
        mcp-gateway --config /home/developer/.mcp/config.json --port 8000 &
        MCP_GATEWAY_PID=$!
    else
        echo "⚠️ MCP Gateway not available, Claude Code will work in direct mode"
    fi
    
    echo "✅ MCP infrastructure started"
fi

# Remove ALL existing code-server data that might interfere
rm -rf /home/developer/.config/code-server/ 2>/dev/null || true
rm -rf /home/developer/.local/share/code-server/ 2>/dev/null || true
rm -rf /home/developer/.cache/code-server/ 2>/dev/null || true

echo "🧹 Removed all existing code-server configurations"

# Create explicit code-server config that FORCES port 8080
mkdir -p /home/developer/.config/code-server
cat > /home/developer/.config/code-server/config.yaml << EOF
bind-addr: 0.0.0.0:8080
auth: password
password: ${PASSWORD:-StandUpSydney2025}
cert: false
disable-telemetry: true
disable-update-check: true
disable-workspace-trust: true
EOF

echo "📝 Created explicit code-server config forcing port 8080:"
cat /home/developer/.config/code-server/config.yaml

# FIRST: Start Vite on Railway's main port (3000) BEFORE code-server
echo "🎭 PRIORITY: Starting Vite on Railway's main port $RAILWAY_MAIN_PORT FIRST..."
cd /home/developer/workspace/gigpig-stage-connect

# Ensure PORT is set for Vite
export PORT="$RAILWAY_MAIN_PORT"
export VITE_PORT="$RAILWAY_MAIN_PORT"

echo "Running: npm run dev -- --host 0.0.0.0 --port $RAILWAY_MAIN_PORT --strictPort"
npm run dev -- --host 0.0.0.0 --port $RAILWAY_MAIN_PORT --strictPort &

VITE_PID=$!
echo "✅ Vite started with PID: $VITE_PID on port $RAILWAY_MAIN_PORT"

# Wait for Vite to claim port 3000
sleep 8

# FIXED: More flexible Vite port verification
echo "🔍 Verifying Vite is listening on port $RAILWAY_MAIN_PORT..."

# Try multiple verification methods
VITE_VERIFIED=false

# Method 1: Check with ss (more reliable)
if ss -tln 2>/dev/null | grep -q ":${RAILWAY_MAIN_PORT}\b"; then
    echo "✅ SUCCESS! Vite confirmed on port $RAILWAY_MAIN_PORT (via ss)"
    VITE_VERIFIED=true
# Method 2: Check with netstat
elif netstat -tln 2>/dev/null | grep -q ":${RAILWAY_MAIN_PORT}\b"; then
    echo "✅ SUCCESS! Vite confirmed on port $RAILWAY_MAIN_PORT (via netstat)"
    VITE_VERIFIED=true
# Method 3: Check if process is still running and listening
elif kill -0 $VITE_PID 2>/dev/null; then
    echo "✅ Vite process is running (PID: $VITE_PID), assuming port is claimed"
    VITE_VERIFIED=true
fi

if [ "$VITE_VERIFIED" = false ]; then
    echo "❌ CRITICAL: Vite verification failed on port $RAILWAY_MAIN_PORT"
    echo "🔍 Debug info - Current listening ports:"
    ss -tln 2>/dev/null | head -10 || netstat -tln 2>/dev/null | head -10
    echo "🔍 Vite process status:"
    if kill -0 $VITE_PID 2>/dev/null; then
        echo "  Vite PID $VITE_PID is still running"
    else
        echo "  Vite PID $VITE_PID has died"
    fi
    exit 1
fi

# NOW start code-server with COMPLETELY isolated environment
echo "🖥️ NOW starting code-server on isolated port 8080..."

# Create completely isolated environment for code-server
# Remove ALL environment variables that might affect port selection
env -i \
    HOME=/home/developer \
    USER=developer \
    PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    PASSWORD="${PASSWORD:-StandUpSydney2025}" \
    ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}" \
    code-server \
    --config /home/developer/.config/code-server/config.yaml \
    /home/developer/workspace &

VSCODE_PID=$!
echo "✅ Code-server started with PID: $VSCODE_PID (using config file for port 8080)"

# Wait for code-server to start with config
sleep 12

# Verification
echo "🔍 Final verification:"

# Check Vite on 3000 (using improved logic)
if ss -tln 2>/dev/null | grep -q ":${RAILWAY_MAIN_PORT}\b" || netstat -tln 2>/dev/null | grep -q ":${RAILWAY_MAIN_PORT}\b"; then
    echo "✅ Vite confirmed on port $RAILWAY_MAIN_PORT"
else
    echo "❌ Vite NOT on port $RAILWAY_MAIN_PORT"
fi

# Check code-server on 8080 (using improved logic)
if ss -tln 2>/dev/null | grep -q ":8080\b" || netstat -tln 2>/dev/null | grep -q ":8080\b"; then
    echo "✅ Code-server confirmed on port 8080"
else
    echo "❌ Code-server NOT on port 8080"
    echo "📊 Current listening ports:"
    ss -tln 2>/dev/null | head -10 || netstat -tln 2>/dev/null | head -10
fi

# Check MCP Gateway if running
if [ ! -z "${MCP_GATEWAY_PID}" ] && kill -0 $MCP_GATEWAY_PID 2>/dev/null; then
    if ss -tln 2>/dev/null | grep -q ":8000\b" || netstat -tln 2>/dev/null | grep -q ":8000\b"; then
        echo "✅ MCP Gateway confirmed on port 8000"
    else
        echo "❌ MCP Gateway NOT on port 8000"
    fi
fi

# Final process verification
if kill -0 $VITE_PID 2>/dev/null && kill -0 $VSCODE_PID 2>/dev/null; then
    echo ""
    echo "🎉 SUCCESS! BOTH SERVICES RUNNING ON CORRECT PORTS!"
    echo "🎪 Stand Up Sydney (Main App): https://gigpig-stage-connect-production.up.railway.app (port $RAILWAY_MAIN_PORT)"
    echo "🖥️ VS Code (Development): https://gigpig-stage-connect-production.up.railway.app:8080"  
    echo "🔒 VS Code Password: ${PASSWORD:-StandUpSydney2025}"
    
    if [ ! -z "${ANTHROPIC_API_KEY}" ]; then
        echo "🤖 Claude Code: Ready! (Use 'claude-code' command in VS Code terminal)"
        echo "🌐 MCP Gateway: http://localhost:8000 (if running)"
    else
        echo "⚠️ Claude Code: Not configured (missing ANTHROPIC_API_KEY)"
    fi
    
    echo ""
    echo "📊 Final port assignments:"
    ss -tln 2>/dev/null | grep -E ":(3000|8080|8000)\b" || netstat -tln 2>/dev/null | grep -E ":(3000|8080|8000)\b" || echo "Cannot show port info"
else
    echo "❌ Process verification failed"
    exit 1
fi

# Monitor processes and keep container alive
echo "👀 Monitoring services..."
while true; do
    if ! kill -0 $VITE_PID 2>/dev/null; then
        echo "💀 Vite process died! Container will exit..."
        exit 1
    fi
    if ! kill -0 $VSCODE_PID 2>/dev/null; then
        echo "💀 Code-server process died! Container will exit..."
        exit 1
    fi
    sleep 30
done
