# Story 3.3: Implement PDF Text Extraction

**Status:** ready-for-dev

## Story

As a user,
I want my PDF resume parsed into text,
So that the system can analyze its content.

## Acceptance Criteria

1. **Given** I upload a valid PDF file
   **When** the file is processed
   **Then** text content is extracted using unpdf library
   **And** the extracted text is stored in the session
   **And** extraction completes within 3 seconds
   **And** if extraction fails, I see error code PARSE_ERROR with helpful message

## Tasks / Subtasks

- [ ] **Task 1: Create Server Action for PDF Extraction** (AC: #1)
  - [ ] Create `/actions/extractPdfText.ts` server action
  - [ ] Accept `file: File` parameter (the pending file from Zustand)
  - [ ] Validate file is PDF type (content-type check)
  - [ ] Call unpdf library to extract text from file
  - [ ] Return ActionResponse<{ text: string; pageCount: number }>
  - [ ] Handle errors with PARSE_ERROR code and helpful message
  - [ ] Add timeout handling (3 second max execution)

- [ ] **Task 2: Integrate with ResumeUploader Component** (AC: #1)
  - [ ] Create hook `/hooks/useResumeExtraction.ts` for extraction logic
  - [ ] Hook accepts `file: File` and `onSuccess`, `onError` callbacks
  - [ ] Show loading state while extracting ("Parsing PDF...")
  - [ ] Call `extractPdfText` server action when file selected
  - [ ] Auto-trigger extraction when valid PDF file is dropped/selected
  - [ ] Handle errors gracefully with toast notification

- [ ] **Task 3: Store Extracted Text in Zustand** (AC: #1)
  - [ ] Add `resumeContent: string | null` to store (existing from types)
  - [ ] Add `setResumeContent` action to set extracted text
  - [ ] Add `isExtracting: boolean` to track extraction state
  - [ ] Add `setIsExtracting` action for loading state
  - [ ] Clear `pendingFile` from store after successful extraction
  - [ ] Keep `fileError` state for validation errors (from Story 3.2)

- [ ] **Task 4: Add UI Feedback for Extraction Process** (AC: #1)
  - [ ] Display loading state while PDF is being extracted
  - [ ] Show "Parsing PDF..." message with spinner
  - [ ] Update ResumeUploader to show extraction status
  - [ ] Display success message once extraction completes
  - [ ] Show error toast if extraction fails (PARSE_ERROR)
  - [ ] Allow user to retry extraction by uploading file again

- [ ] **Task 5: Add Extraction Status to Main Page** (AC: #1)
  - [ ] Update `app/page.tsx` to display extraction progress
  - [ ] Show extracted text length/preview after success
  - [ ] Display error clearly if extraction fails
  - [ ] Disable job description input until resume is extracted
  - [ ] Add visual indicator that resume is ready for analysis

## Dev Notes

### PDF Text Extraction Architecture

**Data Flow:**
```
User drops/selects valid PDF file (Story 3.1)
   → File validation passes (Story 3.2)
   → ResumeUploader stores as pendingFile in Zustand
   → useResumeExtraction hook detects file change
   → Calls extractPdfText server action with File
   → unpdf library extracts text from PDF (server-side)
   → Server returns ActionResponse with { text, pageCount }
   → Hook stores text in Zustand.resumeContent
   → Component updates UI with success state
   → Session persistence auto-saves resumeContent
   → Story 3.5 will parse resumeContent into sections
```

**Key Insight:** Extraction happens server-side for security and to avoid large file handling in browser. The File object is sent to server action, extracted there, and only the text string is stored in client state.

### unpdf Library Documentation

**Installation:** Already in package.json (`unpdf: ^1.4.0`)

**Basic Usage:**
```typescript
import { extractTextFromPdf } from 'unpdf';

const file = /* File object from dropzone */;
const arrayBuffer = await file.arrayBuffer();
const { text, metadata } = await extractTextFromPdf(arrayBuffer);
```

**Key Properties:**
- `text: string` - Full extracted text from all pages
- `metadata.pages?: number` - Number of pages in PDF
- Handles scanned PDFs (no OCR - text-based only per constraint)
- Throws error if PDF is encrypted or corrupted

**Error Scenarios:**
- Encrypted PDF → Error message: "PDF is password protected"
- Corrupted PDF → Error message: "Unable to parse PDF file"
- No text in PDF → Returns empty string (scanned PDF - user should see message)

### Server Action Pattern

**File: `/actions/extractPdfText.ts`**

```typescript
'use server';

import { extractTextFromPdf } from 'unpdf';
import type { ActionResponse } from '@/types';

export async function extractPdfText(
  file: File
): Promise<ActionResponse<{ text: string; pageCount: number }>> {
  try {
    // Validate file type
    if (file.type !== 'application/pdf') {
      return {
        data: null,
        error: { code: 'INVALID_FILE_TYPE', message: 'File is not a PDF' }
      };
    }

    // Convert to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract text using unpdf
    const { text, metadata } = await extractTextFromPdf(arrayBuffer);

    // Return extracted text
    return {
      data: { text, pageCount: metadata?.pages || 1 },
      error: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      data: null,
      error: {
        code: 'PARSE_ERROR',
        message: `Failed to extract PDF text: ${message}`
      }
    };
  }
}
```

### useResumeExtraction Hook

**File: `/hooks/useResumeExtraction.ts`**

```typescript
import { useCallback, useTransition } from 'react';
import { useOptimizationStore } from '@/store';
import { extractPdfText } from '@/actions/extractPdfText';
import { toast } from 'sonner';

interface UseResumeExtractionOptions {
  onSuccess?: (text: string, pageCount: number) => void;
  onError?: (error: { code: string; message: string }) => void;
}

export function useResumeExtraction(options: UseResumeExtractionOptions = {}) {
  const [isPending, startTransition] = useTransition();
  const store = useOptimizationStore();

  const extract = useCallback(
    (file: File) => {
      // Only extract PDF files
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }

      startTransition(async () => {
        const { data, error } = await extractPdfText(file);

        if (error) {
          toast.error(error.message);
          options.onError?.(error);
          return;
        }

        // Store extracted text
        store.setResumeContent(data!.text);
        store.setPendingFile(null); // Clear pending file
        toast.success(`Extracted ${data!.pageCount} page(s) from PDF`);
        options.onSuccess?.(data!.text, data!.pageCount);
      });
    },
    [store, options]
  );

  return { extract, isPending };
}
```

### ResumeUploader Integration

**Update ResumeUploader.tsx:**
```typescript
import { useResumeExtraction } from '@/hooks/useResumeExtraction';

export function ResumeUploader() {
  const { extract, isPending } = useResumeExtraction();
  const pendingFile = useOptimizationStore(s => s.pendingFile);

  const handleDropAccepted = (files: File[]) => {
    const file = files[0];
    store.setPendingFile(file);

    // Auto-trigger extraction for PDF files
    if (file.type === 'application/pdf') {
      extract(file);
    }
  };

  // Show extraction progress when isPending is true
  if (isPending) {
    return (
      <Card className="border-2 border-dashed border-primary/50">
        <div className="flex items-center gap-2 text-primary">
          <Loader2 className="animate-spin" />
          <span>Parsing PDF...</span>
        </div>
      </Card>
    );
  }

  // ... rest of component
}
```

### Store Updates

**File: `/store/useOptimizationStore.ts` - Add fields:**
```typescript
interface OptimizationStore {
  // ... existing fields
  resumeContent: string | null;
  isExtracting: boolean;

  // ... existing actions
  setResumeContent: (content: string | null) => void;
  setIsExtracting: (extracting: boolean) => void;
}
```

### Error Messages & Error Codes

**PARSE_ERROR scenarios:**

| Scenario | Error Code | Message |
|----------|------------|---------|
| Encrypted PDF | PARSE_ERROR | "This PDF is password protected. Please provide an unprotected version." |
| Corrupted PDF | PARSE_ERROR | "Unable to parse this PDF. It may be corrupted or in an unsupported format." |
| Scanned/Image PDF | PARSE_ERROR | "This appears to be a scanned PDF with no extractable text. Please use an editable PDF." |
| Generic error | PARSE_ERROR | "Failed to extract text from PDF. Please try a different file." |

### Performance Considerations

**3-Second Timeout AC:**
- unpdf extraction is fast (typically < 500ms for 1-5 page resumes)
- Adding server action overhead: ~100-200ms network
- Buffer for slower files: recommend 2-3 second client-side timeout
- If exceeds 3s, show message: "This file is taking longer than expected..."

**Implementation:**
```typescript
const timeoutId = setTimeout(() => {
  toast.error('Extraction taking longer than expected. Please try again.');
  // optionally cancel request
}, 3000);
```

### Testing Strategy

**Manual Testing:**
1. Navigate to optimization page → ResumeUploader visible
2. Drop valid PDF file → Loading state shows "Parsing PDF..."
3. PDF extracts successfully → Shows page count + success toast
4. Resume content stored → Session persistence saves it
5. Refresh page → Resume content persists (Story 2.2 verification)
6. Drop encrypted PDF → PARSE_ERROR displayed
7. Drop corrupted PDF → PARSE_ERROR displayed
8. Drop scanned PDF → PARSE_ERROR for no extractable text

**Integration Points:**
- Story 3.2: File validation must pass before extraction
- Story 2.2: Session persistence auto-saves resumeContent
- Story 3.5: Will parse resumeContent into sections

### Previous Story Context (Story 3.2)

**Created in Story 3.2:**
- `/components/shared/FileValidationError.tsx` - Error display
- `fileError` field in Zustand store
- Toast notifications for file errors
- Validation prevents invalid files from reaching extraction

**Key Integration:**
- Valid PDF files reach extraction hook
- Invalid files show validation error (won't reach this story)
- File Validation runs BEFORE extraction

### Project Context Rules to Follow

**From project-context.md:**
- Server actions use ActionResponse<T> pattern ✓
- Error codes must be exactly: `PARSE_ERROR` ✓
- Server-side only (no LLM, no client-side file parsing) ✓
- Handle errors gracefully (toast notifications) ✓
- Zustand store pattern (actions are verbs) ✓
- 3-second timeout per AC ✓

### File Structure After This Story

```
/actions/
└── extractPdfText.ts           ← NEW: PDF extraction server action

/hooks/
├── useResumeExtraction.ts      ← NEW: Extraction hook with loading state
└── index.ts                    ← MODIFIED: Export useResumeExtraction

/components/shared/
└── ResumeUploader.tsx          ← MODIFIED: Trigger extraction on valid PDF

/store/
└── useOptimizationStore.ts     ← MODIFIED: Add resumeContent, isExtracting fields
```

### Dependencies

This story depends on:
- Story 3.1 (Resume Upload UI) - provides ResumeUploader component ✓
- Story 3.2 (File Validation) - ensures only valid PDFs reach here ✓
- Story 2.2 (Session Persistence) - auto-saves resumeContent ✓

This story enables:
- Story 3.4 (DOCX Text Extraction) - same pattern for DOCX files
- Story 3.5 (Resume Section Parsing) - parses resumeContent into sections
- Story 5.1 onwards (ATS Analysis) - needs resumeContent

### References

- [Source: epics.md#Story 3.3 Acceptance Criteria]
- [Source: project-context.md#Constraints] - 3 second max, 5MB file size
- [Source: project-context.md#Error Codes (Use These Exactly)]
- [Source: actions/extractPdfText.ts] - Server action pattern
- [Source: hooks/useResumeExtraction.ts] - Hook pattern
- [Source: store/useOptimizationStore.ts] - Store pattern
- [unpdf GitHub](https://github.com/foliojs/pdfkit) - PDF parsing library
- [unpdf Documentation](https://www.npmjs.com/package/unpdf)

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Completion Status

Story file created with comprehensive developer context. Ready for implementation via `/bmad:bmm:workflows:dev-story`.

### Notes for Implementation

1. **unpdf is already installed** - version ^1.4.0 in package.json
2. **Server action pattern is established** - see previous stories for pattern
3. **Error code must be PARSE_ERROR** - exact match to project-context.md
4. **3-second timeout is AC requirement** - implement with setTimeout or server route timeout
5. **Text-based PDFs only** - no OCR support per constraints
6. **Store already has session persistence** - resumeContent auto-saves via Story 2.2
7. **File validation runs first** - only valid PDFs reach extraction

### Implementation Notes

- Extraction is fast (typically <500ms) - 3s timeout is generous buffer
- unpdf handles most PDF formats automatically
- Error handling should gracefully explain what went wrong
- Loading state during extraction improves perceived performance
- Session persistence means extracted content survives page refresh
- Story 3.4 (DOCX) uses `mammoth` library with similar pattern
