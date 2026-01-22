# Story 9.3: Natural Writing Enforcement

**Epic:** Epic 9 - Logic Refinement & Scoring Enhancement
**Story Key:** 9-3-natural-writing-enforcement
**Status:** ready-for-dev
**Created:** 2026-01-22
**Priority:** High
**Dependencies:** Story 9.1 (ATS Scoring) - COMPLETED ✓

---

## Story Summary

As a **system**,
I want **to detect and flag AI-tell patterns and enforce natural writing standards**,
So that **generated suggestions produce human-sounding resume content**.

---

## Business Context

AI-generated content often has recognizable patterns ("spearheaded", "leveraged", "synergized") that hiring managers immediately identify as AI-written. By detecting and replacing these phrases, we ensure suggestions produce authentic, human-sounding content that increases acceptance rates and improves candidate outcomes.

---

## Acceptance Criteria

### AC1: Banned Phrase Detection
**Given** a bullet contains "spearheaded"
**When** natural writing check runs
**Then** an action_verb suggestion is generated
**And** alternatives offered: "Led", "Directed", "Initiated"
**And** reasoning explains: "Replace AI-flagged verb for natural tone"

**Test:** Bullet with "spearheaded" → action_verb suggestion with 3 alternatives

---

**Given** a bullet contains "leveraged"
**When** natural writing check runs
**Then** an action_verb suggestion is generated
**And** alternatives offered: "Used", "Applied", "Employed"
**And** reasoning explains: "Replace AI-flagged verb for natural tone"

**Test:** Bullet with "leveraged" → action_verb suggestion with alternatives

---

**Given** a bullet contains "synergized" or "utilize"
**When** natural writing check runs
**Then** appropriate replacement suggestions are generated

**Test:** Both phrases detected and flagged

---

### AC2: Word Count Validation
**Given** a bullet has fewer than 15 words
**When** validation runs
**Then** a format suggestion is generated
**And** message: "Consider adding more context (currently X words)"
**And** urgency: "low"

**Test:** 10-word bullet → format suggestion with word count

---

**Given** a bullet has more than 40 words
**When** validation runs
**Then** a format suggestion is generated
**And** message: "Consider splitting or condensing (currently X words)"
**And** urgency: "low"

**Test:** 45-word bullet → format suggestion

---

**Given** a bullet is 20-35 words
**When** validation runs
**Then** no word count suggestion is generated (optimal range)

**Test:** 25-word bullet → no suggestion

---

### AC3: Verb Diversity Check
**Given** the same action verb appears 3+ times in resume
**When** diversity check runs
**Then** a format suggestion is generated for repeated instances
**And** alternatives from same verb category are offered
**And** reasoning explains: "Vary action verbs for stronger impact"

**Test:** "Led" appears 4 times → 3 suggestions for varied alternatives

---

**Given** verbs are well-distributed (no verb > 2 times)
**When** diversity check runs
**Then** no diversity suggestion is generated

**Test:** Max 2 instances of any verb → no suggestion

---

## Tasks & Subtasks

- [ ] **Task 1: Create Natural Writing Checker Utility**
  - [ ] 1.1 Create `lib/utils/naturalWritingChecker.ts` file
  - [ ] 1.2 Implement `detectBannedPhrases()` with phrase list
  - [ ] 1.3 Implement `getAlternatives()` for each banned phrase
  - [ ] 1.4 Implement `validateWordCount()` function
  - [ ] 1.5 Implement `checkVerbDiversity()` function
  - [ ] 1.6 Implement `runNaturalWritingChecks()` main orchestrator
  - [ ] 1.7 Write unit tests (banned phrases, word counts, diversity)
  - [ ] 1.8 Test edge cases (hyphenated words, abbreviations, etc.)

- [ ] **Task 2: Create Verb Categories & Alternatives Mapping**
  - [ ] 2.1 Create `lib/data/verbAlternatives.ts` with categories
  - [ ] 2.2 Define 5+ verb categories (leadership, technical, analytics, etc.)
  - [ ] 2.3 Map alternatives for each category verb
  - [ ] 2.4 Include reasoning for each alternative
  - [ ] 2.5 Unit tests for lookup and retrieval

- [ ] **Task 3: Integrate into Suggestion Generation Pipeline**
  - [ ] 3.1 Update `actions/suggestions.ts` to call natural writing checks
  - [ ] 3.2 Add checks BEFORE AI generation (to avoid suggesting banned phrases)
  - [ ] 3.3 Convert check results to suggestion format
  - [ ] 3.4 Add urgency scoring based on check type
  - [ ] 3.5 Unit tests for integration

- [ ] **Task 4: Update Suggestion Prompts to Avoid Banned Phrases**
  - [ ] 4.1 Update `lib/openai/prompts/action-verbs.ts`
  - [ ] 4.2 Update `lib/openai/prompts/suggestions.ts` (bullet rewrites)
  - [ ] 4.3 Add constraint: "Never use: spearheaded, leveraged, synergized, utilize, utilized, utilizing"
  - [ ] 4.4 Add constraint: "Ensure bullets are 20-35 words (ideal range)"
  - [ ] 4.5 Test with OpenAI API to verify compliance

- [ ] **Task 5: Update UI to Highlight Natural Writing Issues**
  - [ ] 5.1 Create `NaturalWritingIssues` component
  - [ ] 5.2 Display banned phrases with visual highlighting
  - [ ] 5.3 Show word count indicators (red <15, green 20-35, red >40)
  - [ ] 5.4 Display verb diversity warnings
  - [ ] 5.5 Responsive design for mobile
  - [ ] 5.6 Unit tests for component

- [ ] **Task 6: Create Comprehensive Tests**
  - [ ] 6.1 Unit tests for natural writing checker (20+ tests)
  - [ ] 6.2 Integration tests with real bullets (10+ scenarios)
  - [ ] 6.3 Test interaction with verb diversity across sections
  - [ ] 6.4 Test word count edge cases (hyphens, abbreviations, contractions)
  - [ ] 6.5 Test banned phrase detection with capitalization variants
  - [ ] 6.6 End-to-end test from bullet input to suggestion output

---

## Technical Details

### Banned Phrases List
```
Primary (Always replace):
- spearheaded
- leveraged
- synergized
- utilized / utilize / utilizing

Secondary (Context-dependent):
- pushed (often overused)
- driven (often passive)
- impacted (overused in tech)
```

### Word Count Calculation
- Split on whitespace
- Count tokens (handle contractions: "don't" = 1 word)
- Ignore punctuation for counting

### Verb Categories
```
Leadership: Led, Directed, Managed, Coordinated, Guided, Organized
Technical: Built, Designed, Implemented, Developed, Created, Engineered
Analytics: Analyzed, Evaluated, Assessed, Measured, Quantified, Determined
Communication: Communicated, Presented, Articulated, Explained, Conveyed
Problem-Solving: Resolved, Solved, Addressed, Overcame, Improved
```

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] 25+ unit tests passing (natural writing checker)
- [ ] 10+ integration tests passing
- [ ] UI component displays all 3 check types
- [ ] Prompts verified to avoid banned phrases in output
- [ ] No console errors or TypeScript issues
- [ ] Code review approved
- [ ] Story status updated to "done" in sprint-status.yaml

---

## Implementation Sequence

1. **Task 1** - Natural writing checker utility (foundational)
2. **Task 2** - Verb alternatives mapping (quick win)
3. **Task 3** - Integration into generation pipeline
4. **Task 4** - Update prompts to enforce constraints
5. **Task 5** - UI components (optional but recommended)
6. **Task 6** - Comprehensive testing

**Parallel Opportunity:** Tasks 1 & 2 can run in parallel

---

## Reference Files & Context

**Existing Suggestion Infrastructure:**
- `actions/suggestions.ts` - Where to integrate checks
- `lib/openai/prompts/action-verbs.ts` - Prompt to update
- `lib/openai/prompts/suggestions.ts` - Prompt to update

**Epic 9 Reference Docs:**
- `tests/fixtures/logic_refinement/prompt-engineering-guide.md` - Natural writing standards
- `tests/fixtures/logic_refinement/resume-best-practices-analysis.md` - Word count benchmarks

---

## Questions for Developer

- Should hyphenated words count as 1 word or 2? (e.g., "well-organized")
- Should we detect banned phrases case-insensitively?
- For verb diversity, should we count across resume or per-section?
- Should contractions (don't, it's) count as 1 word each?
- Should we add "soft" warnings for overused-but-acceptable verbs (pushed, driven)?
