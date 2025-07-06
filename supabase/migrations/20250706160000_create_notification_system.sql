-- Unified Notification System
-- Creates comprehensive notification infrastructure with real-time capabilities

-- Create notification types enum
CREATE TYPE notification_type AS ENUM (
    'tour_created', 'tour_updated', 'tour_cancelled',
    'collaboration_invite', 'collaboration_accepted', 'collaboration_declined',
    'task_assigned', 'task_due_soon', 'task_overdue', 'task_completed',
    'flight_delayed', 'flight_cancelled', 'flight_boarding',
    'event_booking', 'event_cancelled',
    'payment_received', 'payment_due',
    'system_update', 'general'
);

-- Create notification priority enum
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Main notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority notification_priority DEFAULT 'medium',
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    action_label TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    read_at TIMESTAMPTZ
);

-- Notification preferences table
CREATE TABLE public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    notification_types JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notification templates table for consistent messaging
CREATE TABLE public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type notification_type NOT NULL,
    name TEXT NOT NULL,
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    default_priority notification_priority DEFAULT 'medium',
    variables TEXT[] DEFAULT '{}',
    is_system_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(type, name)
);

-- Notification delivery log for tracking
CREATE TABLE public.notification_delivery_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE NOT NULL,
    delivery_method TEXT NOT NULL, -- 'push', 'email', 'sms'
    status TEXT NOT NULL, -- 'pending', 'sent', 'delivered', 'failed'
    attempted_at TIMESTAMPTZ DEFAULT now(),
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

-- Enable RLS on all tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage notifications" ON public.notifications FOR ALL TO service_role 
USING (true);

CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for notification preferences
CREATE POLICY "Users can manage their own preferences" ON public.notification_preferences FOR ALL TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all preferences" ON public.notification_preferences FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for notification templates
CREATE POLICY "All users can view templates" ON public.notification_templates FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Admins can manage templates" ON public.notification_templates FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for delivery log
CREATE POLICY "Users can view their delivery logs" ON public.notification_delivery_log FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.notifications n 
        WHERE n.id = notification_id AND n.user_id = auth.uid()
    )
);

CREATE POLICY "Service role can manage delivery logs" ON public.notification_delivery_log FOR ALL TO service_role 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_read ON public.notifications(read) WHERE read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_expires_at ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_notifications_priority ON public.notifications(priority);

CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);

CREATE INDEX idx_notification_templates_type ON public.notification_templates(type);
CREATE INDEX idx_notification_templates_system ON public.notification_templates(is_system_template) WHERE is_system_template = true;

CREATE INDEX idx_notification_delivery_status ON public.notification_delivery_log(status);
CREATE INDEX idx_notification_delivery_method ON public.notification_delivery_log(delivery_method);

-- Create triggers for updated_at columns
CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON public.notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.notifications 
        WHERE user_id = _user_id AND read = false
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.notifications 
    SET read = true, read_at = now()
    WHERE user_id = _user_id AND read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to cleanup expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.notifications 
    WHERE expires_at IS NOT NULL AND expires_at < now();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to create notification from template
CREATE OR REPLACE FUNCTION create_notification_from_template(
    _template_name TEXT,
    _user_id UUID,
    _variables JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    template_record RECORD;
    notification_id UUID;
    final_title TEXT;
    final_message TEXT;
    var_key TEXT;
    var_value TEXT;
BEGIN
    -- Get template
    SELECT * INTO template_record
    FROM public.notification_templates 
    WHERE name = _template_name
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Notification template not found: %', _template_name;
    END IF;
    
    -- Start with template text
    final_title := template_record.title_template;
    final_message := template_record.message_template;
    
    -- Replace variables
    FOR var_key, var_value IN SELECT * FROM jsonb_each_text(_variables)
    LOOP
        final_title := REPLACE(final_title, '{{' || var_key || '}}', var_value);
        final_message := REPLACE(final_message, '{{' || var_key || '}}', var_value);
    END LOOP;
    
    -- Create notification
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        priority,
        data
    ) VALUES (
        _user_id,
        template_record.type,
        final_title,
        final_message,
        template_record.default_priority,
        _variables
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Insert default notification templates
INSERT INTO public.notification_templates (type, name, title_template, message_template, default_priority, variables, is_system_template) VALUES
-- Tour notifications
('tour_created', 'Tour Created', 'Tour "{{tour_name}}" Created', 'Your tour "{{tour_name}}" has been created successfully and is ready for planning.', 'medium', ARRAY['tour_name'], true),
('tour_updated', 'Tour Updated', 'Tour "{{tour_name}}" Updated', 'Tour "{{tour_name}}" has been updated. Check the latest changes.', 'low', ARRAY['tour_name'], true),
('tour_cancelled', 'Tour Cancelled', 'Tour "{{tour_name}}" Cancelled', 'Tour "{{tour_name}}" has been cancelled. All participants have been notified.', 'high', ARRAY['tour_name'], true),

-- Collaboration notifications
('collaboration_invite', 'Collaboration Invite', 'Tour Collaboration Invitation', 'You have been invited to collaborate on "{{tour_name}}" as a {{role}}.', 'high', ARRAY['tour_name', 'role'], true),
('collaboration_accepted', 'Collaboration Accepted', 'Collaboration Accepted', '{{collaborator_name}} has accepted the collaboration invitation for "{{tour_name}}".', 'medium', ARRAY['collaborator_name', 'tour_name'], true),
('collaboration_declined', 'Collaboration Declined', 'Collaboration Declined', '{{collaborator_name}} has declined the collaboration invitation for "{{tour_name}}".', 'medium', ARRAY['collaborator_name', 'tour_name'], true),

-- Task notifications
('task_assigned', 'Task Assigned', 'New Task Assigned', 'You have been assigned a new task: "{{task_title}}".', 'medium', ARRAY['task_title'], true),
('task_due_soon', 'Task Due Soon', 'Task Due Soon', 'Task "{{task_title}}" is due on {{due_date}}.', 'medium', ARRAY['task_title', 'due_date'], true),
('task_overdue', 'Task Overdue', 'Task Overdue', 'Task "{{task_title}}" was due on {{due_date}} and is now overdue.', 'high', ARRAY['task_title', 'due_date'], true),
('task_completed', 'Task Completed', 'Task Completed', 'Task "{{task_title}}" has been marked as completed.', 'low', ARRAY['task_title'], true),

-- Flight notifications
('flight_delayed', 'Flight Delayed', 'Flight {{flight_number}} Delayed', 'Your flight {{flight_number}} is delayed by {{delay}} minutes. New departure: {{new_time}}.', 'urgent', ARRAY['flight_number', 'delay', 'new_time'], true),
('flight_cancelled', 'Flight Cancelled', 'Flight {{flight_number}} Cancelled', 'Your flight {{flight_number}} has been cancelled. Please contact your airline for rebooking.', 'urgent', ARRAY['flight_number'], true),
('flight_boarding', 'Flight Boarding', 'Flight {{flight_number}} Boarding', 'Your flight {{flight_number}} is now boarding at gate {{gate}}.', 'high', ARRAY['flight_number', 'gate'], true),

-- Event notifications
('event_booking', 'Event Booking', 'New Event Booking', 'You have a new booking for "{{event_name}}" on {{event_date}}.', 'medium', ARRAY['event_name', 'event_date'], true),
('event_cancelled', 'Event Cancelled', 'Event Cancelled', 'Event "{{event_name}}" scheduled for {{event_date}} has been cancelled.', 'high', ARRAY['event_name', 'event_date'], true),

-- Payment notifications
('payment_received', 'Payment Received', 'Payment Received', 'Payment of {{amount}} has been received for "{{description}}".', 'medium', ARRAY['amount', 'description'], true),
('payment_due', 'Payment Due', 'Payment Due', 'Payment of {{amount}} for "{{description}}" is due on {{due_date}}.', 'high', ARRAY['amount', 'description', 'due_date'], true),

-- System notifications
('system_update', 'System Update', 'System Update Available', 'A new system update is available with improved features and bug fixes.', 'low', ARRAY[], true),
('general', 'General Notification', '{{title}}', '{{message}}', 'medium', ARRAY['title', 'message'], true);

-- Grant necessary permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_delivery_log TO authenticated;

-- Grant service role permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Enable real-time subscriptions for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;