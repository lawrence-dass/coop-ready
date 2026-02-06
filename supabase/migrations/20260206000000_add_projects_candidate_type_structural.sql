-- Migration: Add projects_suggestion, candidate_type, structural_suggestions columns
-- Story: 18.7 Store, Session & Database Updates
-- Date: 2026-02-06

-- Add projects_suggestion column (JSONB for ProjectsSuggestion object)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS projects_suggestion JSONB;
COMMENT ON COLUMN sessions.projects_suggestion IS 'Generated projects section suggestions (Story 18.5)';

-- Add candidate_type column (TEXT for CandidateType enum: coop | fulltime | career_changer)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS candidate_type TEXT;
ALTER TABLE sessions ADD CONSTRAINT sessions_candidate_type_check
  CHECK (candidate_type IS NULL OR candidate_type IN ('coop', 'fulltime', 'career_changer'));
COMMENT ON COLUMN sessions.candidate_type IS 'Detected candidate type classification: coop | fulltime | career_changer (Story 18.1)';

-- Add structural_suggestions column (JSONB array of StructuralSuggestion objects)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS structural_suggestions JSONB;
COMMENT ON COLUMN sessions.structural_suggestions IS 'Structural resume suggestions array (section ordering, format) (Story 18.3)';
