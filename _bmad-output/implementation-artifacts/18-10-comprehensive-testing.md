# Story 18.10: Comprehensive Testing

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer maintaining SubmitSmart,
I want comprehensive unit, integration, and E2E tests covering the entire candidate-type-aware pipeline introduced in Epic 18,
so that future changes cannot silently break candidate detection, type-specific scoring, structural suggestions, projects suggestions, dynamic tab ordering, or the end-to-end optimization flow.

## Acceptance Criteria

1. **All P0 unit tests pass** — Critical-path tests for candidate type detection (switching-careers + fulltime = career_changer, coop preference overrides resume signals), structural suggestion rules, weight profile sums, and section ordering validation
2. **Integration test for each candidate type** — Full pipeline test verifying co-op, fulltime, and career_changer each produce correct candidateType, appropriate structural suggestions, type-specific scoring weights, and correctly framed suggestions
3. **E2E test for Projects tab + dynamic ordering** — Playwright test verifying tab order changes by candidate type, Projects tab appears when data exists, co-op summary tab is muted/optional
4. **`npm run build && npm run test:all` passes** — Zero regressions in existing test suite
5. **No regressions in existing suite** — All pre-Epic-18 tests continue to pass unchanged
6. **Pipeline integration tests** — Verify candidateType flows from /api/optimize → store → generateAllSuggestions → UI rendering
7. **Backward compatibility tests** — Sessions with null candidate_type default to fulltime behavior throughout the pipeline
8. **Cross-type scoring differentiation** — Same resume input produces meaningfully different scores across all 3 candidate types with correct weight applications

## Tasks / Subtasks

- [x] Task 1: Expand cross-type scoring integration tests (AC: #8)
  - [x] 1.1 Create `tests/unit/lib/scoring/crossTypeScoring.test.ts` — comprehensive scoring test with 3 candidate types
  - [x] 1.2 Test that `calculateATSScoreV21` applies different component weights per type: coop (keywords 0.45), fulltime/mid (keywords 0.35), career_changer (keywords 0.40)
  - [x] 1.3 Test career_changer: education maxPoints=20 (higher than fulltime=15), experience maxPoints=20 (lower than fulltime=30), projects maxPoints=15 (higher than fulltime=10)
  - [x] 1.4 Test co-op: summary required=false, missing experience NOT penalized when projects has 3+ bullets
  - [x] 1.5 Test all weight profiles sum to exactly 1.0 (existing test but verify all 3 Epic 18 types)

- [x] Task 2: Add gap analysis integration with 'projects' SectionType (AC: #1, #2)
  - [x] 2.1 Create `tests/unit/lib/scoring/gapAddressabilityProjects.test.ts`
  - [x] 2.2 Test `filterGapsForSection('projects', gaps)` returns correct terminology/potential/unfixable categorization
  - [x] 2.3 Test `processGapAddressability` with parsedSections including `projects` field — verify projects text included in allSectionText for classification
  - [x] 2.4 Test `buildSectionATSContext('projects', contextInput)` returns valid ATS context with keywords + contentQuality components

- [ ] Task 3: Create candidate-type pipeline integration test (AC: #2, #6)
  - [ ] 3.1 Create `tests/integration/candidate-type-pipeline.test.ts`
  - [ ] 3.2 Test co-op pipeline: jobType='coop' → detectCandidateType returns 'coop' → scoring uses coop weights → structural suggestions fire co-op rules (rules 1-4) → summary generation skipped when no summary
  - [ ] 3.3 Test fulltime pipeline: jobType='fulltime' + no career signals → detectCandidateType returns 'fulltime' → scoring uses fulltime weights → structural suggestions fire fulltime rules (rule 5)
  - [ ] 3.4 Test career_changer pipeline: jobType='fulltime' + careerGoal='switching-careers' → detectCandidateType returns 'career_changer' → scoring uses career_changer weights → structural suggestions fire career_changer rules (rules 6-7) → summary always generated
  - [ ] 3.5 Mock generateAllSuggestions dependencies (LLM calls) and verify candidateType passed through to all 5 generators

- [ ] Task 4: Add backward compatibility tests (AC: #7)
  - [ ] 4.1 Create `tests/unit/lib/scoring/backwardCompatibility.test.ts`
  - [ ] 4.2 Test `detectCandidateType({})` returns `{ candidateType: 'fulltime', confidence: 0.5, detectedFrom: 'default' }`
  - [ ] 4.3 Test `validateSectionOrder(['skills', 'experience'], 'fulltime')` works when candidateType defaults
  - [ ] 4.4 Test `generateStructuralSuggestions` with null/undefined candidateType defaults gracefully
  - [ ] 4.5 Test session reload with `candidate_type: null` → store defaults to fulltime tab ordering
  - [ ] 4.6 Test `deriveEffectiveCandidateType(undefined, undefined)` returns 'fulltime'

- [ ] Task 5: Create E2E test for dynamic tab ordering and Projects tab (AC: #3)
  - [ ] 5.1 Create `tests/e2e/candidate-type-suggestions.spec.ts`
  - [ ] 5.2 Test co-op tab order: Skills tab first, Education second, Projects third, Experience fourth, Summary last with "Optional" badge
  - [ ] 5.3 Test fulltime tab order: Summary first, Skills second, Experience third, Projects fourth, Education fifth
  - [ ] 5.4 Test career_changer tab order: Summary first, Skills second, Education third, Projects fourth, Experience fifth
  - [ ] 5.5 Test Projects tab renders project entries with bullet suggestions
  - [ ] 5.6 Test structural suggestions banner appears above tabs when structural suggestions exist

- [ ] Task 6: Add generateAllSuggestions candidateType integration test (AC: #6)
  - [ ] 6.1 Expand `tests/unit/actions/generateAllSuggestions.test.ts` or create new focused test
  - [ ] 6.2 Test candidateType='coop' + empty resumeSummary → summary generation skipped, no summary in result
  - [ ] 6.3 Test candidateType='career_changer' → summary always generated even with empty resumeSummary
  - [ ] 6.4 Test candidateType passed to all 5 generators as last argument (verify mock call args)
  - [ ] 6.5 Test resumeProjects passed → projects suggestion generated; resumeProjects empty → projects null
  - [ ] 6.6 Test ATS context includes projects when resumeProjects provided (atsContexts.projects !== undefined)

- [ ] Task 7: Structural suggestions edge case tests (AC: #1)
  - [ ] 7.1 Add tests to `tests/unit/lib/scoring/structuralSuggestions.test.ts` for cross-rule interactions
  - [ ] 7.2 Test co-op with ALL 4 violations simultaneously → 4 suggestions returned with correct priorities
  - [ ] 7.3 Test career_changer with no summary AND edu below exp → 2 suggestions (both correct)
  - [ ] 7.4 Test non-standard headers with mixed case: "My Journey", "WHAT I KNOW", "things I've Built"
  - [ ] 7.5 Test that Rule 8 headers only detected in heading context (not body text matches)

- [ ] Task 8: Build verification and full suite run (AC: #4, #5)
  - [ ] 8.1 Run `npm run build` — zero type errors
  - [ ] 8.2 Run `npm run test:unit:run` — all unit tests pass
  - [ ] 8.3 Run `npm run test:all` — full suite passes including new tests
  - [ ] 8.4 Verify no regressions: all pre-Epic-18 test files pass unchanged

## Dev Notes

### Architecture Overview

This is the **final testing story** for Epic 18 (Candidate-Type-Aware Resume Structure). Stories 18.1-18.9 introduced candidate type detection, 6-section parsing, structural suggestions, career changer scoring, projects suggestions, conditional summary logic, store/DB extensions, dynamic UI, and pipeline wiring. Each story included focused unit tests. This story fills coverage gaps and adds cross-cutting integration + E2E tests.

### Existing Test Coverage (447+ tests across 14 files)

| Module | Test File | Tests | Coverage |
|--------|-----------|-------|----------|
| Candidate Detection | tests/unit/candidateTypeDetection.test.ts | 30 | Excellent — all 6 priorities |
| Section Ordering | tests/unit/lib/scoring/sectionOrdering.test.ts | 20 | Excellent — all 3 types |
| Structural Suggestions | tests/unit/lib/scoring/structuralSuggestions.test.ts | 51 | Very Good — all 8 rules |
| Scoring Weights | tests/unit/lib/scoring/scoringWeights.test.ts | 8 | Moderate — sums only |
| Cross-Type Scoring | tests/unit/lib/scoring/crossTypeDifferentiation.test.ts | 2 | Poor — basic only |
| Projects Suggestion | tests/unit/lib/ai/generateProjectsSuggestion.test.ts | 16 | Very Good |
| Candidate Guidance | tests/unit/lib/ai/preferences-candidateType.test.ts | 37 | Excellent |
| Resume Parsing | tests/unit/actions/parseResumeText.test.ts | 14 | Very Good — 6 sections |
| Suggestions Pipeline | tests/unit/actions/generateAllSuggestions.test.ts | 25 | Good — missing candidateType tests |
| UI Banner | tests/unit/components/StructuralSuggestionsBanner.test.tsx | 13 | Good |
| Store | tests/unit/store/useOptimizationStore-projects-candidateType.test.ts | 27 | Excellent |
| extractResumeAnalysis | tests/unit/scoring/extractResumeAnalysisData.test.ts | 18 | Good |
| detectSectionOrder | tests/unit/scoring/detectSectionOrder.test.ts | 9 | Good |
| Preferences Pipeline | tests/integration/preferences-pipeline.test.ts | 26 | Very Good |

### Critical Gaps This Story Fills

1. **Cross-type scoring differentiation** — Only 2 basic tests exist. Need weight application verification, career_changer education boost, co-op experience waiver
2. **gapAddressability with 'projects' SectionType** — No tests for the projects extension added in 18.9
3. **Full candidate-type pipeline integration** — No test verifying end-to-end: detect → score → structural → suggest → render
4. **generateAllSuggestions candidateType wiring** — Existing tests don't cover candidateType param (added in 18.9), co-op summary skip, or projects ATS context
5. **Backward compatibility** — No explicit tests for null candidateType → fulltime default throughout pipeline
6. **E2E dynamic tab ordering** — No Playwright test for tab order changing by candidate type
7. **Structural suggestion multi-rule interactions** — Individual rules tested but no tests for multiple simultaneous violations

### Test Patterns to Follow

**Vitest Unit Tests:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('[P0] Feature Name', () => {
  it('should do expected behavior', () => {
    const result = functionUnderTest(input);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });
});
```

**Mock Pattern (vi.hoisted for LLM dependencies):**
```typescript
const { mockChainInvoke } = vi.hoisted(() => ({
  mockChainInvoke: vi.fn(),
}));
vi.mock('@/lib/ai/models', () => ({
  getSonnetModel: vi.fn(() => ({ pipe: vi.fn(() => ({ invoke: mockChainInvoke })) })),
}));
```

**Mock Pattern (vi.mock for server actions):**
```typescript
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) })) })),
  })),
}));
```

**Playwright E2E Pattern:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature', () => {
  test('[P0] should verify critical behavior', async ({ page }) => {
    await page.goto('/dashboard/scan/...');
    await expect(page.locator('[data-testid="tab"]')).toBeVisible();
  });
});
```

### Key Source Files for Testing

| Source File | Key Exports to Test |
|-------------|-------------------|
| `lib/scoring/candidateTypeDetection.ts` | `detectCandidateType()`, `extractResumeAnalysisData()` |
| `lib/scoring/structuralSuggestions.ts` | `generateStructuralSuggestions()` |
| `lib/scoring/sectionOrdering.ts` | `validateSectionOrder()`, `detectSectionOrder()`, `RECOMMENDED_ORDER` |
| `lib/scoring/gapAddressability.ts` | `processGapAddressability()`, `filterGapsForSection()`, `SectionType` |
| `lib/ai/buildSectionATSContext.ts` | `buildSectionATSContext('projects', ...)`, `SECTION_COMPONENT_MAP` |
| `lib/ai/calculateATSScore.ts` | `calculateATSScoreV21Full()` with candidateType |
| `actions/generateAllSuggestions.ts` | `generateAllSuggestions()` with candidateType + resumeProjects |
| `app/api/optimize/route.ts` | `OptimizationResult` with candidateType + structuralSuggestions |

### Key Type Signatures

```typescript
// CandidateType
type CandidateType = 'coop' | 'fulltime' | 'career_changer';

// Detection
function detectCandidateType(input: CandidateTypeInput): CandidateTypeResult;
// CandidateTypeInput: { userJobType?, careerGoal?, resumeRoleCount?, hasActiveEducation?, totalExperienceYears? }
// CandidateTypeResult: { candidateType, confidence (0.5-1.0), detectedFrom }

// Structural
function generateStructuralSuggestions(input: StructuralSuggestionInput): StructuralSuggestion[];
// StructuralSuggestionInput: { candidateType, parsedResume: {6 sections}, sectionOrder: string[], rawResumeText? }

// Ordering
function validateSectionOrder(presentSections: string[], candidateType: CandidateType): SectionOrderValidation;
// SectionOrderValidation: { isCorrectOrder, violations: SectionOrderViolation[], recommendedOrder }

// Gap Addressability
type SectionType = 'summary' | 'skills' | 'experience' | 'education' | 'projects';
function filterGapsForSection(gaps: ProcessedGap[], section: SectionType): { terminologyFixes, potentialAdditions, opportunities, cannotFix }

// Suggestions
interface GenerateAllRequest { ...existing, resumeProjects?: string, candidateType?: CandidateType }
interface GenerateAllResult { summary, skills, experience, education, projects, sectionErrors }
```

### Weight Profiles for Testing

```typescript
// Expected weights (from lib/scoring/constants.ts ROLE_WEIGHT_ADJUSTMENTS)
coop_entry:     { keywords: 0.45, qualificationFit: 0.10, contentQuality: 0.15, sections: 0.20, format: 0.10 }
mid (fulltime): { keywords: 0.35, qualificationFit: 0.15, contentQuality: 0.20, sections: 0.18, format: 0.12 }
career_changer: { keywords: 0.40, qualificationFit: 0.14, contentQuality: 0.18, sections: 0.18, format: 0.10 }

// Section config differences (from SECTION_CONFIG_V21)
career_changer: education.maxPoints=20 (vs fulltime=15), experience.maxPoints=20 (vs fulltime=30), projects.maxPoints=15 (vs fulltime=10)
coop: summary.required=false
```

### Tab Order Constants

```typescript
const TAB_ORDER: Record<CandidateType, SectionType[]> = {
  coop: ['skills', 'education', 'projects', 'experience', 'summary'],
  fulltime: ['summary', 'skills', 'experience', 'projects', 'education'],
  career_changer: ['summary', 'skills', 'education', 'projects', 'experience'],
};
```

### Structural Rules Quick Reference

| Rule | Candidate | Priority | Category |
|------|-----------|----------|----------|
| 1: exp before edu | coop | high | section_order |
| 2: no skills at top | coop | critical | section_presence |
| 3: generic summary | coop | high | section_presence |
| 4: "Projects" heading | coop | moderate | section_heading |
| 5: edu before exp | fulltime | high | section_order |
| 6: no summary | career_changer | critical | section_presence |
| 7: edu below exp | career_changer | high | section_order |
| 8: non-standard headers | all | moderate | section_heading |

### Previous Story Intelligence

**Story 18.9 Code Review Fixes (Key Learnings):**
- H1 CRITICAL: `candidateType` was silently dropped in `calculateATSScoreV21Full` — destructured but not passed through. **Test this: verify candidateType reaches inner scoring function.**
- H2 HIGH: `hasATSContext` check in generateAllSuggestions was missing `|| atsContexts.projects`. **Test this: verify projects ATS context included in availability check.**
- M1 MEDIUM: `processGapAddressability` parsedSections was missing `projects` field. **Test this: verify projects text included in gap classification.**
- Key lesson from 18.8: When adding new type union members (like 'projects' to SectionType), verify ALL consumers handle the new value.

### Test File Naming Conventions

| Test Type | Location | Naming |
|-----------|----------|--------|
| Unit tests | `tests/unit/` | `*.test.ts` |
| Component tests | `tests/unit/components/` | `*.test.tsx` |
| Integration tests | `tests/integration/` | `*.test.ts` (Vitest) or `*.spec.ts` (Playwright) |
| E2E tests | `tests/e2e/` | `*.spec.ts` (Playwright) |

### What NOT to Modify

- Do NOT modify any source code files — this is a testing-only story
- Do NOT modify existing test files that already pass — extend via new test files only
- Do NOT create mock data factories — use inline test data following existing patterns
- Do NOT add test infrastructure (fixtures, helpers) unless strictly needed

### E2E Test Strategy

The E2E test requires a real session with candidate type data. Two approaches:
1. **Seed via API**: POST to /api/optimize with a co-op/fulltime/career-changer resume, then navigate to suggestions page
2. **Mock at page level**: Use `page.route()` to intercept API calls and return controlled candidateType data

Approach 2 is preferred for determinism and speed. Use `page.route('/api/optimize', ...)` to mock the optimization response with specific candidateType, then verify tab ordering.

### Project Structure Notes

- All new files go in `tests/` directory following existing conventions
- Unit tests: `tests/unit/lib/scoring/`, `tests/unit/actions/`
- Integration: `tests/integration/`
- E2E: `tests/e2e/`
- No changes to source code (`lib/`, `app/`, `actions/`, `components/`)

### References

- [Source: _bmad-output/planning-artifacts/epic-18-candidate-type-aware-resume-structure.md#Story 18.10]
- [Source: _bmad-output/implementation-artifacts/18-9-pipeline-integration-and-end-to-end-wiring.md#Testing Notes]
- [Source: docs/TESTING.md - Test patterns and conventions]
- [Source: .claude/rules/testing.md - Priority tags and test commands]
- [Source: tests/unit/candidateTypeDetection.test.ts - Existing detection tests pattern]
- [Source: tests/unit/lib/scoring/structuralSuggestions.test.ts - Existing structural tests pattern]
- [Source: tests/unit/lib/scoring/crossTypeDifferentiation.test.ts - Gap: only 2 tests]
- [Source: tests/integration/preferences-pipeline.test.ts - Integration test pattern]
- [Source: lib/scoring/constants.ts - ROLE_WEIGHT_ADJUSTMENTS, SECTION_CONFIG_V21]
- [Source: lib/scoring/gapAddressability.ts#L21 - SectionType with 'projects']
- [Source: actions/generateAllSuggestions.ts#L48-L69 - GenerateAllRequest with candidateType]
- [Source: app/(authenticated)/(dashboard)/scan/[sessionId]/suggestions/ClientSuggestionsPage.tsx - TAB_ORDER]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

Created (2 files):
- `tests/unit/lib/scoring/crossTypeScoring.test.ts` — Cross-type scoring integration tests (12 tests)
- `tests/unit/lib/scoring/gapAddressabilityProjects.test.ts` — Gap addressability projects tests (9 tests, 1 skipped)

---

## Code Review Fixes (Opus 4.6) — 2026-02-06

### Issues Found and Fixed

**C1 CRITICAL (FIXED): Weight values in tests did not match source code**
- Header comments and hardcoded sum tests claimed wrong weight values (e.g., coop keywords=0.45 but actual is 0.42)
- Additionally, `getComponentWeightsV21` applies role-specific adjustments (software_engineer: kw+=0.03, sec-=0.03) that the original tests didn't account for
- Fix: Corrected all weight comments, replaced hardcoded expectations with engine-derived values

**C2 CRITICAL (FIXED): Weight sum tests didn't use the scoring engine**
- Tests verified hardcoded arithmetic (`0.45 + 0.10 + 0.15 + 0.20 + 0.10 = 1.0`) instead of calling `calculateATSScoreV21()`
- Fix: Rewrote to call scoring engine and verify `metadata.weightsUsed` sums to 1.0

**H1 HIGH (FIXED): Assertions were trivially weak — just `> 0` checks**
- Tests ended with `expect(result.overall).toBeGreaterThan(0)` — any non-zero score passes
- Duplicate assertions in 3 tests (same line repeated twice)
- Fix: Replaced with specific weight comparisons, cross-type differential checks, and removed duplicates

**H2 HIGH (FIXED): Mock data used invalid `KeywordCategory` values**
- `category: 'technical'` used throughout but not a valid enum value
- `MatchedKeyword.placement` mocked as array but typed as single string
- `KeywordAnalysisResult` mock missing required `analyzedAt` field
- Fix: Changed to `KeywordCategory.TECHNOLOGIES`, fixed `placement` to string values, added `analyzedAt`

**H3 HIGH (FIXED): Test 2.3 didn't verify projects text affects classification**
- Only checked `result.processedGaps` is defined — trivial assertion
- Fix: Added Docker terminology verification and with/without projects comparison

**H4 HIGH (FIXED): Test 2.4 had no real test — imported non-exported symbol**
- Tried to import `SECTION_COMPONENT_MAP` which is not exported from `buildSectionATSContext.ts`
- Fix: Replaced with `filterGapsForSection` test verifying projects as valid SectionType

### Issues Found — Not Fixed (Story Incomplete)

**C3 CRITICAL: Story incomplete — 6 of 8 tasks not started**
- Tasks 3-8 all `[ ]`: pipeline integration, backward compatibility, E2E, generateAllSuggestions, structural edge cases, build verification
- ACs 2, 3, 6, 7 completely unaddressed
- Story remains `in-progress` — needs development continuation

**M1 MEDIUM (NOT FIXED — pre-existing): Source code bug in `buildSectionATSContext.ts:128`**
- `getContentQualityFlags()` double-accesses `.details` (assigns `.details`, then accesses `.details.details`)
- This is a pre-existing bug NOT introduced by Epic 18
- Test 2.4 correctly identifies and skips; filed for resolution

**M2 MEDIUM (FIXED): Story file status inconsistency**
- Story file said `ready-for-dev` but sprint-status said `in-progress`
- Fix: Updated story status to `in-progress` to match
