# Story 6.7: Implement Regenerate Suggestions

Status: ready-for-dev

---

## Story

As a user,
I want to regenerate suggestions for a specific section,
So that I can get alternative options if I don't like the first ones.

## Acceptance Criteria

1. **Regenerate button visibility:** Each suggestion section (Summary, Skills, Experience) has a clearly labeled "Regenerate" button
2. **Section-specific regeneration:** Clicking regenerate for one section only regenerates that section, not others
3. **Loading state display:** During regeneration, the section shows a loading indicator (spinner, skeleton, or progress text)
4. **Replacement behavior:** New suggestions replace the old ones completely without duplication
5. **State preservation:** Non-regenerated sections preserve their suggestions and scroll position
6. **Multiple regenerations:** User can regenerate the same section multiple times in a single session
7. **Error handling:** If regeneration fails, error message displayed and original suggestions remain intact
8. **Performance timing:** Regeneration request completes within 60 seconds (LLM timeout)
9. **Button accessibility:** Regenerate button has aria-label, keyboard support, clear tooltip
10. **Toast feedback:** Success message shown after regeneration completes ("New suggestions generated!")

## Tasks / Subtasks

- [ ] Task 1: Plan regeneration architecture (AC: #1, #2, #3, #4)
  - [ ] Determine if regeneration calls same `/api/optimize` endpoint or separate endpoint
  - [ ] Design payload: section type only vs. full resume+JD context
  - [ ] Plan UI state management: loading flags per section
  - [ ] Define button placement: where it sits relative to suggestions
  - [ ] Plan loading state design: skeleton, spinner, or text indicator

- [ ] Task 2: Add regenerate button to UI (AC: #1, #9)
  - [ ] Add regenerate button to SuggestionSection component
  - [ ] Position button: typically in section header or footer
  - [ ] Import Button from shadcn/ui
  - [ ] Use lucide icon: RotateCcw or RefreshCw for regenerate concept
  - [ ] Add aria-label: "Regenerate {{section}} suggestions"
  - [ ] Add tooltip: "Generate alternative suggestions for this section"
  - [ ] Style to match design system (indigo accent color)

- [ ] Task 3: Implement regeneration request handler (AC: #2, #6, #8)
  - [ ] Create async handler: `handleRegenerateSuggestions(sectionType)`
  - [ ] Extract current section type from context
  - [ ] Prepare payload: `{ resumeContent, jdContent, sectionType, previousSuggestions }`
  - [ ] Call optimization API with section-specific params
  - [ ] Wrap in try-catch for error handling
  - [ ] Return ActionResponse<T> pattern result
  - [ ] Handle 60s timeout gracefully

- [ ] Task 4: Add loading state management (AC: #3, #5)
  - [ ] Add Zustand state: `isRegeneratingSection` (object with section keys)
  - [ ] Add action: `setRegeneratingSection(section, isLoading)`
  - [ ] Track which section is loading (summary | skills | experience)
  - [ ] Ensure non-regenerating sections remain fully interactive
  - [ ] Preserve scroll position during regeneration

- [ ] Task 5: Implement loading skeleton/spinner (AC: #3)
  - [ ] Create loading variant for SuggestionSection
  - [ ] Show spinner or skeleton while regenerating
  - [ ] Disable regenerate button during load (prevent multiple clicks)
  - [ ] Display subtle text: "Generating new suggestions..." (optional)
  - [ ] Maintain card layout to prevent UI jumping

- [ ] Task 6: Replace suggestions on success (AC: #4, #6)
  - [ ] Update Zustand store with new suggestions
  - [ ] Clear old suggestions for that section
  - [ ] Render new suggestions immediately
  - [ ] Maintain suggestion card UI consistency
  - [ ] Preserve copy-to-clipboard functionality for new suggestions

- [ ] Task 7: Handle errors and edge cases (AC: #7, #8)
  - [ ] Catch timeout errors: Show "Regeneration took too long, please try again"
  - [ ] Catch API errors: Show "Failed to generate new suggestions"
  - [ ] Catch validation errors: Handle empty section gracefully
  - [ ] Preserve original suggestions if regeneration fails
  - [ ] Offer retry option if desired

- [ ] Task 8: Test regeneration flow (AC: #1-10)
  - [ ] Unit test: Regenerate button renders for each section
  - [ ] Unit test: Loading state toggled correctly
  - [ ] Unit test: API called with correct payload
  - [ ] Unit test: Error handling (timeout, API failure)
  - [ ] Integration test: Full regeneration flow (button → loading → new suggestions)
  - [ ] Integration test: Non-affected sections remain unchanged
  - [ ] Integration test: Can regenerate same section multiple times
  - [ ] Manual test: Verify new suggestions are meaningfully different from original

## Dev Notes

### Architecture Compliance

**From project-context.md:**
- Pattern: Server action pattern for < 60s operations
- Use: `/api/optimize` endpoint (existing, handles 60s timeout)
- State management: Zustand store with per-section loading flags
- Directory: Changes to `/components/shared/SuggestionSection.tsx`
- Error codes: Use LLM_TIMEOUT, LLM_ERROR as needed
- Type safety: Full TypeScript with discriminated unions

**Critical Pattern from Previous Stories:**
- All LLM operations return ActionResponse<T>: `{ data: T; error: null } | { data: null; error: ErrorObject }`
- Suggestions always wrapped in XML tags for prompt injection defense
- Toast notifications via sonner library for feedback
- Button state management with timeout-based reset

### Previous Story Intelligence

**Story 6.6 (Copy to Clipboard) - Just Completed:**
- CopyButton component: Reusable, handles Clipboard API + fallback
- Integration: Placed at bottom-right of SuggestionCard
- State pattern: `[isCopied, setIsCopied]` with 2-3 second reset
- Feedback: Toast success message + icon change (Copy → Checkmark)
- Takeaway: Button state patterns work well for UI feedback

**Story 6.5 (Suggestion Display UI) - Completed:**
- SuggestionDisplay component: Container managing all sections
- SuggestionSection component: Groups suggestions by type
- SuggestionCard component: Individual suggestion with original/suggested text
- State pattern: `useOptimization()` Zustand hook provides suggestions
- Loading: Skeleton components for initial load states
- Responsive: Desktop (2-column) vs mobile (tabs)
- Takeaway: Suggestion state is centralized in Zustand, modifications trigger re-render

**Story 6.1-6.4 (LLM Pipeline):**
- API route: `/api/optimize` handles full pipeline with 60s timeout
- Request: `{ resumeContent, jdContent, sectionType }`
- Response: `{ suggestions: { summary, skills, experience } }`
- Error codes: INVALID_FILE_TYPE, FILE_TOO_LARGE, PARSE_ERROR, LLM_TIMEOUT, LLM_ERROR, RATE_LIMITED, VALIDATION_ERROR
- Pattern: All calls XML-wrap user content for security

### Technical Requirements

**Regeneration Strategy:**
- Option 1 (Recommended): Call `/api/optimize` with `regenerateSection` flag to skip parse/analyze, jump to optimize
- Option 2: Create separate `/api/regenerate-section` endpoint (duplicates logic)
- **Decision:** Use Option 1 - cleaner, reuses existing pipeline with section filter

**Request Payload:**
```typescript
{
  resumeContent: string;
  jdContent: string;
  sectionType: 'summary' | 'skills' | 'experience';
  regenerateOnly: true; // Skip parsing/analyzing, go straight to optimize
  previousSuggestions?: Suggestion[]; // For context (optional)
}
```

**Response:**
```typescript
ActionResponse<{
  suggestions: {
    [sectionType]: Suggestion[]
  }
}>
```

**Zustand State Addition:**
```typescript
interface OptimizationStore {
  // Existing...
  suggestions: Suggestions | null;

  // NEW:
  isRegeneratingSection: {
    summary?: boolean;
    skills?: boolean;
    experience?: boolean;
  };
  setRegeneratingSection: (section: SectionType, isLoading: boolean) => void;
  updateSuggestion: (section: SectionType, suggestions: Suggestion[]) => void;
}
```

**UI Placement:**
- Button location: Top-right of SuggestionSection header (next to section title)
- Alternative: Bottom of section (below last suggestion)
- Design: Secondary button variant (outline) to distinguish from primary actions
- Icon: lucide-react `RotateCcw` or `RefreshCw` (spinning animation during load)

### File Structure & Changes

**Modified Files:**
1. `/components/shared/SuggestionSection.tsx`
   - Add regenerate button to section header
   - Add loading state display
   - Connect button to regeneration handler
   - Show/hide suggestions based on `isRegeneratingSection` state

2. `/store/optimization.ts` (Zustand store)
   - Add `isRegeneratingSection` state object
   - Add `setRegeneratingSection` action
   - Add `updateSuggestion` action for replacing suggestions

3. `/actions/optimize.ts` or `/api/optimize/route.ts`
   - Add optional `regenerateOnly` flag to request
   - If true, skip parse/analyze steps
   - Process only specified `sectionType`

4. `/components/shared/SuggestionCard.tsx` (Minor)
   - No changes needed (CopyButton already integrated)

**New Tests Required:**
- `/tests/unit/components/regenerate-button.test.tsx`
- `/tests/integration/regenerate-suggestions.test.tsx`
- Toast message verification (sonner mock)
- Zustand store state transitions

### UX Design Notes

**Visual Feedback Flow:**
1. User clicks "Regenerate" button on a section
2. Button becomes disabled, shows spinner icon
3. Section content becomes semi-transparent or shows skeleton overlay
4. 5-15 seconds pass...
5. New suggestions appear (replace old ones)
6. Toast: "New suggestions generated!"
7. Button re-enables, ready for next regenerate

**Error Feedback Flow:**
1. Regeneration fails (timeout or API error)
2. Toast error: "Failed to generate new suggestions"
3. Original suggestions remain visible (no data loss)
4. Button re-enables for retry
5. Optional: Show "Try again" link in toast

**Performance Consideration:**
- Regeneration should feel snappier than initial optimization
- Only regenerate 1 section = 1/3 the LLM cost
- Estimate 5-20 seconds (faster than full optimization)
- Timeout still 60 seconds max (same as full pipeline)

### Git Tracking

**Source Epics References:**
- [Source: epics.md#Story 6.7](_bmad-output/planning-artifacts/epics.md#l734)
- Requirement FR27: "Users can regenerate suggestions for a specific section"
- Version: V0.1 (included in initial release)

**Related Work:**
- Previous: Story 6.6 (Copy to Clipboard)
- Parallel: Story 6-8 (Epic Integration Testing)
- Following: Story 7-1 (Error Handling & Feedback)

---

## References

- **Architecture Pattern:** project-context.md - ActionResponse Pattern, Zustand Pattern, LLM Security
- **API Route:** `/app/api/optimize/route.ts` - 60s timeout, LLM pipeline orchestration
- **Zustand Store:** `/store/optimization.ts` - Central state management for suggestions
- **Component Pattern:** `/components/shared/SuggestionCard.tsx` - Integration with copy button
- **Testing Framework:** Vitest + Playwright (see docs/TESTING.md)
- **UI Design:** UX Design Specification - Card styling, button variants, loading states
- **Error Codes:** project-context.md - Error code list and usage

---

## Story Completion Status

**Status:** ready-for-dev

**Ultimate Context Engine Analysis:** Complete
- Epic analysis: ✓
- Story requirements extracted: ✓
- Previous story intelligence gathered: ✓
- Architecture guardrails identified: ✓
- Technical requirements defined: ✓
- File structure mapped: ✓
- Testing strategy outlined: ✓

**Developer Readiness:** 100%
The developer now has everything needed for flawless implementation. All context, patterns, error handling, and architectural constraints are clearly documented.

---

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Completion Notes

- Story created with comprehensive context analysis
- Regeneration architecture planned (reuse `/api/optimize` with flags)
- State management strategy defined (per-section loading flags in Zustand)
- UI placement and feedback flow documented
- All acceptance criteria mapped to implementation tasks
- Error handling and edge cases considered
- Testing strategy outlined for verification

### File List

Generated files (this story):
- `_bmad-output/implementation-artifacts/6-7-implement-regenerate-suggestions.md` (this file)

Modified files (tracked for future reference):
- `/components/shared/SuggestionSection.tsx` (regenerate button + loading state)
- `/store/optimization.ts` (per-section loading state)
- `/app/api/optimize/route.ts` or `/actions/optimize.ts` (regenerateOnly flag)
- Test files: regenerate-button.test.tsx, regenerate-suggestions.test.tsx

---

_Story created: 2026-01-26 | Epic 6 Progress: 6/8 stories ready-for-dev or complete_
