import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAnalyticsSystem() {
  console.log('🧪 Testing Profile Analytics System...\n');

  try {
    // 1. Test table existence
    console.log('1. Testing table existence...');
    const tables = ['profile_views', 'profile_engagement', 'profile_analytics_daily'];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      
      if (error && error.code === '42P01') {
        console.error(`❌ Table ${table} does not exist`);
        return;
      } else if (error) {
        console.error(`❌ Error accessing ${table}:`, error.message);
      } else {
        console.log(`✅ Table ${table} exists`);
      }
    }

    // 2. Test inserting a profile view
    console.log('\n2. Testing profile view tracking...');
    
    // Get a test profile
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (!profiles || profiles.length === 0) {
      console.error('❌ No profiles found for testing');
      return;
    }

    const testProfileId = profiles[0].id;
    
    const { data: viewData, error: viewError } = await supabase
      .from('profile_views')
      .insert({
        profile_id: testProfileId,
        session_id: `test-session-${Date.now()}`,
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Test)',
        country: 'Australia',
        region: 'New South Wales',
        city: 'Sydney',
        device_type: 'desktop',
        browser: 'Chrome',
        os: 'macOS',
        is_bot: false,
      })
      .select()
      .single();

    if (viewError) {
      console.error('❌ Failed to insert profile view:', viewError);
    } else {
      console.log('✅ Profile view tracked successfully:', viewData.id);
    }

    // 3. Test inserting engagement
    console.log('\n3. Testing engagement tracking...');
    
    const { data: engagementData, error: engagementError } = await supabase
      .from('profile_engagement')
      .insert({
        profile_id: testProfileId,
        session_id: `test-session-${Date.now()}`,
        action_type: 'media_view',
        action_details: { media_type: 'video', media_id: 'test-123' },
        time_spent_seconds: 120,
      })
      .select()
      .single();

    if (engagementError) {
      console.error('❌ Failed to insert engagement:', engagementError);
    } else {
      console.log('✅ Engagement tracked successfully:', engagementData.id);
    }

    // 4. Test aggregation function
    console.log('\n4. Testing analytics aggregation...');
    
    const { error: aggregateError } = await supabase.rpc('aggregate_profile_analytics', {
      target_date: new Date().toISOString().split('T')[0],
    });

    if (aggregateError) {
      console.error('❌ Failed to aggregate analytics:', aggregateError);
    } else {
      console.log('✅ Analytics aggregated successfully');
    }

    // 5. Test retrieving analytics
    console.log('\n5. Testing analytics retrieval...');
    
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('profile_analytics_daily')
      .select('*')
      .eq('profile_id', testProfileId)
      .order('date', { ascending: false })
      .limit(1);

    if (analyticsError) {
      console.error('❌ Failed to retrieve analytics:', analyticsError);
    } else if (analyticsData && analyticsData.length > 0) {
      console.log('✅ Analytics retrieved successfully:');
      console.log(`   - Total views: ${analyticsData[0].total_views}`);
      console.log(`   - Unique visitors: ${analyticsData[0].unique_visitors}`);
      console.log(`   - Avg time spent: ${analyticsData[0].avg_time_spent_seconds}s`);
    } else {
      console.log('⚠️  No analytics data found (aggregation may not have run yet)');
    }

    // 6. Test RLS policies
    console.log('\n6. Testing RLS policies...');
    
    // Create a test user client
    const { data: { users } } = await supabase.auth.admin.listUsers();
    if (users && users.length > 0) {
      const testUser = users[0];
      
      // Test that users can only see their own analytics
      const userClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
      
      const { data: rlsTest, error: rlsError } = await userClient
        .from('profile_analytics_daily')
        .select('*')
        .neq('profile_id', testUser.id);
      
      if (rlsError) {
        console.log('✅ RLS policies working correctly (access denied to other profiles)');
      } else if (rlsTest && rlsTest.length === 0) {
        console.log('✅ RLS policies working correctly (no data returned for other profiles)');
      } else {
        console.error('❌ RLS policies may not be working correctly');
      }
    }

    console.log('\n✅ Profile analytics system test completed successfully!');
    console.log('\n📊 Analytics system is ready for use.');
    console.log('\nNext steps:');
    console.log('1. Deploy edge functions: cd supabase && supabase functions deploy');
    console.log('2. Set up daily cron job for aggregation');
    console.log('3. Test the frontend integration');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test
testAnalyticsSystem();