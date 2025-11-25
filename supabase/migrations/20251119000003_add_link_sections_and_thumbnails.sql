-- Add Linktree-style enhancements to custom links
-- - Sections for organizing links with customizable layouts
-- - Thumbnail support (auto-fetched OG images + custom uploads)
-- - Description field for subtitles

-- Create link_sections table for organizing links into groups
CREATE TABLE IF NOT EXISTS public.link_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  layout TEXT NOT NULL DEFAULT 'stacked' CHECK (layout IN ('stacked', 'grid')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for link_sections
CREATE INDEX IF NOT EXISTS idx_link_sections_user_id ON public.link_sections(user_id);
CREATE INDEX IF NOT EXISTS idx_link_sections_order ON public.link_sections(user_id, display_order);

-- Add comments to link_sections
COMMENT ON TABLE public.link_sections IS 'Sections for organizing custom links with layout options (Linktree-style)';
COMMENT ON COLUMN public.link_sections.title IS 'Section heading text displayed above grouped links';
COMMENT ON COLUMN public.link_sections.layout IS 'Display layout for links in this section: stacked (vertical list) or grid (2-column cards)';
COMMENT ON COLUMN public.link_sections.display_order IS 'Sort order for displaying sections (lower numbers appear first)';

-- Enable RLS for link_sections
ALTER TABLE public.link_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view sections for visible links
CREATE POLICY "Anyone can view sections for visible links"
  ON public.link_sections FOR SELECT
  USING (true);

-- RLS Policy: Users can manage their own sections
CREATE POLICY "Users can manage their own sections"
  ON public.link_sections FOR ALL
  USING (auth.uid() = user_id);

-- Add new columns to custom_links table
ALTER TABLE public.custom_links
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.link_sections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comments for new columns
COMMENT ON COLUMN public.custom_links.thumbnail_url IS 'Auto-fetched Open Graph image from URL';
COMMENT ON COLUMN public.custom_links.custom_thumbnail_url IS 'User-uploaded custom thumbnail (overrides auto-fetched)';
COMMENT ON COLUMN public.custom_links.section_id IS 'Optional section grouping for organizing links';
COMMENT ON COLUMN public.custom_links.description IS 'Optional subtitle text shown below title';

-- Create index for section_id lookups
CREATE INDEX IF NOT EXISTS idx_custom_links_section_id ON public.custom_links(section_id);

-- Create trigger to update updated_at timestamp for link_sections
CREATE OR REPLACE FUNCTION public.update_link_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_link_sections_updated_at
  BEFORE UPDATE ON public.link_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_link_sections_updated_at();
