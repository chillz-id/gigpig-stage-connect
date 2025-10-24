-- Migration: Add Organization Profile Type
-- Date: 2025-10-19
-- Description: Adds organization profile type allowing Promoters and Managers
--             to create and manage organization profiles for venues, production
--             companies, agencies, etc.
-- NOTE: Requires 20251019_01_add_manager_enum.sql to be applied first

-- Step 1: Create organization_profiles table
CREATE TABLE IF NOT EXISTS public.organization_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  organization_type TEXT CHECK (organization_type IN (
    'venue',
    'production_company',
    'comedy_agency',
    'event_management',
    'media_company',
    'entertainment_group',
    'other'
  )),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  abn TEXT, -- Australian Business Number
  logo_url TEXT,
  bio TEXT,
  website_url TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,

  -- Social media links
  instagram_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  linkedin_url TEXT,

  -- Bank details (will be encrypted at application level)
  bank_details JSONB DEFAULT '{}'::jsonb,

  -- Business information
  address TEXT,
  city TEXT,
  state TEXT,
  postcode TEXT,
  country TEXT DEFAULT 'Australia',

  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_email CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT valid_abn CHECK (abn IS NULL OR abn ~ '^\d{11}$')
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_profiles_owner
  ON organization_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_name
  ON organization_profiles(organization_name);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_type
  ON organization_profiles(organization_type);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_active
  ON organization_profiles(is_active);

-- Step 3: Enable RLS
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies

-- Public can view active organization profiles
CREATE POLICY "Public can view active organization profiles" ON organization_profiles
  FOR SELECT USING (is_active = true);

-- Owners can view their own organizations (even if inactive)
CREATE POLICY "Owners can view own organizations" ON organization_profiles
  FOR SELECT USING (auth.uid() = owner_id);

-- Promoters and Managers can create organizations
CREATE POLICY "Promoters and Managers can create organizations" ON organization_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('promoter', 'manager')
    )
  );

-- Owners can update their organizations
CREATE POLICY "Owners can update own organizations" ON organization_profiles
  FOR UPDATE USING (auth.uid() = owner_id);

-- Owners can delete their organizations
CREATE POLICY "Owners can delete own organizations" ON organization_profiles
  FOR DELETE USING (auth.uid() = owner_id);

-- Step 5: Create organization_team_members table (future feature)
-- This allows organizations to have multiple team members
CREATE TABLE IF NOT EXISTS public.organization_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'manager', 'member')) DEFAULT 'member',
  permissions JSONB DEFAULT '{}'::jsonb,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Step 6: RLS for team members
ALTER TABLE organization_team_members ENABLE ROW LEVEL SECURITY;

-- Organization owners and team members can view team
CREATE POLICY "View organization team" ON organization_team_members
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT owner_id FROM organization_profiles WHERE id = organization_id
    )
  );

-- Organization owners can add team members
CREATE POLICY "Owners can add team members" ON organization_team_members
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM organization_profiles WHERE id = organization_id
    )
  );

-- Organization owners can update team members
CREATE POLICY "Owners can update team members" ON organization_team_members
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT owner_id FROM organization_profiles WHERE id = organization_id
    )
  );

-- Organization owners can remove team members
CREATE POLICY "Owners can remove team members" ON organization_team_members
  FOR DELETE USING (
    auth.uid() IN (
      SELECT owner_id FROM organization_profiles WHERE id = organization_id
    )
  );

-- Step 7: Create indexes for team members
CREATE INDEX IF NOT EXISTS idx_organization_team_members_org
  ON organization_team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_team_members_user
  ON organization_team_members(user_id);

-- Step 8: Create helper functions
CREATE OR REPLACE FUNCTION has_organization_profile(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM organization_profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_organization_owner(user_id UUID, org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_profiles
    WHERE id = org_id AND owner_id = user_id
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION can_create_organization(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = can_create_organization.user_id
    AND role IN ('promoter', 'manager')
  );
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create triggers for updated_at
CREATE TRIGGER update_organization_profiles_updated_at
  BEFORE UPDATE ON organization_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Add comments for documentation
COMMENT ON TABLE organization_profiles IS 'Organization profiles for venues, production companies, agencies, etc. Can be created by Promoters and Managers.';
COMMENT ON COLUMN organization_profiles.owner_id IS 'The user (Promoter or Manager) who created and owns this organization';
COMMENT ON COLUMN organization_profiles.organization_type IS 'Type of organization: venue, production_company, comedy_agency, event_management, etc.';
COMMENT ON COLUMN organization_profiles.bank_details IS 'Bank account details for payments (encrypted at application level)';
COMMENT ON COLUMN organization_profiles.is_verified IS 'Indicates if the organization has been verified by platform admins';
COMMENT ON TABLE organization_team_members IS 'Team members who can access and manage the organization (future feature)';
