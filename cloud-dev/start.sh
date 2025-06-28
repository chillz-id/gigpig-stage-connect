#!/bin/bash
# Railway start script for Cloud Development Environment

echo "🚀 Starting Stand Up Sydney Development Environment..."

# Clone the Stand Up Sydney repository if not exists
if [ ! -d "/home/developer/workspace/gigpig-stage-connect" ]; then
    echo "📂 Cloning Stand Up Sydney repository..."
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
echo "🔐 VSCode Password: ${PASSWORD:-standupdev2025}"

# Keep container running
wait