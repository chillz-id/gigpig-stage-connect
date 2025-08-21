# Notion MCP Server Documentation

## Overview

The Notion MCP server provides integration with Notion's API through the Model Context Protocol, enabling AI assistants to interact with Notion pages, databases, and content.

**Official Repository**: [github.com/notionhq/notion-mcp-server](https://github.com/notionhq/notion-mcp-server)

## Configuration

In `/root/agents/.mcp.json`:
```json
"notion": {
  "command": "npx",
  "args": [
    "-y",
    "@notionhq/notion-mcp-server@latest"
  ],
  "env": {
    "NOTION_TOKEN": "ntn_YOUR_NOTION_API_KEY_HERE_CONTACT_OWNER"
  }
}
```

## Available Tools

### Page Management
- `create_page`: Create a new Notion page
- `get_page`: Retrieve page details and content
- `update_page`: Update existing page properties
- `delete_page`: Delete a page (move to trash)
- `list_pages`: List pages in workspace or database

### Database Operations
- `create_database`: Create a new database
- `get_database`: Retrieve database schema and properties
- `query_database`: Query database with filters and sorting
- `update_database`: Update database properties
- `create_database_item`: Add new item to database
- `update_database_item`: Update existing database item

### Content Management
- `append_block`: Add content blocks to pages
- `get_block`: Retrieve block content and children
- `update_block`: Modify existing blocks
- `delete_block`: Remove blocks from pages
- `list_block_children`: Get child blocks

### Search & Discovery
- `search`: Search across pages and databases
- `get_user`: Get user information
- `list_users`: List workspace users

## Usage Examples

### Page Operations
```javascript
// Create a new page
await notion.create_page({
  parent: { database_id: "database-id" },
  properties: {
    "Name": {
      "title": [
        {
          "text": {
            "content": "New Page Title"
          }
        }
      ]
    }
  }
});

// Get page content
const page = await notion.get_page({
  page_id: "page-id"
});
```

### Database Operations
```javascript
// Query database
const results = await notion.query_database({
  database_id: "database-id",
  filter: {
    property: "Status",
    select: {
      equals: "Published"
    }
  },
  sorts: [
    {
      property: "Created",
      direction: "descending"
    }
  ]
});

// Create database item
await notion.create_database_item({
  parent: { database_id: "database-id" },
  properties: {
    "Title": {
      "title": [
        {
          "text": {
            "content": "New Item"
          }
        }
      ]
    },
    "Status": {
      "select": {
        "name": "In Progress"
      }
    }
  }
});
```

### Content Management
```javascript
// Append content to page
await notion.append_block({
  block_id: "page-id",
  children: [
    {
      "object": "block",
      "type": "paragraph",
      "paragraph": {
        "rich_text": [
          {
            "type": "text",
            "text": {
              "content": "This is a new paragraph."
            }
          }
        ]
      }
    }
  ]
});
```

### Search Operations
```javascript
// Search workspace
const searchResults = await notion.search({
  query: "meeting notes",
  filter: {
    value: "page",
    property: "object"
  }
});
```

## Authentication

The Notion MCP server requires a Notion Integration Token:

### Creating an Integration
1. Go to [Notion Developer Portal](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Configure integration settings
4. Copy the Internal Integration Token
5. Grant the integration access to your pages/databases

### Required Permissions
- Read content
- Update content
- Insert content
- Comment (if needed)

## Common Use Cases

1. **Documentation Management**: Create and update documentation pages
2. **Task Management**: Manage tasks in Notion databases
3. **Knowledge Base**: Search and retrieve information
4. **Content Creation**: Generate and append content to pages
5. **Database Operations**: Query and manipulate structured data
6. **Team Collaboration**: Access shared workspaces and databases

## Error Handling

Common errors and solutions:
- **401 Unauthorized**: Check integration token is valid
- **403 Forbidden**: Ensure integration has access to the resource
- **404 Not Found**: Verify page/database ID is correct
- **400 Bad Request**: Check request parameters and format

## Best Practices

1. **Token Security**: Store integration token securely
2. **Rate Limiting**: Respect Notion's API rate limits
3. **Error Handling**: Implement proper error handling
4. **Batch Operations**: Use efficient querying for large datasets
5. **Schema Validation**: Validate database schemas before operations

## Related Resources

- [Notion API Documentation](https://developers.notion.com)
- [Notion MCP Server Repository](https://github.com/notionhq/notion-mcp-server)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)