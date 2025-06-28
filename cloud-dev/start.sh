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
    pkill -9 -f "code-server" 2>/dev/null || true
    
    # Wait for processes to die
    sleep 3
    
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

# NUCLEAR OPTION: Start code-server with completely isolated environment
echo "🔧 NUCLEAR FIX: Complete environment isolation"
echo "  - Original Railway PORT: ${PORT}"
echo "  - Code-server will use: 8080 (forced)"
echo "  - Vite will use: 3000 (after code-server starts)"

# Store critical variables but unset PORT for code-server
RAILWAY_PORT="$PORT"
CODE_SERVER_PASSWORD="${PASSWORD:-StandUpSydney2025}"

# COMPLETELY UNSET PORT for code-server startup
unset PORT

echo "🖥️ Starting code-server with UNSET PORT environment..."
echo "Command: code-server --bind-addr 0.0.0.0:8080 --auth password --disable-telemetry /home/developer/workspace"

# Start code-server with explicit port in clean environment
env -u PORT code-server \
    --bind-addr 0.0.0.0:8080 \
    --auth password \
    --disable-telemetry \
    /home/developer/workspace &

VSCODE_PID=$!
echo "VS Code started with PID: $VSCODE_PID"

# Give VS Code more time to start and bind to port 8080
sleep 8

# Verify code-server is on port 8080
if netstat -tln 2>/dev/null | grep -q ":8080 "; then
    echo "✅ SUCCESS! Code-server is on port 8080"
else
    echo "❌ FAILED! Code-server did not bind to port 8080"
    echo "All listening ports:"
    netstat -tln 2>/dev/null || echo "netstat failed"
    exit 1
fi

# NOW restore PORT for Vite and verify 3000 is free
export PORT="$RAILWAY_PORT"
echo "🎯 Restored PORT=$PORT for Vite"

# Final verification that port 3000 is absolutely free
if netstat -tln 2>/dev/null | grep -q ":3000 "; then
    echo "🚨 EMERGENCY: Port 3000 is STILL occupied!"
    echo "Processes using port 3000:"
    netstat -tlnp 2>/dev/null | grep ":3000"
    echo "Attempting emergency cleanup..."
    free_port_3000
    
    # Check again
    if netstat -tln 2>/dev/null | grep -q ":3000 "; then
        echo "💀 FATAL: Cannot free port 3000. Exiting."
        exit 1
    fi
fi

# Start Vite on port 3000
echo "🎭 Starting Vite on port 3000..."
cd /home/developer/workspace/gigpig-stage-connect

# Export Vite-specific variables
export VITE_PORT=3000

echo "Running: npm run dev -- --host 0.0.0.0 --port 3000 --strictPort"
npm run dev -- --host 0.0.0.0 --port 3000 --strictPort &

VITE_PID=$!
echo "Vite started with PID: $VITE_PID"

# Wait and verify both services
sleep 10

# Check if Vite actually started
if kill -0 $VITE_PID 2>/dev/null; then
    if netstat -tln 2>/dev/null | grep -q ":3000 "; then
        echo "✅ SUCCESS! Vite is running on port 3000 (PID: $VITE_PID)"
    else
        echo "❌ Vite PID exists but port 3000 is not listening!"
        echo "Current listening ports:"
        netstat -tln 2>/dev/null
        exit 1
    fi
else
    echo "❌ CRITICAL ERROR: Vite process died!"
    exit 1
fi

# Check VS Code
if kill -0 $VSCODE_PID 2>/dev/null; then
    echo "✅ VS Code is running on port 8080 (PID: $VSCODE_PID)"
else
    echo "❌ VS Code process died!"
    exit 1
fi

echo ""
echo "🎉 FIXED! ALL SERVICES SUCCESSFULLY STARTED!"
echo "🎪 Stand Up Sydney: https://your-railway-url.app (port 3000)"
echo "🌐 VS Code: https://your-railway-url.app:8080"  
echo "🔒 VS Code Password: ${CODE_SERVER_PASSWORD}"

# Configure Claude Code if API key is provided
if [ ! -z "${ANTHROPIC_API_KEY}" ]; then
    echo "🤖 Claude Code: Ready for AI-powered development!"
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
    
    if ! kill -0 $VSCODE_PID 2>/dev/null; then
        echo "💀 VS Code process died! Container will exit..."
        exit 1
    fi
    
    # Check every 30 seconds
    sleep 30
done
