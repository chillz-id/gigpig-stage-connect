import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pdikjpfulhhpqpxzpgtu.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfa2V5IiwiaWF0IjoxNzUwMjY2ODYxLCJleHAiOjIwNjU4NDI4NjF9.2VsHqMxgPfHDq6TyU2vBnwKqHKfAOg8vb1FYBvgm8TM'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Users from dashboard
const dashboardUsers = [
  { id: 'cc8e6620-8dc5-4c25-bf71-ee7383eefcaa', email: 'chillz.id@gmail.com', name: 'Comedian Test' },
  { id: '2fc4f578-7216-447a-87f6-7bf9f4c9bd96', email: 'chillz@standupsydney.com', name: 'Chillz Skinner' },
  { id: 'dd37906f-aa40-443e-930c-22d661e68c4f', email: 'test.comedian.2gud@gmail.com', name: '' },
  { id: '0ba37563-a90b-4843-a4b2-f08f162a68a3', email: 'info@standupsydney.com', name: '' }
]

async function checkDashboardUsers() {
  console.log('🔍 Checking Profiles for Dashboard Users')
  console.log('========================================\n')
  
  for (const user of dashboardUsers) {
    console.log(`\n📋 User: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Display Name: ${user.name || '(not set)'}\n`)
    
    try {
      // Check for profile(s)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
      
      if (error) {
        console.log(`   ❌ Error checking profile: ${error.message}`)
        continue
      }
      
      if (!profiles || profiles.length === 0) {
        console.log('   ❌ No profile found')
        
        // Create profile
        console.log('   🔧 Creating profile...')
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            name: user.name || user.email.split('@')[0],
            first_name: user.name ? user.name.split(' ')[0] : '',
            last_name: user.name ? user.name.split(' ').slice(1).join(' ') : '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (createError) {
          console.log(`   ❌ Failed to create profile: ${createError.message}`)
        } else {
          console.log('   ✅ Profile created successfully')
          
          // Create default role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'member',
              created_at: new Date().toISOString()
            })
          
          if (!roleError) {
            console.log('   ✅ Default role (member) assigned')
          }
        }
      } else if (profiles.length === 1) {
        console.log('   ✅ Profile exists')
        const profile = profiles[0]
        console.log(`      - Name: ${profile.name || '(empty)'}`)
        console.log(`      - First Name: ${profile.first_name || '(empty)'}`)
        console.log(`      - Last Name: ${profile.last_name || '(empty)'}`)
        console.log(`      - Created: ${profile.created_at}`)
        
        // Check roles
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
        
        if (roles && roles.length > 0) {
          console.log(`      - Roles: ${roles.map(r => r.role).join(', ')}`)
        } else {
          console.log('      - Roles: (none)')
        }
      } else {
        console.log(`   ⚠️  MULTIPLE PROFILES FOUND (${profiles.length})!`)
        console.log('   This is causing the 406 error!')
        
        // Show all profiles
        profiles.forEach((profile, index) => {
          console.log(`\n   Profile ${index + 1}:`)
          console.log(`      - Created: ${profile.created_at}`)
          console.log(`      - Name: ${profile.name || '(empty)'}`)
          console.log(`      - Email: ${profile.email}`)
        })
        
        // Keep oldest, delete rest
        console.log('\n   🔧 Fixing duplicates...')
        const sorted = profiles.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        const toKeep = sorted[0]
        const toDelete = sorted.slice(1)
        
        for (const profile of toDelete) {
          const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id)
            .eq('created_at', profile.created_at)
          
          if (deleteError) {
            console.log(`   ❌ Failed to delete duplicate: ${deleteError.message}`)
          } else {
            console.log(`   ✅ Deleted duplicate created at ${profile.created_at}`)
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Unexpected error: ${error.message}`)
    }
  }
  
  console.log('\n========================================')
  console.log('✅ Profile check complete!')
  console.log('\n📝 Next steps:')
  console.log('1. Test signin with one of these users')
  console.log('2. Verify profile data loads correctly')
  console.log('3. Test profile updates save properly')
}

checkDashboardUsers()