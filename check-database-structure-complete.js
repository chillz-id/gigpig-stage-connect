import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pdikjpfulhhpqpxzpgtu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjY4NjEsImV4cCI6MjA2NTg0Mjg2MX0.5L8mD4I3MP22p8bcGUFo6EiVHesfvahfYpPPXjGdy54";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabaseStructure() {
  console.log('🔍 Checking Stand Up Sydney Database Structure...\n');

  try {
    // 1. Check critical tables
    console.log('1️⃣ Checking Critical Tables:');
    const criticalTables = ['profiles', 'events', 'applications', 'event_spots'];
    const tableStatus = {};
    
    for (const table of criticalTables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
        tableStatus[table] = { exists: false, error: error.message };
      } else {
        console.log(`✅ ${table}: Exists`);
        tableStatus[table] = { exists: true };
      }
    }

    // 2. Check profiles table structure in detail
    console.log('\n2️⃣ Checking Profiles Table Structure:');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (!profileError) {
      if (profileData && profileData.length > 0) {
        const columns = Object.keys(profileData[0]);
        console.log('Current columns:', columns.join(', '));
        
        // Check for critical columns
        const requiredColumns = ['id', 'email', 'first_name', 'last_name', 'stage_name', 'role', 'created_at', 'updated_at'];
        const missingColumns = requiredColumns.filter(col => !columns.includes(col));
        
        if (missingColumns.length > 0) {
          console.log(`❌ Missing columns: ${missingColumns.join(', ')}`);
        } else {
          console.log('✅ All required columns present');
        }
      } else {
        console.log('⚠️  No data in profiles table');
      }
    } else {
      console.log(`❌ Error accessing profiles: ${profileError.message}`);
    }

    // 3. Check events table structure
    console.log('\n3️⃣ Checking Events Table Structure:');
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .limit(1);
    
    if (!eventError) {
      if (eventData && eventData.length > 0) {
        const columns = Object.keys(eventData[0]);
        console.log('Current columns:', columns.join(', '));
        
        // Check for critical event columns
        const requiredEventColumns = ['id', 'title', 'date', 'venue_name', 'organizer_id', 'status'];
        const missingEventColumns = requiredEventColumns.filter(col => !columns.includes(col));
        
        if (missingEventColumns.length > 0) {
          console.log(`❌ Missing columns: ${missingEventColumns.join(', ')}`);
        } else {
          console.log('✅ All required columns present');
        }
      } else {
        console.log('⚠️  No data in events table');
      }
    } else {
      console.log(`❌ Error accessing events: ${eventError.message}`);
    }

    // 4. Check applications table structure
    console.log('\n4️⃣ Checking Applications Table Structure:');
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .select('*')
      .limit(1);
    
    if (!appError) {
      if (appData && appData.length > 0) {
        const columns = Object.keys(appData[0]);
        console.log('Current columns:', columns.join(', '));
      } else {
        console.log('⚠️  No data in applications table');
      }
    } else {
      console.log(`❌ Error accessing applications: ${appError.message}`);
    }

    // 5. Check event_spots table structure
    console.log('\n5️⃣ Checking Event Spots Table Structure:');
    const { data: spotData, error: spotError } = await supabase
      .from('event_spots')
      .select('*')
      .limit(1);
    
    if (!spotError) {
      if (spotData && spotData.length > 0) {
        const columns = Object.keys(spotData[0]);
        console.log('Current columns:', columns.join(', '));
        
        // Check for spot confirmation fields
        const spotConfirmationColumns = ['confirmation_required', 'confirmation_deadline', 'confirmation_status', 'confirmed_at', 'declined_at'];
        const hasConfirmationColumns = spotConfirmationColumns.filter(col => columns.includes(col));
        
        if (hasConfirmationColumns.length > 0) {
          console.log(`✅ Spot confirmation columns present: ${hasConfirmationColumns.join(', ')}`);
        } else {
          console.log('⚠️  No spot confirmation columns found');
        }
      } else {
        console.log('⚠️  No data in event_spots table');
      }
    } else {
      console.log(`❌ Error accessing event_spots: ${spotError.message}`);
    }

    // 6. Check other important tables
    console.log('\n6️⃣ Checking Other Important Tables:');
    const otherTables = [
      'invoices', 'invoice_items', 'invoice_payment_links',
      'vouches', 'notifications', 'notification_templates',
      'event_requirements', 'comedian_media', 'organizations',
      'agencies', 'agency_members', 'agency_clients',
      'tasks', 'task_templates', 'tours', 'tour_dates',
      'customization_settings', 'navigation_preferences',
      'error_logs', 'xero_integrations', 'payment_links'
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

    // 7. Check for foreign key relationships
    console.log('\n7️⃣ Checking Foreign Key Relationships:');
    
    // Test profile -> events relationship
    const { error: eventRelError } = await supabase
      .from('events')
      .select('*, organizer:profiles(id, email)')
      .limit(1);
    
    if (!eventRelError) {
      console.log('✅ events -> profiles relationship working');
    } else {
      console.log(`❌ events -> profiles relationship error: ${eventRelError.message}`);
    }

    // Test applications -> events/profiles relationship
    const { error: appRelError } = await supabase
      .from('applications')
      .select('*, event:events(id, title), applicant:profiles(id, email)')
      .limit(1);
    
    if (!appRelError) {
      console.log('✅ applications -> events/profiles relationships working');
    } else {
      console.log(`❌ applications relationships error: ${appRelError.message}`);
    }

    // Test event_spots -> events/profiles relationship
    const { error: spotRelError } = await supabase
      .from('event_spots')
      .select('*, event:events(id, title), comedian:profiles(id, email)')
      .limit(1);
    
    if (!spotRelError) {
      console.log('✅ event_spots -> events/profiles relationships working');
    } else {
      console.log(`❌ event_spots relationships error: ${spotRelError.message}`);
    }

    // 8. Summary
    console.log('\n📊 Database Structure Summary:');
    console.log('================================');
    
    const allTablesChecked = [...criticalTables, ...otherTables];
    const workingTables = [];
    const missingTables = [];
    
    // Count working vs missing tables based on our checks
    console.log(`Total tables checked: ${allTablesChecked.length}`);
    console.log('Critical tables status:', tableStatus);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDatabaseStructure();