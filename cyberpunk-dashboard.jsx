import React, { useState, useEffect } from 'react';
import './cyberpunk-dashboard.css';

const CyberpunkDashboard = () => {
  const [agents, setAgents] = useState([
    { id: 'frontend', name: 'NETRUNNER_01', status: 'IDLE', cpu: 12, ram: 23, tasks: 0 },
    { id: 'backend', name: 'DAEMON_02', status: 'IDLE', cpu: 8, ram: 19, tasks: 0 },
    { id: 'testing', name: 'ICE_BREAKER_03', status: 'IDLE', cpu: 5, ram: 15, tasks: 0 }
  ]);
  
  const [glitchActive, setGlitchActive] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 8000);
    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <div className="cyberpunk-container">
      {/* Animated Background Grid */}
      <div className="cyber-grid"></div>
      
      {/* Main Dashboard */}
      <div className="dashboard-wrapper">
        {/* Header */}
        <header className={`cyber-header ${glitchActive ? 'glitch' : ''}`}>
          <div className="logo-section">
            <div className="cyber-logo">
              <span className="logo-text" data-text="CLAUDE_SYSTEMS">CLAUDE_SYSTEMS</span>
              <div className="logo-subtitle">MULTI_AGENT_CONTROL_v2.077</div>
            </div>
          </div>
          
          <div className="status-bar">
            <div className="status-item">
              <span className="status-label">SYSTEM</span>
              <span className="status-value online">ONLINE</span>
            </div>
            <div className="status-item">
              <span className="status-label">THREAT_LEVEL</span>
              <span className="status-value low">LOW</span>
            </div>
            <div className="status-item">
              <span className="status-label">TIME</span>
              <span className="status-value">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </header>

        {/* Agent Grid */}
        <div className="agents-grid">
          {agents.map((agent, index) => (
            <div 
              key={agent.id}
              className={`agent-card ${agent.status === 'ACTIVE' ? 'active' : ''} ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
              onClick={() => setSelectedAgent(agent)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="agent-header">
                <div className="agent-id">AGENT_{agent.id.toUpperCase()}</div>
                <div className={`agent-status ${agent.status.toLowerCase()}`}>
                  {agent.status}
                </div>
              </div>
              
              <div className="agent-name">{agent.name}</div>
              
              <div className="agent-stats">
                <div className="stat-bar">
                  <div className="stat-label">CPU</div>
                  <div className="stat-track">
                    <div className="stat-fill cpu" style={{ width: `${agent.cpu}%` }}></div>
                  </div>
                  <div className="stat-value">{agent.cpu}%</div>
                </div>
                
                <div className="stat-bar">
                  <div className="stat-label">RAM</div>
                  <div className="stat-track">
                    <div className="stat-fill ram" style={{ width: `${agent.ram}%` }}></div>
                  </div>
                  <div className="stat-value">{agent.ram}%</div>
                </div>
              </div>
              
              <div className="agent-footer">
                <div className="task-counter">
                  <span className="counter-label">TASKS_COMPLETED</span>
                  <span className="counter-value">{agent.tasks}</span>
                </div>
                
                <button className="cyber-button">
                  <span className="button-text">INTERFACE</span>
                  <div className="button-glow"></div>
                </button>
              </div>
              
              {/* Animated Corner Decorations */}
              <div className="corner-decoration top-left"></div>
              <div className="corner-decoration top-right"></div>
              <div className="corner-decoration bottom-left"></div>
              <div className="corner-decoration bottom-right"></div>
            </div>
          ))}
        </div>

        {/* Task Assignment Panel */}
        <div className="task-panel">
          <div className="panel-header">
            <span className="panel-title" data-text="TASK_ASSIGNMENT">TASK_ASSIGNMENT</span>
            <div className="panel-status">READY</div>
          </div>
          
          <div className="task-input-wrapper">
            <input 
              type="text" 
              className="cyber-input" 
              placeholder="ENTER_DIRECTIVE..."
            />
            <div className="input-scanline"></div>
          </div>
          
          <div className="target-selector">
            <div className="selector-label">TARGET_AGENT</div>
            <div className="selector-options">
              {agents.map(agent => (
                <button 
                  key={agent.id}
                  className={`selector-option ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAgent(agent)}
                >
                  {agent.id.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          <button className="execute-button">
            <span className="execute-text">EXECUTE_PROTOCOL</span>
            <div className="execute-pulse"></div>
          </button>
        </div>

        {/* Activity Log */}
        <div className="activity-log">
          <div className="log-header">
            <span className="log-title">SYSTEM_LOG</span>
            <div className="log-indicator"></div>
          </div>
          <div className="log-content">
            <div className="log-entry">
              <span className="log-time">[{new Date().toLocaleTimeString()}]</span>
              <span className="log-message">System initialized. All agents online.</span>
            </div>
            <div className="log-entry success">
              <span className="log-time">[{new Date().toLocaleTimeString()}]</span>
              <span className="log-message">Connection established to MCP_SERVER</span>
            </div>
            <div className="log-entry">
              <span className="log-time">[{new Date().toLocaleTimeString()}]</span>
              <span className="log-message">Awaiting directives...</span>
            </div>
          </div>
          <div className="log-scanline"></div>
        </div>
      </div>
      
      {/* Floating HUD Elements */}
      <div className="hud-overlay">
        <div className="hud-corner top-left">
          <div className="hud-text">CLAUDE_MULTIAGENT_v2.077</div>
        </div>
        <div className="hud-corner top-right">
          <div className="hud-text">170.64.252.55:3001</div>
        </div>
        <div className="hud-corner bottom-left">
          <div className="hud-text">MCP_STATUS: CONNECTED</div>
        </div>
        <div className="hud-corner bottom-right">
          <div className="hud-text">DIGITAL_OCEAN_SYD</div>
        </div>
      </div>
    </div>
  );
};

export default CyberpunkDashboard;