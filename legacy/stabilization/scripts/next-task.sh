#!/bin/bash

# Next Task Script - Shows the next priority task to work on
# Based on current platform state and progress

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}🎯 NEXT PRIORITY TASK${NC}"
echo -e "═══════════════════════════════════════════════════════════════════════════════"

# Check current critical status to determine next task priority

# Check if .env files still exist (CRITICAL)
ENV_BACKUP_COUNT=$(find /root/agents -name "*.env.backup-*" 2>/dev/null | wc -l)

if [ "$ENV_BACKUP_COUNT" -gt 0 ]; then
    echo -e "${RED}🚨 CRITICAL SECURITY TASK${NC}"
    echo -e "${BOLD}Task: Remove .env backup files${NC}"
    echo -e "Priority: ${RED}CRITICAL${NC}"
    echo -e "Risk: Exposed credentials in git history"
    echo -e "Files: $ENV_BACKUP_COUNT backup files found"
    echo
    echo -e "${BOLD}Commands to run:${NC}"
    echo -e "${BLUE}# First, count and inspect files${NC}"
    echo -e "find /root/agents -name '*.env.backup-*' | head -10"
    echo -e "find /root/agents -name '*.env.backup-*' | wc -l"
    echo
    echo -e "${BLUE}# Then remove all backup files${NC}"
    echo -e "find /root/agents -name '*.env.backup-*' -delete"
    echo
    echo -e "${BLUE}# Verify removal${NC}"
    echo -e "find /root/agents -name '*.env.backup-*'"
    echo
    echo -e "${BLUE}# Update .gitignore to prevent recurrence${NC}"
    echo -e "echo '*.env.backup-*' >> /root/agents/.gitignore"
    echo
    echo -e "${BLUE}# Track progress${NC}"
    echo -e "./track-progress.sh 'Removed all .env backup files - security risk eliminated'"
    
# Check N8N service status (CRITICAL for automation)
elif ! curl -s http://localhost:5678/api/v1/info >/dev/null 2>&1; then
    echo -e "${RED}🚨 CRITICAL SERVICE RESTORATION${NC}"
    echo -e "${BOLD}Task: Fix N8N service${NC}"
    echo -e "Priority: ${RED}CRITICAL${NC}"
    echo -e "Impact: Blocks all automation workflows"
    echo -e "Current Status: Service not accessible at localhost:5678"
    echo
    echo -e "${BOLD}Diagnostic commands:${NC}"
    echo -e "${BLUE}# Check if N8N is running${NC}"
    echo -e "docker ps | grep n8n"
    echo -e "pm2 list | grep n8n"
    echo -e "systemctl status n8n"
    echo
    echo -e "${BLUE}# Check port usage${NC}"
    echo -e "netstat -tulpn | grep 5678"
    echo -e "lsof -i :5678"
    echo
    echo -e "${BLUE}# Recovery commands${NC}"
    echo -e "docker restart n8n    # If Docker-based"
    echo -e "pm2 restart n8n       # If PM2-based"
    echo -e "systemctl restart n8n # If systemd service"
    echo
    echo -e "${BLUE}# Verify fix${NC}"
    echo -e "curl http://localhost:5678/api/v1/info"
    echo
    echo -e "${BLUE}# Track progress${NC}"
    echo -e "./track-progress.sh 'N8N service restored and accessible'"

# If both critical tasks done, move to MCP testing
else
    echo -e "${YELLOW}📡 HIGH PRIORITY TASK${NC}"
    echo -e "${BOLD}Task: Test all 13 MCP server connections${NC}"
    echo -e "Priority: ${YELLOW}HIGH${NC}"
    echo -e "Impact: Needed to activate automation infrastructure"
    echo
    echo -e "${BOLD}MCP Servers to test:${NC}"
    echo -e "1. Supabase ✅ (known working)"
    echo -e "2. GitHub ✅ (known working)"
    echo -e "3. Notion ✅ (known working)"
    echo -e "4. Context7 ✅ (known working)" 
    echo -e "5. Filesystem ✅ (known working)"
    echo -e "6. Linear ✅ (working via KG)"
    echo -e "7. Slack ❓ (needs testing)"
    echo -e "8. Metricool ❓ (underutilized)"
    echo -e "9. Xero ❓ (auth issues)"
    echo -e "10. Canva ❓ (underutilized)"
    echo -e "11. Apify ❓ (underutilized)"
    echo -e "12. Task Master ❓ (underutilized)"
    echo -e "13. Puppeteer ❓ (needs testing)"
    echo
    echo -e "${BOLD}Testing approach:${NC}"
    echo -e "${BLUE}# Create MCP test script${NC}"
    echo -e "# Then run systematic tests for each server"
    echo -e "./test-mcp-servers.js"
    echo
    echo -e "${BLUE}# Document results${NC}"
    echo -e "./track-progress.sh 'MCP server testing completed - X of 13 servers operational'"
fi

echo
echo -e "${BOLD}💡 GENERAL REMINDERS${NC}"
echo -e "├─ Always run Knowledge Graph check before major work:"
echo -e "│  ${BLUE}node /root/.claude-multi-agent/scripts/claude-graph-integration.js check \"task description\"${NC}"
echo -e "├─ Update platform state after significant changes"
echo -e "├─ Log major completions and blockers"
echo -e "└─ Preserve all existing automation infrastructure"

echo
echo -e "═══════════════════════════════════════════════════════════════════════════════"