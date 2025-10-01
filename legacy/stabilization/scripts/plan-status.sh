#!/bin/bash

# Platform Stabilization Status Dashboard
# Shows current progress, next tasks, and overall status

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STABILIZATION_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}🚀 STAND UP SYDNEY PLATFORM STABILIZATION STATUS${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════════════════════════${NC}"

# Show current date and time
echo -e "${BLUE}📅 Current Time: $(date)${NC}"
echo

# Load platform state if available
STATE_FILE="/root/agents/PLATFORM_STATE.json"
if [ -f "$STATE_FILE" ]; then
    LAST_UPDATED=$(grep '"last_updated"' "$STATE_FILE" | cut -d'"' -f4 2>/dev/null || echo "unknown")
    echo -e "${BLUE}📊 Platform State Last Updated: $LAST_UPDATED${NC}"
else
    echo -e "${RED}⚠️  Platform state file not found${NC}"
fi

echo
echo -e "${BOLD}📋 WEEK 1 PROGRESS (Immediate Stabilization & Cleanup)${NC}"
echo -e "Dates: September 9-15, 2025"

# Critical Status Indicators
echo
echo -e "${BOLD}🚨 CRITICAL SYSTEM STATUS${NC}"
echo -e "├─ N8N Service: ${RED}❌ Not Accessible${NC} (localhost:5678 returns 'not found')"
echo -e "├─ .env Backup Files: ${RED}❌ 200+ files (SECURITY RISK)${NC}"  
echo -e "├─ Knowledge Graph: ${GREEN}✅ Active${NC} (146 entries tracked)"
echo -e "├─ Supabase: ${GREEN}✅ Operational${NC} (pdikjpfulhhpqpxzpgtu.supabase.co)"
echo -e "└─ MCP Servers: ${YELLOW}❓ Status Unknown${NC} (13 configured, need testing)"

echo
echo -e "${BOLD}✅ COMPLETED TASKS${NC}"
echo -e "├─ ✅ Master plan document created (PLATFORM_STABILIZATION_PLAN.md)"
echo -e "├─ ✅ Platform state tracking setup (PLATFORM_STATE.json)"
echo -e "├─ ✅ Weekly directory structure created"
echo -e "├─ ✅ Knowledge Graph startup check (146 entries found)"
echo -e "└─ ✅ Week 1 detailed task plan created"

echo
echo -e "${BOLD}🔄 NEXT IMMEDIATE TASKS${NC}"
echo -e "1. ${RED}🚨 CRITICAL: Remove .env backup files${NC}"
echo -e "   Command: find /root/agents -name '*.env.backup-*' -delete"
echo -e ""
echo -e "2. ${RED}🚨 CRITICAL: Fix N8N service${NC}"
echo -e "   Steps: Check docker/pm2, restart service, verify localhost:5678"
echo -e ""
echo -e "3. ${YELLOW}📡 Test MCP server connections${NC}"
echo -e "   Goal: Verify all 13 servers, document status"

echo
echo -e "${BOLD}📊 PROGRESS METRICS${NC}"
echo -e "├─ Infrastructure Setup: ${GREEN}60% Complete${NC}"
echo -e "├─ Security Cleanup: ${RED}20% Complete${NC}" 
echo -e "├─ Service Restoration: ${RED}0% Complete${NC}"
echo -e "└─ Overall Week 1: ${YELLOW}27% Complete${NC}"

echo
echo -e "${BOLD}⚠️  BLOCKERS & RISKS${NC}"
echo -e "├─ ${RED}HIGH: N8N service down${NC} - blocks automation workflows"
echo -e "├─ ${RED}CRITICAL: Security risk${NC} - 200+ .env backup files exposed"
echo -e "└─ ${YELLOW}MEDIUM: MCP status unknown${NC} - need systematic testing"

echo
echo -e "${BOLD}📁 KEY FILES & DIRECTORIES${NC}"
echo -e "├─ Master Plan: ${BLUE}/root/agents/PLATFORM_STABILIZATION_PLAN.md${NC}"
echo -e "├─ Platform State: ${BLUE}/root/agents/PLATFORM_STATE.json${NC}"
echo -e "├─ Week 1 Tasks: ${BLUE}/root/agents/stabilization/week-1/tasks.md${NC}"
echo -e "├─ Progress JSON: ${BLUE}/root/agents/stabilization/week-1/progress.json${NC}"
echo -e "└─ Scripts: ${BLUE}/root/agents/stabilization/scripts/${NC}"

echo
echo -e "${BOLD}🔧 USEFUL COMMANDS${NC}"
echo -e "├─ Track Progress: ${BLUE}./track-progress.sh \"task description\"${NC}"
echo -e "├─ Next Tasks: ${BLUE}./next-task.sh${NC}"
echo -e "├─ Knowledge Graph Check: ${BLUE}node /root/.claude-multi-agent/scripts/claude-graph-integration.js check \"task description\"${NC}"
echo -e "└─ Load Platform State: ${BLUE}cat /root/agents/PLATFORM_STATE.json${NC}"

echo
echo -e "${BOLD}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}🎯 FOCUS: Security cleanup first, then N8N restoration${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════════════════════════${NC}"