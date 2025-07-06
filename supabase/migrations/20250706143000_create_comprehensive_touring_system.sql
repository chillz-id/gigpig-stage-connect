-- Comprehensive Touring System for Stand Up Sydney Platform
-- Creates complete touring infrastructure with collaboration, logistics, and task integration

-- Create ENUM types for touring system
CREATE TYPE tour_status AS ENUM ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled', 'postponed');
CREATE TYPE tour_stop_status AS ENUM ('planned', 'confirmed', 'completed', 'cancelled', 'postponed');
CREATE TYPE participant_role AS ENUM ('headliner', 'support_act', 'opener', 'mc', 'crew', 'management', 'guest', 'local_talent');
CREATE TYPE collaboration_role AS ENUM ('co_promoter', 'local_promoter', 'sponsor', 'partner', 'venue_partner', 'media_partner');
CREATE TYPE collaboration_status AS ENUM ('invited', 'confirmed', 'active', 'completed', 'declined', 'terminated');
CREATE TYPE logistics_type AS ENUM ('transportation', 'accommodation', 'equipment', 'catering', 'security', 'marketing', 'technical');
CREATE TYPE payment_type AS ENUM ('per_show', 'tour_total', 'percentage', 'flat_rate', 'revenue_share');

-- Main tours table
CREATE TABLE public.tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    tour_manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL, -- If managed by an agency
    start_date DATE,
    end_date DATE,
    status tour_status DEFAULT 'planning',
    tour_type TEXT DEFAULT 'comedy', -- 'comedy', 'mixed', 'festival', 'corporate'
    budget DECIMAL(12,2),
    estimated_revenue DECIMAL(12,2),
    actual_revenue DECIMAL(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'AUD',
    revenue_sharing JSONB DEFAULT '{}', -- Split percentages between participants
    marketing_budget DECIMAL(10,2),
    marketing_materials JSONB DEFAULT '{}', -- Posters, videos, press releases
    social_hashtag TEXT,
    website_url TEXT,
    booking_contact_email TEXT,
    booking_contact_phone TEXT,
    emergency_contact JSONB DEFAULT '{}',
    tour_requirements JSONB DEFAULT '{}', -- Technical, catering, accommodation requirements
    travel_policy JSONB DEFAULT '{}', -- Travel rules, reimbursement policies
    cancellation_policy TEXT,
    insurance_info JSONB DEFAULT '{}',
    contract_template_id UUID, -- Reference to standard tour contract
    is_public BOOLEAN DEFAULT FALSE, -- Public visibility
    promotional_code TEXT, -- For ticket discounts
    total_capacity INTEGER DEFAULT 0, -- Sum of all venue capacities
    tickets_sold INTEGER DEFAULT 0,
    gross_sales DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tour stops/shows table
CREATE TABLE public.tour_stops (
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
    technical_requirements JSONB DEFAULT '{}', -- Sound, lighting, stage specs
    catering_requirements JSONB DEFAULT '{}',
    accommodation_info JSONB DEFAULT '{}', -- Hotel bookings, green room info
    local_contacts JSONB DEFAULT '{}', -- Local crew, vendors
    parking_info TEXT,
    accessibility_info TEXT,
    covid_requirements TEXT,
    order_index INTEGER NOT NULL, -- Order in the tour
    travel_time_to_next INTEGER, -- Minutes to next venue
    distance_to_next_km DECIMAL(8,2), -- Distance to next venue
    notes TEXT,
    weather_backup_plan TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tour participants (comedians, crew, guests)
CREATE TABLE public.tour_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- If they're a platform user
    participant_name TEXT NOT NULL, -- Name (required even if user_id exists)
    role participant_role NOT NULL,
    join_date DATE, -- When they join the tour (might not be start date)
    leave_date DATE, -- When they leave the tour (might not be end date)
    specific_shows UUID[], -- Array of tour_stop IDs if not all shows
    payment_rate DECIMAL(10,2),
    payment_type payment_type DEFAULT 'per_show',
    payment_terms TEXT DEFAULT 'net_30', -- Payment schedule
    travel_covered BOOLEAN DEFAULT FALSE,
    accommodation_covered BOOLEAN DEFAULT FALSE,
    meals_covered BOOLEAN DEFAULT FALSE,
    meal_allowance DECIMAL(8,2),
    equipment_provided BOOLEAN DEFAULT FALSE,
    special_requirements JSONB DEFAULT '{}', -- Dietary, technical, etc.
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_file_url TEXT,
    emergency_contact JSONB DEFAULT '{}',
    bio TEXT, -- For program/promotional materials
    photo_url TEXT,
    social_media JSONB DEFAULT '{}',
    performance_notes TEXT, -- Set list, technical notes
    is_headliner BOOLEAN DEFAULT FALSE,
    performance_order INTEGER, -- Order in the show
    stage_time_minutes INTEGER, -- Allocated stage time
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tour itinerary for daily schedules
CREATE TABLE public.tour_itinerary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    tour_stop_id UUID REFERENCES public.tour_stops(id) ON DELETE CASCADE, -- Can be null for travel days
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    activity_type TEXT NOT NULL, -- 'travel', 'soundcheck', 'show', 'meet_greet', 'interview', 'free_time'
    title TEXT NOT NULL,
    location TEXT,
    address TEXT,
    duration_minutes INTEGER,
    responsible_person UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    participants UUID[], -- Array of participant IDs involved
    notes TEXT,
    equipment_needed TEXT[],
    transportation_method TEXT, -- 'flight', 'bus', 'car', 'train'
    confirmation_required BOOLEAN DEFAULT FALSE,
    confirmed BOOLEAN DEFAULT FALSE,
    confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'planned', -- 'planned', 'confirmed', 'in_progress', 'completed', 'cancelled'
    order_index INTEGER NOT NULL,
    weather_dependent BOOLEAN DEFAULT FALSE,
    backup_plan TEXT,
    cost DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tour logistics management
CREATE TABLE public.tour_logistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    tour_stop_id UUID REFERENCES public.tour_stops(id) ON DELETE CASCADE, -- Can be null for tour-wide logistics
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
    participants UUID[], -- Array of participant IDs affected
    details JSONB DEFAULT '{}', -- Specific details for each logistics type
    requirements JSONB DEFAULT '{}', -- Special requirements or specifications
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'refunded', 'disputed'
    payment_due_date DATE,
    cancellation_policy TEXT,
    modification_policy TEXT,
    notes TEXT,
    attachments JSONB DEFAULT '[]', -- File references for contracts, receipts
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tour collaborations (multi-promoter partnerships)
CREATE TABLE public.tour_collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    collaborator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role collaboration_role NOT NULL,
    status collaboration_status DEFAULT 'invited',
    responsibilities TEXT[], -- Array of specific responsibilities
    revenue_share DECIMAL(5,2), -- Percentage of revenue
    expense_share DECIMAL(5,2), -- Percentage of expenses
    specific_shows UUID[], -- Array of tour_stop IDs if not all shows
    marketing_contribution JSONB DEFAULT '{}', -- What they'll provide for marketing
    venue_connections JSONB DEFAULT '{}', -- Venues they can provide
    local_knowledge TEXT, -- Local market insights
    contact_priority INTEGER DEFAULT 1, -- Contact order priority
    decision_making_power BOOLEAN DEFAULT FALSE, -- Can make tour decisions
    financial_responsibility DECIMAL(10,2), -- Amount they're responsible for
    contract_terms JSONB DEFAULT '{}',
    signed_agreement BOOLEAN DEFAULT FALSE,
    agreement_file_url TEXT,
    invitation_sent_at TIMESTAMPTZ,
    invitation_expires_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    termination_reason TEXT,
    performance_rating DECIMAL(3,2), -- Post-tour rating
    would_collaborate_again BOOLEAN,
    collaboration_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tour expenses tracking
CREATE TABLE public.tour_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    tour_stop_id UUID REFERENCES public.tour_stops(id) ON DELETE CASCADE, -- Can be null for tour-wide expenses
    logistics_id UUID REFERENCES public.tour_logistics(id) ON DELETE SET NULL,
    category TEXT NOT NULL, -- 'travel', 'accommodation', 'meals', 'equipment', 'marketing', 'venue', 'talent', 'misc'
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
    payment_method TEXT, -- 'cash', 'card', 'transfer', 'check'
    tax_deductible BOOLEAN DEFAULT TRUE,
    notes TEXT,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tour revenue tracking
CREATE TABLE public.tour_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
    tour_stop_id UUID REFERENCES public.tour_stops(id) ON DELETE CASCADE, -- Can be null for tour-wide revenue
    revenue_type TEXT NOT NULL, -- 'tickets', 'merchandise', 'sponsorship', 'vip', 'concessions'
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'AUD',
    revenue_date DATE NOT NULL,
    payment_method TEXT, -- 'cash', 'card', 'transfer'
    platform_fee DECIMAL(10,2) DEFAULT 0, -- Ticketing platform fees
    taxes DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2), -- Amount after fees and taxes
    collected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_itinerary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_logistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_revenue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tours
CREATE POLICY "Public can view public tours" ON public.tours FOR SELECT TO authenticated 
USING (is_public = true);

CREATE POLICY "Tour managers can manage their tours" ON public.tours FOR ALL TO authenticated 
USING (tour_manager_id = auth.uid());

CREATE POLICY "Collaborators can view tours they're involved in" ON public.tours FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.tour_collaborations tc 
        WHERE tc.tour_id = id AND tc.collaborator_id = auth.uid() AND tc.status = 'active'
    )
);

CREATE POLICY "Participants can view tours they're in" ON public.tours FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.tour_participants tp 
        WHERE tp.tour_id = id AND tp.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all tours" ON public.tours FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tour_stops
CREATE POLICY "Public can view stops for public tours" ON public.tour_stops FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.tours t 
        WHERE t.id = tour_id AND t.is_public = true
    )
);

CREATE POLICY "Tour managers can manage their tour stops" ON public.tour_stops FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.tours t 
        WHERE t.id = tour_id AND t.tour_manager_id = auth.uid()
    )
);

CREATE POLICY "Collaborators can manage stops they're responsible for" ON public.tour_stops FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.tours t
        JOIN public.tour_collaborations tc ON t.id = tc.tour_id
        WHERE t.id = tour_id AND tc.collaborator_id = auth.uid() AND tc.status = 'active'
    )
);

-- Similar RLS policies for other tables...
CREATE POLICY "Tour participants can view tour participants" ON public.tour_participants FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.tours t 
        WHERE t.id = tour_id AND (
            t.tour_manager_id = auth.uid() OR
            t.is_public = true OR
            EXISTS (SELECT 1 FROM public.tour_participants tp2 WHERE tp2.tour_id = t.id AND tp2.user_id = auth.uid()) OR
            EXISTS (SELECT 1 FROM public.tour_collaborations tc WHERE tc.tour_id = t.id AND tc.collaborator_id = auth.uid() AND tc.status = 'active')
        )
    )
);

CREATE POLICY "Tour managers can manage participants" ON public.tour_participants FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.tours t 
        WHERE t.id = tour_id AND t.tour_manager_id = auth.uid()
    )
);

-- Create indexes for performance
CREATE INDEX idx_tours_manager_id ON public.tours(tour_manager_id);
CREATE INDEX idx_tours_status ON public.tours(status);
CREATE INDEX idx_tours_start_date ON public.tours(start_date);
CREATE INDEX idx_tours_public ON public.tours(is_public) WHERE is_public = true;
CREATE INDEX idx_tours_agency_id ON public.tours(agency_id) WHERE agency_id IS NOT NULL;

CREATE INDEX idx_tour_stops_tour_id ON public.tour_stops(tour_id);
CREATE INDEX idx_tour_stops_date ON public.tour_stops(event_date);
CREATE INDEX idx_tour_stops_city ON public.tour_stops(venue_city);
CREATE INDEX idx_tour_stops_order ON public.tour_stops(tour_id, order_index);

CREATE INDEX idx_tour_participants_tour_id ON public.tour_participants(tour_id);
CREATE INDEX idx_tour_participants_user_id ON public.tour_participants(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_tour_participants_role ON public.tour_participants(role);

CREATE INDEX idx_tour_itinerary_tour_id ON public.tour_itinerary(tour_id);
CREATE INDEX idx_tour_itinerary_date ON public.tour_itinerary(date);
CREATE INDEX idx_tour_itinerary_stop_id ON public.tour_itinerary(tour_stop_id) WHERE tour_stop_id IS NOT NULL;

CREATE INDEX idx_tour_logistics_tour_id ON public.tour_logistics(tour_id);
CREATE INDEX idx_tour_logistics_type ON public.tour_logistics(type);
CREATE INDEX idx_tour_logistics_status ON public.tour_logistics(status);

CREATE INDEX idx_tour_collaborations_tour_id ON public.tour_collaborations(tour_id);
CREATE INDEX idx_tour_collaborations_collaborator_id ON public.tour_collaborations(collaborator_id);
CREATE INDEX idx_tour_collaborations_status ON public.tour_collaborations(status);

CREATE INDEX idx_tour_expenses_tour_id ON public.tour_expenses(tour_id);
CREATE INDEX idx_tour_expenses_date ON public.tour_expenses(expense_date);
CREATE INDEX idx_tour_expenses_category ON public.tour_expenses(category);

CREATE INDEX idx_tour_revenue_tour_id ON public.tour_revenue(tour_id);
CREATE INDEX idx_tour_revenue_date ON public.tour_revenue(revenue_date);
CREATE INDEX idx_tour_revenue_type ON public.tour_revenue(revenue_type);

-- Create triggers for updated_at columns
CREATE TRIGGER update_tours_updated_at 
    BEFORE UPDATE ON public.tours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_stops_updated_at 
    BEFORE UPDATE ON public.tour_stops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_participants_updated_at 
    BEFORE UPDATE ON public.tour_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_itinerary_updated_at 
    BEFORE UPDATE ON public.tour_itinerary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_logistics_updated_at 
    BEFORE UPDATE ON public.tour_logistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_collaborations_updated_at 
    BEFORE UPDATE ON public.tour_collaborations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically apply tour task templates when tour is created
CREATE OR REPLACE FUNCTION apply_tour_task_template()
RETURNS TRIGGER AS $$
BEGIN
    -- Apply "New Tour Setup" template if it exists
    IF EXISTS (SELECT 1 FROM public.task_templates WHERE name = 'New Tour Setup' AND is_system_template = true) THEN
        -- This would trigger the task template application
        -- For now, we'll just insert a placeholder task
        INSERT INTO public.tasks (
            title,
            description,
            creator_id,
            assignee_id,
            category,
            priority,
            due_date,
            template_id,
            metadata
        ) VALUES (
            'Complete tour setup for ' || NEW.name,
            'Finalize all arrangements for the new tour including venues, logistics, and participants',
            NEW.tour_manager_id,
            NEW.tour_manager_id,
            'event_planning',
            'high',
            COALESCE(NEW.start_date - INTERVAL '30 days', now() + INTERVAL '7 days'),
            (SELECT id FROM public.task_templates WHERE name = 'New Tour Setup' AND is_system_template = true LIMIT 1),
            jsonb_build_object('tour_id', NEW.id, 'auto_generated', true)
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER apply_tour_task_template_trigger 
    AFTER INSERT ON public.tours
    FOR EACH ROW EXECUTE FUNCTION apply_tour_task_template();

-- Function to calculate tour statistics
CREATE OR REPLACE FUNCTION calculate_tour_statistics(_tour_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_stops INTEGER;
    total_capacity INTEGER;
    total_sold INTEGER;
    total_revenue DECIMAL;
    total_expenses DECIMAL;
    net_profit DECIMAL;
    occupancy_rate DECIMAL;
BEGIN
    SELECT 
        COUNT(*) as stops,
        COALESCE(SUM(venue_capacity), 0) as capacity,
        COALESCE(SUM(tickets_sold), 0) as sold,
        COALESCE(SUM(revenue), 0) as revenue
    INTO total_stops, total_capacity, total_sold, total_revenue
    FROM public.tour_stops 
    WHERE tour_id = _tour_id;
    
    SELECT COALESCE(SUM(amount), 0) INTO total_expenses
    FROM public.tour_expenses 
    WHERE tour_id = _tour_id;
    
    net_profit := total_revenue - total_expenses;
    
    occupancy_rate := CASE 
        WHEN total_capacity > 0 THEN (total_sold::DECIMAL / total_capacity) * 100
        ELSE 0 
    END;
    
    result := jsonb_build_object(
        'total_stops', total_stops,
        'total_capacity', total_capacity,
        'tickets_sold', total_sold,
        'occupancy_rate', ROUND(occupancy_rate, 2),
        'total_revenue', total_revenue,
        'total_expenses', total_expenses,
        'net_profit', net_profit,
        'profit_margin', CASE 
            WHEN total_revenue > 0 THEN ROUND((net_profit / total_revenue) * 100, 2)
            ELSE 0 
        END
    );
    
    RETURN result;
END;
$$ language 'plpgsql';

-- Function to get comprehensive tour data
CREATE OR REPLACE FUNCTION get_tour_details(_tour_id UUID)
RETURNS TABLE(
    tour_data JSONB,
    stops_data JSONB,
    participants_data JSONB,
    collaborations_data JSONB,
    logistics_data JSONB,
    statistics JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_jsonb(t.*) as tour_data,
        COALESCE(
            (SELECT jsonb_agg(to_jsonb(ts.*) ORDER BY ts.order_index) 
             FROM public.tour_stops ts 
             WHERE ts.tour_id = _tour_id),
            '[]'::jsonb
        ) as stops_data,
        COALESCE(
            (SELECT jsonb_agg(to_jsonb(tp.*) ORDER BY tp.is_headliner DESC, tp.performance_order) 
             FROM public.tour_participants tp 
             WHERE tp.tour_id = _tour_id),
            '[]'::jsonb
        ) as participants_data,
        COALESCE(
            (SELECT jsonb_agg(to_jsonb(tc.*)) 
             FROM public.tour_collaborations tc 
             WHERE tc.tour_id = _tour_id AND tc.status IN ('confirmed', 'active')),
            '[]'::jsonb
        ) as collaborations_data,
        COALESCE(
            (SELECT jsonb_agg(to_jsonb(tl.*)) 
             FROM public.tour_logistics tl 
             WHERE tl.tour_id = _tour_id 
             ORDER BY tl.start_date, tl.start_time),
            '[]'::jsonb
        ) as logistics_data,
        calculate_tour_statistics(_tour_id) as statistics
    FROM public.tours t
    WHERE t.id = _tour_id;
END;
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT ALL ON public.tours TO authenticated;
GRANT ALL ON public.tour_stops TO authenticated;
GRANT ALL ON public.tour_participants TO authenticated;
GRANT ALL ON public.tour_itinerary TO authenticated;
GRANT ALL ON public.tour_logistics TO authenticated;
GRANT ALL ON public.tour_collaborations TO authenticated;
GRANT ALL ON public.tour_expenses TO authenticated;
GRANT ALL ON public.tour_revenue TO authenticated;

-- Grant service role permissions for integrations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Update existing task templates to include tour-specific tasks
INSERT INTO public.task_template_items (template_id, title, description, priority, due_offset_days, category, order_index) VALUES
((SELECT id FROM public.task_templates WHERE name = 'New Tour Setup'), 'Confirm venue contracts for all tour stops', 'Finalize contracts with all venues on the tour route', 'urgent', -45, 'logistics', 8),
((SELECT id FROM public.task_templates WHERE name = 'New Tour Setup'), 'Coordinate travel logistics between cities', 'Arrange transportation, accommodation, and logistics for multi-city tour', 'high', -35, 'travel', 9),
((SELECT id FROM public.task_templates WHERE name = 'New Tour Setup'), 'Setup tour collaboration agreements', 'Finalize agreements with co-promoters and local partners', 'high', -40, 'administrative', 10),
((SELECT id FROM public.task_templates WHERE name = 'New Tour Setup'), 'Launch tour marketing campaign', 'Begin marketing efforts across all tour cities', 'medium', -25, 'marketing', 11),
((SELECT id FROM public.task_templates WHERE name = 'New Tour Setup'), 'Coordinate participant contracts and payments', 'Finalize contracts with all comedians and crew members', 'high', -30, 'artist_management', 12);