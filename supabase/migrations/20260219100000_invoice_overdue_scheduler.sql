-- Invoice Overdue Scheduler
-- Automatically marks invoices as overdue at midnight and notifies users at 10am local time

-- Add timezone to profiles for local time calculations
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Australia/Sydney';

-- Add display_after to notifications for scheduled display
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS display_after TIMESTAMPTZ;

-- Create index for efficient querying of scheduled notifications
CREATE INDEX IF NOT EXISTS idx_notifications_display_after
ON public.notifications(display_after)
WHERE display_after IS NOT NULL;

-- Add invoice_overdue to notification_type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'invoice_overdue' AND enumtypid = 'notification_type'::regtype) THEN
        ALTER TYPE notification_type ADD VALUE 'invoice_overdue';
    END IF;
END $$;

-- Add notification template for invoice overdue
INSERT INTO public.notification_templates (type, name, title_template, message_template, default_priority, variables, is_system_template)
VALUES (
    'invoice_overdue',
    'Invoice Overdue',
    'Invoice #{{invoice_number}} is overdue',
    'Invoice #{{invoice_number}} for {{client_name}} ({{amount}}) was due on {{due_date}} and is now overdue.',
    'high',
    ARRAY['invoice_number', 'client_name', 'amount', 'due_date'],
    true
) ON CONFLICT (type, name) DO NOTHING;

-- Function to mark overdue invoices and create notifications
CREATE OR REPLACE FUNCTION process_overdue_invoices()
RETURNS void AS $$
DECLARE
    invoice_record RECORD;
    user_timezone TEXT;
    notification_time TIMESTAMPTZ;
BEGIN
    -- Find all invoices that are past due and not already overdue/paid/cancelled
    FOR invoice_record IN
        SELECT
            i.id,
            i.invoice_number,
            i.user_id,
            i.due_date,
            i.total,
            i.currency,
            ir.recipient_name as client_name,
            p.timezone
        FROM invoices i
        LEFT JOIN invoice_recipients ir ON ir.invoice_id = i.id
        LEFT JOIN profiles p ON p.id = i.user_id
        WHERE i.status = 'sent'
        AND i.due_date < CURRENT_DATE
    LOOP
        -- Update invoice status to overdue
        UPDATE invoices
        SET status = 'overdue', updated_at = now()
        WHERE id = invoice_record.id;

        -- Calculate 10am in user's timezone for today (or tomorrow if already past 10am)
        user_timezone := COALESCE(invoice_record.timezone, 'Australia/Sydney');

        -- Get 10am today in user's timezone, converted to UTC
        notification_time := (
            (CURRENT_DATE AT TIME ZONE user_timezone) + INTERVAL '10 hours'
        ) AT TIME ZONE user_timezone;

        -- If 10am has already passed today, schedule for tomorrow
        IF notification_time < now() THEN
            notification_time := notification_time + INTERVAL '1 day';
        END IF;

        -- Create notification scheduled for 10am local time
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            priority,
            data,
            action_url,
            action_label,
            display_after
        ) VALUES (
            invoice_record.user_id,
            'invoice_overdue',
            'Invoice #' || invoice_record.invoice_number || ' is overdue',
            'Invoice #' || invoice_record.invoice_number ||
                ' for ' || COALESCE(invoice_record.client_name, 'a client') ||
                ' (' || invoice_record.currency || ' ' || invoice_record.total::TEXT ||
                ') was due on ' || to_char(invoice_record.due_date, 'DD Mon YYYY') ||
                ' and is now overdue.',
            'high',
            jsonb_build_object(
                'invoice_id', invoice_record.id,
                'invoice_number', invoice_record.invoice_number,
                'due_date', invoice_record.due_date,
                'amount', invoice_record.total,
                'currency', invoice_record.currency
            ),
            '/invoices/' || invoice_record.id,
            'View Invoice',
            notification_time
        );

        RAISE NOTICE 'Marked invoice % as overdue, notification scheduled for %',
            invoice_record.invoice_number, notification_time;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the job to run at midnight UTC daily
-- Note: pg_cron uses UTC, so this runs at midnight UTC
-- For Australian users (AEST/AEDT), this is around 10am-11am local time
-- Adjusting to run at 14:00 UTC which is midnight AEST (UTC+10)
SELECT cron.schedule(
    'process-overdue-invoices',
    '0 14 * * *',  -- 14:00 UTC = midnight AEST
    'SELECT process_overdue_invoices()'
);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_overdue_invoices() TO service_role;

-- Add comment
COMMENT ON FUNCTION process_overdue_invoices() IS
'Runs daily at midnight AEST to mark sent invoices as overdue and create in-app notifications scheduled for 10am user local time.';
