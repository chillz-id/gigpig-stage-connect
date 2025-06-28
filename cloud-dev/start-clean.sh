#!/bin/bash
# Ultra-Simple Railway Start Script for Cloud Development Environment

echo "🚀 Starting Cloud Development Environment..."

# Clone repository if needed
if [ ! -d "/home/developer/workspace/gigpig-stage-connect" ]; then
    echo "📦 Cloning repository..."
    cd /home/developer/workspace
    
    if [ ! -z "${GITHUB_TOKEN}" ]; then
        git clone https://${GITHUB_TOKEN}@github.com/chillz-id/gigpig-stage-connect.git
        cd gigpig-stage-connect
        npm install
        echo "✅ Repository ready"
    else
        echo "❌ GITHUB_TOKEN required for private repo"
        exit 1
    fi
fi

# Basic code-server config
mkdir -p /home/developer/.config/code-server
cat > /home/developer/.config/code-server/config.yaml << EOF
bind-addr: 0.0.0.0:${PORT:-8080}
auth: password
password: ${PASSWORD:-standupdev2025}
cert: false
disable-telemetry: true
disable-update-check: true
disable-workspace-trust: true
EOF

echo "📝 Code-server configured for port ${PORT:-8080}"

# Optional: Setup Claude Code if API key provided
if [ ! -z "${ANTHROPIC_API_KEY}" ]; then
    echo "🤖 Setting up Claude Code..."
    mkdir -p /home/developer/.config/claude-code
    
    cat > /home/developer/.config/claude-code/config.json << EOF
{
  "api_key": "${ANTHROPIC_API_KEY}",
  "workspace": "/home/developer/workspace/gigpig-stage-connect",
  "model": "claude-sonnet-4-20250514"
}
EOF
    echo "✅ Claude Code configured"
fi

# Start code-server
echo "🖥️ Starting VS Code on port ${PORT:-8080}..."
exec code-server --config /home/developer/.config/code-server/config.yaml /home/developer/workspace
