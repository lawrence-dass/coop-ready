# Story 16.2: Implement Dashboard Home Page

**Status:** ready-for-dev

**Epic:** Epic 16: Dashboard UI Architecture (V0.5)

**Depends On:**
- Story 16.1 (Dashboard Layout Foundation) COMPLETED ✓

---

## Story

As a user,
I want a dashboard home page with an overview of my activity,
So that I can quickly access key features and see my recent work.

---

## Acceptance Criteria

1. **Given** I am authenticated and on `/app/dashboard`
   **When** the page loads
   **Then** I see a welcome message with my name/email
   **And** the user's first name is extracted from email or profile

2. **Given** I am on `/app/dashboard`
   **When** the page loads
   **Then** I see a "New Scan" quick action card with prominent CTA
   **And** I see a "View History" quick action card
   **And** both cards have descriptive text and icons

3. **Given** I am on `/app/dashboard`
   **When** the page loads
   **Then** I see a "Your Progress" stats card (placeholder with TBD metrics)
   **And** the card displays generic stats that don't require data

4. **Given** I have previous optimization sessions
   **When** the dashboard loads
   **Then** I see a "Recent Scans" section showing my last 3-5 sessions
   **And** each session shows: date created, resume filename (if available), job title/company (if identifiable from JD)
   **And** sessions are sorted by most recent first
   **And** clicking a recent scan navigates to `/app/scan/[sessionId]`

5. **Given** I have no previous optimization sessions
   **When** the dashboard loads
   **Then** I see a "Getting Started" guide instead of "Recent Scans"
   **And** the guide has 3 steps: Upload Resume → Paste Job Description → Get Suggestions
   **And** there is a prominent "Start Your First Scan" CTA button
   **And** clicking the CTA navigates to `/app/scan/new`

6. **Given** the dashboard is loaded
   **When** I click "New Scan" or "Start Your First Scan"
   **Then** I am navigated to `/app/scan/new`
   **And** clicking "View History" navigates to `/app/history`

---

## Tasks / Subtasks

- [ ] Load recent optimization sessions from database (AC: #4,5)
  - [ ] Create server function or hook to fetch user's recent sessions (max 5)
  - [ ] Load from existing optimization_sessions table or sessions table
  - [ ] Extract date created, resume filename, job description (for title/company)
  - [ ] Handle case where no sessions exist (return empty array)
  - [ ] Cache or memoize result to avoid re-fetching on each render

- [ ] Create RecentScansCard component (AC: #4)
  - [ ] Create `/components/dashboard/RecentScansCard.tsx`
  - [ ] Display up to 5 most recent sessions with date, filename, job title
  - [ ] Show date in human-readable format (e.g., "2 days ago", "Jan 29, 2026")
  - [ ] Each session is clickable and navigates to `/app/scan/[sessionId]`
  - [ ] Session cards use shadcn Card component with hover effects
  - [ ] Show placeholder text if session date can't be extracted
  - [ ] Responsive layout: stack on mobile, 2-column on tablet, full on desktop

- [ ] Create GettingStartedGuide component (AC: #5)
  - [ ] Create `/components/dashboard/GettingStartedGuide.tsx`
  - [ ] Display 3 steps: Upload Resume → Paste Job Description → Get Suggestions
  - [ ] Each step has a number badge, icon, title, and description
  - [ ] Include "Start Your First Scan" CTA button
  - [ ] Button navigates to `/app/scan/new`
  - [ ] Use Tailwind and shadcn components for consistent styling
  - [ ] Responsive layout: stack on mobile, 3-column on larger screens

- [ ] Create QuickActionCard component (AC: #2,6)
  - [ ] Create `/components/dashboard/QuickActionCard.tsx` (reusable)
  - [ ] Takes props: title, description, icon, onClick handler, ctaText
  - [ ] Render as shadcn Card with icon, title, description
  - [ ] Include prominent CTA button styled with primary color
  - [ ] Support rounded corners and subtle shadow
  - [ ] Responsive: full width on mobile, auto width on desktop

- [ ] Create WelcomeHeader component (AC: #1)
  - [ ] Create `/components/dashboard/WelcomeHeader.tsx`
  - [ ] Display "Welcome, [FirstName]!" greeting
  - [ ] Extract first name from user email (before @)
  - [ ] Show full email as subtitle/secondary text
  - [ ] Use large heading typography (h1 or h2)
  - [ ] Optional: Show time-based greeting (Good morning/afternoon/evening)
  - [ ] Use consistent theming with rest of dashboard

- [ ] Create ProgressStatsCard component (AC: #3)
  - [ ] Create `/components/dashboard/ProgressStatsCard.tsx`
  - [ ] Display "Your Progress" heading
  - [ ] Show placeholder stats (no real data yet):
    - Total scans: 0 (or count from user)
    - Average ATS score: -- (TBD)
    - Improvement rate: -- (TBD)
  - [ ] Use stat cards with icons and values
  - [ ] Each stat has a label and value
  - [ ] Use muted text for TBD metrics
  - [ ] Responsive grid layout

- [ ] Implement `/app/(dashboard)/dashboard/page.tsx` main page (AC: All)
  - [ ] Load authenticated user from server component
  - [ ] Fetch recent sessions via server function/hook
  - [ ] Determine which content to show: RecentScans or GettingStarted
  - [ ] Render layout with components in order:
    1. WelcomeHeader
    2. QuickActionCards (New Scan + View History)
    3. ProgressStatsCard
    4. RecentScansCard OR GettingStartedGuide (based on sessions)
  - [ ] Use grid/spacing for responsive layout
  - [ ] Add loading state if fetching sessions takes time
  - [ ] Handle errors gracefully (show message, don't crash)

- [ ] Create dashboard page layout styling (AC: All)
  - [ ] Use max-width container (1280px or similar) with auto margins
  - [ ] Add padding/spacing between sections (gap-6 or gap-8)
  - [ ] Use Tailwind grid utilities for responsive layout
  - [ ] Mobile (< 768px): single column, cards stack
  - [ ] Tablet (768px - 1024px): 2-column for some sections
  - [ ] Desktop (≥ 1024px): multi-column grid layouts
  - [ ] Colors match design system: white background, purple accents
  - [ ] Typography follows existing Tailwind config

- [ ] Integrate QuickActionCards navigation (AC: #2,6)
  - [ ] "New Scan" card onClick → navigate to `/app/scan/new`
  - [ ] "View History" card onClick → navigate to `/app/history`
  - [ ] Use next/link or useRouter for navigation
  - [ ] Test navigation works without errors
  - [ ] Cards show visual feedback on hover (raise shadow, slight scale)

- [ ] Add loading state and error handling (AC: All)
  - [ ] Show skeleton loader while fetching sessions from DB
  - [ ] Handle error if session fetch fails (show error message, not crash)
  - [ ] Show empty state message if sessions table is empty
  - [ ] Gracefully degrade if user data can't be loaded
  - [ ] No console errors or unhandled promises

- [ ] Create comprehensive component tests (AC: All)
  - [ ] Create `/tests/unit/components/dashboard/*` test files:
    - WelcomeHeader.test.tsx - tests greeting with different emails
    - QuickActionCard.test.tsx - tests click handlers and rendering
    - RecentScansCard.test.tsx - tests session list display
    - GettingStartedGuide.test.tsx - tests guide content and button
    - ProgressStatsCard.test.tsx - tests stat display
  - [ ] Mock Supabase for session fetching
  - [ ] Test component rendering with various data states
  - [ ] Test navigation links work (mock useRouter)

- [ ] Create integration tests for page (AC: All)
  - [ ] Create `/tests/integration/16-2-dashboard-home-page.spec.ts`
  - [ ] Test: User with recent sessions sees RecentScansCard
  - [ ] Test: User with no sessions sees GettingStartedGuide
  - [ ] Test: Clicking "New Scan" navigates to `/app/scan/new`
  - [ ] Test: Clicking recent scan navigates to correct session
  - [ ] Test: Welcome message displays correct name
  - [ ] Test: All accessibility features (keyboard nav, screen readers)

---

## Dev Notes

### Architecture Overview

Story 16.2 implements the home/landing page for authenticated users entering the dashboard. It's the entry point after login and provides quick access to key features and recent history.

**Key Dependencies:**
- Story 16.1 provides the outer layout (Sidebar, Header)
- Session/optimization history stored in existing database tables
- User info available from Supabase Auth

### Critical Patterns & Constraints

**Data Fetching** [Source: project-context.md#API-Patterns]
- Use Server Components for database queries (fetch in layout or page.tsx)
- Session data: Query from existing `optimization_sessions` or `sessions` table
- User data: Get from `getUser()` in Supabase Auth

**Component Reusability**
- QuickActionCard: Reusable component for any card with CTA button
- ProgressStatsCard: Can be extended later with real metrics
- Can be used in other pages (History, etc.)

**Navigation** [Source: Story 16.1 Dev Notes]
- Use `useRouter()` from `next/navigation` for client-side navigation
- Route constants defined in `/lib/constants/routes.ts`
- Navigation happens from QuickActionCard components

**Responsive Design** [Source: project-context.md#Directory-Structure-Rules]
- Tailwind breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Mobile-first: Default to mobile layout, add desktop with prefixes
- Use grid utilities: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### File Structure & Components to Create

```
/components/dashboard/
  ├── WelcomeHeader.tsx                  (User greeting)
  ├── QuickActionCard.tsx                (Reusable CTA card)
  ├── ProgressStatsCard.tsx              (Stats placeholder)
  ├── RecentScansCard.tsx                (List of recent sessions)
  └── GettingStartedGuide.tsx            (First-time guide)

/app/(dashboard)/dashboard/
  └── page.tsx                           (Main dashboard page)

/lib/
  └── dashboard/
      └── queries.ts                     (Fetch recent sessions)

/tests/unit/components/dashboard/
  ├── WelcomeHeader.test.tsx
  ├── QuickActionCard.test.tsx
  ├── RecentScansCard.test.tsx
  ├── GettingStartedGuide.test.tsx
  └── ProgressStatsCard.test.tsx

/tests/integration/
  └── 16-2-dashboard-home-page.spec.ts
```

### Component Dependencies

**shadcn/ui Components:**
- Card (for RecentScansCard, QuickActionCard, ProgressStatsCard)
- Button (for CTAs)
- Grid utilities (Tailwind)

**Next.js Utilities:**
- `getUser()` from `/lib/supabase/server.ts` (get current user)
- `useRouter()` from `next/navigation` (navigate on CTA click)

**Supabase:**
- Query recent sessions from optimization_sessions table
- Join with user profile for email/name data

### Testing Approach

**Unit Tests:**
- WelcomeHeader: Renders with correct first name from email
- QuickActionCard: onClick handler fires, shows correct text
- RecentScansCard: Displays list of sessions correctly
- GettingStartedGuide: Shows correct steps and button
- ProgressStatsCard: Shows all stats with correct labels

**Integration Tests:**
- User with 5 recent sessions: RecentScansCard shown with 5 items
- User with 0 sessions: GettingStartedGuide shown instead
- Click "New Scan": Navigates to `/app/scan/new`
- Click recent scan: Navigates to `/app/scan/[sessionId]`
- Welcome message: Shows correct first name from email
- All interactive elements: Keyboard accessible, screen reader friendly

### Previous Story Intelligence

**From Story 16.1 (Dashboard Layout):**
- Layout provides Sidebar and Header wrapper
- Auth protection at layout level (user is guaranteed to be authenticated)
- Page title should match route (use Header component from 16.1)

**From Epic 15 (Privacy Consent):**
- Sessions only created after user accepts privacy consent
- All sessions linked to authenticated user_id via RLS
- No cross-user data leakage due to RLS policies

**From Epic 10 (Optimization History):**
- Session data structure: id, created_at, resume_content, jd_content, analysis, suggestions, user_id
- Query pattern: `SELECT * FROM sessions WHERE user_id = <currentUserID> ORDER BY created_at DESC LIMIT 5`
- Sessions may not have all fields populated (handle null values gracefully)

### Git Intelligence

Recent commits show patterns:
- Story 16.1: Created 13 files, 400+ lines
- Epic 15-16 commits average: 8-15 files, 200-500 lines
- Commit format: `feat(story-16-2): [description] (#PR_NUMBER)`

This story will likely create:
- 5 dashboard components (250-400 lines)
- 1 main page file (100-150 lines)
- 1 queries/data file (50-100 lines)
- 5 unit test files (200-300 lines)
- 1 integration test file (150-250 lines)
- Estimated total: 11 files, 750-1200 lines

### Latest Tech Information

**Next.js 16 Server Components:**
- Page.tsx is Server Component by default ✓
- Can directly query database in page component ✓
- Client components with "use client" for interactive elements ✓

**Tailwind 4 Grid:**
- Grid utilities: `grid`, `grid-cols-1`, `md:grid-cols-2` ✓
- Gap utilities: `gap-4`, `gap-6`, `gap-8` ✓
- Container queries support for responsive components ✓

**shadcn/ui Card:**
- Unstyled base component - fully customizable ✓
- Works well with Tailwind for custom layouts ✓
- No breaking changes from recent versions ✓

### Project Context Reference

**Supabase Query Pattern** [Source: project-context.md]
- Use `/lib/supabase/` for database operations
- Transform snake_case (DB) to camelCase (TypeScript) at boundaries
- RLS policies automatically filter to current user

**Component Location:** [Source: project-context.md#Directory-Structure-Rules]
- Dashboard-specific components: `/components/dashboard/` ✓
- Shared components: `/components/shared/` (Sidebar, Header from 16.1) ✓
- Reusable cards can go in `/components/shared/` if used elsewhere

**Zustand Store:** [Source: project-context.md#Zustand-Store-Pattern]
- Dashboard page doesn't need store (stateless)
- Optional: Cache recent sessions in store if reused frequently
- More likely: Direct DB query in page component (simpler)

---

## Implementation Checklist

### Pre-Dev Verification
- [ ] Current branch is `feature/16-2-dashboard-home-page`
- [ ] Pull latest main: `git pull origin main`
- [ ] Verify TypeScript: `npm run build` passes
- [ ] Verify tests: `npm run test:all` passes

### Post-Implementation
- [ ] All TypeScript errors resolved
- [ ] All acceptance criteria verified (manual or automated)
- [ ] New components added to component index if applicable
- [ ] Comprehensive test coverage (unit + integration)

### Before Code Review
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing of recent scans and getting started guide
- [ ] Responsive design verified across breakpoints
- [ ] No console errors or warnings

---

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5

### Debug Log References

None yet - ready for dev-story workflow

### Completion Notes

- Story created with comprehensive context for developer
- All patterns documented with source references
- Component architecture specified with dependencies
- Testing approach outlined (unit + integration)
- Database query pattern referenced from Epic 10

### File List

_To be populated after implementation_

---

## Questions for Clarification

1. **Recent sessions display:** Should we show job title/company extracted from JD, or just filename + date? (Recommend: Both if available, fallback to filename + date)

2. **Progress stats:** Which real metrics should we use when data is available later? (Recommend: Total scans, average improvement %, last scan date)

3. **Session data structure:** Are session dates in `created_at` column? Should we calculate "days ago" or show full date? (Recommend: Show relative time "2 days ago", fallback to full date)

4. **First-time user:** What if user is authenticated but hasn't completed onboarding yet? (Recommend: Show getting started guide regardless, onboarding is separate flow)

5. **Caching strategy:** Should we cache recent sessions in Zustand, or query fresh on each page load? (Recommend: Query fresh for now, can optimize later)

---
