#!/usr/bin/env node

/**
 * TaskMaster Debug Script
 * Test TaskMaster MCP connection and functionality
 */

async function debugTaskMaster() {
  console.log('🔍 Debugging TaskMaster MCP Connection...\n');
  
  // Check if TaskMaster package exists
  console.log('1. Checking TaskMaster Package Installation:');
  try {
    const { execSync } = require('child_process');
    const result = execSync('npm list task-master-ai', { encoding: 'utf8', stdio: 'pipe' });
    console.log('✅ TaskMaster package found:', result.trim());
  } catch (error) {
    console.log('❌ TaskMaster package not found:', error.message);
    console.log('📦 Attempting to install...');
    try {
      execSync('npm install task-master-ai', { encoding: 'utf8', stdio: 'inherit' });
      console.log('✅ TaskMaster installed successfully');
    } catch (installError) {
      console.log('❌ TaskMaster installation failed:', installError.message);
    }
  }
  
  console.log('\n2. Checking Environment Variables:');
  const requiredEnvs = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'PERPLEXITY_API_KEY', 'GOOGLE_API_KEY'];
  requiredEnvs.forEach(env => {
    const value = process.env[env];
    if (value) {
      console.log(`✅ ${env}: ${value.substring(0, 15)}...`);
    } else {
      console.log(`❌ ${env}: Not set`);
    }
  });
  
  console.log('\n3. Testing TaskMaster Direct Connection:');
  try {
    // Try to import and test TaskMaster directly
    const TaskMaster = require('task-master-ai');
    console.log('✅ TaskMaster module imported successfully');
    
    // Test basic functionality
    const taskmaster = new TaskMaster({
      anthropic_api_key: process.env.ANTHROPIC_API_KEY,
      openai_api_key: process.env.OPENAI_API_KEY,
      perplexity_api_key: process.env.PERPLEXITY_API_KEY,
      google_api_key: process.env.GOOGLE_API_KEY
    });
    
    console.log('✅ TaskMaster instance created');
    
    // Test simple task submission
    console.log('\n4. Testing Simple Task Submission:');
    const testTask = {
      task_id: 'test_' + Date.now(),
      name: 'Health Check Test',
      description: 'Simple test to verify TaskMaster connectivity',
      priority: 'medium',
      context: { test: true }
    };
    
    const result = await taskmaster.submitTask(testTask);
    console.log('✅ Test task submitted:', result);
    
    // Check task status
    const status = await taskmaster.checkStatus(testTask.task_id);
    console.log('✅ Task status retrieved:', status);
    
  } catch (error) {
    console.log('❌ TaskMaster direct test failed:', error.message);
    console.log('Error details:', error);
  }
  
  console.log('\n5. Testing MCP Protocol:');
  try {
    // Test MCP tools directly
    const { spawn } = require('child_process');
    
    console.log('Starting TaskMaster MCP server...');
    const mcpProcess = spawn('npx', [
      '-y',
      '--package=task-master-ai',
      'task-master-ai'
    ], {
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    mcpProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log('MCP Output:', data.toString().trim());
    });
    
    mcpProcess.stderr.on('data', (data) => {
      console.log('MCP Error:', data.toString().trim());
    });
    
    // Send a test MCP message
    setTimeout(() => {
      const testMessage = {
        jsonrpc: '2.0',
        method: 'ping',
        id: 1
      };
      
      mcpProcess.stdin.write(JSON.stringify(testMessage) + '\n');
      console.log('📤 Sent test MCP message:', testMessage);
    }, 2000);
    
    // Cleanup after 10 seconds
    setTimeout(() => {
      mcpProcess.kill();
      console.log('\n✅ MCP test completed');
      
      if (output.includes('Connected') || output.includes('ready')) {
        console.log('✅ TaskMaster MCP server appears functional');
      } else {
        console.log('❌ TaskMaster MCP server may have issues');
        console.log('Full output:', output);
      }
    }, 10000);
    
  } catch (error) {
    console.log('❌ MCP protocol test failed:', error.message);
  }
}

// Run the debug if called directly
if (require.main === module) {
  debugTaskMaster().catch(console.error);
}

module.exports = { debugTaskMaster };