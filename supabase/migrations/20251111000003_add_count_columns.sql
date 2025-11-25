-- Add vote_count and comment_count columns to feature_requests
ALTER TABLE feature_requests
ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Add comment_count column to bug_reports
ALTER TABLE bug_reports
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Create function to update feature vote count
CREATE OR REPLACE FUNCTION update_feature_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feature_requests
    SET vote_count = vote_count + 1
    WHERE id = NEW.feature_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feature_requests
    SET vote_count = GREATEST(vote_count - 1, 0)
    WHERE id = OLD.feature_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update feature comment count
CREATE OR REPLACE FUNCTION update_feature_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feature_requests
    SET comment_count = comment_count + 1
    WHERE id = NEW.feature_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feature_requests
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.feature_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update bug comment count
CREATE OR REPLACE FUNCTION update_bug_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE bug_reports
    SET comment_count = comment_count + 1
    WHERE id = NEW.bug_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE bug_reports
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.bug_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_feature_vote_count ON feature_votes;
DROP TRIGGER IF EXISTS trigger_update_feature_comment_count ON feature_comments;
DROP TRIGGER IF EXISTS trigger_update_bug_comment_count ON bug_comments;

-- Create triggers for vote count
CREATE TRIGGER trigger_update_feature_vote_count
AFTER INSERT OR DELETE ON feature_votes
FOR EACH ROW
EXECUTE FUNCTION update_feature_vote_count();

-- Create triggers for feature comment count
CREATE TRIGGER trigger_update_feature_comment_count
AFTER INSERT OR DELETE ON feature_comments
FOR EACH ROW
EXECUTE FUNCTION update_feature_comment_count();

-- Create triggers for bug comment count
CREATE TRIGGER trigger_update_bug_comment_count
AFTER INSERT OR DELETE ON bug_comments
FOR EACH ROW
EXECUTE FUNCTION update_bug_comment_count();

-- Initialize existing counts
UPDATE feature_requests fr
SET vote_count = (
  SELECT COUNT(*) FROM feature_votes fv WHERE fv.feature_id = fr.id
);

UPDATE feature_requests fr
SET comment_count = (
  SELECT COUNT(*) FROM feature_comments fc WHERE fc.feature_id = fr.id
);

UPDATE bug_reports br
SET comment_count = (
  SELECT COUNT(*) FROM bug_comments bc WHERE bc.bug_id = br.id
);

-- Create indexes on the new columns for fast filtering/sorting
CREATE INDEX IF NOT EXISTS idx_feature_requests_vote_count ON feature_requests(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_feature_requests_comment_count ON feature_requests(comment_count DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_comment_count ON bug_reports(comment_count DESC);
