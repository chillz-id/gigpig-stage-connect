# Railway Dockerfile for Claude Code + Cloud Development Environment
FROM node:20-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create development user
RUN useradd -m -s /bin/bash developer
WORKDIR /home/developer

# Install code-server (VSCode in browser)
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Install useful development tools
RUN npm install -g typescript ts-node nodemon

# Create workspace directory
RUN mkdir -p /home/developer/workspace
RUN chown -R developer:developer /home/developer

# Create start script directly
RUN cat > /home/developer/start.sh << 'EOF'
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
cat > .env.local << ENVEOF
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
VITE_GTM_ID=${VITE_GTM_ID}
ENVEOF

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
EOF

# Make start script executable
RUN chmod +x /home/developer/start.sh

# Switch to developer user
USER developer

# Setup environment
ENV PORT=8080
ENV PASSWORD=standupdev2025

# Expose ports
EXPOSE 8080 3000 8000

# Use the start script
CMD ["/home/developer/start.sh"]