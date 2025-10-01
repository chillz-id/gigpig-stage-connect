// Extend the existing n8n-automation.js to support updating workflow nodes
const originalScript = require('./n8n-automation.js');

// Add update capability
originalScript.updateWorkflowNodes = async function(workflowId, nodeUpdates) {
  const workflow = await this.getWorkflow(workflowId);
  
  const updatedNodes = workflow.nodes.map(node => {
    if (nodeUpdates[node.name]) {
      return {
        ...node,
        parameters: {
          ...node.parameters,
          jsCode: nodeUpdates[node.name]
        }
      };
    }
    return node;
  });

  const updateData = {
    name: workflow.name,
    nodes: updatedNodes,
    connections: workflow.connections,
    settings: workflow.settings
  };

  return await this.makeRequest('PUT', `/workflows/${workflowId}`, updateData);
};

module.exports = originalScript;