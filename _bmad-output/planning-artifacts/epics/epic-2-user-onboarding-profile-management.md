# Epic 2: User Onboarding & Profile Management

Users can personalize their experience by selecting their experience level (Student/Career Changer) and target role, enabling context-aware analysis.

## Story 2.1: Onboarding Flow - Experience Level & Target Role

As a **new user**,
I want **to select my experience level and target role during onboarding**,
So that **the AI analysis is personalized to my situation**.

**Acceptance Criteria:**

**Given** I have just registered and verified my email
**When** I log in for the first time
**Then** I am redirected to the onboarding page (not the dashboard)
**And** I cannot access other protected routes until onboarding is complete

**Given** I am on the onboarding page
**When** I view the experience level selection
**Then** I see two options: "Student/Recent Graduate" and "Career Changer"
**And** each option has a brief description of who it's for
**And** I must select one to proceed

**Given** I have selected my experience level
**When** I proceed to the target role step
**Then** I see a list of common tech roles (e.g., Software Engineer, Data Analyst, Product Manager, UX Designer, etc.)
**And** I can select one target role
**And** I can optionally type a custom role if mine isn't listed

**Given** I have selected both experience level and target role
**When** I click "Complete Setup" or similar
**Then** my selections are saved to my user profile in the database
**And** I am redirected to the dashboard
**And** I see a welcome message acknowledging my selections

**Given** I am an existing user with completed onboarding
**When** I log in
**Then** I am taken directly to the dashboard (skip onboarding)

**Technical Notes:**
- Create `app/(dashboard)/onboarding/page.tsx`
- Create `user_profiles` table with columns: `user_id`, `experience_level`, `target_role`, `onboarding_completed`, `created_at`, `updated_at`
- Add RLS policy: users can only read/write their own profile
- Create `actions/profile.ts` with `completeOnboarding` action
- Store experience levels in `config/experience-levels.ts`

---

## Story 2.2: Profile Settings Page

As a **user**,
I want **to view and update my experience level and target role**,
So that **I can adjust my profile as my career goals change**.

**Acceptance Criteria:**

**Given** I am logged in and have completed onboarding
**When** I navigate to Settings (via user menu or sidebar)
**Then** I see a Profile section showing my current experience level and target role

**Given** I am on the Settings page
**When** I click "Edit" on my profile section
**Then** I can change my experience level (Student/Career Changer)
**And** I can change my target role from the same list as onboarding

**Given** I have made changes to my profile
**When** I click "Save Changes"
**Then** my profile is updated in the database
**And** I see a success toast "Profile updated successfully"
**And** the displayed values reflect my changes

**Given** I am on the Settings page
**When** I make changes but click "Cancel" or navigate away
**Then** my changes are not saved
**And** my profile retains the previous values

**Given** I try to save with no experience level selected
**When** the validation runs
**Then** I see an error "Please select an experience level"
**And** the form is not submitted

**Technical Notes:**
- Create `app/(dashboard)/settings/page.tsx`
- Create `components/forms/ProfileSetup.tsx` (reusable for onboarding and settings)
- Add `updateProfile` action to `actions/profile.ts`
- Use React Hook Form + Zod for form handling
- Follow AR6 ActionResponse pattern

---
