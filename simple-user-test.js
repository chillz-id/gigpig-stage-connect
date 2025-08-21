#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjY4NjEsImV4cCI6MjA2NTg0Mjg2MX0.5L8mD4I3MP22p8bcGUFo6EiVHesfvahfYpPPXjGdy54'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignup() {
    console.log('🔍 Testing user signup with real authentication...')
    
    const testEmail = 'test@example.com'
    const testPassword = 'TestPassword123!'
    
    try {
        // Step 1: Try to sign up a user
        console.log('1. Attempting user signup...')
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
                data: {
                    name: 'Test User',
                    first_name: 'Test',
                    last_name: 'User'
                }
            }
        })
        
        if (authError) {
            console.log('❌ Signup error:', authError.message)
            return
        }
        
        console.log('✅ Signup initiated successfully')
        console.log('   User ID:', authData.user?.id)
        console.log('   Email:', authData.user?.email)
        console.log('   Confirmation sent:', authData.user?.email_confirmed_at ? 'Already confirmed' : 'Pending confirmation')
        
        // Step 2: Check if profile was created (regardless of email confirmation)
        console.log('2. Checking if profile was created...')
        
        // Use service key client to check profile creation
        const supabaseService = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE')
        
        const { data: profile, error: profileError } = await supabaseService
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
        
        // Step 3: Clean up the test user
        if (authData.user) {
            console.log('3. Cleaning up test user...')
            const { error: deleteError } = await supabaseService.auth.admin.deleteUser(authData.user.id)
            
            if (deleteError) {
                console.log('❌ User deletion error:', deleteError.message)
            } else {
                console.log('✅ Test user cleaned up')
            }
        }
        
    } catch (error) {
        console.log('❌ Test failed:', error.message)
    }
}

testSignup()