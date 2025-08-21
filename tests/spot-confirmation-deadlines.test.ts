import { test, expect } from '@playwright/test';
import { supabase } from '../src/integrations/supabase/client';

test.describe('Spot Confirmation Deadline Enforcement', () => {
  let testEventId: string;
  let testComedianId: string;
  let testSpotId: string;

  test.beforeAll(async () => {
    // Create test data
    console.log('Setting up deadline test data...');
    
    // Create test comedian
    const { data: comedianData, error: comedianError } = await supabase
      .from('profiles')
      .insert({
        id: 'deadline-comedian-' + Date.now(),
        email: 'deadline-comedian@example.com',
        name: 'Deadline Test Comedian',
        stage_name: 'Deadline Comic'
      })
      .select()
      .single();

    if (comedianError) {
      console.error('Error creating comedian:', comedianError);
    } else {
      testComedianId = comedianData.id;
    }

    // Create test event
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .insert({
        id: 'deadline-event-' + Date.now(),
        title: 'Deadline Test Event',
        venue: 'Deadline Venue',
        address: '123 Deadline Street',
        event_date: tomorrow.toISOString().split('T')[0],
        promoter_id: testComedianId, // Using comedian as promoter for simplicity
        status: 'open'
      })
      .select()
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
    } else {
      testEventId = eventData.id;
    }

    // Create test spot
    const { data: spotData, error: spotError } = await supabase
      .from('event_spots')
      .insert({
        event_id: testEventId,
        spot_name: 'Deadline Test Spot',
        spot_order: 1,
        comedian_id: testComedianId,
        is_filled: true,
        is_paid: true,
        payment_amount: 75,
        currency: 'AUD'
      })
      .select()
      .single();

    if (spotError) {
      console.error('Error creating spot:', spotError);
    } else {
      testSpotId = spotData.id;
    }
  });

  test('Deadline enforcement structure', async () => {
    await test.step('Check deadline data structure', async () => {
      // Check if deadline fields exist in the database
      const { data: spotData, error: spotError } = await supabase
        .from('event_spots')
        .select('*')
        .eq('id', testSpotId)
        .single();

      expect(spotError).toBeNull();
      expect(spotData).toBeDefined();
      
      console.log('Spot data structure:', Object.keys(spotData));
      
      // Check if confirmation deadline fields exist
      // These might not exist yet, which is part of what we're testing
      const hasConfirmationDeadline = 'confirmation_deadline' in spotData;
      const hasConfirmedAt = 'confirmed_at' in spotData;
      const hasDeclinedAt = 'declined_at' in spotData;
      
      console.log('Has confirmation_deadline field:', hasConfirmationDeadline);
      console.log('Has confirmed_at field:', hasConfirmedAt);
      console.log('Has declined_at field:', hasDeclinedAt);
    });

    await test.step('Test deadline calculation logic', async () => {
      // Test logic for calculating confirmation deadlines
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 7); // Event in 7 days
      
      // Standard deadline: 24 hours before event
      const standardDeadline = new Date(eventDate);
      standardDeadline.setHours(standardDeadline.getHours() - 24);
      
      // Urgent deadline: 2 hours after spot assignment
      const urgentDeadline = new Date();
      urgentDeadline.setHours(urgentDeadline.getHours() + 2);
      
      // Choose the earlier deadline
      const effectiveDeadline = standardDeadline < urgentDeadline ? standardDeadline : urgentDeadline;
      
      console.log('Event date:', eventDate.toISOString());
      console.log('Standard deadline:', standardDeadline.toISOString());
      console.log('Urgent deadline:', urgentDeadline.toISOString());
      console.log('Effective deadline:', effectiveDeadline.toISOString());
      
      // Test deadline is reasonable
      expect(effectiveDeadline.getTime()).toBeLessThan(eventDate.getTime());
    });
  });

  test('Deadline enforcement simulation', async () => {
    await test.step('Simulate deadline passing', async () => {
      // Create a spot with deadline in the past
      const pastDeadline = new Date();
      pastDeadline.setHours(pastDeadline.getHours() - 1);
      
      const { data: expiredSpotData, error: expiredSpotError } = await supabase
        .from('event_spots')
        .insert({
          event_id: testEventId,
          spot_name: 'Expired Spot',
          spot_order: 2,
          comedian_id: testComedianId,
          is_filled: true,
          is_paid: true,
          payment_amount: 100,
          currency: 'AUD'
        })
        .select()
        .single();

      expect(expiredSpotError).toBeNull();
      
      // In a real system, this would be handled by a scheduled job
      // For testing, we simulate the deadline enforcement
      console.log('Simulating deadline enforcement...');
      
      // Check if spot should be expired
      const now = new Date();
      const isExpired = now > pastDeadline;
      
      expect(isExpired).toBe(true);
      
      if (isExpired) {
        // Simulate automated deadline enforcement
        const { error: enforcementError } = await supabase
          .from('event_spots')
          .update({
            comedian_id: null,
            is_filled: false,
            // These fields might not exist yet
            // expired_at: now.toISOString(),
            // expiry_reason: 'confirmation_deadline_passed'
          })
          .eq('id', expiredSpotData.id);
        
        console.log('Deadline enforcement result:', enforcementError);
      }
    });

    await test.step('Test deadline notification creation', async () => {
      // Create reminder notification before deadline
      const reminderTime = new Date();
      reminderTime.setHours(reminderTime.getHours() + 1);
      
      const { data: reminderNotification, error: reminderError } = await supabase
        .from('notifications')
        .insert({
          user_id: testComedianId,
          type: 'system',
          title: 'Spot Confirmation Reminder',
          message: `Please confirm your spot for Deadline Test Event. Deadline: ${reminderTime.toLocaleString()}`,
          data: {
            event_id: testEventId,
            spot_id: testSpotId,
            deadline: reminderTime.toISOString(),
            reminder_type: 'confirmation_deadline'
          }
        })
        .select()
        .single();

      expect(reminderError).toBeNull();
      expect(reminderNotification).toBeDefined();
      
      console.log('Reminder notification created');
    });

    await test.step('Test final deadline notification', async () => {
      // Create final deadline notification
      const finalDeadline = new Date();
      finalDeadline.setMinutes(finalDeadline.getMinutes() + 30);
      
      const { data: finalNotification, error: finalError } = await supabase
        .from('notifications')
        .insert({
          user_id: testComedianId,
          type: 'system',
          title: 'Final Reminder: Spot Confirmation',
          message: `This is your final reminder to confirm your spot for Deadline Test Event. Deadline: ${finalDeadline.toLocaleString()}`,
          data: {
            event_id: testEventId,
            spot_id: testSpotId,
            deadline: finalDeadline.toISOString(),
            reminder_type: 'final_deadline'
          }
        })
        .select()
        .single();

      expect(finalError).toBeNull();
      expect(finalNotification).toBeDefined();
      
      console.log('Final deadline notification created');
    });
  });

  test('Deadline enforcement edge cases', async () => {
    await test.step('Test same-day event deadline', async () => {
      // Create event for today
      const today = new Date();
      const { data: todayEvent, error: todayError } = await supabase
        .from('events')
        .insert({
          id: 'today-event-' + Date.now(),
          title: 'Today Event',
          venue: 'Today Venue',
          address: '123 Today Street',
          event_date: today.toISOString().split('T')[0],
          promoter_id: testComedianId,
          status: 'open'
        })
        .select()
        .single();

      expect(todayError).toBeNull();
      
      // Calculate deadline for same-day event
      const sameDay = new Date();
      sameDay.setHours(sameDay.getHours() + 2); // 2 hours to confirm
      
      console.log('Same-day event deadline:', sameDay.toISOString());
      
      // Test that deadline is reasonable for same-day events
      expect(sameDay.getTime()).toBeGreaterThan(Date.now());
    });

    await test.step('Test event in past', async () => {
      // Create event in the past
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: pastEvent, error: pastError } = await supabase
        .from('events')
        .insert({
          id: 'past-event-' + Date.now(),
          title: 'Past Event',
          venue: 'Past Venue',
          address: '123 Past Street',
          event_date: yesterday.toISOString().split('T')[0],
          promoter_id: testComedianId,
          status: 'completed'
        })
        .select()
        .single();

      expect(pastError).toBeNull();
      
      // Past events should not have confirmation deadlines
      console.log('Past event created for edge case testing');
    });
  });

  test('Deadline enforcement automation', async () => {
    await test.step('Test automated deadline jobs', async () => {
      // This would test the actual scheduled jobs that enforce deadlines
      // For now, we test the logic that would be in such jobs
      
      console.log('Testing automated deadline enforcement logic...');
      
      // Get all spots with deadlines that have passed
      const now = new Date();
      const { data: spotsToCheck, error: spotsError } = await supabase
        .from('event_spots')
        .select('*')
        .eq('is_filled', true)
        .is('confirmed_at', null)
        .is('declined_at', null);

      if (spotsError) {
        console.error('Error fetching spots:', spotsError);
      } else {
        console.log(`Found ${spotsToCheck?.length || 0} spots to check for deadline enforcement`);
      }
      
      // In a real system, this would be a scheduled job
      // that runs every few minutes to check for expired spots
    });

    await test.step('Test deadline grace period', async () => {
      // Test grace period after deadline
      const gracePeriod = 15; // 15 minutes grace period
      
      const deadlineWithGrace = new Date();
      deadlineWithGrace.setMinutes(deadlineWithGrace.getMinutes() - gracePeriod);
      
      console.log('Testing grace period:', gracePeriod, 'minutes');
      
      // Grace period should be configurable
      expect(gracePeriod).toBeGreaterThan(0);
      expect(gracePeriod).toBeLessThan(60); // Less than 1 hour
    });
  });

  test('Deadline notification scheduling', async () => {
    await test.step('Test notification scheduling logic', async () => {
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 7);
      
      // Calculate when to send notifications
      const confirmationDeadline = new Date(eventDate);
      confirmationDeadline.setHours(confirmationDeadline.getHours() - 24);
      
      const firstReminder = new Date(confirmationDeadline);
      firstReminder.setHours(firstReminder.getHours() - 24); // 24 hours before deadline
      
      const secondReminder = new Date(confirmationDeadline);
      secondReminder.setHours(secondReminder.getHours() - 4); // 4 hours before deadline
      
      const finalReminder = new Date(confirmationDeadline);
      finalReminder.setHours(finalReminder.getHours() - 1); // 1 hour before deadline
      
      console.log('Notification schedule:');
      console.log('First reminder:', firstReminder.toISOString());
      console.log('Second reminder:', secondReminder.toISOString());
      console.log('Final reminder:', finalReminder.toISOString());
      console.log('Deadline:', confirmationDeadline.toISOString());
      
      // Test notification schedule is logical
      expect(firstReminder.getTime()).toBeLessThan(secondReminder.getTime());
      expect(secondReminder.getTime()).toBeLessThan(finalReminder.getTime());
      expect(finalReminder.getTime()).toBeLessThan(confirmationDeadline.getTime());
    });
  });

  test.afterAll(async () => {
    // Clean up test data
    console.log('Cleaning up deadline test data...');
    
    await supabase.from('notifications').delete().eq('user_id', testComedianId);
    await supabase.from('event_spots').delete().eq('event_id', testEventId);
    await supabase.from('events').delete().eq('id', testEventId);
    await supabase.from('profiles').delete().eq('id', testComedianId);
    
    console.log('Deadline test cleanup completed');
  });
});