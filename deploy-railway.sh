#!/bin/bash
# Railway Multi-Service Deployment Script

echo "🚀 Deploying GigPig Stage Connect to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    curl -fsSL https://railway.app/install.sh | sh
    export PATH="$PATH:/home/$USER/.railway/bin"
fi

# Login check
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

# Deploy dev-preview service (your website)
echo "📦 Deploying dev-preview service..."
railway service:create dev-preview
railway link
railway deploy --service dev-preview

# Deploy CDE service
echo "🖥️ Deploying Claude CDE service..."
railway service:create claude-cde
railway deploy --service claude-cde --dockerfile cloud-dev/Dockerfile

# Deploy MCP hosting service
echo "🔌 Deploying MCP hosting service..."
railway service:create mcp-host
railway deploy --service mcp-host --dockerfile cloud-dev/Dockerfile.mcp

# Set environment variables
echo "⚙️ Setting environment variables..."
railway variables:set GITHUB_TOKEN=your_github_token_here --service claude-cde
railway variables:set ANTHROPIC_API_KEY=your_anthropic_key_here --service claude-cde
railway variables:set SUPABASE_TOKEN=sbp_YOUR_SUPABASE_ACCESS_TOKEN_HERE_GET_FROM_OWNER --service claude-cde
railway variables:set SUPABASE_TOKEN=sbp_YOUR_SUPABASE_ACCESS_TOKEN_HERE_GET_FROM_OWNER --service mcp-host

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your services will be available at:"
echo "  • Website: https://dev-preview.railway.app"
echo "  • CDE: https://claude-cde.railway.app (password: standupdev2025)"
echo "  • MCPs: https://mcp-host.railway.app"
echo ""
echo "🔧 Next steps:"
echo "  1. Set your actual GitHub token and API keys in Railway dashboard"
echo "  2. Connect your custom domain if needed"
echo "  3. Configure any additional environment variables"