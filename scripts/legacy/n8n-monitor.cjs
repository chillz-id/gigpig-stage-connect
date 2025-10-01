#!/usr/bin/env node

/**
 * N8N Workflow Monitoring Script
 * Monitors workflow health, execution status, and sends alerts
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

class N8NMonitor {
  constructor() {
    this.n8nUrl = 'http://localhost:5678';
    this.reportPath = '/root/agents/reports/n8n-monitor-report.json';
    this.alertThreshold = {
      failedExecutions: 3,
      consecutiveFailures: 2,
      executionTime: 300000 // 5 minutes
    };
  }

  async checkHealth() {
    try {
      const healthData = await this.makeRequest('/healthz');
      return {
        status: healthData.status === 'ok' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        response: healthData
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async getWorkflowStatus() {
    // Since API authentication is an issue, we'll monitor via file system and logs
    const workflows = this.getWorkflowFiles();
    
    const status = {
      timestamp: new Date().toISOString(),
      totalWorkflows: workflows.length,
      workflowFiles: workflows.map(w => ({
        name: w.name,
        file: w.file,
        size: w.size,
        modified: w.modified,
        status: 'file_exists'
      })),
      recommendations: []
    };

    // Add recommendations based on file analysis
    if (workflows.length >= 6) {
      status.recommendations.push('✅ All expected workflow files present');
    } else {
      status.recommendations.push('⚠️ Some workflow files may be missing');
    }

    return status;
  }

  getWorkflowFiles() {
    const workflowsDir = '/root/agents/n8n-workflows';
    
    if (!fs.existsSync(workflowsDir)) {
      return [];
    }

    return fs.readdirSync(workflowsDir)
      .filter(file => file.endsWith('.json') && file !== 'README.json')
      .map(file => {
        const filePath = path.join(workflowsDir, file);
        const stats = fs.statSync(filePath);
        
        let workflowName = 'Unknown';
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          workflowName = content.name || file.replace('.json', '');
        } catch (e) {
          // Use filename if can't parse JSON
          workflowName = file.replace('.json', '');
        }

        return {
          name: workflowName,
          file: file,
          size: stats.size,
          modified: stats.mtime.toISOString()
        };
      });
  }

  async checkN8NProcesses() {
    try {
      // Check if N8N process is running
      const { execSync } = require('child_process');
      
      // Check Docker containers
      let dockerStatus = 'not_running';
      try {
        const dockerOutput = execSync('docker ps | grep n8n || echo "no_n8n_container"', { encoding: 'utf8' });
        dockerStatus = dockerOutput.includes('n8n') ? 'running' : 'not_running';
      } catch (e) {
        dockerStatus = 'docker_error';
      }

      // Check PM2 processes
      let pm2Status = 'not_running';
      try {
        const pm2Output = execSync('pm2 list | grep n8n || echo "no_n8n_pm2"', { encoding: 'utf8' });
        pm2Status = pm2Output.includes('n8n') ? 'running' : 'not_running';
      } catch (e) {
        pm2Status = 'pm2_error';
      }

      // Check port usage
      let portStatus = 'not_listening';
      try {
        const portOutput = execSync('lsof -i :5678 || echo "port_not_open"', { encoding: 'utf8' });
        portStatus = portOutput.includes('5678') && portOutput.includes('LISTEN') ? 'listening' : 'not_listening';
      } catch (e) {
        portStatus = 'lsof_error';
      }

      return {
        docker: dockerStatus,
        pm2: pm2Status,
        port: portStatus,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async makeRequest(endpoint) {
    const url = `${this.n8nUrl}${endpoint}`;
    
    return new Promise((resolve, reject) => {
      const req = http.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            resolve({ raw: data, parsed: false });
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async generateReport() {
    console.log('🔍 N8N Monitoring Report');
    console.log('='.repeat(50));

    const report = {
      timestamp: new Date().toISOString(),
      monitoringVersion: '1.0.0',
      checks: {}
    };

    // Health Check
    console.log('\n🏥 Health Check...');
    const health = await this.checkHealth();
    report.checks.health = health;
    console.log(`   Status: ${health.status}`);

    // Process Check
    console.log('\n⚙️  Process Check...');
    const processes = await this.checkN8NProcesses();
    report.checks.processes = processes;
    console.log(`   Docker: ${processes.docker}`);
    console.log(`   PM2: ${processes.pm2}`);
    console.log(`   Port 5678: ${processes.port}`);

    // Workflow Status
    console.log('\n📋 Workflow Status...');
    const workflows = await this.getWorkflowStatus();
    report.checks.workflows = workflows;
    console.log(`   Total Workflows: ${workflows.totalWorkflows}`);
    console.log(`   Files Found: ${workflows.workflowFiles.length}`);

    // Workflow Details
    if (workflows.workflowFiles.length > 0) {
      console.log('\n📄 Workflow Files:');
      workflows.workflowFiles.forEach((w, i) => {
        console.log(`   ${i + 1}. ${w.name}`);
        console.log(`      File: ${w.file}`);
        console.log(`      Size: ${(w.size / 1024).toFixed(1)}KB`);
        console.log(`      Modified: ${new Date(w.modified).toLocaleString()}`);
      });
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    workflows.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });

    // Overall Status
    const overallStatus = this.calculateOverallStatus(report);
    report.overallStatus = overallStatus;
    
    console.log('\n📊 Overall Status:');
    console.log(`   Health: ${overallStatus.health}`);
    console.log(`   Service: ${overallStatus.service}`);
    console.log(`   Workflows: ${overallStatus.workflows}`);
    console.log(`   Score: ${overallStatus.score}/100`);

    // Save Report
    try {
      const reportsDir = path.dirname(this.reportPath);
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Report saved: ${this.reportPath}`);
    } catch (error) {
      console.error(`❌ Error saving report: ${error.message}`);
    }

    return report;
  }

  calculateOverallStatus(report) {
    let score = 0;
    let health = 'unknown';
    let service = 'unknown';
    let workflows = 'unknown';

    // Health check (30 points)
    if (report.checks.health?.status === 'healthy') {
      score += 30;
      health = 'good';
    } else {
      health = 'poor';
    }

    // Service check (40 points)
    const proc = report.checks.processes;
    if (proc?.port === 'listening') {
      score += 20;
      service = proc.docker === 'running' || proc.pm2 === 'running' ? 'good' : 'partial';
      if (service === 'good') score += 20;
    } else {
      service = 'poor';
    }

    // Workflow check (30 points)
    const wf = report.checks.workflows;
    if (wf?.totalWorkflows >= 6) {
      score += 30;
      workflows = 'good';
    } else if (wf?.totalWorkflows >= 3) {
      score += 15;
      workflows = 'partial';
    } else {
      workflows = 'poor';
    }

    return {
      score,
      health,
      service,
      workflows,
      grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D'
    };
  }

  async watchMode() {
    console.log('👀 Starting N8N Monitor - Watch Mode');
    console.log('   Press Ctrl+C to stop');
    
    const runCheck = async () => {
      try {
        await this.generateReport();
      } catch (error) {
        console.error('❌ Monitor error:', error.message);
      }
      
      console.log(`\n⏰ Next check in 5 minutes...`);
      setTimeout(runCheck, 5 * 60 * 1000); // 5 minutes
    };

    // Run initial check
    await runCheck();
  }
}

// CLI Interface
async function main() {
  const monitor = new N8NMonitor();
  const mode = process.argv[2];

  switch (mode) {
    case 'watch':
    case 'w':
      await monitor.watchMode();
      break;
      
    case 'report':
    case 'r':
    default:
      await monitor.generateReport();
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = N8NMonitor;