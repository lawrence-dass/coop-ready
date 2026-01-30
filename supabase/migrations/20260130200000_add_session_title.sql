-- Migration: Add title column to sessions table
-- Story: Fix "Untitled Scan" - Add Session Title Field
--
-- Purpose: Store a computed title at session creation time rather than
-- extracting it from JD content at display time. This ensures consistent
-- display names even when JD content doesn't match extraction patterns.
--
-- Format: "{Job Title} - {Company}" with fallbacks:
-- - "Software Engineer - Google" (both found)
-- - "Software Engineer" (no company)
-- - "Untitled Scan" (nothing extracted)

ALTER TABLE sessions ADD COLUMN title TEXT;

-- Add comment for documentation
COMMENT ON COLUMN sessions.title IS 'Auto-generated session title in format "Job Title - Company" computed at creation time';
