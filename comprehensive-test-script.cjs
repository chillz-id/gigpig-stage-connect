#!/usr/bin/env node

/**
 * Comprehensive Testing Script for Stand Up Sydney Platform
 * Quality Assurance Agent - Testing core functionality fixes
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8082';
const TIMEOUT = 30000;

// Test results storage
let testResults = [];
let performanceMetrics = [];
let consoleLogs = [];
let consoleErrors = [];

// Test configuration
const testConfig = {
  headless: true,
  slowMo: 100,
  timeout: TIMEOUT,
  viewport: {
    width: 1280,
    height: 720
  }
};

// Helper functions
function logTest(testName, status, details = '') {
  const result = {
    test: testName,
    status,
    details,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  console.log(`${status === 'PASS' ? '✅' : '❌'} ${testName}${details ? `: ${details}` : ''}`);
}

function logPerformance(metric, value, unit = 'ms') {
  const perf = { metric, value, unit, timestamp: new Date().toISOString() };
  performanceMetrics.push(perf);
  console.log(`📊 ${metric}: ${value}${unit}`);
}

async function waitForElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

async function checkConsoleErrors(page) {
  const errors = consoleErrors.filter(log => log.type === 'error');
  if (errors.length > 0) {
    logTest('Console Errors Check', 'FAIL', `${errors.length} errors found`);
    return false;
  }
  logTest('Console Errors Check', 'PASS');
  return true;
}

// Test Functions
async function testPageLoad(page, pageName, path = '/') {
  try {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    const loadTime = Date.now() - startTime;
    
    logPerformance(`${pageName} Load Time`, loadTime);
    logTest(`${pageName} Load`, 'PASS', `${loadTime}ms`);
    
    return true;
  } catch (error) {
    logTest(`${pageName} Load`, 'FAIL', error.message);
    return false;
  }
}

async function testEventsSystem(page) {
  console.log('\n🎪 Testing Events System...');
  
  // Test events page load
  await testPageLoad(page, 'Events Page', '/events');
  
  // Check for event cards
  const eventCards = await waitForElement(page, '.event-card, [data-testid="event-card"]', 5000);
  if (eventCards) {
    logTest('Event Cards Display', 'PASS');
  } else {
    logTest('Event Cards Display', 'FAIL', 'No event cards found');
  }
  
  // Test event creation (if create button exists)
  const createEventBtn = await waitForElement(page, 'button[data-testid="create-event"], button:has-text("Create Event")', 2000);
  if (createEventBtn) {
    logTest('Create Event Button', 'PASS');
  } else {
    logTest('Create Event Button', 'FAIL', 'Button not found');
  }
  
  // Test event filtering
  const filterElements = await waitForElement(page, 'select, input[type="search"], [data-testid="filter"]', 2000);
  if (filterElements) {
    logTest('Event Filtering', 'PASS');
  } else {
    logTest('Event Filtering', 'FAIL', 'No filter elements found');
  }
}

async function testInvoicesSystem(page) {
  console.log('\n💰 Testing Invoices System...');
  
  // Test invoices page load
  await testPageLoad(page, 'Invoices Page', '/invoices');
  
  // Check for invoice components
  const invoiceElements = await waitForElement(page, '.invoice-card, [data-testid="invoice"], .invoice-management', 2000);
  if (invoiceElements) {
    logTest('Invoice Components Display', 'PASS');
  } else {
    logTest('Invoice Components Display', 'FAIL', 'No invoice components found');
  }
  
  // Test invoice creation
  const createInvoiceBtn = await waitForElement(page, 'button:has-text("Create Invoice"), [data-testid="create-invoice"]', 2000);
  if (createInvoiceBtn) {
    logTest('Create Invoice Button', 'PASS');
  } else {
    logTest('Create Invoice Button', 'FAIL', 'Button not found');
  }
}

async function testApplicationsSystem(page) {
  console.log('\n📋 Testing Applications System...');
  
  // Test applications page load
  await testPageLoad(page, 'Applications Page', '/applications');
  
  // Check for application components
  const applicationElements = await waitForElement(page, '.application-card, [data-testid="application"], .application-form', 2000);
  if (applicationElements) {
    logTest('Application Components Display', 'PASS');
  } else {
    logTest('Application Components Display', 'FAIL', 'No application components found');
  }
}

async function testSpotConfirmationSystem(page) {
  console.log('\n🎯 Testing Spot Confirmation System...');
  
  // Test spot confirmation page load
  await testPageLoad(page, 'Spot Confirmation Page', '/spot-confirmation');
  
  // Check for spot confirmation components
  const spotElements = await waitForElement(page, '.spot-confirmation, [data-testid="spot-confirmation"], .spot-assignment', 2000);
  if (spotElements) {
    logTest('Spot Confirmation Components Display', 'PASS');
  } else {
    logTest('Spot Confirmation Components Display', 'FAIL', 'No spot confirmation components found');
  }
}

async function testAuthentication(page) {
  console.log('\n🔐 Testing Authentication...');
  
  // Test login page load
  await testPageLoad(page, 'Login Page', '/login');
  
  // Check for auth components
  const authElements = await waitForElement(page, '.auth-form, [data-testid="auth"], button:has-text("Sign in")', 2000);
  if (authElements) {
    logTest('Authentication Components Display', 'PASS');
  } else {
    logTest('Authentication Components Display', 'FAIL', 'No auth components found');
  }
}

async function testDashboard(page) {
  console.log('\n📊 Testing Dashboard...');
  
  // Test dashboard page load
  await testPageLoad(page, 'Dashboard Page', '/dashboard');
  
  // Check for dashboard components
  const dashboardElements = await waitForElement(page, '.dashboard, [data-testid="dashboard"], .dashboard-card', 2000);
  if (dashboardElements) {
    logTest('Dashboard Components Display', 'PASS');
  } else {
    logTest('Dashboard Components Display', 'FAIL', 'No dashboard components found');
  }
}

async function testMobileResponsiveness(page) {
  console.log('\n📱 Testing Mobile Responsiveness...');
  
  // Test mobile viewport
  await page.setViewport({ width: 375, height: 667 });
  
  // Test home page on mobile
  await testPageLoad(page, 'Home Page (Mobile)', '/');
  
  // Check for mobile navigation
  const mobileNav = await waitForElement(page, '.mobile-nav, [data-testid="mobile-nav"], .hamburger-menu', 2000);
  if (mobileNav) {
    logTest('Mobile Navigation', 'PASS');
  } else {
    logTest('Mobile Navigation', 'FAIL', 'No mobile navigation found');
  }
  
  // Reset viewport
  await page.setViewport({ width: 1280, height: 720 });
}

async function testDatabaseIntegration(page) {
  console.log('\n🗄️ Testing Database Integration...');
  
  // Test if data is loading (check for loading states or data)
  await page.goto(`${BASE_URL}/events`, { waitUntil: 'networkidle0' });
  
  const hasData = await page.evaluate(() => {
    // Check for loading indicators or actual data
    const loadingIndicators = document.querySelectorAll('.loading, .spinner, [data-testid="loading"]');
    const dataElements = document.querySelectorAll('.event-card, .data-item, [data-testid*="data"]');
    
    return {
      hasLoadingIndicators: loadingIndicators.length > 0,
      hasDataElements: dataElements.length > 0
    };
  });
  
  if (hasData.hasDataElements) {
    logTest('Database Data Loading', 'PASS');
  } else if (hasData.hasLoadingIndicators) {
    logTest('Database Data Loading', 'PARTIAL', 'Loading indicators present');
  } else {
    logTest('Database Data Loading', 'FAIL', 'No data or loading indicators found');
  }
}

async function runPerformanceTests(page) {
  console.log('\n⚡ Running Performance Tests...');
  
  // Enable performance metrics
  await page.evaluateOnNewDocument(() => {
    window.performance.mark('start-test');
  });
  
  // Load main page and measure metrics
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
  
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
    };
  });
  
  logPerformance('DOM Content Loaded', Math.round(metrics.domContentLoaded));
  logPerformance('Load Complete', Math.round(metrics.loadComplete));
  logPerformance('First Paint', Math.round(metrics.firstPaint));
  logPerformance('First Contentful Paint', Math.round(metrics.firstContentfulPaint));
  
  // Performance benchmarks
  if (metrics.firstContentfulPaint < 2000) {
    logTest('First Contentful Paint Performance', 'PASS', `${Math.round(metrics.firstContentfulPaint)}ms`);
  } else {
    logTest('First Contentful Paint Performance', 'FAIL', `${Math.round(metrics.firstContentfulPaint)}ms > 2000ms`);
  }
}

async function generateTestReport() {
  console.log('\n📝 Generating Test Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: testResults.length,
      passed: testResults.filter(r => r.status === 'PASS').length,
      failed: testResults.filter(r => r.status === 'FAIL').length,
      partial: testResults.filter(r => r.status === 'PARTIAL').length
    },
    testResults,
    performanceMetrics,
    consoleLogs: consoleErrors.length > 0 ? consoleErrors : [],
    recommendations: []
  };
  
  // Add recommendations based on results
  if (report.summary.failed > 0) {
    report.recommendations.push('Critical fixes needed before production deployment');
  }
  
  if (consoleErrors.length > 0) {
    report.recommendations.push('Console errors need investigation');
  }
  
  const failureRate = (report.summary.failed / report.summary.totalTests) * 100;
  if (failureRate > 20) {
    report.recommendations.push('High failure rate - extensive testing needed');
  } else if (failureRate > 10) {
    report.recommendations.push('Moderate failure rate - additional testing recommended');
  } else {
    report.recommendations.push('Low failure rate - system appears stable');
  }
  
  // Save report
  fs.writeFileSync(
    path.join(__dirname, 'test-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📊 Test Summary:');
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Partial: ${report.summary.partial}`);
  console.log(`Success Rate: ${Math.round((report.summary.passed / report.summary.totalTests) * 100)}%`);
  
  return report;
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Testing...');
  
  const browser = await puppeteer.launch({
    headless: testConfig.headless,
    slowMo: testConfig.slowMo,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport(testConfig.viewport);
  
  // Set up console logging
  page.on('console', msg => {
    const log = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    consoleLogs.push(log);
    if (msg.type() === 'error') {
      consoleErrors.push(log);
    }
  });
  
  try {
    // Test basic page loads
    await testPageLoad(page, 'Home Page', '/');
    
    // Test core systems
    await testEventsSystem(page);
    await testInvoicesSystem(page);
    await testApplicationsSystem(page);
    await testSpotConfirmationSystem(page);
    await testAuthentication(page);
    await testDashboard(page);
    
    // Test responsiveness
    await testMobileResponsiveness(page);
    
    // Test database integration
    await testDatabaseIntegration(page);
    
    // Test performance
    await runPerformanceTests(page);
    
    // Check for console errors
    await checkConsoleErrors(page);
    
    // Generate final report
    const report = await generateTestReport();
    
    console.log('\n✅ Testing Complete!');
    console.log(`Report saved to: ${path.join(__dirname, 'test-report.json')}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    logTest('Test Execution', 'FAIL', error.message);
  } finally {
    await browser.close();
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(report => {
      const exitCode = report.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };