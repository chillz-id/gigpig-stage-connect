-- Add Spot Confirmation System
-- Adds confirmation workflow for event spots with notification integration

-- Add spot confirmation fields to event_spots table
ALTER TABLE public.event_spots 
ADD COLUMN confirmation_status TEXT DEFAULT 'pending',
ADD COLUMN confirmed_at TIMESTAMPTZ,
ADD COLUMN confirmation_deadline TIMESTAMPTZ;

-- Add check constraint for confirmation_status
ALTER TABLE public.event_spots 
ADD CONSTRAINT event_spots_confirmation_status_check 
CHECK (confirmation_status IN ('pending', 'confirmed', 'declined', 'expired'));

-- Add notification types for spot confirmation
ALTER TYPE notification_type ADD VALUE 'spot_assigned';
ALTER TYPE notification_type ADD VALUE 'spot_confirmed';
ALTER TYPE notification_type ADD VALUE 'spot_declined';

-- Create function to handle spot assignment notifications
CREATE OR REPLACE FUNCTION notify_spot_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify when comedian_id is set (spot assigned) and status is pending
    IF NEW.comedian_id IS NOT NULL AND OLD.comedian_id IS NULL AND NEW.confirmation_status = 'pending' THEN
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            priority,
            data,
            action_url
        ) VALUES (
            NEW.comedian_id,
            'spot_assigned',
            'Spot Assigned',
            'You have been assigned to perform at "' || (
                SELECT title FROM public.events WHERE id = NEW.event_id
            ) || '". Please confirm your availability.',
            'high',
            jsonb_build_object(
                'event_id', NEW.event_id,
                'spot_id', NEW.id,
                'spot_name', NEW.spot_name,
                'confirmation_deadline', NEW.confirmation_deadline
            ),
            '/events/' || NEW.event_id || '/spots/' || NEW.id || '/confirm'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle spot confirmation notifications
CREATE OR REPLACE FUNCTION notify_spot_confirmation()
RETURNS TRIGGER AS $$
DECLARE
    event_promoter_id UUID;
    event_title TEXT;
    comedian_name TEXT;
BEGIN
    -- Only notify when confirmation_status changes from pending
    IF OLD.confirmation_status = 'pending' AND NEW.confirmation_status != 'pending' THEN
        -- Get event promoter and title
        SELECT promoter_id, title INTO event_promoter_id, event_title
        FROM public.events 
        WHERE id = NEW.event_id;
        
        -- Get comedian name
        SELECT COALESCE(stage_name, first_name || ' ' || last_name) INTO comedian_name
        FROM public.profiles 
        WHERE id = NEW.comedian_id;
        
        -- Notify promoter of confirmation status
        IF event_promoter_id IS NOT NULL THEN
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                priority,
                data,
                action_url
            ) VALUES (
                event_promoter_id,
                CASE 
                    WHEN NEW.confirmation_status = 'confirmed' THEN 'spot_confirmed'
                    WHEN NEW.confirmation_status = 'declined' THEN 'spot_declined'
                    ELSE 'spot_declined' -- For expired status
                END,
                CASE 
                    WHEN NEW.confirmation_status = 'confirmed' THEN 'Spot Confirmed'
                    WHEN NEW.confirmation_status = 'declined' THEN 'Spot Declined'
                    ELSE 'Spot Expired'
                END,
                comedian_name || ' has ' || 
                CASE 
                    WHEN NEW.confirmation_status = 'confirmed' THEN 'confirmed'
                    WHEN NEW.confirmation_status = 'declined' THEN 'declined'
                    ELSE 'not responded to'
                END || ' their spot for "' || event_title || '".',
                CASE 
                    WHEN NEW.confirmation_status = 'confirmed' THEN 'medium'
                    ELSE 'high'
                END,
                jsonb_build_object(
                    'event_id', NEW.event_id,
                    'spot_id', NEW.id,
                    'spot_name', NEW.spot_name,
                    'comedian_id', NEW.comedian_id,
                    'comedian_name', comedian_name,
                    'confirmation_status', NEW.confirmation_status
                ),
                '/events/' || NEW.event_id || '/manage'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for spot assignment and confirmation notifications
CREATE TRIGGER trigger_spot_assignment_notification
    AFTER UPDATE ON public.event_spots
    FOR EACH ROW
    EXECUTE FUNCTION notify_spot_assignment();

CREATE TRIGGER trigger_spot_confirmation_notification
    AFTER UPDATE ON public.event_spots
    FOR EACH ROW
    EXECUTE FUNCTION notify_spot_confirmation();

-- Enable RLS on event_spots table if not already enabled
ALTER TABLE public.event_spots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for spot confirmation
-- Users can view spots for events they can access
CREATE POLICY "Users can view event spots" ON public.event_spots FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.events e 
        WHERE e.id = event_id 
        AND (
            e.promoter_id = auth.uid() OR 
            e.status = 'published' OR
            public.has_role(auth.uid(), 'admin')
        )
    )
);

-- Comedians can update their own spot confirmation status
CREATE POLICY "Comedians can update their spot confirmation" ON public.event_spots FOR UPDATE TO authenticated
USING (comedian_id = auth.uid())
WITH CHECK (comedian_id = auth.uid());

-- Promoters can manage spots for their events
CREATE POLICY "Promoters can manage their event spots" ON public.event_spots FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.events e 
        WHERE e.id = event_id 
        AND e.promoter_id = auth.uid()
    )
);

-- Admins can manage all spots
CREATE POLICY "Admins can manage all event spots" ON public.event_spots FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service role can manage all spots
CREATE POLICY "Service role can manage all event spots" ON public.event_spots FOR ALL TO service_role
USING (true);

-- Create indexes for performance
CREATE INDEX idx_event_spots_confirmation_status ON public.event_spots(confirmation_status);
CREATE INDEX idx_event_spots_confirmed_at ON public.event_spots(confirmed_at);
CREATE INDEX idx_event_spots_confirmation_deadline ON public.event_spots(confirmation_deadline) WHERE confirmation_deadline IS NOT NULL;
CREATE INDEX idx_event_spots_comedian_id ON public.event_spots(comedian_id) WHERE comedian_id IS NOT NULL;

-- Create function to check for expired confirmations
CREATE OR REPLACE FUNCTION check_expired_spot_confirmations()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Update spots that have passed their confirmation deadline
    UPDATE public.event_spots 
    SET confirmation_status = 'expired'
    WHERE confirmation_status = 'pending' 
    AND confirmation_deadline IS NOT NULL 
    AND confirmation_deadline < now();
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to confirm spot
CREATE OR REPLACE FUNCTION confirm_spot(_spot_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    spot_record RECORD;
BEGIN
    -- Get spot details
    SELECT * INTO spot_record
    FROM public.event_spots 
    WHERE id = _spot_id AND comedian_id = _user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Spot not found or not assigned to user';
    END IF;
    
    -- Check if spot is still pending
    IF spot_record.confirmation_status != 'pending' THEN
        RAISE EXCEPTION 'Spot is no longer pending confirmation';
    END IF;
    
    -- Check if confirmation deadline has passed
    IF spot_record.confirmation_deadline IS NOT NULL AND spot_record.confirmation_deadline < now() THEN
        RAISE EXCEPTION 'Confirmation deadline has passed';
    END IF;
    
    -- Update spot to confirmed
    UPDATE public.event_spots 
    SET confirmation_status = 'confirmed',
        confirmed_at = now(),
        is_filled = true
    WHERE id = _spot_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decline spot
CREATE OR REPLACE FUNCTION decline_spot(_spot_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    spot_record RECORD;
BEGIN
    -- Get spot details
    SELECT * INTO spot_record
    FROM public.event_spots 
    WHERE id = _spot_id AND comedian_id = _user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Spot not found or not assigned to user';
    END IF;
    
    -- Check if spot is still pending
    IF spot_record.confirmation_status != 'pending' THEN
        RAISE EXCEPTION 'Spot is no longer pending confirmation';
    END IF;
    
    -- Update spot to declined and clear assignment
    UPDATE public.event_spots 
    SET confirmation_status = 'declined',
        comedian_id = NULL,
        is_filled = false
    WHERE id = _spot_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add notification templates for spot confirmation
INSERT INTO public.notification_templates (type, name, title_template, message_template, default_priority, variables, is_system_template) VALUES
('spot_assigned', 'Spot Assigned', 'Spot Assigned: {{event_name}}', 'You have been assigned to perform at "{{event_name}}" on {{event_date}}. Please confirm your availability by {{confirmation_deadline}}.', 'high', ARRAY['event_name', 'event_date', 'confirmation_deadline'], true),
('spot_confirmed', 'Spot Confirmed', 'Spot Confirmed: {{event_name}}', '{{comedian_name}} has confirmed their spot for "{{event_name}}" on {{event_date}}.', 'medium', ARRAY['comedian_name', 'event_name', 'event_date'], true),
('spot_declined', 'Spot Declined', 'Spot Declined: {{event_name}}', '{{comedian_name}} has declined their spot for "{{event_name}}" on {{event_date}}. You may need to find a replacement.', 'high', ARRAY['comedian_name', 'event_name', 'event_date'], true);

-- Grant necessary permissions
GRANT ALL ON public.event_spots TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_spot(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_spot(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_expired_spot_confirmations() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_spot_assignment() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_spot_confirmation() TO authenticated;

-- Grant service role permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;