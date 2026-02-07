# Story 8.5: Implement Onboarding Flow

**Status:** done
**Epic:** 8 - User Authentication (V1.0)
**Version:** 8.5
**Date Created:** 2026-01-26

---

## Story

As a user,
I want to complete a brief onboarding with 3 questions,
So that the app can personalize my experience.

---

## Acceptance Criteria

1. **Given** I have just created an account
   **When** I complete onboarding
   **Then** I am asked 3 questions about my background/goals
   **And** my answers are saved to my profile
   **And** I can skip onboarding if desired
   **And** I am directed to the main app after completion

---

## Tasks / Subtasks

- [x] Task 1: Design onboarding questions (AC: #1)
  - [x] Define 3 specific questions about user background/goals
  - [x] Questions should be optional (user can skip all)
  - [x] Questions should collect actionable personalization data
  - [x] Document questions for team reference

- [x] Task 2: Create onboarding UI component (AC: #1)
  - [x] Build multi-step form with 3 questions (one per step or all on one page)
  - [x] Add "Skip Onboarding" button (visible on each step)
  - [x] Add "Next" button for navigation between questions
  - [x] Add "Complete" button on final question
  - [x] Display progress indicator (step 1 of 3, etc.)
  - [x] Use shadcn/ui components for consistency

- [x] Task 3: Create onboarding page/route (AC: #1)
  - [x] Create `/app/auth/onboarding/page.tsx` route
  - [x] Redirect here automatically after first signup
  - [x] Only accessible to newly authenticated users (first-time flag)
  - [x] After completion/skip, redirect to `/optimize`

- [x] Task 4: Implement onboarding server action (AC: #1)
  - [x] Create server action to save answers to user profile
  - [x] Implement ActionResponse<T> pattern
  - [x] Store answers in Supabase `profiles` table
  - [x] Handle save errors gracefully
  - [x] Mark user as "onboarding_complete" in profile

- [x] Task 5: Integration with signup flow (AC: #1)
  - [x] After successful signup (story 8-1), redirect to onboarding
  - [x] Check if user has completed onboarding before allowing `/optimize`
  - [x] Allow users to access app without completing onboarding (skip works)
  - [x] Make onboarding optional - don't block access

---

## Dev Notes

### Architecture Compliance

**Required Patterns:**
- ActionResponse<T> pattern: Always return `{ data: T, error: null }` or `{ data: null, error: ErrorObject }`
- Error codes: Use standardized code ONBOARDING_SAVE_ERROR
- Leverage existing auth patterns from 8-1, 8-2, 8-3, 8-4

**File Structure:**
- Onboarding page: `/app/auth/onboarding/page.tsx`
- Onboarding component: `/components/forms/OnboardingForm.tsx`
- Server action: `/actions/auth/save-onboarding.ts`
- Types: Extend `/types/auth.ts` with `OnboardingAnswers` type
- Database: Use `profiles` table to store onboarding data

**Technology Stack (from project-context.md):**
- Next.js 16, TypeScript, Supabase (profiles table)
- shadcn/ui (form, button, progress indicator)
- React Hook Form + Zod (optional - can use simple controlled state)

### Technical Requirements

1. **Database Schema**
   ```sql
   -- Extend profiles table with onboarding columns
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_answers JSONB;
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;
   ```

2. **Onboarding Questions (to be finalized by team)**
   - **Question 1:** "What is your primary career goal?" (text input or select)
   - **Question 2:** "What's your experience level?" (select: entry/mid/senior)
   - **Question 3:** "Which industries interest you?" (multi-select or textarea)

   OR alternative questions from team - this is a template.

3. **Server Action Pattern**
   ```typescript
   // /actions/auth/save-onboarding.ts
   export async function saveOnboarding(
     answers: OnboardingAnswers
   ): Promise<ActionResponse<{ success: true }>> {
     const supabase = createServerClient();
     const { data: user } = await supabase.auth.getUser();

     if (!user) {
       return { data: null, error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } };
     }

     const { error } = await supabase
       .from('profiles')
       .update({
         onboarding_answers: answers,
         onboarding_complete: true,
         onboarding_completed_at: new Date().toISOString(),
       })
       .eq('user_id', user.id);

     if (error) {
       return { data: null, error: { message: error.message, code: 'ONBOARDING_SAVE_ERROR' } };
     }

     return { data: { success: true }, error: null };
   }
   ```

4. **Redirect Logic After Signup**
   - In signup success handler (story 8-1), check if `onboarding_complete === false`
   - If false, redirect to `/auth/onboarding`
   - If true (shouldn't happen on first signup), redirect to `/optimize`
   - Store `onboarding_complete` flag in Zustand store for client-side checks

5. **Skip Onboarding**
   - "Skip" button calls same server action with empty/null answers
   - Sets `onboarding_complete = true` anyway
   - Allows users to proceed without answering questions
   - Still redirects to `/optimize` after skip

6. **Error Handling**
   - Save error → "Failed to save preferences. Please try again."
   - Network error → "Connection error. Your preferences will be saved next time."
   - Network errors should not block redirect to `/optimize` (graceful degradation)

### Project Structure Notes

**Alignment with V1.0 patterns:**
- Onboarding page: New route at `/app/auth/onboarding/page.tsx`
- Form component: Mirrors LoginForm/SignupForm patterns in `/components/forms/`
- Server action: Follows pattern from 8-1, 8-2, 8-3, 8-4 in `/actions/auth/`
- Database: Extends existing `profiles` table (no new tables)

**State Management:**
- Zustand store: Add `onboardingComplete` flag to auth store
- After save, update: `authStore.setOnboardingComplete(true)`
- Use this flag to show/hide onboarding route from navigation

**Database Schema:**
- Extends `profiles` table (created in story 8-1 or as part of auth setup)
- Adds: `onboarding_complete`, `onboarding_answers`, `onboarding_completed_at`
- Migration file: `supabase/migrations/add_onboarding_columns.sql`

### Testing Requirements

1. **Unit Tests (Vitest)**
   - Test save-onboarding server action with mock Supabase
   - Test successful save response
   - Test error handling (save errors, network errors)
   - Verify ActionResponse pattern
   - Test skip functionality

2. **Integration Tests (Playwright)**
   - Sign up new account → redirected to onboarding
   - Fill out 3 questions → click Complete
   - Verify answers saved to database
   - Verify redirected to `/optimize`
   - Test skip onboarding flow
   - Test accessing onboarding multiple times (should already be marked complete)

3. **Manual Testing Checklist**
   - [ ] Sign up new account
   - [ ] Verify redirected to onboarding page
   - [ ] Fill out all 3 questions
   - [ ] Click Complete → verify redirected to `/optimize`
   - [ ] Sign out and sign in again → onboarding should not appear
   - [ ] Create another account and click Skip → verify skipped to `/optimize`
   - [ ] Verify answers are stored in database (`profiles` table)
   - [ ] Test on mobile (responsive design)
   - [ ] Test error scenarios (network failure during save)

### Previous Story Learning (Stories 8-1, 8-2, 8-3, 8-4)

**From All Previous Auth Stories:**
- ActionResponse<T> pattern fully established
- Error code mapping standardized
- AuthProvider session management proven
- Form component patterns established
- Server action patterns mastered
- Redirect logic patterns established

**Build on 8-1, 8-2, 8-3, 8-4:**
- Reuse error handling patterns
- Leverage existing AuthProvider
- Use same Zustand store reset/update pattern
- Follow established auth file structure
- Use same database update pattern as 8-1 (profile updates)

### Git Intelligence (Recent Commits)

Recent patterns from V1.0 auth stories:
- `e889daa`: Story 8-4 implementation with sign-out tests
- `c66327c`: Story 8-3 implementation with OAuth tests
- `fa6ddbc`: Story 8-2 implementation with login tests

**Commit conventions:**
- Feature commits: `feat(story-8-5): Implement Onboarding Flow`
- Add `data-testid` attributes for all interactive elements
- Follow existing linting rules
- Keep commits focused and logical

---

## Latest Tech Information

### Multi-Step Form Patterns (2026)

**Option 1: Single Page (Recommended for 3 questions)**
```typescript
// All questions on one form
// Simpler implementation, better UX for short forms
const [answers, setAnswers] = useState<OnboardingAnswers>({
  question1: '',
  question2: '',
  question3: '',
});
```

**Option 2: Multi-Step Modal**
```typescript
// Step-by-step wizard
// Better for longer forms, more engaging
const [currentStep, setCurrentStep] = useState(0);
```

**Recommendation:** Single page form for 3 questions (simpler, faster, better UX)

### Supabase Profile Updates (2026)

**Pattern for storing onboarding data:**
```typescript
// Use JSONB column for flexibility
await supabase
  .from('profiles')
  .update({
    onboarding_answers: {
      question1: 'answer1',
      question2: 'answer2',
      question3: 'answer3',
    },
    onboarding_complete: true,
    onboarding_completed_at: new Date().toISOString(),
  })
  .eq('user_id', userId);
```

**Key Features:**
- JSONB allows flexible question structure
- Timestamps track when onboarding was completed
- Boolean flag for quick "is complete" checks
- No migration risk - just adding new columns

---

## Project Context Reference

**Critical Rules from project-context.md:**
1. **ActionResponse Pattern (MANDATORY):** Never throw from server actions.
2. **Error Codes:** Use standardized codes, add ONBOARDING_SAVE_ERROR variant.
3. **Directory Structure:** Follow `/actions/auth/`, `/components/forms/`, `/app/auth/` organization
4. **LLM Security:** Not applicable to this story

**Related Files:**
- Email/Password Auth: See story 8-1, 8-2
- Google OAuth: See story 8-3
- Sign Out: See story 8-4
- Session Management: See archived Epic 2 (2-2)
- AuthProvider: Check `/components/providers/AuthProvider.tsx`

**Complete context:** See `_bmad-output/project-context.md`

---

## Story Completion Status

- **Created:** 2026-01-26
- **Ready for Dev:** ✅ YES
- **Epic Progress:** Epic 8: 5/6 stories ready (8-1 done, 8-2 done, 8-3 done, 8-4 done, 8-5 ready)
- **Next Step:** Run `/bmad:bmm:workflows:dev-story story_key=8-5-implement-onboarding-flow`

### Dev Agent Notes

This story requires:
1. Defining 3 specific onboarding questions (team decision)
2. Creating multi-step form (single page recommended for 3 questions)
3. Implementing save-onboarding server action
4. Extending `profiles` table with onboarding columns
5. Integrating with signup flow (redirect after signup)
6. Testing skip functionality and multi-signup scenarios
7. Verifying data persistence across sessions

**Complexity:** Medium (form implementation, database integration, redirect logic)

**Dependencies:**
- Story 8-1 must be complete (user signup, profiles table, AuthProvider)
- Story 8-2 must be complete (login flow established)
- Story 8-3 must be complete (multi-auth support)
- Story 8-4 must be complete (auth UI patterns)

---

## Dev Agent Record

### Implementation Plan

**Onboarding Questions Defined:**
1. **Career Goal:** 5 options (first job, switching careers, advancing, promotion, returning)
2. **Experience Level:** 4 options (entry, mid, senior, executive)
3. **Target Industries:** 8 options with multi-select (technology, healthcare, finance, education, marketing, engineering, retail, other)

**Architecture Decisions:**
- Single-page form (all 3 questions on one page) for better UX with short questionnaire
- ActionResponse<T> pattern for all server actions
- JSONB storage for flexibility in onboarding_answers
- Skip functionality implemented as separate server action

**Implementation Approach:**
- RED phase: Write failing tests for save-onboarding action
- GREEN phase: Implement server action, form component, and page
- REFACTOR phase: Ensure error handling and validation are robust
- Integration: Update signup and OAuth callback flows

### Completion Notes

✅ **Successfully implemented onboarding flow with all requirements met:**

1. **Database Schema:** Created migration `20260126000000_add_onboarding_columns.sql` adding:
   - `onboarding_complete` (boolean, default false)
   - `onboarding_answers` (JSONB)
   - `onboarding_completed_at` (timestamp)
   - Index on `onboarding_complete` for faster queries

2. **Types:** Extended `types/auth.ts` with `OnboardingAnswers` and `OnboardingSaveResult`

3. **Server Actions:** Created `actions/auth/save-onboarding.ts` with:
   - `saveOnboarding()` - Saves user answers to profile
   - `skipOnboarding()` - Marks onboarding complete without answers
   - Both follow ActionResponse<T> pattern
   - Proper error codes (AUTH_ERROR, ONBOARDING_SAVE_ERROR)

4. **UI Components:** Created `components/forms/OnboardingForm.tsx` with:
   - Single-page form with all 3 questions
   - Radio groups for career goal and experience level
   - Checkboxes for multi-select industries
   - Progress indicators (Step 1/2/3 of 3)
   - Complete and Skip buttons
   - Validation requiring all questions answered
   - data-testid attributes for testing

5. **Page Route:** Created `app/auth/onboarding/page.tsx` for the onboarding flow

6. **Integration:** Updated signup and OAuth flows:
   - `app/auth/signup/page.tsx` - Redirects to onboarding after signup
   - `app/auth/callback/page.tsx` - Checks onboarding status after OAuth, redirects if incomplete

7. **UI Library:** Added shadcn/ui `radio-group` component

8. **Tests:** Created comprehensive test suite:
   - Unit tests for `save-onboarding` action (7 tests, all passing)
   - E2E tests for onboarding flow (8 tests covering complete flow, skip, validation)

**All acceptance criteria satisfied:**
- ✅ AC1: Users asked 3 questions after signup
- ✅ AC1: Answers saved to profile
- ✅ AC1: Users can skip onboarding
- ✅ AC1: Users directed to main app (/optimize) after completion

---

## File List

**New Files:**
- `supabase/migrations/20260126000000_add_onboarding_columns.sql`
- `actions/auth/save-onboarding.ts`
- `components/forms/OnboardingForm.tsx`
- `components/ui/radio-group.tsx` (shadcn/ui)
- `app/auth/onboarding/page.tsx`
- `tests/unit/actions/auth/save-onboarding.test.ts`
- `tests/e2e/onboarding.spec.ts`

**Modified Files:**
- `types/auth.ts` (added OnboardingAnswers with strict union types, OnboardingSaveResult)
- `types/error-codes.ts` (added ONBOARDING_SAVE_ERROR)
- `types/errors.ts` (added error message for ONBOARDING_SAVE_ERROR)
- `app/auth/signup/page.tsx` (redirect to onboarding after signup)
- `app/auth/callback/page.tsx` (check onboarding status, redirect to /optimize or /auth/onboarding)
- `tests/unit/app/auth/callback.test.tsx` (updated mocks, added onboarding redirect tests)
- `package.json` (added @radix-ui/react-radio-group dependency)
- `package-lock.json` (lockfile update)

---

## Change Log

- **2026-01-26:** Code review fixes applied
  - H1: Added server-side auth protection to onboarding page (redirect unauthenticated users to /auth/login, redirect already-onboarded users to /optimize)
  - H2: Added 3 new callback tests (onboarding redirect, onboarding complete, no profile)
  - H3: Fixed callback redirect from `/` to `/optimize` for consistency
  - M1: Updated File List to include package.json and package-lock.json
  - M2: Added server-side validation for onboarding answers (career goal, experience level, industries)
  - M3: Tightened OnboardingAnswers types with union types (CareerGoal, ExperienceLevel, Industry)
  - M4: Fixed callback to redirect to onboarding when profile is null (new OAuth user)
  - Added 3 validation tests and 2 callback tests (15 total, all passing)

- **2026-01-26:** Story 8-5 implementation completed
  - Defined 3 onboarding questions with actionable personalization data
  - Created OnboardingForm component with single-page layout
  - Implemented save-onboarding server actions (save + skip)
  - Extended profiles table with onboarding columns
  - Integrated with signup and OAuth callback flows
  - Added comprehensive test coverage (unit + e2e)
  - All tasks completed, all tests passing

---

## References

- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **Session Management:** https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- **Multi-Step Forms:** https://react-hook-form.com/form-builder
- **Story 8-1:** `_bmad-output/implementation-artifacts/8-1-implement-email-password-registration.md`
- **Story 8-2:** `_bmad-output/implementation-artifacts/8-2-implement-email-password-login.md`
- **Story 8-3:** `_bmad-output/implementation-artifacts/8-3-implement-google-oauth.md`
- **Story 8-4:** `_bmad-output/implementation-artifacts/8-4-implement-sign-out.md`

---

_Story created by create-story workflow | Ultimate Context Engine v1.0_
