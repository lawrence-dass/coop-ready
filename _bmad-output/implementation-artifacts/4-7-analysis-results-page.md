# Story 4.7: Analysis Results Page

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**, I want **to view all my analysis results on a dedicated page** so that **I can understand my resume's strengths and weaknesses**.

## Acceptance Criteria

1. ✓ Analysis results page accessible at `/scan/[scanId]`
2. ✓ Loading state displayed while analysis is in progress
3. ✓ Page auto-refreshes or polls to check for completion
4. ✓ ATS score prominently displayed with donut chart visualization
5. ✓ Score justification displayed below ATS score
6. ✓ Section-level score breakdown visible with visual indicators
7. ✓ Missing keywords section displayed with keyword list
8. ✓ Format issues section displayed (or "No format issues" if none)
9. ✓ Results organized in expandable/collapsible cards per UX design
10. ✓ Error state shown with "Try Again" and "Start New Scan" buttons; analysis failed message explains issue

## Tasks / Subtasks

- [ ] **Task 1: Create Results Page Structure** (AC: 1, 2, 3)
  - [ ] Create `app/(dashboard)/scan/[scanId]/page.tsx`
  - [ ] Export async component that fetches scan data
  - [ ] Verify user owns the scan (auth check)
  - [ ] Pass scan data to child components
  - [ ] Add proper error boundaries

- [ ] **Task 2: Create Loading State** (AC: 2, 3)
  - [ ] Create `app/(dashboard)/scan/[scanId]/loading.tsx`
  - [ ] Display skeleton loading with appropriate placeholders
  - [ ] Show "Analysis in progress..." message
  - [ ] Display time estimate ("This usually takes 10-20 seconds")
  - [ ] Use Tailwind for responsive design

- [ ] **Task 3: Implement Polling/Realtime** (AC: 2, 3)
  - [ ] Create `lib/hooks/useScanPolling.ts` hook
  - [ ] Poll `/api/scans/[scanId]` for status updates
  - [ ] Poll interval: 2 seconds while in-progress
  - [ ] Stop polling when scan is complete or failed
  - [ ] Handle network errors gracefully
  - [ ] Implement exponential backoff for retries after errors
  - [ ] Clean up polling on component unmount

- [ ] **Task 4: Create Score Card Component** (AC: 4, 5)
  - [ ] Create `components/analysis/ScoreCard.tsx`
  - [ ] Display ATS score as large donut/radial chart
  - [ ] Use recharts for visualization
  - [ ] Color code: Green (70+), Yellow (50-70), Red (<50)
  - [ ] Display percentage/100 prominently in center
  - [ ] Show score justification below chart
  - [ ] Make responsive for mobile/tablet
  - [ ] Add score interpretation text

- [ ] **Task 5: Create Section Breakdown Component** (AC: 6)
  - [ ] Create `components/analysis/SectionBreakdown.tsx`
  - [ ] Display each section score (Experience, Education, Skills, Projects, Summary)
  - [ ] Show individual section score in donut/bar chart
  - [ ] Expandable details: explanation, strengths, weaknesses
  - [ ] Color code each section (consistent with overall score)
  - [ ] Only show sections that exist in parsed resume
  - [ ] Sorted by score (lowest first for prioritization)

- [ ] **Task 6: Create Keywords Component** (AC: 7)
  - [ ] Create `components/analysis/KeywordList.tsx`
  - [ ] Display two tabs: "Keywords Found" and "Keywords Missing"
  - [ ] Show keyword frequency/importance
  - [ ] Missing keywords sorted by priority: High → Medium → Low
  - [ ] If majorKeywordsCoverage >= 90%: show "Great job! Your resume covers the key requirements"
  - [ ] Make expandable if list is long (show top 10, expand to show all)
  - [ ] Add visual badges for priority levels

- [ ] **Task 7: Create Format Issues Component** (AC: 8)
  - [ ] Create `components/analysis/FormatIssues.tsx`
  - [ ] If no format issues: show "No format issues detected" with checkmark
  - [ ] If issues exist: list with severity colors (Red=Critical, Orange=Warning, Blue=Suggestion)
  - [ ] Each issue shows: message and detail
  - [ ] Critical issues at top, then Warning, then Suggestion
  - [ ] Add icon indicators for severity
  - [ ] Link to FORMAT_BEST_PRACTICES.md for guidance

- [ ] **Task 8: Create Results Card Container** (AC: 9)
  - [ ] Create `components/analysis/ResultCard.tsx`
  - [ ] Reusable card component with:
    - Title and optional icon
    - Expandable/collapsible toggle
    - Content slot
    - Consistent styling with Tailwind + shadcn/ui
  - [ ] Default expanded state for Score Card
  - [ ] Collapsed state saves to localStorage (optional)
  - [ ] Use consistent spacing and shadows per design system

- [ ] **Task 9: Create Error State** (AC: 10)
  - [ ] Create `components/analysis/AnalysisError.tsx`
  - [ ] Display error message explaining what went wrong
  - [ ] Show "Try Again" button to retry analysis
  - [ ] Show "Start New Scan" button to analyze different resume
  - [ ] Include contact support link for persistent errors
  - [ ] Log error details for debugging
  - [ ] Handle different error types: network, timeout, validation

- [ ] **Task 10: Page Layout & Styling** (AC: All)
  - [ ] Use Tailwind CSS with shadcn/ui components
  - [ ] Layout: Score Card above fold, other results below
  - [ ] Responsive grid for section scores (2 cols on desktop, 1 col mobile)
  - [ ] Consistent spacing and typography
  - [ ] Dark mode support (if applicable)
  - [ ] Accessibility: proper heading hierarchy, ARIA labels
  - [ ] Add breadcrumb navigation (Dashboard > Scans > Results)

## Dev Notes

### Architecture Context

**Story Dependencies:**
- **Depends On**: Story 4.1 (OpenAI Integration) - displays analysis results
- **Depends On**: Story 4.2 (ATS Score Calculation) - displays scores
- **Depends On**: Story 4.3 (Missing Keywords Detection) - displays keywords
- **Depends On**: Story 4.4 (Section-Level Scores) - displays section breakdown
- **Depends On**: Story 4.5 (Experience-Level Context) - influences result interpretation
- **Depends On**: Story 4.6 (Format Issues Detection) - displays format issues
- **Depends On**: Story 3.4 (Resume Preview) - may link to resume display
- **Feeds Into**: Epic 5 (Suggestions) - results inform suggestions

**Why This Story Last in Epic 4:**
- Depends on ALL previous analysis stories (4.1-4.6)
- Consolidates and presents all analysis data
- Provides user-facing value for analysis engine
- Foundation for Epic 5 (suggestions page will build on results)

**Integration Points:**
- Fetches scan data from Supabase scans table
- Displays all analysis fields: ats_score, keywords_found/missing, section_scores, format_issues
- Polls or subscribes to scan status changes
- Links to other resume-related pages (profile, new scan, suggestions)

### Technical Context

**Page Structure:**

```typescript
// app/(dashboard)/scan/[scanId]/page.tsx
interface ScanPageProps {
  params: { scanId: string }
}

export default async function ScanPage({ params }: ScanPageProps) {
  const scan = await getScanResults(params.scanId, userId)

  if (!scan) return <NotFound />
  if (scan.status === 'processing') return <ScanResults scan={scan} isLoading />
  if (scan.status === 'failed') return <ScanResults scan={scan} error={scan.error} />
  return <ScanResults scan={scan} />
}
```

**Polling Hook:**

```typescript
// lib/hooks/useScanPolling.ts
export function useScanPolling(scanId: string) {
  const [scan, setScan] = useState<Scan>(initialScan)
  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
    if (!isPolling) return

    const interval = setInterval(async () => {
      const { data } = await fetchScan(scanId)
      setScan(data)

      if (data.status !== 'processing') {
        setIsPolling(false)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [scanId, isPolling])

  return { scan, isPolling }
}
```

**Component Hierarchy:**

```
ScanPage
├── loading.tsx (skeleton state)
├── ScanResults
│   ├── ScoreCard (ATS score + donut chart)
│   ├── SectionBreakdown
│   │   └── ResultCard (Experience, Education, Skills, Projects, Summary)
│   ├── KeywordList
│   │   ├── Tab: Keywords Found
│   │   └── Tab: Keywords Missing
│   ├── FormatIssues
│   │   └── IssueCard (Critical, Warning, Suggestion)
│   └── AnalysisError (if failed)
└── Breadcrumb
```

**Data Flow:**

```typescript
interface ScanResults {
  id: string
  status: 'processing' | 'completed' | 'failed'
  ats_score: number
  score_justification: string
  section_scores: {
    [section: string]: {
      score: number
      explanation: string
      strengths: string[]
      weaknesses: string[]
    }
  }
  keywords_found: Array<{ keyword: string; frequency: number }>
  keywords_missing: Array<{ keyword: string; frequency: number; priority: 'high' | 'medium' | 'low' }>
  format_issues: Array<{ type: 'critical' | 'warning' | 'suggestion'; message: string; detail: string }>
  experience_level_context: string
  error?: { message: string; code?: string }
  created_at: string
  updated_at: string
}
```

### Implementation Considerations

**Polling Strategy:**
- Poll every 2 seconds while processing
- Stop immediately when status changes
- Max 60 second wait before showing "taking longer" message
- Exponential backoff for network errors (1s, 2s, 4s, stop)
- Graceful fallback to manual refresh button if polling fails

**Component Composition:**
- Separate components for each analysis section (score, keywords, etc.)
- Each component handles own loading/error state
- Parent ScanResults coordinates data and layout
- Result cards reusable for different data types

**Real-time Alternative:**
- Optional: Use Supabase realtime subscriptions instead of polling
- Would require Realtime feature enabled on scans table
- More resource-efficient for long-running analyses
- Better UX (instant updates vs 2-second latency)

**Accessibility:**
- Proper heading hierarchy: h1 for page, h2 for sections
- ARIA labels for charts and visual indicators
- Keyboard navigation for expandable cards
- Color + icon for severity (not just color)
- Screen reader friendly content

**Performance:**
- Scan results pre-fetched on server side (no waterfall)
- Charts lazy-loaded (recharts tree-shakeable)
- Images optimized (if using status badges, icons)
- Polling stops automatically to prevent memory leaks
- CSS in JS (Tailwind) already optimized

### Testing Strategy

**Unit Tests Priority:**
1. Component rendering with sample data (score, keywords, etc.)
2. Error state rendering
3. Loading state rendering
4. Card expand/collapse behavior
5. Chart rendering and color coding

**Integration Tests Priority:**
1. Full page load with completed scan
2. Polling updates and status changes
3. Error retry flow
4. Navigation to "Start New Scan"
5. Different analysis result combinations

**E2E Tests:**
- User flow: Upload resume → Complete analysis → View results
- Check all results visible: score, keywords, sections, format
- Test expand/collapse interactions
- Test retry on failed analysis
- Test navigation between pages

**Test Data:**
- Mock scan with all fields populated
- Mock scan with some empty fields (no format issues, etc.)
- Mock failed scan with error message
- Mock processing scan (for polling test)

### Previous Story Learnings

**From Story 4.6 (Format Issues Detection):**
- Multiple data sources for same analysis
- Severity categorization and sorting
- Graceful display of "no issues" state

**From Story 4.5 (Experience-Level Context):**
- User context affects result interpretation
- Profile integration in analysis
- Personalized messaging

**From Story 4.4 (Section-Level Scores):**
- Hierarchical data display (overall + breakdown)
- Only show sections that exist
- Visual indicators for scores

**From Story 4.3 (Keywords Detection):**
- Large lists with sorting/prioritization
- Tab interfaces for data organization
- "Great job!" message for positive results

**From Story 4.2 (ATS Score Calculation):**
- Score interpretation (70+ good, etc.)
- Justification text for context
- Error messages with guidance

**From Story 4.1 (OpenAI Integration):**
- Client reliability patterns
- User-friendly error handling

### Git Intelligence

**Related Implementation Patterns:**
- Next.js App Router async components
- shadcn/ui card and tab components
- Recharts for data visualization
- Tailwind CSS for styling
- Supabase realtime/polling patterns
- React hooks for polling logic

**Recent Stories:**
- Story 4.6: Format analysis complete
- Story 4.5: Experience-level context added
- Story 4.4: Section scoring established

**Design System References:**
- UX6: Card-based layout
- UX9: Donut chart visualization
- Typography and spacing from shadcn/ui

### References

- Story 4.6: `_bmad-output/implementation-artifacts/4-6-resume-format-issues-detection.md`
- Story 4.5: `_bmad-output/implementation-artifacts/4-5-experience-level-aware-analysis.md`
- Story 4.4: `_bmad-output/implementation-artifacts/4-4-section-level-score-breakdown.md`
- Story 4.3: `_bmad-output/implementation-artifacts/4-3-missing-keywords-detection.md`
- Story 4.2: `_bmad-output/implementation-artifacts/4-2-ats-score-calculation.md`
- Story 4.1: `_bmad-output/implementation-artifacts/4-1-openai-integration-setup.md`
- Story 3.4: Resume Preview Display
- Story 3.3: Resume Section Parsing
- Project Context: `_bmad-output/project-context.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- UX Designs: Referenced as UX6 (cards), UX9 (donut chart)

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Debug Log References

Story context created 2026-01-21 00:30 UTC

### Completion Notes List

- [ ] Analysis results page at /scan/[scanId] created
- [ ] Loading skeleton state with loading.tsx
- [ ] Polling hook for status updates (2-second interval)
- [ ] Score Card component with donut chart visualization
- [ ] Section Breakdown component with expandable details
- [ ] Keywords component with Found/Missing tabs
- [ ] Format Issues component with severity categorization
- [ ] Result Card reusable container component
- [ ] Error state component with retry logic
- [ ] Page layout and responsive styling with Tailwind

---

**Implementation Ready:** This story is ready for development. All acceptance criteria are defined, technical patterns established from previous stories, and integration points identified.

The core implementation involves:
1. Creating the results page structure at /scan/[scanId]
2. Implementing polling/realtime subscription for status updates
3. Building reusable analysis components (score, keywords, sections, format)
4. Styling with Tailwind and shadcn/ui components
5. Displaying comprehensive analysis results to users

This completes Epic 4 (ATS Analysis Engine) by providing the user-facing results page that showcases all analysis capabilities built through Stories 4.1-4.6.
