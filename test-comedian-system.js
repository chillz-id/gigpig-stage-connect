#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pdikjpfulhhpqpxzpgtu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjY4NjEsImV4cCI6MjA2NTg0Mjg2MX0.5L8mD4I3MP22p8bcGUFo6EiVHesfvahfYpPPXjGdy54";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testComedianSystem() {
  console.log('🎭 Testing Stand Up Sydney Comedian System\n');
  console.log('=' . repeat(50));
  
  const results = {
    profiles: { status: '❌', details: '' },
    applications: { status: '❌', details: '' },
    vouches: { status: '❌', details: '' },
    comedianMedia: { status: '❌', details: '' },
    availability: { status: '❌', details: '' },
    frontend: { status: '❌', details: '' }
  };

  try {
    // 1. Test Profiles Table
    console.log('\n1️⃣ Testing Profiles Table:');
    const { data: profiles, error: profileError, count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' });
    
    if (profileError) {
      results.profiles.details = `Error: ${profileError.message}`;
      console.log(`   ❌ Profiles table error: ${profileError.message}`);
    } else {
      results.profiles.status = '✅';
      results.profiles.details = `${profileCount} profiles found`;
      console.log(`   ✅ Profiles table accessible - ${profileCount} profiles`);
      
      // Check comedian-specific fields
      if (profiles && profiles.length > 0) {
        const sample = profiles[0];
        const comedianFields = ['stage_name', 'bio', 'profile_slug', 'custom_show_types', 'years_experience'];
        const hasComedianFields = comedianFields.every(field => field in sample);
        console.log(`   ${hasComedianFields ? '✅' : '❌'} Comedian fields present: ${comedianFields.join(', ')}`);
      }
    }

    // 2. Test Applications Table
    console.log('\n2️⃣ Testing Applications Table:');
    const { data: applications, error: appError, count: appCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact' });
    
    if (appError) {
      results.applications.details = `Error: ${appError.message}`;
      console.log(`   ❌ Applications table error: ${appError.message}`);
    } else {
      results.applications.status = '✅';
      results.applications.details = `${appCount} applications found`;
      console.log(`   ✅ Applications table accessible - ${appCount} applications`);
      
      // Check application statuses
      const { data: statusCheck } = await supabase
        .from('applications')
        .select('status')
        .limit(10);
      
      if (statusCheck && statusCheck.length > 0) {
        const statuses = [...new Set(statusCheck.map(a => a.status))];
        console.log(`   ✅ Application statuses: ${statuses.join(', ') || 'none'}`);
      }
    }

    // 3. Test Vouches Table
    console.log('\n3️⃣ Testing Vouches Table:');
    const { data: vouches, error: vouchError, count: vouchCount } = await supabase
      .from('vouches')
      .select('*', { count: 'exact' });
    
    if (vouchError) {
      results.vouches.details = `Error: ${vouchError.message}`;
      console.log(`   ❌ Vouches table error: ${vouchError.message}`);
    } else {
      results.vouches.status = '✅';
      results.vouches.details = `${vouchCount} vouches found`;
      console.log(`   ✅ Vouches table accessible - ${vouchCount} vouches`);
    }

    // 4. Test Comedian Media Table
    console.log('\n4️⃣ Testing Comedian Media Table:');
    const { data: media, error: mediaError, count: mediaCount } = await supabase
      .from('comedian_media')
      .select('*', { count: 'exact' });
    
    if (mediaError) {
      results.comedianMedia.details = `Error: ${mediaError.message}`;
      console.log(`   ❌ Comedian media table error: ${mediaError.message}`);
    } else {
      results.comedianMedia.status = '✅';
      results.comedianMedia.details = `${mediaCount} media items found`;
      console.log(`   ✅ Comedian media table accessible - ${mediaCount} items`);
      
      // Check media types
      if (media && media.length > 0) {
        const types = [...new Set(media.map(m => m.media_type))];
        console.log(`   ✅ Media types: ${types.join(', ')}`);
      }
    }

    // 5. Test Availability/Calendar Integration
    console.log('\n5️⃣ Testing Availability System:');
    const { data: calendarData, error: calendarError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .limit(1);
    
    if (calendarError && calendarError.code !== 'PGRST116') {
      results.availability.details = `Error: ${calendarError.message}`;
      console.log(`   ❌ Calendar integrations error: ${calendarError.message}`);
    } else if (calendarError && calendarError.code === 'PGRST116') {
      results.availability.details = 'Table does not exist';
      console.log(`   ⚠️  Calendar integrations table not found`);
    } else {
      results.availability.status = '✅';
      results.availability.details = 'Calendar table exists';
      console.log(`   ✅ Calendar integrations table exists`);
    }

    // 6. Test Frontend Components
    console.log('\n6️⃣ Checking Frontend Components:');
    const fs = await import('fs/promises');
    const path = await import('path');
    const componentsDir = '/workspace/agents/src/components/comedian-profile';
    
    try {
      const files = await fs.readdir(componentsDir);
      const requiredComponents = [
        'ComedianProfileLayout.tsx',
        'ComedianHeader.tsx',
        'ComedianBio.tsx',
        'ComedianMedia.tsx',
        'ComedianApplications.tsx',
        'ComedianAvailabilityCalendar.tsx'
      ];
      
      const missingComponents = requiredComponents.filter(comp => !files.includes(comp));
      
      if (missingComponents.length === 0) {
        results.frontend.status = '✅';
        results.frontend.details = 'All core components present';
        console.log(`   ✅ All core components present`);
      } else {
        results.frontend.status = '⚠️';
        results.frontend.details = `Missing: ${missingComponents.join(', ')}`;
        console.log(`   ⚠️  Missing components: ${missingComponents.join(', ')}`);
      }
      
      console.log(`   📁 Found ${files.length} components in comedian-profile/`);
    } catch (error) {
      results.frontend.details = `Error reading directory: ${error.message}`;
      console.log(`   ❌ Error reading components: ${error.message}`);
    }

    // 7. Test Application Flow
    console.log('\n7️⃣ Testing Application Flow:');
    
    // Check if events table has open events
    const { data: openEvents, error: eventError } = await supabase
      .from('events')
      .select('id, title, status')
      .eq('status', 'published')
      .limit(5);
    
    if (eventError) {
      console.log(`   ❌ Error fetching events: ${eventError.message}`);
    } else {
      console.log(`   ✅ Found ${openEvents?.length || 0} published events`);
      
      // Check if applications can reference events
      if (openEvents && openEvents.length > 0) {
        const eventId = openEvents[0].id;
        const { error: refError } = await supabase
          .from('applications')
          .select('id, event_id')
          .eq('event_id', eventId)
          .limit(1);
        
        if (!refError) {
          console.log(`   ✅ Applications can reference events properly`);
        } else {
          console.log(`   ❌ Error with event references: ${refError.message}`);
        }
      }
    }

    // Summary
    console.log('\n' + '=' . repeat(50));
    console.log('📊 COMEDIAN SYSTEM HEALTH SUMMARY:\n');
    
    Object.entries(results).forEach(([component, result]) => {
      console.log(`${result.status} ${component.padEnd(20)} - ${result.details}`);
    });
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (profileCount === 0) {
      console.log('   🚨 CRITICAL: No profiles exist! Run fix-profile-system.js immediately');
    }
    
    if (results.availability.status === '❌') {
      console.log('   ⚠️  Calendar integration needs setup - create calendar_integrations table');
    }
    
    if (results.frontend.status !== '✅') {
      console.log('   ⚠️  Some frontend components may be missing or renamed');
    }
    
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('\n❌ Unexpected error during testing:', error);
  }
}

// Run the test
testComedianSystem().catch(console.error);