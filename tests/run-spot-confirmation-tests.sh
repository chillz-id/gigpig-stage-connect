#!/bin/bash

# Run Spot Confirmation Tests
# This script runs the comprehensive spot confirmation test suite

echo "🧪 Running Spot Confirmation Test Suite"
echo "========================================"

# Set up environment
export NODE_ENV=test
export CI=false

# Change to the agents directory
cd /root/agents

# Check if required dependencies are installed
echo "📦 Checking dependencies..."
npm ls @playwright/test > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Installing Playwright..."
    npm install --save-dev @playwright/test
fi

npm ls vitest > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Installing Vitest..."
    npm install --save-dev vitest
fi

# Install Playwright browsers if not already installed
npx playwright install

echo "✅ Dependencies checked"

# Run the tests
echo ""
echo "🏃 Running Database Tests..."
npx playwright test --config=tests/spot-confirmation.config.ts --project=spot-confirmation-db

echo ""
echo "🏃 Running Unit Tests..."
npx vitest run tests/spot-confirmation-hooks.test.ts

echo ""
echo "🏃 Running E2E Tests..."
npx playwright test --config=tests/spot-confirmation.config.ts --project=spot-confirmation-e2e

echo ""
echo "🏃 Running Notification Tests..."
npx playwright test --config=tests/spot-confirmation.config.ts --project=spot-confirmation-notifications

echo ""
echo "🏃 Running Deadline Tests..."
npx playwright test --config=tests/spot-confirmation.config.ts --project=spot-confirmation-deadlines

echo ""
echo "📊 Test Results Summary"
echo "======================="
echo "Test files created:"
echo "- spot-confirmation.test.ts (E2E workflow tests)"
echo "- spot-confirmation-db.test.ts (Database operation tests)"
echo "- spot-confirmation-hooks.test.ts (React hooks unit tests)"
echo "- spot-confirmation-notifications.test.ts (Notification system tests)"
echo "- spot-confirmation-deadlines.test.ts (Deadline enforcement tests)"
echo ""
echo "Test configuration:"
echo "- spot-confirmation.config.ts (Playwright configuration)"
echo "- run-spot-confirmation-tests.sh (Test runner script)"
echo ""
echo "✅ Spot Confirmation Test Suite Complete"
echo ""
echo "📋 Next Steps:"
echo "1. Review test results and fix any failures"
echo "2. Implement missing spot confirmation features identified by tests"
echo "3. Add tests to CI/CD pipeline"
echo "4. Monitor test coverage and add more tests as needed"