#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkAuthUsers() {
    console.log('🔍 CHECKING AUTH USERS AND PROFILES');
    console.log('=====================================');
    
    try {
        // Check auth.users using service key
        const { data: authUsers, error: authError } = await supabase
            .from('auth.users')
            .select('id, email, created_at, raw_user_meta_data');
        
        if (authError) {
            console.log('❌ Auth users error:', authError.message);
            
            // Try with RPC call instead
            const { data: userCount, error: countError } = await supabase
                .rpc('get_user_count');
            
            if (countError) {
                console.log('❌ User count RPC error:', countError.message);
            } else {
                console.log('✅ Total users via RPC:', userCount);
            }
            
        } else {
            console.log(`✅ Found ${authUsers.length} users in auth.users`);
            authUsers.forEach((user, idx) => {
                console.log(`   ${idx + 1}. ${user.email} (${user.created_at})`);
                console.log(`      Metadata:`, JSON.stringify(user.raw_user_meta_data || {}, null, 2));
            });
        }
        
        // Check profiles
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, name, first_name, last_name, phone, created_at');
        
        if (profileError) {
            console.log('❌ Profiles error:', profileError.message);
        } else {
            console.log(`✅ Found ${profiles.length} profiles`);
            profiles.forEach((profile, idx) => {
                console.log(`   ${idx + 1}. ${profile.email}: ${profile.first_name} ${profile.last_name}`);
            });
        }
        
        // Check user_roles
        const { data: roles, error: roleError } = await supabase
            .from('user_roles')
            .select('user_id, role, created_at');
        
        if (roleError) {
            console.log('❌ User roles error:', roleError.message);
        } else {
            console.log(`✅ Found ${roles.length} user roles`);
            roles.forEach((role, idx) => {
                console.log(`   ${idx + 1}. ${role.user_id}: ${role.role}`);
            });
        }
        
        // Check if trigger exists
        const { data: triggerData, error: triggerError } = await supabase
            .rpc('check_trigger_exists', { trigger_name: 'on_auth_user_created' });
        
        if (triggerError) {
            console.log('❌ Trigger check error:', triggerError.message);
        } else {
            console.log('✅ Trigger status:', triggerData ? 'EXISTS' : 'MISSING');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkAuthUsers();