-- Add brand column for multi-brand conflict resolution and per-draft blogId routing
ALTER TABLE social_content_drafts ADD COLUMN IF NOT EXISTS brand text;
CREATE INDEX IF NOT EXISTS idx_scd_brand ON social_content_drafts(brand);
