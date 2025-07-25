# Simple Railway Cloud Development Environment
FROM node:20-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create developer user
RUN useradd -m -s /bin/bash developer
WORKDIR /home/developer

# Install code-server (VS Code in browser)
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Install essential dev tools
RUN npm install -g typescript ts-node @modelcontextprotocol/server-filesystem @supabase/mcp-server-supabase

# Create workspace directory
RUN mkdir -p /home/developer/workspace
RUN chown -R developer:developer /home/developer

# Copy simple start script
COPY start-clean.sh /home/developer/start.sh
RUN chmod +x /home/developer/start.sh

# Switch to developer user
USER developer

# Use Railway's assigned PORT for code-server
ENV PASSWORD=standupdev2025

# Start code-server
CMD ["/home/developer/start.sh"]
