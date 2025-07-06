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
COMMENT ON TABLE public.agency_analytics IS 'Performance analytics and metrics for agencies';