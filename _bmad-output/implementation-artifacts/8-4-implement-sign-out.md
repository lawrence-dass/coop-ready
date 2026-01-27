# Story 8.4: Implement Sign Out

**Status:** ready-for-dev
**Epic:** 8 - User Authentication (V1.0)
**Version:** 8.4
**Date Created:** 2026-01-26

---

## Story

As a user,
I want to sign out of my account,
So that I can secure my session on shared devices.

---

## Acceptance Criteria

1. **Given** I am signed in
   **When** I click sign out
   **Then** my session is terminated
   **And** I am redirected to the home page
   **And** my data is no longer accessible without signing in again

---

## Tasks / Subtasks

- [ ] Task 1: Create sign-out button UI (AC: #1)
  - [ ] Add sign-out button to navigation/header
  - [ ] Button should be visible only when authenticated
  - [ ] Use shadcn/ui Button with icon
  - [ ] Add loading state during sign-out
  - [ ] Add confirm dialog before sign-out (optional UX improvement)

- [ ] Task 2: Implement sign-out server action (AC: #1)
  - [ ] Create server action for sign-out
  - [ ] Call `supabase.auth.signOut()`
  - [ ] Implement ActionResponse<T> pattern
  - [ ] Handle sign-out errors
  - [ ] Clear Zustand auth store

- [ ] Task 3: Session cleanup (AC: #1)
  - [ ] Clear authentication tokens via Supabase
  - [ ] Remove user context from AuthProvider
  - [ ] Clear all authenticated-user-only store data
  - [ ] Ensure no sensitive data remains in localStorage/cookies

- [ ] Task 4: Post-sign-out redirect (AC: #1)
  - [ ] Redirect to home page (`/`) after successful sign-out
  - [ ] Redirect to login page (`/auth/login`) as alternative UX
  - [ ] Prevent access to protected routes after sign-out
  - [ ] Middleware should block `/optimize` if not authenticated

- [ ] Task 5: Testing and error handling (AC: #1)
  - [ ] Test sign-out from different pages
  - [ ] Test session state cleanup
  - [ ] Test redirect behavior
  - [ ] Test error scenarios (network failure, sign-out API error)

---

## Dev Notes

### Architecture Compliance

**Required Patterns:**
- ActionResponse<T> pattern: Always return `{ data: T, error: null }` or `{ data: null, error: ErrorObject }`
- Error codes: Use standardized code SIGN_OUT_ERROR
- Leverage existing auth patterns from 8-1, 8-2, 8-3

**File Structure:**
- Sign-out handler: `/actions/auth/sign-out.ts`
- Button component: Update existing header/navigation component (location TBD - check current auth UI)
- Types: Extend `/types/auth.ts` if needed
- Middleware: Update `/middleware.ts` if it exists (for route protection)

**Technology Stack (from project-context.md):**
- Next.js 16, TypeScript, Supabase Auth (session management)
- shadcn/ui (Button with icon)
- Zustand (auth store clear)

### Technical Requirements

1. **Sign-Out Server Action**
   ```typescript
   // /actions/auth/sign-out.ts
   export async function signOut(): Promise<ActionResponse<{ success: true }>> {
     const supabase = createServerClient();
     const { error } = await supabase.auth.signOut();
     if (error) {
       return {
         data: null,
         error: { message: error.message, code: 'SIGN_OUT_ERROR' }
       };
     }
     return { data: { success: true }, error: null };
   }
   ```

2. **Zustand Store Cleanup**
   - Call `authStore.reset()` or equivalent after sign-out
   - Store must clear: `currentUser`, `isAuthenticated`, and any user-specific data
   - Verify from existing auth store (created in stories 8-1, 8-2)
   - Pattern: Store actions should have a `clearAuth()` method for logout

3. **Session Termination**
   - Supabase handles JWT invalidation automatically via `signOut()`
   - Secure httpOnly cookies are cleared by Supabase
   - No manual token cleanup needed (Supabase manages)
   - `supabase.auth.onAuthStateChange()` will fire with 'SIGNED_OUT' event

4. **Route Protection Post-Sign-Out**
   - Protected routes (e.g., `/optimize`) should check `isAuthenticated` state
   - If not authenticated, redirect to `/auth/login` or home page
   - This may already be implemented via AuthProvider wrapper
   - Check existing route protection strategy (likely in AuthProvider or middleware)

5. **Error Handling**
   - Sign-out error → "Failed to sign out. Please try again."
   - Network error → "Connection error. Please try again."
   - All errors return SIGN_OUT_ERROR code

### Project Structure Notes

**Alignment with V1.0 patterns:**
- Sign-out button: Add to existing header/navigation (find where auth UI currently renders)
- Server action: Follow pattern from 8-1 (signup) and 8-2 (login) in `/actions/auth/`
- No new database tables needed (sign-out is purely session termination)

**State Management:**
- AuthProvider already manages authenticated state
- Zustand store should have reset/clearAuth pattern from previous stories
- After sign-out, auth context should become null/unauthenticated

**Database Schema:**
- No changes needed - sign-out only terminates session
- Session is managed by Supabase Auth (no app-level session table manipulation)
- User's data in `sessions` table remains (for future login)

### Testing Requirements

1. **Unit Tests (Vitest)**
   - Test sign-out server action with mock Supabase
   - Test successful sign-out response
   - Test error handling for sign-out errors
   - Verify ActionResponse pattern

2. **Integration Tests (Playwright)**
   - Sign in → navigate to `/optimize` → click sign-out
   - Verify redirect to home/login page
   - Verify `/optimize` is inaccessible after sign-out
   - Test sign-out from various pages (should work from any page)

3. **Manual Testing Checklist**
   - [ ] Sign in with email/password
   - [ ] Verify sign-out button appears in header
   - [ ] Click sign-out
   - [ ] Verify redirected to home page (or login page per design)
   - [ ] Try accessing `/optimize` - should redirect to login
   - [ ] Refresh page - should stay on login/home (no re-auth)
   - [ ] Sign in again - should work normally
   - [ ] Test network error during sign-out (simulate offline)

### Previous Story Learning (Stories 8-1, 8-2, 8-3)

**From Email/Password Stories (8-1, 8-2):**
- ActionResponse<T> pattern established
- Error code mapping standardized
- AuthProvider session recovery proven
- Form component patterns ready to extend

**From OAuth Story (8-3):**
- Account linking and migration logic confirmed
- OAuth flow callbacks established
- Session establishment pattern verified

**Build on 8-1, 8-2, 8-3:**
- Reuse error handling patterns
- Leverage existing AuthProvider for session termination
- Use same Zustand store reset pattern
- Follow established auth file structure

### Git Intelligence (Recent Commits)

Recent patterns from V1.0:
- `c66327c`: Story 8-3 implementation with OAuth tests
- `fa6ddbc`: Story 8-2 implementation with 251 component tests, 248 action tests
- `1046725`: Type system fixes

**Commit conventions:**
- Feature commits: `feat(story-8-4): Implement Sign Out`
- Add `data-testid` attributes for all interactive elements
- Follow existing linting rules
- Keep commits focused and logical

---

## Latest Tech Information

### Supabase Auth Session Management (2026)

**Sign-Out Flow:**
```typescript
// Simple one-liner sign-out
const { error } = await supabase.auth.signOut();

// Clears:
// - JWT token from secure httpOnly cookie
// - Session state on Supabase
// - Triggers onAuthStateChange with SIGNED_OUT event
```

**Key Features:**
- Automatic JWT invalidation
- Cross-tab sign-out (via storage events)
- No manual token cleanup needed
- Instant effect - no propagation delay

**Error Handling:**
- Main error: Network issues or Supabase API failure
- Recoverable via retry
- User can manually clear cookies if sign-out fails (fallback)

### Session Recovery Prevention (2026)

**After Sign-Out:**
- `supabase.auth.getSession()` returns null
- `supabase.auth.onAuthStateChange()` fires SIGNED_OUT event
- All authenticated API calls return 401 (unauthorized)
- Page reload: AuthProvider checks session → redirects to login

**Best Practice:**
- Clear local user state immediately (don't wait for server response)
- Show optimistic redirect to login
- Retry sign-out if initial attempt fails

---

## Project Context Reference

**Critical Rules from project-context.md:**
1. **ActionResponse Pattern (MANDATORY):** Never throw from server actions.
2. **Error Codes:** Use standardized codes, add SIGN_OUT_ERROR variant.
3. **Directory Structure:** Follow `/actions/auth/`, `/components/` organization
4. **LLM Security:** Not applicable to this story

**Related Files:**
- Email/Password Auth: See story 8-1, 8-2
- Google OAuth: See story 8-3
- Session Management: See archived Epic 2 (2-2)
- AuthProvider: Check `/components/providers/AuthProvider.tsx` (created in 8-1 or 8-2)

**Complete context:** See `_bmad-output/project-context.md`

---

## Story Completion Status

- **Created:** 2026-01-26
- **Ready for Dev:** ✅ YES
- **Epic Progress:** Epic 8: 4/6 stories ready (8-1 done, 8-2 done, 8-3 done, 8-4 ready)
- **Next Step:** Run `/bmad:bmm:workflows:dev-story story_key=8-4-implement-sign-out`

### Dev Agent Notes

This story requires:
1. Creating sign-out server action following ActionResponse pattern
2. Adding sign-out button to authenticated navigation
3. Clearing Zustand auth store state
4. Redirecting user after sign-out
5. Verifying session cleanup and route protection
6. Error handling for sign-out failures
7. Testing across different authentication methods (email/password, OAuth)

**Complexity:** Low-Medium (straightforward session cleanup, no migration logic)

**Dependencies:**
- Story 8-1 must be complete (AuthProvider, auth store created)
- Story 8-2 must be complete (login flow established)
- Story 8-3 must be complete (multi-auth method support)
- Navigation/header component with auth UI must exist

---

## References

- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **Session Management:** https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- **Story 8-1:** `_bmad-output/implementation-artifacts/8-1-implement-email-password-registration.md`
- **Story 8-2:** `_bmad-output/implementation-artifacts/8-2-implement-email-password-login.md`
- **Story 8-3:** `_bmad-output/implementation-artifacts/8-3-implement-google-oauth.md`

---

_Story created by create-story workflow | Ultimate Context Engine v1.0_
