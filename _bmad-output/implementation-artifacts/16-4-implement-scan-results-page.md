# Story 16.4: Implement Scan Results Page

**Status:** ready-for-dev

**Epic:** Epic 16: Dashboard UI Architecture (V0.5)

**Depends On:**
- Story 16.1 (Dashboard Layout Foundation) COMPLETED ✓
- Story 16.3 (New Scan Page) COMPLETED ✓ - provides sessionId and analysis results
- Epic 5 (ATS Analysis & Scoring) COMPLETED ✓ - for score/breakdown/gap analysis
- Epic 11 (Score Comparison) COMPLETED ✓ - optional comparison feature

---

## Story

As a user,
I want to see my analysis results on a dedicated page,
So that I can understand my ATS score and gaps before viewing suggestions.

---

## Acceptance Criteria

1. **Given** I am on `/app/scan/[sessionId]` with completed analysis
   **When** the page loads
   **Then** I see the ATS Score prominently displayed (ATSScoreDisplay component)
   **And** the score displays large with color coding (0-100 scale)
   **And** the score is retrieved from database if not in store

2. **Given** the page loads with analysis data
   **When** I view the results
   **Then** I see the Score Breakdown by category (ScoreBreakdownCard component)
   **And** breakdown shows: Keywords, Skills, Experience, Format
   **And** each category shows percentage contribution to overall score

3. **Given** the page loads
   **When** I view the keyword analysis
   **Then** I see the Keyword Analysis (KeywordAnalysisDisplay component)
   **And** analysis shows: matched keywords, missing keywords, keyword count
   **And** keywords are organized by category (Skills, Technologies, Qualifications)

4. **Given** the page loads
   **When** I view the gap analysis
   **Then** I see Gap Summary cards (GapSummaryCard component)
   **And** cards show: top missing skills, recommended additions
   **And** cards are organized by priority/impact

5. **Given** I have viewed my analysis results
   **When** I am ready to see suggestions
   **Then** I see a prominent "View Suggestions" CTA button
   **And** clicking the button navigates to `/app/scan/[sessionId]/suggestions`
   **And** the button is visible and accessible (not hidden)

6. **Given** I have viewed analysis results
   **When** I want to start over or return home
   **Then** I see secondary actions: "New Scan", "Download Report" (placeholder)
   **And** "New Scan" navigates to `/app/scan/new`
   **And** "Download Report" shows placeholder (disabled or coming soon)

7. **Given** I visit `/app/scan/[sessionId]`
   **When** the sessionId is valid
   **Then** the session is loaded from database if not in store
   **And** analysis data is displayed correctly
   **And** if session not found in store or database, show error with link to start new scan

8. **Given** an error occurs (session not found, failed to load)
   **When** the page encounters the error
   **Then** an error message is displayed
   **And** a "New Scan" link is provided as recovery action

---

## Tasks / Subtasks

- [ ] Load scan session from database (AC: #7,8)
  - [ ] Create server function to fetch session by ID: `getSessionById(sessionId, userId)`
  - [ ] Query from sessions/optimization_sessions table
  - [ ] Return: id, created_at, resume_content, jd_content, analysis, suggestions, preferences, anonymous_id
  - [ ] Use RLS policies to ensure user can only access own sessions
  - [ ] Handle case where session not found (return null, not error)
  - [ ] Cache in Zustand store if not already loaded

- [ ] Create `/app/scan/[sessionId]/page.tsx` main results page (AC: All)
  - [ ] Server component that loads authenticated user
  - [ ] Extract sessionId from URL params
  - [ ] Load session from database via server function
  - [ ] Check if session exists; if not, show error (AC: #8)
  - [ ] Extract analysis data from session (atsScore, breakdown, keywordAnalysis, gaps)
  - [ ] Pass data to result display components
  - [ ] Render layout with components in order (see below)
  - [ ] Use responsive grid layout (mobile: single column, desktop: scrollable sections)

- [ ] Implement page layout and structure (AC: 1-6)
  - [ ] Page title: "Optimization Results"
  - [ ] Section 1: ATS Score Display (top, prominent)
  - [ ] Section 2: Score Breakdown (below score)
  - [ ] Section 3: Keyword Analysis (below breakdown)
  - [ ] Section 4: Gap Summary (below keyword analysis)
  - [ ] Section 5: CTA Button - "View Suggestions" (prominent, full-width or large)
  - [ ] Section 6: Secondary Actions - "New Scan", "Download Report" (small buttons below CTA)
  - [ ] Add spacing/padding between sections (gap-6 or gap-8)
  - [ ] Use max-width container (1280px) with centered content

- [ ] Implement ATSScoreDisplay component (AC: #1)
  - [ ] Component already exists in /components/shared - reuse
  - [ ] Pass props: score (0-100), color coding logic
  - [ ] Display score large (e.g., 72/100)
  - [ ] Show color: green (70+), yellow (50-69), red (<50)
  - [ ] Optional: Show brief interpretation ("Good Match", "Fair Match", etc.)

- [ ] Implement ScoreBreakdownCard component (AC: #2)
  - [ ] Component already exists in /components/shared - reuse
  - [ ] Pass props: breakdown data (keywords%, skills%, experience%, format%)
  - [ ] Display as progress bars or cards showing each category
  - [ ] Each category shows percentage and visual indicator
  - [ ] Responsive: stack on mobile, side-by-side on desktop

- [ ] Implement KeywordAnalysisDisplay component (AC: #3)
  - [ ] Component already exists in /components/shared - reuse
  - [ ] Pass props: matched keywords, missing keywords
  - [ ] Display matched keywords (found in resume)
  - [ ] Display missing keywords (in JD but not in resume)
  - [ ] Organize by category if available (Skills, Technologies, Qualifications)
  - [ ] Show keyword count: "Found 24 of 35 keywords"

- [ ] Implement GapSummaryCard component (AC: #4)
  - [ ] Component already exists in /components/shared - reuse
  - [ ] Display gap analysis results
  - [ ] Show top missing skills or recommended additions
  - [ ] Prioritize by impact/frequency
  - [ ] Use card layout with icons/badges
  - [ ] Responsive: stack on mobile, grid on desktop

- [ ] Create "View Suggestions" CTA button (AC: #5)
  - [ ] Large, prominent button (primary color, purple #635BFF)
  - [ ] Text: "View Suggestions"
  - [ ] On click: Navigate to `/app/scan/[sessionId]/suggestions`
  - [ ] Use `useRouter()` from `next/navigation`
  - [ ] Button is full-width or at least 240px minimum width
  - [ ] Button is always visible (not hidden behind scroll)
  - [ ] Optional: Show brief tooltip/hint about what suggestions include

- [ ] Create secondary action buttons (AC: #6)
  - [ ] "New Scan" button (secondary variant)
    - On click: Navigate to `/app/scan/new`
    - Clears previous session state from Zustand store
  - [ ] "Download Report" button (tertiary/disabled variant)
    - Shows placeholder text: "Coming soon"
    - Or disabled state if not implemented
    - Hint: "PDF report feature coming in next version"

- [ ] Add error handling for missing sessions (AC: #7,8)
  - [ ] If sessionId is invalid (not a UUID): show error message
  - [ ] If session not found in database: show "Session not found" message
  - [ ] If analysis data is incomplete: show "Analysis incomplete" message
  - [ ] Provide recovery action: "Start New Scan" button → navigates to /app/scan/new
  - [ ] Use ErrorDisplay component for consistent error styling
  - [ ] Include error code (SESSION_NOT_FOUND, ANALYSIS_INCOMPLETE)

- [ ] Create session loading logic (AC: #7)
  - [ ] Create `/lib/scan/queries.ts` with `getSessionById(sessionId, userId)`
  - [ ] Query database for session by ID + user ownership
  - [ ] Cache result in Zustand store
  - [ ] Check if session already in store first (avoid redundant queries)
  - [ ] Handle RLS enforcement automatically (Supabase RLS)
  - [ ] Return ActionResponse with session or error

- [ ] Implement responsive page layout (AC: All)
  - [ ] Desktop (≥1024px): Full-width sections, 2-column grid for some elements
  - [ ] Tablet (768px-1024px): Single column, 2-column for breakdown if space
  - [ ] Mobile (<768px): Single column, cards stack vertically
  - [ ] All components fill available width responsively
  - [ ] No horizontal scroll on any breakpoint
  - [ ] Touch-friendly button sizes (min 44px height for mobile)

- [ ] Add loading and error states (AC: All)
  - [ ] Show skeleton loader while fetching session from database
  - [ ] Handle missing session ID (show error immediately)
  - [ ] Handle failed database query (show error message)
  - [ ] Handle incomplete analysis data (show partial results if available)
  - [ ] No console errors or unhandled promises

- [ ] Create comprehensive tests (AC: All)
  - [ ] Create `/tests/unit/lib/scan/queries.test.ts`
    - Test getSessionById with valid sessionId
    - Test getSessionById with invalid sessionId
    - Test RLS enforcement (user can only access own sessions)
    - Mock Supabase responses
  - [ ] Create `/tests/integration/16-4-scan-results-page.spec.ts`
    - Test: Load valid session → displays all result components
    - Test: Valid sessionId, load from database → displays correctly
    - Test: Invalid sessionId → shows error message
    - Test: Session not found → shows "Session not found" error
    - Test: Click "View Suggestions" → navigates to suggestions page
    - Test: Click "New Scan" → navigates to /app/scan/new
    - Test: Responsive layout on mobile/tablet/desktop
    - Test: Accessibility (keyboard nav, screen readers)

---

## Dev Notes

### Architecture Overview

Story 16.4 implements the dedicated results page showing analysis output. It displays the ATS score, breakdown, keyword analysis, and gaps - all from the completed optimization pipeline (Epics 3-5). Users can then navigate to the suggestions page (Story 16.5) for recommendations.

**Key Dependencies:**
- Session data from `/api/optimize` (called in Story 16.3)
- Result display components: ATSScoreDisplay, ScoreBreakdownCard, KeywordAnalysisDisplay, GapSummaryCard
- Session database queries (RLS enforced)
- Route navigation via useRouter()

### Critical Patterns & Constraints

**Server Component Pattern** [Source: project-context.md]
- Page is Server Component (direct DB access)
- Auth protection via layout (16.1)
- Use `getUser()` from `/lib/supabase/server.ts`
- Load session data server-side, pass to client components

**Database Query Pattern** [Source: project-context.md#API-Patterns]
- Use RLS policies for automatic user filtering
- Query: SELECT * FROM sessions WHERE id = $1 AND user_id = <current_user_id>
- Handle null results gracefully (not found)
- Cache in Zustand store to avoid re-fetching

**Navigation Pattern** [Source: Story 16.1]
- Use `useRouter()` from `next/navigation`
- Route constants in `/lib/constants/routes.ts`
- ROUTES.APP.SCAN.NEW for `/app/scan/new`
- ROUTES.APP.SCAN.SESSION(sessionId) for dynamic results page

**Component Reuse**
- ATSScoreDisplay: Already exists, just pass score prop
- ScoreBreakdownCard: Already exists, pass breakdown prop
- KeywordAnalysisDisplay: Already exists, pass keywords prop
- GapSummaryCard: Already exists, pass gaps prop
- ErrorDisplay: Reuse for error states

### File Structure & Components to Use/Create

```
/app/(dashboard)/scan/
  └── [sessionId]/
      └── page.tsx                       (NEW: Results page)

/lib/scan/
  ├── queries.ts                         (NEW: getSessionById)
  └── index.ts                           (NEW: Barrel export)

/components/shared/
  ├── ATSScoreDisplay.tsx                (EXISTING: Reuse)
  ├── ScoreBreakdownCard.tsx             (EXISTING: Reuse)
  ├── KeywordAnalysisDisplay.tsx         (EXISTING: Reuse)
  ├── GapSummaryCard.tsx                 (EXISTING: Reuse)
  └── ErrorDisplay.tsx                   (EXISTING: Reuse)

/tests/unit/lib/scan/
  └── queries.test.ts

/tests/integration/
  └── 16-4-scan-results-page.spec.ts
```

### Component Dependencies

**Existing Result Display Components:**
- ATSScoreDisplay: Displays score with color coding
- ScoreBreakdownCard: Shows category breakdown (Keywords, Skills, Experience, Format)
- KeywordAnalysisDisplay: Lists matched/missing keywords
- GapSummaryCard: Shows gap analysis and recommendations
- ErrorDisplay: Shows error messages

**shadcn/ui Components:**
- Button (for CTAs and secondary actions)
- Card (if needed for section containers)

**Next.js Utilities:**
- `useRouter()` from `next/navigation` (for navigation)
- Server-side queries in page.tsx

**Supabase:**
- Query sessions table by ID + user_id
- RLS policies enforce access control

### Testing Approach

**Unit Tests:**
- getSessionById: Valid/invalid sessionId, RLS enforcement

**Integration Tests:**
- Full flow: Load valid session → display all components
- Error flows: Invalid sessionId, session not found
- Navigation: View Suggestions, New Scan buttons
- Responsive design across breakpoints
- Accessibility: Keyboard nav, screen readers

### Previous Story Intelligence

**From Story 16.3 (New Scan Page):**
- Session created and returned with ID
- Analysis results stored in session (atsScore, breakdown, keywordAnalysis, gaps)
- Redirect to `/app/scan/[sessionId]` after analysis

**From Story 16.2 (Dashboard Home Page):**
- Session loading patterns
- Query result components
- Responsive layout patterns

**From Story 16.1 (Dashboard Layout):**
- Page uses shared layout wrapper
- Auth protection at layout level
- Header displays page title

**From Epic 5 (ATS Analysis & Scoring):**
- Result data structure: atsScore, breakdown (categories with percentages)
- Keyword analysis: matched keywords, missing keywords
- Gap analysis: top missing skills, recommendations

**From Epic 11 (Score Comparison) - Optional:**
- ScoreComparison component for original vs projected comparison
- Can be added to results page if desired (not required for this story)

### Git Intelligence

Recent commits (16.1-16.3):
- File count: 8-16 per story
- Lines: 400-800 per story
- Average: Component reuse reduces file count

This story will likely:
- Reuse 5 existing result components (no changes)
- Create 1 page file (page.tsx)
- Create 1 queries file (queries.ts)
- Create 2 test files
- Estimated: 4-6 files, 300-500 lines (component reuse reduces total)

### Latest Tech Information

**Next.js 16 Dynamic Routes:**
- `/app/scan/[sessionId]` is dynamic route ✓
- Router params available in page.tsx via params prop ✓
- Can coexist with `/app/scan/new` static route ✓

**React 19 Use Client:**
- Button clicks need "use client" in component ✓
- Server component (page.tsx) can pass data to client components ✓

**Tailwind 4:**
- Responsive grid: `grid-cols-1 md:grid-cols-2` ✓
- Gap utilities: `gap-6`, `gap-8` ✓
- Max-width: `max-w-7xl` ✓

### Project Context Reference

**Database Queries** [Source: project-context.md]
- Use `/lib/supabase/` for operations
- Transform snake_case (DB) to camelCase (TypeScript)
- RLS policies automatically filter to current user

**Component Location:** [Source: project-context.md#Directory-Structure-Rules]
- Scan-specific: `/components/scan/` (or reuse shared)
- Shared: `/components/shared/` ✓
- Queries: `/lib/scan/` ✓

**Navigation:** [Source: Story 16.1]
- Use route constants from `/lib/constants/routes.ts`
- useRouter() from next/navigation

---

## Implementation Checklist

### Pre-Dev Verification
- [ ] Current branch is `feature/16-4-scan-results-page`
- [ ] Pull latest main: `git pull origin main`
- [ ] Verify TypeScript: `npm run build` passes
- [ ] Verify tests: `npm run test:all` passes
- [ ] Review existing result display components (ATS, Breakdown, Keywords, Gaps)

### Post-Implementation
- [ ] All TypeScript errors resolved
- [ ] All acceptance criteria verified
- [ ] Session loading from database works
- [ ] Result components display correctly
- [ ] Navigation buttons work (View Suggestions, New Scan)

### Before Code Review
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing: Load valid session → display results
- [ ] Error handling tested (invalid sessionId, session not found)
- [ ] Responsive design verified across breakpoints
- [ ] Navigation tested (Suggestions, New Scan)

---

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5

### Debug Log References

None yet - ready for dev-story workflow

### Completion Notes

- Story created with comprehensive context for developer
- All patterns documented with source references
- Component reuse identified (5 existing result components)
- New components minimal (page.tsx + queries.ts)
- Testing approach outlined (unit + integration)
- Database and navigation patterns referenced

### File List

_To be populated after implementation_

---

## Questions for Clarification

1. **Session loading priority:** Should we check Zustand store first or always reload from database? (Recommend: Check store first for UX, fallback to DB if not found)

2. **Incomplete analysis:** What should we show if analysis results are partially missing? (Recommend: Show available data, indicate what's missing with "Analysis incomplete" note)

3. **Score interpretation text:** Should we show text like "Good Match" (70+) or just the number? (Recommend: Show both for clarity)

4. **Download Report feature:** Should we stub it out as disabled, or remove it entirely? (Recommend: Show as "Coming soon" with disabled state)

5. **ScoreComparison display:** Should we include the before/after comparison from Story 11.3 on this page? (Recommend: Not yet - keep focused on results; suggestions page will show comparison)

---
