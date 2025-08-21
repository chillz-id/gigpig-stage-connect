#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testProfileCreation() {
    console.log('🔍 Testing profile creation trigger...')
    
    try {
        // Check if trigger exists
        console.log('1. Checking if handle_new_user trigger exists...')
        const { data: triggers, error: triggerError } = await supabase
            .rpc('exec', { sql: `
                SELECT 
                    trigger_name, 
                    event_manipulation,
                    event_object_table,
                    action_statement
                FROM information_schema.triggers 
                WHERE trigger_name = 'on_auth_user_created'
            ` })
        
        if (triggerError) {
            console.log('❌ Trigger check error:', triggerError.message)
        } else {
            console.log('✅ Trigger query executed')
            console.log('Triggers found:', triggers)
        }

        // Check if function exists
        console.log('2. Checking if handle_new_user function exists...')
        const { data: functions, error: funcError } = await supabase
            .rpc('exec', { sql: `
                SELECT proname, prosrc 
                FROM pg_proc 
                WHERE proname = 'handle_new_user'
            ` })
        
        if (funcError) {
            console.log('❌ Function check error:', funcError.message)
        } else {
            console.log('✅ Function query executed')
            console.log('Functions found:', functions)
        }

        // Check profiles table structure
        console.log('3. Checking profiles table structure...')
        const { data: columns, error: colError } = await supabase
            .rpc('exec', { sql: `
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'profiles' AND table_schema = 'public'
                ORDER BY ordinal_position
            ` })
        
        if (colError) {
            console.log('❌ Columns check error:', colError.message)
        } else {
            console.log('✅ Profiles table columns:')
            columns.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type}`)
            })
        }

    } catch (error) {
        console.log('❌ Test failed:', error.message)
    }
}

testProfileCreation()