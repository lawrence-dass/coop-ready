# ATDD Checklist - Epic 2, Story 2.1: Onboarding Flow - Experience Level & Target Role

**Date:** 2026-01-19
**Author:** Lawrence
**Primary Test Level:** E2E (End-to-End)

---

## Story Summary

New users complete a two-step onboarding flow to personalize their resume analysis. The flow captures experience level (Student/Recent Graduate or Career Changer) and target role selection, creating a user profile that enables AI-powered personalization.

**As a** new user
**I want** to select my experience level and target role during onboarding
**So that** the AI analysis is personalized to my situation

---

## Acceptance Criteria

1. **AC1: First-Time Login Redirect to Onboarding**
   - New users are redirected to `/onboarding` after first login
   - Protected routes are blocked until onboarding is complete

2. **AC2: Experience Level Selection**
   - Two options displayed: "Student/Recent Graduate" and "Career Changer"
   - Each option includes a description
   - Selection is required to proceed

3. **AC3: Target Role Selection**
   - List of common tech roles available (Software Engineer, Data Analyst, etc.)
   - Can select one standard role OR type a custom role
   - Custom role input appears when "Other" is selected

4. **AC4: Profile Save and Redirect**
   - Selections saved to `user_profiles` table
   - User redirected to dashboard after completion
   - Welcome message acknowledges selections

5. **AC5: Skip Onboarding for Existing Users**
   - Users with `onboarding_completed: true` skip to dashboard
   - Cannot access `/onboarding` route once completed

---

## Failing Tests Created (RED Phase)

### E2E Tests (14 tests)

**File:** `tests/e2e/onboarding-flow.spec.ts` (465 lines)

#### AC1: First-Time Login Redirect to Onboarding

- ✅ **Test:** [P0][AC1] should redirect new user to onboarding after first login
  - **Status:** RED - Missing `/onboarding` route and redirect logic in proxy.ts
  - **Verifies:** New users land on onboarding page, not dashboard

- ✅ **Test:** [P0][AC1] should block access to protected routes until onboarding complete
  - **Status:** RED - Missing onboarding completion check in route protection
  - **Verifies:** Dashboard, settings, history, scan routes redirect to onboarding

#### AC2: Experience Level Selection

- ✅ **Test:** [P0][AC2] should display experience level selection with two options
  - **Status:** RED - Missing onboarding page component
  - **Verifies:** Both experience level options visible with descriptions

- ✅ **Test:** [P0][AC2] should require experience level selection to proceed
  - **Status:** RED - Missing form validation
  - **Verifies:** Next button disabled when no selection made

- ✅ **Test:** [P0][AC2] should enable next button when experience level is selected
  - **Status:** RED - Missing step navigation logic
  - **Verifies:** Next button becomes enabled after selection

#### AC3: Target Role Selection

- ✅ **Test:** [P0][AC3] should display target role selection after experience level
  - **Status:** RED - Missing multi-step form implementation
  - **Verifies:** Role selection appears on step 2 with all standard roles

- ✅ **Test:** [P0][AC3] should allow selecting a standard target role
  - **Status:** RED - Missing role selection component
  - **Verifies:** Standard roles selectable, complete button enabled

- ✅ **Test:** [P0][AC3] should show custom role input when "Other" is selected
  - **Status:** RED - Missing conditional custom role input
  - **Verifies:** Custom input appears and auto-focuses when "Other" selected

#### AC4: Profile Save and Redirect

- ✅ **Test:** [P0][AC4] should save profile and redirect to dashboard on completion
  - **Status:** RED - Missing `completeOnboarding` server action and API endpoint
  - **Verifies:** Profile saved via API call, redirect to dashboard with personalized welcome

- ✅ **Test:** [P0][AC4] should display success toast after completing onboarding
  - **Status:** RED - Missing success toast notification
  - **Verifies:** User sees confirmation message

#### AC5: Skip Onboarding for Existing Users

- ✅ **Test:** [P0][AC5] should skip onboarding for users with completed profiles
  - **Status:** RED - Missing profile check in proxy.ts middleware
  - **Verifies:** Existing users go directly to dashboard

- ✅ **Test:** [P0][AC5] should prevent completed users from accessing /onboarding
  - **Status:** RED - Missing completed user redirect logic
  - **Verifies:** Accessing `/onboarding` redirects completed users to dashboard

#### Additional Edge Cases (P1)

- ✅ **Test:** [P1] should allow back navigation between onboarding steps
  - **Status:** RED - Missing back button functionality
  - **Verifies:** Back button returns to previous step, preserves selection

- ✅ **Test:** [P1] should validate custom role is not empty when Other is selected
  - **Status:** RED - Missing custom role validation
  - **Verifies:** Complete button disabled until custom role entered

---

## Data Factories Created

### Profile Factory

**File:** `tests/support/fixtures/factories/profile-factory.ts`

**Exports:**

- `build(params)` - Create profile object without persisting
- `create(params)` - Create and persist profile via API
- `createCompleted(params)` - Create profile with `onboardingCompleted: true`
- `createIncomplete(params)` - Create profile with `onboardingCompleted: false`
- `createStudent(params)` - Create student experience level profile
- `createCareerChanger(params)` - Create career changer profile
- `createWithCustomRole(params)` - Create profile with custom role
- `cleanup()` - Auto-cleanup all created profiles

**Example Usage:**

```typescript
// In test with profileFactory fixture
const user = await userFactory.createWithPassword({ password: 'test123' });
const profile = await profileFactory.createCompleted({
  userId: user.id,
  experienceLevel: 'student',
  targetRole: 'Software Engineer',
});

// Cleanup happens automatically in fixture teardown
```

---

## Fixtures Created

### Profile Factory Fixture

**File:** `tests/support/fixtures/index.ts` (updated)

**Fixtures:**

- `profileFactory` - ProfileFactory instance with auto-cleanup
  - **Setup:** Creates APIRequestContext-backed factory
  - **Provides:** Full ProfileFactory instance with all helper methods
  - **Cleanup:** Deletes all profiles created during test via API

**Example Usage:**

```typescript
import { test } from './support/fixtures';

test('onboarding flow', async ({ userFactory, profileFactory, page }) => {
  const user = await userFactory.createWithPassword({ password: 'test123' });

  // profileFactory auto-cleans up all created profiles
  await profileFactory.create({ userId: user.id, ... });
});
```

---

## Mock Requirements

### User Profiles API Endpoint

**Endpoint:** `POST /api/test/profiles`

**Success Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "650e8400-e29b-41d4-a716-446655440001",
  "experienceLevel": "student",
  "targetRole": "Software Engineer",
  "customRole": null,
  "onboardingCompleted": true,
  "createdAt": "2026-01-19T10:00:00Z",
  "updatedAt": "2026-01-19T10:00:00Z"
}
```

**Failure Response:**

```json
{
  "error": {
    "message": "Invalid experience level",
    "code": "VALIDATION_ERROR"
  }
}
```

**Notes:** Test endpoint for E2E test setup. DEV team should create this in `/app/api/test/profiles/route.ts` for test environment only.

---

## Required data-testid Attributes

### Onboarding Page

- `onboarding-container` - Main onboarding container (for visibility checks)
- `experience-level-student` - "Student/Recent Graduate" radio button/card
- `experience-level-career-changer` - "Career Changer" radio button/card
- `onboarding-next-button` - Next button (step 1 → step 2)
- `onboarding-back-button` - Back button (step 2 → step 1)
- `target-role-select` - Target role dropdown/select component
- `custom-role-input` - Custom role text input (visible when "Other" selected)
- `onboarding-complete-button` - Complete setup button (step 2)

### Dashboard Page (Updated)

- `dashboard-header` - Dashboard header (existing, used for visibility check)
- User welcome message should display experience level or target role

**Implementation Example:**

```tsx
// Step 1: Experience Level
<div data-testid="onboarding-container">
  <RadioGroup>
    <RadioGroupItem
      value="student"
      data-testid="experience-level-student"
    />
    <RadioGroupItem
      value="career_changer"
      data-testid="experience-level-career-changer"
    />
  </RadioGroup>
  <Button data-testid="onboarding-next-button">Next</Button>
</div>

// Step 2: Target Role
<Select data-testid="target-role-select">
  <SelectItem value="Software Engineer">Software Engineer</SelectItem>
  <SelectItem value="Other">Other</SelectItem>
</Select>

{showCustomInput && (
  <Input data-testid="custom-role-input" placeholder="Enter your role" />
)}

<Button data-testid="onboarding-back-button">Back</Button>
<Button data-testid="onboarding-complete-button">Complete Setup</Button>
```

---

## Implementation Checklist

### Test: Redirect new user to onboarding after first login

**File:** `tests/e2e/onboarding-flow.spec.ts:21`

**Tasks to make this test pass:**

- [ ] Create `/app/(dashboard)/onboarding/page.tsx` route
- [ ] Update `lib/supabase/proxy.ts` to check `onboarding_completed` flag
- [ ] If `onboarding_completed: false`, redirect authenticated users to `/onboarding`
- [ ] Handle case where user profile doesn't exist yet (treat as not onboarded)
- [ ] Add data-testid="onboarding-container" to onboarding page container
- [ ] Run test: `npx playwright test onboarding-flow.spec.ts -g "should redirect new user"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: Display experience level selection with two options

**File:** `tests/e2e/onboarding-flow.spec.ts:61`

**Tasks to make this test pass:**

- [ ] Create `config/experience-levels.ts` with EXPERIENCE_LEVELS array
- [ ] Create onboarding form component with RadioGroup from shadcn/ui
- [ ] Display both experience level options with descriptions
- [ ] Add data-testid="experience-level-student" to Student option
- [ ] Add data-testid="experience-level-career-changer" to Career Changer option
- [ ] Style with Card components for visual hierarchy
- [ ] Run test: `npx playwright test onboarding-flow.spec.ts -g "should display experience level"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: Require experience level selection to proceed

**File:** `tests/e2e/onboarding-flow.spec.ts:88`

**Tasks to make this test pass:**

- [ ] Add React Hook Form to onboarding page
- [ ] Add Zod validation schema requiring experience level
- [ ] Disable Next button when form is invalid
- [ ] Add data-testid="onboarding-next-button" to Next button
- [ ] Connect button disabled state to form validation
- [ ] Run test: `npx playwright test onboarding-flow.spec.ts -g "should require experience level"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: Display target role selection after experience level

**File:** `tests/e2e/onboarding-flow.spec.ts:126`

**Tasks to make this test pass:**

- [ ] Implement multi-step form state management (useState for current step)
- [ ] Create TARGET_ROLES array in `config/experience-levels.ts`
- [ ] Create step 2 UI with Select component from shadcn/ui
- [ ] Populate select with all target roles (including "Other")
- [ ] Add data-testid="target-role-select" to Select component
- [ ] Show step 2 when Next button clicked from step 1
- [ ] Run test: `npx playwright test onboarding-flow.spec.ts -g "should display target role"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: Show custom role input when "Other" is selected

**File:** `tests/e2e/onboarding-flow.spec.ts:175`

**Tasks to make this test pass:**

- [ ] Add conditional rendering for custom role input
- [ ] Watch target role select value changes
- [ ] When value === "Other", show input field
- [ ] Add data-testid="custom-role-input" to input
- [ ] Auto-focus input when it appears (useEffect + ref)
- [ ] Update validation to require customRole when "Other" selected
- [ ] Run test: `npx playwright test onboarding-flow.spec.ts -g "should show custom role"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: Save profile and redirect to dashboard on completion

**File:** `tests/e2e/onboarding-flow.spec.ts:205`

**Tasks to make this test pass:**

- [ ] Create `lib/validations/profile.ts` with onboardingInputSchema
- [ ] Create `actions/profile.ts` with `completeOnboarding` server action
- [ ] Implement ActionResponse pattern (return `{ data, error }`)
- [ ] Create `user_profiles` table migration in Supabase
- [ ] Add RLS policies (users can only read/write own profile)
- [ ] Handle upsert logic (create if doesn't exist, update if exists)
- [ ] Transform snake_case to camelCase at service boundary
- [ ] Add data-testid="onboarding-complete-button" to complete button
- [ ] Call `completeOnboarding` on form submit using useTransition
- [ ] Redirect to `/dashboard` on success with router.push
- [ ] Run test: `npx playwright test onboarding-flow.spec.ts -g "should save profile"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: Skip onboarding for users with completed profiles

**File:** `tests/e2e/onboarding-flow.spec.ts:252`

**Tasks to make this test pass:**

- [ ] Update proxy.ts to query `user_profiles` table
- [ ] Check `onboarding_completed` flag for authenticated users
- [ ] If `onboarding_completed: true`, allow normal dashboard access
- [ ] If `onboarding_completed: false`, redirect to `/onboarding`
- [ ] If no profile exists, treat as not onboarded (redirect to `/onboarding`)
- [ ] Handle profile query errors gracefully
- [ ] Run test: `npx playwright test onboarding-flow.spec.ts -g "should skip onboarding"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: Prevent completed users from accessing /onboarding

**File:** `tests/e2e/onboarding-flow.spec.ts:287`

**Tasks to make this test pass:**

- [ ] Add special case in proxy.ts for `/onboarding` route
- [ ] If user has `onboarding_completed: true`, redirect to `/dashboard`
- [ ] Allow access only if `onboarding_completed: false` or no profile
- [ ] Ensure redirect preserves any query parameters if needed
- [ ] Run test: `npx playwright test onboarding-flow.spec.ts -g "should prevent completed"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Allow back navigation between steps

**File:** `tests/e2e/onboarding-flow.spec.ts:303`

**Tasks to make this test pass:**

- [ ] Add Back button to step 2 UI
- [ ] Add data-testid="onboarding-back-button" to button
- [ ] Implement onClick handler to decrement step state
- [ ] Preserve form values when navigating back (React Hook Form handles this)
- [ ] Show correct step UI when step changes
- [ ] Run test: `npx playwright test onboarding-flow.spec.ts -g "should allow back"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Validate custom role is not empty

**File:** `tests/e2e/onboarding-flow.spec.ts:328`

**Tasks to make this test pass:**

- [ ] Update Zod schema to validate customRole when targetRole === "Other"
- [ ] Add `.refine()` validation for conditional requirement
- [ ] Disable Complete button when custom role is empty
- [ ] Enable Complete button when custom role has value
- [ ] Display validation error if needed
- [ ] Run test: `npx playwright test onboarding-flow.spec.ts -g "should validate custom role"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all failing tests for this story
npx playwright test tests/e2e/onboarding-flow.spec.ts

# Run specific test file with UI mode
npx playwright test tests/e2e/onboarding-flow.spec.ts --ui

# Run tests in headed mode (see browser)
npx playwright test tests/e2e/onboarding-flow.spec.ts --headed

# Debug specific test
npx playwright test tests/e2e/onboarding-flow.spec.ts -g "should redirect new user" --debug

# Run tests with coverage (requires coverage setup)
npx playwright test tests/e2e/onboarding-flow.spec.ts --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (14 E2E tests)
- ✅ Fixtures and factories created with auto-cleanup (ProfileFactory)
- ✅ Mock requirements documented (test API endpoints)
- ✅ data-testid requirements listed (8 attributes)
- ✅ Implementation checklist created (10 test scenarios)

**Verification:**

- All tests run and fail as expected (missing routes, components, actions)
- Failure messages are clear: "locator.toBeVisible: Timeout 10000ms exceeded"
- Tests fail due to missing implementation, not test bugs
- Run `npx playwright test onboarding-flow.spec.ts` to verify RED phase

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with AC1)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass:
   - Start with proxy.ts redirect logic (AC1)
   - Then onboarding page UI (AC2)
   - Then multi-step form logic (AC3)
   - Then server action + DB (AC4)
   - Finally, existing user logic (AC5)
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap
- Follow project-context.md patterns exactly (ActionResponse, naming conventions)

**Progress Tracking:**

- Check off tasks as you complete them
- Share progress in daily standup
- Mark story as IN PROGRESS in `sprint-status.yaml`

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Review code for quality** (readability, maintainability, performance)
3. **Extract duplications** (DRY principle - shared components, utilities)
4. **Optimize performance** (minimize re-renders, optimize DB queries)
5. **Ensure tests still pass** after each refactor
6. **Update documentation** (if API contracts change)

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Make small refactors (easier to debug if tests fail)
- Run tests after each change
- Don't change test behavior (only implementation)

**Completion:**

- All tests pass: `npx playwright test onboarding-flow.spec.ts` shows 14/14 passing
- Code quality meets team standards (follows project-context.md)
- No duplications or code smells
- Ready for code review and story approval

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (`/bmad:bmm:workflows:dev-story`)
2. **Review this checklist** with team in standup or planning
3. **Run failing tests** to confirm RED phase: `npx playwright test onboarding-flow.spec.ts`
4. **Begin implementation** using implementation checklist as guide
5. **Work one test at a time** (red → green for each)
6. **Share progress** in daily standup
7. **When all tests pass**, refactor code for quality
8. **When refactoring complete**, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **fixture-architecture.md** - ProfileFactory follows pure function → fixture pattern with auto-cleanup
- **data-factories.md** - Factory uses faker for parallel-safe unique values, override pattern for test customization
- **selector-resilience.md** - All selectors use data-testid (highest priority) for stability
- **test-quality.md** - Given-When-Then structure, one assertion per test section, deterministic test design
- **network-first.md** - Wait for response promises BEFORE actions (sessionPromise, profileSavePromise)

See `_bmad/bmm/testarch/tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test tests/e2e/onboarding-flow.spec.ts`

**Expected Results:**

```
Running 14 tests using 3 workers

  ✘ [chromium] › onboarding-flow.spec.ts:21:3 › [P0][AC1] should redirect new user to onboarding
  ✘ [chromium] › onboarding-flow.spec.ts:45:3 › [P0][AC1] should block access to protected routes
  ✘ [chromium] › onboarding-flow.spec.ts:61:3 › [P0][AC2] should display experience level selection
  ✘ [chromium] › onboarding-flow.spec.ts:88:3 › [P0][AC2] should require experience level selection
  ✘ [chromium] › onboarding-flow.spec.ts:108:3 › [P0][AC2] should enable next button
  ✘ [chromium] › onboarding-flow.spec.ts:126:3 › [P0][AC3] should display target role selection
  ✘ [chromium] › onboarding-flow.spec.ts:154:3 › [P0][AC3] should allow selecting standard role
  ✘ [chromium] › onboarding-flow.spec.ts:175:3 › [P0][AC3] should show custom role input
  ✘ [chromium] › onboarding-flow.spec.ts:205:3 › [P0][AC4] should save profile and redirect
  ✘ [chromium] › onboarding-flow.spec.ts:238:3 › [P0][AC4] should display success toast
  ✘ [chromium] › onboarding-flow.spec.ts:252:3 › [P0][AC5] should skip onboarding for existing
  ✘ [chromium] › onboarding-flow.spec.ts:287:3 › [P0][AC5] should prevent completed users
  ✘ [chromium] › onboarding-flow.spec.ts:303:3 › [P1] should allow back navigation
  ✘ [chromium] › onboarding-flow.spec.ts:328:3 › [P1] should validate custom role

  14 failed
    ... (error details showing missing routes, components, and API endpoints)
```

**Summary:**

- Total tests: 14
- Passing: 0 (expected - RED phase)
- Failing: 14 (expected - missing implementation)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- AC1 tests: "page.goto: net::ERR_ABORTED at /onboarding" (route doesn't exist)
- AC2/AC3 tests: "locator.toBeVisible: Timeout exceeded" (components don't exist)
- AC4 tests: "waitForResponse: Request failed" (server actions don't exist)
- AC5 tests: "expect(page).toHaveURL: Expected /dashboard but got /onboarding" (logic not implemented)

---

## Notes

### Implementation Priority

Follow this order for optimal development flow:

1. **Database & Schema** (Task 1: user_profiles table, RLS policies)
2. **Config & Validation** (Tasks 2-3: experience-levels.ts, Zod schemas)
3. **Route Protection** (Task 6: proxy.ts onboarding logic) - Enables AC1 tests
4. **Onboarding UI** (Task 5: page.tsx, multi-step form) - Enables AC2, AC3 tests
5. **Server Actions** (Task 4: profile.ts actions) - Enables AC4 tests
6. **Dashboard Update** (Task 7: welcome message) - Completes AC4
7. **E2E Tests** (Already done - run to verify)

### Testing Notes

- **Parallel Safety**: All factories use faker for unique values - safe to run tests in parallel
- **Network-First Pattern**: Tests wait for API responses BEFORE assertions to avoid race conditions
- **Auto-Cleanup**: ProfileFactory automatically deletes created profiles in fixture teardown
- **Data-testid Stability**: All interactive elements use data-testid for resilient selectors

### Database Considerations

**user_profiles table** must have:
- `onboarding_completed BOOLEAN DEFAULT false` for routing logic
- Unique constraint on `user_id` (one profile per user)
- RLS policies to prevent cross-user data access
- Trigger to update `updated_at` timestamp automatically

**Test API endpoints** (`/api/test/profiles`) should:
- Only be available in non-production environments
- Use service role key for bypassing RLS in tests
- Return ActionResponse format for consistency

### Architecture Compliance Notes

**CRITICAL - This story follows project-context.md patterns:**

1. **ActionResponse Pattern**: `completeOnboarding` returns `{ data, error }`
2. **Naming Conventions**: DB `experience_level` → API `experienceLevel`
3. **Server Actions**: All actions in `actions/profile.ts`, never throw errors
4. **Client Consumption**: Use `useTransition` for server action calls
5. **Zod Validation**: Validate ALL input in server actions with safeParse

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Tag @lawrence in Slack/Discord
- Refer to `_bmad-output/implementation-artifacts/2-1-onboarding-flow-experience-level-target-role.md` for detailed story requirements
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices
- Review `_bmad-output/project-context.md` for architecture patterns

---

**Generated by BMad TEA Agent** - 2026-01-19
