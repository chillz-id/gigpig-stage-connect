#!/usr/bin/env node

/**
 * Comprehensive Webhook Testing Utility
 * Tests webhook endpoints for functionality, performance, and security
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test configurations
const TEST_CONFIG = {
  humanitix: {
    url: `${supabaseUrl}/functions/v1/humanitix-webhook`,
    secret: process.env.HUMANITIX_WEBHOOK_SECRET || 'test-secret-humanitix',
    signatureHeader: 'x-humanitix-signature',
    testPayloads: [
      {
        event_type: 'order.created',
        data: {
          event: {
            id: 'test-event-123',
            name: 'Comedy Night Test',
            date: '2025-01-15T19:00:00Z'
          },
          order: {
            id: 'test-order-456',
            status: 'paid',
            total_amount: 2500,
            currency: 'AUD',
            created_at: new Date().toISOString(),
            customer: {
              email: 'test@example.com',
              first_name: 'Test',
              last_name: 'Customer'
            },
            tickets: [
              {
                id: 'ticket-1',
                ticket_type_id: 'general',
                ticket_type_name: 'General Admission',
                quantity: 2,
                price: 1250
              }
            ]
          }
        },
        timestamp: new Date().toISOString()
      }
    ]
  },
  eventbrite: {
    url: `${supabaseUrl}/functions/v1/eventbrite-webhook`,
    secret: process.env.EVENTBRITE_WEBHOOK_SECRET || 'test-secret-eventbrite',
    signatureHeader: 'x-eventbrite-signature',
    testPayloads: [
      {
        config: {
          action: 'order.placed',
          user_id: 'test-user-123',
          endpoint_url: 'https://test.com/webhook',
          webhook_id: 'webhook-456'
        },
        api_url: 'https://www.eventbriteapi.com/v3/events/123456789/orders/987654321/'
      }
    ]
  }
};

class WebhookTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  log(type, test, message, details = null) {
    const timestamp = new Date().toISOString();
    const result = { timestamp, type, test, message, details };
    
    this.results.details.push(result);
    
    const icon = type === 'pass' ? '✅' : type === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} [${test}] ${message}`);
    
    if (details) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
    
    if (type === 'pass') this.results.passed++;
    else if (type === 'fail') this.results.failed++;
    else this.results.warnings++;
  }

  generateHumanitixSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  generateEventbriteSignature(url, secret) {
    // Eventbrite signature is typically endpoint URL + secret
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(url + secret);
    return hmac.digest('hex');
  }

  async testWebhookEndpoint(platform, config) {
    console.log(`\n🧪 Testing ${platform} webhook endpoint...`);
    
    // Test 1: Basic connectivity
    try {
      const response = await fetch(config.url, {
        method: 'OPTIONS'
      });
      
      if (response.ok) {
        this.log('pass', `${platform}-connectivity`, 'CORS preflight check passed');
      } else {
        this.log('fail', `${platform}-connectivity`, 'CORS preflight check failed', { status: response.status });
      }
    } catch (error) {
      this.log('fail', `${platform}-connectivity`, 'Endpoint not accessible', { error: error.message });
      return;
    }

    // Test 2: Method validation
    try {
      const response = await fetch(config.url, {
        method: 'GET'
      });
      
      if (response.status === 405) {
        this.log('pass', `${platform}-method-validation`, 'Correctly rejects non-POST methods');
      } else {
        this.log('warning', `${platform}-method-validation`, 'Unexpected response to GET request', { status: response.status });
      }
    } catch (error) {
      this.log('fail', `${platform}-method-validation`, 'Error testing method validation', { error: error.message });
    }

    // Test 3: Process valid payloads
    for (let i = 0; i < config.testPayloads.length; i++) {
      const payload = config.testPayloads[i];
      await this.testWebhookPayload(platform, config, payload, i + 1);
    }

    // Test 4: Invalid signature handling
    await this.testInvalidSignature(platform, config);

    // Test 5: Malformed payload handling
    await this.testMalformedPayload(platform, config);

    // Test 6: Performance test
    await this.testWebhookPerformance(platform, config);
  }

  async testWebhookPayload(platform, config, payload, testNumber) {
    try {
      const body = JSON.stringify(payload);
      const signature = platform === 'humanitix' 
        ? this.generateHumanitixSignature(payload, config.secret)
        : this.generateEventbriteSignature(config.url, config.secret);

      const headers = {
        'Content-Type': 'application/json',
        [config.signatureHeader]: signature
      };

      const startTime = Date.now();
      const response = await fetch(config.url, {
        method: 'POST',
        headers,
        body
      });
      const endTime = Date.now();

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      if (response.ok) {
        this.log('pass', `${platform}-payload-${testNumber}`, `Valid payload processed successfully`, {
          responseTime: `${endTime - startTime}ms`,
          response: responseData
        });
      } else {
        this.log('fail', `${platform}-payload-${testNumber}`, `Payload processing failed`, {
          status: response.status,
          response: responseData,
          responseTime: `${endTime - startTime}ms`
        });
      }
    } catch (error) {
      this.log('fail', `${platform}-payload-${testNumber}`, 'Error processing payload', { error: error.message });
    }
  }

  async testInvalidSignature(platform, config) {
    try {
      const payload = config.testPayloads[0];
      const body = JSON.stringify(payload);
      const invalidSignature = 'invalid-signature-12345';

      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [config.signatureHeader]: invalidSignature
        },
        body
      });

      if (response.status === 401) {
        this.log('pass', `${platform}-signature-validation`, 'Correctly rejects invalid signatures');
      } else {
        this.log('warning', `${platform}-signature-validation`, 'Unexpected response to invalid signature', { status: response.status });
      }
    } catch (error) {
      this.log('fail', `${platform}-signature-validation`, 'Error testing signature validation', { error: error.message });
    }
  }

  async testMalformedPayload(platform, config) {
    try {
      const malformedPayload = '{"invalid": json}';
      const signature = platform === 'humanitix' 
        ? this.generateHumanitixSignature({}, config.secret)
        : this.generateEventbriteSignature(config.url, config.secret);

      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [config.signatureHeader]: signature
        },
        body: malformedPayload
      });

      if (response.status >= 400) {
        this.log('pass', `${platform}-malformed-payload`, 'Correctly handles malformed payloads');
      } else {
        this.log('warning', `${platform}-malformed-payload`, 'Unexpected response to malformed payload', { status: response.status });
      }
    } catch (error) {
      this.log('fail', `${platform}-malformed-payload`, 'Error testing malformed payload', { error: error.message });
    }
  }

  async testWebhookPerformance(platform, config) {
    const payload = config.testPayloads[0];
    const body = JSON.stringify(payload);
    const signature = platform === 'humanitix' 
      ? this.generateHumanitixSignature(payload, config.secret)
      : this.generateEventbriteSignature(config.url, config.secret);

    const headers = {
      'Content-Type': 'application/json',
      [config.signatureHeader]: signature
    };

    const performanceResults = [];
    const testCount = 5;

    console.log(`\n⏱️  Running performance test (${testCount} requests)...`);

    for (let i = 0; i < testCount; i++) {
      try {
        const startTime = Date.now();
        const response = await fetch(config.url, {
          method: 'POST',
          headers,
          body
        });
        const endTime = Date.now();
        
        performanceResults.push({
          responseTime: endTime - startTime,
          status: response.status,
          success: response.ok
        });
      } catch (error) {
        performanceResults.push({
          responseTime: null,
          status: null,
          success: false,
          error: error.message
        });
      }
    }

    const successfulRequests = performanceResults.filter(r => r.success);
    const averageResponseTime = successfulRequests.length > 0 
      ? successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length
      : null;

    if (averageResponseTime !== null) {
      if (averageResponseTime < 1000) {
        this.log('pass', `${platform}-performance`, `Good performance: ${averageResponseTime.toFixed(2)}ms average`, {
          successful: successfulRequests.length,
          total: testCount,
          averageMs: averageResponseTime.toFixed(2)
        });
      } else if (averageResponseTime < 3000) {
        this.log('warning', `${platform}-performance`, `Acceptable performance: ${averageResponseTime.toFixed(2)}ms average`, {
          successful: successfulRequests.length,
          total: testCount,
          averageMs: averageResponseTime.toFixed(2)
        });
      } else {
        this.log('fail', `${platform}-performance`, `Poor performance: ${averageResponseTime.toFixed(2)}ms average`, {
          successful: successfulRequests.length,
          total: testCount,
          averageMs: averageResponseTime.toFixed(2)
        });
      }
    } else {
      this.log('fail', `${platform}-performance`, 'All performance test requests failed');
    }
  }

  async testDatabaseIntegration() {
    console.log('\n🗄️  Testing database integration...');
    
    try {
      // Test webhook logs table
      const { data: logs, error: logsError } = await supabase
        .from('ticket_webhook_logs')
        .select('*')
        .limit(1);

      if (logsError) {
        this.log('fail', 'database-webhook-logs', 'Cannot access webhook logs table', { error: logsError.message });
      } else {
        this.log('pass', 'database-webhook-logs', 'Webhook logs table accessible');
      }

      // Test ticket sales table
      const { data: sales, error: salesError } = await supabase
        .from('ticket_sales')
        .select('*')
        .limit(1);

      if (salesError) {
        this.log('fail', 'database-ticket-sales', 'Cannot access ticket sales table', { error: salesError.message });
      } else {
        this.log('pass', 'database-ticket-sales', 'Ticket sales table accessible');
      }

      // Test ticket platforms table
      const { data: platforms, error: platformsError } = await supabase
        .from('ticket_platforms')
        .select('*')
        .limit(1);

      if (platformsError) {
        this.log('fail', 'database-ticket-platforms', 'Cannot access ticket platforms table', { error: platformsError.message });
      } else {
        this.log('pass', 'database-ticket-platforms', 'Ticket platforms table accessible');
      }

    } catch (error) {
      this.log('fail', 'database-integration', 'Database integration test failed', { error: error.message });
    }
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive webhook testing...\n');
    
    // Test database integration first
    await this.testDatabaseIntegration();

    // Test each webhook platform
    for (const [platform, config] of Object.entries(TEST_CONFIG)) {
      await this.testWebhookEndpoint(platform, config);
    }

    // Generate summary report
    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 WEBHOOK TESTING SUMMARY');
    console.log('='40);
    console.log(`✅ Tests Passed: ${this.results.passed}`);
    console.log(`❌ Tests Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`📝 Total Tests: ${this.results.passed + this.results.failed + this.results.warnings}`);
    
    const successRate = (this.results.passed / (this.results.passed + this.results.failed)) * 100;
    console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.details
        .filter(detail => detail.type === 'fail')
        .forEach(detail => {
          console.log(`   • [${detail.test}] ${detail.message}`);
        });
    }

    if (this.results.warnings > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.details
        .filter(detail => detail.type === 'warning')
        .forEach(detail => {
          console.log(`   • [${detail.test}] ${detail.message}`);
        });
    }

    // Save detailed report
    const reportPath = '/root/agents/webhook-test-report.json';
    const fs = require('fs');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        successRate: successRate.toFixed(1) + '%'
      },
      details: this.results.details
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new WebhookTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

export { WebhookTester, TEST_CONFIG };