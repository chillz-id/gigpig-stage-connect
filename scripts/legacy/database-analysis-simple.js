#!/usr/bin/env node

/**
 * Stand Up Sydney Database Analysis - Simple Version
 * Direct queries to analyze current database structure
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/etc/standup-sydney/credentials.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function analyzeDatabase() {
  console.log('🎭 Stand Up Sydney Database Analysis');
  console.log('====================================\n');

  // Core tables we know exist from migrations
  const coreTables = [
    'profiles', 'user_roles', 'events', 'applications', 'vouches', 
    'notifications', 'messages', 'invoices', 'invoice_items', 'invoice_recipients',
    'invoice_payments', 'spot_assignments', 'spot_confirmations', 'tasks',
    'ticket_sales', 'agencies', 'customer_analytics', 'customers'
  ];

  console.log('📊 ANALYZING CORE TABLES');
  console.log('-------------------------');

  const existingTables = [];
  const tableStats = [];

  // Test each table for existence and get basic stats
  for (const table of coreTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || 0} rows`);
        existingTables.push(table);
        tableStats.push({ table, count: count || 0 });
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }

  // Sort by row count to identify high-traffic tables
  tableStats.sort((a, b) => b.count - a.count);

  console.log('\n📈 TABLE PRIORITIZATION (by row count)');
  console.log('--------------------------------------');
  
  const highPriorityTables = [];
  const mediumPriorityTables = [];
  const lowPriorityTables = [];

  tableStats.forEach(({ table, count }) => {
    if (count > 100) {
      highPriorityTables.push(table);
      console.log(`🔥 HIGH: ${table} (${count} rows)`);
    } else if (count > 10) {
      mediumPriorityTables.push(table);
      console.log(`📊 MEDIUM: ${table} (${count} rows)`);
    } else {
      lowPriorityTables.push(table);
      console.log(`📝 LOW: ${table} (${count} rows)`);
    }
  });

  // Analyze table structures for key tables
  console.log('\n🔍 ANALYZING KEY TABLE STRUCTURES');
  console.log('----------------------------------');

  const keyTables = ['profiles', 'events', 'applications', 'vouches', 'invoices', 'notifications'];
  
  for (const tableName of keyTables) {
    if (existingTables.includes(tableName)) {
      try {
        // Get a sample record to understand structure
        const { data: sample, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!error && sample && sample.length > 0) {
          const columns = Object.keys(sample[0]);
          console.log(`\n📋 ${tableName.toUpperCase()} (${columns.length} columns):`);
          columns.forEach(col => {
            const value = sample[0][col];
            const type = typeof value;
            console.log(`   🔸 ${col}: ${type === 'object' && value ? 'object/json' : type}`);
          });
        }
      } catch (e) {
        console.log(`❌ Could not analyze ${tableName}: ${e.message}`);
      }
    }
  }

  // Generate indexing recommendations
  console.log('\n🚀 INDEXING RECOMMENDATIONS');
  console.log('============================');

  const recommendations = {
    'CRITICAL INDEXES (Implement First)': [
      '🎯 profiles.email - User authentication and lookups',
      '🎯 events.promoter_id - Promoter event queries', 
      '🎯 events.event_date - Date-based event filtering',
      '🎯 events.status - Event status filtering',
      '🎯 applications.comedian_id - Comedian application history',
      '🎯 applications.event_id - Event application lookup',
      '🎯 notifications.user_id - User notification queries',
      '🎯 invoices.promoter_id - Promoter billing queries'
    ],
    'HIGH PRIORITY INDEXES': [
      '📊 applications.status - Application status filtering',
      '📊 applications.applied_at - Chronological application queries',
      '📊 vouches.voucher_id - Voucher lookup for recommendations',
      '📊 vouches.vouchee_id - Vouchee lookup for reputation',  
      '📊 notifications.read_at - Unread notification filtering',
      '📊 invoices.due_date - Due date tracking and reminders',
      '📊 invoices.status - Invoice status filtering'
    ],
    'COMPOSITE INDEXES (Advanced Optimization)': [
      '🔧 events(status, event_date) - Open events by date range',
      '🔧 applications(comedian_id, status) - Comedian application status',
      '🔧 applications(event_id, status) - Event application summary',
      '🔧 notifications(user_id, read_at) - User notification management',
      '🔧 profiles(is_verified, membership) - User segmentation queries'
    ]
  };

  Object.entries(recommendations).forEach(([category, items]) => {
    console.log(`\n${category}:`);
    items.forEach(item => console.log(`  ${item}`));
  });

  // Performance optimization strategy
  console.log('\n⚡ PERFORMANCE OPTIMIZATION STRATEGY');
  console.log('====================================');

  const strategy = [
    '1. 🎯 IMMEDIATE WINS (Week 1):',
    '   - Add primary foreign key indexes on high-traffic tables',
    '   - Index commonly filtered columns (status, dates, user_id)',
    '   - Monitor query performance improvements',
    '',
    '2. 📊 DATA-DRIVEN OPTIMIZATION (Week 2-3):',
    '   - Enable query logging to identify slow queries',
    '   - Analyze actual query patterns from application logs',  
    '   - Add composite indexes based on real usage patterns',
    '',
    '3. 🔧 ADVANCED OPTIMIZATION (Month 2):',
    '   - Implement partial indexes for status-based queries',
    '   - Add JSONB indexes for metadata/settings columns',
    '   - Consider materialized views for complex aggregations',
    '',
    '4. 📈 ONGOING MONITORING:',
    '   - Set up automated slow query detection',
    '   - Monitor index usage statistics',
    '   - Regular cleanup of unused indexes'
  ];

  strategy.forEach(line => console.log(line));

  // Generate migration SQL
  console.log('\n📋 SAMPLE MIGRATION SQL');
  console.log('=======================');

  const migrationSQL = `
-- Critical Performance Indexes - Priority 1
-- Run Date: ${new Date().toISOString()}

-- User and Authentication Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Event System Indexes  
CREATE INDEX IF NOT EXISTS idx_events_promoter_id ON events(promoter_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Application System Indexes
CREATE INDEX IF NOT EXISTS idx_applications_comedian_id ON applications(comedian_id);
CREATE INDEX IF NOT EXISTS idx_applications_event_id ON applications(event_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at);

-- Communication System Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Financial System Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_promoter_id ON invoices(promoter_id);
CREATE INDEX IF NOT EXISTS idx_invoices_comedian_id ON invoices(comedian_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Reputation System Indexes  
CREATE INDEX IF NOT EXISTS idx_vouches_voucher_id ON vouches(voucher_id);
CREATE INDEX IF NOT EXISTS idx_vouches_vouchee_id ON vouches(vouchee_id);
CREATE INDEX IF NOT EXISTS idx_vouches_event_id ON vouches(event_id);

-- Composite Indexes for Complex Queries
CREATE INDEX IF NOT EXISTS idx_events_status_date ON events(status, event_date);
CREATE INDEX IF NOT EXISTS idx_applications_comedian_status ON applications(comedian_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at);
`;

  console.log(migrationSQL);

  console.log('\n🎉 DATABASE ANALYSIS COMPLETE!');
  console.log('\nRecommended Next Steps:');
  console.log('1. ✅ Create migration file with critical indexes');
  console.log('2. 🧪 Test migration on development database'); 
  console.log('3. 📊 Monitor query performance before/after');
  console.log('4. 🚀 Deploy to production during low-traffic window');
  console.log('5. 📈 Set up ongoing performance monitoring');

  return {
    existingTables,
    tableStats,
    highPriorityTables,
    recommendations
  };
}

// Run analysis
analyzeDatabase()
  .then(result => {
    console.log(`\n📊 Analysis Summary: ${result.existingTables.length} tables analyzed`);
  })
  .catch(error => {
    console.error('❌ Analysis failed:', error.message);
  });