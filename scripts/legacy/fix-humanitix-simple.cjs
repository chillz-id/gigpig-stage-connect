require('dotenv').config({ path: '/root/agents/.env' });

#!/usr/bin/env node
/**
 * Simple Humanitix workflow fix - only essential updates
 */

const N8N_API_KEY = process.env.N8N_API_KEY;
if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable not set');
}
const N8N_API_URL = "http://localhost:5678/api/v1";

async function fixWorkflows() {
  const headers = {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json'
  };

  try {
    console.log('🚀 Starting Humanitix workflow fixes...\n');

    // Fix Real-time Sync Workflow
    console.log('📥 Fetching real-time sync workflow...');
    const response = await fetch(`${N8N_API_URL}/workflows/7w1BMGSjVVUtadjf`, {
      method: 'GET',
      headers
    });

    const workflow = await response.json();
    console.log('✅ Got workflow:', workflow.name);

    // Create minimal update object with only the required fields
    const updateData = {
      name: workflow.name,
      nodes: workflow.nodes.map(node => {
        const updatedNode = { ...node };

        // Fix Brevo API key security issue
        if (node.name === 'Sync to Brevo') {
          console.log('🔐 Securing Brevo API key...');
          updatedNode.parameters = { ...node.parameters };
          updatedNode.parameters.headerParameters = { ...node.parameters.headerParameters };
          updatedNode.parameters.headerParameters.parameters = node.parameters.headerParameters.parameters.map(param => {
            if (param.name === 'api-key') {
              return {
                ...param,
                value: "={{ $env.BREVO_API_KEY }}" // Use environment variable
              };
            }
            return param;
          });
        }

        // Fix event processing to handle more events
        if (node.name === 'Process Events') {
          console.log('📅 Extending event date range...');
          updatedNode.parameters = { ...node.parameters };
          updatedNode.parameters.jsCode = `
            const events = $input.all()[0].json.events || [];
            const output = [];

            for (const event of events) {
              const eventDate = new Date(event.startDate);
              const sixMonthsAgo = new Date();
              sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6); // Increased from 30 days
              
              if (event.status === 'live' && eventDate > sixMonthsAgo) {
                output.push({
                  eventId: event._id,
                  eventName: event.title,
                  eventDate: event.startDate,
                  eventLocation: event.location,
                  venue: event.eventLocation?.venueName || 'Unknown Venue',
                  city: event.eventLocation?.city || '',
                  region: event.eventLocation?.region || ''
                });
              }
            }

            console.log(\`Processing \${output.length} events for order sync (6 month range)\`);
            return output;
          `.trim();
        }

        return updatedNode;
      }),
      connections: workflow.connections,
      settings: workflow.settings
    };

    console.log('💾 Updating real-time sync workflow...');
    const updateResponse = await fetch(`${N8N_API_URL}/workflows/7w1BMGSjVVUtadjf`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ Update failed:', updateResponse.status, errorText);
      throw new Error(`Update failed: ${updateResponse.status}`);
    }

    console.log('✅ Real-time sync workflow updated successfully!\n');

    // Now fix the historical import workflow
    console.log('📥 Fetching historical import workflow...');
    const histResponse = await fetch(`${N8N_API_URL}/workflows/py2wq9zchBz0TD9j`, {
      method: 'GET',
      headers
    });

    const histWorkflow = await histResponse.json();
    console.log('✅ Got workflow:', histWorkflow.name);

    // Fix the historical workflow
    const histUpdateData = {
      name: histWorkflow.name,
      nodes: histWorkflow.nodes.map(node => {
        const updatedNode = { ...node };

        // Fix JavaScript syntax error
        if (node.name === 'Set Parameters') {
          console.log('🔧 Fixing JavaScript syntax error...');
          updatedNode.parameters = { ...node.parameters };
          updatedNode.parameters.jsCode = node.parameters.jsCode.replace('hasMore: True', 'hasMore: true');
        }

        return updatedNode;
      }),
      connections: histWorkflow.connections,
      settings: histWorkflow.settings
    };

    console.log('💾 Updating historical import workflow...');
    const histUpdateResponse = await fetch(`${N8N_API_URL}/workflows/py2wq9zchBz0TD9j`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(histUpdateData)
    });

    if (!histUpdateResponse.ok) {
      const errorText = await histUpdateResponse.text();
      console.error('❌ Historical update failed:', histUpdateResponse.status, errorText);
      throw new Error(`Historical update failed: ${histUpdateResponse.status}`);
    }

    console.log('✅ Historical import workflow updated successfully!\n');

    console.log('🎉 All Humanitix workflows have been fixed!');
    console.log('\n📋 Repairs applied:');
    console.log('  • Secured Brevo API key using environment variable');
    console.log('  • Extended event processing from 30 days to 6 months');
    console.log('  • Fixed JavaScript syntax error in historical import');
    console.log('\n⚠️  Next steps:');
    console.log('  1. Set BREVO_API_KEY environment variable in N8N');
    console.log('  2. Set HUMANITIX_API_KEY environment variable in N8N');
    console.log('  3. Test both workflows before activating');

  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

fixWorkflows();