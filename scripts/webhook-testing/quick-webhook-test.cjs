#!/usr/bin/env node

/**
 * Quick Webhook Functionality Test
 * Tests webhook endpoints functionality and generates a report
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runQuickTests() {
  console.log('🚀 Quick Webhook Testing Suite');
  console.log('='.repeat(35));
  
  const results = {
    connectivity: { passed: 0, failed: 0 },
    functionality: { passed: 0, failed: 0 },
    security: { passed: 0, failed: 0 },
    performance: { passed: 0, failed: 0 }
  };

  // Test 1: Basic Connectivity
  console.log('\n🔌 Testing Basic Connectivity');
  console.log('-'.repeat(30));
  
  const platforms = ['humanitix', 'eventbrite'];
  
  for (const platform of platforms) {
    const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
    
    try {
      // Test CORS preflight
      const corsResponse = await fetch(url, { method: 'OPTIONS' });
      if (corsResponse.ok) {
        console.log(`✅ ${platform}: CORS preflight successful`);
        results.connectivity.passed++;
      } else {
        console.log(`❌ ${platform}: CORS preflight failed (${corsResponse.status})`);
        results.connectivity.failed++;
      }
      
      // Test method validation (should return 405 or similar for GET)
      try {
        const getResponse = await fetch(url, { method: 'GET' });
        if (getResponse.status === 405 || getResponse.status === 401) {
          console.log(`✅ ${platform}: Method validation working`);
          results.security.passed++;
        } else {
          console.log(`⚠️  ${platform}: Unexpected GET response (${getResponse.status})`);
          results.security.failed++;
        }
      } catch (error) {
        console.log(`⚠️  ${platform}: GET test error: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`❌ ${platform}: Connection failed - ${error.message}`);
      results.connectivity.failed++;
    }
  }

  // Test 2: Database Access (if we have service key)
  console.log('\n🗄️  Testing Database Access');
  console.log('-'.repeat(25));
  
  if (supabaseServiceKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Test webhook logs table access
      const { data: logs, error: logsError } = await supabase
        .from('ticket_webhook_logs')
        .select('count(*)')
        .limit(1);
      
      if (!logsError) {
        console.log('✅ Webhook logs table: Accessible');
        results.functionality.passed++;
      } else {
        console.log(`❌ Webhook logs table: ${logsError.message}`);
        results.functionality.failed++;
      }
      
      // Test ticket sales table access
      const { data: sales, error: salesError } = await supabase
        .from('ticket_sales')
        .select('count(*)')
        .limit(1);
      
      if (!salesError) {
        console.log('✅ Ticket sales table: Accessible');
        results.functionality.passed++;
      } else {
        console.log(`❌ Ticket sales table: ${salesError.message}`);
        results.functionality.failed++;
      }
      
      // Test ticket platforms table access
      const { data: platforms, error: platformsError } = await supabase
        .from('ticket_platforms')
        .select('count(*)')
        .limit(1);
      
      if (!platformsError) {
        console.log('✅ Ticket platforms table: Accessible');
        results.functionality.passed++;
      } else {
        console.log(`❌ Ticket platforms table: ${platformsError.message}`);
        results.functionality.failed++;
      }
      
    } catch (error) {
      console.log(`❌ Database connection failed: ${error.message}`);
      results.functionality.failed++;
    }
  } else {
    console.log('⚠️  No service key provided - skipping database tests');
  }

  // Test 3: Performance Metrics
  console.log('\n⚡ Testing Performance');
  console.log('-'.repeat(20));
  
  for (const platform of platforms) {
    const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
    const times = [];
    
    for (let i = 0; i < 5; i++) {
      try {
        const start = Date.now();
        await fetch(url, { method: 'OPTIONS' });
        const end = Date.now();
        times.push(end - start);
      } catch (error) {
        // Ignore errors for performance test
      }
    }
    
    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      if (avgTime < 1000) {
        console.log(`✅ ${platform}: ${avgTime.toFixed(2)}ms average response time`);
        results.performance.passed++;
      } else {
        console.log(`⚠️  ${platform}: ${avgTime.toFixed(2)}ms average response time (slow)`);
        results.performance.failed++;
      }
    } else {
      console.log(`❌ ${platform}: Performance test failed`);
      results.performance.failed++;
    }
  }

  // Test 4: Security Headers
  console.log('\n🔒 Testing Security Headers');
  console.log('-'.repeat(25));
  
  for (const platform of platforms) {
    const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
    
    try {
      const response = await fetch(url, { method: 'OPTIONS' });
      const headers = response.headers;
      
      let securityScore = 0;
      const securityHeaders = [
        'access-control-allow-origin',
        'access-control-allow-headers',
        'access-control-allow-methods',
        'strict-transport-security'
      ];
      
      securityHeaders.forEach(header => {
        if (headers.get(header)) {
          securityScore++;
        }
      });
      
      if (securityScore >= 3) {
        console.log(`✅ ${platform}: Security headers present (${securityScore}/${securityHeaders.length})`);
        results.security.passed++;
      } else {
        console.log(`⚠️  ${platform}: Missing security headers (${securityScore}/${securityHeaders.length})`);
        results.security.failed++;
      }
      
    } catch (error) {
      console.log(`❌ ${platform}: Security header test failed`);
      results.security.failed++;
    }
  }

  // Generate Report
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(15));
  
  const categories = Object.keys(results);
  let totalPassed = 0;
  let totalFailed = 0;
  
  categories.forEach(category => {
    const { passed, failed } = results[category];
    const total = passed + failed;
    const percentage = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    const status = percentage >= 80 ? '✅' : percentage >= 60 ? '⚠️' : '❌';
    
    console.log(`${status} ${category}: ${passed}/${total} passed (${percentage}%)`);
    totalPassed += passed;
    totalFailed += failed;
  });
  
  const overallPercentage = totalPassed + totalFailed > 0 ? 
    ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1) : 0;
  const overallStatus = overallPercentage >= 80 ? '✅' : 
                       overallPercentage >= 60 ? '⚠️' : '❌';
  
  console.log(`\n${overallStatus} OVERALL: ${totalPassed}/${totalPassed + totalFailed} tests passed (${overallPercentage}%)`);
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('-'.repeat(15));
  
  if (results.connectivity.failed > 0) {
    console.log('• Check network connectivity and DNS resolution');
  }
  
  if (results.functionality.failed > 0) {
    console.log('• Verify database permissions and table schemas');
  }
  
  if (results.security.failed > 0) {
    console.log('• Review security headers and authentication requirements');
  }
  
  if (results.performance.failed > 0) {
    console.log('• Investigate performance bottlenecks in webhook processing');
  }
  
  if (overallPercentage >= 80) {
    console.log('• ✅ Webhook system appears to be functioning well!');
    console.log('• Consider setting up monitoring alerts for production');
  } else {
    console.log('• ⚠️  Address failing tests before deploying to production');
  }
  
  // Save results
  const reportData = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      totalPassed,
      totalFailed,
      overallPercentage: parseFloat(overallPercentage),
      status: overallStatus
    }
  };
  
  try {
    const fs = require('fs');
    const reportPath = '/root/agents/quick-webhook-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
  } catch (error) {
    console.log(`⚠️  Could not save report: ${error.message}`);
  }
  
  return reportData;
}

// Polyfill fetch for Node.js environments that don't have it
if (typeof fetch === 'undefined') {
  global.fetch = async (url, options = {}) => {
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
        headers: options.headers || {}
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: {
              get: (name) => res.headers[name.toLowerCase()]
            },
            text: () => Promise.resolve(data),
            json: () => Promise.resolve(JSON.parse(data))
          });
        });
      });
      
      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  };
}

// Run tests if called directly
if (require.main === module) {
  runQuickTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runQuickTests };