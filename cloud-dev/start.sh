#!/bin/bash
# Railway start script for Cloud Development Environment with Claude Code

echo "🚀 Starting Stand Up Sydney Development Environment with Claude Code..."

# Function to kill processes on specific ports (Alpine-compatible)
cleanup_ports() {
    echo "🧹 Cleaning up existing processes..."
    
    # Kill any existing node processes (likely Vite)
    pkill -f "vite" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    
    # Kill any existing code-server processes  
    pkill -f "code-server" 2>/dev/null || true
    
    # Kill processes by port using netstat (if available)
    # Port 3000 (Vite)
    netstat -tlnp 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | xargs -r kill -9 2>/dev/null || true
    
    # Port 8080 (VS Code)  
    netstat -tlnp 2>/dev/null | grep :8080 | awk '{print $7}' | cut -d'/' -f1 | xargs -r kill -9 2>/dev/null || true
    
    sleep 2
    echo "✅ Port cleanup complete"
}

# Run cleanup first
cleanup_ports

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

# Configure Claude Code if API key is provided
if [ ! -z "${ANTHROPIC_API_KEY}" ]; then
    echo "🤖 Configuring Claude Code..."
    # Set up Claude Code authentication
    export ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    
    # Create Claude Code config directory
    mkdir -p /home/developer/.config/claude-code
    
    echo "✅ Claude Code configured and ready!"
    echo "💡 Usage: 'claude \"your coding request\"' from terminal"
else
    echo "⚠️  ANTHROPIC_API_KEY not provided - Claude Code will not be available"
    echo "   Add ANTHROPIC_API_KEY to Railway environment variables to enable Claude Code"
fi

# Set password for code-server via environment variable
export PASSWORD="${PASSWORD:-standupdev2025}"

# Start VS Code in background
echo "🖥️ Starting code-server on port 8080..."
code-server \
    --bind-addr 0.0.0.0:8080 \
    --auth password \
    --disable-telemetry \
    /home/developer/workspace &

# Give VS Code time to start
sleep 5

# Start the Vite development server
echo "🎭 Starting Stand Up Sydney dev server on port 3000..."
cd /home/developer/workspace/gigpig-stage-connect

# Use a different port if 3000 is still occupied, with fallback logic
PORT_TO_USE=3000
if netstat -tln 2>/dev/null | grep -q ":3000 "; then
    echo "⚠️  Port 3000 is busy, trying port 3001..."
    PORT_TO_USE=3001
fi

npm run dev -- --host 0.0.0.0 --port $PORT_TO_USE &

# Wait for services to stabilize
sleep 3

echo "✅ All services started!"
echo "🌐 VS Code: Access via Railway URL"
echo "🎪 Stand Up Sydney: Access via Railway URL:$PORT_TO_USE"
echo "🔒 VS Code Password: ${PASSWORD}"

if [ ! -z "${ANTHROPIC_API_KEY}" ]; then
    echo "🤖 Claude Code: Ready for AI-powered development!"
    echo "   Example: claude 'Add comedian search functionality'"
else
    echo "💡 To enable Claude Code, add ANTHROPIC_API_KEY to Railway environment"
fi

# Keep container running
wait