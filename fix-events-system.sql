-- Fix Events System Database Structure
-- This migration fixes column mismatches and adds missing tables

-- 1. Add missing columns to events table if they don't exist
DO $$
BEGIN
    -- Add 'date' column as alias for 'event_date' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'events' 
                   AND column_name = 'date') THEN
        ALTER TABLE public.events ADD COLUMN date DATE GENERATED ALWAYS AS (event_date::DATE) STORED;
    END IF;

    -- Add 'venue_name' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'events' 
                   AND column_name = 'venue_name') THEN
        ALTER TABLE public.events ADD COLUMN venue_name TEXT;
        -- Copy existing venue data to venue_name
        UPDATE public.events SET venue_name = venue WHERE venue_name IS NULL;
    END IF;

    -- Add 'organizer_id' as alias for 'promoter_id' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'events' 
                   AND column_name = 'organizer_id') THEN
        ALTER TABLE public.events ADD COLUMN organizer_id UUID GENERATED ALWAYS AS (promoter_id) STORED;
    END IF;

    -- Add missing columns for event management
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'events' 
                   AND column_name = 'image_url') THEN
        ALTER TABLE public.events ADD COLUMN image_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'events' 
                   AND column_name = 'ticket_url') THEN
        ALTER TABLE public.events ADD COLUMN ticket_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'events' 
                   AND column_name = 'is_template') THEN
        ALTER TABLE public.events ADD COLUMN is_template BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'events' 
                   AND column_name = 'template_name') THEN
        ALTER TABLE public.events ADD COLUMN template_name TEXT;
    END IF;
END $$;

-- 2. Create event_templates table
CREATE TABLE IF NOT EXISTS public.event_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    title TEXT NOT NULL,
    event_description TEXT,
    venue TEXT,
    venue_id UUID REFERENCES public.venues(id),
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    event_type TEXT,
    total_spots INTEGER DEFAULT 10,
    requirements TEXT[],
    banner_url TEXT,
    start_time TIME,
    end_time TIME,
    ticket_price NUMERIC(10,2),
    promoter_id UUID REFERENCES auth.users(id) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create recurring_events table
CREATE TABLE IF NOT EXISTS public.recurring_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.event_templates(id),
    title TEXT NOT NULL,
    recurrence_pattern TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    recurrence_interval INTEGER DEFAULT 1,
    recurrence_days INTEGER[], -- For weekly: 0=Sunday, 1=Monday, etc.
    recurrence_end_date DATE,
    venue TEXT,
    venue_id UUID REFERENCES public.venues(id),
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    start_time TIME NOT NULL,
    end_time TIME,
    promoter_id UUID REFERENCES auth.users(id) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create recurring_event_instances table to track generated events
CREATE TABLE IF NOT EXISTS public.recurring_event_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurring_event_id UUID REFERENCES public.recurring_events(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Fix event_spots table - add missing columns
DO $$
BEGIN
    -- Add confirmation fields if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'event_spots' 
                   AND column_name = 'confirmation_required') THEN
        ALTER TABLE public.event_spots ADD COLUMN confirmation_required BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'event_spots' 
                   AND column_name = 'confirmation_deadline') THEN
        ALTER TABLE public.event_spots ADD COLUMN confirmation_deadline TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'event_spots' 
                   AND column_name = 'confirmation_status') THEN
        ALTER TABLE public.event_spots ADD COLUMN confirmation_status TEXT DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'event_spots' 
                   AND column_name = 'confirmed_at') THEN
        ALTER TABLE public.event_spots ADD COLUMN confirmed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'event_spots' 
                   AND column_name = 'declined_at') THEN
        ALTER TABLE public.event_spots ADD COLUMN declined_at TIMESTAMPTZ;
    END IF;

    -- Rename comedian_id to performer_id if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'event_spots' 
               AND column_name = 'comedian_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'event_spots' 
                       AND column_name = 'performer_id') THEN
        ALTER TABLE public.event_spots RENAME COLUMN comedian_id TO performer_id;
    END IF;
END $$;

-- 6. Create webhook_events table for ticket platform integration
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL, -- 'humanitix', 'eventbrite'
    event_type TEXT NOT NULL,
    event_id TEXT NOT NULL, -- External platform event ID
    local_event_id UUID REFERENCES public.events(id),
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create event_ticket_sync table
CREATE TABLE IF NOT EXISTS public.event_ticket_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) NOT NULL,
    platform TEXT NOT NULL, -- 'humanitix', 'eventbrite'
    external_event_id TEXT NOT NULL,
    last_sync_at TIMESTAMPTZ,
    tickets_sold INTEGER DEFAULT 0,
    total_revenue NUMERIC(10,2) DEFAULT 0,
    sync_status TEXT DEFAULT 'pending',
    sync_error TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, platform)
);

-- 8. Create venues table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    suburb TEXT,
    state TEXT,
    postcode TEXT,
    country TEXT DEFAULT 'Australia',
    capacity INTEGER,
    website TEXT,
    phone TEXT,
    email TEXT,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_templates_promoter_id ON public.event_templates(promoter_id);
CREATE INDEX IF NOT EXISTS idx_event_templates_is_public ON public.event_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_recurring_events_promoter_id ON public.recurring_events(promoter_id);
CREATE INDEX IF NOT EXISTS idx_recurring_events_is_active ON public.recurring_events(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_event_instances_scheduled_date ON public.recurring_event_instances(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_webhook_events_platform ON public.webhook_events(platform);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_event_ticket_sync_event_id ON public.event_ticket_sync(event_id);

-- 10. Enable RLS on new tables
ALTER TABLE public.event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_event_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_ticket_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies for event_templates
CREATE POLICY "Public templates are viewable by all" ON public.event_templates
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can view their own templates" ON public.event_templates
    FOR SELECT USING (auth.uid() = promoter_id);

CREATE POLICY "Users can create their own templates" ON public.event_templates
    FOR INSERT WITH CHECK (auth.uid() = promoter_id);

CREATE POLICY "Users can update their own templates" ON public.event_templates
    FOR UPDATE USING (auth.uid() = promoter_id);

CREATE POLICY "Users can delete their own templates" ON public.event_templates
    FOR DELETE USING (auth.uid() = promoter_id);

-- 12. Create RLS policies for recurring_events
CREATE POLICY "Users can view their own recurring events" ON public.recurring_events
    FOR SELECT USING (auth.uid() = promoter_id);

CREATE POLICY "Users can create their own recurring events" ON public.recurring_events
    FOR INSERT WITH CHECK (auth.uid() = promoter_id);

CREATE POLICY "Users can update their own recurring events" ON public.recurring_events
    FOR UPDATE USING (auth.uid() = promoter_id);

CREATE POLICY "Users can delete their own recurring events" ON public.recurring_events
    FOR DELETE USING (auth.uid() = promoter_id);

-- 13. Create RLS policies for venues
CREATE POLICY "Anyone can view venues" ON public.venues
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage venues" ON public.venues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 14. Create function to generate recurring event instances
CREATE OR REPLACE FUNCTION generate_recurring_event_instances(
    p_recurring_event_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date DATE DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_recurring_event RECORD;
    v_current_date DATE;
    v_end_date DATE;
    v_count INTEGER := 0;
    v_event_id UUID;
BEGIN
    -- Get recurring event details
    SELECT * INTO v_recurring_event
    FROM public.recurring_events
    WHERE id = p_recurring_event_id AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Determine end date
    v_end_date := COALESCE(p_end_date, v_recurring_event.recurrence_end_date, p_start_date + INTERVAL '3 months');
    v_current_date := p_start_date;
    
    -- Generate instances based on pattern
    WHILE v_current_date <= v_end_date LOOP
        -- Check if we should create an event for this date
        IF should_create_recurring_instance(v_recurring_event, v_current_date) THEN
            -- Check if instance already exists
            IF NOT EXISTS (
                SELECT 1 FROM public.recurring_event_instances
                WHERE recurring_event_id = p_recurring_event_id
                AND scheduled_date = v_current_date
            ) THEN
                -- Create the event
                INSERT INTO public.events (
                    title,
                    venue,
                    venue_id,
                    address,
                    city,
                    state,
                    country,
                    event_date,
                    start_time,
                    end_time,
                    promoter_id,
                    status,
                    parent_event_id,
                    series_id
                ) VALUES (
                    v_recurring_event.title,
                    v_recurring_event.venue,
                    v_recurring_event.venue_id,
                    v_recurring_event.address,
                    v_recurring_event.city,
                    v_recurring_event.state,
                    v_recurring_event.country,
                    v_current_date,
                    v_recurring_event.start_time,
                    v_recurring_event.end_time,
                    v_recurring_event.promoter_id,
                    'draft',
                    p_recurring_event_id,
                    p_recurring_event_id
                ) RETURNING id INTO v_event_id;
                
                -- Record the instance
                INSERT INTO public.recurring_event_instances (
                    recurring_event_id,
                    event_id,
                    scheduled_date
                ) VALUES (
                    p_recurring_event_id,
                    v_event_id,
                    v_current_date
                );
                
                v_count := v_count + 1;
            END IF;
        END IF;
        
        -- Increment date based on pattern
        CASE v_recurring_event.recurrence_pattern
            WHEN 'daily' THEN
                v_current_date := v_current_date + (v_recurring_event.recurrence_interval || ' days')::INTERVAL;
            WHEN 'weekly' THEN
                v_current_date := v_current_date + (v_recurring_event.recurrence_interval || ' weeks')::INTERVAL;
            WHEN 'monthly' THEN
                v_current_date := v_current_date + (v_recurring_event.recurrence_interval || ' months')::INTERVAL;
            ELSE
                EXIT; -- Unknown pattern
        END CASE;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 15. Helper function to determine if an instance should be created
CREATE OR REPLACE FUNCTION should_create_recurring_instance(
    p_recurring_event RECORD,
    p_date DATE
) RETURNS BOOLEAN AS $$
BEGIN
    -- For weekly recurrence, check if the day of week matches
    IF p_recurring_event.recurrence_pattern = 'weekly' AND p_recurring_event.recurrence_days IS NOT NULL THEN
        RETURN EXTRACT(DOW FROM p_date)::INTEGER = ANY(p_recurring_event.recurrence_days);
    END IF;
    
    -- For other patterns, always create
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 16. Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_templates_updated_at BEFORE UPDATE ON public.event_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_events_updated_at BEFORE UPDATE ON public.recurring_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON public.venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_ticket_sync_updated_at BEFORE UPDATE ON public.event_ticket_sync
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 17. Add some default venues for testing
INSERT INTO public.venues (name, address, suburb, state, postcode, capacity) VALUES
    ('The Comedy Store', '115 Lang Rd', 'Moore Park', 'NSW', '2021', 200),
    ('The Enmore Theatre', '118-132 Enmore Rd', 'Newtown', 'NSW', '2042', 1700),
    ('Oxford Art Factory', '38-46 Oxford St', 'Darlinghurst', 'NSW', '2010', 350),
    ('The Factory Theatre', '105 Victoria Rd', 'Marrickville', 'NSW', '2204', 700),
    ('Metro Theatre', '624 George St', 'Sydney', 'NSW', '2000', 1500)
ON CONFLICT DO NOTHING;

-- 18. Grant permissions
GRANT ALL ON public.event_templates TO authenticated;
GRANT ALL ON public.recurring_events TO authenticated;
GRANT ALL ON public.recurring_event_instances TO authenticated;
GRANT ALL ON public.webhook_events TO authenticated;
GRANT ALL ON public.event_ticket_sync TO authenticated;
GRANT ALL ON public.venues TO authenticated;