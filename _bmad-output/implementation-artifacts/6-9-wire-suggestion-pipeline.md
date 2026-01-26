# Story 6.9: Wire Analysis-to-Suggestion Pipeline

Status: ready-for-dev

---

## Story

As a job seeker,
I want optimization suggestions to automatically generate after my resume is analyzed,
so that I can see actionable improvements without needing a separate step.

## Acceptance Criteria

1. After `analyzeResume()` completes successfully, suggestion generation begins automatically for all 3 sections (summary, skills, experience)
2. `SuggestionDisplay` component renders on `app/page.tsx` below the ATS score display
3. Loading state shows "Generating suggestions..." with per-section spinners while LLM calls are in progress
4. Suggestions populate incrementally — each section appears as its LLM call completes (not all-or-nothing)
5. Errors during suggestion generation display via existing `ErrorDisplay` component (Story 7.1) without losing successful analysis results
6. `SuggestionDisplay` is exported from `components/shared/index.ts` barrel file
7. Suggestion data persists to Supabase session via existing `updateSession()` calls
8. Regenerate buttons (Story 6.7) remain functional after initial generation
9. Feedback buttons (Story 7.4) remain functional on rendered suggestion cards
10. All existing tests continue to pass; new tests cover the orchestration flow

## Tasks / Subtasks

- [ ] Task 1: Export `SuggestionDisplay` from barrel file (AC: 6)
  - [ ] 1.1: Add `export { SuggestionDisplay } from './SuggestionDisplay'` to `components/shared/index.ts`

- [ ] Task 2: Create suggestion generation orchestration (AC: 1, 3, 4, 5)
  - [ ] 2.1: Create `actions/generateAllSuggestions.ts` server action that calls all 3 generation functions in parallel
  - [ ] 2.2: Accept `sessionId` as input, load session data from Supabase to get resume/JD content
  - [ ] 2.3: Call `generateSummarySuggestion()`, `generateSkillsSuggestion()`, `generateExperienceSuggestion()` via `Promise.allSettled()` for independent error handling
  - [ ] 2.4: Return per-section results using ActionResponse pattern — partial success is acceptable
  - [ ] 2.5: Save each successful suggestion to session via `updateSession()`

- [ ] Task 3: Wire AnalyzeButton to trigger suggestion generation (AC: 1, 3)
  - [ ] 3.1: After successful `analyzeResume()` in `AnalyzeButton.tsx`, call the new `generateAllSuggestions` action
  - [ ] 3.2: Set store `isLoading=true` and `loadingStep='generating-suggestions'` before calling
  - [ ] 3.3: Update store with each section's suggestion as it resolves: `setSummarySuggestion()`, `setSkillsSuggestion()`, `setExperienceSuggestion()`
  - [ ] 3.4: Clear loading state after all promises settle
  - [ ] 3.5: On partial failure, show toast for failed sections but keep successful ones

- [ ] Task 4: Integrate SuggestionDisplay into page.tsx (AC: 2, 8, 9)
  - [ ] 4.1: Import `SuggestionDisplay` from `@/components/shared`
  - [ ] 4.2: Render `<SuggestionDisplay />` below ATS score section, conditionally visible when suggestions exist or are generating
  - [ ] 4.3: Verify regenerate (6.7) and feedback (7.4) buttons work end-to-end

- [ ] Task 5: Tests (AC: 10)
  - [ ] 5.1: Unit test: `generateAllSuggestions` action returns partial results on individual section failure
  - [ ] 5.2: Unit test: `generateAllSuggestions` saves each suggestion to session
  - [ ] 5.3: Integration test: AnalyzeButton triggers suggestion generation after analysis
  - [ ] 5.4: Integration test: SuggestionDisplay renders on page after successful generation
  - [ ] 5.5: Verify all existing 570 tests still pass

## Dev Notes

### What Already Exists (DO NOT recreate)

**Backend — all working:**
- `lib/ai/generateSummarySuggestion.ts` — LLM call for summary optimization
- `lib/ai/generateSkillsSuggestion.ts` — LLM call for skills optimization
- `lib/ai/generateExperienceSuggestion.ts` — LLM call for experience optimization
- `app/api/suggestions/summary/route.ts` — API route (used by tests, not needed for this wiring)
- `app/api/suggestions/skills/route.ts` — same
- `app/api/suggestions/experience/route.ts` — same
- `actions/regenerateSuggestions.ts` — per-section regeneration (Story 6.7)

**Frontend — all working:**
- `components/shared/SuggestionDisplay.tsx` — main container, reads from store
- `components/shared/SuggestionSection.tsx` — per-section grouping with regenerate button
- `components/shared/SuggestionCard.tsx` — individual card with copy + feedback buttons
- `components/shared/FeedbackButtons.tsx` — thumbs up/down (Story 7.4)

**Store — all actions exist:**
- `setSummarySuggestion(suggestion)` — sets summary in store
- `setSkillsSuggestion(suggestion)` — sets skills in store
- `setExperienceSuggestion(suggestion)` — sets experience in store
- `setIsLoading(bool)` / `setLoadingStep(step)` — loading state management
- `updateSectionSuggestion(section, suggestion)` — used by regenerate

**Database — ready:**
- `lib/supabase/sessions.ts` → `updateSession()` accepts `summarySuggestion`, `skillsSuggestion`, `experienceSuggestion`
- Session row has `summary_suggestion`, `skills_suggestion`, `experience_suggestion` columns

### What's Missing (your job)

1. **Barrel export**: `SuggestionDisplay` not in `components/shared/index.ts`
2. **Orchestration action**: No `generateAllSuggestions` server action exists — need to create one that calls the 3 LLM functions and saves results
3. **AnalyzeButton wiring**: `handleAnalyze()` stops after `setATSScore()` — needs to then call suggestion generation
4. **Page integration**: `app/page.tsx` doesn't import or render `<SuggestionDisplay />`

### Architecture Compliance

- **ActionResponse pattern**: `generateAllSuggestions` MUST return `{ data, error }` — never throw
- **Server actions**: New action goes in `actions/` directory with `'use server'` directive
- **LLM calls**: Use existing `lib/ai/generate*` functions directly (NOT the API routes)
- **Timeout**: Each LLM call has its own 60s timeout internally — `Promise.allSettled()` handles per-call failures
- **Security**: Resume/JD content already sanitized in existing generation functions with XML wrapping
- **Error codes**: Use `LLM_ERROR`, `LLM_TIMEOUT`, `VALIDATION_ERROR` from `@/types`

### Key Implementation Decision

**Use `Promise.allSettled()` not `Promise.all()`** — if skills suggestion fails, summary and experience should still display. The `regenerateSuggestions` action (Story 6.7) already exists for users to retry individual failed sections.

### Store Loading State Flow

```
AnalyzeButton.handleAnalyze():
  1. setLoadingStep('Analyzing keywords...')  ← existing
  2. analyzeResume(sessionId)                 ← existing
  3. setKeywordAnalysis() + setATSScore()     ← existing
  4. setIsLoading(true)                       ← NEW
  5. setLoadingStep('generating-suggestions') ← NEW
  6. generateAllSuggestions(sessionId)         ← NEW
  7. setSummarySuggestion() etc.              ← NEW (per-section as each resolves)
  8. setIsLoading(false)                      ← NEW
  9. setLoadingStep(null)                     ← NEW
```

`SuggestionDisplay` already checks `isLoading && loadingStep === 'generating-suggestions'` to show per-section spinners. No changes needed to that component.

### Project Structure Notes

- New file: `actions/generateAllSuggestions.ts`
- Modified: `components/shared/index.ts` (add export)
- Modified: `components/shared/AnalyzeButton.tsx` (add suggestion generation call)
- Modified: `app/page.tsx` (add SuggestionDisplay)
- New tests: `tests/unit/actions/generateAllSuggestions.test.ts`

### References

- [Source: actions/regenerateSuggestions.ts] — Pattern for calling lib/ai functions from server actions
- [Source: components/shared/AnalyzeButton.tsx] — Current analysis flow to extend
- [Source: components/shared/SuggestionDisplay.tsx] — Already reads from store, handles loading state
- [Source: store/useOptimizationStore.ts:257-263] — Store setters for suggestions
- [Source: lib/supabase/sessions.ts:214-227] — updateSession accepts suggestion fields
- [Source: _bmad-output/project-context.md] — ActionResponse pattern, error codes, directory structure

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

---

_Story created: 2026-01-26_
_Status: ready-for-dev_
_Next Action: Dev Agent should run `dev-story` workflow to implement_
