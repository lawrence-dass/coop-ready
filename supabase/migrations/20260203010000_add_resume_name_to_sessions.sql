-- Migration: Add resume_name column to sessions table
-- Purpose: Store resume name at session creation to fix "Untitled Resume" in history
--
-- This column stores either:
-- 1. The saved resume name (if loaded from user_resumes library)
-- 2. The uploaded filename (if uploaded directly)
-- 3. NULL (for legacy sessions or if unavailable)
--
-- Benefits:
-- - Consistent display names in history
-- - No need to extract names from content (unreliable)
-- - Works for both library resumes and direct uploads

ALTER TABLE sessions
ADD COLUMN resume_name VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN sessions.resume_name IS 'Resume display name: saved resume name from library or uploaded filename. Used for history display.';
