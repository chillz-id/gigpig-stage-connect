-- Add spot-related notification types to the enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'spot_assigned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'spot_confirmed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'spot_declined';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'spot_expired';

-- Insert notification templates for spot assignments
INSERT INTO public.notification_templates (type, name, title_template, message_template, default_priority, variables, is_system_template) VALUES
-- Spot assignment notifications
('spot_assigned', 'Spot Assigned', 'Spot Assignment: {{event_name}}', 'You have been assigned a {{spot_type}} spot for "{{event_name}}" on {{event_date}}. Please confirm your availability by {{deadline}}.', 'high', ARRAY['event_name', 'spot_type', 'event_date', 'deadline'], true),
('spot_confirmed', 'Spot Confirmed', 'Spot Confirmed: {{event_name}}', '{{comedian_name}} has confirmed their {{spot_type}} spot for "{{event_name}}" on {{event_date}}.', 'medium', ARRAY['comedian_name', 'spot_type', 'event_name', 'event_date'], true),
('spot_declined', 'Spot Declined', 'Spot Declined: {{event_name}}', '{{comedian_name}} has declined their {{spot_type}} spot for "{{event_name}}" on {{event_date}}.', 'medium', ARRAY['comedian_name', 'spot_type', 'event_name', 'event_date'], true),
('spot_expired', 'Spot Expired', 'Spot Assignment Expired: {{event_name}}', 'Your {{spot_type}} spot assignment for "{{event_name}}" on {{event_date}} has expired due to no response by the deadline.', 'high', ARRAY['spot_type', 'event_name', 'event_date'], true)

ON CONFLICT (type, name) DO UPDATE SET
  title_template = EXCLUDED.title_template,
  message_template = EXCLUDED.message_template,
  default_priority = EXCLUDED.default_priority,
  variables = EXCLUDED.variables,
  updated_at = now();