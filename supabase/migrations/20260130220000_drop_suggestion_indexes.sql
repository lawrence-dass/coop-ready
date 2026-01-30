-- Fix: Drop btree indexes on JSONB suggestion columns
-- These indexes cause errors when suggestion data exceeds btree max row size (2704 bytes)
-- JSONB columns are retrieved by session ID, not queried by content, so indexes aren't needed

-- Drop the problematic indexes
DROP INDEX IF EXISTS idx_sessions_experience_suggestion;
DROP INDEX IF EXISTS idx_sessions_skills_suggestion;
DROP INDEX IF EXISTS idx_sessions_summary_suggestion;
