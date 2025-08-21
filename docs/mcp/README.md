# MCP (Model Context Protocol) Documentation

This directory contains comprehensive documentation for all MCP servers configured in the Stand Up Sydney platform.

## Configuration Location

All MCP servers are configured in `/root/agents/.mcp.json`

## Available MCP Servers

### Core Services

1. **[Supabase MCP](./supabase-mcp.md)** - Database operations, authentication, and storage
   - 28+ tools for complete Supabase integration
   - Project-scoped for security

2. **[GitHub MCP](./github-mcp.md)** - Repository and code management
   - Full GitHub API integration
   - Automated deployments to Vercel

3. **[Notion MCP](./notion-mcp.md)** - Documentation and knowledge base
   - Page creation and management
   - Database operations
   - Search functionality

4. **[Slack MCP](./slack-mcp.md)** - Team communication
   - Channel management
   - Message posting
   - User interactions

### Analytics & Marketing

5. **[Metricool MCP](./metricool-mcp.md)** - Social media analytics
   - Instagram insights
   - Facebook analytics
   - Content performance tracking

6. **[Apify MCP](./apify-mcp.md)** - Web scraping and automation
   - Actor management
   - Data extraction
   - Social media scraping

### Business Tools

7. **[Xero MCP](./xero-mcp.md)** - Accounting integration
   - Invoice management
   - Contact synchronization
   - Financial reporting

8. **[Canva MCP](./canva-mcp.md)** - Design automation
   - Template management
   - Design generation
   - Asset management

### Development Tools

9. **[Puppeteer MCP](./puppeteer-mcp.md)** - Browser automation
   - Web scraping
   - Screenshot generation
   - E2E testing

10. **[Filesystem MCP](./filesystem-mcp.md)** - File operations
    - Read/write files
    - Directory management
    - File search

11. **[Context7 MCP](./context7-mcp.md)** - Documentation context
    - Up-to-date docs retrieval
    - Version-specific examples
    - Library documentation

12. **[N8N MCP](./n8n-mcp.md)** - Workflow automation
    - Workflow management
    - Execution monitoring
    - Integration automation

### Search & Discovery

13. **[Brave Search MCP](./brave-search-mcp.md)** - Web search
    - Real-time search results
    - News and information
    - Research capabilities

### Design System

14. **[Magic UI MCP](./magicui-mcp.md)** - UI components
    - Component library
    - Design patterns
    - UI generation

## Quick Start

### Using an MCP Tool

Most MCP tools are available with the prefix `mcp__[server-name]__[tool-name]`. For example:

```javascript
// Supabase query
await mcp__supabase__execute_sql({
  query: "SELECT * FROM profiles WHERE role = 'comedian'"
});

// GitHub issue creation
await mcp__github__create_issue({
  owner: "standupsydney",
  repo: "platform",
  title: "New feature request",
  body: "Description here"
});
```

**Context7 Exception**: Context7 MCP tools use direct names:
```javascript
// Context7 library resolution
await resolve-library-id({
  libraryName: "react"
});

// Context7 documentation retrieval
await get-library-docs({
  context7CompatibleLibraryID: "/vercel/next.js",
  topic: "routing"
});
```

### Adding a New MCP Server

1. Edit `/root/agents/.mcp.json`
2. Add the server configuration:
```json
"new-server": {
  "command": "npx",
  "args": ["-y", "@provider/mcp-server@latest"],
  "env": {
    "API_KEY": "your-api-key"
  }
}
```
3. Restart Claude Code to load the new server

## Security Best Practices

1. **API Keys**: Store in environment variables
2. **Scoping**: Use project-specific access when possible
3. **Read-Only**: Enable read-only mode for safety
4. **Permissions**: Grant minimum required permissions

## Troubleshooting

### MCP Tool Not Found
- Check server is configured in `.mcp.json`
- Verify server name matches exactly
- Restart Claude Code if recently added

### Authentication Errors
- Verify API keys are correct
- Check token permissions
- Ensure environment variables are set

### Connection Issues
- Check network connectivity
- Verify server URLs
- Review error logs

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [MCP Server Registry](https://github.com/punkpeye/awesome-mcp-servers)
- [Stand Up Sydney MCP Configuration](/root/agents/.mcp.json)

## Contributing

To add documentation for a new MCP server:
1. Create a new markdown file: `[server-name]-mcp.md`
2. Follow the existing documentation format
3. Include configuration, tools, and examples
4. Update this README with the new server