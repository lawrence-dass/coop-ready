-- Add first_name and last_name columns to profiles table
-- Story: Fix Onboarding Flow - Add name fields

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_name TEXT;
