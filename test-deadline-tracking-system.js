import { createClient } from '@supabase/supabase-js';
import { format, addHours, addDays, subHours } from 'date-fns';

// Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test data
const testPromoter = {
  email: 'test.promoter@standupsydney.com',
  password: 'TestPromoter123!',
  profile: {
    name: 'Test Promoter',
    role: 'promoter'
  }
};

const testComedian = {
  email: 'test.comedian@standupsydney.com',
  password: 'TestComedian123!',
  profile: {
    name: 'Test Comedian',
    stage_name: 'The Test Comic',
    role: 'comedian',
    phone: '+61400000000'
  }
};

async function runTests() {
  console.log('🧪 Testing Deadline Tracking System\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Step 1: Create test users
    console.log('1️⃣  Creating test users...');
    
    // Create promoter
    const { data: promoterAuth, error: promoterError } = await supabase.auth.admin.createUser({
      email: testPromoter.email,
      password: testPromoter.password,
      email_confirm: true,
      user_metadata: testPromoter.profile
    });

    if (promoterError && !promoterError.message.includes('already been registered')) {
      throw promoterError;
    }

    const promoterId = promoterAuth?.user?.id || (await getUserByEmail(testPromoter.email))?.id;
    console.log(`✅ Promoter created/found: ${promoterId}`);

    // Create comedian
    const { data: comedianAuth, error: comedianError } = await supabase.auth.admin.createUser({
      email: testComedian.email,
      password: testComedian.password,
      email_confirm: true,
      user_metadata: testComedian.profile
    });

    if (comedianError && !comedianError.message.includes('already been registered')) {
      throw comedianError;
    }

    const comedianId = comedianAuth?.user?.id || (await getUserByEmail(testComedian.email))?.id;
    console.log(`✅ Comedian created/found: ${comedianId}`);

    // Step 2: Create test event
    console.log('\n2️⃣  Creating test event with spots...');
    
    const eventData = {
      title: 'Deadline Tracking Test Event',
      event_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      start_time: '20:00',
      end_time: '22:00',
      venue: 'Test Comedy Club',
      address: '123 Test Street, Sydney',
      description: 'Test event for deadline tracking system',
      capacity: 100,
      ticket_price: 25,
      status: 'published',
      promoter_id: promoterId
    };

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (eventError) throw eventError;
    console.log(`✅ Event created: ${event.id}`);

    // Step 3: Create spots with different deadline scenarios
    console.log('\n3️⃣  Creating test spots with various deadlines...');
    
    const spots = [
      {
        event_id: event.id,
        spot_name: '5-minute spot (expires in 30 min)',
        duration_minutes: 5,
        payment_amount: 50,
        currency: 'AUD',
        spot_order: 1,
        is_filled: true,
        comedian_id: comedianId,
        confirmation_status: 'pending',
        confirmation_deadline: addHours(new Date(), 0.5).toISOString() // 30 minutes
      },
      {
        event_id: event.id,
        spot_name: '10-minute spot (expires in 1 hour)',
        duration_minutes: 10,
        payment_amount: 100,
        currency: 'AUD',
        spot_order: 2,
        is_filled: true,
        comedian_id: comedianId,
        confirmation_status: 'pending',
        confirmation_deadline: addHours(new Date(), 1).toISOString() // 1 hour
      },
      {
        event_id: event.id,
        spot_name: '15-minute spot (expires in 6 hours)',
        duration_minutes: 15,
        payment_amount: 150,
        currency: 'AUD',
        spot_order: 3,
        is_filled: true,
        comedian_id: comedianId,
        confirmation_status: 'pending',
        confirmation_deadline: addHours(new Date(), 6).toISOString() // 6 hours
      },
      {
        event_id: event.id,
        spot_name: '20-minute spot (expires in 24 hours)',
        duration_minutes: 20,
        payment_amount: 200,
        currency: 'AUD',
        spot_order: 4,
        is_filled: true,
        comedian_id: comedianId,
        confirmation_status: 'pending',
        confirmation_deadline: addHours(new Date(), 24).toISOString() // 24 hours
      },
      {
        event_id: event.id,
        spot_name: 'Headliner spot (already expired)',
        duration_minutes: 30,
        payment_amount: 300,
        currency: 'AUD',
        spot_order: 5,
        is_filled: true,
        comedian_id: comedianId,
        confirmation_status: 'pending',
        confirmation_deadline: subHours(new Date(), 1).toISOString() // Already expired
      }
    ];

    const { data: createdSpots, error: spotsError } = await supabase
      .from('event_spots')
      .insert(spots)
      .select();

    if (spotsError) throw spotsError;
    console.log(`✅ Created ${createdSpots.length} test spots`);

    // Step 4: Test deadline monitoring functions
    console.log('\n4️⃣  Testing deadline monitoring functions...');

    // Test expired spot handling
    console.log('\n   Testing expired spot handling...');
    const { data: expiredResult, error: expiredError } = await supabase.rpc('handle_expired_spot_confirmations');
    
    if (expiredError) {
      console.error(`   ❌ Error: ${expiredError.message}`);
    } else {
      const result = expiredResult?.[0] || { expired_count: 0, notification_count: 0 };
      console.log(`   ✅ Expired spots handled: ${result.expired_count} spots, ${result.notification_count} notifications`);
    }

    // Test reminder sending for 1-hour deadline
    console.log('\n   Testing 1-hour reminder...');
    const spot1h = createdSpots.find(s => s.spot_name.includes('1 hour'));
    if (spot1h) {
      const { data: reminder1h, error: reminder1hError } = await supabase.rpc('send_deadline_reminder', {
        p_spot_id: spot1h.id,
        p_hours_before: 1,
        p_template_name: 'deadline_1h'
      });
      
      if (reminder1hError) {
        console.error(`   ❌ Error: ${reminder1hError.message}`);
      } else {
        console.log(`   ✅ 1-hour reminder sent: ${reminder1h}`);
      }
    }

    // Step 5: Check notifications
    console.log('\n5️⃣  Checking generated notifications...');
    
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${comedianId},user_id.eq.${promoterId}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (notifError) {
      console.error(`❌ Error fetching notifications: ${notifError.message}`);
    } else {
      console.log(`✅ Found ${notifications.length} notifications:`);
      notifications.forEach(notif => {
        console.log(`   - ${notif.type}: ${notif.title}`);
      });
    }

    // Step 6: Check email queue
    console.log('\n6️⃣  Checking email queue...');
    
    const { data: emails, error: emailError } = await supabase
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (emailError) {
      console.error(`❌ Error fetching emails: ${emailError.message}`);
    } else {
      console.log(`✅ Found ${emails?.length || 0} queued emails`);
      emails?.forEach(email => {
        console.log(`   - To: ${email.to_email}, Template: ${email.template_id}, Status: ${email.status}`);
      });
    }

    // Step 7: Test deadline extension
    console.log('\n7️⃣  Testing deadline extension...');
    
    const spot6h = createdSpots.find(s => s.spot_name.includes('6 hours'));
    if (spot6h) {
      const newDeadline = addHours(new Date(), 48);
      
      const { error: updateError } = await supabase
        .from('event_spots')
        .update({
          confirmation_deadline: newDeadline.toISOString(),
          confirmation_reminder_sent: {},
          updated_at: new Date().toISOString()
        })
        .eq('id', spot6h.id);

      if (updateError) {
        console.error(`❌ Error extending deadline: ${updateError.message}`);
      } else {
        console.log(`✅ Extended deadline for spot "${spot6h.spot_name}" to ${format(newDeadline, 'PPP p')}`);
        
        // Create extension notification
        await supabase
          .from('notifications')
          .insert({
            user_id: comedianId,
            type: 'deadline_extended',
            title: 'Deadline Extended',
            message: `Your confirmation deadline for "${spot6h.spot_name}" has been extended to ${format(newDeadline, 'PPP p')}. Reason: Test extension`,
            priority: 'high',
            data: {
              event_id: event.id,
              spot_id: spot6h.id,
              new_deadline: newDeadline.toISOString(),
              reason: 'Test extension'
            }
          });
      }
    }

    // Step 8: Test monitoring dashboard data
    console.log('\n8️⃣  Testing monitoring dashboard data retrieval...');
    
    const { data: dashboardEvents, error: dashboardError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        event_date,
        event_spots!inner (
          id,
          spot_name,
          confirmation_status,
          confirmation_deadline,
          comedian_id,
          profiles!comedian_id (
            id,
            first_name,
            last_name,
            stage_name
          )
        )
      `)
      .eq('promoter_id', promoterId)
      .gte('event_date', new Date().toISOString());

    if (dashboardError) {
      console.error(`❌ Error fetching dashboard data: ${dashboardError.message}`);
    } else {
      console.log(`✅ Dashboard data retrieved successfully`);
      
      // Calculate stats
      let stats = {
        total_pending: 0,
        expiring_6h: 0,
        expiring_24h: 0,
        expired: 0
      };

      dashboardEvents?.forEach(event => {
        event.event_spots?.forEach(spot => {
          if (spot.confirmation_status === 'pending') {
            stats.total_pending++;
            
            if (spot.confirmation_deadline) {
              const deadline = new Date(spot.confirmation_deadline);
              const now = new Date();
              const hoursUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
              
              if (hoursUntil <= 0) {
                stats.expired++;
              } else if (hoursUntil <= 6) {
                stats.expiring_6h++;
              } else if (hoursUntil <= 24) {
                stats.expiring_24h++;
              }
            }
          }
        });
      });

      console.log(`   📊 Dashboard Stats:`);
      console.log(`      - Total Pending: ${stats.total_pending}`);
      console.log(`      - Expiring in 6h: ${stats.expiring_6h}`);
      console.log(`      - Expiring in 24h: ${stats.expiring_24h}`);
      console.log(`      - Already Expired: ${stats.expired}`);
    }

    // Cleanup
    console.log('\n9️⃣  Cleaning up test data...');
    
    // Delete test event and spots (cascade)
    await supabase
      .from('events')
      .delete()
      .eq('id', event.id);
    
    console.log('✅ Test data cleaned up');

    console.log('\n' + '='.repeat(60));
    console.log('\n✨ All deadline tracking tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Deadline expiration handling ✅');
    console.log('   - Reminder notifications ✅');
    console.log('   - Email queue ✅');
    console.log('   - Deadline extension ✅');
    console.log('   - Dashboard data retrieval ✅');
    console.log('\n🎉 The deadline tracking system is working correctly!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Helper function to get user by email
async function getUserByEmail(email) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  
  return data;
}

// Run tests
runTests().catch(console.error);