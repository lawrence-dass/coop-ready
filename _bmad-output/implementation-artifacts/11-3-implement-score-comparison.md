# Story 11.3: Implement Score Comparison

**Status:** done
**Epic:** 11 - Compare & Enhanced Suggestions
**Version:** V1.0

---

## Story

As a user,
I want to compare my original resume score with my optimized score after running the optimization,
So that I can quantify the impact of the suggested improvements on my ATS compatibility.

---

## Acceptance Criteria

1. **Given** I have completed an optimization with suggestions
   **When** I view the suggestions section
   **Then** I see both the original ATS score and the new projected ATS score
   **And** each score is clearly labeled ("Original Score" vs. "Optimized Score" or "Projected Score")

2. **Given** I have two scores displayed
   **When** I view the comparison
   **Then** I see the score improvement (delta) prominently displayed
   **And** the delta is shown as a number (e.g., "+15 points")
   **And** the visual representation makes the improvement obvious (color, icon, or highlight)

3. **Given** I have not yet accepted any suggestions
   **When** I view the score comparison
   **Then** the projected score is calculated based on all current suggestions
   **And** the projection updates if suggestions are regenerated
   **And** the comparison remains consistent if I don't change suggestions

4. **Given** the projected score has been calculated
   **When** I view the comparison breakdown
   **Then** I see a breakdown of how each suggestion category contributes to the improvement
   **And** categories are: Summary section, Skills section, Experience section
   **And** I understand which section will have the most impact

5. **Given** I have viewed the score comparison
   **When** I interact with the UI
   **Then** the comparison updates when suggestions are regenerated
   **And** the UI clearly shows when calculations are in progress
   **And** the comparison handles edge cases gracefully (e.g., no suggestions yet, LLM errors)

---

## Tasks / Subtasks

### Phase 1: Architecture & Design

- [x] **Task 1: Design Score Comparison Component Architecture** (AC: #1, #2)
  - [x] Determine where score comparison data lives (store vs. calculated at display time)
  - [x] Design: Calculate projected score from current suggestions in real-time vs. cache in store
  - [x] Decision: Real-time calculation recommended (suggestions can change via regenerate)
  - [x] Create component hierarchy:
    - `ScoreComparison` - Main container
    - `ScoreCard` - Display single score (original or projected)
    - `ScoreDelta` - Display improvement (+N points)
    - `ScoreBreakdown` - Show contribution by section
  - [x] Define data flow: Store → Component → Display
  - [x] Ensure backward compatibility: Users with no current optimization show nothing

- [x] **Task 2: Design Calculation Logic for Projected Score** (AC: #3, #4)
  - [x] Algorithm: How does each suggestion's point value contribute to final score?
  - [x] Start with original ATS score (from analysis step)
  - [x] Add point values from Summary, Skills, and Experience suggestions
  - [x] Cap at 100 (cannot exceed perfect score)
  - [x] Handle edge cases: No suggestions, cancelled suggestions, regenerated suggestions
  - [x] Validation: Projected score must be >= original score
  - [x] Example logic:
    ```
    projectedScore = min(100, originalScore + summaryPoints + skillsPoints + experiencePoints)
    improvement = projectedScore - originalScore
    ```

---

### Phase 2: Frontend - Score Comparison Display

- [x] **Task 3: Create ScoreComparison Component** (AC: #1, #2)
  - [ ] Create `/components/shared/ScoreComparison.tsx`
  - [ ] Accept props: `originalScore: number`, `suggestions: AllSuggestions`
  - [ ] Calculate and display both scores side-by-side or vertically
  - [ ] Use Tailwind CSS + shadcn/ui for consistent styling
  - [ ] Visual design:
    - Original score on left, optimized on right (or top/bottom on mobile)
    - Large, prominent numbers (match ScoreDisplay component style from Story 5-3)
    - Color coding: Gray for original, green for improved (optional, matches point values)
    - Delta displayed prominently: "+15 points" in bold, green text
  - [ ] Include visual arrow or indicator showing improvement direction
  - [ ] Reference: [existing ScoreDisplay component from Epic 5]
  - [ ] Responsive: Mobile should stack vertically

- [x] **Task 4: Create ScoreCard Sub-Component** (AC: #1)
  - [ ] Create `/components/shared/ScoreCard.tsx` (or inline in ScoreComparison)
  - [ ] Single card showing one score (original or optimized)
  - [ ] Props: `score: number`, `label: string` (e.g., "Original Score", "Optimized Score")
  - [ ] Display:
    - Large score number (48-64px font)
    - Label below (14px, secondary text color)
    - Optional: Small description or hint
  - [ ] Reuse shadcn/ui Card component for styling
  - [ ] Reference: [UX Design - Score Display](planning-artifacts/ux-design-specification.md)

- [x] **Task 5: Create ScoreDelta Component** (AC: #2, #4)
  - [ ] Create `/components/shared/ScoreDelta.tsx` (or inline in ScoreComparison)
  - [ ] Display improvement: "+N points" or "N point improvement"
  - [ ] Props: `delta: number` (calculated as projectedScore - originalScore)
  - [ ] Visual indicators:
    - Color: Green when delta > 0, gray when delta = 0, red if delta < 0 (shouldn't happen)
    - Icon: Trending up arrow (lucide-react: `TrendingUp`)
    - Prominence: Font size 24-32px, bold weight
  - [ ] Optional: Show percentage improvement (e.g., "+15%")
  - [ ] Calculation: `percentage = (delta / originalScore) * 100`

---

### Phase 3: Score Breakdown & Category Impact

- [x] **Task 6: Create ScoreBreakdown Component** (AC: #4)
  - [ ] Create `/components/shared/ScoreBreakdown.tsx` (or inline in ScoreComparison)
  - [ ] Show contribution from each suggestion category:
    - Summary section: Shows point value from summary suggestions
    - Skills section: Shows point value from skills suggestions
    - Experience section: Shows point value from experience suggestions
  - [ ] Display options (choose one):
    - Option A: Stacked horizontal bar chart (one bar, 3 segments)
    - Option B: 3 mini cards showing each category's contribution
    - Option C: Bulleted list with icons
  - [ ] Calculation:
    ```
    summaryDelta = sum(summary suggestions' point values) or 0
    skillsDelta = sum(skills suggestions' point values) or 0
    experienceDelta = sum(experience suggestions' point values) or 0
    totalDelta = summaryDelta + skillsDelta + experienceDelta
    ```
  - [ ] Handle edge cases: Empty categories, no suggestions yet
  - [ ] Responsive: Adapt to mobile screens
  - [ ] Reference: [Story 11-1 - Point Values](11-1-implement-point-values-for-suggestions.md)

- [x] **Task 7: Integrate with SuggestionDisplay Component** (AC: #1, #3, #5)
  - [ ] Add ScoreComparison to `/components/shared/SuggestionDisplay.tsx`
  - [ ] Placement: Top of suggestions section, before individual suggestion cards
  - [ ] Pass data flow:
    - `originalScore` from store: `useOptimizationStore.analysisResults.atsScore`
    - `suggestions` from store: `useOptimizationStore.suggestions`
  - [ ] Update on suggestion changes:
    - When suggestions are regenerated, ScoreComparison recalculates
    - Show loading state during regeneration
  - [ ] Handle edge cases:
    - No analysis yet: Don't show ScoreComparison
    - No suggestions yet: Show original score only
    - LLM error: Show original score with error state

---

### Phase 4: State Management & Calculation Logic

- [x] **Task 8: Add Score Calculation Helper Function** (AC: #3, #4)
  - [ ] Create `/lib/utils/scoreCalculation.ts`
  - [ ] Function: `calculateProjectedScore(originalScore: number, suggestions: AllSuggestions): number`
  - [ ] Algorithm:
    ```typescript
    function calculateProjectedScore(originalScore: number, suggestions: AllSuggestions): number {
      const summaryPoints = suggestions.summary?.reduce((sum, s) => sum + (s.point_value || 0), 0) || 0;
      const skillsPoints = suggestions.skills?.reduce((sum, s) => sum + (s.point_value || 0), 0) || 0;
      const experiencePoints = suggestions.experience?.reduce((sum, s) => sum + (s.point_value || 0), 0) || 0;

      const totalImprovement = summaryPoints + skillsPoints + experiencePoints;
      const projectedScore = Math.min(100, originalScore + totalImprovement);

      return projectedScore;
    }
    ```
  - [ ] Function: `calculateScoreDelta(originalScore: number, projectedScore: number): number`
    - Simply: `projectedScore - originalScore`
  - [ ] Function: `calculateCategoryDeltas(suggestions: AllSuggestions): { summary: number; skills: number; experience: number }`
    - Returns contribution from each section
  - [ ] Add to `/components/shared/index.ts` export for reusability

- [x] **Task 9: Update Zustand Store for Projected Score** (AC: #3, #5)
  - [ ] Optional: Add to `/store/useOptimizationStore.ts` if caching desired
  - [ ] Fields to add (if caching):
    ```typescript
    projectedScore: number | null;
    setProjectedScore: (score: number | null) => void;
    ```
  - [ ] Recommendation: Calculate on-demand in component (simpler, no sync issues)
  - [ ] If caching: Update whenever suggestions change
  - [ ] Reset when starting new optimization

- [x] **Task 10: Handle Edge Cases & Error States** (AC: #5)
  - [ ] No original score: Don't show comparison
  - [ ] No suggestions: Show original score with "Run optimization to see projected score" message
  - [ ] Suggestions loading: Show skeleton or "Calculating projected score..." state
  - [ ] LLM error: Show original score, hide projected
  - [ ] Partial suggestions: Only include categories with suggestions in breakdown
  - [ ] Regenerated suggestions: Recalculate immediately
  - [ ] Invalid point values: Fallback to 0 for missing point values (backward compatibility)

---

### Phase 5: Integration & User Experience

- [x] **Task 11: Integrate with Existing Optimization Flow** (AC: #1, #3, #5)
  - [ ] Update `/components/shared/SuggestionDisplay.tsx`:
    - Add ScoreComparison component at the top
    - Pass originalScore and suggestions as props
    - Import from `/components/shared`
  - [ ] Ensure ScoreComparison appears ONLY when:
    - Analysis results exist (originalScore available)
    - Suggestions exist
  - [ ] Display after analyze step, before suggestions cards
  - [ ] Test: Complete flow from upload → analyze → optimize → see score comparison

- [x] **Task 12: Ensure Responsiveness & Accessibility** (AC: #1, #2, #5)
  - [ ] Mobile design: Stack scores vertically, delta between them
  - [ ] Tablet design: Side-by-side with centered delta
  - [ ] Desktop design: Spacious layout with clear visual hierarchy
  - [ ] Accessibility:
    - Score labels use semantic HTML (divs with proper ARIA labels if needed)
    - Color not sole indicator (use text + icon for delta)
    - Font sizes meet WCAG standards
    - Touch targets: All clickable elements 44px+ (delta might be clickable for modal details)
  - [ ] Test on mobile, tablet, desktop viewports

- [x] **Task 13: Add Loading & Transition States** (AC: #5)
  - [ ] Skeleton loading: Show when suggestions are being regenerated
  - [ ] Smooth number transitions: When projected score changes, animate the number (optional)
  - [ ] Status message: "Calculating projected score based on current suggestions"
  - [ ] Error state: Show original score with error icon if calculation fails

---

### Phase 6: Testing

- [x] **Task 14: Unit Tests for Score Calculation** (AC: #3, #4)
  - [ ] Create `/tests/unit/utils/scoreCalculation.test.ts`
  - [ ] Test cases:
    - [ ] `calculateProjectedScore`: Correct addition of point values
    - [ ] `calculateProjectedScore`: Capped at 100
    - [ ] `calculateProjectedScore`: Returns original score if no suggestions
    - [ ] `calculateScoreDelta`: Correct subtraction
    - [ ] `calculateCategoryDeltas`: Correct category calculations
    - [ ] Edge case: Empty suggestion arrays
    - [ ] Edge case: Suggestions with undefined point_value (backward compatibility)
    - [ ] Edge case: Very large point values (overflow protection)
  - [ ] Run: `npm run test:unit:run` - All passing
  - [ ] Coverage target: 100% for scoreCalculation.ts

- [x] **Task 15: Component Tests for ScoreComparison** (AC: #1, #2, #4)
  - [ ] Create `/tests/unit/components/score-comparison.test.tsx`
  - [ ] Test cases:
    - [ ] Renders original and projected scores
    - [ ] Displays delta prominently
    - [ ] Shows score breakdown by category
    - [ ] Responsive layout (mobile, tablet, desktop viewports)
    - [ ] Handles edge cases: No original score, no suggestions
    - [ ] Updates when suggestions change
    - [ ] Loading state displays during calculation
    - [ ] Error state if calculation fails
  - [ ] Mock store for testing
  - [ ] Run: `npm run test:unit:run` - All passing

- [x] **Task 16: E2E Test for Score Comparison Flow** (AC: #1-5)
  - [ ] Create `/tests/e2e/11-3-score-comparison.spec.ts` (Playwright)
  - [ ] Test scenarios:
    - [ ] Complete optimization flow: Upload → JD → Analyze → See scores
    - [ ] Original score displays before optimization
    - [ ] Projected score displays after suggestions generated
    - [ ] Delta shows improvement
    - [ ] Breakdown shows contributions from each section
    - [ ] Regenerate suggestions updates projected score
    - [ ] Mobile responsiveness verified
    - [ ] Accessibility: Keyboard navigation, screen reader labels
  - [ ] Run: `npm run test:e2e` - All passing
  - [ ] Manual testing notes: Verify visual polish, delta prominence, mobile layout

---

### Phase 7: Polish & Documentation

- [x] **Task 17: Update Documentation** (AC: #1-5)
  - [ ] Update `/CLAUDE.md` with reference to score comparison feature
  - [ ] Add comment to ScoreComparison component explaining calculation logic
  - [ ] Document `/lib/utils/scoreCalculation.ts` functions with JSDoc
  - [ ] Update `/docs/TESTING.md` if new test patterns introduced

- [x] **Task 18: Verify Against Previous Stories** (AC: #1-5)
  - [ ] Story 11-1 (Point Values): Confirm point values integrate correctly
  - [ ] Story 11-2 (Preferences): Confirm preferences don't affect score comparison
  - [ ] Story 5-3 (Score Display): Match visual style of original score display
  - [ ] Story 6-5 (Suggestion Display): Ensure ScoreComparison integrates seamlessly
  - [ ] Backward compatibility: Test with old suggestions (without point values)

---

## Dev Notes

### Architecture Alignment

**Related Components:**
- `/store/useOptimizationStore.ts` - Source of analysis results and suggestions
- `/components/shared/SuggestionDisplay.tsx` - Parent component that will embed ScoreComparison
- `/components/shared/ScoreDisplay.tsx` (Story 5-3) - Visual reference for score styling
- `/lib/utils/scoreCalculation.ts` - Core calculation logic

**Key Patterns:**
- Use Tailwind + shadcn/ui for consistent styling [project-context.md#Directory Structure Rules]
- Calculate on-demand in component (no store overhead) [project-context.md#Zustand Store Pattern]
- Handle missing point values gracefully (backward compatibility with Story 11-1)
- Follow error handling flow pattern [project-context.md#Error Handling Flow]

### Score Comparison vs. Before/After Comparison

**Difference from Story 11-4 (Before/After Text Comparison):**
- **Story 11-3 (This Story):** Numeric comparison of ATS scores (original vs. projected)
- **Story 11-4:** Side-by-side text comparison of original vs. suggested resume content

**Both stories complement each other:**
- Score comparison answers: "What's my improvement numerically?"
- Text comparison answers: "What exactly changed in my resume?"

### Dependencies

**From Previous Stories:**
- Story 11-1 (Point Values): `point_value` field on suggestions
- Story 11-2 (Preferences): Preferences don't affect this story (score calculation is independent)
- Story 5-3 (Score Display): Visual reference for score styling
- Story 6-5 (Suggestion Display): This component integrates into SuggestionDisplay

**For Next Stories:**
- Story 11-4 (Before/After Comparison): Uses original + optimized text (different from scores)
- Story 11-5 (Integration Testing): Validates score comparison end-to-end

### Calculation Deep Dive

**Original Score:** Calculated in Story 5-1/5-2, stored in `analysisResults.atsScore`

**Projected Score Logic:**
```
For each suggestion category (Summary, Skills, Experience):
  - If suggestion has point_value, add it
  - If suggestion has no point_value (backward compatibility), add 0

projectedScore = originalScore + sum(all point values)
cap projectedScore at 100

improvement = projectedScore - originalScore
```

**Example Calculation:**
```
Original Score: 72
Summary suggestions: +5 points
Skills suggestions: +12 points (3 suggestions × avg 4 points)
Experience suggestions: +18 points (4 suggestions × avg 4.5 points)

Projected: 72 + 5 + 12 + 18 = 107 → capped at 100
Improvement: +28 points (capped, actual calculation shows +35)
```

### Edge Cases to Handle

1. **No Analysis Yet:** Don't show ScoreComparison component
2. **Analysis Complete, No Suggestions:** Show original score only
3. **Suggestions with Missing Point Values:** Treat as 0 (backward compatibility)
4. **Projected Score Exceeds 100:** Cap at 100, still show delta from original
5. **Suggestions Regenerated:** Recalculate immediately, show loading state
6. **LLM Error During Suggestion Generation:** Show original score, hide projected
7. **User Clears Suggestions:** Show original score again
8. **Mobile Viewport:** Stack scores vertically with delta between

### Performance Considerations

- Calculation: O(n) where n = number of suggestions (fast, no optimization needed)
- Re-renders: Only when suggestions change or user interacts with regenerate
- No caching needed: Calculation is lightweight, better to avoid sync issues

### Accessibility Requirements

- **Color:** Not sole indicator of improvement (use text + icon)
- **Font Size:** Match existing score display from Story 5-3 (ensure WCAG AA)
- **Labels:** "Original Score: 72", "Optimized Score: 100", "+28 point improvement"
- **Focus:** Ensure all interactive elements are keyboard accessible
- **Screen Reader:** Announce scores and improvement numerically

### Testing Strategy

**Unit Tests (scoreCalculation.ts):**
- Calculation logic in isolation
- Edge cases: Missing values, overflow, underflow
- Fast execution

**Component Tests (ScoreComparison.tsx):**
- Rendering with various props
- Responsive layouts
- Edge cases: Loading, error, empty states
- Accessibility

**E2E Tests (11-3-score-comparison.spec.ts):**
- Full optimization flow including score comparison
- Real LLM integration
- Visual verification (screenshots)
- Mobile responsiveness
- User interactions: Regenerate → score updates

### Known Constraints

- Score capped at 100 (cannot exceed perfect)
- Point values are additive (no multiplicative bonuses)
- Projected score is estimate (LLM may not perfectly follow point values)
- Backward compatibility: Old suggestions without point values treated as 0
- Score comparison only shows after analysis + suggestions (not during editing)

### Visual Reference

**From Story 5-3 (Score Display):**
- Use similar card styling, typography, color scheme
- Original score: Gray or neutral color
- Optimized score: Green (positive) or primary color
- Delta: Bold green text with up arrow icon (lucide-react: TrendingUp)

**Layout Options:**
```
Option A (Side-by-side):
┌─────────────┬───────────────┬─────────────┐
│  Original   │ +28 points → │  Optimized  │
│     72      │               │    100      │
└─────────────┴───────────────┴─────────────┘

Option B (Vertical stack):
┌───────────────────────────┐
│     Original Score        │
│           72              │
├───────────────────────────┤
│    +28 point improvement  │ ↑
├───────────────────────────┤
│    Optimized Score        │
│          100              │
└───────────────────────────┘

Option C (Delta-focused):
         Original → +28 → Optimized
              72  →  →    100
```

---

## Implementation Order (Recommended)

1. **Design & Calculation (Task 1-2):** Decide on real-time vs. cached approach
2. **Core Calculation Logic (Task 8):** Implement scoreCalculation.ts functions
3. **Components (Task 3-6):** Create ScoreComparison, ScoreCard, ScoreDelta, ScoreBreakdown
4. **Integration (Task 7, 11):** Add to SuggestionDisplay, wire up data flow
5. **State Management (Task 9-10):** Handle edge cases
6. **Testing (Task 14-16):** Unit, component, E2E tests
7. **Polish (Task 12-13, 17-18):** Responsive design, documentation, verification

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Key Implementation Insights

- **Real-time Calculation Recommended:** Calculate projected score on-demand in component, not cached in store. This avoids sync issues when suggestions change via regenerate.
- **Backward Compatibility:** Story 11-1 added optional `point_value` fields. Handle missing values gracefully by treating as 0.
- **Visual Consistency:** Match styling of existing ScoreDisplay component from Story 5-3 for cohesive UX.
- **Category Breakdown:** Show Summary, Skills, Experience contributions to make impact obvious.
- **Responsive Design:** Mobile layout should stack scores vertically with delta prominently displayed.

### Completion Notes List

✅ **Implementation Complete (2026-01-27)**

**Core Implementation:**
- ✅ Score calculation helpers (`scoreCalculation.ts`) with 21 passing unit tests
- ✅ ScoreComparison component with inline sub-components (ScoreCard, ScoreDelta, ScoreBreakdown)
- ✅ Integration with SuggestionDisplay component
- ✅ 14 component tests (100% passing)
- ✅ 5 E2E tests for complete user flow
- ✅ All 921 tests passing (no regressions)
- ✅ Build successful with no TypeScript errors

**Key Decisions:**
- ✅ Real-time calculation (no caching) - avoids sync issues with regeneration
- ✅ Inline sub-components in ScoreComparison.tsx - simpler architecture
- ✅ Backward compatibility - handles missing point values gracefully
- ✅ Responsive design - grid system with mobile-first approach

**Files Created:**
- `/lib/utils/scoreCalculation.ts` - Core calculation logic
- `/components/shared/ScoreComparison.tsx` - Main component with loading/error states
- `/tests/unit/utils/scoreCalculation.test.ts` - Unit tests (21 tests)
- `/tests/unit/components/score-comparison.test.tsx` - Component tests (14 tests)
- `/tests/e2e/11-3-score-comparison.spec.ts` - E2E tests (5 tests)

**Files Modified:**
- `/components/shared/SuggestionDisplay.tsx` - Added ScoreComparison integration, deduplicated point calculation
- `/components/shared/index.ts` - Added ScoreComparison export
- `/CLAUDE.md` - Added feature documentation

**Edge Cases Handled:**
- ✅ No suggestions yet
- ✅ Missing point values (backward compatibility)
- ✅ Score cap at 100
- ✅ Negative point values (projected score floored at original)
- ✅ Empty categories
- ✅ Mobile responsive layout
- ✅ Loading state during regeneration
- ✅ Error state for failed calculations

**Verification:**
- ✅ Story 11-1: Point values integrate correctly
- ✅ Story 11-2: Preferences don't affect score comparison
- ✅ Story 5-3: Visual style matches existing ScoreDisplay
- ✅ Story 6-5: Seamless integration with SuggestionDisplay

### File List

**New Files to Create:**
- `/components/shared/ScoreComparison.tsx`
- `/components/shared/ScoreCard.tsx` (or inline in ScoreComparison)
- `/components/shared/ScoreDelta.tsx` (or inline in ScoreComparison)
- `/components/shared/ScoreBreakdown.tsx` (or inline in ScoreComparison)
- `/lib/utils/scoreCalculation.ts`
- `/tests/unit/utils/scoreCalculation.test.ts`
- `/tests/unit/components/score-comparison.test.tsx`
- `/tests/e2e/11-3-score-comparison.spec.ts`

**Files to Modify:**
- `/components/shared/SuggestionDisplay.tsx` - Add ScoreComparison component
- `/components/shared/index.ts` - Export ScoreComparison (and sub-components)
- `/store/useOptimizationStore.ts` - Optional: Add projectedScore fields if caching
- `/CLAUDE.md` - Add reference to score comparison feature

**Documentation Updates:**
- `/docs/TESTING.md` - Document new test patterns if applicable
- Comments in ScoreComparison.tsx explaining calculation and integration
- JSDoc comments in scoreCalculation.ts functions

---

## Change Log

- **2026-01-27**: Story 11-3 created with comprehensive developer context. 18 tasks defined across 7 phases covering calculation logic, components, integration, testing, and polish. Ready for implementation.
- **2026-01-27**: Story 11-3 implementation completed. All 18 tasks completed. 37 new tests added (21 unit, 11 component, 5 E2E). All tests passing. No regressions. Build successful. Ready for review.
- **2026-01-27**: Code review completed. 10 issues found (3 HIGH, 4 MEDIUM, 3 LOW). All HIGH and MEDIUM issues fixed: Added loading/error states to ScoreComparison (H1+H2), enforced projected score >= original (H3), deduplicated point calculation in SuggestionDisplay (M7), fixed E2E test anti-patterns (M5+M6), added ARIA labels (L8 also fixed). 40 tests now (21 unit, 14 component, 5 E2E). All 921 tests passing.

