# Story 3.6: New Scan Page Integration

Status: ready-for-dev

## Story

As a **user**,
I want **a single page to upload my resume and enter a job description**,
So that **I can initiate a scan with one streamlined experience**.

## Acceptance Criteria

**AC1: Scan Page Layout**
- **Given** I am logged in and have completed onboarding
- **When** I click "New Scan" from the dashboard or sidebar
- **Then** I am taken to `/scan/new`
- **And** I see the resume upload component (left/top)
- **And** I see the job description input component (right/bottom)
- **And** I see a "Start Analysis" button (disabled until both inputs are valid)

**AC2: Step-by-Step Workflow**
- **Given** I have uploaded a resume but not entered a JD
- **When** I look at the "Start Analysis" button
- **Then** it is disabled
- **And** I see a hint "Enter a job description to continue"

**AC3: Complete Workflow**
- **Given** I have entered a JD but not uploaded a resume
- **When** I look at the "Start Analysis" button
- **Then** it is disabled
- **And** I see a hint "Upload your resume to continue"

**AC4: Analysis Start**
- **Given** I have both a valid resume and valid JD
- **When** I click "Start Analysis"
- **Then** a new scan record is created in the database
- **And** the scan status is set to "pending"
- **And** I am redirected to `/scan/[scanId]` to view results
- **And** I see a loading state indicating analysis is in progress

**AC5: Resume Persistence**
- **Given** I previously uploaded a resume in this session
- **When** I return to the new scan page
- **Then** I see my previously uploaded resume still selected
- **And** I can choose to use it or upload a different one

**AC6: Responsive Design**
- **Given** I am on the new scan page
- **When** I view the layout
- **Then** resume upload is on the left/top (desktop/mobile)
- **And** JD input is on the right/bottom
- **And** the design follows the card-based layout
- **And** buttons are accessible and properly sized

## Tasks / Subtasks

- [ ] **Task 1: Create Scan Page Layout** (AC: 1, 6)
  - [ ] 1.1 Create or update `app/(dashboard)/scan/new/page.tsx`
  - [ ] 1.2 Implement responsive two-column layout (desktop) / stacked (mobile)
  - [ ] 1.3 Add header/title: "Start New Scan"
  - [ ] 1.4 Use Card components for resume and JD sections
  - [ ] 1.5 Add section labels and visual hierarchy
  - [ ] 1.6 Responsive grid: `grid-cols-1 lg:grid-cols-2`
  - [ ] 1.7 Add test IDs: `scan-new-page`, `resume-section`, `jd-section`

- [ ] **Task 2: Integrate ResumeUpload Component** (AC: 1, 2, 5)
  - [ ] 2.1 Import ResumeUpload component from 3.1
  - [ ] 2.2 Display in left/top column
  - [ ] 2.3 Track uploaded resume state
  - [ ] 2.4 Show resume file name after upload
  - [ ] 2.5 Allow replace/remove functionality
  - [ ] 2.6 Store resume ID in component state

- [ ] **Task 3: Integrate JDInput Component** (AC: 1, 3)
  - [ ] 3.1 Import JDInput component from 3.5
  - [ ] 3.2 Display in right/bottom column
  - [ ] 3.3 Track job description state
  - [ ] 3.4 Real-time validation feedback
  - [ ] 3.5 Character counter visible
  - [ ] 3.6 Keyword preview visible

- [ ] **Task 4: Create Form State Management** (AC: 1-5)
  - [ ] 4.1 Use React state to track:
    - Resume: id, fileName, isLoading, error
    - JobDescription: text, isValid, error
  - [ ] 4.2 Combine validation states
  - [ ] 4.3 Track overall form validity
  - [ ] 4.4 Handle file upload completion
  - [ ] 4.5 Store data in component or use Context

- [ ] **Task 5: Implement Submit Button** (AC: 1-4)
  - [ ] 5.1 Create "Start Analysis" button
  - [ ] 5.2 Button disabled until both inputs valid
  - [ ] 5.3 Show contextual hints when disabled:
    - "Upload your resume to continue"
    - "Enter a job description to continue"
  - [ ] 5.4 Loading state during submission
  - [ ] 5.5 Add test ID: `start-analysis-button`

- [ ] **Task 6: Create Scan Submission Handler** (AC: 4)
  - [ ] 6.1 On button click, call `createScan` action
  - [ ] 6.2 Pass resumeId and jobDescription
  - [ ] 6.3 Handle loading state (disable button, show spinner)
  - [ ] 6.4 On success: redirect to `/scan/[scanId]`
  - [ ] 6.5 On error: show error toast with message
  - [ ] 6.6 Use `useTransition` for pending state

- [ ] **Task 7: Implement Resume Persistence** (AC: 5)
  - [ ] 7.1 Store last uploaded resume in session/localStorage
  - [ ] 7.2 On page load, check for previous resume
  - [ ] 7.3 If found, pre-populate ResumeUpload component
  - [ ] 7.4 Show "Previous upload: filename" with option to change
  - [ ] 7.5 Session storage (not persistent across browser close)

- [ ] **Task 8: Add Navigation** (AC: 1)
  - [ ] 8.1 Ensure "New Scan" link in sidebar/dashboard
  - [ ] 8.2 Link to `/scan/new`
  - [ ] 8.3 Add breadcrumb: Dashboard > New Scan
  - [ ] 8.4 Add back button to go to dashboard
  - [ ] 8.5 Add test IDs for navigation

- [ ] **Task 9: Add Page Protection** (AC: 1)
  - [ ] 9.1 Verify user is authenticated
  - [ ] 9.2 Verify user has completed onboarding
  - [ ] 9.3 Redirect to onboarding if not completed
  - [ ] 9.4 Redirect to login if not authenticated
  - [ ] 9.5 Use existing auth middleware

- [ ] **Task 10: Create E2E Tests** (AC: 1-6)
  - [ ] 10.1 Create `tests/e2e/scan-new-page.spec.ts`
  - [ ] 10.2 Test AC1: Page layout and components display
  - [ ] 10.3 Test AC2: Button disabled without resume
  - [ ] 10.4 Test AC3: Button disabled without JD
  - [ ] 10.5 Test AC4: Start analysis flow (upload → enter JD → submit)
  - [ ] 10.6 Test AC5: Resume persistence across reloads
  - [ ] 10.7 Test AC6: Responsive layout on mobile/desktop

- [ ] **Task 11: Final Verification** (AC: 1-6)
  - [ ] 11.1 Run `npm run build` to verify no errors
  - [ ] 11.2 Run `npm run lint` to verify no linting errors
  - [ ] 11.3 Verify E2E tests pass
  - [ ] 11.4 Manual test: Complete flow from upload to analysis
  - [ ] 11.5 Manual test: Verify button hints work correctly
  - [ ] 11.6 Manual test: Test on mobile and desktop

## Dev Notes

### Architecture Compliance

**Page Structure:**
```
app/(dashboard)/scan/new/page.tsx
├── Protected route (auth + onboarding check)
├── Header with title and breadcrumb
├── Two-column layout (responsive)
│   ├── Left/Top: ResumeUpload component
│   └── Right/Bottom: JDInput component
└── Footer: Start Analysis button with hints
```

**Component Integration:**
```typescript
// app/(dashboard)/scan/new/page.tsx
'use client'

export default function NewScanPage() {
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  const isFormValid = resumeId && jobDescription.length > 0

  const handleSubmit = () => {
    startTransition(async () => {
      const { data, error } = await createScan({
        resumeId,
        jobDescription
      })
      if (error) {
        toast.error(error.message)
        return
      }
      router.push(`/scan/${data.id}`)
    })
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResumeUpload onUploadComplete={setResumeId} />
        <JDInput onChange={setJobDescription} />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!isFormValid || isPending}
      >
        {isPending ? 'Starting...' : 'Start Analysis'}
      </Button>
    </div>
  )
}
```

### Naming Conventions (STRICT)

| Context | Convention | Example |
|---------|------------|---------|
| Route segments | kebab-case | `/scan/new`, `/scan/[scanId]` |
| State variables | camelCase | `resumeId`, `jobDescription` |
| Handler functions | camelCase | `handleSubmit`, `onUploadComplete` |
| Page component | PascalCase | `NewScanPage` |

### Technical Requirements

**Button Hints:**
- "Upload your resume to continue" (when no resume)
- "Enter a job description to continue" (when no JD)
- "Both fields required" (when neither)

**Loading State:**
- Button disabled during submission
- Spinner inside button
- Show "Starting..." text
- Prevent double-click

**Responsive Breakpoints:**
- Mobile (< 1024px): Stacked vertically
- Desktop (≥ 1024px): Two columns side-by-side
- Use Tailwind `lg:` breakpoint

**Resume Persistence:**
- Store in `sessionStorage` (cleared on browser close)
- Key: `lastUploadedResumeId`
- Show: "Use previous upload: filename.pdf [Change]"

### Project Structure

**Files to Create/Modify:**
```
app/(dashboard)/scan/
├── new/
│   └── page.tsx           # CREATE or UPDATE - Main scan page
├── layout.tsx             # May need for consistent layout
└── [scanId]/
    └── page.tsx           # Already exists (results page)

tests/e2e/
└── scan-new-page.spec.ts  # CREATE - E2E tests

_bmad-output/implementation-artifacts/sprint-status.yaml  # UPDATE
```

### Previous Story Intelligence

**From Stories 3.1-3.5:**
1. ResumeUpload component - Handles file upload, validation, progress
2. JDInput component - Handles text input, character counter, validation
3. ResumePreview component - Shows uploaded resume preview (3.4)
4. createScan action - Creates scan record (3.5)
5. All components use ActionResponse pattern and error handling

**Reusable Components:**
- ResumeUpload (from 3.1)
- JDInput (from 3.5)
- ResumePreview (from 3.4) - Optional, could be shown on this page
- Button, Card, Input (shadcn/ui)
- Toast notifications (sonner)

**Established Patterns:**
- useTransition for async operations
- ActionResponse for server actions
- Toast for user feedback
- Responsive design with Tailwind

### Latest Technical Information (2026)

**Form UX:**
- Two-column layout on desktop, stacked on mobile
- Card-based sections for visual separation
- Clear progress indication
- Disabled state feedback with helpful hints

**State Management:**
- Local component state sufficient (no Context needed)
- useTransition for async operations
- Session storage for resume persistence (not localStorage for privacy)

**Navigation:**
- Use `useRouter().push()` for programmatic navigation
- Preserve query params if needed
- Show loading state during navigation

### Conversion Notes

**API Calls:**
```typescript
// Input to createScan action
{
  resumeId: "uuid",
  jobDescription: "Senior React Developer..."
}

// Response
{
  data: {
    id: "scan-uuid",
    userId: "user-uuid",
    resumeId: "resume-uuid",
    jobDescription: "...",
    status: "pending",
    createdAt: "2026-01-20T..."
  },
  error: null
}
```

### References

- [Source: epic-3-resume-job-description-input.md#Story 3.6] - Requirements
- [Source: 3-1-resume-upload-with-validation.md] - ResumeUpload component
- [Source: 3-5-job-description-input.md] - JDInput component
- [Source: project-context.md] - ActionResponse, naming conventions
- [Source: actions/scan.ts] - createScan action from 3.5

---

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Story Creation Context

**Workflow Engine:** BMAD create-story workflow
**Execution Date:** 2026-01-20
**Branch:** feat/3-6-new-scan-page-integration
**Epic Status:** in-progress

### Next Steps (for Dev Agent)

1. Create/update scan/new/page.tsx with layout
2. Integrate ResumeUpload component
3. Integrate JDInput component
4. Implement form state management
5. Create submit handler with createScan action
6. Implement resume persistence (sessionStorage)
7. Add page protection (auth + onboarding check)
8. Write E2E tests
9. Final verification

### File List

**Will be created during dev-story:**
- `tests/e2e/scan-new-page.spec.ts`
- May create: `app/(dashboard)/scan/layout.tsx` if needed

**Will be modified:**
- `app/(dashboard)/scan/new/page.tsx` - Update with full implementation
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

**No new files needed for:**
- ResumeUpload - Already exists (3.1)
- JDInput - Already exists (3.5)
- createScan - Already exists (3.5)

---

_Story created by BMAD create-story workflow - Ready for dev-story execution_
_Last updated: 2026-01-20_
