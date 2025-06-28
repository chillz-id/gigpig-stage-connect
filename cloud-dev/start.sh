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

# AGGRESSIVE DEBUGGING AND CODE-SERVER CONFIG FIX
echo "🔧 AGGRESSIVE CODE-SERVER CONFIGURATION"
echo "  - Original Railway PORT: ${PORT}"

# Store critical variables
RAILWAY_PORT="$PORT"
CODE_SERVER_PASSWORD="${PASSWORD:-StandUpSydney2025}"

# Remove any existing code-server config that might interfere
rm -rf /home/developer/.config/code-server/ 2>/dev/null || true
rm -rf /home/developer/.local/share/code-server/ 2>/dev/null || true

# Create code-server config directory and force config
mkdir -p /home/developer/.config/code-server/

# Create explicit code-server configuration file
cat > /home/developer/.config/code-server/config.yaml << EOF
bind-addr: 0.0.0.0:8080
auth: password
password: ${CODE_SERVER_PASSWORD}
cert: false
disable-telemetry: true
EOF

echo "📝 Created code-server config file:"
cat /home/developer/.config/code-server/config.yaml

# Check available network debugging tools
echo "🔍 Network debugging tools available:"
which ss && echo "✅ ss available" || echo "❌ ss not available"
which netstat && echo "✅ netstat available" || echo "❌ netstat not available" 
which lsof && echo "✅ lsof available" || echo "❌ lsof not available"

# Show current listening ports before starting anything
echo "📊 Current listening ports (before code-server):"
ss -tln 2>/dev/null || netstat -tln 2>/dev/null || echo "No network tools available"

# COMPLETELY UNSET PORT for code-server startup
unset PORT

echo "🖥️ Starting code-server with CONFIG FILE and UNSET PORT..."
echo "Command: code-server /home/developer/workspace"

# Start code-server using config file (should override any environment)
env -u PORT code-server /home/developer/workspace &

VSCODE_PID=$!
echo "VS Code started with PID: $VSCODE_PID"

# Give VS Code time to start
sleep 10

# Multiple methods to check if code-server is listening on 8080
echo "🔍 Checking if code-server bound to port 8080..."

# Method 1: ss
if command -v ss >/dev/null 2>&1; then
    echo "Method 1 (ss):"
    ss -tln | grep ":8080" || echo "  Port 8080 not found with ss"
fi

# Method 2: netstat  
if command -v netstat >/dev/null 2>&1; then
    echo "Method 2 (netstat):"
    netstat -tln | grep ":8080" || echo "  Port 8080 not found with netstat"
fi

# Method 3: lsof
if command -v lsof >/dev/null 2>&1; then
    echo "Method 3 (lsof):"
    lsof -i :8080 || echo "  Port 8080 not found with lsof"
fi

# Method 4: Check process
echo "Method 4 (process check):"
if kill -0 $VSCODE_PID 2>/dev/null; then
    echo "  ✅ Code-server process is running (PID: $VSCODE_PID)"
else
    echo "  ❌ Code-server process died!"
fi

# Show ALL listening ports for debugging
echo "📊 ALL current listening ports:"
ss -tln 2>/dev/null | head -20 || netstat -tln 2>/dev/null | head -20 || echo "No network info available"

# Check if port 8080 is actually listening
PORT_8080_CHECK=$(ss -tln 2>/dev/null | grep ":8080" || netstat -tln 2>/dev/null | grep ":8080" || echo "")

if [ ! -z "$PORT_8080_CHECK" ]; then
    echo "✅ SUCCESS! Code-server is listening on port 8080"
    echo "Details: $PORT_8080_CHECK"
else
    echo "❌ Code-server is NOT listening on port 8080"
    echo "🔍 Let's see what code-server is actually doing..."
    
    # Show code-server logs if available
    echo "Code-server process info:"
    ps aux | grep code-server | grep -v grep || echo "No code-server process found"
    
    # Try to find what ports code-server IS using
    if command -v lsof >/dev/null 2>&1; then
        echo "Ports used by code-server process:"
        lsof -p $VSCODE_PID 2>/dev/null | grep LISTEN || echo "No listening ports found for code-server"
    fi
    
    echo "❌ CRITICAL: Code-server startup failed - trying alternative approach..."
    
    # Kill the failed code-server
    kill -9 $VSCODE_PID 2>/dev/null || true
    sleep 2
    
    # Try starting code-server with different arguments
    echo "🔄 Trying alternative code-server startup..."
    unset PORT
    code-server --bind-addr=0.0.0.0:8080 --auth=password --disable-telemetry /home/developer/workspace &
    VSCODE_PID=$!
    sleep 8
    
    # Check again
    PORT_8080_CHECK=$(ss -tln 2>/dev/null | grep ":8080" || netstat -tln 2>/dev/null | grep ":8080" || echo "")
    if [ -z "$PORT_8080_CHECK" ]; then
        echo "💀 FATAL: Cannot get code-server to bind to port 8080"
        echo "Exiting to prevent further issues..."
        exit 1
    else
        echo "✅ Alternative method worked! Code-server on port 8080"
    fi
fi

# NOW restore PORT for Vite and verify 3000 is free
export PORT="$RAILWAY_PORT"
echo "🎯 Restored PORT=$PORT for Vite"

# Final verification that port 3000 is absolutely free
if ss -tln 2>/dev/null | grep -q ":3000 " || netstat -tln 2>/dev/null | grep -q ":3000 "; then
    echo "🚨 EMERGENCY: Port 3000 is STILL occupied!"
    echo "Processes using port 3000:"
    ss -tlnp 2>/dev/null | grep ":3000" || netstat -tlnp 2>/dev/null | grep ":3000" || echo "Cannot determine what's using port 3000"
    free_port_3000
    
    # Check again
    if ss -tln 2>/dev/null | grep -q ":3000 " || netstat -tln 2>/dev/null | grep -q ":3000 "; then
        echo "💀 FATAL: Cannot free port 3000. Exiting."
        exit 1
    fi
fi

# Start Vite on port 3000
echo "🎭 Starting Vite on port 3000..."
cd /home/developer/workspace/gigpig-stage-connect

export VITE_PORT=3000

echo "Running: npm run dev -- --host 0.0.0.0 --port 3000 --strictPort"
npm run dev -- --host 0.0.0.0 --port 3000 --strictPort &

VITE_PID=$!
echo "Vite started with PID: $VITE_PID"

# Wait and verify both services
sleep 10

# Check if Vite actually started
if kill -0 $VITE_PID 2>/dev/null; then
    if ss -tln 2>/dev/null | grep -q ":3000 " || netstat -tln 2>/dev/null | grep -q ":3000 "; then
        echo "✅ SUCCESS! Vite is running on port 3000 (PID: $VITE_PID)"
    else
        echo "❌ Vite PID exists but port 3000 is not listening!"
        exit 1
    fi
else
    echo "❌ CRITICAL ERROR: Vite process died!"
    exit 1
fi

# Final verification
if kill -0 $VSCODE_PID 2>/dev/null; then
    echo "✅ VS Code is running (PID: $VSCODE_PID)"
else
    echo "❌ VS Code process died!"
    exit 1
fi

echo ""
echo "🎉 NUCLEAR SUCCESS! ALL SERVICES RUNNING!"
echo "🎪 Stand Up Sydney: https://your-railway-url.app (port 3000)"
echo "🌐 VS Code: https://your-railway-url.app:8080"  
echo "🔒 VS Code Password: ${CODE_SERVER_PASSWORD}"

# Configure Claude Code if API key is provided
if [ ! -z "${ANTHROPIC_API_KEY}" ]; then
    echo "🤖 Claude Code: Ready!"
    export ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    mkdir -p /home/developer/.config/claude-code
fi

# Monitor processes and keep container alive
echo "👀 Monitoring services..."
while true; do
    if ! kill -0 $VITE_PID 2>/dev/null || ! kill -0 $VSCODE_PID 2>/dev/null; then
        echo "💀 A service died! Container will exit..."
        exit 1
    fi
    sleep 30
done
