# Story 9.3: Implement Resume Deletion from Library

**Status:** ready-for-dev
**Epic:** 9 - Resume Library (V1.0)
**Version:** 9.3
**Date Created:** 2026-01-27

---

## Story

As a user,
I want to delete resumes from my library,
So that I can make room for new versions.

---

## Acceptance Criteria

1. **Given** I have resumes in my library
   **When** I click delete on a resume
   **Then** I am asked to confirm the deletion
   **And** upon confirmation, the resume is permanently removed
   **And** my library count is updated

---

## Tasks / Subtasks

- [ ] Task 1: Create delete-resume server action (AC: #1)
  - [ ] Create `/actions/resume/delete-resume.ts` server action
  - [ ] Accept: resume_id (UUID)
  - [ ] Check if user is authenticated (reject if not)
  - [ ] Verify resume_id belongs to authenticated user (via RLS)
  - [ ] Delete from `user_resumes` table
  - [ ] Implement ActionResponse<T> pattern
  - [ ] Handle not-found error gracefully (resume doesn't exist or doesn't belong to user)
  - [ ] Handle database errors

- [ ] Task 2: Create delete button UI component (AC: #1)
  - [ ] Add delete button to resume selection modal (or separate management UI)
  - [ ] Show delete button only for authenticated users
  - [ ] Button only visible when viewing own resumes
  - [ ] Hover state/tooltip showing "Delete this resume"
  - [ ] Use consistent icon (trash/delete icon from shadcn)
  - [ ] Integrate with existing SelectResumeButton or create DeleteResumeButton

- [ ] Task 3: Create confirmation dialog (AC: #1)
  - [ ] On delete button click, show confirmation dialog
  - [ ] Dialog title: "Delete Resume?"
  - [ ] Dialog message: "Are you sure you want to permanently delete '[Resume Name]'? This action cannot be undone."
  - [ ] Show resume name and creation date for context
  - [ ] Cancel and Delete buttons
  - [ ] Delete button shows loading state during deletion
  - [ ] Prevent accidental clicks (require explicit confirmation)

- [ ] Task 4: Integrate deletion with resume selection UI (AC: #1)
  - [ ] Update SelectResumeButton component to show delete action
  - [ ] Add delete button/icon to each resume in the list
  - [ ] After successful deletion, update UI to remove deleted resume from list
  - [ ] Show success toast: "Resume deleted"
  - [ ] Show error toast if deletion fails
  - [ ] If currently selected resume is deleted, clear selection and show upload form
  - [ ] Update resume count after deletion (e.g., "X of 3 resumes")

- [ ] Task 5: Handle edge cases and state management (AC: #1)
  - [ ] Handle deletion when user has only 1 resume (still allow deletion, show empty state after)
  - [ ] Handle race condition: delete during selection load
  - [ ] Handle unauthorized deletion (someone tries to delete another user's resume)
  - [ ] Handle network error during deletion (retry option in toast)
  - [ ] If deleted resume was selected, clear from Zustand store
  - [ ] Update UI state to reflect deleted resume
  - [ ] Handle multiple concurrent deletions (prevent double-delete)

- [ ] Task 6: Error handling and testing (AC: #1)
  - [ ] Handle delete when not authenticated (button hidden, server validates)
  - [ ] Handle delete when resume doesn't exist (404 response from server)
  - [ ] Handle delete when resume belongs to another user (RLS blocks)
  - [ ] Handle database errors gracefully (server returns DELETE_RESUME_ERROR)
  - [ ] Handle network errors (try/catch in action, toast shows error)
  - [ ] Test with last resume in library
  - [ ] Test deletion of currently selected resume

---

## Dev Notes

### Architecture Compliance

**Required Patterns:**
- ActionResponse<T> pattern: Always return `{ data: T, error: null }` or `{ data: null, error: ErrorObject }`
- Error codes: Use standardized codes. For delete: UNAUTHORIZED, RESUME_NOT_FOUND, DELETE_RESUME_ERROR
- Leverage existing patterns from Stories 9-1 and 9-2 (database schema, RLS, server actions)
- Follow deletion patterns from Stories 8-1 through 8-5 (auth validation)

**File Structure:**
- Server action: `/actions/resume/delete-resume.ts`
- UI integration: Update `/components/resume/SelectResumeButton.tsx` (add delete button to list)
- Types: Extend `/types/index.ts` with `DeleteResumeResponse` interface if needed (simple: { success: boolean })
- Database: No new tables or migrations needed (uses existing `user_resumes` table)

**Technology Stack (from project-context.md):**
- Next.js 16, TypeScript, Supabase (user_resumes table + RLS)
- shadcn/ui (Button, Dialog/Modal, AlertDialog for confirmation)
- Zustand (clear selectedResumeId if deleted resume was selected)
- Toast notifications (sonner) for success/error feedback

### Technical Requirements

1. **Delete Resume Server Action**
   ```typescript
   // /actions/resume/delete-resume.ts
   export async function deleteResume(resumeId: string): Promise<ActionResponse<{ success: boolean }>> {
     const supabase = createServerClient();
     const { data: user } = await supabase.auth.getUser();

     if (!user) {
       return { data: null, error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } };
     }

     // RLS policy ensures we can only delete our own resumes
     const { error } = await supabase
       .from('user_resumes')
       .delete()
       .eq('id', resumeId)
       .eq('user_id', user.id);

     if (error) {
       if (error.code === 'PGRST116') { // Not found
         return { data: null, error: { message: 'Resume not found', code: 'RESUME_NOT_FOUND' } };
       }
       return { data: null, error: { message: error.message, code: 'DELETE_RESUME_ERROR' } };
     }

     return { data: { success: true }, error: null };
   }
   ```

2. **Delete Button Integration in SelectResumeButton**
   - Add delete button/icon to each resume in the radio group list
   - On delete click: stop propagation to prevent selection, show confirmation dialog
   - On confirmation: call deleteResume action
   - On success: remove from local list, update UI, show toast
   - On error: show error toast with retry option

3. **Confirmation Dialog Pattern**
   - Use shadcn AlertDialog or Dialog for destructive confirmation
   - Show resume name and date for context
   - Require explicit "Delete" button click (not just closing dialog)
   - Disable button during deletion (loading state)
   - Show "Deleting..." text during operation

4. **State Management Updates**
   - Zustand store: If deleted resume was selectedResumeId, clear it
   - UI: If selected resume deleted, show upload form instead
   - If last resume deleted, show empty state: "No resumes in your library"

5. **Error Codes to Add**
   ```typescript
   // types/error-codes.ts
   export const RESUME_ERROR_CODES = [
     'SAVE_RESUME_ERROR',
     'RESUME_LIMIT_EXCEEDED',
     'UNAUTHORIZED',
     'GET_RESUMES_ERROR',
     'GET_RESUME_CONTENT_ERROR',
     'RESUME_NOT_FOUND',
     'DELETE_RESUME_ERROR',  // NEW
   ] as const;
   ```

### Project Structure Notes

**Alignment with V1.0 patterns:**
- Server action: Follow pattern from stories 9-1 and 9-2 in `/actions/resume/`
- UI: Add delete button to existing SelectResumeButton component (no new component needed)
- Database: No new tables or migrations (uses existing user_resumes)
- Error handling: mirrors stories 9-1 and 9-2 (standardized error codes, ActionResponse pattern)

**State Management:**
- Zustand store: If deleted resume was selected, clear selectedResumeId
- No new store needed - just update state on successful deletion
- Clear selection when currently-selected resume is deleted

**Database Integration:**
- Query/delete from `user_resumes` table (already exists from story 9-1)
- RLS policies already enforce user isolation - no new policies needed
- No new migrations required

### Previous Story Intelligence (Stories 9-1 and 9-2)

**Key Learnings from Story 9-1: Save Resume**
- user_resumes table schema: id (PK), user_id (FK), name (VARCHAR 100), resume_content (TEXT), file_name, created_at, updated_at
- RLS policy enforces user isolation: `auth.uid() = user_id`
- 3-resume limit enforced in server action
- Error codes: UNAUTHORIZED, SAVE_RESUME_ERROR, RESUME_LIMIT_EXCEEDED
- Modal pattern uses shadcn Dialog with form input
- SaveResumeButton component location: `/components/resume/`
- Toast notifications via sonner for all feedback

**Key Learnings from Story 9-2: Select Resume**
- get-user-resumes action returns list with: id, name, created_at (formatted)
- get-resume-content action returns: id, name, resume_content
- SelectResumeButton uses Dialog + RadioGroup for selection
- Zustand store has selectedResumeId to track current selection
- Existing resumeContent store holds file content
- Error codes: UNAUTHORIZED, GET_RESUMES_ERROR, RESUME_NOT_FOUND, GET_RESUME_CONTENT_ERROR
- Date formatting: `new Date(created_at).toLocaleDateString(...)`

**Build on Stories 9-1 and 9-2:**
- Reuse error handling pattern (ActionResponse<T>, standardized codes)
- Use delete confirmation dialog pattern (from other systems/libraries)
- Leverage existing SelectResumeButton component as integration point
- Follow same authentication check pattern (user must be logged in)
- Same database table, no migration needed
- If deleted resume was selected, clear from store and show upload form
- Update UI list immediately after deletion

### Testing Requirements

1. **Unit Tests (Vitest)**
   - Test delete-resume action: success, auth, not found, unauthorized access, database error
   - Test confirmation dialog: shows correct resume name, cancel works, delete confirms
   - Test store update: selectedResumeId cleared when deleted resume was selected
   - Mock Supabase delete operation

2. **Integration Tests (Playwright)**
   - Save 2 resumes → Select one → Delete unselected one
   - Verify list updates, count decreases, success toast shown
   - Select resume → Delete it → Verify selection cleared, upload form shown
   - Delete last resume → Verify empty state shown
   - Test confirmation dialog: cancel doesn't delete, confirm does
   - Test error state: network failure shows error toast with option to retry

3. **Manual Testing Checklist**
   - [ ] Signed in with 2+ resumes
   - [ ] Click delete button on a resume (not selected)
   - [ ] Confirmation dialog appears with correct resume name
   - [ ] Click Cancel → dialog closes, no deletion
   - [ ] Click Delete → shows loading state, then success toast
   - [ ] Verify resume removed from list, count updated
   - [ ] Save 3 resumes (at limit)
   - [ ] Delete one → verify count is now 2 of 3
   - [ ] Select resume → delete it → verify selection cleared
   - [ ] Verify upload form is shown after deletion
   - [ ] Delete last resume → verify empty state
   - [ ] Test network error → verify error toast with retry option

### Git Intelligence (Recent Commits)

**From V1.0 Implementation:**
- Commit `6a3152b`: Story 9-2 merge (PR #101) - resume selection patterns
- Commit `8241968`: Story 9-1 merge (PR #100) - resume save patterns, database schema
- Commit `72a5373`: Epic 8 integration (PR #99) - auth patterns, confirmation dialogs

**Commit Conventions:**
- Feature commits: `feat(story-9-3): Implement Resume Deletion from Library`
- Add `data-testid` attributes for delete buttons and confirmation dialogs
- Follow existing linting rules
- Keep commits focused and logical

### Latest Tech Information

**Supabase Delete Operations (2026)**
- RLS policies automatically prevent unauthorized deletes (where clause returns 0 rows)
- Handle PGRST116 as 404 Not Found error code
- Always verify user context before delete (via RLS)
- Delete returns count of affected rows (0 if not found or unauthorized)

**Confirmation Dialog UX Patterns (2026)**
- Use AlertDialog for destructive actions (not just Dialog)
- Always show what will be deleted (resume name, date)
- Require explicit action button (not just closing dialog)
- Show loading state during operation
- Toast notification after completion (success or error)
- Prevent accidental double-clicks (disable button during operation)

**State Management for Deletions**
- Update local list immediately (optimistic UI)
- If error, revert changes and show error toast
- If deleted resume was selected, clear selection and show fallback UI
- Zustand allows easy clearing of selectedResumeId

---

## Project Context Reference

**Critical Rules from project-context.md:**
1. **ActionResponse Pattern (MANDATORY):** Never throw from server actions.
2. **Error Codes:** Use standardized codes, add DELETE_RESUME_ERROR, RESUME_NOT_FOUND
3. **Directory Structure:** Follow `/actions/resume/` organization
4. **RLS Policies:** All user data must be isolated via RLS (already done for user_resumes)

**Related Files:**
- Story 9-1: See `_bmad-output/implementation-artifacts/9-1-implement-save-resume-to-library.md` (database schema, error patterns)
- Story 9-2: See `_bmad-output/implementation-artifacts/9-2-implement-resume-selection-from-library.md` (UI patterns, state management)
- Auth Stories: See Epic 8 stories (authentication patterns, confirmation dialogs)
- Error Display: See Epic 7 (error handling patterns)

**Complete context:** See `_bmad-output/project-context.md`

---

## Story Completion Status

- **Created:** 2026-01-27
- **Ready for Dev:** ✅ YES
- **Epic Progress:** Epic 9: 2/4 stories done → 3/4 ready-for-dev (9-1 done, 9-2 done, 9-3 ready, 9-4 backlog)
- **Next Step:** Run `/bmad:bmm:workflows:dev-story story_key=9-3-implement-resume-deletion-from-library`

### Dev Agent Notes

This story requires:
1. Creating delete-resume server action (auth + validation + db delete)
2. Adding delete button/icon to SelectResumeButton UI
3. Building confirmation dialog for destructive action
4. Clearing selection if deleted resume was currently selected
5. Updating UI list and count after deletion
6. Testing deletion with various edge cases (last resume, selected resume, etc.)

**Complexity:** Medium (server action, confirmation dialog, state management)

**Dependencies:**
- Stories 9-1 and 9-2 must be complete (database schema, UI patterns)
- user_resumes table must exist with RLS policies
- SelectResumeButton component must exist
- Zustand store with selectedResumeId must be set up

---

## References

- **Story 9-1:** `_bmad-output/implementation-artifacts/9-1-implement-save-resume-to-library.md` (database, patterns)
- **Story 9-2:** `_bmad-output/implementation-artifacts/9-2-implement-resume-selection-from-library.md` (UI, state)
- **Epic 9 Overview:** `_bmad-output/planning-artifacts/epics.md` (line 911-962)
- **Supabase Delete API:** https://supabase.com/docs/reference/javascript/delete
- **Row Level Security:** https://supabase.com/docs/guides/database/postgres/row-level-security
- **Alert Dialog Pattern:** shadcn/ui AlertDialog component

---

_Story created by create-story workflow | Ultimate Context Engine v1.0_
