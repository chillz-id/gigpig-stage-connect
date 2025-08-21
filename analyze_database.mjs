import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function analyzeDatabase() {
  console.log('=== SUPABASE DATABASE ANALYSIS ===\n');
  console.log(`URL: ${supabaseUrl}\n`);

  try {
    // 1. Check known tables and their structure
    console.log('1. CHECKING PUBLIC SCHEMA TABLES:');
    console.log('==================================');
    
    const knownTables = [
      'profiles',
      'user_roles',
      'events',
      'comedians',
      'event_comedians',
      'event_spots',
      'bookings',
      'venues',
      'agencies',
      'comedian_agencies',
      'shows',
      'reviews',
      'payments',
      'notifications',
      'availability',
      'social_links',
      'booking_requests',
      'event_co_promoters',
      'event_staff',
      'comedian_media',
      'event_media',
      'venue_amenities',
      'event_tags',
      'tags',
      'comedian_tags',
      'event_invitations',
      'rehearsals',
      'ticket_tiers',
      'ticket_sales',
      'refunds',
      'payouts',
      'comedian_availability',
      'recurring_events',
      'waitlist',
      'feedback',
      'announcements',
      'messages',
      'conversations',
      'conversation_participants',
      'blocks',
      'reports',
      'analytics_events',
      'analytics_page_views'
    ];

    for (const table of knownTables) {
      console.log(`\n--- Table: ${table} ---`);
      
      // Get count
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`❌ Table '${table}' not found or error:`, countError.message);
      } else {
        console.log(`✅ EXISTS - Row count: ${count}`);
        
        // Get sample data to see columns
        const { data: sample, error: sampleError } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!sampleError && sample && sample.length > 0) {
          const columns = Object.keys(sample[0]);
          console.log(`   Columns (${columns.length}):`, columns.join(', '));
          
          // Show column types for critical tables
          if (['profiles', 'user_roles', 'events', 'comedians'].includes(table)) {
            console.log('   Sample data:');
            for (const [key, value] of Object.entries(sample[0])) {
              console.log(`     - ${key}: ${typeof value} ${value === null ? '(null)' : `(${JSON.stringify(value).substring(0, 50)}...)`}`);
            }
          }
        }
      }
    }

    // 2. Check auth.users structure
    console.log('\n\n2. AUTH.USERS TABLE:');
    console.log('=====================');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
    } else {
      console.log(`✅ Total users: ${users.users.length}`);
      if (users.users.length > 0) {
        console.log('\nSample user structure:');
        const sampleUser = users.users[0];
        console.log('  Core fields:');
        console.log(`    - id: ${sampleUser.id}`);
        console.log(`    - email: ${sampleUser.email}`);
        console.log(`    - created_at: ${sampleUser.created_at}`);
        console.log(`    - email_confirmed_at: ${sampleUser.email_confirmed_at}`);
        console.log(`    - phone: ${sampleUser.phone || 'null'}`);
        console.log(`    - confirmed_at: ${sampleUser.confirmed_at || 'null'}`);
        console.log(`    - last_sign_in_at: ${sampleUser.last_sign_in_at || 'null'}`);
        console.log('\n  Metadata:');
        console.log(`    - app_metadata:`, JSON.stringify(sampleUser.app_metadata, null, 2));
        console.log(`    - user_metadata:`, JSON.stringify(sampleUser.user_metadata, null, 2));
        console.log('\n  Identities:');
        if (sampleUser.identities) {
          sampleUser.identities.forEach(identity => {
            console.log(`    - ${identity.provider}: created ${identity.created_at}`);
          });
        }
      }
    }

    // 3. Check storage buckets
    console.log('\n\n3. STORAGE BUCKETS:');
    console.log('====================');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Error fetching buckets:', bucketsError.message);
    } else {
      console.log(`✅ Total buckets: ${buckets.length}`);
      for (const bucket of buckets) {
        console.log(`\n  Bucket: ${bucket.name}`);
        console.log(`    - ID: ${bucket.id}`);
        console.log(`    - Public: ${bucket.public}`);
        console.log(`    - Created: ${bucket.created_at}`);
        console.log(`    - File size limit: ${bucket.file_size_limit || 'none'}`);
        console.log(`    - Allowed MIME types: ${bucket.allowed_mime_types?.join(', ') || 'all'}`);
        
        // List some files
        const { data: files, error: filesError } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 5 });
        
        if (filesError) {
          console.log(`    - ❌ Files error: ${filesError.message}`);
        } else {
          console.log(`    - Files/folders at root: ${files.length}`);
          if (files.length > 0) {
            files.slice(0, 3).forEach(f => {
              console.log(`      • ${f.name} ${f.metadata ? `(${f.metadata.size} bytes)` : ''}`);
            });
          }
        }
      }
    }

    // 4. Check critical table relationships
    console.log('\n\n4. CRITICAL TABLE RELATIONSHIPS:');
    console.log('==================================');
    
    // Check profiles -> auth.users relationship
    console.log('\n  Profiles ↔ Auth.Users:');
    const { data: profilesCheck, error: profilesCheckError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(3);
    
    if (!profilesCheckError && profilesCheck) {
      console.log(`    - Profiles table has ${profilesCheck.length > 0 ? 'data' : 'NO DATA'}`);
      if (profilesCheck.length > 0) {
        console.log(`    - Sample profile ID: ${profilesCheck[0].id}`);
        console.log(`    - Profile has email field: ${profilesCheck[0].email !== undefined ? 'YES' : 'NO'}`);
      }
    }

    // Check user_roles structure
    console.log('\n  User_Roles structure:');
    const { data: rolesCheck, error: rolesCheckError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(3);
    
    if (!rolesCheckError && rolesCheck && rolesCheck.length > 0) {
      console.log(`    - User roles table has ${rolesCheck.length} sample entries`);
      console.log(`    - Columns:`, Object.keys(rolesCheck[0]).join(', '));
      console.log(`    - Sample role:`, rolesCheck[0]);
    } else {
      console.log(`    - ❌ No user roles found or error`);
    }

    // 5. Check for database functions
    console.log('\n\n5. CHECKING DATABASE FUNCTIONS:');
    console.log('=================================');
    
    const testFunctions = [
      { name: 'handle_new_user', params: {} },
      { name: 'create_user_profile', params: {} },
      { name: 'update_updated_at_column', params: {} },
      { name: 'check_user_role', params: { user_id: 'test', role_name: 'test' } },
      { name: 'is_admin', params: { user_id: 'test' } },
      { name: 'is_promoter', params: { user_id: 'test' } },
      { name: 'is_comedian', params: { user_id: 'test' } },
      { name: 'get_user_roles', params: { user_id: 'test' } },
      { name: 'add_user_role', params: { user_id: 'test', role: 'test' } },
      { name: 'remove_user_role', params: { user_id: 'test', role: 'test' } },
      { name: 'get_event_spots', params: { event_id: 'test' } },
      { name: 'book_spot', params: { event_id: 'test', comedian_id: 'test' } },
      { name: 'cancel_booking', params: { booking_id: 'test' } }
    ];

    for (const func of testFunctions) {
      try {
        const { error } = await supabase.rpc(func.name, func.params);
        if (error) {
          if (error.code === '42883') {
            console.log(`  ❌ ${func.name}: NOT FOUND`);
          } else if (error.message.includes('violates') || error.message.includes('permission')) {
            console.log(`  ✅ ${func.name}: EXISTS (permission/constraint error)`);
          } else {
            console.log(`  ⚠️  ${func.name}: EXISTS but error - ${error.message.substring(0, 50)}...`);
          }
        } else {
          console.log(`  ✅ ${func.name}: EXISTS and callable`);
        }
      } catch (e) {
        console.log(`  ❌ ${func.name}: ERROR - ${e.message}`);
      }
    }

    // 6. Check for critical missing infrastructure
    console.log('\n\n6. CRITICAL INFRASTRUCTURE CHECK:');
    console.log('===================================');
    
    // Check if profiles has proper relationship
    const { data: profileTest, error: profileTestError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();
    
    console.log('\n  Profile → Auth.Users relationship:');
    if (profileTestError && profileTestError.code === 'PGRST116') {
      console.log('    ✅ Foreign key constraint likely exists (no matching row)');
    } else if (profileTestError) {
      console.log('    ⚠️  Uncertain:', profileTestError.message);
    } else {
      console.log('    ⚠️  Test inconclusive');
    }

    // Check RLS status on critical tables
    console.log('\n  RLS Status (based on access tests):');
    const rlsTables = ['profiles', 'user_roles', 'events', 'comedians'];
    
    // First, let's try without auth
    const supabaseAnon = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    for (const table of rlsTables) {
      const { data, error } = await supabaseAnon
        .from(table)
        .select('id')
        .limit(1);
      
      if (error && error.message.includes('row-level security')) {
        console.log(`    ✅ ${table}: RLS ENABLED`);
      } else if (error) {
        console.log(`    ⚠️  ${table}: Error - ${error.message.substring(0, 30)}...`);
      } else {
        console.log(`    ⚠️  ${table}: RLS possibly DISABLED (public read allowed)`);
      }
    }

    // 7. Check for triggers
    console.log('\n\n7. CHECKING FOR TRIGGERS:');
    console.log('==========================');
    console.log('  (Requires direct SQL access for detailed info)');
    console.log('  Common triggers to check:');
    console.log('    - on_auth_user_created → creates profile');
    console.log('    - update_updated_at → updates timestamps');
    console.log('    - handle_user_delete → cascades deletions');

  } catch (error) {
    console.error('\n❌ Analysis error:', error);
  }
}

console.log('Starting database analysis...\n');
analyzeDatabase().then(() => {
  console.log('\n\n=== ANALYSIS COMPLETE ===');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});