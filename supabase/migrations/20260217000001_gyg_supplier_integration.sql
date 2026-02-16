-- GetYourGuide Supplier API Integration
-- Creates tables for GYG product mappings, reservations, bookings, and notifications

-- =============================================================================
-- 1. Add 'getyourguide' to ticket_platforms platform constraint
-- =============================================================================

ALTER TABLE public.ticket_platforms DROP CONSTRAINT IF EXISTS ticket_platforms_platform_check;
ALTER TABLE public.ticket_platforms ADD CONSTRAINT ticket_platforms_platform_check
  CHECK (platform IN ('humanitix', 'eventbrite', 'ticketek', 'trybooking', 'moshtix', 'direct', 'getyourguide'));

-- Also update ticket_sales platform constraint to include getyourguide
DO $$
BEGIN
  -- Drop and recreate with all known platform values
  ALTER TABLE public.ticket_sales DROP CONSTRAINT IF EXISTS ticket_sales_platform_check;
  ALTER TABLE public.ticket_sales ADD CONSTRAINT ticket_sales_platform_check
    CHECK (platform IN ('humanitix', 'eventbrite', 'manual', 'direct', 'getyourguide'));
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- =============================================================================
-- 2. gyg_products — Maps GYG product IDs to internal events
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gyg_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  gyg_product_id TEXT UNIQUE NOT NULL,
  gyg_option_id TEXT,
  product_title TEXT,
  default_currency TEXT DEFAULT 'AUD',
  capacity_per_slot INTEGER,
  cutoff_seconds INTEGER DEFAULT 3600,
  is_active BOOLEAN DEFAULT true,
  pricing_categories JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gyg_products_gyg_product_id ON public.gyg_products(gyg_product_id);
CREATE INDEX idx_gyg_products_event_id ON public.gyg_products(event_id);

-- =============================================================================
-- 3. gyg_reservations — Temporary holds (expire after ~30 min)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gyg_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gyg_product_id TEXT NOT NULL REFERENCES public.gyg_products(gyg_product_id) ON UPDATE CASCADE,
  reservation_reference TEXT UNIQUE NOT NULL,
  gyg_booking_reference TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  booking_items JSONB,
  total_tickets INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'converted')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gyg_reservations_status_expires ON public.gyg_reservations(status, expires_at)
  WHERE status = 'active';
CREATE INDEX idx_gyg_reservations_reference ON public.gyg_reservations(reservation_reference);

-- =============================================================================
-- 4. gyg_bookings — Confirmed bookings
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gyg_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gyg_product_id TEXT NOT NULL REFERENCES public.gyg_products(gyg_product_id) ON UPDATE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id),
  booking_reference TEXT UNIQUE NOT NULL,
  gyg_booking_reference TEXT NOT NULL,
  reservation_reference TEXT,
  date_time TIMESTAMPTZ NOT NULL,
  currency TEXT DEFAULT 'AUD',
  booking_items JSONB,
  addon_items JSONB,
  travelers JSONB,
  traveler_hotel TEXT,
  comment TEXT,
  language TEXT,
  total_tickets INTEGER NOT NULL DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  ticket_codes JSONB,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'redeemed')),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gyg_bookings_event_id ON public.gyg_bookings(event_id);
CREATE INDEX idx_gyg_bookings_gyg_ref ON public.gyg_bookings(gyg_booking_reference);
CREATE INDEX idx_gyg_bookings_booking_ref ON public.gyg_bookings(booking_reference);

-- =============================================================================
-- 5. gyg_notification_log — Product deactivation notifications
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gyg_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT,
  gyg_product_id TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 6. Updated_at trigger for gyg tables
-- =============================================================================

CREATE OR REPLACE FUNCTION public.gyg_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gyg_products_updated_at
  BEFORE UPDATE ON public.gyg_products
  FOR EACH ROW EXECUTE FUNCTION public.gyg_update_updated_at();

CREATE TRIGGER gyg_bookings_updated_at
  BEFORE UPDATE ON public.gyg_bookings
  FOR EACH ROW EXECUTE FUNCTION public.gyg_update_updated_at();

-- =============================================================================
-- 7. RLS Policies
-- =============================================================================

ALTER TABLE public.gyg_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyg_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyg_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyg_notification_log ENABLE ROW LEVEL SECURITY;

-- Admins: full read access to all GYG tables
CREATE POLICY "Admins can view gyg_products" ON public.gyg_products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can view gyg_reservations" ON public.gyg_reservations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can view gyg_bookings" ON public.gyg_bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can view gyg_notification_log" ON public.gyg_notification_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Promoters: read access to their own event's GYG data
CREATE POLICY "Promoters can view their gyg_products" ON public.gyg_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = gyg_products.event_id
      AND events.promoter_id = auth.uid()
    )
  );

CREATE POLICY "Promoters can view their gyg_bookings" ON public.gyg_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = gyg_bookings.event_id
      AND events.promoter_id = auth.uid()
    )
  );
