const Anthropic = require('@anthropic-ai/sdk');
const io = require('socket.io-client');
const MemoryManager = require('../lib/memory-manager');

// Agent configuration (to be customized per agent)
const config = {
    id: 'AGENT_ID',
    name: 'AGENT_NAME',
    type: 'AGENT_TYPE',
    capabilities: ['CAPABILITY_1', 'CAPABILITY_2'],
    model: 'claude-sonnet-4-20250514',
    apiKey: process.env.ANTHROPIC_API_KEY,
    dashboardUrl: 'http://localhost:3001'
};

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: config.apiKey,
});

// Initialize memory manager
const memory = new MemoryManager();

// Connect to dashboard
const socket = io(config.dashboardUrl);

// Agent state
const agentState = {
    status: 'online',
    currentTask: null,
    conversationHistory: []
};

// System prompt (to be customized per agent)
const SYSTEM_PROMPT = `You are ${config.name}, a specialized Claude agent with expertise in ${config.capabilities.join(', ')}.

You have access to a persistent memory system that allows you to:
- Store and retrieve past conversations
- Learn from previous solutions
- Build expertise over time
- Share knowledge with other agents

Always:
- Check memory for similar past situations before solving problems
- Store important solutions and decisions in memory
- Learn from both successes and failures
- Consider the collective knowledge of all agents

Your role is to AGENT_SPECIFIC_ROLE_DESCRIPTION`;

// Current conversation context
let currentConversation = [];

// Connect to dashboard
socket.on('connect', () => {
    console.log(`🤖 ${config.name} connected to dashboard`);
    
    // Register agent
    socket.emit('agent-register', {
        id: config.id,
        name: config.name,
        status: agentState.status,
        type: config.type,
        capabilities: config.capabilities
    });
});

// Handle incoming messages
socket.on('message', async (data) => {
    if (data.agentId !== config.id) return;
    
    console.log(`Received message: ${data.content}`);
    agentState.status = 'busy';
    updateStatus();
    
    try {
        // Check memory for relevant context
        const relevantMemories = await memory.retrieveMemories(
            config.id,
            data.content,
            5
        );
        
        // Add to conversation
        currentConversation.push({
            role: 'user',
            content: data.content
        });
        
        // Get response with memory context
        const response = await getAgentResponse(data.content, relevantMemories);
        
        // Send response back
        socket.emit('message', {
            agentId: config.id,
            content: response
        });
        
        // Store conversation turn in memory
        await memory.storeMemory(
            config.id,
            `User: ${data.content}\nAssistant: ${response}`,
            'conversation',
            { importance: 0.6 }
        );
        
        // Add to conversation history
        currentConversation.push({
            role: 'assistant',
            content: response
        });
        
        // Store conversation if it's getting long
        if (currentConversation.length > 10) {
            await memory.storeConversation(config.id, currentConversation);
            currentConversation = currentConversation.slice(-4); // Keep last 2 exchanges
        }
        
    } catch (error) {
        console.error('Error processing message:', error);
        socket.emit('message', {
            agentId: config.id,
            content: `I encountered an error: ${error.message}. Let me try again.`
        });
    } finally {
        agentState.status = 'online';
        updateStatus();
    }
});

// Get agent response with memory context
async function getAgentResponse(userMessage, memories) {
    // Build memory context
    let memoryContext = '';
    if (memories && memories.length > 0) {
        memoryContext = '\n\nRelevant memories:\n';
        memories.forEach((mem, idx) => {
            memoryContext += `${idx + 1}. [${mem.memory_type}] ${mem.content.substring(0, 200)}...\n`;
        });
    }
    
    try {
        const message = await anthropic.messages.create({
            model: config.model,
            max_tokens: 4000,
            temperature: 0.7,
            system: SYSTEM_PROMPT,
            messages: [
                ...currentConversation.slice(-6), // Last 3 exchanges
                {
                    role: 'user',
                    content: `${memoryContext}\n\nUser request: ${userMessage}`
                }
            ]
        });
        
        return message.content[0].text;
    } catch (error) {
        console.error('Claude API error:', error);
        throw error;
    }
}

// Handle task assignments
socket.on('task-assigned', async (task) => {
    if (task.agentId !== config.id) return;
    
    console.log(`Task assigned: ${task.description}`);
    agentState.currentTask = task;
    agentState.status = 'busy';
    updateStatus();
    
    // Process task with memory context
    try {
        // Check for similar past tasks
        const similarTasks = await memory.retrieveMemories(
            config.id,
            task.description,
            3,
            { type: 'task' }
        );
        
        // Execute task
        const result = await executeTask(task, similarTasks);
        
        // Store task result in memory
        await memory.storeMemory(
            config.id,
            `Task: ${task.description}\nResult: ${result}`,
            'task',
            { 
                taskId: task.id,
                success: true,
                importance: 0.7
            }
        );
        
        // Update expertise based on task
        const skills = extractSkillsFromTask(task);
        for (const skill of skills) {
            await memory.updateExpertise(config.id, skill, true);
        }
        
        // Emit completion
        socket.emit('task-completed', {
            taskId: task.id,
            agentId: config.id,
            result: result
        });
        
    } catch (error) {
        console.error('Task failed:', error);
        
        // Store failure in memory
        await memory.storeMemory(
            config.id,
            `Task failed: ${task.description}\nError: ${error.message}`,
            'task',
            { 
                taskId: task.id,
                success: false,
                importance: 0.8
            }
        );
        
        socket.emit('task-failed', {
            taskId: task.id,
            agentId: config.id,
            error: error.message
        });
    } finally {
        agentState.currentTask = null;
        agentState.status = 'online';
        updateStatus();
    }
});

// Execute task (to be customized per agent)
async function executeTask(task, similarTasks) {
    // This is where agent-specific task execution logic goes
    console.log(`Executing task: ${task.description}`);
    
    // Learn from similar past tasks
    if (similarTasks.length > 0) {
        console.log(`Found ${similarTasks.length} similar past tasks to learn from`);
    }
    
    // Simulate task execution
    return `Task completed successfully`;
}

// Extract skills from task (to be customized per agent)
function extractSkillsFromTask(task) {
    // Extract relevant skills based on task description
    const skills = [];
    const taskLower = task.description.toLowerCase();
    
    // Add agent-specific skill extraction logic
    if (taskLower.includes('api')) skills.push('API Development');
    if (taskLower.includes('test')) skills.push('Testing');
    // ... more skill patterns
    
    return skills;
}

// Update agent status
function updateStatus() {
    socket.emit('agent-update', {
        id: config.id,
        status: agentState.status,
        currentTask: agentState.currentTask
    });
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log(`🤖 ${config.name} shutting down...`);
    
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

// Keep alive
setInterval(() => {
    socket.emit('agent-heartbeat', {
        id: config.id,
        status: agentState.status
    });
}, 30000);

console.log(`🤖 ${config.name} agent started with memory system...`);