# Railway Dockerfile for Claude Code + MCP Development Environment
FROM node:20-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Create development user
RUN useradd -m -s /bin/bash developer
WORKDIR /home/developer

# Install Claude Code (when available)
# RUN npm install -g @anthropic-ai/claude-code

# Install MCP servers
RUN npm install -g @mcp/server-github
RUN npm install -g @mcp/server-filesystem
# Add other MCP servers as needed

# Install code-server (VSCode in browser)
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Create workspace directory
RUN mkdir -p /home/developer/workspace
RUN chown -R developer:developer /home/developer

# Switch to developer user
USER developer

# Setup environment
ENV PORT=8080
ENV PASSWORD=your-secure-password

# Expose ports
EXPOSE 8080 3000 8000

# Start script will be added separately
CMD ["bash"]