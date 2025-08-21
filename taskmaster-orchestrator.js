#!/usr/bin/env node

/**
 * Taskmaster Orchestrator - Intelligent task breakdown and prioritization
 * Uses smart analysis to break down large features and assign in optimal order
 */

const fs = require('fs');
const path = require('path');
const SmartTaskRouter = require('./smart-task-router');

class TaskmasterOrchestrator {
  constructor() {
    this.router = new SmartTaskRouter();
    this.taskQueue = '.agent-comms/task-queue';
    this.taskGraph = new Map(); // For dependency tracking
    
    // Task priorities based on dependencies
    this.priorities = {
      'database': 1,      // Backend first
      'api': 2,           // Then API
      'types': 3,         // TypeScript types
      'components': 4,    // UI components
      'pages': 5,         // Full pages
      'integration': 6,   // Connect everything
      'tests': 7          // Tests last
    };
  }

  async analyzeMegaFeature(featureDescription) {
    console.log(`\n🎯 TASKMASTER: Analyzing mega-feature...`);
    console.log(`📋 Feature: "${featureDescription}"`);
    
    // Break down into logical components
    const breakdown = this.intelligentBreakdown(featureDescription);
    
    // Create dependency graph
    const taskGraph = this.createDependencyGraph(breakdown);
    
    // Order tasks optimally
    const orderedTasks = this.topologicalSort(taskGraph);
    
    // Create actual task files in correct order
    await this.createTasksInOrder(orderedTasks);
    
    return {
      totalTasks: orderedTasks.length,
      breakdown: orderedTasks,
      estimatedTime: orderedTasks.length * 7.5 // ~7.5 min average per task
    };
  }

  intelligentBreakdown(feature) {
    const tasks = [];
    const lower = feature.toLowerCase();
    
    // Extract key components mentioned
    const components = {
      hasProfile: /profile|bio|about/i.test(feature),
      hasCalendar: /calendar|availability|schedule/i.test(feature),
      hasBooking: /booking|request|reservation/i.test(feature),
      hasAnalytics: /analytics|stats|metrics|performance/i.test(feature),
      hasRevenue: /revenue|payment|invoice|billing/i.test(feature),
      hasNotifications: /email|notification|alert/i.test(feature),
      hasMobile: /mobile|app|responsive/i.test(feature),
      hasAdmin: /admin|dashboard|management/i.test(feature),
      hasSocial: /social|instagram|facebook|twitter/i.test(feature),
      hasMedia: /photo|video|media|gallery/i.test(feature)
    };

    // BACKEND TASKS FIRST (Foundation)
    if (components.hasProfile) {
      tasks.push({
        id: 'backend-profile-schema',
        agent: 'backend',
        priority: 1,
        task: 'Create database schema for comedian profiles (bio, links, preferences)',
        dependencies: []
      });
      tasks.push({
        id: 'backend-profile-api',
        agent: 'backend',
        priority: 2,
        task: 'Create CRUD API endpoints for comedian profiles',
        dependencies: ['backend-profile-schema']
      });
    }

    if (components.hasCalendar) {
      tasks.push({
        id: 'backend-availability-schema',
        agent: 'backend',
        priority: 1,
        task: 'Design availability/calendar database schema',
        dependencies: []
      });
      tasks.push({
        id: 'backend-availability-api',
        agent: 'backend',
        priority: 2,
        task: 'Create availability management API endpoints',
        dependencies: ['backend-availability-schema']
      });
    }

    if (components.hasBooking) {
      tasks.push({
        id: 'backend-booking-schema',
        agent: 'backend',
        priority: 1,
        task: 'Create booking request database schema with status workflow',
        dependencies: []
      });
      tasks.push({
        id: 'backend-booking-api',
        agent: 'backend',
        priority: 2,
        task: 'Implement booking request API with validation',
        dependencies: ['backend-booking-schema']
      });
    }

    if (components.hasAnalytics) {
      tasks.push({
        id: 'backend-analytics-aggregation',
        agent: 'backend',
        priority: 2,
        task: 'Create analytics data aggregation endpoints',
        dependencies: ['backend-booking-schema']
      });
    }

    if (components.hasRevenue) {
      tasks.push({
        id: 'backend-revenue-tracking',
        agent: 'backend',
        priority: 2,
        task: 'Implement revenue tracking and reporting API',
        dependencies: ['backend-booking-schema']
      });
    }

    // FRONTEND TASKS (After APIs exist)
    if (components.hasProfile) {
      tasks.push({
        id: 'frontend-profile-types',
        agent: 'frontend',
        priority: 3,
        task: 'Create TypeScript types for comedian profiles',
        dependencies: ['backend-profile-api']
      });
      tasks.push({
        id: 'frontend-profile-components',
        agent: 'frontend',
        priority: 4,
        task: 'Build profile components (bio, links, media gallery)',
        dependencies: ['frontend-profile-types']
      });
      tasks.push({
        id: 'frontend-profile-page',
        agent: 'frontend',
        priority: 5,
        task: 'Create comedian profile page with edit capabilities',
        dependencies: ['frontend-profile-components']
      });
    }

    if (components.hasCalendar) {
      tasks.push({
        id: 'frontend-calendar-component',
        agent: 'frontend',
        priority: 4,
        task: 'Build availability calendar component with date picker',
        dependencies: ['backend-availability-api']
      });
    }

    if (components.hasBooking) {
      tasks.push({
        id: 'frontend-booking-form',
        agent: 'frontend',
        priority: 4,
        task: 'Create booking request form with validation',
        dependencies: ['backend-booking-api']
      });
      tasks.push({
        id: 'frontend-booking-list',
        agent: 'frontend',
        priority: 5,
        task: 'Build booking requests list with status management',
        dependencies: ['frontend-booking-form']
      });
    }

    if (components.hasAnalytics) {
      tasks.push({
        id: 'frontend-analytics-charts',
        agent: 'frontend',
        priority: 5,
        task: 'Create analytics dashboard with charts (use recharts)',
        dependencies: ['backend-analytics-aggregation']
      });
    }

    if (components.hasMobile) {
      tasks.push({
        id: 'frontend-mobile-responsive',
        agent: 'frontend',
        priority: 6,
        task: 'Ensure all components are mobile-responsive',
        dependencies: ['frontend-profile-page', 'frontend-booking-list']
      });
    }

    if (components.hasAdmin) {
      tasks.push({
        id: 'frontend-admin-dashboard',
        agent: 'frontend',
        priority: 6,
        task: 'Create admin dashboard for comedian management',
        dependencies: ['backend-profile-api', 'backend-booking-api']
      });
    }

    // TESTING TASKS (After features complete)
    const frontendTasks = tasks.filter(t => t.agent === 'frontend');
    const backendTasks = tasks.filter(t => t.agent === 'backend');

    if (frontendTasks.length > 0) {
      tasks.push({
        id: 'testing-frontend-components',
        agent: 'testing',
        priority: 7,
        task: 'Write comprehensive tests for all new UI components',
        dependencies: frontendTasks.map(t => t.id)
      });
    }

    if (backendTasks.length > 0) {
      tasks.push({
        id: 'testing-backend-api',
        agent: 'testing',
        priority: 7,
        task: 'Write API tests for all new endpoints',
        dependencies: backendTasks.map(t => t.id)
      });
    }

    tasks.push({
      id: 'testing-integration',
      agent: 'testing',
      priority: 8,
      task: 'Create integration tests for the complete feature flow',
      dependencies: ['testing-frontend-components', 'testing-backend-api']
    });

    return tasks;
  }

  createDependencyGraph(tasks) {
    const graph = new Map();
    
    tasks.forEach(task => {
      graph.set(task.id, {
        ...task,
        edges: task.dependencies || []
      });
    });
    
    return graph;
  }

  topologicalSort(graph) {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();
    
    const visit = (nodeId) => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) {
        console.warn(`⚠️ Circular dependency detected at ${nodeId}`);
        return;
      }
      
      visiting.add(nodeId);
      const node = graph.get(nodeId);
      
      if (node && node.edges) {
        node.edges.forEach(dep => visit(dep));
      }
      
      visiting.delete(nodeId);
      visited.add(nodeId);
      
      if (node) sorted.push(node);
    };
    
    // Visit all nodes
    for (const [nodeId] of graph) {
      visit(nodeId);
    }
    
    // Reverse to get correct order (dependencies first)
    return sorted.reverse();
  }

  async createTasksInOrder(orderedTasks) {
    console.log(`\n📋 Creating ${orderedTasks.length} tasks in optimal order:`);
    
    // Ensure queue directory exists
    if (!fs.existsSync(this.taskQueue)) {
      fs.mkdirSync(this.taskQueue, { recursive: true });
    }
    
    // Create tasks with proper spacing to maintain order
    orderedTasks.forEach((task, index) => {
      const timestamp = Date.now() + (index * 1000); // Space out by 1 second
      const taskId = `TASK_${timestamp}_${task.id}`;
      const filename = `${task.agent}-${taskId}.md`;
      const filepath = path.join(this.taskQueue, filename);
      
      const content = `# ${taskId}
AGENT: ${task.agent.toUpperCase()}
PRIORITY: P${task.priority}
CREATED: ${new Date().toISOString()}
STATUS: PENDING
ORDER: ${index + 1} of ${orderedTasks.length}

## DIRECTIVE
${task.task}

## DEPENDENCIES
${task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None'}

## CONTEXT
This task is part of a larger feature implementation. Follow project conventions and ensure compatibility with related components.

## ACCEPTANCE CRITERIA
- Task completed successfully
- Code follows project standards
- Integrates with dependent components
- Includes appropriate error handling
- Has necessary TypeScript types
- Mobile-responsive (if UI component)

## EXECUTION LOG
- Task created by Taskmaster Orchestrator
- Waiting for ${task.agent} agent to process...
`;

      fs.writeFileSync(filepath, content);
      console.log(`  ${index + 1}. [${task.agent}] ${task.task}`);
    });
    
    console.log(`\n✅ All tasks created and queued!`);
    console.log(`⏱️ Estimated completion: ${Math.round(orderedTasks.length * 7.5)} minutes`);
  }

  // Analyze workload distribution
  getWorkloadSummary(tasks) {
    const summary = {
      frontend: tasks.filter(t => t.agent === 'frontend').length,
      backend: tasks.filter(t => t.agent === 'backend').length,
      testing: tasks.filter(t => t.agent === 'testing').length,
      total: tasks.length
    };
    
    console.log(`\n📊 Workload Distribution:`);
    console.log(`  NETRUNNER_01 (Frontend): ${summary.frontend} tasks`);
    console.log(`  DAEMON_02 (Backend): ${summary.backend} tasks`);
    console.log(`  GIGACHAD_420 (Testing): ${summary.testing} tasks`);
    
    return summary;
  }
}

// Export for use
module.exports = TaskmasterOrchestrator;

// Run if called directly
if (require.main === module) {
  const taskmaster = new TaskmasterOrchestrator();
  
  // Example mega-feature
  const exampleFeature = process.argv.slice(2).join(' ') || 
    "Build a complete comedian management system with profile pages, availability calendar, booking requests, performance analytics, revenue tracking, and admin dashboard";
  
  taskmaster.analyzeMegaFeature(exampleFeature).then(result => {
    console.log(`\n🎯 Taskmaster Complete!`);
    console.log(`📊 Created ${result.totalTasks} tasks`);
    console.log(`⏱️ Estimated time: ${Math.round(result.estimatedTime / 60)} hours`);
  });
}