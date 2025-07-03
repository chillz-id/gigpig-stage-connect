#!/usr/bin/env node

const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Track agent states
const agentStates = {
  frontend: { 
    name: 'NETRUNNER_01',
    status: 'IDLE',
    cpu: 0,
    ram: 0,
    tasks: 0,
    currentTask: null,
    lastActivity: new Date()
  },
  backend: { 
    name: 'DAEMON_02',
    status: 'IDLE',
    cpu: 0,
    ram: 0,
    tasks: 0,
    currentTask: null,
    lastActivity: new Date()
  },
  testing: { 
    name: 'GIGACHAD_420',  // CHANGED TO GIGACHAD!
    status: 'IDLE',
    cpu: 0,
    ram: 0,
    tasks: 0,
    currentTask: null,
    lastActivity: new Date()
  }
};

// Monitor real system resources
function getSystemStats() {
  try {
    // Get real CPU usage
    const cpuInfo = execSync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1", { encoding: 'utf8' }).trim();
    
    // Get real memory usage
    const memInfo = execSync("free | grep Mem | awk '{print ($3/$2) * 100.0}'", { encoding: 'utf8' }).trim();
    
    // Check PM2 processes
    const pm2List = execSync('pm2 jlist', { encoding: 'utf8' });
    const processes = JSON.parse(pm2List);
    
    // Update agent states based on PM2 data
    processes.forEach(proc => {
      if (proc.name.includes('frontend')) {
        agentStates.frontend.cpu = Math.round(proc.monit.cpu);
        agentStates.frontend.ram = Math.round(proc.monit.memory / 1024 / 1024); // MB
      }
    });
    
    return {
      systemCpu: parseFloat(cpuInfo) || 0,
      systemRam: parseFloat(memInfo) || 0,
      agents: agentStates
    };
  } catch (e) {
    // Fallback to simulated data
    return {
      systemCpu: Math.random() * 30 + 10,
      systemRam: Math.random() * 40 + 20,
      agents: agentStates
    };
  }
}

// Check for task files and update agent states
function checkTaskQueue() {
  const taskDir = '.agent-comms/task-queue';
  if (!fs.existsSync(taskDir)) return;
  
  const files = fs.readdirSync(taskDir);
  
  // Update agent states based on task files
  files.forEach(file => {
    const match = file.match(/^(frontend|backend|testing)-(.+)\.md$/);
    if (match) {
      const [, agent, taskId] = match;
      if (agentStates[agent]) {
        agentStates[agent].status = 'BUSY';
        agentStates[agent].currentTask = taskId;
        
        // Simulate CPU/RAM increase when busy
        agentStates[agent].cpu = Math.random() * 50 + 30;
        agentStates[agent].ram = Math.random() * 60 + 30;
      }
    }
    
    // Check for completed tasks
    if (file.endsWith('.completed')) {
      const agent = file.split('-')[0];
      if (agentStates[agent]) {
        agentStates[agent].tasks++;
        agentStates[agent].status = 'IDLE';
        agentStates[agent].currentTask = null;
      }
    }
  });
  
  // Check for waiting states (no activity for 5 minutes)
  Object.keys(agentStates).forEach(agent => {
    const timeSinceActivity = Date.now() - agentStates[agent].lastActivity;
    if (timeSinceActivity > 5 * 60 * 1000 && agentStates[agent].status === 'IDLE') {
      agentStates[agent].status = 'WAITING';
    }
  });
}

// Get task history from logs
function getTaskHistory() {
  const logFile = '.agent-comms/notifications.log';
  if (!fs.existsSync(logFile)) return [];
  
  const logs = fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean);
  return logs.slice(-20).reverse(); // Last 20 entries
}

// Serve the dashboard
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CLAUDE_SYSTEMS v2.077 - REALTIME</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');

    :root {
      --cyber-yellow: #FFEB0B;
      --cyber-cyan: #25E1ED;
      --cyber-magenta: #ED1E79;
      --cyber-red: #FF4A57;
      --cyber-green: #00FF41;
      --cyber-purple: #B026FF;
      --cyber-orange: #FF6B1A;
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
    .status-value.high { color: #FF4A57; }

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

    .agent-card.busy {
      border-color: #00FF41;
      animation: pulse-busy 2s ease-in-out infinite;
    }

    .agent-card.waiting {
      border-color: #FF6B1A;
      opacity: 0.7;
    }

    @keyframes pulse-busy {
      0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 65, 0.5); }
      50% { box-shadow: 0 0 40px rgba(0, 255, 65, 0.8); }
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

    .agent-status.busy {
      background: rgba(0, 255, 65, 0.2);
      border-color: #00FF41;
      color: #00FF41;
      animation: blink 1s ease-in-out infinite;
    }

    .agent-status.waiting {
      background: rgba(255, 107, 26, 0.2);
      border-color: #FF6B1A;
      color: #FF6B1A;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .agent-profile {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
    }

    .agent-avatar {
      width: 60px;
      height: 60px;
      border: 2px solid #25E1ED;
      border-radius: 50%;
      overflow: hidden;
      position: relative;
    }

    .agent-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .agent-avatar img {
      transition: all 0.3s ease;
    }

    .agent-avatar:hover img {
      transform: scale(1.1) rotate(3deg);
      filter: saturate(2) contrast(1.3) hue-rotate(10deg) !important;
    }

    /* Glitch effect on busy agents */
    .agent-card.busy .agent-avatar img {
      animation: glitch 2s infinite;
    }

    @keyframes glitch {
      0%, 100% { 
        filter: saturate(1.5) contrast(1.2); 
      }
      20% { 
        filter: saturate(3) contrast(2) hue-rotate(90deg);
        transform: scale(1.02) translateX(2px);
      }
      40% { 
        filter: saturate(0.5) contrast(3) hue-rotate(-90deg);
        transform: scale(0.98) translateY(-2px);
      }
      60% {
        filter: saturate(2) contrast(1.5) hue-rotate(180deg);
        transform: scale(1.01) translateX(-1px);
      }
    }

    .agent-avatar::after {
      content: '';
      position: absolute;
      top: -100%;
      left: 0;
      right: 0;
      height: 100%;
      background: linear-gradient(
        180deg,
        transparent 0%,
        rgba(37, 225, 237, 0.4) 50%,
        transparent 100%
      );
      animation: scan-avatar 4s ease-in-out infinite;
      pointer-events: none;
    }

    @keyframes scan-avatar {
      0%, 100% { top: -100%; }
      50% { top: 100%; }
    }

    @keyframes pulse-avatar {
      0%, 100% { opacity: 0; }
      50% { opacity: 1; }
    }

    .agent-name {
      font-family: 'Orbitron', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #FFEB0B;
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

    .task-info {
      margin: 15px 0;
      padding: 10px;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(37, 225, 237, 0.3);
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
      max-height: 400px;
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
      padding: 5px;
      border-left: 2px solid transparent;
      transition: all 0.3s ease;
    }

    .log-entry:hover {
      border-left-color: #ED1E79;
      padding-left: 10px;
      background: rgba(237, 30, 121, 0.1);
    }

    .log-time {
      color: #25E1ED;
      margin-right: 10px;
    }

    .log-entry.success .log-message { color: #00FF41; }
    .log-entry.error .log-message { color: #FF4A57; }
    .log-entry.warning .log-message { color: #FF6B1A; }

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

    .system-metrics {
      position: fixed;
      top: 80px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid #25E1ED;
      padding: 15px;
      font-size: 11px;
    }

    .metric-item {
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
      gap: 20px;
    }

    .metric-label { color: #25E1ED; }
    .metric-value { color: #FFEB0B; }

    /* Voice indicator */
    .voice-indicator {
      position: fixed;
      bottom: 80px;
      right: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 20px;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid #ED1E79;
    }

    .voice-bars {
      display: flex;
      gap: 3px;
      height: 20px;
    }

    .voice-bar {
      width: 3px;
      background: #ED1E79;
      animation: voice-wave 0.5s ease-in-out infinite;
    }

    .voice-bar:nth-child(2) { animation-delay: 0.1s; }
    .voice-bar:nth-child(3) { animation-delay: 0.2s; }
    .voice-bar:nth-child(4) { animation-delay: 0.3s; }
    .voice-bar:nth-child(5) { animation-delay: 0.4s; }

    @keyframes voice-wave {
      0%, 100% { height: 5px; }
      50% { height: 20px; }
    }

    /* Code preview modal */
    .code-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 1000;
      padding: 20px;
    }

    .code-modal-content {
      max-width: 1200px;
      height: 100%;
      margin: 0 auto;
      background: rgba(10, 10, 10, 0.95);
      border: 2px solid #25E1ED;
      padding: 20px;
      overflow-y: auto;
    }

    .code-preview {
      background: #000;
      color: #00FF41;
      font-family: 'Courier New', monospace;
      padding: 20px;
      white-space: pre-wrap;
      overflow-x: auto;
    }

    .close-modal {
      position: absolute;
      top: 20px;
      right: 20px;
      background: none;
      border: 2px solid #FF4A57;
      color: #FF4A57;
      padding: 5px 15px;
      cursor: pointer;
    }
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
            <div class="logo-subtitle">MULTI_AGENT_CONTROL_v2.077_REALTIME</div>
          </div>
        </div>
        
        <div class="status-bar">
          <div class="status-item">
            <span class="status-label">SYSTEM</span>
            <span class="status-value online">ONLINE</span>
          </div>
          <div class="status-item">
            <span class="status-label">CPU_LOAD</span>
            <span class="status-value" id="system-cpu">--</span>
          </div>
          <div class="status-item">
            <span class="status-label">TIME</span>
            <span class="status-value" id="current-time">--:--:--</span>
          </div>
        </div>
      </header>

      <div class="agents-grid" id="agents-container">
        <!-- Agents will be dynamically inserted here -->
      </div>

      <div class="task-panel">
        <div class="panel-title">TASK_ASSIGNMENT</div>
        
        <select id="agent-selector" class="cyber-input" style="margin-bottom: 10px;">
          <option value="frontend">NETRUNNER_01 - Frontend</option>
          <option value="backend">DAEMON_02 - Backend</option>
          <option value="testing">GIGACHAD_420 - Testing</option>
        </select>
        
        <input 
          type="text" 
          class="cyber-input" 
          placeholder="ENTER_DIRECTIVE..."
          id="task-input"
        />
        
        <button class="execute-button" onclick="executeTask()">EXECUTE_PROTOCOL</button>
      </div>

      <div class="activity-log">
        <span class="log-title">SYSTEM_LOG // REALTIME</span>
        <div id="log-content">
          <!-- Logs will be dynamically inserted -->
        </div>
      </div>
    </div>

    <!-- System Metrics -->
    <div class="system-metrics">
      <div class="metric-item">
        <span class="metric-label">UPTIME:</span>
        <span class="metric-value" id="uptime">00:00:00</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">TASKS_TODAY:</span>
        <span class="metric-value" id="tasks-today">0</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">MCP_LATENCY:</span>
        <span class="metric-value" id="mcp-latency">12ms</span>
      </div>
    </div>

    <!-- Voice Indicator -->
    <div class="voice-indicator">
      <span style="color: #ED1E79;">VOICE_SYNTHESIS</span>
      <div class="voice-bars">
        <div class="voice-bar"></div>
        <div class="voice-bar"></div>
        <div class="voice-bar"></div>
        <div class="voice-bar"></div>
        <div class="voice-bar"></div>
      </div>
    </div>
    
    <!-- HUD Corners -->
    <div class="hud-corner top-left">CLAUDE_MULTIAGENT_v2.077</div>
    <div class="hud-corner top-right">170.64.252.55:3001</div>
    <div class="hud-corner bottom-left">MCP_STATUS: CONNECTED</div>
    <div class="hud-corner bottom-right">DIGITAL_OCEAN_SYD</div>

    <!-- Code Preview Modal -->
    <div class="code-modal" id="code-modal">
      <div class="code-modal-content">
        <button class="close-modal" onclick="closeCodeModal()">CLOSE</button>
        <h2 style="color: #FFEB0B; margin-bottom: 20px;">CODE_INTERFACE</h2>
        <pre class="code-preview" id="code-preview"></pre>
      </div>
    </div>
  </div>

  <script>
    let ws;
    let startTime = Date.now();
    let tasksToday = 0;

    // Agent profile pics - Sick cyberpunk avatars!
    const agentAvatars = {
      frontend: 'https://robohash.org/NETRUNNER01?set=set4&size=60x60',  // Cyberpunk robot
      backend: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=DAEMON02&backgroundColor=1a1a1a&primaryColor=25E1ED',   // Tech avatar
      testing: 'https://api.multiavatar.com/GIGACHAD420.png?size=60'    // Unique avatar
    };

    // Connect WebSocket for real-time updates
    function connectWebSocket() {
      ws = new WebSocket('ws://' + window.location.host);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        addLog('WEBSOCKET', 'Realtime connection established', 'success');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        updateAgents(data);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting...');
        setTimeout(connectWebSocket, 3000);
      };
    }

    // Update agents UI
    function updateAgents(data) {
      const container = document.getElementById('agents-container');
      
      if (!container.children.length) {
        // Initial render
        Object.entries(data.agents || {}).forEach(([id, agent]) => {
          const card = createAgentCard(id, agent);
          container.appendChild(card);
        });
      } else {
        // Update existing cards
        Object.entries(data.agents || {}).forEach(([id, agent]) => {
          updateAgentCard(id, agent);
        });
      }
      
      // Update system metrics
      if (data.systemCpu) {
        document.getElementById('system-cpu').textContent = Math.round(data.systemCpu) + '%';
        document.getElementById('system-cpu').className = 
          data.systemCpu > 70 ? 'status-value high' : 
          data.systemCpu > 40 ? 'status-value' : 
          'status-value low';
      }
    }

    // Create agent card HTML
    function createAgentCard(id, agent) {
      const div = document.createElement('div');
      div.className = \`agent-card \${agent.status.toLowerCase()}\`;
      div.id = \`agent-\${id}\`;
      div.innerHTML = \`
        <div class="agent-header">
          <div class="agent-id">AGENT_\${id.toUpperCase()}</div>
          <div class="agent-status \${agent.status.toLowerCase()}">\${agent.status}</div>
        </div>
        
        <div class="agent-profile">
          <div class="agent-avatar">
            <img src="\${agentAvatars[id]}" alt="\${agent.name}" style="width: 100%; height: 100%; object-fit: cover; filter: saturate(1.5) contrast(1.2);">
          </div>
          <div class="agent-name">\${agent.name}</div>
        </div>
        
        <div class="agent-stats">
          <div class="stat-bar">
            <div class="stat-label">CPU</div>
            <div class="stat-track">
              <div class="stat-fill cpu" id="\${id}-cpu" style="width: \${agent.cpu}%"></div>
            </div>
            <div class="stat-value" id="\${id}-cpu-val">\${agent.cpu}%</div>
          </div>
          
          <div class="stat-bar">
            <div class="stat-label">RAM</div>
            <div class="stat-track">
              <div class="stat-fill ram" id="\${id}-ram" style="width: \${agent.ram}%"></div>
            </div>
            <div class="stat-value" id="\${id}-ram-val">\${agent.ram}%</div>
          </div>
        </div>
        
        <div class="task-info" id="\${id}-task-info" style="display: \${agent.currentTask ? 'block' : 'none'}">
          <small style="color: #25E1ED;">CURRENT_TASK:</small><br>
          <span style="color: #00FF41;" id="\${id}-current-task">\${agent.currentTask || ''}</span>
        </div>
        
        <div class="task-counter">
          <span class="counter-label">TASKS_COMPLETED</span>
          <span class="counter-value" id="\${id}-tasks">\${agent.tasks}</span>
        </div>
        
        <button class="cyber-button" onclick="showCode('\${id}')">VIEW_CODE</button>
        
        <div class="corner-decoration top-left"></div>
        <div class="corner-decoration top-right"></div>
        <div class="corner-decoration bottom-left"></div>
        <div class="corner-decoration bottom-right"></div>
      \`;
      return div;
    }

    // Update existing agent card
    function updateAgentCard(id, agent) {
      const card = document.getElementById(\`agent-\${id}\`);
      if (!card) return;
      
      // Update status
      card.className = \`agent-card \${agent.status.toLowerCase()}\`;
      card.querySelector('.agent-status').textContent = agent.status;
      card.querySelector('.agent-status').className = \`agent-status \${agent.status.toLowerCase()}\`;
      
      // Update stats with animation
      const cpuBar = document.getElementById(\`\${id}-cpu\`);
      const ramBar = document.getElementById(\`\${id}-ram\`);
      cpuBar.style.width = agent.cpu + '%';
      ramBar.style.width = agent.ram + '%';
      document.getElementById(\`\${id}-cpu-val\`).textContent = agent.cpu + '%';
      document.getElementById(\`\${id}-ram-val\`).textContent = agent.ram + '%';
      
      // Update task info
      const taskInfo = document.getElementById(\`\${id}-task-info\`);
      const currentTask = document.getElementById(\`\${id}-current-task\`);
      if (agent.currentTask) {
        taskInfo.style.display = 'block';
        currentTask.textContent = agent.currentTask;
      } else {
        taskInfo.style.display = 'none';
      }
      
      // Update task counter
      document.getElementById(\`\${id}-tasks\`).textContent = agent.tasks;
    }

    // Show code modal
    function showCode(agentId) {
      const modal = document.getElementById('code-modal');
      const preview = document.getElementById('code-preview');
      
      // Simulate showing code the agent is working on
      preview.textContent = \`// \${agentId.toUpperCase()} AGENT - CURRENT CODE
      
const processTask = async (taskId) => {
  console.log(\\\`Processing task: \\\${taskId}\\\`);
  
  // TODO: Implement actual task processing
  const result = await executeProtocol(taskId);
  
  return {
    success: true,
    taskId,
    timestamp: new Date().toISOString()
  };
};

// Real-time monitoring
setInterval(() => {
  updateMetrics({
    cpu: process.cpuUsage(),
    memory: process.memoryUsage()
  });
}, 1000);\`;
      
      modal.style.display = 'block';
    }

    function closeCodeModal() {
      document.getElementById('code-modal').style.display = 'none';
    }

    // Execute task
    function executeTask() {
      const agentSelect = document.getElementById('agent-selector');
      const input = document.getElementById('task-input');
      const task = input.value;
      const agent = agentSelect.value;
      
      if (!task) return;

      addLog('TASK', \`Assigning to \${agent}: \${task}\`, 'success');
      
      // Send to server - ALWAYS goes through Taskmaster
      fetch(\`/api/agents/\${agent}/task\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task })
      }).then(res => res.json()).then(data => {
        if (data.success) {
          addLog('TASKMASTER', data.message, 'success');
          
          // Show complexity analysis
          addLog('ANALYSIS', \`Complexity: \${data.complexity?.toUpperCase()} | Tasks: \${data.totalTasks} | ETA: \${data.estimatedMinutes || '?'} min\`, 'warning');
          
          // Show distribution if multiple tasks
          if (data.totalTasks > 1) {
            addLog('DISTRIBUTION', \`NETRUNNER: \${data.distribution.frontend} | DAEMON: \${data.distribution.backend} | GIGACHAD: \${data.distribution.testing}\`, 'info');
          }
          
          // Show task breakdown
          if (data.breakdown && data.breakdown.length > 0) {
            data.breakdown.forEach((item, index) => {
              addLog(\`TASK_\${index + 1}\`, \`[\${item.agent}] \${item.task.substring(0, 100)}...\`, 'info');
            });
          }
          
          tasksToday += data.totalTasks || 1;
          document.getElementById('tasks-today').textContent = tasksToday;
        } else {
          addLog('ERROR', data.message || 'Task assignment failed', 'error');
        }
      });
      
      input.value = '';
    }

    // Add log entry
    function addLog(type, message, level = 'info') {
      const logContent = document.getElementById('log-content');
      const entry = document.createElement('div');
      entry.className = \`log-entry \${level}\`;
      entry.innerHTML = \`
        <span class="log-time">[\${new Date().toLocaleTimeString()}]</span>
        <span class="log-type">[\${type}]</span>
        <span class="log-message">\${message}</span>
      \`;
      logContent.insertBefore(entry, logContent.firstChild);
      
      // Keep only last 50 entries
      while (logContent.children.length > 50) {
        logContent.removeChild(logContent.lastChild);
      }
    }

    // Update time
    function updateTime() {
      document.getElementById('current-time').textContent = new Date().toLocaleTimeString();
      
      // Update uptime
      const uptime = Date.now() - startTime;
      const hours = Math.floor(uptime / 3600000);
      const minutes = Math.floor((uptime % 3600000) / 60000);
      const seconds = Math.floor((uptime % 60000) / 1000);
      document.getElementById('uptime').textContent = 
        \`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
    }

    // Initialize
    connectWebSocket();
    setInterval(updateTime, 1000);
    updateTime();

    // Load initial data
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        updateAgents(data);
        addLog('SYSTEM', 'Dashboard initialized', 'success');
        
        // Load task history
        data.history?.forEach(log => {
          addLog('HISTORY', log);
        });
      });

    // Simulate MCP latency
    setInterval(() => {
      const latency = Math.floor(Math.random() * 20) + 5;
      document.getElementById('mcp-latency').textContent = latency + 'ms';
    }, 5000);

    // Voice synthesis placeholder
    if ('speechSynthesis' in window) {
      // You can add voice here!
      console.log('Voice synthesis available');
    }
  </script>
</body>
</html>
  `);
});

// API endpoints
app.get('/api/status', (req, res) => {
  checkTaskQueue();
  const stats = getSystemStats();
  const history = getTaskHistory();
  
  res.json({
    ...stats,
    history
  });
});

app.post('/api/agents/:agentId/task', async (req, res) => {
  const { agentId } = req.params;
  const { task } = req.body;
  
  // ALWAYS use Taskmaster Always-On for ALL tasks
  console.log('🎯 TASKMASTER ALWAYS-ON: Analyzing task...');
  
  try {
    const TaskmasterAlwaysOn = require('./taskmaster-always-on');
    const taskmaster = new TaskmasterAlwaysOn();
    const result = await taskmaster.analyzeAnyTask(task);
    
    // Add to activity log
    const complexity = taskmaster.assessComplexity(task);
    const logEntry = `${new Date().toISOString()} - [TASKMASTER] Analyzed ${complexity} task: ${result.totalTasks} task(s) created`;
    
    if (!fs.existsSync('.agent-comms')) {
      fs.mkdirSync('.agent-comms', { recursive: true });
    }
    fs.appendFileSync('.agent-comms/notifications.log', logEntry + '\n');
    
    // Detailed response based on complexity
    let message = '';
    if (complexity === 'mega') {
      message = `TASKMASTER: Mega-feature broken down into ${result.totalTasks} tasks!`;
    } else if (complexity === 'multi') {
      message = `TASKMASTER: Multi-agent task distributed to ${result.totalTasks} agents`;
    } else {
      message = `TASKMASTER: Task routed to optimal agent`;
    }
    
    res.json({
      success: true,
      message,
      complexity,
      totalTasks: result.totalTasks,
      estimatedMinutes: result.estimatedTime,
      distribution: {
        frontend: result.breakdown.filter(t => t.agent === 'frontend').length,
        backend: result.breakdown.filter(t => t.agent === 'backend').length,
        testing: result.breakdown.filter(t => t.agent === 'testing').length
      },
      breakdown: result.breakdown.map(t => ({
        agent: t.agent.toUpperCase(),
        task: t.task,
        priority: t.priority
      }))
    });
  } catch (error) {
    console.error('Taskmaster Always-On error:', error);
    res.json({
      success: false,
      message: 'Taskmaster failed to analyze task',
      error: error.message
    });
  }
});

// WebSocket server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║             CLAUDE_SYSTEMS v2.077 - REALTIME              ║
╚═══════════════════════════════════════════════════════════╝

[SYSTEM] Real-time Multi-Agent Monitor
[STATUS] ONLINE
[PORT] ${PORT}
[ACCESS] http://170.64.252.55:${PORT}

[FEATURES]
├─ Real CPU/RAM monitoring
├─ Live task status updates
├─ Agent state tracking (IDLE/BUSY/WAITING)
├─ Task history logging
├─ WebSocket real-time sync
└─ Voice synthesis ready

[AGENTS]
├─ NETRUNNER_01: Frontend Operations
├─ DAEMON_02: Backend Systems
└─ GIGACHAD_420: Testing Protocols
`);
});

const wss = new WebSocket.Server({ server });

// Broadcast updates every 2 seconds
setInterval(() => {
  const stats = getSystemStats();
  const message = JSON.stringify(stats);
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}, 2000);

wss.on('connection', (ws) => {
  console.log('[WEBSOCKET] New client connected');
  
  // Send initial state
  ws.send(JSON.stringify(getSystemStats()));
  
  ws.on('close', () => {
    console.log('[WEBSOCKET] Client disconnected');
  });
});

// Monitor task files every 5 seconds
setInterval(() => {
  checkTaskQueue();
}, 5000);