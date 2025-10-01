# WIX MCP Server Documentation

## Overview
The WIX MCP (Model Context Protocol) server enables AI agents to interact with WIX websites and APIs. It provides access to WIX documentation, code generation capabilities, and API functionality for WIX sites.

## Configuration

### Current Configuration
Location: `/root/agents/.mcp.json`

```json
{
  "wix": {
    "type": "http",
    "url": "https://mcp.wix.com/mcp",
    "apiKey": "${WIX_API_KEY}",
    "accountId": "${WIX_ACCOUNT_ID}"
  }
}
```

### Environment Variables
- `WIX_API_KEY`: IST (Instance Session Token) from WIX
- `WIX_ACCOUNT_ID`: WIX Account ID
- `WIX_SITE_ID`: WIX Site ID (optional)
- `WIX_CLIENT_ID`: WIX Client ID (optional)

## Authentication

### Token Format
WIX uses IST (Instance Session Token) format:
- Format: `IST.{jwt-token}`
- Contains application identity and tenant information
- JWT payload includes account ID and application details

### Current Status ⚠️
**Issue**: Token Expired
- Current token issued: June 21, 2025
- Token age: ~2256 hours (94 days)
- Status: Likely expired - WIX tokens typically have shorter lifespans

### Token Analysis
```json
{
  "data": {
    "id": "0c30810a-9f9a-437c-8806-4e54d5b5d3ec",
    "identity": {
      "type": "application",
      "id": "20d78794-a492-4550-9e92-74c9deac4000"
    },
    "tenant": {
      "type": "account",
      "id": "f49451e5-90c1-4451-8763-318a92308c0c"
    }
  },
  "iat": 1750491655
}
```

## Capabilities

Based on WIX MCP documentation, the server provides:
- **Documentation Search**: Access to WIX development documentation
- **Code Generation**: Generate WIX platform code
- **API Calls**: Make authenticated API calls to WIX sites
- **Site Management**: Interact with WIX websites and applications

## Endpoints

### Main MCP Endpoint
- **URL**: `https://mcp.wix.com/mcp`
- **Type**: HTTP
- **Authentication**: API Key + Account ID

### Alternative Endpoints
- **SSE**: `https://mcp.wix.com/sse` (Server-Sent Events)

## Troubleshooting

### Authentication Errors
Current error: `{"error":"invalid_token","error_description":"Missing or invalid access token"}`

**Possible Causes**:
1. Token expiration (most likely - token is 94 days old)
2. Invalid token format
3. Incorrect API endpoint usage

**Solutions**:
1. **Refresh Token**: Generate a new IST token from WIX dashboard
2. **Check Token Format**: Ensure IST.{jwt} format is correct
3. **Verify Account ID**: Ensure account ID matches token tenant

### Token Refresh Process
1. Log into WIX account
2. Navigate to API Keys Manager: https://manage.wix.com/account/api-keys
3. Generate new API key
4. Update `WIX_API_KEY` in `/etc/standup-sydney/credentials.env`
5. Run `/root/sync-all-credentials.sh` to sync to all locations

## Next Steps

1. **Immediate**: Generate new WIX API key to replace expired token
2. **Test Connection**: Verify MCP server connectivity after token refresh
3. **Document Tools**: Map available WIX MCP tools once connected
4. **Integration**: Test WIX functionality with Stand Up Sydney platform

## References

- [Official WIX MCP Documentation](https://dev.wix.com/docs/sdk/articles/use-the-wix-mcp/about-the-wix-mcp)
- [WIX API Keys Manager](https://manage.wix.com/account/api-keys)
- [WIX Developer Documentation](https://dev.wix.com/docs/rest)

## Configuration History

- **September 23, 2025**: Fixed MCP configuration format from headers to apiKey/accountId fields
- **Previous**: Initial configuration with header-based authentication (incorrect)

---
*Last Updated: September 23, 2025*
*Status: Configuration complete, awaiting token refresh*