# Story 17.2: Implement Compare Upload UI

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want to upload my updated resume after applying suggestions,
So that I can see my actual improvement.

## Acceptance Criteria

**Given** I am on the suggestions page with completed suggestions
**When** I have copied at least one suggestion
**Then** a "Compare with Updated Resume" button becomes visible

**Given** I click the "Compare with Updated Resume" button
**When** the compare upload dialog opens
**Then** I see an upload zone similar to the original resume upload
**And** I see encouraging copy like "Ready to see your improvement?"
**And** the dialog explains the comparison process

**Given** I drag-drop or select a file
**When** the file is valid (PDF/DOCX, < 5MB)
**Then** the file is accepted and the comparison process begins
**And** I see a loading state with progress indication

**Given** I upload an invalid file
**When** validation fails
**Then** I see the appropriate error message (INVALID_FILE_TYPE or FILE_TOO_LARGE)

## Tasks / Subtasks

- [x] Add "copied" state tracking to Zustand store (AC: 1)
  - [x] Add `copiedSuggestions: Set<string>` to store state
  - [x] Add `markSuggestionCopied(suggestionId: string)` action
  - [x] Add `hasAnyCopied()` selector
  - [x] Update CopyButton to call `markSuggestionCopied` on successful copy

- [x] Create CompareUploadDialog component (AC: 2, 3, 4)
  - [x] Create `components/scan/CompareUploadDialog.tsx`
  - [x] Use shadcn Dialog pattern (from PrivacyConsentDialog)
  - [x] Accept props: `open`, `onOpenChange`, `sessionId`
  - [x] Include DialogHeader with title and description
  - [x] Embed ResumeUploader component (reuse existing)
  - [x] Add encouraging copy: "Ready to see your improvement?"
  - [x] Explain comparison process in dialog description
  - [x] Handle file selection and validation
  - [x] Show loading state during comparison analysis
  - [x] Display error messages for invalid files

- [x] Add "Compare" button to suggestions page (AC: 1)
  - [x] Update `ClientSuggestionsPage.tsx`
  - [x] Add button below existing action buttons
  - [x] Show button only when `hasAnyCopied()` returns true
  - [x] Button triggers dialog opening: `setDialogOpen(true)`
  - [x] Use primary button variant with upload icon

- [x] Implement comparison flow orchestration (AC: 3, 4)
  - [x] Handle file selection from dialog
  - [x] Validate file (PDF/DOCX, max 5MB via ResumeUploader)
  - [x] Show loading state in dialog
  - [x] Call comparison server action (Story 17.3 - stub with console.log)
  - [x] Handle success: close dialog, navigate to comparison results (stub)
  - [x] Handle errors: show in dialog, allow retry

- [x] Add state to Zustand store for comparison (AC: 3)
  - [x] Add `isComparing: boolean` flag
  - [x] Add `comparisonFile: File | null`
  - [x] Add `comparisonError: { code: string; message: string } | null`
  - [x] Add setters for each field
  - [x] Add `clearComparison()` action

- [x] Write unit tests
  - [x] Test: Dialog renders with correct content
  - [x] Test: Dialog shows upload zone
  - [x] Test: Invalid file type shows error
  - [x] Test: Dialog shows loading state when comparing
  - [x] Test: Dialog closes when cancel clicked
  - [x] Test: Dialog resets state when opened
  - [x] Test: Error can be dismissed

## Dev Notes

### Epic Context

This is Story 17.2 from Epic 17: Resume Compare & Dashboard Stats (V1.5). This story implements the UI for users to upload an updated resume after applying suggestions to see **actual improvement** (not just projected scores).

**Epic Flow:**
1. ✅ Story 17.1: Database schema ready (`compared_ats_score` column exists)
2. **→ Story 17.2:** Upload UI for comparison resume (THIS STORY)
3. Story 17.3: Server action to analyze comparison resume
4. Story 17.4: Display comparison results
5. Story 17.5: Dashboard stats using comparison data

**Dependencies:**
- **Blocks:** Story 17.3 (Comparison Analysis Server Action) - needs UI to trigger it
- **Blocked by:** None (database schema from 17.1 is ready)

### Architecture Compliance

#### 1. Reuse Existing Upload Components (MANDATORY)

**DO NOT create a new upload component.** Reuse `ResumeUploader.tsx`:

**File:** `components/shared/ResumeUploader.tsx`

**Why Reuse:**
- Already handles PDF/DOCX validation
- Already enforces 5MB limit
- Already shows proper error messages (INVALID_FILE_TYPE, FILE_TOO_LARGE)
- Already uses react-dropzone with correct configuration
- Already has loading states and visual feedback

**Integration Pattern:**
```typescript
// In CompareUploadDialog.tsx
import { ResumeUploader } from '@/components/shared/ResumeUploader';

export function CompareUploadDialog({ open, onOpenChange, sessionId }: Props) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<ErrorObject | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setUploadError(null);

    // Trigger comparison (Story 17.3 - stub for now)
    setIsComparing(true);
    // await compareResume(sessionId, file);
    console.log('Comparison flow will be implemented in Story 17.3');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Compare with Updated Resume</DialogTitle>
          <DialogDescription>
            Upload your updated resume to see your actual improvement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ready to see your improvement? Upload your resume with the suggestions applied.
          </p>

          <ResumeUploader
            onFileSelect={handleFileSelect}
            onFileRemove={() => setUploadedFile(null)}
            onError={setUploadError}
            selectedFile={uploadedFile}
          />

          {uploadError && (
            <ErrorDisplay
              errorCode={uploadError.code}
              message={uploadError.message}
              onDismiss={() => setUploadError(null)}
            />
          )}

          {isComparing && (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing your updated resume...
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isComparing}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Critical Rules:**
- ✅ DO reuse ResumeUploader component
- ✅ DO NOT duplicate validation logic
- ✅ DO NOT create new file upload UI from scratch
- ✅ DO pass proper callbacks: `onFileSelect`, `onFileRemove`, `onError`

#### 2. Dialog Component Pattern (MANDATORY)

Follow the exact pattern from `PrivacyConsentDialog.tsx`:

**File:** `components/shared/PrivacyConsentDialog.tsx`

**Pattern to Follow:**
```typescript
interface CompareUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

export function CompareUploadDialog({
  open,
  onOpenChange,
  sessionId,
}: CompareUploadDialogProps) {
  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setUploadedFile(null);
      setUploadError(null);
      setIsComparing(false);
    }
  }, [open]);

  // Component implementation
}
```

**Critical Rules:**
- ✅ Reset state when dialog opens (useEffect with `open` dependency)
- ✅ Use Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
- ✅ Use DialogFooter for action buttons
- ✅ Disable actions during loading (`isComparing` flag)
- ✅ Close dialog via `onOpenChange(false)`

#### 3. Zustand Store Updates (MANDATORY)

**File:** `store/useOptimizationStore.ts`

**Add These Fields:**
```typescript
interface OptimizationStore {
  // Existing fields...

  // NEW: Comparison tracking
  copiedSuggestions: Set<string>;          // Track which suggestions copied
  comparisonFile: File | null;             // File being compared
  isComparing: boolean;                    // During comparison analysis
  comparisonError: ErrorObject | null;     // Comparison errors

  // NEW: Actions
  markSuggestionCopied: (suggestionId: string) => void;
  hasAnyCopied: () => boolean;
  setComparisonFile: (file: File | null) => void;
  setIsComparing: (comparing: boolean) => void;
  setComparisonError: (error: ErrorObject | null) => void;
  clearComparison: () => void;
}
```

**Implementation:**
```typescript
export const useOptimizationStore = create<OptimizationStore>((set, get) => ({
  // Existing state...

  // NEW: Comparison state
  copiedSuggestions: new Set<string>(),
  comparisonFile: null,
  isComparing: false,
  comparisonError: null,

  // NEW: Actions
  markSuggestionCopied: (suggestionId: string) =>
    set((state) => ({
      copiedSuggestions: new Set(state.copiedSuggestions).add(suggestionId),
    })),

  hasAnyCopied: () => get().copiedSuggestions.size > 0,

  setComparisonFile: (file: File | null) =>
    set({ comparisonFile: file }),

  setIsComparing: (comparing: boolean) =>
    set({ isComparing: comparing }),

  setComparisonError: (error: ErrorObject | null) =>
    set({ comparisonError: error }),

  clearComparison: () =>
    set({
      comparisonFile: null,
      isComparing: false,
      comparisonError: null,
    }),
}));
```

**Critical Rules:**
- ✅ Use `Set<string>` for copied suggestions (efficient lookup)
- ✅ Create new Set when updating (immutability)
- ✅ Provide `hasAnyCopied()` selector for button visibility
- ✅ Clear state with `clearComparison()` action

#### 4. Update CopyButton to Track Copies

**File:** `components/shared/CopyButton.tsx`

**Current Implementation:**
```typescript
export function CopyButton({ text, onCopy, ... }: Props) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success('Copied to clipboard!');
      onCopy?.(true);  // ← Use this callback
      // ...
    }
  };
}
```

**Update SuggestionCard to Call Store:**
```typescript
// In SuggestionCard.tsx or wherever CopyButton is used
import { useOptimizationStore } from '@/store';

function SuggestionCard({ suggestion, sectionType }: Props) {
  const markSuggestionCopied = useOptimizationStore(
    (state) => state.markSuggestionCopied
  );

  const handleCopy = (success: boolean) => {
    if (success) {
      // Generate unique ID: section-index or use suggestion.id if available
      const suggestionId = `${sectionType}-${suggestion.id || index}`;
      markSuggestionCopied(suggestionId);
    }
  };

  return (
    <Card>
      {/* ... */}
      <CopyButton
        text={suggestion.suggestedText}
        onCopy={handleCopy}
      />
    </Card>
  );
}
```

**Critical Rules:**
- ✅ Generate unique suggestion ID (format: `${sectionType}-${index}`)
- ✅ Call `markSuggestionCopied()` only on successful copy
- ✅ Use CopyButton's `onCopy` callback (don't modify CopyButton itself)

#### 5. Add "Compare" Button to Suggestions Page

**File:** `app/(authenticated)/(dashboard)/scan/[sessionId]/suggestions/ClientSuggestionsPage.tsx`

**Current Action Buttons Section:**
```typescript
<div className="flex gap-2">
  <Button variant="outline" onClick={() => router.back()}>
    <ArrowLeft className="mr-2 h-4 w-4" />
    Back to Results
  </Button>
  <Button disabled>
    <Sparkles className="mr-2 h-4 w-4" />
    Apply All Suggestions
    <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
  </Button>
</div>
```

**Update To:**
```typescript
import { Upload } from 'lucide-react';
import { CompareUploadDialog } from '@/components/scan/CompareUploadDialog';

function ClientSuggestionsPage({ session }: Props) {
  const hasAnyCopied = useOptimizationStore((state) => state.hasAnyCopied());
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      {/* Existing content */}

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
        </Button>

        {/* NEW: Compare button (shown when user has copied suggestions) */}
        {hasAnyCopied && (
          <Button onClick={() => setDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Compare with Updated Resume
          </Button>
        )}

        <Button disabled>
          <Sparkles className="mr-2 h-4 w-4" />
          Apply All Suggestions
          <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
        </Button>
      </div>

      {/* NEW: Comparison dialog */}
      <CompareUploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sessionId={session.id}
      />
    </>
  );
}
```

**Critical Rules:**
- ✅ Use `hasAnyCopied()` selector for button visibility
- ✅ Use primary Button variant (not outline) for emphasis
- ✅ Use Upload icon from lucide-react
- ✅ Place button between "Back" and "Apply All" buttons
- ✅ Pass `sessionId` to dialog for comparison flow

#### 6. Error Handling Pattern

**Error Display:**
```typescript
{uploadError && (
  <ErrorDisplay
    errorCode={uploadError.code}
    message={uploadError.message}
    onDismiss={() => setUploadError(null)}
  />
)}
```

**Error Codes:**
- `INVALID_FILE_TYPE` - Wrong file format (not PDF/DOCX)
- `FILE_TOO_LARGE` - Exceeds 5MB limit
- `PARSE_ERROR` - Can't extract text from file
- `LLM_ERROR` - Analysis failed (Story 17.3)
- `LLM_TIMEOUT` - Analysis took too long (Story 17.3)

**Critical Rules:**
- ✅ Use standardized error codes
- ✅ Display errors with ErrorDisplay component
- ✅ Allow dismissal of errors
- ✅ Clear error when new file selected

### Library & Framework Requirements

#### React Dropzone (Already Installed)
**Version:** Latest
**Usage:** Via ResumeUploader component
**Config:**
- `accept`: PDF and DOCX types
- `maxSize`: 5MB (5 * 1024 * 1024 bytes)
- `multiple`: false

#### shadcn/ui Dialog
**Components:** Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
**Location:** `components/ui/dialog.tsx`
**Pattern:** Radix UI Dialog primitive with custom styling

#### Zustand Store
**Version:** Latest
**Store:** `store/useOptimizationStore.ts`
**Pattern:** Create slices with `set` and `get` functions

#### Lucide React Icons
- Upload icon for "Compare" button
- Loader2 icon for loading state
- Check icon (if showing success state)

### File Structure Requirements

```
app/(authenticated)/(dashboard)/scan/[sessionId]/suggestions/
  └── ClientSuggestionsPage.tsx                    ← UPDATE (add Compare button)

components/
  ├── scan/
  │   └── CompareUploadDialog.tsx                  ← CREATE NEW
  └── shared/
      ├── ResumeUploader.tsx                       ← REUSE (no changes)
      ├── CopyButton.tsx                           ← NO CHANGES (use callback)
      ├── ErrorDisplay.tsx                         ← REUSE (no changes)
      └── SuggestionCard.tsx                       ← UPDATE (add copy tracking)

store/
  └── useOptimizationStore.ts                      ← UPDATE (add comparison state)

hooks/
  └── useComparisonUpload.ts                       ← CREATE NEW (optional)

tests/unit/
  └── 17-2-compare-upload-ui.test.tsx              ← CREATE NEW
```

**DO NOT modify:**
- `ResumeUploader.tsx` - Reuse as-is
- `ErrorDisplay.tsx` - Reuse as-is
- `CopyButton.tsx` - Use callback, don't modify component

### Testing Requirements

#### Unit Tests

**File:** `tests/unit/17-2-compare-upload-ui.test.tsx`

**Test Coverage:**
```typescript
describe('Story 17.2: Compare Upload UI', () => {
  test('Compare button hidden when no suggestions copied', () => {
    // Mock store with copiedSuggestions = empty Set
    render(<ClientSuggestionsPage session={mockSession} />);
    expect(screen.queryByText('Compare with Updated Resume')).not.toBeInTheDocument();
  });

  test('Compare button visible after copying suggestion', () => {
    // Mock store with copiedSuggestions = Set(['summary-0'])
    render(<ClientSuggestionsPage session={mockSession} />);
    expect(screen.getByText('Compare with Updated Resume')).toBeInTheDocument();
  });

  test('Dialog opens when Compare button clicked', async () => {
    render(<ClientSuggestionsPage session={mockSession} />);
    const button = screen.getByText('Compare with Updated Resume');
    await userEvent.click(button);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Ready to see your improvement?')).toBeInTheDocument();
  });

  test('Dialog shows upload zone', () => {
    render(<CompareUploadDialog open={true} onOpenChange={vi.fn()} sessionId="123" />);
    expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
  });

  test('Invalid file type shows error', async () => {
    render(<CompareUploadDialog open={true} onOpenChange={vi.fn()} sessionId="123" />);
    const file = new File(['content'], 'resume.txt', { type: 'text/plain' });
    // Simulate file drop
    // Expect error message: "Invalid file type"
  });

  test('File too large shows error', async () => {
    render(<CompareUploadDialog open={true} onOpenChange={vi.fn()} sessionId="123" />);
    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'resume.pdf');
    // Simulate file drop
    // Expect error message: "File too large"
  });

  test('Valid file triggers comparison flow', async () => {
    const mockCompare = vi.fn();
    render(<CompareUploadDialog open={true} onOpenChange={vi.fn()} sessionId="123" />);
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    // Simulate file drop
    // Expect loading state
    // Expect mockCompare called with sessionId and file
  });
});
```

**Testing Pattern:**
- Use Vitest + React Testing Library
- Mock Zustand store with initial state
- Test user interactions (button clicks, file drops)
- Verify visibility conditions
- Verify error handling

#### Manual Testing Checklist

1. Navigate to suggestions page after completing optimization
2. Verify "Compare" button NOT visible initially
3. Click copy button on any suggestion
4. Verify "Compare" button appears
5. Click "Compare" button
6. Verify dialog opens with upload zone
7. Verify encouraging copy is present
8. Try uploading .txt file → See "Invalid file type" error
9. Try uploading 10MB PDF → See "File too large" error
10. Upload valid PDF → See loading state
11. Verify comparison flow triggers (stub in Story 17.2, real in 17.3)

### Previous Story Intelligence

**Story 17.1: Add Comparison Database Schema** (completed)
- ✅ Database migration created (`compared_ats_score` column)
- ✅ TypeScript types updated (SessionRow, OptimizationSession)
- ✅ RLS policies verified (no changes needed)
- ✅ 7/7 unit tests passing

**Key Learnings:**
- Follow existing patterns exactly (ResumeUploader, PrivacyConsentDialog)
- Database column is ready to receive comparison data
- Story 17.3 will populate `compared_ats_score` field
- This story (17.2) just creates the UI trigger

**No Blockers:** Database schema is ready, TypeScript types are in place.

### Git Intelligence Summary

**Recent Commits (Last 5):**
1. `fdba581` - feat(db): add compared_ats_score column (Story 17.1) ✅
2. `2a62db7` - V2.1 UI Enhancements: Keyword Metrics
3. `54e37af` - Feat/llm judge integration
4. `c5a38fe` - feat(ai): integrate LLM-as-Judge
5. `642bbc1` - Feat/point system redesign

**Key Observations:**
- Story 17.1 just merged (database ready)
- Recent UI work on scoring display (V2.1 enhancements)
- LLM-as-Judge pattern established (can be reused in Story 17.3)
- No conflicts expected with this UI-focused story

**Impact on This Story:**
- Clean slate for new UI components
- Existing upload patterns are stable
- Dialog patterns well-established
- No architectural changes needed

### Latest Tech Information

#### React 19 Best Practices (2026)

**useTransition for Async Actions:**
```typescript
const [isPending, startTransition] = useTransition();

function handleAction() {
  startTransition(async () => {
    const result = await serverAction();
    // Update state
  });
}
```

**Form Actions with useActionState:**
Not applicable for file upload (using controlled state instead).

#### Next.js 16 App Router Patterns

**Server vs Client Components:**
- Suggestions page: Server component (loads session data)
- ClientSuggestionsPage: Client component (interactive UI)
- CompareUploadDialog: Client component (form handling)

**Data Fetching:**
- Use server actions for comparison analysis (Story 17.3)
- Use Zustand for client-side state (file upload, loading)

#### Zustand 5.x Patterns

**Set Mutation:**
```typescript
// WRONG - mutates Set
set({ copiedSuggestions: state.copiedSuggestions.add(id) });

// CORRECT - creates new Set
set({ copiedSuggestions: new Set(state.copiedSuggestions).add(id) });
```

**Selectors:**
```typescript
// GOOD - specific selector
const hasAnyCopied = useOptimizationStore((state) => state.hasAnyCopied());

// BAD - reads entire store
const store = useOptimizationStore();
```

### Project Context Reference

**Key Rules from `_bmad-output/project-context.md`:**

1. **ActionResponse Pattern** - Will be used in Story 17.3 (not this story)
2. **Error Codes** - Use standardized codes (INVALID_FILE_TYPE, FILE_TOO_LARGE)
3. **Naming Conventions:**
   - Components: PascalCase ✓ `CompareUploadDialog`
   - Hooks: camelCase with `use` ✓ `useComparisonUpload`
   - Zustand actions: camelCase verb ✓ `markSuggestionCopied`
4. **Component Locations:**
   - Scan-specific components: `components/scan/` ✓
   - Shared components: `components/shared/` ✓
   - UI primitives: `components/ui/` (don't edit)
5. **Reuse Components** - DO NOT duplicate upload logic ✓

**No additional context needed** - this story follows established UI patterns.

### References

- [Source: _bmad-output/planning-artifacts/epic-17-compare-dashboard-stats.md#Story-17.2]
- [Source: components/shared/ResumeUploader.tsx]
- [Source: components/shared/PrivacyConsentDialog.tsx]
- [Source: components/shared/CopyButton.tsx]
- [Source: app/(authenticated)/(dashboard)/scan/[sessionId]/suggestions/ClientSuggestionsPage.tsx]
- [Source: store/useOptimizationStore.ts]
- [Source: _bmad-output/project-context.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

**Implementation Plan:**
1. Updated Zustand store with comparison tracking state
2. Created CompareUploadDialog component following PrivacyConsentDialog pattern
3. Updated ClientSuggestionsPage to show Compare button conditionally
4. Updated SuggestionCard to track copied suggestions
5. Created comprehensive unit tests

**Testing Notes:**
- 10/10 unit tests passing for dialog functionality
- Comparison flow stubbed with console.log (Story 17.3 will implement)
- Pre-existing TypeScript build error in SelectResumeButton.tsx (unrelated)

### Completion Notes List

✅ **Zustand Store Updated**: Added comparison tracking state
- `copiedSuggestions: Set<string>` - Tracks copied suggestion IDs
- `comparisonFile: File | null` - Current comparison file
- `isComparing: boolean` - Loading state during comparison
- `comparisonError: ErrorObject | null` - Comparison errors
- Actions: `markSuggestionCopied()`, `hasAnyCopied()`, `setIsComparing()`, `setComparisonError()`, `clearComparison()`

✅ **CompareUploadDialog Component Created**: Full-featured upload dialog
- Reuses ResumeUploader component (no duplication)
- Follows shadcn Dialog pattern exactly
- Shows encouraging copy: "Ready to see your improvement?"
- Handles file validation via ResumeUploader
- Shows loading state during comparison
- Error display with dismissal
- Resets state when dialog opens

✅ **ClientSuggestionsPage Updated**: Conditional Compare button
- Button hidden initially (no copies)
- Button appears after user copies any suggestion
- Uses Upload icon from lucide-react
- Opens CompareUploadDialog on click
- Positioned between "Back" and "Apply All" buttons

✅ **SuggestionCard Updated**: Tracks copied suggestions
- Added `markSuggestionCopied()` call in CopyButton callback
- Only tracks successful copies (when `success === true`)
- Uses existing `onCopy` callback (no CopyButton changes needed)

✅ **Unit Tests Created**: 10 tests covering all UI scenarios
- Dialog rendering and content
- Upload zone visibility
- Error handling and display
- Loading state during comparison
- Dialog close and state reset
- All tests passing (10/10)

**Architecture Compliance:**
- ✅ Reused ResumeUploader component (no duplication)
- ✅ Followed Dialog pattern from PrivacyConsentDialog
- ✅ Used Set for efficient copied tracking
- ✅ Proper state reset in useEffect
- ✅ Comparison flow stubbed for Story 17.3

**Story 17.3 Integration Points:**
- CompareUploadDialog.tsx line 91: Replace console.log with actual comparison server action
- Expected: `await compareResume(sessionId, file)`
- Should return ActionResponse with comparison results
- On success: Navigate to comparison results page
- On error: Display error in dialog

### File List

**Created:**
- `components/scan/CompareUploadDialog.tsx`
- `tests/unit/17-2-compare-upload-ui.test.tsx`

**Modified:**
- `store/useOptimizationStore.ts`
- `app/(authenticated)/(dashboard)/scan/[sessionId]/suggestions/ClientSuggestionsPage.tsx`
- `components/shared/SuggestionCard.tsx`
