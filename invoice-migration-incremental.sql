-- Incremental Invoice Migration - Only adds missing components
-- Run the check-invoice-tables.sql first to see what already exists

-- =====================================
-- IMPORTANT: RUN THIS FIRST
-- =====================================
-- Before running this migration, execute check-invoice-tables.sql to see what already exists in your database

-- =====================================
-- ADD MISSING COLUMNS SAFELY
-- =====================================

-- Add missing columns to invoices table if they don't exist
DO $$ 
BEGIN
  -- Check and add xero_invoice_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'xero_invoice_id'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN xero_invoice_id TEXT;
    RAISE NOTICE 'Added column: invoices.xero_invoice_id';
  END IF;
  
  -- Check and add last_synced_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN last_synced_at TIMESTAMPTZ;
    RAISE NOTICE 'Added column: invoices.last_synced_at';
  END IF;
  
  -- Check and add paid_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN paid_at TIMESTAMPTZ;
    RAISE NOTICE 'Added column: invoices.paid_at';
  END IF;
  
  -- Check and add created_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN created_by UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Added column: invoices.created_by';
  END IF;
END $$;

-- =====================================
-- CREATE ONLY MISSING TABLES
-- =====================================

-- Create xero_integrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.xero_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tenant_id TEXT NOT NULL,
  tenant_name TEXT,
  organization_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- Create xero_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.xero_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  tenant_id TEXT NOT NULL,
  scopes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create xero_invoices table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.xero_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  xero_invoice_id TEXT NOT NULL,
  xero_invoice_number TEXT,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
  last_sync_error TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(invoice_id),
  UNIQUE(xero_invoice_id)
);

-- Create xero_contacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.xero_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id),
  xero_contact_id TEXT NOT NULL UNIQUE,
  xero_contact_name TEXT,
  xero_contact_email TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create xero_webhook_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.xero_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- ADD MISSING INDEXES
-- =====================================

-- Add indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_invoices_xero_invoice_id ON public.invoices(xero_invoice_id) WHERE xero_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_last_synced_at ON public.invoices(last_synced_at) WHERE last_synced_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_paid_at ON public.invoices(paid_at) WHERE paid_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices(created_by) WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_xero_integrations_user_id ON public.xero_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_xero_integrations_tenant_id ON public.xero_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_xero_tokens_user_id ON public.xero_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_xero_invoices_invoice_id ON public.xero_invoices(invoice_id);
CREATE INDEX IF NOT EXISTS idx_xero_invoices_xero_invoice_id ON public.xero_invoices(xero_invoice_id);
CREATE INDEX IF NOT EXISTS idx_xero_contacts_profile_id ON public.xero_contacts(profile_id);
CREATE INDEX IF NOT EXISTS idx_xero_contacts_xero_contact_id ON public.xero_contacts(xero_contact_id);
CREATE INDEX IF NOT EXISTS idx_xero_webhook_events_event_id ON public.xero_webhook_events(event_id);

-- =====================================
-- CREATE OR REPLACE FUNCTIONS
-- =====================================

-- Function to handle Xero webhook events
CREATE OR REPLACE FUNCTION public.process_xero_webhook(
  p_events JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event JSONB;
  v_result JSONB = '[]'::JSONB;
BEGIN
  FOR v_event IN SELECT * FROM jsonb_array_elements(p_events)
  LOOP
    -- Store webhook event
    INSERT INTO public.xero_webhook_events (
      event_id,
      event_type,
      resource_type,
      resource_id,
      tenant_id,
      event_date
    ) VALUES (
      v_event->>'eventId',
      v_event->>'eventType',
      v_event->>'resourceType',
      v_event->>'resourceId',
      v_event->>'tenantId',
      (v_event->>'eventDateUtc')::TIMESTAMPTZ
    )
    ON CONFLICT (event_id) DO NOTHING;
    
    -- Add to result
    v_result = v_result || jsonb_build_object(
      'eventId', v_event->>'eventId',
      'status', 'received'
    );
  END LOOP;
  
  RETURN v_result;
END;
$$;

-- =====================================
-- ENABLE RLS ON NEW TABLES
-- =====================================

-- Enable RLS only on tables that might be new
ALTER TABLE public.xero_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_webhook_events ENABLE ROW LEVEL SECURITY;

-- =====================================
-- CREATE RLS POLICIES FOR NEW TABLES
-- =====================================

-- Policy for Xero integrations
DROP POLICY IF EXISTS "Users can manage their Xero integrations" ON public.xero_integrations;
CREATE POLICY "Users can manage their Xero integrations" ON public.xero_integrations
FOR ALL TO authenticated
USING (user_id = auth.uid());

-- Policy for Xero tokens
DROP POLICY IF EXISTS "Users can manage their Xero tokens" ON public.xero_tokens;
CREATE POLICY "Users can manage their Xero tokens" ON public.xero_tokens
FOR ALL TO authenticated
USING (user_id = auth.uid());

-- Policy for Xero invoices
DROP POLICY IF EXISTS "Users can view Xero invoices for their invoices" ON public.xero_invoices;
CREATE POLICY "Users can view Xero invoices for their invoices" ON public.xero_invoices
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE id = xero_invoices.invoice_id
    AND (
      created_by = auth.uid() OR
      promoter_id = auth.uid() OR
      comedian_id = auth.uid()
    )
  )
);

-- Policy for Xero contacts
DROP POLICY IF EXISTS "Users can manage their Xero contacts" ON public.xero_contacts;
CREATE POLICY "Users can manage their Xero contacts" ON public.xero_contacts
FOR ALL TO authenticated
USING (
  profile_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy for Xero webhooks (admin only)
DROP POLICY IF EXISTS "Only admins can view webhook events" ON public.xero_webhook_events;
CREATE POLICY "Only admins can view webhook events" ON public.xero_webhook_events
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- =====================================
-- GRANT PERMISSIONS
-- =====================================

-- Grant permissions on new tables
GRANT ALL ON public.xero_integrations TO authenticated;
GRANT ALL ON public.xero_tokens TO authenticated;
GRANT ALL ON public.xero_invoices TO authenticated;
GRANT ALL ON public.xero_contacts TO authenticated;
GRANT SELECT ON public.xero_webhook_events TO authenticated;

-- Grant execute on new function
GRANT EXECUTE ON FUNCTION public.process_xero_webhook TO authenticated;

-- =====================================
-- SUMMARY
-- =====================================
DO $$
BEGIN
  RAISE NOTICE '===== MIGRATION SUMMARY =====';
  RAISE NOTICE 'This migration adds Xero integration support to existing invoice tables.';
  RAISE NOTICE 'New tables created: xero_integrations, xero_tokens, xero_invoices, xero_contacts, xero_webhook_events';
  RAISE NOTICE 'New columns added to invoices: xero_invoice_id, last_synced_at, paid_at, created_by';
  RAISE NOTICE 'Run check-invoice-tables.sql again to verify all changes.';
END $$;