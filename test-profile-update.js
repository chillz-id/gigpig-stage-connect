#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileUpdate() {
    console.log('\n=== TESTING PROFILE UPDATE ===\n');

    // Get a user ID from the uploaded files
    const { data: folders } = await supabase.storage
        .from('profile-images')
        .list('', { limit: 1 });

    if (!folders || folders.length === 0) {
        console.log('No uploaded files found');
        return;
    }

    const userId = folders[0].name;
    console.log(`Testing with user ID: ${userId}`);

    // Get user's uploaded image
    const { data: userFiles } = await supabase.storage
        .from('profile-images')
        .list(userId, { limit: 1 });

    if (!userFiles || userFiles.length === 0) {
        console.log('No files for this user');
        return;
    }

    const filePath = `${userId}/${userFiles[0].name}`;
    const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log(`\nPublic URL: ${publicUrl}`);

    // Try to update the profile
    console.log('\nAttempting to update profile...');
    
    const { data, error } = await supabase
        .from('profiles')
        .update({ 
            avatar_url: publicUrl,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

    if (error) {
        console.log('❌ Update failed:', error.message);
        console.log('Error details:', error);
    } else {
        console.log('✅ Update successful!');
        console.log('Updated profile:', data);
    }

    // Check if profile exists
    console.log('\nChecking if profile exists...');
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (fetchError) {
        console.log('❌ Profile fetch error:', fetchError.message);
        if (fetchError.code === 'PGRST116') {
            console.log('⚠️  Profile does not exist for this user!');
            console.log('This is likely the issue - profile needs to be created first');
        }
    } else {
        console.log('✅ Profile exists:', {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at
        });
    }
}

testProfileUpdate().catch(console.error);