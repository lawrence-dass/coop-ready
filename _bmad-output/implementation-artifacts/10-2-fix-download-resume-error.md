# Story 10.2: Fix Download Resume Error

**Epic:** Epic 10 - Quality Fixes & Claude Migration
**Story Key:** 10-2-fix-download-resume-error
**Status:** ready-for-dev
**Created:** 2026-01-22
**Priority:** High
**Dependencies:** None

---

## Story Summary

As a **user who wants to download my optimized resume**,
I want **the download functionality to work without errors**,
So that **I can use my improved resume for job applications**.

---

## Problem Statement

**Current Behavior:**
- User clicks "Continue to Download" button on preview page
- Application throws an error or shows blank page
- User cannot download their resume

**Root Cause:**
The download page route **does not exist**. Multiple places reference `/analysis/[scanId]/download` but the page file was never created:
- `PreviewFooter.tsx:18`: `router.push(/analysis/${scanId}/download)`
- `preview/page.tsx:111`: `href=/analysis/${params.scanId}/download`

**Evidence:**
```
/app/(dashboard)/analysis/[scanId]/
├── preview/        ✅ exists
├── suggestions/    ✅ exists
└── download/       ❌ MISSING
```

---

## Acceptance Criteria

### AC1: Download Page Exists and Loads
**Given** user navigates to `/analysis/[scanId]/download`
**When** page loads
**Then** download page renders without error
**And** page shows format selection options

**Test:** Navigate to download URL → Page renders correctly

---

### AC2: PDF Download Works
**Given** user selects PDF format
**When** download is triggered
**Then** PDF file downloads successfully
**And** filename is `{FirstName}_{LastName}_Resume_Optimized.pdf`
**And** file contains merged content with accepted suggestions

**Test:** Click PDF download → File downloads without error

---

### AC3: DOCX Download Works
**Given** user selects DOCX format
**When** download is triggered
**Then** DOCX file downloads successfully
**And** filename is `{FirstName}_{LastName}_Resume_Optimized.docx`
**And** file contains merged content with accepted suggestions

**Test:** Click DOCX download → File downloads without error

---

### AC4: No Suggestions Handling
**Given** user has not accepted any suggestions
**When** user reaches download page
**Then** warning message shows: "No Changes Accepted"
**And** options provided: "Download Original" or "Review Suggestions"

**Test:** 0 accepted suggestions → Warning + options displayed

---

### AC5: Download Tracking
**Given** user successfully downloads a file
**When** download completes
**Then** `scans.downloaded_at` is updated
**And** `scans.download_format` records the format used
**And** `scans.download_count` is incremented

**Test:** Download file → Check DB columns updated

---

### AC6: Error Handling
**Given** download generation fails (e.g., content too long)
**When** error occurs
**Then** user-friendly error message displayed
**And** retry option available
**And** error logged for debugging

**Test:** Simulate failure → Error message + retry shown

---

## Tasks & Subtasks

- [ ] **Task 1: Create Download Page** (AC: 1, 4)
  - [ ] 1.1 Create `/app/(dashboard)/analysis/[scanId]/download/page.tsx`
  - [ ] 1.2 Add page metadata (title, description)
  - [ ] 1.3 Fetch scan data with `validateDownloadAccess(scanId)`
  - [ ] 1.4 Check authentication and ownership
  - [ ] 1.5 Display format selection UI
  - [ ] 1.6 Handle no-suggestions case with warning

- [ ] **Task 2: Implement Download Logic** (AC: 2, 3)
  - [ ] 2.1 Create client component for download interactions
  - [ ] 2.2 Add PDF download button with loading state
  - [ ] 2.3 Add DOCX download button with loading state
  - [ ] 2.4 Call `generateResumePDF()` or `generateResumeDOCX()`
  - [ ] 2.5 Convert buffer to blob for browser download
  - [ ] 2.6 Trigger browser download with correct filename
  - [ ] 2.7 Show success toast on completion

- [ ] **Task 3: Add Download Tracking** (AC: 5)
  - [ ] 3.1 Call `trackDownload(scanId, format)` after successful download
  - [ ] 3.2 Verify DB columns update correctly
  - [ ] 3.3 Add analytics logging

- [ ] **Task 4: Error Handling** (AC: 6)
  - [ ] 4.1 Wrap download in try-catch
  - [ ] 4.2 Display user-friendly error messages
  - [ ] 4.3 Add retry button on failure
  - [ ] 4.4 Log errors for debugging
  - [ ] 4.5 Handle specific error codes (CONTENT_TOO_LONG, etc.)

- [ ] **Task 5: Testing** (AC: 1-6)
  - [ ] 5.1 Unit test: Download page renders
  - [ ] 5.2 Unit test: PDF generation
  - [ ] 5.3 Unit test: DOCX generation
  - [ ] 5.4 Integration test: Full download flow
  - [ ] 5.5 Test no-suggestions warning
  - [ ] 5.6 Test error states

---

## Technical Reference

### Existing Infrastructure (Ready to Use)

| File | Function | Status |
|------|----------|--------|
| `actions/download.ts` | `validateDownloadAccess()`, `trackDownload()` | ✅ Complete |
| `actions/export.ts` | `generateResumePDF()`, `generateResumeDOCX()` | ✅ Complete |
| `lib/generators/pdf.ts` | PDF rendering with @react-pdf/renderer | ✅ Complete |
| `lib/generators/docx.ts` | DOCX generation with docx package | ✅ Complete |
| `lib/generators/merge.ts` | Content merging logic | ✅ Complete |

### Download Page Structure

```typescript
// /app/(dashboard)/analysis/[scanId]/download/page.tsx

export default async function DownloadPage({ params }: { params: { scanId: string } }) {
  // 1. Validate access
  const validation = await validateDownloadAccess(params.scanId)
  if (validation.error) redirect('/dashboard')

  // 2. Get suggestion stats
  const { hasAcceptedSuggestions, acceptedCount, userName } = validation.data

  // 3. Render download UI
  return (
    <DownloadClient
      scanId={params.scanId}
      hasAcceptedSuggestions={hasAcceptedSuggestions}
      acceptedCount={acceptedCount}
      userName={userName}
    />
  )
}
```

### Browser Download Helper

```typescript
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
```

### Error Codes to Handle

| Code | Description | User Message |
|------|-------------|--------------|
| `CONTENT_TOO_LONG` | PDF > 500KB | "Resume content is too large. Try removing some sections." |
| `RENDER_ERROR` | Generation failed | "Download failed. Please try again." |
| `INVALID_DATA` | Bad resume data | "Resume data is invalid. Please re-upload." |
| `NOT_FOUND` | Scan not found | "Scan not found. Please start a new analysis." |

---

## Definition of Done

- [ ] Download page exists at `/analysis/[scanId]/download`
- [ ] PDF download works and file opens correctly
- [ ] DOCX download works and file opens correctly
- [ ] No-suggestions warning displays correctly
- [ ] Download tracking updates database
- [ ] Error handling with retry works
- [ ] Unit tests passing
- [ ] Integration test passing
- [ ] Manual QA: Complete download flow works

---

## Implementation Notes

**Why create a new page instead of a modal?**
- Consistent URL structure for navigation
- Can be bookmarked/shared
- Cleaner separation of concerns
- Preview page already links to this route

**Reuse DownloadContainer?**
- The existing `DownloadContainer` component has some logic but is used incorrectly on the analysis page
- Better to create a clean `DownloadClient` component for this page
- Move the format selection modal logic to the new component

---
