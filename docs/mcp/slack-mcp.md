# Slack MCP Server Documentation

## Overview

The Slack MCP server provides integration with Slack's API through the Model Context Protocol, enabling AI assistants to interact with Slack channels, messages, and workspace features.

**Official Repository**: [github.com/modelcontextprotocol/server-slack](https://github.com/modelcontextprotocol/server-slack)

## Configuration

In `/root/agents/.mcp.json`:
```json
"slack": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-slack@latest"
  ],
  "env": {
    "SLACK_BOT_TOKEN": "xoxb-YOUR_SLACK_BOT_TOKEN_HERE_GET_FROM_OWNER",
    "SLACK_APP_TOKEN": "xapp-YOUR_SLACK_APP_TOKEN_HERE_GET_FROM_OWNER"
  }
}
```

## Available Tools

### Message Management
- `send_message`: Send message to channel or user
- `get_message`: Retrieve message details
- `update_message`: Edit existing message
- `delete_message`: Delete message
- `add_reaction`: Add emoji reaction to message
- `remove_reaction`: Remove emoji reaction

### Channel Operations
- `list_channels`: List all channels in workspace
- `create_channel`: Create new channel
- `join_channel`: Join existing channel
- `leave_channel`: Leave channel
- `get_channel_info`: Get channel details
- `set_channel_topic`: Update channel topic
- `archive_channel`: Archive channel
- `unarchive_channel`: Unarchive channel

### User Management
- `list_users`: List workspace users
- `get_user_info`: Get user details
- `set_user_status`: Update user status
- `get_user_presence`: Check user presence

### File Operations
- `upload_file`: Upload file to channel
- `get_file_info`: Get file details
- `delete_file`: Delete file
- `share_file`: Share file to channel

### Search & History
- `search_messages`: Search messages across workspace
- `get_channel_history`: Get channel message history
- `get_thread_replies`: Get replies to thread

## Usage Examples

### Sending Messages
```javascript
// Send message to channel
await slack.send_message({
  channel: "#general",
  text: "Hello from MCP!",
  thread_ts: null
});

// Send direct message
await slack.send_message({
  channel: "@username",
  text: "Private message",
  attachments: [
    {
      color: "good",
      title: "Status Update",
      text: "Everything is working!"
    }
  ]
});
```

### Channel Management
```javascript
// List all channels
const channels = await slack.list_channels({
  types: "public_channel,private_channel"
});

// Create new channel
await slack.create_channel({
  name: "new-project",
  is_private: false
});

// Join channel
await slack.join_channel({
  channel: "#new-project"
});
```

### File Operations
```javascript
// Upload file
await slack.upload_file({
  channels: "#general",
  file: fileBuffer,
  filename: "report.pdf",
  title: "Monthly Report",
  initial_comment: "Here's the monthly report"
});

// Get file info
const fileInfo = await slack.get_file_info({
  file: "F1234567890"
});
```

### Search Operations
```javascript
// Search messages
const results = await slack.search_messages({
  query: "meeting notes",
  sort: "timestamp",
  sort_dir: "desc"
});

// Get channel history
const history = await slack.get_channel_history({
  channel: "#general",
  count: 100,
  latest: "1234567890.123456"
});
```

### Thread Management
```javascript
// Reply to thread
await slack.send_message({
  channel: "#general",
  text: "This is a reply",
  thread_ts: "1234567890.123456"
});

// Get thread replies
const replies = await slack.get_thread_replies({
  channel: "#general",
  ts: "1234567890.123456"
});
```

## Authentication

The Slack MCP server requires bot and app tokens:

### Creating a Slack App
1. Go to [Slack API Dashboard](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch"
4. Configure app settings

### Required Scopes
**Bot Token Scopes:**
- `channels:read` - View basic information about public channels
- `channels:write` - Manage public channels
- `chat:write` - Send messages
- `chat:write.public` - Send messages to channels without joining
- `files:read` - View files shared in channels
- `files:write` - Upload, edit, and delete files
- `groups:read` - View basic information about private channels
- `users:read` - View people in workspace

**App Token Scopes:**
- `connections:write` - Connect to Slack with Socket Mode

### Installation
1. Install app to workspace
2. Copy Bot User OAuth Token (starts with `xoxb-`)
3. Enable Socket Mode and copy App Token (starts with `xapp-`)

## Common Use Cases

1. **Team Notifications**: Send automated status updates
2. **File Sharing**: Upload and share documents
3. **Message Automation**: Respond to messages automatically
4. **Channel Management**: Create and manage channels
5. **Workflow Integration**: Connect Slack to other tools
6. **Search & Analytics**: Search messages and analyze data

## Error Handling

Common errors and solutions:
- **invalid_auth**: Check bot and app tokens
- **channel_not_found**: Verify channel exists and bot has access
- **not_in_channel**: Join channel before sending messages
- **rate_limited**: Implement rate limiting and retry logic
- **missing_scope**: Add required OAuth scopes

## Rate Limiting

Slack has rate limits for different API methods:
- **Tier 1**: 1+ per minute (posting messages)
- **Tier 2**: 20+ per minute (file uploads)
- **Tier 3**: 50+ per minute (reading data)
- **Tier 4**: 100+ per minute (basic info)

## Best Practices

1. **Token Security**: Store tokens securely
2. **Rate Limiting**: Respect API rate limits
3. **Error Handling**: Implement proper error handling
4. **Message Formatting**: Use Slack's message formatting
5. **Thread Management**: Use threads for conversations
6. **File Size Limits**: Respect file upload limits

## Related Resources

- [Slack API Documentation](https://api.slack.com/)
- [Slack MCP Server Repository](https://github.com/modelcontextprotocol/server-slack)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [Slack Block Kit](https://api.slack.com/block-kit)