require('dotenv').config({ path: '/root/agents/.env' });

const axios = require('axios');

require('dotenv').config({ path: '/root/agents/.env' });

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const WORKFLOW_ID = 'py2wq9zchBz0TD9j';
const N8N_BASE_URL = 'http://localhost:5678';

async function verifyFixApplied() {
  try {
    console.log('🔍 VERIFYING IF MANUAL FIX WAS APPLIED...');
    console.log('==========================================');
    
    // Try to get workflow (this will fail if API is still broken)
    try {
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
      
      const code = transformNode.parameters.jsCode;
      
      console.log('🔍 CHECKING FOR CORRECTED CODE MARKERS:');
      console.log('=======================================');
      
      // Check for key indicators of the corrected code
      const hasCorrectTitle = code.includes('"Name": {') && code.includes('customerName');
      const hasCorrectEventName = code.includes('"Event Name": {') && code.includes('rich_text');
      const hasCorrectComment = code.includes('CORRECTED: Map to ACTUAL Notion database fields');
      const hasUltraSafe = code.includes('Ultra-safe customer name');
      
      console.log(`✅ Title maps to customerName: ${hasCorrectTitle ? 'YES' : 'NO'}`);
      console.log(`✅ Event Name is rich_text: ${hasCorrectEventName ? 'YES' : 'NO'}`);
      console.log(`✅ Has corrected comment: ${hasCorrectComment ? 'YES' : 'NO'}`);
      console.log(`✅ Has ultra-safe handling: ${hasUltraSafe ? 'YES' : 'NO'}`);
      
      if (hasCorrectTitle && hasCorrectEventName && hasCorrectComment) {
        console.log('\n🎉 SUCCESS: Manual fix has been applied correctly!');
        console.log('✅ Transform Orders now has the corrected field mappings');
        console.log('🚀 The workflow should now complete without stopping');
        console.log('');
        console.log('🔗 Test by running the workflow manually in N8N UI');
        console.log('🔗 Check results: https://www.notion.so/1374745b8cbe804b87a2ec93b3385e01');
      } else {
        console.log('\n⚠️ PARTIAL OR NO FIX DETECTED');
        console.log('Please ensure you copied the entire corrected code');
        console.log('See: /root/agents/scripts/MANUAL_FIX_INSTRUCTIONS.md');
      }
      
    } catch (apiError) {
      console.log('⚠️ N8N API not accessible - Cannot verify automatically');
      console.log('');
      console.log('📋 MANUAL VERIFICATION STEPS:');
      console.log('=============================');
      console.log('1. Open N8N: http://localhost:5678');
      console.log('2. Open "Humanitix Historical Import" workflow');
      console.log('3. Click "Transform Orders" node');
      console.log('4. Check if code contains:');
      console.log('   ✅ "Name": { title: [{ text: { content: customerName } }] }');
      console.log('   ✅ "Event Name": { rich_text: [{ text: { content: eventName } }] }');
      console.log('   ✅ Comment: "CORRECTED: Map to ACTUAL Notion database fields"');
      console.log('');
      console.log('5. If not, apply the manual fix from:');
      console.log('   📄 /root/agents/scripts/MANUAL_FIX_INSTRUCTIONS.md');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

verifyFixApplied();