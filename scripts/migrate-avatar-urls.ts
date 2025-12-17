/**
 * Avatar URL Migration Script
 *
 * Migrates avatar URLs from slug-based paths to userId-based paths.
 *
 * Problem: Slug-based storage paths (e.g., `chillz-skinner/...`) return 400 errors
 * even though files exist. userId-based paths (`c0d3b50f-.../...`) work correctly.
 *
 * Solution: Copy files to userId-based paths and update database URLs.
 *
 * Usage: npx ts-node scripts/migrate-avatar-urls.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL:', SUPABASE_URL ? 'set' : 'MISSING');
  console.error('- SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? 'set' : 'MISSING');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const BUCKET = 'profile-images';

interface ProfileWithBrokenUrl {
  id: string;
  name: string;
  avatar_url: string;
}

interface MigrationResult {
  profileId: string;
  profileName: string;
  oldUrl: string;
  newUrl: string;
  status: 'success' | 'skipped' | 'error';
  error?: string;
}

/**
 * Extract path from full Supabase storage URL
 */
function extractPathFromUrl(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/public\/profile-images\/(.+)$/);
  return match ? match[1] : null;
}

/**
 * Check if a path is userId-based (UUID format)
 */
function isUserIdPath(path: string): boolean {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\//.test(path);
}

/**
 * Extract userId from filename (format: {userId}-{timestamp}.ext)
 */
function extractUserIdFromFilename(filename: string): string | null {
  const match = filename.match(/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})-\d+/);
  return match ? match[1] : null;
}

/**
 * Fetch profiles with broken (non-userId) avatar URLs
 */
async function fetchBrokenProfiles(): Promise<ProfileWithBrokenUrl[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .not('avatar_url', 'is', null)
    .neq('avatar_url', '');

  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`);
  }

  // Filter to only broken URLs (non-userId paths)
  return (data || []).filter(profile => {
    const path = extractPathFromUrl(profile.avatar_url);
    return path && !isUserIdPath(path);
  });
}

/**
 * Copy file from old path to new userId-based path
 */
async function copyFileToUserIdPath(
  oldPath: string,
  userId: string
): Promise<{ newPath: string; success: boolean; error?: string }> {
  const filename = oldPath.split('/').pop();
  if (!filename) {
    return { newPath: '', success: false, error: 'Could not extract filename' };
  }

  const newPath = `${userId}/${filename}`;

  // Check if file already exists at new path
  const { data: existingFile } = await supabase.storage
    .from(BUCKET)
    .list(userId, { search: filename });

  if (existingFile && existingFile.length > 0) {
    console.log(`  File already exists at ${newPath}, skipping copy`);
    return { newPath, success: true };
  }

  // Try multiple download methods
  let fileData: Blob | null = null;
  let downloadMethod = '';

  // Method 1: Direct download via storage API
  console.log(`  Trying storage API download...`);
  const { data: downloadData, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(oldPath);

  if (!downloadError && downloadData) {
    fileData = downloadData;
    downloadMethod = 'storage API';
  } else {
    console.log(`  Storage API download failed: ${JSON.stringify(downloadError)}`);

    // Method 2: Try signed URL
    console.log(`  Trying signed URL download...`);
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(oldPath, 3600);

    if (!signedUrlError && signedUrlData?.signedUrl) {
      console.log(`  Got signed URL, fetching...`);
      try {
        const response = await fetch(signedUrlData.signedUrl);
        if (response.ok) {
          fileData = await response.blob();
          downloadMethod = 'signed URL';
        } else {
          console.log(`  Signed URL fetch failed: ${response.status} ${response.statusText}`);
        }
      } catch (fetchErr) {
        console.log(`  Signed URL fetch error: ${fetchErr}`);
      }
    } else {
      console.log(`  Signed URL creation failed: ${JSON.stringify(signedUrlError)}`);
    }
  }

  if (!fileData) {
    return { newPath: '', success: false, error: 'All download methods failed - file corrupt/orphaned in storage' };
  }

  console.log(`  Downloaded via ${downloadMethod}, size: ${fileData.size} bytes`);

  // Upload to new path
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(newPath, fileData, {
      contentType: fileData.type || 'image/png',
      upsert: true
    });

  if (uploadError) {
    return { newPath: '', success: false, error: `Upload failed: ${uploadError.message}` };
  }

  return { newPath, success: true };
}

/**
 * Update profile avatar_url in database
 */
async function updateProfileAvatarUrl(profileId: string, newUrl: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: newUrl })
    .eq('id', profileId);

  if (error) {
    throw new Error(`Failed to update profile ${profileId}: ${error.message}`);
  }
}

/**
 * Main migration function
 */
async function migrateAvatarUrls(dryRun: boolean = false): Promise<MigrationResult[]> {
  console.log('\n=== Avatar URL Migration ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will make changes)'}`);
  console.log('');

  const results: MigrationResult[] = [];

  // Fetch profiles with broken URLs
  console.log('Fetching profiles with broken avatar URLs...');
  const brokenProfiles = await fetchBrokenProfiles();
  console.log(`Found ${brokenProfiles.length} profiles with non-userId avatar paths\n`);

  for (const profile of brokenProfiles) {
    console.log(`Processing: ${profile.name} (${profile.id})`);
    console.log(`  Current URL: ${profile.avatar_url}`);

    const oldPath = extractPathFromUrl(profile.avatar_url);
    if (!oldPath) {
      console.log(`  ERROR: Could not extract path from URL`);
      results.push({
        profileId: profile.id,
        profileName: profile.name,
        oldUrl: profile.avatar_url,
        newUrl: '',
        status: 'error',
        error: 'Could not extract path from URL'
      });
      continue;
    }

    // Use the profile ID as the userId for the new path
    const userId = profile.id;
    const filename = oldPath.split('/').pop() || '';
    const newPath = `${userId}/${filename}`;
    const newUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${newPath}`;

    console.log(`  Old path: ${oldPath}`);
    console.log(`  New path: ${newPath}`);

    if (dryRun) {
      console.log(`  [DRY RUN] Would copy file and update URL`);
      results.push({
        profileId: profile.id,
        profileName: profile.name,
        oldUrl: profile.avatar_url,
        newUrl: newUrl,
        status: 'skipped'
      });
      continue;
    }

    // Copy file to new path
    const copyResult = await copyFileToUserIdPath(oldPath, userId);
    if (!copyResult.success) {
      console.log(`  ERROR: ${copyResult.error}`);
      results.push({
        profileId: profile.id,
        profileName: profile.name,
        oldUrl: profile.avatar_url,
        newUrl: '',
        status: 'error',
        error: copyResult.error
      });
      continue;
    }

    // Update database
    try {
      await updateProfileAvatarUrl(profile.id, newUrl);
      console.log(`  SUCCESS: Updated to ${newUrl}`);
      results.push({
        profileId: profile.id,
        profileName: profile.name,
        oldUrl: profile.avatar_url,
        newUrl: newUrl,
        status: 'success'
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.log(`  ERROR: ${errorMsg}`);
      results.push({
        profileId: profile.id,
        profileName: profile.name,
        oldUrl: profile.avatar_url,
        newUrl: newUrl,
        status: 'error',
        error: errorMsg
      });
    }

    console.log('');
  }

  // Summary
  console.log('\n=== Migration Summary ===');
  const successful = results.filter(r => r.status === 'success').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const errors = results.filter(r => r.status === 'error').length;

  console.log(`Total profiles processed: ${results.length}`);
  console.log(`  Successful: ${successful}`);
  console.log(`  Skipped (dry run): ${skipped}`);
  console.log(`  Errors: ${errors}`);

  if (errors > 0) {
    console.log('\nErrors:');
    results
      .filter(r => r.status === 'error')
      .forEach(r => console.log(`  - ${r.profileName}: ${r.error}`));
  }

  return results;
}

/**
 * Clear broken avatar URLs (set to NULL)
 */
async function clearBrokenAvatarUrls(dryRun: boolean = false): Promise<void> {
  console.log('\n=== Clear Broken Avatar URLs ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will make changes)'}`);
  console.log('');

  // Fetch profiles with broken URLs
  console.log('Fetching profiles with broken avatar URLs...');
  const brokenProfiles = await fetchBrokenProfiles();
  console.log(`Found ${brokenProfiles.length} profiles with non-userId avatar paths\n`);

  for (const profile of brokenProfiles) {
    console.log(`Processing: ${profile.name} (${profile.id})`);
    console.log(`  Current URL: ${profile.avatar_url}`);

    if (dryRun) {
      console.log(`  [DRY RUN] Would clear avatar_url to NULL`);
      continue;
    }

    // Clear the avatar URL
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', profile.id);

    if (error) {
      console.log(`  ERROR: ${error.message}`);
    } else {
      console.log(`  SUCCESS: Cleared avatar_url - user will see default avatar`);
    }
    console.log('');
  }

  console.log('Done. Users will need to re-upload their avatars.');
}

// Run migration
const isDryRun = process.argv.includes('--dry-run');
const clearMode = process.argv.includes('--clear-broken');

if (clearMode) {
  clearBrokenAvatarUrls(isDryRun)
    .then(() => {
      console.log('\nClear operation complete.');
      process.exit(0);
    })
    .catch(err => {
      console.error('\nOperation failed:', err);
      process.exit(1);
    });
} else {
  migrateAvatarUrls(isDryRun)
    .then(() => {
      console.log('\nMigration complete.');
      process.exit(0);
    })
    .catch(err => {
      console.error('\nMigration failed:', err);
      process.exit(1);
    });
}
