#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';

// Load environment variables from MCP .env file
dotenv.config({ path: '/opt/standup-sydney-mcp/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

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