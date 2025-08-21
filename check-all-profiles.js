#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllProfiles() {
    console.log('\n=== CHECKING ALL PROFILES IN SYSTEM ===\n');

    // 1. Get all profiles
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.log('❌ Error fetching profiles:', error.message);
        return;
    }

    console.log(`Total profiles in database: ${profiles?.length || 0}`);
    
    if (profiles && profiles.length > 0) {
        console.log('\nProfiles found:');
        profiles.forEach((profile, index) => {
            console.log(`\n${index + 1}. Profile ID: ${profile.id}`);
            console.log(`   Email: ${profile.email || 'NOT SET'}`);
            console.log(`   Name: ${profile.name || 'NOT SET'}`);
            console.log(`   Stage Name: ${profile.stage_name || 'NOT SET'}`);
            console.log(`   Avatar: ${profile.avatar_url ? 'YES' : 'NO'}`);
            console.log(`   Created: ${profile.created_at}`);
            console.log(`   Updated: ${profile.updated_at}`);
            console.log(`   Phone: ${profile.phone ? 'SET' : 'NOT SET'}`);
            console.log(`   Bio: ${profile.bio ? 'SET' : 'NOT SET'}`);
        });
    } else {
        console.log('\n⚠️  NO PROFILES FOUND IN THE DATABASE!');
    }

    // 2. Check auth.users to see how many users exist
    console.log('\n=== CHECKING AUTH USERS ===\n');
    
    // We need service role key to access auth.users
    // For now, let's check uploaded files to infer user count
    const { data: folders } = await supabase.storage
        .from('profile-images')
        .list('', { limit: 100 });

    if (folders && folders.length > 0) {
        console.log(`\nUsers who have uploaded profile images: ${folders.length}`);
        console.log('User IDs from storage:');
        folders.forEach((folder, index) => {
            if (folder.name && folder.name.match(/^[0-9a-f-]{36}$/)) {
                console.log(`${index + 1}. ${folder.name}`);
            }
        });
    }

    // 3. Check for any user_roles
    console.log('\n=== CHECKING USER ROLES ===\n');
    const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .limit(20);

    if (!rolesError && roles) {
        console.log(`Total user roles: ${roles.length}`);
        if (roles.length > 0) {
            console.log('\nThis means users ARE being created, but profiles are NOT!');
            const uniqueUsers = new Set(roles.map(r => r.user_id));
            console.log(`Unique users with roles: ${uniqueUsers.size}`);
        }
    }
}

checkAllProfiles().catch(console.error);