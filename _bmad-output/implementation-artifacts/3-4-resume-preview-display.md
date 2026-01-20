# Story 3.4: Resume Preview Display

Status: ready-for-dev

## Story

As a **user**,
I want **to view my extracted resume content before analysis**,
So that **I can verify the content was captured correctly**.

## Acceptance Criteria

**AC1: Resume Preview with Sections**
- **Given** my resume has been uploaded and processed (extraction + parsing complete)
- **When** I view the resume preview
- **Then** I see my resume content organized by section
- **And** each section (Contact, Education, Experience, Skills, Projects) is clearly labeled
- **And** the content matches what's in my original resume

**AC2: Experience Section Display**
- **Given** I am viewing the resume preview
- **When** I look at the Experience section
- **Then** I see each job entry with company, title, and dates
- **And** bullet points are displayed in a readable format
- **And** section is expandable/collapsible

**AC3: Skills Section Display**
- **Given** I am viewing the resume preview
- **When** I look at the Skills section
- **Then** I see my skills listed clearly
- **And** technical skills are visually distinguished from soft skills
- **And** skills are displayed as chips or tags

**AC4: Error State Display**
- **Given** extraction or parsing failed
- **When** I view the preview area
- **Then** I see the error message explaining what went wrong
- **And** I see an option to re-upload my resume
- **And** I see a clear call-to-action to retry

**AC5: Loading State Display**
- **Given** processing is still in progress
- **When** I view the preview area
- **Then** I see a loading skeleton or spinner
- **And** the UI updates automatically when processing completes
- **And** no errors appear for in-progress operations

**AC6: Proceed Button Control**
- **Given** resume has been successfully extracted and parsed
- **When** I view the preview
- **Then** I see an enabled "Proceed to Analysis" button
- **And** clicking proceeds to next step (job description input or analysis)

## Tasks / Subtasks

- [ ] **Task 1: Create ResumePreview Component** (AC: 1, 2, 3)
  - [ ] 1.1 Create `components/analysis/ResumePreview.tsx`
  - [ ] 1.2 Accept props: `resumeId`, `resume` (with parsed data), `isLoading`, `error`
  - [ ] 1.3 Display all sections: Contact, Summary, Education, Experience, Skills, Projects
  - [ ] 1.4 Use expandable Card components for each section
  - [ ] 1.5 Add section headers with icons (lucide-react)
  - [ ] 1.6 Add test IDs for each section

- [ ] **Task 2: Implement Experience Section Component** (AC: 2)
  - [ ] 2.1 Create sub-component `ExperiencePreview.tsx`
  - [ ] 2.2 Display each job as a card or list item
  - [ ] 2.3 Show: company, title, dates, bullet points
  - [ ] 2.4 Format dates clearly: "June 2021 - Present"
  - [ ] 2.5 Display bullet points with visual indicators (-)
  - [ ] 2.6 Add test IDs

- [ ] **Task 3: Implement Skills Section Component** (AC: 3)
  - [ ] 3.1 Create sub-component `SkillsPreview.tsx`
  - [ ] 3.2 Display skills as chips/tags (use Badge from shadcn/ui)
  - [ ] 3.3 Use different colors for technical vs soft skills
  - [ ] 3.4 Make skills visually scannable
  - [ ] 3.5 Handle many skills gracefully (wrap, scroll, or pagination)
  - [ ] 3.6 Add test IDs

- [ ] **Task 4: Implement Loading State** (AC: 5)
  - [ ] 4.1 Create LoadingPreview component with skeletons
  - [ ] 4.2 Use shadcn Skeleton component
  - [ ] 4.3 Show skeleton for each section
  - [ ] 4.4 Display loading message: "Processing your resume..."
  - [ ] 4.5 Add animation/pulsing effect
  - [ ] 4.6 Add test ID

- [ ] **Task 5: Implement Error State** (AC: 4)
  - [ ] 5.1 Create ErrorPreview component
  - [ ] 5.2 Display error message from extraction_error or parsing_error
  - [ ] 5.3 Show error icon (alert/warning)
  - [ ] 5.4 Add "Re-upload Resume" button linking back to upload
  - [ ] 5.5 Show error type: "Extraction Failed", "Parsing Failed", etc.
  - [ ] 5.6 Add test IDs

- [ ] **Task 6: Create Preview Container/Page** (AC: 1-6)
  - [ ] 6.1 Create `app/(dashboard)/scan/preview/page.tsx` or modal
  - [ ] 6.2 Fetch resume data with parsed_sections and status
  - [ ] 6.3 Render ResumePreview with appropriate state (loading/error/success)
  - [ ] 6.4 Handle auto-refresh while parsing_status='pending'
  - [ ] 6.5 Implement polling or real-time updates (consider Supabase realtime)
  - [ ] 6.6 Add protection: redirect if not authenticated or resume not found

- [ ] **Task 7: Integration with Scan Flow** (AC: 1-6)
  - [ ] 7.1 Update `app/(dashboard)/scan/new/page.tsx` to show preview after upload
  - [ ] 7.2 Display ResumePreview after resume is uploaded
  - [ ] 7.3 Show preview status (loading → success/error)
  - [ ] 7.4 Add "Proceed" button (leads to JD input or directly to analysis)
  - [ ] 7.5 Handle back/cancel to re-upload

- [ ] **Task 8: Styling & UX Polish** (AC: 1-6)
  - [ ] 8.1 Use Tailwind + shadcn/ui for consistent styling
  - [ ] 8.2 Responsive layout (mobile-friendly)
  - [ ] 8.3 Color coding for skill types (technical vs soft)
  - [ ] 8.4 Icons for sections (briefcase, graduation cap, etc.)
  - [ ] 8.5 Proper spacing and typography
  - [ ] 8.6 Loading animations smooth and professional

- [ ] **Task 9: Create E2E Tests** (AC: 1-6)
  - [ ] 9.1 Create `tests/e2e/resume-preview.spec.ts`
  - [ ] 9.2 Test AC1: Preview displays all sections with correct data
  - [ ] 9.3 Test AC2: Experience section shows job entries correctly
  - [ ] 9.4 Test AC3: Skills section shows technical/soft skills distinguished
  - [ ] 9.5 Test AC4: Error state displays error message and re-upload button
  - [ ] 9.6 Test AC5: Loading state shows skeleton during processing
  - [ ] 9.7 Test AC6: Proceed button is enabled when parsing complete

- [ ] **Task 10: Final Verification** (AC: 1-6)
  - [ ] 10.1 Run `npm run build` to verify no errors
  - [ ] 10.2 Run `npm run lint` to verify no linting errors
  - [ ] 10.3 Verify E2E tests pass
  - [ ] 10.4 Manual test: Upload resume → view preview → verify sections display correctly
  - [ ] 10.5 Manual test: Verify skills are distinguished (technical vs soft)
  - [ ] 10.6 Manual test: Verify error/loading states work correctly

## Dev Notes

### Architecture Compliance

**Component Structure:**
```
components/analysis/
├── ResumePreview.tsx         # Main component
├── ExperiencePreview.tsx     # Experience section sub-component
├── SkillsPreview.tsx         # Skills section sub-component
└── ErrorPreview.tsx          # Error state component
```

**Server-Side Rendering:**
```typescript
// app/(dashboard)/scan/preview/page.tsx or integrated into scan/new/page.tsx
export default async function PreviewPage() {
  const resume = await getResume(resumeId)  // includes parsed_sections and status
  return <ResumePreview resume={resume} />
}
```

**Client State Management:**
```typescript
// Use useEffect to poll for updates while parsing_status='pending'
useEffect(() => {
  if (resume.parsing_status === 'pending') {
    const timer = setInterval(() => refetchResume(), 2000)
    return () => clearInterval(timer)
  }
}, [resume.parsing_status])
```

### Naming Conventions (STRICT)

| Context | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `ResumePreview.tsx`, `ExperiencePreview.tsx` |
| Props | camelCase | `resumeData`, `isLoading`, `onProceed` |
| Data fields | camelCase (API) | `parsedSections`, `parsingStatus` |

### Technical Requirements

**Component Props:**
```typescript
interface ResumePreviewProps {
  resume: {
    id: string
    fileName: string
    extractionStatus: 'completed' | 'failed' | 'pending'
    extractionError?: string
    parsingStatus: 'completed' | 'failed' | 'pending'
    parsingError?: string
    parsedSections?: {
      contact: string
      summary: string
      experience: JobEntry[]
      education: EducationEntry[]
      skills: Skill[]
      projects: string
      other: string
    }
  }
  isLoading?: boolean
  onProceed?: () => void
}
```

**Display Logic:**
- If `extractionStatus='failed'` → Show extraction error
- If `extractionStatus='pending'` → Show loading skeleton
- If `parsingStatus='failed'` → Show parsing error
- If `parsingStatus='pending'` → Show loading skeleton
- If both completed → Show parsed sections

**Color Coding for Skills:**
```typescript
// Technical skills (blue/purple tones)
const technicalBadgeClass = 'bg-blue-100 text-blue-800'

// Soft skills (green/teal tones)
const softBadgeClass = 'bg-green-100 text-green-800'
```

**Icons (from lucide-react):**
- Contact: `Mail`, `Phone`
- Experience: `Briefcase`
- Education: `GraduationCap`
- Skills: `Zap`
- Projects: `Code`

### Project Structure

**Files to Create:**
```
components/analysis/
├── ResumePreview.tsx         # Main component
├── ExperiencePreview.tsx     # Experience section
├── SkillsPreview.tsx         # Skills section
├── ErrorPreview.tsx          # Error state
└── LoadingPreview.tsx        # Loading state (skeleton)

tests/e2e/
└── resume-preview.spec.ts    # E2E tests
```

**Files to Modify:**
```
app/(dashboard)/scan/new/page.tsx    # UPDATE - Show preview after upload
_bmad-output/implementation-artifacts/sprint-status.yaml  # UPDATE
```

### Previous Story Intelligence

**From Stories 3.1-3.3:**
1. Resumes table: id, user_id, extracted_text, extraction_status, parsed_sections, parsing_status
2. Component patterns from ResumeUpload component
3. Error handling and toast notifications
4. Responsive design with Tailwind + shadcn/ui

**Reusable Patterns:**
- Card-based layouts (from Settings page)
- Error display pattern
- Loading skeletons
- Responsive grid/flex layouts

### Latest Technical Information (2026)

**Real-time Updates:**
- Use polling (simplest): setInterval every 2-3 seconds
- Or Supabase realtime subscriptions (more complex but reactive)
- Or Server-Sent Events (middle ground)

**Component Performance:**
- Memoize sub-components to prevent re-renders
- Use React.memo for skill chips
- Lazy load sections if resume is very long

**Mobile-Friendly Display:**
- Stack sections vertically
- Skills wrap on mobile
- Touch-friendly spacing (48px minimum)
- Responsive font sizes

### Conversion Notes

**API Response:**
```typescript
// From actions/resume.ts getResume()
{
  id: "uuid",
  fileName: "resume.pdf",
  fileSize: 245000,
  uploadedAt: "2026-01-20T14:30:00Z",
  extractionStatus: "completed",
  extractionError: null,
  parsingStatus: "completed",
  parsingError: null,
  parsedSections: { ... }  // JSONB from database
}
```

### References

- [Source: epic-3-resume-job-description-input.md#Story 3.4] - Requirements
- [Source: project-context.md] - Component structure, naming
- [Source: 3-3-resume-section-parsing.md] - Parsed data structure
- [Source: components/forms/ResumeUpload.tsx] - Component pattern
- [Source: app/(dashboard)/settings/page.tsx] - Card layout pattern

---

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Story Creation Context

**Workflow Engine:** BMAD create-story workflow
**Execution Date:** 2026-01-20
**Branch:** feat/3-4-resume-preview-display
**Epic Status:** in-progress

### Next Steps (for Dev Agent)

1. Create ResumePreview component with section display
2. Create sub-components (ExperiencePreview, SkillsPreview)
3. Implement loading/error states
4. Integrate with scan/new page
5. Add polling for real-time updates
6. Write E2E tests
7. Final verification

### File List

**Will be created during dev-story:**
- `components/analysis/ResumePreview.tsx`
- `components/analysis/ExperiencePreview.tsx`
- `components/analysis/SkillsPreview.tsx`
- `components/analysis/ErrorPreview.tsx`
- `components/analysis/LoadingPreview.tsx`
- `tests/e2e/resume-preview.spec.ts`

**Will be modified:**
- `app/(dashboard)/scan/new/page.tsx` - Show preview after upload
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

_Story created by BMAD create-story workflow - Ready for dev-story execution_
_Last updated: 2026-01-20_
