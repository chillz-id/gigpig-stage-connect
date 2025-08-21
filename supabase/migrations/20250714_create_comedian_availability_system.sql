-- Create comedian_availability table for managing availability slots
CREATE TABLE IF NOT EXISTS public.comedian_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comedian_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT true,
    time_start TIME,
    time_end TIME,
    notes TEXT,
    recurring_type VARCHAR(20) DEFAULT 'none' CHECK (recurring_type IN ('none', 'weekly', 'monthly')),
    recurring_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comedian_id, date)
);

-- Create comedian_blocked_dates table for longer unavailable periods
CREATE TABLE IF NOT EXISTS public.comedian_blocked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comedian_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    recurring_type VARCHAR(20) DEFAULT 'none' CHECK (recurring_type IN ('none', 'weekly', 'monthly', 'yearly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create booking_request_responses table for tracking comedian responses
CREATE TABLE IF NOT EXISTS public.booking_request_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_request_id UUID NOT NULL REFERENCES public.booking_requests(id) ON DELETE CASCADE,
    comedian_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    response_type VARCHAR(20) NOT NULL CHECK (response_type IN ('interested', 'accepted', 'declined', 'negotiating')),
    proposed_fee DECIMAL(10, 2),
    counter_offer_notes TEXT,
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'tentative', 'unavailable')),
    response_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_request_id, comedian_id)
);

-- Add indexes for performance
CREATE INDEX idx_comedian_availability_comedian_date ON public.comedian_availability(comedian_id, date);
CREATE INDEX idx_comedian_availability_date ON public.comedian_availability(date);
CREATE INDEX idx_comedian_blocked_dates_comedian ON public.comedian_blocked_dates(comedian_id);
CREATE INDEX idx_comedian_blocked_dates_dates ON public.comedian_blocked_dates(start_date, end_date);
CREATE INDEX idx_booking_responses_request ON public.booking_request_responses(booking_request_id);
CREATE INDEX idx_booking_responses_comedian ON public.booking_request_responses(comedian_id);

-- Enable RLS on all tables
ALTER TABLE public.comedian_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comedian_blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_request_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comedian_availability
-- Comedians can manage their own availability
CREATE POLICY "Comedians can view their own availability" ON public.comedian_availability
    FOR SELECT USING (auth.uid() = comedian_id);

CREATE POLICY "Comedians can insert their own availability" ON public.comedian_availability
    FOR INSERT WITH CHECK (auth.uid() = comedian_id);

CREATE POLICY "Comedians can update their own availability" ON public.comedian_availability
    FOR UPDATE USING (auth.uid() = comedian_id) WITH CHECK (auth.uid() = comedian_id);

CREATE POLICY "Comedians can delete their own availability" ON public.comedian_availability
    FOR DELETE USING (auth.uid() = comedian_id);

-- Public can view availability (for booking requests)
CREATE POLICY "Public can view comedian availability" ON public.comedian_availability
    FOR SELECT USING (true);

-- RLS Policies for comedian_blocked_dates
-- Comedians can manage their own blocked dates
CREATE POLICY "Comedians can view their own blocked dates" ON public.comedian_blocked_dates
    FOR SELECT USING (auth.uid() = comedian_id);

CREATE POLICY "Comedians can insert their own blocked dates" ON public.comedian_blocked_dates
    FOR INSERT WITH CHECK (auth.uid() = comedian_id);

CREATE POLICY "Comedians can update their own blocked dates" ON public.comedian_blocked_dates
    FOR UPDATE USING (auth.uid() = comedian_id) WITH CHECK (auth.uid() = comedian_id);

CREATE POLICY "Comedians can delete their own blocked dates" ON public.comedian_blocked_dates
    FOR DELETE USING (auth.uid() = comedian_id);

-- Public can view blocked dates (for booking requests)
CREATE POLICY "Public can view comedian blocked dates" ON public.comedian_blocked_dates
    FOR SELECT USING (true);

-- RLS Policies for booking_request_responses
-- Comedians can manage their own responses
CREATE POLICY "Comedians can view their own responses" ON public.booking_request_responses
    FOR SELECT USING (auth.uid() = comedian_id);

CREATE POLICY "Comedians can create responses" ON public.booking_request_responses
    FOR INSERT WITH CHECK (auth.uid() = comedian_id);

CREATE POLICY "Comedians can update their own responses" ON public.booking_request_responses
    FOR UPDATE USING (auth.uid() = comedian_id) WITH CHECK (auth.uid() = comedian_id);

-- Request creators can view responses to their requests
CREATE POLICY "Request creators can view responses" ON public.booking_request_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.booking_requests br
            WHERE br.id = booking_request_id
            AND br.requester_id = auth.uid()
        )
    );

-- Update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comedian_availability_updated_at
    BEFORE UPDATE ON public.comedian_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comedian_blocked_dates_updated_at
    BEFORE UPDATE ON public.comedian_blocked_dates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_request_responses_updated_at
    BEFORE UPDATE ON public.booking_request_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add notification triggers for booking responses
CREATE OR REPLACE FUNCTION notify_booking_request_response()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify the requester when a comedian responds
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        link,
        metadata
    )
    SELECT
        br.requester_id,
        'booking_response',
        'New response to your booking request',
        'A comedian has responded to your booking request for ' || br.event_date,
        '/bookings/' || br.id,
        jsonb_build_object(
            'booking_request_id', NEW.booking_request_id,
            'comedian_id', NEW.comedian_id,
            'response_type', NEW.response_type
        )
    FROM public.booking_requests br
    WHERE br.id = NEW.booking_request_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_booking_response_created
    AFTER INSERT ON public.booking_request_responses
    FOR EACH ROW
    EXECUTE FUNCTION notify_booking_request_response();

-- Add columns to booking_requests if they don't exist
ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS event_title TEXT,
ADD COLUMN IF NOT EXISTS event_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS expected_audience_size INTEGER,
ADD COLUMN IF NOT EXISTS performance_duration INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS technical_requirements TEXT,
ADD COLUMN IF NOT EXISTS responded_comedians JSONB DEFAULT '[]'::JSONB;