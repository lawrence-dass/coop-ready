# Story 10.1: Implement History List View

Status: ready-for-dev

## Story

As a user,
I want to view my past optimization sessions,
So that I can review what I've done before.

## Acceptance Criteria

1. User can navigate to a history page when signed in
2. History page displays up to 10 past optimization sessions
3. Each session entry shows:
   - Date/time of optimization (formatted readable, e.g., "Jan 24, 2:30 PM")
   - Resume name (if available from library)
   - Job title or company (extracted from JD if identifiable)
   - Brief preview of the JD or optimization results
4. Sessions are sorted with most recent first
5. History page is responsive and works on mobile
6. If no history exists, user sees a helpful empty state message
7. Loading state is shown while fetching history from Supabase

## Tasks / Subtasks

- [ ] Task 1: Set up database schema for history tracking (AC: #1, #2, #3)
  - [ ] Create `optimization_history` table in Supabase with columns: id, user_id, resume_content, jd_content, analysis, suggestions, created_at
  - [ ] Add RLS policies to enforce user_id-based access
  - [ ] Add migration file to apply schema changes
- [ ] Task 2: Create server action to fetch history (AC: #1, #4)
  - [ ] Implement `fetchOptimizationHistory` server action
  - [ ] Query last 10 sessions ordered by created_at DESC
  - [ ] Return ActionResponse<HistorySession[]>
  - [ ] Extract resume_name and job_title from stored content
- [ ] Task 3: Build history list UI component (AC: #2, #3, #4, #5, #6, #7)
  - [ ] Create `HistoryListView.tsx` component
  - [ ] Display loading skeleton while fetching
  - [ ] Show empty state if no history
  - [ ] Render list of sessions with metadata
  - [ ] Ensure mobile-responsive layout using Tailwind
  - [ ] Format dates using appropriate locale
- [ ] Task 4: Add navigation to history page (AC: #1)
  - [ ] Add sidebar link to history page
  - [ ] Create `/optimization/history` route (or appropriate path)
  - [ ] Protect route with auth check (redirect to login if not authenticated)
- [ ] Task 5: Integrate with Zustand store (AC: #1, #7)
  - [ ] Add `historyItems` and `isLoadingHistory` to store
  - [ ] Add `setHistoryItems` and `setLoadingHistory` actions
  - [ ] Update component to use Zustand for state management
- [ ] Task 6: Write tests for history functionality (AC: all)
  - [ ] Test server action returns correct data shape
  - [ ] Test RLS policies prevent unauthorized access
  - [ ] Test UI renders correctly with sample data
  - [ ] Test empty state displays when no history
  - [ ] Test loading state shows during fetch

## Dev Notes

### Architecture Patterns

- **Database Access**: Use `/lib/supabase/` for all Supabase queries. Fetch via server action, not from component directly.
- **Error Handling**: Follow ActionResponse<T> pattern. Catch errors and return `{ data: null, error: { message, code } }`
- **State Management**: Use Zustand store to persist fetched history during session
- **UI Components**: Use shadcn/ui Card components for history entries, Skeleton for loading

### Source Tree Components to Touch

1. `app/api/` - Consider if any REST endpoints needed (likely not, server actions sufficient)
2. `/lib/supabase/` - Add function to query `optimization_history` table
3. `/components/shared/` - Create HistoryListView component
4. `/store/` - Update store to include history state
5. `/actions/` - Create server action for fetching history
6. `/app/(app)/optimization/history/` - Create new route/page

### Testing Standards Summary

- Use Vitest + React Testing Library for component tests
- Test server actions via direct invocation
- Mock Supabase client for unit tests
- Use Playwright for e2e: navigate to history page, verify sessions display
- See `docs/TESTING.md` for full testing setup

### Project Structure Notes

- API routes use `/api/optimize` pattern for long-running operations (LLM). History fetch is quick, so server action is better.
- Follow naming: `optimization_history` (snake_case, plural) for table; `optimizationHistory` (camelCase) for TypeScript
- Transform DB snake_case to camelCase at boundaries per project-context.md
- Keep LLM isolation: history is pure data retrieval, no LLM calls needed here

### References

- **Database Schema**: Will define in this task (new table)
- **UI Design**: History entries follow card pattern from `_bmad-output/planning-artifacts/ux-design-specification.md` (cards with metadata)
- **ActionResponse Pattern**: [Source: _bmad-output/project-context.md#ActionResponse Pattern]
- **Server Actions**: [Source: _bmad-output/project-context.md#API Patterns]
- **Zustand Pattern**: [Source: _bmad-output/project-context.md#Zustand Store Pattern]
- **Error Codes**: Use `VALIDATION_ERROR` if user not authenticated, `LLM_ERROR` as fallback for DB errors (or create `DB_ERROR` if preferred)
- **RLS**: [Source: _bmad-output/planning-artifacts/architecture.md] - All user data tables require RLS via user_id

## Dev Agent Record

### Agent Model Used

To be filled in by dev agent

### Debug Log References

(None yet)

### Completion Notes List

(None yet)

### File List

(Will be updated during implementation)
