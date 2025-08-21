# Filesystem MCP Server Documentation

## Overview

The Filesystem MCP server provides file system operations through the Model Context Protocol, enabling AI assistants to read, write, and manage files and directories safely within specified boundaries.

**Official Repository**: [github.com/modelcontextprotocol/server-filesystem](https://github.com/modelcontextprotocol/server-filesystem)

## Configuration

In `/root/agents/.mcp.json`:
```json
"filesystem": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem@latest",
    "/root/agents"
  ]
}
```

## Available Tools

### File Operations
- `read_file`: Read file contents
- `write_file`: Write content to file
- `create_file`: Create new file
- `delete_file`: Delete file
- `copy_file`: Copy file to new location
- `move_file`: Move/rename file
- `get_file_info`: Get file metadata

### Directory Operations
- `list_directory`: List directory contents
- `create_directory`: Create new directory
- `delete_directory`: Delete directory
- `copy_directory`: Copy directory recursively
- `move_directory`: Move/rename directory
- `get_directory_info`: Get directory metadata

### Path Operations
- `resolve_path`: Resolve relative paths
- `get_absolute_path`: Get absolute path
- `check_path_exists`: Check if path exists
- `get_path_type`: Check if path is file or directory

### Search Operations
- `find_files`: Find files by pattern
- `search_in_files`: Search text within files
- `list_files_recursive`: List files recursively
- `filter_files`: Filter files by criteria

### Permission Management
- `get_permissions`: Get file/directory permissions
- `set_permissions`: Set file/directory permissions
- `check_access`: Check read/write access

## Usage Examples

### File Operations
```javascript
// Read file
const content = await filesystem.read_file({
  path: "/root/agents/src/App.tsx"
});

// Write file
await filesystem.write_file({
  path: "/root/agents/temp/output.txt",
  content: "Hello, World!",
  encoding: "utf8"
});

// Get file info
const info = await filesystem.get_file_info({
  path: "/root/agents/package.json"
});
```

### Directory Operations
```javascript
// List directory
const files = await filesystem.list_directory({
  path: "/root/agents/src",
  show_hidden: false
});

// Create directory
await filesystem.create_directory({
  path: "/root/agents/new-folder",
  recursive: true
});

// Delete directory
await filesystem.delete_directory({
  path: "/root/agents/temp",
  recursive: true
});
```

### Search Operations
```javascript
// Find files by pattern
const jsFiles = await filesystem.find_files({
  path: "/root/agents/src",
  pattern: "*.js",
  recursive: true
});

// Search in files
const results = await filesystem.search_in_files({
  path: "/root/agents/src",
  query: "useState",
  file_pattern: "*.tsx",
  recursive: true
});
```

### Path Operations
```javascript
// Check if path exists
const exists = await filesystem.check_path_exists({
  path: "/root/agents/src/App.tsx"
});

// Get path type
const pathType = await filesystem.get_path_type({
  path: "/root/agents/src"
});

// Resolve relative path
const absolutePath = await filesystem.resolve_path({
  path: "../package.json",
  base_path: "/root/agents/src"
});
```

## Security Features

### Path Sandboxing
- All operations are restricted to specified root directory
- Path traversal attacks (../) are prevented
- Symlink following is controlled

### Permission Checking
- Read/write permissions are validated
- File system access is logged
- Dangerous operations require explicit confirmation

### File Type Validation
- Binary file detection and handling
- File size limits can be enforced
- Dangerous file extensions can be blocked

## Configuration Options

### Root Directory
```json
{
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem@latest",
    "/safe/directory"
  ]
}
```

### Advanced Options
```json
{
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem@latest",
    "/root/agents",
    "--read-only",
    "--max-file-size=10MB",
    "--exclude=node_modules,*.log"
  ]
}
```

## Common Use Cases

1. **Code Management**: Read and write source code files
2. **Configuration Files**: Manage application configurations
3. **Log Analysis**: Read and analyze log files
4. **Data Processing**: Process data files
5. **Documentation**: Create and update documentation
6. **Build Artifacts**: Manage build outputs
7. **File Organization**: Organize and clean up files

## File Encoding Support

### Text Encodings
- **UTF-8**: Default encoding for text files
- **UTF-16**: Unicode encoding
- **ASCII**: Basic ASCII encoding
- **Latin-1**: ISO-8859-1 encoding

### Binary Files
- **Base64**: Encode binary data as base64
- **Hex**: Hexadecimal representation
- **Raw**: Raw binary data (limited support)

## Error Handling

Common errors and solutions:
- **ENOENT**: File or directory not found
- **EACCES**: Permission denied
- **EISDIR**: Path is a directory, not a file
- **ENOTDIR**: Path is not a directory
- **EEXIST**: File or directory already exists
- **EMFILE**: Too many open files

## Performance Considerations

### Large Files
- Stream reading for large files
- Chunked processing
- Memory usage monitoring

### Bulk Operations
- Batch file operations
- Recursive operations optimization
- Concurrent operation limits

## Best Practices

1. **Path Validation**: Always validate paths before operations
2. **Error Handling**: Implement comprehensive error handling
3. **Permission Checks**: Verify permissions before operations
4. **Resource Management**: Close file handles properly
5. **Backup Strategy**: Backup important files before modifications
6. **Logging**: Log file operations for debugging

## Supported File Types

### Text Files
- Source code (js, ts, py, etc.)
- Configuration files (json, yaml, xml)
- Documentation (md, txt, rst)
- Web files (html, css, svg)

### Binary Files
- Images (limited support)
- Archives (with appropriate tools)
- Executables (read-only)

## Security Warnings

⚠️ **Important Security Notes:**
- Never allow filesystem access outside intended directories
- Validate all file paths and names
- Be cautious with executable files
- Implement proper access controls
- Monitor file system operations

## Related Resources

- [Filesystem MCP Server Repository](https://github.com/modelcontextprotocol/server-filesystem)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [Node.js File System Documentation](https://nodejs.org/api/fs.html)