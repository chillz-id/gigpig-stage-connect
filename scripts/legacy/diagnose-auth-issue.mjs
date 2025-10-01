const SUPABASE_ACCESS_TOKEN = 'sbp_YOUR_SUPABASE_ACCESS_TOKEN_HERE_GET_FROM_OWNER'
const PROJECT_REF = 'pdikjpfulhhpqpxzpgtu'

async function executeSQLViaAPI(sql) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    }
  )
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error: ${error}`)
  }
  
  return await response.json()
}

async function diagnoseAuthIssue() {
  console.log('🔍 Diagnosing Authentication Issues')
  console.log('===================================\n')
  
  try {
    // 1. Check if auth schema exists
    console.log('1️⃣ Checking auth schema...')
    const schemaCheck = await executeSQLViaAPI(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'auth'
    `)
    
    if (schemaCheck.data && schemaCheck.data.length > 0) {
      console.log('✅ Auth schema exists')
    } else {
      console.log('❌ Auth schema missing!')
    }
    
    // 2. Check if auth.users table exists
    console.log('\n2️⃣ Checking auth.users table...')
    const tableCheck = await executeSQLViaAPI(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'auth' 
      AND table_name = 'users'
    `)
    
    if (tableCheck.data && tableCheck.data.length > 0) {
      console.log('✅ auth.users table exists')
      
      // Get column info
      const columnsCheck = await executeSQLViaAPI(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'auth' 
        AND table_name = 'users'
        ORDER BY ordinal_position
        LIMIT 10
      `)
      
      console.log('   Key columns:')
      columnsCheck.data?.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`)
      })
    } else {
      console.log('❌ auth.users table missing!')
    }
    
    // 3. Check profiles table structure
    console.log('\n3️⃣ Checking profiles table...')
    const profilesCheck = await executeSQLViaAPI(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'profiles'
      ORDER BY ordinal_position
    `)
    
    if (profilesCheck.data && profilesCheck.data.length > 0) {
      console.log('✅ profiles table exists with columns:')
      profilesCheck.data.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`)
      })
    } else {
      console.log('❌ profiles table missing or inaccessible!')
    }
    
    // 4. Check RLS policies on profiles
    console.log('\n4️⃣ Checking RLS policies on profiles...')
    const rlsCheck = await executeSQLViaAPI(`
      SELECT policyname, cmd, qual 
      FROM pg_policies 
      WHERE tablename = 'profiles' 
      AND schemaname = 'public'
    `)
    
    if (rlsCheck.data && rlsCheck.data.length > 0) {
      console.log(`✅ Found ${rlsCheck.data.length} RLS policies:`)
      rlsCheck.data.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`)
      })
    } else {
      console.log('⚠️  No RLS policies found on profiles table')
    }
    
    // 5. Check if RLS is enabled
    console.log('\n5️⃣ Checking if RLS is enabled...')
    const rlsEnabledCheck = await executeSQLViaAPI(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'profiles' 
      AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `)
    
    if (rlsEnabledCheck.data && rlsEnabledCheck.data.length > 0) {
      const rlsEnabled = rlsEnabledCheck.data[0].relrowsecurity
      console.log(`   RLS on profiles: ${rlsEnabled ? '✅ Enabled' : '❌ Disabled'}`)
      
      if (!rlsEnabled) {
        console.log('   ⚠️  RLS should be enabled for security!')
      }
    }
    
    // 6. Check for any database constraints
    console.log('\n6️⃣ Checking database constraints...')
    const constraintsCheck = await executeSQLViaAPI(`
      SELECT 
        con.conname as constraint_name,
        con.contype as constraint_type,
        pg_get_constraintdef(con.oid) as definition
      FROM pg_constraint con
      JOIN pg_namespace nsp ON nsp.oid = con.connamespace
      JOIN pg_class cls ON cls.oid = con.conrelid
      WHERE nsp.nspname = 'public'
      AND cls.relname = 'profiles'
    `)
    
    if (constraintsCheck.data && constraintsCheck.data.length > 0) {
      console.log('   Constraints on profiles:')
      constraintsCheck.data.forEach(con => {
        console.log(`   - ${con.constraint_name} (${con.constraint_type})`)
        if (con.definition) {
          console.log(`     ${con.definition}`)
        }
      })
    }
    
    // 7. Test database connectivity
    console.log('\n7️⃣ Testing database write access...')
    try {
      const testId = `test-${Date.now()}`
      await executeSQLViaAPI(`
        INSERT INTO profiles (id, email, created_at, updated_at) 
        VALUES ('${testId}', 'test@example.com', NOW(), NOW())
      `)
      
      // Clean up
      await executeSQLViaAPI(`DELETE FROM profiles WHERE id = '${testId}'`)
      console.log('✅ Database write access confirmed')
    } catch (error) {
      console.log('❌ Cannot write to profiles table:', error.message)
    }
    
    console.log('\n===================================')
    console.log('📊 Diagnosis Summary:')
    console.log('\nThe "Database error saving new user" typically means:')
    console.log('1. Missing or misconfigured auth schema')
    console.log('2. Database connection issues')
    console.log('3. Trigger/function errors preventing user creation')
    console.log('4. Constraint violations in the profiles table')
    console.log('\n💡 Recommended Actions:')
    console.log('1. Check Supabase Dashboard > Database > Logs for detailed errors')
    console.log('2. Ensure all required tables and schemas are properly set up')
    console.log('3. Verify database is not in read-only mode')
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error.message)
  }
}

diagnoseAuthIssue()