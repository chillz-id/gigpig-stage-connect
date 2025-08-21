#!/usr/bin/env node

// Diagnostic script to check current platform state
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjY4NjEsImV4cCI6MjA2NTg0Mjg2MX0.5L8mD4I3MP22p8bcGUFo6EiVHesfvahfYpPPXjGdy54';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostics() {
    console.log('🔍 STAND UP SYDNEY - PLATFORM DIAGNOSTICS');
    console.log('=========================================');
    
    try {
        // 1. Check profiles table
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, name, first_name, last_name, phone, avatar_url')
            .limit(5);
        
        if (profilesError) {
            console.log('❌ Profiles table error:', profilesError.message);
        } else {
            console.log(`✅ Profiles table accessible - ${profiles.length} profiles found`);
            if (profiles.length > 0) {
                console.log('   Sample profile:', JSON.stringify(profiles[0], null, 2));
            }
        }
        
        // 2. Check user_roles table
        const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .limit(5);
        
        if (rolesError) {
            console.log('❌ User roles table error:', rolesError.message);
        } else {
            console.log(`✅ User roles table accessible - ${roles.length} roles found`);
            if (roles.length > 0) {
                console.log('   Sample role:', JSON.stringify(roles[0], null, 2));
            }
        }
        
        // 3. Check storage buckets
        const { data: buckets, error: bucketsError } = await supabase
            .storage
            .listBuckets();
        
        if (bucketsError) {
            console.log('❌ Storage buckets error:', bucketsError.message);
        } else {
            console.log(`✅ Storage buckets accessible - ${buckets.length} buckets found`);
            buckets.forEach(bucket => {
                console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
            });
        }
        
        // 4. Check if profile-images bucket has files
        const { data: files, error: filesError } = await supabase
            .storage
            .from('profile-images')
            .list('');
        
        if (filesError) {
            console.log('❌ Profile images bucket error:', filesError.message);
        } else {
            console.log(`✅ Profile images bucket accessible - ${files.length} files found`);
        }
        
        // 5. Test RPC functions
        const { data: statsData, error: statsError } = await supabase
            .rpc('get_comedian_stats', { _comedian_id: '00000000-0000-0000-0000-000000000000' });
        
        if (statsError) {
            console.log('❌ RPC function error:', statsError.message);
        } else {
            console.log('✅ RPC functions accessible');
        }
        
        // 6. Check for users without profiles
        const { count: totalProfiles, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        
        if (countError) {
            console.log('❌ Profile count error:', countError.message);
        } else {
            console.log(`📊 Total profiles: ${totalProfiles}`);
        }
        
        console.log('=========================================');
        console.log('✅ DIAGNOSTICS COMPLETE');
        
    } catch (error) {
        console.error('❌ Diagnostic error:', error.message);
    }
}

// Run if called directly
runDiagnostics();

export { runDiagnostics };