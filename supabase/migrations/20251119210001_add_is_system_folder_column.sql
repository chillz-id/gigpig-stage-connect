-- Add is_system_folder Column to Media Folders
-- Fixes schema mismatch between code and database
-- Marks reserved system folders (Headshots, Performances) that cannot be deleted
-- Author: Claude Code
-- Date: 2025-11-19

-- =============================================
-- 1. ADD is_system_folder COLUMN
-- =============================================

ALTER TABLE media_folders
ADD COLUMN IF NOT EXISTS is_system_folder BOOLEAN DEFAULT false;

-- =============================================
-- 2. UPDATE EXISTING SYSTEM FOLDERS
-- =============================================

-- Mark existing "Headshots" folders as system folders
UPDATE media_folders
SET is_system_folder = true
WHERE name = 'Headshots'
  AND is_default = true;

-- Mark existing "Performances" folders as system folders
UPDATE media_folders
SET is_system_folder = true
WHERE name = 'Performances'
  AND is_default = true;

-- =============================================
-- 3. ADD INDEX
-- =============================================

CREATE INDEX IF NOT EXISTS idx_media_folders_is_system
ON media_folders(is_system_folder)
WHERE is_system_folder = true;

-- =============================================
-- 4. UPDATE FOLDER CREATION FUNCTION
-- =============================================

-- Update the function to mark system folders
CREATE OR REPLACE FUNCTION create_default_media_folders()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has comedian role
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = NEW.id
    AND role IN ('comedian', 'comedian_lite')  -- Include comedian_lite
  ) THEN
    -- Create Headshots folder (system folder)
    INSERT INTO media_folders (user_id, name, description, is_default, is_system_folder)
    VALUES (
      NEW.id,
      'Headshots',
      'Professional headshots for promotional use',
      true,
      true  -- Mark as system folder
    )
    ON CONFLICT (user_id, name) DO NOTHING;

    -- Create Performances folder (system folder)
    INSERT INTO media_folders (user_id, name, description, is_default, is_system_folder)
    VALUES (
      NEW.id,
      'Performances',
      'Videos and images from live performances',
      true,
      true  -- Mark as system folder
    )
    ON CONFLICT (user_id, name) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. ADD CONSTRAINT: PREVENT SYSTEM FOLDER DELETION
-- =============================================

-- Trigger to prevent deletion of system folders
CREATE OR REPLACE FUNCTION prevent_system_folder_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_system_folder = true THEN
    RAISE EXCEPTION 'Cannot delete system folder: %', OLD.name;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_system_folder_deletion_trigger ON media_folders;

CREATE TRIGGER prevent_system_folder_deletion_trigger
  BEFORE DELETE ON media_folders
  FOR EACH ROW
  EXECUTE FUNCTION prevent_system_folder_deletion();

-- =============================================
-- 6. ADD CONSTRAINT: PREVENT SYSTEM FOLDER RENAME
-- =============================================

-- Trigger to prevent renaming system folders
CREATE OR REPLACE FUNCTION prevent_system_folder_rename()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_system_folder = true AND NEW.name != OLD.name THEN
    RAISE EXCEPTION 'Cannot rename system folder: %', OLD.name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_system_folder_rename_trigger ON media_folders;

CREATE TRIGGER prevent_system_folder_rename_trigger
  BEFORE UPDATE ON media_folders
  FOR EACH ROW
  WHEN (NEW.name IS DISTINCT FROM OLD.name)
  EXECUTE FUNCTION prevent_system_folder_rename();

-- =============================================
-- 7. COMMENTS
-- =============================================

COMMENT ON COLUMN media_folders.is_system_folder IS 'Reserved system folders (Headshots, Performances) that cannot be deleted or renamed';
