-- Flight Tracking System for Stand Up Sydney Platform
-- Integrates with N8N workflows for real-time flight monitoring

-- Create ENUM types for flight tracking
CREATE TYPE flight_status AS ENUM ('scheduled', 'delayed', 'cancelled', 'boarding', 'departed', 'arrived', 'diverted');
CREATE TYPE update_source AS ENUM ('api', 'manual', 'airline', 'n8n_webhook');
CREATE TYPE notification_preference AS ENUM ('all', 'delays_only', 'cancellations_only', 'none');

-- Main flight bookings table
CREATE TABLE public.flight_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE SET NULL, -- Will reference tours table when created
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    passenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    flight_number TEXT NOT NULL,
    airline TEXT NOT NULL,
    airline_iata_code TEXT, -- 2-letter airline code (e.g., 'AA' for American Airlines)
    departure_airport TEXT NOT NULL, -- IATA code (e.g., 'JFK')
    departure_airport_name TEXT,
    arrival_airport TEXT NOT NULL, -- IATA code (e.g., 'LAX')
    arrival_airport_name TEXT,
    scheduled_departure TIMESTAMPTZ NOT NULL,
    scheduled_arrival TIMESTAMPTZ NOT NULL,
    actual_departure TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    estimated_departure TIMESTAMPTZ, -- Updated by real-time data
    estimated_arrival TIMESTAMPTZ, -- Updated by real-time data
    status flight_status DEFAULT 'scheduled',
    gate TEXT,
    terminal TEXT,
    seat TEXT,
    booking_reference TEXT,
    confirmation_code TEXT,
    ticket_class TEXT, -- Economy, Business, First
    baggage_allowance JSONB DEFAULT '{}', -- Baggage info
    monitoring_enabled BOOLEAN DEFAULT TRUE,
    notification_preferences notification_preference DEFAULT 'all',
    last_status_check TIMESTAMPTZ DEFAULT now(),
    api_data JSONB DEFAULT '{}', -- Raw API response data
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Flight status updates history
CREATE TABLE public.flight_status_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_booking_id UUID REFERENCES public.flight_bookings(id) ON DELETE CASCADE NOT NULL,
    previous_status flight_status,
    new_status flight_status NOT NULL,
    update_type TEXT, -- 'delay', 'gate_change', 'cancellation', 'boarding', 'departure', 'arrival'
    old_value TEXT, -- Previous value (e.g., old gate, old time)
    new_value TEXT, -- New value (e.g., new gate, new time)
    delay_minutes INTEGER, -- For delay updates
    reason TEXT, -- Reason for change (weather, mechanical, etc.)
    update_source update_source DEFAULT 'api',
    api_response JSONB, -- Full API response for debugging
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Flight notifications sent
CREATE TABLE public.flight_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_booking_id UUID REFERENCES public.flight_bookings(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    notification_type TEXT NOT NULL, -- 'delay', 'cancellation', 'gate_change', 'boarding', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_via TEXT[], -- ['email', 'sms', 'push', 'slack']
    sent_at TIMESTAMPTZ DEFAULT now(),
    read_at TIMESTAMPTZ,
    action_taken TEXT, -- User action like 'acknowledged', 'rebooked', etc.
    metadata JSONB DEFAULT '{}'
);

-- Flight API configurations and rate limiting
CREATE TABLE public.flight_api_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL, -- 'flightaware', 'amadeus', 'aviationstack', etc.
    api_key_hash TEXT, -- Hashed API key for security
    endpoint_url TEXT NOT NULL,
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    current_minute_requests INTEGER DEFAULT 0,
    current_hour_requests INTEGER DEFAULT 0,
    last_request_minute TIMESTAMPTZ,
    last_request_hour TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1, -- 1 = highest priority
    success_rate DECIMAL(5,2) DEFAULT 100.00, -- Track API reliability
    average_response_time_ms INTEGER DEFAULT 0,
    last_successful_call TIMESTAMPTZ,
    last_failed_call TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- N8N workflow execution logs
CREATE TABLE public.n8n_flight_workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id TEXT NOT NULL, -- N8N workflow ID
    execution_id TEXT, -- N8N execution ID
    flight_booking_id UUID REFERENCES public.flight_bookings(id) ON DELETE SET NULL,
    workflow_type TEXT NOT NULL, -- 'monitor', 'alert', 'rebooking', 'status_check'
    status TEXT NOT NULL, -- 'running', 'success', 'error', 'cancelled'
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    execution_time_ms INTEGER,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    webhook_url TEXT, -- Webhook URL used
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3
);

-- Flight search cache for frequently requested routes
CREATE TABLE public.flight_search_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_key TEXT NOT NULL, -- Composite key: "JFK-LAX-2025-01-15"
    departure_airport TEXT NOT NULL,
    arrival_airport TEXT NOT NULL,
    departure_date DATE NOT NULL,
    search_results JSONB NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 hour'),
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.flight_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_flight_workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_search_cache ENABLE ROW LEVEL SECURITY;
-- flight_api_config doesn't need RLS as it's system-level

-- RLS Policies for flight_bookings
CREATE POLICY "Users can view their own flight bookings" ON public.flight_bookings FOR SELECT TO authenticated 
USING (passenger_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own flight bookings" ON public.flight_bookings FOR INSERT TO authenticated 
WITH CHECK (passenger_id = auth.uid());

CREATE POLICY "Users can update their own flight bookings" ON public.flight_bookings FOR UPDATE TO authenticated 
USING (passenger_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- System can update flight bookings for real-time data
CREATE POLICY "System can update flight status" ON public.flight_bookings FOR UPDATE
USING (true) WITH CHECK (true);

-- RLS Policies for flight_status_updates
CREATE POLICY "Users can view updates for their flights" ON public.flight_status_updates FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.flight_bookings fb 
        WHERE fb.id = flight_booking_id AND (
            fb.passenger_id = auth.uid() OR
            public.has_role(auth.uid(), 'admin')
        )
    )
);

CREATE POLICY "System can insert flight updates" ON public.flight_status_updates FOR INSERT
WITH CHECK (true);

-- RLS Policies for flight_notifications
CREATE POLICY "Users can view their own flight notifications" ON public.flight_notifications FOR SELECT TO authenticated 
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert flight notifications" ON public.flight_notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update read status" ON public.flight_notifications FOR UPDATE TO authenticated 
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS Policies for N8N workflow logs (admin only)
CREATE POLICY "Admins can view workflow logs" ON public.n8n_flight_workflow_logs FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Flight search cache (public read, system write)
CREATE POLICY "Public can read flight search cache" ON public.flight_search_cache FOR SELECT TO authenticated 
USING (expires_at > now());

CREATE POLICY "System can manage flight search cache" ON public.flight_search_cache FOR ALL
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_flight_bookings_passenger_id ON public.flight_bookings(passenger_id);
CREATE INDEX idx_flight_bookings_flight_number ON public.flight_bookings(flight_number);
CREATE INDEX idx_flight_bookings_departure_date ON public.flight_bookings(DATE(scheduled_departure));
CREATE INDEX idx_flight_bookings_status ON public.flight_bookings(status);
CREATE INDEX idx_flight_bookings_monitoring ON public.flight_bookings(monitoring_enabled) WHERE monitoring_enabled = true;
CREATE INDEX idx_flight_bookings_tour_id ON public.flight_bookings(tour_id) WHERE tour_id IS NOT NULL;
CREATE INDEX idx_flight_bookings_event_id ON public.flight_bookings(event_id) WHERE event_id IS NOT NULL;

CREATE INDEX idx_flight_status_updates_booking_id ON public.flight_status_updates(flight_booking_id);
CREATE INDEX idx_flight_status_updates_created_at ON public.flight_status_updates(created_at);
CREATE INDEX idx_flight_status_updates_type ON public.flight_status_updates(update_type);

CREATE INDEX idx_flight_notifications_user_id ON public.flight_notifications(user_id);
CREATE INDEX idx_flight_notifications_booking_id ON public.flight_notifications(flight_booking_id);
CREATE INDEX idx_flight_notifications_read ON public.flight_notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX idx_flight_notifications_type ON public.flight_notifications(notification_type);

CREATE INDEX idx_n8n_logs_workflow_id ON public.n8n_flight_workflow_logs(workflow_id);
CREATE INDEX idx_n8n_logs_flight_booking ON public.n8n_flight_workflow_logs(flight_booking_id);
CREATE INDEX idx_n8n_logs_status ON public.n8n_flight_workflow_logs(status);
CREATE INDEX idx_n8n_logs_created_at ON public.n8n_flight_workflow_logs(created_at);

CREATE INDEX idx_flight_cache_route_key ON public.flight_search_cache(route_key);
CREATE INDEX idx_flight_cache_expires_at ON public.flight_search_cache(expires_at);

-- Create triggers for updated_at columns
CREATE TRIGGER update_flight_bookings_updated_at 
    BEFORE UPDATE ON public.flight_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flight_api_config_updated_at 
    BEFORE UPDATE ON public.flight_api_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create flight status update when booking is updated
CREATE OR REPLACE FUNCTION create_flight_status_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create update record if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.flight_status_updates (
            flight_booking_id,
            previous_status,
            new_status,
            update_type,
            old_value,
            new_value,
            delay_minutes,
            update_source
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            CASE 
                WHEN NEW.status = 'delayed' THEN 'delay'
                WHEN NEW.status = 'cancelled' THEN 'cancellation'
                WHEN NEW.status = 'boarding' THEN 'boarding'
                WHEN NEW.status = 'departed' THEN 'departure'
                WHEN NEW.status = 'arrived' THEN 'arrival'
                ELSE 'status_change'
            END,
            OLD.status::text,
            NEW.status::text,
            CASE 
                WHEN NEW.status = 'delayed' AND NEW.estimated_departure IS NOT NULL AND OLD.scheduled_departure IS NOT NULL
                THEN EXTRACT(EPOCH FROM (NEW.estimated_departure - OLD.scheduled_departure)) / 60
                ELSE NULL
            END,
            'api'
        );
    END IF;
    
    -- Update last status check timestamp
    NEW.last_status_check = now();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER flight_status_change_trigger 
    BEFORE UPDATE ON public.flight_bookings
    FOR EACH ROW EXECUTE FUNCTION create_flight_status_update();

-- Function to clean up old cache entries
CREATE OR REPLACE FUNCTION cleanup_flight_search_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM public.flight_search_cache 
    WHERE expires_at < now() - INTERVAL '1 day';
END;
$$ language 'plpgsql';

-- Function to update API rate limiting
CREATE OR REPLACE FUNCTION update_api_rate_limit(
    _provider TEXT,
    _endpoint TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    current_minute TIMESTAMPTZ;
    current_hour TIMESTAMPTZ;
    config_record RECORD;
BEGIN
    current_minute = date_trunc('minute', now());
    current_hour = date_trunc('hour', now());
    
    SELECT * INTO config_record 
    FROM public.flight_api_config 
    WHERE provider = _provider AND endpoint_url = _endpoint AND is_active = true
    ORDER BY priority ASC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Reset counters if we're in a new minute/hour
    IF config_record.last_request_minute IS NULL OR config_record.last_request_minute < current_minute THEN
        UPDATE public.flight_api_config 
        SET 
            current_minute_requests = 1,
            last_request_minute = current_minute
        WHERE id = config_record.id;
    ELSE
        UPDATE public.flight_api_config 
        SET current_minute_requests = current_minute_requests + 1
        WHERE id = config_record.id;
    END IF;
    
    IF config_record.last_request_hour IS NULL OR config_record.last_request_hour < current_hour THEN
        UPDATE public.flight_api_config 
        SET 
            current_hour_requests = 1,
            last_request_hour = current_hour
        WHERE id = config_record.id;
    ELSE
        UPDATE public.flight_api_config 
        SET current_hour_requests = current_hour_requests + 1
        WHERE id = config_record.id;
    END IF;
    
    -- Check if we've exceeded rate limits
    SELECT current_minute_requests, current_hour_requests INTO config_record.current_minute_requests, config_record.current_hour_requests
    FROM public.flight_api_config WHERE id = config_record.id;
    
    RETURN (
        config_record.current_minute_requests <= config_record.rate_limit_per_minute AND
        config_record.current_hour_requests <= config_record.rate_limit_per_hour
    );
END;
$$ language 'plpgsql';

-- Function to get next available API endpoint
CREATE OR REPLACE FUNCTION get_available_flight_api(
    _provider TEXT DEFAULT NULL
) RETURNS TABLE(
    provider TEXT,
    endpoint_url TEXT,
    api_key_hash TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fac.provider,
        fac.endpoint_url,
        fac.api_key_hash
    FROM public.flight_api_config fac
    WHERE 
        (_provider IS NULL OR fac.provider = _provider) AND
        fac.is_active = true AND
        fac.current_minute_requests < fac.rate_limit_per_minute AND
        fac.current_hour_requests < fac.rate_limit_per_hour
    ORDER BY fac.priority ASC, fac.success_rate DESC
    LIMIT 1;
END;
$$ language 'plpgsql';

-- Function to trigger N8N workflow
CREATE OR REPLACE FUNCTION trigger_n8n_flight_workflow(
    _workflow_type TEXT,
    _flight_booking_id UUID,
    _input_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.n8n_flight_workflow_logs (
        workflow_id,
        flight_booking_id,
        workflow_type,
        status,
        input_data
    ) VALUES (
        _workflow_type, -- Will be replaced with actual N8N workflow ID
        _flight_booking_id,
        _workflow_type,
        'running',
        _input_data
    ) RETURNING id INTO log_id;
    
    -- Here we would trigger the actual N8N webhook
    -- This is a placeholder for the N8N integration
    
    RETURN log_id;
END;
$$ language 'plpgsql';

-- Insert default API configurations
INSERT INTO public.flight_api_config (provider, endpoint_url, rate_limit_per_minute, rate_limit_per_hour, priority) VALUES
('flightaware', 'https://aeroapi.flightaware.com/aeroapi', 60, 1000, 1),
('aviationstack', 'http://api.aviationstack.com/v1', 100, 1000, 2),
('amadeus', 'https://api.amadeus.com/v1', 30, 500, 3);

-- Schedule cleanup tasks using pg_cron
SELECT cron.schedule(
    'cleanup-flight-cache',
    '0 * * * *', -- Every hour
    'SELECT cleanup_flight_search_cache();'
);

-- Schedule flight monitoring every 5 minutes
SELECT cron.schedule(
    'flight-status-monitoring',
    '*/5 * * * *', -- Every 5 minutes
    $$
    SELECT trigger_n8n_flight_workflow(
        'monitor',
        fb.id,
        jsonb_build_object(
            'flight_number', fb.flight_number,
            'departure_date', fb.scheduled_departure::date,
            'airline', fb.airline
        )
    )
    FROM public.flight_bookings fb
    WHERE 
        fb.monitoring_enabled = true AND
        fb.status IN ('scheduled', 'delayed', 'boarding') AND
        fb.scheduled_departure > now() - INTERVAL '2 hours' AND
        fb.scheduled_departure < now() + INTERVAL '24 hours';
    $$
);

-- Grant necessary permissions
GRANT ALL ON public.flight_bookings TO authenticated;
GRANT ALL ON public.flight_status_updates TO authenticated;
GRANT ALL ON public.flight_notifications TO authenticated;
GRANT SELECT ON public.flight_api_config TO authenticated;
GRANT ALL ON public.n8n_flight_workflow_logs TO authenticated;
GRANT ALL ON public.flight_search_cache TO authenticated;

-- Grant service role permissions for N8N integration
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;