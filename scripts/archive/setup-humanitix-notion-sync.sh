#!/bin/bash

echo "=========================================="
echo "Humanitix to Notion Sync Setup"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
NOTION_DB_ID="2304745b-8cbe-81cd-9483-d7acc2377bd6"
HUMANITIX_API_KEY="9f23a99810087538c62feb645c45d195ab966d38533cd6456a4c7092f6ae679fd4515936e5b9869c261dc83721626a46c7328dd22bf6acd567646897ecf4c8c7b4f8b24a1b0dbab2fd952a8c25dd7a3b3f5542f0121c63e6616322eb128741bfbd9322b94c5a46acbe3cc9add71ec2"

echo -e "\n${GREEN}✅ Configuration:${NC}"
echo "   Notion Database ID: $NOTION_DB_ID"
echo "   Humanitix API: Configured"
echo ""

# Test Humanitix API
echo -e "${YELLOW}📊 Testing Humanitix API...${NC}"
EVENTS=$(curl -s -H "X-API-Key: $HUMANITIX_API_KEY" "https://api.humanitix.com/v1/events?page=1" | jq -r '.events | length')
echo -e "${GREEN}✅ Found $EVENTS events in Humanitix${NC}"

# Test Notion connection
echo -e "\n${YELLOW}🔗 Testing Notion connection...${NC}"
if [ -f "/root/agents/.env.local.backup" ]; then
    NOTION_TOKEN=$(grep "NOTION_TOKEN\|NOTION_API_KEY" /root/agents/.env.local.backup | head -1 | cut -d'=' -f2)
    if [ ! -z "$NOTION_TOKEN" ]; then
        echo -e "${GREEN}✅ Notion token found${NC}"
    else
        echo -e "${RED}❌ Notion token not found${NC}"
    fi
fi

# Create environment file for N8N
echo -e "\n${YELLOW}📝 Creating N8N environment configuration...${NC}"
cat > /tmp/n8n-env-config.txt << EOF
NOTION_DATABASE_ID=$NOTION_DB_ID
HUMANITIX_API_KEY=$HUMANITIX_API_KEY
EOF

# Try to copy to N8N container
docker exec n8n sh -c "cat > /home/node/.n8n/humanitix-config.env" < /tmp/n8n-env-config.txt 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Configuration saved to N8N${NC}"
else
    echo -e "${YELLOW}⚠️  Could not save directly to N8N${NC}"
fi

echo -e "\n${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "=========================================="
echo "📋 MANUAL STEPS REQUIRED:"
echo "=========================================="
echo ""
echo "1. Open N8N interface: http://170.64.252.55:5678"
echo ""
echo "2. Import the workflow:"
echo "   - Click 'Workflows' > 'Import from File'"
echo "   - Select: /root/agents/humanitix-notion-sync-active.json"
echo ""
echo "3. Configure credentials:"
echo "   - Open the imported workflow"
echo "   - Double-click 'Check for Duplicates' node"
echo "   - Select or create Notion credentials"
echo "   - Use this token: $NOTION_TOKEN"
echo ""
echo "4. Activate the workflow:"
echo "   - Toggle the 'Active' switch to ON"
echo "   - Click 'Execute Workflow' to test manually"
echo ""
echo "5. Verify in Notion:"
echo "   - Check database: https://www.notion.so/${NOTION_DB_ID//-}"
echo "   - New Humanitix orders should appear"
echo ""
echo "=========================================="
echo "The workflow will run automatically every 15 minutes once activated."