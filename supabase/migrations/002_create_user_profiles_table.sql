-- Migration: Create user_profiles table with RLS and triggers
-- Story: 2.1 Onboarding Flow - Experience Level & Target Role
-- Date: 2026-01-19
--
-- Instructions:
-- Run this SQL in the Supabase SQL Editor or via Supabase CLI
-- This creates the user_profiles table, RLS policies, and auto-update trigger

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('student', 'career_changer')),
  target_role TEXT NOT NULL,
  custom_role TEXT,
  onboarding_completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert own profile
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger: Update updated_at on change
-- Note: Reuses existing update_updated_at() function from migration 001
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
