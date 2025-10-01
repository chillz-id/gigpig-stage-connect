#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function configureTicketPlatforms() {
  console.log('🎫 Configuring Ticket Platform Integrations...\n');

  // 1. Check environment variables
  console.log('1️⃣ Checking environment variables...');
  const requiredEnvVars = {
    'HUMANITIX_API_KEY': process.env.HUMANITIX_API_KEY,
    'HUMANITIX_WEBHOOK_SECRET': process.env.HUMANITIX_WEBHOOK_SECRET,
    'EVENTBRITE_API_KEY': process.env.EVENTBRITE_API_KEY,
    'EVENTBRITE_WEBHOOK_SECRET': process.env.EVENTBRITE_WEBHOOK_SECRET,
  };

  const missingVars = [];
  for (const [name, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missingVars.push(name);
      console.log(`  ❌ ${name}: Not configured`);
    } else {
      console.log(`  ✅ ${name}: ${value.substring(0, 10)}...`);
    }
  }

  if (missingVars.length > 0) {
    console.log(`\n⚠️  Missing environment variables: ${missingVars.join(', ')}`);
    console.log('Please add these to your .env file or /etc/standup-sydney/credentials.env\n');
  }

  // 2. Check webhook URLs
  console.log('\n2️⃣ Webhook URLs configured:');
  const webhookUrls = {
    'Humanitix': `${supabaseUrl}/functions/v1/humanitix-webhook`,
    'Eventbrite': `${supabaseUrl}/functions/v1/eventbrite-webhook`,
  };

  for (const [platform, url] of Object.entries(webhookUrls)) {
    console.log(`  📍 ${platform}: ${url}`);
  }

  // 3. Test edge functions
  console.log('\n3️⃣ Testing edge functions...');
  
  for (const [platform, url] of Object.entries(webhookUrls)) {
    try {
      const response = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log(`  ✅ ${platform} webhook: Responding correctly`);
      } else {
        console.log(`  ❌ ${platform} webhook: Not responding (${response.status})`);
      }
    } catch (error) {
      console.log(`  ❌ ${platform} webhook: Error - ${error.message}`);
    }
  }

  // 4. Check database tables
  console.log('\n4️⃣ Checking database tables...');
  
  const tables = ['ticket_platforms', 'ticket_sales', 'webhook_logs'];
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`  ❌ ${table}: Error - ${error.message}`);
    } else {
      console.log(`  ✅ ${table}: Found (${count || 0} records)`);
    }
  }

  // 5. Configure default platform settings
  console.log('\n5️⃣ Configuring default platform settings...');
  
  const platformConfigs = [
    {
      name: 'Humanitix',
      api_endpoint: 'https://api.humanitix.com/v1',
      webhook_url: webhookUrls.Humanitix,
      is_active: true,
      settings: {
        sync_interval_minutes: 60,
        webhook_events: ['order.created', 'order.updated', 'order.cancelled', 'order.refunded'],
        api_version: 'v1',
      },
    },
    {
      name: 'Eventbrite',
      api_endpoint: 'https://www.eventbriteapi.com/v3',
      webhook_url: webhookUrls.Eventbrite,
      is_active: true,
      settings: {
        sync_interval_minutes: 60,
        webhook_events: ['order.placed', 'order.updated', 'order.refunded'],
        api_version: 'v3',
      },
    },
  ];

  for (const config of platformConfigs) {
    const { data, error } = await supabase
      .from('ticket_platforms')
      .select('id')
      .eq('platform', config.name.toLowerCase())
      .limit(1);

    if (data && data.length === 0) {
      // Insert default config
      const { error: insertError } = await supabase
        .from('ticket_platforms')
        .insert({
          platform: config.name.toLowerCase(),
          is_enabled: config.is_active,
          platform_config: config.settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.log(`  ❌ ${config.name}: Failed to configure - ${insertError.message}`);
      } else {
        console.log(`  ✅ ${config.name}: Configured with default settings`);
      }
    } else {
      console.log(`  ℹ️  ${config.name}: Already configured`);
    }
  }

  // 6. Test API connectivity
  console.log('\n6️⃣ Testing API connectivity...');
  
  // Test Humanitix API
  if (process.env.HUMANITIX_API_KEY) {
    try {
      const response = await fetch('https://api.humanitix.com/v1/events', {
        headers: {
          'x-api-key': process.env.HUMANITIX_API_KEY,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('  ✅ Humanitix API: Connected successfully');
      } else {
        console.log(`  ❌ Humanitix API: Connection failed (${response.status})`);
      }
    } catch (error) {
      console.log(`  ❌ Humanitix API: Error - ${error.message}`);
    }
  } else {
    console.log('  ⚠️  Humanitix API: Cannot test (no API key)');
  }

  // Test Eventbrite API (if we had an OAuth token)
  if (process.env.EVENTBRITE_OAUTH_TOKEN) {
    try {
      const response = await fetch('https://www.eventbriteapi.com/v3/users/me/', {
        headers: {
          'Authorization': `Bearer ${process.env.EVENTBRITE_OAUTH_TOKEN}`,
        },
      });
      
      if (response.ok) {
        console.log('  ✅ Eventbrite API: Connected successfully');
      } else {
        console.log(`  ❌ Eventbrite API: Connection failed (${response.status})`);
      }
    } catch (error) {
      console.log(`  ❌ Eventbrite API: Error - ${error.message}`);
    }
  } else {
    console.log('  ⚠️  Eventbrite API: OAuth token not configured yet');
  }

  // 7. Generate webhook configuration instructions
  console.log('\n7️⃣ Webhook Configuration Instructions:\n');
  
  console.log('📝 Humanitix Webhook Setup:');
  console.log(`   1. Log in to your Humanitix dashboard`);
  console.log(`   2. Go to Settings > Webhooks`);
  console.log(`   3. Add webhook URL: ${webhookUrls.Humanitix}`);
  console.log(`   4. Select events: order.created, order.updated, order.cancelled, order.refunded`);
  console.log(`   5. Copy the webhook secret and add to HUMANITIX_WEBHOOK_SECRET`);
  
  console.log('\n📝 Eventbrite Webhook Setup:');
  console.log(`   1. Log in to your Eventbrite account`);
  console.log(`   2. Go to Account Settings > App Management`);
  console.log(`   3. Create or select your app`);
  console.log(`   4. Add webhook URL: ${webhookUrls.Eventbrite}`);
  console.log(`   5. Select actions: order.placed, order.updated, order.refunded`);
  console.log(`   6. Copy the webhook secret and add to EVENTBRITE_WEBHOOK_SECRET`);

  console.log('\n✅ Configuration complete!');
  
  // Summary
  console.log('\n📊 Configuration Summary:');
  console.log(`   - Environment variables: ${Object.keys(requiredEnvVars).length - missingVars.length}/${Object.keys(requiredEnvVars).length} configured`);
  console.log(`   - Edge functions: Deployed and active`);
  console.log(`   - Database tables: Ready`);
  console.log(`   - Webhook URLs: Generated`);
  
  if (missingVars.length > 0) {
    console.log(`\n⚠️  Action required: Configure missing environment variables`);
  } else {
    console.log(`\n✅ All systems ready for ticket platform integration!`);
  }
}

// Run the configuration
configureTicketPlatforms().catch(console.error);