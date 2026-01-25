-- Migration: Add keyword_analysis column to sessions table
-- Story: 5.1 Implement Keyword Analysis
-- Date: 2026-01-25

-- Add keyword_analysis column to store keyword matching results
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS keyword_analysis JSONB;

-- Add index for faster queries on keyword_analysis (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_sessions_keyword_analysis
ON sessions USING GIN (keyword_analysis);

-- Add comment for documentation
COMMENT ON COLUMN sessions.keyword_analysis IS 'Stores keyword analysis results with matched/missing keywords, match rate, and timestamps from Story 5.1';
