#!/usr/bin/env node

/**
 * Stand Up Sydney Database Structure Analysis
 * Analyzes current schema and identifies performance optimization opportunities
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/etc/standup-sydney/credentials.env' });

// Initialize Supabase client with service key for full access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function analyzeDatabase() {
  console.log('🎭 Stand Up Sydney Database Analysis');
  console.log('====================================\n');

  try {
    // 1. Get all tables in public schema
    console.log('📊 1. ANALYZING TABLE STRUCTURE');
    console.log('--------------------------------');
    
    // Use raw SQL query for information_schema access
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `
    });

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError);
      return;
    }

    console.log(`Found ${tables.length} tables/views in public schema:\n`);
    
    const coreEntityTables = [];
    const supportTables = [];
    const integrationTables = [];

    tables.forEach(table => {
      const name = table.table_name;
      console.log(`📋 ${name} (${table.table_type})`);
      
      // Categorize tables for indexing analysis
      if (['profiles', 'events', 'applications', 'vouches', 'invoices', 'notifications'].includes(name)) {
        coreEntityTables.push(name);
      } else if (name.includes('ticket_') || name.includes('xero_') || name.includes('humanitix_') || name.includes('calendar_')) {
        integrationTables.push(name);
      } else {
        supportTables.push(name);
      }
    });

    // 2. Analyze existing indexes
    console.log('\n📈 2. ANALYZING CURRENT INDEXES');
    console.log('-------------------------------');

    const { data: indexes, error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname as table_schema,
          tablename as table_name, 
          indexname as index_name,
          indexdef as index_definition
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname NOT LIKE '%_pkey'
        ORDER BY tablename, indexname
      `
    });

    if (!indexError && indexes) {
      console.log(`Found ${indexes.length} custom indexes:\n`);
      
      const indexesByTable = {};
      indexes.forEach(idx => {
        if (!indexesByTable[idx.table_name]) {
          indexesByTable[idx.table_name] = [];
        }
        indexesByTable[idx.table_name].push(idx);
      });

      Object.entries(indexesByTable).forEach(([table, tableIndexes]) => {
        console.log(`📊 ${table}:`);
        tableIndexes.forEach(idx => {
          console.log(`   🔍 ${idx.index_name} on ${idx.column_name}`);
        });
        console.log('');
      });
    }

    // 3. Analyze table sizes and row counts
    console.log('📏 3. ANALYZING TABLE SIZES');
    console.log('--------------------------');

    const tableSizes = [];
    for (const table of coreEntityTables) {
      try {
        const { count, error } = await supabase
          .from(table.table_name)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          tableSizes.push({ table: table.table_name, count });
          console.log(`📊 ${table.table_name}: ${count} rows`);
        }
      } catch (e) {
        console.log(`❌ Could not count ${table.table_name}: ${e.message}`);
      }
    }

    // 4. Column analysis for key tables
    console.log('\n🔍 4. ANALYZING CORE TABLE COLUMNS');
    console.log('----------------------------------');

    const keyTables = ['profiles', 'events', 'applications', 'vouches', 'invoices', 'notifications'];
    
    for (const tableName of keyTables) {
      try {
        const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
          sql: `
            SELECT column_name, data_type, is_nullable, ordinal_position
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
            ORDER BY ordinal_position
          `
        });

        if (!columnsError && columns) {
          console.log(`\n📋 ${tableName.toUpperCase()} (${columns.length} columns):`);
          columns.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? '?' : '';
            console.log(`   🔸 ${col.column_name}: ${col.data_type}${nullable}`);
          });
        }
      } catch (e) {
        console.log(`❌ Could not analyze ${tableName}: ${e.message}`);
      }
    }

    // 5. Performance optimization recommendations
    console.log('\n🚀 5. PERFORMANCE OPTIMIZATION RECOMMENDATIONS');
    console.log('==============================================');

    const recommendations = [
      {
        category: 'CORE ENTITY INDEXES',
        items: [
          'profiles: CREATE INDEX idx_profiles_email ON profiles(email) -- User lookups',
          'profiles: CREATE INDEX idx_profiles_role ON profiles USING GIN(roles) -- Role filtering', 
          'events: CREATE INDEX idx_events_promoter_id ON events(promoter_id) -- Promoter events',
          'events: CREATE INDEX idx_events_date ON events(event_date) -- Date range queries',
          'events: CREATE INDEX idx_events_status ON events(status) -- Status filtering',
          'events: CREATE INDEX idx_events_venue_date ON events(venue_name, event_date) -- Venue scheduling',
          'applications: CREATE INDEX idx_applications_comedian_id ON applications(comedian_id) -- Comedian history',
          'applications: CREATE INDEX idx_applications_event_id ON applications(event_id) -- Event applications',
          'applications: CREATE INDEX idx_applications_status ON applications(status) -- Status filtering',
          'applications: CREATE INDEX idx_applications_applied_at ON applications(applied_at) -- Chronological queries'
        ]
      },
      {
        category: 'RELATIONSHIP INDEXES',
        items: [
          'vouches: CREATE INDEX idx_vouches_voucher_id ON vouches(voucher_id) -- Voucher lookup',
          'vouches: CREATE INDEX idx_vouches_vouchee_id ON vouches(vouchee_id) -- Vouchee lookup',
          'vouches: CREATE INDEX idx_vouches_event_id ON vouches(event_id) -- Event-specific vouches',
          'notifications: CREATE INDEX idx_notifications_user_id ON notifications(user_id) -- User notifications',
          'notifications: CREATE INDEX idx_notifications_read_at ON notifications(read_at) -- Unread filtering',
          'notifications: CREATE INDEX idx_notifications_created_at ON notifications(created_at) -- Time ordering'
        ]
      },
      {
        category: 'FINANCIAL SYSTEM INDEXES',
        items: [
          'invoices: CREATE INDEX idx_invoices_promoter_id ON invoices(promoter_id) -- Promoter invoices',
          'invoices: CREATE INDEX idx_invoices_comedian_id ON invoices(comedian_id) -- Comedian invoices', 
          'invoices: CREATE INDEX idx_invoices_status ON invoices(status) -- Invoice status',
          'invoices: CREATE INDEX idx_invoices_due_date ON invoices(due_date) -- Due date tracking',
          'invoices: CREATE INDEX idx_invoices_created_at ON invoices(created_at) -- Chronological'
        ]
      },
      {
        category: 'SPOT ASSIGNMENT SYSTEM INDEXES',
        items: [
          'spot_assignments: CREATE INDEX idx_spot_assignments_event_id ON spot_assignments(event_id)',
          'spot_assignments: CREATE INDEX idx_spot_assignments_comedian_id ON spot_assignments(comedian_id)',
          'spot_confirmations: CREATE INDEX idx_spot_confirmations_assignment_id ON spot_confirmations(assignment_id)',
          'spot_confirmations: CREATE INDEX idx_spot_confirmations_deadline ON spot_confirmations(deadline)'
        ]
      },
      {
        category: 'COMPOSITE INDEXES FOR COMPLEX QUERIES',
        items: [
          'events: CREATE INDEX idx_events_status_date ON events(status, event_date) -- Open events by date',
          'applications: CREATE INDEX idx_applications_comedian_status ON applications(comedian_id, status) -- Comedian app status',
          'applications: CREATE INDEX idx_applications_event_status ON applications(event_id, status) -- Event app status',
          'profiles: CREATE INDEX idx_profiles_verified_membership ON profiles(is_verified, membership) -- User segmentation'
        ]
      }
    ];

    recommendations.forEach(section => {
      console.log(`\n${section.category}:`);
      section.items.forEach(item => {
        console.log(`  🔧 ${item}`);
      });
    });

    // 6. Critical performance patterns
    console.log('\n⚡ 6. CRITICAL PERFORMANCE PATTERNS');
    console.log('-----------------------------------');

    const patterns = [
      '🎯 EVENT DISCOVERY: Query open events by date range and location',
      '👥 USER MATCHING: Find comedians by availability and experience level', 
      '📊 DASHBOARD QUERIES: Aggregate data for promoter/comedian dashboards',
      '🔔 NOTIFICATION DELIVERY: Real-time notification queries by user',
      '💰 FINANCIAL REPORTING: Invoice and payment status aggregations',
      '📅 AVAILABILITY CHECKING: Calendar conflict detection',
      '🏆 REPUTATION SYSTEM: Vouch aggregation and rating calculations',
      '🎪 SPOT MANAGEMENT: Assignment and confirmation workflows'
    ];

    patterns.forEach(pattern => console.log(`  ${pattern}`));

    // 7. Monitoring recommendations
    console.log('\n📊 7. DATABASE MONITORING RECOMMENDATIONS');
    console.log('----------------------------------------');

    const monitoring = [
      '🔍 Query Performance: Monitor slow queries > 100ms',
      '📈 Index Usage: Track index hit ratios and unused indexes',
      '💾 Connection Pool: Monitor active connections vs pool size',
      '🎯 Row Level Security: Ensure RLS policies are optimized',
      '📊 Table Growth: Monitor rapidly growing tables (notifications, logs)',
      '⚠️  Lock Analysis: Identify blocking queries and deadlocks',
      '🔄 Real-time Subscriptions: Monitor subscription performance',
      '🗄️  Storage: Track database size growth and cleanup needs'
    ];

    monitoring.forEach(item => console.log(`  ${item}`));

    console.log('\n🎉 DATABASE ANALYSIS COMPLETE!');
    console.log('\nNext Steps:');
    console.log('1. Review current indexing against recommendations');
    console.log('2. Create migration files for missing indexes');
    console.log('3. Test performance improvements on development database');
    console.log('4. Set up database monitoring for production');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
  }
}

// Run the analysis
analyzeDatabase().catch(console.error);