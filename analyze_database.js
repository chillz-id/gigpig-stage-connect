const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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

  try {
    // 1. List all tables
    console.log('1. LISTING ALL TABLES:');
    console.log('======================');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables_info', {}, { 
        get: true,
        head: false,
        count: null
      });
    
    if (tablesError) {
      // Try alternative query
      const { data: tablesAlt, error: tablesAltError } = await supabase
        .from('information_schema.tables')
        .select('table_schema, table_name')
        .in('table_schema', ['public', 'auth', 'storage'])
        .order('table_schema')
        .order('table_name');
      
      if (tablesAltError) {
        console.log('Error fetching tables:', tablesAltError.message);
        // Let's try to get data from known tables
        console.log('\nTrying to access known tables directly...\n');
      } else {
        console.log(tablesAlt);
      }
    } else {
      console.log(tables);
    }

    // 2. Check known tables and their structure
    console.log('\n2. CHECKING KNOWN TABLES:');
    console.log('==========================');
    
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
      'social_links'
    ];

    for (const table of knownTables) {
      console.log(`\n--- Table: ${table} ---`);
      
      // Get count
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`Table '${table}' error:`, countError.message);
      } else {
        console.log(`Row count: ${count}`);
        
        // Get sample data
        const { data: sample, error: sampleError } = await supabase
          .from(table)
          .select('*')
          .limit(2);
        
        if (sampleError) {
          console.log(`Sample error:`, sampleError.message);
        } else if (sample && sample.length > 0) {
          console.log('Columns:', Object.keys(sample[0]));
          console.log('Sample row:', JSON.stringify(sample[0], null, 2));
        }
      }
    }

    // 3. Check auth.users
    console.log('\n3. AUTH.USERS TABLE:');
    console.log('=====================');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('Error fetching users:', usersError.message);
    } else {
      console.log(`Total users: ${users.users.length}`);
      if (users.users.length > 0) {
        console.log('Sample user structure:');
        const sampleUser = users.users[0];
        console.log({
          id: sampleUser.id,
          email: sampleUser.email,
          created_at: sampleUser.created_at,
          email_confirmed_at: sampleUser.email_confirmed_at,
          app_metadata: sampleUser.app_metadata,
          user_metadata: sampleUser.user_metadata,
          identities: sampleUser.identities?.map(i => ({ provider: i.provider, created_at: i.created_at }))
        });
      }
    }

    // 4. Check storage buckets
    console.log('\n4. STORAGE BUCKETS:');
    console.log('====================');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('Error fetching buckets:', bucketsError.message);
    } else {
      for (const bucket of buckets) {
        console.log(`\nBucket: ${bucket.name}`);
        console.log(`- ID: ${bucket.id}`);
        console.log(`- Public: ${bucket.public}`);
        console.log(`- Created: ${bucket.created_at}`);
        
        // List some files
        const { data: files, error: filesError } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 5 });
        
        if (filesError) {
          console.log(`- Files error: ${filesError.message}`);
        } else {
          console.log(`- Files count (first level): ${files.length}`);
          if (files.length > 0) {
            console.log('- Sample files:', files.slice(0, 3).map(f => f.name));
          }
        }
      }
    }

    // 5. Check RLS status
    console.log('\n5. ROW LEVEL SECURITY (RLS) STATUS:');
    console.log('====================================');
    // This would require a custom RPC function or direct SQL access
    console.log('RLS check requires direct SQL access or custom RPC function');

    // 6. Check for custom functions
    console.log('\n6. CHECKING FOR CUSTOM FUNCTIONS:');
    console.log('==================================');
    const customFunctions = [
      'handle_new_user',
      'create_user_profile',
      'update_updated_at_column',
      'check_user_role',
      'is_admin',
      'is_promoter',
      'is_comedian'
    ];

    for (const func of customFunctions) {
      try {
        const { data, error } = await supabase.rpc(func, {});
        if (error && !error.message.includes('required')) {
          console.log(`Function '${func}': Not found or error`);
        } else {
          console.log(`Function '${func}': EXISTS`);
        }
      } catch (e) {
        console.log(`Function '${func}': Not found`);
      }
    }

    // 7. Check relationships between tables
    console.log('\n7. TABLE RELATIONSHIPS:');
    console.log('========================');
    
    // Check profiles -> auth.users
    const { data: profilesWithUsers, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .limit(5);
    
    if (!profilesError) {
      console.log('\nProfiles table structure:', profilesWithUsers.length > 0 ? Object.keys(profilesWithUsers[0]) : 'No data');
    }

    // Check user_roles -> profiles
    const { data: rolesWithProfiles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*, profiles(email)')
      .limit(5);
    
    if (!rolesError) {
      console.log('\nUser roles with profiles:', rolesWithProfiles.length);
    }

  } catch (error) {
    console.error('Analysis error:', error);
  }
}

analyzeDatabase().then(() => {
  console.log('\n=== ANALYSIS COMPLETE ===');
  process.exit(0);
});