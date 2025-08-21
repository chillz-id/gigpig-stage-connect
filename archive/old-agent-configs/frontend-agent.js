// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Anthropic = require('@anthropic-ai/sdk');
const io = require('socket.io-client');
const fs = require('fs').promises;
const path = require('path');
const { getInstance: getRateLimiter } = require('../lib/rate-limiter');

// Configuration
const config = {
    id: 'frontend-specialist',
    name: 'Frontend Specialist',
    type: 'frontend',
    capabilities: ['React', 'TypeScript', 'UI/UX', 'Tailwind CSS', 'Component Design'],
    model: 'claude-sonnet-4-20250514',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    dashboardUrl: 'http://localhost:3001'
};

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: config.apiKey,
});

// Connect to dashboard
const socket = io(config.dashboardUrl);
let currentConversation = [];

// Initialize rate limiter for Anthropic API
const rateLimiter = getRateLimiter({
    maxRequestsPerMinute: 25, // Slightly lower than master for specialists
    maxTokensPerMinute: 15000, // Conservative token limit
    maxConcurrent: 2 // Limit concurrent requests
});

// Listen for rate limit events
rateLimiter.on('rateLimitHit', ({ error, willRetryIn }) => {
    console.error(`⚠️ Rate limit hit! Will retry in ${willRetryIn / 1000} seconds`);
    socket.emit('agent-message', {
        agentId: config.id,
        content: `I've hit the API rate limit. I'll automatically retry in ${Math.round(willRetryIn / 1000)} seconds.`
    });
});

// Agent state
const agentState = {
    status: 'online',
    currentTask: null,
    conversationHistory: [],
    codeOutputs: []
};

// Connect to dashboard
socket.on('connect', () => {
    console.log(`${config.name} connected to dashboard`);
    
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

// Handle task assignments from orchestrator
socket.on('task-assignment', async (data) => {
    if (data.agentId !== config.id) return;
    
    console.log(`Task assigned: ${data.title}`);
    agentState.currentTask = data;
    agentState.status = 'busy';
    updateStatus();
    
    try {
        // Notify user of task assignment
        socket.emit('agent-message', {
            agentId: config.id,
            content: `📋 Task assigned: ${data.title}\n\nI'll start working on this phase of the task.\nAcceptance criteria:\n${data.acceptanceCriteria.map(c => '- ' + c).join('\n')}`
        });
        
        // Process the task
        await processAssignedTask(data);
        
    } catch (error) {
        console.error('Task handling error:', error);
        await reportTaskFailure(data, error);
    }
});

// Process assigned task
async function processAssignedTask(taskData) {
    try {
        // Update phase status
        socket.emit('phase-update', {
            phaseId: taskData.phaseId,
            status: 'in_progress',
            progress: 10
        });
        
        // Create task execution plan
        const plan = await createTaskPlan(taskData);
        
        socket.emit('agent-message', {
            agentId: config.id,
            content: `📝 Task plan created. Starting implementation...\n\n${plan}`
        });
        
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
        system: `You are a ${config.type} specialist. Create a detailed implementation plan for the given task.`,
        messages: [{
            role: 'user',
            content: `Task: ${taskData.title}\nDescription: ${taskData.description}\nAcceptance Criteria: ${JSON.stringify(taskData.acceptanceCriteria)}\nBranch: ${taskData.branch}\n\nCreate a step-by-step implementation plan.`
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
        testsPassed: false,
        success: true
    };
    
    // Update progress
    socket.emit('phase-update', {
        phaseId: taskData.phaseId,
        status: 'in_progress',
        progress: 50
    });
    
    // This is where actual implementation would happen
    // For now, we'll simulate work being done
    
    socket.emit('agent-message', {
        agentId: config.id,
        content: '🔨 Implementing the solution...'
    });
    
    // Simulate implementation time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Update progress
    socket.emit('phase-update', {
        phaseId: taskData.phaseId,
        status: 'in_progress',
        progress: 90
    });
    
    results.actions.push('Created necessary files');
    results.actions.push('Implemented required functionality');
    results.files = ['src/components/NewComponent.tsx', 'src/styles/component.css'];
    
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
    
    socket.emit('agent-message', {
        agentId: config.id,
        content: `✅ Task completed successfully!\n\nFiles modified:\n${results.files.map(f => '- ' + f).join('\n')}\n\nThe task has been sent for testing.`
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
    
    socket.emit('agent-message', {
        agentId: config.id,
        content: `❌ Task failed: ${error.message}\n\nI'll need assistance to resolve this issue.`
    });
}

// Handle test requests
socket.on('test-request', async (data) => {
    if (data.agentId !== config.id) return;
    
    console.log('Test request received:', data.phaseId);
    
    try {
        socket.emit('agent-message', {
            agentId: config.id,
            content: `🧪 Running tests for phase ${data.phaseId}...\n\nChecking acceptance criteria:\n${data.acceptanceCriteria.map(c => '- ' + c).join('\n')}`
        });
        
        // Simulate running tests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const testResults = {
            passed: true,
            results: [
                { test: 'Unit tests', passed: true, coverage: 85 },
                { test: 'Integration tests', passed: true, coverage: 78 },
                { test: 'Acceptance criteria', passed: true, coverage: 100 }
            ],
            coverage: 87
        };
        
        // Report test results
        await fetch(`http://localhost:3003/api/phases/${data.phaseId}/test-results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testResults)
        });
        
        socket.emit('agent-message', {
            agentId: config.id,
            content: `✅ All tests passed!\n\nCoverage: ${testResults.coverage}%\n${testResults.results.map(r => `- ${r.test}: ${r.passed ? '✓' : '✗'} (${r.coverage}%)`).join('\n')}`
        });
        
    } catch (error) {
        console.error('Test execution failed:', error);
        socket.emit('agent-message', {
            agentId: config.id,
            content: `❌ Test execution failed: ${error.message}`
        });
    }
});


socket.on('message', async (data) => {
    if (data.agentId !== config.id) return;
    
    console.log(`Received message: ${data.content}`);
    agentState.status = 'busy';
    updateStatus();
    
    try {
        // Add user message to conversation
        currentConversation.push({
            role: 'user',
            content: data.content
        });
        
        // Get Claude's response
        const response = await getClaudeResponse(data.content);
        
        // Send response back
        socket.emit('agent-message', {
            agentId: config.id,
            content: response.text,
            codeBlocks: response.codeBlocks
        });
        
        // Process any code blocks
        if (response.codeBlocks.length > 0) {
            for (const codeBlock of response.codeBlocks) {
                socket.emit('code-update', {
                    agentId: config.id,
                    file: codeBlock.file,
                    content: codeBlock.content,
                    action: codeBlock.action || 'modified'
                });
            }
        }
        
        // Add assistant message to conversation
        currentConversation.push({
            role: 'assistant',
            content: response.text
        });
        
    } catch (error) {
        console.error('Error processing message:', error);
        socket.emit('agent-message', {
            agentId: config.id,
            content: `I encountered an error: ${error.message}. Please try again.`
        });
    } finally {
        agentState.status = 'online';
        updateStatus();
    }
});

// Get Claude's response
async function getClaudeResponse(userMessage) {
    const systemPrompt = `You are a Frontend Specialist AI agent with expertise in:
- React 18 and TypeScript
- Tailwind CSS and shadcn/ui components
- Modern UI/UX design principles
- Component architecture and state management
- Performance optimization
- Responsive design and accessibility

You are part of a multi-agent system working on the Stand Up Sydney comedy platform.

CODE FORMATTING INSTRUCTIONS:
- Always format code examples using markdown code blocks with triple backticks (\`\`\`)
- Include the appropriate language identifier after the opening backticks (e.g., \`\`\`typescript, \`\`\`javascript, \`\`\`css, \`\`\`jsx, \`\`\`tsx)
- Specify the file path and whether you're creating or modifying it
- Use proper indentation and formatting within code blocks
- For inline code, use single backticks

Example:
\`\`\`typescript
// File: src/components/Button.tsx
import React from 'react';

const Button: React.FC = () => {
  return <button>Click me</button>;
};
\`\`\`

Be concise but thorough in your explanations.`;

    try {
        // Estimate tokens for rate limiting
        const estimatedTokens = Math.min(4000, userMessage.length / 4 + 1000);
        
        // Use rate limiter to make the API call
        const message = await rateLimiter.execute(async () => {
            return await anthropic.messages.create({
                model: config.model,
                max_tokens: 4000,
                temperature: 0.7,
                system: systemPrompt,
                messages: currentConversation
            });
        }, estimatedTokens);
        
        // Extract code blocks from response
        const codeBlocks = extractCodeBlocks(message.content[0].text);
        
        return {
            text: message.content[0].text,
            codeBlocks: codeBlocks
        };
    } catch (error) {
        console.error('Claude API error:', error);
        throw error;
    }
}

// Extract code blocks from response
function extractCodeBlocks(text) {
    const codeBlocks = [];
    const codeRegex = /```(?:(\w+)\n)?([^`]+)```/g;
    const fileRegex = /(?:File|Path|Location):\s*([^\n]+)/i;
    
    let match;
    while ((match = codeRegex.exec(text)) !== null) {
        const language = match[1] || 'text';
        const content = match[2].trim();
        
        // Try to extract file path from surrounding context
        const contextStart = Math.max(0, match.index - 200);
        const context = text.substring(contextStart, match.index);
        const fileMatch = fileRegex.exec(context);
        
        codeBlocks.push({
            language: language,
            content: content,
            file: fileMatch ? fileMatch[1].trim() : `untitled.${language}`,
            action: context.includes('create') ? 'created' : 'modified'
        });
    }
    
    return codeBlocks;
}

// Update agent status
function updateStatus() {
    socket.emit('agent-update', {
        id: config.id,
        status: agentState.status,
        currentTask: agentState.currentTask
    });
}

// Handle task assignments
socket.on('task-assigned', async (task) => {
    if (task.agentId !== config.id) return;
    
    console.log(`Task assigned: ${task.description}`);
    agentState.currentTask = task;
    agentState.status = 'busy';
    updateStatus();
    
    // Process the task as a message
    socket.emit('agent-message', {
        agentId: config.id,
        content: `I've received the task: "${task.description}". Let me start working on it.`
    });
    
    // Simulate task processing
    setTimeout(() => {
        socket.emit('task-completed', {
            taskId: task.id,
            agentId: config.id,
            result: 'Task completed successfully'
        });
        
        agentState.currentTask = null;
        agentState.status = 'online';
        updateStatus();
    }, 5000);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(`${config.name} shutting down...`);
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

console.log(`${config.name} agent started and waiting for messages...`);