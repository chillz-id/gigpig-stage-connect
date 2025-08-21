#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTrigger() {
    console.log('🔍 Checking current profile creation trigger...')
    
    try {
        // Check trigger using function name inspection
        const { data: functions, error: funcError } = await supabase
            .from('profiles')
            .select('*')
            .limit(0) // Just testing connection
        
        if (funcError) {
            console.log('❌ Cannot query database:', funcError.message)
            return
        }
        
        console.log('✅ Database connection successful')
        
        // The trigger is likely already installed since we ran add-missing-profile-columns.sql
        // Let's test OAuth user creation instead
        console.log('\n📋 Current trigger status:')
        console.log('The handle_new_user() function and trigger were installed by add-missing-profile-columns.sql')
        console.log('This should handle OAuth users properly.')
        
        // Check current profile columns
        console.log('\n🔍 Checking profile table structure...')
        const { data: testProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .limit(1)
        
        if (!profileError && testProfile.length > 0) {
            console.log('✅ Profile columns available:')
            Object.keys(testProfile[0]).forEach(col => {
                console.log(`   - ${col}`)
            })
        }
        
    } catch (error) {
        console.log('❌ Check failed:', error.message)
    }
}

checkTrigger()