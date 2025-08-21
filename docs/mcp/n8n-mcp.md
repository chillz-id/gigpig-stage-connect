# N8N MCP Server Documentation

## Overview

The N8N MCP server provides workflow automation capabilities through the Model Context Protocol, enabling AI assistants to create, manage, and execute automated workflows.

**Official Repository**: [github.com/leonardsellem/n8n-mcp-server](https://github.com/leonardsellem/n8n-mcp-server)

## Configuration

In `/root/agents/.mcp.json`:
```json
"n8n-local": {
  "command": "python3",
  "args": [
    "/opt/standup-sydney-mcp/n8n_mcp_wrapper.py"
  ],
  "env": {
    "N8N_API_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1M2UzN2FhMC03MTc4LTRmMmYtODBhYS00ODNiYmE1ODc0YWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUxNTcwMDc2fQ._zbYlvtzSMRFHnQu6O_L2LhJU4Ib1655bynbmoXeqMo",
    "N8N_API_URL": "http://localhost:5678/api/v1"
  }
}
```

## Available Tools

### Workflow Management
- `create_workflow`: Create new workflow
- `get_workflow`: Retrieve workflow details
- `update_workflow`: Update workflow configuration
- `delete_workflow`: Delete workflow
- `list_workflows`: List all workflows
- `duplicate_workflow`: Clone existing workflow

### Execution Control
- `execute_workflow`: Trigger workflow execution
- `get_execution`: Get execution details
- `list_executions`: List workflow executions
- `stop_execution`: Stop running execution
- `retry_execution`: Retry failed execution

### Node Operations
- `add_node`: Add node to workflow
- `remove_node`: Remove node from workflow
- `update_node`: Update node configuration
- `get_node_types`: List available node types
- `get_node_info`: Get node type information

### Credential Management
- `create_credential`: Create new credential
- `get_credential`: Retrieve credential details
- `update_credential`: Update credential
- `delete_credential`: Delete credential
- `list_credentials`: List all credentials

### Monitoring & Logs
- `get_workflow_status`: Check workflow status
- `get_execution_logs`: Retrieve execution logs
- `get_system_info`: Get N8N system information
- `health_check`: Check system health

## Usage Examples

### Workflow Creation
```javascript
// Create simple workflow
await n8n.create_workflow({
  name: "Data Processing Workflow",
  nodes: [
    {
      name: "Start",
      type: "n8n-nodes-base.manualTrigger",
      position: [250, 300],
      parameters: {}
    },
    {
      name: "HTTP Request",
      type: "n8n-nodes-base.httpRequest",
      position: [450, 300],
      parameters: {
        url: "https://api.example.com/data",
        method: "GET"
      }
    }
  ],
  connections: {
    "Start": {
      "main": [
        [
          {
            "node": "HTTP Request",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
});
```

### Workflow Execution
```javascript
// Execute workflow
const execution = await n8n.execute_workflow({
  workflowId: "workflow_123",
  inputData: {
    name: "John Doe",
    email: "john@example.com"
  }
});

// Check execution status
const status = await n8n.get_execution({
  executionId: execution.id
});
```

### Credential Management
```javascript
// Create credential
await n8n.create_credential({
  name: "API Credentials",
  type: "httpBasicAuth",
  data: {
    user: "username",
    password: "password"
  }
});

// Use credential in workflow
await n8n.update_node({
  workflowId: "workflow_123",
  nodeName: "HTTP Request",
  parameters: {
    authentication: "predefinedCredentialType",
    nodeCredentialType: "httpBasicAuth"
  }
});
```

### Monitoring
```javascript
// Get workflow status
const status = await n8n.get_workflow_status({
  workflowId: "workflow_123"
});

// Get execution logs
const logs = await n8n.get_execution_logs({
  executionId: "exec_456",
  limit: 100
});

// Health check
const health = await n8n.health_check();
```

## Node Types

### Triggers
- **Manual Trigger**: Start workflow manually
- **Webhook**: HTTP webhook trigger
- **Cron**: Schedule-based trigger
- **File Trigger**: File system changes
- **Email Trigger**: Email-based triggers

### Data Sources
- **HTTP Request**: Make HTTP requests
- **Database**: Connect to databases
- **File System**: Read/write files
- **Email**: Send/receive emails
- **Cloud Storage**: AWS S3, Google Drive, etc.

### Data Processing
- **Function**: Execute JavaScript code
- **Set**: Manipulate data
- **Filter**: Filter data items
- **Sort**: Sort data
- **Aggregate**: Aggregate data

### Integrations
- **Slack**: Send messages, manage channels
- **Gmail**: Email operations
- **Notion**: Database operations
- **Airtable**: Database operations
- **GitHub**: Repository operations

## Workflow Patterns

### Simple Linear Workflow
```
Trigger → Process → Action
```

### Conditional Workflow
```
Trigger → Decision → Action A
                  → Action B
```

### Parallel Processing
```
Trigger → Split → Process A → Merge → Final Action
              → Process B →
```

### Error Handling
```
Trigger → Process → Success Action
              → Error → Error Handler
```

## Authentication

### API Key Authentication
N8N requires API key authentication:
1. Generate API key in N8N settings
2. Configure in MCP server environment
3. Use for all API requests

### Credential Management
- Store sensitive credentials securely
- Use credential types for different services
- Encrypt credential data

## Common Use Cases

1. **Data Synchronization**: Sync data between systems
2. **Notification Automation**: Send alerts and notifications
3. **File Processing**: Process uploaded files
4. **API Integration**: Connect different APIs
5. **Report Generation**: Generate and send reports
6. **Data Transformation**: Transform data formats
7. **Monitoring**: Monitor systems and send alerts

## Error Handling

Common errors and solutions:
- **401 Unauthorized**: Check API key
- **404 Not Found**: Verify workflow/execution ID
- **500 Internal Error**: Check N8N server status
- **Timeout**: Increase execution timeout
- **Node Error**: Check node configuration

## Performance Optimization

### Workflow Design
- Keep workflows simple and focused
- Use appropriate node types
- Minimize data processing
- Implement error handling

### Execution Optimization
- Use webhook triggers for real-time processing
- Implement proper retry logic
- Monitor execution performance
- Use pagination for large datasets

## Best Practices

1. **Workflow Organization**: Use clear naming conventions
2. **Error Handling**: Implement comprehensive error handling
3. **Security**: Use credentials properly
4. **Testing**: Test workflows thoroughly
5. **Documentation**: Document workflow purpose and logic
6. **Monitoring**: Monitor workflow performance

## Security Considerations

1. **Credential Security**: Store credentials securely
2. **API Access**: Limit API access
3. **Data Validation**: Validate input data
4. **Network Security**: Secure N8N instance
5. **Audit Logging**: Log workflow activities

## Related Resources

- [N8N Documentation](https://docs.n8n.io)
- [N8N MCP Server Repository](https://github.com/leonardsellem/n8n-mcp-server)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [N8N Community](https://community.n8n.io)