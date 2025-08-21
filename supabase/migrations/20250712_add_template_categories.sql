-- Add category support to event templates
-- This migration adds a category column and updates existing templates

-- Add category column
ALTER TABLE event_templates 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- Add category index for better query performance
CREATE INDEX IF NOT EXISTS idx_event_templates_category ON event_templates(category);

-- Update existing templates to automatically categorize them
UPDATE event_templates 
SET category = CASE
  WHEN LOWER(template_data->>'title') LIKE '%open mic%' 
    OR LOWER(template_data->>'description') LIKE '%open mic%' THEN 'open-mic'
  WHEN LOWER(template_data->>'title') LIKE '%showcase%' 
    OR LOWER(template_data->>'description') LIKE '%showcase%' THEN 'showcase'
  WHEN LOWER(template_data->>'title') LIKE '%workshop%' 
    OR LOWER(template_data->>'description') LIKE '%workshop%' 
    OR LOWER(template_data->>'title') LIKE '%masterclass%' 
    OR LOWER(template_data->>'description') LIKE '%masterclass%' THEN 'workshop'
  WHEN LOWER(template_data->>'title') LIKE '%competition%' 
    OR LOWER(template_data->>'description') LIKE '%competition%' 
    OR LOWER(template_data->>'title') LIKE '%contest%' 
    OR LOWER(template_data->>'description') LIKE '%contest%' THEN 'competition'
  WHEN (template_data->>'showType')::text = 'professional' 
    OR (template_data->>'isPaid')::boolean = true THEN 'pro-show'
  WHEN LOWER(template_data->>'title') LIKE '%comedy night%' 
    OR LOWER(template_data->>'description') LIKE '%comedy night%' THEN 'comedy-night'
  ELSE 'other'
END
WHERE category = 'other';

-- Add check constraint to ensure valid categories
ALTER TABLE event_templates 
ADD CONSTRAINT check_valid_category 
CHECK (category IN ('open-mic', 'showcase', 'pro-show', 'comedy-night', 'workshop', 'competition', 'other'));

-- Update RLS policies to include category in template queries (if needed)
-- Note: The existing policies should still work as category is just additional filtering

-- Create a function to auto-categorize new templates
CREATE OR REPLACE FUNCTION auto_categorize_template()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-categorize based on template data if no category is provided
  IF NEW.category IS NULL OR NEW.category = 'other' THEN
    NEW.category := CASE
      WHEN LOWER(NEW.template_data->>'title') LIKE '%open mic%' 
        OR LOWER(NEW.template_data->>'description') LIKE '%open mic%' THEN 'open-mic'
      WHEN LOWER(NEW.template_data->>'title') LIKE '%showcase%' 
        OR LOWER(NEW.template_data->>'description') LIKE '%showcase%' THEN 'showcase'
      WHEN LOWER(NEW.template_data->>'title') LIKE '%workshop%' 
        OR LOWER(NEW.template_data->>'description') LIKE '%workshop%' 
        OR LOWER(NEW.template_data->>'title') LIKE '%masterclass%' 
        OR LOWER(NEW.template_data->>'description') LIKE '%masterclass%' THEN 'workshop'
      WHEN LOWER(NEW.template_data->>'title') LIKE '%competition%' 
        OR LOWER(NEW.template_data->>'description') LIKE '%competition%' 
        OR LOWER(NEW.template_data->>'title') LIKE '%contest%' 
        OR LOWER(NEW.template_data->>'description') LIKE '%contest%' THEN 'competition'
      WHEN (NEW.template_data->>'showType')::text = 'professional' 
        OR (NEW.template_data->>'isPaid')::boolean = true THEN 'pro-show'
      WHEN LOWER(NEW.template_data->>'title') LIKE '%comedy night%' 
        OR LOWER(NEW.template_data->>'description') LIKE '%comedy night%' THEN 'comedy-night'
      ELSE 'other'
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-categorization
DROP TRIGGER IF EXISTS trigger_auto_categorize_template ON event_templates;
CREATE TRIGGER trigger_auto_categorize_template
  BEFORE INSERT OR UPDATE ON event_templates
  FOR EACH ROW
  EXECUTE FUNCTION auto_categorize_template();