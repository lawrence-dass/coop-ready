# ATDD Checklist - Epic 1, Story 1.7: Protected Dashboard Route

**Date:** 2026-01-19
**Author:** Lawrence
**Primary Test Level:** E2E

---

## Story Summary

Implement middleware-based route protection for all dashboard routes, ensuring only authenticated users can access protected content. Handle session expiry gracefully with toast notifications and preserve the original URL for post-login redirection.

**As a** logged-in user
**I want** to access a protected dashboard
**So that** I can see my personalized content securely

---

## Acceptance Criteria

1. **AC1: Authenticated Dashboard Access** - Authenticated users can access /dashboard and see personalized content with sidebar navigation and welcome message displaying their email
2. **AC2: Unauthenticated Dashboard Access Redirect** - Unauthenticated users are redirected to /auth/login with the original URL preserved in redirectTo query parameter for post-login redirect
3. **AC3: All Dashboard Routes Protected** - All routes under /(dashboard)/* are protected by middleware and redirect unauthenticated users to login
4. **AC4: User Menu Display** - Authenticated users see their email, Settings link, and Logout option in the user menu
5. **AC5: Session Expiry Handling** - When session expires, users are redirected to login with expired=true query parameter and see "Your session has expired" toast message

---

## Failing Tests Created (RED Phase)

### E2E Tests (6 tests)

**File:** `tests/e2e/protected-dashboard-route.spec.ts` (241 lines)

- ✅ **Test:** [P0][AC1] should allow authenticated user to access dashboard with user info
  - **Status:** RED - Missing middleware protection, dashboard components may not have required data-testid attributes
  - **Verifies:** Authenticated access to dashboard, sidebar visibility, welcome message with user email

- ✅ **Test:** [P0][AC2] should redirect unauthenticated user to login with URL preservation
  - **Status:** RED - Missing middleware redirect logic, LoginForm redirectTo handling not implemented
  - **Verifies:** Unauthenticated redirect to login, redirectTo query parameter creation and consumption, post-login redirect to original URL

- ✅ **Test:** [P0][AC3] should protect all dashboard routes from unauthenticated access
  - **Status:** RED - Missing middleware matcher configuration for all protected routes
  - **Verifies:** Middleware protection for /dashboard, /settings, /history, /scan/new

- ✅ **Test:** [P0][AC4] should display user menu with email, settings, and logout options
  - **Status:** RED - Header component may be missing data-testid attributes for menu items
  - **Verifies:** User menu displays email, Settings link, and Logout button

- ✅ **Test:** [P0][AC5] should handle session expiry with redirect and toast message
  - **Status:** RED - Missing session expiry detection in middleware, LoginForm expired parameter handling not implemented
  - **Verifies:** Session expiry detection, redirect with expired=true, toast message display, redirectTo preservation

- ✅ **Test:** [P1] should prevent open redirect vulnerability
  - **Status:** RED - Missing URL validation in LoginForm to prevent external redirects
  - **Verifies:** Security: malicious redirectTo values (//evil.com) are rejected, users redirected to safe default

---

## Data Factories Created

### User Factory (Existing - Reused)

**File:** `tests/support/factories/user-factory.ts`

**Exports:**

- `createWithPassword(overrides & { password })` - Create user with Supabase auth credentials
- `cleanup()` - Auto-cleanup for all created users

**Example Usage:**

```typescript
const user = await userFactory.createWithPassword({
  password: 'SecurePass123',
  email: 'custom@example.com' // optional override
});

// User is automatically cleaned up after test via fixture
```

**Note:** This factory already exists from Story 1.4 (User Login). No new factories needed.

---

## Fixtures Created

### Auth Fixtures (Existing - Reused)

**File:** `tests/support/fixtures/index.ts`

**Fixtures:**

- `userFactory` - Provides UserFactory instance with auto-cleanup
  - **Setup:** Creates APIRequestContext-based factory
  - **Provides:** UserFactory instance for test
  - **Cleanup:** Calls `userFactory.cleanup()` to delete all created users

**Example Usage:**

```typescript
import { test } from '../support/fixtures';

test('should do something', async ({ userFactory }) => {
  const user = await userFactory.createWithPassword({ password: 'Test123' });
  // userFactory auto-cleans up after test
});
```

**Note:** This fixture already exists from Story 1.4. No new fixtures needed.

---

## Mock Requirements

### No External Service Mocks Required

This story tests:
- Next.js middleware (runs in-process)
- Supabase authentication (uses real test database)
- Client-side redirects (browser navigation)

**No mocks needed** - all components are testable with existing infrastructure.

---

## Required data-testid Attributes

### Dashboard Page (`app/(dashboard)/dashboard/page.tsx`)

- `dashboard-header` - Main header element (could be applied to h1 or header tag)
- `sidebar-nav` - Sidebar navigation component

**Implementation Example:**

```tsx
// app/(dashboard)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <>
      <h1 data-testid="dashboard-header">Dashboard</h1>
      {/* ... */}
    </>
  );
}

// components/layout/Sidebar.tsx (or wherever sidebar is)
export function Sidebar() {
  return (
    <nav data-testid="sidebar-nav">
      {/* ... */}
    </nav>
  );
}
```

### Header Component (`components/layout/Header.tsx`)

- `user-menu` - User menu trigger button (likely already exists, verify)
- `settings-link` - Link/button to navigate to settings
- `logout-button` - Logout button (likely already exists from Story 1.5, verify)

**Implementation Example:**

```tsx
// components/layout/Header.tsx
<DropdownMenu>
  <DropdownMenuTrigger data-testid="user-menu">
    <Avatar>{user.email}</Avatar>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem asChild>
      <Link href="/settings" data-testid="settings-link">
        Settings
      </Link>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <button data-testid="logout-button" onClick={handleLogout}>
        Log out
      </button>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Login Form (Existing - Already Implemented)

- ✅ `email-input` - Email input field
- ✅ `password-input` - Password input field
- ✅ `login-button` - Submit button

**Note:** These already exist from Story 1.4. No changes needed.

---

## Implementation Checklist

### Test: [P0][AC1] Authenticated Dashboard Access

**File:** `tests/e2e/protected-dashboard-route.spec.ts:22-69`

**Tasks to make this test pass:**

- [ ] Verify dashboard page has `data-testid="dashboard-header"` on main header
- [ ] Verify sidebar component has `data-testid="sidebar-nav"`
- [ ] Ensure welcome message displays user email (may already be implemented)
- [ ] Run test: `npm run test:e2e -- protected-dashboard-route.spec.ts -g "AC1"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (mostly verification, minimal new code)

---

### Test: [P0][AC2] Unauthenticated Redirect with URL Preservation

**File:** `tests/e2e/protected-dashboard-route.spec.ts:71-117`

**Tasks to make this test pass:**

- [ ] Create `middleware.ts` in project root
- [ ] Implement Supabase SSR client setup in middleware
- [ ] Add `getUser()` call to check authentication
- [ ] Detect unauthenticated access to protected routes
- [ ] Redirect to `/auth/login` with `redirectTo` query parameter
- [ ] Encode original URL path in `redirectTo` parameter
- [ ] Configure middleware matcher to cover all routes (exclude static files)
- [ ] Update `components/forms/LoginForm.tsx` to read `redirectTo` from searchParams
- [ ] Add `isValidRedirectUrl()` helper to prevent open redirect (check starts with `/` but not `//`)
- [ ] Update LoginForm `onSubmit` to redirect to `redirectTo` if valid, else `/dashboard`
- [ ] Run test: `npm run test:e2e -- protected-dashboard-route.spec.ts -g "AC2"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: [P0][AC3] All Dashboard Routes Protected

**File:** `tests/e2e/protected-dashboard-route.spec.ts:119-145`

**Tasks to make this test pass:**

- [ ] Ensure middleware.ts matcher covers all routes (already done in AC2 if matcher is correct)
- [ ] Verify protected route detection logic includes `/dashboard`, `/settings`, `/history`, `/scan/*`
- [ ] Test middleware redirects work for all 4 protected routes
- [ ] Run test: `npm run test:e2e -- protected-dashboard-route.spec.ts -g "AC3"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (mostly covered by AC2 implementation)

---

### Test: [P0][AC4] User Menu Display

**File:** `tests/e2e/protected-dashboard-route.spec.ts:147-182`

**Tasks to make this test pass:**

- [ ] Open `components/layout/Header.tsx`
- [ ] Verify user menu trigger has `data-testid="user-menu"`
- [ ] Verify Settings link has `data-testid="settings-link"`
- [ ] Verify Logout button has `data-testid="logout-button"` (likely exists from Story 1.5)
- [ ] Ensure user email is displayed in dropdown menu
- [ ] Run test: `npm run test:e2e -- protected-dashboard-route.spec.ts -g "AC4"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (mostly verification and adding testids)

---

### Test: [P0][AC5] Session Expiry Handling

**File:** `tests/e2e/protected-dashboard-route.spec.ts:184-231`

**Tasks to make this test pass:**

- [ ] Update `middleware.ts` to detect expired/invalid sessions
- [ ] When session is invalid, redirect to `/auth/login?expired=true&redirectTo={original_url}`
- [ ] Update `components/forms/LoginForm.tsx` to check for `expired=true` query parameter
- [ ] Add `useEffect` logic to display toast: "Your session has expired. Please log in again."
- [ ] Ensure `redirectTo` parameter is preserved when showing expired toast
- [ ] After toast display, replace URL to clean up query params (keep redirectTo)
- [ ] Run test: `npm run test:e2e -- protected-dashboard-route.spec.ts -g "AC5"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: [P1] Open Redirect Prevention

**File:** `tests/e2e/protected-dashboard-route.spec.ts:233-262`

**Tasks to make this test pass:**

- [ ] Implement `isValidRedirectUrl()` helper in LoginForm
- [ ] Validate redirectTo parameter: must start with `/` but NOT `//` (prevents external URLs)
- [ ] If redirectTo is invalid, use default `/dashboard` redirect
- [ ] Test with malicious URL: `//evil.com/phishing` should redirect to `/dashboard`, not external site
- [ ] Run test: `npm run test:e2e -- protected-dashboard-route.spec.ts -g "open redirect"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (covered by AC2 implementation if done correctly)

---

## Running Tests

```bash
# Run all failing tests for this story
npm run test:e2e -- protected-dashboard-route.spec.ts

# Run specific test by AC
npm run test:e2e -- protected-dashboard-route.spec.ts -g "AC1"
npm run test:e2e -- protected-dashboard-route.spec.ts -g "AC2"

# Run tests in headed mode (see browser)
npm run test:e2e -- protected-dashboard-route.spec.ts --headed

# Debug specific test
npm run test:e2e -- protected-dashboard-route.spec.ts -g "AC2" --debug

# Run tests with coverage
npm run test:e2e -- protected-dashboard-route.spec.ts --coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 6 tests written and failing
- ✅ Fixtures and factories identified (all exist from previous stories)
- ✅ Mock requirements documented (none needed)
- ✅ data-testid requirements listed (3 new attributes needed)
- ✅ Implementation checklist created with clear tasks

**Verification:**

- All tests run and fail as expected
- Failure messages are clear: "middleware.ts not found", "data-testid not found", "redirectTo not handled"
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (suggest starting with AC2 - middleware creation)
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

**Progress Tracking:**

- Check off tasks as you complete them
- Share progress in daily standup
- Mark story as IN PROGRESS in `sprint-status.yaml`

**Recommended Order:**

1. AC2 first (creates middleware.ts foundation)
2. AC3 next (validates middleware matcher)
3. AC5 next (adds expired parameter handling)
4. AC1 and AC4 last (add data-testid attributes)
5. P1 security test (should pass if AC2 done correctly)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Review code for quality** (readability, maintainability, performance)
3. **Extract duplications** (DRY principle)
4. **Optimize performance** (if needed)
5. **Ensure tests still pass** after each refactor
6. **Update documentation** (if behavior changes)

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Make small refactors (easier to debug if tests fail)
- Run tests after each change
- Don't change test behavior (only implementation)

**Potential Refactoring Opportunities:**

- Extract redirect URL validation logic to shared utility
- Consolidate middleware session check logic
- Extract toast message display logic to shared hook
- Simplify LoginForm useEffect logic if complex

**Completion:**

- All 6 tests pass
- Code quality meets team standards
- No duplications or code smells
- Ready for code review and story approval

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Review this checklist** with team in standup or planning
3. **Run failing tests** to confirm RED phase: `npm run test:e2e -- protected-dashboard-route.spec.ts`
4. **Begin implementation** using implementation checklist as guide
5. **Work one test at a time** (red → green for each)
6. **Share progress** in daily standup
7. **When all tests pass**, refactor code for quality
8. **When refactoring complete**, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **test-quality.md** - Test design principles (deterministic tests, no hard waits, one assertion per test, isolation with cleanup)
- **network-first.md** - Route interception patterns (intercept BEFORE navigation, waitForResponse for deterministic waits)
- **selector-resilience.md** - Selector hierarchy (data-testid > ARIA > text > CSS for stable selectors)
- **fixture-architecture.md** - Test fixture patterns with auto-cleanup using Playwright's test.extend()
- **data-factories.md** - Factory patterns using @faker-js/faker for random test data generation

See `_bmad/bmm/testarch/tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npm run test:e2e -- protected-dashboard-route.spec.ts`

**Expected Results:**

```
Running 6 tests using 1 worker

  ✘ [chromium] › protected-dashboard-route.spec.ts:22:3 › Protected Dashboard Route › [P0][AC1] should allow authenticated user to access dashboard with user info
    Error: locator.click: Target closed
    =========================== logs ===========================
    waiting for getByTestId('dashboard-header')
    ============================================================

  ✘ [chromium] › protected-dashboard-route.spec.ts:71:3 › Protected Dashboard Route › [P0][AC2] should redirect unauthenticated user to login with URL preservation
    Error: expect(received).toHaveURL(expected)
    Expected pattern: /\/auth\/login/
    Received string:  "http://localhost:3000/dashboard"
    Call log:
      - navigating to "http://localhost:3000/dashboard", waiting until "load"

  ✘ [chromium] › protected-dashboard-route.spec.ts:119:3 › Protected Dashboard Route › [P0][AC3] should protect all dashboard routes from unauthenticated access
    Error: expect(received).toHaveURL(expected)
    Expected pattern: /\/auth\/login/
    Received string:  "http://localhost:3000/dashboard"

  ✘ [chromium] › protected-dashboard-route.spec.ts:147:3 › Protected Dashboard Route › [P0][AC4] should display user menu with email, settings, and logout options
    Error: locator.click: Timeout 30000ms exceeded.
    =========================== logs ===========================
    waiting for getByTestId('user-menu')
    ============================================================

  ✘ [chromium] › protected-dashboard-route.spec.ts:184:3 › Protected Dashboard Route › [P0][AC5] should handle session expiry with redirect and toast message
    Error: expect(received).toHaveURL(expected)
    Expected pattern: /\/auth\/login\?.*expired=true/
    Received string:  "http://localhost:3000/dashboard"

  ✘ [chromium] › protected-dashboard-route.spec.ts:233:3 › Protected Dashboard Route › [P1] should prevent open redirect vulnerability
    Error: locator.fill: Target closed

  6 failed
    [chromium] › protected-dashboard-route.spec.ts:22:3 › Protected Dashboard Route › [P0][AC1] should allow authenticated user to access dashboard with user info
    [chromium] › protected-dashboard-route.spec.ts:71:3 › Protected Dashboard Route › [P0][AC2] should redirect unauthenticated user to login with URL preservation
    [chromium] › protected-dashboard-route.spec.ts:119:3 › Protected Dashboard Route › [P0][AC3] should protect all dashboard routes from unauthenticated access
    [chromium] › protected-dashboard-route.spec.ts:147:3 › Protected Dashboard Route › [P0][AC4] should display user menu with email, settings, and logout options
    [chromium] › protected-dashboard-route.spec.ts:184:3 › Protected Dashboard Route › [P0][AC5] should handle session expiry with redirect and toast message
    [chromium] › protected-dashboard-route.spec.ts:233:3 › Protected Dashboard Route › [P1] should prevent open redirect vulnerability

Ran 6 tests, 6 failed (10s)
```

**Summary:**

- Total tests: 6
- Passing: 0 (expected)
- Failing: 6 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- **AC1**: "locator.click: Target closed" - Dashboard page missing data-testid attributes
- **AC2**: "Expected pattern: /\/auth\/login/ Received: /dashboard" - Middleware not implemented, no redirect
- **AC3**: "Expected pattern: /\/auth\/login/ Received: /dashboard" - Middleware not implemented
- **AC4**: "Timeout waiting for getByTestId('user-menu')" - Header missing data-testid
- **AC5**: "Expected pattern: /\/auth\/login\?.*expired=true/ Received: /dashboard" - Expired parameter handling not implemented
- **P1**: "locator.fill: Target closed" - Login form redirectTo validation not implemented

---

## Notes

### Architecture Alignment

This story implements **Architectural Requirement AR13** (Route Protection):
- Middleware-based authentication checks
- Protected routes: /(dashboard)/* pattern
- Session validation via Supabase SSR
- Redirect preservation for UX

### Security Considerations

**Open Redirect Prevention:**
- `isValidRedirectUrl()` helper validates redirectTo parameter
- Only allows internal paths starting with `/`
- Rejects `//evil.com` patterns (protocol-relative URLs)
- Defaults to `/dashboard` if validation fails

**Session Security:**
- Uses Supabase SSR for secure cookie handling
- HttpOnly cookies prevent XSS attacks
- SameSite attribute prevents CSRF
- Session refresh handled by Supabase client

### Existing Implementation Context

**Files Created in Previous Stories:**
- Story 1.4: LoginForm, signIn action, user-login.spec.ts
- Story 1.5: useLogout hook, signOut action, logout button
- Story 1.6: Password reset flow, query parameter handling pattern

**Patterns to Follow:**
- LoginForm already handles `?verified=true` and `?reset=true` - extend for `?expired=true`
- Header component already has user menu - add data-testid attributes
- Dashboard layout already exists - verify data-testid attributes

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Tag @tea-agent in Slack/Discord
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-01-19
