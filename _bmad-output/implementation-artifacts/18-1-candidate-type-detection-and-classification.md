# Story 18.1: Candidate Type Detection & Classification

Status: done

## Change Log
- **2026-02-05**: Story implementation complete - Added candidate type detection with 6-priority chain, comprehensive tests (25 test cases), and type definitions. All acceptance criteria satisfied.

## Story

As a resume optimizer user,
I want the system to detect whether I'm a co-op/intern candidate, full-time candidate, or career changer,
so that all scoring, suggestions, and UI adapt to my candidate profile for better ATS results.

## Acceptance Criteria

1. `CandidateType` union type `'coop' | 'fulltime' | 'career_changer'` is exported from `/lib/scoring/types.ts`
2. `CandidateType` is re-exported from `/types/preferences.ts` for convenient imports
3. `detectCandidateType()` function handles all 6 priority detection paths correctly
4. `switching-careers` career goal + `fulltime` job type = `career_changer`
5. User's explicit `coop` job type selection always takes priority over auto-detection
6. `CandidateTypeResult` includes `candidateType`, `confidence`, and `detectedFrom` fields
7. Unit tests cover all 6 detection paths with edge cases
8. Function is pure (no side effects, no network, no database calls)

## Tasks / Subtasks

- [x] Task 1: Add `CandidateType` type to scoring types (AC: #1, #2)
  - [x] 1.1 Add `CandidateType = 'coop' | 'fulltime' | 'career_changer'` to `/lib/scoring/types.ts` near existing `JobType` (line ~283)
  - [x] 1.2 Add `CandidateTypeInput` interface to `/lib/scoring/types.ts`
  - [x] 1.3 Add `CandidateTypeResult` interface to `/lib/scoring/types.ts`
  - [x] 1.4 Re-export `CandidateType`, `CandidateTypeInput`, `CandidateTypeResult` from `/types/preferences.ts`

- [x] Task 2: Implement `detectCandidateType()` (AC: #3, #4, #5, #6, #8)
  - [x] 2.1 Create `/lib/scoring/candidateTypeDetection.ts`
  - [x] 2.2 Implement 6-priority detection chain (see Dev Notes)
  - [x] 2.3 Return `CandidateTypeResult` with confidence score and detection source
  - [x] 2.4 Ensure function is pure - no imports from supabase, no API calls

- [x] Task 3: Write unit tests (AC: #7)
  - [x] 3.1 Create `tests/unit/candidateTypeDetection.test.ts`
  - [x] 3.2 Test Priority 1: `userJobType === 'coop'` → `coop` (confidence 1.0)
  - [x] 3.3 Test Priority 2: `fulltime` + `careerGoal === 'switching-careers'` → `career_changer` (confidence 0.95)
  - [x] 3.4 Test Priority 3: `fulltime` + active education + < 3 roles → `career_changer` (confidence 0.7)
  - [x] 3.5 Test Priority 4: auto-detect < 2 roles + active education → `coop` (confidence 0.8)
  - [x] 3.6 Test Priority 5: auto-detect 3+ roles + 3+ years → `fulltime` (confidence 0.85)
  - [x] 3.7 Test Priority 6: default fallback → `fulltime` (confidence 0.5)
  - [x] 3.8 Edge cases: all fields undefined, partial inputs, boundary values

## Dev Notes

### Detection Priority Chain

```
Priority 1: userJobType === 'coop'
  → return { candidateType: 'coop', confidence: 1.0, detectedFrom: 'user_selection' }

Priority 2: userJobType === 'fulltime' && careerGoal === 'switching-careers'
  → return { candidateType: 'career_changer', confidence: 0.95, detectedFrom: 'onboarding' }

Priority 3: userJobType === 'fulltime' && hasActiveEducation && resumeRoleCount < 3
  → return { candidateType: 'career_changer', confidence: 0.7, detectedFrom: 'resume_analysis' }

Priority 4: no userJobType && resumeRoleCount < 2 && hasActiveEducation
  → return { candidateType: 'coop', confidence: 0.8, detectedFrom: 'resume_analysis' }

Priority 5: no userJobType && resumeRoleCount >= 3 && totalExperienceYears >= 3
  → return { candidateType: 'fulltime', confidence: 0.85, detectedFrom: 'resume_analysis' }

Priority 6: default
  → return { candidateType: 'fulltime', confidence: 0.5, detectedFrom: 'default' }
```

### Type Definitions to Add

```typescript
// In /lib/scoring/types.ts near line 283 (after existing JobType)

export type CandidateType = 'coop' | 'fulltime' | 'career_changer';

export interface CandidateTypeInput {
  userJobType?: 'coop' | 'fulltime';      // From OptimizationPreferences.jobType
  careerGoal?: string;                      // From UserContext.careerGoal
  resumeRoleCount?: number;                 // Count of roles in experience section
  hasActiveEducation?: boolean;             // Expected graduation date in future
  totalExperienceYears?: number;            // Estimated total years of experience
}

export interface CandidateTypeResult {
  candidateType: CandidateType;
  confidence: number;                       // 0.0 - 1.0
  detectedFrom: 'user_selection' | 'onboarding' | 'resume_analysis' | 'default';
}
```

### Existing Types to Reference (DO NOT MODIFY THESE)

- `JobType = 'coop' | 'fulltime'` at `/lib/scoring/types.ts:283` - existing binary type, keep as-is
- `JobTypePreference = 'coop' | 'fulltime'` at `/types/preferences.ts:71` - UI preference type
- `CareerGoal` at `/types/preferences.ts:92` - includes `'switching-careers'` value
- `UserContext` at `/types/preferences.ts:106` - has `careerGoal` and `targetIndustries`

### Architecture Compliance

- **ActionResponse Pattern**: NOT needed here - this is a pure utility function, not a server action
- **File Location**: `/lib/scoring/` is correct for deterministic classification logic (per CLAUDE.md directory map)
- **Naming**: Function uses camelCase (`detectCandidateType`), type uses PascalCase (`CandidateType`), file uses camelCase (`candidateTypeDetection.ts`)
- **No LLM calls**: Detection is fully deterministic - belongs in `/lib/scoring/` not `/lib/ai/`
- **No database calls**: Function receives all inputs as parameters
- **Export pattern**: Named exports (not default) matching codebase convention

### Testing Standards

- Test file: `tests/unit/candidateTypeDetection.test.ts`
- Runner: Vitest (`import { describe, it, expect } from 'vitest'`)
- Tag P0 tests for critical paths: user selection priority, career changer detection
- Tag P1 tests for auto-detection paths
- Follow pattern from existing tests (e.g., `tests/unit/` directory)

### Project Structure Notes

- New file `/lib/scoring/candidateTypeDetection.ts` follows existing pattern of `/lib/scoring/` for deterministic logic
- No conflicts with existing `JobType` - `CandidateType` is a new, separate type
- `career_changer` uses snake_case in the union literal to match existing `CandidateType` convention and differentiate from display labels
- Re-export from `/types/preferences.ts` keeps import paths clean for consumers

### References

- [Source: _bmad-output/planning-artifacts/epic-18-candidate-type-aware-resume-structure.md#Story 18.1]
- [Source: docs/ats-resume-structure-knowledge-base.md#Section 14 - Implementation Notes]
- [Source: lib/scoring/types.ts#L283 - Existing JobType]
- [Source: types/preferences.ts#L71-L97 - JobTypePreference, CareerGoal, UserContext]
- [Source: lib/scoring/constants.ts#L45-L67 - ROLE_WEIGHT_ADJUSTMENTS with coop_entry, mid, senior_executive]

## Dev Agent Record

### Agent Model Used
- claude-sonnet-4-5-20250929 (Sonnet 4.5)

### Debug Log References
- N/A - Implementation completed without debugging required

### Completion Notes List
- ✅ **Task 1 Complete**: Added `CandidateType`, `CandidateTypeInput`, and `CandidateTypeResult` type definitions to `/lib/scoring/types.ts` at line 285-308
- ✅ **Task 1 Complete**: Re-exported all three types from `/types/preferences.ts` for convenient imports across the codebase
- ✅ **Task 2 Complete**: Implemented pure `detectCandidateType()` function in `/lib/scoring/candidateTypeDetection.ts` with 6-priority detection chain
- ✅ **Task 3 Complete**: Wrote comprehensive unit tests (25 test cases) covering all 6 priority paths, edge cases, and boundary conditions
- ✅ **All tests pass**: 25/25 tests passing in `candidateTypeDetection.test.ts`
- ✅ **Build successful**: TypeScript compilation passes with no errors
- ✅ **Architecture compliance**: Pure function (no side effects), follows project naming conventions, correctly placed in `/lib/scoring/`

**Implementation Approach:**
- Followed TDD red-green-refactor cycle: wrote failing tests first, implemented minimal code to pass, verified all tests pass
- Detection function uses early returns for each priority level, with confidence scores matching specification
- Function uses default parameter values to simplify logic and handle undefined inputs gracefully
- Priority chain correctly prioritizes explicit user selection (1.0 confidence) over heuristic detection (0.5-0.95 confidence)

**Technical Decisions:**
- Used union literal `'career_changer'` (snake_case) to match existing type naming patterns in codebase
- Confidence scores calibrated based on signal strength: user selection (1.0) > onboarding data (0.95) > resume analysis (0.7-0.85) > default (0.5)
- Detection source tracking enables future debugging and UI transparency about how classification was determined

### File List
- `lib/scoring/types.ts` (modified) - Added CandidateType, CandidateTypeInput, CandidateTypeResult type definitions; used JobType reference for DRY
- `types/preferences.ts` (modified) - Re-exported CandidateType types for convenient imports
- `lib/scoring/candidateTypeDetection.ts` (new) - Pure detection function with 7-priority chain (added explicit fulltime handler + negative input clamping)
- `lib/scoring/index.ts` (modified) - Added barrel exports for detectCandidateType and CandidateType types
- `tests/unit/candidateTypeDetection.test.ts` (new) - Comprehensive unit tests (29 test cases, up from 25)

### Code Review Record
- **Reviewer**: Adversarial Senior Dev Review (Claude Opus 4.6)
- **Date**: 2026-02-05
- **Issues Found**: 1 HIGH, 4 MEDIUM, 1 LOW (6 total)
- **Issues Fixed**: 1 HIGH, 4 MEDIUM, 1 LOW (all fixed)
- **Fixes Applied**:
  - H1: Added explicit fulltime user selection handler (Priority 3.5) - user selecting fulltime now gets 0.9 confidence instead of falling to 0.5 default
  - M1: Added `detectCandidateType` and `CandidateType*` types to `lib/scoring/index.ts` barrel exports
  - M2: Changed `CandidateTypeInput.userJobType` from inline `'coop' | 'fulltime'` to reference existing `JobType` type
  - M3: Added 4 new test cases: 3 for explicit fulltime handler, 1 for fulltime-without-education fallthrough
  - M4: Strengthened 6 weak negative assertions to verify exact expected values (candidateType, confidence, detectedFrom)
  - L1: Added `clampNonNegative()` for `resumeRoleCount` and `totalExperienceYears` to prevent negative values causing misclassification
