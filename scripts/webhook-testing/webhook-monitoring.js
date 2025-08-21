#!/usr/bin/env node

/**
 * Webhook Monitoring and Alerting System
 * Monitors webhook performance and detects failures
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class WebhookMonitor {
  constructor() {
    this.thresholds = {
      errorRate: 5, // 5% error rate threshold
      responseTime: 3000, // 3 second response time threshold
      inactivityPeriod: 3600000, // 1 hour in milliseconds
      deadLetterThreshold: 10 // Number of failed attempts before dead letter
    };
  }

  async getWebhookMetrics(platform = null, timeRange = '1 hour') {
    const timeRangeMap = {
      '1 hour': new Date(Date.now() - 60 * 60 * 1000),
      '6 hours': new Date(Date.now() - 6 * 60 * 60 * 1000),
      '24 hours': new Date(Date.now() - 24 * 60 * 60 * 1000),
      '7 days': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    };

    const since = timeRangeMap[timeRange] || timeRangeMap['1 hour'];
    
    let query = supabase
      .from('ticket_webhook_logs')
      .select('*')
      .gte('created_at', since.toISOString());

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data: logs, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch webhook logs: ${error.message}`);
    }

    return this.analyzeMetrics(logs, timeRange);
  }

  analyzeMetrics(logs, timeRange) {
    const total = logs.length;
    const successful = logs.filter(log => log.processed).length;
    const failed = logs.filter(log => !log.processed).length;
    const errorRate = total > 0 ? (failed / total) * 100 : 0;

    // Group by platform
    const byPlatform = logs.reduce((acc, log) => {
      if (!acc[log.platform]) {
        acc[log.platform] = { total: 0, successful: 0, failed: 0, eventTypes: {} };
      }
      acc[log.platform].total++;
      if (log.processed) {
        acc[log.platform].successful++;
      } else {
        acc[log.platform].failed++;
      }
      
      if (!acc[log.platform].eventTypes[log.event_type]) {
        acc[log.platform].eventTypes[log.event_type] = { total: 0, successful: 0, failed: 0 };
      }
      acc[log.platform].eventTypes[log.event_type].total++;
      if (log.processed) {
        acc[log.platform].eventTypes[log.event_type].successful++;
      } else {
        acc[log.platform].eventTypes[log.event_type].failed++;
      }
      
      return acc;
    }, {});

    // Calculate platform-specific error rates
    Object.keys(byPlatform).forEach(platform => {
      const platformData = byPlatform[platform];
      platformData.errorRate = platformData.total > 0 ? (platformData.failed / platformData.total) * 100 : 0;
      
      Object.keys(platformData.eventTypes).forEach(eventType => {
        const eventData = platformData.eventTypes[eventType];
        eventData.errorRate = eventData.total > 0 ? (eventData.failed / eventData.total) * 100 : 0;
      });
    });

    // Recent activity (last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentActivity = logs.filter(log => new Date(log.created_at) > thirtyMinutesAgo);

    // Failed webhooks needing attention
    const recentFailures = logs
      .filter(log => !log.processed && log.error_message)
      .slice(0, 10) // Latest 10 failures
      .map(log => ({
        platform: log.platform,
        eventType: log.event_type,
        timestamp: log.created_at,
        error: log.error_message,
        payload: log.payload
      }));

    return {
      summary: {
        timeRange,
        total,
        successful,
        failed,
        errorRate: parseFloat(errorRate.toFixed(2)),
        recentActivity: recentActivity.length
      },
      byPlatform,
      recentFailures,
      healthStatus: this.determineHealthStatus(errorRate, recentActivity.length, timeRange)
    };
  }

  determineHealthStatus(errorRate, recentActivity, timeRange) {
    if (errorRate > this.thresholds.errorRate) {
      return {
        status: 'critical',
        message: `Error rate (${errorRate.toFixed(1)}%) exceeds threshold (${this.thresholds.errorRate}%)`
      };
    }

    if (timeRange === '1 hour' && recentActivity === 0) {
      return {
        status: 'warning',
        message: 'No recent webhook activity detected'
      };
    }

    if (errorRate > this.thresholds.errorRate / 2) {
      return {
        status: 'warning',
        message: `Error rate (${errorRate.toFixed(1)}%) is elevated`
      };
    }

    return {
      status: 'healthy',
      message: 'All systems operating normally'
    };
  }

  async checkWebhookHealth() {
    console.log('🏥 Checking webhook health status...\n');

    const metrics = await this.getWebhookMetrics();
    
    this.printHealthReport(metrics);
    
    return metrics;
  }

  printHealthReport(metrics) {
    const { summary, byPlatform, recentFailures, healthStatus } = metrics;
    
    // Overall health status
    const statusIcon = healthStatus.status === 'healthy' ? '✅' : 
                      healthStatus.status === 'warning' ? '⚠️' : '❌';
    
    console.log(`${statusIcon} WEBHOOK HEALTH STATUS: ${healthStatus.status.toUpperCase()}`);
    console.log(`   ${healthStatus.message}\n`);

    // Summary metrics
    console.log('📊 WEBHOOK METRICS (Last Hour)');
    console.log('='.repeat(40));
    console.log(`Total Requests: ${summary.total}`);
    console.log(`Successful: ${summary.successful} (${summary.total > 0 ? ((summary.successful / summary.total) * 100).toFixed(1) : 0}%)`);
    console.log(`Failed: ${summary.failed} (${summary.errorRate}%)`);
    console.log(`Recent Activity: ${summary.recentActivity} requests (last 30 min)`);

    // Platform breakdown
    console.log('\n🔍 PLATFORM BREAKDOWN');
    console.log('='.repeat(40));
    Object.entries(byPlatform).forEach(([platform, data]) => {
      const platformIcon = data.errorRate > this.thresholds.errorRate ? '❌' : 
                          data.errorRate > this.thresholds.errorRate / 2 ? '⚠️' : '✅';
      
      console.log(`${platformIcon} ${platform.toUpperCase()}`);
      console.log(`   Total: ${data.total} | Success: ${data.successful} | Failed: ${data.failed} (${data.errorRate.toFixed(1)}%)`);
      
      // Event type breakdown
      Object.entries(data.eventTypes).forEach(([eventType, eventData]) => {
        if (eventData.failed > 0) {
          console.log(`     └─ ${eventType}: ${eventData.failed}/${eventData.total} failed (${eventData.errorRate.toFixed(1)}%)`);
        }
      });
    });

    // Recent failures
    if (recentFailures.length > 0) {
      console.log('\n🚨 RECENT FAILURES');
      console.log('='.repeat(40));
      recentFailures.forEach((failure, index) => {
        console.log(`${index + 1}. [${failure.platform}] ${failure.eventType}`);
        console.log(`   Time: ${new Date(failure.timestamp).toLocaleString()}`);
        console.log(`   Error: ${failure.error}`);
        console.log();
      });
    }
  }

  async detectAnomalies() {
    console.log('🔍 Detecting webhook anomalies...\n');

    const currentMetrics = await this.getWebhookMetrics(null, '1 hour');
    const previousMetrics = await this.getWebhookMetrics(null, '6 hours');

    const anomalies = [];

    // Check for sudden increase in error rate
    Object.keys(currentMetrics.byPlatform).forEach(platform => {
      const current = currentMetrics.byPlatform[platform];
      const previous = previousMetrics.byPlatform[platform];

      if (previous && current.errorRate > previous.errorRate * 2 && current.errorRate > 5) {
        anomalies.push({
          type: 'error_rate_spike',
          platform,
          message: `Error rate increased from ${previous.errorRate.toFixed(1)}% to ${current.errorRate.toFixed(1)}%`,
          severity: 'high'
        });
      }
    });

    // Check for missing platforms (no recent activity)
    const expectedPlatforms = ['humanitix', 'eventbrite'];
    expectedPlatforms.forEach(platform => {
      if (!currentMetrics.byPlatform[platform] || currentMetrics.byPlatform[platform].total === 0) {
        anomalies.push({
          type: 'no_activity',
          platform,
          message: `No webhook activity detected for ${platform} in the last hour`,
          severity: 'medium'
        });
      }
    });

    // Check for specific event type failures
    Object.entries(currentMetrics.byPlatform).forEach(([platform, data]) => {
      Object.entries(data.eventTypes).forEach(([eventType, eventData]) => {
        if (eventData.errorRate > 50 && eventData.total > 5) {
          anomalies.push({
            type: 'event_type_failure',
            platform,
            eventType,
            message: `High failure rate for ${eventType}: ${eventData.errorRate.toFixed(1)}% (${eventData.failed}/${eventData.total})`,
            severity: 'high'
          });
        }
      });
    });

    if (anomalies.length > 0) {
      console.log('🚨 ANOMALIES DETECTED');
      console.log('='.repeat(40));
      anomalies.forEach((anomaly, index) => {
        const severityIcon = anomaly.severity === 'high' ? '🔴' : '🟡';
        console.log(`${severityIcon} ${index + 1}. ${anomaly.type.replace('_', ' ').toUpperCase()}`);
        console.log(`   Platform: ${anomaly.platform}`);
        if (anomaly.eventType) console.log(`   Event Type: ${anomaly.eventType}`);
        console.log(`   Message: ${anomaly.message}`);
        console.log(`   Severity: ${anomaly.severity}`);
        console.log();
      });
    } else {
      console.log('✅ No anomalies detected');
    }

    return anomalies;
  }

  async setupDeadLetterQueue() {
    console.log('🗃️  Setting up dead letter queue for failed webhooks...\n');

    // Find webhooks that have failed multiple times
    const { data: failedWebhooks, error } = await supabase
      .from('ticket_webhook_logs')
      .select('platform, event_type, payload, error_message, created_at')
      .eq('processed', false)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch failed webhooks:', error.message);
      return;
    }

    // Group by payload signature to detect retries
    const groupedFailures = failedWebhooks.reduce((acc, webhook) => {
      const signature = `${webhook.platform}-${webhook.event_type}-${JSON.stringify(webhook.payload).slice(0, 100)}`;
      if (!acc[signature]) {
        acc[signature] = [];
      }
      acc[signature].push(webhook);
      return acc;
    }, {});

    const deadLetterItems = [];
    Object.entries(groupedFailures).forEach(([signature, webhooks]) => {
      if (webhooks.length >= this.thresholds.deadLetterThreshold) {
        deadLetterItems.push({
          signature,
          failureCount: webhooks.length,
          firstFailure: webhooks[webhooks.length - 1].created_at,
          lastFailure: webhooks[0].created_at,
          platform: webhooks[0].platform,
          eventType: webhooks[0].event_type,
          lastError: webhooks[0].error_message,
          payload: webhooks[0].payload
        });
      }
    });

    if (deadLetterItems.length > 0) {
      console.log(`🗃️  Found ${deadLetterItems.length} items for dead letter queue:`);
      deadLetterItems.forEach((item, index) => {
        console.log(`${index + 1}. [${item.platform}] ${item.eventType}`);
        console.log(`   Failures: ${item.failureCount}`);
        console.log(`   First/Last: ${new Date(item.firstFailure).toLocaleString()} - ${new Date(item.lastFailure).toLocaleString()}`);
        console.log(`   Last Error: ${item.lastError}`);
        console.log();
      });

      // Save to dead letter queue (this could be a separate table or file)
      const deadLetterReport = {
        timestamp: new Date().toISOString(),
        items: deadLetterItems,
        summary: {
          totalItems: deadLetterItems.length,
          platforms: [...new Set(deadLetterItems.map(item => item.platform))],
          eventTypes: [...new Set(deadLetterItems.map(item => item.eventType))]
        }
      };

      const fs = require('fs');
      const reportPath = `/root/agents/dead-letter-queue-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(deadLetterReport, null, 2));
      console.log(`📄 Dead letter queue report saved to: ${reportPath}`);
    } else {
      console.log('✅ No items found for dead letter queue');
    }

    return deadLetterItems;
  }

  async generateDashboard() {
    console.log('📈 Generating webhook monitoring dashboard...\n');

    const metrics = await this.getWebhookMetrics(null, '24 hours');
    const anomalies = await this.detectAnomalies();
    const deadLetterItems = await this.setupDeadLetterQueue();

    const dashboard = {
      timestamp: new Date().toISOString(),
      health: metrics.healthStatus,
      metrics: metrics.summary,
      platforms: metrics.byPlatform,
      anomalies,
      deadLetterQueue: {
        itemCount: deadLetterItems.length,
        items: deadLetterItems.slice(0, 5) // Top 5 for dashboard
      },
      recommendations: this.generateRecommendations(metrics, anomalies)
    };

    // Save dashboard data
    const fs = require('fs');
    const dashboardPath = '/root/agents/webhook-dashboard.json';
    fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));

    console.log(`📊 Dashboard data saved to: ${dashboardPath}`);
    console.log('\n📈 WEBHOOK MONITORING SUMMARY');
    console.log('='.repeat(50));
    console.log(`Overall Health: ${dashboard.health.status.toUpperCase()}`);
    console.log(`Total Requests (24h): ${dashboard.metrics.total}`);
    console.log(`Error Rate: ${dashboard.metrics.errorRate}%`);
    console.log(`Active Platforms: ${Object.keys(dashboard.platforms).length}`);
    console.log(`Anomalies Detected: ${dashboard.anomalies.length}`);
    console.log(`Dead Letter Items: ${dashboard.deadLetterQueue.itemCount}`);

    return dashboard;
  }

  generateRecommendations(metrics, anomalies) {
    const recommendations = [];

    if (metrics.summary.errorRate > this.thresholds.errorRate) {
      recommendations.push({
        priority: 'high',
        category: 'reliability',
        message: 'Implement exponential backoff and retry logic for failed webhooks'
      });
    }

    if (anomalies.some(a => a.type === 'no_activity')) {
      recommendations.push({
        priority: 'medium',
        category: 'monitoring',
        message: 'Set up heartbeat monitoring to detect inactive webhook endpoints'
      });
    }

    if (metrics.summary.total > 1000) {
      recommendations.push({
        priority: 'low',
        category: 'performance',
        message: 'Consider implementing webhook batching for high-volume events'
      });
    }

    if (Object.keys(metrics.byPlatform).some(platform => 
         metrics.byPlatform[platform].errorRate > 10)) {
      recommendations.push({
        priority: 'high',
        category: 'integration',
        message: 'Review platform-specific webhook implementations for high error rates'
      });
    }

    return recommendations;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new WebhookMonitor();
  const command = process.argv[2] || 'health';

  switch (command) {
    case 'health':
      monitor.checkWebhookHealth().catch(console.error);
      break;
    case 'anomalies':
      monitor.detectAnomalies().catch(console.error);
      break;
    case 'dashboard':
      monitor.generateDashboard().catch(console.error);
      break;
    case 'dead-letter':
      monitor.setupDeadLetterQueue().catch(console.error);
      break;
    default:
      console.log('Usage: node webhook-monitoring.js [health|anomalies|dashboard|dead-letter]');
  }
}

export { WebhookMonitor };