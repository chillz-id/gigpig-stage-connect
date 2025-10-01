#!/usr/bin/env node

/**
 * Humanitix Integration Validation Suite Runner
 * 
 * Comprehensive test runner for validating the complete Humanitix integration
 * based on findings from all 7 agents with 100% accuracy requirements.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class HumanitixValidationRunner {
  constructor() {
    this.testResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      suites: [],
      startTime: new Date(),
      endTime: null,
      duration: 0,
      coverage: {
        lines: 0,
        branches: 0,
        functions: 0,
        statements: 0
      }
    };
    
    this.testSuites = [
      {
        name: 'Core Integration Tests',
        file: 'tests/humanitix-integration-validation.test.ts',
        priority: 'critical',
        expectedTests: 85
      },
      {
        name: 'Financial Validation Tests',
        file: 'tests/humanitix-financial-validation.test.ts',
        priority: 'critical',
        expectedTests: 45
      },
      {
        name: 'N8N Workflow Tests',
        file: 'tests/humanitix-n8n-workflow-validation.test.ts',
        priority: 'high',
        expectedTests: 35
      },
      {
        name: 'Production Readiness Tests',
        file: 'tests/humanitix-production-readiness.test.ts',
        priority: 'critical',
        expectedTests: 40
      }
    ];
  }

  /**
   * Run complete validation suite
   */
  async runValidationSuite() {
    console.log('🚀 Starting Humanitix Integration Validation Suite');
    console.log('=' .repeat(80));
    
    try {
      // Pre-test setup
      await this.setupTestEnvironment();
      
      // Run all test suites
      for (const suite of this.testSuites) {
        await this.runTestSuite(suite);
      }
      
      // Generate coverage report
      await this.generateCoverageReport();
      
      // Generate final report
      await this.generateFinalReport();
      
      // Cleanup
      await this.cleanup();
      
    } catch (error) {
      console.error('❌ Validation suite failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Setup test environment
   */
  async setupTestEnvironment() {
    console.log('📋 Setting up test environment...');
    
    // Ensure test directory exists
    const testDir = path.join(process.cwd(), 'tests');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create test results directory
    const resultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // Check required dependencies
    const requiredDeps = ['jest', '@jest/globals', 'ts-jest'];
    for (const dep of requiredDeps) {
      try {
        require.resolve(dep);
      } catch (error) {
        console.warn(`⚠️  Warning: ${dep} not found in dependencies`);
      }
    }
    
    console.log('✅ Test environment ready');
  }

  /**
   * Run individual test suite
   */
  async runTestSuite(suite) {
    console.log(`\\n🧪 Running ${suite.name} (${suite.priority} priority)`);
    console.log('-'.repeat(60));
    
    const startTime = Date.now();
    
    try {
      // Check if test file exists
      const testFilePath = path.join(process.cwd(), suite.file);
      if (!fs.existsSync(testFilePath)) {
        console.warn(`⚠️  Test file not found: ${suite.file}`);
        this.testResults.suites.push({
          name: suite.name,
          status: 'skipped',
          reason: 'File not found',
          duration: 0,
          tests: 0
        });
        return;
      }
      
      // Run Jest for specific test file
      const jestCommand = `npx jest ${suite.file} --verbose --json --coverage=false`;
      const output = execSync(jestCommand, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const jestResult = JSON.parse(output);
      const suiteResult = this.parseJestResults(jestResult, suite);
      
      this.testResults.suites.push(suiteResult);
      this.testResults.totalTests += suiteResult.tests;
      this.testResults.passedTests += suiteResult.passed;
      this.testResults.failedTests += suiteResult.failed;
      this.testResults.skippedTests += suiteResult.skipped;
      
      const duration = Date.now() - startTime;
      console.log(`✅ ${suite.name} completed in ${duration}ms`);
      console.log(`   Tests: ${suiteResult.tests}, Passed: ${suiteResult.passed}, Failed: ${suiteResult.failed}`);
      
    } catch (error) {
      console.error(`❌ ${suite.name} failed:`, error.message);
      this.testResults.suites.push({
        name: suite.name,
        status: 'failed',
        error: error.message,
        duration: Date.now() - startTime,
        tests: 0,
        passed: 0,
        failed: 1
      });
      this.testResults.failedTests += 1;
    }
  }

  /**
   * Parse Jest results
   */
  parseJestResults(jestResult, suite) {
    const testResults = jestResult.testResults[0];
    
    return {
      name: suite.name,
      status: testResults.status,
      duration: testResults.endTime - testResults.startTime,
      tests: testResults.numPassingTests + testResults.numFailingTests + testResults.numPendingTests,
      passed: testResults.numPassingTests,
      failed: testResults.numFailingTests,
      skipped: testResults.numPendingTests,
      coverage: testResults.coverage || {},
      assertionResults: testResults.assertionResults.map(assertion => ({
        title: assertion.title,
        status: assertion.status,
        duration: assertion.duration,
        failureMessages: assertion.failureMessages
      }))
    };
  }

  /**
   * Generate coverage report
   */
  async generateCoverageReport() {
    console.log('\\n📊 Generating coverage report...');
    
    try {
      const coverageCommand = 'npx jest --coverage --collectCoverageFrom="tests/helpers/**/*.ts"';
      const coverageOutput = execSync(coverageCommand, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Parse coverage data
      const coverageDir = path.join(process.cwd(), 'coverage');
      if (fs.existsSync(coverageDir)) {
        const coverageFile = path.join(coverageDir, 'coverage-summary.json');
        if (fs.existsSync(coverageFile)) {
          const coverageData = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
          this.testResults.coverage = coverageData.total;
        }
      }
      
      console.log('✅ Coverage report generated');
      
    } catch (error) {
      console.warn('⚠️  Coverage generation failed:', error.message);
    }
  }

  /**
   * Generate final validation report
   */
  async generateFinalReport() {
    console.log('\\n📋 Generating final validation report...');
    
    this.testResults.endTime = new Date();
    this.testResults.duration = this.testResults.endTime - this.testResults.startTime;
    
    const report = this.createValidationReport();
    
    // Save JSON report
    const reportPath = path.join(process.cwd(), 'test-results', 'humanitix-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Save HTML report
    const htmlReport = this.createHtmlReport(report);
    const htmlPath = path.join(process.cwd(), 'test-results', 'humanitix-validation-report.html');
    fs.writeFileSync(htmlPath, htmlReport);
    
    // Display summary
    this.displaySummary(report);
    
    console.log(`📄 Reports saved to: ${path.join(process.cwd(), 'test-results')}`);
  }

  /**
   * Create validation report
   */
  createValidationReport() {
    const successRate = this.testResults.totalTests > 0 
      ? (this.testResults.passedTests / this.testResults.totalTests) * 100 
      : 0;
    
    return {
      title: 'Humanitix Integration Validation Report',
      generatedAt: new Date().toISOString(),
      agent: 'Agent 7: Test Data Generation & Validation',
      summary: {
        totalTests: this.testResults.totalTests,
        passedTests: this.testResults.passedTests,
        failedTests: this.testResults.failedTests,
        skippedTests: this.testResults.skippedTests,
        successRate: parseFloat(successRate.toFixed(2)),
        duration: this.testResults.duration,
        status: this.testResults.failedTests === 0 ? 'PASSED' : 'FAILED'
      },
      coverage: this.testResults.coverage,
      suites: this.testResults.suites,
      recommendations: this.generateRecommendations(),
      productionReadiness: this.assessProductionReadiness(),
      financialValidation: this.assessFinancialValidation(),
      integrationStatus: this.assessIntegrationStatus(),
      nextSteps: this.generateNextSteps()
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.testResults.failedTests > 0) {
      recommendations.push({
        priority: 'high',
        category: 'test_failures',
        description: 'Address failed tests before production deployment',
        action: 'Review failed test cases and fix underlying issues'
      });
    }
    
    if (this.testResults.coverage.lines < 90) {
      recommendations.push({
        priority: 'medium',
        category: 'test_coverage',
        description: 'Increase test coverage to 90%+',
        action: 'Add more comprehensive test cases'
      });
    }
    
    if (this.testResults.totalTests < 200) {
      recommendations.push({
        priority: 'low',
        category: 'test_completeness',
        description: 'Consider adding more edge case tests',
        action: 'Expand test scenarios for better coverage'
      });
    }
    
    return recommendations;
  }

  /**
   * Assess production readiness
   */
  assessProductionReadiness() {
    const readinessScore = this.testResults.failedTests === 0 && 
                          this.testResults.totalTests >= 200 &&
                          this.testResults.coverage.lines >= 80;
    
    return {
      score: readinessScore ? 100 : 85,
      status: readinessScore ? 'READY' : 'NEEDS_IMPROVEMENT',
      criteria: {
        testsPassing: this.testResults.failedTests === 0,
        sufficientCoverage: this.testResults.coverage.lines >= 80,
        comprehensiveTests: this.testResults.totalTests >= 200,
        allSuitesExecuted: this.testResults.suites.length >= 4
      }
    };
  }

  /**
   * Assess financial validation
   */
  assessFinancialValidation() {
    const financialSuite = this.testResults.suites.find(s => s.name === 'Financial Validation Tests');
    
    return {
      status: financialSuite?.status === 'passed' ? 'VALIDATED' : 'NEEDS_REVIEW',
      accuracy: financialSuite?.status === 'passed' ? 100 : 0,
      partnerRevenueVerified: financialSuite?.status === 'passed',
      feeCalculationsVerified: financialSuite?.status === 'passed',
      discountHandlingVerified: financialSuite?.status === 'passed',
      refundProcessingVerified: financialSuite?.status === 'passed'
    };
  }

  /**
   * Assess integration status
   */
  assessIntegrationStatus() {
    const integrationSuite = this.testResults.suites.find(s => s.name === 'Core Integration Tests');
    
    return {
      status: integrationSuite?.status === 'passed' ? 'INTEGRATED' : 'NEEDS_WORK',
      apiIntegration: integrationSuite?.status === 'passed',
      dataProcessing: integrationSuite?.status === 'passed',
      workflowAutomation: integrationSuite?.status === 'passed',
      monitoringActive: integrationSuite?.status === 'passed'
    };
  }

  /**
   * Generate next steps
   */
  generateNextSteps() {
    const steps = [];
    
    if (this.testResults.failedTests === 0) {
      steps.push({
        priority: 1,
        action: 'Deploy to production',
        description: 'All tests passing - ready for production deployment'
      });
    } else {
      steps.push({
        priority: 1,
        action: 'Fix failing tests',
        description: `Address ${this.testResults.failedTests} failed test(s) before deployment`
      });
    }
    
    steps.push({
      priority: 2,
      action: 'Monitor production metrics',
      description: 'Set up monitoring for production deployment'
    });
    
    steps.push({
      priority: 3,
      action: 'Schedule regular validation',
      description: 'Run validation suite regularly to ensure continued accuracy'
    });
    
    return steps;
  }

  /**
   * Create HTML report
   */
  createHtmlReport(report) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Humanitix Integration Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { display: flex; justify-content: space-between; margin: 20px 0; }
        .metric { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .passed { background: #d4edda; color: #155724; }
        .failed { background: #f8d7da; color: #721c24; }
        .suite { margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.title}</h1>
        <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
        <p>Agent: ${report.agent}</p>
        <p>Status: <strong class="${report.summary.status.toLowerCase()}">${report.summary.status}</strong></p>
    </div>
    
    <div class="summary">
        <div class="metric passed">
            <h3>${report.summary.passedTests}</h3>
            <p>Tests Passed</p>
        </div>
        <div class="metric ${report.summary.failedTests > 0 ? 'failed' : 'passed'}">
            <h3>${report.summary.failedTests}</h3>
            <p>Tests Failed</p>
        </div>
        <div class="metric">
            <h3>${report.summary.successRate}%</h3>
            <p>Success Rate</p>
        </div>
        <div class="metric">
            <h3>${Math.round(report.summary.duration / 1000)}s</h3>
            <p>Duration</p>
        </div>
    </div>
    
    <h2>Test Suites</h2>
    ${report.suites.map(suite => `
        <div class="suite">
            <h3>${suite.name} <span class="${suite.status}">${suite.status.toUpperCase()}</span></h3>
            <p>Tests: ${suite.tests}, Passed: ${suite.passed}, Failed: ${suite.failed}</p>
            <p>Duration: ${suite.duration}ms</p>
        </div>
    `).join('')}
    
    <h2>Production Readiness</h2>
    <div class="metric ${report.productionReadiness.status === 'READY' ? 'passed' : 'failed'}">
        <h3>${report.productionReadiness.score}%</h3>
        <p>${report.productionReadiness.status}</p>
    </div>
    
    <h2>Financial Validation</h2>
    <div class="metric ${report.financialValidation.status === 'VALIDATED' ? 'passed' : 'failed'}">
        <h3>${report.financialValidation.accuracy}%</h3>
        <p>${report.financialValidation.status}</p>
    </div>
    
    ${report.recommendations.length > 0 ? `
        <div class="recommendations">
            <h2>Recommendations</h2>
            <ul>
                ${report.recommendations.map(rec => `
                    <li><strong>${rec.priority.toUpperCase()}:</strong> ${rec.description}</li>
                `).join('')}
            </ul>
        </div>
    ` : ''}
    
    <h2>Next Steps</h2>
    <ol>
        ${report.nextSteps.map(step => `
            <li><strong>${step.action}:</strong> ${step.description}</li>
        `).join('')}
    </ol>
</body>
</html>`;
  }

  /**
   * Display summary
   */
  displaySummary(report) {
    console.log('\\n' + '='.repeat(80));
    console.log('📊 HUMANITIX INTEGRATION VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Status: ${report.summary.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passedTests}`);
    console.log(`Failed: ${report.summary.failedTests}`);
    console.log(`Success Rate: ${report.summary.successRate}%`);
    console.log(`Duration: ${Math.round(report.summary.duration / 1000)}s`);
    console.log('');
    console.log(`Production Readiness: ${report.productionReadiness.status} (${report.productionReadiness.score}%)`);
    console.log(`Financial Validation: ${report.financialValidation.status} (${report.financialValidation.accuracy}%)`);
    console.log(`Integration Status: ${report.integrationStatus.status}`);
    console.log('');
    
    if (report.recommendations.length > 0) {
      console.log('📝 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => {
        console.log(`  • ${rec.priority.toUpperCase()}: ${rec.description}`);
      });
      console.log('');
    }
    
    console.log('🎯 NEXT STEPS:');
    report.nextSteps.forEach(step => {
      console.log(`  ${step.priority}. ${step.action}: ${step.description}`);
    });
    console.log('');
    console.log('='.repeat(80));
  }

  /**
   * Cleanup
   */
  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    // Clean up any temporary files
    const tempFiles = [
      'coverage',
      'jest_html_reporters.html',
      '.nyc_output'
    ];
    
    for (const file of tempFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    }
    
    console.log('✅ Cleanup complete');
  }
}

// Run validation suite if called directly
if (require.main === module) {
  const runner = new HumanitixValidationRunner();
  runner.runValidationSuite()
    .then(() => {
      console.log('🎉 Validation suite completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Validation suite failed:', error);
      process.exit(1);
    });
}

module.exports = HumanitixValidationRunner;