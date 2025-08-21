import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEventPublishing() {
  console.log('🧪 Testing Event Publishing...\n');

  try {
    // Get the first promoter/admin user
    const { data: promoterUser } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['promoter', 'admin'])
      .limit(1)
      .single();

    if (!promoterUser) {
      console.log('No promoter/admin users found in database');
      return;
    }

    console.log(`Found ${promoterUser.role} user: ${promoterUser.user_id}`);

    // Get an event owned by this user
    const { data: userEvents, error: eventsError } = await supabase
      .from('events')
      .select('id, title, status, promoter_id')
      .eq('promoter_id', promoterUser.user_id)
      .limit(1);

    if (eventsError) {
      console.error('❌ Failed to fetch events:', eventsError);
      return;
    }

    if (!userEvents || userEvents.length === 0) {
      console.log('No events found for this user');
      
      // Check total event count
      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });
      
      console.log(`Total events in database: ${count}`);
      return;
    }

    const testEvent = userEvents[0];
    console.log(`\nFound event: "${testEvent.title}" (status: ${testEvent.status})`);

    // Test status updates
    const statusTests = [
      { from: testEvent.status, to: 'draft', description: 'Unpublishing to draft' },
      { from: 'draft', to: 'open', description: 'Publishing as open' },
      { from: 'open', to: 'closed', description: 'Closing event' },
      { from: 'closed', to: 'open', description: 'Reopening event' },
    ];

    for (const test of statusTests) {
      if (testEvent.status === test.from || test.from === testEvent.status) {
        console.log(`\nTest: ${test.description}`);
        console.log(`Updating status from "${test.from}" to "${test.to}"...`);

        const { error: updateError } = await supabase
          .from('events')
          .update({ status: test.to })
          .eq('id', testEvent.id);

        if (updateError) {
          console.error(`❌ Failed: ${updateError.message}`);
          console.error('Full error:', updateError);
        } else {
          console.log(`✅ Success: Status updated to "${test.to}"`);
          
          // Verify the update
          const { data: updatedEvent } = await supabase
            .from('events')
            .select('status')
            .eq('id', testEvent.id)
            .single();
          
          if (updatedEvent && updatedEvent.status === test.to) {
            console.log(`✅ Verified: Status is now "${updatedEvent.status}"`);
          } else {
            console.error('❌ Verification failed: Status not updated');
          }
        }
      }
    }

    // Test co-promoter functionality
    console.log('\n\nTesting Co-Promoter Functionality:');
    
    // Get another user to test as co-promoter
    const { data: otherUsers } = await supabase
      .from('profiles')
      .select('id')
      .neq('id', promoterUser.user_id)
      .limit(1);

    if (otherUsers && otherUsers.length > 0) {
      const coPromoterId = otherUsers[0].id;
      console.log(`Adding co-promoter: ${coPromoterId}`);

      const { error: coPromoterError } = await supabase
        .from('events')
        .update({ 
          co_promoter_ids: supabase.sql`array_append(co_promoter_ids, '${coPromoterId}'::uuid)`
        })
        .eq('id', testEvent.id);

      if (coPromoterError) {
        console.error('❌ Failed to add co-promoter:', coPromoterError);
      } else {
        console.log('✅ Successfully added co-promoter');
        
        // Verify co-promoter was added
        const { data: eventWithCoPromoter } = await supabase
          .from('events')
          .select('co_promoter_ids')
          .eq('id', testEvent.id)
          .single();
        
        if (eventWithCoPromoter?.co_promoter_ids?.includes(coPromoterId)) {
          console.log('✅ Verified: Co-promoter added to event');
        }
      }
    }

    console.log('\n✅ Event publishing tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the tests
testEventPublishing();