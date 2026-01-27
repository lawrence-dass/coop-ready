# Story 8.1: Implement Email/Password Registration

**Status:** ready-for-dev
**Epic:** 8 - User Authentication (V1.0)
**Version:** 8.1
**Date Created:** 2026-01-26

---

## Story

As a user,
I want to create an account with my email and password,
So that I can save my work and access it later.

---

## Acceptance Criteria

1. **Given** I am on the signup page
   **When** I enter a valid email and password
   **Then** an account is created via Supabase Auth
   **And** I receive a confirmation email (if required)
   **And** my anonymous session data is migrated to my new account
   **And** I am redirected to the app

---

## Tasks / Subtasks

- [ ] Task 1: Create signup UI component (AC: #1)
  - [ ] Build form with email and password fields
  - [ ] Add password strength indicator
  - [ ] Add terms/privacy checkbox
  - [ ] Add loading and error states
  - [ ] Implement form validation (Zod schema)

- [ ] Task 2: Implement Supabase Auth signup (AC: #1)
  - [ ] Create server action for email/password signup
  - [ ] Call supabase.auth.signUpWithPassword()
  - [ ] Implement ActionResponse<T> pattern
  - [ ] Handle auth errors: user_already_exists, weak_password, invalid_email

- [ ] Task 3: Implement session migration (AC: #1)
  - [ ] Load anonymous session data from current user
  - [ ] Create migration logic: copy resume_content, jd_content, analysis, suggestions to new user's profile
  - [ ] Preserve session continuity for UX
  - [ ] Handle edge cases: concurrent signup/data changes

- [ ] Task 4: Email confirmation flow (AC: #1)
  - [ ] Implement email verification requirement (Supabase config)
  - [ ] Show "verification sent" message
  - [ ] Optionally redirect to verification waiting page
  - [ ] Skip if email verification disabled in Supabase

- [ ] Task 5: Post-signup redirect (AC: #1)
  - [ ] Redirect to `/dashboard` or `/optimize` after signup
  - [ ] Preserve user context and previous work
  - [ ] Handle redirect after email verification

---

## Dev Notes

### Architecture Compliance

**Required Patterns:**
- ActionResponse<T> pattern (from project-context.md): Always return `{ data: T, error: null }` or `{ data: null, error: ErrorObject }`. **NEVER throw** from server actions.
- Error codes: Use standardized error codes from project-context.md: INVALID_FILE_TYPE, FILE_TOO_LARGE, PARSE_ERROR, LLM_TIMEOUT, LLM_ERROR, RATE_LIMITED, VALIDATION_ERROR
  - For this story, add new auth-specific errors: INVALID_EMAIL, WEAK_PASSWORD, USER_EXISTS, AUTH_ERROR

**File Structure:**
- Component: `/components/forms/SignupForm.tsx`
- Server action: `/actions/auth/signup.ts`
- Types: `/types/auth.ts`
- Validation schema: `/lib/validations/auth.ts`
- Supabase client: `/lib/supabase/client.ts`

**Technology Stack (from project-context.md):**
- Next.js 16 (App Router)
- TypeScript
- React Hook Form (form handling)
- Zod (schema validation)
- @supabase/supabase-js (auth)
- shadcn/ui (components)
- Zustand (client state)

### Technical Requirements

1. **Form Validation (React Hook Form + Zod)**
   ```typescript
   // Create auth.ts in /lib/validations/
   - Email: valid email format
   - Password: min 8 chars, 1 uppercase, 1 number, 1 special char
   - Terms: must be accepted
   ```

2. **Server Action Pattern**
   ```typescript
   // /actions/auth/signup.ts - MUST follow ActionResponse pattern
   export async function signup(
     email: string,
     password: string
   ): Promise<ActionResponse<{ userId: string; email: string }>> {
     try {
       const { data, error } = await supabase.auth.signUpWithPassword({
         email,
         password,
       });
       if (error) {
         return { data: null, error: { message: error.message, code: 'AUTH_ERROR' } };
       }
       // Migration logic here
       return { data: { userId: data.user.id, email: data.user.email }, error: null };
     } catch (err) {
       return { data: null, error: { message: 'Signup failed', code: 'AUTH_ERROR' } };
     }
   }
   ```

3. **Session Migration Logic**
   - Load current `anonymous_id` from Zustand store or cookies
   - Query `sessions` table for anonymous user's data
   - Copy `resume_content`, `jd_content`, `analysis`, `suggestions` to new user's profile
   - Update session record: `user_id` = new user's ID, `anonymous_id` = null
   - Maintain data integrity: use transactions if possible

4. **Email Verification (Supabase Config)**
   - Check Supabase project settings: email_confirmation required?
   - If required: Show "Verification email sent to {email}"
   - Provide "Resend verification email" link
   - Optionally skip to next step after verification

5. **Error Handling**
   - Invalid email → Show: "Please enter a valid email address"
   - Weak password → Show: "Password must be at least 8 characters with uppercase, number, and special character"
   - User already exists → Show: "An account with this email already exists. Sign in instead?"
   - Network error → Show: "Signup failed. Please try again."

### Project Structure Notes

**Alignment with Next.js 16 App Router:**
- Signup page: `/app/auth/signup/page.tsx`
- Server action in: `/actions/auth/signup.ts` (all server operations isolated)
- Form component: `/components/forms/SignupForm.tsx` (follows pattern of ExperienceSectionSuggestions, etc.)

**State Management (Zustand):**
- Store location: `/store/auth.ts`
- Manage: `currentUser`, `isLoading`, `authError`
- Actions: `setUser()`, `setLoading()`, `setError()`, `clearAuth()`

**Database Schema (Supabase):**
- `auth.users` table (managed by Supabase Auth)
- `public.sessions` table: must have `user_id` (nullable), `anonymous_id` columns
- RLS policies: ensure anonymous users can read/write own sessions before auth, then switch to user_id-based access after signup

### Testing Requirements

1. **Unit Tests (Vitest)**
   - Validate signup form validation (Zod schema)
   - Test server action with mock Supabase
   - Test error handling for each error code

2. **Integration Tests (Playwright)**
   - Fill signup form with valid data → expect redirect to dashboard
   - Enter weak password → expect validation error
   - Use email already registered → expect "user exists" error
   - Session data persists after signup (migrate anonymous session)

3. **Manual Testing Checklist**
   - [ ] Sign up with valid email/password
   - [ ] Verify account is created in Supabase Dashboard
   - [ ] Check email for verification link (if required)
   - [ ] Verify session migration: resume data available after signup
   - [ ] Test error messages for invalid inputs
   - [ ] Test redirect to dashboard/app after signup

### Previous Story Intelligence

**Epic 8 is the first story**, so no previous story learnings.

**Previous Epic Context (Epic 7 complete):**
- Error handling patterns: Review `7-1-implement-error-display-component.md` for error message patterns
- Toast notifications: Review `7-4-implement-suggestion-feedback.md` for sonner toast implementation
- Session state: Review `2-2-implement-session-persistence.md` for how anonymous sessions work

### Git Intelligence (Recent Commits)

Recent work patterns:
- `83be7d0`: Sprint status fix, Epic 7 marked done
- `73c32e8`: V0.1 archival, CLAUDE.md trimming
- `1ed1767`: Code review fixes, data-testid attrs

**Patterns to follow:**
- Commit messages: `feat(story-X-Y): Feature name` or `fix(story-X-Y): Bug fix`
- Add `data-testid` attributes to interactive elements for testing
- Follow linting rules (ESLint config already in place)

---

## Latest Tech Information

### Supabase Auth v2 (2026)

**Email/Password Flow:**
```typescript
const { data, error } = await supabase.auth.signUpWithPassword({
  email: "user@example.com",
  password: "secure_password_123",
});
```

**Key Features:**
- Built-in email verification (optional, configurable)
- Automatic JWT token creation
- Row-level security integration via `auth.uid()`
- PKCE flow for enhanced security

**Breaking Changes from v1:**
- `signUp()` replaced by `signUpWithPassword()`
- Password requirements: No enforced complexity (configure in Supabase project)
- Error handling: Returns structured error object with `message` and `code`

**Security Considerations:**
- Always use HTTPS (Vercel enforces this)
- Never transmit passwords in URL parameters
- Use server actions to hide API calls from client
- Store JWT in secure, httpOnly cookies (handled by @supabase/ssr)

### React Hook Form v7 + Zod Integration (2026)

**Pattern:**
```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = useForm({ resolver: zodResolver(schema) });
```

**Latest Best Practice:**
- Use `server` resolver for async validation (email uniqueness check)
- Form state: `isSubmitting`, `isDirty`, `errors` automatically managed
- No manual error handling needed (form validates on change/blur)

### shadcn/ui Components (2026)

**For Signup Form:**
- `Input` component: email, password fields with icon support
- `Button` component: submit button with loading state via `disabled` prop
- `Form` component wrapper (React Hook Form integration)
- `Toast` component via sonner for error messages

---

## Project Context Reference

**Critical Rules from project-context.md:**
1. **ActionResponse Pattern (MANDATORY):** Never throw from server actions. Always return structured response.
2. **Error Codes:** Use standardized error codes. Add auth-specific codes if needed.
3. **LLM Security:** Not applicable to this story (no LLM calls)
4. **Directory Structure:** Follow file organization rules above

**Complete context:** See `_bmad-output/project-context.md`

---

## Story Completion Status

- **Created:** 2026-01-26
- **Ready for Dev:** ✅ YES
- **Ultimate Context Engine:** ✅ Analysis completed
- **Next Step:** Run `/bmad:bmm:workflows:dev-story story_key=8-1-implement-email-password-registration`

### Dev Agent Notes

This story requires:
1. Setting up new files in `/actions/auth/`, `/lib/validations/`, `/components/forms/`
2. Understanding Supabase Auth v2 email/password flow
3. Session migration logic (complex part — preserve anonymous session data)
4. Form validation with React Hook Form + Zod
5. Error handling per ActionResponse pattern

**Complexity:** Medium (auth integration + session migration)

---

## References

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **React Hook Form:** https://react-hook-form.com/
- **Zod Validation:** https://zod.dev/
- **Project Patterns:** See `_bmad-output/project-context.md#api-patterns`
- **Previous Auth Story:** `_bmad-output/archive/epic-2-completed/2-1-implement-anonymous-authentication.md`
- **Session Persistence:** `_bmad-output/archive/epic-2-completed/2-2-implement-session-persistence.md`
- **Error Display:** `_bmad-output/archive/epic-7-completed/7-1-implement-error-display-component.md`

---

_Story created by create-story workflow | Ultimate Context Engine v1.0_
