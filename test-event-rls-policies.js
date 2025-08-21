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

async function testEventRLSPolicies() {
  console.log('🧪 Testing Event RLS Policies...\n');

  try {
    // Test 1: Anonymous viewing of published events
    console.log('Test 1: Anonymous viewing of published events');
    const { data: publicEvents, error: publicError } = await supabase
      .from('events')
      .select('id, title, status')
      .in('status', ['open', 'closed', 'completed'])
      .limit(5);

    if (publicError) {
      console.error('❌ Anonymous view failed:', publicError);
    } else {
      console.log(`✅ Anonymous can view ${publicEvents.length} published events`);
    }

    // Test 2: Sign in as a test user
    console.log('\nTest 2: Authenticating as test user');
    const email = 'test@example.com';
    const password = 'test123456';
    
    // Try to sign in or create account
    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError && authError.message.includes('Invalid login credentials')) {
      console.log('Creating new test user...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (signUpError) {
        console.error('❌ Failed to create test user:', signUpError);
        return;
      }
      
      authData = signUpData;
    } else if (authError) {
      console.error('❌ Authentication failed:', authError);
      return;
    }

    const userId = authData.user?.id;
    console.log(`✅ Authenticated as user: ${userId}`);

    // Test 3: Check user role
    console.log('\nTest 3: Checking user role');
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (rolesError) {
      console.error('❌ Failed to check user roles:', rolesError);
    } else {
      console.log(`✅ User roles: ${userRoles.map(r => r.role).join(', ') || 'none'}`);
    }

    // Test 4: View all events as authenticated user
    console.log('\nTest 4: Viewing all events as authenticated user');
    const { data: allEvents, error: allEventsError } = await supabase
      .from('events')
      .select('id, title, status, promoter_id')
      .limit(10);

    if (allEventsError) {
      console.error('❌ Failed to view events:', allEventsError);
    } else {
      console.log(`✅ Authenticated user can view ${allEvents.length} events`);
      const userEvents = allEvents.filter(e => e.promoter_id === userId);
      console.log(`   - ${userEvents.length} owned by this user`);
    }

    // Test 5: Try to create an event without promoter role
    console.log('\nTest 5: Creating event without promoter role');
    const newEvent = {
      title: 'Test Comedy Night',
      event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      start_time: '20:00',
      venue: 'Test Venue',
      city: 'Sydney',
      type: 'open_mic',
      status: 'draft',
      description: 'Test event for RLS policy testing',
      promoter_id: userId,
    };

    const { data: createdEvent, error: createError } = await supabase
      .from('events')
      .insert(newEvent)
      .select()
      .single();

    if (createError) {
      console.log('❌ Expected: Cannot create event without promoter role:', createError.message);
      
      // Add promoter role
      console.log('\nAdding promoter role to user...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'promoter' })
        .select();

      if (!roleError) {
        console.log('✅ Added promoter role');
        
        // Retry event creation
        console.log('\nTest 6: Creating event with promoter role');
        const { data: createdEvent2, error: createError2 } = await supabase
          .from('events')
          .insert(newEvent)
          .select()
          .single();

        if (createError2) {
          console.error('❌ Failed to create event with promoter role:', createError2);
        } else {
          console.log('✅ Successfully created event:', createdEvent2.id);
          
          // Test 7: Update own event
          console.log('\nTest 7: Updating own event');
          const { error: updateError } = await supabase
            .from('events')
            .update({ status: 'open' })
            .eq('id', createdEvent2.id);

          if (updateError) {
            console.error('❌ Failed to update own event:', updateError);
          } else {
            console.log('✅ Successfully updated event status to open');
          }

          // Test 8: Delete own event
          console.log('\nTest 8: Deleting own event');
          const { error: deleteError } = await supabase
            .from('events')
            .delete()
            .eq('id', createdEvent2.id);

          if (deleteError) {
            console.error('❌ Failed to delete own event:', deleteError);
          } else {
            console.log('✅ Successfully deleted event');
          }
        }
      }
    } else {
      console.log('✅ Created event without explicit promoter role (trigger should have added it)');
      
      // Clean up
      await supabase.from('events').delete().eq('id', createdEvent.id);
    }

    // Test 9: Co-promoter functionality
    console.log('\nTest 9: Testing co-promoter functionality');
    
    // Find an event not owned by this user
    const { data: otherEvents } = await supabase
      .from('events')
      .select('id, title, promoter_id, co_promoter_ids')
      .neq('promoter_id', userId)
      .limit(1);

    if (otherEvents && otherEvents.length > 0) {
      const targetEvent = otherEvents[0];
      console.log(`Found event "${targetEvent.title}" owned by someone else`);
      
      // Try to update it (should fail)
      const { error: unauthorizedUpdate } = await supabase
        .from('events')
        .update({ description: 'Unauthorized update attempt' })
        .eq('id', targetEvent.id);

      if (unauthorizedUpdate) {
        console.log('✅ Correctly blocked unauthorized update:', unauthorizedUpdate.message);
      } else {
        console.error('❌ Security issue: unauthorized update succeeded!');
      }
    }

    console.log('\n✅ All RLS policy tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    // Sign out
    await supabase.auth.signOut();
  }
}

// Run the tests
testEventRLSPolicies();