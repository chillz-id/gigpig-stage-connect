const SUPABASE_ACCESS_TOKEN = 'sbp_YOUR_SUPABASE_ACCESS_TOKEN_HERE_GET_FROM_OWNER'
const PROJECT_REF = 'pdikjpfulhhpqpxzpgtu'

// Users from dashboard
const dashboardUsers = [
  { id: 'cc8e6620-8dc5-4c25-bf71-ee7383eefcaa', email: 'chillz.id@gmail.com', name: 'Comedian Test' },
  { id: '2fc4f578-7216-447a-87f6-7bf9f4c9bd96', email: 'chillz@standupsydney.com', name: 'Chillz Skinner' },
  { id: 'dd37906f-aa40-443e-930c-22d661e68c4f', email: 'test.comedian.2gud@gmail.com', name: '' },
  { id: '0ba37563-a90b-4843-a4b2-f08f162a68a3', email: 'info@standupsydney.com', name: '' }
]

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

async function fixProfilesForUsers() {
  console.log('🔧 Fixing Profiles for Dashboard Users')
  console.log('======================================\\n')
  
  try {
    // First, check if profiles table exists
    console.log('1️⃣ Checking profiles table...')
    const tableCheck = await executeSQLViaAPI(`
      SELECT COUNT(*) as count FROM public.profiles LIMIT 1
    `)
    console.log(`   Total profiles in system: ${tableCheck.data?.[0]?.count || 0}\\n`)
    
    // Check each user
    for (const user of dashboardUsers) {
      console.log(`\\n👤 Checking: ${user.email}`)
      console.log(`   ID: ${user.id}`)
      
      try {
        // Check for existing profiles
        const profileCheck = await executeSQLViaAPI(`
          SELECT id, email, name, first_name, last_name, created_at
          FROM public.profiles
          WHERE id = '${user.id}'
        `)
        
        if (!profileCheck.data || profileCheck.data.length === 0) {
          console.log('   ❌ No profile found')
          
          // Create profile
          console.log('   🔧 Creating profile...')
          const firstName = user.name ? user.name.split(' ')[0] : ''
          const lastName = user.name ? user.name.split(' ').slice(1).join(' ') : ''
          const displayName = user.name || user.email.split('@')[0]
          
          await executeSQLViaAPI(`
            INSERT INTO public.profiles (
              id, email, name, first_name, last_name, created_at, updated_at
            ) VALUES (
              '${user.id}',
              '${user.email}',
              '${displayName}',
              '${firstName}',
              '${lastName}',
              NOW(),
              NOW()
            )
          `)
          console.log('   ✅ Profile created')
          
          // Create default role
          await executeSQLViaAPI(`
            INSERT INTO public.user_roles (user_id, role, created_at)
            VALUES ('${user.id}', 'member', NOW())
            ON CONFLICT (user_id, role) DO NOTHING
          `)
          console.log('   ✅ Default member role assigned')
          
        } else if (profileCheck.data.length === 1) {
          const profile = profileCheck.data[0]
          console.log('   ✅ Profile exists')
          console.log(`      Name: ${profile.name || '(empty)'}`)
          console.log(`      First: ${profile.first_name || '(empty)'}`)
          console.log(`      Last: ${profile.last_name || '(empty)'}`)
          
          // Update if missing name data
          if (!profile.first_name && !profile.last_name && user.name) {
            console.log('   🔧 Updating name fields...')
            const firstName = user.name.split(' ')[0]
            const lastName = user.name.split(' ').slice(1).join(' ')
            
            await executeSQLViaAPI(`
              UPDATE public.profiles
              SET 
                first_name = '${firstName}',
                last_name = '${lastName}',
                name = COALESCE(name, '${user.name}'),
                updated_at = NOW()
              WHERE id = '${user.id}'
            `)
            console.log('   ✅ Name fields updated')
          }
          
          // Check roles
          const rolesCheck = await executeSQLViaAPI(`
            SELECT role FROM public.user_roles WHERE user_id = '${user.id}'
          `)
          
          if (rolesCheck.data && rolesCheck.data.length > 0) {
            console.log(`      Roles: ${rolesCheck.data.map(r => r.role).join(', ')}`)
          } else {
            console.log('      Roles: (none) - creating default...')
            await executeSQLViaAPI(`
              INSERT INTO public.user_roles (user_id, role, created_at)
              VALUES ('${user.id}', 'member', NOW())
            `)
            console.log('   ✅ Default member role assigned')
          }
          
        } else {
          console.log(`   ⚠️  DUPLICATE PROFILES (${profileCheck.data.length})!`)
          
          // Fix duplicates
          const profiles = profileCheck.data.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
          
          console.log('   🔧 Removing duplicates...')
          for (let i = 1; i < profiles.length; i++) {
            await executeSQLViaAPI(`
              DELETE FROM public.profiles
              WHERE id = '${user.id}'
              AND created_at = '${profiles[i].created_at}'
            `)
            console.log(`   ✅ Removed duplicate created at ${profiles[i].created_at}`)
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
      }
    }
    
    // Summary
    console.log('\\n======================================')
    console.log('📊 Summary:\\n')
    
    // Count total profiles
    const finalCount = await executeSQLViaAPI(`
      SELECT COUNT(*) as count FROM public.profiles
    `)
    console.log(`Total profiles in system: ${finalCount.data?.[0]?.count || 0}`)
    
    // Check for any duplicates remaining
    const duplicateCheck = await executeSQLViaAPI(`
      SELECT id, COUNT(*) as count
      FROM public.profiles
      GROUP BY id
      HAVING COUNT(*) > 1
    `)
    
    if (duplicateCheck.data && duplicateCheck.data.length > 0) {
      console.log(`\\n⚠️  Still have ${duplicateCheck.data.length} users with duplicate profiles`)
    } else {
      console.log('\\n✅ No duplicate profiles found')
    }
    
    console.log('\\n✅ Profile fixes complete!')
    console.log('\\n📝 You can now test signing in with:')
    console.log('   Email: chillz.id@gmail.com')
    console.log('   Email: chillz@standupsydney.com')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

fixProfilesForUsers()