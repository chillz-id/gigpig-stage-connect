# Setup Official MCP Servers

## ✅ MUCH BETTER Approach!

Instead of building custom MCP servers, we're now using **official MCP servers** from:
- **@supabase/mcp-server-supabase** (28+ tools!)
- **@modelcontextprotocol/server-github** 
- **@modelcontextprotocol/server-slack**
- **@modelcontextprotocol/server-filesystem**

## Current Status

### ✅ Configured Official Servers:
- **GitHub MCP**: ✅ Working with existing GitHub token
- **Slack MCP**: ✅ Working with existing Slack tokens  
- **Filesystem MCP**: ✅ Working (no auth needed)
- **Supabase MCP**: ⚠️ Needs Personal Access Token

### 🔧 Missing: Supabase Personal Access Token

**To Complete Setup:**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/account/tokens
2. **Create Personal Access Token**:
   - Name: "Claude Code MCP Server"
   - Scopes: Select appropriate permissions
3. **Add token to environment**:
   ```bash
   echo 'SUPABASE_ACCESS_TOKEN=your_token_here' >> /root/agents/.env
   ```
4. **Update .mcp.json** to use the token from environment

## Benefits of Official Servers:

### Supabase MCP (28+ tools instead of our 3):
- ✅ **Full database operations** 
- ✅ **Storage management**
- ✅ **Auth user management** 
- ✅ **Real-time subscriptions**
- ✅ **Edge functions**
- ✅ **Proper SQL execution**
- ✅ **Schema introspection**
- ✅ **Row Level Security support**

### GitHub MCP:
- ✅ **Repository management**
- ✅ **Issue tracking**
- ✅ **Pull request operations**
- ✅ **Commit history**
- ✅ **Branch management**

### Slack MCP:
- ✅ **Message sending**
- ✅ **Channel management** 
- ✅ **User operations**
- ✅ **File uploads**

## Why This is Better:

1. **Maintained by experts** - Not custom code we have to debug
2. **Regular updates** - Security patches and new features
3. **Full feature coverage** - All tools we need
4. **Standardized** - Same setup as your Claude Desktop
5. **Reliable** - Proven in production

## Next Steps:

1. Generate Supabase Personal Access Token
2. Test all official MCP servers  
3. Delete our custom FastMCP server
4. Use official tools for user cleanup
5. Test signup process with proper tooling