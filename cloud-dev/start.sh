#!/bin/bash
# Railway start script for Cloud Development Environment with Claude Code

echo "🚀 Starting Stand Up Sydney Development Environment with Claude Code..."

# Super aggressive port cleanup - FORCE port 3000 to be available
free_port_3000() {
    echo "⚔️ Aggressively freeing port 3000..."
    
    # Kill ALL node/npm processes (nuclear option)
    pkill -9 -f "node" 2>/dev/null || true
    pkill -9 -f "npm" 2>/dev/null || true
    pkill -9 -f "vite" 2>/dev/null || true
    
    # Wait for processes to die
    sleep 2
    
    # Try to find what's using port 3000 and kill it
    for i in {1..5}; do
        if netstat -tln 2>/dev/null | grep -q ":3000 "; then
            echo "  Attempt $i: Port 3000 still busy, killing processes..."
            # Try to find the PID using port 3000
            PORT_PID=$(netstat -tlnp 2>/dev/null | grep ":3000 " | awk '{print $7}' | cut -d'/' -f1 | head -1)
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
    
    # If still busy, try fuser (if available)
    if command -v fuser >/dev/null 2>&1; then
        echo "  Using fuser to kill port 3000..."
        fuser -k 3000/tcp 2>/dev/null || true
        sleep 2
    fi
    
    echo "⚠️ Port 3000 cleanup completed (may still be busy)"
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

# CRITICAL FIX: Preserve PORT for code-server, use separate variables for Vite
# Store the original PORT value for code-server
CODE_SERVER_PORT="${PORT:-8080}"
export CODE_SERVER_PASSWORD="${PASSWORD:-StandUpSydney2025}"

echo "🔧 PORT ISOLATION:"
echo "  - Code-server will use: $CODE_SERVER_PORT"
echo "  - Vite will use: 3000"

# Start VS Code on the preserved port (8080) - BEFORE changing PORT variable
echo "🖥️ Starting code-server on port $CODE_SERVER_PORT..."
code-server \
    --bind-addr 0.0.0.0:${CODE_SERVER_PORT} \
    --auth password \
    --disable-telemetry \
    /home/developer/workspace &

VSCODE_PID=$!
echo "VS Code started with PID: $VSCODE_PID on port: $CODE_SERVER_PORT"

# Give VS Code time to start and bind to its port
sleep 5

# NOW set environment variables for Vite (after code-server is running)
echo "🎯 Setting Vite-specific environment variables..."
export PORT=3000
export VITE_PORT=3000

# Final port 3000 check before starting Vite
if netstat -tln 2>/dev/null | grep -q ":3000 "; then
    echo "⚠️ Port 3000 is STILL busy! Trying emergency cleanup..."
    free_port_3000
fi

# Start Vite with FORCED port 3000
echo "🎭 FORCING Stand Up Sydney dev server to start on port 3000..."
cd /home/developer/workspace/gigpig-stage-connect

# Use strictPort to make Vite fail if port 3000 is not available
echo "Running: npm run dev -- --host 0.0.0.0 --port 3000 --strictPort"
npm run dev -- --host 0.0.0.0 --port 3000 --strictPort &

VITE_PID=$!
echo "Vite started with PID: $VITE_PID"

# Wait and verify both services
sleep 8

# Check if Vite actually started
if kill -0 $VITE_PID 2>/dev/null; then
    # Double-check that something is actually listening on port 3000
    if netstat -tln 2>/dev/null | grep -q ":3000 "; then
        echo "✅ SUCCESS! Vite is running on port 3000 (PID: $VITE_PID)"
    else
        echo "❌ Vite PID exists but port 3000 is not listening!"
        exit 1
    fi
else
    echo "❌ CRITICAL ERROR: Vite failed to start on port 3000!"
    echo "This means something else is stubbornly holding port 3000."
    
    # Show what's using port 3000
    echo "Processes using port 3000:"
    netstat -tlnp 2>/dev/null | grep ":3000" || echo "No processes found using port 3000"
    
    exit 1
fi

# Check VS Code
if kill -0 $VSCODE_PID 2>/dev/null; then
    echo "✅ VS Code is running on port $CODE_SERVER_PORT (PID: $VSCODE_PID)"
else
    echo "⚠️ VS Code may not have started properly"
fi

echo ""
echo "🎉 ALL SERVICES SUCCESSFULLY STARTED!"
echo "🎪 Stand Up Sydney: https://your-railway-url.app (port 3000)"
echo "🌐 VS Code: https://your-railway-url.app:$CODE_SERVER_PORT"  
echo "🔒 VS Code Password: ${CODE_SERVER_PASSWORD}"

# Configure Claude Code if API key is provided
if [ ! -z "${ANTHROPIC_API_KEY}" ]; then
    echo "🤖 Claude Code: Ready for AI-powered development!"
    echo "   Example: claude 'Add comedian search functionality'"
    export ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    mkdir -p /home/developer/.config/claude-code
fi

# Monitor processes and keep container alive
echo "👀 Monitoring services..."
while true; do
    if ! kill -0 $VITE_PID 2>/dev/null; then
        echo "💀 Vite process died! Container will exit..."
        exit 1
    fi
    
    # Check every 30 seconds
    sleep 30
done
