-- Migration: Add compared_ats_score to sessions table
-- Story: 17.1 - Add Comparison Database Schema
-- Date: 2026-02-02

-- Add compared_ats_score column
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS compared_ats_score JSONB;

-- GIN index for general JSONB queries
CREATE INDEX IF NOT EXISTS idx_sessions_compared_ats_score
ON sessions USING GIN (compared_ats_score);

-- Numeric cast index for sorting/filtering by overall score (for analytics)
CREATE INDEX IF NOT EXISTS idx_sessions_compared_ats_score_overall
ON sessions ((compared_ats_score->>'overall')::numeric);

-- Documentation comment
COMMENT ON COLUMN sessions.compared_ats_score IS
  'ATS score from re-uploaded resume after applying suggestions. Structure matches ats_score: {overall: number, tier: string, breakdown: {keywordScore, sectionCoverageScore, contentQualityScore}, calculatedAt: string, breakdownV21: {...}, metadata: {...}, actionItems: [...]}. NULL if user has not uploaded comparison resume.';
