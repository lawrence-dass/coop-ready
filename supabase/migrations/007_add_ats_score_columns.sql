-- Migration: Add ATS score columns to scans table
-- Story: 4.2 ATS Score Calculation
-- Created: 2026-01-20
--
-- Instructions:
-- Run this SQL in the Supabase SQL Editor or via Supabase CLI
-- This adds columns for storing ATS analysis results

-- Add ATS score and justification columns
ALTER TABLE scans
ADD COLUMN ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
ADD COLUMN score_justification TEXT;

-- Add index for querying scans by score (performance optimization)
CREATE INDEX idx_scans_ats_score ON scans(ats_score) WHERE ats_score IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN scans.ats_score IS 'ATS compatibility score (0-100) calculated from resume analysis';
COMMENT ON COLUMN scans.score_justification IS 'Brief explanation of the ATS score and key factors';

-- Verify RLS policies allow users to update own scan scores
-- (Policies already exist from migration 006, this is just verification)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'scans'
    AND policyname = 'Users can update own scans'
  ) THEN
    RAISE EXCEPTION 'Missing RLS policy: Users can update own scans';
  END IF;
END
$$;
