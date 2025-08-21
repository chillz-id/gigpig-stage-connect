#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pdikjpfulhhpqpxzpgtu.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testComedianFlow() {
  console.log('🎭 Testing Stand Up Sydney Comedian Application Flow\n');
  console.log('=' . repeat(50));

  try {
    // 1. List all profiles with comedian info
    console.log('\n1️⃣ Current Profiles:');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, stage_name, bio, profile_slug, created_at')
      .order('created_at', { ascending: false });
    
    if (profileError) {
      console.log(`   ❌ Error: ${profileError.message}`);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('   ⚠️  No profiles found');
      return;
    }
    
    profiles.forEach((profile, index) => {
      console.log(`\n   Profile ${index + 1}:`);
      console.log(`   - ID: ${profile.id}`);
      console.log(`   - Email: ${profile.email || 'N/A'}`);
      console.log(`   - Name: ${profile.name || 'N/A'}`);
      console.log(`   - Stage Name: ${profile.stage_name || 'N/A'}`);
      console.log(`   - Profile Slug: ${profile.profile_slug || 'N/A'}`);
      console.log(`   - Bio: ${profile.bio ? profile.bio.substring(0, 50) + '...' : 'N/A'}`);
    });

    // 2. Check user roles
    console.log('\n2️⃣ User Roles:');
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .order('created_at', { ascending: false });
    
    if (roleError) {
      console.log(`   ❌ Error fetching roles: ${roleError.message}`);
    } else {
      console.log(`   Found ${roles?.length || 0} role assignments`);
      if (roles && roles.length > 0) {
        const roleCount = roles.reduce((acc, r) => {
          acc[r.role] = (acc[r.role] || 0) + 1;
          return acc;
        }, {});
        console.log('   Role distribution:', roleCount);
      }
    }

    // 3. Check events
    console.log('\n3️⃣ Available Events:');
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('id, title, event_date, venue, status, spots, filled_slots')
      .order('event_date', { ascending: true })
      .limit(5);
    
    if (eventError) {
      console.log(`   ❌ Error: ${eventError.message}`);
      return;
    }
    
    if (!events || events.length === 0) {
      console.log('   ⚠️  No events found');
    } else {
      events.forEach(event => {
        const availableSpots = (event.spots || 0) - (event.filled_slots || 0);
        console.log(`\n   Event: ${event.title}`);
        console.log(`   - Date: ${new Date(event.event_date).toLocaleDateString()}`);
        console.log(`   - Venue: ${event.venue}`);
        console.log(`   - Status: ${event.status}`);
        console.log(`   - Available Spots: ${availableSpots}/${event.spots || 0}`);
      });
    }

    // 4. Check applications
    console.log('\n4️⃣ Recent Applications:');
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        message,
        spot_type,
        applied_at,
        comedian:profiles!comedian_id(name, stage_name),
        event:events!event_id(title, event_date)
      `)
      .order('applied_at', { ascending: false })
      .limit(5);
    
    if (appError) {
      console.log(`   ❌ Error: ${appError.message}`);
    } else if (!applications || applications.length === 0) {
      console.log('   ⚠️  No applications found');
    } else {
      applications.forEach(app => {
        console.log(`\n   Application:`);
        console.log(`   - Comedian: ${app.comedian?.name || app.comedian?.stage_name || 'Unknown'}`);
        console.log(`   - Event: ${app.event?.title || 'Unknown'}`);
        console.log(`   - Status: ${app.status || 'pending'}`);
        console.log(`   - Applied: ${new Date(app.applied_at).toLocaleDateString()}`);
      });
    }

    // 5. Check vouches
    console.log('\n5️⃣ Recent Vouches:');
    const { data: vouches, error: vouchError } = await supabase
      .from('vouches')
      .select(`
        id,
        message,
        rating,
        created_at,
        voucher:profiles!voucher_id(name, stage_name),
        vouchee:profiles!vouchee_id(name, stage_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (vouchError) {
      console.log(`   ❌ Error: ${vouchError.message}`);
    } else if (!vouches || vouches.length === 0) {
      console.log('   ⚠️  No vouches found');
    } else {
      vouches.forEach(vouch => {
        console.log(`\n   Vouch:`);
        console.log(`   - From: ${vouch.voucher?.name || vouch.voucher?.stage_name || 'Unknown'}`);
        console.log(`   - To: ${vouch.vouchee?.name || vouch.vouchee?.stage_name || 'Unknown'}`);
        console.log(`   - Rating: ${vouch.rating}/5`);
        console.log(`   - Message: ${vouch.message?.substring(0, 50) || 'N/A'}...`);
      });
    }

    // 6. Check comedian media
    console.log('\n6️⃣ Comedian Media Stats:');
    const { data: mediaStats, error: mediaError } = await supabase
      .from('comedian_media')
      .select('user_id, media_type')
      .order('created_at', { ascending: false });
    
    if (mediaError) {
      console.log(`   ❌ Error: ${mediaError.message}`);
    } else {
      const stats = mediaStats?.reduce((acc, m) => {
        acc[m.media_type] = (acc[m.media_type] || 0) + 1;
        return acc;
      }, {}) || {};
      
      console.log(`   Total media items: ${mediaStats?.length || 0}`);
      console.log('   By type:', stats);
      
      // Count media per user
      const userMedia = mediaStats?.reduce((acc, m) => {
        acc[m.user_id] = (acc[m.user_id] || 0) + 1;
        return acc;
      }, {}) || {};
      
      console.log(`   Users with media: ${Object.keys(userMedia).length}`);
    }

    // 7. Test profile slug generation
    console.log('\n7️⃣ Profile URL Slugs:');
    const profilesWithSlugs = profiles.filter(p => p.profile_slug);
    console.log(`   ${profilesWithSlugs.length}/${profiles.length} profiles have custom slugs`);
    
    if (profilesWithSlugs.length > 0) {
      console.log('   Sample URLs:');
      profilesWithSlugs.slice(0, 3).forEach(p => {
        console.log(`   - /comedian/${p.profile_slug}`);
      });
    }

    // Summary
    console.log('\n' + '=' . repeat(50));
    console.log('📊 COMEDIAN SYSTEM SUMMARY:\n');
    console.log(`✅ Profiles: ${profiles.length}`);
    console.log(`✅ Events: ${events?.length || 0}`);
    console.log(`✅ Applications: ${applications?.length || 0}`);
    console.log(`✅ Vouches: ${vouches?.length || 0}`);
    console.log(`✅ Media Items: ${mediaStats?.length || 0}`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (applications?.length === 0 && events?.length > 0) {
      console.log('   - No applications exist yet - test the application flow');
    }
    
    if (vouches?.length === 0 && profiles.length > 1) {
      console.log('   - No vouches exist - test the vouching system');
    }
    
    if (mediaStats?.length === 0) {
      console.log('   - No media uploaded - test media upload functionality');
    }
    
    if (profilesWithSlugs.length < profiles.length) {
      console.log('   - Some profiles missing slugs - run profile slug migration');
    }
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

// Run the test
testComedianFlow().catch(console.error);