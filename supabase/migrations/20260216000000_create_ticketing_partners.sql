-- Migration: Create ticketing partners system
-- This adds the ability to configure ticketing partners (FEVER, GetYourGuide, etc.)
-- and manually enter ticket sales from these partners for events.

-- 1. Ticketing Partners table
CREATE TABLE IF NOT EXISTS public.ticketing_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  website_url TEXT,
  commission_rate DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  logo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Manual Ticket Entries table
CREATE TABLE IF NOT EXISTS public.manual_ticket_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.ticketing_partners(id) ON DELETE RESTRICT,
  ticket_count INTEGER NOT NULL CHECK (ticket_count > 0),
  gross_revenue DECIMAL(12,2) NOT NULL CHECK (gross_revenue >= 0),
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(12,2) GENERATED ALWAYS AS (gross_revenue * commission_rate / 100) STORED,
  net_revenue DECIMAL(12,2) GENERATED ALWAYS AS (gross_revenue - (gross_revenue * commission_rate / 100)) STORED,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_ticketing_partners_slug ON public.ticketing_partners(slug);
CREATE INDEX IF NOT EXISTS idx_ticketing_partners_is_active ON public.ticketing_partners(is_active);
CREATE INDEX IF NOT EXISTS idx_manual_ticket_entries_event_id ON public.manual_ticket_entries(event_id);
CREATE INDEX IF NOT EXISTS idx_manual_ticket_entries_partner_id ON public.manual_ticket_entries(partner_id);
CREATE INDEX IF NOT EXISTS idx_manual_ticket_entries_entry_date ON public.manual_ticket_entries(entry_date);

-- Enable RLS
ALTER TABLE public.ticketing_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_ticket_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticketing_partners
-- Anyone authenticated can view active partners
CREATE POLICY "Anyone can view active ticketing partners"
  ON public.ticketing_partners
  FOR SELECT
  USING (is_active = true);

-- Admins can manage all partners
CREATE POLICY "Admins can manage ticketing partners"
  ON public.ticketing_partners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for manual_ticket_entries
-- Event owners and admins can view entries for their events
CREATE POLICY "Event owners can view manual ticket entries"
  ON public.manual_ticket_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = manual_ticket_entries.event_id
      AND events.promoter_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Event owners and admins can insert entries
CREATE POLICY "Event owners can insert manual ticket entries"
  ON public.manual_ticket_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = manual_ticket_entries.event_id
      AND events.promoter_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Event owners and admins can update entries
CREATE POLICY "Event owners can update manual ticket entries"
  ON public.manual_ticket_entries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = manual_ticket_entries.event_id
      AND events.promoter_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Event owners and admins can delete entries
CREATE POLICY "Event owners can delete manual ticket entries"
  ON public.manual_ticket_entries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = manual_ticket_entries.event_id
      AND events.promoter_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Insert default ticketing partners
INSERT INTO public.ticketing_partners (name, slug, website_url, commission_rate, is_system) VALUES
  ('FEVER', 'fever', 'https://feverup.com', 20.00, true),
  ('GetYourGuide', 'getyourguide', 'https://www.getyourguide.com', 27.00, true),
  ('Direct Sales', 'direct', NULL, 0.00, true)
ON CONFLICT (slug) DO NOTHING;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_ticketing_partners_updated_at ON public.ticketing_partners;
CREATE TRIGGER update_ticketing_partners_updated_at
  BEFORE UPDATE ON public.ticketing_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_manual_ticket_entries_updated_at ON public.manual_ticket_entries;
CREATE TRIGGER update_manual_ticket_entries_updated_at
  BEFORE UPDATE ON public.manual_ticket_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.ticketing_partners TO authenticated;
GRANT ALL ON public.manual_ticket_entries TO authenticated;
