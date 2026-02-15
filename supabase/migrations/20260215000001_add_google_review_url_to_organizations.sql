ALTER TABLE organizations ADD COLUMN IF NOT EXISTS google_review_url TEXT;

COMMENT ON COLUMN organizations.google_review_url IS 'Google Business review URL for post-show emails';
