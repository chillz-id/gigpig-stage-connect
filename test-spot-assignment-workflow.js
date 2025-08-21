import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/root/agents/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function demonstrateSpotAssignmentWorkflow() {
  console.log('🎭 Spot Assignment Workflow Demonstration\n');
  
  try {
    // Step 1: Show how to create an application with spot preferences
    console.log('1️⃣ Creating an application with spot preferences:');
    console.log(`
const applicationData = {
  event_id: 'event-uuid-here',
  comedian_id: 'comedian-uuid-here',
  message: 'I would love to perform at your show!',
  spot_type: 'Feature',                    // NEW: Specify preferred spot type
  availability_confirmed: true,             // NEW: Confirm availability
  requirements_acknowledged: true,          // NEW: Acknowledge event requirements
  status: 'pending'
};

const { data: application, error } = await supabase
  .from('applications')
  .insert([applicationData])
  .select()
  .single();
`);
    
    // Step 2: Show how to assign a spot to a comedian
    console.log('\n2️⃣ Assigning a spot to a comedian:');
    console.log(`
// Using the RPC function to assign a spot
const { data: assignment, error } = await supabase
  .rpc('assign_spot_to_comedian', {
    p_event_id: 'event-uuid-here',
    p_comedian_id: 'comedian-uuid-here',
    p_spot_type: 'Feature',
    p_confirmation_deadline_hours: 48  // Comedian has 48 hours to confirm
  });

// The function will:
// 1. Find an available Feature spot for the event
// 2. Assign the comedian to that spot
// 3. Set confirmation deadline (48 hours from now)
// 4. Update the application status to 'accepted' if one exists
// 5. Create a spot_assignments record for tracking
// 6. Return assignment details including deadline
`);
    
    // Step 3: Show the spot confirmation tracking
    console.log('\n3️⃣ Tracking spot confirmations:');
    console.log(`
// Check pending confirmations for an event
const { data: pendingSpots, error } = await supabase
  .from('event_spots')
  .select(\`
    *,
    profiles!comedian_id (
      id,
      name,
      email
    )
  \`)
  .eq('event_id', 'event-uuid-here')
  .eq('confirmation_status', 'pending')
  .not('confirmation_deadline', 'is', null);

// Check all assignments for a comedian
const { data: assignments, error } = await supabase
  .from('spot_assignments')
  .select(\`
    *,
    events (
      title,
      event_date,
      venue
    ),
    event_spots (
      spot_name,
      duration_minutes,
      is_paid,
      payment_amount
    )
  \`)
  .eq('comedian_id', 'comedian-uuid-here')
  .order('created_at', { ascending: false });
`);
    
    // Step 4: Show how comedians confirm their spots
    console.log('\n4️⃣ Comedian confirming their spot:');
    console.log(`
// Comedian confirms their spot
const { error } = await supabase
  .from('event_spots')
  .update({
    confirmation_status: 'confirmed',
    confirmed_at: new Date().toISOString()
  })
  .eq('id', 'spot-uuid-here')
  .eq('comedian_id', auth.uid()); // Ensure comedian can only confirm their own spots

// Also update the assignment record
await supabase
  .from('spot_assignments')
  .update({
    confirmation_status: 'confirmed',
    confirmed_at: new Date().toISOString()
  })
  .eq('spot_id', 'spot-uuid-here')
  .eq('comedian_id', auth.uid());
`);
    
    // Step 5: Show deadline monitoring
    console.log('\n5️⃣ Monitoring confirmation deadlines:');
    console.log(`
// Find spots with expired confirmation deadlines
const { data: expiredSpots, error } = await supabase
  .from('event_spots')
  .select(\`
    *,
    events (
      title,
      promoter_id
    )
  \`)
  .eq('confirmation_status', 'pending')
  .lt('confirmation_deadline', new Date().toISOString())
  .not('confirmation_deadline', 'is', null);

// These spots can be automatically released or 
// promoters can be notified to reassign them
`);
    
    console.log('\n✅ Workflow demonstration complete!\n');
    console.log('Key Features Implemented:');
    console.log('- Applications now track spot type preferences');
    console.log('- Comedians confirm availability when applying');
    console.log('- Spot assignments are tracked with deadlines');
    console.log('- Confirmation status is monitored');
    console.log('- Full audit trail of assignments');
    
  } catch (error) {
    console.error('❌ Error in demonstration:', error);
  }
}

// Run the demonstration
demonstrateSpotAssignmentWorkflow().catch(console.error);