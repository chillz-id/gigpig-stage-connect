# 🚂 Railway Cloud Development Environment Setup

## Prerequisites
- Railway account (free tier works)
- GitHub repository access
- API keys for your services

## Step 1: Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
```

## Step 2: Add Files to Repository

Create these files in a new `cloud-dev/` folder in your repo:

```
gigpig-stage-connect/
├── cloud-dev/
│   ├── Dockerfile
│   ├── start.sh
│   ├── mcp-config.json
│   └── railway.toml
```

## Step 3: Set Environment Variables

In Railway dashboard, add these variables:

### Required Variables:
```env
VITE_SUPABASE_URL=https://pdikjpfulhhpqpxzpgtu.supabase.co
VITE_SUPABASE_ANON_KEY=[your-supabase-anon-key]
GITHUB_TOKEN=[your-github-personal-access-token]
PASSWORD=[secure-password-for-vscode]
```

### Optional Variables:
```env
NOTION_TOKEN=[your-notion-integration-token]
METRICOOL_API_KEY=[your-metricool-api-key]
VITE_GTM_ID=[your-google-tag-manager-id]
```

## Step 4: Deploy to Railway

```bash
# Deploy from cloud-dev directory
cd cloud-dev
railway up
```

## Step 5: Access Your Environment

After deployment, Railway will give you URLs like:
- **VSCode Interface**: `https://your-app.up.railway.app:8080`
- **Stand Up Sydney Dev**: `https://your-app.up.railway.app:3000`
- **MCP Gateway**: `https://your-app.up.railway.app:8000`

## Step 6: Connect Claude Desktop

In Claude Desktop MCP settings, add:
```json
{
  "mcpServers": {
    "railway-dev": {
      "command": "railway-mcp-client",
      "args": ["--gateway", "https://your-app.up.railway.app:8000"]
    }
  }
}
```

## Benefits of This Setup

✅ **No Local Installation**: Everything runs in the cloud
✅ **Full Development Environment**: VSCode + dev server + MCP
✅ **Always Available**: Access from any device with internet
✅ **Synced with GitHub**: Changes auto-sync to your repo
✅ **All Your Tools**: GitHub, Supabase, Notion, Metricool access
✅ **Claude Integration**: Direct MCP connection to your project

## Troubleshooting

- **Container won't start**: Check Railway logs for errors
- **Can't access VSCode**: Verify PASSWORD environment variable
- **MCP not working**: Check that all API keys are set correctly
- **Dev server fails**: Ensure Supabase credentials are correct