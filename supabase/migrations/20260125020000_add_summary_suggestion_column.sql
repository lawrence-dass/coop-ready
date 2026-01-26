-- Migration: Add summary_suggestion column to sessions table
-- Story: 6.2 Implement Summary Section Suggestions
-- Date: 2026-01-25
-- Purpose: Store generated summary optimization suggestions with session data

-- Add column for summary suggestions
ALTER TABLE sessions ADD COLUMN summary_suggestion JSONB;

-- Create index for efficient queries on summary_suggestion
CREATE INDEX idx_sessions_summary_suggestion ON sessions USING GIN (summary_suggestion);

-- Add helpful comment
COMMENT ON COLUMN sessions.summary_suggestion IS 'Stores summary optimization suggestions: { original, suggested, ats_keywords_added, ai_tell_phrases_rewritten }';
