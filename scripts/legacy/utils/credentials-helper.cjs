/**
 * Credentials Helper Utility (CommonJS version)
 * Provides secure credential loading and placeholder replacement for workflows
 */

// Load environment variables
require('dotenv').config({ path: '/root/agents/.env' });

/**
 * Validates that required environment variables are set
 */
function validateCredentials() {
  const required = ['N8N_API_KEY', 'HUMANITIX_API_KEY', 'NOTION_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Gets credentials safely from environment
 */
function getCredentials() {
  validateCredentials();
  
  return {
    N8N_API_KEY: process.env.N8N_API_KEY,
    N8N_API_URL: process.env.N8N_API_URL || 'http://localhost:5678/api/v1',
    HUMANITIX_API_KEY: process.env.HUMANITIX_API_KEY,
    NOTION_API_KEY: process.env.NOTION_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY
  };
}

/**
 * Replaces placeholders in workflow JSON with actual credentials
 * @param {Object} workflowData - Workflow JSON object
 * @returns {Object} - Workflow with credentials replaced
 */
function injectCredentials(workflowData) {
  const credentials = getCredentials();
  let workflowJson = JSON.stringify(workflowData, null, 2);
  
  // Replace all placeholder patterns
  workflowJson = workflowJson.replace(/\{\{HUMANITIX_API_KEY\}\}/g, credentials.HUMANITIX_API_KEY);
  workflowJson = workflowJson.replace(/\{\{NOTION_API_KEY\}\}/g, credentials.NOTION_API_KEY);
  workflowJson = workflowJson.replace(/\{\{SUPABASE_ANON_KEY\}\}/g, credentials.SUPABASE_ANON_KEY);
  workflowJson = workflowJson.replace(/\{\{SUPABASE_SERVICE_KEY\}\}/g, credentials.SUPABASE_SERVICE_KEY);
  workflowJson = workflowJson.replace(/Bearer \{\{NOTION_API_KEY\}\}/g, `Bearer ${credentials.NOTION_API_KEY}`);
  workflowJson = workflowJson.replace(/Bearer \{\{SUPABASE_ANON_KEY\}\}/g, `Bearer ${credentials.SUPABASE_ANON_KEY}`);
  
  return JSON.parse(workflowJson);
}

/**
 * Creates N8N API headers
 */
function getN8NHeaders() {
  const { N8N_API_KEY } = getCredentials();
  return {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json'
  };
}

module.exports = {
  validateCredentials,
  getCredentials,
  injectCredentials,
  getN8NHeaders
};