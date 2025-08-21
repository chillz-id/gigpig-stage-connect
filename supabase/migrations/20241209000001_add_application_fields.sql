-- Add new fields to applications table
ALTER TABLE applications 
ADD COLUMN spot_type TEXT,
ADD COLUMN availability_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN requirements_acknowledged BOOLEAN DEFAULT FALSE;

-- Update existing applications to have default values for backward compatibility
UPDATE applications 
SET 
  spot_type = 'Feature',
  availability_confirmed = TRUE,
  requirements_acknowledged = TRUE
WHERE spot_type IS NULL;

-- Add check constraint for spot_type
ALTER TABLE applications 
ADD CONSTRAINT check_spot_type 
CHECK (spot_type IN ('MC', 'Feature', 'Headliner', 'Guest'));

-- Create index for efficient filtering by spot_type
CREATE INDEX idx_applications_spot_type ON applications(spot_type);

-- Create index for efficient filtering by availability_confirmed
CREATE INDEX idx_applications_availability_confirmed ON applications(availability_confirmed);

-- Create index for efficient filtering by requirements_acknowledged
CREATE INDEX idx_applications_requirements_acknowledged ON applications(requirements_acknowledged);

-- Add comment to document the new fields
COMMENT ON COLUMN applications.spot_type IS 'Type of performance spot requested: MC, Feature, Headliner, or Guest';
COMMENT ON COLUMN applications.availability_confirmed IS 'Whether the comedian has confirmed their availability for the event';
COMMENT ON COLUMN applications.requirements_acknowledged IS 'Whether the comedian has acknowledged meeting all event requirements';