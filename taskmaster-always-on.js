#!/usr/bin/env node

/**
 * Taskmaster Always-On Integration
 * EVERY task goes through Taskmaster for analysis, even simple ones
 */

const TaskmasterOrchestrator = require('./taskmaster-orchestrator');

class TaskmasterAlwaysOn extends TaskmasterOrchestrator {
  constructor() {
    super();
    this.minTaskSize = 10; // Even tiny tasks get analyzed
  }

  async analyzeAnyTask(taskDescription) {
    console.log(`\n🎯 TASKMASTER: Analyzing task (size: ${taskDescription.length} chars)...`);
    
    // Determine if it's a mega-feature or simple task
    const complexity = this.assessComplexity(taskDescription);
    
    if (complexity === 'mega') {
      // Full breakdown for complex features
      return await this.analyzeMegaFeature(taskDescription);
    } else if (complexity === 'multi') {
      // Medium complexity - might need 2-3 agents
      return await this.analyzeMultiAgentTask(taskDescription);
    } else {
      // Simple task - but still analyze for optimal routing
      return await this.analyzeSimpleTask(taskDescription);
    }
  }

  assessComplexity(task) {
    const indicators = {
      mega: [
        /complete.*system/i,
        /full.*feature/i,
        /everything/i,
        /entire/i,
        /comprehensive/i,
        /all.*functionality/i
      ],
      multi: [
        /with.*and/i,
        /including/i,
        /also/i,
        /plus/i,
        /as well as/i
      ]
    };
    
    // Check length
    if (task.length > 150) return 'mega';
    if (task.length > 80) return 'multi';
    
    // Check indicators
    if (indicators.mega.some(pattern => pattern.test(task))) return 'mega';
    if (indicators.multi.some(pattern => pattern.test(task))) return 'multi';
    
    // Check component count
    const componentCount = (task.match(/and|with|plus|also/gi) || []).length;
    if (componentCount > 3) return 'mega';
    if (componentCount > 1) return 'multi';
    
    return 'simple';
  }

  async analyzeMultiAgentTask(task) {
    console.log(`📊 Multi-agent task detected. Analyzing optimal distribution...`);
    
    const tasks = [];
    const lower = task.toLowerCase();
    
    // Smart detection for multi-agent needs
    const needsFrontend = /ui|button|page|form|display|show|view|component|style|layout|responsive/i.test(task);
    const needsBackend = /api|data|save|fetch|endpoint|database|server|auth|integration/i.test(task);
    const needsTesting = /test|quality|ensure|verify|check|validate/i.test(task);
    
    // Create ordered tasks
    let order = 0;
    
    if (needsBackend) {
      tasks.push({
        id: `backend-${Date.now()}`,
        agent: 'backend',
        priority: 1,
        order: order++,
        task: `[Backend] ${task} - Focus on data and API aspects`,
        dependencies: []
      });
    }
    
    if (needsFrontend) {
      const deps = needsBackend ? [`backend-${Date.now()}`] : [];
      tasks.push({
        id: `frontend-${Date.now()}`,
        agent: 'frontend',
        priority: needsBackend ? 2 : 1,
        order: order++,
        task: `[Frontend] ${task} - Focus on UI/UX implementation`,
        dependencies: deps
      });
    }
    
    if (needsTesting || (needsFrontend && needsBackend)) {
      // Always test multi-agent work
      tasks.push({
        id: `testing-${Date.now()}`,
        agent: 'testing',
        priority: 3,
        order: order++,
        task: `[Testing] Comprehensive tests for: ${task}`,
        dependencies: tasks.map(t => t.id)
      });
    }
    
    // If no specific agent detected, use smart routing
    if (tasks.length === 0) {
      const SmartTaskRouter = require('./smart-task-router');
      const router = new SmartTaskRouter();
      const agents = router.analyzeTask(task);
      
      if (agents && agents.length > 0) {
        agents.forEach((agent, index) => {
          tasks.push({
            id: `${agent}-${Date.now()}`,
            agent,
            priority: index + 1,
            order: index,
            task: router.generateAgentSpecificTask(agent, task),
            dependencies: []
          });
        });
      }
    }
    
    await this.createTasksInOrder(tasks);
    
    return {
      totalTasks: tasks.length,
      breakdown: tasks,
      estimatedTime: tasks.length * 7.5
    };
  }

  async analyzeSimpleTask(task) {
    console.log(`📝 Simple task. Determining optimal agent...`);
    
    const SmartTaskRouter = require('./smart-task-router');
    const router = new SmartTaskRouter();
    const agents = router.analyzeTask(task);
    
    const tasks = [];
    
    if (agents && agents.length > 0) {
      // Single agent, but still create proper task structure
      const agent = agents[0];
      tasks.push({
        id: `${agent}-${Date.now()}`,
        agent,
        priority: 1,
        order: 0,
        task,
        dependencies: []
      });
      
      // Consider if testing is needed
      if (!task.toLowerCase().includes('test') && agent !== 'testing') {
        const shouldTest = /critical|important|payment|auth|security/i.test(task);
        if (shouldTest) {
          tasks.push({
            id: `testing-${Date.now()}`,
            agent: 'testing',
            priority: 2,
            order: 1,
            task: `Write tests for: ${task}`,
            dependencies: [tasks[0].id]
          });
        }
      }
    } else {
      // Default to frontend for unclear tasks
      tasks.push({
        id: `frontend-${Date.now()}`,
        agent: 'frontend',
        priority: 1,
        order: 0,
        task,
        dependencies: []
      });
    }
    
    await this.createTasksInOrder(tasks);
    
    return {
      totalTasks: tasks.length,
      breakdown: tasks,
      estimatedTime: tasks.length * 5 // Simple tasks are faster
    };
  }

  // Override to always create task metadata
  async createTasksInOrder(orderedTasks) {
    console.log(`\n📋 TASKMASTER creating ${orderedTasks.length} optimized tasks:`);
    
    // Group by agent for summary
    const agentSummary = {
      frontend: 0,
      backend: 0,
      testing: 0
    };
    
    orderedTasks.forEach(task => {
      agentSummary[task.agent]++;
    });
    
    console.log(`\n📊 Distribution:`);
    console.log(`  NETRUNNER_01: ${agentSummary.frontend} tasks`);
    console.log(`  DAEMON_02: ${agentSummary.backend} tasks`);
    console.log(`  GIGACHAD_420: ${agentSummary.testing} tasks`);
    
    // Call parent method to actually create tasks
    await super.createTasksInOrder(orderedTasks);
    
    // Log execution order
    console.log(`\n⚡ Execution Order:`);
    orderedTasks.forEach((task, index) => {
      const deps = task.dependencies.length > 0 ? ` (depends on: ${task.dependencies.join(', ')})` : '';
      console.log(`  ${index + 1}. [${task.agent.toUpperCase()}] ${task.task}${deps}`);
    });
  }
}

// Export for use
module.exports = TaskmasterAlwaysOn;

// Test if run directly
if (require.main === module) {
  const taskmaster = new TaskmasterAlwaysOn();
  
  const testTasks = [
    "Add a loading spinner to the submit button",
    "Create user profile page with edit functionality",
    "Build complete analytics dashboard with charts, filters, and export",
    "Fix the navigation menu on mobile",
    "Implement OAuth login with Google and GitHub",
    "Write tests for the booking system"
  ];
  
  console.log('🧪 Testing Taskmaster Always-On:\n');
  
  (async () => {
    for (const task of testTasks) {
      await taskmaster.analyzeAnyTask(task);
      console.log('\n' + '='.repeat(80) + '\n');
    }
  })();
}