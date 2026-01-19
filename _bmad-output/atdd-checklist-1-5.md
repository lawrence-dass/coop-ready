# ATDD Checklist - Epic 1, Story 1.5: User Logout

**Date:** 2026-01-18
**Author:** Lawrence
**Primary Test Level:** E2E

---

## Story Summary

Users need to securely log out of their account, ensuring their session is invalidated and they cannot access protected content after logout, even via browser back button.

**As a** logged-in user
**I want** to log out of my account
**So that** my session is securely ended

---

## Acceptance Criteria

1. **AC1: Logout from User Menu**
   - GIVEN I am logged in and on any protected page
   - WHEN I click the "Log out" button in the user menu
   - THEN my session is invalidated AND the session cookie is cleared AND I am redirected to the login page

2. **AC2: Protected Route Access After Logout**
   - GIVEN I have logged out
   - WHEN I try to access a protected route directly via URL
   - THEN I am redirected to the login page AND I cannot access protected content

3. **AC3: Browser Back Button Protection**
   - GIVEN I have logged out
   - WHEN I use the browser back button
   - THEN I cannot access cached protected pages AND I am redirected to login if I try

---

## Failing Tests Created (RED Phase)

### E2E Tests (5 tests)

**File:** `tests/e2e/user-logout.spec.ts` (181 lines)

- ✅ **Test:** [P0][AC1] should log out from user menu and redirect to login page
  - **Status:** RED - Missing `signOut` Server Action and Header logout implementation
  - **Verifies:** User can logout from header menu, session is invalidated, redirect to login

- ✅ **Test:** [P0][AC2] should prevent access to protected routes after logout
  - **Status:** RED - Missing logout implementation (depends on AC1)
  - **Verifies:** Protected routes redirect to login after logout, dashboard/settings inaccessible

- ✅ **Test:** [P0][AC3] should prevent cached page access via browser back button
  - **Status:** RED - Missing cache control headers and logout implementation
  - **Verifies:** Browser back button after logout does not show cached protected content

- ✅ **Test:** [P1] should handle logout errors gracefully
  - **Status:** RED - Missing error handling in logout flow
  - **Verifies:** Network failures during logout show error toast, user remains authenticated

- ✅ **Test:** [P1] should show loading state during logout
  - **Status:** RED - Missing loading state (useTransition) in Header component
  - **Verifies:** Logout button shows "Logging out..." text during async operation

---

## Data Factories (Reused)

### User Factory (Existing)

**File:** `tests/support/fixtures/factories/user-factory.ts`

**Exports:**
- `createWithPassword(params)` - Create user with Supabase Auth credentials (used in all logout tests)
- Auto-cleanup via fixture teardown

**Example Usage:**

```typescript
const testPassword = 'SecurePass123';
const user = await userFactory.createWithPassword({ password: testPassword });
// User is created in Supabase Auth and will be cleaned up automatically
```

---

## Fixtures (Reused)

### Existing Fixtures

**File:** `tests/support/fixtures/index.ts`

**Fixtures:**
- `userFactory` - Creates test users with auto-cleanup
  - **Setup:** Initializes UserFactory with request context
  - **Provides:** Factory instance for creating users
  - **Cleanup:** Deletes all created users

**Example Usage:**

```typescript
import { test } from '../support/fixtures';

test('should logout user', async ({ page, userFactory }) => {
  const user = await userFactory.createWithPassword({ password: 'test123' });
  // userFactory auto-cleans up all created users
});
```

---

## Mock Requirements

No new mocks required. Logout uses Supabase Auth's native signOut API (same infrastructure as login from Story 1.4).

**Network Interception (for error test only):**

One test simulates logout failure by intercepting the Supabase logout endpoint:

```typescript
// In test: [P1] should handle logout errors gracefully
await page.route('**/auth/v1/logout', (route) => {
  route.abort('failed');
});
```

---

## Required data-testid Attributes

### Header Component (components/layout/Header.tsx)

- `user-menu-button` - Button to open user dropdown menu
- `logout-button` - Logout button in dropdown menu

**Implementation Example:**

```tsx
{/* User menu dropdown */}
<DropdownMenuTrigger asChild>
  <Button data-testid="user-menu-button" variant="ghost">
    {userName}
  </Button>
</DropdownMenuTrigger>

<DropdownMenuContent>
  <DropdownMenuItem
    data-testid="logout-button"
    onClick={handleLogout}
    disabled={isPending}
  >
    {isPending ? 'Logging out...' : 'Logout'}
  </DropdownMenuItem>
</DropdownMenuContent>
```

### Dashboard Layout (app/(dashboard)/layout.tsx)

- `dashboard-header` - Already exists (used in logout tests for verification)

---

## Implementation Checklist

### PREREQUISITE: Task 0 - Create Test API Infrastructure ⚠️

**Priority:** CRITICAL - Must complete before implementing logout

**Tasks to enable tests to run:**

- [ ] **Task 0.1:** Create test API endpoint for creating users with auth
  - Create file: `app/api/test/users/with-auth/route.ts`
  - Accept POST with: `{ email, name, password, experienceLevel, targetRole }`
  - Use Supabase Admin API: `auth.admin.createUser({ email, password, email_confirm: true })`
  - Create user profile in database
  - Return user object with id, email, name, etc.

- [ ] **Task 0.2:** Create test API endpoint for deleting users
  - Create file: `app/api/test/users/[id]/route.ts`
  - Accept DELETE request with user ID in URL params
  - Use Supabase Admin API: `auth.admin.deleteUser(id)`
  - Delete user profile from database
  - Return success response

- [ ] **Task 0.3:** Verify test infrastructure works
  - Run existing login test: `npx playwright test user-login.spec.ts --grep "AC1"`
  - Should pass (creates user, logs in, cleans up)
  - If passes, test infrastructure is ready

**Estimated Effort:** 1-2 hours

**Note:** These endpoints should only be accessible in test/dev environments. Add environment check:
```typescript
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
}
```

---

### Test: [P0][AC1] Logout from user menu

**File:** `tests/e2e/user-logout.spec.ts:20-55`

**Tasks to make this test pass:**

- [ ] **Task 1.1:** Create `signOut` Server Action in `actions/auth.ts`
  - Follow ActionResponse pattern from Stories 1.3-1.4
  - Call `supabase.auth.signOut()`
  - Return `{ data: null, error: null }` on success
  - Return error object on failure

- [ ] **Task 1.2:** Refactor `handleLogout` in `components/layout/Header.tsx`
  - Import `signOut` from `@/actions/auth`
  - Use `useTransition` for pending state (import from 'react')
  - Call `signOut()` in `startTransition` callback
  - Handle errors with `toast.error()` (sonner)
  - Use `router.refresh()` after successful logout
  - Use `router.push('/auth/login')` to redirect

- [ ] **Task 1.3:** Add required data-testid attributes
  - Add `data-testid="user-menu-button"` to user menu trigger
  - Add `data-testid="logout-button"` to logout menu item

- [ ] **Task 1.4:** Implement loading state
  - Show "Logging out..." when `isPending` is true
  - Disable button during logout (`disabled={isPending}`)

- [ ] Run test: `npx playwright test user-logout.spec.ts --grep "AC1"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: [P0][AC2] Prevent protected route access after logout

**File:** `tests/e2e/user-logout.spec.ts:57-88`

**Tasks to make this test pass:**

- [ ] **Task 2.1:** Verify middleware redirects unauthenticated users
  - Check `middleware.ts` redirects to `/auth/login` when no session exists
  - Should already work from Story 1.4 (authentication setup)

- [ ] **Task 2.2:** Ensure logout invalidates session server-side
  - Verify `signOut` action calls `supabase.auth.signOut()` (from Task 1.1)
  - Session should be cleared from Supabase

- [ ] **Task 2.3:** Test protected routes after logout implementation
  - `/dashboard` should redirect to `/auth/login`
  - `/settings` should redirect to `/auth/login`

- [ ] Run test: `npx playwright test user-logout.spec.ts --grep "AC2"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour (mostly verification, minimal new code)

---

### Test: [P0][AC3] Browser back button protection

**File:** `tests/e2e/user-logout.spec.ts:90-120`

**Tasks to make this test pass:**

- [ ] **Task 3.1:** Add cache control to dashboard layout
  - Open `app/(dashboard)/layout.tsx`
  - Add `export const dynamic = 'force-dynamic'` at top of file
  - This prevents Next.js from caching protected pages

- [ ] **Task 3.2:** Verify `router.refresh()` clears client cache
  - Ensure `router.refresh()` is called in `handleLogout` (from Task 1.2)
  - This clears Next.js client-side router cache

- [ ] **Task 3.3:** Test browser back button behavior
  - After logout, press back button
  - Should not show cached dashboard
  - Should stay on or redirect to login page

- [ ] Run test: `npx playwright test user-logout.spec.ts --grep "AC3"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: [P1] Handle logout errors gracefully

**File:** `tests/e2e/user-logout.spec.ts:122-154`

**Tasks to make this test pass:**

- [ ] **Task 4.1:** Implement error handling in `handleLogout`
  - Check if `error` is returned from `signOut()`
  - Call `toast.error(error.message)` on error
  - Do NOT redirect to login if error occurs
  - Keep user authenticated (don't clear session on client error)

- [ ] **Task 4.2:** Update `signOut` Server Action error messages
  - Return user-friendly messages: "Failed to sign out" or "Something went wrong"
  - Log errors to console for debugging

- [ ] Run test: `npx playwright test user-logout.spec.ts --grep "handle logout errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: [P1] Show loading state during logout

**File:** `tests/e2e/user-logout.spec.ts:156-181`

**Tasks to make this test pass:**

- [ ] **Task 5.1:** Verify `useTransition` implementation from Task 1.2
  - `isPending` state should be available
  - Button should show "Logging out..." when `isPending` is true

- [ ] **Task 5.2:** Test loading state behavior
  - Click logout button
  - Verify button text changes to "Logging out..."
  - Verify button is disabled during logout

- [ ] Run test: `npx playwright test user-logout.spec.ts --grep "loading state"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (verification only, implemented in Task 1.2)

---

## Running Tests

```bash
# Run all failing tests for this story
npx playwright test user-logout.spec.ts

# Run specific test by AC
npx playwright test user-logout.spec.ts --grep "AC1"
npx playwright test user-logout.spec.ts --grep "AC2"
npx playwright test user-logout.spec.ts --grep "AC3"

# Run tests in headed mode (see browser)
npx playwright test user-logout.spec.ts --headed

# Debug specific test
npx playwright test user-logout.spec.ts --grep "AC1" --debug

# Run tests with coverage
npx playwright test user-logout.spec.ts --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Fixtures and factories reviewed (reusing existing)
- ✅ No new mocks required (Supabase Auth handles logout)
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- All 5 tests run and fail as expected (15 total across chromium/firefox/webkit)
- Failure reason: Missing test API infrastructure + missing logout implementation
- Tests fail due to missing implementation, not test bugs

**⚠️ CRITICAL: Test Infrastructure Prerequisite**

Tests currently fail at setup because test API endpoints don't exist:

```
Error: Failed to create user with auth: 404
Missing endpoints:
  - POST /api/test/users/with-auth (create user with password)
  - DELETE /api/test/users/:id (cleanup user)
```

**DEV must create test APIs BEFORE implementing logout:**

1. Create `app/api/test/users/with-auth/route.ts`
   - Accept: `{ email, name, password, experienceLevel, targetRole }`
   - Create user in Supabase Auth with `auth.admin.createUser()`
   - Create profile in database
   - Return user object

2. Create `app/api/test/users/[id]/route.ts`
   - Accept: DELETE request with user ID
   - Delete user from Supabase Auth with `auth.admin.deleteUser()`
   - Delete profile from database
   - Return success

See Story 1.4 test artifacts for similar implementation (UserFactory depends on these).

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

**PREREQUISITE: Create Test API Infrastructure (1-2 hours)**

0. **Create test API endpoints** (required for ALL tests to run)
   - Create `app/api/test/users/with-auth/route.ts`
   - Create `app/api/test/users/[id]/route.ts`
   - Use Supabase Admin API for user management
   - Verify UserFactory works: `npx playwright test user-login.spec.ts --grep "AC1"` (existing test)
   - ✅ Existing login test passes (infrastructure works)

**THEN: Implement Logout Feature**

1. **Start with Test AC1** (highest priority, foundation for others)
   - Create `signOut` Server Action
   - Refactor Header logout implementation
   - Add data-testid attributes
   - Run test: `npx playwright test user-logout.spec.ts --grep "AC1"`
   - ✅ Verify test passes

2. **Move to Test AC2** (verify middleware works post-logout)
   - Verify middleware redirects work
   - Test protected routes
   - Run test: `npx playwright test user-logout.spec.ts --grep "AC2"`
   - ✅ Verify test passes

3. **Continue to Test AC3** (cache control)
   - Add cache control headers
   - Test back button behavior
   - Run test: `npx playwright test user-logout.spec.ts --grep "AC3"`
   - ✅ Verify test passes

4. **Finish with P1 tests** (error handling and loading state)
   - Implement error handling
   - Verify loading state
   - Run remaining tests
   - ✅ All tests pass

**Key Principles:**

- One test at a time (AC1 → AC2 → AC3 → P1 tests)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

**Progress Tracking:**

- Check off tasks as you complete them
- Update story status to 'in-progress' in `sprint-status.yaml`
- Share progress in daily standup

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (5/5 tests green)
2. **Review code for quality**
   - Is `signOut` Server Action clean and simple?
   - Is Header logout logic readable?
   - Are error messages user-friendly?

3. **Extract duplications** (if any)
   - Check if logout logic could be reused elsewhere
   - Ensure DRY principles

4. **Optimize performance** (if needed)
   - Logout should be fast (< 1 second)
   - No unnecessary re-renders

5. **Ensure tests still pass** after each refactor
6. **Update documentation** if needed

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Make small refactors (easier to debug if tests fail)
- Run tests after each change
- Don't change test behavior (only implementation)

**Completion:**

- All 5 tests pass ✅
- Code quality meets team standards
- No duplications or code smells
- Ready for code review
- Story marked as 'done' in `sprint-status.yaml`

---

## Next Steps

1. **Run failing tests** to confirm RED phase: `npx playwright test user-logout.spec.ts`
   - Expected: 5 tests failing at setup
   - Failure reason: Missing test API infrastructure (404 errors)

2. **PREREQUISITE: Create test API infrastructure** (1-2 hours)
   - Task 0: Create test API endpoints (see Implementation Checklist)
   - Verify with existing test: `npx playwright test user-login.spec.ts --grep "AC1"`
   - ✅ Once test APIs work, proceed to logout implementation

3. **Begin logout implementation** following checklist order:
   - Task 1: Create `signOut` Server Action (AC1)
   - Task 2: Refactor Header logout (AC1)
   - Task 3: Add cache control (AC3)
   - Task 4: Error handling (P1)
   - Task 5: Verify loading state (P1)

3. **Work one test at a time** (red → green for each AC)

4. **Share progress** in daily standup

5. **When all tests pass**, refactor code for quality

6. **When refactoring complete**, mark story as 'done' in `sprint-status.yaml`

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **fixture-architecture.md** - Test fixture patterns with auto-cleanup using Playwright's `test.extend()`
- **data-factories.md** - Factory patterns using `@faker-js/faker` for random test data (reused UserFactory)
- **test-quality.md** - Test design principles (Given-When-Then, atomic tests, determinism)
- **selector-resilience.md** - Selector hierarchy (data-testid > ARIA > text > CSS)
- **network-first.md** - Route interception patterns (network response waiting before assertions)

See `_bmad/bmm/testarch/tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test user-logout.spec.ts --project=chromium`

**Actual Results:**

```
Running 5 tests using 5 workers

  ✘ [chromium] › user-logout.spec.ts:19:7 › User Logout › [P0][AC1] should log out from user menu
    Error: Failed to create user with auth: 404
    at UserFactory.createWithPassword

  ✘ [chromium] › user-logout.spec.ts:59:7 › User Logout › [P0][AC2] should prevent access to protected routes
    Error: Failed to create user with auth: 404
    at UserFactory.createWithPassword

  ✘ [chromium] › user-logout.spec.ts:97:7 › User Logout › [P0][AC3] should prevent cached page access
    Error: Failed to create user with auth: 404
    at UserFactory.createWithPassword

  ✘ [chromium] › user-logout.spec.ts:133:7 › User Logout › [P1] should handle logout errors gracefully
    Error: Failed to create user with auth: 404
    at UserFactory.createWithPassword

  ✘ [chromium] › user-logout.spec.ts:175:7 › User Logout › [P1] should show loading state
    Error: Failed to create user with auth: 404
    at UserFactory.createWithPassword
```

**Summary:**

- Total tests: 5 (15 across all browsers)
- Passing: 0 (expected)
- Failing: 5 (expected)
- Status: ✅ RED phase verified

**Failure Analysis:**

All tests fail at setup stage (before testing logout logic) due to missing test API infrastructure:

- Missing endpoint: `POST /api/test/users/with-auth` (returns 404)
- Missing endpoint: `DELETE /api/test/users/:id` (not yet called, but also missing)

**Expected Failure Progression:**

1. **Current (Setup):** Tests fail creating test users (404 errors) ← WE ARE HERE
2. **After Task 0:** Tests run but fail on logout logic (missing implementation)
3. **After Task 1-5:** All tests pass (GREEN phase)

**Next Action:** Complete Task 0 (create test API infrastructure) before implementing logout

---

## Notes

- **Reuses existing infrastructure** from Stories 1.3 (Registration) and 1.4 (Login)
  - No new factories needed
  - No new fixtures needed
  - Same Supabase Auth patterns

- **Logout implementation is Server Action based** (follows established pattern from Story 1.4)
  - Consistent with `signIn` and `signUp` actions
  - Uses ActionResponse type
  - Integrates with existing error handling (sonner toasts)

- **Cache control is critical** for AC3 (browser back button protection)
  - `dynamic = 'force-dynamic'` prevents static caching
  - `router.refresh()` clears client router cache

- **Test priorities:**
  - P0 tests (AC1-AC3): Must pass for story completion
  - P1 tests: Should pass but can be deferred if time-constrained

- **All tests use data-testid selectors** for stability (established pattern)

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Tag @tea or @dev in Slack/Discord
- Refer to `_bmad/bmm/workflows/testarch/atdd/instructions.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent (Murat)** - 2026-01-18
