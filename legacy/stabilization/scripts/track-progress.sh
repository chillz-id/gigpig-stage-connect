#!/bin/bash

# Progress Tracking Script for Platform Stabilization
# Usage: ./track-progress.sh "task description" [status]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STABILIZATION_DIR="$(dirname "$SCRIPT_DIR")"
WEEK_DIR="$STABILIZATION_DIR/week-1"  # TODO: Make dynamic based on current week
PROGRESS_FILE="$WEEK_DIR/progress.json"
STATE_FILE="/root/agents/PLATFORM_STATE.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default to "completed" if no status provided
TASK_DESCRIPTION="${1:-}"
TASK_STATUS="${2:-completed}"

if [ -z "$TASK_DESCRIPTION" ]; then
    echo -e "${RED}Usage: $0 \"task description\" [status]${NC}"
    echo "Status options: completed, in_progress, pending, blocked"
    exit 1
fi

# Timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Log to Knowledge Graph if critical
if [[ "$TASK_STATUS" == "completed" ]]; then
    echo -e "${GREEN}✅ COMPLETED: $TASK_DESCRIPTION${NC}"
    
    # Log to Knowledge Graph for major completions
    if [[ "$TASK_DESCRIPTION" == *"critical"* ]] || [[ "$TASK_DESCRIPTION" == *"security"* ]] || [[ "$TASK_DESCRIPTION" == *"N8N"* ]]; then
        node /root/.claude-multi-agent/scripts/claude-graph-integration.js log-solution \
            "Platform Stabilization Task" \
            "$TASK_DESCRIPTION completed at $TIMESTAMP" \
            "true" 2>/dev/null || echo "Note: Could not log to Knowledge Graph"
    fi
    
elif [[ "$TASK_STATUS" == "blocked" ]]; then
    echo -e "${RED}🚨 BLOCKED: $TASK_DESCRIPTION${NC}"
    
    # Log blockers to Knowledge Graph
    node /root/.claude-multi-agent/scripts/claude-graph-integration.js log-issue \
        "Platform Stabilization Blocker" \
        "$TASK_DESCRIPTION - blocked at $TIMESTAMP" \
        "high" 2>/dev/null || echo "Note: Could not log to Knowledge Graph"
        
elif [[ "$TASK_STATUS" == "in_progress" ]]; then
    echo -e "${YELLOW}🔄 IN PROGRESS: $TASK_DESCRIPTION${NC}"
    
else
    echo -e "${BLUE}📋 $TASK_STATUS: $TASK_DESCRIPTION${NC}"
fi

# Update progress JSON (simplified - could be enhanced with jq)
echo "# Task logged at $TIMESTAMP: $TASK_DESCRIPTION ($TASK_STATUS)" >> "$WEEK_DIR/task_log.txt"

# Update state file last updated timestamp
if [ -f "$STATE_FILE" ]; then
    # Simple timestamp update (could use jq for more sophisticated updates)
    sed -i "s/\"last_updated\": \".*\"/\"last_updated\": \"$TIMESTAMP\"/" "$STATE_FILE" 2>/dev/null || true
fi

echo -e "${BLUE}Progress logged. Run ./plan-status.sh to see overall status.${NC}"