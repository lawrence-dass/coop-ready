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

- [ ] **Task 1: Create Natural Writing Checker Utility** (AC: 1, 2, 3)
  - [ ] 1.1 Create `lib/utils/naturalWritingChecker.ts` file
  - [ ] 1.2 Implement `detectBannedPhrases()` function
  - [ ] 1.3 Implement `getAlternatives()` for each phrase
  - [ ] 1.4 Implement `validateWordCount()` function
  - [ ] 1.5 Implement `checkVerbDiversity()` function
  - [ ] 1.6 Implement `runNaturalWritingChecks()` orchestrator
  - [ ] 1.7 Write unit tests for banned phrase detection (8+ tests)
  - [ ] 1.8 Write unit tests for word count validation (6+ tests)
  - [ ] 1.9 Write unit tests for verb diversity (5+ tests)
  - [ ] 1.10 Test edge cases (hyphens, abbreviations, contractions)

- [ ] **Task 2: Create Verb Categories & Alternatives Mapping** (AC: 1, 3)
  - [ ] 2.1 Create `lib/data/verbAlternatives.ts`
  - [ ] 2.2 Define 5+ verb categories (leadership, technical, analytics, etc.)
  - [ ] 2.3 Map 3-5 alternatives per category verb
  - [ ] 2.4 Include reasoning for each alternative
  - [ ] 2.5 Unit tests for lookup (4+ tests)
  - [ ] 2.6 Test category mapping consistency

- [ ] **Task 3: Integrate into Suggestion Generation Pipeline** (AC: 1, 2, 3)
  - [ ] 3.1 Update `actions/suggestions.ts` to import checker
  - [ ] 3.2 Call `runNaturalWritingChecks()` BEFORE AI generation
  - [ ] 3.3 Extract banned phrase suggestions from results
  - [ ] 3.4 Extract word count suggestions from results
  - [ ] 3.5 Extract verb diversity suggestions from results
  - [ ] 3.6 Convert check results to suggestion format
  - [ ] 3.7 Apply appropriate urgency scores
  - [ ] 3.8 Combine with AI-generated suggestions
  - [ ] 3.9 Unit tests for integration (5+ tests)
  - [ ] 3.10 Test with real resume data

- [ ] **Task 4: Update Prompts to Avoid Banned Phrases** (AC: 1, 2, 3)
  - [ ] 4.1 Update `lib/openai/prompts/action-verbs.ts`
  - [ ] 4.2 Update `lib/openai/prompts/bullet-rewrites.ts`
  - [ ] 4.3 Update `lib/openai/prompts/skills-expansion.ts`
  - [ ] 4.4 Update `lib/openai/prompts/skills.ts`
  - [ ] 4.5 Update `lib/openai/prompts/format-removal.ts`
  - [ ] 4.6 Add banned phrase constraint to each prompt
  - [ ] 4.7 Add word count guidance (20-35 words optimal)
  - [ ] 4.8 Test with OpenAI API (5+ prompts × test scenarios)

- [ ] **Task 5: Update UI to Display Writing Issues** (AC: 1, 2, 3)
  - [ ] 5.1 Create `NaturalWritingIssuesCard` component
  - [ ] 5.2 Display banned phrases with highlighting
  - [ ] 5.3 Show word count indicators (color-coded)
  - [ ] 5.4 Display verb diversity warnings
  - [ ] 5.5 Show alternatives for each issue
  - [ ] 5.6 Add explanation tooltips
  - [ ] 5.7 Responsive design for mobile
  - [ ] 5.8 Component unit tests (6+ tests)
  - [ ] 5.9 Integration test with suggestions page

- [ ] **Task 6: Create Comprehensive Tests** (AC: 1, 2, 3)
  - [ ] 6.1 Unit tests for checker utility (20+ tests)
  - [ ] 6.2 Integration tests with real bullets (10+ scenarios)
  - [ ] 6.3 Test verb diversity across sections
  - [ ] 6.4 Test word count edge cases
  - [ ] 6.5 Test banned phrase detection variants (capitalization, punctuation)
  - [ ] 6.6 End-to-end: bullet input → check → suggestions
  - [ ] 6.7 Test all banned phrases in list
  - [ ] 6.8 Test interaction with other suggestion types

---

## Technical Reference

### Banned Phrases
**Primary (always replace):**
- spearheaded, leveraged, synergized, utilize, utilized, utilizing

**Secondary (context-aware):**
- pushed, driven, impacted (overused in resumes)

### Word Count Rules
- Optimal: 20-35 words per bullet
- Low warning: < 15 words
- High warning: > 40 words
- Contractions count as 1 word

### Verb Categories
- **Leadership:** Led, Directed, Managed, Coordinated, Guided, Organized
- **Technical:** Built, Designed, Implemented, Developed, Created, Engineered
- **Analytics:** Analyzed, Evaluated, Assessed, Measured, Quantified, Determined
- **Communication:** Communicated, Presented, Articulated, Explained, Conveyed
- **Problem-Solving:** Resolved, Solved, Addressed, Overcame, Improved

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
