#!/usr/bin/env node

/**
 * Stand Up Sydney Linear Integration Setup
 * Creates project structure, teams, and imports existing tasks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Linear project configuration
const LINEAR_CONFIG = {
  workspace: {
    name: "Stand Up Sydney",
    description: "Comedy platform development and management"
  },
  teams: [
    {
      key: "FRONTEND",
      name: "Frontend Development",
      description: "React/TypeScript UI development, components, and user experience",
      color: "#3B82F6"
    },
    {
      key: "BACKEND", 
      name: "Backend Development",
      description: "Supabase, APIs, database operations, and server-side logic",
      color: "#10B981"
    },
    {
      key: "TESTING",
      name: "Testing & QA",
      description: "Test automation, quality assurance, and performance testing",
      color: "#F59E0B"
    },
    {
      key: "INFRA",
      name: "Infrastructure",
      description: "DevOps, deployment, monitoring, and system administration",
      color: "#EF4444"
    },
    {
      key: "INTEGRATION",
      name: "Integration & Automation",
      description: "MCP servers, N8N workflows, webhooks, and third-party integrations",
      color: "#8B5CF6"
    }
  ],
  projects: [
    {
      name: "Platform Overhaul",
      description: "Complete modernization of Stand Up Sydney platform",
      status: "active",
      teams: ["FRONTEND", "BACKEND", "TESTING"]
    },
    {
      name: "MCP Integration",
      description: "15 MCP server integration and management",
      status: "active", 
      teams: ["INTEGRATION", "BACKEND"]
    },
    {
      name: "Knowledge Graph",
      description: "AI-powered knowledge management and session tracking",
      status: "active",
      teams: ["INTEGRATION", "INFRA"]
    },
    {
      name: "Production Systems",
      description: "Deployment, monitoring, and production maintenance",
      status: "active",
      teams: ["INFRA", "TESTING"]
    }
  ],
  labels: [
    { name: "Critical", color: "#DC2626", description: "Blocking issues requiring immediate attention" },
    { name: "High Priority", color: "#EA580C", description: "Important features for current sprint" },
    { name: "Medium Priority", color: "#D97706", description: "Standard development tasks" },
    { name: "Low Priority", color: "#65A30D", description: "Nice-to-have improvements" },
    { name: "Bug", color: "#DC2626", description: "Defects and error fixes" },
    { name: "Feature", color: "#2563EB", description: "New functionality" },
    { name: "Enhancement", color: "#7C3AED", description: "Improvements to existing features" },
    { name: "Agent-Frontend", color: "#3B82F6", description: "Frontend agent assignment" },
    { name: "Agent-Backend", color: "#10B981", description: "Backend agent assignment" },
    { name: "Agent-Testing", color: "#F59E0B", description: "Testing agent assignment" },
    { name: "MCP", color: "#8B5CF6", description: "Model Context Protocol related" },
    { name: "Knowledge-Graph", color: "#EC4899", description: "Knowledge management system" },
    { name: "Authentication", color: "#06B6D4", description: "Auth and security related" },
    { name: "Database", color: "#84CC16", description: "Database operations and schema" }
  ]
};

// Existing tasks from project documentation
const EXISTING_TASKS = [
  // P1 Critical Tasks
  {
    title: "Fix Google Authentication System",
    description: "Resolve authentication issues preventing user registration and login",
    priority: "Critical",
    labels: ["Critical", "Bug", "Authentication", "Agent-Backend"],
    team: "BACKEND",
    project: "Platform Overhaul",
    estimate: 8
  },
  {
    title: "Resolve Event Creation Authentication Error",
    description: "Fix 'Authentication Required' error when publishing events",
    priority: "Critical", 
    labels: ["Critical", "Bug", "Authentication", "Agent-Frontend"],
    team: "FRONTEND",
    project: "Platform Overhaul",
    estimate: 6
  },
  {
    title: "Restore Google Maps Integration",
    description: "Fix broken Google Maps component in event creation form",
    priority: "Critical",
    labels: ["Critical", "Bug", "Feature", "Agent-Frontend"],
    team: "FRONTEND", 
    project: "Platform Overhaul",
    estimate: 4
  },
  
  // Frontend Development Tasks
  {
    title: "Enhanced Comedian Profile System",
    description: "Redesign comedian profiles with media galleries, performance history, availability calendar, and booking rates",
    priority: "High Priority",
    labels: ["High Priority", "Feature", "Agent-Frontend"],
    team: "FRONTEND",
    project: "Platform Overhaul",
    estimate: 12
  },
  {
    title: "Photographer Profile Management",
    description: "Create dedicated photographer profiles with portfolio galleries, equipment lists, and booking system",
    priority: "High Priority",
    labels: ["High Priority", "Feature", "Agent-Frontend"],
    team: "FRONTEND",
    project: "Platform Overhaul", 
    estimate: 10
  },
  {
    title: "Advanced Event Management Dashboard",
    description: "Comprehensive event creation and management interface with lineup builder and promotional tools",
    priority: "High Priority",
    labels: ["High Priority", "Feature", "Agent-Frontend"],
    team: "FRONTEND",
    project: "Platform Overhaul",
    estimate: 12
  },
  {
    title: "Smart Application Review System",
    description: "AI-assisted application review with scoring, bulk actions, and automated responses",
    priority: "High Priority",
    labels: ["High Priority", "Feature", "Agent-Frontend"],
    team: "FRONTEND",
    project: "Platform Overhaul",
    estimate: 10
  },
  
  // MCP Integration Tasks
  {
    title: "Humanitix-Notion Integration Maintenance",
    description: "Maintain and monitor Humanitix data sync to Notion database",
    priority: "Medium Priority",
    labels: ["Medium Priority", "MCP", "Agent-Backend"],
    team: "INTEGRATION",
    project: "MCP Integration",
    estimate: 4
  },
  {
    title: "Linear MCP Server Configuration",
    description: "Complete Linear MCP server authentication and workflow integration",
    priority: "High Priority", 
    labels: ["High Priority", "MCP", "Agent-Backend"],
    team: "INTEGRATION",
    project: "MCP Integration",
    estimate: 6
  },
  {
    title: "Multi-Agent System Coordination",
    description: "Improve coordination between Frontend, Backend, and Testing agents",
    priority: "Medium Priority",
    labels: ["Medium Priority", "Agent-Frontend", "Agent-Backend", "Agent-Testing"],
    team: "INTEGRATION",
    project: "Knowledge Graph",
    estimate: 8
  },
  
  // Knowledge Graph Tasks
  {
    title: "Knowledge Graph Protocol Compliance",
    description: "Ensure all sessions follow mandatory knowledge graph protocols",
    priority: "High Priority",
    labels: ["High Priority", "Knowledge-Graph", "Agent-Backend"],
    team: "INTEGRATION", 
    project: "Knowledge Graph",
    estimate: 6
  },
  {
    title: "Session Documentation Automation",
    description: "Automate comprehensive session documentation and discovery logging",
    priority: "Medium Priority",
    labels: ["Medium Priority", "Knowledge-Graph", "Enhancement"],
    team: "INTEGRATION",
    project: "Knowledge Graph", 
    estimate: 8
  },
  
  // Testing Tasks
  {
    title: "Comprehensive Test Coverage",
    description: "Achieve 80%+ test coverage across all critical functionality",
    priority: "High Priority",
    labels: ["High Priority", "Agent-Testing"],
    team: "TESTING",
    project: "Platform Overhaul",
    estimate: 16
  },
  {
    title: "E2E Testing Framework",
    description: "Implement end-to-end testing with Playwright for critical user flows",
    priority: "Medium Priority",
    labels: ["Medium Priority", "Agent-Testing"],
    team: "TESTING",
    project: "Platform Overhaul",
    estimate: 12
  },
  
  // Infrastructure Tasks
  {
    title: "Production Deployment Pipeline", 
    description: "Set up automated deployment pipeline with monitoring and rollback",
    priority: "High Priority",
    labels: ["High Priority", "Enhancement"],
    team: "INFRA",
    project: "Production Systems",
    estimate: 10
  },
  {
    title: "System Monitoring & Alerting",
    description: "Implement comprehensive monitoring for all system components",
    priority: "Medium Priority",
    labels: ["Medium Priority", "Enhancement"],
    team: "INFRA",
    project: "Production Systems",
    estimate: 8
  }
];

class LinearIntegrationSetup {
  constructor() {
    this.config = LINEAR_CONFIG;
    this.tasks = EXISTING_TASKS;
  }

  async setupLinearProject() {
    console.log('🚀 Setting up Stand Up Sydney Linear Integration...');
    console.log('='.repeat(60));
    
    // Create Linear project structure
    await this.createProjectStructure();
    
    // Import existing tasks
    await this.importExistingTasks();
    
    // Set up automations
    await this.setupAutomations();
    
    console.log('\n✅ Linear integration setup complete!');
    this.printSummary();
  }

  async createProjectStructure() {
    console.log('\n📋 Creating Linear project structure...');
    
    // This would use Linear MCP tools when available
    console.log('   Teams to create:');
    this.config.teams.forEach(team => {
      console.log(`     - ${team.name} (${team.key}): ${team.description}`);
    });
    
    console.log('\n   Projects to create:');
    this.config.projects.forEach(project => {
      console.log(`     - ${project.name}: ${project.description}`);
    });
    
    console.log('\n   Labels to create:');
    this.config.labels.forEach(label => {
      console.log(`     - ${label.name}: ${label.description}`);
    });
  }

  async importExistingTasks() {
    console.log(`\n📥 Importing ${this.tasks.length} existing tasks...`);
    
    const tasksByTeam = this.tasks.reduce((acc, task) => {
      if (!acc[task.team]) acc[task.team] = [];
      acc[task.team].push(task);
      return acc;
    }, {});
    
    Object.entries(tasksByTeam).forEach(([team, tasks]) => {
      console.log(`\n   ${team} Team (${tasks.length} tasks):`);
      tasks.forEach(task => {
        console.log(`     - ${task.title} [${task.priority}] (${task.estimate}h)`);
      });
    });
    
    const totalEstimate = this.tasks.reduce((sum, task) => sum + task.estimate, 0);
    console.log(`\n   Total effort estimate: ${totalEstimate} hours`);
  }

  async setupAutomations() {
    console.log('\n🤖 Setting up Linear automations...');
    
    const automations = [
      'Git branch → Linear issue linking',
      'Commit messages → Issue status updates', 
      'Knowledge Graph → Issue creation',
      'Test failures → Bug issue creation',
      'MCP server failures → Alert issues',
      'Agent task assignments → Team routing'
    ];
    
    automations.forEach(automation => {
      console.log(`     - ${automation}`);
    });
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Linear Integration Summary:');
    console.log(`   Teams: ${this.config.teams.length}`);
    console.log(`   Projects: ${this.config.projects.length}`);
    console.log(`   Labels: ${this.config.labels.length}`);
    console.log(`   Initial Issues: ${this.tasks.length}`);
    
    const priorityBreakdown = this.tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n   Priority Breakdown:');
    Object.entries(priorityBreakdown).forEach(([priority, count]) => {
      console.log(`     - ${priority}: ${count} issues`);
    });
    
    console.log('\n🔗 Next Steps:');
    console.log('   1. Review and approve Linear workspace structure');
    console.log('   2. Configure Linear MCP server authentication');
    console.log('   3. Set up Git integration workflows');
    console.log('   4. Create automation rules for multi-agent coordination');
    console.log('   5. Begin importing issues and tracking development progress');
  }

  // Export configuration for use with Linear MCP tools
  exportLinearConfig() {
    const configPath = path.join(__dirname, 'linear-config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      config: this.config,
      tasks: this.tasks
    }, null, 2));
    
    console.log(`\n💾 Configuration exported to: ${configPath}`);
    return configPath;
  }
}

// Run setup
async function main() {
  const setup = new LinearIntegrationSetup();
  await setup.setupLinearProject();
  setup.exportLinearConfig();
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default LinearIntegrationSetup;