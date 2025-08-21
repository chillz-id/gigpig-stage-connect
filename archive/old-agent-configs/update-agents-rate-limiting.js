#!/usr/bin/env node

// Script to update all specialist agents with rate limiting
const fs = require('fs').promises;
const path = require('path');

const agentFiles = [
    'frontend-agent.js',
    'backend-agent.js',
    'testing-agent.js',
    'devops-agent.js'
];

const rateImportCode = `const { getInstance: getRateLimiter } = require('../lib/rate-limiter');\n`;

const rateInitCode = `
// Initialize rate limiter for Anthropic API
const rateLimiter = getRateLimiter({
    maxRequestsPerMinute: 25, // Slightly lower than master for specialists
    maxTokensPerMinute: 15000, // Conservative token limit
    maxConcurrent: 2 // Limit concurrent requests
});

// Listen for rate limit events
rateLimiter.on('rateLimitHit', ({ error, willRetryIn }) => {
    console.error(\`⚠️ Rate limit hit! Will retry in \${willRetryIn / 1000} seconds\`);
    socket.emit('agent-message', {
        agentId: config.id,
        content: \`I've hit the API rate limit. I'll automatically retry in \${Math.round(willRetryIn / 1000)} seconds.\`
    });
});
`;

async function updateAgentFile(filename) {
    try {
        const filePath = path.join(__dirname, filename);
        let content = await fs.readFile(filePath, 'utf8');
        
        // Check if already has rate limiter
        if (content.includes('rate-limiter')) {
            console.log(`${filename} already has rate limiting`);
            return;
        }
        
        // Add import after other requires
        const anthropicImportIndex = content.indexOf("const Anthropic = require('@anthropic-ai/sdk');");
        if (anthropicImportIndex !== -1) {
            const nextLineIndex = content.indexOf('\n', anthropicImportIndex) + 1;
            content = content.slice(0, nextLineIndex) + rateImportCode + content.slice(nextLineIndex);
        }
        
        // Add initialization after socket connection
        const socketInitIndex = content.indexOf('const socket = io(config.dashboardUrl);');
        if (socketInitIndex !== -1) {
            const nextLineIndex = content.indexOf('\n', socketInitIndex) + 1;
            content = content.slice(0, nextLineIndex) + rateInitCode + content.slice(nextLineIndex);
        }
        
        // Update the message handler to use rate limiter
        // Find the anthropic.messages.create call
        const apiCallRegex = /await anthropic\.messages\.create\(/g;
        if (apiCallRegex.test(content)) {
            content = content.replace(
                /await anthropic\.messages\.create\(/g,
                'await rateLimiter.execute(async () => await anthropic.messages.create('
            );
            
            // Find the corresponding closing parenthesis and add the estimatedTokens parameter
            // This is a simplified approach - in production you'd want more robust parsing
            content = content.replace(
                /}\s*\)\s*;(\s*\/\/.*)?$/gm,
                (match) => {
                    if (match.includes('anthropic.messages.create')) {
                        return match.replace(/\)\s*;/, '), 2000);'); // Default 2000 tokens estimate
                    }
                    return match;
                }
            );
        }
        
        // Write updated content
        await fs.writeFile(filePath, content);
        console.log(`Updated ${filename} with rate limiting`);
        
    } catch (error) {
        console.error(`Error updating ${filename}:`, error);
    }
}

async function main() {
    console.log('Updating specialist agents with rate limiting...');
    
    for (const file of agentFiles) {
        await updateAgentFile(file);
    }
    
    console.log('\nDone! Remember to restart the agents with pm2 restart all');
}

main();