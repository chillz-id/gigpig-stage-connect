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

async function checkRecentSignups() {
  console.log('🔍 Checking Recent Signups')
  console.log('==========================\n')
  
  try {
    // 1. Check total users
    console.log('1️⃣ Total users in system...')
    const totalUsers = await executeSQLViaAPI(`
      SELECT COUNT(*) as count FROM auth.users
    `)
    console.log(`   Total users: ${totalUsers.data?.[0]?.count || 0}`)
    
    // 2. Get recent signups
    console.log('\n2️⃣ Recent signups (last 24 hours)...')
    const recentUsers = await executeSQLViaAPI(`
      SELECT 
        id,
        email,
        created_at,
        raw_user_meta_data
      FROM auth.users
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 10
    `)
    
    if (recentUsers.data && recentUsers.data.length > 0) {
      console.log(`   Found ${recentUsers.data.length} recent signups:\n`)
      recentUsers.data.forEach(user => {
        console.log(`   User: ${user.email}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Created: ${user.created_at}`)
        console.log(`   Metadata:`, JSON.stringify(user.raw_user_meta_data || {}, null, 2))
        console.log('   ---')
      })
    } else {
      console.log('   No signups in the last 24 hours')
    }
    
    // 3. Check for orphaned profiles
    console.log('\n3️⃣ Checking for orphaned profiles...')
    const orphanedProfiles = await executeSQLViaAPI(`
      SELECT 
        p.id,
        p.email,
        p.created_at
      FROM profiles p
      LEFT JOIN auth.users u ON p.id = u.id
      WHERE u.id IS NULL
      LIMIT 10
    `)
    
    if (orphanedProfiles.data && orphanedProfiles.data.length > 0) {
      console.log(`   ⚠️  Found ${orphanedProfiles.data.length} orphaned profiles (profiles without users)`)
      orphanedProfiles.data.forEach(profile => {
        console.log(`   - ${profile.email} (ID: ${profile.id})`)
      })
    } else {
      console.log('   ✅ No orphaned profiles found')
    }
    
    // 4. Check trigger status
    console.log('\n4️⃣ Checking profile creation trigger...')
    const triggerCheck = await executeSQLViaAPI(`
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_schema,
        event_object_table,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = 'auth'
      AND event_object_table = 'users'
      AND trigger_name LIKE '%user%'
    `)
    
    if (triggerCheck.data && triggerCheck.data.length > 0) {
      console.log('   ✅ Found user creation triggers:')
      triggerCheck.data.forEach(t => {
        console.log(`   - ${t.trigger_name} on ${t.event_manipulation}`)
      })
    } else {
      console.log('   ❌ No user creation triggers found!')
    }
    
    // 5. Check if trigger function exists
    console.log('\n5️⃣ Checking handle_new_user function...')
    const functionCheck = await executeSQLViaAPI(`
      SELECT 
        routine_name,
        routine_schema
      FROM information_schema.routines
      WHERE routine_name = 'handle_new_user'
      AND routine_type = 'FUNCTION'
    `)
    
    if (functionCheck.data && functionCheck.data.length > 0) {
      console.log(`   ✅ Function exists in schema: ${functionCheck.data[0].routine_schema}`)
    } else {
      console.log('   ❌ handle_new_user function not found!')
    }
    
    console.log('\n==========================')
    console.log('📊 Summary:')
    
    const hasUsers = totalUsers.data?.[0]?.count > 0
    const hasTrigger = triggerCheck.data?.length > 0
    const hasFunction = functionCheck.data?.length > 0
    
    if (!hasUsers) {
      console.log('\n⚠️  No users in the system - signup may not be working')
      console.log('   Check if Supabase Auth is properly configured')
    }
    
    if (!hasTrigger || !hasFunction) {
      console.log('\n⚠️  Profile creation trigger not properly set up')
      console.log('   Run: node scripts/fix-profile-trigger.mjs')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkRecentSignups()