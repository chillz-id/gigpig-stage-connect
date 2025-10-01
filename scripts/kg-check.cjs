#!/usr/bin/env node

/**
 * Knowledge Graph Quick Check
 * Convenience wrapper for Claude Code sessions
 */

const { execSync } = require('child_process');

const command = process.argv[2];
const args = process.argv.slice(3);

const scripts = {
  start: '/root/.claude-multi-agent/scripts/claude-startup-check.js',
  check: '/root/.claude-multi-agent/scripts/claude-graph-integration.js check',
  'log-issue': '/root/.claude-multi-agent/scripts/claude-graph-integration.js log-issue',
  'log-solution': '/root/.claude-multi-agent/scripts/claude-graph-integration.js log-solution',
  query: '/root/.claude-multi-agent/scripts/query-graph.js',
  update: '/root/.claude-multi-agent/scripts/auto-update-graph.js',
  status: '/root/.claude-multi-agent/scripts/check-graph-status.js'
};

if (!command || command === '--help') {
  console.log(`
Knowledge Graph Commands:

  npm run kg:start         Run startup check (MANDATORY at session start)
  npm run kg:check         Check before making changes
  npm run kg:issue         Log a discovered issue
  npm run kg:solution      Log a fix attempt
  npm run kg:query         Interactive graph query
  npm run kg:update        Update graph with recent changes
  npm run kg:status        Show graph statistics

Examples:
  npm run kg:check "modify profile system"
  npm run kg:issue "Zero profiles" "No profiles exist" Critical
  npm run kg:solution "Zero profiles" "Added trigger" true
  `);
  process.exit(0);
}

const scriptPath = scripts[command];
if (!scriptPath) {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

try {
  const fullCommand = `node ${scriptPath} ${args.map(arg => `"${arg}"`).join(' ')}`;
  execSync(fullCommand, { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}
