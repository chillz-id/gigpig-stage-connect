#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProfileUpload() {
    console.log('\n=== DEBUGGING PROFILE UPLOAD ===\n');

    // 1. Check if profile-images bucket exists and has files
    console.log('1. Checking profile-images bucket...');
    try {
        const { data: files, error } = await supabase.storage
            .from('profile-images')
            .list('', { limit: 10, offset: 0 });

        if (error) {
            console.log('❌ Error accessing bucket:', error.message);
        } else {
            console.log(`✅ Bucket exists with ${files?.length || 0} folders/files`);
            if (files && files.length > 0) {
                console.log('Recent uploads:');
                files.slice(0, 5).forEach(file => {
                    console.log(`  - ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
                });
            }
        }
    } catch (e) {
        console.log('❌ Exception:', e.message);
    }

    // 2. Get a test user's profile to check avatar_url
    console.log('\n2. Checking user profiles with avatars...');
    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, email, name, avatar_url, updated_at')
            .not('avatar_url', 'is', null)
            .limit(5);

        if (error) {
            console.log('❌ Error fetching profiles:', error.message);
        } else if (profiles && profiles.length > 0) {
            console.log(`✅ Found ${profiles.length} profiles with avatars:`);
            profiles.forEach(profile => {
                console.log(`\n  User: ${profile.name || profile.email}`);
                console.log(`  Avatar URL: ${profile.avatar_url}`);
                console.log(`  Updated: ${profile.updated_at}`);
                
                // Check if URL is accessible
                if (profile.avatar_url) {
                    const url = new URL(profile.avatar_url);
                    console.log(`  Storage path: ${url.pathname}`);
                }
            });
        } else {
            console.log('⚠️  No profiles with avatars found');
        }
    } catch (e) {
        console.log('❌ Exception:', e.message);
    }

    // 3. Test creating a direct public URL
    console.log('\n3. Testing public URL generation...');
    try {
        // Get first user folder
        const { data: folders } = await supabase.storage
            .from('profile-images')
            .list('', { limit: 1 });

        if (folders && folders.length > 0) {
            const userId = folders[0].name;
            
            // List files in that folder
            const { data: userFiles } = await supabase.storage
                .from('profile-images')
                .list(userId, { limit: 1 });

            if (userFiles && userFiles.length > 0) {
                const filePath = `${userId}/${userFiles[0].name}`;
                
                // Get public URL
                const { data } = supabase.storage
                    .from('profile-images')
                    .getPublicUrl(filePath);

                console.log(`✅ Test file: ${filePath}`);
                console.log(`   Public URL: ${data.publicUrl}`);
                
                // Try to fetch the URL
                try {
                    const response = await fetch(data.publicUrl);
                    console.log(`   URL Status: ${response.status} ${response.statusText}`);
                } catch (fetchError) {
                    console.log(`   ❌ Cannot fetch URL: ${fetchError.message}`);
                }
            }
        }
    } catch (e) {
        console.log('❌ Exception:', e.message);
    }

    // 4. Check storage bucket policies
    console.log('\n4. Checking if bucket is public...');
    const bucketUrl = `${supabaseUrl}/storage/v1/object/public/profile-images/test.txt`;
    console.log(`   Bucket base URL: ${bucketUrl}`);

    console.log('\n=== DEBUG COMPLETE ===\n');
}

debugProfileUpload().catch(console.error);