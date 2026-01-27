# Story 9.1: Implement Save Resume to Library

**Status:** done
**Epic:** 9 - Resume Library (V1.0)
**Version:** 9.1
**Date Created:** 2026-01-27

---

## Story

As a user,
I want to save my uploaded resume to my library,
So that I can reuse it for future optimizations.

---

## Acceptance Criteria

1. **Given** I am signed in and have uploaded a resume
   **When** I click "Save to Library"
   **Then** the resume is saved to my account
   **And** I can name the resume (e.g., "Software Engineer Resume")
   **And** I am prevented from saving more than 3 resumes
   **And** if at limit, I see a message explaining the limit

---

## Tasks / Subtasks

- [x] Task 1: Create database schema for resume library (AC: #1)
  - [x] Create `user_resumes` table in Supabase
  - [x] Columns: id (PK), user_id (FK), name, resume_content, file_name, created_at, updated_at
  - [x] Add RLS policies: users can only access their own resumes
  - [x] Add unique constraint: (user_id, name) - user can't have duplicate resume names
  - [x] Create migration file

- [x] Task 2: Create save-resume server action (AC: #1)
  - [x] Create `/actions/resume/save-resume.ts` server action
  - [x] Accept: resume_content (string), resume_name (string)
  - [x] Check if user is authenticated (reject if not)
  - [x] Check if user already has 3+ resumes (return error if limit reached)
  - [x] Validate resume_name (required, max 100 chars)
  - [x] Save to `user_resumes` table
  - [x] Implement ActionResponse<T> pattern
  - [x] Handle save errors (database, validation)

- [x] Task 3: Create save-resume UI button/modal (AC: #1)
  - [x] Add "Save to Library" button on `/optimize` page
  - [x] Button only visible when user is authenticated
  - [x] On click, open modal/dialog for naming resume
  - [x] Input field for resume name (with placeholder, validation feedback)
  - [x] Show current count: "You have saved X of 3 resumes" (shown in description)
  - [x] Cancel and Save buttons
  - [x] Disable save button if name is empty
  - [x] Show loading state during save
  - [x] Show success toast after save
  - [x] Show error toast if save fails (including if at limit)

- [x] Task 4: Integrate with existing resume state (AC: #1)
  - [x] Access current resume content from Zustand store
  - [x] Pass to save-resume action when user clicks Save
  - [x] Update store after successful save (not needed - fetched on demand in story 9-2)
  - [x] Show UI feedback when no resume is uploaded (button hidden)

- [x] Task 5: Error handling and edge cases (AC: #1)
  - [x] Handle save when not authenticated (button hidden, server validates)
  - [x] Handle save when resume content is empty (button hidden, server validates)
  - [x] Handle save when at 3-resume limit (server returns RESUME_LIMIT_EXCEEDED)
  - [x] Handle database errors gracefully (server returns SAVE_RESUME_ERROR)
  - [x] Handle duplicate resume names (server detects unique constraint violation)
  - [x] Handle network errors (try/catch in server action, toast displays errors)

---

## Dev Agent Record

### Implementation Plan

**Tasks 1-2: Database Schema & Server Action** (Completed 2026-01-27)
- Created migration file for `user_resumes` table with proper RLS policies
- Implemented save-resume server action following ActionResponse pattern
- Added comprehensive unit tests (8 tests, all passing)
- Added error codes: UNAUTHORIZED, SAVE_RESUME_ERROR, RESUME_LIMIT_EXCEEDED

### Debug Log

- Tests initially failed due to incorrect mock structure for Supabase client
- Fixed by restructuring mocks to properly handle async createClient()
- All validation paths tested: auth, empty content, empty name, name length, limit, duplicates, insert failures

### Completion Notes

✅ **All Tasks Complete (1-5)**

**Implementation Summary:**
- Database migration: `user_resumes` table with RLS policies, 3-resume limit enforced
- Server action: Full validation, auth check, limit enforcement, error handling
- UI Component: SaveResumeButton with shadcn Dialog, form validation, loading states
- Integration: Added to main page, only visible when authenticated with resume content
- Error handling: All edge cases covered (auth, validation, limits, duplicates, network)

**Test Coverage:**
- Unit tests (actions): 10 tests passing - auth, validation, limits, errors, fileName
- Unit tests (components): 13 tests passing - visibility, dialog, form, save flow
- All existing tests passing: 67 test files, 100% pass rate

**Code Quality:**
- Follows ActionResponse<T> pattern (no throws)
- Uses standard error codes (UNAUTHORIZED, SAVE_RESUME_ERROR, RESUME_LIMIT_EXCEEDED)
- shadcn Dialog component with proper accessibility
- Character count indicator (100 char max)
- Toast notifications for success/error feedback

**Manual Testing Required:**
- Database migration application (`supabase db reset`)
- End-to-end flow: upload → authenticate → save → verify database
- Limit enforcement: save 3 resumes, verify 4th is blocked
- Duplicate name handling: save with same name, verify error

---

## File List

**Database:**
- `supabase/migrations/20260127000000_create_user_resumes_table.sql` (new)

**Server Actions:**
- `actions/resume/save-resume.ts` (new)

**Types:**
- `types/resume.ts` (new)
- `types/index.ts` (modified - added resume exports)
- `types/error-codes.ts` (modified - added 3 new codes)
- `types/errors.ts` (modified - added error messages for new codes)

**UI Components:**
- `components/ui/dialog.tsx` (new - installed via shadcn)
- `components/resume/SaveResumeButton.tsx` (new)

**Integration:**
- `app/page.tsx` (modified - added SaveResumeButton integration)

**Dependencies:**
- `package.json` (modified - added @radix-ui/react-dialog)
- `package-lock.json` (modified - lockfile update)

**Tests:**
- `tests/unit/actions/save-resume.test.ts` (new - 10 tests)
- `tests/unit/components/SaveResumeButton.test.tsx` (new - 13 tests)

---

## Change Log

- **2026-01-27:** Story 9-1 completed - Database schema, server action, UI component, full test coverage (Tasks 1-5)
- **2026-01-27:** Code review fixes applied:
  - H1: Added WITH CHECK clause to RLS policy for INSERT validation
  - H2: Passed fileName from store through SaveResumeButton to server action
  - H3: Added database trigger to enforce 3-resume limit (race condition prevention)
  - M1: Added package.json/package-lock.json to File List
  - M2: Improved count query test to verify head:true optimization
  - M3: Added tests for fileName parameter (with and without)

---

## Dev Notes

### Architecture Compliance

**Required Patterns:**
- ActionResponse<T> pattern: Always return `{ data: T, error: null }` or `{ data: null, error: ErrorObject }`
- Error codes: Use standardized codes. For library: SAVE_RESUME_ERROR, RESUME_LIMIT_EXCEEDED, UNAUTHORIZED
- Leverage existing patterns from Stories 8-1 through 8-5

**File Structure:**
- Server action: `/actions/resume/save-resume.ts`
- UI component: Update `/app/(authenticated)/optimize/page.tsx` OR create `/components/resume/SaveResumeButton.tsx`
- Types: Extend `/types/index.ts` with `UserResume` interface
- Database: Create migration in `/supabase/migrations/`
- Validation schema: `/lib/validations/resume.ts` (optional, can inline)

**Technology Stack (from project-context.md):**
- Next.js 16, TypeScript, Supabase (user_resumes table + RLS)
- shadcn/ui (Button, Dialog/Modal, Input)
- React Hook Form + Zod (optional for validation)
- Zustand (access current resume content)

### Technical Requirements

1. **Database Schema**
   ```sql
   CREATE TABLE user_resumes (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     name VARCHAR(100) NOT NULL,
     resume_content TEXT NOT NULL,
     file_name VARCHAR(255),
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(user_id, name)
   );

   -- RLS Policies
   ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can only access their own resumes"
     ON user_resumes FOR ALL
     USING (auth.uid() = user_id);
   ```

2. **Server Action Pattern**
   ```typescript
   // /actions/resume/save-resume.ts
   export async function saveResume(
     resumeContent: string,
     resumeName: string
   ): Promise<ActionResponse<{ id: string; name: string }>> {
     const supabase = createServerClient();
     const { data: user } = await supabase.auth.getUser();

     if (!user) {
       return { data: null, error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } };
     }

     if (!resumeContent?.trim()) {
       return { data: null, error: { message: 'Resume content is empty', code: 'VALIDATION_ERROR' } };
     }

     if (!resumeName?.trim() || resumeName.length > 100) {
       return { data: null, error: { message: 'Invalid resume name', code: 'VALIDATION_ERROR' } };
     }

     // Check resume count
     const { count } = await supabase
       .from('user_resumes')
       .select('*', { count: 'exact' })
       .eq('user_id', user.id);

     if (count >= 3) {
       return { data: null, error: { message: 'Resume limit (3) reached', code: 'RESUME_LIMIT_EXCEEDED' } };
     }

     const { data, error } = await supabase
       .from('user_resumes')
       .insert({
         user_id: user.id,
         name: resumeName.trim(),
         resume_content: resumeContent,
       })
       .select('id, name')
       .single();

     if (error) {
       return { data: null, error: { message: error.message, code: 'SAVE_RESUME_ERROR' } };
     }

     return { data, error: null };
   }
   ```

3. **UI Modal Pattern**
   - Use shadcn/ui Dialog or AlertDialog for naming input
   - Show current resume count with visual indicator (progress bar, text: "1 of 3")
   - Prevent user from saving with empty/whitespace-only names
   - Toast notifications for success/error (sonner)

4. **Zustand Integration**
   - Access `resumeContent` from existing optimization store
   - Check `resumeContent` to enable/disable button
   - Clear or update store after save (optional - depends on UX)

5. **Error Codes to Add**
   ```typescript
   // types/error-codes.ts
   export const RESUME_ERROR_CODES = [
     'SAVE_RESUME_ERROR',
     'RESUME_LIMIT_EXCEEDED',
     'UNAUTHORIZED',
   ] as const;
   ```

### Project Structure Notes

**Alignment with V1.0 patterns:**
- Server action: Follow pattern from auth stories (8-1 through 8-5) in `/actions/resume/`
- UI: Add button to existing `/optimize` page or create shared component
- Database: Extends existing Supabase schema (new table)
- No breaking changes to existing components

**State Management:**
- Zustand store already has `resumeContent` (from upload)
- No new store needed - just read from existing
- Optional: Add `savedResumes` to store after save (can be fetched on demand)

**Database Schema:**
- New table: `user_resumes` (separate from sessions)
- RLS policies: per-user isolation
- Foreign key to `auth.users` for cascade delete

### Testing Requirements

1. **Unit Tests (Vitest)**
   - Test save-resume action: success, validation, limit, auth
   - Test error handling: duplicate names, invalid input
   - Mock Supabase for database operations

2. **Integration Tests (Playwright)**
   - Sign in → Upload resume → Click "Save to Library"
   - Fill in resume name → Click Save → Verify toast
   - Verify saved resume appears in list (for future story 9-2)
   - Test limit: save 3 resumes → 4th button disabled
   - Test duplicate names: attempt to save with same name → error

3. **Manual Testing Checklist**
   - [ ] Signed in, upload resume
   - [ ] Click "Save to Library" button
   - [ ] Modal opens with input field
   - [ ] Can enter resume name
   - [ ] Save button disabled until name entered
   - [ ] Click Save → success toast
   - [ ] Resume saved and count updated
   - [ ] Save 2 more resumes (total 3)
   - [ ] Try to save 4th → error message "limit reached"
   - [ ] Verify all 3 appear in list (later story)

### Previous Story Learning (Stories 8-1 through 8-5)

**From All Previous Stories:**
- ActionResponse<T> pattern fully established and tested
- Error code mapping standardized (all stories use same codes)
- Zustand store patterns proven (read/write state)
- Server action patterns mastered
- Modal/Dialog patterns established (used in multiple stories)
- RLS policies working (auth stories use per-user isolation)

**Build on Previous Stories:**
- Reuse error handling patterns from auth
- Leverage Zustand read patterns (like current user state)
- Use same modal pattern as previous confirmation dialogs
- Follow server action signature pattern from stories 8-1 through 8-5

### Git Intelligence (Recent Commits)

Recent patterns from V1.0:
- `72a5373`: Epic 8 integration testing (PR #99)
- `acd8314`: Story 8-5 onboarding (PR #98)
- `e889daa`: Story 8-4 sign out (PR #97)

**Commit conventions:**
- Feature commits: `feat(story-9-1): Implement Save Resume to Library`
- Add `data-testid` attributes for all interactive elements
- Follow existing linting rules
- Keep commits focused and logical

---

## Latest Tech Information

### Supabase RLS for Multi-User Isolation (2026)

**Pattern for per-user data:**
```sql
ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own resumes"
  ON user_resumes FOR ALL
  USING (auth.uid() = user_id);
```

**Key Features:**
- Automatic user isolation at database level
- No need for client-side filtering
- Cascade delete when user is deleted
- Foreign key constraint ensures referential integrity

### Modal Dialog UX Patterns (2026)

**Best Practice for save dialog:**
- Open on button click
- Pre-populate with suggested name (e.g., date + job title)
- Show character count (max 100)
- Disable submit until name is valid
- Clear error messages on validation fail
- Success toast after save

---

## Project Context Reference

**Critical Rules from project-context.md:**
1. **ActionResponse Pattern (MANDATORY):** Never throw from server actions.
2. **Error Codes:** Use standardized codes, add SAVE_RESUME_ERROR, RESUME_LIMIT_EXCEEDED
3. **Directory Structure:** Follow `/actions/resume/`, `/components/` organization
4. **RLS Policies:** All user data must be isolated via RLS

**Related Files:**
- Auth Stories: See stories 8-1 through 8-5 (patterns, RLS)
- Session Management: See archived Epic 2 (2-2)
- Error Display: See archived Epic 7 (7-1)

**Complete context:** See `_bmad-output/project-context.md`

---

## Story Completion Status

- **Created:** 2026-01-27
- **Ready for Dev:** ✅ YES
- **Epic Progress:** Epic 9: 1/4 stories ready (9-1 ready, 9-2, 9-3, 9-4 backlog)
- **Next Step:** Run `/bmad:bmm:workflows:dev-story story_key=9-1-implement-save-resume-to-library`

### Dev Agent Notes

This story requires:
1. Creating `user_resumes` table with RLS policies
2. Implementing save-resume server action (auth + validation + db insert)
3. Building modal/dialog UI with name input
4. Integrating with existing resume state (Zustand)
5. Error handling for limit (3 resumes max), validation, auth
6. Testing across authentication methods

**Complexity:** Medium (database schema, RLS, server action, modal UI)

**Dependencies:**
- Stories 8-1 through 8-5 must be complete (auth, Zustand, UI patterns)
- `/optimize` page must exist (it does from V0.1)
- User must be authenticated to save (relies on auth from Epic 8)

---

## References

- **Supabase Auth & RLS:** https://supabase.com/docs/guides/auth
- **Row Level Security:** https://supabase.com/docs/guides/database/postgres/row-level-security
- **Supabase JavaScript Client:** https://supabase.com/docs/reference/javascript
- **Story 8-1:** `_bmad-output/implementation-artifacts/8-1-implement-email-password-registration.md`
- **Epic 9 Overview:** `_bmad-output/planning-artifacts/epics.md` (line 911-961)

---

_Story created by create-story workflow | Ultimate Context Engine v1.0_
