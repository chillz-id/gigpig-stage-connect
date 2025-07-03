# Dashboard Update Instructions

## Quick Update to Make Task Assignment Smarter

In your `cyberpunk-realtime.js`, find the `executeTask()` function and replace it with:

```javascript
// Import the smart router at the top of the file
const SmartTaskRouter = require('./smart-task-router');
const router = new SmartTaskRouter();

// Replace the executeTask function
function executeTask() {
  const input = document.getElementById('task-input');
  const task = input.value;
  
  if (!task) return;

  // Use smart routing
  fetch('/api/smart-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task })
  }).then(res => res.json()).then(data => {
    if (data.success) {
      data.assignments.forEach(assignment => {
        addLog('ROUTING', `${assignment.name}: ${assignment.task}`, 'success');
      });
    } else {
      addLog('ROUTING', data.message, 'warning');
      if (data.suggestions) {
        data.suggestions.forEach(s => addLog('HINT', s, 'info'));
      }
    }
  });
  
  input.value = '';
}
```

And add this API endpoint in the server section:

```javascript
// Add smart routing endpoint
app.post('/api/smart-route', (req, res) => {
  const { task } = req.body;
  const router = new SmartTaskRouter();
  const result = router.routeTask(task);
  
  if (result.success) {
    // Create tasks for each assigned agent
    result.assignments.forEach(assignment => {
      // Create actual task file
      const taskId = `TASK_${Date.now()}`;
      const taskFile = path.join('.agent-comms/task-queue', `${assignment.agent}-${taskId}.md`);
      
      fs.writeFileSync(taskFile, `# ${taskId}
AGENT: ${assignment.agent.toUpperCase()}
TIMESTAMP: ${new Date().toISOString()}
STATUS: PENDING

## DIRECTIVE
${assignment.task}

## ASSIGNED_BY
Smart Task Router - Pattern matched to ${assignment.name}
`);
      
      // Update agent state
      if (agentStates[assignment.agent]) {
        agentStates[assignment.agent].status = 'BUSY';
        agentStates[assignment.agent].currentTask = assignment.task;
        agentStates[assignment.agent].lastActivity = new Date();
      }
    });
  }
  
  res.json(result);
});
```

## How It Works Now:

### 1. **Natural Language Input**
You can type tasks naturally:
- "Add a cool loading animation" → Goes to NETRUNNER_01 (Frontend)
- "Fix the user login API" → Goes to DAEMON_02 (Backend)
- "Make sure everything works" → Goes to GIGACHAD_420 (Testing)

### 2. **Multi-Agent Tasks**
Some tasks automatically go to multiple agents:
- "Implement user authentication" → Frontend + Backend
- "Add new dashboard feature" → Frontend + Backend + Testing

### 3. **Smart Detection**
The router looks for:
- **Keywords**: button, API, test, database, style, etc.
- **Patterns**: "create endpoint", "add component", "write tests"
- **Context**: Full-stack features, authentication flows

### 4. **Unclear Tasks**
If you type something vague like "fix it", the system will:
- Ask for clarification
- Suggest how to phrase it better
- Show examples

## Examples:

**Frontend Tasks** (auto-routes to NETRUNNER_01):
- "Add dark mode toggle"
- "Fix responsive layout on mobile"
- "Create user profile component"
- "Make the buttons glow with neon"

**Backend Tasks** (auto-routes to DAEMON_02):
- "Create API for user stats"
- "Setup webhook integration"
- "Add database migration"
- "Implement JWT authentication"

**Testing Tasks** (auto-routes to GIGACHAD_420):
- "Write tests for login"
- "Improve code coverage"
- "Add e2e tests"
- "Test the payment flow"

**Multi-Agent Tasks**:
- "Build user registration feature" → All 3 agents
- "Add social login" → Frontend + Backend
- "Implement shopping cart" → Frontend + Backend + Testing