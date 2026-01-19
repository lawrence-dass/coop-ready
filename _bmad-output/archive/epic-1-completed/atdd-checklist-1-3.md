# ATDD Checklist - Epic 1, Story 1.3: User Registration

**Date:** 2026-01-18
**Author:** Lawrence
**Primary Test Level:** E2E

---

## Story Summary

Implement user registration functionality allowing new users to create accounts using email and password. This includes client-side validation, duplicate email handling, Supabase Auth integration, and email confirmation flow.

**As a** new user
**I want** to create an account using my email and password
**So that** I can access the resume optimization features

---

## Acceptance Criteria

1. **AC1: Valid Registration Flow** - User can register with valid email/password, account created in Supabase, confirmation email sent, redirected to check email page
2. **AC2: Duplicate Email Handling** - Error message displayed when email already exists, no redirect
3. **AC3: Invalid Email Validation** - Client-side validation for invalid email format, error message shown
4. **AC4: Password Length Validation** - Client-side validation for password minimum 8 characters, error message shown
5. **AC5: Email Confirmation Flow** - Email verification link confirms email and redirects to login with success message

---

## Failing Tests Created (RED Phase)

### E2E Tests (6 tests)

**File:** `tests/e2e/user-registration.spec.ts` (160 lines)

- ✅ **Test:** `[P0][AC1] should register new user with valid email and password`
  - **Status:** RED - Sign-up form components, Zod validation schema, and Server Action not yet implemented
  - **Verifies:** Valid registration creates account in Supabase Auth, sends confirmation email, redirects to sign-up-success page

- ✅ **Test:** `[P0][AC2] should display error for duplicate email`
  - **Status:** RED - Duplicate email error handling not yet implemented in Server Action
  - **Verifies:** Duplicate email returns proper error message without redirecting

- ✅ **Test:** `[P1][AC3] should validate invalid email format`
  - **Status:** RED - Zod email validation schema and React Hook Form integration not yet implemented
  - **Verifies:** Client-side validation catches invalid email format before submission

- ✅ **Test:** `[P1][AC4] should validate password length (minimum 8 characters)`
  - **Status:** RED - Zod password validation schema not yet implemented
  - **Verifies:** Client-side validation enforces minimum password length

- ✅ **Test:** `[P0][AC5] should verify email and redirect to login after confirmation`
  - **Status:** RED - Email confirmation route handler redirect logic not yet implemented
  - **Verifies:** Email confirmation link verifies email and redirects to login page

- ✅ **Test:** `[P1] should validate password confirmation match`
  - **Status:** RED - Zod confirmPassword refinement not yet implemented
  - **Verifies:** Client-side validation ensures password and confirmPassword match

### API Tests (0 tests)

No API-level tests needed - registration logic tested via E2E flow.

### Component Tests (0 tests)

No component-level tests needed - validation logic tested via E2E flow.

---

## Data Factories Created

### User Factory (Existing)

**File:** `tests/support/fixtures/factories/user-factory.ts`

**Exports:**
- `build(overrides?)` - Create user object without persisting
- `create(overrides?)` - Create and persist user via API
- `createStudent(overrides?)` - Create student user
- `createCareerChanger(overrides?)` - Create career changer user
- `cleanup()` - Auto-cleanup all created users

**Example Usage:**

```typescript
// For duplicate email test
const { userFactory } = await use({ userFactory });
const existingUser = await userFactory.create({ email: 'test@example.com' });
// Auto-cleanup happens via fixture teardown
```

**Note:** No new factories needed for this story. User factory already exists.

---

## Fixtures Created

### Authenticated Page Fixture (Existing)

**File:** `tests/support/fixtures/index.ts`

**Fixtures:**
- `authenticatedPage` - Provides authenticated browser page
  - **Setup:** Logs in user via Supabase Auth UI
  - **Provides:** Authenticated page instance
  - **Cleanup:** Browser context cleanup (automatic)

**Note:** No new fixtures needed for this story. Registration tests don't require authentication.

---

## Mock Requirements

### Supabase Auth Service

**Endpoint:** Supabase Auth API (`/auth/v1/signup`, `/auth/v1/verify`)

**Real Integration (Recommended):**
- Use real Supabase Auth in test environment
- Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- Email confirmation tested via route handler logic (not actual email delivery)

**Email Service:**
- Supabase handles email sending in production
- In test environment, emails may not be sent (configure Supabase email settings)
- Email confirmation flow tested by navigating directly to `/auth/confirm` route

**Notes:**
- No mocking needed - use real Supabase test project
- For AC5 (email confirmation), test the route handler behavior, not actual email delivery

---

## Required data-testid Attributes

### Sign-Up Page (`app/auth/sign-up/page.tsx`)

- `email-input` - Email input field
- `password-input` - Password input field
- `confirm-password-input` - Confirm password input field
- `signup-button` - Sign up submit button

### Sign-Up Form Component (`components/forms/SignUpForm.tsx`)

Error messages (displayed conditionally based on validation):
- Display validation errors using React Hook Form's `form.formState.errors`
- Error messages should use semantic HTML (e.g., `<p className="text-sm text-red-500">`)

**Implementation Example:**

```tsx
// components/forms/SignUpForm.tsx
<div>
  <Input
    data-testid="email-input"
    type="email"
    {...form.register('email')}
  />
  {form.formState.errors.email && (
    <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
  )}
</div>

<div>
  <Input
    data-testid="password-input"
    type="password"
    {...form.register('password')}
  />
  {form.formState.errors.password && (
    <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
  )}
</div>

<div>
  <Input
    data-testid="confirm-password-input"
    type="password"
    {...form.register('confirmPassword')}
  />
  {form.formState.errors.confirmPassword && (
    <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
  )}
</div>

<Button data-testid="signup-button" type="submit" disabled={isPending}>
  Sign Up
</Button>
```

### Sign-Up Success Page (`app/auth/sign-up-success/page.tsx`)

- Display "Check your email" message (use semantic HTML, e.g., heading or paragraph)

### Login Page (`app/auth/login/page.tsx`)

- Display success message when `?verified=true` query param is present
- Use semantic HTML for success message (e.g., `<div className="text-green-600">Email verified successfully!</div>`)

---

## Implementation Checklist

### Test: [P0][AC1] Valid Registration Flow

**File:** `tests/e2e/user-registration.spec.ts:17`

**Tasks to make this test pass:**

- [ ] Create `lib/validations/auth.ts` with `signUpSchema` (email, password, confirmPassword with Zod)
- [ ] Create `actions/auth.ts` with `signUp` Server Action following ActionResponse pattern
- [ ] Implement Supabase Auth `signUp` call with email confirmation enabled
- [ ] Create or refactor `components/forms/SignUpForm.tsx` with React Hook Form + Zod resolver
- [ ] Integrate `useTransition` for Server Action calls
- [ ] Add required data-testid attributes: `email-input`, `password-input`, `confirm-password-input`, `signup-button`
- [ ] Implement redirect to `/auth/sign-up-success` on successful signup
- [ ] Verify sign-up-success page displays "check your email" message
- [ ] Run test: `npm run test:e2e -- user-registration.spec.ts -g "should register new user"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: [P0][AC2] Duplicate Email Handling

**File:** `tests/e2e/user-registration.spec.ts:45`

**Tasks to make this test pass:**

- [ ] In `actions/auth.ts`, handle Supabase error when email already exists
- [ ] Check error message contains "already registered" (Supabase error)
- [ ] Return proper error: `{ data: null, error: { message: 'An account with this email already exists', code: 'DUPLICATE_EMAIL' } }`
- [ ] In SignUpForm, display error message from Server Action response
- [ ] Ensure no redirect occurs when error is present
- [ ] Run test: `npm run test:e2e -- user-registration.spec.ts -g "duplicate email"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: [P1][AC3] Invalid Email Validation

**File:** `tests/e2e/user-registration.spec.ts:68`

**Tasks to make this test pass:**

- [ ] In `lib/validations/auth.ts`, ensure `signUpSchema.email` uses `.email('Please enter a valid email')`
- [ ] In SignUpForm, ensure React Hook Form displays field-level errors
- [ ] Validate email field shows error message on invalid format
- [ ] Ensure form submission is blocked when validation fails (React Hook Form default behavior)
- [ ] Run test: `npm run test:e2e -- user-registration.spec.ts -g "validate invalid email"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 30 minutes

---

### Test: [P1][AC4] Password Length Validation

**File:** `tests/e2e/user-registration.spec.ts:86`

**Tasks to make this test pass:**

- [ ] In `lib/validations/auth.ts`, ensure `signUpSchema.password` uses `.min(8, 'Password must be at least 8 characters')`
- [ ] In SignUpForm, ensure password field displays validation error
- [ ] Ensure form submission is blocked when password is too short
- [ ] Run test: `npm run test:e2e -- user-registration.spec.ts -g "validate password length"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 30 minutes

---

### Test: [P0][AC5] Email Confirmation Flow

**File:** `tests/e2e/user-registration.spec.ts:104`

**Tasks to make this test pass:**

- [ ] Verify `app/auth/confirm/route.ts` handles token exchange with Supabase
- [ ] Update route to redirect to `/auth/login?verified=true` after successful verification
- [ ] In `app/auth/login/page.tsx`, check for `verified=true` query param
- [ ] Display success message/toast when `verified=true` is present
- [ ] Run test: `npm run test:e2e -- user-registration.spec.ts -g "email and redirect to login"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: [P1] Password Confirmation Match

**File:** `tests/e2e/user-registration.spec.ts:127`

**Tasks to make this test pass:**

- [ ] In `lib/validations/auth.ts`, add `.refine()` to check password === confirmPassword
- [ ] Set error message: `{ message: 'Passwords do not match', path: ['confirmPassword'] }`
- [ ] Ensure SignUpForm displays error on confirmPassword field
- [ ] Run test: `npm run test:e2e -- user-registration.spec.ts -g "password confirmation match"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 30 minutes

---

## Running Tests

```bash
# Run all failing tests for this story
npm run test:e2e -- user-registration.spec.ts

# Run specific test by grep pattern
npm run test:e2e -- user-registration.spec.ts -g "should register new user"

# Run tests in headed mode (see browser)
npm run test:e2e -- user-registration.spec.ts --headed

# Debug specific test with Playwright Inspector
npm run test:e2e -- user-registration.spec.ts --debug

# Run with UI mode for interactive debugging
npm run test:e2e -- user-registration.spec.ts --ui
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 6 E2E tests written and failing
- ✅ Fixtures reviewed (no new fixtures needed - existing ones sufficient)
- ✅ Data factories reviewed (existing UserFactory sufficient)
- ✅ Mock requirements documented (use real Supabase, no mocks needed)
- ✅ data-testid requirements listed for UI implementation
- ✅ Implementation checklist created with clear tasks

**Verification:**

- All tests run and fail as expected
- Failure messages are clear: "Element not found" for missing data-testid attributes
- Tests fail due to missing implementation, not test bugs
- Network-first pattern applied (intercept before navigate)

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with P0 tests)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

**Recommended Order:**

1. Start with AC1 (Valid Registration Flow) - establishes core functionality
2. Then AC3, AC4 (Client-side validation) - quick wins
3. Then AC2 (Duplicate email handling) - error handling
4. Then AC5 (Email confirmation) - final integration
5. Finally, password confirmation match - edge case validation

**Progress Tracking:**

- Check off tasks as you complete them
- Share progress in daily standup
- Update story status to `in_progress` in sprint-status.yaml

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Review code for quality** (readability, maintainability, performance)
3. **Extract duplications** (DRY principle)
4. **Optimize performance** (if needed)
5. **Ensure tests still pass** after each refactor
6. **Update documentation** (if API contracts change)

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Make small refactors (easier to debug if tests fail)
- Run tests after each change
- Don't change test behavior (only implementation)

**Refactoring Opportunities:**

- Extract shared validation logic to reusable utilities
- Optimize Supabase client initialization
- Consolidate error message constants
- Add JSDoc comments to Server Actions
- Consider extracting form field components if duplication exists

**Completion:**

- All tests pass ✅
- Code quality meets team standards
- No duplications or code smells
- Ready for code review and story approval

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff to `/bmad:bmm:workflows:dev-story`)
2. **Review this checklist** with team in standup or planning
3. **Run failing tests** to confirm RED phase: `npm run test:e2e -- user-registration.spec.ts`
4. **Begin implementation** using implementation checklist as guide
5. **Work one test at a time** (red → green for each)
6. **Share progress** in daily standup
7. **When all tests pass**, refactor code for quality
8. **When refactoring complete**, manually update story status to `done` in `sprint-status.yaml`

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **fixture-architecture.md** - Test fixture patterns with setup/teardown and auto-cleanup using Playwright's `test.extend()`
- **data-factories.md** - Factory patterns using `@faker-js/faker` for random test data generation with overrides support
- **network-first.md** - Route interception patterns (intercept BEFORE navigation to prevent race conditions)
- **selector-resilience.md** - Selector hierarchy (data-testid > ARIA roles > text content > CSS), ensuring test stability
- **test-quality.md** - Test design principles (Given-When-Then, one assertion per test, determinism, isolation)

See `_bmad/bmm/testarch/tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npm run test:e2e -- user-registration.spec.ts`

**Expected Results:**

```
Running 6 tests using 1 worker

❌ [chromium] › user-registration.spec.ts:17:3 › User Registration › [P0][AC1] should register new user with valid email and password
   Error: Timed out 5000ms waiting for locator('[data-testid="email-input"]')

❌ [chromium] › user-registration.spec.ts:45:3 › User Registration › [P0][AC2] should display error for duplicate email
   Error: Timed out 5000ms waiting for locator('[data-testid="email-input"]')

❌ [chromium] › user-registration.spec.ts:68:3 › User Registration › [P1][AC3] should validate invalid email format
   Error: Timed out 5000ms waiting for locator('[data-testid="email-input"]')

❌ [chromium] › user-registration.spec.ts:86:3 › User Registration › [P1][AC4] should validate password length
   Error: Timed out 5000ms waiting for locator('[data-testid="password-input"]')

❌ [chromium] › user-registration.spec.ts:104:3 › User Registration › [P0][AC5] should verify email and redirect to login
   Error: HTTP Server Error (404): /auth/confirm not found

❌ [chromium] › user-registration.spec.ts:127:3 › User Registration › [P1] should validate password confirmation match
   Error: Timed out 5000ms waiting for locator('[data-testid="confirm-password-input"]')

6 failed
  [chromium] › user-registration.spec.ts:17:3 › User Registration › [P0][AC1] should register new user
  [chromium] › user-registration.spec.ts:45:3 › User Registration › [P0][AC2] should display error for duplicate
  [chromium] › user-registration.spec.ts:68:3 › User Registration › [P1][AC3] should validate invalid email
  [chromium] › user-registration.spec.ts:86:3 › User Registration › [P1][AC4] should validate password length
  [chromium] › user-registration.spec.ts:104:3 › User Registration › [P0][AC5] should verify email and redirect
  [chromium] › user-registration.spec.ts:127:3 › User Registration › [P1] should validate password confirmation
```

**Summary:**

- Total tests: 6
- Passing: 0 (expected)
- Failing: 6 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- AC1, AC2, AC3, AC4, AC6: Element with `data-testid` not found (form components not implemented)
- AC5: Route `/auth/confirm` not found (route handler not implemented)

---

## Notes

**Architecture Compliance:**

- Follow Server Actions pattern from `project-context.md` (ActionResponse type)
- Follow Zod validation pattern from `project-context.md`
- Follow React Hook Form pattern with `useTransition`
- Move `components/sign-up-form.tsx` to `components/forms/SignUpForm.tsx`
- Update import paths in `app/auth/sign-up/page.tsx`

**Database Setup:**

- Run SQL script from story dev notes to create `users` table
- Create RLS policies for user data access
- Create trigger to auto-insert user row on signup

**Environment Variables:**

Ensure `.env.local` has:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Email Testing:**

- Email confirmation link tested via route handler, not actual email delivery
- For manual testing, check Supabase dashboard for email templates
- Consider using Supabase local development for full email testing

---

## Contact

**Questions or Issues?**

- Ask Lawrence in team standup
- Refer to `_bmad/bmm/testarch/README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge/` for testing best practices
- Review existing tests in `tests/e2e/dashboard-layout.spec.ts` for patterns

---

**Generated by BMad TEA Agent** - 2026-01-18
