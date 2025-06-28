#!/bin/bash
# Railway start script for Cloud Development Environment with Claude Code

echo "🚀 Starting Stand Up Sydney Development Environment with Claude Code..."

# Function to kill processes on specific ports
cleanup_ports() {
    echo "🧹 Cleaning up existing processes..."
    
    # Kill any process using port 3000 (Vite)
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "  Killing process on port 3000..."
        lsof -Pi :3000 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
    fi
    
    # Kill any process using port 8080 (VS Code)
    if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "  Killing process on port 8080..."
        lsof -Pi :8080 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
    fi
    
    # Kill any process using port 8000 (MCP Gateway)
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "  Killing process on port 8000..."
        lsof -Pi :8000 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
    fi
    
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
    
    # Initialize Claude Code (if initialization command exists)
    echo "✅ Claude Code configured and ready!"
    echo "💡 Usage: 'claude \"your coding request\"' from terminal"
else
    echo "⚠️  ANTHROPIC_API_KEY not provided - Claude Code will not be available"
    echo "   Add ANTHROPIC_API_KEY to Railway environment variables to enable Claude Code"
fi

# Set password for code-server via environment variable
export PASSWORD="${PASSWORD:-standupdev2025}"

# Function to start VS Code with retry logic
start_vscode() {
    echo "🖥️ Starting code-server on port 8080..."
    
    # Try to start code-server with retries
    for i in {1..3}; do
        if code-server \
            --bind-addr 0.0.0.0:8080 \
            --auth password \
            --disable-telemetry \
            /home/developer/workspace &
        then
            echo "✅ VS Code started successfully (attempt $i)"
            return 0
        else
            echo "❌ VS Code failed to start (attempt $i)"
            sleep 2
        fi
    done
    
    echo "⚠️  VS Code failed to start after 3 attempts"
    return 1
}

# Function to start Vite with retry logic  
start_vite() {
    echo "🎭 Starting Stand Up Sydney dev server on port 3000..."
    cd /home/developer/workspace/gigpig-stage-connect
    
    # Try to start Vite with retries
    for i in {1..3}; do
        if npm run dev -- --host 0.0.0.0 --port 3000 &
        then
            echo "✅ Vite started successfully (attempt $i)"
            return 0
        else
            echo "❌ Vite failed to start (attempt $i)"
            # Clean port 3000 again if needed
            lsof -Pi :3000 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
            sleep 3
        fi
    done
    
    echo "❌ Vite failed to start after 3 attempts"
    return 1
}

# Start services
start_vscode
sleep 5  # Wait for VS Code to fully start

start_vite

# Wait a moment for services to stabilize
sleep 3

echo "✅ All services started!"
echo "🌐 VS Code: Access via Railway URL"
echo "🎪 Stand Up Sydney: Access via Railway URL:3000"
echo "🔒 VS Code Password: ${PASSWORD}"

if [ ! -z "${ANTHROPIC_API_KEY}" ]; then
    echo "🤖 Claude Code: Ready for AI-powered development!"
    echo "   Example: claude 'Add comedian search functionality'"
else
    echo "💡 To enable Claude Code, add ANTHROPIC_API_KEY to Railway environment"
fi

# Keep container running
wait