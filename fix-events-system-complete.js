import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pdikjpfulhhpqpxzpgtu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjY4NjEsImV4cCI6MjA2NTg0Mjg2MX0.5L8mD4I3MP22p8bcGUFo6EiVHesfvahfYpPPXjGdy54";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixEventsSystem() {
  console.log('🔧 Fixing Events System...\n');

  try {
    // 1. Check current event table structure
    console.log('1️⃣ Checking current events table structure...');
    const { data: eventSample, error: eventError } = await supabase
      .from('events')
      .select('*')
      .limit(1);

    if (!eventError && eventSample && eventSample.length > 0) {
      const columns = Object.keys(eventSample[0]);
      console.log('Current columns:', columns.filter(col => !col.startsWith('_')).join(', '));
    }

    // 2. Check if critical tables exist
    console.log('\n2️⃣ Checking for missing tables...');
    const tablesToCheck = [
      'event_templates',
      'recurring_events',
      'recurring_event_instances',
      'webhook_events',
      'event_ticket_sync',
      'venues'
    ];

    const missingTables = [];
    for (const table of tablesToCheck) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.message.includes('does not exist')) {
        missingTables.push(table);
        console.log(`❌ ${table}: Missing`);
      } else {
        console.log(`✅ ${table}: Exists`);
      }
    }

    // 3. Check event_spots structure
    console.log('\n3️⃣ Checking event_spots table structure...');
    const { data: spotSample, error: spotError } = await supabase
      .from('event_spots')
      .select('*')
      .limit(1);

    if (!spotError) {
      if (spotSample && spotSample.length > 0) {
        const spotColumns = Object.keys(spotSample[0]);
        console.log('Current columns:', spotColumns.filter(col => !col.startsWith('_')).join(', '));
        
        // Check for confirmation columns
        const confirmationColumns = ['confirmation_required', 'confirmation_deadline', 'confirmation_status', 'confirmed_at', 'declined_at'];
        const hasConfirmation = confirmationColumns.some(col => spotColumns.includes(col));
        if (!hasConfirmation) {
          console.log('⚠️  Missing spot confirmation columns');
        } else {
          console.log('✅ Spot confirmation columns present');
        }
      } else {
        console.log('⚠️  No data in event_spots table');
      }
    }

    // 4. Test event creation capability
    console.log('\n4️⃣ Testing event creation capability...');
    const testEvent = {
      title: 'Test Event - Delete Me',
      event_date: new Date().toISOString(),
      start_time: '20:00',
      venue: 'Test Venue',
      city: 'Sydney',
      state: 'NSW',
      country: 'Australia',
      promoter_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      status: 'draft',
      total_spots: 10
    };

    const { data: createdEvent, error: createError } = await supabase
      .from('events')
      .insert(testEvent)
      .select()
      .single();

    if (createError) {
      console.log(`❌ Event creation failed: ${createError.message}`);
    } else {
      console.log('✅ Event creation works');
      // Clean up test event
      if (createdEvent) {
        await supabase.from('events').delete().eq('id', createdEvent.id);
      }
    }

    // 5. Check for webhook integration
    console.log('\n5️⃣ Checking webhook integration columns...');
    if (eventSample && eventSample.length > 0) {
      const webhookColumns = ['humanitix_event_id', 'eventbrite_event_id'];
      const hasWebhookColumns = webhookColumns.every(col => Object.keys(eventSample[0]).includes(col));
      if (hasWebhookColumns) {
        console.log('✅ Webhook integration columns present');
      } else {
        console.log('⚠️  Missing webhook integration columns');
      }
    }

    // 6. Summary and recommendations
    console.log('\n📊 Summary and Recommendations:');
    console.log('================================');
    
    if (missingTables.length > 0) {
      console.log(`\n❌ Missing tables: ${missingTables.join(', ')}`);
      console.log('Action: Run the fix-events-system.sql migration to create these tables');
    }

    console.log('\n🔍 Issues found:');
    const issues = [];
    
    if (eventError) {
      issues.push('- Cannot access events table');
    }
    if (missingTables.includes('event_templates')) {
      issues.push('- Event templates functionality not available');
    }
    if (missingTables.includes('recurring_events')) {
      issues.push('- Recurring events functionality not available');
    }
    if (missingTables.includes('venues')) {
      issues.push('- Venues management not available');
    }
    if (missingTables.includes('webhook_events')) {
      issues.push('- Webhook integration not available');
    }

    if (issues.length > 0) {
      issues.forEach(issue => console.log(issue));
    } else {
      console.log('✅ No critical issues found');
    }

    // 7. Generate fix script
    if (missingTables.length > 0) {
      console.log('\n📝 To fix these issues, you need to:');
      console.log('1. Have admin access to run migrations');
      console.log('2. Execute the fix-events-system.sql migration');
      console.log('3. Or use Supabase dashboard to manually create the tables');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixEventsSystem();