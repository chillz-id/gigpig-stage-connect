-- ============================================
-- FIX ONLY MISSING RESOURCES FOR STAND UP SYDNEY
-- ============================================
-- This script ONLY creates what's actually missing based on our check

-- First, ensure required functions exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = _user_id AND role = _role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 1. CREATE MISSING STORAGE BUCKETS
-- ============================================

-- Create profile-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create comedian-media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comedian-media',
  'comedian-media',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create event-media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-media',
  'event-media',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile-images
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can view profile images') THEN
        CREATE POLICY "Anyone can view profile images" ON storage.objects
        FOR SELECT USING (bucket_id = 'profile-images');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload their own profile images') THEN
        CREATE POLICY "Users can upload their own profile images" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'profile-images' 
          AND auth.role() = 'authenticated'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can update their own profile images') THEN
        CREATE POLICY "Users can update their own profile images" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'profile-images' 
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete their own profile images') THEN
        CREATE POLICY "Users can delete their own profile images" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'profile-images' 
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
END $$;

-- ============================================
-- 2. CREATE FLIGHT TRACKING SYSTEM
-- ============================================

-- Create ENUM types for flight system
DO $$ BEGIN
    CREATE TYPE flight_status AS ENUM ('scheduled', 'boarding', 'departed', 'in_air', 'landed', 'arrived', 'cancelled', 'delayed', 'diverted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE update_source AS ENUM ('manual', 'api', 'n8n', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_preference AS ENUM ('none', 'critical', 'all');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Flight bookings table
CREATE TABLE IF NOT EXISTS public.flight_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    booking_reference TEXT NOT NULL,
    flight_number TEXT NOT NULL,
    airline TEXT NOT NULL,
    departure_airport TEXT NOT NULL,
    arrival_airport TEXT NOT NULL,
    scheduled_departure TIMESTAMPTZ NOT NULL,
    scheduled_arrival TIMESTAMPTZ NOT NULL,
    actual_departure TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    status flight_status DEFAULT 'scheduled',
    gate TEXT,
    terminal TEXT,
    baggage_claim TEXT,
    seat_number TEXT,
    confirmation_code TEXT,
    ticket_number TEXT,
    fare_class TEXT,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'AUD',
    notes TEXT,
    is_tracked BOOLEAN DEFAULT TRUE,
    last_api_check TIMESTAMPTZ,
    next_api_check TIMESTAMPTZ,
    api_check_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Flight status updates history
CREATE TABLE IF NOT EXISTS public.flight_status_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_booking_id UUID REFERENCES public.flight_bookings(id) ON DELETE CASCADE NOT NULL,
    previous_status flight_status,
    new_status flight_status NOT NULL,
    status_details JSONB DEFAULT '{}',
    update_source update_source DEFAULT 'system',
    delay_minutes INTEGER,
    delay_reason TEXT,
    new_departure_time TIMESTAMPTZ,
    new_arrival_time TIMESTAMPTZ,
    gate_change TEXT,
    terminal_change TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Flight notifications configuration
CREATE TABLE IF NOT EXISTS public.flight_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    flight_booking_id UUID REFERENCES public.flight_bookings(id) ON DELETE CASCADE,
    notification_preference notification_preference DEFAULT 'all',
    notify_hours_before INTEGER DEFAULT 24,
    notify_on_delay BOOLEAN DEFAULT TRUE,
    notify_on_gate_change BOOLEAN DEFAULT TRUE,
    notify_on_cancellation BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    phone_number TEXT,
    last_notification_sent TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Flight API configuration
CREATE TABLE IF NOT EXISTS public.flight_api_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL UNIQUE,
    api_key TEXT,
    api_endpoint TEXT NOT NULL,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    current_usage INTEGER DEFAULT 0,
    usage_reset_time TIMESTAMPTZ DEFAULT now() + interval '1 hour',
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1,
    supported_features JSONB DEFAULT '{}',
    last_error TEXT,
    last_error_time TIMESTAMPTZ,
    consecutive_errors INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- N8N workflow execution logs
CREATE TABLE IF NOT EXISTS public.n8n_flight_workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id TEXT NOT NULL,
    execution_id TEXT,
    flight_booking_id UUID REFERENCES public.flight_bookings(id) ON DELETE CASCADE,
    trigger_type TEXT,
    status TEXT DEFAULT 'pending',
    request_data JSONB DEFAULT '{}',
    response_data JSONB DEFAULT '{}',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Flight search cache
CREATE TABLE IF NOT EXISTS public.flight_search_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_key TEXT NOT NULL,
    flight_number TEXT NOT NULL,
    departure_date DATE NOT NULL,
    result_data JSONB NOT NULL,
    api_provider TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT now() + interval '1 hour'
);

-- Enable RLS on flight tables
ALTER TABLE public.flight_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_api_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_flight_workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_search_cache ENABLE ROW LEVEL SECURITY;

-- Create indexes for flight tables
CREATE INDEX IF NOT EXISTS idx_flight_bookings_user_id ON public.flight_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_departure ON public.flight_bookings(scheduled_departure);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_status ON public.flight_bookings(status);
CREATE INDEX IF NOT EXISTS idx_flight_status_updates_booking ON public.flight_status_updates(flight_booking_id);
CREATE INDEX IF NOT EXISTS idx_flight_search_cache_key ON public.flight_search_cache(search_key);

-- ============================================
-- 3. CREATE TOURING SYSTEM
-- ============================================

-- Create ENUM types for touring system
DO $$ BEGIN
    CREATE TYPE tour_status AS ENUM ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled', 'postponed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tour_stop_status AS ENUM ('planned', 'confirmed', 'completed', 'cancelled', 'postponed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE participant_role AS ENUM ('headliner', 'support_act', 'opener', 'mc', 'crew', 'management', 'guest', 'local_talent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE collaboration_role AS ENUM ('co_promoter', 'local_promoter', 'sponsor', 'partner', 'venue_partner', 'media_partner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE collaboration_status AS ENUM ('invited', 'confirmed', 'active', 'completed', 'declined', 'terminated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE logistics_type AS ENUM ('transportation', 'accommodation', 'equipment', 'catering', 'security', 'marketing', 'technical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_type AS ENUM ('per_show', 'tour_total', 'percentage', 'flat_rate', 'revenue_share');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Check if agencies table exists before creating tours
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agencies') THEN
        CREATE TABLE public.agencies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    END IF;
END $$;

-- Main tours table
CREATE TABLE IF NOT EXISTS public.tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    tour_manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
    start_date DATE,
    end_date DATE,
    status tour_status DEFAULT 'planning',
    tour_type TEXT DEFAULT 'comedy',
    budget DECIMAL(12,2),
    estimated_revenue DECIMAL(12,2),
    actual_revenue DECIMAL(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'AUD',
    revenue_sharing JSONB DEFAULT '{}',
    marketing_budget DECIMAL(10,2),
    marketing_materials JSONB DEFAULT '{}',
    social_hashtag TEXT,
    website_url TEXT,
    booking_contact_email TEXT,
    booking_contact_phone TEXT,
    emergency_contact JSONB DEFAULT '{}',
    tour_requirements JSONB DEFAULT '{}',
    travel_policy JSONB DEFAULT '{}',
    cancellation_policy TEXT,
    insurance_info JSONB DEFAULT '{}',
    contract_template_id UUID,
    is_public BOOLEAN DEFAULT FALSE,
    promotional_code TEXT,
    total_capacity INTEGER DEFAULT 0,
    tickets_sold INTEGER DEFAULT 0,
    gross_sales DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tour stops/shows table
CREATE TABLE IF NOT EXISTS public.tour_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    venue_name TEXT NOT NULL,
    venue_address TEXT,
    venue_city TEXT NOT NULL,
    venue_state TEXT,
    venue_country TEXT DEFAULT 'Australia',
    venue_contact JSONB DEFAULT '{}',
    venue_capacity INTEGER,
    event_date TIMESTAMPTZ NOT NULL,
    doors_open TIME,
    show_time TIME NOT NULL,
    show_duration_minutes INTEGER DEFAULT 120,
    soundcheck_time TIME,
    load_in_time TIME,
    load_out_time TIME,
    status tour_stop_status DEFAULT 'planned',
    ticket_price DECIMAL(10,2),
    vip_price DECIMAL(10,2),
    tickets_available INTEGER,
    tickets_sold INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    expenses DECIMAL(10,2) DEFAULT 0,
    technical_requirements JSONB DEFAULT '{}',
    catering_requirements JSONB DEFAULT '{}',
    accommodation_info JSONB DEFAULT '{}',
    local_contacts JSONB DEFAULT '{}',
    parking_info TEXT,
    accessibility_info TEXT,
    covid_requirements TEXT,
    order_index INTEGER NOT NULL,
    travel_time_to_next INTEGER,
    distance_to_next_km DECIMAL(8,2),
    notes TEXT,
    weather_backup_plan TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tour participants (comedians, crew, guests)
CREATE TABLE IF NOT EXISTS public.tour_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    role participant_role NOT NULL,
    join_date DATE,
    leave_date DATE,
    specific_shows UUID[],
    payment_rate DECIMAL(10,2),
    payment_type payment_type DEFAULT 'per_show',
    payment_terms TEXT DEFAULT 'net_30',
    travel_covered BOOLEAN DEFAULT FALSE,
    accommodation_covered BOOLEAN DEFAULT FALSE,
    meals_covered BOOLEAN DEFAULT FALSE,
    meal_allowance DECIMAL(8,2),
    equipment_provided BOOLEAN DEFAULT FALSE,
    special_requirements JSONB DEFAULT '{}',
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_file_url TEXT,
    emergency_contact JSONB DEFAULT '{}',
    bio TEXT,
    photo_url TEXT,
    social_media JSONB DEFAULT '{}',
    performance_notes TEXT,
    is_headliner BOOLEAN DEFAULT FALSE,
    performance_order INTEGER,
    stage_time_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tour itinerary for daily schedules
CREATE TABLE IF NOT EXISTS public.tour_itinerary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    tour_stop_id UUID REFERENCES public.tour_stops(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    activity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    location TEXT,
    address TEXT,
    duration_minutes INTEGER,
    responsible_person UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    participants UUID[],
    notes TEXT,
    equipment_needed TEXT[],
    transportation_method TEXT,
    confirmation_required BOOLEAN DEFAULT FALSE,
    confirmed BOOLEAN DEFAULT FALSE,
    confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'planned',
    order_index INTEGER NOT NULL,
    weather_dependent BOOLEAN DEFAULT FALSE,
    backup_plan TEXT,
    cost DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tour logistics management
CREATE TABLE IF NOT EXISTS public.tour_logistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    tour_stop_id UUID REFERENCES public.tour_stops(id) ON DELETE CASCADE,
    type logistics_type NOT NULL,
    provider_name TEXT,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    booking_reference TEXT,
    confirmation_number TEXT,
    cost DECIMAL(10,2),
    currency TEXT DEFAULT 'AUD',
    start_date DATE,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    participants UUID[],
    details JSONB DEFAULT '{}',
    requirements JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    payment_due_date DATE,
    cancellation_policy TEXT,
    modification_policy TEXT,
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tour collaborations (multi-promoter partnerships)
CREATE TABLE IF NOT EXISTS public.tour_collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    collaborator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role collaboration_role NOT NULL,
    status collaboration_status DEFAULT 'invited',
    responsibilities TEXT[],
    revenue_share DECIMAL(5,2),
    expense_share DECIMAL(5,2),
    specific_shows UUID[],
    marketing_contribution JSONB DEFAULT '{}',
    venue_connections JSONB DEFAULT '{}',
    local_knowledge TEXT,
    contact_priority INTEGER DEFAULT 1,
    decision_making_power BOOLEAN DEFAULT FALSE,
    financial_responsibility DECIMAL(10,2),
    contract_terms JSONB DEFAULT '{}',
    signed_agreement BOOLEAN DEFAULT FALSE,
    agreement_file_url TEXT,
    invitation_sent_at TIMESTAMPTZ,
    invitation_expires_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    termination_reason TEXT,
    performance_rating DECIMAL(3,2),
    would_collaborate_again BOOLEAN,
    collaboration_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tour expenses tracking
CREATE TABLE IF NOT EXISTS public.tour_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    tour_stop_id UUID REFERENCES public.tour_stops(id) ON DELETE CASCADE,
    logistics_id UUID REFERENCES public.tour_logistics(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'AUD',
    expense_date DATE NOT NULL,
    paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reimbursable BOOLEAN DEFAULT TRUE,
    reimbursed BOOLEAN DEFAULT FALSE,
    reimbursed_date DATE,
    receipt_url TEXT,
    vendor_name TEXT,
    vendor_contact TEXT,
    payment_method TEXT,
    tax_deductible BOOLEAN DEFAULT TRUE,
    notes TEXT,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tour revenue tracking
CREATE TABLE IF NOT EXISTS public.tour_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    tour_stop_id UUID REFERENCES public.tour_stops(id) ON DELETE CASCADE,
    revenue_type TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'AUD',
    revenue_date DATE NOT NULL,
    payment_method TEXT,
    platform_fee DECIMAL(10,2) DEFAULT 0,
    taxes DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2),
    collected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on tour tables
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_itinerary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_logistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_revenue ENABLE ROW LEVEL SECURITY;

-- Create indexes for tour tables
CREATE INDEX IF NOT EXISTS idx_tours_manager_id ON public.tours(tour_manager_id);
CREATE INDEX IF NOT EXISTS idx_tours_status ON public.tours(status);
CREATE INDEX IF NOT EXISTS idx_tour_stops_tour_id ON public.tour_stops(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_participants_tour_id ON public.tour_participants(tour_id);

-- ============================================
-- 4. CREATE ONLY MISSING TRIGGERS
-- ============================================

-- Create trigger for flight_bookings only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_flight_bookings_updated_at') THEN
        CREATE TRIGGER update_flight_bookings_updated_at 
            BEFORE UPDATE ON public.flight_bookings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create trigger for flight_notifications only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_flight_notifications_updated_at') THEN
        CREATE TRIGGER update_flight_notifications_updated_at 
            BEFORE UPDATE ON public.flight_notifications
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create trigger for tours only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tours_updated_at') THEN
        CREATE TRIGGER update_tours_updated_at 
            BEFORE UPDATE ON public.tours
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create trigger for tour_stops only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tour_stops_updated_at') THEN
        CREATE TRIGGER update_tour_stops_updated_at 
            BEFORE UPDATE ON public.tour_stops
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

-- Grant permissions on flight tables
GRANT ALL ON public.flight_bookings TO authenticated;
GRANT ALL ON public.flight_status_updates TO authenticated;
GRANT ALL ON public.flight_notifications TO authenticated;

-- Grant permissions on tour tables
GRANT ALL ON public.tours TO authenticated;
GRANT ALL ON public.tour_stops TO authenticated;
GRANT ALL ON public.tour_participants TO authenticated;
GRANT ALL ON public.tour_itinerary TO authenticated;
GRANT ALL ON public.tour_logistics TO authenticated;
GRANT ALL ON public.tour_collaborations TO authenticated;
GRANT ALL ON public.tour_expenses TO authenticated;
GRANT ALL ON public.tour_revenue TO authenticated;

-- Grant service role permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ============================================
-- 6. CREATE BASIC RLS POLICIES
-- ============================================

-- Basic RLS policies for flights
CREATE POLICY "Users can view their own flights" ON public.flight_bookings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own flights" ON public.flight_bookings
    FOR ALL USING (user_id = auth.uid());

-- Basic RLS policies for tours
CREATE POLICY "Public can view public tours" ON public.tours 
    FOR SELECT USING (is_public = true);

CREATE POLICY "Tour managers can manage their tours" ON public.tours 
    FOR ALL USING (tour_manager_id = auth.uid());

-- ============================================
-- 7. VERIFICATION
-- ============================================

-- Final check
SELECT 'CHECKING FINAL STATE...' as status;

-- Check tables
WITH required_tables AS (
    SELECT unnest(ARRAY[
        'flight_bookings', 'flight_status_updates', 'flight_notifications', 
        'tours', 'tour_stops', 'tour_participants'
    ]) as table_name
)
SELECT 
    rt.table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = rt.table_name)
        THEN '✅ Created'
        ELSE '❌ Failed'
    END as status
FROM required_tables rt
ORDER BY rt.table_name;

-- Check storage buckets
SELECT 
    name,
    public,
    file_size_limit
FROM storage.buckets
WHERE name IN ('profile-images', 'comedian-media', 'event-media');

SELECT '✅ Script completed! All missing resources should now be created.' as message;