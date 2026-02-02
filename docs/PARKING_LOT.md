# Parking Lot - Future Work & Decisions

> **Purpose:** Track architectural decisions, enhancements, and work items deferred for future implementation
>
> **Last Updated:** 2026-02-02
>
> **Review Cadence:** Weekly during active development, monthly in maintenance

---

## 🚦 Status Legend

- 🔴 **BLOCKED** - Waiting on dependency or decision
- 🟡 **READY** - Can be worked on now
- 🟢 **IN_PROGRESS** - Currently being worked on
- ⚪ **COMPLETED** - Done, kept for reference

---

## 1. Analysis Quality Validation & Judge Decision

**Status:** 🟡 READY (Validation worksheet generated, needs manual review)

**Decision Point:** Should we implement an LLM judge for analysis quality?

**Current State:**
- Validation framework built and tested
- 3 test cases analyzed, results generated
- 1 potential issue found (PhD OR Master's extraction)
- Review worksheet ready: `validation-results/validation-worksheet-2026-02-02T08-35-51.md`

**Next Steps:**
1. [ ] Manual review of 3 test cases (30-45 min) - **THIS WEEK**
2. [ ] Calculate initial error rate
3. [ ] Decide: Expand to 20 cases OR fix prompts first
4. [ ] Complete 20-50 case validation
5. [ ] Make architecture decision based on error rates

**Decision Criteria:**
```
Critical Error Rate > 10%  → Implement conditional judge (MANDATORY)
Critical Error Rate 5-10%  → Implement sampling judge (10% monitoring)
Critical Error Rate 2-5%   → Confidence scores + rule-based validation
Critical Error Rate < 2%   → Ship as-is (acceptable MVP quality)
```

**References:**
- Validation Guide: `docs/VALIDATION_GUIDE.md`
- Validation Script: `scripts/validate-analysis-quality.ts`
- Results: `validation-results/` directory

**Cost Impact:**
- Conditional judge: +$0.001-0.003/analysis, +3-8s latency
- Sampling judge: +$0.0001-0.0003/analysis, 0s latency (background)

**Timeline:** Decision by end of Week 3 (2026-02-23)

---

## 2. Performance Metrics - Phase 2 (Indexed Columns)

**Status:** 🔴 BLOCKED (Waiting for sessions > 1,000)

**Trigger Conditions:** ONE of:
- [ ] Sessions count > 1,000
- [ ] Need dashboard/monitoring
- [ ] Frequent slow query complaints (>30s)
- [ ] Cost analysis required

**Current State:**
- Phase 1 complete: Metrics stored in `ats_score.metadata.pipelineMetrics` (JSONB)
- Captures: timing, content size, LLM stats, quality metrics
- No indexing - queries require full table scan

**What Needs to Be Done:**
1. Add indexed columns to `sessions` table:
   - `analysis_time_ms INTEGER`
   - `resume_word_count INTEGER`
   - `ats_score_overall INTEGER`
   - `estimated_cost_usd DECIMAL(10,6)`
2. Create indexes for fast aggregation queries
3. Backfill from existing JSONB data
4. Update API route to write to both JSONB + columns

**Effort:** 2-4 hours

**References:**
- Full plan: `docs/METRICS_ROADMAP.md` (Phase 2 section)
- Migration template in roadmap document

**Review Date:** 2026-03-01 or when sessions > 1,000

---

## 3. Performance Metrics - Phase 3 (Dedicated Metrics Table)

**Status:** 🔴 BLOCKED (Waiting for sessions > 10,000/day)

**Trigger Conditions:** ONE of:
- [ ] Sessions > 10,000/day
- [ ] Need real-time monitoring
- [ ] Historical analysis >90 days required
- [ ] Multiple services need metrics

**What Needs to Be Done:**
1. Create `session_metrics` table (separate from `sessions`)
2. Migrate metrics collection to new table
3. Update queries to JOIN when needed
4. Set up data retention policies

**Effort:** 1-2 days

**References:**
- Full plan: `docs/METRICS_ROADMAP.md` (Phase 3 section)

**Review Date:** When approaching 10,000 sessions/day

---

## 4. Performance Metrics - Phase 4 (Time-Series Database)

**Status:** 🔴 BLOCKED (Waiting for enterprise scale)

**Trigger Conditions:** ONE of:
- [ ] Sessions > 100,000/day
- [ ] Real-time dashboards required
- [ ] Advanced analytics (anomaly detection, forecasting)
- [ ] Multiple services logging metrics

**Technology Options:**
- TimescaleDB (PostgreSQL extension)
- InfluxDB (purpose-built time-series)
- CloudWatch/Datadog/New Relic (managed)

**Effort:** 1-2 weeks

**References:**
- Full plan: `docs/METRICS_ROADMAP.md` (Phase 4 section)

**Review Date:** When approaching enterprise scale

---

## 5. Enhanced Metrics Collection

**Status:** 🔴 BLOCKED (Waiting for Phase 2 or identified need)

**Additional Metrics to Track:**

### Per-Step Timing Breakdown
```typescript
stepTimings: {
  extractKeywordsMs: number,
  extractQualificationsMs: number,
  matchKeywordsMs: number,
  calculateATSMs: number,
  saveSessionMs: number,
  parallelEfficiency: number
}
```
**Benefit:** Identify specific bottlenecks
**Effort:** 2 hours

### Actual Token Counts (from LangChain)
```typescript
tokens: {
  input: number,
  output: number,
  total: number,
  byStep: {...}
},
actualCostUsd: number
```
**Benefit:** Real cost tracking vs estimates
**Effort:** 4 hours (requires LangChain instrumentation)

### User Journey Metrics
```typescript
userJourney: {
  isReturningUser: boolean,
  sessionNumber: number,
  previousATSScores: number[],
  improvementFromLast: number
}
```
**Benefit:** Measure user success over time
**Effort:** 6 hours (requires user tracking system)

### Error & Reliability Metrics
```typescript
errors: {
  hadErrors: boolean,
  errorCodes: string[],
  retryAttempts: number,
  fallbackUsed: boolean
}
```
**Benefit:** Quality monitoring, alert on regressions
**Effort:** 3 hours

**References:**
- Full list: `docs/METRICS_ROADMAP.md` (Metrics to Add section)

---

## 6. Validation Test Case Expansion

**Status:** 🔴 BLOCKED (Waiting for initial 3-case review)

**Current State:**
- 3 test cases complete (Software Engineer, Data Scientist, Product Manager)
- Need 47 more for comprehensive validation

**Test Case Distribution Needed:**

**By Role Type:**
- [ ] 10x Engineering roles (various stacks: Python, Java, Go, etc.)
- [ ] 5x Data/ML roles (various levels)
- [ ] 5x Product/Design roles
- [ ] 5x Sales/Marketing roles
- [ ] 5x Operations/Support roles

**By Experience Level:**
- [ ] 10x Junior (0-2 years)
- [ ] 20x Mid (3-7 years)
- [ ] 10x Senior (8+ years)
- [ ] 10x Co-op/Intern

**By Complexity:**
- [ ] 10x Simple (clear requirements, obvious matches)
- [ ] 20x Typical (normal job postings)
- [ ] 10x Complex (ambiguous requirements, semantic challenges)
- [ ] 10x Edge cases (unusual formats, tricky matching)

**Sources:**
- Real data (anonymized from Supabase)
- Synthetic (GPT-4 generated realistic cases)
- Crowdsourced (team/friends' real resumes)

**Effort:** 4-8 hours to collect and format 47 cases

**References:**
- Guide: `docs/VALIDATION_GUIDE.md` (Adding More Test Cases section)
- Test case format: `scripts/validate-analysis-quality.ts`

---

## 7. Extraction Quality Improvements

**Status:** 🔴 BLOCKED (Waiting for validation results to identify issues)

**Potential Improvements:**

### Fix "PhD OR Master's" Logic
- **Issue:** Extracts "PhD required" instead of "PhD OR Master's acceptable"
- **Impact:** Incorrectly penalizes Master's degree holders
- **Effort:** 2 hours (update extraction prompt + test)

### Confidence Scores from LLM
- **What:** Return confidence (0-1) for each extraction
- **Benefit:** Flag low-confidence analyses for review
- **Effort:** 2-4 hours
- **Cost:** $0 (free from LLM)

### Rule-Based Post-Extraction Validation
- **What:** Cheap sanity checks after LLM extraction
- **Examples:** Too few keywords? Keywords not in JD? Suspiciously high match rate?
- **Benefit:** Catch obvious errors before showing to user
- **Effort:** 4-6 hours
- **Cost:** $0 (~10ms latency)

**Decision:** Wait for validation results to prioritize

---

## 8. Dashboard & Monitoring

**Status:** 🔴 BLOCKED (Waiting for Phase 2 indexed columns)

**Dashboards Needed:**

### Performance Dashboard
- P50/P95/P99 analysis time (24h, 7d, 30d)
- Analysis time distribution histogram
- Heatmap: analysis time by hour of day
- Slowest 10 sessions with context

### Cost Dashboard
- Daily/weekly cost trends
- Cost by LLM operation (extract/match/judge)
- Cost per session metrics
- Projected monthly cost

### Quality Dashboard
- Average ATS score over time
- ATS tier distribution (strong/moderate/weak)
- Analysis time vs ATS score correlation
- High-value improvement opportunities

**Effort:** 1-2 days (after Phase 2 complete)

**Tools:**
- Grafana (self-hosted)
- Metabase (open source)
- Retool (rapid prototyping)
- Custom Next.js dashboard

---

## 9. Alerting & Quality Gates

**Status:** 🔴 BLOCKED (Waiting for Phase 2 metrics + monitoring)

**Alerts to Implement:**

### Performance Alerts
- P95 analysis time > 45s (approaching 60s timeout)
- Average analysis time increases >50% week-over-week
- Retry rate > 5%

### Cost Alerts
- Daily LLM costs > $10
- Cost per session increases >20%
- Unusual spike in token usage

### Quality Alerts
- ATS score distribution shifts significantly
- Keyword match rate drops below 70%
- Error rate > 1%

**Implementation:**
- Phase 1: Console logging + manual review
- Phase 2: Email alerts
- Phase 3: PagerDuty/Slack integration

**Effort:** 1 day (after monitoring infrastructure exists)

---

## 10. Prompt Engineering & Few-Shot Examples

**Status:** 🔴 BLOCKED (Waiting for validation results to identify failure patterns)

**Current State:**
- Extraction prompts are zero-shot (no examples)
- May benefit from few-shot examples for edge cases

**Potential Improvements:**

### Add Few-Shot Examples to Keyword Extraction
- **Example 1:** "PhD OR Master's" → Extract with OR logic
- **Example 2:** Years of experience with ranges
- **Example 3:** Implied skills (e.g., "React developer" implies JavaScript)

### Add Few-Shot Examples to Keyword Matching
- **Example 1:** "React" should NOT match "reactive personality"
- **Example 2:** "Node" SHOULD match "Node.js"
- **Example 3:** Acronyms and full forms (ML ≈ Machine Learning)

**Benefit:** Reduce systematic errors
**Cost:** ~$0.001 extra per call (longer prompts)
**Effort:** 2-4 hours per extraction step

**Decision:** Wait for validation to identify specific failure patterns

---

## 11. Circuit Breaker & Retry Logic

**Status:** 🟡 READY (Can implement anytime)

**Current State:**
- No retry logic on LLM failures
- No circuit breaker pattern
- Timeout enforcement exists (60s)

**What to Add:**

### Retry with Exponential Backoff
```typescript
// On LLM timeout or rate limit
retry 3 times with delays: 1s, 2s, 4s
```

### Circuit Breaker Pattern
```typescript
// After 5 consecutive failures
Open circuit for 30s (fail fast)
Then try 1 request (half-open)
If success, close circuit
If failure, open again
```

**Benefit:** Better reliability, graceful degradation
**Effort:** 4 hours
**Libraries:** `opossum` (circuit breaker), `p-retry` (retries)

---

## 12. Caching Strategy

**Status:** 🟡 READY (Can implement if latency/cost becomes issue)

**Opportunities for Caching:**

### Keyword Extraction Cache
- **Key:** SHA256(jd_content)
- **TTL:** 24 hours
- **Benefit:** Same JD → instant extraction (avoid LLM call)
- **Hit Rate Estimate:** 20-30% (common job postings)

### Qualification Extraction Cache
- **Key:** SHA256(jd_content)
- **TTL:** 24 hours
- **Benefit:** Same JD → instant extraction

**Implementation:**
- Phase 1: In-memory cache (simple)
- Phase 2: Redis (shared across instances)

**Effort:** 2-3 hours
**Cost Savings:** ~$0.0006 per cache hit (2 LLM calls avoided)

**Decision:** Implement if latency/cost becomes problem

---

## 13. Testing Strategy Enhancements

**Status:** 🟡 READY (Can expand test coverage anytime)

**Current Coverage:**
- Integration tests exist
- E2E tests exist
- No specific LLM extraction tests

**Test Gaps:**

### LLM Extraction Tests
```typescript
// Golden dataset tests
test('extractKeywords handles PhD OR Masters', () => {
  const jd = "PhD or Master's in CS required";
  const result = extractKeywords(jd);
  expect(result.degreeRequired.acceptsMasters).toBe(true);
});
```

### Regression Tests for Known Issues
- PhD OR Master's logic
- Semantic matching edge cases
- Qualification extraction ambiguity

**Effort:** 1-2 days for comprehensive test suite

---

## 14. User Feedback Loop

**Status:** 🔴 BLOCKED (Waiting for user volume)

**What to Build:**

### In-App Feedback Button
- "Was this analysis helpful?"
- "Report an issue with this analysis"
- Flag specific extractions as incorrect

### Analytics on Feedback
- Track: what types of analyses get flagged?
- Correlate with validation findings
- Use to improve prompts/add examples

**Benefit:** Real-world quality measurement
**Effort:** 2-3 days (UI + backend + analytics)

**Trigger:** After 100+ users

---

## 15. Documentation Updates

**Status:** 🟡 READY (Ongoing)

**Documents to Keep Updated:**

- [ ] `CLAUDE.md` - Update when major features added
- [ ] `docs/METRICS_ROADMAP.md` - Update when phases advance
- [ ] `docs/VALIDATION_GUIDE.md` - Update with learnings from validation
- [ ] `docs/PARKING_LOT.md` - This document (weekly review)
- [ ] Architecture doc - Update when architectural decisions made

**Review Cadence:** After each major milestone

---

## Quick Reference: Immediate Next Steps

**This Week:**
1. ✅ Manual review of 3 validation test cases
2. ⏸️ Calculate initial error rate
3. ⏸️ Decide on judge implementation

**Next 2 Weeks:**
1. ⏸️ Expand validation to 20-50 cases (if needed)
2. ⏸️ Implement chosen validation solution
3. ⏸️ Fix any critical extraction issues found

**Next Month:**
1. ⏸️ Monitor metrics in production
2. ⏸️ Review Phase 2 triggers (sessions > 1K?)
3. ⏸️ Collect user feedback

---

## Decision Log

| Date | Item | Decision | Rationale |
|------|------|----------|-----------|
| 2026-02-02 | Metrics Storage | Phase 1: JSONB in ats_score.metadata | Zero migration, fast to ship, flexible |
| 2026-02-02 | Validation Approach | Start with 3 cases, expand to 50 | Measure first, then decide on judge |
| TBD | Judge Implementation | Pending validation results | Data-driven decision based on error rates |

---

**Last Reviewed:** 2026-02-02 by Winston (Architect)
**Next Review:** 2026-02-09 or after validation completion
**Owner:** Lawrence (Product) + Winston (Architecture)
