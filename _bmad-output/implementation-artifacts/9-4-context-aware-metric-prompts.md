# Story 9.4: Context-Aware Metric Prompts

**Epic:** Epic 9 - Logic Refinement & Scoring Enhancement
**Story Key:** 9-4-context-aware-metric-prompts
**Status:** ready-for-dev
**Created:** 2026-01-22
**Priority:** High
**Dependencies:** Story 9.1 (ATS Scoring) - COMPLETED ✓, Story 9.2 (Calibration) - COMPLETED ✓

---

## Story Summary

As a **system**,
I want **to provide specific quantification prompts based on experience context**,
So that **users receive actionable guidance for adding relevant metrics**.

---

## Business Context

Different resume contexts require different metrics to be compelling. A finance role needs dollar amounts and ROI figures, while engineering roles need user counts and performance improvements. By detecting context from bullet content and user's target role, we can provide highly specific, actionable quantification suggestions that feel natural to candidates.

---

## Acceptance Criteria

### AC1: Financial Context Detection
**Given** a bullet mentions financial terms (revenue, budget, cost, savings, ROI, AUM)
**When** quantification suggestion is generated
**Then** prompts include: "Consider adding: dollar amount, percentage savings, ROI figure"
**And** examples reference: "$X in revenue", "X% cost reduction", "$X AUM"
**And** reasoning explains: "Financial metrics strengthen this role-specific achievement"

**Test:** Bullet with "managed budget" → financial context detected → prompts with $ examples

---

**Given** user's target role is in finance/accounting
**When** quantification suggestions are generated
**Then** financial metric prompts are prioritized
**And** examples use industry-appropriate scales ($1M+, not $100)

**Test:** Finance target role + generic bullet → financial metrics prioritized

---

### AC2: Tech Context Detection
**Given** a bullet mentions tech terms (users, traffic, performance, deployment, API, latency, scale)
**When** quantification suggestion is generated
**Then** prompts include: "Consider adding: user count, traffic increase, latency improvement"
**And** examples reference: "X users", "X% faster", "Xms response time"
**And** reasoning explains: "Quantify technical impact with performance metrics"

**Test:** Bullet with "deployed service" → tech context detected → prompts with performance examples

---

**Given** user's target role is in software/engineering
**When** quantification suggestions are generated
**Then** tech metric prompts are prioritized
**And** examples use industry-appropriate scales (1000+ users, not 10 users)

**Test:** Engineering target role + generic bullet → tech metrics prioritized

---

### AC3: Leadership Context Detection
**Given** a bullet mentions leadership terms (team, managed, led, mentored, trained, supervised, coordinated)
**When** quantification suggestion is generated
**Then** prompts include: "Consider adding: team size, direct reports, scope"
**And** examples reference: "team of X", "X direct reports", "across X departments"
**And** reasoning explains: "Leadership impact measured by team scope"

**Test:** Bullet with "led initiative" → leadership context detected → prompts with team size examples

---

### AC4: Competitive/Ranking Context
**Given** a bullet mentions competition, awards, or rankings
**When** quantification suggestion is generated
**Then** prompts include: "Consider adding: ranking position, pool size, percentile"
**And** examples reference: "Top X%", "Xth out of Y", "X place"
**And** reasoning explains: "Competitive achievements more credible with ranking context"

**Test:** Bullet with "won award" → competitive context detected → prompts with percentile examples

---

### AC5: Scale/Scope Context
**Given** a bullet lacks scale indicators but is context-neutral (not financial/tech/leadership)
**When** quantification suggestion is generated
**Then** prompts include: "Consider adding: volume, frequency, duration"
**And** examples reference: "X projects", "over X months", "X per week"
**And** reasoning explains: "Scale provides context for impact"

**Test:** Bullet with "managed process" → scale context detected → prompts with frequency examples

---

## Tasks & Subtasks

- [ ] **Task 1: Create Context Detection Utility** (AC: 1, 2, 3, 4, 5)
  - [ ] 1.1 Create `lib/utils/contextDetector.ts` file
  - [ ] 1.2 Implement `detectFinancialContext()` function
  - [ ] 1.3 Implement `detectTechContext()` function
  - [ ] 1.4 Implement `detectLeadershipContext()` function
  - [ ] 1.5 Implement `detectCompetitiveContext()` function
  - [ ] 1.6 Implement `detectScaleContext()` function
  - [ ] 1.7 Implement `classifyContext()` orchestrator (returns primary context)
  - [ ] 1.8 Write unit tests for context detection (20+ tests)
  - [ ] 1.9 Test keyword matching (case-insensitive, variations)
  - [ ] 1.10 Test edge cases (multiple contexts, none detected)

- [ ] **Task 2: Create Metric Example Templates** (AC: 1, 2, 3, 4, 5)
  - [ ] 2.1 Create `lib/data/metricExamples.ts`
  - [ ] 2.2 Define financial metric templates (5+ types)
  - [ ] 2.3 Define tech metric templates (5+ types)
  - [ ] 2.4 Define leadership metric templates (5+ types)
  - [ ] 2.5 Define competitive metric templates (3+ types)
  - [ ] 2.6 Define scale/scope metric templates (5+ types)
  - [ ] 2.7 Include realistic examples per context
  - [ ] 2.8 Unit tests for template lookup (5+ tests)

- [ ] **Task 3: Update Quantification Prompt Generator** (AC: 1, 2, 3, 4, 5)
  - [ ] 3.1 Update `lib/openai/prompts/action-verbs.ts`
  - [ ] 3.2 Import `contextDetector` utilities
  - [ ] 3.3 Pass bullet content to detector
  - [ ] 3.4 Get context classification
  - [ ] 3.5 Use context to select metric examples
  - [ ] 3.6 Include context in prompt instruction
  - [ ] 3.7 Update prompt template to leverage context
  - [ ] 3.8 Unit tests for context-aware prompts (8+ tests)

- [ ] **Task 4: Integrate User Target Role Context** (AC: 1, 2, 3, 4, 5)
  - [ ] 4.1 Update suggestion generation action to pass targetRole
  - [ ] 4.2 Create `roleToContextMapping()` utility
  - [ ] 4.3 Map finance-related roles to financial context
  - [ ] 4.4 Map tech-related roles to tech context
  - [ ] 4.5 Map leadership-related roles to leadership context
  - [ ] 4.6 Prioritize context based on role when both detected
  - [ ] 4.7 Unit tests for role mapping (6+ tests)

- [ ] **Task 5: Create Comprehensive Tests** (AC: 1, 2, 3, 4, 5)
  - [ ] 5.1 Context detection unit tests (20+ tests across all types)
  - [ ] 5.2 Integration tests: bullet + context → correct prompts
  - [ ] 5.3 Test all financial keywords and variations
  - [ ] 5.4 Test all tech keywords and variations
  - [ ] 5.5 Test all leadership keywords and variations
  - [ ] 5.6 Test edge cases (typos, abbreviations, mixed contexts)
  - [ ] 5.7 Test role-based prioritization
  - [ ] 5.8 Test fallback to generic metrics when no context detected
  - [ ] 5.9 End-to-end: bullet input → context detection → quantification prompts

---

## Technical Reference

### Context Keywords

**Financial Context:**
- Primary: revenue, budget, cost, savings, ROI, AUM, margin, profit, EBITDA, cash flow
- Secondary: investment, portfolio, depreciation, amortization, pricing, P&L

**Tech Context:**
- Primary: users, traffic, performance, deployment, API, latency, scale, uptime
- Secondary: throughput, database, servers, infrastructure, microservices, load

**Leadership Context:**
- Primary: team, managed, led, mentored, trained, supervised, coordinated, delegated
- Secondary: oversight, accountability, direction, strategy, vision, culture

**Competitive Context:**
- Primary: award, won, recognized, ranked, top, best, finalist, competition
- Secondary: selected, chosen, featured, distinguished, honor

**Scale/Scope Context:**
- Primary: projects, months, weeks, quarterly, annual, hours, days
- Secondary: initiatives, programs, campaigns, cycles, phases

### Metric Example Scales by Context

**Financial (Industry Norms):**
- Small team: $100K-$500K
- Mid-level: $1M-$10M
- Senior/Director: $10M+

**Tech (Industry Norms):**
- Early stage: 1K-100K users
- Growth stage: 100K-1M users
- Enterprise: 1M+ users

**Leadership (Industry Norms):**
- Team lead: 3-8 direct reports
- Manager: 8-15 direct reports
- Director+: 15+ direct reports

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] 20+ context detection unit tests passing
- [ ] 10+ integration tests passing
- [ ] Context correctly detected for all 5 categories
- [ ] Metric examples are realistic and industry-appropriate
- [ ] Target role integration working correctly
- [ ] Prompts verified to use context-aware examples
- [ ] No console errors or TypeScript issues
- [ ] Code review approved
- [ ] Story status updated to "done" in sprint-status.yaml

---

## Implementation Sequence

1. **Task 1** - Context detection utility (foundational)
2. **Task 2** - Metric example templates (quick reference)
3. **Task 3** - Update quantification prompts
4. **Task 4** - Target role context mapping
5. **Task 5** - Comprehensive testing

**Parallel Opportunity:** Tasks 1 & 2 can run in parallel

---

## Reference Files & Context

**Existing Quantification Infrastructure:**
- `lib/openai/prompts/action-verbs.ts` - Prompt to update
- `actions/suggestions.ts` - Where quantification is generated
- `lib/utils/quantificationAnalyzer.ts` (Story 9.1) - Reference for metrics

**Epic 9 Reference Docs:**
- `tests/fixtures/logic_refinement/prompt-engineering-guide.md` - Metric quality standards
- `tests/fixtures/logic_refinement/resume-best-practices-analysis.md` - Metric benchmarks by role

---

## Questions for Developer

- Should we detect context for each bullet independently, or resume-level context?
- How strictly should we match keywords (exact vs. fuzzy match)?
- Should multiple detected contexts be combined in the prompt, or use only primary?
- For target role, should we use substring matching (role contains "finance") or exact role list?
- Should financial examples use different scales based on industry (healthcare vs. tech)?
- How should we handle bullets with no detected context - use generic scale context?
- Should we cache context detection per scan to avoid re-analyzing same bullets?

---
