-- Create N8N webhook trigger for Google Auth Recovery Workflow
-- This migration creates the necessary webhook function and trigger for auth events

-- Enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create function to notify N8N of auth events
CREATE OR REPLACE FUNCTION notify_auth_recovery()
RETURNS trigger AS $$
DECLARE
  webhook_url text;
  response_data text;
BEGIN
  -- Set the webhook URL for N8N
  webhook_url := 'http://localhost:5678/webhook/google-auth-recovery';
  
  -- Only trigger for new user creation
  IF TG_OP = 'INSERT' THEN
    -- Send webhook to N8N with user data
    SELECT INTO response_data
      extensions.http_post(
        webhook_url,
        json_build_object(
          'event_type', 'user.created',
          'user_id', NEW.id,
          'email', NEW.email,
          'user_metadata', NEW.raw_user_meta_data,
          'provider', COALESCE(NEW.app_metadata->>'provider', 'email'),
          'timestamp', NOW(),
          'source', 'supabase_auth_trigger'
        )::text,
        'application/json'
      );
    
    -- Log the webhook call (optional, for debugging)
    INSERT INTO public.webhook_logs (
      event_type,
      user_id,
      webhook_url,
      response_status,
      created_at
    ) VALUES (
      'auth.user_created',
      NEW.id,
      webhook_url,
      COALESCE((response_data::json->>'status_code')::int, 0),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create webhook logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID,
  webhook_url TEXT NOT NULL,
  response_status INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on webhook_logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for webhook logs (admin only)
CREATE POLICY "Webhook logs admin access" ON public.webhook_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create the trigger on auth.users table
DROP TRIGGER IF EXISTS auth_recovery_trigger ON auth.users;
CREATE TRIGGER auth_recovery_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_auth_recovery();

-- Create a function to manually test the webhook
CREATE OR REPLACE FUNCTION test_auth_recovery_webhook(test_user_id UUID DEFAULT gen_random_uuid())
RETURNS json AS $$
DECLARE
  webhook_url text;
  response_data text;
BEGIN
  webhook_url := 'http://localhost:5678/webhook/google-auth-recovery';
  
  SELECT INTO response_data
    extensions.http_post(
      webhook_url,
      json_build_object(
        'event_type', 'user.created',
        'user_id', test_user_id,
        'email', 'test@standupsydney.com',
        'user_metadata', json_build_object(
          'full_name', 'Test User',
          'avatar_url', 'https://example.com/avatar.jpg'
        ),
        'provider', 'google',
        'timestamp', NOW(),
        'source', 'manual_test'
      )::text,
      'application/json'
    );
  
  RETURN json_build_object(
    'webhook_url', webhook_url,
    'test_user_id', test_user_id,
    'response', response_data::json,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION test_auth_recovery_webhook(UUID) TO authenticated;
GRANT SELECT ON public.webhook_logs TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION notify_auth_recovery() IS 'Triggers N8N Google Auth Recovery workflow when new users are created';
COMMENT ON FUNCTION test_auth_recovery_webhook(UUID) IS 'Manual test function for N8N auth recovery webhook';