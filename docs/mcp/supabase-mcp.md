# Supabase MCP Server Documentation

## Overview

The Supabase MCP (Model Context Protocol) server standardizes how Large Language Models (LLMs) interact with Supabase. It enables AI tools to perform tasks like launching databases, managing tables, fetching config, and querying data.

**Official Repository**: [github.com/supabase-community/supabase-mcp](https://github.com/supabase-community/supabase-mcp)

## Configuration

In `/root/agents/.mcp.json`:
```json
"supabase": {
  "command": "npx",
  "args": [
    "-y",
    "@supabase/mcp-server-supabase@latest",
    "--project-ref=pdikjpfulhhpqpxzpgtu"
  ],
  "env": {
    "SUPABASE_ACCESS_TOKEN": "sbp_YOUR_SUPABASE_ACCESS_TOKEN_HERE_GET_FROM_OWNER"
  }
}
```

## Available Tools (28+)

### Account Management Tools
- `list_projects`: Lists all Supabase projects for the user
- `confirm_cost`: Confirms understanding of new project/branch costs

### Database Tools
- `list_tables`: Lists all tables within specified schemas
- `list_extensions`: Lists all extensions in the database
- `list_migrations`: Lists all migrations in the database
- `apply_migration`: Applies SQL migration (tracked in database)
- `execute_sql`: Executes SQL queries
- `list_schemas`: Lists all schemas in the database
- `list_columns`: Lists columns for a specific table
- `list_indexes`: Lists indexes in the database
- `list_constraints`: Lists database constraints
- `list_functions`: Lists database functions
- `list_views`: Lists database views
- `list_types`: Lists custom types

### Storage Tools
- `list_storage_buckets`: Lists storage buckets
- `list_storage_objects`: Lists objects in a bucket
- `upload_storage_object`: Uploads object to storage
- `download_storage_object`: Downloads object from storage
- `delete_storage_object`: Deletes storage object

### Auth & User Management
- `list_auth_users`: Lists authenticated users
- `get_auth_user`: Gets specific user details
- `update_auth_user`: Updates user information
- `delete_auth_user`: Deletes a user

### Configuration & Monitoring
- `get_project_settings`: Gets project configuration
- `get_project_status`: Gets project status
- `search_docs`: Searches Supabase documentation

### API & Type Generation
- `generate_types`: Generates TypeScript types from database schema
- `get_api_url`: Gets project API URL
- `get_api_keys`: Gets project API keys

## Usage Examples

### Query Database
```javascript
// List all tables
const tables = await supabase.list_tables({
  schemas: ['public']
});

// Execute SQL query
const result = await supabase.execute_sql({
  query: "SELECT * FROM profiles WHERE role = 'comedian' LIMIT 10"
});
```

### Manage Storage
```javascript
// List storage buckets
const buckets = await supabase.list_storage_buckets();

// Upload file
await supabase.upload_storage_object({
  bucket: 'profile-images',
  path: 'comedian-123.jpg',
  content: fileContent
});
```

### Search Documentation
```javascript
// Search for information
const docs = await supabase.search_docs({
  query: "row level security policies"
});
```

## Configuration Options

### Read-Only Mode
Add `--read-only` flag to prevent write operations:
```json
"args": [
  "-y",
  "@supabase/mcp-server-supabase@latest",
  "--read-only",
  "--project-ref=pdikjpfulhhpqpxzpgtu"
]
```

### Feature Selection
Enable specific tool groups with `--features`:
```json
"args": [
  "-y",
  "@supabase/mcp-server-supabase@latest",
  "--features=database,storage,auth",
  "--project-ref=pdikjpfulhhpqpxzpgtu"
]
```

## Security Considerations

1. **Access Token**: Store securely in environment variables
2. **Read-Only Mode**: Enable by default for safety
3. **Project Scoping**: Always use `--project-ref` to limit access
4. **Row Level Security**: Respect RLS policies in queries

## Common Use Cases

1. **Database Inspection**: List tables, columns, and constraints
2. **Data Queries**: Execute SQL queries for analysis
3. **Type Generation**: Generate TypeScript types from schema
4. **Storage Management**: Upload and manage files
5. **Documentation Search**: Find Supabase best practices

## Troubleshooting

- **Authentication Error**: Check SUPABASE_ACCESS_TOKEN is valid
- **Permission Denied**: Ensure token has required permissions
- **Project Not Found**: Verify project-ref is correct
- **SQL Errors**: Check query syntax and table existence

## Related Resources

- [Supabase MCP Documentation](https://supabase.com/docs/guides/getting-started/mcp)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)