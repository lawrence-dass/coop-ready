-- Migration: Add experience_level_context to scans table
-- Story: 4.5 Experience-Level-Aware Analysis
-- Date: 2026-01-20
--
-- Instructions:
-- Run this SQL in the Supabase SQL Editor or via Supabase CLI
-- Adds column to store the experience context narrative used during analysis

-- Add experience_level_context column (AC: 10)
-- Stores the narrative context passed to OpenAI (not just the level)
ALTER TABLE public.scans
  ADD COLUMN experience_level_context TEXT;

-- Add comment documenting the context field purpose
COMMENT ON COLUMN public.scans.experience_level_context IS 'Narrative context describing how to analyze this resume based on user experience level (student/career_changer/experienced). Used for prompt injection and debugging.';

-- Note: Column is nullable initially (set during analysis)
-- Note: RLS policies already exist on scans table (users can view own experience context)
