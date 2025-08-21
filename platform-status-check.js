#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function platformStatusCheck() {
    console.log('🔍 Stand Up Sydney Platform Status Check')
    console.log('=' .repeat(50))
    
    let allGood = true
    
    try {
        // 1. Database Connection
        console.log('\n1. 🗄️ Database Connection...')
        const { data: dbTest, error: dbError } = await supabase
            .from('profiles')
            .select('count', { count: 'exact', head: true })
        if (dbError) {
            console.log('   ❌ Database connection failed:', dbError.message)
            allGood = false
        } else {
            console.log('   ✅ Database connected successfully')
        }

        // 2. Authentication System
        console.log('\n2. 🔐 Authentication System...')
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
        if (usersError) {
            console.log('   ❌ Auth system error:', usersError.message)
            allGood = false
        } else {
            console.log(`   ✅ Auth system working (${users.users.length} users)`)
            users.users.forEach(user => {
                console.log(`     - ${user.email} (${user.id.substring(0, 8)}...)`)
            })
        }

        // 3. Profile System
        console.log('\n3. 👤 Profile System...')
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
        if (profilesError) {
            console.log('   ❌ Profile system error:', profilesError.message)
            allGood = false
        } else {
            console.log(`   ✅ Profile system working (${profiles.length} profiles)`)
            profiles.forEach(profile => {
                console.log(`     - ${profile.name} (${profile.email})`)
            })
        }

        // 4. Events System
        console.log('\n4. 📅 Events System...')
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .limit(5)
        if (eventsError) {
            console.log('   ❌ Events system error:', eventsError.message)
            allGood = false
        } else {
            console.log(`   ✅ Events system working (${events.length} recent events)`)
            events.forEach(event => {
                console.log(`     - ${event.title} (${event.date})`)
            })
        }

        // 5. User Roles System
        console.log('\n5. 🎭 User Roles System...')
        const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('*')
        if (rolesError) {
            console.log('   ❌ Roles system error:', rolesError.message)
            allGood = false
        } else {
            console.log(`   ✅ Roles system working (${roles.length} role assignments)`)
            const rolesSummary = roles.reduce((acc, role) => {
                acc[role.role] = (acc[role.role] || 0) + 1
                return acc
            }, {})
            Object.entries(rolesSummary).forEach(([role, count]) => {
                console.log(`     - ${role}: ${count} users`)
            })
        }

        // 6. Storage System
        console.log('\n6. 📁 Storage System...')
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
        if (bucketsError) {
            console.log('   ❌ Storage system error:', bucketsError.message)
            allGood = false
        } else {
            console.log(`   ✅ Storage system working (${buckets.length} buckets)`)
            buckets.forEach(bucket => {
                console.log(`     - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
            })
        }

        // 7. Frontend Status
        console.log('\n7. 🌐 Frontend Status...')
        try {
            const response = await fetch('http://localhost:8084/')
            if (response.ok) {
                console.log('   ✅ Frontend serving on port 8084')
            } else {
                console.log('   ❌ Frontend not responding properly')
                allGood = false
            }
        } catch (error) {
            console.log('   ❌ Frontend connection failed:', error.message)
            allGood = false
        }

        // Overall Status
        console.log('\n' + '=' .repeat(50))
        if (allGood) {
            console.log('🎉 PLATFORM STATUS: ALL SYSTEMS OPERATIONAL')
            console.log('✅ Stand Up Sydney is ready for use!')
        } else {
            console.log('⚠️  PLATFORM STATUS: SOME ISSUES DETECTED')
            console.log('🔧 Please review the issues above')
        }
        
        console.log('\n📊 Quick Stats:')
        console.log(`   - Users: ${users?.users?.length || 0}`)
        console.log(`   - Profiles: ${profiles?.length || 0}`)
        console.log(`   - Events: ${events?.length || 0}`)
        console.log(`   - Role Assignments: ${roles?.length || 0}`)
        console.log(`   - Storage Buckets: ${buckets?.length || 0}`)
        
    } catch (error) {
        console.log('❌ Platform check failed:', error.message)
    }
}

platformStatusCheck()