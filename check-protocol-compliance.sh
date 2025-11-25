#!/bin/bash

# Protocol Compliance Check Script
# This script verifies basic protocol compliance

GREEN='\033[0;32m'
NC='\033[0m'

# Basic checks
echo "Checking protocol compliance..."

# Check if MCP configuration exists
if [ -f ".mcp.json" ]; then
    echo -e "${GREEN}✅ MCP configuration found${NC}"
else
    echo "❌ MCP configuration missing"
    exit 1
fi

# Check if critical documentation exists (check archive location too)
if [ -f "VERIFIED_DATABASE_SCHEMA.md" ] || [ -f "docs/archive/VERIFIED_DATABASE_SCHEMA.md" ]; then
    echo -e "${GREEN}✅ Database schema documentation found${NC}"
else
    echo "❌ Database schema documentation missing"
    exit 1
fi

# All checks passed
echo -e "${GREEN}✅ Protocol compliance verified${NC}"
exit 0