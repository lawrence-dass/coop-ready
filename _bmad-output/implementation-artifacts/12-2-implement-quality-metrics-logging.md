# Story 12.2: Implement Quality Metrics Logging

**Status:** in-progress
**Epic:** 12 - Quality Assurance
**Version:** V1.0

---

## Story

As a developer,
I want to collect, log, and analyze quality metrics from the LLM-as-Judge pipeline,
So that I can monitor suggestion quality over time and identify patterns in what passes or fails evaluation.

---

## Acceptance Criteria

1. **Given** suggestions are evaluated by the judge
   **When** evaluation completes
   **Then** comprehensive metrics are logged including: pass rate, average score, criteria breakdown, failure patterns

2. **Given** metrics are being collected
   **When** I query the system
   **Then** I can retrieve aggregated statistics (daily, weekly, by section type)
   **And** metrics show: total evaluated, pass/fail counts, score distributions, top failure reasons

3. **Given** judge evaluation is running
   **When** I review the logs
   **Then** I see detailed evaluation traces for debugging
   **And** failure reasons are categorized (authenticity, clarity, ATS, actionability)

4. **Given** metrics are tracked over time
   **When** I analyze trends
   **Then** I can identify: improving/degrading quality, which sections have most failures, common failure patterns
   **And** this data informs future judge prompt improvements

5. **Given** the metrics system is deployed
   **When** monitoring is running
   **Then** quality baseline is established
   **And** alerts trigger if pass rate drops below 70%

---

## Tasks / Subtasks

### Phase 1: Design Metrics Framework

- [x] **Task 1: Define Quality Metrics** (AC: #1, #2)
  - [x] Primary metrics:
    - Pass rate (% of suggestions ≥60 score)
    - Average score (mean of all evaluations)
    - Score distribution (by quintile: 0-20, 20-40, 40-60, 60-80, 80-100)
  - [x] Criteria breakdown:
    - Average authenticity score
    - Average clarity score
    - Average ATS relevance score
    - Average actionability score
  - [x] Failure patterns:
    - % failed for authenticity
    - % failed for clarity
    - % failed for ATS relevance
    - % failed for actionability
  - [x] By section:
    - Separate metrics for Summary, Skills, Experience
  - [x] Granularity: Per optimization run, daily aggregate, weekly aggregate

- [x] **Task 2: Design Metrics Storage** (AC: #2)
  - [x] Option A: Log to console (development)
  - [x] Option B: Log to file (logs/quality-metrics.jsonl)
  - [x] Option C: Store in database (Supabase analytics table)
  - [x] Recommendation: File-based JSONL + optional database for production
  - [x] Schema:
    ```typescript
    interface QualityMetricLog {
      timestamp: string; // ISO 8601
      optimization_id: string;
      section: 'summary' | 'skills' | 'experience';
      total_evaluated: number;
      passed: number; // score >= 60
      failed: number;
      pass_rate: number; // 0-100
      avg_score: number;
      score_distribution: {
        range_0_20: number;
        range_20_40: number;
        range_40_60: number;
        range_60_80: number;
        range_80_100: number;
      };
      criteria_avg: {
        authenticity: number;
        clarity: number;
        ats_relevance: number;
        actionability: number;
      };
      failure_breakdown: {
        authenticity_failures: number;
        clarity_failures: number;
        ats_failures: number;
        actionability_failures: number;
      };
      common_failures: Array<{
        reason: string;
        count: number;
      }>;
    }
    ```

- [x] **Task 3: Design Aggregation Strategy** (AC: #2)
  - [x] Real-time: Per-optimization metrics logged immediately
  - [x] Daily: Aggregate metrics at EOD (UTC)
  - [x] Weekly: Aggregate metrics at EOW (Monday UTC)
  - [x] Monthly: Trend analysis
  - [x] Aggregation schema:
    ```typescript
    interface AggregatedMetrics {
      period: 'daily' | 'weekly' | 'monthly';
      date: string;
      total_optimizations: number;
      metrics: {
        overall_pass_rate: number;
        overall_avg_score: number;
        by_section: {
          summary: SectionMetrics;
          skills: SectionMetrics;
          experience: SectionMetrics;
        };
      };
    }
    ```

---

### Phase 2: Metrics Collection & Logging

- [x] **Task 4: Create Metrics Collection Utility** (AC: #1, #2)
  - [x] Create `/lib/metrics/qualityMetrics.ts`
  - [x] Function: `collectQualityMetrics(results: JudgeResult[], section: string, optimizationId: string): QualityMetricLog`
  - [x] Implementation:
    - [x] Calculate pass/fail counts
    - [x] Calculate average scores
    - [x] Calculate score distribution
    - [x] Calculate criteria breakdowns
    - [x] Extract failure reasons from result reasoning field
    - [x] Categorize failures by criterion
  - [x] Return structured QualityMetricLog object

- [x] **Task 5: Create Metrics Logging Service** (AC: #1, #3)
  - [x] Create `/lib/metrics/metricsLogger.ts`
  - [x] Function: `logQualityMetrics(metrics: QualityMetricLog): Promise<void>`
  - [x] Implementation options:
    - [x] Development: Log to console (structured JSON)
    - [x] File-based: Append to `logs/quality-metrics.jsonl` (one JSON object per line)
    - [x] Database: Insert into Supabase `quality_metrics` table (placeholder)
  - [x] Environment-based selection:
    ```typescript
    const METRICS_MODE = process.env.METRICS_MODE || 'console'; // 'console' | 'file' | 'database'
    ```
  - [x] Error handling: Failed metric logging shouldn't break pipeline
  - [x] Performance: Logging should be async/non-blocking

- [x] **Task 6: Integrate Metrics into Judge Pipeline** (AC: #1)
  - [x] Update `/api/suggestions/[section]/route.ts` files
  - [x] After judge evaluation, call `collectQualityMetrics()`
  - [x] Call `logQualityMetrics()` with collected metrics
  - [x] Include optimization ID in logs for traceability
  - [x] Wrap in try-catch to avoid breaking pipeline

- [x] **Task 7: Create Failure Pattern Analyzer** (AC: #3, #4)
  - [x] Create `/lib/metrics/failureAnalyzer.ts`
  - [x] Function: `extractFailurePatterns(results: JudgeResult[]): FailurePattern[]`
  - [x] Parse judge reasoning field to identify:
    - [x] Authenticity issues: "Possible exaggeration", "Vague accomplishment"
    - [x] Clarity issues: "Awkward phrasing", "Grammar error"
    - [x] ATS issues: "Missing keywords", "Poor formatting"
    - [x] Actionability issues: "Too vague", "Not measurable"
  - [x] Return categorized failure patterns with counts
  - [x] Use keyword matching or simple NLP to categorize

---

### Phase 3: Metrics Querying & Analysis

- [x] **Task 8: Create Metrics Query Service** (AC: #2, #4)
  - [x] Create `/lib/metrics/metricsQuery.ts`
  - [x] Functions:
    - [x] `getTodayMetrics(): AggregatedMetrics` - Daily aggregate
    - [x] `getWeeklyMetrics(): AggregatedMetrics` - Weekly aggregate
    - [x] `getMetricsBySection(section: string): SectionMetrics` - By section
    - [x] `getPassRateTrend(days: number): Array<{ date, pass_rate }>` - Trend analysis
    - [x] `getFailurePatterns(limit: number): FailurePattern[]` - Common failures
  - [x] Data source: Read from JSONL files with date-based file naming
  - [x] Server-only import guard

- [x] **Task 9: Create Metrics Dashboard Endpoint** (AC: #2)
  - [x] Create `/api/metrics/quality-summary` endpoint
  - [x] Returns aggregated quality metrics (daily + weekly + trend + failure patterns)
  - [x] ActionResponse pattern with 5-minute cache headers
  - [x] Server-only import guard

- [ ] **Task 10: Create Metrics CLI Command** (AC: #2, #4)
  - [ ] Create `/scripts/metrics.ts`
  - [ ] Commands:
    - [ ] `npm run metrics:today` - Show today's metrics
    - [ ] `npm run metrics:weekly` - Show weekly summary
    - [ ] `npm run metrics:failures` - Show top failures
    - [ ] `npm run metrics:trend --days 7` - Show 7-day trend
  - [ ] Outputs human-readable format (table, JSON, etc.)
  - [ ] Helpful for debugging and monitoring

---

### Phase 4: Detailed Logging & Tracing

- [x] **Task 11: Create Detailed Judge Trace Logging** (AC: #3)
  - [x] Create `/lib/metrics/judgeTrace.ts`
  - [x] Structured logging with score, criteria breakdown, pass/fail status
  - [x] Batch summary logging with pass rate
  - [x] Gated via `DEBUG=judge` or `DEBUG=*` environment variable
  - [x] Integrated into `judgeSuggestion.ts` for per-result traces
  - [x] Integrated into skills and experience routes for batch traces

- [ ] **Task 12: Add Detailed Metrics to Response** (AC: #1)
  - [ ] Update API response to include judge metrics summary:
    ```typescript
    {
      suggestions: { ... },
      judge_summary: {
        total_evaluated: 12,
        passed: 10,
        failed: 2,
        pass_rate: 83,
        avg_score: 74,
        by_criterion: { ... }
      }
    }
    ```
  - [ ] Optional: Include details on failed suggestions for debugging

---

### Phase 5: Alerting & Monitoring

- [x] **Task 13: Create Alert System** (AC: #5)
  - [x] Create `/lib/metrics/alerts.ts`
  - [x] Alert thresholds:
    - [x] Pass rate < 70%: Warning
    - [x] Pass rate < 50%: Critical
    - [x] Average score < 65: Warning
  - [x] `evaluateQualityHealth()` returns status + alerts array
  - [x] `checkAndEmitAlerts()` emits console.error/warn per metric log
  - [x] Integrated into metricsLogger (auto-alerts after every log write)

- [x] **Task 14: Create Health Check Endpoint** (AC: #5)
  - [x] Create `/api/health/quality-metrics` endpoint
  - [x] Returns QualityHealthCheck with status, pass_rate, avg_score, alerts
  - [x] ActionResponse pattern with 5-minute cache headers
  - [x] Uses evaluateQualityHealth from alerts module

---

### Phase 6: Data Persistence

- [ ] **Task 15: Create Metrics Rotation** (AC: #2)
  - [ ] For file-based logging: Rotate logs daily
    - [ ] Filename: `logs/quality-metrics-YYYY-MM-DD.jsonl`
    - [ ] Archive old logs after 30 days
  - [ ] For database: Index by date for efficient queries
  - [ ] Keep 90 days of detailed data, archive older data

- [ ] **Task 16: Create Database Schema (If Using DB)** (AC: #2)
  - [ ] Optional: Create `quality_metrics` table in Supabase
  - [ ] Schema:
    ```sql
    CREATE TABLE quality_metrics (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT now(),
      optimization_id UUID NOT NULL,
      section TEXT NOT NULL,
      pass_rate FLOAT NOT NULL,
      avg_score FLOAT NOT NULL,
      total_evaluated INT NOT NULL,
      metrics JSONB NOT NULL,
      user_id UUID REFERENCES auth.users(id)
    );
    CREATE INDEX idx_metrics_created_at ON quality_metrics(created_at DESC);
    CREATE INDEX idx_metrics_user_id ON quality_metrics(user_id);
    ```
  - [ ] RLS policy: Users see only their own metrics

---

### Phase 7: Testing

- [x] **Task 17: Unit Tests for Metrics Collection** (AC: #1, #2)
  - [x] Create `/tests/unit/metrics/qualityMetrics.test.ts`
  - [x] Test cases:
    - [x] Collect metrics from mixed judge results
    - [x] Calculate pass rate correctly
    - [x] Calculate score distributions
    - [x] Extract criteria averages
    - [x] Handle edge cases (all pass, all fail, empty results)

- [x] **Task 18: Unit Tests for Failure Analysis** (AC: #3)
  - [x] Create `/tests/unit/metrics/failureAnalyzer.test.ts`
  - [x] Test cases:
    - [x] Identify authenticity failures
    - [x] Identify clarity failures
    - [x] Identify ATS failures
    - [x] Identify actionability failures
    - [x] Handle unknown failure patterns

- [ ] **Task 19: Integration Tests for Metrics Pipeline** (AC: #1, #2, #5)
  - [ ] Create `/tests/integration/metrics-pipeline.test.ts`
  - [ ] Test scenarios:
    - [ ] Metrics logged after judge evaluation
    - [ ] Query today's metrics
    - [ ] Health check returns correct status
    - [ ] Alerts trigger on degraded quality
    - [ ] File rotation works (if file-based)

- [ ] **Task 20: E2E Tests for Metrics Monitoring** (AC: #1-5)
  - [ ] Create `/tests/e2e/12-2-metrics-logging.spec.ts`
  - [ ] Test scenarios:
    - [ ] Full optimization with metrics collection
    - [ ] Metrics endpoint returns data
    - [ ] Dashboard displays metrics
    - [ ] CLI commands work
    - [ ] Alerts trigger appropriately

---

### Phase 8: Dashboard & Visualization

- [ ] **Task 21: Create Metrics Dashboard Component** (AC: #2, #4)
  - [ ] Create `/components/admin/QualityMetricsDashboard.tsx` (optional)
  - [ ] Display:
    - [ ] Pass rate gauge
    - [ ] Average score display
    - [ ] Score distribution chart
    - [ ] Failure patterns table
    - [ ] Pass rate trend chart (7-day)
  - [ ] Refresh: Auto-refresh every 5 minutes
  - [ ] Only accessible to admins

- [ ] **Task 22: Create Metrics Export** (AC: #4)
  - [ ] Export endpoint: `/api/metrics/export?format=csv&days=30`
  - [ ] Formats: CSV, JSON
  - [ ] Contains: Daily aggregates, detailed per-optimization
  - [ ] Useful for external analysis

---

### Phase 9: Integration & Verification

- [ ] **Task 23: Cross-Story Verification** (AC: #1-5)
  - [ ] Story 12-1 (Judge): Metrics logged after evaluation
  - [ ] Story 6-1 (LLM Pipeline): Judge integrated with metrics
  - [ ] All existing tests still pass
  - [ ] Backward compatibility maintained
  - [ ] No performance degradation

- [ ] **Task 24: Establish Quality Baseline** (AC: #5)
  - [ ] Run 100+ optimizations
  - [ ] Establish baseline metrics:
    - [ ] Target pass rate: 75%+
    - [ ] Target average score: 70+
    - [ ] Typical failure patterns
  - [ ] Document baseline in `/docs/QUALITY-BASELINE.md`

- [ ] **Task 25: Documentation** (AC: #2, #4)
  - [ ] Update `/CLAUDE.md` with metrics explanation
  - [ ] Document metrics schema
  - [ ] Document CLI commands
  - [ ] Document alert thresholds
  - [ ] Create `/docs/QUALITY-METRICS.md` with:
    - [ ] How metrics are collected
    - [ ] How to query metrics
    - [ ] How to interpret results
    - [ ] How to respond to alerts

---

## Dev Notes

### Architecture Alignment

**Related Components:**
- `/lib/ai/judgeSuggestion.ts` - Judge results (from Story 12-1)
- `/api/suggestions/[section]/route.ts` - Judge pipeline integration point
- `/lib/metrics/qualityMetrics.ts` - Metrics collection
- `/lib/metrics/metricsLogger.ts` - Logging service
- Story 12-1: [Judge Pipeline](12-1-implement-llm-as-judge-pipeline-step.md)

**Key Patterns:**
- Structured logging for debugging
- Non-blocking metric collection (async)
- Time-series data storage for trend analysis
- Alert system for proactive monitoring

### Metrics Collection Flow

```
Judge evaluates suggestion
     ↓
collectQualityMetrics() extracts metrics
     ↓
Aggregates pass/fail, scores, criteria
     ↓
Analyzes failure patterns
     ↓
logQualityMetrics() writes to file/DB
     ↓
Optional: Trigger alerts if degraded
```

### Logging Levels

**Development:**
- Console output with colors
- Detailed traces for each suggestion
- File logging disabled by default

**Production:**
- File-based JSONL logging (rotating daily)
- Optional: Database logging for persistence
- Quiet console (only alerts)

### Data Retention

**Detailed logs:** 90 days (per-optimization)
**Daily aggregates:** 1 year
**Weekly aggregates:** Indefinite
**Monthly trend:** Indefinite

This allows long-term trend analysis while managing storage.

### Performance Considerations

- Metric collection: <50ms per optimization
- Logging: Async to avoid blocking
- Queries: Cached with 5-minute TTL
- No impact on 60-second timeout budget

### Failure Pattern Categories

**Authenticity:**
- "Possible exaggeration"
- "Vague accomplishment"
- "Unverifiable claim"

**Clarity:**
- "Awkward phrasing"
- "Grammar error"
- "Unclear meaning"

**ATS Relevance:**
- "Missing keywords"
- "Poor formatting"
- "Not ATS-friendly"

**Actionability:**
- "Too vague"
- "Not measurable"
- "Not specific"

---

## Implementation Order (Recommended)

1. **Design (Task 1-3):** Metrics schema and storage strategy
2. **Collection (Task 4-7):** Metrics gathering and logging
3. **Query (Task 8-10):** Retrieval and dashboards
4. **Tracing (Task 11-12):** Detailed logging
5. **Alerts (Task 13-14):** Monitoring and health checks
6. **Persistence (Task 15-16):** Data storage and rotation
7. **Testing (Task 17-20):** Comprehensive coverage
8. **Visualization (Task 21-22):** Dashboards and exports
9. **Verification (Task 23-25):** Integration and documentation

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Key Implementation Insights

- **Async Logging Critical:** Metric collection must not block the optimization pipeline
- **Multiple Output Options:** Console for dev, file for logs, database for analytics
- **Pattern Analysis Essential:** Extract failure reasons to improve judge prompt iteratively
- **Health Monitoring:** Alert when quality degrades to catch issues early
- **Data Retention:** Balance between storage and historical analysis needs

### Completion Notes List

**Phase 1-2 Complete (Tasks 1-7):**
- ✅ Designed comprehensive metrics framework with all required metrics (pass rate, avg score, distributions, criteria breakdowns)
- ✅ Implemented type-safe TypeScript schema for QualityMetricLog with all required fields
- ✅ Created collectQualityMetrics() utility with full calculation logic for all metrics
- ✅ Built metrics logger with environment-based modes (console/file/database)
- ✅ Integrated metrics collection into all 3 suggestion API routes (summary, skills, experience)
- ✅ Implemented failure pattern analyzer with keyword-based categorization
- ✅ Non-blocking, async logging with graceful error handling
- ✅ 27 passing unit tests covering all core functionality

**Testing Complete (Tasks 17-18):**
- ✅ Unit tests for metrics collection: 16 tests covering pass rate, distributions, averages, edge cases
- ✅ Unit tests for failure analysis: 11 tests covering pattern extraction, categorization, ranking

**Build Status:**
- All 1071 tests passing (96 test files)
- No TypeScript errors in story files
- All existing tests still passing

**Phase 3-5 Complete (Tasks 8, 9, 11, 13, 14):**
- Metrics query service reading from JSONL files with date-based file rotation
- Quality summary API endpoint with daily+weekly+trend+failures
- Detailed judge trace logging gated by DEBUG=judge env var
- Alert system with configurable thresholds (warning/critical)
- Health check endpoint returning quality status
- Integrated alerts into metricsLogger (auto-alerts on every log)
- Integrated trace logging into judgeSuggestion and batch routes
- 29 new unit tests (alerts: 10, judgeTrace: 9, metricsQuery: 10)

**Remaining Work (Optional/Future):**
- Task 10: CLI commands (scripts/metrics.ts)
- Task 12: Detailed metrics in API response
- Tasks 15-16: Log rotation, database schema
- Tasks 19-20: Integration and E2E tests
- Tasks 21-22: Dashboard component, export functionality
- Tasks 23-25: Cross-story verification, baseline establishment, documentation

### File List

**New Files Created:**
- `/lib/metrics/qualityMetrics.ts` - Metrics collection utility
- `/lib/metrics/metricsLogger.ts` - Logging service with console/file/database modes
- `/lib/metrics/failureAnalyzer.ts` - Failure pattern extraction and categorization
- `/lib/metrics/metricsQuery.ts` - Query service for aggregated metrics from JSONL files
- `/lib/metrics/alerts.ts` - Alert system with health evaluation and threshold alerts
- `/lib/metrics/judgeTrace.ts` - Detailed judge trace logging (DEBUG=judge)
- `/lib/utils/truncateAtSentence.ts` - Shared text truncation utility (extracted from routes)
- `/types/metrics.ts` - Complete TypeScript type definitions
- `/app/api/metrics/quality-summary/route.ts` - Quality metrics summary endpoint
- `/app/api/health/quality-metrics/route.ts` - Health check endpoint
- `/tests/unit/metrics/qualityMetrics.test.ts` - 16 passing unit tests
- `/tests/unit/metrics/failureAnalyzer.test.ts` - 11 passing unit tests
- `/tests/unit/metrics/metricsQuery.test.ts` - 10 passing unit tests
- `/tests/unit/metrics/alerts.test.ts` - 10 passing unit tests
- `/tests/unit/metrics/judgeTrace.test.ts` - 9 passing unit tests

**Files to Create (Optional/Future):**
- `/scripts/metrics.ts` - CLI commands (Task 10)
- `/components/admin/QualityMetricsDashboard.tsx` - Optional dashboard (Task 21)
- `/tests/integration/metrics-pipeline.test.ts` - Integration tests (Task 19)
- `/tests/e2e/12-2-metrics-logging.spec.ts` - E2E tests (Task 20)
- `/docs/QUALITY-METRICS.md` - Documentation (Task 25)
- `/docs/QUALITY-BASELINE.md` - Baseline metrics (Task 24)

**Files Modified:**
- `/app/api/suggestions/summary/route.ts` - Integrated metrics collection, replaced inline truncateAtSentence
- `/app/api/suggestions/skills/route.ts` - Integrated metrics + batch trace logging, all judge results counted
- `/app/api/suggestions/experience/route.ts` - Integrated metrics + batch trace, added try-catch with timeout re-throw
- `/lib/ai/judgeSuggestion.ts` - Integrated per-result trace logging
- `/tests/setup.ts` - Added server-only mock for test environment

---

## Change Log

- **2026-01-27**: Story 12-2 created with comprehensive developer context. 25 tasks defined across 9 phases covering metrics design, collection, logging, querying, alerting, persistence, testing, visualization, and verification. Ready for implementation.
- **2026-01-27**: Implemented Phase 1-2 (Tasks 1-7) + Testing (Tasks 17-18). Created metrics collection framework with types, collection utility, logger service, failure analyzer, and integrated into all suggestion routes. 27 unit tests passing. Build successful.
- **2026-01-27**: Code Review (Adversarial). Fixed 4 HIGH + 3 MEDIUM issues:
  - H1: Fixed inconsistent rounding in calculateCriteriaAverages (all criteria now 2-decimal precision)
  - H3: Added missing try-catch in experience route's runSuggestionGeneration
  - H4: Moved skills route judge log inside data guard to prevent undefined output
  - M2: Corrected unchecked Task 2 Schema checkbox (was implemented but not marked)
  - M3: Skills route now includes per-skill judge results in metrics collection (was only counting overall)
  - H2: Fixed score distribution boundary semantics to use standard [0,20), [20,40), ..., [80,100] ranges
  - M1: Added server-only import guard to metricsLogger.ts (installed server-only package)
  - L1: Extracted duplicated truncateAtSentence to shared utility lib/utils/truncateAtSentence.ts
- **2026-01-27**: Implemented Phase 3-5 (Tasks 8, 9, 11, 13, 14). Created metrics query service, quality-summary API endpoint, judge trace logging module, alert system, health check endpoint. Integrated alerts into metricsLogger (auto-alerts), trace logging into judgeSuggestion and batch routes. Created 3 new test files (29 tests). Fixed experience route try-catch to re-throw timeout errors. All 1071 tests passing, no TS errors in story files.

