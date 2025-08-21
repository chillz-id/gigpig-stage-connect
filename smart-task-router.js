#!/usr/bin/env node

/**
 * Smart Task Router - Intelligently routes tasks to the right agent
 */

class SmartTaskRouter {
  constructor() {
    // Define agent capabilities and keywords
    this.agentProfiles = {
      frontend: {
        name: 'NETRUNNER_01',
        keywords: [
          // UI Components
          'button', 'component', 'form', 'input', 'modal', 'dropdown', 'menu', 'navbar',
          'sidebar', 'card', 'list', 'table', 'grid', 'layout', 'header', 'footer',
          
          // Styling
          'style', 'css', 'tailwind', 'animation', 'transition', 'hover', 'responsive',
          'mobile', 'desktop', 'theme', 'color', 'font', 'icon', 'shadow', 'border',
          
          // React/Frontend specific
          'react', 'hook', 'state', 'props', 'context', 'redux', 'zustand',
          'page', 'route', 'navigation', 'link', 'spa', 'ssr', 'client',
          
          // UX/UI
          'user interface', 'ui', 'ux', 'design', 'figma', 'mockup', 'prototype',
          'accessibility', 'a11y', 'screen reader', 'keyboard', 'focus',
          
          // Interactions
          'click', 'drag', 'drop', 'scroll', 'swipe', 'gesture', 'touch'
        ],
        patterns: [
          /add.*to.*page/i,
          /create.*component/i,
          /update.*design/i,
          /fix.*style/i,
          /make.*responsive/i,
          /implement.*ui/i
        ]
      },
      
      backend: {
        name: 'DAEMON_02',
        keywords: [
          // API & Server
          'api', 'endpoint', 'route', 'server', 'backend', 'express', 'fastify',
          'rest', 'graphql', 'websocket', 'http', 'request', 'response', 'middleware',
          
          // Database
          'database', 'db', 'query', 'sql', 'postgres', 'mysql', 'mongodb', 'redis',
          'migration', 'schema', 'model', 'orm', 'prisma', 'sequelize', 'mongoose',
          
          // Auth & Security
          'auth', 'authentication', 'authorization', 'login', 'logout', 'session',
          'token', 'jwt', 'oauth', 'password', 'encrypt', 'decrypt', 'hash', 'salt',
          'permission', 'role', 'rbac', 'security', 'cors', 'csrf',
          
          // Integration & Infrastructure
          'integration', 'webhook', 'cron', 'job', 'queue', 'worker', 'background',
          'email', 'sms', 'notification', 'stripe', 'payment', 'third-party',
          
          // Data processing
          'process', 'transform', 'validate', 'sanitize', 'parse', 'serialize',
          'cache', 'performance', 'optimize', 'index'
        ],
        patterns: [
          /create.*endpoint/i,
          /add.*to.*api/i,
          /implement.*auth/i,
          /setup.*database/i,
          /integrate.*service/i,
          /fix.*server/i
        ]
      },
      
      testing: {
        name: 'GIGACHAD_420',
        keywords: [
          // Testing types
          'test', 'spec', 'unit', 'integration', 'e2e', 'end-to-end', 'smoke',
          'regression', 'acceptance', 'performance', 'load', 'stress',
          
          // Testing tools
          'jest', 'mocha', 'chai', 'cypress', 'playwright', 'puppeteer',
          'testing-library', 'enzyme', 'vitest', 'karma', 'jasmine',
          
          // Testing concepts
          'coverage', 'mock', 'stub', 'spy', 'fixture', 'assertion', 'expect',
          'describe', 'it', 'beforeeach', 'aftereach', 'tdd', 'bdd',
          
          // Quality
          'quality', 'qa', 'bug', 'fix', 'debug', 'error', 'lint', 'eslint',
          'prettier', 'format', 'standard', 'convention', 'review', 'refactor'
        ],
        patterns: [
          /write.*test/i,
          /add.*coverage/i,
          /test.*feature/i,
          /verify.*works/i,
          /ensure.*quality/i,
          /fix.*bug/i
        ]
      }
    };

    // Special routing rules
    this.routingRules = [
      // Full stack features need multiple agents
      {
        pattern: /full[- ]?stack|entire feature|whole system/i,
        agents: ['frontend', 'backend', 'testing']
      },
      // Login/Auth usually needs frontend + backend
      {
        pattern: /login|signup|register|authentication flow/i,
        agents: ['frontend', 'backend']
      },
      // Any new feature should get tests
      {
        pattern: /new feature|add feature|implement.*feature/i,
        includeTest: true
      }
    ];
  }

  analyzeTask(taskDescription) {
    const lower = taskDescription.toLowerCase();
    const scores = {
      frontend: 0,
      backend: 0,
      testing: 0
    };

    // Check each agent's keywords and patterns
    Object.entries(this.agentProfiles).forEach(([agent, profile]) => {
      // Keyword matching
      profile.keywords.forEach(keyword => {
        if (lower.includes(keyword)) {
          scores[agent] += 2;
        }
      });

      // Pattern matching (higher weight)
      profile.patterns.forEach(pattern => {
        if (pattern.test(taskDescription)) {
          scores[agent] += 5;
        }
      });
    });

    // Apply special routing rules
    let forcedAgents = [];
    let includeTest = false;

    this.routingRules.forEach(rule => {
      if (rule.pattern.test(taskDescription)) {
        if (rule.agents) {
          forcedAgents = rule.agents;
        }
        if (rule.includeTest) {
          includeTest = true;
        }
      }
    });

    // Determine primary agent(s)
    if (forcedAgents.length > 0) {
      return forcedAgents;
    }

    // Get highest scoring agent(s)
    const maxScore = Math.max(...Object.values(scores));
    const selectedAgents = [];

    if (maxScore > 0) {
      Object.entries(scores).forEach(([agent, score]) => {
        if (score >= maxScore * 0.8) { // Include agents with 80%+ of max score
          selectedAgents.push(agent);
        }
      });
    }

    // Default fallback based on common patterns
    if (selectedAgents.length === 0) {
      if (lower.includes('page') || lower.includes('show') || lower.includes('display')) {
        selectedAgents.push('frontend');
      } else if (lower.includes('data') || lower.includes('save') || lower.includes('fetch')) {
        selectedAgents.push('backend');
      } else {
        // Ask for clarification
        return null;
      }
    }

    // Always include testing for new features
    if (includeTest && !selectedAgents.includes('testing')) {
      selectedAgents.push('testing');
    }

    return selectedAgents;
  }

  routeTask(taskDescription) {
    console.log(`\n🧠 Analyzing: "${taskDescription}"`);
    
    const agents = this.analyzeTask(taskDescription);
    
    if (!agents) {
      return {
        success: false,
        message: 'Could not determine which agent should handle this. Please be more specific or mention frontend/backend/testing.',
        suggestions: [
          'For UI work: "Add a loading spinner to the submit button"',
          'For API work: "Create an endpoint to fetch user stats"',
          'For testing: "Write tests for the login component"'
        ]
      };
    }

    const assignments = agents.map(agent => ({
      agent,
      name: this.agentProfiles[agent].name,
      task: this.generateAgentSpecificTask(agent, taskDescription)
    }));

    return {
      success: true,
      assignments,
      message: `Task will be handled by ${agents.length} agent(s): ${agents.map(a => this.agentProfiles[a].name).join(', ')}`
    };
  }

  generateAgentSpecificTask(agent, originalTask) {
    // Tailor the task description for each agent
    switch (agent) {
      case 'frontend':
        if (!originalTask.toLowerCase().includes('frontend')) {
          return `[Frontend] ${originalTask} - Focus on UI/UX implementation`;
        }
        break;
      
      case 'backend':
        if (!originalTask.toLowerCase().includes('backend')) {
          return `[Backend] ${originalTask} - Handle server-side logic and data`;
        }
        break;
        
      case 'testing':
        if (!originalTask.toLowerCase().includes('test')) {
          return `[Testing] Write comprehensive tests for: ${originalTask}`;
        }
        break;
    }
    
    return originalTask;
  }

  suggestAgent(taskDescription) {
    // Interactive helper to suggest the right agent
    const agents = this.analyzeTask(taskDescription);
    
    if (!agents || agents.length === 0) {
      console.log(`\n🤔 I'm not sure which agent should handle this task.`);
      console.log(`\nHere's what each agent specializes in:`);
      
      Object.entries(this.agentProfiles).forEach(([agent, profile]) => {
        console.log(`\n${profile.name} (${agent}):`);
        console.log(`  Specializes in: ${profile.keywords.slice(0, 10).join(', ')}...`);
      });
      
      console.log(`\nTry adding keywords like:`);
      console.log(`  - "component" or "UI" for frontend work`);
      console.log(`  - "API" or "database" for backend work`);
      console.log(`  - "test" or "quality" for testing work`);
      
    } else if (agents.length === 1) {
      const agent = agents[0];
      const profile = this.agentProfiles[agent];
      console.log(`\n✅ ${profile.name} (${agent}) is perfect for this task!`);
      
    } else {
      console.log(`\n🤝 This task needs collaboration from multiple agents:`);
      agents.forEach(agent => {
        const profile = this.agentProfiles[agent];
        console.log(`  - ${profile.name} (${agent})`);
      });
    }
  }
}

// Export for use in other modules
module.exports = SmartTaskRouter;

// CLI interface
if (require.main === module) {
  const router = new SmartTaskRouter();
  
  // Test examples
  const testTasks = [
    "Add a dark mode toggle to the settings page",
    "Create an API endpoint for user statistics",
    "Write tests for the new login feature",
    "Fix the broken submit button animation",
    "Implement full user authentication flow",
    "Update database schema for user profiles",
    "Make the dashboard responsive on mobile",
    "Add loading states to all API calls",
    "Debug why emails aren't sending",
    "Improve test coverage to 80%"
  ];
  
  console.log('🧪 Testing Smart Task Router:\n');
  
  testTasks.forEach(task => {
    const result = router.routeTask(task);
    console.log(`\nTask: "${task}"`);
    if (result.success) {
      result.assignments.forEach(assignment => {
        console.log(`  → ${assignment.name}: ${assignment.task}`);
      });
    } else {
      console.log(`  ❌ ${result.message}`);
    }
  });
}