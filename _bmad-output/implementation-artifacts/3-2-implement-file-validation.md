# Story 3.2: Implement File Validation

**Status:** ready-for-dev

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

- [ ] **Task 1: Add File Size Validation to ResumeUploader** (AC: #2)
  - [ ] Add `maxSize` prop to ResumeUploader (5MB = 5 * 1024 * 1024 bytes)
  - [ ] Pass max size constraint to react-dropzone `maxSize` property
  - [ ] Define `MAX_FILE_SIZE` constant (5MB) in component
  - [ ] Test oversized file rejection in dropzone config

- [ ] **Task 2: Implement File Type Validation** (AC: #1)
  - [ ] Ensure react-dropzone `accept` prop is properly configured for PDF and DOCX only
  - [ ] Verify MIME types: `application/pdf` and `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - [ ] Update ResumeUploader to validate file extensions (.pdf, .docx)
  - [ ] Ensure rejected files trigger error handling

- [ ] **Task 3: Create File Validation Error Component** (AC: #1, #2)
  - [ ] Create `/components/shared/FileValidationError.tsx` component
  - [ ] Display error message with icon (lucide-react AlertCircle)
  - [ ] Show error code (INVALID_FILE_TYPE or FILE_TOO_LARGE)
  - [ ] Include helpful recovery message ("Please try again with...")
  - [ ] Use error color (red) consistent with UX design system
  - [ ] Make dismissible with close button (optional)

- [ ] **Task 4: Connect Error Handling to ResumeUploader** (AC: #1, #2)
  - [ ] Modify ResumeUploader to handle `onDropRejected` callback from react-dropzone
  - [ ] Extract rejection reasons from react-dropzone (size vs type)
  - [ ] Map rejection types to appropriate error messages
  - [ ] Pass error state to FileValidationError component
  - [ ] Clear error when user selects a valid file
  - [ ] Test both error scenarios (type + size)

- [ ] **Task 5: Integrate Error Handling with Store & Toast** (AC: #1, #2)
  - [ ] Add `fileError` field to Zustand store (error object or null)
  - [ ] Create `setFileError` action in store
  - [ ] Dispatch error to store when file rejected
  - [ ] Show toast notification via sonner when file rejected
  - [ ] Toast message: match error code (INVALID_FILE_TYPE/FILE_TOO_LARGE)
  - [ ] Clear error state when valid file selected

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

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Completion Status

Story file created with comprehensive developer context. Ready for implementation via `/bmad:bmm:workflows:dev-story`.

### Notes for Implementation

1. **React-dropzone is already installed** (from Story 3.1) - check package.json for version
2. **Sonner already integrated** - toast system available in app
3. **Error codes are standardized** - must match exactly: `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`
4. **5MB limit is hard constraint** - defined in project-context.md and epics.md
5. **UX principle:** Errors are not roadblocks - they're helpful guidance. Design should feel supportive, not punitive.
