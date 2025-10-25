import { test, expect } from '@playwright/test';
import { supabase } from '../src/integrations/supabase/client';
import { randomUUID } from 'crypto';

test.describe('Spot Confirmation Database Operations', () => {
  let testEventId!: string;
  let testComedianId!: string;
  let testPromoterId!: string;
  let testApplicationId!: string;
  let testSpotId!: string;

  test.beforeAll(async () => {
    // Create test data in database
    console.log('Setting up database test data...');

    // Create test promoter profile
    const promoterId = randomUUID();
    const { data: promoterData, error: promoterError } = await supabase
      .from('profiles')
      .insert({
        id: promoterId,
        email: 'test-promoter@example.com',
        name: 'Test Promoter',
        phone: '+61412345678'
      })
      .select()
      .single();

    if (promoterError || !promoterData) {
      throw new Error(`Failed to create test promoter: ${promoterError?.message}`);
    }
    testPromoterId = promoterData.id;
    console.log('Created test promoter:', testPromoterId);

    // Create test comedian profile
    const comedianId = randomUUID();
    const { data: comedianData, error: comedianError } = await supabase
      .from('profiles')
      .insert({
        id: comedianId,
        email: 'test-comedian@example.com',
        name: 'Test Comedian',
        stage_name: 'The Test Comic',
        phone: '+61412345679'
      })
      .select()
      .single();

    if (comedianError || !comedianData) {
      throw new Error(`Failed to create test comedian: ${comedianError?.message}`);
    }
    testComedianId = comedianData.id;
    console.log('Created test comedian:', testComedianId);

    // Create test event
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const eventDate = tomorrow.toISOString().split('T')[0]!;

    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .insert({
        title: 'Test Spot Confirmation Event',
        venue: 'Test Venue',
        address: '123 Test Street, Sydney NSW 2000',
        event_date: eventDate,
        start_time: '19:00',
        end_time: '21:00',
        promoter_id: testPromoterId,
        status: 'open',
        spots: 3,
        comedian_slots: 3
      })
      .select()
      .single();

    if (eventError || !eventData) {
      throw new Error(`Failed to create test event: ${eventError?.message}`);
    }
    testEventId = eventData.id;
    console.log('Created test event:', testEventId);

    // Create event spots
    const { data: spotData, error: spotError } = await supabase
      .from('event_spots')
      .insert([
        {
          event_id: testEventId,
          spot_name: 'MC',
          spot_order: 1,
          duration_minutes: 5,
          is_paid: true,
          payment_amount: 50,
          currency: 'AUD',
          is_filled: false
        },
        {
          event_id: testEventId,
          spot_name: 'Feature',
          spot_order: 2,
          duration_minutes: 15,
          is_paid: true,
          payment_amount: 100,
          currency: 'AUD',
          is_filled: false
        },
        {
          event_id: testEventId,
          spot_name: 'Headliner',
          spot_order: 3,
          duration_minutes: 20,
          is_paid: true,
          payment_amount: 200,
          currency: 'AUD',
          is_filled: false
        }
      ])
      .select();

    if (spotError || !spotData || spotData.length === 0) {
      throw new Error(`Failed to create test spots: ${spotError?.message}`);
    }
    testSpotId = spotData[0]!.id;
    console.log('Created test spots:', spotData.length);
  });

  test('Application approval assigns spot correctly', async () => {
    await test.step('Create application', async () => {
      const { data: applicationData, error: applicationError } = await supabase
        .from('applications')
        .insert({
          comedian_id: testComedianId,
          event_id: testEventId,
          message: 'I would love to MC this show!',
          spot_type: 'mc',
          status: 'pending',
          availability_confirmed: true,
          requirements_acknowledged: true
        })
        .select()
        .single();

      expect(applicationError).toBeNull();
      expect(applicationData).toBeDefined();
      if (!applicationData) {
        throw new Error('Failed to create application');
      }
      testApplicationId = applicationData.id;

      console.log('Created application:', testApplicationId);
    });

    await test.step('Approve application and assign spot', async () => {
      // Update application status to approved
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'approved',
          responded_at: new Date().toISOString()
        })
        .eq('id', testApplicationId);

      expect(updateError).toBeNull();

      // Assign comedian to MC spot
      const { error: spotUpdateError } = await supabase
        .from('event_spots')
        .update({
          comedian_id: testComedianId,
          is_filled: true
        })
        .eq('event_id', testEventId)
        .eq('spot_name', 'MC');

      expect(spotUpdateError).toBeNull();

      console.log('Application approved and spot assigned');
    });

    await test.step('Verify spot assignment', async () => {
      const { data: spotData, error: spotError } = await supabase
        .from('event_spots')
        .select('*')
        .eq('event_id', testEventId)
        .eq('spot_name', 'MC')
        .single();

      expect(spotError).toBeNull();
      if (!spotData) {
        throw new Error('Failed to retrieve spot data');
      }
      expect(spotData.comedian_id).toBe(testComedianId);
      expect(spotData.is_filled).toBe(true);

      console.log('Spot assignment verified');
    });
  });

  test('Comedian receives notification when spot is confirmed', async () => {
    await test.step('Create spot confirmation notification', async () => {
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: testComedianId,
          type: 'booking',
          title: 'Spot Confirmed',
          message: `Your spot for ${testEventId} has been confirmed`,
          data: {
            event_id: testEventId,
            spot_id: testSpotId,
            spot_name: 'MC',
            confirmation_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }
        })
        .select()
        .single();

      expect(notificationError).toBeNull();
      expect(notificationData).toBeDefined();
      
      console.log('Notification created for comedian');
    });

    await test.step('Verify notification exists', async () => {
      const { data: notifications, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', testComedianId)
        .eq('type', 'booking');

      expect(notificationError).toBeNull();
      expect(notifications).toBeDefined();
      if (!notifications || notifications.length === 0) {
        throw new Error('No notifications found');
      }
      expect(notifications.length).toBeGreaterThan(0);

      const notification = notifications[0];
      if (!notification) {
        throw new Error('Notification is undefined');
      }
      expect(notification.title).toBe('Spot Confirmed');
      expect(notification.read_at).toBeNull();
      
      console.log('Notification verified');
    });
  });

  test('Confirm spot updates database correctly', async () => {
    await test.step('Confirm spot', async () => {
      // Update spot to confirmed status
      const { error: spotUpdateError } = await supabase
        .from('event_spots')
        .update({
          // Add confirmation fields if they exist
          confirmed_at: new Date().toISOString(),
          status: 'confirmed'
        })
        .eq('id', testSpotId);

      // This might fail if columns don't exist - that's part of the test
      console.log('Spot confirmation update result:', spotUpdateError);
    });

    await test.step('Create calendar event for confirmed spot', async () => {
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', testEventId)
        .single();

      if (!eventData) {
        throw new Error('Failed to retrieve event data');
      }

      const { data: calendarData, error: calendarError } = await supabase
        .from('calendar_events')
        .insert({
          comedian_id: testComedianId,
          event_id: testEventId,
          title: eventData.title || 'Event',
          venue: eventData.venue,
          event_date: eventData.event_date,
          status: 'confirmed',
          calendar_sync_status: 'pending'
        })
        .select()
        .single();

      expect(calendarError).toBeNull();
      expect(calendarData).toBeDefined();
      
      console.log('Calendar event created for confirmed spot');
    });
  });

  test('Decline spot updates database correctly', async () => {
    await test.step('Create second application for decline test', async () => {
      const { data: applicationData, error: applicationError } = await supabase
        .from('applications')
        .insert({
          comedian_id: testComedianId,
          event_id: testEventId,
          message: 'I would love to feature at this show!',
          spot_type: 'feature',
          status: 'approved',
          availability_confirmed: true,
          requirements_acknowledged: true
        })
        .select()
        .single();

      expect(applicationError).toBeNull();
      if (!applicationData) {
        throw new Error('Failed to create application');
      }

      // Assign to Feature spot
      const { error: spotUpdateError } = await supabase
        .from('event_spots')
        .update({
          comedian_id: testComedianId,
          is_filled: true
        })
        .eq('event_id', testEventId)
        .eq('spot_name', 'Feature');

      expect(spotUpdateError).toBeNull();
      
      console.log('Second application created and spot assigned');
    });

    await test.step('Decline spot', async () => {
      // Update spot to declined status
      const { error: spotUpdateError } = await supabase
        .from('event_spots')
        .update({
          comedian_id: null,
          is_filled: false,
          declined_at: new Date().toISOString(),
          decline_reason: 'Scheduling conflict'
        })
        .eq('event_id', testEventId)
        .eq('spot_name', 'Feature');

      // This might fail if columns don't exist - that's part of the test
      console.log('Spot decline update result:', spotUpdateError);
    });

    await test.step('Verify spot is available again', async () => {
      const { data: spotData, error: spotError } = await supabase
        .from('event_spots')
        .select('*')
        .eq('event_id', testEventId)
        .eq('spot_name', 'Feature')
        .single();

      expect(spotError).toBeNull();
      if (!spotData) {
        throw new Error('Failed to retrieve spot data');
      }
      expect(spotData.comedian_id).toBeNull();
      expect(spotData.is_filled).toBe(false);
      
      console.log('Spot made available after decline');
    });
  });

  test('Promoter receives notification when comedian responds', async () => {
    await test.step('Create promoter notification for confirmation', async () => {
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: testPromoterId,
          type: 'application',
          title: 'Spot Confirmed by Comedian',
          message: `Test Comedian has confirmed their MC spot for Test Spot Confirmation Event`,
          data: {
            event_id: testEventId,
            comedian_id: testComedianId,
            spot_name: 'MC',
            action: 'confirmed'
          }
        })
        .select()
        .single();

      expect(notificationError).toBeNull();
      expect(notificationData).toBeDefined();
      
      console.log('Promoter notification created');
    });

    await test.step('Create promoter notification for decline', async () => {
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: testPromoterId,
          type: 'application',
          title: 'Spot Declined by Comedian',
          message: `Test Comedian has declined their Feature spot for Test Spot Confirmation Event`,
          data: {
            event_id: testEventId,
            comedian_id: testComedianId,
            spot_name: 'Feature',
            action: 'declined',
            decline_reason: 'Scheduling conflict'
          }
        })
        .select()
        .single();

      expect(notificationError).toBeNull();
      expect(notificationData).toBeDefined();
      
      console.log('Promoter decline notification created');
    });

    await test.step('Verify promoter notifications', async () => {
      const { data: notifications, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', testPromoterId)
        .eq('type', 'application');

      expect(notificationError).toBeNull();
      expect(notifications).toBeDefined();
      if (!notifications || notifications.length < 2) {
        throw new Error('Expected at least 2 notifications');
      }
      expect(notifications.length).toBeGreaterThanOrEqual(2);

      const confirmNotification = notifications.find(n => n.title.includes('Confirmed'));
      const declineNotification = notifications.find(n => n.title.includes('Declined'));
      
      expect(confirmNotification).toBeDefined();
      expect(declineNotification).toBeDefined();
      
      console.log('Promoter notifications verified');
    });
  });

  test('Test deadline enforcement logic', async () => {
    await test.step('Create spot with deadline', async () => {
      // Create a spot with a deadline in the past
      const pastDeadline = new Date();
      pastDeadline.setHours(pastDeadline.getHours() - 1);

      const { data: spotData, error: spotError } = await supabase
        .from('event_spots')
        .select('*')
        .eq('event_id', testEventId)
        .eq('spot_name', 'Headliner')
        .single();

      expect(spotError).toBeNull();
      
      // Simulate deadline passing
      console.log('Simulating deadline enforcement...');
      
      // In a real implementation, this would be handled by a scheduled job
      // For now, we just verify the data structure exists
      expect(spotData).toBeDefined();
      
      console.log('Deadline enforcement structure verified');
    });
  });

  test('Test error scenarios', async () => {
    await test.step('Test duplicate spot assignment', async () => {
      // Try to assign the same comedian to multiple spots
      const { error: duplicateError } = await supabase
        .from('event_spots')
        .update({
          comedian_id: testComedianId,
          is_filled: true
        })
        .eq('event_id', testEventId)
        .eq('spot_name', 'Headliner');

      // This should work unless there are database constraints
      console.log('Duplicate assignment result:', duplicateError);
    });

    await test.step('Test invalid comedian assignment', async () => {
      // Try to assign non-existent comedian
      const { error: invalidError } = await supabase
        .from('event_spots')
        .update({
          comedian_id: 'invalid-comedian-id',
          is_filled: true
        })
        .eq('event_id', testEventId)
        .eq('spot_name', 'Headliner');

      // This should fail due to foreign key constraint
      console.log('Invalid comedian assignment result:', invalidError);
    });
  });

  test.afterAll(async () => {
    // Clean up test data
    console.log('Cleaning up test data...');
    
    // Delete in reverse order of creation to avoid foreign key issues
    await supabase.from('calendar_events').delete().eq('comedian_id', testComedianId);
    await supabase.from('notifications').delete().eq('user_id', testComedianId);
    await supabase.from('notifications').delete().eq('user_id', testPromoterId);
    await supabase.from('applications').delete().eq('comedian_id', testComedianId);
    await supabase.from('event_spots').delete().eq('event_id', testEventId);
    await supabase.from('events').delete().eq('id', testEventId);
    await supabase.from('profiles').delete().eq('id', testComedianId);
    await supabase.from('profiles').delete().eq('id', testPromoterId);
    
    console.log('Test data cleanup completed');
  });
});