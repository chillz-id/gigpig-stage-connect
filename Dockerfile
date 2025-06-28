# Railway Dockerfile for Claude Code + Cloud Development Environment
# Using Alpine for smaller size and better reliability
FROM node:20-alpine

# Install system dependencies (Alpine packages)
RUN apk add --no-cache \
    git \
    curl \
    wget \
    vim \
    python3 \
    py3-pip \
    build-base \
    bash \
    shadow \
    gcompat

# Create development user
RUN adduser -D -s /bin/bash developer
WORKDIR /home/developer

# Install code-server (VSCode in browser)
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Install useful development tools
RUN npm install -g typescript ts-node nodemon

# Create workspace directory and MCP config directory
RUN mkdir -p /home/developer/workspace /home/developer/.mcp
RUN chown -R developer:developer /home/developer

# Copy configuration files from cloud-dev folder
COPY cloud-dev/mcp-config.json /home/developer/.mcp/config.json
COPY cloud-dev/start.sh /home/developer/start.sh

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