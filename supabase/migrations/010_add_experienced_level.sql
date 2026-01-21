-- Migration: Add 'experienced' to experience_level enum
-- Story: 4.5 Experience-Level-Aware Analysis
-- Date: 2026-01-20
--
-- Instructions:
-- Run this SQL in the Supabase SQL Editor or via Supabase CLI
-- This adds 'experienced' as a valid option for experience_level in user_profiles table

-- Drop the existing CHECK constraint
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_experience_level_check;

-- Add new CHECK constraint with all three values
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_experience_level_check
  CHECK (experience_level IN ('student', 'career_changer', 'experienced'));

-- Add index on experience_level for filtering (AC: Task 1)
CREATE INDEX IF NOT EXISTS idx_user_profiles_experience_level
  ON public.user_profiles(experience_level);

-- Add comment documenting the experience levels
COMMENT ON COLUMN public.user_profiles.experience_level IS 'User experience level: student (academic/recent grad), career_changer (transitioning to tech), experienced (2+ years tech)';
