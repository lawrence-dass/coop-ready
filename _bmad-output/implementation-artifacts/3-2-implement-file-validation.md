# Story 3.2: Implement File Validation

**Status:** done

## Story

As a user,
I want clear error messages when I upload an invalid file,
So that I know exactly what went wrong and how to fix it.

## Acceptance Criteria

1. **Given** I attempt to upload a file
   **When** the file is not PDF or DOCX format
   **Then** I see an error message "Invalid file type. Please upload a PDF or DOCX file."
   **And** the error code INVALID_FILE_TYPE is returned

2. **Given** I attempt to upload a file
   **When** the file exceeds 5MB
   **Then** I see an error message "File too large. Maximum size is 5MB."
   **And** the error code FILE_TOO_LARGE is returned

## Tasks / Subtasks

- [x] **Task 1: Add File Size Validation to ResumeUploader** (AC: #2)
  - [x] Add `maxSize` prop to ResumeUploader (5MB = 5 * 1024 * 1024 bytes)
  - [x] Pass max size constraint to react-dropzone `maxSize` property
  - [x] Define `MAX_FILE_SIZE` constant (5MB) in component
  - [x] Test oversized file rejection in dropzone config

- [x] **Task 2: Implement File Type Validation** (AC: #1)
  - [x] Ensure react-dropzone `accept` prop is properly configured for PDF and DOCX only
  - [x] Verify MIME types: `application/pdf` and `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - [x] Update ResumeUploader to validate file extensions (.pdf, .docx)
  - [x] Ensure rejected files trigger error handling

- [x] **Task 3: Create File Validation Error Component** (AC: #1, #2)
  - [x] Create `/components/shared/FileValidationError.tsx` component
  - [x] Display error message with icon (lucide-react AlertCircle)
  - [x] Show error code (INVALID_FILE_TYPE or FILE_TOO_LARGE)
  - [x] Include helpful recovery message ("Please try again with...")
  - [x] Use error color (red) consistent with UX design system
  - [x] Make dismissible with close button (optional)

- [x] **Task 4: Connect Error Handling to ResumeUploader** (AC: #1, #2)
  - [x] Modify ResumeUploader to handle `onDropRejected` callback from react-dropzone
  - [x] Extract rejection reasons from react-dropzone (size vs type)
  - [x] Map rejection types to appropriate error messages
  - [x] Pass error state to FileValidationError component
  - [x] Clear error when user selects a valid file
  - [x] Test both error scenarios (type + size)

- [x] **Task 5: Integrate Error Handling with Store & Toast** (AC: #1, #2)
  - [x] Add `fileError` field to Zustand store (error object or null)
  - [x] Create `setFileError` action in store
  - [x] Dispatch error to store when file rejected
  - [x] Show toast notification via sonner when file rejected
  - [x] Toast message: match error code (INVALID_FILE_TYPE/FILE_TOO_LARGE)
  - [x] Clear error state when valid file selected

## Dev Notes

### File Validation Architecture

**Data Flow:**
```
User drops/selects file
   → react-dropzone `onDropRejected` callback fires
   → Extract rejection reason (size vs type)
   → Map to error code (FILE_TOO_LARGE or INVALID_FILE_TYPE)
   → Create error object with message + code
   → Store error in Zustand `fileError` field
   → Display FileValidationError component
   → Show toast notification to user
   → Clear error when user selects valid file
```

**Key Insight:** react-dropzone handles both file type and size validation automatically via its `accept` and `maxSize` properties. Our job is to gracefully handle rejections and show clear user-facing errors.

### React-Dropzone Configuration

The ResumeUploader from Story 3.1 already has the basic `accept` and `maxSize` configuration, but we need to:
1. Ensure `maxSize` is properly set (5MB)
2. Implement the `onDropRejected` callback handler
3. Map rejection codes to our error messages

**From react-dropzone docs:**
```typescript
const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
  accept: {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  },
  maxSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 1,
  onDrop: (acceptedFiles) => { /* handle valid file */ },
  onDropRejected: (rejections) => {
    // Handle rejections here
    rejections.forEach((rejection) => {
      // rejection.file has name, size, type
      // rejection.errors is array of { code, message }
      // Codes: "file-too-large", "file-invalid-type", etc.
    });
  },
});
```

### Error Messages & Codes

Map react-dropzone rejection codes to our standardized error codes:

| Dropzone Rejection Code | Our Error Code | Message |
|-------------------------|---|---------|
| `file-too-large` | `FILE_TOO_LARGE` | "File too large. Maximum size is 5MB." |
| `file-invalid-type` | `INVALID_FILE_TYPE` | "Invalid file type. Please upload a PDF or DOCX file." |

**Implementation pattern (in ResumeUploader's onDropRejected):**
```typescript
const handleDropRejected = (rejections: FileRejection[]) => {
  const rejection = rejections[0];
  const firstError = rejection.errors[0];

  if (firstError.code === 'file-too-large') {
    const error = {
      code: 'FILE_TOO_LARGE',
      message: 'File too large. Maximum size is 5MB.'
    };
    setFileError(error);
    toast.error(error.message);
  } else if (firstError.code === 'file-invalid-type') {
    const error = {
      code: 'INVALID_FILE_TYPE',
      message: 'Invalid file type. Please upload a PDF or DOCX file.'
    };
    setFileError(error);
    toast.error(error.message);
  }
};
```

### Constants Definition

```typescript
// In ResumeUploader.tsx or shared constants file
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ACCEPTED_MIME_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};
```

### FileValidationError Component Structure

**File:** `/components/shared/FileValidationError.tsx`

```tsx
interface FileValidationErrorProps {
  code: 'INVALID_FILE_TYPE' | 'FILE_TOO_LARGE';
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function FileValidationError({
  code,
  message,
  onDismiss,
  className,
}: FileValidationErrorProps) {
  // Display with AlertCircle icon from lucide-react
  // Error styling (red color from design system)
  // Optional dismiss button
}
```

### UX Specification Compliance

From UX Design Specification:

**Error Display:**
- Use red color for error states (error indication)
- Clear icon (AlertCircle from lucide-react)
- Plain-language message explaining what went wrong
- Suggested recovery action ("try a different file" or "use a smaller file")
- Non-blocking: error doesn't prevent user from continuing

**Error Handling Strategy:**
- Show error immediately on file rejection
- Toast notification for quick feedback
- Error persists in component until user selects valid file
- Allow user to retry by uploading again

### Previous Story Context (Story 3.1)

**Created in Story 3.1:**
- `/components/shared/ResumeUploader.tsx` - Component with drag-drop using react-dropzone
- `/store/useOptimizationStore.ts` - Zustand store with `pendingFile` field
- React-dropzone already configured with `accept` and `maxFiles: 1`

**Key Integration Points:**
- ResumeUploader already has the dropzone setup
- Store already exists - we just add `fileError` field
- Toast system (sonner) already in app via layout.tsx

### Project Context Rules to Follow

**From project-context.md:**
- Error codes must be exactly: `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`
- Component in `/components/shared/` for reusable business components ✓
- Use shadcn/ui primitives (Card, Button) ✓
- Tailwind-only styling ✓
- Lucide-react icons ✓
- Zustand store pattern with actions (verbs) ✓

### Testing Strategy

**Manual Testing:**
1. Navigate to optimization page → ResumeUploader visible
2. Drag JPEG file → Error displayed: "Invalid file type..."
3. Drag 10MB PDF → Error displayed: "File too large..."
4. Toast notification shows in both cases
5. Error clears when valid PDF selected
6. Error clears when valid DOCX selected
7. Multiple errors can be tried sequentially
8. File upload still works normally after seeing errors

**Integration Points:**
- Store receives `fileError` when file rejected
- Toast displays via sonner
- ResumeUploader clears error state on valid selection
- Story 3.3/3.4 won't receive invalid files (already validated)

### File Structure After This Story

```
/components/
├── shared/
│   ├── ResumeUploader.tsx      ← MODIFIED: Add onDropRejected, error handling
│   ├── FileValidationError.tsx ← NEW: Error display component
│   └── index.ts                ← MODIFIED: Export FileValidationError

/store/
└── useOptimizationStore.ts     ← MODIFIED: Add fileError field + setFileError action

/app/
└── page.tsx                    ← MODIFIED: Display error component from store
```

### Dependencies

This story depends on:
- Story 3.1 (Resume Upload UI) - provides ResumeUploader component and dropzone setup ✓

This story enables:
- Story 3.3 (PDF Text Extraction) - won't receive invalid files
- Story 3.4 (DOCX Text Extraction) - won't receive oversized files

### References

- [Source: epics.md#Story 3.2 Acceptance Criteria]
- [Source: project-context.md#Error Codes (Use These Exactly)]
- [Source: ux-design-specification.md#Error Display]
- [react-dropzone File Rejections API](https://react-dropzone.js.org/#!/Accepting%20specific%20file%20types)
- [react-dropzone onDropRejected](https://react-dropzone.js.org/#!/onDropRejected)
- [Source: components/shared/ResumeUploader.tsx] - Previous implementation
- [Source: store/useOptimizationStore.ts] - Zustand store

## File List

- `components/shared/FileValidationError.tsx` (new)
- `components/shared/ResumeUploader.tsx` (modified)
- `components/shared/index.ts` (modified)
- `store/useOptimizationStore.ts` (modified)
- `app/page.tsx` (modified)
- `vitest.config.ts` (modified)
- `tests/unit/3-2-file-validation.test.tsx` (new)
- `tests/unit/3-2-store-validation.test.ts` (new)
- `tests/integration/3-2-file-validation-flow.test.tsx` (new)

## Change Log

- **2026-01-25:** Implemented file validation with size (5MB) and type (PDF/DOCX) checks, error display component, store integration, and comprehensive test coverage (29 total tests pass). Fixed React hooks linting issue in FileIcon rendering.
- **2026-01-25 (Code Review):** Fixed 6 issues found in code review:
  - Removed orphaned `__tests__/` directory with Jest-based tests (project uses Vitest)
  - Added recovery guidance text to FileValidationError component per UX spec
  - Typed fileError.code as union type in store for type safety
  - Removed unsafe type assertion in page.tsx
  - Fixed React act() warning in integration test
  - Updated test assertion to match new recovery text

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Implementation Plan

1. Added MAX_FILE_SIZE constant (5MB) to ResumeUploader
2. Implemented onDropRejected callback to handle file rejections
3. Created FileValidationError component with error display and dismiss functionality
4. Extended Zustand store with fileError field and setFileError action
5. Integrated error handling in main page with toast notifications
6. Added comprehensive unit and integration tests (10 new tests)
7. Fixed existing React hooks linting issue with FileIcon component

### Debug Log

- All 29 unit and integration tests pass
- Linting clean on modified files
- Error codes match exactly: INVALID_FILE_TYPE, FILE_TOO_LARGE
- Toast notifications integrated via sonner
- Error clears automatically when valid file selected

### Completion Notes

✅ **Story 3.2 Complete - All Acceptance Criteria Satisfied**

**Implemented:**
- File size validation (5MB limit) with clear error messaging
- File type validation (PDF/DOCX only) with error codes
- FileValidationError component with AlertCircle icon and dismiss button
- Store integration with fileError state management
- Toast notifications for immediate user feedback
- Error auto-clearing on valid file selection

**Tests Added:**
- 6 unit tests for FileValidationError component
- 4 unit tests for store validation
- 5 integration tests for complete error flow
- All tests pass (29 total across all stories)

**Key Technical Decisions:**
- Used react-dropzone's built-in validation (maxSize, accept props)
- Mapped dropzone error codes (file-too-large, file-invalid-type) to standardized codes
- Error persists in UI until dismissed or valid file uploaded
- Fixed pre-existing FileIcon React hooks linting issue during implementation
