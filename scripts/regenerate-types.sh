#!/bin/bash

# Regenerate Supabase TypeScript types
# This script requires SUPABASE_ACCESS_TOKEN to be set in the environment
# or you must be logged in via `supabase login`

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Regenerating Supabase types...${NC}"

# Check if we have access
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo -e "${YELLOW}Warning: SUPABASE_ACCESS_TOKEN not set. Checking if logged in...${NC}"
  if ! npx supabase projects list > /dev/null 2>&1; then
    echo -e "${RED}Error: Not logged in to Supabase. Please run 'supabase login' or set SUPABASE_ACCESS_TOKEN${NC}"
    exit 1
  fi
fi

# Project ID from config
PROJECT_ID="pdikjpfulhhpqpxzpgtu"

echo -e "${YELLOW}Generating types for project: ${PROJECT_ID}${NC}"

# Generate types
npx supabase gen types typescript --project-id "$PROJECT_ID" > src/integrations/supabase/types.ts

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Types regenerated successfully!${NC}"
  echo -e "${YELLOW}Location: src/integrations/supabase/types.ts${NC}"

  # Run TypeScript check
  echo -e "${YELLOW}Running TypeScript check...${NC}"
  npm run tsc --noEmit

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ TypeScript check passed!${NC}"
  else
    echo -e "${RED}⚠️  TypeScript errors found. Please review.${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ Failed to regenerate types${NC}"
  exit 1
fi

echo -e "${GREEN}Done!${NC}"
