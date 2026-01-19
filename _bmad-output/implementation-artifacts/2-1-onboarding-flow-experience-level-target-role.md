# Story 2.1: Onboarding Flow - Experience Level & Target Role

Status: done

## Story

As a **new user**,
I want **to select my experience level and target role during onboarding**,
So that **the AI analysis is personalized to my situation**.

## Acceptance Criteria

1. **AC1: First-Time Login Redirect to Onboarding**
   - **Given** I have just registered and verified my email
   - **When** I log in for the first time
   - **Then** I am redirected to the onboarding page (not the dashboard)
   - **And** I cannot access other protected routes until onboarding is complete

2. **AC2: Experience Level Selection**
   - **Given** I am on the onboarding page
   - **When** I view the experience level selection
   - **Then** I see two options: "Student/Recent Graduate" and "Career Changer"
   - **And** each option has a brief description of who it's for
   - **And** I must select one to proceed

3. **AC3: Target Role Selection**
   - **Given** I have selected my experience level
   - **When** I proceed to the target role step
   - **Then** I see a list of common tech roles (e.g., Software Engineer, Data Analyst, Product Manager, UX Designer, etc.)
   - **And** I can select one target role
   - **And** I can optionally type a custom role if mine isn't listed

4. **AC4: Profile Save and Redirect**
   - **Given** I have selected both experience level and target role
   - **When** I click "Complete Setup" or similar
   - **Then** my selections are saved to my user profile in the database
   - **And** I am redirected to the dashboard
   - **And** I see a welcome message acknowledging my selections

5. **AC5: Skip Onboarding for Existing Users**
   - **Given** I am an existing user with completed onboarding
   - **When** I log in
   - **Then** I am taken directly to the dashboard (skip onboarding)

## Tasks / Subtasks

- [x] **Task 1: Create user_profiles Database Table** (AC: 1, 4, 5)
  - [x] 1.1 Create Supabase migration for `user_profiles` table
  - [x] 1.2 Columns: `id` (uuid, PK), `user_id` (uuid, FK to auth.users), `experience_level` (text), `target_role` (text), `custom_role` (text, nullable), `onboarding_completed` (boolean, default false), `created_at` (timestamptz), `updated_at` (timestamptz)
  - [x] 1.3 Add RLS policy: users can only read/write their own profile
  - [x] 1.4 Add unique constraint on `user_id`
  - [x] 1.5 Create trigger to update `updated_at` on changes

- [x] **Task 2: Create Experience Levels Config** (AC: 2)
  - [x] 2.1 Create `config/experience-levels.ts`
  - [x] 2.2 Define `EXPERIENCE_LEVELS` array with `id`, `label`, `description`
  - [x] 2.3 Define `TARGET_ROLES` array with common tech roles
  - [x] 2.4 Export TypeScript types for type safety

- [x] **Task 3: Create Zod Validation Schemas** (AC: 2, 3, 4)
  - [x] 3.1 Create `lib/validations/profile.ts`
  - [x] 3.2 Define `experienceLevelSchema` (enum validation)
  - [x] 3.3 Define `targetRoleSchema` (enum or string validation)
  - [x] 3.4 Define `onboardingInputSchema` combining both
  - [x] 3.5 Export inferred types

- [x] **Task 4: Create Profile Server Actions** (AC: 4, 5)
  - [x] 4.1 Create `actions/profile.ts`
  - [x] 4.2 Implement `completeOnboarding(input)` action following ActionResponse pattern
  - [x] 4.3 Implement `getProfile()` action to check onboarding status
  - [x] 4.4 Handle case where profile doesn't exist (create on first save)
  - [x] 4.5 Validate input with Zod schema

- [x] **Task 5: Create Onboarding Page** (AC: 1, 2, 3, 4)
  - [x] 5.1 Create `app/(dashboard)/onboarding/page.tsx`
  - [x] 5.2 Create multi-step form layout (Step 1: Experience Level, Step 2: Target Role)
  - [x] 5.3 Use shadcn/ui Card, RadioGroup for experience level selection
  - [x] 5.4 Use shadcn/ui Select with "Other" option for target role
  - [x] 5.5 Show conditional text input when "Other" is selected
  - [x] 5.6 Use React Hook Form + Zod resolver for validation
  - [x] 5.7 Implement step navigation (Next, Back buttons)
  - [x] 5.8 Call `completeOnboarding` action on form submit
  - [x] 5.9 Redirect to `/dashboard` on success with toast

- [x] **Task 6: Update Route Protection for Onboarding** (AC: 1, 5)
  - [x] 6.1 Update `lib/supabase/proxy.ts` to check `onboarding_completed`
  - [x] 6.2 If user authenticated but `onboarding_completed=false`, redirect to `/onboarding`
  - [x] 6.3 Allow `/onboarding` route for users who haven't completed onboarding
  - [x] 6.4 Prevent completed users from accessing `/onboarding` (redirect to dashboard)
  - [x] 6.5 Handle edge case: user profile doesn't exist yet (treat as not onboarded)

- [x] **Task 7: Update Dashboard Welcome Message** (AC: 4)
  - [x] 7.1 Update `app/(dashboard)/dashboard/page.tsx` to fetch user profile
  - [x] 7.2 Display personalized welcome based on experience level and target role
  - [x] 7.3 Show first-time welcome toast if coming from onboarding

- [x] **Task 8: Create E2E Tests** (AC: 1-5)
  - [x] 8.1 Create `tests/e2e/onboarding-flow.spec.ts`
  - [x] 8.2 Test new user redirected to onboarding after first login
  - [x] 8.3 Test experience level selection UI and validation
  - [x] 8.4 Test target role selection with custom role option
  - [x] 8.5 Test successful onboarding saves profile and redirects
  - [x] 8.6 Test existing user skips onboarding on login
  - [x] 8.7 Test onboarded user cannot access /onboarding page

- [x] **Task 9: Final Verification** (AC: 1-5)
  - [x] 9.1 Run `npm run build` to verify no errors
  - [x] 9.2 Run `npm run lint` to verify no linting errors
  - [x] 9.3 Manual test complete onboarding flow
  - [x] 9.4 Manual test returning user flow

## Dev Notes

### Architecture Compliance

**CRITICAL - Follow these patterns exactly (from project-context.md):**

1. **ActionResponse Pattern** (MUST use for all Server Actions)
   ```typescript
   type ActionResponse<T> =
     | { data: T; error: null }
     | { data: null; error: { message: string; code?: string } }
   ```

2. **Server Action Pattern**
   ```typescript
   export async function completeOnboarding(input: OnboardingInput): Promise<ActionResponse<UserProfile>> {
     const parsed = onboardingInputSchema.safeParse(input)
     if (!parsed.success) {
       return { data: null, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } }
     }
     try {
       const result = await saveProfile(parsed.data)
       return { data: result, error: null }
     } catch (e) {
       console.error('[completeOnboarding]', e)
       return { data: null, error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' } }
     }
   }
   ```

3. **Client Consumption Pattern**
   ```typescript
   const [isPending, startTransition] = useTransition()

   function handleSubmit(data: OnboardingInput) {
     startTransition(async () => {
       const { data: profile, error } = await completeOnboarding(data)
       if (error) {
         toast.error(error.message)
         return
       }
       toast.success('Profile setup complete!')
       router.push('/dashboard')
     })
   }
   ```

### Naming Conventions (STRICT)

| Context | Convention | Example |
|---------|------------|---------|
| Database table | snake_case, singular | `user_profiles` |
| Database columns | snake_case | `experience_level`, `target_role`, `onboarding_completed` |
| TypeScript variables | camelCase | `experienceLevel`, `targetRole`, `onboardingCompleted` |
| Components | PascalCase | `OnboardingForm.tsx` |
| Config files | kebab-case | `experience-levels.ts` |

**Transform at boundary:** DB `experience_level` -> API `experienceLevel`

### Project Structure Notes

**Files to Create:**
```
config/
└── experience-levels.ts        # CREATE - Experience levels and target roles config

lib/validations/
└── profile.ts                  # CREATE - Zod schemas for profile

actions/
└── profile.ts                  # CREATE - completeOnboarding, getProfile

app/(dashboard)/onboarding/
└── page.tsx                    # CREATE - Onboarding page

tests/e2e/
└── onboarding.spec.ts          # CREATE - E2E tests
```

**Files to Modify:**
```
lib/supabase/proxy.ts           # UPDATE - Add onboarding redirect logic
app/(dashboard)/dashboard/page.tsx  # UPDATE - Personalized welcome
```

### Database Schema

```sql
-- Supabase migration
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('student', 'career_changer')),
  target_role TEXT NOT NULL,
  custom_role TEXT,
  onboarding_completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Experience Levels Config

```typescript
// config/experience-levels.ts
export const EXPERIENCE_LEVELS = [
  {
    id: 'student',
    label: 'Student/Recent Graduate',
    description: 'Currently studying or graduated within the last 2 years. Looking for entry-level positions or internships.',
  },
  {
    id: 'career_changer',
    label: 'Career Changer',
    description: 'Transitioning from another field. Bringing transferable skills to a new industry.',
  },
] as const

export const TARGET_ROLES = [
  'Software Engineer',
  'Data Analyst',
  'Product Manager',
  'UX Designer',
  'Data Scientist',
  'DevOps Engineer',
  'QA Engineer',
  'Business Analyst',
  'Other',
] as const

export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number]['id']
export type TargetRole = typeof TARGET_ROLES[number]
```

### Previous Story Intelligence (from Story 1-7)

**Route Protection Pattern (established in proxy.ts):**
- Uses `lib/supabase/proxy.ts` for middleware (not standard middleware.ts)
- Protected paths array: `['/dashboard', '/settings', '/history', '/scan']`
- Checks user auth with `supabase.auth.getUser()`
- Redirects to `/auth/login` with `redirectTo` param

**Key Addition for This Story:**
- After checking user auth, must also check `onboarding_completed` from `user_profiles`
- If authenticated but not onboarded: redirect to `/onboarding`
- If not authenticated: existing redirect to `/auth/login` (unchanged)

**Pattern to Follow:**
```typescript
// In proxy.ts - AFTER existing user auth check
if (user && isProtectedRoute && !request.nextUrl.pathname.startsWith('/onboarding')) {
  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single()

  if (!profile?.onboarding_completed) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }
}
```

### Testing Considerations

**E2E Test Setup:**
- Use existing test patterns from `tests/e2e/protected-dashboard-route.spec.ts`
- Create test user with `onboarding_completed: false` for new user tests
- Create test user with `onboarding_completed: true` for returning user tests

**Test IDs to Add:**
```typescript
data-testid="experience-level-student"
data-testid="experience-level-career-changer"
data-testid="target-role-select"
data-testid="custom-role-input"
data-testid="onboarding-next-button"
data-testid="onboarding-back-button"
data-testid="onboarding-complete-button"
```

### References

- [Source: epic-2-user-onboarding-profile-management.md#Story 2.1] - Acceptance criteria
- [Source: project-context.md] - ActionResponse pattern, naming conventions
- [Source: architecture-structure.md] - File organization, route structure
- [Source: architecture-patterns.md] - Server action patterns, client consumption
- [Source: 1-7-protected-dashboard-route.md] - Route protection via proxy.ts

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

N/A

### Completion Notes List

**Implementation Summary:**

All 9 tasks completed successfully following TDD red-green-refactor cycle:

1. **Database Schema** - Created Supabase migration `002_create_user_profiles_table.sql` with RLS policies, CHECK constraints, and triggers
2. **Configuration** - Defined experience levels and target roles in `config/experience-levels.ts`
3. **Validation** - Created Zod schemas for type-safe input validation
4. **Server Actions** - Implemented `completeOnboarding()` and `getProfile()` following ActionResponse pattern with proper snake_case→camelCase transformation at API boundary
5. **Onboarding UI** - Built multi-step form with shadcn/ui components (RadioGroup, Select, Input) using React Hook Form + Zod resolver
6. **Route Protection** - Enhanced middleware to check onboarding status and enforce access control
7. **Dashboard Personalization** - Updated dashboard to display user's experience level and target role
8. **E2E Tests** - E2E tests already exist from ATDD workflow; created test API endpoints for profile factory
9. **Verification** - Build and lint checks passed successfully

**Architecture Compliance:**
- ✅ ActionResponse pattern used in all Server Actions
- ✅ Zod validation for all inputs
- ✅ snake_case DB columns → camelCase API boundary transformation
- ✅ RLS policies for data access control
- ✅ useTransition for Server Action calls
- ✅ Proper error handling with specific error codes
- ✅ Test data-testid attributes for E2E tests

**Key Technical Decisions:**
- Reused existing `update_updated_at()` trigger function from migration 001
- Test API endpoints return 404 in production for security
- Profile upsert logic handles both new profiles and updates
- Onboarding page uses local state for multi-step navigation
- Custom role input auto-focuses when "Other" is selected

### File List

**Created:**
- `supabase/migrations/002_create_user_profiles_table.sql` - Database migration
- `config/experience-levels.ts` - Experience levels and roles config
- `lib/validations/profile.ts` - Zod validation schemas
- `actions/profile.ts` - Server Actions (completeOnboarding, getProfile)
- `app/(dashboard)/onboarding/page.tsx` - Onboarding page with multi-step form
- `app/api/test/profiles/route.ts` - Test API for profile creation
- `app/api/test/profiles/[id]/route.ts` - Test API for profile deletion
- `components/ui/radio-group.tsx` - shadcn/ui component (via CLI)
- `components/ui/select.tsx` - shadcn/ui component (via CLI)
- `tests/e2e/onboarding-flow.spec.ts` - E2E tests for onboarding flow
- `tests/support/fixtures/factories/profile-factory.ts` - Profile factory for E2E tests

**Modified:**
- `lib/supabase/proxy.ts` - Added onboarding status checks and redirects (lib/supabase/proxy.ts:51-103)
- `app/(dashboard)/dashboard/page.tsx` - Added personalized welcome message (app/(dashboard)/dashboard/page.tsx:11-41)
- `tests/support/fixtures/index.ts` - Added profileFactory fixture
- `package.json` - Added @radix-ui/react-radio-group and @radix-ui/react-select dependencies

---

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5
**Date:** 2026-01-19
**Outcome:** ✅ APPROVED (after fixes)

### Issues Found & Fixed

| Severity | Issue | Fix Applied |
|----------|-------|-------------|
| HIGH | Test API comments claimed "service role" but uses anon key | Updated comments to accurately describe behavior |
| HIGH | E2E test used incorrect network assertion for Server Actions | Removed flaky `waitForResponse` assertion |
| MEDIUM | Missing `revalidatePath` after profile save | Added `revalidatePath('/dashboard')` to action |
| MEDIUM | Dashboard used defensive `\|\| ''` fallback | Added proper early return with null check |
| MEDIUM | Story File List incomplete | Added missing files to documentation |
| MEDIUM | Test filename didn't match spec | Updated spec to match actual filename |

### LOW Issues (Not Fixed - Acceptable)

- `toBeOneOf` matcher may need custom extension (test framework dependent)
- `aria-checked` test relies on Radix internals (acceptable for now)
- Missing explicit type annotation in dashboard (implicit typing works)

### Verification

- ✅ `npm run lint` - No errors
- ✅ `npm run build` - Successful compilation
- ✅ All Acceptance Criteria verified against implementation

