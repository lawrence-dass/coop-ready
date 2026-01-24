# Story 1.2: Configure Supabase Database Schema

Status: ready-for-dev

## Story

As a developer,
I want the Supabase database configured with the sessions table and RLS policies,
So that user data is properly isolated and persisted.

## Acceptance Criteria

1. **Given** a Supabase project is connected
   **When** migrations are applied
   **Then** a `sessions` table exists with columns for resume_content, jd_content, analysis, suggestions, anonymous_id, timestamps

2. **Given** sessions table is created
   **When** RLS policies are applied
   **Then** RLS policies enforce user data isolation via anonymous_id

3. **Given** schema is complete
   **When** verified against PRD data model
   **Then** the schema supports all required functionality

## Tasks / Subtasks

- [ ] **Task 1: Create Supabase Migrations Directory** (AC: #1)
  - [ ] Create `/supabase/migrations/` directory
  - [ ] Create initial migration file with timestamp (e.g., `20260124000000_create_sessions_table.sql`)

- [ ] **Task 2: Implement Sessions Table** (AC: #1)
  - [ ] Create `sessions` table with columns:
    - `id` (UUID primary key, auto-generated)
    - `anonymous_id` (UUID, for anonymous user tracking)
    - `user_id` (UUID, nullable, for authenticated users)
    - `resume_content` (TEXT, nullable)
    - `jd_content` (TEXT, nullable)
    - `analysis` (JSONB, nullable, stores keyword analysis results)
    - `suggestions` (JSONB, nullable, stores optimization suggestions)
    - `feedback` (JSONB, nullable, stores user feedback on suggestions)
    - `created_at` (TIMESTAMP WITH TIME ZONE, auto-set)
    - `updated_at` (TIMESTAMP WITH TIME ZONE, auto-update)
  - [ ] Create index on `anonymous_id` for performance
  - [ ] Create index on `user_id` for authenticated user queries
  - [ ] Create index on `created_at` for ordering/filtering

- [ ] **Task 3: Implement RLS Policies** (AC: #2)
  - [ ] Enable RLS on `sessions` table
  - [ ] Create SELECT policy: Users can only see their own sessions (via `anonymous_id` or `user_id`)
  - [ ] Create INSERT policy: Users can insert only their own sessions
  - [ ] Create UPDATE policy: Users can only update their own sessions
  - [ ] Create DELETE policy: Users can only delete their own sessions
  - [ ] Verify RLS policies are correctly scoped

- [ ] **Task 4: Set Up Migration System** (AC: #1)
  - [ ] Create `/supabase/config.json` (if not exists) with project URL
  - [ ] Verify Supabase CLI can connect to project
  - [ ] Run migration: `supabase db push` or manual SQL execution

- [ ] **Task 5: Verify Schema** (AC: #3)
  - [ ] Verify `sessions` table exists in Supabase
  - [ ] Verify all columns are correct type and constraints
  - [ ] Verify indexes are created
  - [ ] Verify RLS policies are active
  - [ ] Test that anonymous users cannot access other sessions

## Dev Notes

### Supabase Schema Design

This story builds the core data persistence layer. The `sessions` table is the foundation for:
- Storing uploaded resumes and job descriptions
- Persisting analysis results and suggestions
- Supporting both anonymous and authenticated users
- Enabling session history retrieval (Epic 10)

### Schema Evolution Path

V0.1 (this story):
- Single `sessions` table for all data
- Anonymous session tracking via `anonymous_id`
- Support for upgrading to authenticated users

Future (V1.0):
- `user_profiles` table (from Epic 8 auth)
- `session_history` table (from Epic 10)
- Add columns for optimization preferences (Epic 11)

### Row-Level Security Strategy

RLS policies must enforce strict data isolation:
- Anonymous users: isolated by `anonymous_id`
- Authenticated users: isolated by `user_id`
- Policy pattern: `(auth.uid() = user_id) OR (anonymous_id = current_anonymous_id())`

Note: For anonymous sessions, we'll use a Zustand store with session ID, not auth system.

### Migration File Location

All migrations go in `/supabase/migrations/` with format:
```
TIMESTAMP_description_of_change.sql
Example: 20260124120000_create_sessions_table.sql
```

This ensures version control of schema changes and reproducible deployments.

### Critical: JSON vs JSONB

- `analysis` and `suggestions` use JSONB (not TEXT/JSON) for:
  - Efficient indexing
  - Query capability on nested properties
  - Better performance on large datasets
  - Future: Support for partial indexes on suggestion quality

### Previous Story Intelligence

From Story 1.1:
- Next.js 16.1.4 with TypeScript 5 configured ✅
- All dependencies installed (@supabase/supabase-js) ✅
- Project structure created ✅
- Ready to connect to backend services

This story builds on that foundation by setting up the database that Story 1.3 will configure via env vars.

### Git Pattern from Recent Commits

Story 1.1 pattern followed:
- Feature branch: `feature/1-1-...`
- Commit message: `feat(story-1-1): ...`
- Format: `feat(story-{epic}-{num}): {description}`

Apply same pattern for this story:
- Branch: `feature/1-2-config-supabase-db` ✅ (auto-created)
- Commit: `feat(story-1-2): Configure Supabase database schema`

### Architecture Compliance

**From architecture-decisions.md:**
- Database: Supabase (Postgres) ✅
- Migrations: SQL files in `/supabase/migrations/` ✅
- RLS: Row-level security on all tables ✅
- File Storage: In-memory parsing (V0.1) - text stored in session ✅

**From architecture-patterns.md:**
- Database naming: snake_case, plural → `sessions` ✅
- Column naming: snake_case → `resume_content`, `anonymous_id` ✅
- Foreign key: `user_id` pattern ✅
- Index naming: `idx_sessions_anonymous_id` ✅

**From project-context.md:**
- Supabase latest version
- Postgres underlying technology
- RLS for security (critical rule)

### Supabase CLI Setup (Prerequisite)

Dev must have Supabase CLI installed:
```bash
npm install -D supabase
supabase init  # if not already done
supabase login  # authenticate to Supabase account
```

Then connect project: `supabase link --project-ref {PROJECT_REF}`

### Testing the Schema (After Implementation)

Quick validation queries:
```sql
-- Verify table structure
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sessions';

-- Verify RLS is enabled
SELECT * FROM pg_tables
WHERE tablename = 'sessions' AND rowsecurity = true;

-- Verify indexes exist
SELECT * FROM pg_indexes
WHERE tablename = 'sessions';

-- Verify RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'sessions';
```

### References

- [Source: architecture/architecture-decisions.md#Data Architecture]
- [Source: architecture/architecture-patterns.md#Database Naming]
- [Source: project-context.md#Directory Structure Rules]
- [Source: epics.md#Story 1.2 Acceptance Criteria]

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_Files created/modified to be listed by dev agent_
