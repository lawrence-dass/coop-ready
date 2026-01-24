# Database Schema Testing Guide

This guide covers how to test and verify the Supabase database schema after deployment.

## Prerequisites

1. Docker Desktop running
2. Supabase CLI installed
3. Local Supabase started: `npx supabase start`

## Automated Verification

Run the verification script to check the schema:

```bash
# Connect to local Supabase Postgres
npx supabase db reset  # Applies migrations

# Run verification queries
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/verify_schema.sql
```

## Manual Testing Steps

### 1. Verify Table Creation

```sql
-- Check table exists
SELECT * FROM information_schema.tables WHERE table_name = 'sessions';

-- Check all columns
\d sessions
```

Expected columns:
- `id` (UUID, PK, auto-generated)
- `anonymous_id` (UUID, nullable)
- `user_id` (UUID, nullable)
- `resume_content` (TEXT, nullable)
- `jd_content` (TEXT, nullable)
- `analysis` (JSONB, nullable)
- `suggestions` (JSONB, nullable)
- `feedback` (JSONB, nullable)
- `created_at` (TIMESTAMPTZ, auto-set)
- `updated_at` (TIMESTAMPTZ, auto-updated)

### 2. Test Row Level Security (RLS)

```sql
-- Enable RLS (should already be enabled)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Test anonymous user session
INSERT INTO sessions (anonymous_id, resume_content)
VALUES ('11111111-1111-1111-1111-111111111111', 'Test anonymous resume');

-- Test authenticated user session (when auth is implemented)
INSERT INTO sessions (user_id, resume_content)
VALUES ('22222222-2222-2222-2222-222222222222', 'Test auth resume');

-- Verify both exist
SELECT id, anonymous_id, user_id FROM sessions;
```

### 3. Test JSONB Columns

```sql
-- Insert session with analysis
INSERT INTO sessions (
  anonymous_id,
  resume_content,
  jd_content,
  analysis,
  suggestions
)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Software Engineer with 5 years React experience',
  'Looking for Senior React Developer',
  '{"keywords": {"matched": ["React"], "missing": ["TypeScript", "Node.js"]}, "score": 65}',
  '{"summary": "Add TypeScript and Node.js to skills section", "items": [{"section": "skills", "suggestion": "TypeScript, Node.js"}]}'
);

-- Query JSONB data
SELECT
  id,
  analysis->>'score' as ats_score,
  suggestions->'summary' as suggestion_summary
FROM sessions
WHERE anonymous_id = '33333333-3333-3333-3333-333333333333';
```

### 4. Test Indexes

```sql
-- Verify indexes are being used
EXPLAIN ANALYZE
SELECT * FROM sessions
WHERE anonymous_id = '11111111-1111-1111-1111-111111111111';

-- Should show "Index Scan using idx_sessions_anonymous_id"

EXPLAIN ANALYZE
SELECT * FROM sessions
ORDER BY created_at DESC
LIMIT 10;

-- Should show "Index Scan using idx_sessions_created_at"
```

### 5. Test Auto-Update Trigger

```sql
-- Insert a session
INSERT INTO sessions (anonymous_id, resume_content)
VALUES ('44444444-4444-4444-4444-444444444444', 'Initial content')
RETURNING id, created_at, updated_at;

-- Note the updated_at timestamp
-- Wait a second, then update
SELECT pg_sleep(1);

UPDATE sessions
SET resume_content = 'Updated content'
WHERE anonymous_id = '44444444-4444-4444-4444-444444444444'
RETURNING id, created_at, updated_at;

-- Verify updated_at changed but created_at stayed the same
```

### 6. Test RLS Policy Enforcement

This requires application-level testing since RLS uses `auth.uid()` which needs the Supabase Auth context:

```typescript
// In your Next.js application (after Story 1.3)
import { createClient } from '@/lib/supabase/client';

// Test anonymous access
const supabase = createClient();

// Try to insert a session
const { data, error } = await supabase
  .from('sessions')
  .insert({
    anonymous_id: crypto.randomUUID(),
    resume_content: 'Test resume'
  });

// Should succeed if RLS policies allow anonymous inserts

// Try to read another user's session (should fail)
const { data: otherSession } = await supabase
  .from('sessions')
  .select('*')
  .eq('anonymous_id', 'different-uuid');

// Should return empty array due to RLS
```

## Expected Test Results

✅ **All tests should pass:**
1. Table created with correct schema
2. All indexes exist and are used in queries
3. RLS is enabled on sessions table
4. 4 RLS policies exist (SELECT, INSERT, UPDATE, DELETE)
5. Trigger auto-updates `updated_at` on modification
6. JSONB columns accept and query JSON data correctly
7. Users cannot access other users' sessions

## Cleanup

```sql
-- Remove test data
DELETE FROM sessions WHERE anonymous_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);
```

## Troubleshooting

### Docker not running
```bash
# Start Docker Desktop
# Then run: npx supabase start
```

### Migration fails
```bash
# Reset database and reapply migrations
npx supabase db reset
```

### RLS blocking queries
```bash
# Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'sessions';

# Temporarily disable RLS for debugging (NOT in production!)
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
```
