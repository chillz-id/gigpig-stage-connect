#!/bin/bash

echo "🧪 Testing Stand Up Sydney Core Flows"
echo "====================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

# Function to test a flow
test_flow() {
    local name=$1
    local endpoint=$2
    local expected=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" "$endpoint")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [[ $http_code == $expected ]]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected, Got: $http_code)"
        ((FAILED++))
    fi
}

# Base URL
if [[ "$1" == "production" ]]; then
    BASE_URL="https://stand-up-sydney.vercel.app"
    echo "Testing PRODUCTION environment"
else
    BASE_URL="http://localhost:8081"
    echo "Testing LOCAL environment"
fi

echo ""

# 1. Test Homepage
test_flow "Homepage Load" "$BASE_URL/" "200"

# 2. Test Events Page (Public)
test_flow "Events Page" "$BASE_URL/events" "200"

# 3. Test Comedians Page
test_flow "Comedians Page" "$BASE_URL/comedians" "200"

# 4. Test Sign In Page
test_flow "Sign In Page" "$BASE_URL/sign-in" "200"

# 5. Test Sign Up Page
test_flow "Sign Up Page" "$BASE_URL/sign-up" "200"

# 6. Test API Health (Supabase)
echo -n "Testing Supabase Connection... "
if curl -s https://pdikjpfulhhpqpxzpgtu.supabase.co/rest/v1/ | grep -q "swagger"; then
    echo -e "${GREEN}✓ CONNECTED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

# Summary
echo ""
echo "====================================="
echo "Test Summary:"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [[ $FAILED -eq 0 ]]; then
    echo -e "\n${GREEN}🎉 All tests passed! Platform is operational.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please check the logs.${NC}"
    exit 1
fi