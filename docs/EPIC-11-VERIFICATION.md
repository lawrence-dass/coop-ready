# Epic 11: Compare & Enhanced Suggestions - Verification Checklist

**Epic:** Epic 11 - Compare & Enhanced Suggestions
**Stories:** 11.1, 11.2, 11.3, 11.4, 11.5
**Date:** 2026-01-27

---

## Automated Test Coverage

### Unit Tests (114 tests)

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/unit/ai/point-value.test.ts` | 18 | Passing |
| `tests/unit/components/point-value-display.test.tsx` | 18 | Passing |
| `tests/unit/preferences/preferences.test.ts` | 18 | Passing |
| `tests/unit/components/preferences-dialog.test.tsx` | 17 | Passing |
| `tests/unit/utils/scoreCalculation.test.ts` | 21 | Passing |
| `tests/unit/components/score-comparison.test.tsx` | 14 | Passing |
| `tests/unit/utils/textDiff.test.ts` | 23 | Passing |
| `tests/unit/components/before-after-comparison.test.tsx` | 26 | Passing |

### Integration Tests (26 tests)

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/integration/preferences-pipeline.test.ts` | 6 | Passing |
| `tests/integration/preferences-persistence.test.ts` | 10 | Passing |
| `tests/integration/suggestion-display-integration.test.tsx` | 7 | Passing |
| `tests/integration/suggestion-pipeline.test.tsx` | 7 | Passing |

### E2E Tests (11 tests)

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/e2e/11-1-point-values.spec.ts` | 6 | Ready |
| `tests/e2e/11-3-score-comparison.spec.ts` | 5 | Ready |

---

## Traceability Summary

| Priority | Total Criteria | Covered | Coverage |
|----------|---------------|---------|----------|
| P0 | 6 | 6 | 100% |
| P1 | 13 | 13 | 100% |
| P2 | 1 | 0 | N/A (deferred) |
| **Total** | **20** | **19** | **95%** |

**Gate Decision:** PASS (all P0 at 100%, all P1 at 100%)

---

## Manual Verification Checklist

### Story 11.1: Point Values for Suggestions

- [ ] Generate suggestions for a resume + job description
- [ ] Verify each experience bullet suggestion displays a point value badge
- [ ] Verify point values are in the 0-100 range
- [ ] Verify color coding: high points (green), medium (yellow), low (red)
- [ ] Verify total improvement banner shows sum of point values
- [ ] Verify point values have tooltips explaining their meaning
- [ ] Verify copy-to-clipboard excludes point value text
- [ ] Regenerate suggestions and verify new point values appear

### Story 11.2: Optimization Preferences

- [ ] Open optimization preferences dialog
- [ ] Verify 5 preference options displayed:
  - [ ] Tone (Professional / Technical / Casual)
  - [ ] Verbosity (Concise / Detailed / Comprehensive)
  - [ ] Emphasis (Skills / Impact / Keywords)
  - [ ] Industry (Tech / Finance / Healthcare / Generic)
  - [ ] Experience Level (Entry / Mid / Senior)
- [ ] Verify default values: Professional, Detailed, Impact, Generic, Mid
- [ ] Change preferences to non-default values
- [ ] Save preferences
- [ ] Refresh page and verify preferences persisted
- [ ] Click "Reset to Defaults" and verify all reset
- [ ] Generate suggestions with different preference combinations
- [ ] Verify suggestion tone/style changes based on preferences

### Story 11.3: Score Comparison

- [ ] Generate suggestions for a resume
- [ ] Verify original ATS score displayed
- [ ] Verify projected score displayed (based on suggestion point values)
- [ ] Verify improvement delta shown prominently (e.g., "+12 points")
- [ ] Verify delta color: green for improvement, red for decrease
- [ ] Verify breakdown by category (Summary, Skills, Experience)
- [ ] Verify each category shows its contribution to score change
- [ ] Regenerate suggestions and verify scores update
- [ ] Test edge case: no suggestions (delta should be 0)
- [ ] Verify responsive layout on mobile viewport

### Story 11.4: Before/After Text Comparison

- [ ] Generate suggestions and view before/after comparison
- [ ] Verify "Before & After Comparison" header visible
- [ ] Verify comparison shows original text (left/top)
- [ ] Verify comparison shows suggested text (right/bottom)
- [ ] Verify text differences highlighted:
  - [ ] Insertions in green with underline
  - [ ] Deletions in red with strikethrough
  - [ ] Equal text unformatted
- [ ] Verify section tabs for multiple sections (Summary, Skills, Experience)
- [ ] Switch between section tabs
- [ ] Verify navigation controls for sections with multiple suggestions
- [ ] Click "Hide Comparison" to collapse
- [ ] Click "Show Comparison" to expand
- [ ] Verify collapsed state shows section count
- [ ] Verify accessible ARIA labels on collapse/expand button
- [ ] Verify responsive layout: side-by-side on desktop, stacked on mobile

### Integration Verification

- [ ] All features work together in single optimization flow
- [ ] Point values appear alongside before/after comparison
- [ ] Score comparison reflects point values from suggestions
- [ ] Preferences affect all generated suggestions consistently
- [ ] No console errors during full optimization flow
- [ ] No layout shifts or broken styling
- [ ] Performance: diff operations complete in < 100ms

---

## Running Tests

```bash
# Unit tests (Epic 11 only)
npx vitest run \
  tests/unit/ai/point-value.test.ts \
  tests/unit/components/point-value-display.test.tsx \
  tests/unit/preferences/preferences.test.ts \
  tests/unit/components/preferences-dialog.test.tsx \
  tests/unit/utils/scoreCalculation.test.ts \
  tests/unit/components/score-comparison.test.tsx \
  tests/unit/utils/textDiff.test.ts \
  tests/unit/components/before-after-comparison.test.tsx

# Integration tests (Epic 11)
npx vitest run \
  tests/integration/preferences-pipeline.test.ts \
  tests/integration/preferences-persistence.test.ts

# E2E tests (requires running dev server)
npx playwright test tests/e2e/11-1-point-values.spec.ts
npx playwright test tests/e2e/11-3-score-comparison.spec.ts

# All tests
npm run test:all
```
