#!/usr/bin/env node

/**
 * Agent Task Manager - Orchestrates work across all agents
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class AgentTaskManager {
  constructor() {
    this.taskQueue = '.agent-comms/task-queue';
    this.agents = ['frontend', 'backend', 'testing'];
    
    if (!fs.existsSync(this.taskQueue)) {
      fs.mkdirSync(this.taskQueue, { recursive: true });
    }
  }

  createTask(agent, description, priority = 'medium') {
    const taskId = `TASK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filename = `${agent}-${taskId}.md`;
    const filepath = path.join(this.taskQueue, filename);
    
    const content = `# ${taskId}
AGENT: ${agent.toUpperCase()}
PRIORITY: ${priority}
CREATED: ${new Date().toISOString()}
STATUS: PENDING

## DIRECTIVE
${description}

## ACCEPTANCE CRITERIA
- Task completed successfully
- Code follows project standards
- Changes are tested (if applicable)
- Documentation updated (if needed)

## EXECUTION LOG
- Task created by Task Manager
- Waiting for ${agent} agent to process...
`;

    fs.writeFileSync(filepath, content);
    console.log(`✅ Task created: ${filename}`);
    return taskId;
  }

  async distributeWork(workDescription) {
    console.log(`\n🎯 Analyzing work: "${workDescription}"`);
    
    // Smart task distribution based on keywords
    const tasks = [];
    
    const lowerDesc = workDescription.toLowerCase();
    
    // Frontend keywords
    if (lowerDesc.match(/button|component|ui|style|css|design|layout|responsive|animation/)) {
      tasks.push({
        agent: 'frontend',
        task: `Frontend: ${workDescription}`,
        priority: 'high'
      });
    }
    
    // Backend keywords
    if (lowerDesc.match(/api|endpoint|database|server|auth|integration|webhook/)) {
      tasks.push({
        agent: 'backend',
        task: `Backend: ${workDescription}`,
        priority: 'high'
      });
    }
    
    // Testing keywords
    if (lowerDesc.match(/test|spec|coverage|quality|validation/)) {
      tasks.push({
        agent: 'testing',
        task: `Testing: ${workDescription}`,
        priority: 'medium'
      });
    }
    
    // If no specific match, assign to most appropriate agent
    if (tasks.length === 0) {
      if (lowerDesc.includes('page') || lowerDesc.includes('form')) {
        tasks.push({ agent: 'frontend', task: workDescription, priority: 'medium' });
      } else {
        tasks.push({ agent: 'backend', task: workDescription, priority: 'medium' });
      }
    }
    
    // Always add tests for significant features
    if (tasks.length > 0 && !tasks.find(t => t.agent === 'testing')) {
      tasks.push({
        agent: 'testing',
        task: `Write tests for: ${workDescription}`,
        priority: 'low'
      });
    }
    
    // Create all tasks
    console.log(`\n📋 Creating ${tasks.length} tasks:`);
    tasks.forEach(({ agent, task, priority }) => {
      console.log(`  - ${agent}: ${task} [${priority}]`);
      this.createTask(agent, task, priority);
    });
    
    return tasks;
  }

  getQueueStatus() {
    const files = fs.readdirSync(this.taskQueue);
    const status = {
      pending: 0,
      processing: 0,
      completed: 0,
      byAgent: {}
    };
    
    this.agents.forEach(agent => {
      status.byAgent[agent] = { pending: 0, processing: 0, completed: 0 };
    });
    
    files.forEach(file => {
      const agent = file.split('-')[0];
      if (file.includes('.completed')) {
        status.completed++;
        if (status.byAgent[agent]) status.byAgent[agent].completed++;
      } else if (file.includes('.processing')) {
        status.processing++;
        if (status.byAgent[agent]) status.byAgent[agent].processing++;
      } else if (file.endsWith('.md')) {
        status.pending++;
        if (status.byAgent[agent]) status.byAgent[agent].pending++;
      }
    });
    
    return status;
  }

  getCompletedWork() {
    const files = fs.readdirSync(this.taskQueue);
    const completed = files.filter(f => f.includes('.completed'));
    
    const work = completed.map(file => {
      const content = fs.readFileSync(path.join(this.taskQueue, file), 'utf8');
      const agent = file.split('-')[0];
      const directiveMatch = content.match(/## DIRECTIVE\n(.+)/);
      const resultMatch = content.match(/## RESULT\n(.+)/);
      
      return {
        agent,
        file,
        task: directiveMatch ? directiveMatch[1] : 'Unknown',
        result: resultMatch ? resultMatch[1] : 'No result',
        timestamp: fs.statSync(path.join(this.taskQueue, file)).mtime
      };
    });
    
    return work.sort((a, b) => b.timestamp - a.timestamp);
  }

  clearCompleted() {
    const files = fs.readdirSync(this.taskQueue);
    const completed = files.filter(f => f.includes('.completed'));
    
    completed.forEach(file => {
      fs.unlinkSync(path.join(this.taskQueue, file));
    });
    
    console.log(`🧹 Cleared ${completed.length} completed tasks`);
  }

  async interactiveMode() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'TaskManager> '
    });
    
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║            AGENT TASK MANAGER - COMMAND CENTER            ║
╚═══════════════════════════════════════════════════════════╝

Commands:
  task <description>  - Create and distribute tasks
  status             - Show queue status
  work               - Show completed work
  clear              - Clear completed tasks
  help               - Show this help
  exit               - Exit

Example: task Add dark mode toggle to settings page
`);
    
    rl.prompt();
    
    rl.on('line', async (line) => {
      const [command, ...args] = line.trim().split(' ');
      
      switch (command) {
        case 'task':
          if (args.length > 0) {
            await this.distributeWork(args.join(' '));
          } else {
            console.log('Usage: task <description>');
          }
          break;
          
        case 'status':
          const status = this.getQueueStatus();
          console.log('\n📊 Queue Status:');
          console.log(`Total - Pending: ${status.pending}, Processing: ${status.processing}, Completed: ${status.completed}`);
          console.log('\nBy Agent:');
          Object.entries(status.byAgent).forEach(([agent, counts]) => {
            console.log(`  ${agent}: P:${counts.pending} | R:${counts.processing} | C:${counts.completed}`);
          });
          break;
          
        case 'work':
          const work = this.getCompletedWork();
          console.log('\n✅ Completed Work (Recent First):');
          work.slice(0, 10).forEach(w => {
            console.log(`\n[${w.agent.toUpperCase()}] ${w.task}`);
            console.log(`Result: ${w.result}`);
            console.log(`Time: ${w.timestamp.toLocaleString()}`);
          });
          break;
          
        case 'clear':
          this.clearCompleted();
          break;
          
        case 'help':
          console.log(`
Commands:
  task <description>  - Create and distribute tasks
  status             - Show queue status  
  work               - Show completed work
  clear              - Clear completed tasks
  help               - Show this help
  exit               - Exit
          `);
          break;
          
        case 'exit':
          console.log('👋 Goodbye!');
          process.exit(0);
          break;
          
        default:
          if (command) {
            console.log(`Unknown command: ${command}. Type 'help' for commands.`);
          }
      }
      
      rl.prompt();
    });
  }
}

// Run in interactive mode if called directly
if (require.main === module) {
  const manager = new AgentTaskManager();
  manager.interactiveMode();
}

module.exports = AgentTaskManager;