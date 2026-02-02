# Performance & Metrics Roadmap

> **Current Status:** Phase 1 (JSONB Storage) - Implemented 2026-02-02
>
> **Purpose:** Track performance metrics evolution from MVP to enterprise scale

---

## Overview

This document tracks the progression of SubmitSmart's performance monitoring and metrics infrastructure from initial implementation through enterprise-scale deployment.

**Guiding Principle:** Start simple, scale when data proves the need.

---

## Phase 1: JSONB Storage (✅ COMPLETED - 2026-02-02)

**Status:** ✅ Implemented

**Goal:** Capture essential performance metrics with zero schema changes

### Implementation Details

**Storage Location:** `sessions.ats_score.metadata.pipelineMetrics`

**Metrics Captured:**
```typescript
{
  totalAnalysisTimeMs: number,
  contentMetrics: {
    resumeWordCount: number,
    resumeCharCount: number,
    jdWordCount: number,
    jdCharCount: number
  },
  llmMetrics: {
    totalCalls: number,
    model: string,
    estimatedCostUsd: number
  },
  qualityMetrics: {
    keywordMatchRate: number,
    atsScoreOverall: number,
    atsTier: string,
    detectedJobType: string
  }
}
```

**Benefits:**
- ✅ No database migration required
- ✅ Flexible schema for iteration
- ✅ Immediate deployment
- ✅ GIN index already exists for queries

**Limitations:**
- ⚠️ No per-step timing breakdown
- ⚠️ Harder to query aggregates (AVG, P95, P99)
- ⚠️ Not optimized for time-series analysis

**Files Modified:**
- `app/api/optimize/route.ts` - Added metrics collection
- `components/scan/NewScanClient.tsx` - Browser console logging
- `docs/METRICS_ROADMAP.md` - This document

**Next Review Date:** 2026-03-01 or when sessions > 1,000

---

## Phase 2: Indexed Columns (📋 PLANNED)

**Trigger Conditions:** ONE of:
- [ ] Sessions > 1,000
- [ ] Need dashboard/monitoring
- [ ] Frequent slow query complaints (>30s)
- [ ] Cost analysis required

**Goal:** Enable fast aggregation queries without full table scans

### Implementation Plan

**Add indexed columns to `sessions` table:**

```sql
-- Migration: Add performance metric columns
ALTER TABLE sessions
  ADD COLUMN analysis_time_ms INTEGER,
  ADD COLUMN resume_word_count INTEGER,
  ADD COLUMN ats_score_overall INTEGER,
  ADD COLUMN estimated_cost_usd DECIMAL(10,6);

-- Indexes for fast queries
CREATE INDEX idx_sessions_analysis_time ON sessions(analysis_time_ms);
CREATE INDEX idx_sessions_ats_score ON sessions(ats_score_overall);
CREATE INDEX idx_sessions_created_time ON sessions(created_at DESC, analysis_time_ms);
```

**Populate from JSONB:**
```sql
UPDATE sessions
SET
  analysis_time_ms = (ats_score->'metadata'->'pipelineMetrics'->>'totalAnalysisTimeMs')::INTEGER,
  resume_word_count = (ats_score->'metadata'->'pipelineMetrics'->'contentMetrics'->>'resumeWordCount')::INTEGER,
  ats_score_overall = (ats_score->>'overall')::INTEGER,
  estimated_cost_usd = (ats_score->'metadata'->'pipelineMetrics'->'llmMetrics'->>'estimatedCostUsd')::DECIMAL
WHERE ats_score->'metadata'->'pipelineMetrics' IS NOT NULL;
```

**Application Changes:**
- Update `app/api/optimize/route.ts` to write to both JSONB + columns
- Keep JSONB for flexibility, columns for performance

**Benefits:**
- ✅ Fast percentile queries: `SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY analysis_time_ms)`
- ✅ Dashboard-ready data
- ✅ Efficient WHERE clauses: `WHERE analysis_time_ms > 30000`
- ✅ Still maintains JSONB flexibility

**Estimated Effort:** 2-4 hours
- 1h: Write migration
- 1h: Update API route
- 1h: Backfill existing data
- 1h: Testing

---

## Phase 3: Dedicated Metrics Table (🔮 FUTURE)

**Trigger Conditions:** ONE of:
- [ ] Sessions > 10,000/day
- [ ] Need real-time monitoring
- [ ] Historical analysis >90 days
- [ ] Multiple microservices need metrics

**Goal:** Separate operational data (sessions) from analytics data (metrics)

### Architecture Design

**New Table: `session_metrics`**

```sql
CREATE TABLE session_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,

  -- Timing Metrics
  total_analysis_time_ms INTEGER NOT NULL,
  llm_time_ms INTEGER,
  db_time_ms INTEGER,
  step_breakdown JSONB, -- Flexible for per-step timing

  -- Content Metrics
  resume_word_count INTEGER,
  resume_char_count INTEGER,
  jd_word_count INTEGER,
  jd_char_count INTEGER,
  complexity_score DECIMAL(5,2),

  -- LLM Metrics
  total_llm_calls INTEGER,
  retry_count INTEGER,
  timeout_count INTEGER,
  tokens_input INTEGER,
  tokens_output INTEGER,
  tokens_total INTEGER,
  estimated_cost_usd DECIMAL(10,6),
  model_used VARCHAR(100),

  -- Quality Metrics
  ats_score_overall INTEGER,
  keyword_match_rate DECIMAL(5,2),
  detected_job_type VARCHAR(50),
  detected_seniority VARCHAR(50),

  -- Error Metrics
  had_errors BOOLEAN DEFAULT FALSE,
  error_codes TEXT[],

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for time-series analysis
CREATE INDEX idx_metrics_created_at ON session_metrics(created_at DESC);
CREATE INDEX idx_metrics_timing ON session_metrics(total_analysis_time_ms);
CREATE INDEX idx_metrics_cost ON session_metrics(estimated_cost_usd);
CREATE INDEX idx_metrics_quality ON session_metrics(ats_score_overall);

-- Composite indexes for common queries
CREATE INDEX idx_metrics_time_cost ON session_metrics(created_at DESC, estimated_cost_usd);
CREATE INDEX idx_metrics_time_performance ON session_metrics(created_at DESC, total_analysis_time_ms);
```

**Benefits:**
- ✅ Optimized for aggregations
- ✅ Can be moved to separate database for scale
- ✅ Time-series database compatibility (TimescaleDB)
- ✅ Clear separation: sessions (user data) vs metrics (analytics)
- ✅ Easier data retention policies (keep metrics longer than sessions)

**Challenges:**
- ⚠️ Requires JOIN for session context
- ⚠️ Two write operations per analysis
- ⚠️ More complex queries
- ⚠️ Migration complexity

**Estimated Effort:** 1-2 days
- 4h: Schema design + migration
- 4h: Update application code
- 2h: Data backfill strategy
- 4h: Update queries across codebase
- 2h: Testing

---

## Phase 4: Time-Series Database (🚀 ENTERPRISE)

**Trigger Conditions:** ONE of:
- [ ] Sessions > 100,000/day
- [ ] Real-time dashboards required
- [ ] Multiple services logging metrics
- [ ] Advanced analytics (anomaly detection, forecasting)

**Goal:** Enterprise-grade observability with specialized time-series infrastructure

### Technology Options

**Option A: TimescaleDB** (PostgreSQL extension)
- ✅ Keeps PostgreSQL ecosystem
- ✅ Hypertables for automatic partitioning
- ✅ Continuous aggregates for pre-computed rollups
- ✅ Retention policies built-in

**Option B: InfluxDB**
- ✅ Purpose-built for time-series
- ✅ High write throughput
- ✅ Built-in downsampling
- ⚠️ Separate database to manage

**Option C: CloudWatch/Datadog/New Relic**
- ✅ Fully managed
- ✅ Built-in dashboards + alerting
- ⚠️ Higher cost
- ⚠️ Vendor lock-in

### Implementation Strategy

**Hybrid Architecture:**
```
Application
    ↓
PostgreSQL (sessions table) ← User-facing data
    ↓ (async export)
TimescaleDB (metrics hypertable) ← Analytics data
    ↓
Grafana/Dashboard ← Visualization
```

**Benefits:**
- ✅ Handles millions of data points
- ✅ Sub-second query performance
- ✅ Automatic downsampling (1m → 5m → 1h → 1d)
- ✅ Built-in anomaly detection
- ✅ Forecasting capabilities

**Estimated Effort:** 1-2 weeks
- Setup infrastructure
- Implement export pipeline
- Build dashboards
- Configure alerting
- Load testing

---

## Metrics to Add in Future Phases

### Performance Deep Dive
```typescript
{
  stepTimings: {
    extractKeywordsMs: number,
    extractQualificationsMs: number,
    matchKeywordsMs: number,
    calculateATSMs: number,
    saveSessionMs: number,
    parallelEfficiency: number  // Actual vs theoretical speedup
  },
  llmLatency: {
    p50: number,
    p95: number,
    p99: number
  }
}
```

### Token Tracking (When LangChain provides)
```typescript
{
  tokens: {
    input: number,
    output: number,
    total: number,
    byStep: {
      extractKeywords: { input: N, output: N },
      extractQualifications: { input: N, output: N },
      matchKeywords: { input: N, output: N }
    }
  },
  actualCostUsd: number  // From token counts
}
```

### User Journey Metrics
```typescript
{
  userJourney: {
    isReturningUser: boolean,
    sessionNumber: number,
    previousATSScores: number[],
    improvementFromLast: number,
    timeOnResultsPageSec: number,
    clickedSuggestions: boolean,
    appliedSuggestionsCount: number,
    downloadedResume: boolean
  }
}
```

### Error & Reliability
```typescript
{
  errors: {
    hadErrors: boolean,
    errorCodes: string[],
    retryAttempts: number,
    fallbackUsed: boolean,
    timeoutOccurred: boolean
  },
  reliability: {
    llmSuccessRate: number,
    dbWriteSucceeded: boolean
  }
}
```

### Business Metrics
```typescript
{
  conversion: {
    stage: 'uploaded' | 'analyzed' | 'suggested' | 'applied' | 'downloaded',
    estimatedValueUsd: number,
    featureFlags: string[],
    abTestVariant: string | null
  },
  costMetrics: {
    llmCostUsd: number,
    dbOperations: number,
    infraCostUsd: number,
    totalCostUsd: number
  }
}
```

---

## Query Examples for Each Phase

### Phase 1 (JSONB) - Current
```sql
-- Average analysis time (slow, requires scanning all JSONB)
SELECT
  AVG((ats_score->'metadata'->'pipelineMetrics'->>'totalAnalysisTimeMs')::INTEGER) as avg_ms
FROM sessions
WHERE created_at > NOW() - INTERVAL '7 days';

-- Slow queries (>30s)
SELECT
  id,
  created_at,
  (ats_score->'metadata'->'pipelineMetrics'->>'totalAnalysisTimeMs')::INTEGER as time_ms
FROM sessions
WHERE (ats_score->'metadata'->'pipelineMetrics'->>'totalAnalysisTimeMs')::INTEGER > 30000
ORDER BY created_at DESC
LIMIT 100;
```

### Phase 2 (Indexed Columns) - Fast Aggregates
```sql
-- Average analysis time (fast)
SELECT AVG(analysis_time_ms) as avg_ms
FROM sessions
WHERE created_at > NOW() - INTERVAL '7 days';

-- P95 analysis time
SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY analysis_time_ms) as p95_ms
FROM sessions
WHERE created_at > NOW() - INTERVAL '7 days';

-- Slow queries with context
SELECT
  id,
  created_at,
  analysis_time_ms,
  resume_word_count,
  ats_score_overall
FROM sessions
WHERE analysis_time_ms > 30000
ORDER BY created_at DESC
LIMIT 100;

-- Cost analysis
SELECT
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as sessions,
  SUM(estimated_cost_usd) as total_cost,
  AVG(estimated_cost_usd) as avg_cost
FROM sessions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;
```

### Phase 3 (Dedicated Table) - Advanced Analytics
```sql
-- Performance trends with correlation
SELECT
  DATE_TRUNC('hour', m.created_at) as hour,
  COUNT(*) as sessions,
  AVG(m.total_analysis_time_ms) as avg_time_ms,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY m.total_analysis_time_ms) as p95_ms,
  AVG(m.resume_word_count) as avg_words,
  AVG(m.ats_score_overall) as avg_score,
  SUM(m.estimated_cost_usd) as cost_usd
FROM session_metrics m
WHERE m.created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- Identify problematic patterns
SELECT
  m.model_used,
  m.detected_job_type,
  COUNT(*) as count,
  AVG(m.total_analysis_time_ms) as avg_time,
  AVG(m.retry_count) as avg_retries,
  SUM(CASE WHEN m.had_errors THEN 1 ELSE 0 END) as error_count
FROM session_metrics m
WHERE m.created_at > NOW() - INTERVAL '7 days'
GROUP BY m.model_used, m.detected_job_type
ORDER BY avg_time DESC;
```

---

## Alerting & Monitoring (Future)

### Key Metrics to Alert On

**Performance Alerts:**
- P95 analysis time > 45 seconds (approaching 60s timeout)
- Average analysis time increases >50% week-over-week
- Retry rate > 5%

**Cost Alerts:**
- Daily LLM costs > $10
- Cost per session increases >20%
- Unusual spike in token usage

**Quality Alerts:**
- ATS score distribution shifts significantly
- Keyword match rate drops below 70%
- Error rate > 1%

**Sample Alert Rules:**
```sql
-- P95 approaching timeout
SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY analysis_time_ms) as p95
FROM sessions
WHERE created_at > NOW() - INTERVAL '1 hour'
HAVING p95 > 45000; -- Alert if > 45 seconds
```

---

## Dashboard Mockups (Future)

### Performance Dashboard
- Line chart: P50/P95/P99 analysis time (24h, 7d, 30d)
- Bar chart: Analysis time distribution
- Heatmap: Analysis time by hour of day
- Table: Slowest 10 sessions with context

### Cost Dashboard
- Line chart: Daily/weekly cost trends
- Pie chart: Cost by LLM operation (extract/match/judge)
- Table: Cost per session metrics
- Alerts: Projected monthly cost

### Quality Dashboard
- Line chart: Average ATS score over time
- Bar chart: ATS tier distribution
- Scatter: Analysis time vs ATS score correlation
- Table: High-value improvement opportunities

---

## Decision Log

| Date | Phase | Decision | Rationale |
|------|-------|----------|-----------|
| 2026-02-02 | 1 | Implement JSONB storage first | Zero migration, fast to ship, flexible schema |
| TBD | 2 | Add indexed columns | Triggered by sessions > 1,000 or monitoring need |
| TBD | 3 | Separate metrics table | Triggered by sessions > 10,000/day or scale issues |
| TBD | 4 | Time-series database | Triggered by enterprise scale or advanced analytics |

---

## Next Steps

**Immediate (This Week):**
- [x] Implement Phase 1 (JSONB storage)
- [ ] Test metrics collection with real data
- [ ] Document query patterns for Phase 1

**Short-term (Next Month):**
- [ ] Monitor session count growth
- [ ] Analyze JSONB query performance
- [ ] Decide if Phase 2 is needed

**Long-term (Q2 2026):**
- [ ] Build initial monitoring dashboard
- [ ] Set up basic alerting
- [ ] Review metrics strategy quarterly

---

## References

- **Current Implementation:** `app/api/optimize/route.ts` (line 219-252)
- **Database Schema:** `supabase/migrations/20260124000000_create_sessions_table.sql`
- **Architecture Doc:** `_bmad-output/planning-artifacts/architecture.md`
- **CLAUDE.md:** Project quick reference

---

**Last Updated:** 2026-02-02 by Winston (Architect Agent)
**Next Review:** 2026-03-01 or when sessions > 1,000
