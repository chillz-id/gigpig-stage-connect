#!/bin/bash

# Deployment Verification Script for Stand Up Sydney

echo "🚀 Stand Up Sydney Deployment Verification"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get deployment URL from user
echo -n "Enter your Vercel deployment URL (e.g., https://standup-sydney.vercel.app): "
read DEPLOYMENT_URL

echo ""
echo "Testing deployment at: $DEPLOYMENT_URL"
echo ""

# Test 1: Basic connectivity
echo -n "1. Testing basic connectivity... "
if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL" | grep -q "200"; then
    echo -e "${GREEN}✓ Success${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
fi

# Test 2: Check if index.html loads
echo -n "2. Testing homepage loads... "
if curl -s "$DEPLOYMENT_URL" | grep -q "Stand Up Sydney"; then
    echo -e "${GREEN}✓ Success${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
fi

# Test 3: Check API connectivity
echo -n "3. Testing Supabase connectivity... "
SUPABASE_URL="https://pdikjpfulhhpqpxzpgtu.supabase.co"
if curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/" | grep -q "200"; then
    echo -e "${GREEN}✓ Success${NC}"
else
    echo -e "${YELLOW}⚠ Warning - Check Supabase connection${NC}"
fi

# Test 4: Check critical routes
echo ""
echo "4. Testing critical routes:"
ROUTES=("/auth" "/shows" "/comedians" "/profile" "/events/test-event")

for route in "${ROUTES[@]}"; do
    echo -n "   Testing $route... "
    if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL$route" | grep -q "200"; then
        echo -e "${GREEN}✓ Success${NC}"
    else
        echo -e "${YELLOW}⚠ Route may be protected${NC}"
    fi
done

# Test 5: Check static assets
echo ""
echo "5. Testing static assets:"
echo -n "   Testing logo... "
if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/id-logo.png" | grep -q "200"; then
    echo -e "${GREEN}✓ Success${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
fi

# Test 6: PWA manifest
echo -n "   Testing PWA manifest... "
if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/manifest.json" | grep -q "200"; then
    echo -e "${GREEN}✓ Success${NC}"
else
    echo -e "${YELLOW}⚠ PWA not configured${NC}"
fi

echo ""
echo "========================================="
echo "Deployment verification complete!"
echo ""
echo "Next steps:"
echo "1. Test user registration/login flow"
echo "2. Create a test comedian profile"
echo "3. Create and publish a test event"
echo "4. Test calendar features"
echo "5. Verify mobile responsiveness"
echo ""
echo "🎭 Your comedy platform is live! 🎭"