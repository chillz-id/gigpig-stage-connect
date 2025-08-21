#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDatabase() {
    console.log('🔍 Checking database structure...')
    
    try {
        // Check profiles table
        console.log('1. Checking profiles table structure...')
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .limit(1)
        
        if (profilesError) {
            console.log('❌ Profiles table error:', profilesError.message)
        } else {
            console.log('✅ Profiles table exists')
            if (profiles.length > 0) {
                console.log('   Sample profile structure:', Object.keys(profiles[0]))
            } else {
                console.log('   No profiles found (empty table)')
            }
        }

        // Check if admin profile exists
        console.log('2. Checking if admin profile exists...')
        const { data: adminProfile, error: adminProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', 'info@standupsydney.com')
        
        if (adminProfileError) {
            console.log('❌ Admin profile error:', adminProfileError.message)
        } else {
            console.log(`✅ Admin profile: ${adminProfile.length > 0 ? 'EXISTS' : 'MISSING'}`)
        }

        // Check current user in auth
        console.log('3. Checking current auth user...')
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
        if (usersError) {
            console.log('❌ Users error:', usersError.message)
        } else {
            console.log(`✅ Current auth users: ${users.users.length}`)
            users.users.forEach(user => {
                console.log(`   - ${user.email} (ID: ${user.id})`)
            })
        }

    } catch (error) {
        console.log('❌ Database check failed:', error.message)
    }
}

checkDatabase()