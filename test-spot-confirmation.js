#!/usr/bin/env node
// Test spot confirmation system

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

async function testSpotConfirmation() {
  console.log('🧪 Testing spot confirmation system...');
  
  try {
    // Create a test event
    console.log('📅 Creating test event...');
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert([{
        title: 'Test Comedy Show',
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Test Venue',
        address: 'Test Address',
        description: 'Test event for spot confirmation',
        status: 'draft',
        promoter_id: '00000000-0000-0000-0000-000000000000' // Will need to use a real promoter ID
      }])
      .select()
      .single();

    if (eventError) {
      console.log(`❌ Error creating event: ${eventError.message}`);
      return;
    }

    console.log(`✅ Created test event: ${event.id}`);

    // Create a test spot
    console.log('🎯 Creating test spot...');
    const { data: spot, error: spotError } = await supabase
      .from('event_spots')
      .insert([{
        event_id: event.id,
        spot_name: 'Test Comedian Spot',
        payment_amount: 100,
        currency: 'AUD',
        duration_minutes: 15,
        spot_order: 1,
        is_filled: false,
        is_paid: false,
        confirmation_status: 'pending',
        confirmation_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        comedian_id: '00000000-0000-0000-0000-000000000001' // Will need to use a real comedian ID
      }])
      .select()
      .single();

    if (spotError) {
      console.log(`❌ Error creating spot: ${spotError.message}`);
      return;
    }

    console.log(`✅ Created test spot: ${spot.id}`);

    // Test confirming the spot
    console.log('✅ Testing spot confirmation...');
    const { data: confirmedSpot, error: confirmError } = await supabase
      .from('event_spots')
      .update({
        confirmation_status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        is_filled: true
      })
      .eq('id', spot.id)
      .select()
      .single();

    if (confirmError) {
      console.log(`❌ Error confirming spot: ${confirmError.message}`);
      return;
    }

    console.log(`✅ Confirmed spot: ${confirmedSpot.id}`);
    console.log(`   Status: ${confirmedSpot.confirmation_status}`);
    console.log(`   Confirmed at: ${confirmedSpot.confirmed_at}`);
    console.log(`   Is filled: ${confirmedSpot.is_filled}`);

    // Test declining the spot
    console.log('❌ Testing spot decline...');
    const { data: declinedSpot, error: declineError } = await supabase
      .from('event_spots')
      .update({
        confirmation_status: 'declined',
        declined_at: new Date().toISOString(),
        is_filled: false,
        comedian_id: null
      })
      .eq('id', spot.id)
      .select()
      .single();

    if (declineError) {
      console.log(`❌ Error declining spot: ${declineError.message}`);
      return;
    }

    console.log(`✅ Declined spot: ${declinedSpot.id}`);
    console.log(`   Status: ${declinedSpot.confirmation_status}`);
    console.log(`   Declined at: ${declinedSpot.declined_at}`);
    console.log(`   Is filled: ${declinedSpot.is_filled}`);
    console.log(`   Comedian ID: ${declinedSpot.comedian_id}`);

    // Clean up
    console.log('🧹 Cleaning up test data...');
    await supabase.from('event_spots').delete().eq('id', spot.id);
    await supabase.from('events').delete().eq('id', event.id);
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testSpotConfirmation()
  .then(() => {
    console.log('\n🎉 Spot confirmation test complete!');
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });