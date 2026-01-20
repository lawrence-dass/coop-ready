-- Migration: Create scans table with RLS
-- Story: 3.5 Job Description Input
-- Date: 2026-01-20
--
-- Instructions:
-- Run this SQL in the Supabase SQL Editor or via Supabase CLI
-- This creates the scans table and RLS policies

-- Create scans table
CREATE TABLE public.scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  job_description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX idx_scans_user_id ON public.scans(user_id);
CREATE INDEX idx_scans_resume_id ON public.scans(resume_id);
CREATE INDEX idx_scans_status ON public.scans(status);
CREATE INDEX idx_scans_created_at ON public.scans(created_at DESC);

-- Enable RLS on scans table
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view own scans
CREATE POLICY "Users can view own scans"
  ON public.scans FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert own scans
CREATE POLICY "Users can insert own scans"
  ON public.scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update own scans
CREATE POLICY "Users can update own scans"
  ON public.scans FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete own scans
CREATE POLICY "Users can delete own scans"
  ON public.scans FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scans_updated_at
  BEFORE UPDATE ON public.scans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
