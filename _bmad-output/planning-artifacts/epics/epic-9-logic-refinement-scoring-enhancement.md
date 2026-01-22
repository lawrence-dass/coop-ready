# Epic 9: Logic Refinement & Scoring Enhancement

**Status:** Backlog (Deferred - prioritized after Epic 6)
**Priority:** High (foundational improvement)
**Dependencies:** Epic 5 (Suggestions & Optimization Workflow) - Completed
**Estimated Stories:** 4

## Epic Overview

Enhance the ATS scoring accuracy and suggestion quality through smarter inference logic, natural writing enforcement, and context-aware prompts. This epic addresses gaps identified between the current implementation and the comprehensive guidelines documented in the logic refinement fixtures.

### Business Value

- **Better suggestion quality** leads to higher user trust and acceptance rates
- **Smarter inference** eliminates need for explicit user configuration while delivering personalized results
- **Natural writing guardrails** prevent AI-tell patterns that could hurt candidates
- **Accurate ATS scoring** gives users reliable feedback on their resume strength

### Design Decision: Inference over Configuration

**Decision:** Do not collect explicit optimization level (Conservative/Moderate/Aggressive) from users.

**Rationale:**
- Users often don't know what they want until they see suggestions
- Accept/reject behavior IS the user's optimization preference expressed through action
- Reduces onboarding friction
- System should be smart enough to infer appropriate calibration

**Signals for Inference:**
| Signal | Source | Inference |
|--------|--------|-----------|
| ATS Score | Calculated | Low score = more suggestions, higher urgency |
| Experience Level | User profile | Student/Career Changer/Experienced = different suggestion types |
| Keyword Gaps | ATS analysis | More gaps = prioritize keyword-focused suggestions |
| Quantification Density | Calculated | Low density = more quantification prompts |

---

## Reference Documents

The following documents informed this epic's design:

1. **Context Guidelines:** `tests/fixtures/logic_refinement/context-guidelines.md`
   - Input context hierarchy
   - Career stage detection
   - Career transition framework
   - Optimization levels (for reference, not user-facing)

2. **Prompt Engineering Guide:** `tests/fixtures/logic_refinement/prompt-engineering-guide.md`
   - Core design principles
   - Natural writing guards
   - Quality control design
   - Anti-patterns to avoid

3. **Resume Best Practices Analysis:** `tests/fixtures/logic_refinement/resume-best-practices-analysis.md`
   - Quantification density benchmarks (80%+ target)
   - Metric types by context (financial, tech, leadership)
   - Word count validation (20-35 words)
   - Action verb patterns

---

## Story 9.1: ATS Scoring Recalibration

As a **system**,
I want **to use refined scoring weights and measure quantification density**,
So that **ATS scores more accurately reflect resume quality and job alignment**.

### Acceptance Criteria

**Given** a resume is analyzed
**When** the ATS score is calculated
**Then** the following weights are applied:
- Keyword Alignment: 25% (was 40%)
- Content Relevance: 25% (was merged in Skills 30%)
- Quantification & Impact: 20% (NEW)
- Format & Structure: 15% (was 10%)
- Skills Coverage: 15% (was 30%)

**Given** a resume has bullet points
**When** quantification density is measured
**Then** the system counts bullets containing numbers, percentages, or metrics
**And** calculates density as (bullets with metrics / total bullets) * 100
**And** includes density in the score breakdown

**Given** quantification density is below 50%
**When** scoring occurs
**Then** the Quantification & Impact score is penalized proportionally
**And** feedback highlights "Low quantification density: X%"

**Given** quantification density is 80% or above
**When** scoring occurs
**Then** the Quantification & Impact score receives full marks for density
**And** feedback acknowledges "Strong quantification: X%"

**Given** the score breakdown is returned
**When** displayed to user
**Then** the new categories are shown with explanations
**And** quantification density percentage is visible

### Technical Notes

- Update `lib/openai/prompts/scoring.ts` with new weights
- Create `lib/utils/quantificationAnalyzer.ts` for density calculation
- Regex patterns for metric detection: numbers, percentages, currency, time units
- Update `lib/types/analysis.ts` with new score breakdown structure
- Ensure backward compatibility with existing scan results

---

## Story 9.2: Inference-Based Suggestion Calibration

As a **system**,
I want **to calibrate suggestion intensity and types based on available signals**,
So that **users receive appropriately targeted suggestions without explicit configuration**.

### Acceptance Criteria

**ATS Score-Based Intensity:**

**Given** ATS score is 0-30 (Poor)
**When** suggestions are generated
**Then** suggestion mode is "Transformation"
**And** more suggestions are generated with higher urgency flags
**And** aggressive rewrite suggestions are included

**Given** ATS score is 30-50 (Fair)
**When** suggestions are generated
**Then** suggestion mode is "Improvement"
**And** moderate volume of suggestions focusing on gaps
**And** balanced urgency distribution

**Given** ATS score is 50-70 (Good)
**When** suggestions are generated
**Then** suggestion mode is "Optimization"
**And** targeted suggestions for polish
**And** lower urgency, refinement focus

**Given** ATS score is 70+ (Excellent)
**When** suggestions are generated
**Then** suggestion mode is "Validation"
**And** minimal suggestions
**And** feedback emphasizes strengths

**Experience Level-Based Types:**

**Given** user is flagged as "student"
**When** suggestions are generated
**Then** prioritize: quantification for projects, academic framing, GPA guidance
**And** emphasize: skill expansion, project enhancement

**Given** user is flagged as "career_changer"
**When** suggestions are generated
**Then** prioritize: skill mapping, transferable language, bridge statements
**And** emphasize: section reordering hints, experience reframing

**Given** user is flagged as "experienced"
**When** suggestions are generated
**Then** prioritize: leadership language, metric enhancement, scope amplification
**And** emphasize: format polish, conciseness

**Keyword Gap-Based Priority:**

**Given** 5+ high-priority keywords are missing
**When** suggestions are prioritized
**Then** keyword-focused suggestions are marked as "high" urgency

**Given** 2-4 keywords are missing
**When** suggestions are prioritized
**Then** keyword suggestions are marked as "medium" urgency

**Given** 0-1 keywords are missing
**When** suggestions are prioritized
**Then** focus shifts to other improvement areas

### Technical Notes

- Create `lib/utils/suggestionCalibrator.ts` for inference logic
- Update suggestion generation actions to accept calibration context
- Pass ATS score, experience level, keyword gaps to suggestion generators
- Add `suggestionMode` field to suggestion metadata
- Update prompts to include calibration context

---

## Story 9.3: Natural Writing Enforcement

As a **system**,
I want **to detect and flag AI-tell patterns and enforce natural writing standards**,
So that **generated suggestions produce human-sounding resume content**.

### Acceptance Criteria

**Banned Phrase Detection:**

**Given** a bullet contains "spearheaded"
**When** natural writing check runs
**Then** an action_verb suggestion is generated
**And** alternatives offered: "Led", "Directed", "Initiated"
**And** reasoning explains: "Replace AI-flagged verb for natural tone"

**Given** a bullet contains "leveraged"
**When** natural writing check runs
**Then** an action_verb suggestion is generated
**And** alternatives offered: "Used", "Applied", "Employed"
**And** reasoning explains: "Replace AI-flagged verb for natural tone"

**Given** a bullet contains "synergized" or "utilize"
**When** natural writing check runs
**Then** appropriate replacement suggestions are generated

**Word Count Validation:**

**Given** a bullet has fewer than 15 words
**When** validation runs
**Then** a format suggestion is generated
**And** message: "Consider adding more context (currently X words)"
**And** urgency: "low"

**Given** a bullet has more than 40 words
**When** validation runs
**Then** a format suggestion is generated
**And** message: "Consider splitting or condensing (currently X words)"
**And** urgency: "low"

**Given** a bullet is 20-35 words
**When** validation runs
**Then** no word count suggestion is generated (optimal range)

**Verb Diversity Check:**

**Given** the same action verb appears 3+ times in resume
**When** diversity check runs
**Then** a format suggestion is generated for repeated instances
**And** alternatives from same verb category are offered
**And** reasoning explains: "Vary action verbs for stronger impact"

**Given** verbs are well-distributed (no verb > 2 times)
**When** diversity check runs
**Then** no diversity suggestion is generated

### Technical Notes

- Create `lib/utils/naturalWritingChecker.ts`
- Banned phrases list: leveraged, spearheaded, synergized, utilize, utilized, utilizing
- Word count regex: split on whitespace, count tokens
- Verb extraction: first word of bullet after stripping
- Integrate checks into suggestion generation pipeline
- Run checks BEFORE AI generation to avoid suggesting banned phrases

---

## Story 9.4: Context-Aware Metric Prompts

As a **system**,
I want **to provide specific quantification prompts based on experience context**,
So that **users receive actionable guidance for adding relevant metrics**.

### Acceptance Criteria

**Financial Context Detection:**

**Given** a bullet mentions financial terms (revenue, budget, cost, savings, ROI, AUM)
**When** quantification suggestion is generated
**Then** prompts include: "Consider adding: dollar amount, percentage savings, ROI figure"
**And** examples reference: "$X in revenue", "X% cost reduction", "$X AUM"

**Given** user's target role is in finance/accounting
**When** quantification suggestions are generated
**Then** financial metric prompts are prioritized
**And** examples use industry-appropriate scales

**Tech Context Detection:**

**Given** a bullet mentions tech terms (users, traffic, performance, deployment, API)
**When** quantification suggestion is generated
**Then** prompts include: "Consider adding: user count, traffic increase, latency improvement"
**And** examples reference: "X users", "X% faster", "Xms response time"

**Given** user's target role is in software/engineering
**When** quantification suggestions are generated
**Then** tech metric prompts are prioritized
**And** examples use industry-appropriate scales

**Leadership Context Detection:**

**Given** a bullet mentions leadership terms (team, managed, led, mentored, trained)
**When** quantification suggestion is generated
**Then** prompts include: "Consider adding: team size, direct reports, scope"
**And** examples reference: "team of X", "X direct reports", "across X departments"

**Competitive/Ranking Context:**

**Given** a bullet mentions competition, awards, or rankings
**When** quantification suggestion is generated
**Then** prompts include: "Consider adding: ranking position, pool size, percentile"
**And** examples reference: "Top X%", "Xth out of Y", "X place"

**Scale/Scope Context:**

**Given** a bullet lacks scale indicators
**When** quantification suggestion is generated
**Then** prompts include: "Consider adding: volume, frequency, duration"
**And** examples reference: "X projects", "over X months", "X per week"

### Technical Notes

- Create `lib/utils/contextDetector.ts` for context classification
- Keyword lists for each context type (financial, tech, leadership, etc.)
- Update `lib/openai/prompts/action-verbs.ts` to use context-aware prompts
- Create metric example templates per context
- Integrate with existing quantification suggestion flow

---

## Quality Guardrails (Cross-Cutting)

These guardrails apply across all stories and are non-negotiable:

| Guardrail | Rule | Enforcement |
|-----------|------|-------------|
| Authenticity | Never suggest fabricated skills, metrics, or experience | Prompt constraints + validation |
| Natural Writing | Auto-flag/replace AI-tell phrases | Story 9.3 |
| Word Count | Flag bullets outside 15-40 word range | Story 9.3 |
| Verb Diversity | Warn if verb used 3+ times | Story 9.3 |
| Metric Honesty | Mark inferred metrics as "suggested range" not exact | Prompt language |

---

## Implementation Sequence

**Recommended Order:**

1. **Story 9.1** (Scoring) - Foundation for calibration
2. **Story 9.3** (Natural Writing) - Quick wins, standalone
3. **Story 9.2** (Calibration) - Depends on scoring
4. **Story 9.4** (Context Prompts) - Enhancement layer

**Parallel Opportunity:** Stories 9.1 and 9.3 can be developed in parallel.

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Suggestion acceptance rate | TBD | +15% improvement |
| Banned phrases in output | Unknown | 0 instances |
| Avg bullets with metrics | ~60% | 80%+ |
| User-reported suggestion quality | TBD | 4+ stars |

---

## Appendix: Scoring Weight Comparison

### Current Implementation
```
Keywords: 40%
Skills: 30%
Experience: 20%
Format: 10%
```

### Proposed (Story 9.1)
```
Keyword Alignment: 25%
Content Relevance: 25%
Quantification & Impact: 20%
Format & Structure: 15%
Skills Coverage: 15%
```

### Rationale
- Keywords over-weighted currently (40% → 25%)
- Quantification explicitly measured (NEW 20%)
- Format importance increased (10% → 15%)
- Better balance across quality dimensions

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-21 | Initial epic planning from brainstorming session |
