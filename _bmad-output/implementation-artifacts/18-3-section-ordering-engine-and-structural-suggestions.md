# Story 18.3: Section Ordering Engine & Structural Suggestions

Status: done

## Change Log
- **2026-02-06**: Code review #2 (Opus 4.6) - Fixed 1 HIGH and 3 MEDIUM issues. H1: Rule 4 false positive when heading already "Project Experience" (now checks rawResumeText). M1: Rule 2 misleading when sectionOrder incomplete (added sectionOrder.includes guard). M2: Rule 8 missed headers with trailing punctuation (regex updated to allow `:/-` suffixes). M3: Misleading test name for co-op "empty array" that expected 1 suggestion. Added 3 new tests: Rule 4 suppression, Rule 8 punctuation, Rule 2 incomplete sectionOrder. 42 tests passing.
- **2026-02-06**: Code review #1 - Fixed 1 HIGH and 3 MEDIUM issues. H1: validateSectionOrder false violations with unknown sections (absolute vs relative position bug). M1: Rule 8 false positives from substring matching (switched to line-boundary regex). M2: SectionOrderViolation missing from barrel exports. M3: Vacuous test assertion for unknown sections. Added false-positive regression test for Rule 8. 39 tests passing.
- **2026-02-06**: Story implementation complete - Created section ordering validation engine with RECOMMENDED_ORDER constant for all 3 candidate types. Implemented structural suggestions engine with all 8 deterministic rules (no LLM). Added comprehensive test coverage (38 tests passing). All acceptance criteria satisfied. TypeScript build successful with no errors.

## Story

As a resume optimizer user,
I want the system to validate my resume's section ordering against the recommended structure for my candidate type and generate actionable structural suggestions,
so that my resume follows evidence-based section ordering that maximizes ATS visibility and recruiter attention.

## Acceptance Criteria

1. `RECOMMENDED_ORDER` constant defined with section ordering arrays for all 3 candidate types (`coop`, `fulltime`, `career_changer`)
2. `validateSectionOrder()` accepts a parsed resume's present sections and a `CandidateType`, returns ordering violations with details
3. `generateStructuralSuggestions()` returns an array of `StructuralSuggestion` objects based on 8+ deterministic rules
4. All 8 structural rules from epic spec are implemented (see Rules table below)
5. `StructuralSuggestion` type defined in `/types/suggestions.ts` with `id`, `priority`, `category`, `message`, `currentState`, `recommendedAction`
6. Functions are fully deterministic (no LLM, no network, no database calls)
7. New functions and types exported from `/lib/scoring/index.ts` barrel
8. Unit tests cover all rules across all 3 candidate types with edge cases
9. Empty/missing sections handled gracefully (no crashes on partial resumes)
10. `SectionOrderValidation` result type includes: `isCorrectOrder: boolean`, `violations: SectionOrderViolation[]`, `recommendedOrder: string[]`

## Tasks / Subtasks

- [x] Task 1: Add type definitions (AC: #5, #10)
  - [x] 1.1 Add `StructuralSuggestion` interface to `/types/suggestions.ts` after existing Education types (~line 322)
  - [x] 1.2 Add `StructuralSuggestionPriority` type: `'critical' | 'high' | 'moderate'`
  - [x] 1.3 Add `StructuralSuggestionCategory` type: `'section_order' | 'section_heading' | 'section_presence'`
  - [x] 1.4 Add `SectionOrderViolation` interface to `/lib/scoring/sectionOrdering.ts` (local to module)
  - [x] 1.5 Add `SectionOrderValidation` result interface to `/lib/scoring/sectionOrdering.ts`

- [x] Task 2: Implement section ordering engine (AC: #1, #2, #9)
  - [x] 2.1 Create `/lib/scoring/sectionOrdering.ts` with `RECOMMENDED_ORDER` constant
  - [x] 2.2 Implement `validateSectionOrder(presentSections: string[], candidateType: CandidateType): SectionOrderValidation`
  - [x] 2.3 Handle edge cases: empty sections array, single section, all sections present, no sections present
  - [x] 2.4 Validation compares actual order against recommended order for detected candidate type

- [x] Task 3: Implement structural suggestions engine (AC: #3, #4, #6, #9)
  - [x] 3.1 Create `/lib/scoring/structuralSuggestions.ts`
  - [x] 3.2 Implement `generateStructuralSuggestions(input: StructuralSuggestionInput): StructuralSuggestion[]`
  - [x] 3.3 Implement Rule 1: Co-op with Experience before Education → high priority reorder suggestion
  - [x] 3.4 Implement Rule 2: Co-op with no Skills at top → critical priority presence suggestion
  - [x] 3.5 Implement Rule 3: Co-op with generic summary present → high priority removal suggestion
  - [x] 3.6 Implement Rule 4: "Projects" heading → rename to "Project Experience" → moderate priority heading suggestion
  - [x] 3.7 Implement Rule 5: Full-time with Education before Experience → high priority reorder suggestion
  - [x] 3.8 Implement Rule 6: Career changer without summary → critical priority presence suggestion
  - [x] 3.9 Implement Rule 7: Career changer with Education below Experience → high priority reorder suggestion
  - [x] 3.10 Implement Rule 8: Non-standard section headers detected → moderate priority heading suggestion
  - [x] 3.11 Generate unique `id` for each suggestion (e.g., `"rule-coop-exp-before-edu"`)

- [x] Task 4: Update barrel exports (AC: #7)
  - [x] 4.1 Add exports to `/lib/scoring/index.ts`: `validateSectionOrder`, `generateStructuralSuggestions`, `RECOMMENDED_ORDER`
  - [x] 4.2 Add type exports: `SectionOrderValidation`
  - [x] 4.3 Export `StructuralSuggestion` type from `/types/suggestions.ts` (already exported by default since it's in a .ts file)

- [x] Task 5: Write unit tests (AC: #8)
  - [x] 5.1 Create `/tests/unit/lib/scoring/sectionOrdering.test.ts`
  - [x] 5.2 Create `/tests/unit/lib/scoring/structuralSuggestions.test.ts`
  - [x] 5.3 Test `RECOMMENDED_ORDER` has all 3 candidate types with correct section arrays
  - [x] 5.4 Test `validateSectionOrder()` detects out-of-order sections for coop
  - [x] 5.5 Test `validateSectionOrder()` detects out-of-order sections for fulltime
  - [x] 5.6 Test `validateSectionOrder()` detects out-of-order sections for career_changer
  - [x] 5.7 Test `validateSectionOrder()` returns `isCorrectOrder: true` when order matches recommendation
  - [x] 5.8 Test edge case: empty sections array
  - [x] 5.9 Test edge case: single section present
  - [x] 5.10 Test edge case: only some sections present (partial resume)
  - [x] 5.11 [P0] Test Rule 1: Co-op with exp before edu → reorder suggestion
  - [x] 5.12 [P0] Test Rule 2: Co-op missing skills → critical suggestion
  - [x] 5.13 Test Rule 3: Co-op with summary → removal suggestion
  - [x] 5.14 Test Rule 4: "Projects" heading → rename suggestion
  - [x] 5.15 [P0] Test Rule 5: Full-time with edu before exp → reorder suggestion
  - [x] 5.16 [P0] Test Rule 6: Career changer without summary → critical suggestion
  - [x] 5.17 Test Rule 7: Career changer edu below exp → reorder suggestion
  - [x] 5.18 Test Rule 8: Non-standard headers → heading suggestion
  - [x] 5.19 Test no suggestions generated for correctly ordered resume per candidate type
  - [x] 5.20 Test suggestion IDs are unique within a result set

## Dev Notes

### RECOMMENDED_ORDER Definition

From the knowledge base document (Sections 3-4), the recommended section orders are:

```typescript
import type { CandidateType } from '@/lib/scoring/types';

/**
 * Recommended section ordering per candidate type.
 * Based on KB Sections 3, 4, and the Career Changer Hybrid Structure.
 * Note: 'header' is NOT included - it's always first and not a parsed section.
 */
export const RECOMMENDED_ORDER: Record<CandidateType, string[]> = {
  coop: ['skills', 'education', 'projects', 'experience', 'certifications'],
  fulltime: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
  career_changer: ['summary', 'skills', 'education', 'projects', 'experience', 'certifications'],
};
```

Key differences:
- **Co-op**: Skills first (no summary!), Education before Projects, Experience last
- **Full-time**: Summary first, Experience before Projects/Education
- **Career changer**: Summary first, Education elevated above Experience (degree is the pivot credential)

### Structural Rules Implementation

| # | Rule | Candidate Type | Priority | Category | Detection Logic |
|---|------|---------------|----------|----------|-----------------|
| 1 | Experience before Education | coop | high | section_order | `indexOf('experience') < indexOf('education')` in present sections |
| 2 | No Skills at top | coop | critical | section_presence | `skills` missing OR not first in present sections |
| 3 | Generic summary present | coop | high | section_presence | `summary` section is non-null (co-ops should remove it) |
| 4 | "Projects" heading → "Project Experience" | coop | moderate | section_heading | `projects` section exists AND candidate is coop |
| 5 | Education before Experience | fulltime | high | section_order | `indexOf('education') < indexOf('experience')` in present sections |
| 6 | Missing summary | career_changer | critical | section_presence | `summary` is null/missing |
| 7 | Education below Experience | career_changer | high | section_order | `indexOf('education') > indexOf('experience')` |
| 8 | Non-standard section headers | all | moderate | section_heading | Pass-through - needs raw text header detection |

**Rule 8 Implementation Note**: Non-standard header detection requires the raw resume text (not just parsed sections). The function should accept an optional `rawResumeText` parameter and check for known unsafe headers from KB Section 2's table (e.g., "My Journey", "Track Record", "What I Know", "Things I've Built"). If raw text is not provided, skip this rule gracefully.

**Rule 3 (Co-op Summary) Implementation Note**: The epic says "generic summary present." For simplicity in 18.3, detect ANY summary present for co-op candidates as a suggestion trigger. The knowledge base says co-ops should NOT have a summary. The suggestion message should say "Consider removing the summary to save space; co-op/internship resumes benefit from leading with Skills." Story 18.6 handles the more nuanced keyword-rich summary detection.

### Input Type for Structural Suggestions

```typescript
export interface StructuralSuggestionInput {
  /** Candidate type from detection */
  candidateType: CandidateType;
  /** Parsed resume sections (null = not present) */
  parsedResume: {
    summary?: string | null;
    skills?: string | null;
    experience?: string | null;
    education?: string | null;
    projects?: string | null;
    certifications?: string | null;
  };
  /** Order of sections as they appear in the resume (derived from parsing) */
  sectionOrder: string[];
  /** Raw resume text for header detection (optional) */
  rawResumeText?: string;
}
```

**sectionOrder derivation**: The `sectionOrder` array represents the order in which sections appear in the actual resume. This is NOT currently tracked by the parser (Story 18.2 only extracts content, not order). For 18.3, the function should work with whatever order information is passed to it. Story 18.9 (pipeline integration) will wire up the actual section order detection. For now, if `sectionOrder` is empty, derive it from which `parsedResume` fields are non-null (though order won't be meaningful in that case - skip ordering rules and only apply presence/heading rules).

### StructuralSuggestion Type

Add to `/types/suggestions.ts` after the `EducationSuggestion` interface (~line 322):

```typescript
// ============================================================================
// STRUCTURAL SUGGESTION TYPES (Story 18.3)
// ============================================================================

/**
 * Structural suggestion for resume section ordering and organization.
 * Generated by deterministic rules engine (no LLM).
 */
export interface StructuralSuggestion {
  /** Unique rule identifier (e.g., "rule-coop-exp-before-edu") */
  id: string;
  /** Suggestion priority */
  priority: 'critical' | 'high' | 'moderate';
  /** Category of structural issue */
  category: 'section_order' | 'section_heading' | 'section_presence';
  /** Human-readable suggestion message */
  message: string;
  /** Description of current state (what's wrong) */
  currentState: string;
  /** What the user should do */
  recommendedAction: string;
}
```

### Files to Modify (with exact locations)

| File | What to Change | Lines |
|------|----------------|-------|
| `/types/suggestions.ts` | Add `StructuralSuggestion` interface | After line 321 (end of file) |
| `/lib/scoring/sectionOrdering.ts` | NEW - `RECOMMENDED_ORDER`, `validateSectionOrder()`, types | New file |
| `/lib/scoring/structuralSuggestions.ts` | NEW - `generateStructuralSuggestions()` with 8 rules | New file |
| `/lib/scoring/index.ts` | Add barrel exports for new functions, types, constants | After line 105 |
| `/tests/unit/lib/scoring/sectionOrdering.test.ts` | NEW - Section ordering validation tests | New file |
| `/tests/unit/lib/scoring/structuralSuggestions.test.ts` | NEW - Structural suggestion rule tests | New file |

### Files to NOT Modify (out of scope)

- `SuggestionSection.tsx` - discriminated union stays 3 sections (18.8 adds Projects rendering)
- `SuggestionFeedback.sectionType` - stays 4 values
- `SuggestionSet` in `types/optimization.ts` - stays 4 sections
- `gapAddressability.ts` `SectionType` - separate local 4-value type, unrelated to `ResumeSection`
- `SECTION_CONFIG_V21` in `constants.ts` - Story 18.4 adds `career_changer` weight profile
- `calculateSectionScoreV21()` in `sectionScore.ts` - Story 18.4 handles scoring changes
- `OptimizationSession` in `types/optimization.ts` - Story 18.7 adds `structuralSuggestions` field
- `store/useOptimizationStore.ts` - Story 18.7 adds store fields
- `actions/regenerateSuggestions.ts` - Switch/case stays with current sections

### Unsafe Section Headers (for Rule 8)

From KB Section 2, the following are non-standard headers that ATS parsers may fail to categorize:

```typescript
const UNSAFE_HEADERS: Record<string, string> = {
  'my journey': 'Professional Experience',
  'track record': 'Professional Experience',
  'career path': 'Professional Experience',
  'what i\'ve done': 'Professional Experience',
  'what i know': 'Technical Skills',
  'my toolkit': 'Technical Skills',
  'tech stack': 'Technical Skills',
  'learning': 'Education',
  'where i studied': 'Education',
  'things i\'ve built': 'Projects',
  'my work': 'Projects',
  'about me': 'Professional Summary',
  'who i am': 'Professional Summary',
};
```

### Backward Compatibility

- All new types are additive (new interfaces, no modifications to existing types)
- `StructuralSuggestion` is a new interface, doesn't affect existing suggestion types
- New functions are standalone exports, not modifying existing function signatures
- Test files are all new, no changes to existing tests
- Barrel export additions are purely additive

### Architecture Compliance

- **File Location**: `/lib/scoring/` is correct for deterministic classification logic (per CLAUDE.md directory map)
- **No LLM calls**: Both functions are fully deterministic - pure TypeScript logic
- **No database calls**: Functions receive all inputs as parameters
- **Export pattern**: Named exports (not default) matching codebase convention (see `index.ts`)
- **Naming**: camelCase for functions (`validateSectionOrder`), PascalCase for types (`StructuralSuggestion`), camelCase for files (`sectionOrdering.ts`)
- **ActionResponse Pattern**: NOT needed - these are pure utility functions, not server actions

### Testing Standards

- Test files: `/tests/unit/lib/scoring/sectionOrdering.test.ts` and `/tests/unit/lib/scoring/structuralSuggestions.test.ts`
- Runner: Vitest (`import { describe, it, expect } from 'vitest'`)
- P0 tests: Rules 1, 2, 5, 6 (critical ordering violations for each candidate type)
- P1 tests: Rules 3, 4, 7, 8 (heading and presence suggestions)
- Import pattern: `import { validateSectionOrder, RECOMMENDED_ORDER } from '@/lib/scoring/sectionOrdering'`
- Follow pattern from `tests/unit/candidateTypeDetection.test.ts` (18.1's tests - same pure function testing approach)

### Previous Story Intelligence (18.1 + 18.2)

**From 18.1 (Candidate Type Detection):**
- `CandidateType = 'coop' | 'fulltime' | 'career_changer'` at `/lib/scoring/types.ts:288`
- `detectCandidateType()` at `/lib/scoring/candidateTypeDetection.ts` - pure function pattern to follow
- Code review found missing barrel exports in 18.1 - FIXED. Verify new exports are added to `index.ts`
- `CandidateTypeInput` uses `JobType` reference (not inline union) - follow DRY pattern
- Negative input clamping was added after review - consider similar defensive coding for sectionOrder array
- 29 test cases with priority tags `[P0]` and `[P1]` - follow same tagging pattern

**From 18.2 (6-Section Parsing):**
- `Resume` interface now has `projects?: string` and `certifications?: string` at `/types/optimization.ts:26-52`
- `ResumeSection = 'summary' | 'skills' | 'experience' | 'education' | 'projects' | 'certifications'` at `/types/optimization.ts:280`
- `formatParsedSections()` exported from `hooks/useResumeExtraction.ts` - shared helper pattern
- Code review found DRY opportunity - led to shared `formatParsedSections()`. Apply similar DRY thinking here
- `SECTION_CONFIG_V21` already has 6 sections for `coop` and `fulltime` (no `career_changer` yet - that's 18.4)

### Project Structure Notes

- Two new files in `/lib/scoring/` following established patterns
- New test files in `/tests/unit/lib/scoring/` matching existing scoring test structure
- Type addition to `/types/suggestions.ts` extends existing suggestion type family
- Barrel export updates follow established pattern in `index.ts`
- No conflicts with ongoing parallel work (18.4, 18.5, 18.6 haven't started)

### References

- [Source: _bmad-output/planning-artifacts/epic-18-candidate-type-aware-resume-structure.md#Story 18.3]
- [Source: docs/ats-resume-structure-knowledge-base.md#Section 3 - Co-op Ordering]
- [Source: docs/ats-resume-structure-knowledge-base.md#Section 4 - Full-Time Ordering + Career Changer Hybrid]
- [Source: docs/ats-resume-structure-knowledge-base.md#Section 5 - Section-by-Section Rules]
- [Source: docs/ats-resume-structure-knowledge-base.md#Section 14 - Implementation Notes, Section Ordering Validation]
- [Source: lib/scoring/types.ts#L285-L308 - CandidateType, CandidateTypeInput, CandidateTypeResult]
- [Source: lib/scoring/candidateTypeDetection.ts - Pure function pattern to follow]
- [Source: lib/scoring/constants.ts#L522-L539 - SECTION_CONFIG_V21 with 6 sections]
- [Source: lib/scoring/index.ts - Barrel export pattern]
- [Source: types/optimization.ts#L280 - ResumeSection union with 6 values]
- [Source: types/suggestions.ts - Existing suggestion type family]
- [Source: tests/unit/candidateTypeDetection.test.ts - Test pattern to follow]

## Dev Agent Record

### Agent Model Used
- claude-sonnet-4-5-20250929 (Sonnet 4.5)

### Debug Log References
- N/A - Implementation completed without debugging required

### Completion Notes List
- ✅ **Task 1 Complete**: Added all type definitions
  - Added `StructuralSuggestion` interface to `/types/suggestions.ts` with all required fields (id, priority, category, message, currentState, recommendedAction)
  - Priority types inline in interface: `'critical' | 'high' | 'moderate'`
  - Category types inline in interface: `'section_order' | 'section_heading' | 'section_presence'`
  - Created `SectionOrderViolation` and `SectionOrderValidation` interfaces in new `/lib/scoring/sectionOrdering.ts` file
- ✅ **Task 2 Complete**: Implemented section ordering engine
  - Created `/lib/scoring/sectionOrdering.ts` with `RECOMMENDED_ORDER` constant for all 3 candidate types
  - Implemented `validateSectionOrder()` function with comprehensive edge case handling:
    - Empty sections array → vacuously true
    - Single section → no ordering violations possible
    - Partial resumes → filters to only validate present sections
    - Unknown/custom sections → skips validation gracefully
  - Validation compares actual order against recommended order for candidate type
- ✅ **Task 3 Complete**: Implemented structural suggestions engine with all 8 rules
  - Created `/lib/scoring/structuralSuggestions.ts` with `generateStructuralSuggestions()` main function
  - Implemented all 8 rules with correct priority, category, and messaging:
    - Rule 1: Co-op exp before edu → high priority reorder
    - Rule 2: Co-op no skills at top → critical priority presence
    - Rule 3: Co-op generic summary → high priority removal
    - Rule 4: "Projects" heading → moderate priority heading rename
    - Rule 5: Full-time edu before exp → high priority reorder
    - Rule 6: Career changer no summary → critical priority presence
    - Rule 7: Career changer edu below exp → high priority reorder
    - Rule 8: Non-standard headers → moderate priority heading (optional raw text detection)
  - All rules generate unique IDs (e.g., "rule-coop-exp-before-edu")
  - Functions are fully deterministic (no LLM, no network, no database)
- ✅ **Task 4 Complete**: Updated barrel exports
  - Added `validateSectionOrder`, `RECOMMENDED_ORDER`, `generateStructuralSuggestions` to `/lib/scoring/index.ts`
  - Added type exports: `SectionOrderValidation`, `StructuralSuggestionInput`
  - `StructuralSuggestion` automatically exported from `/types/suggestions.ts` (ES6 module)
- ✅ **Task 5 Complete**: Comprehensive unit tests written and passing
  - Created `/tests/unit/lib/scoring/sectionOrdering.test.ts` (17 tests, all passing)
  - Created `/tests/unit/lib/scoring/structuralSuggestions.test.ts` (21 tests, all passing)
  - Total: 38 tests covering all acceptance criteria
  - Tests cover all 8 rules across all 3 candidate types
  - Edge cases tested: empty array, single section, partial resumes, null/undefined sections
  - Priority tags: [P0] for critical tests, [P1] for important features

**Implementation Approach:**
- Followed TDD pattern: wrote tests alongside implementation
- Used pure functions (no side effects) for deterministic behavior
- Applied defensive coding: null checks, empty array handling, unknown section filtering
- Followed existing patterns from Story 18.1 (candidateTypeDetection.ts) for consistency
- Maintained backward compatibility: all new exports are additive

**Technical Decisions:**
- Made priority and category types inline in `StructuralSuggestion` interface (simpler than separate type aliases for 3-value unions)
- Rule 8 (non-standard headers) gracefully skips if `rawResumeText` not provided
- `validateSectionOrder()` filters RECOMMENDED_ORDER to only present sections before validation (handles partial resumes)
- Each rule function is independent and returns `null` if not triggered (clean separation of concerns)
- All rule IDs follow pattern `"rule-{candidateType}-{shortDescription}"` for uniqueness and readability

### File List
- `types/suggestions.ts` (modified) - Added StructuralSuggestion interface and inline type unions
- `lib/scoring/sectionOrdering.ts` (new) - Section ordering validation engine with RECOMMENDED_ORDER constant
- `lib/scoring/structuralSuggestions.ts` (new) - Structural suggestions engine with 8 deterministic rules
- `lib/scoring/index.ts` (modified) - Added barrel exports for new functions and types
- `tests/unit/lib/scoring/sectionOrdering.test.ts` (new) - 17 tests for section ordering validation
- `tests/unit/lib/scoring/structuralSuggestions.test.ts` (new) - 25 tests for structural suggestion rules (42 tests total, all passing)

### Code Review Record
- **Review #2**:
  - **Reviewer**: Adversarial Senior Dev Review (Claude Opus 4.6)
  - **Date**: 2026-02-06
  - **Issues Found**: 1 HIGH, 3 MEDIUM, 2 LOW (6 total)
  - **Issues Fixed**: 1 HIGH, 3 MEDIUM (4 fixed)
  - **Fixes Applied**:
    - H1: Fixed Rule 4 false positive when heading already "Project Experience" - now checks rawResumeText for existing correct heading before suggesting rename
    - M1: Fixed Rule 2 misleading when sectionOrder incomplete - added `sectionOrder.includes('skills')` guard to prevent false "not positioned first" messages
    - M2: Fixed Rule 8 missing headers with trailing punctuation - updated regex to `[:\s-]*$` to match "My Journey:", "What I Know -" etc.
    - M3: Fixed misleading test name ("should return empty array" but expected length 1)
    - Added 3 new tests: Rule 4 suppression with correct heading, Rule 8 punctuation detection, Rule 2 incomplete sectionOrder
  - **Not Fixed (LOW)**:
    - L1: Redundant function calls in edge case tests (carryover from review #1)
    - L2: No test for validateSectionOrder with ALL sections in wrong order (only specific pairs tested)
- **Review #1**:
  - **Reviewer**: Adversarial Senior Dev Review (Claude Opus 4.6)
  - **Date**: 2026-02-06
  - **Issues Found**: 1 HIGH, 3 MEDIUM, 1 LOW (5 total)
  - **Issues Fixed**: 1 HIGH, 3 MEDIUM, 0 LOW (4 fixed)
  - **Fixes Applied**:
    - H1: Fixed `validateSectionOrder` false violations with unknown sections - changed to filter presentSections to known sections only before comparing positions (relative ordering instead of absolute)
    - M1: Fixed Rule 8 false positives - changed `lowerText.includes()` to line-boundary regex to only match actual section headings, not body text
    - M2: Added `SectionOrderViolation` type export to barrel `lib/scoring/index.ts`
    - M3: Fixed vacuous test assertion to properly verify `isCorrectOrder: true` and no violations for unknown sections
    - Added new regression test: Rule 8 should NOT false-positive on inline header words in body text
  - **Not Fixed (LOW)**:
    - L1: Redundant function calls in edge case tests - minor code smell, tests still function correctly
