-- Create sitemap_metadata table to track sitemap generation
CREATE TABLE IF NOT EXISTS public.sitemap_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL UNIQUE CHECK (type IN ('main', 'comedians', 'events')),
  last_generated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entries_count INTEGER NOT NULL DEFAULT 0,
  submission_status JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.sitemap_metadata ENABLE ROW LEVEL SECURITY;

-- Allow public read access to sitemap metadata
CREATE POLICY "Sitemap metadata is publicly readable" ON public.sitemap_metadata
  FOR SELECT
  USING (true);

-- Only service role can modify sitemap metadata
CREATE POLICY "Service role can manage sitemap metadata" ON public.sitemap_metadata
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sitemap_metadata_updated_at
  BEFORE UPDATE ON public.sitemap_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add indexes for performance
CREATE INDEX idx_sitemap_metadata_type ON public.sitemap_metadata(type);
CREATE INDEX idx_sitemap_metadata_last_generated ON public.sitemap_metadata(last_generated);

-- Insert initial metadata
INSERT INTO public.sitemap_metadata (type) 
VALUES ('main'), ('comedians'), ('events')
ON CONFLICT (type) DO NOTHING;