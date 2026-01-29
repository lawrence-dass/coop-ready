-- Migration: Add privacy consent columns to profiles table
-- Story: 15.1 - Add Privacy Consent Database Columns
-- Date: 2026-01-29
--
-- This migration adds two columns to track user privacy disclosure consent:
--   - privacy_accepted: Boolean flag (default false)
--   - privacy_accepted_at: Timestamp when consent was given (nullable)

-- Add privacy_accepted column with default false
-- NOT NULL ensures boolean checks work reliably (no null edge cases)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN NOT NULL DEFAULT false;

-- Add privacy_accepted_at column to track when consent was given
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMP WITH TIME ZONE;

-- Backfill existing profiles with privacy_accepted = false
UPDATE profiles SET privacy_accepted = false WHERE privacy_accepted IS NULL;

-- Add column comments for documentation
COMMENT ON COLUMN profiles.privacy_accepted IS
'Boolean flag indicating whether user has accepted privacy disclosure. Default: false. Set to true in Story 15.3 (Gate Uploads Until Consent Accepted) when user accepts consent dialog.';

COMMENT ON COLUMN profiles.privacy_accepted_at IS
'Timestamp when user accepted privacy disclosure. Null if privacy_accepted = false. Set alongside privacy_accepted = true in Story 15.3.';

-- RLS Note: Existing UPDATE policy on profiles table allows authenticated users
-- to update their own rows, including these new columns. No new RLS policies needed.
-- See migration 20260123000000_create_profiles_table.sql for base RLS setup.

-- Index Note: No additional index added for privacy_accepted column.
-- Rationale: This column is only queried per-user (WHERE id = user_id), which is
-- already indexed via the primary key. Filtering all users by privacy_accepted = false
-- is not a common access pattern in this application. If admin dashboards require
-- such queries in the future, consider adding: CREATE INDEX idx_profiles_privacy_accepted
-- ON profiles(privacy_accepted) WHERE privacy_accepted = false;
