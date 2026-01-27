# Story 10.2: Implement Session Reload

Status: ready-for-dev

## Story

As a user,
I want to reload a previous optimization session,
So that I can review or continue my work.

## Acceptance Criteria

1. User can click on a history entry to open the session details
2. Session details view loads and displays:
   - Original resume content
   - Original job description
   - Previous analysis results (ATS score, keyword gaps)
   - Previous suggestions for each section
3. All data is presented in read-only view initially
4. User can trigger a new optimization with the same inputs
5. User can copy previous suggestions to clipboard
6. Session reload completes within 2 seconds
7. Loading state is shown while fetching session data

## Tasks / Subtasks

- [ ] Task 1: Create server action to fetch single session (AC: #1, #2, #6, #7)
  - [ ] Implement `getOptimizationSession` server action
  - [ ] Query `sessions` table by session_id
  - [ ] Return ActionResponse<OptimizationSession>
  - [ ] Verify user owns the session (user_id check)
  - [ ] Include timeout protection
- [ ] Task 2: Build session detail view component (AC: #2, #3, #5, #6, #7)
  - [ ] Create `SessionDetailView.tsx` component
  - [ ] Display resume content in read-only card
  - [ ] Display JD content in read-only card
  - [ ] Display previous analysis/score
  - [ ] Display previous suggestions grouped by section
  - [ ] Add copy-to-clipboard buttons for suggestions
  - [ ] Show loading skeleton while fetching
  - [ ] Handle error state gracefully
- [ ] Task 3: Add routing for session details (AC: #1)
  - [ ] Create `/history/[sessionId]` dynamic route
  - [ ] Protect route with auth check
  - [ ] Validate session_id parameter format
  - [ ] Redirect to history if invalid session
- [ ] Task 4: Integrate session reload with optimization flow (AC: #4)
  - [ ] Add "Optimize Again" button to session detail view
  - [ ] Button pre-fills resume and JD in main optimization form
  - [ ] Navigate to `/optimize` route after pre-fill
  - [ ] Preserve previous suggestions as reference (optional display)
- [ ] Task 5: Update store to track loaded session (AC: #2, #4)
  - [ ] Add `currentSession` to Zustand store
  - [ ] Add `setCurrentSession` action
  - [ ] Add `clearCurrentSession` action
  - [ ] Component uses store to display session data
  - [ ] Store persists across navigation (until cleared)
- [ ] Task 6: Write tests for session reload functionality (AC: all)
  - [ ] Test server action returns correct session data
  - [ ] Test user isolation (can't access other users' sessions)
  - [ ] Test UI renders session data correctly
  - [ ] Test "Optimize Again" pre-fills form
  - [ ] Test error handling for missing/deleted sessions
  - [ ] Test navigation after clicking session entry

## Dev Notes

### Architecture Patterns

- **Database Access**: Use `/lib/supabase/` function to fetch single session by ID with user_id filter
- **Error Handling**: Follow ActionResponse<T> pattern. Return `UNAUTHORIZED` if user doesn't own session, `SESSION_NOT_FOUND` if deleted
- **State Management**: Store loaded session in Zustand, but don't persist to localStorage (sessions are for this browsing session only)
- **Navigation**: Use Next.js `useRouter` for programmatic navigation to `/optimize`
- **Read-only Display**: Reuse existing suggestion cards but disable interactive features

### Source Tree Components to Touch

1. `/lib/supabase/` - Add function to query single session with user validation
2. `/components/shared/` - Create SessionDetailView component
3. `/store/` - Update Zustand store with `currentSession` state
4. `/actions/` - Create server action for fetching session
5. `/app/(app)/history/[sessionId]/` - Create new dynamic route/page
6. `/app/(app)/optimize/` - Modify form component to accept pre-filled data from store

### Testing Standards Summary

- Use Vitest for server action unit tests (auth validation, user isolation)
- Use React Testing Library for component rendering tests
- Mock Supabase client for isolation
- Test navigation behavior with next/router mock
- E2E with Playwright: navigate to history → click session → view details → click "Optimize Again" → verify form pre-filled

### Project Structure Notes

- Session data shape reuses existing `sessions` table structure; no new database schema needed
- Add error code `SESSION_NOT_FOUND` to types/error-codes.ts
- Add error code `UNAUTHORIZED` (if not already present) to types/error-codes.ts
- Keep session ID validation strict (UUID format) to prevent injection
- SessionDetailView can import existing SuggestionCard components for consistency

### References

- **Server Actions**: [Source: _bmad-output/project-context.md#API Patterns]
- **ActionResponse Pattern**: [Source: _bmad-output/project-context.md#ActionResponse Pattern]
- **Zustand Pattern**: [Source: _bmad-output/project-context.md#Zustand Store Pattern]
- **Suggestion Components**: Reuse from Story 6-5 implementation
- **Navigation**: Next.js App Router useRouter hook
- **User Isolation**: Supabase RLS policies via user_id column in sessions table

## Dev Agent Record

### Agent Model Used

To be filled in by dev agent

### Debug Log References

(None yet)

### Completion Notes List

(None yet)

### File List

(Will be updated during implementation)
