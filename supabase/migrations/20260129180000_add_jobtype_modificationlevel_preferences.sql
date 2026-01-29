-- Migration: Add jobType and modificationLevel to optimization_preferences
-- Story: 13.2 - Add Preferences Database Migration
-- Date: 2026-01-29
--
-- This migration extends the optimization_preferences JSONB column to include
-- two new fields: jobType and modificationLevel. It updates the default value
-- for new rows and backfills existing rows while preserving all existing data.
--
-- IMPORTANT: Supabase CLI runs each migration file in a transaction automatically.
-- The explicit BEGIN/COMMIT here documents the atomicity requirement.

BEGIN;

-- ============================================================================
-- Task 2: Update DEFAULT for new rows (affects rows created after migration)
-- ============================================================================

ALTER TABLE profiles
ALTER COLUMN optimization_preferences
SET DEFAULT jsonb_build_object(
  'tone', 'professional',
  'verbosity', 'detailed',
  'emphasis', 'impact',
  'industry', 'generic',
  'experienceLevel', 'mid',
  'jobType', 'fulltime',
  'modificationLevel', 'moderate'
);

-- ============================================================================
-- Task 3: Backfill existing rows (preserves all existing values)
-- ============================================================================

-- Step 3a: For rows with NULL optimization_preferences, set complete default object
-- This ensures database consistency - all rows have complete preference objects
UPDATE profiles
SET optimization_preferences = jsonb_build_object(
  'tone', 'professional',
  'verbosity', 'detailed',
  'emphasis', 'impact',
  'industry', 'generic',
  'experienceLevel', 'mid',
  'jobType', 'fulltime',
  'modificationLevel', 'moderate'
)
WHERE optimization_preferences IS NULL;

-- Step 3b: For rows with partial preferences, add jobType if missing
UPDATE profiles
SET optimization_preferences = jsonb_set(
  optimization_preferences,
  '{jobType}',
  '"fulltime"'::jsonb
)
WHERE optimization_preferences IS NOT NULL
  AND NOT (optimization_preferences ? 'jobType');

-- Step 3c: For rows with partial preferences, add modificationLevel if missing
UPDATE profiles
SET optimization_preferences = jsonb_set(
  optimization_preferences,
  '{modificationLevel}',
  '"moderate"'::jsonb
)
WHERE optimization_preferences IS NOT NULL
  AND NOT (optimization_preferences ? 'modificationLevel');

-- ============================================================================
-- Task 4: Update column comment to document all 7 fields
-- ============================================================================

COMMENT ON COLUMN profiles.optimization_preferences IS
'User optimization preferences for LLM suggestion generation. JSON structure:
{
  "tone": "professional" | "technical" | "casual",
  "verbosity": "concise" | "detailed" | "comprehensive",
  "emphasis": "skills" | "impact" | "keywords",
  "industry": "tech" | "finance" | "healthcare" | "generic",
  "experienceLevel": "entry" | "mid" | "senior",
  "jobType": "coop" | "fulltime",
  "modificationLevel": "conservative" | "moderate" | "aggressive"
}';

COMMIT;

-- ============================================================================
-- Notes on Idempotency (Task 5)
-- ============================================================================
-- This migration is idempotent and safe to run multiple times:
-- - ALTER COLUMN SET DEFAULT: Replaces the default, safe to repeat
-- - UPDATE for NULL rows: Only affects rows without preferences
-- - UPDATE with jsonb_set: Only updates rows where fields don't exist
-- - COMMENT ON COLUMN: Replaces the comment, safe to repeat
-- - No data is ever overwritten or lost
-- - Transaction ensures atomicity - all or nothing
