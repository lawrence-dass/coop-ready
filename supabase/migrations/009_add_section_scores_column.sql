-- Migration: Add section_scores column to scans table
-- Story: 4.4 - Section-Level Score Breakdown
-- Description: Store section-level scores (experience, education, skills, projects, summary)
-- Created: 2026-01-20

ALTER TABLE scans
  ADD COLUMN section_scores JSONB;

-- Add column comment documenting structure
COMMENT ON COLUMN scans.section_scores IS 'Section-level scores with explanations. Structure: { experience: { score: number, explanation: string, strengths: string[], weaknesses: string[] }, education: {...}, skills: {...}, projects: {...}, summary: {...} }';

-- Note: RLS policies are already configured for scans table (Story 4.1)
-- Users can only access their own scan records via user_id FK
