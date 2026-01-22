-- Migration: Add score_breakdown JSONB column to scans table
-- Story: 9.1 ATS Scoring Recalibration
-- Created: 2026-01-22
--
-- Instructions:
-- Run this SQL in the Supabase SQL Editor or via Supabase CLI
-- This adds the score_breakdown column for storing the new 5-category scoring structure

-- Add score_breakdown column as JSONB (nullable for backward compatibility)
ALTER TABLE scans
ADD COLUMN score_breakdown JSONB;

-- Add comment for documentation
COMMENT ON COLUMN scans.score_breakdown IS 'Detailed score breakdown with 5 categories (V2) or 4 categories (legacy). Structure: { overall: number, categories: { keywordAlignment, contentRelevance, quantificationImpact, formatStructure, skillsCoverage } }';

-- Create index for querying by overall score in breakdown (optional optimization)
CREATE INDEX idx_scans_score_breakdown_overall
ON scans ((score_breakdown->>'overall')::int)
WHERE score_breakdown IS NOT NULL;
