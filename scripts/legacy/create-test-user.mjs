import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pdikjpfulhhpqpxzpgtu.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfa2V5IiwiaWF0IjoxNzUwMjY2ODYxLCJleHAiOjIwNjU4NDI4NjF9.2VsHqMxgPfHDq6TyU2vBnwKqHKfAOg8vb1FYBvgm8TM'

// Create admin client with service role key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  console.log('🧪 Creating Test User')
  console.log('====================\n')
  
  try {
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    console.log('1️⃣ Creating user via Admin API...')
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${testPassword}\n`)
    
    // Create user using admin API
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: 'Test',
        last_name: 'User',
        name: 'Test User',
        role: 'comedian'
      }
    })
    
    if (error) {
      throw error
    }
    
    console.log('✅ User created successfully!')
    console.log(`   User ID: ${user.user.id}`)
    console.log(`   Email: ${user.user.email}`)
    console.log(`   Confirmed: ${user.user.email_confirmed_at ? 'Yes' : 'No'}\n`)
    
    // Wait a moment for trigger to fire
    console.log('2️⃣ Waiting for profile trigger...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check if profile was created
    console.log('3️⃣ Checking profile...')
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single()
    
    if (profileError) {
      console.log('❌ Profile not created by trigger!')
      console.log('   Error:', profileError.message)
      
      console.log('\n4️⃣ Creating profile manually...')
      const { error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.user.id,
          email: user.user.email,
          first_name: 'Test',
          last_name: 'User',
          name: 'Test User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (createError) {
        console.log('❌ Failed to create profile:', createError.message)
      } else {
        console.log('✅ Profile created manually')
      }
      
      // Create role manually
      console.log('\n5️⃣ Creating user role...')
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: user.user.id,
          role: 'comedian',
          created_at: new Date().toISOString()
        })
      
      if (roleError && !roleError.message.includes('duplicate')) {
        console.log('❌ Failed to create role:', roleError.message)
      } else {
        console.log('✅ Role created')
      }
    } else {
      console.log('✅ Profile created by trigger!')
      console.log(`   Name: ${profile.name}`)
      console.log(`   First Name: ${profile.first_name}`)
      console.log(`   Last Name: ${profile.last_name}`)
    }
    
    // Check roles
    console.log('\n6️⃣ Checking user roles...')
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', user.user.id)
    
    if (roles && roles.length > 0) {
      console.log('✅ User roles:')
      roles.forEach(role => {
        console.log(`   - ${role.role}`)
      })
    } else {
      console.log('❌ No roles found')
    }
    
    console.log('\n====================')
    console.log('✅ Test user created!')
    console.log('\n📋 Test Credentials:')
    console.log(`Email: ${testEmail}`)
    console.log(`Password: ${testPassword}`)
    console.log('\nYou can now test signing in with these credentials.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n💡 Troubleshooting:')
    console.log('1. Check if SUPABASE_SERVICE_ROLE_KEY is correct')
    console.log('2. Ensure the database tables exist')
    console.log('3. Check Supabase dashboard for error logs')
  }
}

createTestUser()