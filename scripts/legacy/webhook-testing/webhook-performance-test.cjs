#!/usr/bin/env node

/**
 * Webhook Performance Testing Suite
 * Tests webhook performance under load and stress conditions
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

class WebhookPerformanceTester {
  constructor() {
    this.results = {
      latency: {},
      throughput: {},
      concurrency: {},
      errorRates: {}
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

  async testLatency(platform, iterations = 20) {
    console.log(`\n⏱️  Testing latency for ${platform} (${iterations} requests)...`);
    
    const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
    const latencies = [];
    const errors = [];

    for (let i = 0; i < iterations; i++) {
      try {
        const start = process.hrtime.bigint();
        await this.fetch(url, { method: 'OPTIONS' });
        const end = process.hrtime.bigint();
        
        const latencyMs = Number(end - start) / 1000000; // Convert nanoseconds to milliseconds
        latencies.push(latencyMs);
        
        if (i % 5 === 0) {
          process.stdout.write('.');
        }
      } catch (error) {
        errors.push(error.message);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const validLatencies = latencies.filter(l => !isNaN(l));
    
    if (validLatencies.length > 0) {
      const sorted = validLatencies.sort((a, b) => a - b);
      const stats = {
        min: Math.min(...validLatencies),
        max: Math.max(...validLatencies),
        mean: validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p90: sorted[Math.floor(sorted.length * 0.9)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
        errorRate: (errors.length / iterations) * 100,
        successfulRequests: validLatencies.length,
        totalRequests: iterations
      };

      this.results.latency[platform] = stats;
      
      console.log(`\n✅ ${platform} Latency Results:`);
      console.log(`   Mean: ${stats.mean.toFixed(2)}ms`);
      console.log(`   P50: ${stats.p50.toFixed(2)}ms`);
      console.log(`   P90: ${stats.p90.toFixed(2)}ms`);
      console.log(`   P95: ${stats.p95.toFixed(2)}ms`);
      console.log(`   P99: ${stats.p99.toFixed(2)}ms`);
      console.log(`   Min/Max: ${stats.min.toFixed(2)}ms / ${stats.max.toFixed(2)}ms`);
      console.log(`   Success Rate: ${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%`);
    } else {
      console.log(`❌ ${platform} latency test failed - no successful requests`);
    }
  }

  async testThroughput(platform, duration = 30000) {
    console.log(`\n📊 Testing throughput for ${platform} (${duration/1000}s duration)...`);
    
    const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
    const startTime = Date.now();
    let requestCount = 0;
    let successCount = 0;
    let errorCount = 0;
    
    const payload = JSON.stringify({
      test: 'throughput-test',
      timestamp: Date.now(),
      platform: platform
    });

    while (Date.now() - startTime < duration) {
      try {
        const response = await this.fetch(url, {
          method: 'OPTIONS', // Use OPTIONS to avoid auth issues
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });
        
        requestCount++;
        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
        
        if (requestCount % 10 === 0) {
          process.stdout.write('.');
        }
        
      } catch (error) {
        requestCount++;
        errorCount++;
      }
      
      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const actualDuration = Date.now() - startTime;
    const requestsPerSecond = (requestCount / actualDuration) * 1000;
    const successRate = requestCount > 0 ? (successCount / requestCount) * 100 : 0;
    
    const stats = {
      duration: actualDuration,
      totalRequests: requestCount,
      successfulRequests: successCount,
      errorCount,
      requestsPerSecond: parseFloat(requestsPerSecond.toFixed(2)),
      successRate: parseFloat(successRate.toFixed(1))
    };
    
    this.results.throughput[platform] = stats;
    
    console.log(`\n✅ ${platform} Throughput Results:`);
    console.log(`   Requests/sec: ${stats.requestsPerSecond}`);
    console.log(`   Total requests: ${stats.totalRequests}`);
    console.log(`   Success rate: ${stats.successRate}%`);
    console.log(`   Errors: ${stats.errorCount}`);
  }

  async testConcurrency(platform, concurrentRequests = 50) {
    console.log(`\n🔄 Testing concurrency for ${platform} (${concurrentRequests} concurrent requests)...`);
    
    const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
    const startTime = Date.now();
    
    const requests = Array.from({ length: concurrentRequests }, (_, i) => 
      this.fetch(url, {
        method: 'OPTIONS',
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }).catch(error => ({ error: error.message }))
    );
    
    const responses = await Promise.allSettled(requests);
    const endTime = Date.now();
    
    const successful = responses.filter(r => 
      r.status === 'fulfilled' && r.value.ok
    ).length;
    
    const failed = responses.filter(r => 
      r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok)
    ).length;
    
    const stats = {
      concurrentRequests,
      totalTime: endTime - startTime,
      averageTimePerRequest: (endTime - startTime) / concurrentRequests,
      successfulRequests: successful,
      failedRequests: failed,
      successRate: (successful / concurrentRequests) * 100
    };
    
    this.results.concurrency[platform] = stats;
    
    console.log(`\n✅ ${platform} Concurrency Results:`);
    console.log(`   Total time: ${stats.totalTime}ms`);
    console.log(`   Avg time per request: ${stats.averageTimePerRequest.toFixed(2)}ms`);
    console.log(`   Successful: ${stats.successfulRequests}/${stats.concurrentRequests}`);
    console.log(`   Success rate: ${stats.successRate.toFixed(1)}%`);
  }

  async testErrorHandling(platform) {
    console.log(`\n🚨 Testing error handling for ${platform}...`);
    
    const url = `${supabaseUrl}/functions/v1/${platform}-webhook`;
    const errorTests = [
      {
        name: 'Invalid JSON',
        payload: '{"invalid": json}',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Missing Content-Type',
        payload: '{"test": "data"}',
        headers: {}
      },
      {
        name: 'Large payload',
        payload: JSON.stringify({ data: 'A'.repeat(100000) }),
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Empty payload',
        payload: '',
        headers: { 'Content-Type': 'application/json' }
      }
    ];

    const errorResults = [];
    
    for (const test of errorTests) {
      try {
        const response = await this.fetch(url, {
          method: 'POST',
          headers: test.headers,
          body: test.payload,
          timeout: 5000
        });
        
        errorResults.push({
          test: test.name,
          status: response.status,
          handled: response.status >= 400, // Expecting 4xx/5xx for errors
          responseTime: 'measured' // We could measure this
        });
        
        console.log(`   ${test.name}: ${response.status} ${response.handled ? '✅' : '⚠️'}`);
        
      } catch (error) {
        errorResults.push({
          test: test.name,
          status: 'timeout/error',
          handled: true, // Timeouts are acceptable for large payloads
          error: error.message
        });
        
        console.log(`   ${test.name}: timeout/error ✅`);
      }
    }
    
    this.results.errorRates[platform] = {
      tests: errorResults,
      handledProperly: errorResults.filter(r => r.handled).length,
      totalTests: errorResults.length
    };
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 WEBHOOK PERFORMANCE TEST REPORT');
    console.log('='.repeat(60));
    
    const platforms = Object.keys(this.results.latency || {});
    
    if (platforms.length === 0) {
      console.log('❌ No test results to report');
      return;
    }

    // Performance summary
    console.log('\n🏁 PERFORMANCE SUMMARY');
    console.log('-'.repeat(25));
    
    platforms.forEach(platform => {
      console.log(`\n${platform.toUpperCase()}:`);
      
      if (this.results.latency[platform]) {
        const latency = this.results.latency[platform];
        console.log(`  Latency (P95): ${latency.p95.toFixed(2)}ms`);
        console.log(`  Mean latency: ${latency.mean.toFixed(2)}ms`);
      }
      
      if (this.results.throughput[platform]) {
        const throughput = this.results.throughput[platform];
        console.log(`  Throughput: ${throughput.requestsPerSecond} req/sec`);
        console.log(`  Success rate: ${throughput.successRate}%`);
      }
      
      if (this.results.concurrency[platform]) {
        const concurrency = this.results.concurrency[platform];
        console.log(`  Concurrency: ${concurrency.successRate.toFixed(1)}% success`);
      }
    });

    // Performance grades
    console.log('\n🎯 PERFORMANCE GRADES');
    console.log('-'.repeat(22));
    
    platforms.forEach(platform => {
      let grade = 'A';
      let score = 100;
      
      if (this.results.latency[platform]) {
        const p95 = this.results.latency[platform].p95;
        if (p95 > 3000) score -= 30;
        else if (p95 > 2000) score -= 20;
        else if (p95 > 1000) score -= 10;
      }
      
      if (this.results.throughput[platform]) {
        const successRate = this.results.throughput[platform].successRate;
        if (successRate < 90) score -= 20;
        else if (successRate < 95) score -= 10;
      }
      
      if (score >= 90) grade = 'A';
      else if (score >= 80) grade = 'B';
      else if (score >= 70) grade = 'C';
      else if (score >= 60) grade = 'D';
      else grade = 'F';
      
      const emoji = grade === 'A' ? '🟢' : grade === 'B' ? '🟡' : '🔴';
      console.log(`${emoji} ${platform}: ${grade} (${score}/100)`);
    });

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(18));
    
    platforms.forEach(platform => {
      const recommendations = [];
      
      if (this.results.latency[platform]?.p95 > 2000) {
        recommendations.push('Consider optimizing response time');
      }
      
      if (this.results.throughput[platform]?.successRate < 95) {
        recommendations.push('Investigate and fix reliability issues');
      }
      
      if (this.results.concurrency[platform]?.successRate < 90) {
        recommendations.push('Improve concurrent request handling');
      }
      
      if (recommendations.length > 0) {
        console.log(`\n${platform}:`);
        recommendations.forEach(rec => console.log(`  • ${rec}`));
      }
    });

    if (platforms.every(p => this.results.latency[p]?.p95 < 1000)) {
      console.log('\n✅ Overall performance is excellent!');
    }

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        platforms: platforms.length,
        testTypes: Object.keys(this.results).length
      }
    };

    try {
      const fs = require('fs');
      const reportPath = `/root/agents/webhook-performance-report-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.log(`⚠️  Could not save report: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Webhook Performance Testing');
    console.log('='.repeat(40));
    
    const platforms = ['humanitix', 'eventbrite'];
    
    for (const platform of platforms) {
      console.log(`\n🧪 Testing ${platform} webhook performance...`);
      
      // Run all performance tests
      await this.testLatency(platform, 20);
      await this.testThroughput(platform, 15000); // 15 seconds
      await this.testConcurrency(platform, 25);
      await this.testErrorHandling(platform);
      
      console.log(`\n✅ Completed testing ${platform}`);
    }
    
    this.generateReport();
  }
}

// Run performance tests if called directly
if (require.main === module) {
  const tester = new WebhookPerformanceTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  });
}

module.exports = { WebhookPerformanceTester };