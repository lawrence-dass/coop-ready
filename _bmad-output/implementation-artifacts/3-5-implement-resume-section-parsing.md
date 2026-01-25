# Story 3.5: Implement Resume Section Parsing

**Status:** done

## Story

As a user,
I want my resume parsed into structured sections,
So that the system can provide section-specific suggestions.

## Acceptance Criteria

1. **Given** resume text has been extracted
   **When** the LLM parse step runs
   **Then** the resume is structured into sections (Summary, Skills, Experience, Education)
   **And** each section's content is identified
   **And** the structured data is stored in the session
   **And** the response follows ActionResponse<T> pattern

## Tasks / Subtasks

- [x] **Task 1: Create Resume Section Parser Server Action** (AC: #1, #2)
  - [x] Create `/actions/parseResumeText.ts` server action
  - [x] Accept `rawText: string` parameter (extracted from PDF/DOCX)
  - [x] Use LLM to identify and extract 4 sections: Summary, Skills, Experience, Education
  - [x] Return ActionResponse<Resume> with parsed sections
  - [x] Handle parsing errors with PARSE_ERROR code
  - [x] Add reasonable timeout (10 seconds max for LLM call)

- [x] **Task 2: Implement LLM Prompt for Resume Parsing** (AC: #1, #2)
  - [x] Create structured prompt that instructs Claude to identify sections
  - [x] Prompt should extract: summary, skills, experience, education
  - [x] Wrap raw text in XML tags for prompt injection defense
  - [x] Return JSON with all sections
  - [x] Handle cases where sections don't exist (optional fields)
  - [x] Ensure prompt is deterministic and consistent

- [x] **Task 3: Create useResumeParser Hook** (AC: #1)
  - [x] Create hook `/hooks/useResumeParser.ts` for parsing orchestration
  - [x] Hook accepts `rawText: string` and callbacks
  - [x] Show loading state while parsing ("Parsing resume sections...")
  - [x] Call `parseResumeText` server action with extracted text
  - [x] Handle parsing errors gracefully with toast notification
  - [x] Store parsed Resume object in Zustand

- [x] **Task 4: Integrate Parsing into Extraction Flow** (AC: #1)
  - [x] Modify extraction success flow to trigger parsing automatically
  - [x] After PDF/DOCX extraction succeeds, automatically parse sections
  - [x] Show cascading loading states: "Parsing PDF..." → "Parsing resume sections..."
  - [x] Handle errors at each step (extraction vs parsing)
  - [x] Allow user to retry at either step independently

- [x] **Task 5: Update Store with Parsed Resume Data** (AC: #1, #3)
  - [x] Modify Zustand store to store full Resume object (not just raw text)
  - [x] Add `resumeContent: Resume | null` to store (typed Resume)
  - [x] Add `isParsing: boolean` to track parsing state
  - [x] Add `setResumeContent` to store parsed Resume
  - [x] Add `setIsParsing` action for loading state
  - [x] Update store type to match Resume interface

## Dev Notes

### Resume Section Parsing Architecture

**Data Flow:**
```
User drops/selects valid PDF or DOCX file (Story 3.1)
   → File validation passes (Story 3.2)
   → PDF/DOCX text extraction succeeds (Story 3.3/3.4)
   → resumeContent = { rawText: "..." } stored in Zustand
   → Auto-trigger parseResumeText with rawText
   → Claude LLM identifies and extracts 4 sections
   → Return Resume object: { rawText, summary?, skills?, experience?, education? }
   → Store full Resume object in Zustand.resumeContent
   → Session persistence auto-saves Resume object
   → Story 5.1 onwards uses parsed sections for analysis
```

**Key Insight:** Story 3.3/3.4 extracted raw text (string). Story 3.5 structures that text into a Resume object with 4 optional sections. This structured data enables section-specific suggestions in Story 6.

### Resume Type Structure

**From types/optimization.ts:**
```typescript
export interface Resume {
  rawText: string;           // Full extracted text
  summary?: string;          // Professional summary section
  skills?: string;           // Skills section content
  experience?: string;       // Work experience section
  education?: string;        // Education/Credentials section
  filename?: string;         // Original filename
  fileSize?: number;         // File size in bytes
  uploadedAt?: Date;         // Upload timestamp
}
```

**Key Pattern:**
- `rawText` is always present (from extraction)
- Section fields are optional (may not exist in resume)
- Sections are plain strings (no further parsing into individual items yet)
- All metadata preserved for session tracking

### Server Action Pattern

**File: `/actions/parseResumeText.ts`**

```typescript
'use server';

import { Anthropic } from '@anthropic-ai/sdk';
import type { ActionResponse } from '@/types';
import type { Resume } from '@/types/optimization';

const client = new Anthropic();

interface ParseResult {
  summary: string | null;
  skills: string | null;
  experience: string | null;
  education: string | null;
}

export async function parseResumeText(
  rawText: string
): Promise<ActionResponse<Resume>> {
  try {
    // Validate input
    if (!rawText || rawText.trim().length === 0) {
      return {
        data: null,
        error: { code: 'PARSE_ERROR', message: 'Resume text is empty' }
      };
    }

    // Call Claude to parse sections
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Parse the following resume into structured sections. Identify and extract: Summary (professional summary/objective), Skills, Experience (work history), and Education. If a section is not present or empty, set it to null.

Return ONLY valid JSON in this format:
{
  "summary": "text or null",
  "skills": "text or null",
  "experience": "text or null",
  "education": "text or null"
}

<user_content>
${rawText}
</user_content>`
        }
      ],
      timeout: 10000 // 10 second timeout
    });

    // Extract JSON from response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON (handle markdown code blocks)
    let jsonStr = content.text.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7); // Remove ```json
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3); // Remove ```
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3); // Remove trailing ```
    }
    jsonStr = jsonStr.trim();

    const parsed: ParseResult = JSON.parse(jsonStr);

    // Build Resume object
    const resume: Resume = {
      rawText,
      summary: parsed.summary || undefined,
      skills: parsed.skills || undefined,
      experience: parsed.experience || undefined,
      education: parsed.education || undefined,
      uploadedAt: new Date()
    };

    return {
      data: resume,
      error: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      data: null,
      error: {
        code: 'PARSE_ERROR',
        message: `Failed to parse resume sections: ${message}`
      }
    };
  }
}
```

### useResumeParser Hook

**File: `/hooks/useResumeParser.ts`**

```typescript
import { useCallback, useTransition } from 'react';
import { useOptimizationStore } from '@/store';
import { parseResumeText } from '@/actions/parseResumeText';
import { toast } from 'sonner';
import type { Resume } from '@/types/optimization';

interface UseResumeParserOptions {
  onSuccess?: (resume: Resume) => void;
  onError?: (error: { code: string; message: string }) => void;
}

export function useResumeParser(options: UseResumeParserOptions = {}) {
  const [isPending, startTransition] = useTransition();
  const store = useOptimizationStore();

  const parse = useCallback(
    (rawText: string) => {
      if (!rawText || rawText.trim().length === 0) {
        toast.error('Cannot parse empty resume text');
        return;
      }

      startTransition(async () => {
        const { data, error } = await parseResumeText(rawText);

        if (error) {
          toast.error(error.message);
          options.onError?.(error);
          return;
        }

        // Store parsed resume
        store.setResumeContent(data!);

        const sections = [
          data!.summary ? 'Summary' : null,
          data!.skills ? 'Skills' : null,
          data!.experience ? 'Experience' : null,
          data!.education ? 'Education' : null,
        ].filter(Boolean).join(', ');

        toast.success(`Parsed resume sections: ${sections}`);
        options.onSuccess?.(data!);
      });
    },
    [store, options]
  );

  return { parse, isPending };
}
```

### Integration with Extraction Flow

**Modify extraction hooks to auto-trigger parsing:**

```typescript
// In useResumeExtraction.ts, after successful extraction:

import { useResumeParser } from './useResumeParser';

export function useResumeExtraction(options: UseResumeExtractionOptions = {}) {
  const { parse: parseResume, isPending: isParsing } = useResumeParser();

  const handleExtractionSuccess = (text: string, pageOrParagraphCount: number) => {
    // Extraction done, now parse sections
    parseResume(text);
  };

  // ... rest of hook
}
```

### Store Updates

**Modify `/store/useOptimizationStore.ts`:**

```typescript
import type { Resume } from '@/types/optimization';

interface OptimizationStore {
  // ... existing fields
  resumeContent: Resume | null;        // MODIFIED: Now Resume object, not string
  isParsing: boolean;                  // NEW: Track parsing state
  isExtracting: boolean;               // EXISTING: From extraction

  // ... existing actions
  setResumeContent: (content: Resume | null) => void;  // MODIFIED: Accepts Resume
  setIsParsing: (parsing: boolean) => void;            // NEW
}
```

### Resume Sections Explained

**Summary Section:**
- Professional summary, objective statement, or career overview
- Usually 2-4 sentences at the top of resume
- Optional (many resumes omit this)

**Skills Section:**
- Technical skills, tools, programming languages
- Often a bullet list or comma-separated list
- Usually in a dedicated "Skills" or "Technical Skills" section

**Experience Section:**
- Work history, job titles, companies, dates
- Usually includes job descriptions or bullet points
- May span multiple jobs

**Education Section:**
- Degrees, certifications, GPA (if recent)
- Schools/Universities attended
- Graduation dates

### LLM Parsing Strategy

**Why Claude is ideal:**
- Understands resume structure naturally
- Handles formatting variations (resume layouts vary widely)
- Robust JSON output in single call
- Cost-effective for simple parsing task

**Prompt Design Principles:**
- Wrap user content in XML tags (prompt injection defense)
- Ask for JSON output (structured, parseable)
- Handle missing sections gracefully (return null)
- Keep prompt simple and deterministic

**Error Handling:**
- Invalid JSON from LLM → Return PARSE_ERROR
- Timeout (>10s) → LangChain timeout handling
- Empty resume text → Reject early with clear error

### Performance Considerations

**Parsing Speed:**
- Typical parsing time: 1-2 seconds (Claude is fast for structured extraction)
- 10-second timeout is generous buffer
- Combined extraction + parsing: ~3s (extraction) + ~2s (parsing) = ~5s total

**Cost:**
- Resume parsing is ~50-100 tokens input, ~100-200 tokens output
- Claude Sonnet: ~$0.001-0.002 per resume parse
- Well within cost ceiling for optimization pipeline

### Error Messages

**PARSE_ERROR scenarios:**

| Scenario | Message |
|----------|---------|
| Empty resume text | "Cannot parse empty resume. Please upload a resume first." |
| JSON parsing failed | "Failed to parse resume sections. Please try again." |
| Timeout (>10s) | "Resume parsing took too long. Please try again." |
| Invalid response | "Failed to parse resume sections. Unexpected response." |
| LLM error | "Failed to parse resume sections. Please try again later." |

### Testing Strategy

**Manual Testing:**
1. Extract PDF resume → Verify parsing starts automatically
2. Parsing completes → Verify all 4 sections parsed correctly
3. Verify toast shows sections found (e.g., "Parsed resume sections: Summary, Skills, Experience, Education")
4. Refresh page → Verify Resume object persists via session
5. Resume with missing sections → Verify optional sections are null
6. Very long resume (5+ pages) → Verify completes within 10 seconds
7. Minimal resume (1 section only) → Verify other sections marked as missing
8. Parsing fails → Verify error toast and clear retry path
9. After parsing, verify store has complete Resume object

**Integration Points:**
- Story 3.3/3.4: Extraction triggers parsing automatically
- Story 2.2: Session persistence saves entire Resume object
- Story 5.1: ATS Analysis uses parsed sections for keyword matching
- Story 6: Content Optimization uses sections for targeted suggestions

### Previous Story Context (Stories 3.1-3.4)

**Created in Stories 3.1-3.4:**
- File upload with validation
- PDF and DOCX text extraction
- Raw text stored in Zustand as string

**Current Story Builds On:**
- Stories 3.1-3.4 provide raw extracted text
- This story structures that raw text into Resume object
- Later stories use the structured Resume object

### Project Context Rules to Follow

**From project-context.md:**
- Server actions use ActionResponse<T> pattern ✓
- Error codes must be exactly: `PARSE_ERROR` ✓
- Server-side LLM calls only ✓
- User content in XML tags ✓
- Zustand store pattern (actions are verbs) ✓
- Handle errors gracefully (toast notifications) ✓

### File Structure After This Story

```
/actions/
├── extractPdfText.ts           ← From Story 3.3
├── extractDocxText.ts          ← From Story 3.4
└── parseResumeText.ts          ← NEW: Resume section parsing

/hooks/
├── useResumeExtraction.ts      ← MODIFIED: Trigger parsing after extraction
├── useResumeParser.ts          ← NEW: Parsing orchestration hook
└── index.ts                    ← MODIFIED: Export useResumeParser

/store/
└── useOptimizationStore.ts     ← MODIFIED: resumeContent: Resume | null + isParsing

/types/
└── optimization.ts             (no change, Resume type already defined)
```

### Dependencies

This story depends on:
- Story 3.1 (Resume Upload UI) - provides file upload ✓
- Story 3.2 (File Validation) - ensures valid files ✓
- Story 3.3 (PDF Text Extraction) - provides raw text ✓
- Story 3.4 (DOCX Text Extraction) - provides raw text ✓
- Story 2.2 (Session Persistence) - auto-saves Resume object ✓

This story enables:
- Story 3.6 (Epic 3 Integration) - verification of complete upload-extract-parse flow
- Story 5.1 onwards (ATS Analysis) - uses parsed sections
- Story 6.1 onwards (Content Optimization) - uses section-specific parsing

### References

- [Source: epics.md#Story 3.5 Acceptance Criteria]
- [Source: project-context.md#ActionResponse Pattern]
- [Source: project-context.md#Error Codes]
- [Source: types/optimization.ts] - Resume interface
- [Source: actions/parseResumeText.ts] - NEW: Server action pattern
- [Source: hooks/useResumeParser.ts] - NEW: Hook pattern
- [Anthropic SDK Docs](https://github.com/anthropics/anthropic-sdk-python)
- [Claude 3.5 Sonnet Guide](https://docs.anthropic.com/en/docs/models/claude-3-5-sonnet)

## File List

- `actions/parseResumeText.ts` (NEW)
- `tests/unit/actions/parseResumeText.test.ts` (NEW)
- `hooks/useResumeParser.ts` (NEW)
- `hooks/useResumeExtraction.ts` (MODIFIED - auto-triggers parsing after extraction, DRY refactor)
- `hooks/index.ts` (MODIFIED - exported useResumeParser)
- `tests/unit/hooks/useResumeParser.test.ts` (NEW)
- `store/useOptimizationStore.ts` (MODIFIED - added isParsing state, setIsParsing action)
- `tests/setup.ts` (MODIFIED - added global Anthropic SDK mock)
- `actions/extractPdfText.ts` (MODIFIED - fixed unpdf mergePages option)
- `tests/unit/actions/extractPdfText.test.ts` (MODIFIED - updated test for mergePages)
- `app/page.tsx` (MODIFIED - fixed Resume type usage)

## Change Log

- 2026-01-25: Completed Task 1 - Created parseResumeText server action with full test coverage (8/8 tests passing)
- 2026-01-25: Completed Task 2 - LLM prompt implemented as part of Task 1
- 2026-01-25: Completed Task 3 - Created useResumeParser hook with full test coverage (10/10 tests passing)
- 2026-01-25: Completed Task 4 - Integrated parsing into extraction flow (auto-triggers after PDF/DOCX extraction)
- 2026-01-25: Completed Task 5 - Updated store to handle Resume objects and isParsing state

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Implementation Plan

**Task 1: Create Resume Section Parser Server Action**
- Created server action `/actions/parseResumeText.ts` using Anthropic SDK
- Implemented LLM prompt with XML tags for prompt injection defense
- Added robust JSON parsing (handles markdown code blocks)
- Returns ActionResponse<Resume> with all 4 sections
- 10-second timeout for LLM call
- Full error handling with PARSE_ERROR code

### Debug Log

- Tests initially failed due to incorrect mock setup
- Fixed mock implementation to use vi.mocked() pattern
- Updated test assertions to properly verify XML tag wrapping
- All 8 unit tests passing ✅

### Completion Notes

✅ **Task 1 Complete** - parseResumeText server action fully implemented
- Server action uses Claude 3.5 Sonnet for structured parsing
- Handles all edge cases: empty text, missing sections, invalid JSON, API errors
- Wraps user content in XML tags for security
- Returns Resume object with optional section fields
- 8/8 unit tests passing

✅ **Task 2 Complete** - LLM prompt implemented (was part of Task 1)
- Structured prompt with clear section extraction instructions
- XML tags wrap user content for prompt injection defense
- Returns JSON with 4 fields (summary, skills, experience, education)
- Handles missing sections gracefully (sets to null → undefined in Resume object)
- Deterministic output format requested in prompt

✅ **Task 3 Complete** - useResumeParser hook fully implemented
- Created hook with parse function and isPending state
- Validates input (rejects empty/whitespace-only text)
- Calls parseResumeText server action
- Stores Resume object in Zustand via setResumeContent
- Shows success toast with list of found sections
- Handles errors with toast notifications
- Supports onSuccess and onError callbacks
- 10/10 unit tests passing

✅ **Task 4 Complete** - Parsing integrated into extraction flow
- Modified useResumeExtraction hook to auto-trigger parsing
- After PDF/DOCX extraction succeeds, parseResumeText is called automatically
- Shows cascading toasts: "Extracted X pages" → "Parsing sections..." → "Parsed: Summary, Skills..."
- Handles errors at each step independently
- Sets isParsing state during parsing operation
- Full Resume object (not just rawText) stored in Zustand

✅ **Task 5 Complete** - Store updated for Resume objects
- Added isParsing: boolean state to store
- Added setIsParsing action
- resumeContent already typed as Resume | null (from OptimizationStore interface)
- Store now properly handles full Resume objects with 4 optional sections
- Global Anthropic SDK mock added to tests/setup.ts for test compatibility
- All 70 unit/integration tests passing ✅

### Code Review Fixes (2026-01-25)

**HIGH severity fixes:**
- H2: Added `filename` and `fileSize` parameters to `parseResumeText` action to preserve file metadata
- H3: Refactored `useResumeExtraction` to extract shared parsing logic into `parseAndStoreResume()` helper (DRY fix)

**MEDIUM severity fixes:**
- M1: Fixed unstable options reference in `useResumeParser` by using refs pattern (consistent with extraction hook)
- M3: Added proper destructuring (`const parsedResume = parseResult.data!`) to avoid multiple non-null assertions

**Pre-existing bugs fixed during review:**
- Fixed `unpdf` extractText call to use `{ mergePages: true }` option (returns string instead of string[])
- Fixed `app/page.tsx` to use `resumeContent.rawText.length` instead of `resumeContent.length`
- Fixed type narrowing in `handleFileError` callback

**Test coverage:** 72 tests passing (10 parseResumeText, 10 useResumeParser, 52 others)
**Build:** ✅ Passes TypeScript check and production build
