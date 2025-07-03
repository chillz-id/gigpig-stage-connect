#!/usr/bin/env node

const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Serve the complete Cyberpunk dashboard
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CLAUDE_SYSTEMS v2.077</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');

    :root {
      --cyber-yellow: #FFEB0B;
      --cyber-cyan: #25E1ED;
      --cyber-magenta: #ED1E79;
      --cyber-red: #FF4A57;
      --cyber-dark-red: #672026;
      --cyber-dark-blue: #001b2d;
      --cyber-black: #000000;
      --cyber-grey: #1a1a1a;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Share Tech Mono', monospace;
      background: #000;
      color: #FFEB0B;
      overflow-x: hidden;
      min-height: 100vh;
    }

    .cyberpunk-container {
      min-height: 100vh;
      background: linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #001b2d 100%);
      position: relative;
    }

    .cyber-grid {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(rgba(37, 225, 237, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(37, 225, 237, 0.1) 1px, transparent 1px);
      background-size: 50px 50px;
      animation: grid-move 20s linear infinite;
      pointer-events: none;
    }

    @keyframes grid-move {
      0% { transform: translate(0, 0); }
      100% { transform: translate(50px, 50px); }
    }

    .dashboard-wrapper {
      position: relative;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      z-index: 1;
    }

    .cyber-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding: 20px;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #25E1ED;
      position: relative;
      overflow: hidden;
    }

    .cyber-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(37, 225, 237, 0.4), transparent);
      animation: scan 8s linear infinite;
    }

    @keyframes scan {
      0% { left: -100%; }
      100% { left: 100%; }
    }

    .logo-text {
      font-family: 'Orbitron', sans-serif;
      font-size: 32px;
      font-weight: 900;
      color: #FFEB0B;
      text-shadow: 
        0 0 10px rgba(255, 235, 11, 0.8),
        0 0 20px rgba(255, 235, 11, 0.5);
    }

    .logo-subtitle {
      font-size: 12px;
      color: #25E1ED;
      letter-spacing: 2px;
      opacity: 0.8;
    }

    .status-bar {
      display: flex;
      gap: 30px;
    }

    .status-item {
      text-align: center;
    }

    .status-label {
      font-size: 10px;
      color: #25E1ED;
      opacity: 0.7;
      display: block;
    }

    .status-value {
      font-size: 16px;
      font-weight: bold;
      margin-top: 4px;
    }

    .status-value.online { color: #00ff00; }
    .status-value.low { color: #FFEB0B; }

    .agents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .agent-card {
      background: rgba(10, 10, 10, 0.9);
      border: 2px solid #25E1ED;
      padding: 25px;
      position: relative;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .agent-card:hover {
      border-color: #ED1E79;
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(237, 30, 121, 0.3);
    }

    .agent-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .agent-id {
      font-size: 12px;
      color: #25E1ED;
      letter-spacing: 1px;
    }

    .agent-status {
      font-size: 10px;
      padding: 3px 10px;
      background: rgba(37, 225, 237, 0.2);
      border: 1px solid #25E1ED;
      color: #25E1ED;
    }

    .agent-name {
      font-family: 'Orbitron', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #FFEB0B;
      margin-bottom: 20px;
      text-shadow: 0 0 10px rgba(255, 235, 11, 0.5);
    }

    .stat-bar {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }

    .stat-label {
      font-size: 11px;
      color: #25E1ED;
      width: 40px;
    }

    .stat-track {
      flex: 1;
      height: 8px;
      background: rgba(37, 225, 237, 0.1);
      border: 1px solid rgba(37, 225, 237, 0.3);
      margin: 0 10px;
      position: relative;
      overflow: hidden;
    }

    .stat-fill {
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      transition: width 0.5s ease;
    }

    .stat-fill.cpu {
      background: linear-gradient(90deg, #25E1ED, #ED1E79);
      box-shadow: 0 0 10px rgba(237, 30, 121, 0.5);
    }

    .stat-fill.ram {
      background: linear-gradient(90deg, #FFEB0B, #FF4A57);
      box-shadow: 0 0 10px rgba(255, 74, 87, 0.5);
    }

    .stat-value {
      font-size: 12px;
      color: #FFEB0B;
      width: 40px;
      text-align: right;
    }

    .task-counter {
      text-align: center;
      margin-bottom: 15px;
    }

    .counter-label {
      font-size: 10px;
      color: #25E1ED;
      opacity: 0.7;
      display: block;
    }

    .counter-value {
      font-size: 24px;
      font-weight: bold;
      color: #FFEB0B;
      text-shadow: 0 0 15px rgba(255, 235, 11, 0.7);
    }

    .cyber-button {
      background: none;
      border: 2px solid #ED1E79;
      color: #ED1E79;
      padding: 8px 20px;
      font-family: inherit;
      font-size: 12px;
      cursor: pointer;
      text-transform: uppercase;
      transition: all 0.3s ease;
      width: 100%;
    }

    .cyber-button:hover {
      color: #FFEB0B;
      border-color: #FFEB0B;
      text-shadow: 0 0 10px rgba(255, 235, 11, 0.8);
    }

    .corner-decoration {
      position: absolute;
      width: 15px;
      height: 15px;
      border: 2px solid #25E1ED;
    }

    .corner-decoration.top-left {
      top: -2px;
      left: -2px;
      border-right: none;
      border-bottom: none;
    }

    .corner-decoration.top-right {
      top: -2px;
      right: -2px;
      border-left: none;
      border-bottom: none;
    }

    .corner-decoration.bottom-left {
      bottom: -2px;
      left: -2px;
      border-right: none;
      border-top: none;
    }

    .corner-decoration.bottom-right {
      bottom: -2px;
      right: -2px;
      border-left: none;
      border-top: none;
    }

    .task-panel {
      background: rgba(10, 10, 10, 0.95);
      border: 2px solid #25E1ED;
      padding: 30px;
      margin-bottom: 30px;
    }

    .panel-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: #FFEB0B;
      margin-bottom: 20px;
    }

    .cyber-input {
      width: 100%;
      padding: 15px;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid #25E1ED;
      color: #FFEB0B;
      font-family: inherit;
      font-size: 16px;
      outline: none;
      margin-bottom: 20px;
    }

    .cyber-input:focus {
      border-color: #ED1E79;
      box-shadow: 0 0 20px rgba(237, 30, 121, 0.3);
    }

    .execute-button {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, rgba(237, 30, 121, 0.2), rgba(255, 74, 87, 0.2));
      border: 2px solid #ED1E79;
      color: #FFEB0B;
      font-family: 'Orbitron', sans-serif;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 2px;
      transition: all 0.3s ease;
    }

    .execute-button:hover {
      background: linear-gradient(135deg, rgba(237, 30, 121, 0.4), rgba(255, 74, 87, 0.4));
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(237, 30, 121, 0.5);
    }

    .activity-log {
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid #25E1ED;
      padding: 20px;
      max-height: 300px;
      overflow-y: auto;
    }

    .log-title {
      font-size: 14px;
      color: #25E1ED;
      letter-spacing: 1px;
      margin-bottom: 15px;
      display: block;
    }

    .log-entry {
      margin-bottom: 8px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
    }

    .log-time {
      color: #25E1ED;
      margin-right: 10px;
    }

    .hud-corner {
      position: fixed;
      padding: 10px 20px;
      font-size: 11px;
      color: #25E1ED;
      opacity: 0.7;
      letter-spacing: 1px;
    }

    .hud-corner.top-left { top: 20px; left: 20px; }
    .hud-corner.top-right { top: 20px; right: 20px; }
    .hud-corner.bottom-left { bottom: 20px; left: 20px; }
    .hud-corner.bottom-right { bottom: 20px; right: 20px; }
  </style>
</head>
<body>
  <div class="cyberpunk-container">
    <div class="cyber-grid"></div>
    
    <div class="dashboard-wrapper">
      <header class="cyber-header">
        <div class="logo-section">
          <div class="cyber-logo">
            <div class="logo-text">CLAUDE_SYSTEMS</div>
            <div class="logo-subtitle">MULTI_AGENT_CONTROL_v2.077</div>
          </div>
        </div>
        
        <div class="status-bar">
          <div class="status-item">
            <span class="status-label">SYSTEM</span>
            <span class="status-value online">ONLINE</span>
          </div>
          <div class="status-item">
            <span class="status-label">THREAT_LEVEL</span>
            <span class="status-value low">LOW</span>
          </div>
          <div class="status-item">
            <span class="status-label">TIME</span>
            <span class="status-value" id="current-time">--:--:--</span>
          </div>
        </div>
      </header>

      <div class="agents-grid">
        <!-- Agent 1 -->
        <div class="agent-card">
          <div class="agent-header">
            <div class="agent-id">AGENT_FRONTEND</div>
            <div class="agent-status">IDLE</div>
          </div>
          
          <div class="agent-name">NETRUNNER_01</div>
          
          <div class="agent-stats">
            <div class="stat-bar">
              <div class="stat-label">CPU</div>
              <div class="stat-track">
                <div class="stat-fill cpu" style="width: 23%"></div>
              </div>
              <div class="stat-value">23%</div>
            </div>
            
            <div class="stat-bar">
              <div class="stat-label">RAM</div>
              <div class="stat-track">
                <div class="stat-fill ram" style="width: 31%"></div>
              </div>
              <div class="stat-value">31%</div>
            </div>
          </div>
          
          <div class="task-counter">
            <span class="counter-label">TASKS_COMPLETED</span>
            <span class="counter-value">0</span>
          </div>
          
          <button class="cyber-button">INTERFACE</button>
          
          <div class="corner-decoration top-left"></div>
          <div class="corner-decoration top-right"></div>
          <div class="corner-decoration bottom-left"></div>
          <div class="corner-decoration bottom-right"></div>
        </div>

        <!-- Agent 2 -->
        <div class="agent-card">
          <div class="agent-header">
            <div class="agent-id">AGENT_BACKEND</div>
            <div class="agent-status">IDLE</div>
          </div>
          
          <div class="agent-name">DAEMON_02</div>
          
          <div class="agent-stats">
            <div class="stat-bar">
              <div class="stat-label">CPU</div>
              <div class="stat-track">
                <div class="stat-fill cpu" style="width: 18%"></div>
              </div>
              <div class="stat-value">18%</div>
            </div>
            
            <div class="stat-bar">
              <div class="stat-label">RAM</div>
              <div class="stat-track">
                <div class="stat-fill ram" style="width: 27%"></div>
              </div>
              <div class="stat-value">27%</div>
            </div>
          </div>
          
          <div class="task-counter">
            <span class="counter-label">TASKS_COMPLETED</span>
            <span class="counter-value">0</span>
          </div>
          
          <button class="cyber-button">INTERFACE</button>
          
          <div class="corner-decoration top-left"></div>
          <div class="corner-decoration top-right"></div>
          <div class="corner-decoration bottom-left"></div>
          <div class="corner-decoration bottom-right"></div>
        </div>

        <!-- Agent 3 -->
        <div class="agent-card">
          <div class="agent-header">
            <div class="agent-id">AGENT_TESTING</div>
            <div class="agent-status">IDLE</div>
          </div>
          
          <div class="agent-name">ICE_BREAKER_03</div>
          
          <div class="agent-stats">
            <div class="stat-bar">
              <div class="stat-label">CPU</div>
              <div class="stat-track">
                <div class="stat-fill cpu" style="width: 15%"></div>
              </div>
              <div class="stat-value">15%</div>
            </div>
            
            <div class="stat-bar">
              <div class="stat-label">RAM</div>
              <div class="stat-track">
                <div class="stat-fill ram" style="width: 22%"></div>
              </div>
              <div class="stat-value">22%</div>
            </div>
          </div>
          
          <div class="task-counter">
            <span class="counter-label">TASKS_COMPLETED</span>
            <span class="counter-value">0</span>
          </div>
          
          <button class="cyber-button">INTERFACE</button>
          
          <div class="corner-decoration top-left"></div>
          <div class="corner-decoration top-right"></div>
          <div class="corner-decoration bottom-left"></div>
          <div class="corner-decoration bottom-right"></div>
        </div>
      </div>

      <div class="task-panel">
        <div class="panel-title">TASK_ASSIGNMENT</div>
        
        <input 
          type="text" 
          class="cyber-input" 
          placeholder="ENTER_DIRECTIVE..."
          id="task-input"
        />
        
        <button class="execute-button" onclick="executeTask()">EXECUTE_PROTOCOL</button>
      </div>

      <div class="activity-log">
        <span class="log-title">SYSTEM_LOG</span>
        <div id="log-content">
          <div class="log-entry">
            <span class="log-time">[INIT]</span>
            <span class="log-message">System initialized. All agents online.</span>
          </div>
          <div class="log-entry">
            <span class="log-time">[MCP]</span>
            <span class="log-message">Connection established to MCP_SERVER</span>
          </div>
          <div class="log-entry">
            <span class="log-time">[SYS]</span>
            <span class="log-message">Awaiting directives...</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="hud-corner top-left">CLAUDE_MULTIAGENT_v2.077</div>
    <div class="hud-corner top-right">170.64.252.55:3001</div>
    <div class="hud-corner bottom-left">MCP_STATUS: CONNECTED</div>
    <div class="hud-corner bottom-right">DIGITAL_OCEAN_SYD</div>
  </div>

  <script>
    // Update time
    function updateTime() {
      document.getElementById('current-time').textContent = new Date().toLocaleTimeString();
    }
    setInterval(updateTime, 1000);
    updateTime();

    // Execute task
    function executeTask() {
      const input = document.getElementById('task-input');
      const task = input.value;
      if (!task) return;

      const logContent = document.getElementById('log-content');
      const newEntry = document.createElement('div');
      newEntry.className = 'log-entry';
      newEntry.innerHTML = \`
        <span class="log-time">[\${new Date().toLocaleTimeString()}]</span>
        <span class="log-message">PROTOCOL INITIATED: \${task}</span>
      \`;
      logContent.appendChild(newEntry);
      logContent.scrollTop = logContent.scrollHeight;
      
      input.value = '';
      
      // Send to server
      fetch('/api/agents/frontend/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task })
      });
    }

    // Random CPU/RAM updates
    setInterval(() => {
      document.querySelectorAll('.stat-fill').forEach(bar => {
        const isRam = bar.classList.contains('ram');
        const min = isRam ? 15 : 5;
        const max = isRam ? 40 : 30;
        const value = Math.floor(Math.random() * (max - min) + min);
        bar.style.width = value + '%';
        bar.parentElement.parentElement.querySelector('.stat-value').textContent = value + '%';
      });
    }, 3000);
  </script>
</body>
</html>
  `);
});

// API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    system: 'ONLINE',
    agents: [
      { id: 'frontend', name: 'NETRUNNER_01', status: 'IDLE' },
      { id: 'backend', name: 'DAEMON_02', status: 'IDLE' },
      { id: 'testing', name: 'ICE_BREAKER_03', status: 'IDLE' }
    ]
  });
});

app.post('/api/agents/:agentId/task', (req, res) => {
  const { agentId } = req.params;
  const { task } = req.body;
  
  console.log(`[TASK] ${agentId}: ${task}`);
  
  res.json({ 
    success: true, 
    taskId: `TASK_${Date.now()}`,
    message: 'PROTOCOL INITIATED'
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║             CLAUDE_SYSTEMS v2.077 - ONLINE                ║
╚═══════════════════════════════════════════════════════════╝

[SYSTEM] Multi-Agent Control Interface
[STATUS] ONLINE
[PORT] ${PORT}
[ACCESS] http://170.64.252.55:${PORT}
`);
});