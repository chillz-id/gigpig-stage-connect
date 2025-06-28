#!/bin/bash
# Railway start script for Cloud Development Environment with Claude Code

echo "🚀 Starting Stand Up Sydney Development Environment with Claude Code..."

# Function to find an available port
find_available_port() {
    local base_port=$1
    local max_attempts=${2:-10}
    
    for ((i=0; i<max_attempts; i++)); do
        local test_port=$((base_port + i))
        if ! netstat -tln 2>/dev/null | grep -q ":${test_port} "; then
            echo $test_port
            return 0
        fi
    done
    
    echo "No available port found starting from $base_port" >&2
    return 1
}

# Aggressive cleanup function
cleanup_processes() {
    echo "🧹 Aggressively cleaning up existing processes..."
    
    # Kill all node processes
    pkill -9 -f "node" 2>/dev/null || true
    
    # Kill all npm processes  
    pkill -9 -f "npm" 2>/dev/null || true
    
    # Kill all vite processes
    pkill -9 -f "vite" 2>/dev/null || true
    
    # Kill code-server processes
    pkill -9 -f "code-server" 2>/dev/null || true
    
    # Wait for processes to die
    sleep 3
    
    echo "✅ Process cleanup complete"
}

# Run aggressive cleanup first
cleanup_processes

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

# Set password for code-server via environment variable
export PASSWORD="${PASSWORD:-StandUpSydney2025}"

# Find available ports
VSCODE_PORT=$(find_available_port 8080)
VITE_PORT=$(find_available_port 3000)

if [ -z "$VSCODE_PORT" ] || [ -z "$VITE_PORT" ]; then
    echo "❌ Could not find available ports!"
    exit 1
fi

echo "📍 Using ports: VS Code=$VSCODE_PORT, Vite=$VITE_PORT"

# Start VS Code in background with dynamic port
echo "🖥️ Starting code-server on port $VSCODE_PORT..."
code-server \
    --bind-addr 0.0.0.0:$VSCODE_PORT \
    --auth password \
    --disable-telemetry \
    /home/developer/workspace &

VSCODE_PID=$!

# Give VS Code time to start
sleep 5

# Start the Vite development server with dynamic port
echo "🎭 Starting Stand Up Sydney dev server on port $VITE_PORT..."
cd /home/developer/workspace/gigpig-stage-connect

# Force Vite to use our chosen port
VITE_DEV_COMMAND="npm run dev -- --host 0.0.0.0 --port $VITE_PORT --strictPort"
echo "Running: $VITE_DEV_COMMAND"

$VITE_DEV_COMMAND &
VITE_PID=$!

# Wait and verify Vite started successfully
sleep 5

if kill -0 $VITE_PID 2>/dev/null; then
    echo "✅ Vite started successfully on port $VITE_PORT (PID: $VITE_PID)"
else
    echo "❌ Vite failed to start!"
    # Try to get any error output
    wait $VITE_PID
    exit 1
fi

if kill -0 $VSCODE_PID 2>/dev/null; then
    echo "✅ VS Code started successfully on port $VSCODE_PORT (PID: $VSCODE_PID)"
else
    echo "⚠️  VS Code may not have started properly"
fi

echo ""
echo "🎉 All services started successfully!"
echo "🌐 VS Code: Access via Railway URL:$VSCODE_PORT"  
echo "🎪 Stand Up Sydney: Access via Railway URL:$VITE_PORT"
echo "🔒 VS Code Password: ${PASSWORD}"

# Configure Claude Code if API key is provided
if [ ! -z "${ANTHROPIC_API_KEY}" ]; then
    echo "🤖 Claude Code: Ready for AI-powered development!"
    echo "   Example: claude 'Add comedian search functionality'"
    export ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    mkdir -p /home/developer/.config/claude-code
else
    echo "💡 To enable Claude Code, add ANTHROPIC_API_KEY to Railway environment"
fi

# Keep container running and monitor processes
while true; do
    if ! kill -0 $VITE_PID 2>/dev/null; then
        echo "❌ Vite process died! Exiting..."
        exit 1
    fi
    sleep 30
done