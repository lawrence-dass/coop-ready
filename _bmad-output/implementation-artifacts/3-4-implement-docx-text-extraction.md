# Story 3.4: Implement DOCX Text Extraction

**Status:** ready-for-dev

## Story

As a user,
I want my DOCX resume parsed into text,
So that the system can analyze its content.

## Acceptance Criteria

1. **Given** I upload a valid DOCX file
   **When** the file is processed
   **Then** text content is extracted using mammoth library
   **And** the extracted text is stored in the session
   **And** extraction completes within 3 seconds
   **And** if extraction fails, I see error code PARSE_ERROR with helpful message

## Tasks / Subtasks

- [ ] **Task 1: Create Server Action for DOCX Extraction** (AC: #1)
  - [ ] Create `/actions/extractDocxText.ts` server action
  - [ ] Accept `file: File` parameter (the pending file from Zustand)
  - [ ] Validate file is DOCX type (content-type check)
  - [ ] Call mammoth library to extract text from file
  - [ ] Return ActionResponse<{ text: string; paragraphCount: number }>
  - [ ] Handle errors with PARSE_ERROR code and helpful message
  - [ ] Add timeout handling (3 second max execution)

- [ ] **Task 2: Update Extraction Hook for DOCX Support** (AC: #1)
  - [ ] Modify `/hooks/useResumeExtraction.ts` to support both PDF and DOCX
  - [ ] Detect file type and route to correct extraction function
  - [ ] Call `extractPdfText` for PDFs, `extractDocxText` for DOCX files
  - [ ] Show appropriate loading message ("Parsing PDF..." vs "Parsing DOCX...")
  - [ ] Handle both file types transparently
  - [ ] Test both extraction paths work correctly

- [ ] **Task 3: Update ResumeUploader for DOCX Auto-Extraction** (AC: #1)
  - [ ] Modify ResumeUploader to trigger extraction for DOCX files
  - [ ] Auto-trigger extraction when valid DOCX file is dropped/selected
  - [ ] Show loading state with appropriate file type message
  - [ ] Handle DOCX files with same UI patterns as PDF
  - [ ] Ensure error handling works for both types

- [ ] **Task 4: Verify Store Integration** (AC: #1)
  - [ ] Confirm `resumeContent` field accepts DOCX-extracted text
  - [ ] Confirm `isExtracting` state works for DOCX extraction
  - [ ] Verify error state clears properly for both file types
  - [ ] Test session persistence saves DOCX-extracted content
  - [ ] Refresh page and verify DOCX-extracted content persists

- [ ] **Task 5: Add DOCX-Specific Error Messages** (AC: #1)
  - [ ] Handle corrupted DOCX files with helpful error
  - [ ] Detect password-protected DOCX files
  - [ ] Show PARSE_ERROR with guidance for unsupported formats
  - [ ] Test error scenarios (corrupted, protected, empty)
  - [ ] Verify toast notifications show for DOCX errors

## Dev Notes

### DOCX Text Extraction Architecture

**Data Flow (Same as PDF, but with mammoth library):**
```
User drops/selects valid DOCX file (Story 3.1)
   → File validation passes (Story 3.2)
   → ResumeUploader stores as pendingFile in Zustand
   → useResumeExtraction hook detects file change
   → Detects DOCX type and calls extractDocxText server action
   → mammoth library extracts text from DOCX (server-side)
   → Server returns ActionResponse with { text, paragraphCount }
   → Hook stores text in Zustand.resumeContent
   → Component updates UI with success state
   → Session persistence auto-saves resumeContent
   → Story 3.5 will parse resumeContent into sections (works for both PDF & DOCX)
```

**Key Insight:** Story 3.3 creates the PDF extraction foundation. Story 3.4 adds DOCX support using the same patterns, same hooks, same store. The hook detects file type and routes to appropriate extraction function.

### mammoth Library Documentation

**Installation:** Already in package.json (`mammoth: ^1.11.0`)

**Basic Usage:**
```typescript
import mammoth from 'mammoth';

const file = /* File object from dropzone */;
const arrayBuffer = await file.arrayBuffer();
const result = await mammoth.extractRawText({ arrayBuffer });
const { value: text } = result; // Extracted plain text
```

**Key Properties:**
- `result.value` - Full extracted text from all paragraphs
- `result.messages` - Array of warnings (formatting not preserved, etc.)
- Preserves paragraph structure (newlines between paragraphs)
- Strips formatting but keeps text structure
- Does NOT handle images/tables as content (skips them)

**Error Scenarios:**
- Password-protected DOCX → Throws error with "password" in message
- Corrupted DOCX → Throws error with "zip" in message
- Empty DOCX → Returns empty string
- Unsupported format (ODP, RTF, etc.) → Throws error

### Server Action Pattern

**File: `/actions/extractDocxText.ts`**

```typescript
'use server';

import mammoth from 'mammoth';
import type { ActionResponse } from '@/types';

export async function extractDocxText(
  file: File
): Promise<ActionResponse<{ text: string; paragraphCount: number }>> {
  try {
    // Validate file type
    if (
      file.type !==
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return {
        data: null,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'File is not a DOCX document'
        }
      };
    }

    // Convert to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract text using mammoth
    const result = await mammoth.extractRawText({ arrayBuffer });

    // Count paragraphs (rough estimate: split by newlines)
    const paragraphCount = result.value.split('\n').filter(p => p.trim()).length;

    return {
      data: { text: result.value, paragraphCount },
      error: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Detect specific error types
    if (message.includes('password')) {
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'This DOCX file is password protected. Please provide an unprotected version.'
        }
      };
    }

    if (message.includes('zip')) {
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'This file appears to be corrupted. Please try a different DOCX file.'
        }
      };
    }

    return {
      data: null,
      error: {
        code: 'PARSE_ERROR',
        message: `Failed to extract text from DOCX: ${message}`
      }
    };
  }
}
```

### useResumeExtraction Hook Update

**Modify `/hooks/useResumeExtraction.ts` to support both types:**

```typescript
import { useCallback, useTransition } from 'react';
import { useOptimizationStore } from '@/store';
import { extractPdfText } from '@/actions/extractPdfText';
import { extractDocxText } from '@/actions/extractDocxText';
import { toast } from 'sonner';

interface UseResumeExtractionOptions {
  onSuccess?: (text: string, pageOrParagraphCount: number) => void;
  onError?: (error: { code: string; message: string }) => void;
}

export function useResumeExtraction(options: UseResumeExtractionOptions = {}) {
  const [isPending, startTransition] = useTransition();
  const store = useOptimizationStore();

  const extract = useCallback(
    (file: File) => {
      const isPdf = file.type === 'application/pdf';
      const isDocx =
        file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      if (!isPdf && !isDocx) {
        toast.error('Please upload a PDF or DOCX file');
        return;
      }

      startTransition(async () => {
        const extractionFunction = isPdf ? extractPdfText : extractDocxText;
        const { data, error } = await extractionFunction(file);

        if (error) {
          toast.error(error.message);
          options.onError?.(error);
          return;
        }

        // Store extracted text
        store.setResumeContent(data!.text);
        store.setPendingFile(null); // Clear pending file

        const fileType = isPdf ? 'PDF' : 'DOCX';
        const itemCount = isPdf ? `${data!.pageOrParagraphCount} page(s)` : `${data!.paragraphCount} paragraph(s)`;
        toast.success(`Extracted text from ${fileType} (${itemCount})`);
        options.onSuccess?.(data!.text, data!.pageOrParagraphCount);
      });
    },
    [store, options]
  );

  return { extract, isPending };
}
```

### ResumeUploader Integration

**Update ResumeUploader.tsx - handleDropAccepted:**
```typescript
const handleDropAccepted = (files: File[]) => {
  const file = files[0];
  store.setPendingFile(file);

  // Auto-trigger extraction for both PDF and DOCX files
  const isPdf = file.type === 'application/pdf';
  const isDocx =
    file.type ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (isPdf || isDocx) {
    extract(file);
  }
};

// Update loading message based on file type
if (isPending && pendingFile) {
  const fileType = pendingFile.type === 'application/pdf' ? 'PDF' : 'DOCX';
  return (
    <Card className="border-2 border-dashed border-primary/50">
      <div className="flex items-center gap-2 text-primary">
        <Loader2 className="animate-spin" />
        <span>Parsing {fileType}...</span>
      </div>
    </Card>
  );
}
```

### Error Messages & Error Codes

**PARSE_ERROR scenarios for DOCX:**

| Scenario | Error Code | Message |
|----------|------------|---------|
| Password-protected DOCX | PARSE_ERROR | "This DOCX file is password protected. Please provide an unprotected version." |
| Corrupted DOCX | PARSE_ERROR | "This file appears to be corrupted. Please try a different DOCX file." |
| Empty DOCX | PARSE_ERROR | "This DOCX file appears to be empty. Please use a file with content." |
| Generic error | PARSE_ERROR | "Failed to extract text from DOCX. Please try a different file." |

### Shared vs Specific

**From Story 3.3 (PDF):**
- `/hooks/useResumeExtraction.ts` - Already created, can accept both types
- `/store/useOptimizationStore.ts` - Already has `resumeContent`, `isExtracting`
- `/components/shared/ResumeUploader.tsx` - Already detects PDF, can add DOCX

**New in Story 3.4:**
- `/actions/extractDocxText.ts` - NEW: DOCX-specific extraction action
- Hook modifications to detect and route file types
- ResumeUploader modifications to show correct loading message

### Performance Considerations

**3-Second Timeout AC:**
- mammoth extraction is fast (typically < 500ms for 1-5 page resumes)
- Adding server action overhead: ~100-200ms network
- DOCX parsing is generally faster than PDF parsing
- 3s timeout is generous buffer for both file types

**Comparison:**
- PDF via unpdf: ~300-500ms + network (typically < 700ms total)
- DOCX via mammoth: ~200-400ms + network (typically < 600ms total)

### Testing Strategy

**Manual Testing:**
1. Navigate to optimization page → ResumeUploader visible
2. Drop valid DOCX file → Loading state shows "Parsing DOCX..."
3. DOCX extracts successfully → Shows paragraph count + success toast
4. Resume content stored → Session persistence saves it
5. Refresh page → Resume content persists (Story 2.2 verification)
6. Drop password-protected DOCX → PARSE_ERROR displayed
7. Drop corrupted DOCX → PARSE_ERROR displayed
8. Drop empty DOCX → PARSE_ERROR for no content
9. Drop PDF file → Verify PDF extraction still works (no regression)
10. Drop PDF then DOCX → Verify switching file types works

**Integration Points:**
- Story 3.2: File validation must pass before extraction (for both types)
- Story 2.2: Session persistence auto-saves resumeContent
- Story 3.5: Will parse resumeContent into sections (works for both PDF & DOCX)
- Story 3.3: PDF extraction must continue working (no regression)

### Previous Story Context (Story 3.3)

**Created in Story 3.3:**
- `/actions/extractPdfText.ts` - PDF extraction server action
- `/hooks/useResumeExtraction.ts` - Extraction hook (will be modified for DOCX)
- ResumeUploader integration to trigger PDF extraction

**Key Integration:**
- Story 3.4 ADDS DOCX support to existing PDF flow
- Same hook, same store, same component
- Just detect file type and route to correct extraction function
- No breaking changes to existing PDF functionality

### Project Context Rules to Follow

**From project-context.md:**
- Server actions use ActionResponse<T> pattern ✓
- Error codes must be exactly: `PARSE_ERROR` ✓
- Server-side only (no client-side file parsing) ✓
- Handle errors gracefully (toast notifications) ✓
- Zustand store pattern (actions are verbs) ✓
- 3-second timeout per AC ✓

### File Structure After This Story

```
/actions/
├── extractPdfText.ts           ← From Story 3.3
└── extractDocxText.ts          ← NEW: DOCX extraction action

/hooks/
├── useResumeExtraction.ts      ← MODIFIED: Support both PDF & DOCX
└── index.ts                    (no change, already exported)

/components/shared/
└── ResumeUploader.tsx          ← MODIFIED: Show correct loading message for DOCX

/store/
└── useOptimizationStore.ts     (no change, already has resumeContent)
```

### Dependencies

This story depends on:
- Story 3.1 (Resume Upload UI) - provides ResumeUploader component ✓
- Story 3.2 (File Validation) - ensures only valid DOCX reach here ✓
- Story 3.3 (PDF Text Extraction) - establishes extraction patterns ✓
- Story 2.2 (Session Persistence) - auto-saves resumeContent ✓

This story enables:
- Story 3.5 (Resume Section Parsing) - parses resumeContent from both types
- Story 5.1 onwards (ATS Analysis) - needs resumeContent (from PDF or DOCX)

### References

- [Source: epics.md#Story 3.4 Acceptance Criteria]
- [Source: project-context.md#Constraints] - 3 second max, 5MB file size
- [Source: project-context.md#Error Codes (Use These Exactly)]
- [Source: actions/extractDocxText.ts] - NEW: Server action pattern
- [Source: hooks/useResumeExtraction.ts] - Hook pattern from Story 3.3
- [Source: 3-3-implement-pdf-text-extraction.md] - PDF extraction patterns
- [mammoth GitHub](https://github.com/mwilliamson/mammoth.js) - DOCX parsing library
- [mammoth Documentation](https://www.npmjs.com/package/mammoth)

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Completion Status

Story file created with comprehensive developer context. Ready for implementation via `/bmad:bmm:workflows:dev-story`.

### Notes for Implementation

1. **mammoth is already installed** - version ^1.11.0 in package.json
2. **Story 3.3 created the foundation** - PDF extraction pattern established, hook ready for modification
3. **Same 3-second timeout** - applies to both PDF and DOCX extraction
4. **Error code is PARSE_ERROR** - exact match to project-context.md
5. **Hook modification is key** - useResumeExtraction already created, just needs to detect and route file types
6. **No store changes needed** - resumeContent and isExtracting fields already created in Story 3.3
7. **Minimal ResumeUploader changes** - just update loading message for DOCX vs PDF

### Implementation Simplicity

This is one of the simpler stories because:
- The hook and store infrastructure is already built in Story 3.3
- mammoth has similar API to unpdf
- File type detection is straightforward
- Same error handling pattern as PDF
- Session persistence already works for any text in resumeContent

**Main work:** Create extractDocxText action, modify hook to detect file type and route appropriately.
