-- Universal Profile Schema Migration
-- Created: 2025-01-21
-- Purpose: Add missing fields and tables to support universal profile editor across all profile types

-- =============================================
-- 1. Add Missing Fields to organization_profiles
-- =============================================

ALTER TABLE public.organization_profiles
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_position JSONB DEFAULT '{"x": 50, "y": 50, "scale": 1}'::jsonb,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS media_layout TEXT DEFAULT 'grid' CHECK (media_layout IN ('grid', 'masonic', 'list')),
  ADD COLUMN IF NOT EXISTS show_contact_in_epk BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.organization_profiles.banner_url IS 'URL to organization banner image (8:3 aspect ratio)';
COMMENT ON COLUMN public.organization_profiles.banner_position IS 'Banner image position/scale for cropping';
COMMENT ON COLUMN public.organization_profiles.tagline IS 'Short tagline/slogan for organization';
COMMENT ON COLUMN public.organization_profiles.media_layout IS 'Preferred media gallery layout (grid, masonic, or list)';
COMMENT ON COLUMN public.organization_profiles.show_contact_in_epk IS 'Whether to show contact info in public EPK';

-- =============================================
-- 2. Create Accomplishments Tables
-- =============================================

-- Photographer Accomplishments
CREATE TABLE IF NOT EXISTS public.photographer_accomplishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  year INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photographer_accomplishments_user_id ON public.photographer_accomplishments(user_id);
CREATE INDEX IF NOT EXISTS idx_photographer_accomplishments_display_order ON public.photographer_accomplishments(user_id, display_order);

COMMENT ON TABLE public.photographer_accomplishments IS 'Career highlights and achievements for photographers';

-- Videographer Accomplishments
CREATE TABLE IF NOT EXISTS public.videographer_accomplishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  year INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videographer_accomplishments_user_id ON public.videographer_accomplishments(user_id);
CREATE INDEX IF NOT EXISTS idx_videographer_accomplishments_display_order ON public.videographer_accomplishments(user_id, display_order);

COMMENT ON TABLE public.videographer_accomplishments IS 'Career highlights and achievements for videographers';

-- Manager Accomplishments
CREATE TABLE IF NOT EXISTS public.manager_accomplishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  year INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manager_accomplishments_user_id ON public.manager_accomplishments(user_id);
CREATE INDEX IF NOT EXISTS idx_manager_accomplishments_display_order ON public.manager_accomplishments(user_id, display_order);

COMMENT ON TABLE public.manager_accomplishments IS 'Career highlights and achievements for managers';

-- Organization Accomplishments
CREATE TABLE IF NOT EXISTS public.organization_accomplishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organization_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  year INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_accomplishments_org_id ON public.organization_accomplishments(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_accomplishments_display_order ON public.organization_accomplishments(organization_id, display_order);

COMMENT ON TABLE public.organization_accomplishments IS 'Company highlights and achievements for organizations';

-- =============================================
-- 3. Create Custom Links Tables
-- =============================================

-- Photographer Custom Links
CREATE TABLE IF NOT EXISTS public.photographer_custom_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  section TEXT DEFAULT 'general',
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photographer_custom_links_user_id ON public.photographer_custom_links(user_id);
CREATE INDEX IF NOT EXISTS idx_photographer_custom_links_display_order ON public.photographer_custom_links(user_id, display_order);

COMMENT ON TABLE public.photographer_custom_links IS 'Custom links for photographer profiles';

-- Videographer Custom Links
CREATE TABLE IF NOT EXISTS public.videographer_custom_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  section TEXT DEFAULT 'general',
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videographer_custom_links_user_id ON public.videographer_custom_links(user_id);
CREATE INDEX IF NOT EXISTS idx_videographer_custom_links_display_order ON public.videographer_custom_links(user_id, display_order);

COMMENT ON TABLE public.videographer_custom_links IS 'Custom links for videographer profiles';

-- Manager Custom Links
CREATE TABLE IF NOT EXISTS public.manager_custom_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  section TEXT DEFAULT 'general',
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manager_custom_links_user_id ON public.manager_custom_links(user_id);
CREATE INDEX IF NOT EXISTS idx_manager_custom_links_display_order ON public.manager_custom_links(user_id, display_order);

COMMENT ON TABLE public.manager_custom_links IS 'Custom links for manager profiles';

-- Organization Custom Links
CREATE TABLE IF NOT EXISTS public.organization_custom_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organization_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  section TEXT DEFAULT 'general',
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_custom_links_org_id ON public.organization_custom_links(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_custom_links_display_order ON public.organization_custom_links(organization_id, display_order);

COMMENT ON TABLE public.organization_custom_links IS 'Custom links for organization profiles';

-- =============================================
-- 4. Create Press Reviews Tables
-- =============================================

-- Photographer Press Reviews
CREATE TABLE IF NOT EXISTS public.photographer_press_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  publication TEXT NOT NULL,
  review_text TEXT NOT NULL,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_date DATE,
  review_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photographer_press_reviews_user_id ON public.photographer_press_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_photographer_press_reviews_display_order ON public.photographer_press_reviews(user_id, display_order);

COMMENT ON TABLE public.photographer_press_reviews IS 'Client reviews and testimonials for photographers';

-- Videographer Press Reviews
CREATE TABLE IF NOT EXISTS public.videographer_press_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  publication TEXT NOT NULL,
  review_text TEXT NOT NULL,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_date DATE,
  review_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videographer_press_reviews_user_id ON public.videographer_press_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_videographer_press_reviews_display_order ON public.videographer_press_reviews(user_id, display_order);

COMMENT ON TABLE public.videographer_press_reviews IS 'Client reviews and testimonials for videographers';

-- Manager Press Reviews
CREATE TABLE IF NOT EXISTS public.manager_press_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  publication TEXT NOT NULL,
  review_text TEXT NOT NULL,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_date DATE,
  review_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manager_press_reviews_user_id ON public.manager_press_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_manager_press_reviews_display_order ON public.manager_press_reviews(user_id, display_order);

COMMENT ON TABLE public.manager_press_reviews IS 'Client reviews and testimonials for managers';

-- Organization Press Reviews
CREATE TABLE IF NOT EXISTS public.organization_press_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organization_profiles(id) ON DELETE CASCADE,
  publication TEXT NOT NULL,
  review_text TEXT NOT NULL,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_date DATE,
  review_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_press_reviews_org_id ON public.organization_press_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_press_reviews_display_order ON public.organization_press_reviews(organization_id, display_order);

COMMENT ON TABLE public.organization_press_reviews IS 'Client reviews and testimonials for organizations';

-- =============================================
-- 5. Enable Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE public.photographer_accomplishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videographer_accomplishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_accomplishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_accomplishments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.photographer_custom_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videographer_custom_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_custom_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_custom_links ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.photographer_press_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videographer_press_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_press_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_press_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Photographer Tables
CREATE POLICY "Photographer accomplishments are publicly readable"
  ON public.photographer_accomplishments FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own photographer accomplishments"
  ON public.photographer_accomplishments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Photographer links are publicly readable"
  ON public.photographer_custom_links FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Users can manage their own photographer links"
  ON public.photographer_custom_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Photographer reviews are publicly readable"
  ON public.photographer_press_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own photographer reviews"
  ON public.photographer_press_reviews FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Videographer Tables
CREATE POLICY "Videographer accomplishments are publicly readable"
  ON public.videographer_accomplishments FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own videographer accomplishments"
  ON public.videographer_accomplishments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Videographer links are publicly readable"
  ON public.videographer_custom_links FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Users can manage their own videographer links"
  ON public.videographer_custom_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Videographer reviews are publicly readable"
  ON public.videographer_press_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own videographer reviews"
  ON public.videographer_press_reviews FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Manager Tables
CREATE POLICY "Manager accomplishments are publicly readable"
  ON public.manager_accomplishments FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own manager accomplishments"
  ON public.manager_accomplishments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Manager links are publicly readable"
  ON public.manager_custom_links FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Users can manage their own manager links"
  ON public.manager_custom_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Manager reviews are publicly readable"
  ON public.manager_press_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own manager reviews"
  ON public.manager_press_reviews FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Organization Tables
CREATE POLICY "Organization accomplishments are publicly readable"
  ON public.organization_accomplishments FOR SELECT
  USING (true);

CREATE POLICY "Organization owners can manage accomplishments"
  ON public.organization_accomplishments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_profiles
      WHERE id = organization_id
      AND (owner_id = auth.uid() OR id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_profiles
      WHERE id = organization_id
      AND (owner_id = auth.uid() OR id = auth.uid())
    )
  );

CREATE POLICY "Organization links are publicly readable"
  ON public.organization_custom_links FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Organization owners can manage links"
  ON public.organization_custom_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_profiles
      WHERE id = organization_id
      AND (owner_id = auth.uid() OR id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_profiles
      WHERE id = organization_id
      AND (owner_id = auth.uid() OR id = auth.uid())
    )
  );

CREATE POLICY "Organization reviews are publicly readable"
  ON public.organization_press_reviews FOR SELECT
  USING (true);

CREATE POLICY "Organization owners can manage reviews"
  ON public.organization_press_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_profiles
      WHERE id = organization_id
      AND (owner_id = auth.uid() OR id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_profiles
      WHERE id = organization_id
      AND (owner_id = auth.uid() OR id = auth.uid())
    )
  );
