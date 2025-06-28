#!/bin/bash
# Simple Claude Code wrapper script for Railway deployment

echo "🤖 Claude Code Integration"
echo "=========================="

if [ ! -z "${ANTHROPIC_API_KEY}" ]; then
    echo "✅ ANTHROPIC_API_KEY is configured"
    echo ""
    echo "💡 Claude Code is in research preview - use Claude Web for now:"
    echo "🔗 https://claude.ai"
    echo ""
    echo "📋 Your request: $*"
    echo ""
    echo "🎯 Available integrations in this environment:"
    echo "  - VS Code with your project files"
    echo "  - Supabase database access"
    echo "  - GitHub repository access"
    echo "  - Notion workspace (if configured)"
    echo ""
    echo "💬 Paste this context into Claude Web:"
    echo "---"
    echo "I'm working on the Stand Up Sydney project in VS Code on Railway."
    echo "Current directory: $(pwd)"
    echo "Request: $*"
    echo "---"
else
    echo "❌ ANTHROPIC_API_KEY not configured"
    echo "Add it to Railway environment variables to enable Claude Code"
fi
