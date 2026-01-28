-- ================================================================
-- SubmitSmart: Run ALL missing migrations
-- ================================================================
-- Safe to run even if some objects already exist (uses IF NOT EXISTS).
-- Paste this entire script into Supabase SQL Editor and execute.
-- ================================================================


-- ============================================================
-- 0. SHARED FUNCTION: update_updated_at_column
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 1. PROFILES TABLE (was missing entirely)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT profiles_user_id_unique UNIQUE (user_id),
  CONSTRAINT profiles_id_matches_user_id CHECK (id = user_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies (use DO block to avoid errors if they already exist)
DO $$ BEGIN
  CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-create profile on signup
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Backfill profiles for existing users
INSERT INTO public.profiles (id, user_id)
SELECT id, id FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. SESSIONS TABLE (likely exists, but just in case)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id UUID,
  user_id UUID,
  resume_content TEXT,
  jd_content TEXT,
  analysis JSONB,
  suggestions JSONB,
  feedback JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT sessions_must_have_owner CHECK (anonymous_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_sessions_anonymous_id ON sessions(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own sessions"
    ON sessions FOR SELECT
    USING ((auth.uid() IS NOT NULL AND auth.uid() = user_id) OR (user_id IS NULL AND anonymous_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own sessions"
    ON sessions FOR INSERT
    WITH CHECK ((auth.uid() IS NOT NULL AND auth.uid() = user_id) OR (user_id IS NULL AND anonymous_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own sessions"
    ON sessions FOR UPDATE
    USING ((auth.uid() IS NOT NULL AND auth.uid() = user_id) OR (user_id IS NULL AND anonymous_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own sessions"
    ON sessions FOR DELETE
    USING ((auth.uid() IS NOT NULL AND auth.uid() = user_id) OR (user_id IS NULL AND anonymous_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 3. SESSIONS: Add missing columns
-- ============================================================
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS keyword_analysis JSONB;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ats_score JSONB;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS summary_suggestion JSONB;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS skills_suggestion JSONB;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS experience_suggestion JSONB;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_sessions_keyword_analysis ON sessions USING GIN (keyword_analysis);
CREATE INDEX IF NOT EXISTS idx_sessions_ats_score ON sessions USING GIN (ats_score);
CREATE INDEX IF NOT EXISTS idx_sessions_summary_suggestion ON sessions USING GIN (summary_suggestion);
CREATE INDEX IF NOT EXISTS idx_sessions_skills_suggestion ON sessions(skills_suggestion);
CREATE INDEX IF NOT EXISTS idx_sessions_experience_suggestion ON sessions(experience_suggestion);

-- History optimization index
CREATE INDEX IF NOT EXISTS idx_sessions_user_history
  ON sessions(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;


-- ============================================================
-- 4. PROFILES: Add onboarding columns
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_answers JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_complete ON profiles(onboarding_complete);


-- ============================================================
-- 5. PROFILES: Add optimization preferences column
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS optimization_preferences JSONB DEFAULT jsonb_build_object(
  'tone', 'professional',
  'verbosity', 'detailed',
  'emphasis', 'impact',
  'industry', 'generic',
  'experienceLevel', 'mid'
);


-- ============================================================
-- 6. USER RESUMES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  resume_content TEXT NOT NULL,
  file_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_resume_name UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_user_resumes_user_id ON user_resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_resumes_created_at ON user_resumes(created_at DESC);

ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can only access their own resumes"
    ON user_resumes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS update_user_resumes_updated_at ON user_resumes;
CREATE TRIGGER update_user_resumes_updated_at
  BEFORE UPDATE ON user_resumes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3-resume limit enforcement
CREATE OR REPLACE FUNCTION enforce_resume_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM user_resumes WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'Resume limit exceeded: maximum 3 resumes per user'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_user_resume_limit ON user_resumes;
CREATE TRIGGER enforce_user_resume_limit
  BEFORE INSERT ON user_resumes
  FOR EACH ROW
  EXECUTE FUNCTION enforce_resume_limit();


-- ============================================================
-- DONE
-- ============================================================
-- All tables, columns, indexes, RLS policies, and triggers are now in place.
