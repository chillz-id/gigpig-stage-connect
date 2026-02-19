/**
 * Fix Storage Paths with Spaces
 *
 * This script migrates directory_media files from paths with spaces
 * to paths with hyphens, fixing the Supabase Storage URL issue.
 *
 * Run with: npx tsx scripts/fix-storage-spaces.ts
 */

import { createClient } from '@supabase/supabase-js';

import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Set it with: export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const BUCKET = 'directory-media';
const BATCH_SIZE = 50;

interface MediaRecord {
  id: string;
  storage_path: string;
  public_url: string;
}

function sanitizePath(path: string): string {
  // Replace spaces with hyphens in the folder name only (not filename)
  const parts = path.split('/');
  if (parts.length >= 2) {
    // Sanitize folder name (first part)
    parts[0] = parts[0].replace(/\s+/g, '-');
  }
  return parts.join('/');
}

async function getMediaWithSpaces(): Promise<MediaRecord[]> {
  const { data, error } = await supabase
    .from('directory_media')
    .select('id, storage_path, public_url')
    .like('storage_path', '% %');

  if (error) {
    throw new Error(`Failed to fetch media records: ${error.message}`);
  }

  return data || [];
}

async function moveFile(oldPath: string, newPath: string): Promise<boolean> {
  try {
    // Use Supabase Storage move operation
    const { error } = await supabase.storage
      .from(BUCKET)
      .move(oldPath, newPath);

    if (error) {
      // If move fails, try copy + delete
      console.log(`  Move failed, trying copy+delete: ${error.message}`);

      // Download the file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(oldPath);

      if (downloadError) {
        console.error(`  Failed to download: ${downloadError.message}`);
        return false;
      }

      // Upload to new path
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(newPath, fileData, { upsert: true });

      if (uploadError) {
        console.error(`  Failed to upload: ${uploadError.message}`);
        return false;
      }

      // Delete old file
      const { error: deleteError } = await supabase.storage
        .from(BUCKET)
        .remove([oldPath]);

      if (deleteError) {
        console.warn(`  Warning: Failed to delete old file: ${deleteError.message}`);
        // Don't fail - the new file exists
      }
    }

    return true;
  } catch (err) {
    console.error(`  Error moving file: ${err}`);
    return false;
  }
}

async function updateMediaRecord(id: string, newPath: string): Promise<boolean> {
  const newPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${newPath}`;

  const { error } = await supabase
    .from('directory_media')
    .update({
      storage_path: newPath,
      public_url: newPublicUrl,
    })
    .eq('id', id);

  if (error) {
    console.error(`  Failed to update record: ${error.message}`);
    return false;
  }

  return true;
}

async function main() {
  console.log('=== Fix Storage Paths with Spaces ===\n');

  // Get all media with spaces in path
  console.log('Fetching media records with spaces in path...');
  const mediaRecords = await getMediaWithSpaces();
  console.log(`Found ${mediaRecords.length} records to fix\n`);

  if (mediaRecords.length === 0) {
    console.log('No records need fixing. Done!');
    return;
  }

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < mediaRecords.length; i++) {
    const record = mediaRecords[i];
    const newPath = sanitizePath(record.storage_path);

    // Skip if path doesn't actually change
    if (newPath === record.storage_path) {
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${mediaRecords.length}] ${record.storage_path}`);
    console.log(`  -> ${newPath}`);

    // Move the file
    const moved = await moveFile(record.storage_path, newPath);
    if (!moved) {
      failed++;
      continue;
    }

    // Update the database record
    const updated = await updateMediaRecord(record.id, newPath);
    if (!updated) {
      failed++;
      continue;
    }

    success++;
    console.log('  OK');

    // Small delay to avoid rate limiting
    if ((i + 1) % BATCH_SIZE === 0) {
      console.log(`\nProcessed ${i + 1} files, pausing briefly...\n`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${mediaRecords.length}`);
}

main().catch(console.error);
