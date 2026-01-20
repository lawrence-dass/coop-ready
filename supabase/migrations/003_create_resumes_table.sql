-- Migration: Create resumes table and resume-uploads storage bucket with RLS
-- Story: 3.1 Resume Upload with Validation
-- Date: 2026-01-20
--
-- Instructions:
-- Run this SQL in the Supabase SQL Editor or via Supabase CLI
-- This creates the resumes table, storage bucket, and all RLS policies

-- Create resumes table
CREATE TABLE public.resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx')),
  file_size INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index for faster user queries
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);

-- Enable RLS on resumes table
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view own resumes
CREATE POLICY "Users can view own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert own resumes
CREATE POLICY "Users can insert own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete own resumes
CREATE POLICY "Users can delete own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for resume uploads (private)
-- Uses ON CONFLICT to make migration idempotent (safe to re-run)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resume-uploads',
  'resume-uploads',
  false,
  2097152, -- 2MB in bytes
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policy: Users can upload resumes to their own folder
CREATE POLICY "Users can upload resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resume-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS Policy: Users can read own resumes
CREATE POLICY "Users can read own resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resume-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS Policy: Users can delete own resumes
CREATE POLICY "Users can delete own resumes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resume-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
