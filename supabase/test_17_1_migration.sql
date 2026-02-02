-- Test Script for Story 17.1 Migration
-- Run these commands after applying the migration to verify it works correctly

-- ============================================================================
-- 1. Verify column exists
-- ============================================================================
-- Expected: Should show compared_ats_score column with type jsonb
\d sessions

-- ============================================================================
-- 2. Verify indexes exist
-- ============================================================================
-- Expected: Should show both idx_sessions_compared_ats_score and
-- idx_sessions_compared_ats_score_overall
\di idx_sessions_compared*

-- ============================================================================
-- 3. Test NULL handling (column is optional)
-- ============================================================================
-- Insert a session without compared_ats_score - should succeed
INSERT INTO sessions (id, anonymous_id, resume_content, jd_content)
VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  '{"rawText": "test resume"}',
  '"test job description"'
);

-- ============================================================================
-- 4. Test JSONB insertion with valid ATS score structure
-- ============================================================================
-- Create a test session with compared_ats_score
WITH new_session AS (
  INSERT INTO sessions (id, anonymous_id, resume_content, jd_content)
  VALUES (
    gen_random_uuid(),
    gen_random_uuid(),
    '{"rawText": "updated resume"}',
    '"test job description"'
  )
  RETURNING id
)
UPDATE sessions
SET compared_ats_score = jsonb_build_object(
  'overall', 85,
  'tier', 'strong',
  'breakdown', jsonb_build_object(
    'keywordScore', 40,
    'sectionCoverageScore', 25,
    'contentQualityScore', 20
  ),
  'calculatedAt', NOW()::text,
  'breakdownV21', jsonb_build_object(),
  'metadata', jsonb_build_object(
    'version', 'v2.1',
    'algorithmHash', 'test-hash'
  ),
  'actionItems', '[]'::jsonb
)
WHERE id = (SELECT id FROM new_session);

-- ============================================================================
-- 5. Test numeric index query (verify performance optimization works)
-- ============================================================================
-- Query sessions by compared_ats_score overall score
-- Should use idx_sessions_compared_ats_score_overall index
EXPLAIN ANALYZE
SELECT id, (compared_ats_score->>'overall')::numeric as score
FROM sessions
WHERE compared_ats_score IS NOT NULL
  AND (compared_ats_score->>'overall')::numeric > 80
ORDER BY (compared_ats_score->>'overall')::numeric DESC;

-- ============================================================================
-- 6. Test GIN index query (verify JSONB queries work)
-- ============================================================================
-- Query sessions by tier in compared_ats_score
-- Should use idx_sessions_compared_ats_score GIN index
EXPLAIN ANALYZE
SELECT id, compared_ats_score->>'tier' as tier
FROM sessions
WHERE compared_ats_score @> '{"tier": "strong"}'::jsonb;

-- ============================================================================
-- 7. Test RLS policies (compared_ats_score inherits row-level security)
-- ============================================================================
-- This test requires authenticated context (run in Supabase SQL editor)
-- Verify users can only see their own compared_ats_score data

-- Create two test users (manual step via Supabase dashboard)
-- User A: Create session with compared_ats_score
-- User B: Try to access User A's session (should be denied by RLS)

-- ============================================================================
-- 8. Clean up test data
-- ============================================================================
-- Delete test sessions (optional - they'll be deleted on db reset anyway)
DELETE FROM sessions WHERE resume_content::jsonb->>'rawText' LIKE 'test%' OR resume_content::jsonb->>'rawText' = 'updated resume';
