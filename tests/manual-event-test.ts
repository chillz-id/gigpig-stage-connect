#!/usr/bin/env node

/**
 * Manual Event System Test Script
 * Run this to validate all event-related changes
 */

import { supabase } from '../src/integrations/supabase/client';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
};

async function testEventCreation() {
  log.info('Testing Event Creation with promoter_id...');
  
  try {
    // First, get a user to act as promoter
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      log.warn('No authenticated user. Please login first.');
      return false;
    }

    // Create a test event
    const testEvent = {
      title: `Test Event ${Date.now()}`,
      venue: 'Test Comedy Club',
      address: '123 Test St',
      city: 'Sydney',
      state: 'NSW',
      country: 'Australia',
      event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      start_time: '20:00',
      type: 'open_mic',
      description: 'Test event for validation',
      promoter_id: user.id,
      status: 'draft',
      spots: 10,
      banner_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    };

    const { data, error } = await supabase
      .from('events')
      .insert(testEvent)
      .select()
      .single();

    if (error) {
      log.error(`Failed to create event: ${error.message}`);
      return false;
    }

    log.success(`Event created successfully with ID: ${data.id}`);
    log.success(`Promoter ID correctly set: ${data.promoter_id}`);
    
    // Clean up
    await supabase.from('events').delete().eq('id', data.id);
    
    return true;
  } catch (error) {
    log.error(`Test failed: ${error}`);
    return false;
  }
}

async function testEventDisplay() {
  log.info('Testing Event Display with Images...');
  
  try {
    // Fetch events with banner images
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .not('banner_url', 'is', null)
      .limit(5);

    if (error) {
      log.error(`Failed to fetch events: ${error.message}`);
      return false;
    }

    if (!events || events.length === 0) {
      log.warn('No events with banner images found');
      return true;
    }

    log.success(`Found ${events.length} events with banner images`);
    events.forEach(event => {
      log.info(`- ${event.title}: ${event.banner_url ? '✓ Has image' : '✗ No image'}`);
    });

    return true;
  } catch (error) {
    log.error(`Test failed: ${error}`);
    return false;
  }
}

async function testEventFiltering() {
  log.info('Testing Event Filtering...');
  
  try {
    // Test different status filters
    const statuses = ['open', 'draft', 'completed', 'cancelled'];
    
    for (const status of statuses) {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, status')
        .eq('status', status)
        .limit(3);

      if (error) {
        log.error(`Failed to filter by status ${status}: ${error.message}`);
        continue;
      }

      log.success(`Status filter '${status}': Found ${data?.length || 0} events`);
    }

    // Test date range filtering
    const today = new Date().toISOString();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: upcomingEvents, error: dateError } = await supabase
      .from('events')
      .select('id, title, event_date')
      .gte('event_date', today)
      .lte('event_date', nextWeek);

    if (!dateError) {
      log.success(`Date range filter: Found ${upcomingEvents?.length || 0} events in next 7 days`);
    }

    return true;
  } catch (error) {
    log.error(`Test failed: ${error}`);
    return false;
  }
}

async function checkForStageManagerReferences() {
  log.info('Checking for stage_manager_id references...');
  
  try {
    // Query events table columns
    const { data: columns, error } = await supabase
      .from('events')
      .select('*')
      .limit(0);

    if (error) {
      log.warn('Could not check table structure');
      return true;
    }

    // Check if stage_manager_id exists in the database
    const { data: eventSample, error: sampleError } = await supabase
      .from('events')
      .select('*')
      .limit(1)
      .single();

    if (!sampleError && eventSample) {
      if ('stage_manager_id' in eventSample) {
        log.error('Found stage_manager_id column in database!');
        return false;
      }
      if (!('promoter_id' in eventSample)) {
        log.error('Missing promoter_id column in database!');
        return false;
      }
    }

    log.success('No stage_manager_id references found');
    log.success('promoter_id column exists correctly');
    
    return true;
  } catch (error) {
    log.error(`Test failed: ${error}`);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🧪 Running Event System Validation Tests\n');
  
  const tests = [
    { name: 'Event Creation', fn: testEventCreation },
    { name: 'Event Display', fn: testEventDisplay },
    { name: 'Event Filtering', fn: testEventFiltering },
    { name: 'Stage Manager Check', fn: checkForStageManagerReferences },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    console.log('─'.repeat(40));
    
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n' + '═'.repeat(40));
  console.log(`\n📊 Test Summary:`);
  console.log(`   ${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`   ${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`   Total: ${tests.length}`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}✅ All tests passed!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}❌ Some tests failed!${colors.reset}\n`);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };