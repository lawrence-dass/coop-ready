# Story 9.2: Implement Resume Selection from Library

**Status:** ready-for-dev
**Epic:** 9 - Resume Library (V1.0)
**Version:** 9.2
**Date Created:** 2026-01-27

---

## Story

As a user,
I want to select a resume from my library for optimization,
So that I don't have to re-upload the same file.

---

## Acceptance Criteria

1. **Given** I have resumes saved in my library
   **When** I click to select a resume
   **Then** I see my saved resumes with names and dates
   **And** I can select one to use for optimization
   **And** the selected resume's content is loaded into the session

---

## Tasks / Subtasks

- [ ] Task 1: Create get-user-resumes server action (AC: #1)
  - [ ] Create `/actions/resume/get-user-resumes.ts` server action
  - [ ] Accept: no parameters (uses authenticated user context)
  - [ ] Check if user is authenticated (reject if not)
  - [ ] Query `user_resumes` table for all resumes by user_id
  - [ ] Return list of resumes with: id, name, created_at (formatted)
  - [ ] Order by created_at DESC (newest first)
  - [ ] Implement ActionResponse<T> pattern
  - [ ] Handle database errors gracefully

- [ ] Task 2: Create resume selection UI component (AC: #1)
  - [ ] Create `/components/resume/SelectResumeButton.tsx` component
  - [ ] Add "Select from Library" button on `/optimize` page (next to or instead of upload)
  - [ ] Button only visible when user is authenticated
  - [ ] On click, open modal/dialog showing list of saved resumes
  - [ ] Display each resume with: name, creation date (formatted human-readable)
  - [ ] Each resume is selectable (radio button or clickable row)
  - [ ] Show count: "You have X saved resumes"
  - [ ] Show empty state if no resumes saved: "No resumes yet. Save one first."
  - [ ] Cancel and Select buttons
  - [ ] Show loading state while fetching resumes
  - [ ] Show error message if fetch fails

- [ ] Task 3: Integrate with resume upload state (AC: #1)
  - [ ] Access Zustand store to manage selected resume
  - [ ] When user selects a resume, fetch its content from server
  - [ ] Load selected resume content into `resumeContent` in Zustand store
  - [ ] Update UI to show selected resume name (e.g., "Selected: Software Engineer Resume")
  - [ ] Update upload zone UI to show selected resume instead of upload form
  - [ ] Provide way to switch to different resume or upload new one
  - [ ] Clear selection when user logs out

- [ ] Task 4: Create get-resume-content server action (AC: #1)
  - [ ] Create `/actions/resume/get-resume-content.ts` server action
  - [ ] Accept: resume_id (UUID)
  - [ ] Check if user is authenticated (reject if not)
  - [ ] Verify resume_id belongs to authenticated user (via RLS)
  - [ ] Query `user_resumes` table for specific resume
  - [ ] Return: id, name, resume_content
  - [ ] Implement ActionResponse<T> pattern
  - [ ] Handle not-found error gracefully (resume doesn't exist or doesn't belong to user)
  - [ ] Handle database errors

- [ ] Task 5: UI/UX integration (AC: #1)
  - [ ] Update `/app/(authenticated)/optimize/page.tsx` to show both upload and selection options
  - [ ] Add conditional rendering: show upload form OR selected resume display
  - [ ] Show clear indication of which resume is selected
  - [ ] Provide "Change Resume" button to switch or re-upload
  - [ ] Maintain consistency with "Save to Library" button UI (story 9-1)
  - [ ] Handle loading states during resume fetch

- [ ] Task 6: Error handling and edge cases (AC: #1)
  - [ ] Handle fetch when user has no resumes (show empty state, not error)
  - [ ] Handle fetch failure due to network error (show error toast)
  - [ ] Handle race condition: resume deleted between list fetch and selection
  - [ ] Handle user unauthorized access to specific resume (server rejects)
  - [ ] Handle corrupted resume content gracefully (show error, allow re-upload)
  - [ ] Session state: clear selected resume on logout (reset Zustand store)

---

## Dev Notes

### Architecture Compliance

**Required Patterns:**
- ActionResponse<T> pattern: Always return `{ data: T, error: null }` or `{ data: null, error: ErrorObject }`
- Error codes: Use standardized codes. For library: UNAUTHORIZED, GET_RESUMES_ERROR, RESUME_NOT_FOUND, GET_RESUME_CONTENT_ERROR
- Leverage existing patterns from Story 9-1 (save-resume action, database schema)
- Follow authentication patterns from Stories 8-1 through 8-5

**File Structure:**
- Server actions: `/actions/resume/get-user-resumes.ts`, `/actions/resume/get-resume-content.ts`
- UI component: `/components/resume/SelectResumeButton.tsx`
- Update: `/app/(authenticated)/optimize/page.tsx` to integrate selection
- Types: Extend `/types/index.ts` with `UserResumeOption` interface (minimal: id, name, created_at)
- Database: No new tables needed (uses `user_resumes` from story 9-1)

**Technology Stack (from project-context.md):**
- Next.js 16, TypeScript, Supabase (user_resumes table + RLS)
- shadcn/ui (Button, Dialog/Modal, RadioGroup or selectable list)
- Zustand (manage selected resume state + resumeContent)
- React Hook Form optional for advanced validation
- Toast notifications (sonner) for errors

### Technical Requirements

1. **Fetch User Resumes Action**
   ```typescript
   // /actions/resume/get-user-resumes.ts
   export async function getUserResumes(): Promise<ActionResponse<UserResumeOption[]>> {
     const supabase = createServerClient();
     const { data: user } = await supabase.auth.getUser();

     if (!user) {
       return { data: null, error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } };
     }

     const { data, error } = await supabase
       .from('user_resumes')
       .select('id, name, created_at')
       .eq('user_id', user.id)
       .order('created_at', { ascending: false });

     if (error) {
       return { data: null, error: { message: error.message, code: 'GET_RESUMES_ERROR' } };
     }

     return { data: data || [], error: null };
   }
   ```

2. **Fetch Resume Content Action**
   ```typescript
   // /actions/resume/get-resume-content.ts
   export async function getResumeContent(resumeId: string): Promise<ActionResponse<UserResume>> {
     const supabase = createServerClient();
     const { data: user } = await supabase.auth.getUser();

     if (!user) {
       return { data: null, error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } };
     }

     const { data, error } = await supabase
       .from('user_resumes')
       .select('id, name, resume_content')
       .eq('id', resumeId)
       .eq('user_id', user.id)
       .single();

     if (error) {
       if (error.code === 'PGRST116') { // Not found
         return { data: null, error: { message: 'Resume not found', code: 'RESUME_NOT_FOUND' } };
       }
       return { data: null, error: { message: error.message, code: 'GET_RESUME_CONTENT_ERROR' } };
     }

     return { data, error: null };
   }
   ```

3. **Zustand Store Extension**
   - Add `selectedResumeId: string | null` to store (tracks which resume is selected)
   - Add `setSelectedResumeId(id)` action
   - Existing `resumeContent` holds the actual file content
   - Clear both on logout

4. **SelectResumeButton Component Pattern**
   - Use shadcn Dialog + RadioGroup for resume selection
   - Display formatted dates (e.g., "Jan 27, 2026 at 2:30 PM")
   - Show loading state while fetching list
   - On selection, show loading while fetching content
   - Display success toast when resume loaded
   - Display error toast if fetch fails

5. **UI Integration on Optimize Page**
   - Show both "Upload Resume" and "Select from Library" buttons
   - After selection, show "Selected: [Resume Name]" with "Change" button
   - "Change" button opens selection modal again
   - When no resume selected, show upload form
   - When resume selected, show resume name and option to change

### Project Structure Notes

**Alignment with V1.0 patterns:**
- Server actions follow pattern from story 9-1 (same directory)
- UI components follow pattern from story 9-1 (shadcn Dialog + form patterns)
- Database queries use RLS policies from story 9-1 (per-user isolation automatic)
- Error handling mirrors story 9-1 (standardized error codes)

**State Management:**
- Zustand store: Existing `resumeContent` holds file text, new `selectedResumeId` tracks which resume
- No database polling needed (user_resumes is small table, fetch on-demand)
- Clear state on logout to prevent stale selections

**Database Integration:**
- Query `user_resumes` table (already exists from story 9-1)
- RLS policies already enforce user isolation
- No new migrations needed

### Previous Story Intelligence (Story 9-1: Save Resume to Library)

**Key Learnings from 9-1:**
- user_resumes table schema: id (PK), user_id (FK), name (VARCHAR 100), resume_content (TEXT), created_at, updated_at
- RLS policy already enforces user isolation: `auth.uid() = user_id`
- 3-resume limit enforced in server action (not UI-only)
- Error codes established: UNAUTHORIZED, SAVE_RESUME_ERROR, RESUME_LIMIT_EXCEEDED
- Modal pattern used: shadcn Dialog with input field
- SaveResumeButton component location: `/components/resume/`
- Toast notifications via sonner for all feedback

**Build on Story 9-1:**
- Reuse error handling pattern (ActionResponse<T>, standardized codes)
- Mirror modal/dialog approach for resume selection
- Use same Zustand store access pattern (already has resumeContent)
- Follow same authentication check pattern (user must be logged in)
- Same database table, no migration needed

### Testing Requirements

1. **Unit Tests (Vitest)**
   - Test get-user-resumes action: success, auth, empty list, database error
   - Test get-resume-content action: success, auth, not found, unauthorized access, database error
   - Test Zustand store: set/clear selectedResumeId
   - Mock Supabase queries for both server actions

2. **Integration Tests (Playwright)**
   - Sign in → Save 2 resumes → Click "Select from Library"
   - See list of saved resumes with dates
   - Select one → content loads into resumeContent
   - Verify optimization can run with selected resume
   - Test "Change Resume" button workflow
   - Test empty state (no resumes saved)
   - Test error state (network failure)

3. **Manual Testing Checklist**
   - [ ] Signed in, no resumes saved
   - [ ] Click "Select from Library" → see empty state
   - [ ] Save 2 resumes (from story 9-1 or manually)
   - [ ] Click "Select from Library" → see list with dates
   - [ ] Select one → content loads, shows "Selected: [Name]"
   - [ ] Can optimize with selected resume
   - [ ] Click "Change Resume" → modal opens again
   - [ ] Select different resume → content updates
   - [ ] Sign out → signed back in → state cleared
   - [ ] Delete a resume (story 9-3) → list updates
   - [ ] Test with 3 resumes (full library)

### Git Intelligence (Recent Commits)

**From V1.0 Implementation:**
- Commit `8241968`: Story 9-1 merge (PR #100) - resume save implementation patterns
- Commit `72a5373`: Epic 8 integration (PR #99) - auth patterns, Zustand integration
- Commit `acd8314`: Story 8-5 onboarding (PR #98) - modal UI patterns

**Commit Conventions:**
- Feature commits: `feat(story-9-2): Implement Resume Selection from Library`
- Add `data-testid` attributes for all interactive elements
- Follow existing linting rules
- Keep commits focused and logical

### Latest Tech Information

**Supabase RLS for Multi-User Isolation (2026)**
- RLS policies from user_resumes table automatically enforce user isolation
- No need for additional client-side filtering
- Query returns only authenticated user's data

**Modal Dialog UX Patterns (2026)**
- Use shadcn Dialog + RadioGroup for selection
- Show loading states during async operations
- Format dates for human readability (use `new Date().toLocaleDateString()`)
- Provide fallback if JavaScript fails (server-side validation is primary)

**Date Formatting Best Practices**
```typescript
// Format created_at for display
new Date(resume.created_at).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})
```

---

## Project Context Reference

**Critical Rules from project-context.md:**
1. **ActionResponse Pattern (MANDATORY):** Never throw from server actions.
2. **Error Codes:** Use standardized codes, add GET_RESUMES_ERROR, RESUME_NOT_FOUND, GET_RESUME_CONTENT_ERROR
3. **Directory Structure:** Follow `/actions/resume/`, `/components/` organization
4. **RLS Policies:** All user data must be isolated via RLS (already done)

**Related Files:**
- Resume Library: See story 9-1 (save-resume patterns, database schema)
- Auth Stories: See stories 8-1 through 8-5 (server action patterns, error codes)
- Resume Upload: See stories 3-1 through 3-5 (file handling patterns)
- Error Display: See story 7-1 (error message patterns)

**Complete context:** See `_bmad-output/project-context.md`

---

## Story Completion Status

- **Created:** 2026-01-27
- **Ready for Dev:** ✅ YES
- **Epic Progress:** Epic 9: 2/4 stories ready (9-1 done, 9-2 ready, 9-3/9-4 backlog)
- **Next Step:** Run `/bmad:bmm:workflows:dev-story story_key=9-2-implement-resume-selection-from-library`

### Dev Agent Notes

This story requires:
1. Creating two server actions: get-user-resumes (list) and get-resume-content (fetch)
2. Building UI component for resume selection modal with RadioGroup
3. Integrating with Zustand store (selectedResumeId + resumeContent)
4. Updating /optimize page to support both upload and selection
5. Error handling for auth, not-found, network errors
6. Testing across selection workflow and edge cases

**Complexity:** Medium (two server actions, modal UI, state management, RLS queries)

**Dependencies:**
- Story 9-1 must be complete (user_resumes table + save-resume patterns)
- Stories 8-1 through 8-5 complete (auth, Zustand patterns established)
- Story 3-1 complete (resume upload state already in place)

---

## References

- **Supabase Auth & RLS:** https://supabase.com/docs/guides/auth
- **Row Level Security:** https://supabase.com/docs/guides/database/postgres/row-level-security
- **Supabase JavaScript Client:** https://supabase.com/docs/reference/javascript
- **Story 9-1:** `_bmad-output/implementation-artifacts/9-1-implement-save-resume-to-library.md`
- **Story 8-1:** `_bmad-output/implementation-artifacts/8-1-implement-email-password-registration.md`
- **Epic 9 Overview:** `_bmad-output/planning-artifacts/epics.md` (line 932-945)

---

_Story created by BMad Ultimate Context Engine | V1.0 create-story workflow_
