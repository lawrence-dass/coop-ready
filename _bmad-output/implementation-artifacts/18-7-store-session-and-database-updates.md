# Story 18.7: Store, Session & Database Updates

Status: done

## Story

As a resume optimizer user,
I want my projects suggestions, candidate type classification, and structural suggestions to be persisted to the database and available in the Zustand store,
so that this data survives page refreshes, appears in session history, and is available for the UI to render dynamic candidate-type-aware features.

## Acceptance Criteria

1. **Store state:** `projectsSuggestion: ProjectsSuggestion | null` field exists in the Zustand store (`useOptimizationStore.ts`)
2. **Store state:** `candidateType: CandidateType | null` field exists in the Zustand store
3. **Store state:** `structuralSuggestions: StructuralSuggestion[]` field exists in the Zustand store
4. **Store setters:** `setProjectsSuggestion()`, `setCandidateType()`, `setStructuralSuggestions()` actions exist and work correctly
5. **Store `reset()`:** Clears all 3 new fields (`projectsSuggestion: null`, `candidateType: null`, `structuralSuggestions: []`)
6. **Store `clearResumeAndResults()`:** Clears all 3 new fields alongside existing suggestion fields
7. **Store `loadFromSession()`:** Hydrates all 3 new fields from `OptimizationSession` object
8. **Store `isRegeneratingSection`:** Accepts `'projects'` as a valid section key
9. **Store `updateSectionSuggestion()`:** Handles `'projects'` section alongside existing 4 sections
10. **OptimizationSession type:** Has `projectsSuggestion`, `candidateType`, `structuralSuggestions` fields
11. **Database migration:** `projects_suggestion JSONB`, `candidate_type TEXT`, `structural_suggestions JSONB` columns added to `sessions` table (all nullable, backward compatible)
12. **SessionRow type:** Has `projects_suggestion`, `candidate_type`, `structural_suggestions` fields matching DB columns
13. **`toOptimizationSession()` transformer:** Maps all 3 new DB columns to camelCase TypeScript fields
14. **`updateSession()` function:** Accepts and transforms all 3 new fields in its updates parameter
15. **`lib/scan/queries.ts`:** `SessionData` interface includes `projectsSuggestion`, `candidateType`, `structuralSuggestions`; `getSessionById()` extracts and returns these from the DB row; projects included in suggestions object construction
16. **Projects API route:** TODO comment in `/app/api/suggestions/projects/route.ts` uncommented — session save works with `updateSession({ projectsSuggestion: suggestion })`
17. **Unit tests:** Verify store state, setters, reset, loadFromSession, and isRegeneratingSection for new fields

## Tasks / Subtasks

- [x] Task 1: Database migration — add 3 new columns (AC: #11)
  - [x] 1.1 Create `/supabase/migrations/20260206000000_add_projects_candidate_type_structural.sql`
  - [x] 1.2 `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS projects_suggestion JSONB;`
  - [x] 1.3 `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS candidate_type TEXT;`
  - [x] 1.4 `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS structural_suggestions JSONB;`
  - [x] 1.5 Add `COMMENT ON COLUMN` for each new column

- [x] Task 2: Update `SessionRow` interface and transformer in `/lib/supabase/sessions.ts` (AC: #12, #13)
  - [x] 2.1 Add import for `ProjectsSuggestion`, `StructuralSuggestion` from `@/types/suggestions`
  - [x] 2.2 Add import for `CandidateType` from `@/lib/scoring/types`
  - [x] 2.3 Add `projects_suggestion: ProjectsSuggestion | null;` to `SessionRow` (after line 64)
  - [x] 2.4 Add `candidate_type: string | null;` to `SessionRow` (after projects_suggestion)
  - [x] 2.5 Add `structural_suggestions: StructuralSuggestion[] | null;` to `SessionRow` (after candidate_type)
  - [x] 2.6 Add to `toOptimizationSession()` transformer (after line 92): `projectsSuggestion: row.projects_suggestion,` `candidateType: (row.candidate_type as CandidateType) ?? null,` `structuralSuggestions: row.structural_suggestions ?? [],`

- [x] Task 3: Update `updateSession()` function in `/lib/supabase/sessions.ts` (AC: #14)
  - [x] 3.1 Add `projectsSuggestion?: ProjectsSuggestion | null;` to updates parameter (after line 233)
  - [x] 3.2 Add `candidateType?: CandidateType | null;` to updates parameter
  - [x] 3.3 Add `structuralSuggestions?: StructuralSuggestion[] | null;` to updates parameter
  - [x] 3.4 Add transformation block for `projectsSuggestion` → `projects_suggestion` (after line 292): `if ('projectsSuggestion' in updates) { dbUpdates.projects_suggestion = updates.projectsSuggestion; }`
  - [x] 3.5 Add transformation block for `candidateType` → `candidate_type`: `if ('candidateType' in updates) { dbUpdates.candidate_type = updates.candidateType; }`
  - [x] 3.6 Add transformation block for `structuralSuggestions` → `structural_suggestions`: `if ('structuralSuggestions' in updates) { dbUpdates.structural_suggestions = updates.structuralSuggestions; }`

- [x] Task 4: Update `OptimizationSession` interface in `/types/optimization.ts` (AC: #10)
  - [x] 4.1 Add import for `ProjectsSuggestion`, `StructuralSuggestion` from `./suggestions`
  - [x] 4.2 Add import for `CandidateType` from `@/lib/scoring/types`
  - [x] 4.3 Add `projectsSuggestion?: ProjectsSuggestion | null;` after `educationSuggestion` (after line 248)
  - [x] 4.4 Add `candidateType?: CandidateType | null;` after `projectsSuggestion`
  - [x] 4.5 Add `structuralSuggestions?: StructuralSuggestion[];` after `candidateType`

- [x] Task 5: Update Zustand store — state fields and initial values (AC: #1, #2, #3)
  - [x] 5.1 Add import for `ProjectsSuggestion`, `StructuralSuggestion` from `@/types/suggestions` (inline import() pattern used in store — follow existing convention)
  - [x] 5.2 Add import for `CandidateType` from `@/lib/scoring/types`
  - [x] 5.3 Add to `ExtendedOptimizationStore` interface (after `educationSuggestion` at line 91):
    - `projectsSuggestion: import('@/types/suggestions').ProjectsSuggestion | null;`
    - `candidateType: import('@/lib/scoring/types').CandidateType | null;`
    - `structuralSuggestions: import('@/types/suggestions').StructuralSuggestion[];`
  - [x] 5.4 Add initial state values (after line 323):
    - `projectsSuggestion: null,`
    - `candidateType: null,`
    - `structuralSuggestions: [],`

- [x] Task 6: Update Zustand store — setters (AC: #4)
  - [x] 6.1 Add setter type declarations to `ExtendedOptimizationStore` interface (after line 221):
    - `setProjectsSuggestion: (suggestion: import('@/types/suggestions').ProjectsSuggestion | null) => void;`
    - `setCandidateType: (type: import('@/lib/scoring/types').CandidateType | null) => void;`
    - `setStructuralSuggestions: (suggestions: import('@/types/suggestions').StructuralSuggestion[]) => void;`
  - [x] 6.2 Add setter implementations (after `setEducationSuggestion` at line 449):
    - `setProjectsSuggestion: (suggestion) => set({ projectsSuggestion: suggestion, error: null }),`
    - `setCandidateType: (type) => set({ candidateType: type }),`
    - `setStructuralSuggestions: (suggestions) => set({ structuralSuggestions: suggestions }),`

- [x] Task 7: Update Zustand store — `isRegeneratingSection` and `updateSectionSuggestion` (AC: #8, #9)
  - [x] 7.1 Extend `isRegeneratingSection` type in `ExtendedOptimizationStore` interface (line 94-99): add `projects?: boolean;`
  - [x] 7.2 Extend `setRegeneratingSection` parameter type (line 224): change `'summary' | 'skills' | 'experience' | 'education'` to `'summary' | 'skills' | 'experience' | 'education' | 'projects'`
  - [x] 7.3 Extend `updateSectionSuggestion` section parameter (line 228): change union to include `'projects'`
  - [x] 7.4 Extend `updateSectionSuggestion` suggestion parameter (line 229): add `| import('@/types/suggestions').ProjectsSuggestion`
  - [x] 7.5 Add `'projects'` branch to `updateSectionSuggestion` implementation (after line 468): `else if (section === 'projects') { set({ projectsSuggestion: suggestion as import('@/types/suggestions').ProjectsSuggestion, error: null, generalError: null }); }`
  - [x] 7.6 Extend `recordSuggestionFeedback` sectionType parameter (line 254): add `| 'projects'`

- [x] Task 8: Update Zustand store — `reset()`, `clearResumeAndResults()`, `loadFromSession()` (AC: #5, #6, #7)
  - [x] 8.1 Add to `reset()` (line 753-792, after `educationSuggestion: null`): `projectsSuggestion: null,` `candidateType: null,` `structuralSuggestions: [],`
  - [x] 8.2 Add to `clearResumeAndResults()` (line 692-708, after `educationSuggestion: null`): `projectsSuggestion: null,` `candidateType: null,` `structuralSuggestions: [],`
  - [x] 8.3 Add to `loadFromSession()` (line 724-738, after `educationSuggestion`): `projectsSuggestion: session.projectsSuggestion ?? null,` `candidateType: (session.candidateType as CandidateType) ?? null,` `structuralSuggestions: session.structuralSuggestions ?? [],`

- [x] Task 9: Update `lib/scan/queries.ts` — session data loading (AC: #15)
  - [x] 9.1 Add imports for `ProjectsSuggestion`, `StructuralSuggestion` from `@/types/suggestions` and `CandidateType` from `@/lib/scoring/types`
  - [x] 9.2 Add `projectsSuggestion: ProjectsSuggestion | null;` `candidateType: CandidateType | null;` `structuralSuggestions: StructuralSuggestion[];` to `SessionData` interface (after line 28)
  - [x] 9.3 Extract `projects_suggestion` from data (after line 105): `const projectsSuggestion = data.projects_suggestion;`
  - [x] 9.4 Extract `candidate_type` and `structural_suggestions` from data: `const candidateType = data.candidate_type as CandidateType | null;` `const structuralSuggestions = (data.structural_suggestions as StructuralSuggestion[]) ?? [];`
  - [x] 9.5 Include `projects` in suggestions object construction (line 109-115): add `projectsSuggestion` to the OR check and add `projects: projectsSuggestion ? [projectsSuggestion] : [],` inside the suggestions builder
  - [x] 9.6 Also handle the else-if education merge pattern (line 116-122): add similar pattern for projects if suggestions exists but has no projects
  - [x] 9.7 Add `projectsSuggestion`, `candidateType`, `structuralSuggestions` to the return data object (line 125-139)

- [x] Task 10: Uncomment projects API route session save (AC: #16)
  - [x] 10.1 In `/app/api/suggestions/projects/route.ts` (lines 277-286): uncomment the `updateSession()` call and remove the skip log
  - [x] 10.2 The call becomes: `const sessionUpdateResult = await updateSession(request.session_id, { projectsSuggestion: suggestion }); if (sessionUpdateResult.error) { console.error('[projects-suggestion] Session update failed:', sessionUpdateResult.error); }`

- [x] Task 11: Unit tests (AC: #17)
  - [x] 11.1 Create `/tests/unit/store/useOptimizationStore-projects-candidateType.test.ts`
  - [x] 11.2 Test: initial state has `projectsSuggestion: null`, `candidateType: null`, `structuralSuggestions: []`
  - [x] 11.3 Test: `setProjectsSuggestion()` sets and clears projectsSuggestion
  - [x] 11.4 Test: `setCandidateType()` sets candidateType to each of 3 values
  - [x] 11.5 Test: `setStructuralSuggestions()` sets array of structural suggestions
  - [x] 11.6 Test: `reset()` clears all 3 new fields
  - [x] 11.7 Test: `clearResumeAndResults()` clears all 3 new fields
  - [x] 11.8 Test: `loadFromSession()` hydrates all 3 new fields from session object
  - [x] 11.9 Test: `setRegeneratingSection('projects', true)` sets projects regenerating flag
  - [x] 11.10 Test: `updateSectionSuggestion('projects', ...)` sets projectsSuggestion
  - [x] 11.11 P0: All new store fields initialized correctly
  - [x] 11.12 P0: All setters work with correct values
  - [x] 11.13 P1: loadFromSession handles undefined/null gracefully

## Dev Notes

### Architecture Overview

This story is the data layer for Epic 18. It connects the types defined in Stories 18.1-18.6 to persistent storage (Supabase DB) and client-side state (Zustand store), enabling Stories 18.8-18.9 to render and wire the data end-to-end.

Three data flows converge:
1. **Projects suggestions** (Story 18.5 generator → save to DB → load into store → render in UI Story 18.8)
2. **Candidate type** (Story 18.1 detection → save to DB → load into store → drive UI tab ordering Story 18.8)
3. **Structural suggestions** (Story 18.3 engine → save to DB → load into store → render banner Story 18.8)

### File Modification Map

| File | What Changes | Key Lines |
|------|-------------|-----------|
| `/supabase/migrations/20260206000000_add_projects_candidate_type_structural.sql` | NEW — 3 column migration | N/A |
| `/lib/supabase/sessions.ts` | SessionRow + transformer + updateSession | Lines 34-39 (imports), 49-67 (SessionRow), 76-96 (transformer), 219-292 (updateSession) |
| `/types/optimization.ts` | OptimizationSession interface | Lines 209-261 |
| `/store/useOptimizationStore.ts` | State + setters + reset + loadFromSession + isRegenerating | Lines 56-285 (interface), 305-342 (initial state), 439-469 (setters), 692-708 (clearResume), 715-739 (loadFromSession), 753-792 (reset) |
| `/lib/scan/queries.ts` | SessionData interface + extraction + return | Lines 6-29 (interface), 101-122 (extraction), 124-141 (return) |
| `/app/api/suggestions/projects/route.ts` | Uncomment session save | Lines 277-286 |

### Database Migration Pattern

Follow the existing migration pattern exactly (see `/supabase/migrations/20260131000000_add_education_suggestion_column.sql`):
```sql
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS column_name TYPE;
COMMENT ON COLUMN sessions.column_name IS 'Description';
```

All new columns MUST be nullable (no `NOT NULL`) for backward compatibility with existing sessions.

### Naming Convention Boundary

| Layer | Convention | Example |
|-------|-----------|---------|
| Database column | snake_case | `projects_suggestion`, `candidate_type`, `structural_suggestions` |
| SessionRow interface | snake_case (mirrors DB) | `projects_suggestion: ProjectsSuggestion \| null` |
| OptimizationSession interface | camelCase | `projectsSuggestion?: ProjectsSuggestion \| null` |
| Zustand store state | camelCase | `projectsSuggestion: ProjectsSuggestion \| null` |
| `toOptimizationSession()` | Maps snake → camel | `projectsSuggestion: row.projects_suggestion` |
| `updateSession()` | Maps camel → snake | `dbUpdates.projects_suggestion = updates.projectsSuggestion` |

### Import Conventions

The Zustand store uses inline `import()` type syntax for suggestion types (see lines 82-91). Follow this same pattern:
```typescript
// In ExtendedOptimizationStore interface:
projectsSuggestion: import('@/types/suggestions').ProjectsSuggestion | null;
```

But in `sessions.ts`, standard top-level imports are used (see lines 34-39):
```typescript
import type { ProjectsSuggestion, StructuralSuggestion } from '@/types/suggestions';
```

### CandidateType Type Reference

`CandidateType` is defined in `/lib/scoring/types.ts` (Story 18.1) as:
```typescript
type CandidateType = 'coop' | 'fulltime' | 'career_changer';
```

It's also re-exported from `/types/preferences.ts`. For this story, import from `@/lib/scoring/types` (the canonical source).

In the database, store as `TEXT` (not JSONB) since it's a simple string enum value.

### Existing TODOs to Address

1. **`/app/api/suggestions/projects/route.ts` lines 277-286**: Commented-out `updateSession()` call with explicit `// TODO Story 18.7` marker. Uncomment once `projectsSuggestion` is in the `updateSession()` updates type.

2. **`/actions/generateAllSuggestions.ts` line 649-650**: Already saves `projects_suggestion` to DB directly via Supabase client (bypasses `updateSession()`). This works independently of Task 3 — the migration just needs to exist for the column to accept data.

### `isRegeneratingSection` Extension Pattern

The current type (lines 94-99) is:
```typescript
isRegeneratingSection: {
  summary?: boolean;
  skills?: boolean;
  experience?: boolean;
  education?: boolean;
};
```

Add `projects?: boolean;`. This is used by `setRegeneratingSection()` (line 224) which also needs its union type extended. The implementation at line 451-457 uses computed property access (`[section]: isLoading`) so no runtime change needed — just the type.

### `updateSectionSuggestion` Extension

The current implementation (lines 459-469) uses if-else branches per section. Add a new `else if (section === 'projects')` branch that sets `projectsSuggestion`. The type for the `suggestion` parameter union (line 229) needs `ProjectsSuggestion` added.

### `recordSuggestionFeedback` Extension

The sectionType parameter (line 254) currently only accepts `'summary' | 'skills' | 'experience' | 'education'`. Add `'projects'` for consistency so users can provide feedback on project suggestions.

### lib/scan/queries.ts Pattern

The `getSessionById()` function in `lib/scan/queries.ts` has a specific pattern for building suggestions from individual columns (lines 101-122). It:
1. Extracts individual `_suggestion` columns from the raw DB row
2. If `data.suggestions` is null but individual columns have data, builds a suggestions object
3. Has special handling for education where it merges into existing suggestions

Follow this exact pattern for projects_suggestion. Also add `candidateType` and `structuralSuggestions` as direct fields on the return object (they're not part of the `suggestions` aggregate).

### What NOT to Modify

- `/lib/scoring/candidateTypeDetection.ts` — Already complete (Story 18.1)
- `/lib/scoring/structuralSuggestions.ts` — Already complete (Story 18.3)
- `/lib/scoring/sectionOrdering.ts` — Already complete (Story 18.3)
- `/lib/ai/generateProjectsSuggestion.ts` — Already complete (Story 18.5)
- `/lib/ai/preferences.ts` — Already complete (Story 18.6)
- `/actions/generateAllSuggestions.ts` — Already saves projects_suggestion directly via Supabase (no changes needed)
- UI components — Story 18.8 scope

### Previous Story Intelligence (18.6)

- Story 18.6 established `deriveEffectiveCandidateType()` utility in preferences.ts for deriving candidateType from preferences when not explicitly provided
- Story 18.6 added `candidateType` parameter to all 5 generators
- The pipeline in `generateAllSuggestions.ts` currently derives candidateType on-the-fly from preferences.jobType — Story 18.9 will wire `detectCandidateType()` and persist the result using the column added in this story
- `generateAllSuggestions.ts` already saves `projects_suggestion` directly to DB (line 650) — this story adds the migration so that save actually works, and adds it to the formal `updateSession()` CRUD layer

### Backward Compatibility

All new columns are nullable. All new store fields have safe defaults (`null` or `[]`). All new `OptimizationSession` fields are optional (`?`). Existing sessions without these columns work unchanged — they'll get `null` values on read. The `loadFromSession()` function uses `?? null` / `?? []` fallbacks.

### Project Structure Notes

- Migration: `/supabase/migrations/` — follows YYYYMMDDHHMMSS naming convention
- Types: `/types/optimization.ts`, `/types/suggestions.ts` — canonical type definitions
- Database layer: `/lib/supabase/sessions.ts` — CRUD with snake→camel transform
- Query layer: `/lib/scan/queries.ts` — read queries for scan pages
- Store: `/store/useOptimizationStore.ts` — Zustand state management
- API route: `/app/api/suggestions/projects/route.ts` — regeneration endpoint
- Tests: `/tests/unit/store/` — Vitest unit tests

### References

- [Source: _bmad-output/planning-artifacts/epic-18-candidate-type-aware-resume-structure.md#Story 18.7]
- [Source: store/useOptimizationStore.ts#L56-L285 - ExtendedOptimizationStore interface]
- [Source: store/useOptimizationStore.ts#L305-L342 - Initial state values]
- [Source: store/useOptimizationStore.ts#L439-L469 - Section setters and updateSectionSuggestion]
- [Source: store/useOptimizationStore.ts#L692-L708 - clearResumeAndResults]
- [Source: store/useOptimizationStore.ts#L715-L739 - loadFromSession]
- [Source: store/useOptimizationStore.ts#L753-L792 - reset]
- [Source: lib/supabase/sessions.ts#L49-L67 - SessionRow interface]
- [Source: lib/supabase/sessions.ts#L76-L96 - toOptimizationSession transformer]
- [Source: lib/supabase/sessions.ts#L219-L292 - updateSession function]
- [Source: types/optimization.ts#L209-L261 - OptimizationSession interface]
- [Source: types/suggestions.ts#L396-L414 - ProjectsSuggestion interface]
- [Source: types/suggestions.ts#L424-L437 - StructuralSuggestion interface]
- [Source: lib/scan/queries.ts#L6-L29 - SessionData interface]
- [Source: lib/scan/queries.ts#L101-L122 - Suggestion extraction and building]
- [Source: app/api/suggestions/projects/route.ts#L277-L286 - TODO Story 18.7 comment]
- [Source: actions/generateAllSuggestions.ts#L644-L651 - DB update with projects_suggestion]
- [Source: supabase/migrations/20260131000000_add_education_suggestion_column.sql - Migration pattern]
- [Source: _bmad-output/implementation-artifacts/18-6-conditional-summary-and-candidate-type-suggestion-framing.md - Previous story]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

- None required - all implementations successful on first attempt

### Completion Notes List

**Story 18.7 Implementation Complete**

✅ **Database Layer (Task 1):**
- Created migration `/supabase/migrations/20260206000000_add_projects_candidate_type_structural.sql`
- Added 3 nullable columns: `projects_suggestion` (JSONB), `candidate_type` (TEXT), `structural_suggestions` (JSONB)
- All columns backward compatible with existing sessions

✅ **Type Layer (Tasks 2-4):**
- Updated `SessionRow` interface with 3 new fields
- Updated `toOptimizationSession()` transformer with snake_case → camelCase conversion
- Updated `updateSession()` function with 3 new parameters and transformation blocks
- Updated `OptimizationSession` interface with 3 new optional fields
- Updated `SuggestionFeedback.sectionType` to include 'projects'

✅ **Store Layer (Tasks 5-8):**
- Added 3 state fields: `projectsSuggestion`, `candidateType`, `structuralSuggestions`
- Added 3 setter functions: `setProjectsSuggestion()`, `setCandidateType()`, `setStructuralSuggestions()`
- Extended `isRegeneratingSection` to include `projects?: boolean`
- Extended `setRegeneratingSection()` and `updateSectionSuggestion()` to accept 'projects'
- Extended `recordSuggestionFeedback()` sectionType to include 'projects'
- Updated `reset()`, `clearResumeAndResults()`, and `loadFromSession()` with new fields

✅ **Query Layer (Task 9):**
- Updated `SessionData` interface with 3 new fields
- Updated `getSessionById()` extraction logic for all 3 new columns
- Added projects to suggestions object construction
- Added fallback handling for projects suggestions (similar to education pattern)

✅ **API Integration (Task 10):**
- Uncommented `updateSession()` call in `/app/api/suggestions/projects/route.ts`
- Projects suggestions now properly persist to database

✅ **Testing (Task 11):**
- Created comprehensive test suite with 26 tests
- All P0 and P1 tests passing
- Coverage: initial state, setters, reset, clearResumeAndResults, loadFromSession, isRegenerating, updateSection

**Additional Fix:**
- Fixed `SuggestionFeedback.sectionType` type to include 'projects' (resolves TypeScript error in `recordSuggestionFeedback` implementation)

**Build Status:** ✅ Successful
**Test Status:** ✅ 26/26 tests passing

### Code Review Fixes (Opus 4.6)

**H1 (Test mock shapes wrong):** Rewrote all `ProjectsSuggestion` and `StructuralSuggestion` mocks in test file to match actual type definitions (`types/suggestions.ts:396-437`). Previous mocks used non-existent fields (`suggestedText`, `improvementScore`, `title`, `description`, etc.) — tests passed but validated nothing about real data shapes. Created factory functions `createMockProjectsSuggestion()` and `createMockStructuralSuggestion()` with correct shapes.

**H2 (queries.ts exclusive merge):** Changed `else if` chain in `lib/scan/queries.ts:128-140` to independent `if` blocks so both education and projects can merge into existing suggestions simultaneously (previously mutually exclusive).

**M1 (Redundant cast):** Removed unnecessary `as CandidateType` cast in `store/useOptimizationStore.ts:773` `loadFromSession()` — type already correct from `OptimizationSession` interface.

**M2 (Missing CHECK constraint):** Added `CHECK (candidate_type IS NULL OR candidate_type IN ('coop', 'fulltime', 'career_changer'))` constraint to migration SQL for runtime validation of enum values at DB level.

### File List

**Created:**
- supabase/migrations/20260206000000_add_projects_candidate_type_structural.sql (review: added CHECK constraint)
- tests/unit/store/useOptimizationStore-projects-candidateType.test.ts (review: rewrote mock shapes)

**Modified:**
- lib/supabase/sessions.ts
- types/optimization.ts
- store/useOptimizationStore.ts (review: removed redundant cast)
- lib/scan/queries.ts (review: fixed exclusive merge logic)
- app/api/suggestions/projects/route.ts
