-- Create custom_links table for Linktree-style functionality
-- Allows comedians to add custom links to their EPK/profile

CREATE TABLE IF NOT EXISTS public.custom_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_type TEXT, -- Icon identifier (lucide icon name or emoji)
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_custom_links_user_id ON public.custom_links(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_links_order ON public.custom_links(user_id, display_order);

-- Add comment explaining the table
COMMENT ON TABLE public.custom_links IS 'Stores custom links for comedian profiles (Linktree-style functionality)';
COMMENT ON COLUMN public.custom_links.title IS 'Display text for the link button';
COMMENT ON COLUMN public.custom_links.url IS 'Destination URL for the link';
COMMENT ON COLUMN public.custom_links.icon_type IS 'Icon identifier (Lucide icon name like "Globe", "Instagram", etc. or emoji)';
COMMENT ON COLUMN public.custom_links.display_order IS 'Sort order for displaying links (lower numbers appear first)';
COMMENT ON COLUMN public.custom_links.is_visible IS 'Whether the link should be displayed publicly';

-- Enable Row Level Security
ALTER TABLE public.custom_links ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view visible custom links
CREATE POLICY "Public custom links are viewable by everyone"
  ON public.custom_links FOR SELECT
  USING (is_visible = true);

-- RLS Policy: Users can view all their own custom links (including hidden ones)
CREATE POLICY "Users can view their own custom links"
  ON public.custom_links FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own custom links
CREATE POLICY "Users can insert their own custom links"
  ON public.custom_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own custom links
CREATE POLICY "Users can update their own custom links"
  ON public.custom_links FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own custom links
CREATE POLICY "Users can delete their own custom links"
  ON public.custom_links FOR DELETE
  USING (auth.uid() = user_id);
