-- Add email column to users table and update trigger to save it

-- 1. Add email column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Update the trigger function to save email on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, user_id, email)
  VALUES (NEW.id, NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- 3. Backfill email for existing users
UPDATE public.users u
SET email = a.email
FROM auth.users a
WHERE u.id = a.id
AND u.email IS NULL;
