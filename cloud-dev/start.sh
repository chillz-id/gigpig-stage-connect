#!/bin/bash
# Railway start script for Cloud Development Environment with Claude Code

echo "🚀 Starting Stand Up Sydney Development Environment with Claude Code..."

# Clone the Stand Up Sydney repository if not exists
if [ ! -d "/home/developer/workspace/gigpig-stage-connect" ]; then
    echo "📦 Cloning Stand Up Sydney repository..."
    cd /home/developer/workspace
    git clone https://github.com/chillz-id/gigpig-stage-connect.git
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

# Start code-server (VSCode in browser)
echo "💻 Starting code-server on port 8080..."
code-server \
    --bind-addr 0.0.0.0:8080 \
    --auth password \
    --password ${PASSWORD:-standupdev2025} \
    --disable-telemetry \
    /home/developer/workspace &

# Wait a moment for code-server to start
sleep 3

# Start the development server
cd /home/developer/workspace/gigpig-stage-connect
echo "🎭 Starting Stand Up Sydney dev server on port 3000..."
npm run dev -- --host 0.0.0.0 --port 3000 &

echo "✅ All services started!"
echo "🌐 VSCode: Access via Railway URL"
echo "🎪 Stand Up Sydney: Access via Railway URL:3000"
echo "🔒 VSCode Password: ${PASSWORD:-standupdev2025}"

if [ ! -z "${ANTHROPIC_API_KEY}" ]; then
    echo "🤖 Claude Code: Ready for AI-powered development!"
    echo "   Example: claude 'Add comedian search functionality'"
else
    echo "💡 To enable Claude Code, add ANTHROPIC_API_KEY to Railway environment"
fi

# Keep container running
wait