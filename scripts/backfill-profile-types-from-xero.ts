/**
 * Backfill profile_type in directory_profiles from Xero Contacts CSV
 *
 * This script:
 * 1. Parses the Xero Contacts CSV file
 * 2. Maps Xero "Profile Type" values to directory profile_type values
 * 3. Updates directory_profiles where email matches and profile_type is NULL
 *
 * Usage: npx tsx scripts/backfill-profile-types-from-xero.ts
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Need:');
  console.error('  - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Make sure to export them or source your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Map Xero profile types to directory profile_type values (case-insensitive)
const PROFILE_TYPE_MAP: Record<string, string> = {
  'comedian_lite': 'comedian_lite',
  'photographer': 'photographer',
  'videographer': 'videographer',
  'dj': 'dj',
  'podcast': 'podcast',
  'comedian - manager': 'manager',
  'venue': 'venue',
  'venue - comedy club': 'venue',
  'venue - manager': 'venue',
  'venue manager': 'venue',
};

interface XeroContact {
  ContactName: string;
  EmailAddress: string;
  FirstName: string;
  LastName: string;
  'Profile Type': string;
  'Location - State': string;
  'Location - Country': string;
  ABN: string;
}

interface BackfillStats {
  total: number;
  updated: number;
  alreadySet: number;
  notFound: number;
  noEmail: number;
  unknownType: number;
  errors: number;
}

function normalizeProfileType(xeroType: string): string | null {
  if (!xeroType) return null;
  const normalized = xeroType.toLowerCase().trim();
  return PROFILE_TYPE_MAP[normalized] || null;
}

async function backfillProfileTypes(): Promise<void> {
  console.log('=== Backfill Profile Types from Xero CSV ===\n');

  // Read and parse CSV
  const csvPath = resolve(__dirname, '../docs/Xero Contacts v1.csv');
  console.log(`Reading CSV from: ${csvPath}`);

  let csvContent: string;
  try {
    csvContent = readFileSync(csvPath, 'utf-8');
  } catch (err) {
    console.error(`Failed to read CSV file: ${err}`);
    process.exit(1);
  }

  const records: XeroContact[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true, // Handle BOM if present
  });

  console.log(`Parsed ${records.length} contacts from CSV\n`);

  const stats: BackfillStats = {
    total: records.length,
    updated: 0,
    alreadySet: 0,
    notFound: 0,
    noEmail: 0,
    unknownType: 0,
    errors: 0,
  };

  const unknownTypes = new Set<string>();

  // Process each contact
  for (const contact of records) {
    const email = contact.EmailAddress?.toLowerCase().trim();
    const xeroProfileType = contact['Profile Type'];
    const contactName = contact.ContactName;

    // Skip if no email
    if (!email) {
      stats.noEmail++;
      console.log(`⏭️  SKIP (no email): ${contactName}`);
      continue;
    }

    // Map profile type
    const profileType = normalizeProfileType(xeroProfileType);
    if (!profileType) {
      stats.unknownType++;
      if (xeroProfileType) unknownTypes.add(xeroProfileType);
      console.log(`⚠️  UNKNOWN TYPE: ${contactName} (${email}) - "${xeroProfileType}"`);
      continue;
    }

    // Check if profile exists and needs update
    const { data: existing, error: selectError } = await supabase
      .from('directory_profiles')
      .select('id, stage_name, profile_type')
      .ilike('email', email)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      stats.errors++;
      console.error(`❌ ERROR checking ${contactName} (${email}): ${selectError.message}`);
      continue;
    }

    if (!existing) {
      stats.notFound++;
      console.log(`🔍 NOT FOUND: ${contactName} (${email}) - type would be: ${profileType}`);
      continue;
    }

    if (existing.profile_type) {
      stats.alreadySet++;
      console.log(`✓  ALREADY SET: ${existing.stage_name} (${email}) = ${existing.profile_type}`);
      continue;
    }

    // Update the profile type
    const { error: updateError } = await supabase
      .from('directory_profiles')
      .update({ profile_type: profileType, updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    if (updateError) {
      stats.errors++;
      console.error(`❌ ERROR updating ${contactName} (${email}): ${updateError.message}`);
      continue;
    }

    stats.updated++;
    console.log(`✅ UPDATED: ${existing.stage_name} (${email}) → ${profileType}`);
  }

  // Print summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total contacts in CSV:    ${stats.total}`);
  console.log(`Updated:                  ${stats.updated}`);
  console.log(`Already had profile_type: ${stats.alreadySet}`);
  console.log(`Not found in directory:   ${stats.notFound}`);
  console.log(`No email in CSV:          ${stats.noEmail}`);
  console.log(`Unknown profile type:     ${stats.unknownType}`);
  console.log(`Errors:                   ${stats.errors}`);

  if (unknownTypes.size > 0) {
    console.log(`\nUnknown profile types encountered:`);
    for (const type of unknownTypes) {
      console.log(`  - "${type}"`);
    }
  }

  // Verify final state
  console.log('\n=== FINAL STATE ===');
  const { data: finalCounts } = await supabase
    .from('directory_profiles')
    .select('profile_type')
    .then(({ data }) => {
      const counts: Record<string, number> = {};
      data?.forEach(row => {
        const key = row.profile_type || 'NULL';
        counts[key] = (counts[key] || 0) + 1;
      });
      return { data: counts };
    });

  if (finalCounts) {
    console.log('Profile type distribution:');
    Object.entries(finalCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
  }
}

// Run the backfill
backfillProfileTypes()
  .then(() => {
    console.log('\n✅ Backfill complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Backfill failed:', err);
    process.exit(1);
  });
