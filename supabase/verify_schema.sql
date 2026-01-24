-- Schema Verification Script for Story 1.2
-- Run this after migrations are applied to verify the schema

-- 1. Verify table structure
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;

-- Expected output:
-- sessions | id | uuid | NO | gen_random_uuid()
-- sessions | anonymous_id | uuid | YES | NULL
-- sessions | user_id | uuid | YES | NULL
-- sessions | resume_content | text | YES | NULL
-- sessions | jd_content | text | YES | NULL
-- sessions | analysis | jsonb | YES | NULL
-- sessions | suggestions | jsonb | YES | NULL
-- sessions | feedback | jsonb | YES | NULL
-- sessions | created_at | timestamp with time zone | YES | now()
-- sessions | updated_at | timestamp with time zone | YES | now()

-- 2. Verify RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'sessions';

-- Expected output:
-- public | sessions | true

-- 3. Verify indexes exist
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'sessions'
ORDER BY indexname;

-- Expected output:
-- idx_sessions_anonymous_id | CREATE INDEX idx_sessions_anonymous_id ON public.sessions USING btree (anonymous_id)
-- idx_sessions_created_at | CREATE INDEX idx_sessions_created_at ON public.sessions USING btree (created_at DESC)
-- idx_sessions_user_id | CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id)
-- sessions_pkey | CREATE UNIQUE INDEX sessions_pkey ON public.sessions USING btree (id)

-- 4. Verify RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'sessions'
ORDER BY policyname;

-- Expected output: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- Users can delete their own sessions | PERMISSIVE | {public} | DELETE
-- Users can insert their own sessions | PERMISSIVE | {public} | INSERT
-- Users can update their own sessions | PERMISSIVE | {public} | UPDATE
-- Users can view their own sessions | PERMISSIVE | {public} | SELECT

-- 5. Verify trigger exists
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'sessions';

-- Expected output:
-- update_sessions_updated_at | UPDATE | sessions | BEFORE | EXECUTE FUNCTION update_updated_at_column()

-- 6. Test anonymous user isolation (manual test)
-- INSERT INTO sessions (anonymous_id, resume_content) VALUES ('11111111-1111-1111-1111-111111111111', 'Test resume 1');
-- INSERT INTO sessions (anonymous_id, resume_content) VALUES ('22222222-2222-2222-2222-222222222222', 'Test resume 2');
-- Verify that RLS prevents cross-user access in application layer

-- 7. Verify JSONB columns accept valid JSON
-- INSERT INTO sessions (anonymous_id, analysis) VALUES ('33333333-3333-3333-3333-333333333333', '{"keywords": ["React", "TypeScript"]}');
-- SELECT analysis FROM sessions WHERE anonymous_id = '33333333-3333-3333-3333-333333333333';
