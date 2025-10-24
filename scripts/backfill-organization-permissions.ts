/**
 * Backfill Organization Permissions
 *
 * This script sets manager_type for existing organization team members
 * based on their current role. Run this after applying the permissions migration.
 *
 * Usage:
 *   npx tsx scripts/backfill-organization-permissions.ts
 *
 * What it does:
 * 1. Fetches all organization team members
 * 2. For 'manager' role members without manager_type, sets to 'general'
 * 3. Leaves custom_permissions as NULL (will use template defaults)
 * 4. Reports results
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TeamMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  manager_type: string | null;
  custom_permissions: any | null;
}

async function main() {
  console.log('🔧 Organization Permissions Backfill Script\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Fetch all team members
    console.log('\n📊 Step 1: Fetching organization team members...');
    const { data: members, error: fetchError } = await supabase
      .from('organization_team_members')
      .select('id, organization_id, user_id, role, manager_type, custom_permissions');

    if (fetchError) {
      throw new Error(`Failed to fetch team members: ${fetchError.message}`);
    }

    if (!members || members.length === 0) {
      console.log('   ℹ️  No team members found. Nothing to backfill.');
      return;
    }

    console.log(`   ✓ Found ${members.length} team members`);

    // Step 2: Categorize members
    const managersWithoutType = members.filter(
      m => m.role === 'manager' && !m.manager_type
    );
    const membersWithType = members.filter(m => m.manager_type);
    const nonManagers = members.filter(m => m.role !== 'manager');

    console.log('\n📋 Current State:');
    console.log(`   - Managers without manager_type: ${managersWithoutType.length}`);
    console.log(`   - Members with manager_type set: ${membersWithType.length}`);
    console.log(`   - Non-managers (owner/admin/member): ${nonManagers.length}`);

    // Step 3: Update managers without type
    if (managersWithoutType.length === 0) {
      console.log('\n✅ All managers already have manager_type assigned. No updates needed.');
      return;
    }

    console.log(`\n🔄 Step 2: Updating ${managersWithoutType.length} managers...`);
    console.log('   Setting manager_type to "general" for all manager role members');

    let successCount = 0;
    let errorCount = 0;

    for (const member of managersWithoutType) {
      const { error: updateError } = await supabase
        .from('organization_team_members')
        .update({ manager_type: 'general' })
        .eq('id', member.id);

      if (updateError) {
        console.error(`   ✗ Failed to update member ${member.id}: ${updateError.message}`);
        errorCount++;
      } else {
        successCount++;
      }
    }

    // Step 4: Report results
    console.log('\n' + '='.repeat(60));
    console.log('📊 Backfill Results:');
    console.log('='.repeat(60));
    console.log(`✓ Successfully updated: ${successCount} members`);
    if (errorCount > 0) {
      console.log(`✗ Failed updates: ${errorCount} members`);
    }

    console.log('\n📝 Summary:');
    console.log('   - All manager role members now have manager_type = "general"');
    console.log('   - custom_permissions remains NULL (uses template defaults)');
    console.log('   - Owners/admins can customize permissions via UI');

    console.log('\n✅ Backfill complete!\n');

  } catch (error) {
    console.error('\n❌ Backfill failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the script
main();
