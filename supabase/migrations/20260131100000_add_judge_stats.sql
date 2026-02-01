-- Add judge_stats column for aggregate quality metrics
-- This follows the same pattern as ats_score column for aggregate data storage

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS judge_stats JSONB;

-- GIN index for general JSONB queries on judge_stats
CREATE INDEX IF NOT EXISTS idx_sessions_judge_stats_gin
ON sessions USING GIN (judge_stats);

COMMENT ON COLUMN sessions.judge_stats IS 'Aggregate judge statistics: total_count, passed_count, pass_rate, average_score, has_failures, failed_sections, by_section breakdown';

-- Example structure:
-- {
--   "total_count": 15,
--   "passed_count": 12,
--   "pass_rate": 0.80,
--   "average_score": 72,
--   "has_failures": true,
--   "failed_sections": ["skills"],
--   "by_section": {
--     "summary": { "count": 1, "passed": 1, "avg_score": 85 },
--     "skills": { "count": 5, "passed": 3, "avg_score": 62 },
--     "experience": { "count": 7, "passed": 7, "avg_score": 78 },
--     "education": { "count": 2, "passed": 1, "avg_score": 65 }
--   }
-- }
