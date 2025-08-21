
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;

-- Create new comprehensive policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);



-- Ensure proper foreign key relationships
ALTER TABLE applications 
  DROP CONSTRAINT IF EXISTS applications_comedian_id_fkey,
  ADD CONSTRAINT applications_comedian_id_fkey 
    FOREIGN KEY (comedian_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;

ALTER TABLE applications 
  DROP CONSTRAINT IF EXISTS applications_event_id_fkey,
  ADD CONSTRAINT applications_event_id_fkey 
    FOREIGN KEY (event_id) 
    REFERENCES events(id) 
    ON DELETE CASCADE;

-- Add RLS policies for applications
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Promoters can view applications to their events" ON applications;

CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  USING (auth.uid() = comedian_id);

CREATE POLICY "Promoters can view applications to their events"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = applications.event_id 
      AND events.promoter_id = auth.uid()
    )
  );

CREATE POLICY "Users can create applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = comedian_id);

CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = comedian_id);



-- Ensure proper foreign keys
ALTER TABLE vouches 
  DROP CONSTRAINT IF EXISTS vouches_voucher_id_fkey,
  ADD CONSTRAINT vouches_voucher_id_fkey 
    FOREIGN KEY (voucher_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;

ALTER TABLE vouches 
  DROP CONSTRAINT IF EXISTS vouches_vouchee_id_fkey,
  ADD CONSTRAINT vouches_vouchee_id_fkey 
    FOREIGN KEY (vouchee_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;

-- RLS policies for vouches
DROP POLICY IF EXISTS "Users can view all vouches" ON vouches;
DROP POLICY IF EXISTS "Users can create vouches" ON vouches;
DROP POLICY IF EXISTS "Users can update own vouches" ON vouches;
DROP POLICY IF EXISTS "Users can delete own vouches" ON vouches;

CREATE POLICY "Anyone can view vouches"
  ON vouches FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create vouches"
  ON vouches FOR INSERT
  WITH CHECK (auth.uid() = voucher_id);

CREATE POLICY "Users can update own vouches"
  ON vouches FOR UPDATE
  USING (auth.uid() = voucher_id);

CREATE POLICY "Users can delete own vouches"
  ON vouches FOR DELETE
  USING (auth.uid() = voucher_id);



-- Ensure proper structure
ALTER TABLE comedian_media 
  DROP CONSTRAINT IF EXISTS comedian_media_user_id_fkey,
  ADD CONSTRAINT comedian_media_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;

-- RLS policies
DROP POLICY IF EXISTS "Users can view all media" ON comedian_media;
DROP POLICY IF EXISTS "Users can upload own media" ON comedian_media;
DROP POLICY IF EXISTS "Users can update own media" ON comedian_media;
DROP POLICY IF EXISTS "Users can delete own media" ON comedian_media;

CREATE POLICY "Anyone can view media"
  ON comedian_media FOR SELECT
  USING (true);

CREATE POLICY "Users can upload own media"
  ON comedian_media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media"
  ON comedian_media FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own media"
  ON comedian_media FOR DELETE
  USING (auth.uid() = user_id);
