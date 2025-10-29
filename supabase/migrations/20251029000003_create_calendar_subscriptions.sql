-- Migration: Create calendar subscriptions table with secure token generation
-- Purpose: Enable comedians to subscribe to their gigs via iCal feed
-- Created: 2025-10-29

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Table: calendar_subscriptions
-- ============================================================================
-- Stores secure tokens for calendar feed subscriptions.
-- Each user gets one unique token for their personal iCal feed URL.
-- The token is used to generate URLs like: /api/calendar/feed/{token}.ics

CREATE TABLE calendar_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,

  -- Ensure one subscription per user
  CONSTRAINT unique_user_subscription UNIQUE(user_id)
);

-- Add table comment
COMMENT ON TABLE calendar_subscriptions IS
  'Stores secure tokens for calendar feed subscriptions. Each user gets one token for their personal iCal feed URL.';

-- Add column comments
COMMENT ON COLUMN calendar_subscriptions.token IS
  'Secure URL-safe token (32 characters) used in iCal feed URL. Generated via generate_calendar_token().';
COMMENT ON COLUMN calendar_subscriptions.last_accessed_at IS
  'Timestamp of last feed access. Updated when iCal feed is requested. Useful for tracking usage and cleanup.';
COMMENT ON COLUMN calendar_subscriptions.is_active IS
  'Allows users to revoke/regenerate tokens. Inactive subscriptions are ignored by feed endpoint.';

-- ============================================================================
-- Indexes
-- ============================================================================

-- Index on user_id for fast lookups when user wants to view/manage their subscription
CREATE INDEX idx_calendar_subscriptions_user ON calendar_subscriptions(user_id);

-- Index on token for fast lookups when calendar apps request the feed
-- This is critical since token lookups happen on every calendar sync
CREATE INDEX idx_calendar_subscriptions_token ON calendar_subscriptions(token) WHERE is_active = TRUE;

-- ============================================================================
-- Function: generate_calendar_token()
-- ============================================================================
-- Generates a secure, URL-safe random token (32 characters)
-- Uses 24 random bytes encoded as base64url → 32 characters
-- Called when creating new subscription or regenerating token

CREATE OR REPLACE FUNCTION generate_calendar_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate 24 random bytes and encode as base64
  -- Base64 encoding of 24 bytes produces 32 characters
  -- Replace URL-unsafe characters: + → - and / → _
  -- Remove padding characters (=)
  token := encode(gen_random_bytes(24), 'base64');
  token := replace(token, '+', '-');
  token := replace(token, '/', '_');
  token := replace(token, '=', '');

  RETURN token;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Add function comment
COMMENT ON FUNCTION generate_calendar_token() IS
  'Generates a secure 32-character URL-safe token for calendar subscriptions using cryptographically secure random bytes.';

-- ============================================================================
-- Function: get_or_create_calendar_subscription(user_id UUID)
-- ============================================================================
-- Returns existing active subscription or creates new one
-- Ensures each user has exactly one active subscription
-- Returns: (id UUID, token TEXT)

CREATE OR REPLACE FUNCTION get_or_create_calendar_subscription(p_user_id UUID)
RETURNS TABLE(id UUID, token TEXT) AS $$
DECLARE
  v_subscription RECORD;
BEGIN
  -- Try to return existing active subscription
  SELECT cs.id, cs.token INTO v_subscription
  FROM calendar_subscriptions cs
  WHERE cs.user_id = p_user_id AND cs.is_active = TRUE
  LIMIT 1;

  -- If found, return it
  IF FOUND THEN
    RETURN QUERY SELECT v_subscription.id, v_subscription.token;
    RETURN;
  END IF;

  -- If not found, create new subscription
  RETURN QUERY
  INSERT INTO calendar_subscriptions (user_id, token)
  VALUES (p_user_id, generate_calendar_token())
  RETURNING calendar_subscriptions.id, calendar_subscriptions.token;
END;
$$ LANGUAGE plpgsql;

-- Add function comment
COMMENT ON FUNCTION get_or_create_calendar_subscription(UUID) IS
  'Gets existing active calendar subscription or creates new one. Ensures each user has exactly one subscription.';

-- ============================================================================
-- Function: regenerate_calendar_token(user_id UUID)
-- ============================================================================
-- Regenerates token for existing subscription
-- Useful when user wants to revoke old feed URL and get new one
-- Returns: new token

CREATE OR REPLACE FUNCTION regenerate_calendar_token(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  new_token TEXT;
BEGIN
  -- Generate new token
  new_token := generate_calendar_token();

  -- Update existing subscription or create new one
  INSERT INTO calendar_subscriptions (user_id, token)
  VALUES (p_user_id, new_token)
  ON CONFLICT (user_id) DO UPDATE
  SET
    token = new_token,
    created_at = NOW(),
    last_accessed_at = NULL,
    is_active = TRUE;

  RETURN new_token;
END;
$$ LANGUAGE plpgsql;

-- Add function comment
COMMENT ON FUNCTION regenerate_calendar_token(UUID) IS
  'Regenerates calendar subscription token for a user. Revokes old token and issues new one.';

-- ============================================================================
-- Function: update_calendar_access_time(token TEXT)
-- ============================================================================
-- Updates last_accessed_at when feed is requested
-- Called by API endpoint to track usage
-- Returns: user_id if token is valid and active, NULL otherwise

CREATE OR REPLACE FUNCTION update_calendar_access_time(p_token TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Update last_accessed_at and return user_id
  UPDATE calendar_subscriptions
  SET last_accessed_at = NOW()
  WHERE token = p_token AND is_active = TRUE
  RETURNING user_id INTO v_user_id;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Add function comment
COMMENT ON FUNCTION update_calendar_access_time(TEXT) IS
  'Updates last_accessed_at timestamp when calendar feed is requested. Returns user_id if token valid, NULL otherwise.';

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE calendar_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON calendar_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own subscriptions
-- This allows authenticated users to create subscriptions via get_or_create function
CREATE POLICY "Users can insert own subscriptions"
  ON calendar_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own subscriptions
-- Allows users to deactivate/reactivate or regenerate tokens
CREATE POLICY "Users can update own subscriptions"
  ON calendar_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own subscriptions (soft delete via is_active = FALSE preferred)
CREATE POLICY "Users can delete own subscriptions"
  ON calendar_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Note: Token-based lookups for feed generation bypass RLS
-- The update_calendar_access_time() function runs with SECURITY DEFINER if needed
-- or the API endpoint uses service role key for token validation

-- ============================================================================
-- Sample Usage
-- ============================================================================

-- Example 1: Get or create subscription for authenticated user
-- SELECT * FROM get_or_create_calendar_subscription(auth.uid());

-- Example 2: Regenerate token (revoke old feed URL)
-- SELECT regenerate_calendar_token(auth.uid());

-- Example 3: Update access time when feed is requested (from API)
-- SELECT update_calendar_access_time('abc123token');

-- Example 4: Deactivate subscription (revoke without regenerating)
-- UPDATE calendar_subscriptions SET is_active = FALSE WHERE user_id = auth.uid();
