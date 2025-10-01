#!/bin/bash

# Setup Script for Comprehensive Problem & Solution Tracking System
# Initializes all components and ensures proper integration

echo "🚀 Setting up Comprehensive Problem & Solution Tracking System..."

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p /root/agents/knowledge-graph-entries
mkdir -p /root/agents/knowledge-graph-cross-references
mkdir -p /root/agents/unified-problem-registry
mkdir -p /root/agents/compliance-tracking/sessions
mkdir -p /root/agents/compliance-tracking/violations
mkdir -p /root/agents/compliance-tracking/reports
mkdir -p /root/agents/duplicate-detection
mkdir -p /root/agents/comprehensive-tracking
mkdir -p /root/agents/webhook-logs

# Set executable permissions
echo "🔧 Setting permissions..."
chmod +x /root/.claude-multi-agent/scripts/enhanced-claude-graph-integration.js
chmod +x /root/agents/linear-webhook-handler.js
chmod +x /root/agents/unified-problem-registry.js
chmod +x /root/.claude-multi-agent/scripts/compliance-checker.js
chmod +x /root/agents/duplicate-detection-system.js
chmod +x /root/agents/comprehensive-tracking-system.js

# Initialize databases and configurations
echo "💾 Initializing system databases..."
node /root/.claude-multi-agent/scripts/enhanced-claude-graph-integration.js log-issue "System Initialization" "Comprehensive tracking system setup" "low" > /dev/null 2>&1
node /root/agents/unified-problem-registry.js build > /dev/null 2>&1
node /root/.claude-multi-agent/scripts/compliance-checker.js record-interaction "system_setup" "System initialization" > /dev/null 2>&1
node /root/agents/comprehensive-tracking-system.js status > /dev/null 2>&1

# Create helper aliases
echo "🔗 Creating helper commands..."
cat > /root/agents/kg-check << 'EOF'
#!/bin/bash
node /root/.claude-multi-agent/scripts/enhanced-claude-graph-integration.js check "$1"
EOF

cat > /root/agents/log-issue << 'EOF'
#!/bin/bash
node /root/.claude-multi-agent/scripts/enhanced-claude-graph-integration.js log-issue "$1" "$2" "${3:-medium}"
EOF

cat > /root/agents/log-solution << 'EOF'
#!/bin/bash
node /root/.claude-multi-agent/scripts/enhanced-claude-graph-integration.js log-solution "$1" "$2" "${3:-true}"
EOF

cat > /root/agents/check-duplicates << 'EOF'
#!/bin/bash
node /root/agents/duplicate-detection-system.js detect "$1" "$2" "${3:-medium}"
EOF

cat > /root/agents/analyze-task << 'EOF'
#!/bin/bash
node /root/agents/comprehensive-tracking-system.js analyze "$1" "$2" "${3:-medium}"
EOF

chmod +x /root/agents/kg-check
chmod +x /root/agents/log-issue
chmod +x /root/agents/log-solution
chmod +x /root/agents/check-duplicates
chmod +x /root/agents/analyze-task

# Update CLAUDE.md with new workflow instructions
echo "📝 Updating CLAUDE.md with tracking workflow..."
cat >> /root/agents/CLAUDE.md << 'EOF'

## 🚨 MANDATORY: Comprehensive Problem & Solution Tracking

**CRITICAL**: Every Claude Code session MUST use the comprehensive tracking system to prevent duplicate mistakes.

### Required Workflow:

1. **Start Every Task Analysis** (mandatory before ANY significant work):
   ```bash
   ./analyze-task "task description" "optional details" [severity]
   ```
   This checks Knowledge Graph, detects duplicates, and ensures compliance.

2. **Log All Problems Discovered**:
   ```bash
   ./log-issue "problem title" "description" [severity]
   ```
   Auto-syncs to Linear and cross-references systems.

3. **Log All Solutions Attempted**:
   ```bash
   ./log-solution "problem title" "solution description" [successful]
   ```
   Updates all systems with solution status.

4. **Quick Checks** (when needed):
   ```bash
   ./kg-check "query"              # Check Knowledge Graph only
   ./check-duplicates "title"      # Check for duplicates only
   ```

### Exit Codes:
- **0**: Safe to proceed
- **1**: Review required - similar work found
- **2**: STOP - exact duplicate or critical issue detected

### Integration Features:
- ✅ Bi-directional Linear synchronization
- ✅ Cross-system problem correlation
- ✅ Automated duplicate detection
- ✅ Compliance tracking and reporting
- ✅ Real-time webhook integration
- ✅ Comprehensive analytics

**This system prevents catastrophic oversights like the profile system disaster.**

EOF

# Create monitoring script
echo "📊 Creating monitoring dashboard..."
cat > /root/agents/system-status << 'EOF'
#!/bin/bash
echo "📊 COMPREHENSIVE TRACKING SYSTEM STATUS"
echo "======================================"
node /root/agents/comprehensive-tracking-system.js status
EOF

chmod +x /root/agents/system-status

# Test the system
echo "🧪 Testing system integration..."
test_result=$(node /root/agents/comprehensive-tracking-system.js analyze "Test system integration" "Verifying all components work together" "low" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ System integration test passed"
else
    echo "⚠️  System integration test had issues (this may be normal for first run)"
fi

# Setup webhook handler service (optional)
echo "🔗 Setting up webhook handler service..."
cat > /root/agents/start-webhook-handler.sh << 'EOF'
#!/bin/bash
# Start Linear webhook handler for real-time synchronization
echo "🚀 Starting Linear webhook handler on port 3030..."
echo "📍 Webhook URL: http://localhost:3030/webhook"
echo "💊 Health check: http://localhost:3030/health"
echo "🔧 Configure LINEAR_WEBHOOK_SECRET environment variable"
echo "📡 Use ngrok or similar to expose webhook to Linear"
node /root/agents/linear-webhook-handler.js
EOF

chmod +x /root/agents/start-webhook-handler.sh

# Final setup summary
echo ""
echo "✅ COMPREHENSIVE TRACKING SYSTEM SETUP COMPLETE!"
echo ""
echo "📋 Available Commands:"
echo "   ./analyze-task \"title\" [description] [severity]  # Full analysis (REQUIRED)"
echo "   ./log-issue \"title\" \"description\" [severity]    # Log problems"
echo "   ./log-solution \"title\" \"solution\" [successful] # Log solutions"  
echo "   ./kg-check \"query\"                              # Quick KG check"
echo "   ./check-duplicates \"title\"                      # Quick duplicate check"
echo "   ./system-status                                  # View system status"
echo ""
echo "🔗 Optional Webhook Integration:"
echo "   ./start-webhook-handler.sh                       # Start webhook server"
echo ""
echo "📖 Updated CLAUDE.md with mandatory workflow instructions."
echo ""
echo "🎯 Next Steps:"
echo "   1. Always run './analyze-task' before starting any significant work"
echo "   2. Log all discoveries with './log-issue' and './log-solution'"
echo "   3. Check './system-status' regularly for compliance monitoring"
echo "   4. Set up webhook handler for real-time Linear integration (optional)"
echo ""
echo "🛡️  This system prevents duplicate work and catastrophic oversights!"