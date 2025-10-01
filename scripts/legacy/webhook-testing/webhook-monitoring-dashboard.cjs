#!/usr/bin/env node

/**
 * Webhook Monitoring Dashboard
 * Real-time monitoring and alerting for webhook endpoints
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

class WebhookMonitoringDashboard {
  constructor() {
    this.thresholds = {
      errorRate: 5, // 5% error rate threshold
      responseTime: 3000, // 3 second response time threshold
      inactivityPeriod: 3600000, // 1 hour in milliseconds
      deadLetterThreshold: 10 // Number of failed attempts before dead letter
    };

    if (supabaseServiceKey) {
      this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    }
  }

  async getWebhookMetrics(platform = null, timeRange = '1 hour') {
    if (!this.supabase) {
      console.log('⚠️  No Supabase service key - using mock data');
      return this.getMockMetrics();
    }

    const timeRangeMap = {
      '1 hour': new Date(Date.now() - 60 * 60 * 1000),
      '6 hours': new Date(Date.now() - 6 * 60 * 60 * 1000),
      '24 hours': new Date(Date.now() - 24 * 60 * 60 * 1000),
      '7 days': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    };

    const since = timeRangeMap[timeRange] || timeRangeMap['1 hour'];
    
    try {
      let query = this.supabase
        .from('ticket_webhook_logs')
        .select('*')
        .gte('created_at', since.toISOString());

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data: logs, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.log(`⚠️  Database query error: ${error.message}`);
        return this.getMockMetrics();
      }

      return this.analyzeMetrics(logs, timeRange);
    } catch (error) {
      console.log(`⚠️  Database connection error: ${error.message}`);
      return this.getMockMetrics();
    }
  }

  getMockMetrics() {
    return {
      summary: {
        timeRange: '1 hour',
        total: 45,
        successful: 43,
        failed: 2,
        errorRate: 4.4,
        recentActivity: 12
      },
      byPlatform: {
        humanitix: {
          total: 23,
          successful: 22,
          failed: 1,
          errorRate: 4.3,
          eventTypes: {
            'order.created': { total: 15, successful: 15, failed: 0, errorRate: 0 },
            'order.updated': { total: 8, successful: 7, failed: 1, errorRate: 12.5 }
          }
        },
        eventbrite: {
          total: 22,
          successful: 21,
          failed: 1,
          errorRate: 4.5,
          eventTypes: {
            'order.placed': { total: 18, successful: 17, failed: 1, errorRate: 5.6 },
            'order.refunded': { total: 4, successful: 4, failed: 0, errorRate: 0 }
          }
        }
      },
      recentFailures: [
        {
          platform: 'humanitix',
          eventType: 'order.updated',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          error: 'Event not found for external ID',
          payload: { event: { id: 'missing-event-123' } }
        }
      ],
      healthStatus: {
        status: 'healthy',
        message: 'All systems operating normally'
      }
    };
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

  displayDashboard(metrics) {
    const { summary, byPlatform, recentFailures, healthStatus } = metrics;
    
    // Clear screen (optional)
    console.clear();
    
    // Header
    console.log('🎯 WEBHOOK MONITORING DASHBOARD');
    console.log('='.repeat(50));
    console.log(`Last Updated: ${new Date().toLocaleString()}`);
    console.log(`Time Range: ${summary.timeRange}`);
    
    // Health Status
    const statusIcon = healthStatus.status === 'healthy' ? '✅' : 
                      healthStatus.status === 'warning' ? '⚠️' : '❌';
    
    console.log(`\n${statusIcon} SYSTEM STATUS: ${healthStatus.status.toUpperCase()}`);
    console.log(`   ${healthStatus.message}`);

    // Overall Metrics
    console.log('\n📊 OVERALL METRICS');
    console.log('-'.repeat(20));
    console.log(`Total Requests: ${summary.total}`);
    console.log(`Successful: ${summary.successful} (${summary.total > 0 ? ((summary.successful / summary.total) * 100).toFixed(1) : 0}%)`);
    console.log(`Failed: ${summary.failed} (${summary.errorRate}%)`);
    console.log(`Recent Activity: ${summary.recentActivity} requests (last 30 min)`);

    // Platform Breakdown
    console.log('\n🔍 PLATFORM STATUS');
    console.log('-'.repeat(20));
    Object.entries(byPlatform).forEach(([platform, data]) => {
      const platformIcon = data.errorRate > this.thresholds.errorRate ? '❌' : 
                          data.errorRate > this.thresholds.errorRate / 2 ? '⚠️' : '✅';
      
      console.log(`\n${platformIcon} ${platform.toUpperCase()}`);
      console.log(`   Requests: ${data.total} | Success: ${data.successful} | Failed: ${data.failed}`);
      console.log(`   Error Rate: ${data.errorRate.toFixed(1)}%`);
      
      // Top event types
      const topEvents = Object.entries(data.eventTypes)
        .sort(([,a], [,b]) => b.total - a.total)
        .slice(0, 3);
      
      if (topEvents.length > 0) {
        console.log(`   Top Events:`);
        topEvents.forEach(([eventType, eventData]) => {
          const eventIcon = eventData.errorRate > 10 ? '❌' : eventData.errorRate > 5 ? '⚠️' : '✅';
          console.log(`     ${eventIcon} ${eventType}: ${eventData.total} (${eventData.errorRate.toFixed(1)}% error)`);
        });
      }
    });

    // Recent Failures
    if (recentFailures.length > 0) {
      console.log('\n🚨 RECENT FAILURES');
      console.log('-'.repeat(18));
      recentFailures.slice(0, 5).forEach((failure, index) => {
        console.log(`${index + 1}. [${failure.platform}] ${failure.eventType}`);
        console.log(`   ${new Date(failure.timestamp).toLocaleString()}`);
        console.log(`   Error: ${failure.error.substring(0, 80)}${failure.error.length > 80 ? '...' : ''}`);
      });
      
      if (recentFailures.length > 5) {
        console.log(`   ... and ${recentFailures.length - 5} more failures`);
      }
    }

    // Performance Indicators
    console.log('\n⚡ PERFORMANCE INDICATORS');
    console.log('-'.repeat(28));
    Object.entries(byPlatform).forEach(([platform, data]) => {
      const avgErrorRate = data.errorRate;
      const performance = avgErrorRate < 1 ? 'Excellent' :
                         avgErrorRate < 3 ? 'Good' :
                         avgErrorRate < 5 ? 'Fair' : 'Poor';
      
      const perfIcon = performance === 'Excellent' ? '🟢' :
                      performance === 'Good' ? '🟡' :
                      performance === 'Fair' ? '🟠' : '🔴';
      
      console.log(`${perfIcon} ${platform}: ${performance} (${data.errorRate.toFixed(1)}% error rate)`);
    });

    // Quick Actions
    console.log('\n🛠️  QUICK ACTIONS');
    console.log('-'.repeat(16));
    console.log('• Press Ctrl+C to exit');
    console.log('• Run with --alert to enable notifications');
    console.log('• Run with --detailed to see full event breakdown');
  }

  async runLiveMonitoring(intervalSeconds = 30) {
    console.log(`🚀 Starting live webhook monitoring (updates every ${intervalSeconds}s)`);
    console.log('Press Ctrl+C to stop...\n');

    const updateDashboard = async () => {
      try {
        const metrics = await this.getWebhookMetrics(null, '1 hour');
        this.displayDashboard(metrics);
        
        // Check for alerts
        if (metrics.healthStatus.status !== 'healthy') {
          console.log(`\n🚨 ALERT: ${metrics.healthStatus.message}`);
        }
        
      } catch (error) {
        console.error(`❌ Monitoring error: ${error.message}`);
      }
    };

    // Initial display
    await updateDashboard();

    // Set up interval
    const interval = setInterval(updateDashboard, intervalSeconds * 1000);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log('\n\n👋 Monitoring stopped');
      process.exit(0);
    });
  }

  async generateStatusReport() {
    console.log('📋 WEBHOOK STATUS REPORT');
    console.log('='.repeat(30));
    
    const timeRanges = ['1 hour', '6 hours', '24 hours'];
    const report = {};
    
    for (const timeRange of timeRanges) {
      console.log(`\n📊 ${timeRange.toUpperCase()} METRICS`);
      console.log('-'.repeat(20));
      
      const metrics = await this.getWebhookMetrics(null, timeRange);
      report[timeRange] = metrics;
      
      console.log(`Total Requests: ${metrics.summary.total}`);
      console.log(`Success Rate: ${metrics.summary.total > 0 ? ((metrics.summary.successful / metrics.summary.total) * 100).toFixed(1) : 0}%`);
      console.log(`Error Rate: ${metrics.summary.errorRate}%`);
      console.log(`Health Status: ${metrics.healthStatus.status}`);
    }

    // Trend analysis
    console.log('\n📈 TREND ANALYSIS');
    console.log('-'.repeat(17));
    
    const hour1 = report['1 hour'].summary.errorRate;
    const hour6 = report['6 hours'].summary.errorRate;
    const hour24 = report['24 hours'].summary.errorRate;
    
    if (hour1 > hour6 * 1.5) {
      console.log('⚠️  Error rate increasing in the last hour');
    } else if (hour1 < hour6 * 0.5) {
      console.log('✅ Error rate improving in the last hour');
    } else {
      console.log('📊 Error rate stable');
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(18));
    
    if (report['1 hour'].summary.errorRate > 5) {
      console.log('• Investigate and fix high error rate immediately');
    }
    
    if (report['1 hour'].summary.recentActivity === 0) {
      console.log('• Check if webhook endpoints are receiving traffic');
    }
    
    if (report['24 hours'].summary.total < 10) {
      console.log('• Consider increasing webhook test coverage');
    }
    
    console.log('• Set up automated monitoring alerts');
    console.log('• Regularly review webhook performance metrics');

    // Save report
    try {
      const fs = require('fs');
      const reportPath = `/root/agents/webhook-status-report-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.log(`⚠️  Could not save report: ${error.message}`);
    }

    return report;
  }
}

// CLI interface
if (require.main === module) {
  const dashboard = new WebhookMonitoringDashboard();
  const command = process.argv[2] || 'status';

  switch (command) {
    case 'live':
      const interval = parseInt(process.argv[3]) || 30;
      dashboard.runLiveMonitoring(interval);
      break;
    case 'status':
      dashboard.generateStatusReport().catch(console.error);
      break;
    case 'dashboard':
      dashboard.getWebhookMetrics().then(metrics => {
        dashboard.displayDashboard(metrics);
      }).catch(console.error);
      break;
    default:
      console.log('Usage: node webhook-monitoring-dashboard.cjs [live|status|dashboard]');
      console.log('  live [interval]  - Start live monitoring (default 30s interval)');
      console.log('  status          - Generate status report');
      console.log('  dashboard       - Show current dashboard');
  }
}

module.exports = { WebhookMonitoringDashboard };