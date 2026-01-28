-- Migration: Create profiles table
-- This migration MUST run before all other profile-related migrations.
-- It creates the base profiles table, RLS policies, auto-creation trigger,
-- and backfills profiles for any existing auth users.
--
-- NOTE: Both 'id' and 'user_id' are set to auth.users.id to satisfy
-- two different query patterns in the codebase:
--   - preferences.ts uses .eq('id', user.id)
--   - onboarding code uses .eq('user_id', user.id)

-- ============================================================
-- 1. CREATE TABLE
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT profiles_user_id_unique UNIQUE (user_id),
  CONSTRAINT profiles_id_matches_user_id CHECK (id = user_id)
);

COMMENT ON TABLE public.profiles IS 'User profile data, auto-created on signup via trigger.';
COMMENT ON COLUMN public.profiles.user_id IS 'Redundant reference to auth.users.id (same as id). Kept for backward compatibility with onboarding queries.';

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (for trigger / edge cases)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 3. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id)
  VALUES (NEW.id, NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 4. AUTO-UPDATE updated_at ON CHANGE
-- ============================================================
-- Define the shared updated_at function here (runs before sessions migration).
-- Sessions migration uses CREATE OR REPLACE so no conflict.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. BACKFILL: Create profiles for any existing auth users
-- ============================================================
INSERT INTO public.profiles (id, user_id)
SELECT id, id FROM auth.users
ON CONFLICT (id) DO NOTHING;
