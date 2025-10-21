-- Migration: Add Manager and Organization Request System
-- Description: Creates tables for organization join requests, manager client requests,
--              manager profiles, and comedian-manager relationships
-- Date: 2025-10-22

-- ============================================================================
-- Table: organization_join_requests
-- Purpose: Track requests from users wanting to join organizations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.organization_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  message TEXT,
  requested_role TEXT DEFAULT 'member' CHECK (requested_role IN ('member', 'admin', 'manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  UNIQUE(organization_id, requester_id, status) -- Prevent duplicate pending requests
);

-- Index for faster lookups
CREATE INDEX idx_org_join_requests_organization ON public.organization_join_requests(organization_id);
CREATE INDEX idx_org_join_requests_requester ON public.organization_join_requests(requester_id);
CREATE INDEX idx_org_join_requests_status ON public.organization_join_requests(status);

-- ============================================================================
-- Table: comedy_manager_profiles
-- Purpose: Store comedy manager-specific data and specializations
-- Note: Renamed from manager_profiles to avoid conflict with existing CRM manager_profiles table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.comedy_manager_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  manager_types TEXT[] NOT NULL DEFAULT '{}', -- Array of: 'social_media', 'finance', 'tour', 'booking', 'content', 'general'
  bio TEXT,
  years_experience INTEGER,
  specializations TEXT[], -- Additional free-form specializations
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'limited', 'unavailable')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX idx_comedy_manager_profiles_user ON public.comedy_manager_profiles(user_id);

-- ============================================================================
-- Table: manager_client_requests
-- Purpose: Track requests from managers to manage comedians/organizations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.manager_client_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_type TEXT NOT NULL CHECK (client_type IN ('comedian', 'organization')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  manager_types TEXT[] NOT NULL DEFAULT '{}', -- What types of management are being requested
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(manager_id, client_id, status) -- Prevent duplicate pending requests
);

-- Indexes for faster lookups
CREATE INDEX idx_manager_client_requests_manager ON public.manager_client_requests(manager_id);
CREATE INDEX idx_manager_client_requests_client ON public.manager_client_requests(client_id);
CREATE INDEX idx_manager_client_requests_status ON public.manager_client_requests(status);

-- ============================================================================
-- Table: comedian_managers
-- Purpose: Link comedians to their managers with role specifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.comedian_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comedian_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_types TEXT[] NOT NULL DEFAULT '{}', -- Active management types
  is_primary BOOLEAN DEFAULT FALSE, -- Primary manager flag
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(comedian_id, manager_id) -- One relationship per comedian-manager pair
);

-- Indexes for faster lookups
CREATE INDEX idx_comedian_managers_comedian ON public.comedian_managers(comedian_id);
CREATE INDEX idx_comedian_managers_manager ON public.comedian_managers(manager_id);
CREATE INDEX idx_comedian_managers_status ON public.comedian_managers(status);

-- ============================================================================
-- Table: organization_managers
-- Purpose: Link organizations to their managers with role specifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.organization_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_types TEXT[] NOT NULL DEFAULT '{}', -- Active management types
  is_primary BOOLEAN DEFAULT FALSE, -- Primary manager flag
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, manager_id) -- One relationship per organization-manager pair
);

-- Indexes for faster lookups
CREATE INDEX idx_org_managers_organization ON public.organization_managers(organization_id);
CREATE INDEX idx_org_managers_manager ON public.organization_managers(manager_id);
CREATE INDEX idx_org_managers_status ON public.organization_managers(status);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.organization_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comedy_manager_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_client_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comedian_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_managers ENABLE ROW LEVEL SECURITY;

-- organization_join_requests policies
CREATE POLICY "Users can view their own org join requests"
  ON public.organization_join_requests FOR SELECT
  USING (auth.uid() = requester_id);

CREATE POLICY "Org admins can view requests to their org"
  ON public.organization_join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_team_members
      WHERE organization_id = organization_join_requests.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can create org join requests"
  ON public.organization_join_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Org admins can update requests to their org"
  ON public.organization_join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_team_members
      WHERE organization_id = organization_join_requests.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- comedy_manager_profiles policies
CREATE POLICY "Users can view all comedy manager profiles"
  ON public.comedy_manager_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own comedy manager profile"
  ON public.comedy_manager_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- manager_client_requests policies
CREATE POLICY "Managers can view their own requests"
  ON public.manager_client_requests FOR SELECT
  USING (auth.uid() = manager_id);

CREATE POLICY "Clients can view requests for them"
  ON public.manager_client_requests FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Managers can create client requests"
  ON public.manager_client_requests FOR INSERT
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Clients can update requests for them"
  ON public.manager_client_requests FOR UPDATE
  USING (auth.uid() = client_id);

-- comedian_managers policies
CREATE POLICY "Comedians can view their managers"
  ON public.comedian_managers FOR SELECT
  USING (auth.uid() = comedian_id);

CREATE POLICY "Managers can view their clients"
  ON public.comedian_managers FOR SELECT
  USING (auth.uid() = manager_id);

CREATE POLICY "System can create comedian-manager relationships"
  ON public.comedian_managers FOR INSERT
  WITH CHECK (true); -- Will be called by approved request handler

-- organization_managers policies
CREATE POLICY "Org members can view their org managers"
  ON public.organization_managers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_team_members
      WHERE organization_id = organization_managers.organization_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view orgs they manage"
  ON public.organization_managers FOR SELECT
  USING (auth.uid() = manager_id);

CREATE POLICY "System can create org-manager relationships"
  ON public.organization_managers FOR INSERT
  WITH CHECK (true); -- Will be called by approved request handler

-- ============================================================================
-- Update Triggers
-- ============================================================================

-- Auto-update updated_at timestamp for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_org_join_requests_updated_at
  BEFORE UPDATE ON public.organization_join_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comedy_manager_profiles_updated_at
  BEFORE UPDATE ON public.comedy_manager_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manager_client_requests_updated_at
  BEFORE UPDATE ON public.manager_client_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comedian_managers_updated_at
  BEFORE UPDATE ON public.comedian_managers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_managers_updated_at
  BEFORE UPDATE ON public.organization_managers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE public.organization_join_requests IS 'Tracks user requests to join organizations';
COMMENT ON TABLE public.comedy_manager_profiles IS 'Stores comedy manager-specific profile data and specializations';
COMMENT ON TABLE public.manager_client_requests IS 'Tracks manager requests to manage comedians/organizations';
COMMENT ON TABLE public.comedian_managers IS 'Links comedians to their managers';
COMMENT ON TABLE public.organization_managers IS 'Links organizations to their managers';

COMMENT ON COLUMN public.comedy_manager_profiles.manager_types IS 'Array of manager specializations: social_media, finance, tour, booking, content, general';
COMMENT ON COLUMN public.comedian_managers.is_primary IS 'Indicates if this is the comedian primary manager';
COMMENT ON COLUMN public.organization_managers.is_primary IS 'Indicates if this is the organization primary manager';
