# Story 3.1: Implement Resume Upload UI

Status: done

## Story

As a user,
I want to upload my resume via drag-and-drop or file picker,
So that I can easily provide my resume for optimization.

## Acceptance Criteria

1. **Given** I am on the optimization page
   **When** I drag a file onto the upload zone
   **Then** the file is accepted if it's PDF or DOCX format

2. **Given** I am on the optimization page
   **When** I click the upload zone to select a file
   **Then** a file picker opens allowing PDF or DOCX selection

3. **Given** I am hovering over the upload zone with a file
   **When** the file enters the drop zone
   **Then** the upload zone shows visual feedback (border change, background highlight)

4. **Given** I have uploaded a file
   **When** the file is selected/dropped
   **Then** the filename is displayed in the UI

5. **Given** I have uploaded a file
   **When** I want to upload a different file
   **Then** I can remove the current file and upload a new one

## Tasks / Subtasks

- [x] **Task 1: Create ResumeUploader Component** (AC: #1, #2, #3, #4)
  - [x] Create `/components/shared/ResumeUploader.tsx` using react-dropzone
  - [x] Implement drag-drop zone with `useDropzone` hook
  - [x] Configure accept prop for PDF and DOCX MIME types only
  - [x] Handle both drag-drop and click-to-browse interactions
  - [x] Show visual feedback on drag-over (border/background change)
  - [x] Display upload icon (lucide-react Upload icon)
  - [x] Show accepted file types hint (PDF, DOCX)

- [x] **Task 2: Implement File Display State** (AC: #4, #5)
  - [x] Show filename after file selection
  - [x] Display file size in human-readable format
  - [x] Add file type icon (FileText for PDF, FileType for DOCX)
  - [x] Implement remove/clear button to reset selection
  - [x] Handle remove action to clear file state

- [x] **Task 3: Connect to Zustand Store** (AC: #4, #5)
  - [x] Read `resumeContent` from store to check if file exists
  - [x] On file selection, prepare file for processing (don't parse yet - that's Story 3.3/3.4)
  - [x] Store raw `File` object temporarily for later processing
  - [x] Update store when file is removed
  - [x] Add `pendingFile: File | null` to store for pre-parse file storage

- [x] **Task 4: Create Upload Page Layout** (AC: #1, #2)
  - [x] Update `app/page.tsx` to include ResumeUploader component
  - [x] Position uploader in main content area
  - [x] Follow UX spec: generous drag-drop zone with dashed border
  - [x] Ensure responsive layout (mobile-first)

- [x] **Task 5: Add Barrel Exports**
  - [x] Create `/components/shared/index.ts` barrel export
  - [x] Export ResumeUploader component

## Dev Notes

### Resume Upload Architecture

**Data Flow:**
```
User drags/selects file
   → react-dropzone handles file
   → Store pendingFile in Zustand (new field)
   → Display filename/size in UI
   → (Later stories: parse file → store resumeContent)
```

**Key Insight:** This story ONLY handles the UI for file selection. The actual text extraction from PDF/DOCX is handled in Stories 3.3 and 3.4. We store the raw `File` object in a new `pendingFile` field.

### Component Structure

```tsx
// /components/shared/ResumeUploader.tsx
import { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ResumeUploaderProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile?: { name: string; size: number } | null;
  className?: string;
}
```

### MIME Type Configuration

```typescript
// Accept only PDF and DOCX
const acceptedTypes = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};
```

### Visual States

| State | Description | Styling |
|-------|-------------|---------|
| Default | No file, ready for drop | Dashed border, gray bg |
| Drag Over | File hovering over zone | Primary border, light primary bg |
| File Selected | File uploaded | Solid border, file info displayed |
| Error | Invalid file | Red border (handled in Story 3.2) |

### UX Specification Compliance

From UX Design Specification:

**Empty/Upload States:**
- Generous drag-drop zone with dashed border
- Animated upload icon on hover/drag
- Clear file type indicators (PDF, DOCX)
- Sample resume option (V1.0 - not in this story)

**Drag-Drop Zone:**
- Dashed border default
- Solid border + bg change on drag over
- Accepted formats shown: PDF, DOCX
- Max size: 5MB (show if exceeded - handled in Story 3.2)

**Colors (from design system):**
- Primary: #635BFF (Purple/Indigo)
- Primary Light: #F5F3FF (drag-over background)
- Gray-100: #F3F4F6 (default background)
- Gray-500: #6B7280 (muted text)

### Zustand Store Extension

Add `pendingFile` to the store for pre-parse file storage:

```typescript
// In useOptimizationStore.ts - extend the store
interface ExtendedStore extends OptimizationStore {
  sessionId: string | null;
  pendingFile: File | null;  // NEW: Store raw file before parsing

  setSessionId: (id: string | null) => void;
  setPendingFile: (file: File | null) => void;  // NEW
  loadFromSession: (session: OptimizationSession) => void;
}
```

### File Size Formatting

```typescript
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

### Accessibility Requirements

From UX specification:
- Entire zone is clickable
- Focus indicators visible
- Keyboard accessible (Enter/Space to open picker)
- Screen reader: "Upload resume. Accepts PDF and DOCX files."
- ARIA: `role="button"`, appropriate `aria-label`

### Previous Story Context (Story 2.2)

**Created Files:**
- `/store/useOptimizationStore.ts` - Zustand store (extend with pendingFile)
- `/store/index.ts` - Store barrel export
- `/hooks/index.ts` - Hooks barrel export
- `/components/providers/SessionProvider.tsx` - Session orchestration

**Key Integration:**
- Store is already connected to session persistence
- When `pendingFile` is set, session sync will save it (after parsing in later stories)
- The store pattern is established - follow the same conventions

### Architecture Compliance

**From project-context.md:**
- Components in `/components/shared/` for reusable business components ✓
- Use shadcn/ui primitives (Card, Button) ✓
- Follow Tailwind-only styling ✓
- Lucide-react for icons ✓

**From architecture-patterns.md:**
- Zustand actions use camelCase verbs: `setPendingFile` ✓
- State uses nouns: `pendingFile` ✓

### Library Documentation

**react-dropzone (already installed):**
```typescript
import { useDropzone } from 'react-dropzone';

const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
  accept: acceptedTypes,
  maxFiles: 1,
  onDrop: (acceptedFiles) => { /* handle file */ },
  onDropRejected: (rejections) => { /* handle error - Story 3.2 */ },
});
```

### Testing Strategy

**Manual Testing:**
1. Navigate to optimization page → Upload zone visible
2. Drag PDF file → Zone highlights, file accepted
3. Drag DOCX file → Zone highlights, file accepted
4. Drag unsupported file → Zone rejects (Story 3.2 handles error display)
5. Click zone → File picker opens with PDF/DOCX filter
6. Select file → Filename and size displayed
7. Click remove → File cleared, zone back to default

**Integration Points:**
- Store receives `pendingFile` when file selected
- Store clears `pendingFile` when removed
- Session persistence will pick up resumeContent after parsing (later stories)

### File Structure After This Story

```
/components/
├── shared/
│   ├── ResumeUploader.tsx   ← NEW: Drag-drop upload component
│   └── index.ts              ← NEW: Barrel export
├── providers/
│   ├── AuthProvider.tsx      ← From Story 2.1
│   ├── SessionProvider.tsx   ← From Story 2.2
│   └── index.ts
└── ui/                       ← shadcn (don't touch)

/store/
├── useOptimizationStore.ts   ← MODIFIED: Add pendingFile
└── index.ts

/app/
└── page.tsx                  ← MODIFIED: Add ResumeUploader
```

### Dependencies

This story depends on:
- Story 2.2 (Session Persistence) - provides Zustand store ✓

This story enables:
- Story 3.2 (File Validation) - validates uploaded files
- Story 3.3 (PDF Extraction) - extracts text from PDF
- Story 3.4 (DOCX Extraction) - extracts text from DOCX

### References

- [Source: epics.md#Story 3.1 Acceptance Criteria]
- [Source: ux-design-specification.md#Empty/Upload States]
- [Source: ux-design-specification.md#Form Patterns - File Upload]
- [Source: project-context.md#Directory Structure Rules]
- [Source: types/optimization.ts] - Resume type definition
- [Source: store/useOptimizationStore.ts] - Existing Zustand store
- [react-dropzone Documentation](https://react-dropzone.js.org/)

## Dev Agent Record

### Agent Model Used

- Code Review: Claude Opus 4.5 (claude-opus-4-5-20251101)
- Implementation: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Completion Notes List

- **2026-01-24 (Code Review #1)**: Code review found story in inconsistent state. Dependencies installed but core implementation missing. Updated status to in-progress.
- **2026-01-24 (Implementation)**: Completed all 5 tasks with all subtasks
  - Created ResumeUploader component with drag-drop using react-dropzone
  - Implemented all visual states (default, drag-active, file-selected)
  - Extended Zustand store with pendingFile field and actions
  - Integrated component into home page layout
  - Added shadcn UI components (Button, Card)
  - Created comprehensive unit tests (6 tests: 4 P0, 2 P1)
  - Validated: TypeScript compiles, app builds successfully, dev server runs
  - Note: Pre-existing Vitest config version issue (unrelated to this story)
- **2026-01-24 (Code Review #2)**: Final adversarial review after implementation
  - All 5 ACs verified as implemented
  - All tasks verified as complete with code evidence
  - Git changes match File List (0 discrepancies)
  - **Issues Found:** 1 CRITICAL (vitest config), 3 MEDIUM
  - **Fixes Applied:**
    - Fixed vitest ESM/CJS compatibility (downgraded to v2.1.9, removed @vitejs/plugin-react, use esbuild jsx)
    - Changed test environment from jsdom to happy-dom (better ESM support)
    - Added proper include/exclude patterns to vitest.config.ts
    - Added happy-dom dev dependency
  - **Tests:** All 14 unit tests pass (6 from this story)

### File List

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modified | Added @testing-library/react, @testing-library/jest-dom, happy-dom; downgraded vitest to v2.1.9 |
| `package-lock.json` | Modified | Lock file updated with new dependencies |
| `components/shared/ResumeUploader.tsx` | Created | Main upload component with drag-drop, visual feedback, file display |
| `components/shared/index.ts` | Created | Barrel export for shared components |
| `components/ui/button.tsx` | Created | shadcn Button component (via CLI) |
| `components/ui/card.tsx` | Created | shadcn Card component (via CLI) |
| `store/useOptimizationStore.ts` | Modified | Added pendingFile state, setPendingFile action, selectPendingFile selector |
| `app/page.tsx` | Modified | Integrated ResumeUploader component with store, added SubmitSmart branding |
| `tests/unit/3-1-resume-uploader.test.tsx` | Created | Unit tests: 6 tests (4 P0, 2 P1) covering all ACs |
| `tests/setup.ts` | Modified | Added @testing-library/jest-dom import |
| `vitest.config.ts` | Modified | Fixed ESM compatibility: happy-dom env, esbuild jsx, proper include/exclude patterns |

