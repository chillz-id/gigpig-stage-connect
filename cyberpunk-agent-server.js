#!/usr/bin/env node

const express = require('express');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS and JSON parsing
app.use(express.json());
app.use(express.static('public'));

// Serve the Cyberpunk dashboard HTML
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CLAUDE_SYSTEMS v2.077</title>
  <style>${fs.readFileSync('cyberpunk-dashboard.css', 'utf8')}</style>
</head>
<body>
  <div id="root"></div>
  
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <script type="text/babel">
    ${fs.readFileSync('cyberpunk-dashboard.jsx', 'utf8')}
    
    // WebSocket connection for real-time updates
    const ws = new WebSocket('ws://' + window.location.host);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received update:', data);
      // Update UI with real-time data
    };
    
    // Mount the React app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<CyberpunkDashboard />);
  </script>
</body>
</html>
  `);
});

// API Routes
app.get('/api/status', (req, res) => {
  const agents = [
    { 
      id: 'frontend', 
      name: 'NETRUNNER_01', 
      status: 'IDLE',
      cpu: Math.floor(Math.random() * 30) + 10,
      ram: Math.floor(Math.random() * 40) + 20,
      tasks: 0,
      lastActivity: new Date().toISOString()
    },
    { 
      id: 'backend', 
      name: 'DAEMON_02', 
      status: 'IDLE',
      cpu: Math.floor(Math.random() * 25) + 5,
      ram: Math.floor(Math.random() * 35) + 15,
      tasks: 0,
      lastActivity: new Date().toISOString()
    },
    { 
      id: 'testing', 
      name: 'ICE_BREAKER_03', 
      status: 'IDLE',
      cpu: Math.floor(Math.random() * 20) + 5,
      ram: Math.floor(Math.random() * 30) + 10,
      tasks: 0,
      lastActivity: new Date().toISOString()
    }
  ];
  
  res.json({
    system: 'ONLINE',
    threatLevel: 'LOW',
    agents,
    server: {
      ip: '170.64.252.55',
      location: 'DIGITAL_OCEAN_SYD',
      uptime: process.uptime(),
      mcp: 'CONNECTED'
    }
  });
});

app.post('/api/agents/:agentId/task', (req, res) => {
  const { agentId } = req.params;
  const { task } = req.body;
  
  console.log(`[TASK_ASSIGNED] Agent: ${agentId.toUpperCase()}, Directive: ${task}`);
  
  // Create task file
  const taskDir = '.agent-comms/task-queue';
  if (!fs.existsSync(taskDir)) {
    fs.mkdirSync(taskDir, { recursive: true });
  }
  
  const taskId = `TASK_${Date.now()}`;
  const taskFile = path.join(taskDir, `${agentId}-${taskId}.md`);
  
  fs.writeFileSync(taskFile, `# ${taskId}
AGENT: ${agentId.toUpperCase()}
TIMESTAMP: ${new Date().toISOString()}
STATUS: PENDING

## DIRECTIVE
${task}

## EXECUTION_LOG
- Task created
- Awaiting agent processing...
`);
  
  res.json({ 
    success: true, 
    taskId,
    message: `PROTOCOL INITIATED: ${taskId}`,
    agent: agentId.toUpperCase(),
    eta: '2-5 CYCLES'
  });
});

// WebSocket server for real-time updates
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗        ║
║ ██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝        ║
║ ██║     ██║     ███████║██║   ██║██║  ██║█████╗          ║
║ ██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝          ║
║ ╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗        ║
║  ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝        ║
║                                                           ║
║            SYSTEMS v2.077 - CYBERPUNK EDITION             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

[SYSTEM_INIT] Multi-Agent Control Interface
[STATUS] ONLINE
[PORT] ${PORT}
[ACCESS] http://localhost:${PORT}
[EXTERNAL] http://170.64.252.55:${PORT}

[PROTOCOLS_LOADED]
├─ NETRUNNER_01: Frontend Operations
├─ DAEMON_02: Backend Systems
└─ ICE_BREAKER_03: Testing Protocols

[AWAITING_DIRECTIVES]
`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('[CONNECTION] New interface connected');
  
  // Send updates every 5 seconds
  const interval = setInterval(() => {
    const update = {
      type: 'STATUS_UPDATE',
      timestamp: new Date().toISOString(),
      agents: [
        { id: 'frontend', cpu: Math.floor(Math.random() * 30) + 10 },
        { id: 'backend', cpu: Math.floor(Math.random() * 25) + 5 },
        { id: 'testing', cpu: Math.floor(Math.random() * 20) + 5 }
      ]
    };
    
    ws.send(JSON.stringify(update));
  }, 5000);
  
  ws.on('close', () => {
    clearInterval(interval);
    console.log('[DISCONNECT] Interface disconnected');
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] Initiating system shutdown...');
  server.close(() => {
    console.log('[SHUTDOWN] All systems offline');
    process.exit(0);
  });
});