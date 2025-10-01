#!/bin/bash

echo "🧹 HUMANITIX NOTION DATA CLEANUP"
echo "================================="
echo "This script will:"
echo "1. Check what Humanitix data exists in Notion"
echo "2. Clean ALL Humanitix data from ALL databases"
echo ""

cd /root/agents

echo "📋 Step 1: Checking current data..."
python3 check-notion-data.py

echo ""
echo "🗑️  Step 2: Running comprehensive cleanup..."
python3 comprehensive-notion-cleanup.py

echo ""
echo "✅ Cleanup process complete!"
echo "All Humanitix order data has been removed from Notion."