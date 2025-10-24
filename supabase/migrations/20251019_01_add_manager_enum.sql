-- Migration: Add Manager Enum Value
-- Date: 2025-10-19
-- Description: Adds 'manager' to user_role enum (must be separate from usage)

-- Add manager role if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'manager'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'manager';
  END IF;
END $$;

-- Add organization role if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'organization'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'organization';
  END IF;
END $$;
