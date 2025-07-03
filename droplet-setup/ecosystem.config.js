module.exports = {
  apps: [
    {
      name: 'standupsydney-mcp',
      script: '/opt/services/fastmcp/venv/bin/python',
      args: '/opt/services/fastmcp/server.py',
      cwd: '/opt/services/fastmcp',
      env: {
        NODE_ENV: 'production'
      },
      log_file: '/opt/services/fastmcp/logs/combined.log',
      out_file: '/opt/services/fastmcp/logs/out.log',
      error_file: '/opt/services/fastmcp/logs/error.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000
    },
    {
      name: 'n8n-automation',
      script: 'n8n',
      cwd: '/opt/services/n8n',
      env: {
        NODE_ENV: 'production',
        N8N_HOST: '0.0.0.0',
        N8N_PORT: '5678',
        N8N_PROTOCOL: 'http'
      },
      log_file: '/opt/services/n8n/logs/combined.log',
      out_file: '/opt/services/n8n/logs/out.log', 
      error_file: '/opt/services/n8n/logs/error.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000
    }
  ]
};