# Claude Code Agents Usage Guide

This guide explains how to use the specialized agents for the Stand Up Sydney platform using Claude Code's built-in Task tool.

## How to Invoke Agents

Use the **Task tool** with the following parameters:
- `subagent_type`: The agent identifier (e.g., "e2e-testing-specialist")
- `description`: A brief 3-5 word description of your task
- `prompt`: Detailed description of what you need help with

## Available Agents

### 1. E2E Testing Specialist (`e2e-testing-specialist`)

**When to Use:**
- Playwright test development or debugging
- Browser automation issues
- Cross-browser testing setup
- Test infrastructure problems

**Example Usage:**
```
Task tool:
- subagent_type: "e2e-testing-specialist"
- description: "Debug failing E2E test"
- prompt: "My Playwright test is failing to find the signup button. The test runs but gets a timeout error when trying to locate '[data-testid=\"signup-button\"]'. The app loads but the element isn't found. Here's my test code: [paste code]"
```

**Common Use Cases:**
- "Fix element selector issues in Playwright tests"
- "Set up comprehensive E2E test suite for event management"
- "Debug timing issues in authentication flow tests"
- "Implement Page Object Model for event creation workflow"

### 2. Database Specialist (`database-specialist`)

**When to Use:**
- Supabase database schema issues
- SQL migration development
- RLS policy problems
- Data integrity issues

**Example Usage:**
```
Task tool:
- subagent_type: "database-specialist"
- description: "Create spot confirmation migration"
- prompt: "I need to create a database migration for the spot confirmation system. It should include tables for spot_assignments and spot_confirmations with proper relationships to events and comedians. The comedian should be able to confirm/decline spots with a deadline. Include proper RLS policies for security."
```

**Common Use Cases:**
- "Fix RLS policies causing 403 errors for comedians"
- "Create migration for invoice system with proper relationships"
- "Debug missing foreign key relationships in applications table"
- "Optimize queries for event dashboard performance"

### 3. Component Builder (`component-builder`)

**When to Use:**
- React component development
- shadcn/ui integration
- Responsive design implementation
- TypeScript interface design

**Example Usage:**
```
Task tool:
- subagent_type: "component-builder"
- description: "Build event application form"
- prompt: "I need to create a comprehensive event application form component using shadcn/ui. It should include fields for comedian message, experience level, set length, and social media links. Use React Hook Form with Zod validation, include proper error handling, and make it mobile-responsive. The form should submit to the applications API."
```

**Common Use Cases:**
- "Create responsive event card component with application status"
- "Build admin dashboard with analytics cards and data visualization"
- "Implement theme-aware navigation component with mobile support"
- "Design comedian profile component with media gallery"

## Best Practices for Agent Usage

### 1. Be Specific and Detailed
**Good:**
```
"My E2E test for the event creation flow is failing at step 3 where it tries to fill the event date field. The error is 'Element not found: [data-testid=\"event-date-input\"]'. The form loads correctly but the date picker component doesn't seem to render the expected test ID. Here's the component code: [code]. How can I fix the selector or the component?"
```

**Poor:**
```
"Test is broken, fix it"
```

### 2. Include Context and Error Messages
Always provide:
- Exact error messages
- Relevant code snippets  
- Steps you've already tried
- Expected vs actual behavior

### 3. Specify Your Goal
Be clear about what you're trying to achieve:
- "I want to test the complete user signup flow"
- "I need to create a migration that adds deadline tracking"
- "I want to build a responsive dashboard component"

### 4. Mention Platform Context
The agents know about Stand Up Sydney, but mentioning specific context helps:
- "For the comedian dashboard page"
- "In the event management system"
- "For the promoter role specifically"

## Sequential Agent Usage

You can use multiple agents in sequence for complex tasks:

1. **Database Agent** → Create migration for new feature
2. **Component Builder Agent** → Build UI components for the feature  
3. **E2E Testing Agent** → Create comprehensive tests for the feature

## Integration with Development Workflow

### During Feature Development
```
1. Plan feature architecture
2. Use Database Agent → Design schema and migrations
3. Use Component Builder Agent → Create UI components
4. Use E2E Testing Agent → Develop test coverage
5. Test and iterate
```

### During Bug Fixing
```
1. Identify the problem area (database, UI, or tests)
2. Use appropriate specialist agent for diagnosis
3. Implement the suggested solution
4. Use E2E Testing Agent to verify the fix
```

### During Code Review
```
1. Use agents to review specific aspects:
   - Database Agent for schema changes
   - Component Builder for UI improvements
   - E2E Testing Agent for test coverage gaps
```

## Advanced Usage Patterns

### Cross-Agent Collaboration
```
Task 1 (Database Agent): "Design the schema for the new touring system"
↓
Task 2 (Component Builder): "Create components for the touring schema designed above"
↓  
Task 3 (E2E Testing): "Create E2E tests for the touring workflow"
```

### Troubleshooting Complex Issues
```
Task 1 (E2E Testing Agent): "Analyze why this test is failing"
↓ (If it's a data issue)
Task 2 (Database Agent): "Fix the data access pattern identified above"
↓ (If it's a component issue)
Task 3 (Component Builder): "Update the component to handle the edge case"
```

## Error Handling and Debugging

If an agent's solution doesn't work:

1. **Provide feedback in follow-up**: Include the error you encountered
2. **Try a different agent**: Sometimes a UI issue is actually a data problem
3. **Be more specific**: Add more context about your environment or requirements

## Team Collaboration

These agents are designed for team use:
- **Junior developers**: Get expert guidance on complex tasks
- **Senior developers**: Accelerate development with specialized knowledge
- **Code reviewers**: Get second opinions on technical decisions
- **Project managers**: Understand technical implementation details

## Success Tips

1. **Start with the right agent** - Choose based on the primary domain (database, UI, or testing)
2. **Iterate**: Use agents multiple times as your understanding evolves
3. **Combine approaches**: Use multiple agents for comprehensive solutions
4. **Document learnings**: Share successful agent interactions with your team
5. **Test solutions**: Always validate agent recommendations in your specific environment

The agents are most effective when you provide detailed context and specific questions. They're designed to be expert pair programmers for the Stand Up Sydney platform.