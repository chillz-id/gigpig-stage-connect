-- Add Xero Integration Components to Existing Invoice System
-- This migration only adds what's missing for Xero integration

-- =====================================
-- ADD MISSING COLUMNS TO INVOICES TABLE
-- =====================================

-- Add Xero-specific columns if they don't exist
DO $$ 
BEGIN
  -- Add xero_invoice_id for direct Xero reference
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'invoices' AND column_name = 'xero_invoice_id') THEN
    ALTER TABLE public.invoices ADD COLUMN xero_invoice_id TEXT;
    CREATE INDEX idx_invoices_xero_invoice_id ON public.invoices(xero_invoice_id) WHERE xero_invoice_id IS NOT NULL;
    RAISE NOTICE 'Added column: invoices.xero_invoice_id';
  END IF;
  
  -- Add last_synced_at to track sync times
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'invoices' AND column_name = 'last_synced_at') THEN
    ALTER TABLE public.invoices ADD COLUMN last_synced_at TIMESTAMPTZ;
    RAISE NOTICE 'Added column: invoices.last_synced_at';
  END IF;
  
  -- Add paid_at timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'invoices' AND column_name = 'paid_at') THEN
    ALTER TABLE public.invoices ADD COLUMN paid_at TIMESTAMPTZ;
    RAISE NOTICE 'Added column: invoices.paid_at';
  END IF;
  
  -- Add created_by for user tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'invoices' AND column_name = 'created_by') THEN
    ALTER TABLE public.invoices ADD COLUMN created_by UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Added column: invoices.created_by';
  END IF;
END $$;

-- =====================================
-- CREATE XERO OAUTH TABLES
-- =====================================

-- Xero integration settings (OAuth tokens)
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

-- Xero OAuth tokens (for token refresh)
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

-- Xero contacts mapping
CREATE TABLE IF NOT EXISTS public.xero_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id),
  xero_contact_id TEXT NOT NULL UNIQUE,
  xero_contact_name TEXT,
  xero_contact_email TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Xero webhook events
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
-- ADD INDEXES
-- =====================================

CREATE INDEX IF NOT EXISTS idx_xero_integrations_user_id ON public.xero_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_xero_integrations_tenant_id ON public.xero_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_xero_tokens_user_id ON public.xero_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_xero_contacts_profile_id ON public.xero_contacts(profile_id);
CREATE INDEX IF NOT EXISTS idx_xero_webhook_events_tenant_id ON public.xero_webhook_events(tenant_id);

-- =====================================
-- ENABLE RLS
-- =====================================

ALTER TABLE public.xero_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_webhook_events ENABLE ROW LEVEL SECURITY;

-- =====================================
-- CREATE RLS POLICIES
-- =====================================

-- Users can only manage their own Xero integrations
CREATE POLICY "Users manage own Xero integrations" ON public.xero_integrations
FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users manage own Xero tokens" ON public.xero_tokens
FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users manage own Xero contacts" ON public.xero_contacts
FOR ALL TO authenticated
USING (
  profile_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can view webhook events
CREATE POLICY "Admins view webhook events" ON public.xero_webhook_events
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- =====================================
-- XERO WEBHOOK PROCESSING FUNCTION
-- =====================================

CREATE OR REPLACE FUNCTION public.process_xero_webhook(p_events JSONB)
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
    
    v_result = v_result || jsonb_build_object(
      'eventId', v_event->>'eventId',
      'status', 'received'
    );
  END LOOP;
  
  RETURN v_result;
END;
$$;

-- =====================================
-- GRANT PERMISSIONS
-- =====================================

GRANT ALL ON public.xero_integrations TO authenticated;
GRANT ALL ON public.xero_tokens TO authenticated;
GRANT ALL ON public.xero_contacts TO authenticated;
GRANT SELECT ON public.xero_webhook_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_xero_webhook TO authenticated;

-- =====================================
-- VERIFICATION
-- =====================================

SELECT 'Xero Integration Setup Complete' as status,
       'Run check-current-invoice-state.sql to verify all components' as next_step;