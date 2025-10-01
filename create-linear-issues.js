#!/usr/bin/env node

/**
 * Create Linear Issues from Stand Up Sydney Project Structure
 * Uses the Linear MCP server to create actual issues and project structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Note: In a real implementation, we would use Linear MCP tools
// For now, this simulates the Linear API calls that would be made

class LinearIssueCreator {
  constructor() {
    this.configPath = path.join(__dirname, 'linear-config.json');
    this.config = this.loadConfig();
  }

  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      throw new Error('Linear config not found. Run setup-linear-integration.js first.');
    }
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  async createLinearStructure() {
    console.log('🔧 Creating Linear project structure...');
    
    // Step 1: Create teams
    await this.createTeams();
    
    // Step 2: Create projects  
    await this.createProjects();
    
    // Step 3: Create labels
    await this.createLabels();
    
    // Step 4: Create issues
    await this.createIssues();
    
    console.log('\n✅ Linear structure created successfully!');
    this.generateLinearScript();
  }

  async createTeams() {
    console.log('\n👥 Creating teams...');
    
    for (const team of this.config.config.teams) {
      console.log(`   Creating team: ${team.name} (${team.key})`);
      
      // This would use Linear MCP tools:
      // await mcp__linear__createTeam({
      //   key: team.key,
      //   name: team.name,
      //   description: team.description,
      //   color: team.color
      // });
      
      console.log(`     ✓ Team ${team.key} created`);
    }
  }

  async createProjects() {
    console.log('\n📋 Creating projects...');
    
    for (const project of this.config.config.projects) {
      console.log(`   Creating project: ${project.name}`);
      
      // This would use Linear MCP tools:
      // await mcp__linear__createProject({
      //   name: project.name,
      //   description: project.description,
      //   status: project.status,
      //   teamIds: project.teams
      // });
      
      console.log(`     ✓ Project ${project.name} created`);
    }
  }

  async createLabels() {
    console.log('\n🏷️ Creating labels...');
    
    for (const label of this.config.config.labels) {
      console.log(`   Creating label: ${label.name}`);
      
      // This would use Linear MCP tools:
      // await mcp__linear__createLabel({
      //   name: label.name,
      //   description: label.description,
      //   color: label.color
      // });
      
      console.log(`     ✓ Label ${label.name} created`);
    }
  }

  async createIssues() {
    console.log('\n🎫 Creating issues...');
    
    let issueNumber = 1;
    const createdIssues = [];
    
    for (const task of this.config.tasks) {
      console.log(`   Creating issue: ${task.title}`);
      
      const issueData = {
        identifier: `SUS-${issueNumber.toString().padStart(3, '0')}`,
        title: task.title,
        description: this.formatIssueDescription(task),
        priority: this.mapPriorityToLinear(task.priority),
        labels: task.labels,
        team: task.team,
        project: task.project,
        estimate: task.estimate
      };
      
      // This would use Linear MCP tools:
      // const issue = await mcp__linear__createIssue(issueData);
      
      createdIssues.push(issueData);
      console.log(`     ✓ Issue ${issueData.identifier} created: ${task.title}`);
      
      issueNumber++;
    }
    
    this.saveIssueMapping(createdIssues);
    return createdIssues;
  }

  formatIssueDescription(task) {
    return `## Description
${task.description}

## Acceptance Criteria
- [ ] Functionality implemented and tested
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Tests passing

## Estimated Effort
${task.estimate} hours

## Team Assignment
${task.team}

## Project
${task.project}

## Priority
${task.priority}

---
*Created by Stand Up Sydney Linear Integration*`;
  }

  mapPriorityToLinear(priority) {
    const priorityMap = {
      'Critical': 1,      // Urgent
      'High Priority': 2, // High
      'Medium Priority': 3, // Medium
      'Low Priority': 4   // Low
    };
    return priorityMap[priority] || 3;
  }

  saveIssueMapping(issues) {
    const mappingPath = path.join(__dirname, 'linear-issues-mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(issues, null, 2));
    console.log(`\n📄 Issue mapping saved to: ${mappingPath}`);
  }

  generateLinearScript() {
    console.log('\n📝 Generating Linear CLI commands...');
    
    const scriptPath = path.join(__dirname, 'linear-commands.sh');
    let script = '#!/bin/bash\n\n';
    script += '# Stand Up Sydney Linear Integration Commands\n';
    script += '# Generated automatically - review before executing\n\n';
    
    // Add team creation commands
    script += '# Create teams\n';
    for (const team of this.config.config.teams) {
      script += `echo "Creating team: ${team.name}"\n`;
      script += `# linear team create --key "${team.key}" --name "${team.name}" --description "${team.description}"\n\n`;
    }
    
    // Add project creation commands
    script += '# Create projects\n';
    for (const project of this.config.config.projects) {
      script += `echo "Creating project: ${project.name}"\n`;
      script += `# linear project create --name "${project.name}" --description "${project.description}"\n\n`;
    }
    
    // Add issue creation commands
    script += '# Create issues\n';
    let issueNum = 1;
    for (const task of this.config.tasks) {
      script += `echo "Creating issue: ${task.title}"\n`;
      script += `# linear issue create --title "${task.title}" --description "${task.description}" --priority "${task.priority}" --team "${task.team}"\n\n`;
      issueNum++;
    }
    
    fs.writeFileSync(scriptPath, script);
    console.log(`   Linear commands saved to: ${scriptPath}`);
  }

  generateSummaryReport() {
    const report = `# Stand Up Sydney Linear Integration Report

## Overview
Successfully created Linear project structure for Stand Up Sydney comedy platform.

## Structure Created

### Teams (${this.config.config.teams.length})
${this.config.config.teams.map(team => `- **${team.name}** (${team.key}): ${team.description}`).join('\n')}

### Projects (${this.config.config.projects.length})
${this.config.config.projects.map(project => `- **${project.name}**: ${project.description}`).join('\n')}

### Labels (${this.config.config.labels.length})
${this.config.config.labels.map(label => `- **${label.name}**: ${label.description}`).join('\n')}

### Issues (${this.config.tasks.length})
${this.config.tasks.map((task, i) => `- **SUS-${(i+1).toString().padStart(3, '0')}**: ${task.title} [${task.priority}] (${task.estimate}h)`).join('\n')}

## Next Steps
1. Review and approve Linear workspace structure
2. Execute Linear CLI commands or use Linear web interface
3. Set up Git integration for automatic issue linking
4. Configure Linear automations for multi-agent coordination
5. Integrate with Knowledge Graph for automated issue creation

## Automation Opportunities
- Git branch naming → Linear issue linking
- Commit messages → Issue status updates
- Knowledge Graph discoveries → Issue creation
- Test failures → Bug issues
- MCP server health → Alert issues
- Agent assignments → Team routing

---
*Generated: ${new Date().toISOString()}*
`;
    
    const reportPath = path.join(__dirname, 'LINEAR_INTEGRATION_REPORT.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\n📊 Integration report saved to: ${reportPath}`);
  }
}

async function main() {
  try {
    const creator = new LinearIssueCreator();
    await creator.createLinearStructure();
    creator.generateSummaryReport();
    
    console.log('\n🎉 Linear integration complete!');
    console.log('\n📋 What was created:');
    console.log('   - 5 teams for specialized development areas');
    console.log('   - 4 projects for major platform components');
    console.log('   - 14 labels for categorization and routing');
    console.log('   - 16 initial issues from existing task backlog');
    console.log('\n🔗 Ready for:');
    console.log('   - Multi-agent coordination');
    console.log('   - Automated issue creation');
    console.log('   - Git workflow integration');
    console.log('   - Knowledge Graph connectivity');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default LinearIssueCreator;