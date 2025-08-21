import { createClient } from '@supabase/supabase-js';

// Database configuration
const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE';

// Create Supabase client with service key
const supabase = createClient(supabaseUrl, serviceKey);

async function checkProfilesDetailed() {
  console.log('Detailed profiles table analysis...\n');

  try {
    // Get all profiles to see current data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }

    console.log(`Found ${profiles.length} profiles in the table\n`);

    // Show actual columns from the data
    if (profiles.length > 0) {
      console.log('Actual columns in profiles table:');
      console.log('================================');
      const columns = Object.keys(profiles[0]);
      columns.forEach((col, index) => {
        console.log(`${index + 1}. ${col}`);
      });

      console.log('\nColumn existence check:');
      console.log('======================');
      console.log(`first_name exists: ${columns.includes('first_name') ? 'YES' : 'NO'}`);
      console.log(`last_name exists: ${columns.includes('last_name') ? 'YES' : 'NO'}`);
      console.log(`display_name exists: ${columns.includes('display_name') ? 'YES' : 'NO'}`);
      console.log(`name exists: ${columns.includes('name') ? 'YES' : 'NO'}`);
      console.log(`stage_name exists: ${columns.includes('stage_name') ? 'YES' : 'NO'}`);

      console.log('\nSample data from profiles:');
      console.log('==========================');
      profiles.forEach((profile, index) => {
        console.log(`Profile ${index + 1}:`);
        console.log(`  ID: ${profile.id}`);
        console.log(`  Email: ${profile.email}`);
        console.log(`  Name: ${profile.name || 'null'}`);
        console.log(`  Stage Name: ${profile.stage_name || 'null'}`);
        console.log(`  Bio: ${profile.bio ? profile.bio.substring(0, 50) + '...' : 'null'}`);
        console.log(`  Location: ${profile.location || 'null'}`);
        console.log(`  Avatar URL: ${profile.avatar_url || 'null'}`);
        console.log(`  Profile Slug: ${profile.profile_slug || 'null'}`);
        console.log(`  Created: ${profile.created_at}`);
        console.log('');
      });
    }

    // Try to check if display_name exists by trying to select it
    console.log('Testing display_name column access...');
    const { data: displayNameTest, error: displayNameError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .limit(1);

    if (displayNameError) {
      console.log(`display_name column test failed: ${displayNameError.message}`);
    } else {
      console.log('display_name column exists and is accessible');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the detailed check
checkProfilesDetailed()
  .then(() => {
    console.log('\nDetailed analysis complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });