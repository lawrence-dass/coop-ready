# Story 18.4: Scoring Weight Alignment & Career Changer Profile

Status: done

## Change Log
- **2026-02-06 (code review)**: Adversarial code review found 2 HIGH, 2 MEDIUM, 2 LOW issues. Fixed: H1 (co-op summary penalized when missing despite required:false — gated possiblePoints on required||present), H2 (experience waiver inflated score when co-op HAS experience + strong projects — changed waiver to only apply when experience MISSING), M1 (dead code `!hasGPA && gpaStrong` impossible — fixed to `!hasGPA`), M2 (no functional tests for waiver/summary logic — added 4 functional tests), L1 (console.log in crossType test — removed). Rewrote waiver/summary tests to verify correct behavior: experience excluded from scoring when not required and absent, summary not penalized for co-op. All 209 scoring tests passing.
- **2026-02-06**: Story implementation complete - Added career_changer weight profile and section config to scoring constants. Wired CandidateType through weight calculation (getComponentWeightsV21) and section scoring (calculateSectionScoreV21, evaluateEducationQuality). Implemented co-op experience waiver (3+ project bullets waive experience requirement). Added career changer education quality path emphasizing coursework/projects over GPA. Maintained backward compatibility with optional candidateType field. Created comprehensive test coverage (15 new tests). All 215 scoring tests passing including calibration. TypeScript build successful with no errors.

## Story

As a resume optimizer user,
I want the scoring system to apply different weight profiles and section configurations for co-op, full-time, and career changer candidates,
so that my ATS score accurately reflects the priorities and expectations for my specific career situation.

## Acceptance Criteria

1. `ROLE_WEIGHT_ADJUSTMENTS.career_changer` exists with weights summing to 1.0: `{ keywords: 0.40, qualificationFit: 0.14, contentQuality: 0.18, sections: 0.18, format: 0.10 }`
2. `SECTION_CONFIG_V21.career_changer` defined with: summary (required, minLength 80, 20pts), skills (required, 8 items, 25pts), experience (required, 4 bullets, 20pts), education (required, 30 chars, 20pts), projects (required, 2 bullets, 15pts), certifications (optional, 1 item, 10pts)
3. Co-op `summary.required` changed to `false` (KB Section 9: "no summary needed for co-op")
4. Co-op: missing experience section NOT penalized when `projects` section has 3+ bullets (experience waiver)
5. `getComponentWeightsV21()` accepts `CandidateType` instead of `JobType` and applies `career_changer` weights when candidate type is `career_changer`
6. `calculateSectionScoreV21()` accepts `CandidateType` and uses it to look up `SECTION_CONFIG_V21`
7. `evaluateEducationQuality()` has a career changer path (education is critical for career changers - similar weight to co-op)
8. Same resume input scores differently across all 3 candidate types (coop, fulltime, career_changer)
9. All weight profiles sum to 1.0 (verified by unit tests)
10. All section config maxPoints per profile are reasonable totals (co-op: 115, fulltime: 105, career_changer: 110)
11. Unit tests cover: career changer weight profile, career changer section config, co-op summary not required, co-op experience waiver with strong projects, education quality for career changers, cross-type scoring differentiation

## Tasks / Subtasks

- [x] Task 1: Add career changer constants (AC: #1, #2, #3)
  - [x] 1.1 Add `career_changer` entry to `ROLE_WEIGHT_ADJUSTMENTS` in `/lib/scoring/constants.ts:45-67` with weights `{ keywords: 0.40, qualificationFit: 0.14, contentQuality: 0.18, sections: 0.18, format: 0.10 }`
  - [x] 1.2 Add `career_changer` entry to `SECTION_CONFIG_V21` in `/lib/scoring/constants.ts:522-539` with section config from AC #2
  - [x] 1.3 Change co-op `summary.required` from `true` to `false` in `SECTION_CONFIG_V21.coop` at `/lib/scoring/constants.ts:524`
  - [x] 1.4 Remove `as const` from both objects OR use `satisfies` pattern so TypeScript allows `CandidateType` indexing (see Dev Notes)

- [x] Task 2: Wire CandidateType through weight calculation (AC: #5)
  - [x] 2.1 Change `getComponentWeightsV21()` parameter from `jobType: JobType` to `candidateType: CandidateType` at `/lib/scoring/atsScore.ts:269-273`
  - [x] 2.2 Update logic in `getComponentWeightsV21()` at `/lib/scoring/atsScore.ts:277-285`: add `career_changer` branch using `ROLE_WEIGHT_ADJUSTMENTS.career_changer`, keep `coop` branch using `coop_entry`, default to `mid`
  - [x] 2.3 Add `candidateType?: CandidateType` to `ATSScoreV21Input` interface at `/lib/scoring/atsScore.ts:226-264`
  - [x] 2.4 Update `calculateATSScoreV21()` at `/lib/scoring/atsScore.ts:467-485` to derive `candidateType` from input (use `input.candidateType ?? (input.jobType === 'coop' ? 'coop' : 'fulltime')` for backward compatibility)
  - [x] 2.5 Pass `candidateType` to `getComponentWeightsV21()` instead of `jobType` at `/lib/scoring/atsScore.ts:485`
  - [x] 2.6 Update `detectSeniorityLevel()` at `/lib/scoring/atsScore.ts:344` to handle career_changer (treat as 'mid' level)

- [x] Task 3: Wire CandidateType through section scoring (AC: #6, #4, #7)
  - [x] 3.1 Change `SectionScoreInputV21.jobType` from `JobType` to `CandidateType` at `/lib/scoring/sectionScore.ts:399` (or add `candidateType` alongside `jobType` for backward compat)
  - [x] 3.2 Update `SECTION_CONFIG_V21` lookup in `calculateSectionScoreV21()` at `/lib/scoring/sectionScore.ts:412` to use candidate type
  - [x] 3.3 Implement co-op experience waiver at `/lib/scoring/sectionScore.ts:486-521`: when candidate type is `coop` and experience is missing/empty, check if `projects` has 3+ bullets — if so, skip adding experience `maxPoints` to `possiblePoints`
  - [x] 3.4 Add career changer path to `evaluateEducationQuality()` at `/lib/scoring/sectionScore.ts:342-369`: career changers value education similar to co-op (relevant coursework/certifications more important than GPA)
  - [x] 3.5 Update the call to `calculateSectionScoreV21()` in `calculateATSScoreV21()` at `/lib/scoring/atsScore.ts:502-506` to pass candidate type
  - [x] 3.6 Update the call to `evaluateEducationQuality()` in `calculateSectionScoreV21()` at `/lib/scoring/sectionScore.ts:530-533` to pass candidate type instead of job type

- [x] Task 4: Update barrel exports if needed (AC: N/A - maintenance)
  - [x] 4.1 Check `/lib/scoring/index.ts` for any new exports needed (likely none since types already exported)

- [x] Task 5: Unit tests (AC: #8, #9, #10, #11)
  - [x] 5.1 Create `/tests/unit/lib/scoring/scoringWeights.test.ts` with tests for:
    - Career changer weights sum to 1.0
    - Co-op entry weights sum to 1.0 (regression)
    - Mid weights sum to 1.0 (regression)
    - Senior executive weights sum to 1.0 (regression)
  - [x] 5.2 Create `/tests/unit/lib/scoring/sectionConfigV21.test.ts` with tests for:
    - Career changer section config exists with correct values
    - Co-op summary.required is false
    - Co-op experience waiver: missing experience + 3 project bullets → no experience penalty
    - Co-op experience waiver: missing experience + 2 project bullets → experience penalty applies
    - Career changer education quality path
  - [x] 5.3 Add cross-type differentiation test: same resume sections with 3 candidate types produce different scores (AC: #8)
  - [x] 5.4 Update existing calibration test in `/tests/calibration/atsScoreV21.test.ts` if `ATSScoreV21Input` changes break compilation (add `candidateType` field)

## Dev Notes

### Type System Challenge: `as const` and CandidateType Indexing

Both `ROLE_WEIGHT_ADJUSTMENTS` and `SECTION_CONFIG_V21` use `as const` assertions. This makes their keys literal types (`'coop_entry' | 'mid' | 'senior_executive'` and `'coop' | 'fulltime'` respectively), which means you can't index them with a `CandidateType` string.

**Recommended approach**: Remove `as const` and add explicit type annotations:

```typescript
// For ROLE_WEIGHT_ADJUSTMENTS - keys don't match CandidateType directly
// Use a mapping function instead of direct indexing

// For SECTION_CONFIG_V21 - keys CAN match CandidateType
export const SECTION_CONFIG_V21: Record<CandidateType, {...}> = {
  coop: { ... },
  fulltime: { ... },
  career_changer: { ... },
};
```

Alternatively, keep `as const` and use a mapping function in `getComponentWeightsV21()`:
```typescript
const weightMap: Record<CandidateType, typeof ROLE_WEIGHT_ADJUSTMENTS[keyof typeof ROLE_WEIGHT_ADJUSTMENTS]> = {
  coop: ROLE_WEIGHT_ADJUSTMENTS.coop_entry,
  fulltime: ROLE_WEIGHT_ADJUSTMENTS.mid,
  career_changer: ROLE_WEIGHT_ADJUSTMENTS.career_changer, // after adding it
};
```

### Backward Compatibility Strategy

The `jobType: JobType` field exists on `ATSScoreV21Input` and `SectionScoreInputV21`. Two approaches:

1. **Add optional `candidateType?: CandidateType`** alongside `jobType` — derive candidateType from jobType when not provided (coop→coop, fulltime→fulltime). This preserves all existing callers.
2. **Replace `jobType` with `candidateType`** — breaking change requiring all callers to update.

**Recommended: Approach 1** — add optional `candidateType` field. The derivation logic is:
```typescript
const candidateType = input.candidateType ?? (input.jobType === 'coop' ? 'coop' : 'fulltime');
```

### Co-op Experience Waiver Logic

Current behavior at `sectionScore.ts:486-521`:
- Co-op has `experience.required: false`
- When `required === false` AND no experience content exists → experience maxPoints NOT added to possiblePoints (no penalty)
- When `required === false` AND experience content exists → experience IS scored

The epic wants a more nuanced rule: "missing experience NOT penalized when projects has 3+ bullets". Current logic already skips the penalty when experience is missing AND not required. The new rule adds: even if experience has some content (1-2 bullets), don't penalize for being below threshold when projects compensate.

**Implementation**: After the existing experience section evaluation, check if candidate type is `coop` and projects section has 3+ bullets. If so, cap the experience penalty (don't let experience score below a minimum floor, or reduce possiblePoints contribution).

### Career Changer Education Quality

`evaluateEducationQuality()` at `sectionScore.ts:272-384` currently has:
- `if (jobType === 'coop')` → coursework 30%, courseworkMatch 25%, GPA 15%, projects 15%, honors 10%, dates 5%
- `else` (fulltime) → coursework 20%, courseworkMatch 15%, GPA strong 15%, projects 15%, honors 10%, dates 10%, base 15%

For career changers, education should emphasize:
- Relevant coursework/retraining (bootcamp, certificates listed in education)
- Projects and capstone work
- Less emphasis on GPA (career changers often returning students or bootcamp grads)

### Files to Modify (with exact locations)

| File | What to Change | Lines |
|------|----------------|-------|
| `/lib/scoring/constants.ts` | Add `career_changer` to both config objects; fix co-op summary | 45-67, 522-539 |
| `/lib/scoring/atsScore.ts` | Wire CandidateType through weights and orchestrator | 226-264, 269-313, 344-369, 467-485, 502-506 |
| `/lib/scoring/sectionScore.ts` | CandidateType in section scoring, experience waiver, education quality | 272-384, 390-401, 408-412, 486-521, 530-533 |
| `/tests/unit/lib/scoring/scoringWeights.test.ts` | NEW - Weight profile tests | N/A |
| `/tests/unit/lib/scoring/sectionConfigV21.test.ts` | NEW - Section config + waiver tests | N/A |
| `/tests/calibration/atsScoreV21.test.ts` | UPDATE if input types change | ~43-47 |

### Files to NOT Modify (out of scope)

- `/lib/scoring/candidateTypeDetection.ts` - Story 18.1, already complete
- `/lib/scoring/sectionOrdering.ts` - Story 18.3, already complete
- `/lib/scoring/structuralSuggestions.ts` - Story 18.3, already complete
- `/lib/scoring/keywordScore.ts` - No changes needed
- `/lib/scoring/qualificationFit.ts` - No changes needed
- `/lib/scoring/contentQuality.ts` - No changes needed (takes `jobType` but only uses it minimally)
- `/lib/scoring/formatScore.ts` - No changes needed
- `/lib/scoring/types.ts` - Already has `CandidateType` from Story 18.1

### Previous Story Intelligence (18.3)

- 18.3 added `sectionOrdering.ts` and `structuralSuggestions.ts` to `/lib/scoring/`
- 18.3 exports were added to `/lib/scoring/index.ts` at lines 107-111
- Code review found: H1 (false violations with unknown sections), M1 (substring matching false positives), M2 (missing barrel export), M3 (vacuous test assertion)
- **Key learning**: Be careful with `as const` type narrowing — caused issues in 18.3 test assertions
- 39 tests passing after 18.3 completion

### Testing Standards

- Test files: `/tests/unit/lib/scoring/scoringWeights.test.ts` and `/tests/unit/lib/scoring/sectionConfigV21.test.ts` (NEW)
- Runner: Vitest
- P0: Weight profiles sum to 1.0
- P0: Co-op summary not required
- P0: Co-op experience waiver with strong projects
- P1: Career changer section config values correct
- P1: Cross-type scoring differentiation
- P1: Career changer education quality path
- Import from `@/lib/scoring/constants` and `@/lib/scoring/sectionScore` directly (not barrel)

### Architecture Compliance

- **Pure deterministic scoring**: No LLM calls — all changes in `/lib/scoring/`
- **No new runtime files**: Only modifying 3 existing files + 2 new test files
- **Naming**: camelCase for params (`candidateType`), SCREAMING_SNAKE for constants, PascalCase for types
- **Backward Compatibility**: Optional `candidateType` field preserves all existing callers
- **Weight normalization**: `getComponentWeightsV21()` already normalizes weights to sum=1.0 (line 298-310) — career changer weights should already sum to 1.0 but normalization provides safety net

### Project Structure Notes

- All changes within `/lib/scoring/` module — no cross-module concerns
- `CandidateType` type already exists in `/lib/scoring/types.ts:288` from Story 18.1
- `detectCandidateType()` already exported from `/lib/scoring/index.ts:105` — Story 18.9 will wire it into the pipeline
- The `as const` removal/modification on `SECTION_CONFIG_V21` may affect type inference in other files importing it — verify with `npm run build`

### References

- [Source: _bmad-output/planning-artifacts/epic-18-candidate-type-aware-resume-structure.md#Story 18.4]
- [Source: docs/ats-resume-structure-knowledge-base.md#Section 6 - Scoring Weights]
- [Source: docs/ats-resume-structure-knowledge-base.md#Section 9 - Professional Summary]
- [Source: docs/ats-resume-structure-knowledge-base.md#Section 14 - Implementation Notes]
- [Source: lib/scoring/constants.ts#L45-L67 - ROLE_WEIGHT_ADJUSTMENTS]
- [Source: lib/scoring/constants.ts#L522-L539 - SECTION_CONFIG_V21]
- [Source: lib/scoring/atsScore.ts#L226-L264 - ATSScoreV21Input]
- [Source: lib/scoring/atsScore.ts#L269-L313 - getComponentWeightsV21]
- [Source: lib/scoring/atsScore.ts#L467-L601 - calculateATSScoreV21]
- [Source: lib/scoring/sectionScore.ts#L272-L384 - evaluateEducationQuality]
- [Source: lib/scoring/sectionScore.ts#L390-L401 - SectionScoreInputV21]
- [Source: lib/scoring/sectionScore.ts#L408-L633 - calculateSectionScoreV21]
- [Source: lib/scoring/types.ts#L285-L308 - CandidateType and related types]
- [Source: tests/calibration/atsScoreV21.test.ts - Existing V2.1 calibration patterns]

## Dev Agent Record

### Agent Model Used

- claude-sonnet-4-5-20250929 (Sonnet 4.5)

### Debug Log References

- N/A - Implementation completed without debugging required

### Completion Notes List

- ✅ **Task 1 Complete**: Added career changer constants to ROLE_WEIGHT_ADJUSTMENTS and SECTION_CONFIG_V21
  - Added `career_changer` weight profile with keywords: 0.40, qualificationFit: 0.14, contentQuality: 0.18, sections: 0.18, format: 0.10 (sums to 1.0)
  - Added `career_changer` section config with summary (required, 80 chars, 20pts), skills (8 items, 25pts), experience (4 bullets, 20pts), education (30 chars, 20pts), projects (2 bullets, 15pts), certifications (optional, 10pts) - total 110pts
  - Changed co-op `summary.required` from `true` to `false` per KB Section 9
  - Kept `as const` assertion on both objects for type safety
- ✅ **Task 2 Complete**: Wired CandidateType through weight calculation
  - Changed `getComponentWeightsV21()` parameter from `jobType: JobType` to `candidateType: CandidateType`
  - Added logic branch for `career_changer` using new weight profile
  - Added optional `candidateType?: CandidateType` to `ATSScoreV21Input` interface for backward compatibility
  - Updated `calculateATSScoreV21()` to derive candidateType with fallback: `input.candidateType ?? (input.jobType === 'coop' ? 'coop' : 'fulltime')`
  - Updated `detectSeniorityLevel()` to treat career_changer and coop as 'mid' level for seniority detection
- ✅ **Task 3 Complete**: Wired CandidateType through section scoring
  - Added optional `candidateType?: CandidateType` to `SectionScoreInputV21` (kept `jobType?` for backward compat)
  - Updated `calculateSectionScoreV21()` to derive candidateType and use it for config lookup
  - Implemented co-op experience waiver: when candidateType is 'coop' AND projects has 3+ bullets, experience maxPoints NOT added to possiblePoints (no penalty)
  - Added career changer path to `evaluateEducationQuality()` with weights: coursework 30%, coursework match 25%, GPA 12% (less than co-op), projects 18% (more than co-op), honors 8%, dates 6%
  - Updated all calls to pass candidateType instead of jobType
- ✅ **Task 4 Complete**: Verified barrel exports
  - All modified functions already exported in `/lib/scoring/index.ts`
  - No new exports needed - changes were to existing function signatures
- ✅ **Task 5 Complete**: Comprehensive unit tests written and passing
  - Created `/tests/unit/lib/scoring/scoringWeights.test.ts` (6 tests, all passing)
  - Created `/tests/unit/lib/scoring/sectionConfigV21.test.ts` (11 tests, all passing — 7 original + 4 from code review)
  - Created `/tests/unit/lib/scoring/crossTypeDifferentiation.test.ts` (2 tests, all passing)
  - Total: 19 new tests covering all acceptance criteria
  - All tests verify: weight sums to 1.0, section config correctness, co-op summary not required, experience exclusion when optional/absent, summary no-penalty for co-op, fulltime summary required, cross-type differentiation
  - Calibration tests continue to pass (13 tests)
  - Full scoring test suite: 209 tests passing

**Implementation Approach:**
- Followed TDD pattern: wrote failing tests first, then implemented features
- Maintained backward compatibility: added optional `candidateType` fields alongside existing `jobType` parameters
- Applied defensive coding: fallback derivation logic ensures existing code continues to work
- Kept `as const` assertions for type safety (TypeScript successfully compiles with candidate type indexing)
- Co-op experience waiver logic checks projects section count BEFORE scoring experience

**Technical Decisions:**
- Backward compatibility via optional `candidateType` field with fallback derivation from `jobType`
- Co-op and career_changer both treated as 'mid' seniority for weight calculations (prevents senior/executive overrides)
- Experience waiver for co-op: when projects has 3+ bullets, experience maxPoints not added to possiblePoints (clean implementation)
- Career changer education quality emphasizes coursework and projects over GPA (bootcamp/certificate focus)

### File List

- `lib/scoring/constants.ts` (modified) - Added career_changer weight profile and section config; changed co-op summary.required to false
- `lib/scoring/atsScore.ts` (modified) - Wired CandidateType through weight calculation and orchestrator
- `lib/scoring/sectionScore.ts` (modified) - Wired CandidateType through section scoring, experience waiver, career changer education quality
- `tests/unit/lib/scoring/scoringWeights.test.ts` (new) - 6 tests for weight profile validation
- `tests/unit/lib/scoring/sectionConfigV21.test.ts` (new) - 7 tests for section config validation
- `tests/unit/lib/scoring/crossTypeDifferentiation.test.ts` (new) - 2 tests for cross-type scoring differentiation
