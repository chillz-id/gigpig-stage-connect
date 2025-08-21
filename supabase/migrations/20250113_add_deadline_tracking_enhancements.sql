-- Add deadline tracking enhancements
-- Adds fields for reminder tracking, email/SMS queues, and audit logging

-- Add confirmation_reminder_sent field to track which reminders have been sent
ALTER TABLE public.event_spots 
ADD COLUMN IF NOT EXISTS confirmation_reminder_sent JSONB DEFAULT '{}';

-- Create email queue table for automated emails
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    to_email TEXT NOT NULL,
    cc_email TEXT,
    bcc_email TEXT,
    subject TEXT,
    template_id TEXT NOT NULL,
    template_data JSONB DEFAULT '{}',
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    scheduled_for TIMESTAMPTZ DEFAULT now(),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create SMS queue table for automated SMS
CREATE TABLE IF NOT EXISTS public.sms_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    to_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    scheduled_for TIMESTAMPTZ DEFAULT now(),
    sent_at TIMESTAMPTZ,
    provider TEXT DEFAULT 'twilio',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create audit logs table for tracking changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create tasks table for reassignment workflow
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.profiles(id),
    assigned_by UUID REFERENCES public.profiles(id),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    category TEXT,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add notification types if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'general', 'event_created', 'event_updated', 'event_cancelled',
            'application_submitted', 'application_approved', 'application_rejected',
            'spot_assigned', 'spot_confirmed', 'spot_declined', 'spot_expired',
            'deadline_reminder', 'deadline_extended', 'payment_received'
        );
    ELSE
        -- Add new types if they don't exist
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'spot_expired';
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'deadline_reminder';
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'deadline_extended';
    END IF;
END $$;

-- Create notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type notification_type NOT NULL,
    name TEXT NOT NULL UNIQUE,
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    email_subject_template TEXT,
    email_body_template TEXT,
    sms_template TEXT,
    default_priority TEXT DEFAULT 'medium',
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_system_template BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert deadline reminder templates
INSERT INTO public.notification_templates (type, name, title_template, message_template, email_subject_template, email_body_template, sms_template, default_priority, variables, is_system_template) VALUES
('deadline_reminder', 'deadline_24h', 'Confirmation Reminder: {{event_name}}', 'Your {{spot_type}} spot for "{{event_name}}" needs confirmation within 24 hours (by {{deadline}}).', 'Action Required: Confirm Your Spot for {{event_name}}', 'Hi {{comedian_name}},\n\nThis is a reminder that you need to confirm your {{spot_type}} spot for "{{event_name}}" on {{event_date}} at {{event_time}} at {{venue}}.\n\nDeadline: {{deadline}} ({{hours_remaining}} hours remaining)\n\nPlease confirm your availability: {{confirmation_url}}\n\nBest regards,\nStand Up Sydney', 'Stand Up Sydney: Confirm your {{spot_type}} spot for "{{event_name}}" by {{deadline}}. {{confirmation_url}}', 'medium', ARRAY['comedian_name', 'event_name', 'event_date', 'event_time', 'venue', 'spot_type', 'deadline', 'hours_remaining', 'confirmation_url'], true),
('deadline_reminder', 'deadline_6h', 'Urgent: Confirmation Required', 'URGENT: Your {{spot_type}} spot for "{{event_name}}" expires in {{hours_remaining}} hours!', 'URGENT: {{hours_remaining}} Hours to Confirm Your Spot', 'Hi {{comedian_name}},\n\nURGENT: You have only {{hours_remaining}} hours left to confirm your {{spot_type}} spot for "{{event_name}}"!\n\nEvent: {{event_name}}\nDate: {{event_date}}\nTime: {{event_time}}\nVenue: {{venue}}\nDeadline: {{deadline}}\n\nConfirm now: {{confirmation_url}}\n\nIf you do not confirm by the deadline, your spot will be released to another comedian.\n\nBest regards,\nStand Up Sydney', 'URGENT: {{hours_remaining}}h left to confirm your spot for "{{event_name}}". Confirm: {{confirmation_url}}', 'high', ARRAY['comedian_name', 'event_name', 'event_date', 'event_time', 'venue', 'spot_type', 'deadline', 'hours_remaining', 'confirmation_url'], true),
('deadline_reminder', 'deadline_1h', 'Final Notice: Spot Expiring Soon', 'FINAL NOTICE: Your {{spot_type}} spot expires in 1 HOUR!', 'FINAL NOTICE: 1 Hour to Confirm Your Spot', 'Hi {{comedian_name}},\n\nFINAL NOTICE: Your {{spot_type}} spot for "{{event_name}}" will expire in 1 HOUR!\n\nThis is your last chance to confirm your participation.\n\nEvent: {{event_name}}\nDate: {{event_date}}\nTime: {{event_time}}\nVenue: {{venue}}\n\nCONFIRM NOW: {{confirmation_url}}\n\nAfter the deadline, this spot will be automatically released.\n\nBest regards,\nStand Up Sydney', 'FINAL: 1hr to confirm "{{event_name}}". Act now: {{confirmation_url}}', 'high', ARRAY['comedian_name', 'event_name', 'event_date', 'event_time', 'venue', 'spot_type', 'confirmation_url'], true),
('spot_expired', 'spot_expired_comedian', 'Spot Assignment Expired', 'Your {{spot_type}} spot for "{{event_name}}" has expired due to no response.', 'Spot Assignment Expired: {{event_name}}', 'Hi {{comedian_name}},\n\nUnfortunately, your {{spot_type}} spot assignment for "{{event_name}}" on {{event_date}} has expired because we did not receive your confirmation by the deadline.\n\nThe spot has been released and may be assigned to another comedian.\n\nIf you are still interested in performing at future events, please make sure to respond to spot assignments promptly.\n\nBest regards,\nStand Up Sydney', NULL, 'high', ARRAY['comedian_name', 'event_name', 'event_date', 'spot_type'], true),
('spot_expired', 'spot_expired_promoter', 'Spot Expired - Reassignment Needed', '{{comedian_name}} did not confirm their {{spot_type}} spot. Reassignment needed.', 'Action Required: Spot Expired for {{event_name}}', 'Hi,\n\n{{comedian_name}} did not confirm their {{spot_type}} spot for "{{event_name}}" by the deadline.\n\nThe spot has been automatically released and is now available for reassignment.\n\nEvent: {{event_name}}\nDate: {{event_date}}\nSpot Type: {{spot_type}}\nPrevious Assignee: {{comedian_name}}\n\nPlease assign a new comedian to this spot as soon as possible.\n\nManage event: {{manage_url}}\n\nBest regards,\nStand Up Sydney', NULL, 'high', ARRAY['comedian_name', 'event_name', 'event_date', 'spot_type', 'manage_url'], true),
('deadline_extended', 'deadline_extended', 'Deadline Extended', 'Your confirmation deadline has been extended to {{new_deadline}}.', 'Good News: Deadline Extended for {{event_name}}', 'Hi {{comedian_name}},\n\nGood news! The confirmation deadline for your {{spot_type}} spot at "{{event_name}}" has been extended.\n\nNew Deadline: {{new_deadline}}\n{{#if reason}}Reason: {{reason}}{{/if}}\n\nEvent Details:\n- Event: {{event_name}}\n- Date: {{event_date}}\n- Time: {{event_time}}\n- Venue: {{venue}}\n\nPlease confirm your availability by the new deadline: {{confirmation_url}}\n\nBest regards,\nStand Up Sydney', 'Deadline extended to {{new_deadline}} for "{{event_name}}". Confirm: {{confirmation_url}}', 'high', ARRAY['comedian_name', 'event_name', 'event_date', 'event_time', 'venue', 'spot_type', 'new_deadline', 'reason', 'confirmation_url'], true)
ON CONFLICT (name) DO NOTHING;

-- Create function to send deadline reminders
CREATE OR REPLACE FUNCTION send_deadline_reminder(
    p_spot_id UUID,
    p_hours_before INTEGER,
    p_template_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_spot RECORD;
    v_template RECORD;
    v_deadline_time TIMESTAMP;
    v_hours_remaining INTEGER;
BEGIN
    -- Get spot details
    SELECT 
        es.*,
        e.title as event_title,
        e.event_date,
        e.start_time as event_time,
        e.venue,
        p.email as comedian_email,
        p.phone as comedian_phone,
        COALESCE(p.stage_name, p.first_name || ' ' || p.last_name) as comedian_name
    INTO v_spot
    FROM public.event_spots es
    JOIN public.events e ON es.event_id = e.id
    JOIN public.profiles p ON es.comedian_id = p.id
    WHERE es.id = p_spot_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Get template
    SELECT * INTO v_template
    FROM public.notification_templates
    WHERE name = p_template_name;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate hours remaining
    v_deadline_time := v_spot.confirmation_deadline;
    v_hours_remaining := EXTRACT(EPOCH FROM (v_deadline_time - now())) / 3600;
    
    -- Create notification
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        priority,
        data,
        action_url,
        action_label
    ) VALUES (
        v_spot.comedian_id,
        'deadline_reminder',
        REPLACE(REPLACE(v_template.title_template, '{{event_name}}', v_spot.event_title), '{{hours_remaining}}', v_hours_remaining::TEXT),
        REPLACE(REPLACE(REPLACE(v_template.message_template, '{{event_name}}', v_spot.event_title), '{{spot_type}}', v_spot.spot_name), '{{hours_remaining}}', v_hours_remaining::TEXT),
        v_template.default_priority::notification_priority,
        jsonb_build_object(
            'event_id', v_spot.event_id,
            'spot_id', v_spot.id,
            'deadline', v_deadline_time,
            'hours_remaining', v_hours_remaining,
            'reminder_type', p_template_name
        ),
        '/events/' || v_spot.event_id || '/spots/' || v_spot.id || '/confirm',
        'Confirm Now'
    );
    
    -- Queue email if template has email content
    IF v_template.email_subject_template IS NOT NULL AND v_spot.comedian_email IS NOT NULL THEN
        INSERT INTO public.email_queue (
            to_email,
            template_id,
            template_data,
            priority,
            scheduled_for
        ) VALUES (
            v_spot.comedian_email,
            p_template_name,
            jsonb_build_object(
                'comedian_name', v_spot.comedian_name,
                'event_name', v_spot.event_title,
                'event_date', to_char(v_spot.event_date, 'DD Mon YYYY'),
                'event_time', v_spot.event_time,
                'venue', v_spot.venue,
                'spot_type', v_spot.spot_name,
                'deadline', to_char(v_deadline_time, 'DD Mon YYYY HH24:MI'),
                'hours_remaining', v_hours_remaining,
                'confirmation_url', current_setting('app.url') || '/events/' || v_spot.event_id || '/spots/' || v_spot.id || '/confirm'
            ),
            v_template.default_priority,
            now()
        );
    END IF;
    
    -- Queue SMS if template has SMS content and phone number exists
    IF v_template.sms_template IS NOT NULL AND v_spot.comedian_phone IS NOT NULL THEN
        INSERT INTO public.sms_queue (
            to_phone,
            message,
            priority,
            scheduled_for
        ) VALUES (
            v_spot.comedian_phone,
            SUBSTRING(
                REPLACE(REPLACE(REPLACE(v_template.sms_template, 
                    '{{event_name}}', v_spot.event_title),
                    '{{spot_type}}', v_spot.spot_name),
                    '{{confirmation_url}}', current_setting('app.url') || '/c/' || v_spot.id
                ), 1, 160
            ),
            v_template.default_priority,
            now()
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process email queue
CREATE OR REPLACE FUNCTION process_email_queue() RETURNS INTEGER AS $$
DECLARE
    v_processed INTEGER := 0;
    v_email RECORD;
BEGIN
    -- Get pending emails that are scheduled
    FOR v_email IN
        SELECT * FROM public.email_queue
        WHERE status = 'pending'
        AND scheduled_for <= now()
        ORDER BY priority DESC, created_at ASC
        LIMIT 10
    LOOP
        -- Mark as processing
        UPDATE public.email_queue
        SET status = 'processing', updated_at = now()
        WHERE id = v_email.id;
        
        -- Here you would integrate with your email service
        -- For now, we'll just mark as sent
        UPDATE public.email_queue
        SET status = 'sent', sent_at = now(), updated_at = now()
        WHERE id = v_email.id;
        
        v_processed := v_processed + 1;
    END LOOP;
    
    RETURN v_processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process SMS queue
CREATE OR REPLACE FUNCTION process_sms_queue() RETURNS INTEGER AS $$
DECLARE
    v_processed INTEGER := 0;
    v_sms RECORD;
BEGIN
    -- Get pending SMS that are scheduled
    FOR v_sms IN
        SELECT * FROM public.sms_queue
        WHERE status = 'pending'
        AND scheduled_for <= now()
        ORDER BY priority DESC, created_at ASC
        LIMIT 10
    LOOP
        -- Mark as processing
        UPDATE public.sms_queue
        SET status = 'processing', updated_at = now()
        WHERE id = v_sms.id;
        
        -- Here you would integrate with your SMS service
        -- For now, we'll just mark as sent
        UPDATE public.sms_queue
        SET status = 'sent', sent_at = now(), updated_at = now()
        WHERE id = v_sms.id;
        
        v_processed := v_processed + 1;
    END LOOP;
    
    RETURN v_processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON public.email_queue(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_sms_queue_status_scheduled ON public.sms_queue(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_status ON public.tasks(assigned_to, status) WHERE status != 'completed';
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_event_spots_reminder_sent ON public.event_spots(confirmation_reminder_sent) WHERE confirmation_status = 'pending';

-- Enable RLS on new tables
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email queue (service role only)
CREATE POLICY "Service role can manage email queue" ON public.email_queue
    FOR ALL TO service_role USING (true);

-- Create RLS policies for SMS queue (service role only)
CREATE POLICY "Service role can manage SMS queue" ON public.sms_queue
    FOR ALL TO service_role USING (true);

-- Create RLS policies for audit logs
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage audit logs" ON public.audit_logs
    FOR ALL TO service_role USING (true);

-- Create RLS policies for tasks
CREATE POLICY "Users can view their assigned tasks" ON public.tasks
    FOR SELECT TO authenticated USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Users can update their assigned tasks" ON public.tasks
    FOR UPDATE TO authenticated USING (assigned_to = auth.uid())
    WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Promoters can create tasks" ON public.tasks
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(auth.uid(), 'promoter') OR 
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Admins can manage all tasks" ON public.tasks
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Grant necessary permissions
GRANT ALL ON public.email_queue TO service_role;
GRANT ALL ON public.sms_queue TO service_role;
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.notification_templates TO authenticated;

GRANT EXECUTE ON FUNCTION send_deadline_reminder(UUID, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION process_email_queue() TO service_role;
GRANT EXECUTE ON FUNCTION process_sms_queue() TO service_role;

-- Add comment
COMMENT ON TABLE public.email_queue IS 'Queue for automated email sending with retry logic';
COMMENT ON TABLE public.sms_queue IS 'Queue for automated SMS sending with retry logic';
COMMENT ON TABLE public.audit_logs IS 'Audit trail for important user actions';
COMMENT ON TABLE public.tasks IS 'Task management for promoters and admins';
COMMENT ON TABLE public.notification_templates IS 'Templates for various notification types';