#!/usr/bin/env node
// Get profiles for testing

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function getTestProfiles() {
  console.log('🔍 Finding test profiles...');
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .limit(5);

    if (error) {
      console.log(`❌ Error getting profiles: ${error.message}`);
      return;
    }

    console.log(`✅ Found ${profiles.length} profiles:`);
    profiles.forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.first_name} ${profile.last_name}`);
      console.log(`     ID: ${profile.id}`);
      console.log(`     Email: ${profile.email}`);
    });

    // Get existing events
    console.log('\n🔍 Finding existing events...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_date, promoter_id, status')
      .limit(5);

    if (eventsError) {
      console.log(`❌ Error getting events: ${eventsError.message}`);
      return;
    }

    console.log(`✅ Found ${events.length} events:`);
    events.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.title} (${event.status})`);
      console.log(`     ID: ${event.id}`);
      console.log(`     Date: ${event.event_date}`);
      console.log(`     Promoter: ${event.promoter_id}`);
    });

    // Get existing spots
    console.log('\n🔍 Finding existing spots...');
    const { data: spots, error: spotsError } = await supabase
      .from('event_spots')
      .select('id, event_id, spot_name, comedian_id, confirmation_status, is_filled')
      .limit(5);

    if (spotsError) {
      console.log(`❌ Error getting spots: ${spotsError.message}`);
      return;
    }

    console.log(`✅ Found ${spots.length} spots:`);
    spots.forEach((spot, index) => {
      console.log(`  ${index + 1}. ${spot.spot_name} (${spot.confirmation_status || 'no status'})`);
      console.log(`     ID: ${spot.id}`);
      console.log(`     Event: ${spot.event_id}`);
      console.log(`     Comedian: ${spot.comedian_id || 'none'}`);
      console.log(`     Filled: ${spot.is_filled}`);
    });

    return { profiles, events, spots };

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

getTestProfiles()
  .then((result) => {
    if (result && result.profiles.length > 0) {
      console.log('\n📋 Test data available for spot confirmation testing');
    } else {
      console.log('\n❌ No test data available');
    }
  })
  .catch(error => {
    console.error('❌ Failed:', error);
  });