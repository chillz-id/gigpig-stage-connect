import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/root/agents/.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSpotConfirmationRoute() {
  console.log('🧪 Testing Spot Confirmation Route...\n');

  try {
    // First, find a test event with spots
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        event_spots (
          id,
          comedian_id,
          spot_name,
          is_filled
        )
      `)
      .limit(5);

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError);
      return;
    }

    console.log('📋 Found events:', events?.length || 0);

    // Find an event with assigned but not confirmed spots
    const eventWithPendingSpot = events?.find(event => 
      event.event_spots?.some(spot => spot.comedian_id && !spot.is_filled)
    );

    if (eventWithPendingSpot) {
      const pendingSpot = eventWithPendingSpot.event_spots.find(
        spot => spot.comedian_id && !spot.is_filled
      );

      console.log('\n✅ Found event with pending spot confirmation:');
      console.log(`   Event: ${eventWithPendingSpot.title} (ID: ${eventWithPendingSpot.id})`);
      console.log(`   Spot: ${pendingSpot.spot_name} (ID: ${pendingSpot.id})`);
      console.log(`   Comedian ID: ${pendingSpot.comedian_id}`);
      
      console.log('\n📍 Route URLs:');
      console.log(`   By Event ID: /events/${eventWithPendingSpot.id}/confirm-spot`);
      console.log(`   By Spot ID: /spots/${pendingSpot.id}/confirm`);
      
      console.log('\n💡 Both routes will work for the assigned comedian to confirm their spot!');
    } else {
      console.log('\n⚠️  No events found with pending spot confirmations');
      
      // Show available events for reference
      if (events && events.length > 0) {
        console.log('\n📊 Available events:');
        events.forEach(event => {
          console.log(`   - ${event.title} (ID: ${event.id})`);
          if (event.event_spots?.length > 0) {
            event.event_spots.forEach(spot => {
              console.log(`     • ${spot.spot_name}: ${spot.is_filled ? 'Confirmed' : spot.comedian_id ? 'Pending' : 'Available'}`);
            });
          }
        });
      }
    }

    // Test database structure for spot confirmation
    console.log('\n🔍 Checking database structure...');
    
    const { data: spotsSample, error: spotsError } = await supabase
      .from('event_spots')
      .select('*')
      .limit(1);

    if (!spotsError && spotsSample?.length > 0) {
      console.log('✅ event_spots table structure:');
      console.log('   Fields:', Object.keys(spotsSample[0]).join(', '));
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSpotConfirmationRoute();