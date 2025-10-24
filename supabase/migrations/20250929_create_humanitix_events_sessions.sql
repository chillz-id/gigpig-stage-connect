-- Create Humanitix Events and Sessions staging tables
-- This migration formalises the existing ad-hoc tables used by the Humanitix -> Supabase sync
-- so that fresh environments have consistent schemas, indexes, and RLS rules.

CREATE TABLE IF NOT EXISTS public.events_htx (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'humanitix',
  source_id TEXT NOT NULL,
  name TEXT,
  description TEXT,
  slug TEXT,
  url TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  timezone TEXT,
  status TEXT,
  total_capacity INTEGER,
  public BOOLEAN,
  published BOOLEAN,
  venue_name TEXT,
  venue_address TEXT,
  venue_city TEXT,
  venue_country TEXT,
  currency TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at_api TIMESTAMPTZ,
  raw JSONB,
  created_at_db TIMESTAMPTZ DEFAULT NOW(),
  updated_at_db TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_htx_source_id_unique'
  ) THEN
    ALTER TABLE public.events_htx
      ADD CONSTRAINT events_htx_source_id_unique UNIQUE (source_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.sessions_htx (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'humanitix',
  source_id TEXT NOT NULL,
  event_source_id TEXT NOT NULL,
  name TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  timezone TEXT,
  venue_name TEXT,
  status TEXT,
  capacity INTEGER,
  additional_fields JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at_api TIMESTAMPTZ,
  raw JSONB,
  created_at_db TIMESTAMPTZ DEFAULT NOW(),
  updated_at_db TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sessions_htx_event_source_fk'
  ) THEN
    ALTER TABLE public.sessions_htx
      ADD CONSTRAINT sessions_htx_event_source_fk
      FOREIGN KEY (event_source_id)
      REFERENCES public.events_htx (source_id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure composite uniqueness that matches the sync upsert behaviour
CREATE UNIQUE INDEX IF NOT EXISTS events_htx_source_source_id_idx ON public.events_htx (source, source_id);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_htx_source_source_id_idx ON public.sessions_htx (source, source_id);

-- High-traffic query helpers
CREATE INDEX IF NOT EXISTS events_htx_start_date_idx ON public.events_htx (start_date);
CREATE INDEX IF NOT EXISTS events_htx_status_idx ON public.events_htx (status);
CREATE INDEX IF NOT EXISTS sessions_htx_event_source_id_idx ON public.sessions_htx (event_source_id);
CREATE INDEX IF NOT EXISTS sessions_htx_start_date_idx ON public.sessions_htx (start_date);

-- Row Level Security: restrict access to service role usage by default
ALTER TABLE public.events_htx ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions_htx ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.events_htx FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sessions_htx FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service-role-manage-events-htx" ON public.events_htx;
CREATE POLICY "service-role-manage-events-htx"
  ON public.events_htx
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service-role-manage-sessions-htx" ON public.sessions_htx;
CREATE POLICY "service-role-manage-sessions-htx"
  ON public.sessions_htx
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Optional: revoke broad defaults so only explicit grants apply
REVOKE ALL ON public.events_htx FROM PUBLIC;
REVOKE ALL ON public.sessions_htx FROM PUBLIC;

-- Grant service role full control; other roles can be granted explicitly if needed later
GRANT ALL ON public.events_htx TO service_role;
GRANT ALL ON public.sessions_htx TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
