-- Migration: Optimize sessions table for history queries
-- Story: 10.1 Implement History List View
-- Date: 2026-01-27
--
-- Note: No new table needed - reusing existing `sessions` table for history.
-- The `sessions` table already contains all necessary data:
--   - resume_content (Resume)
--   - jd_content (Job Description)
--   - analysis (JSONB containing keyword analysis, ATS score)
--   - suggestions (JSONB containing optimization suggestions)
--   - created_at (timestamp)
--   - user_id (for RLS)
--
-- This migration adds optimizations for efficient history queries.

-- Add composite index for user_id + created_at DESC
-- This supports the common query pattern: "get last N sessions for user X"
-- The existing idx_sessions_user_id and idx_sessions_created_at indexes are separate,
-- but a composite index is more efficient for this specific use case.
CREATE INDEX IF NOT EXISTS idx_sessions_user_history
  ON sessions(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Add a comment documenting the history query pattern
COMMENT ON INDEX idx_sessions_user_history IS
  'Optimizes history queries: SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10';

-- Verify RLS policies support history queries
-- (No changes needed - existing "Users can view their own sessions" policy covers history access)
