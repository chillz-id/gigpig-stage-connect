-- ============================================================================
-- COMEDIAN DIRECTORY SYSTEM
-- ============================================================================
-- Creates tables and storage for managing comedian profiles that exist
-- independently of authenticated users. Supports bulk import of photos and
-- contact info, with claim flow when comedians sign up.
-- ============================================================================

-- ============================================================================
-- TABLE: directory_import_batches
-- Tracks bulk imports for auditing and error reporting
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.directory_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Import metadata
  name TEXT,
  source_file TEXT,
  imported_by UUID REFERENCES auth.users(id),
  
  -- Stats
  total_profiles INT DEFAULT 0,
  total_photos INT DEFAULT 0,
  profiles_created INT DEFAULT 0,
  profiles_updated INT DEFAULT 0,
  photos_uploaded INT DEFAULT 0,
  errors_count INT DEFAULT 0,
  
  -- Error log
  error_log JSONB DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: directory_profiles
-- Comedian identities independent of auth.users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.directory_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  stage_name TEXT NOT NULL,
  slug TEXT UNIQUE,
  email TEXT,
  
  -- Profile data
  legal_name TEXT,
  short_bio TEXT,
  long_bio TEXT,
  pronouns TEXT,
  origin_city TEXT,
  origin_country TEXT DEFAULT 'Australia',
  website TEXT,
  booking_email TEXT,
  
  -- Media references (cached URLs for quick access)
  primary_headshot_url TEXT,
  hero_image_url TEXT,
  
  -- Social links
  instagram_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  
  -- Metadata and tags
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Claim status (links to authenticated comedian when claimed)
  claimed_at TIMESTAMPTZ,
  claimed_by UUID REFERENCES auth.users(id),
  comedians_id UUID, -- Will reference comedians table if/when claimed
  
  -- CRM link
  customer_profile_id UUID, -- References customer_profiles for marketing
  
  -- Source tracking
  source TEXT DEFAULT 'bulk_import' CHECK (source IN ('bulk_import', 'manual', 'scraped', 'migration')),
  import_batch_id UUID REFERENCES public.directory_import_batches(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Email uniqueness only when not null
  CONSTRAINT unique_directory_email UNIQUE (email)
);

-- ============================================================================
-- TABLE: directory_media
-- Photos and videos associated with directory profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.directory_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  directory_profile_id UUID NOT NULL REFERENCES public.directory_profiles(id) ON DELETE CASCADE,
  
  -- File info
  storage_path TEXT NOT NULL,
  public_url TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  
  -- Image dimensions
  image_width INT,
  image_height INT,
  aspect_ratio DECIMAL GENERATED ALWAYS AS (
    CASE WHEN image_height > 0 THEN image_width::DECIMAL / image_height ELSE NULL END
  ) STORED,
  
  -- Media metadata
  media_type TEXT NOT NULL DEFAULT 'photo' CHECK (media_type IN ('photo', 'video')),
  is_headshot BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  
  -- For automation
  tags TEXT[] DEFAULT '{}',
  alt_text TEXT,
  
  -- External video support
  external_url TEXT,
  external_type TEXT CHECK (external_type IN ('youtube', 'vimeo', 'google_drive')),
  external_id TEXT,
  
  -- Import tracking
  import_batch_id UUID REFERENCES public.directory_import_batches(id),
  source_filename TEXT, -- Original filename before upload
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- directory_profiles indexes
CREATE INDEX IF NOT EXISTS idx_directory_profiles_slug ON directory_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_directory_profiles_email ON directory_profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_directory_profiles_unclaimed ON directory_profiles(claimed_at) WHERE claimed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_directory_profiles_tags ON directory_profiles USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_directory_profiles_stage_name ON directory_profiles(stage_name);
CREATE INDEX IF NOT EXISTS idx_directory_profiles_import_batch ON directory_profiles(import_batch_id);

-- directory_media indexes
CREATE INDEX IF NOT EXISTS idx_directory_media_profile ON directory_media(directory_profile_id);
CREATE INDEX IF NOT EXISTS idx_directory_media_headshots ON directory_media(directory_profile_id) WHERE is_headshot = true;
CREATE INDEX IF NOT EXISTS idx_directory_media_primary ON directory_media(directory_profile_id) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_directory_media_tags ON directory_media USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_directory_media_import_batch ON directory_media(import_batch_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE directory_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_import_batches ENABLE ROW LEVEL SECURITY;

-- Public read for directory_profiles (limited visibility - used in event lineups)
CREATE POLICY "Public read directory profiles"
  ON directory_profiles FOR SELECT
  USING (true);

-- Admin full access to directory_profiles
CREATE POLICY "Admin manage directory profiles"
  ON directory_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND 'admin' = ANY(
        SELECT r.role FROM user_roles r WHERE r.user_id = p.id
      )
    )
  );

-- Public read for directory_media (photos used in promos)
CREATE POLICY "Public read directory media"
  ON directory_media FOR SELECT
  USING (true);

-- Admin full access to directory_media
CREATE POLICY "Admin manage directory media"
  ON directory_media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND 'admin' = ANY(
        SELECT r.role FROM user_roles r WHERE r.user_id = p.id
      )
    )
  );

-- Only admins can view import batches
CREATE POLICY "Admin manage import batches"
  ON directory_import_batches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND 'admin' = ANY(
        SELECT r.role FROM user_roles r WHERE r.user_id = p.id
      )
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-generate slug from stage_name
CREATE OR REPLACE FUNCTION generate_directory_profile_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.stage_name, '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := trim(both '-' from NEW.slug);
    
    -- Handle duplicates by appending a number
    DECLARE
      base_slug TEXT := NEW.slug;
      counter INT := 1;
    BEGIN
      WHILE EXISTS (SELECT 1 FROM directory_profiles WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
        NEW.slug := base_slug || '-' || counter;
        counter := counter + 1;
      END LOOP;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER directory_profile_slug_trigger
  BEFORE INSERT OR UPDATE ON directory_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_directory_profile_slug();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_directory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER directory_profiles_updated_at
  BEFORE UPDATE ON directory_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_directory_updated_at();

CREATE TRIGGER directory_media_updated_at
  BEFORE UPDATE ON directory_media
  FOR EACH ROW
  EXECUTE FUNCTION update_directory_updated_at();

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'directory-media',
  'directory-media',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read directory media storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'directory-media');

CREATE POLICY "Admin insert directory media storage"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'directory-media'
    AND (
      auth.jwt() ->> 'role' = 'service_role'
      OR EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND 'admin' = ANY(
          SELECT r.role FROM user_roles r WHERE r.user_id = p.id
        )
      )
    )
  );

CREATE POLICY "Admin update directory media storage"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'directory-media'
    AND (
      auth.jwt() ->> 'role' = 'service_role'
      OR EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND 'admin' = ANY(
          SELECT r.role FROM user_roles r WHERE r.user_id = p.id
        )
      )
    )
  );

CREATE POLICY "Admin delete directory media storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'directory-media'
    AND (
      auth.jwt() ->> 'role' = 'service_role'
      OR EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND 'admin' = ANY(
          SELECT r.role FROM user_roles r WHERE r.user_id = p.id
        )
      )
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get directory profile by email (for claim flow)
CREATE OR REPLACE FUNCTION get_unclaimed_directory_profile(p_email TEXT)
RETURNS SETOF directory_profiles AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM directory_profiles
  WHERE email = lower(trim(p_email))
    AND claimed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get directory profile with photos
CREATE OR REPLACE FUNCTION get_directory_profile_with_media(p_profile_id UUID)
RETURNS TABLE (
  profile JSONB,
  media JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(dp.*) as profile,
    COALESCE(
      jsonb_agg(
        to_jsonb(dm.*) ORDER BY dm.is_primary DESC, dm.display_order ASC
      ) FILTER (WHERE dm.id IS NOT NULL),
      '[]'::jsonb
    ) as media
  FROM directory_profiles dp
  LEFT JOIN directory_media dm ON dm.directory_profile_id = dp.id
  WHERE dp.id = p_profile_id
  GROUP BY dp.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get random headshots for automation (event lineups, etc.)
CREATE OR REPLACE FUNCTION get_random_directory_headshots(
  p_count INT DEFAULT 5,
  p_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  profile_id UUID,
  stage_name TEXT,
  slug TEXT,
  headshot_url TEXT,
  file_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.id as profile_id,
    dp.stage_name,
    dp.slug,
    dm.public_url as headshot_url,
    dm.id as file_id
  FROM directory_profiles dp
  JOIN directory_media dm ON dm.directory_profile_id = dp.id
  WHERE dm.is_headshot = true
    AND dm.is_primary = true
    AND (p_tags IS NULL OR dp.tags && p_tags)
  ORDER BY random()
  LIMIT p_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search directory profiles
CREATE OR REPLACE FUNCTION search_directory_profiles(
  p_query TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_unclaimed_only BOOLEAN DEFAULT false,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  stage_name TEXT,
  slug TEXT,
  email TEXT,
  short_bio TEXT,
  origin_city TEXT,
  primary_headshot_url TEXT,
  tags TEXT[],
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  photo_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.id,
    dp.stage_name,
    dp.slug,
    dp.email,
    dp.short_bio,
    dp.origin_city,
    dp.primary_headshot_url,
    dp.tags,
    dp.claimed_at,
    dp.created_at,
    COUNT(dm.id) as photo_count
  FROM directory_profiles dp
  LEFT JOIN directory_media dm ON dm.directory_profile_id = dp.id
  WHERE 
    (p_query IS NULL OR dp.stage_name ILIKE '%' || p_query || '%' OR dp.email ILIKE '%' || p_query || '%')
    AND (p_tags IS NULL OR dp.tags && p_tags)
    AND (NOT p_unclaimed_only OR dp.claimed_at IS NULL)
  GROUP BY dp.id
  ORDER BY dp.stage_name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default segment for directory comedians
DO $$
BEGIN
  INSERT INTO segments (slug, name, description, color)
  VALUES ('directory-comedians', 'Directory Comedians', 'Comedians imported from directory (unclaimed profiles)', '#9333EA')
  ON CONFLICT (slug) DO NOTHING;
END $$;
