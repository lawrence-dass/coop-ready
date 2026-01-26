-- Story 6.3: Add skills_suggestion column to sessions table
-- Migration adds JSONB column for storing skills optimization suggestions

-- Add skills_suggestion column
ALTER TABLE sessions
ADD COLUMN skills_suggestion JSONB;

-- Create index for better query performance
CREATE INDEX idx_sessions_skills_suggestion ON sessions(skills_suggestion);

-- Add comment for documentation
COMMENT ON COLUMN sessions.skills_suggestion IS 'Skills section optimization suggestions from Story 6.3';
