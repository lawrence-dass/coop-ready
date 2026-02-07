# Story 2.3: Epic 2 Integration and Verification Testing

Status: backlog

## Story

As a developer,
I want to verify that all Epic 2 stories (anonymous authentication and session persistence) integrate correctly,
So that users can access the app without authentication and have their work saved across refreshes.

## Acceptance Criteria

1. **Given** Epic 2 stories are complete
   **When** I test anonymous authentication
   **Then** users are automatically given an anonymous session with unique anonymous_id

2. **Given** a user has uploaded resume and entered JD
   **When** they refresh the page or close/reopen browser
   **Then** all data persists in the session via Supabase and Zustand store

3. **Given** Epic 1 foundation is verified
   **When** Epic 2 features integrate with environment and database
   **Then** no connection errors occur, all data flows correctly

4. **Given** Epic 2 is complete
   **When** I execute the verification checklist
   **Then** anonymous access is working end-to-end and Epic 3 (file upload) is unblocked

## Tasks / Subtasks

- [ ] **Task 1: Anonymous Authentication Verification** (AC: #1)
  - [ ] Verify Supabase Auth anonymous sign-in works
  - [ ] Verify anonymous_id is generated and stored
  - [ ] Verify anonymous session created in sessions table
  - [ ] Verify RLS policies allow anonymous access
  - [ ] Test creating new user → different anonymous_id each time

- [ ] **Task 2: Session Persistence Verification** (AC: #2)
  - [ ] Verify resumeContent saves to Supabase sessions table
  - [ ] Verify jdContent saves to Supabase sessions table
  - [ ] Verify data persists after page refresh
  - [ ] Verify data persists after browser close/reopen
  - [ ] Verify Zustand store initializes with persisted data

- [ ] **Task 3: Integration Points Verification** (AC: #3)
  - [ ] Verify environment variables load correctly
  - [ ] Verify Supabase client initializes without errors
  - [ ] Verify migrations are applied (sessions table exists)
  - [ ] Verify types from Epic 1 work with Epic 2 implementation
  - [ ] Verify ActionResponse pattern used in all server actions

- [ ] **Task 4: Create Verification Checklist** (AC: #4)
  - [ ] Create `/docs/EPIC-2-VERIFICATION.md` with step-by-step guide
  - [ ] Include anonymous auth verification steps
  - [ ] Include session persistence verification steps
  - [ ] Include troubleshooting section
  - [ ] Update README with reference to verification guide

## Dev Notes

### What Epic 2 Delivers

- **Story 2.1:** Anonymous Authentication - Users get automatic session without signup
- **Story 2.2:** Session Persistence - Work survives page refreshes and browser close/reopen
- **Verification Goal:** Zero-friction access + data persistence across sessions

### Integration Points to Verify

1. **Supabase Anonymous Auth** → Creates anonymous_id
2. **Sessions Table RLS** → Anonymous users can read/write their own row
3. **Zustand Store** → Holds resumeContent, jdContent in memory
4. **Database Sync** → Store ↔ Supabase sessions table sync
5. **Environment Variables** → Supabase URL/keys loaded correctly

### Files to Check

- `/lib/supabase/client.ts` - Supabase client initialization
- `/store/*.ts` - Zustand store implementation
- `/lib/supabase/*.ts` - Session persistence functions
- Type usage: ActionResponse, OptimizationSession from `/types`

### Verification Success Criteria

✅ Can access app anonymously (no signup required)
✅ User data saves to Supabase
✅ Data persists across page refreshes
✅ Data persists across browser sessions
✅ Multiple concurrent users have separate sessions
✅ No console errors during session operations
✅ All error scenarios handled with ActionResponse pattern

### References

- [Source: Story 1.1] - TypeScript, App Router setup
- [Source: Story 1.2] - Supabase database and RLS
- [Source: Story 1.3] - Environment configuration
- [Source: Story 1.4] - Types and ActionResponse pattern
