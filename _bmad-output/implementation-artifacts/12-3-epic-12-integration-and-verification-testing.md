# Story 12.3: Epic 12 Integration and Verification Testing

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to verify that all Epic 12 stories (LLM-as-Judge pipeline and quality metrics logging) integrate correctly end-to-end,
So that the quality assurance system reliably evaluates suggestions, logs metrics, and monitors quality health in production.

## Acceptance Criteria

1. **Given** the suggestion generation pipeline runs
   **When** the judge step evaluates each suggestion
   **Then** judge scores (0-100) are present on all returned suggestions
   **And** criteria breakdown (authenticity, clarity, ATS relevance, actionability) is populated
   **And** graceful degradation returns suggestions without scores if the judge fails

2. **Given** judge evaluations complete for an optimization
   **When** quality metrics are collected
   **Then** metrics are logged to the configured output (console/file)
   **And** metrics include: pass rate, average score, score distribution, criteria averages, failure breakdown
   **And** metrics logging does not block or slow the suggestion pipeline

3. **Given** quality metrics have been logged
   **When** the metrics query API is called
   **Then** `/api/metrics/quality-summary` returns aggregated daily and weekly metrics
   **And** `/api/health/quality-metrics` returns health status with alerts
   **And** both endpoints follow the ActionResponse pattern with 5-minute cache headers

4. **Given** quality evaluation is degraded
   **When** pass rate drops below 70% or average score drops below 65
   **Then** the alert system emits warnings via console
   **And** the health check endpoint reflects warning/critical status
   **And** alert thresholds are configurable

5. **Given** Epic 12 is complete
   **When** I run the full verification checklist
   **Then** all judge + metrics unit tests pass (56+ tests across 7 test files)
   **And** all integration tests pass (judge pipeline, metrics API endpoints)
   **And** TypeScript compilation succeeds with no errors
   **And** no regressions in existing Epic 1-11 tests
   **And** system is production-ready for quality assurance

## Tasks / Subtasks

### Phase 1: Cross-Story Integration Verification

- [ ] **Task 1: Judge Pipeline End-to-End Verification** (AC: #1)
  - [ ] Verify `judgeSuggestion()` is called in all 3 suggestion routes (summary, skills, experience)
  - [ ] Verify summary route: judge scores on `SummarySuggestion` fields (`judge_score`, `judge_passed`, `judge_reasoning`, `judge_criteria`)
  - [ ] Verify skills route: judge scores on individual `SkillItem` entries in `missing_but_relevant` array
  - [ ] Verify experience route: judge scores on individual `BulletSuggestion` entries in each experience entry
  - [ ] Verify existing integration tests: `tests/integration/judge-pipeline.test.ts` passes (5 tests)
  - [ ] Verify graceful degradation: suggestions returned without scores when judge fails

- [ ] **Task 2: Metrics Collection Integration Verification** (AC: #2)
  - [ ] Verify `collectQualityMetrics()` is called after judge evaluation in all 3 suggestion routes
  - [ ] Verify `logQualityMetrics()` writes metrics to configured output (console/file)
  - [ ] Verify metrics collection is wrapped in try-catch and never breaks the suggestion pipeline
  - [ ] Verify batch trace logging (`logJudgeBatchTrace()`) is called in skills and experience routes
  - [ ] Verify per-result trace logging is integrated in `judgeSuggestion.ts` (gated by `DEBUG=judge`)
  - [ ] Verify existing unit tests: `tests/unit/metrics/qualityMetrics.test.ts` (16 tests), `tests/unit/metrics/failureAnalyzer.test.ts` (11 tests)

- [ ] **Task 3: Metrics API Endpoint Verification** (AC: #3)
  - [ ] Verify `/api/metrics/quality-summary` returns `ActionResponse<QualitySummaryResponse>` with daily metrics, trend, and failure patterns
  - [ ] Verify `/api/metrics/quality-summary?period=weekly` returns weekly aggregate
  - [ ] Verify `/api/health/quality-metrics` returns `ActionResponse<QualityHealthCheck>` with status, pass_rate, avg_score, alerts
  - [ ] Verify both endpoints return `Cache-Control: private, max-age=300` headers
  - [ ] Verify both endpoints handle errors gracefully (ActionResponse pattern, no throws)
  - [ ] Verify existing unit tests: `tests/unit/metrics/metricsQuery.test.ts` (10 tests)

- [ ] **Task 4: Alert System Integration Verification** (AC: #4)
  - [ ] Verify `checkAndEmitAlerts()` is called automatically after every `logQualityMetrics()` call
  - [ ] Verify warning alert fires when pass_rate < 70%
  - [ ] Verify critical alert fires when pass_rate < 50%
  - [ ] Verify average score warning fires when avg_score < 65
  - [ ] Verify health check endpoint reflects correct status (healthy/warning/critical)
  - [ ] Verify existing unit tests: `tests/unit/metrics/alerts.test.ts` (10 tests), `tests/unit/metrics/judgeTrace.test.ts` (9 tests)

---

### Phase 2: New Integration Tests

- [ ] **Task 5: Create Metrics Pipeline Integration Test** (AC: #1, #2, #5)
  - [ ] Create `/tests/integration/12-3-metrics-pipeline.test.ts`
  - [ ] Test: Summary route calls `collectQualityMetrics` and `logQualityMetrics` after judge
  - [ ] Test: Skills route calls `collectQualityMetrics` and `logQualityMetrics` after judge
  - [ ] Test: Experience route calls `collectQualityMetrics` and `logQualityMetrics` after judge
  - [ ] Test: Metrics logging failure does not prevent suggestion from being returned
  - [ ] Test: Batch trace logging is invoked for skills and experience routes
  - [ ] Mock judge, generation, session, and metrics modules appropriately

- [ ] **Task 6: Create Metrics API Integration Test** (AC: #3, #4)
  - [ ] Create `/tests/integration/12-3-metrics-api.test.ts`
  - [ ] Test: GET `/api/metrics/quality-summary` returns valid ActionResponse with daily metrics
  - [ ] Test: GET `/api/metrics/quality-summary?period=weekly` returns weekly metrics
  - [ ] Test: GET `/api/health/quality-metrics` returns valid ActionResponse with health status
  - [ ] Test: Health endpoint returns "healthy" status when no logs exist (no data = no alerts)
  - [ ] Test: Endpoints include proper cache headers
  - [ ] Mock file system for JSONL data

- [ ] **Task 7: Create End-to-End Pipeline Integration Test** (AC: #1, #2, #4)
  - [ ] Create `/tests/integration/12-3-full-pipeline.test.ts`
  - [ ] Test: Full suggestion → judge → metrics → alert flow (summary)
  - [ ] Test: Full suggestion → judge → metrics → alert flow (skills)
  - [ ] Test: Full suggestion → judge → metrics → alert flow (experience)
  - [ ] Test: Low quality judge results trigger alert emission
  - [ ] Verify all components connected in correct order

---

### Phase 3: Regression & Cross-Epic Verification

- [ ] **Task 8: Run Full Test Suite** (AC: #5)
  - [ ] Run `npm run test:all` and verify all tests pass
  - [ ] Verify no regressions in Epic 1-11 tests
  - [ ] Verify all 56+ metrics and judge tests pass:
    - `tests/unit/ai/judgePrompt.test.ts` (10 tests)
    - `tests/unit/ai/judgeSuggestion.test.ts` (14 tests)
    - `tests/integration/judge-pipeline.test.ts` (5 tests)
    - `tests/unit/metrics/qualityMetrics.test.ts` (16 tests)
    - `tests/unit/metrics/failureAnalyzer.test.ts` (11 tests)
    - `tests/unit/metrics/metricsQuery.test.ts` (10 tests)
    - `tests/unit/metrics/alerts.test.ts` (10 tests)
    - `tests/unit/metrics/judgeTrace.test.ts` (9 tests)
  - [ ] Run `npx tsc --noEmit` and verify no TypeScript errors
  - [ ] Run `npm run build` to verify production build succeeds

- [ ] **Task 9: Cross-Story Dependency Verification** (AC: #5)
  - [ ] Story 6.2-6.4 (Suggestion Generation): Judge integrates without breaking generation
  - [ ] Story 6.5 (Suggestion Display): Judge fields are optional, backward compatible
  - [ ] Story 7.1-7.3 (Error Handling): Timeout handling works with judge step included
  - [ ] Story 11.1 (Point Values): Judge scores don't interfere with point values
  - [ ] Story 11.2 (Preferences): Preferences correctly passed through to generation (not judge)
  - [ ] Story 12.1 (Judge): All judge pipeline tests pass
  - [ ] Story 12.2 (Metrics): All metrics tests pass

---

### Phase 4: Verification Documentation

- [ ] **Task 10: Create Epic 12 Verification Checklist** (AC: #5)
  - [ ] Create `/docs/EPIC-12-VERIFICATION.md`
  - [ ] Document: Judge pipeline verification results
  - [ ] Document: Metrics collection verification results
  - [ ] Document: Alert system verification results
  - [ ] Document: Performance verification results
  - [ ] Document: Test coverage summary (total tests, pass rate)
  - [ ] Include production readiness sign-off

- [ ] **Task 11: Update Sprint Status** (AC: #5)
  - [ ] Update `sprint-status.yaml`: 12-3 → done
  - [ ] Update `sprint-status.yaml`: epic-12 → done
  - [ ] Verify all stories in Epic 12 are marked done

---

## Dev Notes

### What Epic 12 Delivers

- **Story 12.1:** LLM-as-Judge Pipeline Step — Quality validation for all suggestions
  - Judge prompt template (`/lib/ai/judgePrompt.ts`)
  - Judge LLM function (`/lib/ai/judgeSuggestion.ts`)
  - Integration into all 3 suggestion API routes
  - Types in `/types/judge.ts` and updated `/types/suggestions.ts`
  - 29 unit + integration tests

- **Story 12.2:** Quality Metrics Logging — Monitoring and analysis
  - Metrics collection (`/lib/metrics/qualityMetrics.ts`)
  - JSONL file logger (`/lib/metrics/metricsLogger.ts`)
  - Failure pattern analyzer (`/lib/metrics/failureAnalyzer.ts`)
  - Query service (`/lib/metrics/metricsQuery.ts`)
  - Alert system (`/lib/metrics/alerts.ts`)
  - Judge trace logging (`/lib/metrics/judgeTrace.ts`)
  - Types in `/types/metrics.ts`
  - API endpoints: `/api/metrics/quality-summary`, `/api/health/quality-metrics`
  - Shared utility: `/lib/utils/truncateAtSentence.ts`
  - 56 unit tests across 5 test files

### Source Files Created in Epic 12

**Story 12.1 Files:**
- `/types/judge.ts` — JudgeResult, JudgeCriteriaScores, SuggestionContext, constants
- `/lib/ai/judgePrompt.ts` — Judge prompt template builder
- `/lib/ai/judgeSuggestion.ts` — Judge LLM function with per-result trace logging
- `/tests/unit/ai/judgePrompt.test.ts` — 10 tests
- `/tests/unit/ai/judgeSuggestion.test.ts` — 14 tests
- `/tests/integration/judge-pipeline.test.ts` — 5 tests

**Story 12.2 Files:**
- `/types/metrics.ts` — QualityMetricLog, AggregatedMetrics, QualityHealthCheck, etc.
- `/lib/metrics/qualityMetrics.ts` — collectQualityMetrics()
- `/lib/metrics/metricsLogger.ts` — logQualityMetrics() with console/file/database modes
- `/lib/metrics/failureAnalyzer.ts` — extractFailurePatterns()
- `/lib/metrics/metricsQuery.ts` — getTodayMetrics(), getWeeklyMetrics(), etc.
- `/lib/metrics/alerts.ts` — evaluateQualityHealth(), checkAndEmitAlerts()
- `/lib/metrics/judgeTrace.ts` — logJudgeResultTrace(), logJudgeBatchTrace()
- `/lib/utils/truncateAtSentence.ts` — Shared text truncation utility
- `/app/api/metrics/quality-summary/route.ts` — Quality metrics summary API
- `/app/api/health/quality-metrics/route.ts` — Health check API
- `/tests/unit/metrics/qualityMetrics.test.ts` — 16 tests
- `/tests/unit/metrics/failureAnalyzer.test.ts` — 11 tests
- `/tests/unit/metrics/metricsQuery.test.ts` — 10 tests
- `/tests/unit/metrics/alerts.test.ts` — 10 tests
- `/tests/unit/metrics/judgeTrace.test.ts` — 9 tests

**Story 12.1+12.2 Modified Files:**
- `/app/api/suggestions/summary/route.ts` — Judge + metrics integration
- `/app/api/suggestions/skills/route.ts` — Judge + metrics + batch trace
- `/app/api/suggestions/experience/route.ts` — Judge + metrics + batch trace + timeout re-throw
- `/types/suggestions.ts` — Optional judge fields on suggestion types
- `/tests/setup.ts` — server-only mock for test environment

### Project Structure Notes

- All metrics modules in `/lib/metrics/` — consistent with project structure rules
- All LLM operations in `/lib/ai/` — consistent with CLAUDE.md rules
- API routes follow ActionResponse pattern with proper error codes
- Types centralized in `/types/` directory
- Tests mirror source structure (`tests/unit/metrics/`, `tests/unit/ai/`, `tests/integration/`)

### Testing Standards

- Vitest for unit and integration tests
- Mock external dependencies (LLM calls, Supabase, file system)
- Use `vi.spyOn(fs.promises, 'readFile')` for fs mocking (not `vi.mock('fs')`)
- Use `vi.mock()` with factory functions for module mocking
- Integration tests verify cross-module interactions
- All API routes tested via `NextRequest`/`NextResponse` pattern

### Performance Budget

- Judge step: <5 seconds per suggestion (uses Claude Haiku)
- Metrics collection: <50ms per optimization
- Metrics logging: Async/non-blocking
- Total pipeline: <60 seconds including judge step
- Cost: ~$0.02 per optimization (well within $0.10 budget)

### References

- [Source: `_bmad-output/implementation-artifacts/12-1-implement-llm-as-judge-pipeline-step.md`]
- [Source: `_bmad-output/implementation-artifacts/12-2-implement-quality-metrics-logging.md`]
- [Source: `_bmad-output/project-context.md#Critical Implementation Rules`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Epic 12`]
- [Source: `types/judge.ts`]
- [Source: `types/metrics.ts`]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

### File List
