-- Migration: Add optimization_preferences column to profiles table
-- Story: 11.2 - Implement Optimization Preferences
-- Date: 2026-01-27
--
-- This migration adds a JSONB column to store user optimization preferences
-- for customizing LLM suggestion generation.

-- Add optimization_preferences column with default values
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS optimization_preferences JSONB DEFAULT jsonb_build_object(
  'tone', 'professional',
  'verbosity', 'detailed',
  'emphasis', 'impact',
  'industry', 'generic',
  'experienceLevel', 'mid'
);

-- Add comment documenting the column structure
COMMENT ON COLUMN profiles.optimization_preferences IS
'User optimization preferences for LLM suggestion generation. JSON structure:
{
  "tone": "professional" | "technical" | "casual",
  "verbosity": "concise" | "detailed" | "comprehensive",
  "emphasis": "skills" | "impact" | "keywords",
  "industry": "tech" | "finance" | "healthcare" | "generic",
  "experienceLevel": "entry" | "mid" | "senior"
}';

-- No additional indexes needed - JSONB operations are infrequent (only on load/save)
-- GIN index would add overhead for minimal benefit given access patterns
