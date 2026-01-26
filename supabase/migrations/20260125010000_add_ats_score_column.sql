-- Migration: Add ats_score column to sessions table
-- Story: 5.2 Implement ATS Score Calculation
-- Date: 2026-01-25

-- Add ats_score column to store ATS compatibility scoring results
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS ats_score JSONB;

-- Add index for querying by overall score (for future analytics/filtering)
CREATE INDEX IF NOT EXISTS idx_sessions_ats_score_overall
ON sessions ((ats_score->>'overall')::numeric);

-- Add GIN index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_sessions_ats_score
ON sessions USING GIN (ats_score);

-- Add comment for documentation
COMMENT ON COLUMN sessions.ats_score IS 'Stores ATS compatibility score with overall score (0-100) and breakdown by category (keyword, section coverage, content quality) from Story 5.2';
