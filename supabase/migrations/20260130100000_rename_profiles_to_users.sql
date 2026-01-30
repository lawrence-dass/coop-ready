-- Migration: Rename profiles table to users
-- This migration renames the profiles table to users for clarity.

-- ============================================================
-- 1. RENAME TABLE
-- ============================================================
ALTER TABLE public.profiles RENAME TO users;

-- ============================================================
-- 2. RENAME CONSTRAINTS
-- ============================================================
ALTER TABLE public.users RENAME CONSTRAINT profiles_user_id_unique TO users_user_id_unique;
ALTER TABLE public.users RENAME CONSTRAINT profiles_id_matches_user_id TO users_id_matches_user_id;
ALTER TABLE public.users RENAME CONSTRAINT profiles_pkey TO users_pkey;

-- ============================================================
-- 3. RENAME INDEXES (if any exist with profiles_ prefix)
-- ============================================================
ALTER INDEX IF EXISTS idx_profiles_onboarding_complete RENAME TO idx_users_onboarding_complete;

-- ============================================================
-- 4. UPDATE RLS POLICIES
-- ============================================================
-- Drop old policies and recreate with new names
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users can view their own record"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own record"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own record"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 5. UPDATE TRIGGER
-- ============================================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.users;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. UPDATE AUTO-CREATE FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, user_id)
  VALUES (NEW.id, NEW.id);
  RETURN NEW;
END;
$$;

-- ============================================================
-- 7. UPDATE TABLE COMMENT
-- ============================================================
COMMENT ON TABLE public.users IS 'User data, auto-created on signup via trigger.';
COMMENT ON COLUMN public.users.user_id IS 'Redundant reference to auth.users.id (same as id). Kept for backward compatibility with onboarding queries.';
