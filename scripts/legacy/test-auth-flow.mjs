import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pdikjpfulhhpqpxzpgtu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjY4NjEsImV4cCI6MjA2NTg0Mjg2MX0.5L8mD4I3MP22p8bcGUFo6EiVHesfvahfYpPPXjGdy54'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testAuthFlow() {
  console.log('🔐 Testing Authentication Flow')
  console.log('==============================\n')
  
  const testEmail = `test-auth-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  
  try {
    console.log('1️⃣ Testing signup flow...')
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${testPassword}\n`)
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Auth',
          last_name: 'Test',
          name: 'Auth Test',
          role: 'comedian'
        }
      }
    })
    
    if (signUpError) {
      console.error('❌ Signup failed:', signUpError.message)
      return
    }
    
    console.log('✅ Signup response received')
    console.log(`   User ID: ${signUpData.user?.id || 'No user ID'}`)
    console.log(`   Session: ${signUpData.session ? 'Created' : 'Not created'}`)
    console.log(`   Email confirmed: ${signUpData.user?.email_confirmed_at ? 'Yes' : 'No'}\n`)
    
    if (!signUpData.session) {
      console.log('⚠️  No session created - email confirmation may be required')
      console.log('   Check your email or disable email confirmations in Supabase\n')
    }
    
    // Wait for potential trigger execution
    console.log('2️⃣ Waiting 3 seconds for database triggers...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Check if user exists in auth.users
    console.log('\n3️⃣ Verifying user creation...')
    if (signUpData.user?.id) {
      // Try to sign in to verify user exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })
      
      if (signInError) {
        console.log('❌ Cannot sign in:', signInError.message)
        if (signInError.message.includes('Email not confirmed')) {
          console.log('   → Email confirmation is required')
        }
      } else {
        console.log('✅ Sign in successful - user exists!')
        console.log(`   Session created: ${signInData.session ? 'Yes' : 'No'}`)
        
        // Check profile
        if (signInData.session) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signInData.user.id)
            .single()
          
          if (profile) {
            console.log('\n✅ Profile found:')
            console.log(`   Name: ${profile.name}`)
            console.log(`   First Name: ${profile.first_name}`)
            console.log(`   Last Name: ${profile.last_name}`)
          } else {
            console.log('\n❌ No profile found')
            console.log(`   Error: ${profileError?.message || 'Unknown'}`)
          }
          
          // Check roles
          const { data: roles } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', signInData.user.id)
          
          if (roles && roles.length > 0) {
            console.log('\n✅ User roles:')
            roles.forEach(role => {
              console.log(`   - ${role.role}`)
            })
          } else {
            console.log('\n❌ No roles found')
          }
          
          // Sign out
          await supabase.auth.signOut()
        }
      }
    }
    
    console.log('\n==============================')
    console.log('📊 Test Summary:')
    console.log(`   Signup: ${signUpData.user ? '✅ Success' : '❌ Failed'}`)
    console.log(`   Session: ${signUpData.session ? '✅ Created' : '⚠️  Not created (email confirmation required?)'}`)
    console.log(`   Next step: ${signUpData.session ? 'User can sign in immediately' : 'User must confirm email first'}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testAuthFlow()