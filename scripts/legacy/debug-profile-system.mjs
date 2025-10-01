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
  
  const responseText = await response.text()
  
  if (!response.ok) {
    throw new Error(`API Error: ${responseText}`)
  }
  
  try {
    return JSON.parse(responseText)
  } catch {
    console.log('Raw response:', responseText)
    return { data: [] }
  }
}

async function debugProfileSystem() {
  console.log('🔍 Debugging Profile System')
  console.log('===========================\n')
  
  try {
    // 1. Check auth schema access
    console.log('1️⃣ Checking auth schema access...')
    const authCheck = await executeSQLViaAPI(`
      SELECT COUNT(*) as user_count
      FROM auth.users
      LIMIT 1;
    `)
    console.log(`   Found ${authCheck.data?.[0]?.user_count || 0} users in auth.users\n`)
    
    // 2. Check profiles table
    console.log('2️⃣ Checking profiles table...')
    const profileCheck = await executeSQLViaAPI(`
      SELECT COUNT(*) as profile_count
      FROM profiles
      LIMIT 1;
    `)
    console.log(`   Found ${profileCheck.data?.[0]?.profile_count || 0} profiles\n`)
    
    // 3. List all triggers
    console.log('3️⃣ Listing ALL triggers in database...')
    const allTriggers = await executeSQLViaAPI(`
      SELECT 
        n.nspname as schema_name,
        c.relname as table_name,
        t.tgname as trigger_name,
        p.proname as function_name
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_proc p ON p.oid = t.tgfoid
      WHERE NOT t.tgisinternal
      AND n.nspname IN ('public', 'auth')
      ORDER BY n.nspname, c.relname, t.tgname;
    `)
    
    if (allTriggers.data && allTriggers.data.length > 0) {
      console.log('   Found triggers:')
      allTriggers.data.forEach(t => {
        console.log(`   - ${t.schema_name}.${t.table_name} → ${t.trigger_name} → ${t.function_name}()`)
      })
    } else {
      console.log('   No triggers found')
    }
    console.log()
    
    // 4. List all functions related to user/profile
    console.log('4️⃣ Listing user/profile related functions...')
    const functions = await executeSQLViaAPI(`
      SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_function_identity_arguments(p.oid) as arguments
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname IN ('public', 'auth')
      AND (
        p.proname LIKE '%user%' 
        OR p.proname LIKE '%profile%'
        OR p.proname LIKE '%handle%'
      )
      ORDER BY n.nspname, p.proname;
    `)
    
    if (functions.data && functions.data.length > 0) {
      console.log('   Found functions:')
      functions.data.forEach(f => {
        console.log(`   - ${f.schema_name}.${f.function_name}(${f.arguments})`)
      })
    } else {
      console.log('   No user/profile functions found')
    }
    console.log()
    
    // 5. Check for specific issues
    console.log('5️⃣ Checking for profile sync issues...')
    const syncIssues = await executeSQLViaAPI(`
      WITH user_profile_status AS (
        SELECT 
          u.id,
          u.email,
          u.created_at as user_created,
          p.id as profile_id,
          p.created_at as profile_created,
          ur.role
        FROM auth.users u
        LEFT JOIN profiles p ON u.id = p.id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
      )
      SELECT 
        COUNT(*) FILTER (WHERE profile_id IS NULL) as users_without_profiles,
        COUNT(*) FILTER (WHERE profile_id IS NOT NULL) as users_with_profiles,
        COUNT(*) FILTER (WHERE role IS NULL) as users_without_roles,
        COUNT(*) as total_users
      FROM user_profile_status;
    `)
    
    const stats = syncIssues.data?.[0] || {}
    console.log(`   Total users: ${stats.total_users || 0}`)
    console.log(`   Users with profiles: ${stats.users_with_profiles || 0}`)
    console.log(`   Users WITHOUT profiles: ${stats.users_without_profiles || 0}`)
    console.log(`   Users without roles: ${stats.users_without_roles || 0}`)
    
    // 6. Get sample of recent users
    console.log('\n6️⃣ Recent user activity...')
    const recentUsers = await executeSQLViaAPI(`
      SELECT 
        u.id,
        u.email,
        u.created_at,
        CASE WHEN p.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_profile,
        ur.role
      FROM auth.users u
      LEFT JOIN profiles p ON u.id = p.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      ORDER BY u.created_at DESC
      LIMIT 5;
    `)
    
    if (recentUsers.data && recentUsers.data.length > 0) {
      console.log('   Last 5 users:')
      recentUsers.data.forEach(u => {
        console.log(`   - ${u.email} (Created: ${u.created_at})`)
        console.log(`     Profile: ${u.has_profile}, Role: ${u.role || 'none'}`)
      })
    } else {
      console.log('   No users found')
    }
    
    // Summary
    console.log('\n===========================')
    console.log('📊 Summary:')
    
    if (stats.users_without_profiles > 0) {
      console.log(`\n⚠️  CRITICAL: ${stats.users_without_profiles} users don't have profiles!`)
      console.log('   This means the profile creation trigger is NOT working.')
      console.log('\n🔧 Recommended action:')
      console.log('   1. Create the trigger manually in Supabase dashboard')
      console.log('   2. Run a migration to create profiles for existing users')
    } else if (stats.total_users === 0) {
      console.log('\n⚠️  No users in the system yet')
      console.log('   Cannot verify if trigger works until first signup')
    } else {
      console.log('\n✅ All users have profiles - trigger appears to be working!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

debugProfileSystem()