# GitHub MCP Server Documentation

## Overview

The GitHub MCP server provides AI assistants with tools to interact with GitHub repositories, issues, pull requests, and more through the Model Context Protocol.

**Official Repository**: [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

## Configuration

In `/root/agents/.mcp.json`:
```json
"github": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-github@latest"
  ],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "github_pat_..."
  }
}
```

## Available Tools

### Repository Management
- `create_repository`: Create a new GitHub repository
- `get_repository`: Get repository information
- `list_repositories`: List repositories for user/organization
- `update_repository`: Update repository settings
- `delete_repository`: Delete a repository
- `fork_repository`: Fork a repository
- `clone_repository`: Clone repository locally

### Issues & Pull Requests
- `create_issue`: Create a new issue
- `get_issue`: Get issue details
- `list_issues`: List repository issues
- `update_issue`: Update issue (title, body, labels, etc.)
- `close_issue`: Close an issue
- `create_pull_request`: Create a new PR
- `list_pull_requests`: List PRs for a repository
- `merge_pull_request`: Merge a pull request
- `review_pull_request`: Add review to PR

### File Operations
- `get_file_contents`: Read file from repository
- `create_or_update_file`: Create/update file with commit
- `delete_file`: Delete file with commit
- `list_files`: List files in directory
- `search_code`: Search code across repositories

### Branches & Tags
- `list_branches`: List repository branches
- `create_branch`: Create new branch
- `delete_branch`: Delete a branch
- `get_branch`: Get branch information
- `create_tag`: Create a new tag
- `list_tags`: List repository tags

### Workflows & Actions
- `list_workflows`: List GitHub Actions workflows
- `trigger_workflow`: Trigger workflow run
- `get_workflow_runs`: Get workflow run history
- `cancel_workflow_run`: Cancel running workflow

### Collaboration
- `add_collaborator`: Add repository collaborator
- `remove_collaborator`: Remove collaborator
- `list_collaborators`: List repository collaborators
- `create_comment`: Comment on issue/PR
- `list_comments`: List comments

### Search & Discovery
- `search_repositories`: Search GitHub repositories
- `search_issues`: Search issues/PRs
- `search_users`: Search GitHub users
- `get_user`: Get user information

## Usage Examples

### Repository Operations
```javascript
// Create a new repository
await github.create_repository({
  name: "my-new-repo",
  description: "A new repository",
  private: false,
  auto_init: true
});

// Get repository information
const repo = await github.get_repository({
  owner: "username",
  repo: "repository-name"
});
```

### Working with Issues
```javascript
// Create an issue
await github.create_issue({
  owner: "username",
  repo: "repository-name",
  title: "Bug: Something is broken",
  body: "Detailed description of the issue",
  labels: ["bug", "high-priority"]
});

// List open issues
const issues = await github.list_issues({
  owner: "username",
  repo: "repository-name",
  state: "open",
  labels: "bug"
});
```

### File Management
```javascript
// Read file contents
const file = await github.get_file_contents({
  owner: "username",
  repo: "repository-name",
  path: "README.md"
});

// Update a file
await github.create_or_update_file({
  owner: "username",
  repo: "repository-name",
  path: "docs/api.md",
  message: "Update API documentation",
  content: Buffer.from("# API Documentation\n...").toString('base64')
});
```

### Pull Request Workflow
```javascript
// Create a pull request
const pr = await github.create_pull_request({
  owner: "username",
  repo: "repository-name",
  title: "Feature: Add new functionality",
  head: "feature-branch",
  base: "main",
  body: "## Description\nThis PR adds..."
});

// Merge the PR
await github.merge_pull_request({
  owner: "username",
  repo: "repository-name",
  pull_number: pr.number,
  merge_method: "squash"
});
```

## Authentication

The GitHub MCP server requires a Personal Access Token (PAT) with appropriate permissions:

### Required Scopes
- `repo`: Full repository access
- `workflow`: GitHub Actions workflow access
- `write:org`: Organization access (if needed)
- `read:user`: Read user profile data

### Creating a PAT
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Select required scopes
4. Copy the token to your environment

## Rate Limiting

GitHub API has rate limits:
- **Authenticated**: 5,000 requests per hour
- **Search**: 30 requests per minute

The MCP server handles rate limiting automatically with retries.

## Common Use Cases

1. **Automated Issue Management**: Create, update, and close issues
2. **Code Review Automation**: Review PRs, add comments
3. **Repository Setup**: Create repos with standard configuration
4. **Documentation Updates**: Keep docs in sync
5. **Release Management**: Create tags and releases
6. **Workflow Automation**: Trigger CI/CD pipelines

## Error Handling

Common errors and solutions:
- **401 Unauthorized**: Check PAT is valid and has correct scopes
- **404 Not Found**: Verify repository/resource exists
- **403 Forbidden**: Ensure PAT has required permissions
- **422 Validation Failed**: Check request parameters

## Best Practices

1. **Use Fine-grained PATs**: Limit token scope to needed repositories
2. **Handle Rate Limits**: Implement exponential backoff
3. **Batch Operations**: Use GraphQL for multiple queries
4. **Cache Responses**: Reduce API calls for static data
5. **Error Recovery**: Implement proper error handling

## Related Resources

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [GitHub GraphQL API](https://docs.github.com/en/graphql)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [GitHub Apps vs OAuth Apps](https://docs.github.com/en/developers/apps)