import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseStructure() {
  console.log('🔍 Checking Stand Up Sydney Database Structure...\n');

  try {
    // 1. Check critical tables
    console.log('1️⃣ Checking Critical Tables:');
    const criticalTables = ['profiles', 'events', 'applications', 'event_spots'];
    
    for (const table of criticalTables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      } else {
        console.log(`✅ ${table}: Exists`);
      }
    }

    // 2. Check profiles table structure
    console.log('\n2️⃣ Checking Profiles Table Structure:');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (!profileError && profileData && profileData.length > 0) {
      const columns = Object.keys(profileData[0]);
      console.log('Columns:', columns.join(', '));
      
      // Check for critical columns
      const requiredColumns = ['id', 'email', 'first_name', 'last_name', 'stage_name', 'role'];
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log(`❌ Missing columns: ${missingColumns.join(', ')}`);
      } else {
        console.log('✅ All required columns present');
      }
    }

    // 3. Check events table structure
    console.log('\n3️⃣ Checking Events Table Structure:');
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .limit(1);
    
    if (!eventError && eventData && eventData.length > 0) {
      const columns = Object.keys(eventData[0]);
      console.log('Columns:', columns.join(', '));
    }

    // 4. Check applications table structure
    console.log('\n4️⃣ Checking Applications Table Structure:');
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .select('*')
      .limit(1);
    
    if (!appError && appData && appData.length > 0) {
      const columns = Object.keys(appData[0]);
      console.log('Columns:', columns.join(', '));
    }

    // 5. Check event_spots table structure
    console.log('\n5️⃣ Checking Event Spots Table Structure:');
    const { data: spotData, error: spotError } = await supabase
      .from('event_spots')
      .select('*')
      .limit(1);
    
    if (!spotError && spotData && spotData.length > 0) {
      const columns = Object.keys(spotData[0]);
      console.log('Columns:', columns.join(', '));
    }

    // 6. Test authentication
    console.log('\n6️⃣ Testing Authentication:');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Not authenticated');
    } else if (user) {
      console.log(`✅ Authenticated as: ${user.email}`);
      
      // Check if user has a profile
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileFetchError) {
        console.log(`❌ Profile fetch error: ${profileFetchError.message}`);
      } else if (profile) {
        console.log(`✅ Profile exists: ${profile.email}`);
      }
    }

    // 7. Check for handle_new_user trigger
    console.log('\n7️⃣ Checking Database Triggers:');
    const { data: triggers, error: triggerError } = await supabase.rpc('get_triggers', {});
    
    if (triggerError) {
      console.log('❓ Cannot check triggers directly via RPC');
      // Try alternative method
      const { data: testUser, error: testError } = await supabase.auth.signUp({
        email: `test_${Date.now()}@example.com`,
        password: 'testpassword123'
      });
      
      if (!testError && testUser.user) {
        // Check if profile was created
        const { data: testProfile, error: testProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', testUser.user.id)
          .single();
        
        if (testProfile) {
          console.log('✅ handle_new_user trigger appears to be working');
          // Clean up test user
          await supabase.auth.admin.deleteUser(testUser.user.id);
        } else {
          console.log('❌ handle_new_user trigger may not be working');
        }
      }
    }

    // 8. Check other important tables
    console.log('\n8️⃣ Checking Other Important Tables:');
    const otherTables = [
      'invoices', 'invoice_items', 'vouches', 'notifications', 
      'event_requirements', 'comedian_media', 'organizations'
    ];
    
    for (const table of otherTables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Exists`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDatabaseStructure();