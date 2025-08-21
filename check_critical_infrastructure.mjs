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

async function checkCriticalInfrastructure() {
  console.log('=== CRITICAL DATABASE INFRASTRUCTURE CHECK ===\n');

  try {
    // 1. Check profiles table structure in detail
    console.log('1. PROFILES TABLE STRUCTURE:');
    console.log('=============================');
    
    const { data: profileSample, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.log('❌ Error accessing profiles:', profileError.message);
    } else if (profileSample && profileSample.length > 0) {
      console.log('✅ Profiles table exists with columns:');
      const columns = Object.keys(profileSample[0]);
      columns.forEach(col => {
        const value = profileSample[0][col];
        console.log(`   - ${col}: ${typeof value} ${value === null ? '(nullable)' : ''}`);
      });
    } else {
      console.log('⚠️  Profiles table exists but is EMPTY');
      // Try to get column info via information_schema
      const { data: emptyInsert } = await supabase
        .from('profiles')
        .insert({})
        .select();
      console.log('   Expected columns based on insert attempt:', emptyInsert);
    }

    // 2. Check user_roles table structure
    console.log('\n\n2. USER_ROLES TABLE STRUCTURE:');
    console.log('================================');
    
    const { data: roleSample, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);
    
    if (roleError) {
      console.log('❌ Error accessing user_roles:', roleError.message);
    } else if (roleSample && roleSample.length > 0) {
      console.log('✅ User_roles table exists with columns:');
      const columns = Object.keys(roleSample[0]);
      columns.forEach(col => {
        const value = roleSample[0][col];
        console.log(`   - ${col}: ${typeof value} ${value === null ? '(nullable)' : ''}`);
      });
    } else {
      console.log('⚠️  User_roles table exists but is EMPTY');
    }

    // 3. Check for orphaned users (users without profiles)
    console.log('\n\n3. USER-PROFILE SYNCHRONIZATION:');
    console.log('==================================');
    
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Cannot access auth.users:', authError.message);
    } else {
      console.log(`✅ Total auth.users: ${authUsers.users.length}`);
      
      // Get all profiles
      const { count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      console.log(`✅ Total profiles: ${profileCount}`);
      
      if (authUsers.users.length > profileCount) {
        console.log(`\n⚠️  MISSING PROFILES: ${authUsers.users.length - profileCount} users don't have profiles!`);
        
        // Find which users are missing profiles
        const { data: existingProfiles } = await supabase
          .from('profiles')
          .select('id');
        
        const profileIds = new Set(existingProfiles?.map(p => p.id) || []);
        const missingUsers = authUsers.users.filter(u => !profileIds.has(u.id));
        
        console.log('\nUsers without profiles:');
        missingUsers.forEach(user => {
          console.log(`   - ${user.email} (ID: ${user.id})`);
          console.log(`     Created: ${user.created_at}`);
          console.log(`     Metadata: ${JSON.stringify(user.user_metadata)}`);
        });
      } else if (authUsers.users.length < profileCount) {
        console.log(`\n⚠️  ORPHANED PROFILES: ${profileCount - authUsers.users.length} profiles without users!`);
      } else {
        console.log('\n✅ All users have profiles!');
      }
    }

    // 4. Check for database functions
    console.log('\n\n4. DATABASE FUNCTIONS:');
    console.log('========================');
    
    const criticalFunctions = [
      'handle_new_user',
      'update_updated_at_column',
      'has_role',
      'get_user_roles'
    ];
    
    for (const func of criticalFunctions) {
      try {
        // Try to call with dummy params to check existence
        const { error } = await supabase.rpc(func, { user_id: '00000000-0000-0000-0000-000000000000' });
        
        if (error && error.code === '42883') {
          console.log(`   ❌ ${func}: NOT FOUND`);
        } else {
          console.log(`   ✅ ${func}: EXISTS`);
        }
      } catch (e) {
        console.log(`   ❌ ${func}: ERROR`);
      }
    }

    // 5. Check storage buckets
    console.log('\n\n5. STORAGE BUCKETS:');
    console.log('=====================');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Error listing buckets:', bucketsError.message);
    } else {
      const expectedBuckets = ['avatars', 'profile-images', 'event-images', 'comedian-media'];
      
      expectedBuckets.forEach(bucketName => {
        const exists = buckets.some(b => b.name === bucketName);
        console.log(`   ${exists ? '✅' : '❌'} ${bucketName}`);
      });
      
      // Show any unexpected buckets
      const unexpectedBuckets = buckets.filter(b => !expectedBuckets.includes(b.name));
      if (unexpectedBuckets.length > 0) {
        console.log('\n   Other buckets found:');
        unexpectedBuckets.forEach(b => {
          console.log(`   - ${b.name} (public: ${b.public})`);
        });
      }
    }

    // 6. Check RLS policies
    console.log('\n\n6. ROW LEVEL SECURITY (RLS) CHECK:');
    console.log('====================================');
    
    // Test with anonymous client
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseAnon = createClient(supabaseUrl, anonKey);
    
    const rlsTables = ['profiles', 'user_roles', 'events', 'comedians'];
    
    for (const table of rlsTables) {
      const { data, error } = await supabaseAnon
        .from(table)
        .select('id')
        .limit(1);
      
      if (error && error.code === 'PGRST301') {
        console.log(`   ✅ ${table}: RLS ENABLED (no anonymous access)`);
      } else if (data) {
        console.log(`   ⚠️  ${table}: RLS may be DISABLED or allows public read`);
      } else if (error) {
        console.log(`   ❓ ${table}: ${error.message}`);
      }
    }

    // 7. Check for critical missing features
    console.log('\n\n7. CRITICAL FEATURES CHECK:');
    console.log('=============================');
    
    // Check if profile trigger exists by checking function
    const { error: triggerFuncError } = await supabase.rpc('handle_new_user', {});
    const profileTriggerExists = triggerFuncError && !triggerFuncError.message.includes('not found');
    
    console.log(`   ${profileTriggerExists ? '✅' : '❌'} Profile creation trigger (handle_new_user)`);
    
    // Check if updated_at trigger exists
    const { data: eventWithUpdated } = await supabase
      .from('events')
      .select('updated_at')
      .limit(1);
    
    console.log(`   ${eventWithUpdated ? '✅' : '❓'} Updated_at timestamp columns`);
    
    // Check for user role helpers
    const { error: hasRoleError } = await supabase.rpc('has_role', {
      _user_id: '00000000-0000-0000-0000-000000000000',
      _role: 'admin'
    });
    
    console.log(`   ${hasRoleError?.code !== '42883' ? '✅' : '❌'} Role helper functions (has_role)`);

  } catch (error) {
    console.error('\n❌ Critical error during check:', error);
  }
}

console.log('Running critical infrastructure check...\n');
checkCriticalInfrastructure().then(() => {
  console.log('\n\n=== CHECK COMPLETE ===');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});