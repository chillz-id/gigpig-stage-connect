const axios = require('axios');
require('dotenv').config({ path: '/root/agents/.env' });


const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const N8N_BASE_URL = 'http://localhost:5678';

async function checkWorkflows() {
  try {
    console.log('Checking N8N workflows...');
    
    const response = await axios.get(
      `${N8N_BASE_URL}/api/v1/workflows`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Found workflows:');
    response.data.data.forEach(workflow => {
      console.log(`- ${workflow.name} (ID: ${workflow.id}) - Active: ${workflow.active}`);
    });
    
    // Look for Humanitix workflows specifically
    const humanitixWorkflows = response.data.data.filter(w => 
      w.name.toLowerCase().includes('humanitix')
    );
    
    console.log('\nHumanitix workflows:');
    humanitixWorkflows.forEach(workflow => {
      console.log(`- ${workflow.name} (ID: ${workflow.id}) - Active: ${workflow.active}`);
    });
    
  } catch (error) {
    console.error('Error checking workflows:', error.response?.data || error.message);
  }
}

checkWorkflows();