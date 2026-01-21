-- Migration: Add keywords_found and keywords_missing columns to scans table
-- Story: 4.3 Missing Keywords Detection
-- Date: 2026-01-20

-- Add columns for storing keyword analysis data
ALTER TABLE scans
  ADD COLUMN keywords_found JSONB,
  ADD COLUMN keywords_missing JSONB;

-- Add comments documenting keyword data structure
COMMENT ON COLUMN scans.keywords_found IS 'Array of keywords present in resume: [{ keyword: string, frequency: number, variant?: string }]';
COMMENT ON COLUMN scans.keywords_missing IS 'Array of missing keywords from job description: [{ keyword: string, frequency: number, priority: "high" | "medium" | "low" }]';

-- Note: RLS policies already in place from previous migrations allow users to see their own scan data
-- No additional RLS policy changes needed
