#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUserSignup() {
    console.log('🔍 Testing user signup and profile creation...')
    
    const testEmail = 'test@example.com'
    const testPassword = 'TestPassword123!'
    
    try {
        // Step 1: Create a test user
        console.log('1. Creating test user...')
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            user_metadata: {
                name: 'Test User',
                first_name: 'Test',
                last_name: 'User'
            }
        })
        
        if (authError) {
            console.log('❌ User creation error:', authError.message)
            return
        }
        
        console.log('✅ User created successfully')
        console.log('   User ID:', authData.user.id)
        console.log('   Email:', authData.user.email)
        
        // Step 2: Wait a moment for trigger to execute
        console.log('2. Waiting for profile creation trigger...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Step 3: Check if profile was created
        console.log('3. Checking if profile was created...')
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', testEmail)
        
        if (profileError) {
            console.log('❌ Profile check error:', profileError.message)
        } else if (profile.length === 0) {
            console.log('❌ Profile NOT created - trigger may not be working')
        } else {
            console.log('✅ Profile created successfully!')
            console.log('   Profile ID:', profile[0].id)
            console.log('   Name:', profile[0].name)
            console.log('   First Name:', profile[0].first_name)
            console.log('   Last Name:', profile[0].last_name)
        }
        
        // Step 4: Clean up test user
        console.log('4. Cleaning up test user...')
        const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id)
        
        if (deleteError) {
            console.log('❌ User deletion error:', deleteError.message)
        } else {
            console.log('✅ Test user cleaned up')
        }
        
    } catch (error) {
        console.log('❌ Test failed:', error.message)
    }
}

testUserSignup()