# Story 6.4: Download UI & Format Selection

**Status:** ready-for-dev
**Epic:** 6 - Resume Export & Download
**Dependencies:** Story 6-1 (merge engine), Story 6-2 (PDF generation), Story 6-3 (DOCX generation)
**Blocking:** None (final story in Epic 6)
**Related Stories:** 6-1 (merge), 6-2 (PDF), 6-3 (DOCX) - all converge here

---

## Problem Statement

Stories 6-1, 6-2, and 6-3 provide the technical infrastructure: merged content, PDF generation, and DOCX generation. But users have no UI to access these capabilities. They can't select a format or download their optimized resumes. We need a user-facing download interface that ties together all the backend generators.

---

## User Story

As a **user**,
I want **to choose my download format and download my optimized resume**,
So that **I get the file in my preferred format**.

---

## Acceptance Criteria

### AC1: Download UI on Scan Results Page
**Given** I am on the scan results page with completed analysis
**When** I scroll to the bottom
**Then** I see a prominent "Download Resume" button or section
**And** the button is easily accessible and visually distinct

### AC2: Format Selection Modal or Dropdown
**Given** I click "Download Resume"
**When** the format selection appears
**Then** I see two options: PDF and DOCX
**And** each option has a clear description (e.g., "PDF: Professional, read-only" vs "DOCX: Editable in Word")
**And** I can dismiss the selection without downloading

### AC3: PDF Format Selection
**Given** I select PDF format
**When** I click "Download"
**Then** the PDF is generated with merged content
**And** the file downloads with name "{FirstName}_{LastName}_Resume_Optimized.pdf"
**And** I see a success toast message "Resume downloaded!"

### AC4: DOCX Format Selection
**Given** I select DOCX format
**When** I click "Download"
**Then** the DOCX is generated with merged content
**And** the file downloads with name "{FirstName}_{LastName}_Resume_Optimized.docx"
**And** I see a success toast message "Resume downloaded!"

### AC5: Loading State During Generation
**Given** generation is in progress
**When** I am waiting
**Then** the download button shows a loading spinner
**And** the button is disabled to prevent multiple clicks
**And** estimated time or "generating..." text is shown
**And** loading state clears when complete or error occurs

### AC6: Error Handling & Retry
**Given** generation fails for any reason
**When** error handling runs
**Then** I see an error message: "Download failed. Please try again."
**And** I see a "Retry" button
**And** clicking retry attempts generation again
**And** the error message includes helpful context if available

### AC7: No Accepted Suggestions Warning
**Given** I have no accepted suggestions (all rejected or none made)
**When** I click "Download Resume"
**Then** I see a warning: "No changes accepted. Download original resume?"
**And** I have two options: "Download Original" or "Review Suggestions"
**And** "Download Original" provides the unmodified parsed resume
**And** "Review Suggestions" takes me back to the suggestions page

### AC8: Mobile Responsiveness
**Given** I am on mobile (iOS or Android)
**When** I use the download UI
**Then** the format selection adapts to mobile (modal or bottom sheet)
**And** download works correctly on iOS Safari, Chrome
**And** download works correctly on Android Chrome
**And** file is saved to device's downloads folder

### AC9: Download Analytics Tracking
**Given** I successfully download a resume
**When** the download completes
**Then** the download is tracked in the database
**And** scans table is updated with: `downloaded_at` timestamp, `download_format` (pdf or docx)
**And** this data can be used for user analytics

### AC10: Accessibility
**Given** I am using a screen reader
**When** I interact with download UI
**Then** button labels are clear and descriptive
**And** modal/dropdown has proper ARIA labels
**And** loading state is announced to assistive tech
**And** error messages are read by screen reader

---

## Technical Implementation

### Architecture Context

**Input:** Current scanId from URL params (`/analysis/[scanId]/...`)
**Output:** File download to browser
**Dependencies:**
- `generateMergedResume()` from Story 6-1 (provides merged data)
- `generateResumePDF()` from Story 6-2 (PDF generation)
- `generateResumeDOCX()` from Story 6-3 (DOCX generation)

**Performance:** Total time (merge + generation + download) should be < 5 seconds
**Location:** Scan results page or dedicated download page

### New Files to Create

#### 1. Component: `components/download/DownloadButton.tsx` (Client)

```typescript
export interface DownloadButtonProps {
  scanId: string
  userName: string
  hasAcceptedSuggestions: boolean
  onDownloadStart?: () => void
  onDownloadComplete?: (format: 'pdf' | 'docx') => void
  onError?: (error: Error) => void
}

export function DownloadButton(props: DownloadButtonProps): React.ReactElement
```

**Responsibilities:**
- Render button with clear call-to-action
- Handle click to open format selection
- Show loading state while generating
- Display success/error messages
- Implement retry logic on error

#### 2. Component: `components/download/FormatSelectionModal.tsx` (Client)

```typescript
export interface FormatSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (format: 'pdf' | 'docx') => void
  isLoading: boolean
}

export function FormatSelectionModal(props: FormatSelectionModalProps): React.ReactElement
```

**Responsibilities:**
- Display format options (PDF + DOCX)
- Show descriptions for each format
- Handle format selection
- Show loading state during generation
- Display cancel button

#### 3. Component: `components/download/DownloadContainer.tsx` (Client)

```typescript
export interface DownloadContainerProps {
  scanId: string
  userName: string
  hasAcceptedSuggestions: boolean
}

export function DownloadContainer(props: DownloadContainerProps): React.ReactElement
```

**Responsibilities:**
- Manage download state (loading, error, success)
- Coordinate DownloadButton and FormatSelectionModal
- Handle file download via browser API
- Display toasts for feedback
- Track analytics

#### 4. Hook: `hooks/useResumeDowload.ts`

```typescript
export interface UseResumeDownloadOptions {
  onSuccess?: (format: 'pdf' | 'docx') => void
  onError?: (error: Error) => void
}

export function useResumeDownload(
  scanId: string,
  userName: string,
  options?: UseResumeDownloadOptions
): {
  download: (format: 'pdf' | 'docx') => Promise<void>
  isLoading: boolean
  error: Error | null
  retry: () => Promise<void>
}
```

**Responsibilities:**
- Manage download state and loading
- Call appropriate server action (PDF or DOCX)
- Handle file blob and trigger browser download
- Error handling and retry logic
- Track downloads in database

#### 5. Server Action Update: `actions/download.ts` (NEW)

```typescript
// Track download in database
export async function trackDownload(
  scanId: string,
  format: 'pdf' | 'docx'
): Promise<ActionResponse<{
  downloadedAt: string
  format: string
}>>

// Validate user can download this scan
export async function validateDownloadAccess(
  scanId: string
): Promise<ActionResponse<{
  canDownload: boolean
  hasAcceptedSuggestions: boolean
  userName: string
}>>
```

**Responsibilities:**
- Validate user owns the scan
- Check if any suggestions were accepted
- Update `scans` table with download metadata
- Return validation result

### Implementation Approach

**UI Flow:**

```
Scan Results Page
      ↓
   [Download Resume] button
      ↓
User clicks → Format Selection Modal appears
      ↓
    ┌─────────────────────────────┐
    │ PDF (Professional, read-only)│
    │ DOCX (Editable in Word)     │
    │ [Cancel]                    │
    └─────────────────────────────┘
      ↓
User selects format
      ↓
Loading spinner shown
      ↓
   generateMergedResume()
   generateResumePDF() or generateResumeDOCX()
      ↓
File blob returned → Browser downloads file
      ↓
Success toast: "Resume downloaded!"
```

**Component Architecture:**

```
DownloadContainer
├── DownloadButton (display + click handler)
├── FormatSelectionModal (format choices)
├── useResumeDownload hook (logic + state)
└── Toast notifications (feedback)
```

**Data Flow:**

```typescript
// 1. User clicks download
// 2. Container opens FormatSelectionModal
// 3. User selects format
// 4. useResumeDownload.download() called
// 5. Validate access (validateDownloadAccess)
// 6. Call generateMergedResume() (from Story 6-1)
// 7. Call generateResumePDF() or generateResumeDOCX() (6-2 or 6-3)
// 8. Receive file blob
// 9. Track download (trackDownload)
// 10. Trigger browser download
// 11. Show success toast
```

### Implementation Steps (for dev-story workflow)

1. **Create Download Actions**
   - `actions/download.ts` with validation and tracking functions
   - Coordinate with existing export actions from 6-2, 6-3

2. **Create Hook: `useResumeDownload.ts`**
   - State management (loading, error, retry)
   - Call server actions in sequence
   - Handle file blob download
   - Error handling with retry

3. **Create UI Components**
   - `DownloadButton.tsx` - Simple button with click handler
   - `FormatSelectionModal.tsx` - Modal with PDF/DOCX options
   - `DownloadContainer.tsx` - Orchestrator component

4. **Integrate with Scan Results Page**
   - Add DownloadContainer to scan results layout
   - Position prominently (bottom of page or side panel)
   - Pass scanId and userName as props

5. **Add Tests**
   - Unit tests: Component rendering, user interactions
   - Unit tests: Hook state management, error handling
   - Integration tests: Full download flow (button → format → file)
   - Integration tests: Analytics tracking
   - Accessibility tests: Screen reader, keyboard nav

6. **Validation**
   - Test both PDF and DOCX downloads
   - Mobile responsiveness (iOS/Android)
   - Error scenarios (network, generation failure)
   - Analytics data saved correctly
   - Accessibility with screen reader

---

## Page Placement Options

### Option A: Scan Results Page (Recommended)
- Add DownloadContainer to bottom of scan results
- After "View Suggestions" → "Preview Resume" flow
- Prominent position makes it discoverable
- Natural placement in user journey

### Option B: Dedicated Download Page
- Create `/analysis/[scanId]/download` route
- Button links to dedicated page
- More space for additional options/info
- Separates concerns

**Recommendation:** Option A (scan results page) for seamless UX - user can see results, accept/reject suggestions, preview, and download all on same page.

---

## Data Model Reference

### Scans Table Updates

**New/Updated Columns:**
```typescript
interface Scan {
  // Existing columns
  id: string
  user_id: string
  resume_data: ParsedResume

  // NEW: Download tracking
  downloaded_at: string | null        // Timestamp of last download
  download_format: 'pdf' | 'docx' | null  // Format of last download
  download_count: number              // Total downloads
}
```

### Download Event Logging (Optional)

For detailed analytics:
```typescript
interface DownloadEvent {
  id: string
  scan_id: string
  user_id: string
  format: 'pdf' | 'docx'
  timestamp: string
  download_time_ms: number           // How long generation took
  file_size_bytes: number            // Final file size
}
```

---

## Project Context & Constraints

**From project-context.md:**
- Server Actions: Return `{ data: T, error: null }` or `{ data: null, error: {...} }`
- Use `useTransition` for loading states in client components
- Zod validation for all inputs
- Mobile-first responsive design

**From Architecture:**
- Resume data flows: Parse → Analyze → Suggest → Merge → Export
- Download UI is final consumer of merge + generators
- Performance target: < 5 seconds total (merge + generation + download)

**From Epic 6:**
- Format options: PDF and DOCX only (no additional formats)
- User can download original if no suggestions accepted
- Track download for analytics
- Support mobile downloads

---

## Testing Strategy

### Unit Tests: `tests/unit/download-ui.test.ts`

```typescript
describe('Download UI Components', () => {
  describe('DownloadButton', () => {
    it('renders button with correct text', () => { ... })
    it('opens FormatSelectionModal on click', () => { ... })
    it('shows loading spinner when isLoading=true', () => { ... })
    it('disables button during download', () => { ... })
  })

  describe('FormatSelectionModal', () => {
    it('displays PDF and DOCX options', () => { ... })
    it('calls onSelect with correct format', () => { ... })
    it('shows loading state during generation', () => { ... })
    it('handles cancel/close correctly', () => { ... })
  })

  describe('useResumeDownload Hook', () => {
    it('manages loading state', () => { ... })
    it('calls validateDownloadAccess', () => { ... })
    it('calls correct generator (PDF or DOCX)', () => { ... })
    it('triggers browser download', () => { ... })
    it('handles errors with retry', () => { ... })
    it('tracks download in database', () => { ... })
  })
})
```

### Integration Tests: `tests/integration/download-flow.test.ts`

```typescript
describe('Download Flow Integration', () => {
  it('full PDF download flow', () => { ... })
  it('full DOCX download flow', () => { ... })
  it('handles no accepted suggestions warning', () => { ... })
  it('error handling with retry', () => { ... })
  it('analytics tracking on success', () => { ... })
  it('validateDownloadAccess checks user ownership', () => { ... })
  it('trackDownload updates scans table', () => { ... })
  it('mobile download works correctly', () => { ... })
})
```

### Manual QA Checklist

- [ ] Download button visible on scan results page
- [ ] Click download → format selection modal appears
- [ ] Select PDF → PDF generated and downloads
- [ ] Select DOCX → DOCX generated and downloads
- [ ] Downloaded files have correct names
- [ ] Loading spinner shows during generation
- [ ] Success toast appears on download complete
- [ ] Test error handling (simulate generation failure)
- [ ] Retry button works on error
- [ ] No suggestions accepted → warning message appears
- [ ] Download original on warning
- [ ] Test on mobile (iOS Safari, Android Chrome)
- [ ] Database updated with download timestamp and format
- [ ] Analytics data correct

---

## File Changes Summary

| File | Change | Type |
|------|--------|------|
| `components/download/DownloadButton.tsx` | NEW | UI component |
| `components/download/FormatSelectionModal.tsx` | NEW | UI component |
| `components/download/DownloadContainer.tsx` | NEW | Container component |
| `components/download/index.ts` | NEW | Barrel export |
| `hooks/useResumeDownload.ts` | NEW | Custom hook |
| `actions/download.ts` | NEW | Server actions |
| `app/(dashboard)/analysis/[scanId]/page.tsx` | MODIFY | Add DownloadContainer |
| `tests/unit/download-ui.test.ts` | NEW | Unit tests |
| `tests/integration/download-flow.test.ts` | NEW | Integration tests |

---

## Dev Notes

### Key Points to Remember

1. **User Ownership:** Always validate that current user owns the scan before allowing download. Check via `generateMergedResume()` which already does auth checks.

2. **File Delivery:** Use browser's `fetch` or `XMLHttpRequest` to download blob as file. Standard pattern:
```typescript
const blob = new Blob([buffer], { type: mimeType })
const url = URL.createObjectURL(blob)
const link = document.createElement('a')
link.href = url
link.download = fileName
link.click()
URL.revokeObjectURL(url)
```

3. **Loading State:** Use `useTransition` from React to manage async state. Show spinner while `isPending`.

4. **Error Messages:** Be specific (e.g., "PDF generation failed: Content too long for one page").

5. **Analytics:** Track both success and failure in database for insights into feature usage.

6. **Mobile:** Test on actual mobile devices. File downloads behave differently on mobile.

### Common Pitfalls to Avoid

- ❌ Not validating user ownership
- ❌ Not showing loading state (user doesn't know it's working)
- ❌ Generic error messages (no helpful context)
- ❌ Not handling multiple rapid clicks (disable button)
- ❌ Breaking file downloads on mobile (iOS quirks)
- ❌ Forgetting to revoke blob URLs (memory leak)
- ❌ Not tracking analytics

### Mobile Download Considerations

**iOS:**
- File download might open in-app preview
- Long filenames can get truncated
- Test in Safari, Chrome, Firefox

**Android:**
- Downloads go to Downloads folder
- Ask for storage permissions if needed
- Test in Chrome, Firefox

### Retry Logic

When user clicks retry:
1. Close error state
2. Disable button (show spinner)
3. Repeat download flow from start
4. Don't retry individual steps - restart entire flow

### References

- **Merge Engine:** Story 6-1 - `generateMergedResume()`
- **PDF Generator:** Story 6-2 - `generateResumePDF()`
- **DOCX Generator:** Story 6-3 - `generateResumeDOCX()`
- **Project Utils:** `lib/utils/download.ts` (if creating shared download helpers)
- **Toast Library:** Likely using `sonner` or `react-toastify`
- **Accessibility:** https://www.w3.org/WAI/tutorials/forms/

---

## Acceptance Criteria Mapping

| AC # | Dev Task | Validation |
|------|----------|-----------|
| AC1 | Add DownloadButton to scan results | Button visible and clickable |
| AC2 | Create FormatSelectionModal | Modal shows PDF/DOCX with descriptions |
| AC3 | PDF download flow | PDF generated and downloads with correct name |
| AC4 | DOCX download flow | DOCX generated and downloads with correct name |
| AC5 | Loading state | Spinner shown, button disabled during generation |
| AC6 | Error handling | Error message shown, retry button works |
| AC7 | No suggestions warning | Warning shown when no accepted suggestions |
| AC8 | Mobile support | Works on iOS Safari, Android Chrome |
| AC9 | Analytics tracking | Database updated with download_at, download_format |
| AC10 | Accessibility | Screen reader support, proper ARIA labels |

---

## Completion Checklist

- [ ] `components/download/DownloadButton.tsx` created
- [ ] `components/download/FormatSelectionModal.tsx` created
- [ ] `components/download/DownloadContainer.tsx` created
- [ ] `hooks/useResumeDownload.ts` created with state management
- [ ] `actions/download.ts` created with validation and tracking
- [ ] Download UI integrated into scan results page
- [ ] PDF download flow working (Story 6-2 integration)
- [ ] DOCX download flow working (Story 6-3 integration)
- [ ] Loading states working with useTransition
- [ ] Error handling with retry logic
- [ ] No suggestions → warning message
- [ ] Mobile responsiveness tested
- [ ] Analytics tracking working (database updated)
- [ ] Unit tests pass (components, hooks)
- [ ] Integration tests pass (full download flows)
- [ ] Manual QA complete (desktop + mobile, both formats)
- [ ] Accessibility validated (screen reader, keyboard nav)
- [ ] No TypeScript errors

---

## Blockers & Dependencies

**None blocking THIS story** (final in Epic 6)

**Dependencies ON this story:**
- Nothing (end of Epic 6)

**Ready for:**
- Epic 7 (Subscription & Billing) - may integrate with downloads
- Epic 9 (Logic Refinement) - may use download data

---

**Created:** 2026-01-22
**Ready for Development:** Yes
