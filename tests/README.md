# iD Comedy Platform - Testing Guide

## 🧪 **Testing Setup with Puppeteer**

This testing framework uses Puppeteer for automated browser testing of the iD Comedy platform.

## 📋 **Available Test Commands**

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test suites
npm run test:smoke      # Basic functionality tests
npm run test:design     # Design System tests
npm run test:profile    # Profile functionality tests

# Run tests with dev server (starts dev server, waits for it, runs tests)
npm run test:dev

# CI mode (builds, previews, tests, then cleans up)
npm run test:ci
```

## 🏗️ **Test Structure**

### **Test Files:**
- `smoke.test.ts` - Basic functionality and page load tests
- `design-system.test.ts` - Design System controls and blur effects
- `profile.test.ts` - Profile form and authentication flows
- `helpers/TestHelper.ts` - Utility functions for common test operations

### **Key Test Features:**
- **Browser automation** with Puppeteer
- **Screenshot capture** for visual debugging
- **Performance monitoring** (page load times)
- **Responsive testing** (mobile/desktop viewports)
- **Error handling** and network monitoring
- **Toast notification testing**

## 🎯 **What's Being Tested**

### **Smoke Tests:**
- ✅ Homepage loads successfully
- ✅ Navigation between pages works
- ✅ Design System page loads and controls work
- ✅ Profile page handles authentication
- ✅ Performance metrics are acceptable
- ✅ Error handling for invalid routes

### **Design System Tests:**
- ✅ Blur intensity controls function properly
- ✅ Glass effect demo responds to changes
- ✅ Color and typography controls are present
- ✅ Live preview shows real-time changes
- ✅ Settings persistence (if implemented)
- ✅ Mobile responsive behavior

### **Profile Tests:**
- ✅ Profile form validation works
- ✅ Media upload sections exist
- ✅ XERO integration sections
- ✅ Social media input validation
- ✅ Comedy styles/tags functionality
- ✅ Mobile responsive design

## 🔧 **Test Configuration**

### **Browser Settings:**
- **Headless**: Runs headless in CI, with browser window in development
- **Viewport**: 1280x720 (desktop), 375x667 (mobile testing)
- **Timeout**: 30 seconds for complex operations
- **Screenshot**: Automatic capture on test failures

### **Server Requirements:**
Tests expect the development server to be running on `http://localhost:8080`

## 📊 **Test Reports**

### **Coverage Reports:**
- HTML report: `coverage/lcov-report/index.html`
- Text summary displayed in terminal

### **Screenshots:**
- Saved to: `tests/screenshots/`
- Named with timestamp for debugging
- Captured during key test moments

## 🚀 **Running Tests for Your PRD**

When working through your PRD features:

1. **Before making changes:**
   ```bash
   npm run test:smoke  # Ensure baseline works
   ```

2. **During development:**
   ```bash
   npm run test:watch  # Auto-run tests on changes
   ```

3. **After feature completion:**
   ```bash
   npm run test:coverage  # Full test suite with coverage
   ```

4. **For visual verification:**
   Check `tests/screenshots/` for captured images

## 🐛 **Debugging Tests**

### **Common Issues:**
- **Test timeout**: Increase timeout in jest.config.js
- **Element not found**: Check selectors in TestHelper
- **Server not running**: Use `npm run test:dev` to auto-start server

### **Debug Commands:**
```bash
# Run with verbose output
npm test -- --verbose

# Run single test file
npm test tests/smoke.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="blur"
```

### **Browser Debugging:**
Set `headless: false` in `tests/setup.ts` to see browser window during tests.

## 🔄 **Adding New Tests**

### **For new PRD features:**
1. Create test file: `tests/your-feature.test.ts`
2. Use TestHelper for common operations
3. Follow existing patterns for structure
4. Add screenshots for visual features
5. Update this README with new test descriptions

### **Test Template:**
```typescript
import { TestHelper } from './helpers/TestHelper';

describe('Your Feature Tests', () => {
  let helper: TestHelper;

  beforeEach(async () => {
    helper = new TestHelper(global.page);
    // Navigate to your feature
  });

  test('Feature works as expected', async () => {
    // Your test logic
    expect(await helper.hasText('Expected Text')).toBe(true);
  });
});
```

Perfect for validating PRD changes systematically! 🎉