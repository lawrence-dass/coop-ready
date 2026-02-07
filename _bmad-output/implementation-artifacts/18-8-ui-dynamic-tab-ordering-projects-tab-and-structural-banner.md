# Story 18.8: UI — Dynamic Tab Ordering, Projects Tab & Structural Banner

Status: done

## Story

As a resume optimizer user,
I want the suggestions page to dynamically order tabs by my candidate type, show a Projects tab with project-specific suggestions, and display structural resume recommendations,
so that I see the most relevant sections first and understand what structural changes would improve my resume's ATS compatibility.

## Acceptance Criteria

1. **Projects tab renders** when `session.suggestions.projects` contains data — shows project entries with bullet suggestions following the Education tab pattern (entry header + bullet SuggestionCards)
2. **Tab order changes by candidateType** — tabs reorder dynamically based on `RECOMMENDED_ORDER` from `/lib/scoring/sectionOrdering.ts`, filtered to sections with data
3. **Co-op ordering:** Skills first, Education second, Projects third, Experience fourth, Summary last with muted visual + "Optional" badge
4. **Full-time ordering:** Summary first, Skills, Experience, Projects, Education last (standard order)
5. **Career changer ordering:** Summary first, Skills, Education, Projects, Experience last
6. **Default fulltime ordering** when `candidateType` is null (backward compat for old sessions)
7. **Tabs only show for sections with data** — if no projects suggestions exist, Projects tab is hidden; same for Summary with no data
8. **Structural suggestions banner** renders above the tabs section when `structuralSuggestions.length > 0`, sorted by priority (critical → high → moderate)
9. **Structural banner is collapsible** if more than 3 items — initially shows top 3, expand to see rest
10. **Active tab defaults to first tab** in the ordered list (not always "summary")
11. **SuggestionCard accepts `sectionType: 'projects'`** — no visual regression for existing section types
12. **SectionSummaryCard handles 'projects'** — shows appropriate icon and description
13. **Grid columns adapt** to number of visible tabs (4 or 5 columns)
14. **No regressions** for sessions without candidateType or projectsSuggestion (null values)
15. **`npm run build` passes** with no type errors

## Tasks / Subtasks

- [x] Task 1: Update ClientSuggestionsPage SessionData interface (AC: #1, #6, #14)
  - [x] 1.1 Add `ProjectsSuggestion` import from `@/types/suggestions`
  - [x] 1.2 Add `StructuralSuggestion` import from `@/types/suggestions`
  - [x] 1.3 Add `CandidateType` import from `@/lib/scoring/types`
  - [x] 1.4 Add `projects?: ProjectsSuggestion[];` to `suggestions` object in local `SessionData` interface (line 33-38)
  - [x] 1.5 Add `candidateType?: CandidateType | null;` to `SessionData` interface (after line 42)
  - [x] 1.6 Add `structuralSuggestions?: StructuralSuggestion[];` to `SessionData` interface

- [x] Task 2: Implement dynamic tab ordering logic (AC: #2, #3, #4, #5, #6, #7, #10)
  - [x] 2.1 Define `TAB_ORDER` config mapping `CandidateType` to ordered section arrays:
    - `coop: ['skills', 'education', 'projects', 'experience', 'summary']`
    - `fulltime: ['summary', 'skills', 'experience', 'projects', 'education']`
    - `career_changer: ['summary', 'skills', 'education', 'projects', 'experience']`
  - [x] 2.2 Expand `SectionType` union (line 49) to include `'projects'`: `type SectionType = 'summary' | 'skills' | 'experience' | 'education' | 'projects';`
  - [x] 2.3 Create `getOrderedTabs()` function that:
    - Gets ordered sections from `TAB_ORDER[candidateType ?? 'fulltime']`
    - Filters to only sections that have suggestion data (count > 0 or data exists)
    - Returns `SectionType[]`
  - [x] 2.4 Set `activeSection` default to `orderedTabs[0]` (first available tab)
  - [x] 2.5 Update `TabsList` from `grid-cols-4` to dynamic: `grid-cols-${orderedTabs.length}` (use template literal className or conditional)

- [x] Task 3: Add Projects tab content (AC: #1, #12)
  - [x] 3.1 Extract projects suggestions: `const projectsSuggestions = session.suggestions.projects || [];`
  - [x] 3.2 Calculate projects suggestion count (same pattern as education — reduce over project_entries → suggested_bullets)
  - [x] 3.3 Calculate projects raw points: `projectsSuggestions.reduce((sum, s) => sum + (s.total_point_value || 0), 0)`
  - [x] 3.4 Include projects in `totalRawPoints` calculation (line 84)
  - [x] 3.5 Calculate `projectsEffectivePoints` using `calculateEffectivePoints(projectsRawPoints)`
  - [x] 3.6 Add `<TabsContent value="projects">` block following Education pattern:
    - SectionSummaryCard with sectionName="Projects"
    - Empty state when 0 suggestions
    - Map over `projectsSuggestions` → `project_entries` → `suggested_bullets`
    - Entry header: `entry.title` + technologies badges + dates
    - Heading suggestion banner if `projSugg.heading_suggestion` exists
    - Each bullet as `<SuggestionCard sectionType="projects" />`
    - Include dual-length support: `suggestedCompact`, `originalWordCount`, `compactWordCount`, `fullWordCount`

- [x] Task 4: Refactor TabsList to be data-driven (AC: #2, #7, #13)
  - [x] 4.1 Replace hard-coded 4 `<TabsTrigger>` elements with `orderedTabs.map()`:
    ```tsx
    {orderedTabs.map((section) => (
      <TabsTrigger key={section} value={section} className={...}>
        {TAB_LABELS[section]}
        {counts[section] > 0 && <Badge>{counts[section]}</Badge>}
        {/* Co-op summary muted badge */}
        {section === 'summary' && candidateType === 'coop' && (
          <Badge variant="outline" className="ml-1 text-xs opacity-60">Optional</Badge>
        )}
      </TabsTrigger>
    ))}
    ```
  - [x] 4.2 Define `TAB_LABELS` mapping: `{ summary: 'Summary', skills: 'Skills', experience: 'Experience', education: 'Education', projects: 'Projects' }`
  - [x] 4.3 Build `counts` and `effectivePoints` lookup objects from existing per-section calculations
  - [x] 4.4 For co-op summary tab: add `opacity-60` class to TabsTrigger + "Optional" badge (AC: #3)

- [x] Task 5: Refactor TabsContent to be data-driven (AC: #1, #2)
  - [x] 5.1 Keep existing TabsContent blocks for summary, skills, experience, education — they have different rendering logic each
  - [x] 5.2 Add `<TabsContent value="projects">` block (from Task 3)
  - [x] 5.3 Ensure all TabsContent blocks render regardless of tab order (Radix Tabs handles visibility via `value` matching)

- [x] Task 6: Create StructuralSuggestionsBanner component (AC: #8, #9)
  - [x] 6.1 Create `/components/shared/StructuralSuggestionsBanner.tsx`
  - [x] 6.2 Props: `suggestions: StructuralSuggestion[]`
  - [x] 6.3 Return null if empty array
  - [x] 6.4 Sort by priority: critical → high → moderate
  - [x] 6.5 Render container card with icon (AlertTriangle from lucide-react) + title "Resume Structure Recommendations"
  - [x] 6.6 Each suggestion renders with:
    - Priority badge (critical = red bg, high = orange/amber bg, moderate = green bg)
    - Category badge (section_order, section_heading, section_presence)
    - `message` as primary text
    - `recommendedAction` as action text
  - [x] 6.7 Collapsible: if > 3 items, show first 3 + "Show N more" button
  - [x] 6.8 Use `useState` for expand/collapse state

- [x] Task 7: Integrate StructuralSuggestionsBanner into ClientSuggestionsPage (AC: #8)
  - [x] 7.1 Import StructuralSuggestionsBanner
  - [x] 7.2 Render between ScoreComparisonSection and the Card containing tabs (after line 125, before line 128)
  - [x] 7.3 Pass `suggestions={session.structuralSuggestions ?? []}`

- [x] Task 8: Update SuggestionCard sectionType (AC: #11)
  - [x] 8.1 In `/components/shared/SuggestionCard.tsx` line 63: change `sectionType: 'summary' | 'skills' | 'experience' | 'education'` to include `| 'projects'`

- [x] Task 9: Update SectionSummaryCard for projects (AC: #12)
  - [x] 9.1 In `/components/shared/SuggestionCard.tsx` > `SectionSummaryCard.tsx` line 36-48 `getIcon()`: add case `'projects': return <Code className="w-5 h-5 text-indigo-600" />;` (import Code from lucide-react)

- [x] Task 10: Verify build and backward compatibility (AC: #14, #15)
  - [x] 10.1 Run `npm run build` — no type errors
  - [x] 10.2 Verify old sessions (candidateType=null, no projects) render correctly with fulltime tab order
  - [x] 10.3 Verify sessions with all 5 sections render 5-tab layout
  - [x] 10.4 Verify sessions with 4 sections render 4-tab layout (no projects)

## Dev Notes

### Architecture Overview

This is the **UI rendering story** for Epic 18. All data layer work is done (Story 18.7). This story consumes `candidateType`, `structuralSuggestions`, and `projectsSuggestion` from the server-rendered session data to drive dynamic tab ordering and new UI components.

**Critical pattern**: `ClientSuggestionsPage` uses **server session props** (NOT the Zustand store). Data flows: `page.tsx` → `getSessionById()` → spreads session → `ClientSuggestionsPage`. The store is used by `SuggestionDisplay.tsx` (a different component on the scan results page). Do NOT add store hooks to this component.

### File Modification Map

| File | What Changes | Key Lines |
|------|-------------|-----------|
| `ClientSuggestionsPage.tsx` | SessionData interface, dynamic tabs, Projects tab, structural banner integration | Lines 16-21 (imports), 24-43 (SessionData), 49 (SectionType), 53 (activeSection default), 57-60 (suggestion extraction), 62-101 (counts/points), 128-369 (tabs UI) |
| `page.tsx` | No changes needed — `{...session}` already spreads all fields from getSessionById including candidateType/structuralSuggestions |
| `SuggestionCard.tsx` | Add `'projects'` to sectionType union | Line 63 |
| `SectionSummaryCard.tsx` | Add projects icon case | Lines 5 (import), 36-48 (getIcon switch) |
| `StructuralSuggestionsBanner.tsx` | NEW — structural suggestions display | N/A |

### Data Already Available from Server

`getSessionById()` in `/lib/scan/queries.ts` already returns these fields (Story 18.7):

```typescript
// queries.ts SessionData (lines 32-34)
projectsSuggestion: ProjectsSuggestion | null;
candidateType: CandidateType | null;
structuralSuggestions: StructuralSuggestion[];
```

And `suggestions.projects` is built from `projectsSuggestion` (lines 120-127, 136-141):
```typescript
projects: projectsSuggestion ? [projectsSuggestion] : [],
```

The server `page.tsx` does `{...session, suggestions: session.suggestions!}` which already includes all these fields. The only gap is the **client component's local SessionData interface** which needs extending.

### Tab Order Reference

From `/lib/scoring/sectionOrdering.ts` (lines 49-53):
```typescript
RECOMMENDED_ORDER = {
  coop: ['skills', 'education', 'projects', 'experience', 'certifications'],
  fulltime: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
  career_changer: ['summary', 'skills', 'education', 'projects', 'experience', 'certifications'],
};
```

**UI Tab Order** (certifications filtered out — no suggestion tab yet):
- **Co-op**: Skills → Education → Projects → Experience → Summary (muted)
- **Full-time**: Summary → Skills → Experience → Projects → Education
- **Career changer**: Summary → Skills → Education → Projects → Experience

### Co-op Summary Muted State

For co-op candidates, the Summary tab should:
- Appear **last** in tab order (after Experience)
- Have **reduced opacity** (e.g., `opacity-60` on the TabsTrigger)
- Show an **"Optional" badge** next to the tab label
- Still be clickable and functional — just visually de-emphasized
- If no summary suggestions exist, the tab may be hidden entirely (filtered by getOrderedTabs)

### Projects Tab Rendering Pattern

Follow the **Education tab pattern** (lines 308-368 of ClientSuggestionsPage.tsx). Key differences:

| Aspect | Education | Projects |
|--------|-----------|----------|
| Entry header | `entry.degree` + `entry.institution` + `entry.dates` + `entry.gpa` | `entry.title` + `entry.technologies` badges + `entry.dates` |
| Special banner | `relevant_coursework` (blue bg) | `heading_suggestion` (indigo bg) — e.g., "Consider renaming to 'Project Experience'" |
| Dual-length | Not supported | Supported — pass `suggestedCompact`, word counts to SuggestionCard |
| Metrics | Not applicable | `bullet.metrics_added` — pass as `metrics` prop to SuggestionCard |

### ProjectsSuggestion Type Reference

```typescript
// From types/suggestions.ts (lines 396-414)
interface ProjectsSuggestion {
  original: string;
  project_entries: ProjectEntry[];
  total_point_value?: number;
  explanation?: string;
  heading_suggestion?: string;  // "Project Experience" for co-op
  summary: string;
}

// ProjectEntry (lines 375-390)
interface ProjectEntry {
  title: string;
  technologies: string[];
  dates?: string;
  original_bullets: string[];
  suggested_bullets: ProjectBulletSuggestion[];
}

// ProjectBulletSuggestion (lines 331-370) — has dual-length support
interface ProjectBulletSuggestion {
  original: string;
  suggested: string;
  metrics_added: string[];
  keywords_incorporated: string[];
  point_value?: number;
  impact?: ImpactTier;
  explanation?: string;
  suggested_compact?: string;
  suggested_full?: string;
  original_word_count?: number;
  compact_word_count?: number;
  full_word_count?: number;
}
```

### StructuralSuggestion Type Reference

```typescript
// From types/suggestions.ts (lines 424-437)
interface StructuralSuggestion {
  id: string;                    // e.g., "rule-coop-exp-before-edu"
  priority: 'critical' | 'high' | 'moderate';
  category: 'section_order' | 'section_heading' | 'section_presence';
  message: string;               // Human-readable suggestion
  currentState: string;          // What's wrong
  recommendedAction: string;     // What to do
}
```

Priority colors: `critical` = red-500 bg, `high` = amber-500 bg, `moderate` = green-500 bg.

### Dynamic Grid Columns

Current: `<TabsList className="grid w-full grid-cols-4">` (line 134)

Change to dynamic based on tab count:
```tsx
const gridCols = orderedTabs.length <= 4 ? 'grid-cols-4' : 'grid-cols-5';
<TabsList className={`grid w-full ${gridCols}`}>
```

Or use `grid-cols-${orderedTabs.length}` but be careful — Tailwind purges dynamic class names. Safer to use a lookup:
```typescript
const GRID_COLS: Record<number, string> = {
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
};
```

### What NOT to Modify

- `/lib/scoring/sectionOrdering.ts` — RECOMMENDED_ORDER is already correct (Story 18.3)
- `/lib/scoring/structuralSuggestions.ts` — 8 rules already implemented (Story 18.3)
- `/store/useOptimizationStore.ts` — Store fields already complete (Story 18.7)
- `/lib/scan/queries.ts` — Session data flow already correct (Story 18.7)
- `/types/suggestions.ts` — Types already defined (Stories 18.3, 18.5)
- `/types/optimization.ts` — OptimizationSession already has all fields (Story 18.7)
- `SuggestionDisplay.tsx` / `SuggestionSection.tsx` — These are DIFFERENT components used on the scan results page, not the suggestions page

### Import Paths

```typescript
// Types
import type { ProjectsSuggestion, StructuralSuggestion } from '@/types/suggestions';
import type { CandidateType } from '@/lib/scoring/types';

// Components
import { StructuralSuggestionsBanner } from '@/components/shared/StructuralSuggestionsBanner';

// Icons (for SectionSummaryCard)
import { Code } from 'lucide-react'; // Projects icon
import { AlertTriangle } from 'lucide-react'; // Structural banner icon
```

### Previous Story Intelligence (18.7)

- Story 18.7 code review fixed `lib/scan/queries.ts` to use **independent if blocks** (not `else if`) for merging education and projects into suggestions — both can coexist
- Store now has `projectsSuggestion`, `candidateType`, `structuralSuggestions` with all setters, reset, loadFromSession
- `SuggestionFeedback.sectionType` already includes `'projects'` (fixed in 18.7)
- Migration added CHECK constraint for `candidate_type IN ('coop', 'fulltime', 'career_changer')`

### Testing Notes

This story is primarily UI rendering. Minimal unit tests needed:
- Test `getOrderedTabs()` utility function (if extracted) — given candidateType + available sections → correct ordered tabs
- StructuralSuggestionsBanner rendering with 0, 1, 3, 5 suggestions
- Story 18.10 handles comprehensive E2E testing for tab ordering

### Existing Icon Mapping (SectionSummaryCard.tsx lines 36-48)

```typescript
'summary' → FileText (blue-600)
'skills' → Sparkles (purple-600)
'experience' → Briefcase (green-600)
'education' → GraduationCap (amber-600)
// ADD:
'projects' → Code (indigo-600)
```

### Project Structure Notes

- New component: `/components/shared/StructuralSuggestionsBanner.tsx`
- Modified components: `/components/shared/SuggestionCard.tsx`, `/components/shared/SectionSummaryCard.tsx` (both in READ-ONLY adjacent `ui/` — these are in `shared/` so OK to modify)
- Main page: `/app/(authenticated)/(dashboard)/scan/[sessionId]/suggestions/ClientSuggestionsPage.tsx`

### References

- [Source: _bmad-output/planning-artifacts/epic-18-candidate-type-aware-resume-structure.md#Story 18.8]
- [Source: app/(authenticated)/(dashboard)/scan/[sessionId]/suggestions/ClientSuggestionsPage.tsx#L24-L49 - SessionData interface and SectionType]
- [Source: app/(authenticated)/(dashboard)/scan/[sessionId]/suggestions/ClientSuggestionsPage.tsx#L128-L369 - Tabs UI structure]
- [Source: app/(authenticated)/(dashboard)/scan/[sessionId]/suggestions/page.tsx#L48-L51 - Session spread to client]
- [Source: lib/scan/queries.ts#L8-L35 - SessionData with candidateType/structuralSuggestions/projectsSuggestion]
- [Source: lib/scan/queries.ts#L118-L141 - Projects merge into suggestions]
- [Source: lib/scoring/sectionOrdering.ts#L49-L53 - RECOMMENDED_ORDER constant]
- [Source: types/suggestions.ts#L331-L414 - ProjectsSuggestion, ProjectEntry, ProjectBulletSuggestion types]
- [Source: types/suggestions.ts#L424-L437 - StructuralSuggestion type]
- [Source: components/shared/SuggestionCard.tsx#L63 - sectionType union]
- [Source: components/shared/SectionSummaryCard.tsx#L36-L48 - getIcon switch]
- [Source: _bmad-output/implementation-artifacts/18-7-store-session-and-database-updates.md - Previous story]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

N/A

### Completion Notes List

All tasks completed successfully:

1. **Task 1-2**: Extended `ClientSuggestionsPage` with new SessionData fields (`projects`, `candidateType`, `structuralSuggestions`) and implemented dynamic tab ordering based on candidate type. Added TAB_ORDER config for coop/fulltime/career_changer ordering with data-driven filtering.

2. **Task 3-5**: Added complete Projects TabsContent section following Education pattern with project entry headers (title + technology badges + dates), heading suggestion banner, and dual-length bullet suggestions. Refactored TabsList to be fully data-driven using `orderedTabs.map()` with co-op summary muted state.

3. **Task 6-7**: Created `StructuralSuggestionsBanner` component with collapsible UI (shows 3, expands to all), priority sorting (critical→high→moderate), and priority-based badge colors. Integrated banner between ScoreComparisonSection and tabs Card.

4. **Task 8-9**: Extended `SuggestionCard` and `FeedbackButtons` sectionType unions to include 'projects'. Added projects icon case (Code icon, indigo-600) to `SectionSummaryCard`.

5. **Task 10**: Build verification passed — no TypeScript errors. Backward compatibility ensured with fulltime default when candidateType is null.

**Type Fixes**:
- Fixed inline type annotation in `SuggestionCard.tsx` line 133 to include 'projects'
- Updated `FeedbackButtons.tsx` sectionType prop to include 'projects'

### Code Review Fixes (Opus 4.6)

| ID | Severity | Fix |
|----|----------|-----|
| H1 | HIGH | Added `'projects'` to `hasCompactVersion` guard in `SuggestionCard.tsx` — dual-length toggle was broken for projects section |
| M1 | MEDIUM | Removed `mb-8` from `StructuralSuggestionsBanner.tsx` — caused double spacing with parent `space-y-8` |
| M2 | MEDIUM | Created `tests/unit/components/StructuralSuggestionsBanner.test.tsx` with 10 tests — was zero test coverage |
| M3 | MEDIUM | Removed dead `useOptimizationStore` import from `ClientSuggestionsPage.tsx` |

### File List

**Created:**
- components/shared/StructuralSuggestionsBanner.tsx
- tests/unit/components/StructuralSuggestionsBanner.test.tsx (review fix M2)

**Modified:**
- app/(authenticated)/(dashboard)/scan/[sessionId]/suggestions/ClientSuggestionsPage.tsx (review fix M3)
- app/(authenticated)/(dashboard)/scan/[sessionId]/suggestions/SectionSummaryCard.tsx
- components/shared/SuggestionCard.tsx (review fix H1)
- components/shared/FeedbackButtons.tsx
- components/shared/StructuralSuggestionsBanner.tsx (review fix M1)
