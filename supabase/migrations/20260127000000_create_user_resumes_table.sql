-- Migration: Create user_resumes table for authenticated user resume library
-- Story: 9.1 Implement Save Resume to Library
-- Date: 2026-01-27

-- Create user_resumes table
CREATE TABLE user_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  resume_content TEXT NOT NULL,
  file_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure user can't have duplicate resume names
  CONSTRAINT unique_user_resume_name UNIQUE(user_id, name)
);

-- Create indexes for performance
CREATE INDEX idx_user_resumes_user_id ON user_resumes(user_id);
CREATE INDEX idx_user_resumes_created_at ON user_resumes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own resumes
-- USING controls SELECT/UPDATE/DELETE visibility
-- WITH CHECK controls INSERT/UPDATE new-row validation
CREATE POLICY "Users can only access their own resumes"
  ON user_resumes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_user_resumes_updated_at
  BEFORE UPDATE ON user_resumes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enforce 3-resume limit per user at the database level
-- Prevents race conditions where concurrent requests bypass application-level checks
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

CREATE TRIGGER enforce_user_resume_limit
  BEFORE INSERT ON user_resumes
  FOR EACH ROW
  EXECUTE FUNCTION enforce_resume_limit();
