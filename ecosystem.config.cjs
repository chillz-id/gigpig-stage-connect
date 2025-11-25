module.exports = {
  apps: [
    {
      name: 'standup-sydney-dev',
      cwd: '/root/agents',
      script: 'node_modules/.bin/vite',
      args: '--host 0.0.0.0 --port 8080',
      env: {
        NODE_ENV: 'development',
        PORT: 8080
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/root/agents/logs/dev-error.log',
      out_file: '/root/agents/logs/dev-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
