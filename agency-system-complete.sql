-- Create Agency Management System database schema
-- This migration creates the core tables for the agency management system

-- Create custom types for agency system
CREATE TYPE agency_type AS ENUM ('talent_agency', 'booking_agency', 'management_company', 'hybrid');
CREATE TYPE agency_status AS ENUM ('active', 'suspended', 'pending_verification', 'inactive');
CREATE TYPE manager_role AS ENUM ('primary_manager', 'co_manager', 'assistant_manager', 'agency_owner');
CREATE TYPE artist_relationship_status AS ENUM ('active', 'inactive', 'pending', 'terminated');
CREATE TYPE deal_status AS ENUM ('draft', 'proposed', 'negotiating', 'counter_offered', 'accepted', 'declined', 'expired');
CREATE TYPE deal_type AS ENUM ('booking', 'management', 'representation', 'endorsement', 'collaboration');
CREATE TYPE negotiation_stage AS ENUM ('initial', 'terms_discussion', 'financial_negotiation', 'final_review', 'contract_preparation');

-- Create agencies table
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  agency_type agency_type NOT NULL DEFAULT 'talent_agency',
  status agency_status NOT NULL DEFAULT 'pending_verification',
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contact Information
  email TEXT,
  phone TEXT,
  website_url TEXT,
  
  -- Address Information
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Australia',
  postal_code TEXT,
  
  -- Business Information
  abn TEXT,
  business_license TEXT,
  insurance_details JSONB DEFAULT '{}',
  
  -- Agency Profile
  description TEXT,
  specialties TEXT[] DEFAULT '{}', -- e.g., ['comedy', 'music', 'corporate_events']
  logo_url TEXT,
  banner_url TEXT,
  
  -- Financial Information
  commission_rate DECIMAL(5,2) DEFAULT 15.00, -- Default 15% commission
  payment_terms TEXT DEFAULT 'Net 30',
  billing_address TEXT,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_commission_rate CHECK (commission_rate >= 0 AND commission_rate <= 50),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create manager_profiles table
CREATE TABLE public.manager_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  -- Profile Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Role & Permissions
  role manager_role NOT NULL DEFAULT 'primary_manager',
  permissions JSONB DEFAULT '{}', -- Granular permissions
  
  -- Professional Information
  title TEXT,
  bio TEXT,
  experience_years INTEGER,
  specializations TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  
  -- Contact Preferences
  preferred_contact_method TEXT DEFAULT 'email',
  availability_hours JSONB DEFAULT '{}', -- Working hours by day
  timezone TEXT DEFAULT 'Australia/Sydney',
  
  -- Performance Metrics
  total_artists INTEGER DEFAULT 0,
  active_deals INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  
  -- Social Links
  linkedin_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  
  -- Settings
  notification_preferences JSONB DEFAULT '{}',
  dashboard_settings JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(user_id, agency_id),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create artist_management table (relationship between comedians and agencies)
CREATE TABLE public.artist_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.manager_profiles(id) ON DELETE SET NULL,
  
  -- Relationship Details
  relationship_status artist_relationship_status NOT NULL DEFAULT 'pending',
  relationship_type TEXT NOT NULL, -- 'exclusive', 'non_exclusive', 'project_based'
  
  -- Contract Information
  contract_start_date DATE,
  contract_end_date DATE,
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  minimum_booking_fee DECIMAL(10,2),
  
  -- Terms & Conditions
  exclusive_territories TEXT[] DEFAULT '{}',
  excluded_venues TEXT[] DEFAULT '{}',
  special_terms TEXT,
  
  -- Performance Tracking
  bookings_count INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  commission_earned DECIMAL(12,2) DEFAULT 0,
  
  -- Artist Preferences
  preferred_venues TEXT[] DEFAULT '{}',
  preferred_event_types TEXT[] DEFAULT '{}',
  availability_notes TEXT,
  
  -- Notes & Communication
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Status Tracking
  is_active BOOLEAN DEFAULT true,
  priority_level INTEGER DEFAULT 1, -- 1-5 scale
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_contact_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(artist_id, agency_id),
  CONSTRAINT valid_commission_rate CHECK (commission_rate >= 0 AND commission_rate <= 50),
  CONSTRAINT valid_priority_level CHECK (priority_level >= 1 AND priority_level <= 5)
);

-- Create deal_negotiations table
CREATE TABLE public.deal_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core Deal Information
  deal_type deal_type NOT NULL,
  status deal_status NOT NULL DEFAULT 'draft',
  negotiation_stage negotiation_stage NOT NULL DEFAULT 'initial',
  
  -- Parties Involved
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  promoter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.manager_profiles(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Deal Details
  title TEXT NOT NULL,
  description TEXT,
  
  -- Financial Terms
  proposed_fee DECIMAL(10,2),
  minimum_fee DECIMAL(10,2),
  maximum_fee DECIMAL(10,2),
  currency TEXT DEFAULT 'AUD',
  commission_rate DECIMAL(5,2),
  
  -- Performance Details
  performance_date TIMESTAMPTZ,
  performance_duration INTEGER, -- minutes
  technical_requirements TEXT,
  
  -- Negotiation History
  offers JSONB DEFAULT '[]', -- Array of offer objects
  counter_offers JSONB DEFAULT '[]', -- Array of counter-offer objects
  negotiation_notes TEXT,
  
  -- Terms & Conditions
  terms_and_conditions TEXT,
  special_requirements TEXT,
  cancellation_policy TEXT,
  
  -- Strategy & Automation
  negotiation_strategy JSONB DEFAULT '{}', -- AI-driven negotiation strategy
  automated_responses BOOLEAN DEFAULT false,
  auto_accept_threshold DECIMAL(10,2),
  auto_decline_threshold DECIMAL(10,2),
  
  -- Timeline
  deadline TIMESTAMPTZ,
  response_time_hours INTEGER DEFAULT 48,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  revision_count INTEGER DEFAULT 0,
  
  -- Priority & Classification
  priority_level INTEGER DEFAULT 1, -- 1-5 scale
  tags TEXT[] DEFAULT '{}',
  
  -- External References
  external_deal_id TEXT,
  contract_url TEXT,
  
  -- Status Tracking
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_commission_rate CHECK (commission_rate >= 0 AND commission_rate <= 50),
  CONSTRAINT valid_priority_level CHECK (priority_level >= 1 AND priority_level <= 5),
  CONSTRAINT valid_fees CHECK (
    (proposed_fee IS NULL OR proposed_fee >= 0) AND
    (minimum_fee IS NULL OR minimum_fee >= 0) AND
    (maximum_fee IS NULL OR maximum_fee >= 0) AND
    (minimum_fee IS NULL OR maximum_fee IS NULL OR minimum_fee <= maximum_fee)
  )
);

-- Create deal_messages table for negotiation communication
CREATE TABLE public.deal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deal_negotiations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message Content
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'offer', 'counter_offer', 'acceptance', 'rejection'
  subject TEXT,
  content TEXT NOT NULL,
  
  -- Offer Details (if applicable)
  offer_amount DECIMAL(10,2),
  offer_terms JSONB DEFAULT '{}',
  
  -- Message Properties
  is_automated BOOLEAN DEFAULT false,
  is_internal BOOLEAN DEFAULT false, -- Internal agency notes
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create agency_analytics table for performance tracking
CREATE TABLE public.agency_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  -- Date Range
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Key Metrics
  total_artists INTEGER DEFAULT 0,
  active_artists INTEGER DEFAULT 0,
  new_artists INTEGER DEFAULT 0,
  
  -- Deal Metrics
  deals_initiated INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  deals_declined INTEGER DEFAULT 0,
  average_deal_value DECIMAL(12,2) DEFAULT 0,
  
  -- Financial Metrics
  total_revenue DECIMAL(12,2) DEFAULT 0,
  commission_earned DECIMAL(12,2) DEFAULT 0,
  average_commission_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Performance Metrics
  average_response_time_hours DECIMAL(10,2) DEFAULT 0,
  client_satisfaction_score DECIMAL(3,2) DEFAULT 0,
  
  -- Detailed Data
  metrics_data JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(agency_id, period_start, period_end)
);

-- Enable RLS on all tables
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_analytics ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_agencies_owner_id ON public.agencies(owner_id);
CREATE INDEX idx_agencies_status ON public.agencies(status);
CREATE INDEX idx_agencies_type ON public.agencies(agency_type);
CREATE INDEX idx_agencies_created_at ON public.agencies(created_at);

CREATE INDEX idx_manager_profiles_user_id ON public.manager_profiles(user_id);
CREATE INDEX idx_manager_profiles_agency_id ON public.manager_profiles(agency_id);
CREATE INDEX idx_manager_profiles_role ON public.manager_profiles(role);
CREATE INDEX idx_manager_profiles_active ON public.manager_profiles(is_active);

CREATE INDEX idx_artist_management_artist_id ON public.artist_management(artist_id);
CREATE INDEX idx_artist_management_agency_id ON public.artist_management(agency_id);
CREATE INDEX idx_artist_management_manager_id ON public.artist_management(manager_id);
CREATE INDEX idx_artist_management_status ON public.artist_management(relationship_status);
CREATE INDEX idx_artist_management_active ON public.artist_management(is_active);

CREATE INDEX idx_deal_negotiations_agency_id ON public.deal_negotiations(agency_id);
CREATE INDEX idx_deal_negotiations_artist_id ON public.deal_negotiations(artist_id);
CREATE INDEX idx_deal_negotiations_promoter_id ON public.deal_negotiations(promoter_id);
CREATE INDEX idx_deal_negotiations_event_id ON public.deal_negotiations(event_id);
CREATE INDEX idx_deal_negotiations_status ON public.deal_negotiations(status);
CREATE INDEX idx_deal_negotiations_type ON public.deal_negotiations(deal_type);
CREATE INDEX idx_deal_negotiations_deadline ON public.deal_negotiations(deadline);
CREATE INDEX idx_deal_negotiations_created_at ON public.deal_negotiations(created_at);

CREATE INDEX idx_deal_messages_deal_id ON public.deal_messages(deal_id);
CREATE INDEX idx_deal_messages_sender_id ON public.deal_messages(sender_id);
CREATE INDEX idx_deal_messages_created_at ON public.deal_messages(created_at);

CREATE INDEX idx_agency_analytics_agency_id ON public.agency_analytics(agency_id);
CREATE INDEX idx_agency_analytics_period ON public.agency_analytics(period_start, period_end);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_manager_profiles_updated_at
  BEFORE UPDATE ON public.manager_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artist_management_updated_at
  BEFORE UPDATE ON public.artist_management
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deal_negotiations_updated_at
  BEFORE UPDATE ON public.deal_negotiations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deal_messages_updated_at
  BEFORE UPDATE ON public.deal_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agency_analytics_updated_at
  BEFORE UPDATE ON public.agency_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.agencies IS 'Core agencies table storing agency information and settings';
COMMENT ON TABLE public.manager_profiles IS 'Manager profiles linked to agencies with roles and permissions';
COMMENT ON TABLE public.artist_management IS 'Relationship table between artists and agencies';
COMMENT ON TABLE public.deal_negotiations IS 'Deal negotiation tracking with automated strategy support';
COMMENT ON TABLE public.deal_messages IS 'Communication history for deal negotiations';
COMMENT ON TABLE public.agency_analytics IS 'Performance analytics and metrics for agencies';-- Create Row Level Security policies for Agency Management System

-- RLS policies for agencies table
CREATE POLICY "Agency owners can view their own agencies" ON public.agencies
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
    )
  );

CREATE POLICY "Agency owners can insert their own agencies" ON public.agencies
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Agency owners and managers can update their agencies" ON public.agencies
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager')
    )
  );

CREATE POLICY "Agency owners can delete their own agencies" ON public.agencies
  FOR DELETE USING (owner_id = auth.uid());

-- RLS policies for manager_profiles table
CREATE POLICY "Managers can view profiles in their agencies" ON public.manager_profiles
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
    )
  );

CREATE POLICY "Agency owners can insert manager profiles" ON public.manager_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    )
  );

CREATE POLICY "Agency owners and managers can update manager profiles" ON public.manager_profiles
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager')
    )
  );

CREATE POLICY "Agency owners can delete manager profiles" ON public.manager_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    )
  );

-- RLS policies for artist_management table
CREATE POLICY "Artists and managers can view artist management records" ON public.artist_management
  FOR SELECT USING (
    artist_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
    )
  );

CREATE POLICY "Agency managers can insert artist management records" ON public.artist_management
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager', 'co_manager')
    )
  );

CREATE POLICY "Agency managers can update artist management records" ON public.artist_management
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager', 'co_manager')
    )
  );

CREATE POLICY "Agency owners can delete artist management records" ON public.artist_management
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    )
  );

-- RLS policies for deal_negotiations table
CREATE POLICY "Deal participants can view deal negotiations" ON public.deal_negotiations
  FOR SELECT USING (
    artist_id = auth.uid() OR
    promoter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND e.promoter_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.event_co_promoters ecp 
      WHERE ecp.event_id = event_id 
      AND ecp.user_id = auth.uid()
      AND ecp.is_active = true
    )
  );

CREATE POLICY "Agency managers can insert deal negotiations" ON public.deal_negotiations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager', 'co_manager')
    )
  );

CREATE POLICY "Deal participants can update deal negotiations" ON public.deal_negotiations
  FOR UPDATE USING (
    artist_id = auth.uid() OR
    promoter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND e.promoter_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.event_co_promoters ecp 
      WHERE ecp.event_id = event_id 
      AND ecp.user_id = auth.uid()
      AND ecp.is_active = true
    )
  );

CREATE POLICY "Agency owners can delete deal negotiations" ON public.deal_negotiations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    )
  );

-- RLS policies for deal_messages table
CREATE POLICY "Deal participants can view deal messages" ON public.deal_messages
  FOR SELECT USING (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.deal_negotiations dn 
      WHERE dn.id = deal_id 
      AND (
        dn.artist_id = auth.uid() OR
        dn.promoter_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.agencies a 
          WHERE a.id = dn.agency_id 
          AND a.owner_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.manager_profiles mp 
          WHERE mp.agency_id = dn.agency_id 
          AND mp.user_id = auth.uid()
          AND mp.is_active = true
        ) OR
        EXISTS (
          SELECT 1 FROM public.events e 
          WHERE e.id = dn.event_id 
          AND e.promoter_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.event_co_promoters ecp 
          WHERE ecp.event_id = dn.event_id 
          AND ecp.user_id = auth.uid()
          AND ecp.is_active = true
        )
      )
    )
  );

CREATE POLICY "Deal participants can insert deal messages" ON public.deal_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.deal_negotiations dn 
      WHERE dn.id = deal_id 
      AND (
        dn.artist_id = auth.uid() OR
        dn.promoter_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.agencies a 
          WHERE a.id = dn.agency_id 
          AND a.owner_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.manager_profiles mp 
          WHERE mp.agency_id = dn.agency_id 
          AND mp.user_id = auth.uid()
          AND mp.is_active = true
        ) OR
        EXISTS (
          SELECT 1 FROM public.events e 
          WHERE e.id = dn.event_id 
          AND e.promoter_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.event_co_promoters ecp 
          WHERE ecp.event_id = dn.event_id 
          AND ecp.user_id = auth.uid()
          AND ecp.is_active = true
        )
      )
    )
  );

CREATE POLICY "Message senders can update their own messages" ON public.deal_messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Message senders can delete their own messages" ON public.deal_messages
  FOR DELETE USING (sender_id = auth.uid());

-- RLS policies for agency_analytics table
CREATE POLICY "Agency owners and managers can view agency analytics" ON public.agency_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
    )
  );

CREATE POLICY "Agency owners can insert agency analytics" ON public.agency_analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    )
  );

CREATE POLICY "Agency owners and managers can update agency analytics" ON public.agency_analytics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = agency_id 
      AND mp.user_id = auth.uid()
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager')
    )
  );

CREATE POLICY "Agency owners can delete agency analytics" ON public.agency_analytics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = agency_id 
      AND a.owner_id = auth.uid()
    )
  );

-- Create function to check if user has agency management permissions
CREATE OR REPLACE FUNCTION public.has_agency_permission(
  _user_id UUID,
  _agency_id UUID,
  _required_role TEXT DEFAULT 'manager'
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is agency owner
  IF EXISTS (
    SELECT 1 FROM public.agencies a 
    WHERE a.id = _agency_id 
    AND a.owner_id = _user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a manager with appropriate role
  IF _required_role = 'manager' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = _agency_id 
      AND mp.user_id = _user_id
      AND mp.is_active = true
    );
  ELSIF _required_role = 'senior_manager' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = _agency_id 
      AND mp.user_id = _user_id
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager', 'co_manager')
    );
  ELSIF _required_role = 'primary_manager' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.manager_profiles mp 
      WHERE mp.agency_id = _agency_id 
      AND mp.user_id = _user_id
      AND mp.is_active = true
      AND mp.role IN ('agency_owner', 'primary_manager')
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can access deal
CREATE OR REPLACE FUNCTION public.can_access_deal(
  _user_id UUID,
  _deal_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.deal_negotiations dn
    WHERE dn.id = _deal_id
    AND (
      dn.artist_id = _user_id OR
      dn.promoter_id = _user_id OR
      EXISTS (
        SELECT 1 FROM public.agencies a 
        WHERE a.id = dn.agency_id 
        AND a.owner_id = _user_id
      ) OR
      EXISTS (
        SELECT 1 FROM public.manager_profiles mp 
        WHERE mp.agency_id = dn.agency_id 
        AND mp.user_id = _user_id
        AND mp.is_active = true
      ) OR
      EXISTS (
        SELECT 1 FROM public.events e 
        WHERE e.id = dn.event_id 
        AND e.promoter_id = _user_id
      ) OR
      EXISTS (
        SELECT 1 FROM public.event_co_promoters ecp 
        WHERE ecp.event_id = dn.event_id 
        AND ecp.user_id = _user_id
        AND ecp.is_active = true
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.has_agency_permission(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_deal(UUID, UUID) TO authenticated;-- Create functions for Agency Management System automated features

-- Function to calculate deal negotiation strategy
CREATE OR REPLACE FUNCTION public.calculate_negotiation_strategy(
  _deal_id UUID,
  _market_data JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
  deal_record RECORD;
  artist_history RECORD;
  market_average DECIMAL(10,2);
  strategy_result JSONB;
BEGIN
  -- Get deal details
  SELECT dn.*, p.stage_name, p.location, am.commission_rate as artist_commission_rate
  INTO deal_record
  FROM public.deal_negotiations dn
  JOIN public.profiles p ON dn.artist_id = p.id
  LEFT JOIN public.artist_management am ON dn.artist_id = am.artist_id AND dn.agency_id = am.agency_id
  WHERE dn.id = _deal_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;
  
  -- Get artist performance history
  SELECT 
    COUNT(*) as total_bookings,
    AVG(cb.performance_fee) as average_fee,
    MAX(cb.performance_fee) as highest_fee,
    MIN(cb.performance_fee) as lowest_fee
  INTO artist_history
  FROM public.comedian_bookings cb
  JOIN public.events e ON cb.event_id = e.id
  WHERE cb.comedian_id = deal_record.artist_id
  AND cb.payment_status = 'paid'
  AND e.event_date >= NOW() - INTERVAL '12 months';
  
  -- Calculate market average (from market_data or default calculation)
  market_average := COALESCE(
    (_market_data->>'average_fee')::DECIMAL(10,2),
    artist_history.average_fee * 1.1, -- 10% above artist's average
    500.00 -- Default minimum
  );
  
  -- Build strategy based on data
  strategy_result := jsonb_build_object(
    'recommended_minimum', GREATEST(
      deal_record.minimum_fee,
      artist_history.average_fee * 0.8,
      market_average * 0.7
    ),
    'recommended_target', GREATEST(
      deal_record.proposed_fee,
      artist_history.average_fee * 1.2,
      market_average
    ),
    'recommended_maximum', GREATEST(
      deal_record.maximum_fee,
      artist_history.highest_fee,
      market_average * 1.3
    ),
    'negotiation_approach', CASE
      WHEN deal_record.proposed_fee < market_average * 0.8 THEN 'aggressive'
      WHEN deal_record.proposed_fee > market_average * 1.2 THEN 'conservative'
      ELSE 'balanced'
    END,
    'artist_metrics', jsonb_build_object(
      'total_bookings', COALESCE(artist_history.total_bookings, 0),
      'average_fee', COALESCE(artist_history.average_fee, 0),
      'highest_fee', COALESCE(artist_history.highest_fee, 0),
      'experience_level', CASE
        WHEN COALESCE(artist_history.total_bookings, 0) > 50 THEN 'experienced'
        WHEN COALESCE(artist_history.total_bookings, 0) > 20 THEN 'intermediate'
        ELSE 'emerging'
      END
    ),
    'market_data', jsonb_build_object(
      'market_average', market_average,
      'market_position', CASE
        WHEN deal_record.proposed_fee > market_average * 1.2 THEN 'premium'
        WHEN deal_record.proposed_fee < market_average * 0.8 THEN 'budget'
        ELSE 'market_rate'
      END
    ),
    'auto_response_thresholds', jsonb_build_object(
      'auto_accept_above', market_average * 1.1,
      'auto_decline_below', market_average * 0.6,
      'requires_review_between', jsonb_build_array(
        market_average * 0.6,
        market_average * 1.1
      )
    ),
    'calculated_at', NOW()
  );
  
  -- Update deal with strategy
  UPDATE public.deal_negotiations
  SET 
    negotiation_strategy = strategy_result,
    auto_accept_threshold = (strategy_result->>'auto_accept_above')::DECIMAL(10,2),
    auto_decline_threshold = (strategy_result->>'auto_decline_below')::DECIMAL(10,2),
    updated_at = NOW()
  WHERE id = _deal_id;
  
  RETURN strategy_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process automated deal responses
CREATE OR REPLACE FUNCTION public.process_automated_deal_response(
  _deal_id UUID,
  _new_offer_amount DECIMAL(10,2),
  _responder_id UUID
) RETURNS JSONB AS $$
DECLARE
  deal_record RECORD;
  response_action TEXT;
  response_message TEXT;
  result_data JSONB;
BEGIN
  -- Get deal details
  SELECT * INTO deal_record
  FROM public.deal_negotiations
  WHERE id = _deal_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;
  
  -- Only process if automated responses are enabled
  IF NOT deal_record.automated_responses THEN
    RETURN jsonb_build_object(
      'action', 'manual_review_required',
      'message', 'Automated responses are disabled for this deal'
    );
  END IF;
  
  -- Determine response action
  IF _new_offer_amount >= deal_record.auto_accept_threshold THEN
    response_action := 'accept';
    response_message := 'Offer automatically accepted based on predefined criteria.';
  ELSIF _new_offer_amount <= deal_record.auto_decline_threshold THEN
    response_action := 'decline';
    response_message := 'Offer automatically declined as it falls below minimum acceptable threshold.';
  ELSE
    response_action := 'counter_offer';
    response_message := 'Automated counter-offer generated based on negotiation strategy.';
  END IF;
  
  -- Execute the response action
  IF response_action = 'accept' THEN
    -- Accept the deal
    UPDATE public.deal_negotiations
    SET 
      status = 'accepted',
      accepted_at = NOW(),
      updated_at = NOW()
    WHERE id = _deal_id;
    
    -- Create acceptance message
    INSERT INTO public.deal_messages (
      deal_id, sender_id, message_type, content, is_automated
    ) VALUES (
      _deal_id, _responder_id, 'acceptance', response_message, true
    );
    
  ELSIF response_action = 'decline' THEN
    -- Decline the deal
    UPDATE public.deal_negotiations
    SET 
      status = 'declined',
      declined_at = NOW(),
      updated_at = NOW()
    WHERE id = _deal_id;
    
    -- Create decline message
    INSERT INTO public.deal_messages (
      deal_id, sender_id, message_type, content, is_automated
    ) VALUES (
      _deal_id, _responder_id, 'rejection', response_message, true
    );
    
  ELSE -- counter_offer
    -- Calculate counter offer amount
    DECLARE
      counter_amount DECIMAL(10,2);
      strategy JSONB;
    BEGIN
      strategy := deal_record.negotiation_strategy;
      
      -- Calculate counter offer based on strategy
      counter_amount := CASE
        WHEN (strategy->>'negotiation_approach') = 'aggressive' THEN
          GREATEST(
            _new_offer_amount * 1.3,
            (strategy->>'recommended_target')::DECIMAL(10,2)
          )
        WHEN (strategy->>'negotiation_approach') = 'conservative' THEN
          GREATEST(
            _new_offer_amount * 1.1,
            (strategy->>'recommended_minimum')::DECIMAL(10,2)
          )
        ELSE -- balanced
          GREATEST(
            _new_offer_amount * 1.2,
            (strategy->>'recommended_target')::DECIMAL(10,2) * 0.9
          )
      END;
      
      -- Update deal with counter offer
      UPDATE public.deal_negotiations
      SET 
        counter_offers = counter_offers || jsonb_build_array(
          jsonb_build_object(
            'amount', counter_amount,
            'offered_at', NOW(),
            'offered_by', _responder_id,
            'is_automated', true,
            'response_to_amount', _new_offer_amount
          )
        ),
        status = 'counter_offered',
        updated_at = NOW()
      WHERE id = _deal_id;
      
      -- Create counter offer message
      INSERT INTO public.deal_messages (
        deal_id, sender_id, message_type, content, 
        offer_amount, is_automated
      ) VALUES (
        _deal_id, _responder_id, 'counter_offer', 
        response_message || ' Counter offer: $' || counter_amount::TEXT,
        counter_amount, true
      );
    END;
  END IF;
  
  result_data := jsonb_build_object(
    'action', response_action,
    'message', response_message,
    'deal_id', _deal_id,
    'processed_at', NOW()
  );
  
  RETURN result_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update agency analytics
CREATE OR REPLACE FUNCTION public.update_agency_analytics(
  _agency_id UUID,
  _period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  _period_end DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
  analytics_data JSONB;
  artist_metrics RECORD;
  deal_metrics RECORD;
  financial_metrics RECORD;
BEGIN
  -- Calculate artist metrics
  SELECT 
    COUNT(DISTINCT am.artist_id) as total_artists,
    COUNT(DISTINCT CASE WHEN am.is_active THEN am.artist_id END) as active_artists,
    COUNT(DISTINCT CASE WHEN am.created_at >= _period_start THEN am.artist_id END) as new_artists
  INTO artist_metrics
  FROM public.artist_management am
  WHERE am.agency_id = _agency_id;
  
  -- Calculate deal metrics
  SELECT 
    COUNT(*) as deals_initiated,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as deals_closed,
    COUNT(CASE WHEN status = 'declined' THEN 1 END) as deals_declined,
    AVG(CASE WHEN status = 'accepted' THEN proposed_fee END) as average_deal_value,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as average_response_time_hours
  INTO deal_metrics
  FROM public.deal_negotiations
  WHERE agency_id = _agency_id
  AND created_at >= _period_start
  AND created_at <= _period_end;
  
  -- Calculate financial metrics
  SELECT 
    SUM(CASE WHEN dn.status = 'accepted' THEN dn.proposed_fee END) as total_revenue,
    SUM(CASE WHEN dn.status = 'accepted' THEN dn.proposed_fee * (am.commission_rate / 100) END) as commission_earned,
    AVG(am.commission_rate) as average_commission_rate
  INTO financial_metrics
  FROM public.deal_negotiations dn
  JOIN public.artist_management am ON dn.artist_id = am.artist_id AND dn.agency_id = am.agency_id
  WHERE dn.agency_id = _agency_id
  AND dn.created_at >= _period_start
  AND dn.created_at <= _period_end;
  
  -- Build analytics data
  analytics_data := jsonb_build_object(
    'total_artists', COALESCE(artist_metrics.total_artists, 0),
    'active_artists', COALESCE(artist_metrics.active_artists, 0),
    'new_artists', COALESCE(artist_metrics.new_artists, 0),
    'deals_initiated', COALESCE(deal_metrics.deals_initiated, 0),
    'deals_closed', COALESCE(deal_metrics.deals_closed, 0),
    'deals_declined', COALESCE(deal_metrics.deals_declined, 0),
    'average_deal_value', COALESCE(financial_metrics.total_revenue, 0),
    'total_revenue', COALESCE(financial_metrics.total_revenue, 0),
    'commission_earned', COALESCE(financial_metrics.commission_earned, 0),
    'average_commission_rate', COALESCE(financial_metrics.average_commission_rate, 0),
    'average_response_time_hours', COALESCE(deal_metrics.average_response_time_hours, 0),
    'client_satisfaction_score', 0.0 -- Placeholder for future implementation
  );
  
  -- Insert or update analytics record
  INSERT INTO public.agency_analytics (
    agency_id, period_start, period_end,
    total_artists, active_artists, new_artists,
    deals_initiated, deals_closed, deals_declined, average_deal_value,
    total_revenue, commission_earned, average_commission_rate,
    average_response_time_hours, client_satisfaction_score,
    metrics_data
  ) VALUES (
    _agency_id, _period_start, _period_end,
    (analytics_data->>'total_artists')::INTEGER,
    (analytics_data->>'active_artists')::INTEGER,
    (analytics_data->>'new_artists')::INTEGER,
    (analytics_data->>'deals_initiated')::INTEGER,
    (analytics_data->>'deals_closed')::INTEGER,
    (analytics_data->>'deals_declined')::INTEGER,
    (analytics_data->>'average_deal_value')::DECIMAL(12,2),
    (analytics_data->>'total_revenue')::DECIMAL(12,2),
    (analytics_data->>'commission_earned')::DECIMAL(12,2),
    (analytics_data->>'average_commission_rate')::DECIMAL(5,2),
    (analytics_data->>'average_response_time_hours')::DECIMAL(10,2),
    (analytics_data->>'client_satisfaction_score')::DECIMAL(3,2),
    analytics_data
  ) ON CONFLICT (agency_id, period_start, period_end)
  DO UPDATE SET
    total_artists = EXCLUDED.total_artists,
    active_artists = EXCLUDED.active_artists,
    new_artists = EXCLUDED.new_artists,
    deals_initiated = EXCLUDED.deals_initiated,
    deals_closed = EXCLUDED.deals_closed,
    deals_declined = EXCLUDED.deals_declined,
    average_deal_value = EXCLUDED.average_deal_value,
    total_revenue = EXCLUDED.total_revenue,
    commission_earned = EXCLUDED.commission_earned,
    average_commission_rate = EXCLUDED.average_commission_rate,
    average_response_time_hours = EXCLUDED.average_response_time_hours,
    client_satisfaction_score = EXCLUDED.client_satisfaction_score,
    metrics_data = EXCLUDED.metrics_data,
    updated_at = NOW();
  
  RETURN analytics_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get agency dashboard data
CREATE OR REPLACE FUNCTION public.get_agency_dashboard_data(
  _agency_id UUID,
  _manager_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  dashboard_data JSONB;
  recent_deals JSONB;
  artist_summary JSONB;
  financial_summary JSONB;
  pending_actions JSONB;
BEGIN
  -- Get recent deals
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'artist_name', (SELECT stage_name FROM public.profiles WHERE id = artist_id),
      'proposed_fee', proposed_fee,
      'status', status,
      'created_at', created_at,
      'deadline', deadline
    )
  ) INTO recent_deals
  FROM public.deal_negotiations
  WHERE agency_id = _agency_id
  AND created_at >= NOW() - INTERVAL '30 days'
  ORDER BY created_at DESC
  LIMIT 10;
  
  -- Get artist summary
  SELECT jsonb_build_object(
    'total_artists', COUNT(*),
    'active_artists', COUNT(CASE WHEN is_active THEN 1 END),
    'top_performers', jsonb_agg(
      jsonb_build_object(
        'artist_id', artist_id,
        'artist_name', (SELECT stage_name FROM public.profiles WHERE id = artist_id),
        'total_revenue', total_revenue,
        'bookings_count', bookings_count
      )
    )
  ) INTO artist_summary
  FROM (
    SELECT 
      am.artist_id,
      am.is_active,
      am.total_revenue,
      am.bookings_count
    FROM public.artist_management am
    WHERE am.agency_id = _agency_id
    ORDER BY am.total_revenue DESC
    LIMIT 5
  ) top_artists;
  
  -- Get financial summary
  SELECT jsonb_build_object(
    'total_revenue_30d', COALESCE(SUM(CASE WHEN dn.status = 'accepted' AND dn.created_at >= NOW() - INTERVAL '30 days' THEN dn.proposed_fee END), 0),
    'commission_earned_30d', COALESCE(SUM(CASE WHEN dn.status = 'accepted' AND dn.created_at >= NOW() - INTERVAL '30 days' THEN dn.proposed_fee * (am.commission_rate / 100) END), 0),
    'deals_closed_30d', COUNT(CASE WHEN dn.status = 'accepted' AND dn.created_at >= NOW() - INTERVAL '30 days' THEN 1 END),
    'average_deal_value', COALESCE(AVG(CASE WHEN dn.status = 'accepted' THEN dn.proposed_fee END), 0)
  ) INTO financial_summary
  FROM public.deal_negotiations dn
  JOIN public.artist_management am ON dn.artist_id = am.artist_id AND dn.agency_id = am.agency_id
  WHERE dn.agency_id = _agency_id;
  
  -- Get pending actions
  SELECT jsonb_build_object(
    'pending_deals', COUNT(CASE WHEN status IN ('proposed', 'negotiating', 'counter_offered') THEN 1 END),
    'expiring_soon', COUNT(CASE WHEN status IN ('proposed', 'negotiating', 'counter_offered') AND deadline <= NOW() + INTERVAL '48 hours' THEN 1 END),
    'new_messages', COALESCE((
      SELECT COUNT(*)
      FROM public.deal_messages dm
      JOIN public.deal_negotiations dn ON dm.deal_id = dn.id
      WHERE dn.agency_id = _agency_id
      AND dm.created_at >= NOW() - INTERVAL '24 hours'
      AND dm.sender_id != COALESCE(_manager_id, '00000000-0000-0000-0000-000000000000'::UUID)
    ), 0)
  ) INTO pending_actions
  FROM public.deal_negotiations
  WHERE agency_id = _agency_id;
  
  -- Build final dashboard data
  dashboard_data := jsonb_build_object(
    'agency_id', _agency_id,
    'generated_at', NOW(),
    'recent_deals', COALESCE(recent_deals, '[]'::JSONB),
    'artist_summary', COALESCE(artist_summary, '{}'::JSONB),
    'financial_summary', COALESCE(financial_summary, '{}'::JSONB),
    'pending_actions', COALESCE(pending_actions, '{}'::JSONB)
  );
  
  RETURN dashboard_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.calculate_negotiation_strategy(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_automated_deal_response(UUID, DECIMAL, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_agency_analytics(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agency_dashboard_data(UUID, UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.calculate_negotiation_strategy(UUID, JSONB) IS 'Calculates AI-driven negotiation strategy based on artist history and market data';
COMMENT ON FUNCTION public.process_automated_deal_response(UUID, DECIMAL, UUID) IS 'Processes automated deal responses based on predefined thresholds';
COMMENT ON FUNCTION public.update_agency_analytics(UUID, DATE, DATE) IS 'Updates agency analytics for a given period';
COMMENT ON FUNCTION public.get_agency_dashboard_data(UUID, UUID) IS 'Gets comprehensive dashboard data for agency management interface';