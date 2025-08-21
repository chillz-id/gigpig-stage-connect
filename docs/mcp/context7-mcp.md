# Context7 MCP Server Documentation

## Overview

The Context7 MCP server provides up-to-date documentation and code examples for libraries and frameworks through the Model Context Protocol, enabling AI assistants to access current documentation for better code generation.

**Official Repository**: [github.com/upstash/context7](https://github.com/upstash/context7)

## Configuration

In `/root/agents/.mcp.json`:
```json
"context7": {
  "command": "npx",
  "args": [
    "-y",
    "@upstash/context7-mcp"
  ]
}
```

## Available Tools

### Library Resolution
- `resolve-library-id`: Resolves a general library name into a Context7-compatible library ID
- `get-library-docs`: Fetches documentation for a library using a Context7-compatible library ID

## Tool Details

### resolve-library-id
```javascript
{
  "libraryName": "string (required)" // The name of the library to search for
}
```

### get-library-docs
```javascript
{
  "context7CompatibleLibraryID": "string (required)", // Exact Context7-compatible library ID
  "topic": "string (optional)", // Focus docs on specific topic
  "tokens": "number (optional, default: 10000)" // Max tokens to return
}
```

## Usage Examples

### Basic Library Documentation
```javascript
// First, resolve the library name to get the Context7 ID
const libraryId = await resolve-library-id({
  libraryName: "react"
});

// Then fetch the documentation
const docs = await get-library-docs({
  context7CompatibleLibraryID: libraryId.id,
  topic: "hooks",
  tokens: 15000
});
```

### Specific Library Examples
```javascript
// Supabase documentation
const supabaseDocs = await get-library-docs({
  context7CompatibleLibraryID: "/supabase/supabase",
  topic: "authentication"
});

// Next.js documentation
const nextDocs = await get-library-docs({
  context7CompatibleLibraryID: "/vercel/next.js",
  topic: "routing"
});

// MongoDB documentation
const mongoDocs = await get-library-docs({
  context7CompatibleLibraryID: "/mongodb/docs",
  topic: "queries"
});
```

### Direct Library ID Usage
You can also use direct library IDs in prompts:
```
Create a Next.js middleware that handles authentication. use library /vercel/next.js for api and docs
```

## Supported Libraries

Context7 supports thousands of libraries including:

### Popular Frameworks
- `/vercel/next.js` - Next.js framework
- `/facebook/react` - React library
- `/vuejs/vue` - Vue.js framework
- `/angular/angular` - Angular framework
- `/sveltejs/svelte` - Svelte framework

### Databases
- `/supabase/supabase` - Supabase
- `/mongodb/docs` - MongoDB
- `/prisma/prisma` - Prisma ORM
- `/firebase/firebase-js-sdk` - Firebase

### Backend Libraries
- `/expressjs/express` - Express.js
- `/nestjs/nest` - NestJS
- `/fastify/fastify` - Fastify
- `/koajs/koa` - Koa.js

### Utility Libraries
- `/lodash/lodash` - Lodash
- `/moment/moment` - Moment.js
- `/axios/axios` - Axios
- `/date-fns/date-fns` - Date-fns

## Configuration Options

### Local Development
```json
{
  "command": "npx",
  "args": ["tsx", "/path/to/context7-mcp/src/index.ts"]
}
```

### With Node Options
```json
{
  "command": "npx",
  "args": [
    "-y",
    "--node-options=--experimental-fetch",
    "@upstash/context7-mcp"
  ]
}
```

### Remote Connection
```json
{
  "url": "https://mcp.context7.com/mcp"
}
```

## Best Practices

### Library Name Resolution
1. Use specific library names for better results
2. Include version numbers when needed
3. Try alternative names if first attempt fails

### Documentation Retrieval
1. Use specific topics to get focused documentation
2. Adjust token limits based on needs
3. Cache results for frequently accessed docs

### Error Handling
1. Handle cases where libraries aren't found
2. Implement fallback for unavailable documentation
3. Validate library IDs before use

## Common Use Cases

1. **Code Generation**: Get up-to-date API documentation
2. **Learning**: Access current best practices
3. **Troubleshooting**: Find solutions for specific issues
4. **Migration**: Get migration guides between versions
5. **Integration**: Learn how to integrate libraries
6. **Configuration**: Get configuration examples

## Troubleshooting

### Common Issues
- **Library Not Found**: Try alternative names or check Context7 registry
- **Documentation Empty**: Library may not be indexed yet
- **Token Limits**: Increase token limit or use more specific topics
- **Connection Issues**: Check network and MCP configuration

### ESM Resolution Issues
```json
{
  "command": "npx",
  "args": [
    "-y",
    "--node-options=--experimental-vm-modules",
    "@upstash/context7-mcp@1.0.6"
  ]
}
```

### Module Not Found Errors
```json
{
  "command": "bunx",
  "args": ["-y", "@upstash/context7-mcp"]
}
```

## Integration Examples

### With Code Generation
```javascript
// Get React documentation for hooks
const reactDocs = await get-library-docs({
  context7CompatibleLibraryID: "/facebook/react",
  topic: "useEffect",
  tokens: 5000
});

// Use the documentation to generate code
// The AI can now generate up-to-date React code
```

### With Multi-Library Projects
```javascript
// Get documentation for multiple libraries
const nextDocs = await get-library-docs({
  context7CompatibleLibraryID: "/vercel/next.js",
  topic: "api-routes"
});

const supabaseDocs = await get-library-docs({
  context7CompatibleLibraryID: "/supabase/supabase",
  topic: "client-auth"
});

// Generate code that uses both libraries correctly
```

## Related Resources

- [Context7 Documentation](https://context7.com)
- [Context7 MCP Repository](https://github.com/upstash/context7)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [Upstash Documentation](https://upstash.com/docs)