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

# Install Claude Code (Anthropic's agentic CLI tool)
RUN npm install -g @anthropic-ai/claude-code

# Create workspace directory and MCP config directory
RUN mkdir -p /home/developer/workspace /home/developer/.mcp
RUN chown -R developer:developer /home/developer

# Copy configuration files from current directory (since this Dockerfile is in cloud-dev/)
COPY mcp-config.json /home/developer/.mcp/config.json
COPY start.sh /home/developer/start.sh

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