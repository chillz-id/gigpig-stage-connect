import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProfilePictureIssue() {
  console.log('🔍 Checking profile picture issue...\n');

  try {
    // 1. Get chillz profile
    console.log('1. Checking chillz@standupsydney.com profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'chillz@standupsydney.com')
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return;
    }

    console.log('Profile found:');
    console.log('- ID:', profile.id);
    console.log('- Name:', profile.name);
    console.log('- Avatar URL:', profile.avatar_url);
    console.log('- Updated at:', profile.updated_at);

    // 2. Check storage bucket
    console.log('\n2. Checking profile-images bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
    } else {
      const profileImagesBucket = buckets.find(b => b.name === 'profile-images');
      if (profileImagesBucket) {
        console.log('✓ profile-images bucket exists');
        console.log('- Public:', profileImagesBucket.public);
        
        // Check bucket policies
        console.log('\n3. Checking bucket policies...');
        // Note: Can't directly check policies via JS client, but we can test access
        
        // List files for this user
        console.log('\n4. Listing files for user...');
        const { data: files, error: filesError } = await supabase.storage
          .from('profile-images')
          .list(profile.id, {
            limit: 10,
            offset: 0
          });

        if (filesError) {
          console.error('Error listing files:', filesError);
        } else {
          console.log(`Found ${files?.length || 0} files for user ${profile.id}:`);
          files?.forEach(file => {
            console.log(`- ${file.name} (${file.metadata?.size || 0} bytes, updated: ${file.updated_at})`);
          });
        }

        // Test if avatar URL is accessible
        if (profile.avatar_url) {
          console.log('\n5. Testing avatar URL accessibility...');
          try {
            const response = await fetch(profile.avatar_url);
            console.log(`- HTTP Status: ${response.status}`);
            console.log(`- Content Type: ${response.headers.get('content-type')}`);
            
            if (response.status === 200) {
              console.log('✓ Avatar URL is accessible');
            } else {
              console.log('❌ Avatar URL is not accessible');
            }
          } catch (error) {
            console.error('❌ Failed to fetch avatar URL:', error.message);
          }
        }

      } else {
        console.log('❌ profile-images bucket not found!');
      }
    }

    // 3. Check RLS policies on profiles table
    console.log('\n6. Testing profile update...');
    const testUpdate = await supabase
      .from('profiles')
      .update({ 
        avatar_url: profile.avatar_url ? profile.avatar_url + '?test=1' : 'https://example.com/test.jpg' 
      })
      .eq('id', profile.id)
      .select();

    if (testUpdate.error) {
      console.error('❌ Profile update failed:', testUpdate.error);
    } else {
      console.log('✓ Profile update successful');
      
      // Revert the test change
      await supabase
        .from('profiles')
        .update({ avatar_url: profile.avatar_url })
        .eq('id', profile.id);
    }

    // 4. Check for common issues
    console.log('\n7. Common issues check:');
    console.log('- Profile has avatar_url:', !!profile.avatar_url);
    console.log('- Avatar URL format:', profile.avatar_url ? new URL(profile.avatar_url).pathname : 'N/A');
    
    if (profile.avatar_url && profile.avatar_url.includes('profile-images')) {
      console.log('- URL appears to be from correct bucket');
    } else if (profile.avatar_url) {
      console.log('- URL is from external source or different bucket');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkProfilePictureIssue();