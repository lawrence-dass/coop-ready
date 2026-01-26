-- Story 6.4: Add experience_suggestion column to sessions table
-- Migration adds JSONB column for storing experience optimization suggestions

-- Add experience_suggestion column
ALTER TABLE sessions
ADD COLUMN experience_suggestion JSONB;

-- Create index for better query performance
CREATE INDEX idx_sessions_experience_suggestion ON sessions(experience_suggestion);

-- Add comment for documentation
COMMENT ON COLUMN sessions.experience_suggestion IS 'Experience section optimization suggestions from Story 6.4';
