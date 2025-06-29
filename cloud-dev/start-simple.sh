#!/bin/bash
# Simplified Railway start script for Cloud Development Environment

echo "🚀 Starting Stand Up Sydney Development Environment..."

# Simple port cleanup - just kill existing processes
echo "🧹 Cleaning up any existing processes..."
pkill -f "node" 2>/dev/null || true
pkill -f "npm" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "code-server" 2>/dev/null || true
sleep 2

# Clone repository if needed
if [ ! -d "/home/developer/workspace/gigpig-stage-connect" ]; then
    echo "📦 Cloning Stand Up Sydney repository..."
    cd /home/developer/workspace
    
    if [ ! -z "${GITHUB_TOKEN}" ]; then
        echo "🔑 Using GitHub token for private repository access"
        git clone https://${GITHUB_TOKEN}@github.com/chillz-id/gigpig-stage-connect.git
        cd gigpig-stage-connect
        npm install
        echo "✅ Repository cloned and dependencies installed"
    else
        echo "❌ GITHUB_TOKEN not found! Cannot clone private repository."
        exit 1
    fi
fi

# Set up environment variables
cd /home/developer/workspace/gigpig-stage-connect
cat > .env.local << EOF
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
VITE_GTM_ID=${VITE_GTM_ID}
EOF

echo "✅ Environment variables configured"

# Configure Claude Code if API key is provided
if [ ! -z "${ANTHROPIC_API_KEY}" ]; then
    echo "🤖 Setting up Claude Code configuration..."
    mkdir -p /home/developer/.config/claude-code
    
    cat > /home/developer/.config/claude-code/config.json << EOF
{
  "api_key": "${ANTHROPIC_API_KEY}",
  "workspace": "/home/developer/workspace/gigpig-stage-connect",
  "model": "claude-sonnet-4-20250514"
}
EOF
    
    cat > /usr/local/bin/claude-code << 'EOF'
#!/bin/bash
if [ ! -z "${ANTHROPIC_API_KEY}" ]; then
    echo "🤖 Claude Code would run here with: $*"
    echo "💡 Claude Code is configured but the CLI tool is still in research preview"
    echo "🔗 Use Claude Web interface for now: https://claude.ai"
else
    echo "❌ ANTHROPIC_API_KEY not set"
fi
EOF
    chmod +x /usr/local/bin/claude-code
    echo "✅ Claude Code configuration created"
fi

# Set up code-server config
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

echo "📝 Code-server config created"

# Start Vite dev server
echo "🎭 Starting Vite development server..."
cd /home/developer/workspace/gigpig-stage-connect

# Use Railway's PORT for Vite, fallback to 3000
VITE_PORT="${PORT:-3000}"
export PORT="$VITE_PORT"

echo "Running: npm run dev -- --host 0.0.0.0 --port $VITE_PORT"
npm run dev -- --host 0.0.0.0 --port $VITE_PORT &
VITE_PID=$!

echo "✅ Vite started with PID: $VITE_PID on port $VITE_PORT"

# Start code-server on port 8080
echo "🖥️ Starting code-server on port 8080..."
code-server --config /home/developer/.config/code-server/config.yaml /home/developer/workspace &
VSCODE_PID=$!

echo "✅ Code-server started with PID: $VSCODE_PID"

# Give services time to start
sleep 10

# Simple success message
echo ""
echo "🎉 DEVELOPMENT ENVIRONMENT READY!"
echo "🎪 Your App (Development): http://localhost:$VITE_PORT"
echo "🖥️ VS Code: http://localhost:8080"
echo "🔒 VS Code Password: ${PASSWORD:-StandUpSydney2025}"

if [ ! -z "${ANTHROPIC_API_KEY}" ]; then
    echo "🤖 Claude Code: Ready (use 'claude-code' command in terminal)"
fi

echo ""
echo "✨ Happy coding! Both services are running."

# Simple monitoring - just keep container alive
while true; do
    # Only exit if BOTH processes die (which would be unexpected)
    if ! kill -0 $VITE_PID 2>/dev/null && ! kill -0 $VSCODE_PID 2>/dev/null; then
        echo "💀 Both services died - exiting..."
        exit 1
    fi
    sleep 30
done
