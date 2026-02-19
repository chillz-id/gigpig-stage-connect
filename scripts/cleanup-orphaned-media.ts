/**
 * Cleanup Orphaned Directory Media
 *
 * Removes directory_media entries that point to files that don't actually
 * exist in Supabase Storage (orphaned metadata from failed bulk uploads).
 *
 * Run with: npx tsx scripts/cleanup-orphaned-media.ts
 * Dry run:  npx tsx scripts/cleanup-orphaned-media.ts --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pdikjpfulhhpqpzpgtu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const BUCKET = 'directory-media';
const DRY_RUN = process.argv.includes('--dry-run');

interface OrphanedRecord {
  id: string;
  storage_path: string;
  directory_profile_id: string;
}

async function testFileExists(storagePath: string): Promise<boolean> {
  // Create a signed URL and try to fetch it - most reliable test
  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 10);

  if (signError || !signed?.signedUrl) {
    return false;
  }

  try {
    const response = await fetch(signed.signedUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('=== Cleanup Orphaned Directory Media ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (will delete orphaned entries)'}\n`);

  // Get all directory_media entries (no limit)
  const { data: allMedia, error: mediaError } = await supabase
    .from('directory_media')
    .select('id, storage_path, directory_profile_id')
    .order('storage_path')
    .limit(10000);

  if (mediaError) {
    console.error('Failed to fetch media records:', mediaError.message);
    process.exit(1);
  }

  console.log(`Found ${allMedia?.length || 0} total directory_media records\n`);

  if (!allMedia || allMedia.length === 0) {
    console.log('No records to check.');
    return;
  }

  const orphaned: OrphanedRecord[] = [];
  const working: OrphanedRecord[] = [];

  console.log('Testing file accessibility (this may take a while)...\n');

  let tested = 0;
  for (const record of allMedia) {
    tested++;
    const exists = await testFileExists(record.storage_path);

    if (exists) {
      working.push(record);
    } else {
      orphaned.push(record);
    }

    // Progress update every 50 records
    if (tested % 50 === 0) {
      console.log(`  Tested ${tested}/${allMedia.length} - Found ${orphaned.length} orphaned so far...`);
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`Working files: ${working.length}`);
  console.log(`Orphaned files: ${orphaned.length}`);

  if (orphaned.length === 0) {
    console.log('\nNo orphaned records found. Nothing to clean up.');
    return;
  }

  // Group orphaned by profile for reporting
  const byProfile = new Map<string, number>();
  orphaned.forEach(r => {
    const folder = r.storage_path.split('/')[0];
    byProfile.set(folder, (byProfile.get(folder) || 0) + 1);
  });

  console.log(`\n=== Orphaned Files by Folder ===`);
  const sortedFolders = [...byProfile.entries()].sort((a, b) => b[1] - a[1]);
  sortedFolders.forEach(([folder, count]) => {
    console.log(`  ${folder}: ${count} files`);
  });

  if (DRY_RUN) {
    console.log('\n=== DRY RUN - No changes made ===');
    console.log('Run without --dry-run to delete orphaned entries.');
    return;
  }

  // Delete orphaned directory_media entries
  console.log('\n=== Deleting orphaned directory_media entries ===');

  const orphanedIds = orphaned.map(r => r.id);
  const BATCH_SIZE = 100;

  let deleted = 0;
  for (let i = 0; i < orphanedIds.length; i += BATCH_SIZE) {
    const batch = orphanedIds.slice(i, i + BATCH_SIZE);

    const { error: deleteError } = await supabase
      .from('directory_media')
      .delete()
      .in('id', batch);

    if (deleteError) {
      console.error(`Failed to delete batch at ${i}:`, deleteError.message);
    } else {
      deleted += batch.length;
      console.log(`  Deleted ${deleted}/${orphanedIds.length} records...`);
    }
  }

  // Also try to remove the orphaned storage objects
  console.log('\n=== Cleaning up orphaned storage objects ===');

  const orphanedPaths = orphaned.map(r => r.storage_path);
  for (let i = 0; i < orphanedPaths.length; i += BATCH_SIZE) {
    const batch = orphanedPaths.slice(i, i + BATCH_SIZE);

    const { error: removeError } = await supabase.storage
      .from(BUCKET)
      .remove(batch);

    if (removeError) {
      // This may fail if files don't exist, which is fine
      console.log(`  Note: Some storage objects may not exist (expected)`);
    }
  }

  console.log('\n=== Cleanup Complete ===');
  console.log(`Deleted ${deleted} orphaned directory_media records`);
  console.log(`\nAffected profiles will need their photos re-uploaded.`);
}

main().catch(console.error);
