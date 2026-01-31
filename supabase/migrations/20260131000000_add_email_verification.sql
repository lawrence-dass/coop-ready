-- Migration: Add email verification tracking
-- Issue: https://github.com/lawrence-dass/coop-ready/issues/162
--
-- Since Supabase email confirmation is disabled (to allow immediate session),
-- we track verification status ourselves.

-- Add email_verified column (default false for email signups)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Add timestamp for rate limiting verification emails
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMPTZ;

-- Update existing users: if they signed up via OAuth, mark as verified
-- OAuth providers (Google) verify email themselves
UPDATE public.users u
SET email_verified = true
WHERE EXISTS (
  SELECT 1 FROM auth.identities i
  WHERE i.user_id = u.id
  AND i.provider != 'email'
);

-- Also mark verified if Supabase already confirmed their email
UPDATE public.users u
SET email_verified = true
WHERE EXISTS (
  SELECT 1 FROM auth.users au
  WHERE au.id = u.id
  AND au.email_confirmed_at IS NOT NULL
);

-- Comment
COMMENT ON COLUMN public.users.email_verified IS
  'Whether user has verified their email. OAuth users are auto-verified. Email signup users must click verification link.';

COMMENT ON COLUMN public.users.email_verification_sent_at IS
  'Timestamp of last verification email sent. Used for rate limiting (max 1 per 60s).';
