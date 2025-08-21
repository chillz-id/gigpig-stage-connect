import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRecentSignups() {
  console.log('🔍 Checking recent signups and their roles...\n');

  try {
    // 1. Get recent users (last 5)
    console.log('1. Recent users:');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 5
    });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    // Sort by created_at to see most recent first
    const sortedUsers = users.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (const user of sortedUsers) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Email: ${user.email}`);
      console.log(`Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`User ID: ${user.id}`);
      
      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        console.log(`✓ Profile exists - Name: ${profile.name || 'Not set'}`);
      } else {
        console.log(`❌ No profile found`);
      }

      // Check roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, created_at')
        .eq('user_id', user.id);

      if (roles && roles.length > 0) {
        console.log(`✓ Roles: ${roles.map(r => r.role).join(', ')}`);
      } else {
        console.log(`❌ No roles found`);
      }

      // Check metadata
      console.log(`Metadata:`, user.user_metadata);
    }

    // 2. Check if the signup form is passing role data
    console.log('\n\n2. Checking most recent user in detail...');
    if (sortedUsers.length > 0) {
      const mostRecent = sortedUsers[0];
      console.log(`\nMost recent signup: ${mostRecent.email}`);
      console.log('Full user metadata:', JSON.stringify(mostRecent.user_metadata, null, 2));
      console.log('App metadata:', JSON.stringify(mostRecent.app_metadata, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkRecentSignups();