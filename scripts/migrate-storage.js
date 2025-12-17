#!/usr/bin/env node
/**
 * Migration script: Move files from old bucket structure to new unified structure
 *
 * Old structure:
 *   comedian-media/{userId}/Banner/...
 *   comedian-media/{userId}/Headshots/...
 *   comedian-media/{slug}/Banner/...
 *   profile-images/{userId}/...
 *   profile-images/{slug}/...
 *   organization-media/organization-logos/{orgId}/...
 *
 * New structure (in media-library bucket):
 *   {userId}/my-files/profile/Profile Banners/...
 *   {userId}/my-files/profile/Headshots/...
 *   {userId}/my-files/profile/Profile Images/...
 *   {orgId}/org-files/...
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Mapping of folder types to new destinations
const FOLDER_MAPPING = {
  'Banner': 'Profile Banners',
  'Headshots': 'Headshots',
  'EventBanners': 'Profile Banners', // Merge with Profile Banners
  'link-thumbnails': 'Profile Images', // Put link thumbnails in Profile Images
};

async function getFilesToMigrate() {
  const { data, error } = await supabase
    .from('storage.objects')
    .select('bucket_id, name, owner')
    .in('bucket_id', ['profile-images', 'comedian-media', 'organization-media']);

  if (error) {
    // Use raw SQL if the above doesn't work
    const { data: sqlData, error: sqlError } = await supabase.rpc('get_storage_objects_for_migration');
    if (sqlError) {
      console.error('Error fetching files:', sqlError);
      return [];
    }
    return sqlData;
  }
  return data;
}

function determineNewPath(bucketId, oldPath, owner) {
  // organization-media: organization-logos/{orgId}/... → {orgId}/org-files/...
  if (bucketId === 'organization-media') {
    const match = oldPath.match(/^organization-logos\/([^/]+)\/(.+)$/);
    if (match) {
      const [, orgIdOrSlug, rest] = match;
      // Extract just the filename from the rest
      const filename = rest.split('/').pop();
      return `${orgIdOrSlug}/org-files/${filename}`;
    }
    return null; // Skip if doesn't match expected pattern
  }

  // profile-images: {userId|slug}/... → {owner}/my-files/profile/Profile Images/...
  if (bucketId === 'profile-images') {
    const filename = oldPath.split('/').pop();
    return `${owner}/my-files/profile/Profile Images/${filename}`;
  }

  // comedian-media: more complex structure
  if (bucketId === 'comedian-media') {
    // Pattern: {userId|slug}/{FolderType}/{userId}/{filename}
    // or: {userId|slug}/{filename} (root level)

    const parts = oldPath.split('/');
    const filename = parts[parts.length - 1];

    // Check for known folder types
    for (const [oldFolder, newFolder] of Object.entries(FOLDER_MAPPING)) {
      if (oldPath.includes(`/${oldFolder}/`)) {
        return `${owner}/my-files/profile/${newFolder}/${filename}`;
      }
    }

    // Root level files (no subfolder) - put in Profile Images
    if (parts.length <= 2) {
      return `${owner}/my-files/profile/Profile Images/${filename}`;
    }

    // Unknown subfolder - skip or put in generic location
    console.log(`  Unknown folder structure: ${oldPath}`);
    return null;
  }

  return null;
}

async function copyFile(sourceBucket, sourcePath, destBucket, destPath) {
  try {
    // Download the file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(sourceBucket)
      .download(sourcePath);

    if (downloadError) {
      console.error(`  Error downloading ${sourceBucket}/${sourcePath}:`, downloadError.message);
      return false;
    }

    // Upload to new location
    const { error: uploadError } = await supabase.storage
      .from(destBucket)
      .upload(destPath, fileData, {
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error(`  Error uploading to ${destBucket}/${destPath}:`, uploadError.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`  Exception copying file:`, err.message);
    return false;
  }
}

async function main() {
  console.log('Storage Migration Script');
  console.log('========================\n');

  // Get all files from old buckets
  const { data: files, error } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT bucket_id, name, owner
        FROM storage.objects
        WHERE bucket_id IN ('profile-images', 'comedian-media', 'organization-media')
        ORDER BY bucket_id, name
      `
    });

  // Fallback: direct query
  let filesToMigrate = [];

  const { data: comedianFiles } = await supabase.storage.from('comedian-media').list('', { limit: 1000 });
  const { data: profileFiles } = await supabase.storage.from('profile-images').list('', { limit: 1000 });
  const { data: orgFiles } = await supabase.storage.from('organization-media').list('', { limit: 1000 });

  // We need to query the database directly for full paths and owners
  // Using the service role key to access storage.objects

  console.log('Fetching files from database...\n');

  // Migration plan based on the SQL query results we saw earlier
  const migrationPlan = [
    // User 2fc4f578-7216-447a-876c-7bf9f4c9b096 (chillz-skinner)
    { source: 'comedian-media', path: '2fc4f578-7216-447a-876c-7bf9f4c9b096/Banner/2fc4f578-7216-447a-876c-7bf9f4c9b096/1764176714855-gyf1vx.jpg', owner: '2fc4f578-7216-447a-876c-7bf9f4c9b096' },
    { source: 'comedian-media', path: '2fc4f578-7216-447a-876c-7bf9f4c9b096/Banner/2fc4f578-7216-447a-876c-7bf9f4c9b096/1764178108203-gperr6.jpg', owner: '2fc4f578-7216-447a-876c-7bf9f4c9b096' },
    { source: 'comedian-media', path: '2fc4f578-7216-447a-876c-7bf9f4c9b096/Banner/2fc4f578-7216-447a-876c-7bf9f4c9b096/1764178153745-cg2pr1.jpg', owner: '2fc4f578-7216-447a-876c-7bf9f4c9b096' },
    { source: 'comedian-media', path: '2fc4f578-7216-447a-876c-7bf9f4c9b096/Banner/2fc4f578-7216-447a-876c-7bf9f4c9b096/1764178248184-hh32tp.jpg', owner: '2fc4f578-7216-447a-876c-7bf9f4c9b096' },
    { source: 'comedian-media', path: '2fc4f578-7216-447a-876c-7bf9f4c9b096/Banner/2fc4f578-7216-447a-876c-7bf9f4c9b096/1764179871862-6hpkoo.jpg', owner: '2fc4f578-7216-447a-876c-7bf9f4c9b096' },
    { source: 'profile-images', path: '2fc4f578-7216-447a-876c-7bf9f4c9b096/2fc4f578-7216-447a-876c-7bf9f4c9b096-1764176560906.png', owner: '2fc4f578-7216-447a-876c-7bf9f4c9b096' },
    { source: 'profile-images', path: 'chillz-skinner/2fc4f578-7216-447a-876c-7bf9f4c9b096-1752069011231.png', owner: '2fc4f578-7216-447a-876c-7bf9f4c9b096' },
    { source: 'profile-images', path: 'chillz-skinner/2fc4f578-7216-447a-876c-7bf9f4c9b096-1762716443126.png', owner: '2fc4f578-7216-447a-876c-7bf9f4c9b096' },

    // User c0d3b50f-ecfc-4292-a775-0d4c963ac49d (anthony-skinner)
    { source: 'comedian-media', path: 'anthony-skinner/Banner/c0d3b50f-ecfc-4292-a775-0d4c963ac49d/1763062334836-qnlw9s.png', owner: 'c0d3b50f-ecfc-4292-a775-0d4c963ac49d' },
    { source: 'comedian-media', path: 'anthony-skinner/Banner/c0d3b50f-ecfc-4292-a775-0d4c963ac49d/1763463880302-udnhkd.jpg', owner: 'c0d3b50f-ecfc-4292-a775-0d4c963ac49d' },
    { source: 'comedian-media', path: 'anthony-skinner/Headshots/c0d3b50f-ecfc-4292-a775-0d4c963ac49d/1762720206865-p2b1dw.jpeg', owner: 'c0d3b50f-ecfc-4292-a775-0d4c963ac49d' },
    { source: 'comedian-media', path: 'anthony-skinner/Headshots/c0d3b50f-ecfc-4292-a775-0d4c963ac49d/1763617928440-ded2fl.png', owner: 'c0d3b50f-ecfc-4292-a775-0d4c963ac49d' },
    { source: 'comedian-media', path: 'c0d3b50f-ecfc-4292-a775-0d4c963ac49d/Banner/c0d3b50f-ecfc-4292-a775-0d4c963ac49d/1764177679919-jx84yo.jpg', owner: 'c0d3b50f-ecfc-4292-a775-0d4c963ac49d' },
    { source: 'comedian-media', path: 'c0d3b50f-ecfc-4292-a775-0d4c963ac49d/Headshots/c0d3b50f-ecfc-4292-a775-0d4c963ac49d/1764187417366-0diihy.jpg', owner: 'c0d3b50f-ecfc-4292-a775-0d4c963ac49d' },
    { source: 'profile-images', path: 'anthony-skinner/c0d3b50f-ecfc-4292-a775-0d4c963ac49d-1762712349610.png', owner: 'c0d3b50f-ecfc-4292-a775-0d4c963ac49d' },
    { source: 'profile-images', path: 'c0d3b50f-ecfc-4292-a775-0d4c963ac49d/c0d3b50f-ecfc-4292-a775-0d4c963ac49d-1764132852563.png', owner: 'c0d3b50f-ecfc-4292-a775-0d4c963ac49d' },

    // Organization media
    { source: 'organization-media', path: 'organization-logos/91d76aad-b45d-4387-912c-bb43a05c3576/2fc4f578-7216-447a-876c-7bf9f4c9b096/1764176880557-od1xtp.png', owner: '91d76aad-b45d-4387-912c-bb43a05c3576', isOrg: true },
  ];

  console.log(`Found ${migrationPlan.length} files to migrate (sample)\n`);

  let successCount = 0;
  let failCount = 0;

  for (const file of migrationPlan) {
    const newPath = determineNewPath(file.source, file.path, file.owner);

    if (!newPath) {
      console.log(`SKIP: ${file.source}/${file.path} (no mapping)`);
      continue;
    }

    console.log(`Migrating: ${file.source}/${file.path}`);
    console.log(`       To: media-library/${newPath}`);

    const success = await copyFile(file.source, file.path, 'media-library', newPath);

    if (success) {
      console.log('   SUCCESS\n');
      successCount++;
    } else {
      console.log('   FAILED\n');
      failCount++;
    }
  }

  console.log('\n========================');
  console.log(`Migration complete: ${successCount} succeeded, ${failCount} failed`);
}

main().catch(console.error);
