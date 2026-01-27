# Epic 7 Test Plan: Error Handling & Feedback

**Version:** V0.1
**Epic:** Epic 7 - Error Handling & Feedback
**Test Coverage:** Integration & E2E Tests
**Last Updated:** 2026-01-26

---

## Overview

This test plan covers comprehensive integration and E2E testing for Epic 7 error handling and feedback features, ensuring robust error recovery, retry mechanisms, and user feedback capabilities for V0.1 release.

---

## Test Strategy

### Test Levels

| Level | Purpose | Tools | Coverage |
|-------|---------|-------|----------|
| **Unit** | Component isolation | Vitest | Stories 7.1-7.4 (18 tests) |
| **Integration** | Cross-component workflows | Playwright | Story 7.5 (21 tests) |
| **E2E** | Full user journeys | Playwright | Story 7.5 (21 tests) |

### Total Test Count

- **E2E Tests:** 21 scenarios across 4 files
- **Integration Tests:** 21 scenarios across 4 files
- **Unit Tests:** 18 scenarios (from Stories 7.1-7.4)
- **Total:** 60 test scenarios

---

## Error Types Matrix

| Error Code | Retriable | Recovery Action | Test Coverage |
|------------|-----------|-----------------|---------------|
| `INVALID_FILE_TYPE` | ❌ No | Upload valid format | ✅ E2E + Integration |
| `FILE_TOO_LARGE` | ❌ No | Upload smaller file | ✅ E2E + Integration |
| `PARSE_ERROR` | ❌ No | Try different file | ✅ E2E + Integration |
| `LLM_TIMEOUT` | ✅ Yes (1s, 2s, 4s) | Retry or smaller input | ✅ E2E + Integration |
| `LLM_ERROR` | ✅ Yes (1s, 2s, 4s) | Retry | ✅ E2E + Integration |
| `RATE_LIMITED` | ✅ Yes (1s, 2s, 4s) | Retry | ✅ E2E + Integration |
| `VALIDATION_ERROR` | ❌ No | Provide valid input | ✅ E2E + Integration |

---

## Test Files Structure

### E2E Tests (`tests/e2e/`)

1. **`7-5-retry-button-visibility.spec.ts`** (7 tests, P1)
   - Tests retry button shows for retriable errors (LLM_TIMEOUT, LLM_ERROR, RATE_LIMITED)
   - Tests retry button hidden for non-retriable errors (INVALID_FILE_TYPE, FILE_TOO_LARGE, PARSE_ERROR, VALIDATION_ERROR)
   - **Coverage:** AC-2

2. **`7-5-session-persistence.spec.ts`** (5 tests, P0)
   - Tests error state persists across page refresh
   - Tests retry count persists across page refresh
   - Tests feedback persists across page refresh
   - Tests complete state (error + retry + feedback) persists
   - Tests resume/JD preservation through error cycles
   - **Coverage:** AC-7, AC-9 (P0 BLOCKER)

3. **`7-5-v01-regression.spec.ts`** (3 tests, P0)
   - Tests full V0.1 workflow: upload → parse → analyze → optimize → feedback
   - Tests error scenarios don't break existing functionality
   - Tests cross-epic integration (Epics 1-7)
   - **Coverage:** AC-10 (P0 BLOCKER)

4. **`7-5-feedback-persistence.spec.ts`** (6 tests, P1)
   - Tests feedback persists on summary suggestions
   - Tests feedback persists on skills suggestions
   - Tests feedback persists on experience suggestions
   - Tests mixed feedback across all suggestion types
   - Tests feedback toggle state persists
   - Tests feedback change (thumbs up → thumbs down) persists
   - **Coverage:** AC-5, AC-6

### Integration Tests (`tests/integration/`)

1. **`7-5-error-display-retry-integration.spec.ts`** (4 tests, P1)
   - Tests error display component shows correct messages
   - Tests retry button integration with state management
   - Tests error clearing workflow
   - Tests sequential error handling
   - **Coverage:** AC-1, AC-2

2. **`7-5-feedback-supabase-integration.spec.ts`** (6 tests, P1)
   - Tests feedback recording to Supabase
   - Tests feedback retrieval from Supabase
   - Tests feedback toggle and update
   - Tests anonymous user feedback
   - Tests feedback persistence after page refresh
   - Tests feedback across different suggestion types
   - **Coverage:** AC-5, AC-8

3. **`7-5-error-retry-feedback-workflow.spec.ts`** (6 tests, P1)
   - Tests error → retry → success → feedback workflow
   - Tests error → timeout → dismiss → smaller input → success
   - Tests multiple retries → success → feedback
   - Tests resume → feedback → change job → new feedback
   - Tests cross-error feedback (error then feedback)
   - Tests state preservation through workflow
   - **Coverage:** AC-6, AC-7

4. **`7-5-cross-epic-integration.spec.ts`** (5 tests, P0)
   - Tests Epic 1-6 functionality after Epic 7 changes
   - Tests resume upload (Epic 3) + error handling (Epic 7)
   - Tests job description (Epic 4) + error handling (Epic 7)
   - Tests suggestions (Epic 6) + feedback (Epic 7)
   - Tests full workflow integration across all epics
   - **Coverage:** AC-10 (P0 BLOCKER)

---

## Test Scenarios

### Priority 0 (BLOCKING - Must Pass)

| Test ID | Scenario | Expected Outcome | Test File |
|---------|----------|------------------|-----------|
| 7.5-E2E-003 | Session persistence: error + retry + feedback across refresh | All state restored | `7-5-session-persistence.spec.ts` |
| 7.5-E2E-004 | V0.1 regression: full workflow works | No Epic 1-6 regressions | `7-5-v01-regression.spec.ts` |
| 7.5-INT-004 | Cross-epic integration | All epics work together | `7-5-cross-epic-integration.spec.ts` |

### Priority 1 (HIGH - Must Fix Before Merge)

| Test ID | Scenario | Expected Outcome | Test File |
|---------|----------|------------------|-----------|
| 7.5-E2E-001 | Retry button shows for retriable errors only | Button visible for LLM errors | `7-5-retry-button-visibility.spec.ts` |
| 7.5-E2E-002 | Feedback persists across all suggestion types | Feedback restored after refresh | `7-5-feedback-persistence.spec.ts` |
| 7.5-INT-001 | Error display + retry integration | Correct messages, working retry | `7-5-error-display-retry-integration.spec.ts` |
| 7.5-INT-002 | Feedback Supabase integration | Feedback saved and retrieved | `7-5-feedback-supabase-integration.spec.ts` |
| 7.5-INT-003 | Error → retry → feedback workflow | Complete workflow works | `7-5-error-retry-feedback-workflow.spec.ts` |

---

## Test Execution

### Running Tests

```bash
# Run all Epic 7 E2E tests
npm run test:e2e -- 7-5

# Run all Epic 7 Integration tests
npm run test:integration -- 7-5

# Run P0 tests only (blocking)
npm run test:e2e -- 7-5-session-persistence
npm run test:e2e -- 7-5-v01-regression
npm run test:integration -- 7-5-cross-epic-integration

# Run all Epic 7 tests (E2E + Integration)
npm run test:e2e -- 7-5 && npm run test:integration -- 7-5
```

### Test Prerequisites

1. **Environment Setup:**
   - Supabase running locally or connected to dev instance
   - Environment variables configured (`.env.local`)
   - Test database seeded with anonymous session

2. **Test Data:**
   - Valid PDF resume (`tests/fixtures/valid-resume.pdf`)
   - Valid DOCX resume (`tests/fixtures/valid-resume.docx`)
   - Sample job description (`tests/fixtures/job-description.txt`)
   - Invalid file types for error testing

3. **Network Mocking:**
   - All tests use route interception (network-first pattern)
   - No real LLM API calls in tests
   - Supabase calls mocked where appropriate

---

## Manual Testing Checklist

### Error Display Testing

- [ ] Trigger `INVALID_FILE_TYPE` - upload .txt file as resume
- [ ] Trigger `FILE_TOO_LARGE` - upload file > 5MB
- [ ] Trigger `PARSE_ERROR` - upload corrupted PDF
- [ ] Trigger `LLM_TIMEOUT` - simulate 60s timeout (network throttle)
- [ ] Trigger `LLM_ERROR` - simulate API failure (network offline)
- [ ] Trigger `RATE_LIMITED` - simulate 429 response
- [ ] Trigger `VALIDATION_ERROR` - submit empty inputs
- [ ] Verify correct error messages for each type
- [ ] Verify recovery actions displayed correctly
- [ ] Verify retry button shows only for retriable errors

### Retry Testing

- [ ] Click retry after `LLM_TIMEOUT` error
- [ ] Verify 1s delay on first retry
- [ ] Verify 2s delay on second retry
- [ ] Verify 4s delay on third retry
- [ ] Verify retry button disabled during retry
- [ ] Verify loading indicator shows during retry
- [ ] Verify success after retry shows suggestions
- [ ] Verify max retries (3) disables retry button

### Feedback Testing

- [ ] Provide thumbs up on summary suggestion
- [ ] Provide thumbs down on skills suggestion
- [ ] Provide mixed feedback on experience suggestions
- [ ] Refresh page - verify all feedback restored
- [ ] Toggle feedback (up → down → up)
- [ ] Verify visual confirmation on feedback record
- [ ] Verify feedback persists in Supabase
- [ ] Test feedback as anonymous user

### State Persistence Testing

- [ ] Trigger error → refresh → verify error still displayed
- [ ] Retry → refresh → verify retry count preserved
- [ ] Record feedback → refresh → verify feedback restored
- [ ] Upload resume → error → refresh → verify resume preserved
- [ ] Enter job description → error → refresh → verify JD preserved

### Workflow Testing

- [ ] Error → Retry → Success → Feedback (complete flow)
- [ ] Error → Timeout → Dismiss → Smaller Input → Success
- [ ] Multiple Retries → Final Success → Feedback
- [ ] Resume → Feedback → Change Job → New Feedback
- [ ] Full V0.1 flow: Upload → Parse → Analyze → Optimize → Feedback

### Cross-Browser Testing

- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Chrome (responsive)
- [ ] Mobile Safari (responsive)

### Accessibility Testing

- [ ] Keyboard navigation (Tab, Enter, Space)
- [ ] Screen reader (error messages, buttons, feedback)
- [ ] WCAG AA contrast ratios
- [ ] Focus indicators visible
- [ ] ARIA labels present and accurate

---

## Performance Gates

| Metric | Target | Measurement | Status |
|--------|--------|-------------|--------|
| Error display time | < 100ms | Time from error to UI render | ⏳ Pending |
| Feedback recording | < 500ms | Time from click to confirmation | ⏳ Pending |
| Retry backoff accuracy | ±100ms | Measured vs expected delay | ⏳ Pending |
| Session persistence read | < 200ms | Supabase read time | ⏳ Pending |
| Session persistence write | < 300ms | Supabase write time | ⏳ Pending |

---

## UAT Scenarios

### UAT-1: Retry After Timeout
**Steps:**
1. Upload large resume + large job description
2. Wait for LLM_TIMEOUT error (60s)
3. Click retry button
4. Verify 1s delay, then success
5. Verify suggestions displayed

**Expected:** User can recover from timeout via retry

---

### UAT-2: Feedback Across Refresh
**Steps:**
1. Complete optimization (get suggestions)
2. Provide thumbs up on summary
3. Provide thumbs down on skills
4. Refresh page
5. Verify feedback icons restored

**Expected:** Feedback persists for anonymous users

---

### UAT-3: Error Recovery Path
**Steps:**
1. Upload invalid file (.txt)
2. See INVALID_FILE_TYPE error
3. Upload valid PDF
4. Complete optimization successfully
5. Provide feedback

**Expected:** User recovers from error and completes workflow

---

### UAT-4: No Retry on Non-Retriable
**Steps:**
1. Upload file > 5MB
2. See FILE_TOO_LARGE error
3. Verify no retry button shown
4. Verify recovery action: "Upload smaller file"

**Expected:** Non-retriable errors guide user to fix

---

### UAT-5: State Preservation
**Steps:**
1. Upload resume
2. Enter job description
3. Get LLM_TIMEOUT error
4. Refresh page
5. Verify resume, JD, and error still present
6. Click retry
7. Verify success

**Expected:** No data loss on page refresh

---

### UAT-6: Anonymous User Complete Flow
**Steps:**
1. Open app (no login)
2. Upload resume
3. Enter job description
4. Get suggestions
5. Provide feedback
6. Refresh page
7. Verify everything restored

**Expected:** Anonymous users fully supported

---

## Known Issues & Limitations

### Known Issues
- None at this time

### Limitations
- PDF parsing requires text-based PDFs (no OCR)
- File size limited to 5MB
- LLM timeout set to 60s (not configurable)
- Maximum 3 retry attempts
- Feedback requires Supabase connection

---

## Test Results Log

| Test Run | Date | E2E Pass | Integration Pass | Failures | Notes |
|----------|------|----------|------------------|----------|-------|
| Initial | 2026-01-26 | ⏳ Pending | ⏳ Pending | - | Tests generated |

---

## Sign-Off Criteria

### Must Pass Before V0.1 Release

- [ ] All P0 tests passing (3 tests)
- [ ] All P1 tests passing (5 tests)
- [ ] All 7 error types tested manually
- [ ] All 6 UAT scenarios pass
- [ ] Performance gates met
- [ ] Accessibility verified (WCAG AA)
- [ ] Cross-browser testing complete
- [ ] No P0/P1 bugs open
- [ ] Test documentation complete
- [ ] Traceability matrix shows 100% P0 coverage

---

## Contacts

| Role | Name | Responsibility |
|------|------|----------------|
| Test Architect | TEA (Murat) | Test strategy, framework, review |
| Developer | Lawrence | Implementation, unit tests |
| QA Engineer | TBD | Manual testing, UAT execution |
| Product Owner | TBD | UAT acceptance, sign-off |

---

## References

- [Traceability Matrix](/Users/lawrence/Desktop/submit_smart/_bmad-output/traceability-matrix-epic-7.md)
- [Test Automation Summary](/Users/lawrence/Desktop/submit_smart/_bmad-output/test-automation-summary-epic-7.md)
- [Story 7.5](/_bmad-output/implementation-artifacts/7-5-epic-7-integration-and-verification-testing.md)
- [Project Context](/_bmad-output/project-context.md)
- [Architecture](/_bmad-output/planning-artifacts/architecture.md)

---

_Last Updated: 2026-01-26_
_Version: V0.1_
_Status: Ready for Test Execution_
