#!/usr/bin/env node
// Comprehensive database structure fix for Stand Up Sydney

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE'
);

// Critical tables to verify
const criticalTables = [
  'profiles',
  'events',
  'applications',
  'event_spots',
  'notifications',
  'vouches',
  'invoices',
  'invoice_items',
  'organizations',
  'agencies',
  'comedian_media',
  'comedian_availability',
  'tasks',
  'task_templates',
  'tours',
  'flights',
  'xero_settings',
  'ticket_sales',
  'ticket_sync_logs',
  'humanitix_events',
  'eventbrite_events',
  'payment_links',
  'customization',
  'navigation_preferences',
  'errors'
];

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      return { exists: false, error: error.message };
    }
    
    return { exists: true, sampleColumns: data.length > 0 ? Object.keys(data[0]) : [] };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function checkTrigger(triggerName) {
  try {
    const { data, error } = await supabase.rpc('check_trigger_exists', {
      trigger_name: triggerName
    });
    
    if (error) {
      // If the function doesn't exist, check using raw SQL
      const { data: triggers, error: sqlError } = await supabase.rpc('get_database_triggers');
      if (sqlError) {
        return { exists: false, error: 'Unable to check triggers' };
      }
      return { exists: triggers?.some(t => t.trigger_name === triggerName) || false };
    }
    
    return { exists: data || false };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function checkRLSPolicy(tableName, policyName) {
  try {
    const { data, error } = await supabase.rpc('check_rls_policy', {
      table_name: tableName,
      policy_name: policyName
    });
    
    if (error) {
      return { exists: false, error: error.message };
    }
    
    return { exists: data || false };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function verifyDatabaseStructure() {
  console.log('🔍 Starting comprehensive database verification...\n');
  
  const results = {
    tables: {},
    triggers: {},
    policies: {},
    connections: { supabase: false, auth: false },
    criticalIssues: []
  };
  
  // 1. Test Supabase connection
  console.log('1️⃣ Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact' });
    if (!error) {
      results.connections.supabase = true;
      console.log('✅ Supabase connection successful');
    } else {
      console.log('❌ Supabase connection failed:', error.message);
      results.criticalIssues.push('Supabase connection failed');
    }
  } catch (err) {
    console.log('❌ Supabase connection error:', err.message);
    results.criticalIssues.push('Supabase connection error');
  }
  
  // 2. Test Auth service
  console.log('\n2️⃣ Testing Auth service...');
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1 });
    if (!error) {
      results.connections.auth = true;
      console.log('✅ Auth service accessible');
    } else {
      console.log('❌ Auth service error:', error.message);
      results.criticalIssues.push('Auth service not accessible');
    }
  } catch (err) {
    console.log('❌ Auth service error:', err.message);
    results.criticalIssues.push('Auth service error');
  }
  
  // 3. Check all critical tables
  console.log('\n3️⃣ Checking critical tables...');
  for (const table of criticalTables) {
    const result = await checkTable(table);
    results.tables[table] = result;
    
    if (result.exists) {
      console.log(`✅ ${table} - exists (${result.sampleColumns.length} columns)`);
    } else {
      console.log(`❌ ${table} - ${result.error}`);
      if (['profiles', 'events', 'applications', 'event_spots'].includes(table)) {
        results.criticalIssues.push(`Critical table '${table}' is missing`);
      }
    }
  }
  
  // 4. Check critical triggers
  console.log('\n4️⃣ Checking critical triggers...');
  const criticalTriggers = [
    'handle_new_user',
    'update_updated_at',
    'handle_spot_confirmation_change',
    'handle_application_status_change'
  ];
  
  for (const trigger of criticalTriggers) {
    const result = await checkTrigger(trigger);
    results.triggers[trigger] = result;
    
    if (result.exists) {
      console.log(`✅ ${trigger} - exists`);
    } else {
      console.log(`❌ ${trigger} - missing or inaccessible`);
      if (trigger === 'handle_new_user') {
        results.criticalIssues.push('Critical trigger handle_new_user is missing');
      }
    }
  }
  
  // 5. Check RLS policies for critical tables
  console.log('\n5️⃣ Checking RLS policies...');
  const criticalPolicies = [
    { table: 'profiles', policies: ['Users can view all profiles', 'Users can update own profile'] },
    { table: 'events', policies: ['Events are viewable by everyone', 'Authenticated users can create events'] },
    { table: 'applications', policies: ['Users can view own applications', 'Users can create applications'] },
    { table: 'event_spots', policies: ['Event spots are viewable by authenticated users'] }
  ];
  
  for (const { table, policies } of criticalPolicies) {
    for (const policy of policies) {
      const result = await checkRLSPolicy(table, policy);
      const key = `${table}.${policy}`;
      results.policies[key] = result;
      
      if (result.exists) {
        console.log(`✅ ${table}: ${policy}`);
      } else {
        console.log(`❌ ${table}: ${policy} - missing`);
      }
    }
  }
  
  // 6. Check foreign key relationships
  console.log('\n6️⃣ Checking foreign key relationships...');
  const relationships = [
    { from: 'applications', to: 'events', column: 'event_id' },
    { from: 'applications', to: 'profiles', column: 'user_id' },
    { from: 'event_spots', to: 'events', column: 'event_id' },
    { from: 'event_spots', to: 'profiles', column: 'comedian_id' }
  ];
  
  for (const rel of relationships) {
    if (results.tables[rel.from]?.exists && results.tables[rel.to]?.exists) {
      console.log(`✅ ${rel.from}.${rel.column} -> ${rel.to}`);
    } else {
      console.log(`❌ ${rel.from}.${rel.column} -> ${rel.to} (table missing)`);
    }
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`- Supabase connection: ${results.connections.supabase ? '✅' : '❌'}`);
  console.log(`- Auth service: ${results.connections.auth ? '✅' : '❌'}`);
  console.log(`- Tables: ${Object.values(results.tables).filter(t => t.exists).length}/${criticalTables.length} exist`);
  console.log(`- Critical issues: ${results.criticalIssues.length}`);
  
  if (results.criticalIssues.length > 0) {
    console.log('\n🚨 Critical Issues Found:');
    results.criticalIssues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  return results;
}

// Run the verification
verifyDatabaseStructure()
  .then(results => {
    console.log('\n✅ Database verification complete!');
    
    // Save results to file
    fs.writeFileSync(
      path.join(__dirname, 'database-verification-results.json'),
      JSON.stringify(results, null, 2)
    );
    console.log('📄 Results saved to database-verification-results.json');
  })
  .catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });