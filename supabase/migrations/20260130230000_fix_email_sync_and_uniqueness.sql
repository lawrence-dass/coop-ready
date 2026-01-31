-- Migration: Fix email capture and add uniqueness constraint
-- Issue: https://github.com/lawrence-dass/coop-ready/issues/159
-- Design: _bmad-output/planning-artifacts/auth-email-fix-design.md

-- ============================================================
-- 1. UPDATE INSERT TRIGGER TO HANDLE CONFLICTS
-- ============================================================
-- This replaces the existing handle_new_user function to:
-- - Insert new users with email from auth.users
-- - Update email on conflict if current email is NULL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, user_id, email)
  VALUES (NEW.id, NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE
    SET email = COALESCE(public.users.email, EXCLUDED.email);
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. CREATE UPDATE TRIGGER FOR EMAIL SYNC
-- ============================================================
-- This handles the case when an anonymous user links an account
-- (e.g., signs in with Google after browsing anonymously)

-- First, create the function that syncs email on update
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only update if email actually changed and new email is not null
  IF (OLD.email IS DISTINCT FROM NEW.email) AND NEW.email IS NOT NULL THEN
    UPDATE public.users
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Then, create the trigger on auth.users
-- Note: This trigger fires AFTER UPDATE specifically on the email column
DROP TRIGGER IF EXISTS on_auth_user_email_update ON auth.users;

CREATE TRIGGER on_auth_user_email_update
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_user_email();

-- ============================================================
-- 3. BACKFILL EXISTING USERS
-- ============================================================
-- Update any public.users records that have NULL email but
-- their corresponding auth.users record has an email
UPDATE public.users pu
SET email = au.email
FROM auth.users au
WHERE pu.id = au.id
  AND pu.email IS NULL
  AND au.email IS NOT NULL;

-- ============================================================
-- 4. ADD UNIQUE CONSTRAINT ON EMAIL
-- ============================================================
-- PostgreSQL UNIQUE constraint allows multiple NULLs,
-- so anonymous users (with NULL email) won't conflict
ALTER TABLE public.users
  ADD CONSTRAINT users_email_unique UNIQUE (email);

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates public.users record on auth.users insert. Handles conflicts with upsert logic to preserve or capture email.';

COMMENT ON FUNCTION public.sync_user_email() IS
  'Syncs email from auth.users to public.users when email changes (e.g., anonymous user links account).';

COMMENT ON TRIGGER on_auth_user_email_update ON auth.users IS
  'Fires when auth.users.email changes to sync email to public.users.';
