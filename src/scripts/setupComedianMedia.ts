import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupComedianMedia() {
  console.log('Setting up comedian_media table...');

  // SQL to create the table
  const createTableSQL = `
    -- Create comedian_media table
    CREATE TABLE IF NOT EXISTS public.comedian_media (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
      title TEXT,
      description TEXT,
      file_url TEXT,
      file_size BIGINT,
      file_type TEXT,
      external_url TEXT,
      external_type TEXT CHECK (external_type IN ('youtube', 'google_drive', 'vimeo') OR external_type IS NULL),
      external_id TEXT,
      thumbnail_url TEXT,
      duration INTEGER,
      width INTEGER,
      height INTEGER,
      is_featured BOOLEAN DEFAULT false,
      display_order INTEGER DEFAULT 0,
      tags TEXT[],
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      
      -- Ensure either file_url or external_url is present, but not both
      CONSTRAINT valid_media_source CHECK (
        (file_url IS NOT NULL AND external_url IS NULL) OR 
        (file_url IS NULL AND external_url IS NOT NULL)
      ),
      
      -- If external_url is present, external_type must also be present
      CONSTRAINT valid_external_media CHECK (
        (external_url IS NULL) OR 
        (external_url IS NOT NULL AND external_type IS NOT NULL)
      )
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_comedian_media_user_id ON public.comedian_media(user_id);
    CREATE INDEX IF NOT EXISTS idx_comedian_media_media_type ON public.comedian_media(media_type);
    CREATE INDEX IF NOT EXISTS idx_comedian_media_featured ON public.comedian_media(is_featured);
    CREATE INDEX IF NOT EXISTS idx_comedian_media_display_order ON public.comedian_media(display_order);
    CREATE INDEX IF NOT EXISTS idx_comedian_media_created_at ON public.comedian_media(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comedian_media_tags ON public.comedian_media USING GIN(tags);

    -- Create updated_at trigger
    CREATE OR REPLACE FUNCTION update_comedian_media_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS tr_comedian_media_updated_at ON public.comedian_media;
    CREATE TRIGGER tr_comedian_media_updated_at
      BEFORE UPDATE ON public.comedian_media
      FOR EACH ROW
      EXECUTE FUNCTION update_comedian_media_updated_at();

    -- Enable RLS
    ALTER TABLE public.comedian_media ENABLE ROW LEVEL SECURITY;

    -- RLS Policies
    -- Anyone can view media
    CREATE POLICY "Anyone can view comedian media"
      ON public.comedian_media FOR SELECT
      USING (true);

    -- Users can insert their own media
    CREATE POLICY "Users can insert own media"
      ON public.comedian_media FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    -- Users can update their own media
    CREATE POLICY "Users can update own media"
      ON public.comedian_media FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    -- Users can delete their own media
    CREATE POLICY "Users can delete own media"
      ON public.comedian_media FOR DELETE
      USING (auth.uid() = user_id);

    -- Add table comments
    COMMENT ON TABLE public.comedian_media IS 'Stores media (photos and videos) for comedian profiles';
    COMMENT ON COLUMN public.comedian_media.media_type IS 'Type of media: photo or video';
    COMMENT ON COLUMN public.comedian_media.file_url IS 'URL for uploaded files in Supabase storage';
    COMMENT ON COLUMN public.comedian_media.external_url IS 'URL for external media (YouTube, Google Drive, etc)';
    COMMENT ON COLUMN public.comedian_media.external_type IS 'Type of external media platform';
    COMMENT ON COLUMN public.comedian_media.external_id IS 'ID of the media on the external platform';
    COMMENT ON COLUMN public.comedian_media.is_featured IS 'Whether this media item should be prominently displayed';
    COMMENT ON COLUMN public.comedian_media.display_order IS 'Order in which media items should be displayed';
    COMMENT ON COLUMN public.comedian_media.tags IS 'Array of tags for categorizing media';
  `;

  try {
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      // Try direct execution if RPC doesn't exist
      const { error: directError } = await supabase.from('_sql').select().single();
      if (directError) {
        console.log('Note: Table might already exist or you may need to run this SQL directly in Supabase dashboard');
        console.log('\nSQL to run in Supabase SQL Editor:\n');
        console.log(createTableSQL);
      }
    } else {
      console.log('✅ comedian_media table created successfully!');
    }

    // Check if storage bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (!bucketError && buckets) {
      const comedianMediaBucket = buckets.find(b => b.name === 'comedian-media');
      
      if (!comedianMediaBucket) {
        // Create the bucket
        const { error: createBucketError } = await supabase.storage.createBucket('comedian-media', {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['image/*', 'video/*']
        });

        if (createBucketError) {
          console.log('Note: Could not create storage bucket. Please create it manually in Supabase dashboard.');
          console.log('Bucket name: comedian-media');
          console.log('Make it public with 50MB file size limit');
        } else {
          console.log('✅ Storage bucket "comedian-media" created successfully!');
        }
      } else {
        console.log('✅ Storage bucket "comedian-media" already exists');
      }
    }

  } catch (err) {
    console.error('Error setting up comedian media:', err);
    console.log('\nPlease run the following SQL in your Supabase SQL Editor:\n');
    console.log(createTableSQL);
  }
}

// Run the setup
setupComedianMedia().then(() => {
  console.log('\nSetup complete!');
  process.exit(0);
}).catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});