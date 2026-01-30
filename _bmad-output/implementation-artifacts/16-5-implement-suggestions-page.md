# Story 16.5: Implement Suggestions Page

**Epic:** 16 - Dashboard UI Architecture (V0.5)
**Status:** ready-for-dev
**Story Key:** 16-5-implement-suggestions-page

---

## User Story

As a user,
I want to view and interact with optimization suggestions on a dedicated page,
So that I can focus on improving my resume section by section.

---

## Acceptance Criteria

**AC#1: Suggestions Page Structure**
- [ ] Page renders at `/app/scan/[sessionId]/suggestions` with completed suggestions
- [ ] Session is loaded from database using RLS-enforced `getSessionById(sessionId, userId)`
- [ ] If session not found or has no suggestions, display error message with link to start new scan
- [ ] Page title in header displays "Suggestions" with session indicator (optional)
- [ ] Server component handles data loading; client component handles interactivity

**AC#2: Section Navigation**
- [ ] Suggestions are organized by section: Summary, Skills, Experience
- [ ] Sections render via tabs (Tab component from shadcn/ui) OR accordion (Accordion component)
- [ ] User can switch between sections without losing state
- [ ] Active section is visually highlighted

**AC#3: Section-Specific Suggestion Display**
- [ ] Each section displays SuggestionDisplay component (reused from existing)
- [ ] For each suggestion:
  - Original text visible in original color
  - Suggested text visible in highlighted color (or via before/after comparison)
  - "Why this works" explanation text from Epic 14 displays below suggestion (if present)
  - Explanation styled with light blue background + 💡 icon (from Epic 14 implementation)
- [ ] Suggestions without explanations gracefully degrade (no explanation section shown)

**AC#4: Suggestion Interaction Features**
- [ ] Copy to clipboard button on each suggestion:
  - Copies the suggested text (not the original)
  - Shows toast notification "Copied to clipboard"
  - Visual button state feedback (checkmark or "Copied" text for 2s)
  - Completes in < 100ms
- [ ] Thumbs up/down feedback buttons (from Epic 7):
  - User can provide feedback on each suggestion
  - Feedback state persists during session
  - Visual feedback confirms selection (highlight state changes)
  - User can change their selection
- [ ] Regenerate section button:
  - Regenerates suggestions for current section only
  - Shows loading state during regeneration
  - New suggestions replace old ones
  - User can regenerate multiple times

**AC#5: Score Comparison Display (from Story 11.3)**
- [ ] "Score Comparison" section displays prominently above or beside suggestions:
  - Original ATS score (from `/app/scan/[sessionId]`)
  - Projected optimized score (calculated based on suggestion point values)
  - Improvement delta calculated: new score - original score
  - Visual indicators: progress rings, color coding (red→yellow→green), percentage improvement
  - "Potential Improvement: +X points if all suggestions applied"
- [ ] Score comparison updates in real-time as user marks suggestions

**AC#6: Section Summary Cards**
- [ ] Before each section's suggestions, show a summary card with:
  - Section name (Summary, Skills, Experience)
  - Number of suggestions available for this section
  - Current section score vs recommended improvements
  - Brief description of what will be improved in this section

**AC#7: Call-to-Action Buttons**
- [ ] "Apply All Suggestions" button (future feature):
  - Currently disabled or shows tooltip "Coming soon"
  - Placeholder for batch application feature
- [ ] "Back to Results" link:
  - Navigates to `/app/scan/[sessionId]`
  - Preserves session state
- [ ] "New Scan" action:
  - Navigates to `/app/scan/new`
  - Creates fresh session (clears store)
- [ ] "Download Report" button (placeholder):
  - Shows tooltip "Coming soon"
  - Disabled state

**AC#8: Mobile Responsiveness**
- [ ] Sections render as stacked accordion on mobile (< 768px)
- [ ] Suggestion cards reflow to single column on mobile
- [ ] Buttons stack and become full-width on mobile
- [ ] Copy/feedback buttons remain accessible and touchable
- [ ] Header and navigation adapt to mobile (use existing Header/MobileNav)

**AC#9: State Management**
- [ ] Session data flows from server to client: `getSessionById()` → page props → client component
- [ ] Suggestion interactions (copy, feedback) stored in Zustand if needed for analytics
- [ ] Page refresh reloads session from database (no state loss)
- [ ] Navigation away and back to page reloads session from DB

**AC#10: Error Handling**
- [ ] Session not found: Display error message "Session not found" + "Start a new scan" button
- [ ] No suggestions generated: Display message "Suggestions are being generated. Please check back in a moment." + reload button
- [ ] API failures during regeneration: Display error toast with retry button
- [ ] Network errors: Show ErrorDisplay component from existing implementation

---

## Implementation Strategy

### Component Architecture

This story reuses 5 existing components to minimize duplication:

| Component | From Epic | Purpose | Usage in 16.5 |
|-----------|-----------|---------|---------------|
| `SuggestionDisplay` | Epic 6 | Displays original + suggested text | Render for each suggestion in each section |
| `ATSScoreDisplay` | Epic 5 | Large ATS score circle visual | Display in score comparison section |
| `CopyToClipboard` | Epic 6 | Copy button with toast feedback | Attached to each suggestion |
| `ErrorDisplay` | Epic 7 | Error message + recovery actions | Show session not found, API errors |
| `Accordion` / `Tabs` | shadcn/ui | Section navigation | Organize suggestions by section |

**New Component: None** - All functionality fits within existing patterns.

**New Sub-Components:**
- `SectionSummaryCard.tsx`: Card showing section stats (count, score impact)
- `ScoreComparisonSection.tsx`: Displays before/after score comparison with delta calculation

### Route Architecture

```
/app/scan/[sessionId]/suggestions
  ├── page.tsx (Server Component)
  ├── ClientSuggestionsPage.tsx (Client Component)
  └── Uses route.ts with dynamic params
```

**Server Component** (`page.tsx`):
1. Extract `sessionId` from `params`
2. Get authenticated user via `getUser()`
3. Load session from DB: `const session = await getSessionById(sessionId, userId)`
4. Check if session exists and has suggestions
5. Pass session data as props to client component

**Client Component** (`ClientSuggestionsPage.tsx`):
1. Receive session data as props
2. Initialize Zustand store with session data (if needed for interactions)
3. Render section tabs/accordion
4. Handle user interactions (copy, feedback, regenerate)
5. Update score comparison in real-time based on suggestions applied

### Data Flow

```
Server: getSessionById(sessionId, userId)
  → RLS-enforced DB query with user_id filter
  → Returns: { session data with suggestions array }
      ├── resumeContent
      ├── jdContent
      ├── preferences (Job Type, Modification Level)
      ├── analysis (ATS score, keyword analysis)
      ├── suggestions {
      │   ├── summary: SummarySuggestion[]
      │   ├── skills: SkillsSuggestion[]
      │   └── experience: ExperienceSuggestion[]
      │   (each includes: original, suggested, points, explanation)
      └── timestamp

Client: Render suggestions
  → Parse suggestions by section
  → Display tabs/accordion
  → Handle interactions (copy, feedback)
  → Calculate projected score based on selected suggestions
```

### File Structure

**New files:**
```
/app/app/(dashboard)/scan/[sessionId]/suggestions/
├── page.tsx (Server Component - session loading)
├── ClientSuggestionsPage.tsx (Client Component - rendering + interaction)
├── SectionSummaryCard.tsx (Summary card for each section)
└── ScoreComparisonSection.tsx (Score comparison + delta calculation)
```

**Modified files:**
```
/lib/dashboard/queries.ts
├── Add getSessionById(sessionId, userId) function
└── Query: SELECT * FROM sessions WHERE id = $1 AND user_id = $2
```

**No modifications needed:**
- Existing components (SuggestionDisplay, CopyToClipboard, ErrorDisplay) are fully reusable
- Zustand store (useOptimizationStore) is optional for this story (session data comes from DB)
- Authentication is handled by existing getUser() in layout

### Technical Requirements

**From Architecture** (project-context.md):

1. **ActionResponse Pattern**: Not applicable (this is a display page, no server actions needed)
2. **Error Codes**: Use in error display if needed (VALIDATION_ERROR, LLM_ERROR)
3. **Naming Conventions**:
   - Database: snake_case (session_id, user_id, created_at)
   - Components: PascalCase (SectionSummaryCard, ClientSuggestionsPage)
   - Props: camelCase (sessionId, userId, suggestionsData)
4. **Security**:
   - RLS enforced via getSessionById() - user_id filter prevents unauthorized access
   - User content (resume, JD) not exposed to client unless in stored session
5. **TypeScript**: Strict mode - all props and state fully typed
6. **Styling**: Tailwind 4.x + shadcn/ui components (Card, Tabs, Button, Badge)

### Testing Approach

**Unit Tests:**
- `SectionSummaryCard.tsx`: Render section stats correctly
- `ScoreComparisonSection.tsx`: Calculate projected score correctly (test point calculations)
- Score delta calculation: 45 → 72 = +27 points displayed correctly

**Integration Tests:**
- Server: `getSessionById()` returns correct session with RLS filtering
- Server: Unauthenticated users get 404 / redirect
- Client: Suggestions render by section without errors
- Client: Copy button copies correct text (not original)
- Client: Feedback buttons toggle state without losing other interactions
- Client: Regenerate button calls API and updates suggestions
- Client: Page refresh reloads from DB (no state loss)
- Client: Navigation back/forward preserves scroll position (optional)

**E2E Tests (Playwright):**
- Complete flow: View results → Click "Suggestions" → See suggestions → Copy one → See toast
- Verify score comparison shows correct improvement calculation
- Verify explanations display correctly (if present from Epic 14)
- Test on mobile: Sections stack as accordion, all buttons accessible
- Test error states: Session not found, no suggestions yet

---

## Task Breakdown

### Task 1: Set Up Page Structure & Routing (AC#1)
- [ ] Create `/app/app/(dashboard)/scan/[sessionId]/suggestions/` directory
- [ ] Create `page.tsx` (Server Component):
  - Extract sessionId from params
  - Call getUser() for authentication
  - Load session via getSessionById(sessionId, userId)
  - Handle session not found case (404 or error display)
  - Check if session has suggestions array (if not, show "generating" message)
  - Pass session data as props to client component
- [ ] Create `ClientSuggestionsPage.tsx` (Client Component):
  - Accept session data as props
  - Render main layout with header and content area
  - Export as default from page.tsx

### Task 2: Implement Section Navigation (AC#2)
- [ ] Add Tabs component from shadcn/ui to ClientSuggestionsPage:
  - Create 3 tabs: Summary, Skills, Experience
  - Store active tab in state (useState)
  - Render tab content dynamically based on active tab
- [ ] Alternative: Use Accordion if preferred for mobile-first design
  - Test both approaches on desktop and mobile
  - Choose based on UX feel

### Task 3: Implement Section Summary Cards (AC#6)
- [ ] Create `SectionSummaryCard.tsx`:
  - Accepts props: section name, suggestion count, current score, improvement potential
  - Displays: Section name, X suggestions available, visual score impact badge
  - Style: Card component from shadcn/ui with subtle background
- [ ] Render summary card above each section's suggestions
- [ ] Calculate improvement potential from suggestion point values

### Task 4: Implement Suggestion Display & Interaction (AC#3, AC#4)
- [ ] Render SuggestionDisplay component for each suggestion:
  - Pass original and suggested text
  - SuggestionDisplay already handles side-by-side/before-after rendering
- [ ] Add "Why this works" explanation below each suggestion:
  - Check if suggestion.explanation exists (from Epic 14)
  - If present: render with light blue background + 💡 icon
  - If absent: gracefully skip (no explanation section shown)
- [ ] Add CopyToClipboard button to each suggestion:
  - Reuse existing CopyToClipboard component from Epic 6
  - Ensure it copies the **suggested** text (not original)
- [ ] Add thumbs up/down feedback buttons:
  - Create FeedbackButtons sub-component or inline
  - Store feedback state in local component state
  - Visual feedback: button highlight changes on selection
  - Allow user to change selection

### Task 5: Implement Regenerate Suggestions (AC#4)
- [ ] Add "Regenerate" button for each section:
  - Button text: "Get Different Suggestions"
  - On click: Show loading state (spinner), call `/api/regenerate-suggestions`
  - Pass: sessionId, section (summary/skills/experience)
  - On response: Update suggestions array for that section
  - On error: Show error toast with retry option
- [ ] Test: Can user regenerate multiple times?
- [ ] Test: Does regeneration preserve suggestions from other sections?

### Task 6: Implement Score Comparison Section (AC#5)
- [ ] Create `ScoreComparisonSection.tsx`:
  - Accepts props: originalScore, suggestionsWithPoints[], selectedSuggestions[]
  - Calculate projectedScore: originalScore + sum of points from selected suggestions
  - Calculate delta: projectedScore - originalScore
  - Render with ATSScoreDisplay component (reused from Epic 5):
    - Original score on left (gray or neutral color)
    - Projected score on right (green or success color)
    - Delta prominently displayed: "+X points" or "X% improvement"
  - Use visual indicators: progress rings, color coding, percentage
  - Display: "Apply the suggestions above to improve your ATS score"
- [ ] Integrate with suggestion interactions:
  - If user selects/deselects a suggestion, recalculate projection
  - Score comparison updates in real-time
- [ ] Render score comparison section above or beside suggestion sections

### Task 7: Implement Call-to-Action Buttons (AC#7)
- [ ] Add "Back to Results" link:
  - Navigate to `/app/scan/[sessionId]`
  - Use Link component from Next.js or useRouter().push()
- [ ] Add "New Scan" action:
  - Navigate to `/app/scan/new`
  - Clear Zustand store before navigating (store.reset())
  - Create fresh session
- [ ] Add placeholder buttons (disabled):
  - "Apply All Suggestions" → tooltip "Coming soon"
  - "Download Report" → tooltip "Coming soon"
- [ ] Position buttons: Bottom of page or in header (design choice)

### Task 8: Implement Mobile Responsiveness (AC#8)
- [ ] Test Tabs/Accordion on mobile:
  - If using Tabs: Switch to Accordion on mobile via CSS/responsive classes
  - If using Accordion: Verify works well on small screens
- [ ] Test button layout on mobile:
  - Buttons stack vertically (full-width) on mobile
  - Copy/feedback buttons remain touchable
  - Use responsive Tailwind classes: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- [ ] Verify SectionSummaryCard reflows on mobile
- [ ] Check Header and MobileNav adaptation (already handled by Story 16.1)

### Task 9: Implement Error Handling (AC#10)
- [ ] Session not found:
  - Render ErrorDisplay component with message: "Session not found"
  - Provide button: "Start a new scan" → navigate to `/app/scan/new`
- [ ] No suggestions generated:
  - Render message: "Suggestions are being generated. Please check back in a moment."
  - Provide button: "Refresh page" or auto-refresh after 5s
- [ ] Regenerate API failure:
  - Show error toast: "Failed to regenerate. Please try again."
  - Keep original suggestions displayed
  - Show retry button
- [ ] Handle 404, permission errors via existing error boundaries

### Task 10: Add Database Query Function (AC#1)
- [ ] Update `/lib/dashboard/queries.ts`:
  - Add `getSessionById(sessionId: string, userId: string): Promise<Session>`
  - Query: `SELECT * FROM sessions WHERE id = $1 AND user_id = $2`
  - RLS policy automatically filters by user_id
  - Return type: `Session` with all fields including suggestions array
  - Handle not found: return null or throw error

### Task 11: Add Types & Schemas
- [ ] Verify Session type includes suggestions field:
  - `suggestions: { summary: SummarySuggestion[], skills: SkillsSuggestion[], experience: ExperienceSuggestion[] }`
  - Each suggestion: `{ original, suggested, points, explanation?, feedback? }`
- [ ] Create props types:
  - `ClientSuggestionsPageProps`: session data
  - `SectionSummaryCardProps`: section stats
  - `ScoreComparisonProps`: score data

### Task 12: Create Tests
- [ ] Unit tests:
  - SectionSummaryCard renders correctly with passed props
  - ScoreComparisonSection calculates projected score correctly (mock data)
  - Delta calculation: 45 + 27 points = 72 (verify math)
- [ ] Integration tests:
  - getSessionById() returns session with RLS filtering
  - Unauthenticated request fails
  - Client suggestions render without errors
  - Copy button copies correct text
  - Feedback state changes without losing other interactions
  - Regenerate updates suggestions correctly
- [ ] E2E tests:
  - Complete flow: Results page → Suggestions page → Copy → Toast
  - Mobile accordion renders correctly
  - Score comparison shows correct improvement

---

## Component Reuse Summary

| Component | Epic | Reuse in 16.5 |
|-----------|------|--------------|
| `SuggestionDisplay.tsx` | 6 | Render each suggestion with original + suggested text |
| `CopyToClipboard.tsx` | 6 | Copy button on each suggestion |
| `ATSScoreDisplay.tsx` | 5 | Display scores in score comparison section |
| `ErrorDisplay.tsx` | 7 | Show error when session not found |
| `Tabs` / `Accordion` | shadcn/ui | Navigate between Summary/Skills/Experience sections |
| `Card` | shadcn/ui | Section summary cards, suggestion containers |
| `Button` | shadcn/ui | Regenerate, New Scan, Back to Results |
| `Badge` | shadcn/ui | Point values, section indicators |
| `Toast` (via sonner) | existing | Feedback for copy, errors, regenerate |

**DRY Approach:** No duplicate components created. Every component reused from previous stories or shadcn/ui.

---

## Latest Tech Information

**Next.js 16 (App Router):**
- Dynamic routes: `[sessionId]` syntax for URL params
- Server Components as default (page.tsx)
- Client Components: Marked with `"use client"` directive
- Data fetching: Server-only in page.tsx or via server actions

**shadcn/ui (Latest):**
- Tabs component: Provides tab interface with smooth switching
- Accordion component: Collapsible sections (alternative to tabs)
- Card: Container component with rounded borders and shadow
- Button: All states (default, hover, active, disabled, loading)
- Badge: Small status indicators

**Zustand (Latest):**
- Optional for this story (session data comes from DB)
- If used: Can store feedback state for analytics
- Pattern: `const store = useOptimizationStore(); store.addFeedback(suggestionId, 'up')`

**Supabase RLS (Latest):**
- Automatic row filtering based on authenticated user
- Query in app code: `WHERE user_id = $1` handled by RLS policy
- If session.user_id doesn't match authenticated user_id, Supabase returns 0 rows

**API Endpoint Pattern:**
- Regenerate suggestions: `/api/regenerate-suggestions` (POST)
- Request: `{ sessionId, section: 'summary' | 'skills' | 'experience' }`
- Response: `{ data: { suggestions }, error: null }` (ActionResponse pattern)

---

## Integration Points

**From Previous Stories:**

**Story 16.1 (Dashboard Layout Foundation):**
- Inherits Sidebar + Header + MobileNav layout
- No additional routing setup needed
- MobileNav hamburger works out of the box

**Story 16.4 (Scan Results Page):**
- Session is loaded in results page
- "View Suggestions" button navigates to this page
- Session data is passed via route params, not props
- This story loads same session from DB independently

**Story 14.3 (Render Explanations in UI):**
- Explanations are stored in suggestions array
- This story simply displays them below each suggestion
- No changes to explanation generation needed

**Story 11.3 (Score Comparison):**
- Score comparison UI already designed in results page
- This story renders similar component in suggestions page
- Point values are already stored in suggestions array

**Story 7 (Error Handling & Feedback):**
- ErrorDisplay component ready to reuse
- Error codes (VALIDATION_ERROR, LLM_ERROR) already defined
- Toast notifications (via sonner) already integrated

---

## Git Intelligence

**From recent commits (Stories 16.1-16.4):**

**Pattern 1: Server/Client Component Boundary**
```typescript
// page.tsx (Server)
export default async function SuggestionsPage({ params }) {
  const session = await getSessionById(params.sessionId, userId);
  return <ClientSuggestionsPage session={session} />;
}

// ClientSuggestionsPage.tsx (Client, marked with "use client")
'use client';
export function ClientSuggestionsPage({ session }) { ... }
```

**Pattern 2: Component Reuse**
Stories 16.2-16.4 aggressively reuse components from Epics 3-7 instead of reimplementing. This story continues that pattern:
- Use existing SuggestionDisplay, CopyToClipboard, ATSScoreDisplay
- Create only NEW functionality (SectionSummaryCard, ScoreComparisonSection)

**Pattern 3: Error Handling**
```typescript
if (!session) {
  return <ErrorDisplay
    message="Session not found"
    code="VALIDATION_ERROR"
    action={{ label: "Start new scan", href: "/app/scan/new" }}
  />;
}
```

**Pattern 4: Responsive Design**
Use Tailwind responsive classes: `hidden md:block`, `flex flex-col md:flex-row`, `w-full md:w-1/2`

**Pattern 5: Form & State Management**
- Simple state: `useState()` for active tab, feedback selection
- Complex state: Could use Zustand store for feedback tracking (optional)
- Don't over-engineer: Keep it simple for this story

---

## Acceptance Criteria Mapping

| AC# | Tasks | Testing |
|-----|-------|---------|
| AC#1 | Task 1, 10 | Integration: getSessionById works + page loads |
| AC#2 | Task 2 | Unit: Tabs switch sections; Integration: state preserved |
| AC#3 | Task 4 | Unit: SuggestionDisplay renders; Integration: all suggestions shown |
| AC#4 | Task 4, 5 | Unit: Copy button works; Integration: feedback persists |
| AC#5 | Task 6 | Unit: Score calculation; Integration: real-time update |
| AC#6 | Task 3 | Unit: SectionSummaryCard renders correctly |
| AC#7 | Task 7 | E2E: Button navigation works |
| AC#8 | Task 8 | E2E: Mobile layout responsive, touchable |
| AC#9 | Task 1, 2 | Integration: Page refresh reloads from DB |
| AC#10 | Task 9 | Integration: Error states display correctly |

---

## Previous Story Learnings

**From Story 16.4 (Scan Results Page):**
- Use server component to load session data with RLS enforcement
- Pass session data as props to client component
- Avoid calling APIs from client when data is already available from DB
- Route params: `[sessionId]` automatically typed by Next.js

**From Story 16.3 (New Scan Page):**
- Privacy consent gating is already handled by previous story
- When creating new session, call `store.reset()` to clear previous state
- Field name transformation (camelCase ↔ snake_case) happens at API boundary

**From Story 16.2 (Dashboard Home Page):**
- Component reuse prevents duplication and maintains consistency
- Use route constants from `/lib/constants/routes.ts` for navigation
- Server functions in `/lib/dashboard/queries.ts` follow RLS-enforced patterns

**From Story 16.1 (Dashboard Layout Foundation):**
- Sidebar + Header + MobileNav are inherited by all dashboard routes
- Auth check in root layout protects all `/app/*` routes
- No additional auth logic needed in this page

---

## Potential Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Performance: Large suggestion arrays | Virtualize list if > 20 suggestions per section |
| UX: Score comparison confusion | Add tooltip explaining point calculation |
| Mobile: Crowded button layout | Stack buttons vertically, make full-width |
| State sync: Copy feedback state to DB | Mark as optional; store locally is sufficient for MVP |
| Explanation missing: Graceful degradation | Check `if (suggestion.explanation)` before rendering |

---

## Ready-for-Dev Checklist

- [x] Story context document created with comprehensive implementation guidance
- [x] Acceptance criteria clearly defined and testable
- [x] 12 tasks broken down with clear subtasks
- [x] Component reuse strategy documented (5 existing components)
- [x] File structure defined (4 new files, 1 modified file)
- [x] Error handling patterns established
- [x] Testing approach outlined (unit, integration, E2E)
- [x] Technical requirements from architecture satisfied
- [x] Integration points with previous stories mapped
- [x] Recent commit patterns analyzed and documented
- [x] Git branch created: `feature/16-5-suggestions-page`
- [x] Project structure aligned with existing patterns

**This story is comprehensive and ready for implementation.**

---

## References

- **Epic 16 Spec**: [See epics.md Story 16.5](../../planning-artifacts/epics.md#story-165-implement-suggestions-page)
- **Architecture Patterns**: [See project-context.md](../project-context.md)
- **Component Docs**: Story 6 (SuggestionDisplay), Story 5 (ATSScoreDisplay), Story 7 (ErrorDisplay)
- **Dashboard Layout**: Story 16.1 (Sidebar, Header, MobileNav)
- **RLS Queries**: Story 16.4 (getSessionById pattern)
- **shadcn/ui Tabs**: [Tabs Component](https://ui.shadcn.com/docs/components/tabs)
- **shadcn/ui Accordion**: [Accordion Component](https://ui.shadcn.com/docs/components/accordion)

---

## Dev Agent Record

### Status
✅ Story context created - Ready for dev-story workflow execution

### Model
claude-haiku-4-5-20251001

### Completed By
BMad create-story workflow v2 (Ultimate Context Engine)

### Context Verification
- [x] Loaded epics.md (complete Epic 16 spec)
- [x] Loaded architecture patterns (project-context.md)
- [x] Analyzed git history (Stories 16.1-16.4 patterns)
- [x] Identified component reuse (SuggestionDisplay, CopyToClipboard, ATSScoreDisplay, ErrorDisplay)
- [x] Mapped integration points with previous stories
- [x] Created comprehensive task breakdown (12 tasks, 40+ subtasks)
- [x] Documented error handling and testing approach
- [x] Applied lessons from previous stories (server/client boundaries, RLS patterns)

