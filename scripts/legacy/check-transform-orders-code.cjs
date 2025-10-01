const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });

const fs = require('fs');

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function compareTransformOrdersCode() {
  try {
    console.log('🔍 CHECKING CURRENT TRANSFORM ORDERS CODE VS CORRECTED VERSION...');
    console.log('==================================================================');
    
    // Get current workflow
    const workflowResponse = await axios.get(
      `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const workflow = workflowResponse.data;
    const transformNode = workflow.nodes.find(node => node.name === 'Transform Orders');
    
    if (!transformNode) {
      console.log('❌ Transform Orders node not found');
      return;
    }
    
    const currentCode = transformNode.parameters.jsCode;
    
    // Read our corrected code
    const correctedCode = fs.readFileSync('/root/agents/scripts/corrected-transform-orders.js', 'utf8');
    
    console.log('📋 CURRENT TRANSFORM ORDERS CODE ANALYSIS:');
    console.log('==========================================');
    
    // Check for key differences
    const currentLines = currentCode.split('\n');
    const correctedLines = correctedCode.split('\n');
    
    console.log(`Current code lines: ${currentLines.length}`);
    console.log(`Corrected code lines: ${correctedLines.length}`);
    
    // Look for specific issues
    console.log('\n🔍 KEY CHECKS:');
    console.log('==============');
    
    // Check 1: Title field mapping
    const hasTitleFix = currentCode.includes('"Name": {') && currentCode.includes('customerName');
    console.log(`✅ Title field maps to customerName: ${hasTitleFix ? 'YES' : 'NO - ISSUE FOUND!'}`);
    
    // Check 2: Event name field
    const hasEventNameField = currentCode.includes('"Event Name": {');
    console.log(`✅ Has Event Name field: ${hasEventNameField ? 'YES' : 'NO - ISSUE FOUND!'}`);
    
    // Check 3: Old wrong structure
    const hasOldStructure = currentCode.includes('"Event Name": {\\n            title:');
    console.log(`❌ Still using old structure: ${hasOldStructure ? 'YES - PROBLEM!' : 'NO'}`);
    
    // Check 4: Ultra-safe error handling
    const hasUltraSafe = currentCode.includes('Ultra-safe') && currentCode.includes('eventInfo?.title || eventInfo?.name');
    console.log(`✅ Has ultra-safe error handling: ${hasUltraSafe ? 'YES' : 'NO - ISSUE FOUND!'}`);
    
    if (!hasTitleFix || hasOldStructure) {
      console.log('\n❌ CRITICAL ISSUE DETECTED:');
      console.log('===========================');
      console.log('The Transform Orders node still has the OLD incorrect code!');
      console.log('This explains why the workflow is still failing.');
      console.log('');
      console.log('🔧 SOLUTION: The corrected JavaScript code needs to be applied to the Transform Orders node.');
      
      // Show what the mapping should be
      console.log('\n🎯 CORRECT MAPPING STRUCTURE (from corrected-transform-orders.js):');
      console.log('================================================================');
      console.log('✅ "Name" (title) ← customerName (NOT eventName)');
      console.log('✅ "Event Name" (rich_text) ← eventName');
      console.log('✅ "Email" ← email');
      console.log('✅ "Order ID" ← orderId');
      console.log('✅ All other fields correctly mapped');
      
      return false;
    } else {
      console.log('\n✅ Transform Orders code looks correct!');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error checking code:', error.response?.data || error.message);
    return false;
  }
}

compareTransformOrdersCode().then(isCorrect => {
  if (!isCorrect) {
    console.log('\n🚀 NEXT STEP: Apply the corrected Transform Orders code');
    console.log('Run: node scripts/update-transform-orders-code.cjs');
  }
});