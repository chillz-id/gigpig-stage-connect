import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabasePermissions() {
  console.log('🔍 Testing database permissions and signup issues...\n');

  try {
    // 1. Test auth.users table access
    console.log('1. Testing auth.users access...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Cannot access auth.users:', usersError);
    } else {
      console.log(`✓ Can access auth.users - found ${users.length} users`);
    }

    // 2. Test creating a user via admin API
    console.log('\n2. Testing user creation via admin API...');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (createError) {
      console.error('❌ Failed to create user via admin API:', createError);
      console.log('\nThis suggests a database-level issue!');
      
      // Check for specific error patterns
      if (createError.message.includes('Database error')) {
        console.log('\n🚨 DATABASE ERROR DETECTED!');
        console.log('Possible causes:');
        console.log('- Database storage limit reached');
        console.log('- Missing database permissions');
        console.log('- Corrupted database schema');
        console.log('- Missing required extensions or functions');
      }
    } else {
      console.log('✓ User created successfully:', newUser.user.email);
      
      // Clean up test user
      await supabase.auth.admin.deleteUser(newUser.user.id);
      console.log('✓ Test user cleaned up');
    }

    // 3. Check database size and limits
    console.log('\n3. Checking database statistics...');
    const { data: dbSize, error: sizeError } = await supabase.rpc('pg_database_size', {
      database_name: 'postgres'
    }).catch(() => ({ data: null, error: 'Function not available' }));

    if (!sizeError && dbSize) {
      console.log(`Database size: ${(dbSize / 1024 / 1024).toFixed(2)} MB`);
    }

    // 4. Check if auth schema exists
    console.log('\n4. Checking auth schema...');
    const { data: schemas, error: schemaError } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .eq('schema_name', 'auth')
      .single()
      .catch(() => ({ data: null, error: 'Cannot query information_schema' }));

    if (schemas) {
      console.log('✓ Auth schema exists');
    } else {
      console.log('❌ Cannot verify auth schema');
    }

    // 5. Check profiles table constraints
    console.log('\n5. Checking profiles table constraints...');
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .catch(() => ({ data: null, error: 'Cannot query constraints' }));

    if (constraints) {
      console.log('Profiles table constraints:', constraints);
    }

    console.log('\n📊 DIAGNOSIS SUMMARY:');
    console.log('The "Database error saving new user" indicates a serious issue.');
    console.log('\nRecommended actions:');
    console.log('1. Check Supabase dashboard for any alerts or issues');
    console.log('2. Verify database isn\'t at storage limit');
    console.log('3. Check if auth.users table has proper permissions');
    console.log('4. Consider resetting the auth schema if corrupted');
    console.log('\nYou may need to contact Supabase support if the issue persists.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testDatabasePermissions();