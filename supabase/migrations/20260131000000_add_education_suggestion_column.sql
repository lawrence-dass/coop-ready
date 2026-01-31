-- Add education_suggestion column to sessions table
-- Migration adds JSONB column for storing education optimization suggestions
-- Critical for co-op/internship candidates where education is primary credential

-- Add education_suggestion column
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS education_suggestion JSONB;

-- Add comment for documentation
COMMENT ON COLUMN sessions.education_suggestion IS 'Education section optimization suggestions - critical for co-op/internship candidates';
