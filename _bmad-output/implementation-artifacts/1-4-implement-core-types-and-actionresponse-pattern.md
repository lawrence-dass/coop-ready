# Story 1.4: Implement Core Types and ActionResponse Pattern

Status: ready-for-dev

## Story

As a developer,
I want the ActionResponse pattern and core types defined,
So that all server actions follow a consistent error handling pattern.

## Acceptance Criteria

1. **Given** the project structure is in place
   **When** I create a server action
   **Then** I can use the `ActionResponse<T>` type for consistent responses

2. **Given** I'm implementing error handling
   **When** an error occurs
   **Then** standardized error codes are available: INVALID_FILE_TYPE, FILE_TOO_LARGE, PARSE_ERROR, LLM_TIMEOUT, LLM_ERROR, RATE_LIMITED, VALIDATION_ERROR

3. **Given** I need to manage client state
   **When** I create a Zustand store
   **Then** the store interface is already defined with pattern examples

4. **Given** I need to work with application types
   **When** I reference them
   **Then** core type definitions exist in `/types` directory and are properly exported

## Tasks / Subtasks

- [ ] **Task 1: Create ActionResponse Type** (AC: #1, #2)
  - [ ] Create `/types/index.ts` as the main types export file
  - [ ] Define `ActionResponse<T>` discriminated union type
  - [ ] Export error code constants: INVALID_FILE_TYPE, FILE_TOO_LARGE, PARSE_ERROR, LLM_TIMEOUT, LLM_ERROR, RATE_LIMITED, VALIDATION_ERROR
  - [ ] Add JSDoc comments explaining the pattern
  - [ ] Verify type works with both success and error cases

- [ ] **Task 2: Create Application Data Types** (AC: #4)
  - [ ] Create `/types/optimization.ts` with core data types
  - [ ] Define `Resume` type with sections (summary, skills, experience, education)
  - [ ] Define `JobDescription` type for JD input
  - [ ] Define `AnalysisResult` type for keyword analysis output
  - [ ] Define `Suggestion` type with point value, original text, suggested text, section
  - [ ] Define `OptimizationSession` type for session data structure

- [ ] **Task 3: Create Store Interface** (AC: #3)
  - [ ] Create `/types/store.ts` with Zustand store interface
  - [ ] Define state properties: resumeContent, jobDescription, isLoading, loadingStep, error, analysisResults, suggestions
  - [ ] Define action methods: all setters and reset method
  - [ ] Add comments explaining loading state naming conventions (isLoading vs isPending)
  - [ ] Provide example pattern for store implementation (don't implement store itself, just interface)

- [ ] **Task 4: Create Error Type Helpers** (AC: #2)
  - [ ] Create `/types/errors.ts` with error type definitions
  - [ ] Define `ErrorCode` type as union of all error codes
  - [ ] Define `ApiError` type with code and message
  - [ ] Export type guards: `isErrorCode()`, `isActionResponseError()`
  - [ ] Add constants for error messages

- [ ] **Task 5: Validate and Document Types** (AC: #1, #4)
  - [ ] Create example usage file: `/types/examples.ts` (not committed, for reference)
  - [ ] Verify TypeScript compiles without errors
  - [ ] Add README.md in `/types` directory explaining type patterns
  - [ ] Include migration guide for converting DB snake_case to TS camelCase
  - [ ] Verify all exports are correctly re-exported from `/types/index.ts`

## Dev Notes

### The ActionResponse Pattern (MANDATORY)

This is THE critical pattern for this entire project. Every server action and API route MUST follow it:

```typescript
type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } }
```

**Why this pattern?**
- Type-safe: TypeScript knows if you have data or error
- Never throws: Server actions return errors, don't throw
- Client-friendly: Single consistent shape for all responses
- Error codes: Standardized for UI error display

**Pattern Usage Example:**
```typescript
// Server action NEVER throws
async function parseResume(file: File): Promise<ActionResponse<string>> {
  try {
    const text = await extractText(file);
    return { data: text, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: 'Failed to parse resume', code: 'PARSE_ERROR' }
    };
  }
}

// Client-side usage
const { data, error } = await parseResume(file);
if (error) {
  toast.error(error.message); // Already user-friendly
  return;
}
// Use data safely - TypeScript knows it's not null
```

### Error Codes Reference

**These 7 codes are the ONLY codes used in the app:**

| Code | Meaning | When to Use |
|------|---------|-------------|
| `INVALID_FILE_TYPE` | User uploaded wrong file format | PDF/DOCX upload receives .txt, .jpg, etc. |
| `FILE_TOO_LARGE` | File exceeds 5MB limit | Resume upload > 5MB |
| `PARSE_ERROR` | Can't extract text from file | PDF corruption, DOCX parsing fails |
| `LLM_TIMEOUT` | Claude API call exceeded 60 seconds | Optimization pipeline times out |
| `LLM_ERROR` | Claude API returned error | API key invalid, quota exceeded, API down |
| `RATE_LIMITED` | Too many requests to API | Hit Anthropic rate limit |
| `VALIDATION_ERROR` | Invalid input data | Empty resume, missing JD, bad form input |

### Previous Story Intelligence (Stories 1.1-1.3)

**From Story 1.1 (Next.js Initialization):**
- TypeScript strict mode is enabled
- Project has proper `tsconfig.json` configured
- `/types` directory already created
- All dependencies installed and ready to use

**From Story 1.2 (Supabase Database):**
- Database has `sessions` table with snake_case columns: `resume_content`, `jd_content`, `analysis`, `suggestions`
- **Learning**: Types must convert snake_case (DB) → camelCase (TypeScript) at API boundaries
- Example: DB column `resume_content` becomes TS property `resumeContent`

**From Story 1.3 (Environment Configuration):**
- Environment variables are properly configured and loaded
- Supabase client can initialize with URL/keys
- Project ready for type-safe implementations

### Architecture Compliance

**From project-context.md:**
- **ActionResponse Pattern (MANDATORY)**: Lines 42-52 specify exact type definition ✅
- **Error Codes (Use These Exactly)**: Lines 54-64 list all 7 codes ✅
- **Zustand Store Pattern**: Lines 120-142 specify store interface pattern ✅
- **Naming Conventions**: Lines 68-81 specify camelCase for TS, snake_case for DB ✅
- **Directory Structure**: Lines 86-99 show `/types` is dedicated for shared type definitions ✅

**Critical Rule Compliance:**
- This story ENABLES all subsequent stories (Epic 2+) to follow patterns
- Type definitions are the "guardrails" for developer safety
- Zustand store interface prevents inconsistent state management

### Git Pattern from Recent Commits

Story 1.3 pattern followed:
- Feature branch: `feature/1-4-core-types` ✅ (auto-created)
- Commit message format: `feat(story-1-4): Implement core types and ActionResponse pattern`
- Merge: Will trigger post-merge workflow to create Story 2.1

### Type System Design

**Layer 1: ActionResponse (Foundation)**
```
Every server operation
       ↓
ActionResponse<T> wrapper
       ↓
Client receives: { data: T } OR { error: ApiError }
       ↓
No throws, type-safe pattern, consistent everywhere
```

**Layer 2: Domain Types (Data Structures)**
- `Resume`: Structure of parsed resume data
- `JobDescription`: Structure of JD input
- `AnalysisResult`: Structure of keyword analysis
- `Suggestion`: Structure of LLM suggestions
- `OptimizationSession`: Complete session state

**Layer 3: Store Interface (State Management)**
- Zustand store follows specific pattern
- State properties: data + UI state (loading, error)
- Actions: setters + reset method

**Layer 4: Error Types (Error Management)**
- Type guard functions to safely check error codes
- Error message constants for consistency
- Union type for `ErrorCode`

### File Structure After This Story

```
/types
├── index.ts                 ← Main export file (re-exports everything)
├── errors.ts               ← Error code types and helpers
├── optimization.ts         ← Domain types (Resume, JD, Analysis, etc.)
├── store.ts                ← Zustand store interface
├── examples.ts             ← Usage examples (reference only, not committed)
└── README.md               ← Type patterns documentation
```

### Database-to-TypeScript Transform Pattern

Story 1.2 created these DB columns (snake_case):
- `resume_content` → `resumeContent`
- `jd_content` → `jobDescription`
- `analysis` → `analysisResult`
- `suggestions` → `suggestions` (already camelCase in meaning)

**When reading from DB (use Supabase client):**
```typescript
// Query returns snake_case
const { data: session, error } = await supabase
  .from('sessions')
  .select('*')
  .single();

// Transform boundary: convert snake_case → camelCase
const typedSession: OptimizationSession = {
  resumeContent: session.resume_content,
  jobDescription: session.jd_content,
  analysisResult: session.analysis,
  suggestions: session.suggestions,
};
```

### Error Prevention Guardrails

**Common Mistakes This Story Prevents:**
1. ❌ Throwing errors from server actions → ActionResponse enforces error objects
2. ❌ Inconsistent error codes → 7 standardized codes prevent ad-hoc codes
3. ❌ Untyped Zustand stores → Store interface defines contract
4. ❌ Mixed naming (snake_case in TS) → Types document transformation rules
5. ❌ Forgetting types exist → `/types` is the single source of truth
6. ❌ Creating duplicated types in multiple places → Central `/types/index.ts` prevents duplication

### Testing the Types

After implementation, verify with:
```bash
# 1. TypeScript should compile without errors
npm run build

# 2. Check type exports work
node -e "const t = require('./types/index.ts'); console.log(t)"

# 3. Use types in a test file to verify correctness
# (no actual runtime tests needed for types)
```

### What This Story ENABLES

After Story 1.4 is complete:
- **Story 2.1** can use `ActionResponse` for authentication
- **Story 3.1-3.5** can use `Resume` type and error codes for file parsing
- **Story 4.1-4.3** can use `JobDescription` type
- **Story 5.1-5.4** can use `AnalysisResult` and `Suggestion` types
- **Story 6.1-6.7** can use all types for LLM pipeline
- All subsequent stories have type safety without defining types themselves

### References

- [Source: project-context.md#Critical Implementation Rules] - ActionResponse pattern definition (lines 42-52)
- [Source: project-context.md#Error Codes] - Complete error code list (lines 54-64)
- [Source: project-context.md#Zustand Store Pattern] - Store interface pattern (lines 120-142)
- [Source: project-context.md#Naming Conventions] - camelCase vs snake_case rules (lines 68-82)
- [Source: project-context.md#Directory Structure Rules] - `/types` directory purpose (line 98)
- [Source: _bmad-output/implementation-artifacts/1-2-configure-supabase-database-schema.md] - Database schema reference
- [Source: _bmad-output/implementation-artifacts/1-3-set-up-environment-configuration.md] - Env setup reference

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Completion Notes List

_To be filled in by developer after implementation_

### File List

**To Create:**
- `/types/index.ts` - Main types export file with ActionResponse<T>
- `/types/errors.ts` - Error types and type guards
- `/types/optimization.ts` - Domain types (Resume, JobDescription, Analysis, etc.)
- `/types/store.ts` - Zustand store interface
- `/types/examples.ts` - Usage examples (reference, optional)
- `/types/README.md` - Type patterns documentation

**To Verify:**
- TypeScript compilation: `npm run build`
- Type exports: All types re-exported from `/types/index.ts`

**Not to Create:**
- Zustand store implementation (that's Story 2.1+)
- Server actions using these types (that's future stories)
- Tests (types are checked by TypeScript at compile-time)

### Change Log

- 2026-01-24: Story 1.4 created - Comprehensive type system design with ActionResponse pattern, error codes, domain types, and store interface
