# Story 4.1: Implement Job Description Input

**Status:** done

## Story

As a user,
I want to paste a job description into a text area,
So that the system can analyze it against my resume.

## Acceptance Criteria

1. **Given** I am on the optimization page with a resume uploaded
   **When** I paste or type text into the job description field
   **Then** the text is captured and validated
   **And** the JD is stored in the Zustand store
   **And** I can see character count or validation status

## Tasks / Subtasks

- [x] **Task 1: Create JobDescriptionInput Component** (AC: #1)
  - [x] Create `/components/shared/JobDescriptionInput.tsx` component
  - [x] Use textarea with Tailwind styling (min-height 120px, border, focus states)
  - [x] Include placeholder: "Paste the job description here..."
  - [x] Add character count display (dynamic, updates on input)
  - [x] Implement real-time input handling with onChange

- [x] **Task 2: Extend Zustand Store with JD State** (AC: #1)
  - [x] Add `jdContent` field to `useOptimizationStore` (string | null)
  - [x] Add `setJDContent` action (verb naming: setJobDescription or setJDContent)
  - [x] Add `clearJD` action for clearing the field
  - [x] Persist JD via Supabase session (useSessionSync hook auto-saves jobDescription field)
  - [x] Restore JD from database session on app initialization (useSessionRestore hook)

- [x] **Task 3: Integrate JobDescriptionInput into Main Page** (AC: #1)
  - [x] Import JobDescriptionInput component in `/app/page.tsx`
  - [x] Place below ResumeUploader in layout (after resume, before analysis results)
  - [x] Connect onChange callback to store's `setJDContent` action
  - [x] Display current JD character count from store
  - [x] Show loading/validation state if applicable

- [x] **Task 4: Implement Input Validation** (AC: #1)
  - [x] Validate JD is not empty before enabling analysis
  - [x] Add minimum length check (e.g., 50 characters - reasonable job description minimum)
  - [x] Show validation status (red text if invalid, gray if empty, green if valid)
  - [x] Display helper text: "Job description must be at least 50 characters"
  - Note: "Disable analysis button" is out of scope (no analysis button exists yet - Epic 5)

- [x] **Task 5: Add Unit Tests** (AC: #1)
  - [x] Test JobDescriptionInput component renders with placeholder
  - [x] Test character count updates on input
  - [x] Test onChange callback fires correctly
  - [x] Test store actions: setJDContent, clearJD
  - [x] Test validation logic (min length, empty state, whitespace trimming)
  - Note: Session persistence tested separately in Epic 2 tests (useSessionSync)

- [x] **Task 6: Add Integration Tests** (AC: #1)
  - [x] Test complete flow: user pastes JD → state updates → component reflects state
  - [x] Test character count accuracy for various text lengths
  - [x] Test validation status changes correctly at boundaries
  - Note: Database persistence tested in Epic 2 integration tests (session-persistence.spec.ts)

## Dev Notes

### Job Description Input Architecture

**Data Flow:**
```
User types in textarea
   → onChange event fires
   → Pass text to store.setJDContent(text)
   → Component receives updated state via store
   → Character count updates
   → Validation runs (length >= 50)
   → Analysis button enabled/disabled based on validation
```

**Key Insight:** Similar pattern to ResumeUploader story, but simpler (no file parsing needed). The JD is plain text, stored directly in state and localStorage.

### Component Structure: JobDescriptionInput

**File:** `/components/shared/JobDescriptionInput.tsx`

```typescript
interface JobDescriptionInputProps {
  value?: string;
  onChange: (text: string) => void;
  onClear?: () => void;
  isDisabled?: boolean;
  className?: string;
}

export function JobDescriptionInput({
  value = '',
  onChange,
  onClear,
  isDisabled = false,
  className,
}: JobDescriptionInputProps) {
  const characterCount = value.length;
  const isValid = value.length >= 50;

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor="jd-input" className="text-sm font-medium">
        Job Description
      </label>

      <textarea
        id="jd-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        placeholder="Paste the job description here..."
        className={cn(
          'w-full min-h-[120px] p-3 border rounded-md',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          isDisabled && 'opacity-50 cursor-not-allowed',
          value.length === 0 ? 'border-gray-300' : 'border-gray-300',
          isValid ? 'ring-1 ring-green-500' : ''
        )}
      />

      <div className="flex justify-between items-center text-xs">
        <span className={cn(
          'text-gray-500',
          isValid ? 'text-green-600' : value.length > 0 ? 'text-red-600' : 'text-gray-500'
        )}>
          {characterCount} characters
          {!isValid && value.length > 0 && ' (minimum 50 required)'}
          {!isValid && value.length === 0 && ' (required)'}
        </span>
        {value.length > 0 && (
          <button
            onClick={onClear}
            disabled={isDisabled}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
```

**Usage in page.tsx:**
```typescript
const jdContent = store.jdContent;
const isJDValid = jdContent && jdContent.length >= 50;

<JobDescriptionInput
  value={jdContent || ''}
  onChange={store.setJDContent}
  onClear={store.clearJD}
  isDisabled={store.isLoading}
/>
```

### Store Extensions: useOptimizationStore

**Add to store interface:**
```typescript
interface OptimizationStore {
  // ... existing fields (resumeContent, etc.)

  // JD Fields
  jdContent: string | null;

  // JD Actions
  setJDContent: (content: string) => void;
  clearJD: () => void;
}
```

**Implementation in store:**
```typescript
const useOptimizationStore = create<OptimizationStore>((set) => ({
  // ... existing state

  jdContent: null,

  setJDContent: (content: string) => set({ jdContent: content }),
  clearJD: () => set({ jdContent: null }),

  // In hydration/persistence logic:
  // Persist jdContent to localStorage
  // Restore on app startup
}));
```

### Validation Logic

**Validation Rules:**
- JD must be provided (not empty)
- JD must be at least 50 characters (reasonable minimum for job description)
- Validation is real-time (shows feedback as user types)
- Analysis button only enabled when: resume present AND JD valid

**Helper function:**
```typescript
export const isJobDescriptionValid = (jd: string | null): boolean => {
  return jd != null && jd.trim().length >= 50;
};
```

### UX Specification Alignment

**From UX Design (Section 4 - Job Description Input):**
- Clear text input field with placeholder
- Real-time character counter shows feedback
- Validation messages help user understand requirements
- Clean white background, consistent with design system
- Red/yellow/green color coding for validation states

**Expected interaction:**
1. User sees textarea with placeholder "Paste the job description here..."
2. User pastes JD text
3. Character counter updates in real-time
4. Validation message appears when reaching 50 characters (turns green)
5. Clear button appears when field has content

### Integration with Existing Features

**From Story 3 (Resume Upload):**
- Resume is already stored in `store.resumeContent`
- Same Zustand store pattern established
- localStorage persistence already implemented for resume

**Dependencies:**
- This story: requires store + component pattern from Story 3.1-3.5 ✓
- Story 5 (ATS Analysis): will consume both `resumeContent` and `jdContent` from store

**Storage Location:**
- Store: `store/useOptimizationStore.ts` (modify existing)
- Component: `components/shared/JobDescriptionInput.tsx` (new)
- Main page integration: `app/page.tsx` (modify existing)

### Technical Constraints

**From project-context.md:**
- Use Zustand for state management ✓
- Component in `/components/shared/` for reusable business logic ✓
- Naming: camelCase for actions (setJDContent) ✓
- localStorage for persistence ✓
- No special libraries needed (textarea is native HTML)

### Testing Requirements

**Unit Tests (create `/tests/unit/4-1-jd-input.test.tsx`):**
1. Component renders with correct placeholder
2. Character count displays and updates
3. onChange callback fires with correct value
4. Clear button works and resets value
5. Validation state changes correctly at 50 character threshold
6. Disabled state is respected

**Unit Tests for Store (create `/tests/unit/4-1-store-jd.test.ts`):**
1. setJDContent action updates state
2. clearJD action clears content
3. Store persists JD to localStorage
4. Store restores JD from localStorage on init
5. Validation helper function works correctly

**Integration Tests (create `/tests/integration/4-1-jd-flow.test.tsx`):**
1. User types JD → component updates → store reflects change
2. User pastes long text → character count accurate
3. Reload page → JD persists from localStorage
4. Clear button → JD clears from store and component
5. Multiple paste/clear cycles work correctly

### File Structure After This Story

```
/components/
└── shared/
    ├── ResumeUploader.tsx           ← from Story 3.1
    ├── FileValidationError.tsx      ← from Story 3.2
    ├── JobDescriptionInput.tsx      ← NEW
    └── index.ts                     ← MODIFIED: export JobDescriptionInput

/store/
└── useOptimizationStore.ts          ← MODIFIED: add jdContent state + actions

/app/
└── page.tsx                         ← MODIFIED: add JobDescriptionInput component

/tests/
├── unit/
│   ├── 4-1-jd-input.test.tsx       ← NEW: component tests
│   └── 4-1-store-jd.test.ts        ← NEW: store tests
└── integration/
    └── 4-1-jd-flow.test.tsx        ← NEW: end-to-end flow tests
```

### Previous Story Learnings (From Story 3.2)

**Key Patterns Applied:**
1. Store integration pattern: action (verb) naming, state field naming
2. Component interface design with optional props
3. Validation at component level with visual feedback
4. localStorage round-trip testing for persistence
5. Integration tests that simulate full user flow

**Testing Improvements:**
- Use Vitest + React Testing Library (NOT Jest)
- Test store updates via useShallow hook to avoid infinite loops
- Use fireEvent for user interactions
- Mock localStorage for persistence tests

**Code Quality:**
- No orphaned test directories
- Type safety: union types for validation states
- Recovery guidance text in UI
- Clean component exports via index.ts

### References

- [Source: epics.md#Story 4.1 Acceptance Criteria]
- [Source: project-context.md#Zustand Store Pattern]
- [Source: ux-design-specification.md#Job Description Section]
- [Source: components/shared/ResumeUploader.tsx] - Component pattern reference
- [Source: store/useOptimizationStore.ts] - Store pattern reference
- [Source: CLAUDE.md#Testing] - Test structure and conventions

## File List

- `components/shared/JobDescriptionInput.tsx` (new)
- `components/shared/index.ts` (modified)
- `lib/validations/jobDescription.ts` (new)
- `store/useOptimizationStore.ts` (modified)
- `types/store.ts` (modified)
- `app/page.tsx` (modified)
- `tests/unit/4-1-jd-input.test.tsx` (new)
- `tests/unit/4-1-store-jd.test.ts` (new)
- `tests/integration/4-1-jd-flow.test.tsx` (new)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Implementation Status

**Story Created:** 2026-01-25
**Implementation Started:** 2026-01-25
**Status:** completed
**Context:** Epic 4, Story 1 - Job Description Input UI

### Implementation Plan

**Approach:** Followed TDD red-green-refactor cycle
1. RED: Created failing unit tests for component and store
2. GREEN: Implemented JobDescriptionInput component and store extensions
3. REFACTOR: Ensured code quality and proper integration
4. Created comprehensive integration tests for full user flow
5. Verified all 100 tests pass (no regressions)

### Completion Notes

✅ **Completed all 6 tasks:**
1. ✅ Created JobDescriptionInput component with real-time character counter and validation
2. ✅ Extended Zustand store with `clearJobDescription` action
3. ✅ Integrated component into main page layout (below resume uploader)
4. ✅ Implemented validation (50 character minimum) with visual feedback
5. ✅ Added 22 unit tests (component + store + validation helper)
6. ✅ Added 6 integration tests for complete user workflow

**Test Coverage:**
- Component: 10 unit tests (rendering, interaction, validation)
- Store: 12 unit tests (state management, error clearing)
- Validation: 6 unit tests (helper function edge cases)
- Integration: 6 tests (full user flow, multiple cycles)
- **Total: 28 tests (all passing)**
- **Full Suite: 100 tests (no regressions)**

**Key Implementation Details:**
- Used existing `jobDescription` field in store (already present from Story 2.2)
- Added `clearJobDescription` action to store
- Created validation helper at `lib/validations/jobDescription.ts`
- Component provides real-time feedback with color-coded states
- Minimum 50 characters enforced with clear user messaging
- Follows established patterns from ResumeUploader component

**Files Created:**
- `components/shared/JobDescriptionInput.tsx`
- `lib/validations/jobDescription.ts`
- `tests/unit/4-1-jd-input.test.tsx`
- `tests/unit/4-1-store-jd.test.ts`
- `tests/integration/4-1-jd-flow.test.tsx`

**Files Modified:**
- `components/shared/index.ts` (export JobDescriptionInput)
- `store/useOptimizationStore.ts` (add clearJobDescription action)
- `types/store.ts` (add clearJobDescription to interface)
- `app/page.tsx` (integrate JobDescriptionInput component)

## Change Log

**2026-01-25 - Code Review Fixes (Claude Opus 4.5)**
- Fixed validation consistency: Component now uses `isJobDescriptionValid()` helper (trims whitespace)
- Added whitespace-only handling: Treated as empty state
- Added aria-label to Clear button for accessibility
- Updated test selectors to use new aria-label
- Added new test for whitespace-only input
- Corrected story documentation: localStorage → Supabase session persistence
- Removed out-of-scope "analysis button" claim (belongs to Epic 5)
- All 101 tests passing

**2026-01-25 - Story Implementation Complete**
- Created JobDescriptionInput component with validation and character counter
- Extended Zustand store with clearJobDescription action
- Integrated JD input into main page UI
- Added 28 comprehensive tests (22 unit + 6 integration)
- All 100 tests passing, no regressions

### Previous Work Context

- Epics 1-3 completed (16 stories, 72 tests passing)
- Story pattern established: component → store → integration → tests
- localStorage persistence proven in Story 2.2
- Error handling pattern established in Story 3.2
- Zustand store patterns well-established across Stories 2-3

### Critical Implementation Path

1. Create JobDescriptionInput component with character counter
2. Extend store with jdContent + setJDContent/clearJD actions
3. Integrate into main page layout (post-resume, pre-analysis)
4. Add localStorage persistence (pattern from Story 2.2)
5. Implement validation (50 char minimum)
6. Write comprehensive unit + integration tests

### Known Patterns to Reuse

- Component props interface with optional fields (from ResumeUploader)
- Store action pattern with verbs (from useOptimizationStore)
- localStorage hydration pattern (from Story 2.2)
- Test structure: unit (component + store) + integration (flow)
- Tailwind styling + shadcn/ui components

