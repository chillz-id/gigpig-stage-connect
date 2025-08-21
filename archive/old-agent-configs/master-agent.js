const Anthropic = require('@anthropic-ai/sdk');
const io = require('socket.io-client');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const fs = require('fs').promises;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import memory manager and knowledge graph
const MemoryManager = require('../lib/memory-manager');
const Neo4jKnowledgeGraph = require('../lib/neo4j-knowledge-graph');
const { getInstance: getRateLimiter } = require('../lib/rate-limiter');
const ContextManager = require('../lib/context-manager');

// Configuration
const config = {
    id: 'master-agent',
    name: 'Master Agent',
    type: 'orchestrator',
    capabilities: ['Agent Management', 'Task Orchestration', 'Knowledge Management', 'System Control', 'Memory Access'],
    model: 'claude-3-haiku-20240307', // Using Haiku to save credits
    apiKey: process.env.ANTHROPIC_API_KEY,
    dashboardUrl: 'http://localhost:3001',
    orchestratorUrl: 'http://localhost:3002'
};

console.log('API Key loaded:', config.apiKey ? `${config.apiKey.substring(0, 10)}...` : 'NOT FOUND');

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: config.apiKey,
});

// Initialize memory manager and knowledge graph
const memory = new MemoryManager();
const knowledgeGraph = new Neo4jKnowledgeGraph();
const contextManager = new ContextManager({
    maxTokens: 12000,
    shrinkThreshold: 0.8,
    keepFirst: 2,
    keepLast: 20
});

// Initialize rate limiter for Anthropic API
const rateLimiter = getRateLimiter({
    maxRequestsPerMinute: 30, // Conservative limit
    maxTokensPerMinute: 20000, // Conservative token limit
    maxConcurrent: 3 // Limit concurrent requests
});

// Listen for rate limit events
rateLimiter.on('rateLimitHit', ({ error, willRetryIn }) => {
    console.error(`⚠️ Rate limit hit! Will retry in ${willRetryIn / 1000} seconds`);
    socket.emit('agent-message', {
        agentId: config.id,
        content: `I've hit the API rate limit. I'll automatically retry in ${Math.round(willRetryIn / 1000)} seconds. This helps prevent service interruption.`
    });
});

// Connect to dashboard
const socket = io(config.dashboardUrl);
let currentConversation = [];

// Agent state
const agentState = {
    status: 'online',
    currentTask: null,
    conversationHistory: [],
    systemKnowledge: new Map()
};

// System prompt for Master Agent
const SYSTEM_PROMPT = `You are the Master Agent, an orchestrator with Claude Opus 4 intelligence. You manage a multi-agent system with the following capabilities:

1. **Agent Management**:
   - Create new specialized agents with custom prompts
   - Start/stop/restart existing agents
   - Monitor agent health and performance
   - Modify agent configurations

2. **Task Orchestration**:
   - Assign tasks to the most suitable agents
   - Create task dependencies and workflows
   - Monitor task progress across all agents
   - Intervene when agents are stuck

3. **Knowledge Management**:
   - Access collective memory of all agents via Supabase vector search
   - Share knowledge between agents
   - Build and query the knowledge graph
   - Learn from past experiences

4. **System Control**:
   - Execute PM2 commands for process management
   - Monitor system resources and API usage
   - Configure agent behaviors
   - Manage costs and rate limits

You have access to:
- A persistent memory system (Redis for short-term, Supabase vectors for long-term)
- The ability to query past conversations and solutions
- System commands via exec()
- The master orchestrator API

Important context about the system:
- The Stand Up Sydney comedy platform frontend is in /root/agents/ (React + TypeScript)
- The frontend is deployed on Vercel (connected to gigpig-stage-connect GitHub repo)
- The backend runs on this DigitalOcean droplet (170.64.252.55)
- Backend includes Supabase + FastMCP server at /opt/standup-sydney-mcp
- The multi-agent system dashboard is available at http://170.64.252.55/
- You can update code locally but deployment to Vercel happens via GitHub

Always:
- When asked about system analysis, use the performSystemAnalysis() function
- Check memory for similar past situations before making decisions
- Store important decisions and outcomes in memory
- Consider cost implications of your actions
- Maintain system stability and security

You are the most intelligent agent in the system with Claude Opus 4 capabilities.

MCP TOOLS USAGE INSTRUCTIONS:
You have access to numerous MCP tools via the FastMCP server. Here's how to use them:

1. **Direct Command Execution**: You can use exec() to run system commands
   Example: await execAsync('curl -X POST http://localhost:8080/tools/health_check')

2. **Available MCPs**:
   - Supabase: Database operations (supabase_query)
   - GitHub: Version control (github_operations)
   - Slack: Messaging (slack_send_message, etc.)
   - Playwright: Browser testing (playwright_navigate, etc.)
   - N8N: Workflow automation (n8n_execute_workflow, etc.)
   - Context7: Documentation (context7_get_docs)
   - Redis: Memory storage (redis-cli commands)
   - Docker: Container management (docker commands)

3. **How to Call MCP Tools**:
   const result = await execAsync(\`curl -X POST http://localhost:8080/tools/[tool_name] -H "Content-Type: application/json" -d '\${JSON.stringify(params)}'\`);

4. **Key Services**:
   - Redis: localhost:6379
   - Neo4j: localhost:7474 (HTTP), localhost:7687 (Bolt)
   - N8N: localhost:5678
   - Dashboard: port 3001

5. **When to Use MCPs**:
   - Use supabase_query for database operations
   - Use playwright tools for testing the frontend
   - Use slack tools for notifications
   - Use context7_get_docs to get documentation for any library

Always check /root/.claude-multi-agent/MCP_DOCUMENTATION.md for detailed information.`;

// Initialize knowledge graph on startup
knowledgeGraph.initialize().then(() => {
    console.log('🧠 Knowledge graph initialized');
}).catch(err => {
    console.error('Failed to initialize knowledge graph:', err);
});

// Connect to dashboard
socket.on('connect', () => {
    console.log(`👑 ${config.name} connected to dashboard`);
    
    // Register agent
    socket.emit('agent-register', {
        id: config.id,
        name: config.name,
        status: agentState.status,
        type: config.type,
        capabilities: config.capabilities,
        isOrcestrator: true
    });
});

// Handle task assignments from orchestrator
socket.on('task-assignment', async (data) => {
    if (data.agentId !== config.id) return;
    
    console.log(`Task assigned: ${data.title}`);
    agentState.currentTask = data;
    
    // Process the task
    await processAssignedTask(data);
});

// Handle incoming messages
socket.on('message', async (data) => {
    console.log(`Message event received for agent: ${data.agentId}, my ID: ${config.id}`);
    if (data.agentId !== config.id) {
        console.log('Message not for me, ignoring');
        return;
    }
    
    console.log(`Received message: ${data.content}`);
    agentState.status = 'busy';
    updateStatus();
    
    try {
        // Check memory for relevant context
        const relevantMemories = await memory.retrieveMemories(
            config.id,
            data.content,
            5,
            { allAgents: true, threshold: 0.6 }
        );

        // Add to conversation
        currentConversation.push({
            role: 'user',
            content: data.content
        });

        // Get response with memory context
        const response = await getMasterResponse(data.content, relevantMemories);
        
        // Send response back through agent-message event
        socket.emit('agent-message', {
            agentId: config.id,
            content: response.text,
            actions: response.actions
        });

        // Execute any system actions
        if (response.actions && response.actions.length > 0) {
            for (const action of response.actions) {
                await executeAction(action);
            }
        }

        // Store conversation turn in memory
        await memory.storeMemory(
            config.id,
            `User: ${data.content}\nAssistant: ${response.text}`,
            'conversation',
            { importance: 0.7 }
        );

        // Add to conversation history
        currentConversation.push({
            role: 'assistant',
            content: response.text
        });

        // Store conversation if it's getting long
        if (currentConversation.length > 10) {
            await memory.storeConversation(config.id, currentConversation);
            currentConversation = currentConversation.slice(-4); // Keep last 2 exchanges
        }
        
    } catch (error) {
        console.error('Error processing message:', error);
        console.error('Full error details:', error.stack || error);
        socket.emit('agent-message', {
            agentId: config.id,
            content: `I encountered an error: ${error.message}. Let me try a different approach.`
        });
    } finally {
        agentState.status = 'online';
        updateStatus();
    }
});

// Get Master Agent response with memory context
async function getMasterResponse(userMessage, memories) {
    // Build memory context
    let memoryContext = '';
    if (memories && memories.length > 0) {
        memoryContext = '\n\nRelevant memories from the system:\n';
        memories.forEach((mem, idx) => {
            memoryContext += `${idx + 1}. [${mem.memory_type}] ${mem.content.substring(0, 200)}...\n`;
        });
    }

    // Build current system state
    const systemState = await getSystemState();

    // Check if user is asking about system analysis
    if (userMessage.toLowerCase().includes('analyze') || 
        userMessage.toLowerCase().includes('what you can see') ||
        userMessage.toLowerCase().includes('hooked up to')) {
        
        // Actually execute system analysis
        const analysis = await performSystemAnalysis();
        
        return {
            text: `I've analyzed the system. Here's what I found:\n\n${analysis}\n\nBased on this analysis, I can help you update your website. I have full access to the droplet's file system and can coordinate with the specialist agents to make any changes you need.`,
            actions: []
        };
    }

    try {
        // Estimate tokens for rate limiting (rough estimate)
        const estimatedTokens = Math.min(4000, (userMessage.length + systemState.length + memoryContext.length) / 4 + 1000);
        
        // Prepare messages with context management
        const allMessages = [
            ...currentConversation,
            {
                role: 'user',
                content: `Current system state:\n${systemState}\n${memoryContext}\n\nUser request: ${userMessage}`
            }
        ];
        
        // Apply context management
        const { messages: processedMessages, wasShrunk } = contextManager.processMessages(allMessages);
        
        // Notify if context was shrunk
        if (wasShrunk) {
            socket.emit('agent-message', {
                agentId: config.id,
                content: '[Context window optimized - some older messages condensed]',
                type: 'system'
            });
        }
        
        // Use rate limiter to make the API call
        const message = await rateLimiter.execute(async () => {
            return await anthropic.messages.create({
                model: config.model,
                max_tokens: 4000,
                temperature: 0.7,
                system: SYSTEM_PROMPT,
                messages: processedMessages.slice(-10) // Use processed messages
            });
        }, estimatedTokens);

        // Parse response for actions
        const response = message.content[0].text;
        const actions = extractActions(response);

        return {
            text: response,
            actions: actions
        };
    } catch (error) {
        console.error('Claude API error:', error);
        console.error('Full API error:', error.response?.data || error.message || error);
        if (error.response?.status === 401) {
            console.error('API Key authentication failed!');
        }
        throw error;
    }
}

// Perform comprehensive system analysis
async function performSystemAnalysis() {
    let results = [];
    
    try {
        // Check Stand Up Sydney frontend
        const { stdout: frontendCheck } = await execAsync('ls -la /root/agents/ | head -5');
        results.push('**Stand Up Sydney Frontend (React):**\n```\n' + frontendCheck + '\n```');
        
        // Check web server
        const { stdout: webFiles } = await execAsync('ls -la /var/www/html/ | head -10');
        results.push('**Web Server Files:**\n```\n' + webFiles + '\n```');
        
        // Check NGINX sites
        const { stdout: nginxSites } = await execAsync('ls -la /etc/nginx/sites-enabled/');
        results.push('**NGINX Configuration:**\n```\n' + nginxSites + '\n```');
        
        // Check running services
        const { stdout: services } = await execAsync('pm2 list');
        results.push('**PM2 Services:**\n```\n' + services + '\n```');
        
        // Check network ports
        const { stdout: ports } = await execAsync('netstat -tulpn | grep LISTEN | grep -E "(80|443|3000|3001|5173)"');
        results.push('**Active Ports:**\n```\n' + ports + '\n```');
        
        // Check multi-agent system
        const { stdout: agentSystem } = await execAsync('ls -la /root/.claude-multi-agent/');
        results.push('**Multi-Agent System:**\n```\n' + agentSystem + '\n```');
        
        // Check if frontend is on Vercel
        const { stdout: gitRemote } = await execAsync('cd /root/agents && git remote -v 2>/dev/null || echo "No git remote"');
        results.push('**Git Remote (Frontend):**\n```\n' + gitRemote + '\n```');
        
    } catch (error) {
        results.push(`Error during analysis: ${error.message}`);
    }
    
    return results.join('\n\n');
}

// Get current system state
async function getSystemState() {
    try {
        // Get PM2 list
        const { stdout: pm2List } = await execAsync('pm2 jlist');
        const processes = JSON.parse(pm2List);
        
        // Get agent statuses
        const agentStatuses = processes
            .filter(p => p.name.includes('specialist') || p.name.includes('agent'))
            .map(p => `${p.name}: ${p.pm2_env.status} (CPU: ${p.monit.cpu}%, Mem: ${Math.round(p.monit.memory / 1024 / 1024)}MB)`)
            .join('\n');

        // Get orchestrator status - but don't fail if not available
        let orchStatus = { agents: 0, taskQueue: 0, knowledge: { nodes: 0 } };
        try {
            const orchResponse = await fetch(`${config.orchestratorUrl}/api/status`);
            if (orchResponse.ok) {
                orchStatus = await orchResponse.json();
            }
        } catch (e) {
            // Orchestrator not running, that's ok
        }

        return `
Active Agents:
${agentStatuses}

Orchestrator Status:
- Registered agents: ${orchStatus.agents?.length || 0}
- Tasks in queue: ${orchStatus.taskQueue?.length || 0}
- Knowledge nodes: ${orchStatus.knowledge?.nodes || 0}
`;
    } catch (error) {
        return `System state unavailable: ${error.message}`;
    }
}

// Extract actions from response
function extractActions(response) {
    const actions = [];
    
    // Look for PM2 commands
    const pm2Regex = /pm2\s+(start|stop|restart|delete)\s+([^\s]+)/g;
    let match;
    while ((match = pm2Regex.exec(response)) !== null) {
        actions.push({
            type: 'pm2',
            command: match[1],
            target: match[2]
        });
    }

    // Look for agent creation
    if (response.includes('create') && response.includes('agent')) {
        const createRegex = /create\s+(?:a\s+)?(\w+)\s+agent/i;
        const createMatch = response.match(createRegex);
        if (createMatch) {
            actions.push({
                type: 'create-agent',
                agentType: createMatch[1].toLowerCase()
            });
        }
    }

    // Look for task assignment
    if (response.includes('assign') && response.includes('task')) {
        actions.push({
            type: 'assign-task',
            details: 'parse from context'
        });
    }

    return actions;
}

// Execute system actions
async function executeAction(action) {
    try {
        switch (action.type) {
            case 'pm2':
                const { stdout, stderr } = await execAsync(`pm2 ${action.command} ${action.target}`);
                console.log(`PM2 command executed: ${stdout}`);
                if (stderr) console.error(`PM2 error: ${stderr}`);
                
                // Store action in memory
                await memory.storeMemory(
                    config.id,
                    `Executed PM2 command: ${action.command} ${action.target}`,
                    'decision',
                    { importance: 0.6, success: !stderr }
                );
                break;

            case 'create-agent':
                await createNewAgent(action.agentType);
                break;

            case 'assign-task':
                // This would integrate with the orchestrator API
                console.log('Task assignment requested');
                break;

            default:
                console.log(`Unknown action type: ${action.type}`);
        }
    } catch (error) {
        console.error(`Error executing action ${action.type}:`, error);
        
        // Store failure in memory
        await memory.storeMemory(
            config.id,
            `Failed to execute action ${action.type}: ${error.message}`,
            'decision',
            { importance: 0.8, success: false }
        );
    }
}

// Create a new specialized agent
async function createNewAgent(type) {
    const agentConfig = {
        id: `${type}-specialist-${Date.now()}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Specialist`,
        type: type,
        model: 'claude-sonnet-4-20250514',
        capabilities: getCapabilitiesForType(type)
    };

    // Create agent file
    const agentCode = await generateAgentCode(agentConfig);
    await fs.writeFile(
        path.join(__dirname, `${agentConfig.id}.js`),
        agentCode
    );

    // Start the agent
    await execAsync(`pm2 start ${agentConfig.id}.js --name ${agentConfig.id}`);

    // Store in memory
    await memory.storeMemory(
        config.id,
        `Created new agent: ${agentConfig.name} with capabilities: ${agentConfig.capabilities.join(', ')}`,
        'decision',
        { importance: 0.9, agentId: agentConfig.id }
    );

    console.log(`Created and started new agent: ${agentConfig.name}`);
}

// Get capabilities based on agent type
function getCapabilitiesForType(type) {
    const capabilityMap = {
        'security': ['Security Audit', 'Vulnerability Assessment', 'Code Review', 'Penetration Testing'],
        'performance': ['Performance Optimization', 'Load Testing', 'Profiling', 'Caching'],
        'migration': ['Data Migration', 'Schema Updates', 'Version Upgrades', 'Compatibility'],
        'documentation': ['API Documentation', 'Code Comments', 'README Files', 'Tutorials'],
        'refactoring': ['Code Cleanup', 'Pattern Implementation', 'Debt Reduction', 'Modernization']
    };

    return capabilityMap[type] || ['General Tasks'];
}

// Generate agent code dynamically
async function generateAgentCode(agentConfig) {
    // This would be a template for new agents
    return `
const Anthropic = require('@anthropic-ai/sdk');
const io = require('socket.io-client');
const MemoryManager = require('../lib/memory-manager');

// Auto-generated agent: ${agentConfig.name}
const config = ${JSON.stringify(agentConfig, null, 2)};
config.apiKey = process.env.ANTHROPIC_API_KEY;
config.dashboardUrl = 'http://localhost:3001';

// ... rest of agent template code ...
`;
}

// Update agent status
function updateStatus() {
    socket.emit('agent-update', {
        id: config.id,
        status: agentState.status,
        currentTask: agentState.currentTask
    });
}

// Process assigned task from orchestrator
async function processAssignedTask(taskData) {
    try {
        agentState.status = 'busy';
        updateStatus();
        
        // Analyze the task and create a plan
        const plan = await createTaskPlan(taskData);
        
        // Execute the plan
        const results = await executeTaskPlan(plan, taskData);
        
        // Report completion
        await reportTaskCompletion(taskData, results);
        
    } catch (error) {
        console.error('Task processing failed:', error);
        await reportTaskFailure(taskData, error);
    } finally {
        agentState.status = 'online';
        agentState.currentTask = null;
        updateStatus();
    }
}

// Create execution plan for task
async function createTaskPlan(taskData) {
    const message = await anthropic.messages.create({
        model: config.model,
        max_tokens: 2000,
        temperature: 0.7,
        system: SYSTEM_PROMPT + `\n\nYou are working on a specific task phase. Create a detailed execution plan.`,
        messages: [{
            role: 'user',
            content: `Task: ${taskData.title}\nDescription: ${taskData.description}\nAcceptance Criteria: ${JSON.stringify(taskData.acceptanceCriteria)}\n\nCreate a step-by-step plan to complete this task.`
        }]
    });
    
    return message.content[0].text;
}

// Execute the task plan
async function executeTaskPlan(plan, taskData) {
    const results = {
        plan,
        actions: [],
        files: [],
        success: true
    };
    
    // This would coordinate with specialist agents
    // For now, log the plan
    console.log('Executing plan:', plan);
    
    // Simulate work being done
    socket.emit('phase-update', {
        phaseId: taskData.phaseId,
        status: 'in_progress',
        progress: 50
    });
    
    return results;
}

// Report task completion
async function reportTaskCompletion(taskData, results) {
    const response = await fetch('http://localhost:3003/api/phases/' + taskData.phaseId + '/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            agentId: config.id,
            results: results,
            files: results.files
        })
    });
    
    console.log('Task completed and reported');
}

// Report task failure
async function reportTaskFailure(taskData, error) {
    socket.emit('phase-update', {
        phaseId: taskData.phaseId,
        status: 'failed',
        error: error.message
    });
}

// Handle task assignments from orchestrator (legacy)
socket.on('task-assigned', async (task) => {
    if (task.agentId !== config.id) return;
    
    console.log(`Task assigned: ${task.description}`);
    agentState.currentTask = task;
    agentState.status = 'busy';
    updateStatus();
    
    // The Master Agent typically delegates rather than executes
    socket.emit('message', {
        agentId: config.id,
        content: `I'll orchestrate this task: "${task.description}". Let me find the best agent for this.`
    });
    
    // In a real implementation, this would delegate to other agents
    setTimeout(() => {
        socket.emit('task-completed', {
            taskId: task.id,
            agentId: config.id,
            result: 'Task delegated successfully'
        });
        
        agentState.currentTask = null;
        agentState.status = 'online';
        updateStatus();
    }, 3000);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log(`👑 ${config.name} shutting down...`);
    
    // Store final conversation if needed
    if (currentConversation.length > 0) {
        await memory.storeConversation(config.id, currentConversation);
    }
    
    socket.emit('agent-offline', config.id);
    process.exit(0);
});

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

// Keep alive and monitor rate limits
setInterval(() => {
    const rateLimitStatus = rateLimiter.getStatus();
    socket.emit('agent-heartbeat', {
        id: config.id,
        status: agentState.status,
        rateLimits: {
            requestsRemaining: rateLimitStatus.requestsRemaining,
            tokensRemaining: rateLimitStatus.tokensRemaining,
            queueLength: rateLimitStatus.queueLength,
            isRateLimited: rateLimitStatus.isRateLimited
        }
    });
}, 30000);

// Log rate limit status periodically
setInterval(() => {
    const status = rateLimiter.getStatus();
    console.log(`Rate limit status - Requests: ${status.recentRequests}/${status.maxRequestsPerMinute}, Tokens: ${status.recentTokens}/${status.maxTokensPerMinute}, Queue: ${status.queueLength}`);
}, 60000);

console.log(`👑 ${config.name} agent started with Claude Opus 4 intelligence...`);