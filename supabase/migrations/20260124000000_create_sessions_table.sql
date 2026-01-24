-- Migration: Create sessions table for anonymous and authenticated user sessions
-- Story: 1.2 Configure Supabase Database Schema
-- Date: 2026-01-24

-- Create sessions table
CREATE TABLE sessions (
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
  -- Ensure every session has an owner (anonymous or authenticated)
  CONSTRAINT sessions_must_have_owner CHECK (anonymous_id IS NOT NULL OR user_id IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX idx_sessions_anonymous_id ON sessions(anonymous_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions table
-- Security model:
--   - Authenticated users: auth.uid() matches user_id
--   - Anonymous users: anonymous_id passed via request header (x-anonymous-id) or
--     using Supabase anonymous auth (auth.uid() stored in anonymous_id)
-- Note: V0.1 uses service role key for anonymous operations (RLS bypassed server-side)
-- V1.0+ will use Supabase anonymous auth for proper RLS enforcement

-- SELECT policy: Users can only see their own sessions
CREATE POLICY "Users can view their own sessions"
  ON sessions
  FOR SELECT
  USING (
    -- Authenticated user accessing their session
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    -- OR anonymous user via Supabase anonymous auth (anonymous_id = auth.uid())
    OR (user_id IS NULL AND anonymous_id = auth.uid())
  );

-- INSERT policy: Users can insert their own sessions
CREATE POLICY "Users can insert their own sessions"
  ON sessions
  FOR INSERT
  WITH CHECK (
    -- Authenticated user creating their session
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    -- OR anonymous user via Supabase anonymous auth
    OR (user_id IS NULL AND anonymous_id = auth.uid())
  );

-- UPDATE policy: Users can only update their own sessions
CREATE POLICY "Users can update their own sessions"
  ON sessions
  FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (user_id IS NULL AND anonymous_id = auth.uid())
  );

-- DELETE policy: Users can only delete their own sessions
CREATE POLICY "Users can delete their own sessions"
  ON sessions
  FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (user_id IS NULL AND anonymous_id = auth.uid())
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
