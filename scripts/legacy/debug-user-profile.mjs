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

async function debugUserProfile() {
  const userId = 'cc8e6620-8dc5-4c25-b771-ee7383eefeca'
  
  console.log('🔍 Debugging User Profile Issue')
  console.log('================================')
  console.log(`User ID: ${userId}\n`)
  
  try {
    // 1. Check if user exists in auth.users
    console.log('1️⃣ Checking auth.users table...')
    const userCheck = await executeSQLViaAPI(`
      SELECT id, email, created_at, raw_user_meta_data
      FROM auth.users 
      WHERE id = '${userId}'
    `)
    
    if (userCheck.data && userCheck.data.length > 0) {
      const user = userCheck.data[0]
      console.log('✅ User found in auth.users:')
      console.log(`   Email: ${user.email}`)
      console.log(`   Created: ${user.created_at}`)
      console.log(`   Metadata:`, JSON.stringify(user.raw_user_meta_data, null, 2))
    } else {
      console.log('❌ User NOT found in auth.users!')
    }
    
    // 2. Check profiles table
    console.log('\n2️⃣ Checking profiles table...')
    const profileCheck = await executeSQLViaAPI(`
      SELECT * FROM profiles 
      WHERE id = '${userId}'
    `)
    
    if (profileCheck.data && profileCheck.data.length > 0) {
      console.log(`✅ Found ${profileCheck.data.length} profile(s) for this user`)
      if (profileCheck.data.length > 1) {
        console.log('⚠️  WARNING: Multiple profiles found! This is causing the 406 error.')
      }
      profileCheck.data.forEach((profile, index) => {
        console.log(`\n   Profile ${index + 1}:`)
        console.log(`   - Email: ${profile.email}`)
        console.log(`   - Name: ${profile.name}`)
        console.log(`   - First Name: ${profile.first_name}`)
        console.log(`   - Last Name: ${profile.last_name}`)
        console.log(`   - Created: ${profile.created_at}`)
      })
    } else {
      console.log('❌ No profile found for this user!')
    }
    
    // 3. Check user_roles
    console.log('\n3️⃣ Checking user_roles...')
    const rolesCheck = await executeSQLViaAPI(`
      SELECT * FROM user_roles 
      WHERE user_id = '${userId}'
    `)
    
    if (rolesCheck.data && rolesCheck.data.length > 0) {
      console.log('✅ User roles:')
      rolesCheck.data.forEach(role => {
        console.log(`   - ${role.role} (created: ${role.created_at})`)
      })
    } else {
      console.log('❌ No roles found for user!')
    }
    
    // 4. Fix duplicate profiles if found
    if (profileCheck.data && profileCheck.data.length > 1) {
      console.log('\n🔧 Fixing duplicate profiles...')
      
      // Keep the oldest profile
      const profiles = profileCheck.data.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      const keepProfile = profiles[0]
      const deleteProfiles = profiles.slice(1)
      
      console.log(`   Keeping profile created at: ${keepProfile.created_at}`)
      console.log(`   Deleting ${deleteProfiles.length} duplicate(s)`)
      
      // Delete duplicates
      for (const profile of deleteProfiles) {
        try {
          await executeSQLViaAPI(`
            DELETE FROM profiles 
            WHERE id = '${userId}' 
            AND created_at = '${profile.created_at}'
          `)
          console.log(`   ✅ Deleted duplicate profile created at ${profile.created_at}`)
        } catch (error) {
          console.log(`   ❌ Failed to delete duplicate: ${error.message}`)
        }
      }
    }
    
    // 5. If no profile exists, create one
    if (!profileCheck.data || profileCheck.data.length === 0) {
      console.log('\n🔧 Creating missing profile...')
      
      const user = userCheck.data?.[0]
      if (user) {
        const metadata = user.raw_user_meta_data || {}
        await executeSQLViaAPI(`
          INSERT INTO profiles (
            id, email, first_name, last_name, name, created_at, updated_at
          ) VALUES (
            '${userId}',
            '${user.email}',
            '${metadata.first_name || ''}',
            '${metadata.last_name || ''}',
            '${metadata.name || metadata.full_name || user.email.split('@')[0]}',
            NOW(),
            NOW()
          )
        `)
        console.log('✅ Profile created successfully')
        
        // Also create role
        await executeSQLViaAPI(`
          INSERT INTO user_roles (user_id, role, created_at)
          VALUES ('${userId}', '${metadata.role || 'member'}', NOW())
          ON CONFLICT DO NOTHING
        `)
        console.log('✅ User role created')
      }
    }
    
    // 6. Check for missing tables causing 400/406 errors
    console.log('\n4️⃣ Checking for missing tables...')
    
    // Check notifications table
    try {
      await executeSQLViaAPI(`SELECT COUNT(*) FROM notifications LIMIT 1`)
      console.log('✅ notifications table exists')
    } catch {
      console.log('❌ notifications table missing or has issues')
    }
    
    // Check notification_preferences
    try {
      await executeSQLViaAPI(`SELECT COUNT(*) FROM notification_preferences LIMIT 1`)
      console.log('✅ notification_preferences table exists')
    } catch {
      console.log('❌ notification_preferences table missing')
    }
    
    // Check xero_integrations
    try {
      await executeSQLViaAPI(`SELECT COUNT(*) FROM xero_integrations LIMIT 1`)
      console.log('✅ xero_integrations table exists')
    } catch {
      console.log('❌ xero_integrations table missing')
    }
    
    console.log('\n================================')
    console.log('✅ Diagnostics complete!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

debugUserProfile()