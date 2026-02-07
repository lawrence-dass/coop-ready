# Story 2.2: Implement Session Persistence

Status: done

## Story

As a user,
I want my optimization work to persist across page refreshes,
So that I don't lose my progress if I accidentally close the browser.

## Acceptance Criteria

1. **Given** I have uploaded a resume and entered a job description
   **When** I refresh the page or close and reopen the browser
   **Then** my resume content is still available

2. **Given** I have analysis results from a previous session
   **When** I return to the app
   **Then** my analysis results (if any) are restored

3. **Given** I have suggestions from a previous session
   **When** I return to the app
   **Then** my suggestions (if any) are restored

4. **Given** I am using the app
   **When** any data changes (resume, JD, analysis, suggestions)
   **Then** the session is automatically saved to the database

5. **Given** I have an anonymous session
   **When** I check the database
   **Then** the session is linked to my `anonymous_id` (from `auth.uid()`)

## Tasks / Subtasks

- [x] **Task 1: Create Session Database Operations** (AC: #4, #5)
  - [x] Create `/lib/supabase/sessions.ts` with session CRUD functions
  - [x] Implement `createSession(anonymousId)` - creates new session record
  - [x] Implement `getSessionByAnonymousId(anonymousId)` - retrieves existing session
  - [x] Implement `updateSession(sessionId, data)` - updates session fields
  - [x] All functions return `ActionResponse<T>` pattern
  - [x] Transform snake_case (DB) → camelCase (TS) at boundary
  - [x] Add to barrel export in `/lib/supabase/index.ts`

- [x] **Task 2: Create Zustand Store Implementation** (AC: #1, #2, #3)
  - [x] Create `/store/useOptimizationStore.ts` implementing `OptimizationStore` interface
  - [x] Add `sessionId` to store state (for database sync)
  - [x] Implement all actions from `/types/store.ts`
  - [x] Add `loadFromSession(session)` action to hydrate store from DB data
  - [x] Add `selectSessionData()` selector to extract data for saving
  - [x] Create barrel export `/store/index.ts`

- [x] **Task 3: Implement Session Auto-Save Hook** (AC: #4)
  - [x] Create `/hooks/useSessionSync.ts` hook
  - [x] Watch for store changes (resumeContent, jobDescription, analysisResult, suggestions)
  - [x] Debounce saves (500ms) to avoid excessive DB writes
  - [x] Auto-save to database when data changes
  - [x] Handle save errors gracefully (show toast, don't block user)
  - [x] Skip save if data hasn't actually changed (hash comparison)

- [x] **Task 4: Implement Session Restoration Hook** (AC: #1, #2, #3)
  - [x] Create `/hooks/useSessionRestore.ts` hook
  - [x] On app mount, check for existing session by `anonymous_id`
  - [x] If session exists, hydrate Zustand store with saved data
  - [x] If no session, create new empty session
  - [x] Handle loading state during restoration
  - [x] Create barrel export `/hooks/index.ts`

- [x] **Task 5: Integrate with Auth Provider** (AC: #5)
  - [x] Create `/components/providers/SessionProvider.tsx`
  - [x] Use `useAuth()` to get `anonymousId`
  - [x] Trigger session restore after auth is ready
  - [x] Render sync hook to enable auto-save
  - [x] Update `app/layout.tsx` to include SessionProvider
  - [x] Ensure session operations wait for auth to complete

## Dev Notes

### Session Persistence Architecture

**Data Flow:**
```
User Action → Zustand Store → Debounced Auto-Save → Supabase DB
                   ↑                                    ↓
Page Load ← Store Hydration ← Session Restore ← Auth Ready
```

**Key Insight:** The Zustand store is the source of truth during runtime. The database is the persistence layer. On page load, we restore from DB to store. On changes, we sync from store to DB.

### Database Schema (from Story 1.2)

The `sessions` table stores all persistence data:

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id UUID,           -- Links to auth.uid() for anonymous users
  user_id UUID,                -- NULL for anonymous sessions
  resume_content TEXT,         -- Stores Resume as JSON string
  jd_content TEXT,             -- Stores JobDescription as JSON string
  analysis JSONB,              -- Stores AnalysisResult
  suggestions JSONB,           -- Stores SuggestionSet
  feedback JSONB,              -- User feedback on suggestions
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Column Mapping:**
| DB Column (snake_case) | TS Property (camelCase) | Type |
|------------------------|-------------------------|------|
| `resume_content` | `resumeContent` | TEXT (JSON string) |
| `jd_content` | `jobDescription` | TEXT (JSON string) |
| `analysis` | `analysisResult` | JSONB |
| `suggestions` | `suggestions` | JSONB |
| `anonymous_id` | `anonymousId` | UUID |

### Session Database Operations Pattern

**File: `/lib/supabase/sessions.ts`**

```typescript
import { createClient } from './client';
import type { ActionResponse } from '@/types';
import type { OptimizationSession, Resume, JobDescription, AnalysisResult, SuggestionSet } from '@/types/optimization';

// Database row type (snake_case)
interface SessionRow {
  id: string;
  anonymous_id: string;
  user_id: string | null;
  resume_content: string | null;
  jd_content: string | null;
  analysis: AnalysisResult | null;
  suggestions: SuggestionSet | null;
  feedback: Record<string, 'helpful' | 'not-helpful'> | null;
  created_at: string;
  updated_at: string;
}

// Transform DB row to TypeScript type
function toOptimizationSession(row: SessionRow): OptimizationSession {
  return {
    id: row.id,
    anonymousId: row.anonymous_id,
    userId: row.user_id,
    resumeContent: row.resume_content ? JSON.parse(row.resume_content) : null,
    jobDescription: row.jd_content ? JSON.parse(row.jd_content) : null,
    analysisResult: row.analysis,
    suggestions: row.suggestions,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
```

### Zustand Store Implementation

**File: `/store/useOptimizationStore.ts`**

The store extends `OptimizationStore` interface with session tracking:

```typescript
interface ExtendedStore extends OptimizationStore {
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  loadFromSession: (session: OptimizationSession) => void;
}
```

### Session Sync Hook Pattern

**File: `/hooks/useSessionSync.ts`**

Key features:
- Debounced save (500ms)
- State hash comparison to skip unchanged saves
- Error handling with toast notification
- Cleanup on unmount

```typescript
useEffect(() => {
  if (!sessionId) return;

  const stateHash = JSON.stringify({ resumeContent, jobDescription, analysisResult, suggestions });
  if (stateHash === lastSaveRef.current) return; // Skip if unchanged

  // Debounced save...
}, [sessionId, resumeContent, jobDescription, analysisResult, suggestions]);
```

### Session Provider Pattern

**File: `/components/providers/SessionProvider.tsx`**

Orchestrates session restoration and sync:

```typescript
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { anonymousId, isLoading: authLoading } = useAuth();
  const { isRestoring } = useSessionRestore({ anonymousId });

  // Render sync hook to enable auto-save
  useSessionSync();

  // Show loading while auth or session is loading
  if (authLoading || isRestoring) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
```

### Previous Story Learnings (Story 2.1)

**Created in Story 2.1:**
- `lib/supabase/client.ts` - Browser client with `createBrowserClient`
- `lib/supabase/server.ts` - Server client with cookie handling
- `lib/supabase/auth.ts` - Auth functions (`signInAnonymously`, `getSession`, `signOut`)
- `lib/supabase/helpers.ts` - `getAnonymousId()` helper
- `lib/supabase/index.ts` - Barrel exports
- `components/providers/AuthProvider.tsx` - Auth context with `useAuth()` hook
- `components/providers/index.ts` - Barrel exports

**Key Integration Points:**
- `useAuth()` provides `anonymousId` for session operations
- `getAnonymousId()` can be used standalone for quick ID access
- RLS policies use `auth.uid()` which matches `anonymous_id`

### Architecture Compliance

**From project-context.md:**
- All Supabase access through `/lib/supabase/` ✓
- Use `ActionResponse<T>` pattern ✓
- Transform snake_case → camelCase at boundaries ✓
- Zustand stores in `/store/` directory ✓
- Hooks in `/hooks/` directory ✓

**From architecture-patterns.md:**
- Store pattern: state (nouns) + actions (verbs) ✓
- Loading state naming: `isLoading`, `loadingStep` ✓
- Error handling flow with toast ✓

### Error Handling Strategy

| Scenario | Handling |
|----------|----------|
| Session restore fails | Show error in UI, allow retry |
| Auto-save fails | Show toast, keep working (data in memory) |
| Network timeout | Retry with exponential backoff (optional for V0.1) |
| RLS violation | Log error, should not happen if auth works |

### Performance Considerations

- **Debounce saves:** 500ms delay prevents excessive DB writes during typing
- **Selective updates:** Only send changed fields in update calls
- **State hashing:** Skip saves when data hasn't actually changed
- **Lazy hydration:** Don't block render while restoring session
- **Memoized selectors:** Use Zustand selectors to prevent re-renders

### File Structure After This Story

```
/lib/supabase/
├── client.ts         ← From Story 2.1
├── server.ts         ← From Story 2.1
├── auth.ts           ← From Story 2.1
├── helpers.ts        ← From Story 2.1
├── sessions.ts       ← NEW: Session CRUD operations
└── index.ts          ← MODIFIED: Add session exports

/store/
├── useOptimizationStore.ts  ← NEW: Zustand store implementation
└── index.ts                  ← NEW: Barrel export

/hooks/
├── useSessionSync.ts     ← NEW: Auto-save hook
├── useSessionRestore.ts  ← NEW: Session restoration hook
└── index.ts              ← NEW: Barrel export

/components/providers/
├── AuthProvider.tsx   ← From Story 2.1
├── SessionProvider.tsx ← NEW: Session orchestration
└── index.ts           ← MODIFIED: Add SessionProvider export

/app/
└── layout.tsx         ← MODIFIED: Add SessionProvider
```

### Testing Strategy

**Manual Testing:**
1. Open app → Anonymous session created
2. Enter resume text → Refresh page → Text persists
3. Enter JD → Refresh page → JD persists
4. Open in new tab → Same data appears
5. Clear cookies → New empty session created

**Verification Queries:**
```sql
-- Check sessions are being created and updated
SELECT id, anonymous_id,
       LENGTH(resume_content) as resume_len,
       LENGTH(jd_content) as jd_len,
       analysis IS NOT NULL as has_analysis,
       suggestions IS NOT NULL as has_suggestions,
       updated_at
FROM sessions
ORDER BY updated_at DESC
LIMIT 5;
```

### Dependencies

This story depends on:
- Story 2.1 (Anonymous Authentication) - provides auth context and Supabase clients ✓

This story enables:
- Epic 3+ - all data entry will automatically persist
- Story 2.3 - integration verification

### References

- [Source: epics.md#Story 2.2 Acceptance Criteria]
- [Source: types/store.ts] - Zustand store interface
- [Source: types/optimization.ts] - Domain types
- [Source: supabase/migrations/20260124000000_create_sessions_table.sql] - DB schema
- [Source: lib/supabase/index.ts] - Existing Supabase utilities
- [Source: components/providers/AuthProvider.tsx] - Auth context
- [Source: project-context.md#Zustand Store Pattern]
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Completion Notes List

- **Task 1**: Created `/lib/supabase/sessions.ts` with `createSession()`, `getSessionByAnonymousId()`, and `updateSession()` functions. All follow ActionResponse pattern and transform snake_case ↔ camelCase at boundaries. Added exports to `/lib/supabase/index.ts`.
- **Task 2**: Created `/store/useOptimizationStore.ts` implementing `OptimizationStore` interface with extended `sessionId` field. Implemented `loadFromSession()` action and `selectSessionData()` selector. Added memoized selectors for performance. Created barrel export.
- **Task 3**: Created `/hooks/useSessionSync.ts` hook with 500ms debouncing, state hash comparison to skip unchanged saves, graceful error handling via toast, and cleanup on unmount.
- **Task 4**: Created `/hooks/useSessionRestore.ts` hook that checks for existing session, creates new if none exists, hydrates store, and handles loading states. Created barrel export.
- **Task 5**: Created `/components/providers/SessionProvider.tsx` that orchestrates session restoration and auto-save. Updated `app/layout.tsx` to wrap with SessionProvider after AuthProvider. Added Toaster component for notifications.

### File List

**Created:**
- `lib/supabase/sessions.ts` - Session CRUD operations with ActionResponse pattern
- `store/useOptimizationStore.ts` - Zustand store with session tracking
- `store/index.ts` - Store barrel export
- `hooks/useSessionSync.ts` - Auto-save hook with debouncing and hash comparison
- `hooks/useSessionRestore.ts` - Session restoration hook
- `hooks/index.ts` - Hooks barrel export
- `components/providers/SessionProvider.tsx` - Session orchestration provider

**Modified:**
- `lib/supabase/index.ts` - Added session function exports (createSession, getSessionByAnonymousId, updateSession)
- `components/providers/index.ts` - Added SessionProvider export
- `app/layout.tsx` - Added SessionProvider wrapper and Toaster component

### Change Log

- 2026-01-24: Story 2.2 created - Implement session persistence for data continuity across page refreshes
- 2026-01-24: Story 2.2 implemented - Session CRUD operations, Zustand store with session tracking, auto-save hook with debouncing, session restoration, SessionProvider integration
- 2026-01-24: Code review fixes applied by Claude Opus 4.5:
  - Added missing `feedback` field to `updateSession()` function
  - Added mounted check to `useSessionSync` to prevent post-unmount updates
  - Fixed misleading comment in SessionProvider
