# N8N Integration Learnings & Solutions

## Key Issues Discovered and Resolved

### 1. N8N Variable References Error
**Issue**: Workflow was using `{{ $vars.HUMANITIX_API_KEY }}` which requires an N8N Enterprise license.
**Solution**: Use N8N's built-in credentials system instead of variable references.

### 2. Humanitix API Authentication
**Issue**: Initial attempts used `Authorization: Bearer` header pattern.
**Solution**: Humanitix requires lowercase `x-api-key` header.

### 3. API Query Parameters
**Issue**: Documentation suggested using `limit` parameter.
**Solution**: Humanitix API actually uses `page` parameter for pagination.

### 4. N8N API Limitations
**Issue**: Attempted to update workflow via API but encountered restrictions:
- PATCH method not supported
- PUT method has restricted fields
- `active` field is read-only
**Solution**: Configure credentials in N8N UI, then update workflow nodes programmatically.

## Final Working Configuration

### Workflow Setup
1. **Workflow ID**: GIKrozPgzkjMBbhn
2. **Schedule**: Every 15 minutes
3. **Status**: Active with configured credentials

### Credentials Configuration
1. **Humanitix API** (Header Auth type)
   - Header Name: `x-api-key`
   - Header Value: [API key from .env]

2. **Notion API**
   - Integration Token: [Token from .env]
   - Database ID: 2304745b-8cbe-81cd-9483-d7acc2377bd6

3. **Slack** (optional)
   - Bot Token: [Token configured]

### Node Configuration
For HTTP Request nodes:
```json
{
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "humanitixApi"
}
```

For Notion nodes:
```json
{
  "authentication": "notionApi",
  "databaseId": "2304745b-8cbe-81cd-9483-d7acc2377bd6"
}
```

## Best Practices Learned

1. **Always use N8N credentials** instead of trying to reference environment variables
2. **Test API connections separately** before building workflows
3. **Check actual API documentation** rather than relying on assumptions
4. **N8N Community Edition limitations**: `$vars` requires license, use credentials or `$workflow.staticData`

## Next Steps

1. Monitor the scheduled executions (every 15 minutes)
2. Investigate why Humanitix API returns 0 events:
   - Check if API key is for production or sandbox
   - Verify event query parameters
   - Ensure events exist in the account

## Files Created During Implementation

- `/root/agents/docs/HUMANITIX_NOTION_INTEGRATION.md` - Complete integration guide
- `/root/agents/docs/n8n-workflows/humanitix-notion-sync.json` - Main workflow
- `/root/agents/scripts/test-humanitix-notion.cjs` - API testing script
- `/opt/standup-sydney-mcp/update_workflow_credentials.py` - Workflow update script
- `/opt/standup-sydney-mcp/test_workflow_manual.py` - Execution status checker

## Summary

Successfully configured N8N workflow to sync Humanitix ticket sales to Notion database. The key breakthrough was understanding that N8N's variable system requires a license, and the proper approach is to use N8N's built-in credentials management system. The workflow is now active and scheduled to run every 15 minutes.