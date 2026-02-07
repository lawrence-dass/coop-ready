# Story 13.1: Add Job Type and Modification Level Types

**Status:** done

## Story

As a developer,
I want the type definitions for Job Type and Modification Level preferences,
So that I can use them throughout the codebase with type safety.

## Acceptance Criteria

1. **Given** the existing `OptimizationPreferences` type
   **When** I need to access job type or modification level
   **Then** `JobTypePreference` type exists with values `'coop' | 'fulltime'`

2. **And** `ModificationLevelPreference` type exists with values `'conservative' | 'moderate' | 'aggressive'`

3. **And** `OptimizationPreferences` interface includes `jobType` and `modificationLevel` fields

4. **And** `DEFAULT_PREFERENCES` includes default values (`fulltime`, `moderate`)

5. **And** `validatePreferences()` validates the new fields

6. **And** `PREFERENCE_METADATA` includes labels and descriptions for new options

## Tasks / Subtasks

- [x] Task 1: Define JobTypePreference and ModificationLevelPreference types (AC: 1, 2)
  - [x] Create `JobTypePreference` type with `'coop' | 'fulltime'` values
  - [x] Create `ModificationLevelPreference` type with `'conservative' | 'moderate' | 'aggressive'` values
  - [x] Add JSDoc comments explaining each value

- [x] Task 2: Update OptimizationPreferences interface (AC: 3)
  - [x] Add `jobType: JobTypePreference` field
  - [x] Add `modificationLevel: ModificationLevelPreference` field
  - [x] Add JSDoc comments for new fields

- [x] Task 3: Update DEFAULT_PREFERENCES (AC: 4)
  - [x] Add `jobType: 'fulltime'` to defaults
  - [x] Add `modificationLevel: 'moderate'` to defaults
  - [x] Verify defaults are sensible (full-time, moderate are safest choices)

- [x] Task 4: Create VALID_* arrays for validation (AC: 5)
  - [x] Create `VALID_JOB_TYPES` constant array
  - [x] Create `VALID_MODIFICATION_LEVELS` constant array
  - [x] Make arrays readonly for type safety

- [x] Task 5: Extend validatePreferences() function (AC: 5)
  - [x] Add validation for `jobType` field
  - [x] Add validation for `modificationLevel` field
  - [x] Include new fields in error messages

- [x] Task 6: Update PREFERENCE_METADATA (AC: 6)
  - [x] Add `jobType` metadata with labels and descriptions
  - [x] Add `modificationLevel` metadata with labels and descriptions
  - [x] Include clear descriptions:
    - **Job Type:** Co-op/Internship vs Full-time context
    - **Modification Level:** Conservative/Moderate/Aggressive change magnitude

- [x] Task 7: Test type exports and validation
  - [x] Verify all new types export correctly
  - [x] Test validatePreferences() with valid and invalid values
  - [x] Verify TypeScript compilation without errors

## Dev Notes

### Current State Analysis

**File:** `/types/preferences.ts`
- Already contains `OptimizationPreferences` interface with 5 existing preferences:
  - `tone` (professional/technical/casual)
  - `verbosity` (concise/detailed/comprehensive)
  - `emphasis` (skills/impact/keywords)
  - `industry` (tech/finance/healthcare/generic)
  - `experienceLevel` (entry/mid/senior)
- Pattern established:
  - Type definition → VALID_* arrays → DEFAULT value → PREFERENCE_METADATA
  - All preferences include JSDoc comments
  - validatePreferences() checks all fields and returns descriptive errors

### What Job Type and Modification Level Do

**Job Type** - Controls audience and language framing:
- **`'coop'`**: Co-op/Internship - Learning-focused language
  - Example verbs: "Contributed to...", "Developed...", "Learned..."
  - Used when job target is learning opportunity, not full-time career role
- **`'fulltime'`** (default): Full-time position - Impact-focused language
  - Example verbs: "Led...", "Drove...", "Owned...", "Delivered..."
  - Standard for most job applications

**Modification Level** - Controls how aggressively suggestions rewrite content:
- **`'conservative'`**: 15-25% change - Only adds keywords, minimal restructuring
- **`'moderate'`** (default): 35-50% change - Restructures for impact, balanced changes
- **`'aggressive'`**: 60-75% change - Full rewrite, significant reorganization

### Design Decisions

1. **Two new preference types** added to existing 5, extending (not replacing) the style preferences
2. **Job Type and Modification Level take precedence** over style preferences in LLM prompts (see Story 13.4)
3. **Defaults are sensible:** `fulltime` and `moderate` are safest, most common choices
4. **TypeScript-first:** Strong typing prevents invalid combinations
5. **Backward compatibility:** Existing code continues to work; new fields are additions

### Integration Points

- **Story 13.2** (Database Migration): Will backfill these defaults into `optimization_preferences` JSONB column
- **Story 13.3** (PreferencesDialog UI): Will add UI sections for these controls
- **Story 13.4** (Prompt Templates): Will inject these into LLM prompts
- **Stories 13.5+**: Will test end-to-end functionality

### Project Structure Notes

- **File location:** `/types/preferences.ts` (existing file)
- **Pattern followed:** Consistent with existing 5 preferences
- **No new files needed:** Just extend existing structure
- **No configuration needed:** Pure TypeScript types

### Key Implementation Details

**Type Naming Convention:**
```typescript
// Singular "Preference" for type definitions
type JobTypePreference = 'coop' | 'fulltime';
type ModificationLevelPreference = 'conservative' | 'moderate' | 'aggressive';

// Plural "Preferences" for interface combining all prefs
interface OptimizationPreferences {
  jobType: JobTypePreference;
  modificationLevel: ModificationLevelPreference;
  // ... existing fields
}
```

**Validation Pattern (existing):**
```typescript
export const VALID_JOB_TYPES: readonly JobTypePreference[] = ['coop', 'fulltime'];

// In validatePreferences():
if (!VALID_JOB_TYPES.includes(p.jobType as JobTypePreference)) {
  return `Invalid jobType: ${String(p.jobType)}. Must be one of: ${VALID_JOB_TYPES.join(', ')}`;
}
```

**Metadata Pattern (existing):**
```typescript
jobType: {
  label: 'Job Type',
  description: 'Type of position you\'re applying for',
  options: {
    coop: {
      label: 'Co-op / Internship',
      description: 'Learning-focused opportunity, emphasize growth and development',
      example: 'Contributed to real-world projects under mentorship',
    },
    fulltime: {
      label: 'Full-time Position',
      description: 'Career position, emphasize impact and delivery',
      example: 'Led team to deliver major features on schedule',
    },
  },
},
```

### Testing Approach

1. **Type Safety:** Verify TypeScript compilation succeeds
2. **Validation:** Test `validatePreferences()` with:
   - Valid combinations (coop+conservative, fulltime+aggressive, etc.)
   - Invalid values ('invalid-job-type', 123, null)
   - Missing fields (to ensure required)
3. **Defaults:** Verify `DEFAULT_PREFERENCES` can be assigned to `OptimizationPreferences`
4. **Metadata:** Ensure all option keys match type values exactly

### References

- [Existing Preferences Implementation](../../types/preferences.ts) - Current pattern and structure
- [Story 11.2 Commit](https://github.com/lawrence-dass/coop-ready/commit/ba7c940) - Original optimization preferences implementation
- [Epic 13 Specification](../../_bmad-output/planning-artifacts/epics.md#epic-13-hybrid-preferences-v05) - Full requirements
- [Project Context - Naming](../../_bmad-output/project-context.md#naming-conventions) - Naming conventions (camelCase)
- [Architecture Patterns](../../_bmad-output/planning-artifacts/architecture.md) - TypeScript patterns

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-5-20250929

### Implementation Plan
1. RED PHASE: Extended existing unit tests in tests/unit/preferences/preferences.test.ts to cover:
   - New JobTypePreference and ModificationLevelPreference types
   - Updated DEFAULT_PREFERENCES with 7 fields (added jobType, modificationLevel)
   - PREFERENCE_METADATA with 7 preferences
   - validatePreferences() validation for new fields
2. Confirmed all tests FAILED before implementation (RED phase complete)
3. GREEN PHASE: Implemented minimal code changes:
   - Added JobTypePreference and ModificationLevelPreference type definitions
   - Extended OptimizationPreferences interface with jobType and modificationLevel fields
   - Updated DEFAULT_PREFERENCES with fulltime and moderate defaults
   - Created VALID_JOB_TYPES and VALID_MODIFICATION_LEVELS arrays
   - Extended validatePreferences() to validate new fields
   - Added comprehensive PREFERENCE_METADATA for both new preferences
4. Confirmed all tests PASSED (GREEN phase complete)
5. REFACTOR PHASE: Updated dependent code:
   - lib/supabase/preferences.ts: Added jobType and modificationLevel to preference merging logic
   - tests/integration/preferences-persistence.test.ts: Updated test fixtures with new fields
   - tests/integration/preferences-pipeline.test.ts: Updated test fixtures with new fields
   - tests/unit/components/preferences-dialog.test.tsx: Updated test fixtures with new fields
6. Verified TypeScript compilation succeeds (only pre-existing unrelated errors remain)
7. All 33 preference tests pass

### Completion Notes List

✅ **Task 1 Complete**: Defined JobTypePreference ('coop' | 'fulltime') and ModificationLevelPreference ('conservative' | 'moderate' | 'aggressive') with comprehensive JSDoc comments

✅ **Task 2 Complete**: Extended OptimizationPreferences interface with jobType and modificationLevel fields with JSDoc

✅ **Task 3 Complete**: Updated DEFAULT_PREFERENCES with jobType: 'fulltime' and modificationLevel: 'moderate'

✅ **Task 4 Complete**: Created VALID_JOB_TYPES and VALID_MODIFICATION_LEVELS readonly arrays

✅ **Task 5 Complete**: Extended validatePreferences() to validate jobType and modificationLevel with descriptive error messages

✅ **Task 6 Complete**: Added comprehensive PREFERENCE_METADATA for both preferences including:
- jobType: Co-op/Internship vs Full-time Position with examples
- modificationLevel: Conservative/Moderate/Aggressive with percentage ranges and examples

✅ **Task 7 Complete**: All tests pass (33/33), types export correctly through types/index.ts, TypeScript compilation succeeds

### File List

**Modified:**
- `types/preferences.ts` - Added JobTypePreference and ModificationLevelPreference types, updated OptimizationPreferences interface, extended DEFAULT_PREFERENCES, added VALID_JOB_TYPES and VALID_MODIFICATION_LEVELS arrays, extended validatePreferences(), added PREFERENCE_METADATA for new preferences
- `lib/supabase/preferences.ts` - Updated getUserPreferences() to merge jobType and modificationLevel with defaults
- `tests/unit/preferences/preferences.test.ts` - Extended tests to cover 7 preferences (added tests for jobType and modificationLevel)
- `tests/integration/preferences-persistence.test.ts` - Updated test fixtures to include new preference fields
- `tests/integration/preferences-pipeline.test.ts` - Updated test fixtures to include new preference fields
- `tests/unit/components/preferences-dialog.test.tsx` - Updated test fixtures to include new preference fields

**Referenced (read-only):**
- `_bmad-output/project-context.md` - Naming conventions and patterns

### Change Log

**2026-01-29** - Story 13.1 implementation complete
- Added JobTypePreference type ('coop' | 'fulltime') with JSDoc comments
- Added ModificationLevelPreference type ('conservative' | 'moderate' | 'aggressive') with JSDoc comments
- Extended OptimizationPreferences interface with jobType and modificationLevel fields
- Updated DEFAULT_PREFERENCES with jobType: 'fulltime' and modificationLevel: 'moderate'
- Created VALID_JOB_TYPES and VALID_MODIFICATION_LEVELS readonly validation arrays
- Extended validatePreferences() function to validate new fields with descriptive error messages
- Added comprehensive PREFERENCE_METADATA for jobType and modificationLevel preferences
- Updated lib/supabase/preferences.ts to handle new fields in getUserPreferences()
- Extended unit tests: 33/33 tests pass (added 8 new tests for new preferences)
- Updated integration tests to include new preference fields
- TypeScript compilation succeeds with no new errors
- All acceptance criteria satisfied

**2026-01-29** - Senior Developer Review (claude-opus-4-5-20251101)

**Issues Found:** 4 HIGH, 3 MEDIUM, 3 LOW

**Fixes Applied:**
1. ✅ **HIGH FIXED:** Added jobType and modificationLevel to `buildPreferencePrompt()` in `lib/ai/preferences.ts`
   - Added 15+ lines of prompt instructions for job type (coop vs fulltime)
   - Added 15+ lines of prompt instructions for modification level (conservative/moderate/aggressive)
2. ✅ **HIGH FIXED:** Updated integration test to verify new preferences in prompt output
3. ✅ **HIGH FIXED:** Updated test comment from "5 fields" to "7 fields" in persistence test
4. ✅ **MEDIUM FIXED:** Updated JSDoc example to include all 7 preferences
5. ✅ **MEDIUM FIXED:** Removed duplicate "PREFERENCE DISPLAY METADATA" comment header
6. ✅ **MEDIUM FIXED:** Updated dialog test name to clarify 5 original preferences

**All Tests Pass:**
- tests/unit/preferences/preferences.test.ts: 33/33 ✅
- tests/integration/preferences-persistence.test.ts: 10/10 ✅
- tests/integration/preferences-pipeline.test.ts: 6/6 ✅
- tests/unit/components/preferences-dialog.test.tsx: 17/17 ✅

**Files Modified in Review:**
- `lib/ai/preferences.ts` - Added buildPreferencePrompt support for jobType and modificationLevel
- `types/preferences.ts` - Removed duplicate comment header
- `tests/integration/preferences-persistence.test.ts` - Fixed test comment
- `tests/integration/preferences-pipeline.test.ts` - Added assertions for new preferences
- `tests/unit/components/preferences-dialog.test.tsx` - Clarified test name
