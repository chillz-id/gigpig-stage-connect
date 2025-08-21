#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
    console.log('🔍 Testing Supabase connection...')
    
    try {
        // Test 1: Count users
        console.log('1. Testing auth.users access...')
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
        if (usersError) {
            console.log('❌ Users error:', usersError.message)
        } else {
            console.log(`✅ Found ${users.users.length} users in auth.users`)
        }

        // Test 2: Count profiles
        console.log('2. Testing public.profiles access...')
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
        if (profilesError) {
            console.log('❌ Profiles error:', profilesError.message)
        } else {
            console.log(`✅ Found ${profiles} profiles in public.profiles`)
        }

        // Test 3: Check admin user
        console.log('3. Finding admin user...')
        const { data: adminUser, error: adminError } = await supabase.auth.admin.listUsers()
        if (adminError) {
            console.log('❌ Admin search error:', adminError.message)
        } else {
            const admin = adminUser.users.find(u => u.email === 'info@standupsydney.com')
            console.log(`✅ Admin user found: ${admin ? 'YES' : 'NO'}`)
            if (admin) {
                console.log(`   Admin ID: ${admin.id}`)
            }
        }

    } catch (error) {
        console.log('❌ Connection failed:', error.message)
    }
}

testConnection()