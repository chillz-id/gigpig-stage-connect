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

async function verifyProfileTrigger() {
  console.log('🔍 Verifying Profile Creation Trigger')
  console.log('=====================================\n')
  
  try {
    // Check if the trigger exists
    const triggerCheck = await executeSQLViaAPI(`
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      AND event_object_table = 'users'
      AND trigger_name LIKE '%user%'
      ORDER BY trigger_name;
    `)
    
    console.log('📋 Found triggers on auth.users table:')
    if (triggerCheck.data && triggerCheck.data.length > 0) {
      triggerCheck.data.forEach(trigger => {
        console.log(`\n✅ Trigger: ${trigger.trigger_name}`)
        console.log(`   Event: ${trigger.event_manipulation}`)
        console.log(`   Action: ${trigger.action_statement}`)
      })
    } else {
      console.log('❌ No triggers found on users table!')
    }
    
    // Check the function that the trigger calls
    const functionCheck = await executeSQLViaAPI(`
      SELECT 
        routine_name,
        routine_definition
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = 'handle_new_user'
      AND routine_type = 'FUNCTION';
    `)
    
    console.log('\n\n📋 Profile creation function:')
    if (functionCheck.data && functionCheck.data.length > 0) {
      console.log('✅ Function handle_new_user exists')
      console.log('\nFunction definition:')
      console.log(functionCheck.data[0].routine_definition)
    } else {
      console.log('❌ Function handle_new_user not found!')
    }
    
    // Check recent profile creations
    const recentProfiles = await executeSQLViaAPI(`
      SELECT 
        p.id,
        p.email,
        p.created_at,
        p.first_name,
        p.last_name,
        ur.role
      FROM profiles p
      LEFT JOIN user_roles ur ON p.id = ur.user_id
      ORDER BY p.created_at DESC
      LIMIT 5;
    `)
    
    console.log('\n\n📋 Recent profile creations:')
    if (recentProfiles.data && recentProfiles.data.length > 0) {
      console.log('Last 5 profiles created:')
      recentProfiles.data.forEach(profile => {
        console.log(`\n- Email: ${profile.email}`)
        console.log(`  Name: ${profile.first_name || ''} ${profile.last_name || ''}`)
        console.log(`  Role: ${profile.role || 'No role assigned'}`)
        console.log(`  Created: ${profile.created_at}`)
      })
    } else {
      console.log('⚠️  No profiles found in the database')
    }
    
    // Test the trigger by checking for orphaned users
    const orphanedUsers = await executeSQLViaAPI(`
      SELECT 
        u.id,
        u.email,
        u.created_at
      FROM auth.users u
      LEFT JOIN profiles p ON u.id = p.id
      WHERE p.id IS NULL
      ORDER BY u.created_at DESC
      LIMIT 5;
    `)
    
    console.log('\n\n📋 Checking for orphaned users (users without profiles):')
    if (orphanedUsers.data && orphanedUsers.data.length > 0) {
      console.log(`\n❌ Found ${orphanedUsers.data.length} users without profiles!`)
      console.log('This indicates the trigger may not be working properly.')
      orphanedUsers.data.forEach(user => {
        console.log(`\n- User ID: ${user.id}`)
        console.log(`  Email: ${user.email}`)
        console.log(`  Created: ${user.created_at}`)
      })
      
      // Attempt to fix by creating profiles for orphaned users
      console.log('\n🔧 Attempting to create profiles for orphaned users...')
      for (const user of orphanedUsers.data) {
        try {
          await executeSQLViaAPI(`
            INSERT INTO profiles (id, email, created_at, updated_at)
            VALUES ('${user.id}', '${user.email}', NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
            
            INSERT INTO user_roles (user_id, role, created_at)
            VALUES ('${user.id}', 'member', NOW())
            ON CONFLICT (user_id, role) DO NOTHING;
          `)
          console.log(`✅ Created profile for ${user.email}`)
        } catch (error) {
          console.log(`❌ Failed to create profile for ${user.email}: ${error.message}`)
        }
      }
    } else {
      console.log('✅ No orphaned users found - trigger appears to be working!')
    }
    
    console.log('\n\n=====================================')
    console.log('📊 Summary:')
    
    const hasTrigger = triggerCheck.data && triggerCheck.data.length > 0
    const hasFunction = functionCheck.data && functionCheck.data.length > 0
    const hasOrphans = orphanedUsers.data && orphanedUsers.data.length > 0
    
    if (hasTrigger && hasFunction && !hasOrphans) {
      console.log('✅ Profile creation trigger is properly configured and working!')
    } else {
      console.log('⚠️  Issues found:')
      if (!hasTrigger) console.log('  - Missing trigger on auth.users table')
      if (!hasFunction) console.log('  - Missing handle_new_user function')
      if (hasOrphans) console.log('  - Found users without profiles')
      
      console.log('\n🔧 To fix, run the profile trigger migration script')
    }
    
  } catch (error) {
    console.error('❌ Error checking profile trigger:', error.message)
  }
}

verifyProfileTrigger()