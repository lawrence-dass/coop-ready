-- Add onboarding columns to profiles table
-- Story 8-5: Implement Onboarding Flow

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_answers JSONB;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Add index for onboarding_complete for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_complete ON profiles(onboarding_complete);
