# Story 16.3: Implement New Scan Page

**Status:** ready-for-dev

**Epic:** Epic 16: Dashboard UI Architecture (V0.5)

**Depends On:**
- Story 16.1 (Dashboard Layout Foundation) COMPLETED ✓
- Story 16.2 (Dashboard Home Page) COMPLETED ✓
- Epic 13 (Hybrid Preferences) COMPLETED ✓ - for Job Type & Modification Level options

---

## Story

As a user,
I want a dedicated page to start a new resume optimization,
So that I can upload my resume and enter a job description.

---

## Acceptance Criteria

1. **Given** I am on `/app/scan/new`
   **When** the page loads
   **Then** I see the Resume Upload section (ResumeUploader component)
   **And** I see the Job Description Input section
   **And** I see the "Analyze" button

2. **Given** I am on `/app/scan/new`
   **When** the page loads
   **Then** I see configuration options for Job Type (Co-op/Full-time)
   **And** I see configuration options for Modification Level (Conservative/Moderate/Aggressive)
   **And** these options match the V0.5 preferences from Epic 13
   **And** selections persist during the scan session

3. **Given** I have resumes in my library
   **When** I load `/app/scan/new`
   **Then** selecting a resume from library works correctly
   **And** selecting fills the Resume Upload section
   **And** I can still upload a new resume to replace it

4. **Given** I have filled in resume and job description
   **When** I click the "Analyze" button
   **Then** a new session is created (clears any previous state)
   **And** the LLM pipeline is triggered (`/api/optimize`)
   **And** after successful analysis, I am redirected to `/app/scan/[sessionId]`
   **And** the session ID is preserved in URL for results navigation

5. **Given** an error occurs during upload or analysis
   **When** the error is displayed
   **Then** errors are displayed using ErrorDisplay component
   **And** error message is plain-language and actionable
   **And** error codes are included (INVALID_FILE_TYPE, FILE_TOO_LARGE, LLM_TIMEOUT, etc.)
   **And** "Retry" button is available

6. **Given** the page loads
   **When** the user hasn't accepted privacy consent yet
   **Then** Privacy Consent Dialog may appear on upload attempt (handled by Story 15.3)
   **And** page doesn't block; user can see interface before uploading

---

## Tasks / Subtasks

- [ ] Refactor Resume Upload section into `/app/scan/new` page (AC: #1,3,5)
  - [ ] Extract ResumeUploader component (already exists in /components/shared)
  - [ ] Handle resume library selection
  - [ ] Integrate file upload with validation (INVALID_FILE_TYPE, FILE_TOO_LARGE)
  - [ ] Show selected file info (name, size)
  - [ ] "Clear" button to remove selected file
  - [ ] Use privacy consent check before enabling upload (from Story 15.3)

- [ ] Refactor Job Description Input section into `/app/scan/new` page (AC: #1,5)
  - [ ] Extract JobDescriptionInput component (already exists)
  - [ ] Text area for pasting job description
  - [ ] Character count display (optional, for UX)
  - [ ] "Clear" button to empty the field
  - [ ] Error handling for invalid input (show ErrorDisplay)

- [ ] Create Configuration Options component for V0.5 preferences (AC: #2)
  - [ ] Create `/components/scan/PreferencesPanel.tsx`
  - [ ] Display Job Type options: "Co-op/Internship" and "Full-time"
  - [ ] Display Modification Level options: "Conservative", "Moderate", "Aggressive"
  - [ ] Use radio buttons or select dropdowns for each option
  - [ ] Include descriptive text for each option explaining the effect
  - [ ] Load default values from user's saved preferences (or defaults)
  - [ ] Store selections in Zustand store for session
  - [ ] Responsive layout: stack on mobile, side-by-side on desktop

- [ ] Create "Analyze" button with analysis flow (AC: #1,4)
  - [ ] Create `/components/scan/AnalyzeButton.tsx` or update existing
  - [ ] Button is disabled if resume or JD is empty
  - [ ] Show loading state during analysis (spinner, disabled state)
  - [ ] Button text: "Analyze" or "Analyzing..." during load
  - [ ] On click: Call `startNewScan()` action to clear previous state
  - [ ] On click: Call `/api/optimize` with resume, JD, and preferences
  - [ ] Handle response: Navigate to `/app/scan/[sessionId]` on success
  - [ ] Handle errors: Show ErrorDisplay component on failure

- [ ] Implement `/app/scan/new/page.tsx` main page (AC: All)
  - [ ] Load authenticated user (auth protection via layout)
  - [ ] Render page layout with sections in order:
    1. Page title ("New Resume Scan")
    2. Resume Upload section
    3. Job Description section
    4. Configuration Options (Preferences Panel)
    5. Analyze button (full-width or prominent)
  - [ ] Use responsive grid layout (mobile: single column, desktop: 2-column)
  - [ ] Add loading skeleton if needed during analysis
  - [ ] Handle errors gracefully (don't crash)

- [ ] Create `startNewScan()` server action (AC: #4)
  - [ ] Create `/actions/scan/start-new-scan.ts`
  - [ ] Clear any previous session state from Zustand store
  - [ ] Reset resume content to null
  - [ ] Reset JD content to null
  - [ ] Reset analysis results to null
  - [ ] Reset suggestions to null
  - [ ] Load default preferences (or user's saved preferences)
  - [ ] Return ActionResponse<void> or success confirmation
  - [ ] Handle errors gracefully

- [ ] Integrate with Zustand optimization store (AC: #2,4)
  - [ ] Update `/store/useOptimizationStore.ts` if needed
  - [ ] Store: resumeContent, jdContent, preferences (jobType, modificationLevel)
  - [ ] Actions: setResumeContent, setJdContent, setPreferences
  - [ ] Selectors: selectResumeContent, selectJdContent, selectPreferences
  - [ ] Clear actions called from startNewScan()

- [ ] Create resume library integration (AC: #3)
  - [ ] Add logic to detect when resume is selected from library
  - [ ] Fill ResumeUploader with library resume content
  - [ ] Show resume name/date in upload section
  - [ ] Allow replacing library resume with new upload

- [ ] Create page layout and styling (AC: All)
  - [ ] Max-width container (1280px) with centered content
  - [ ] Padding: 24px mobile, 32px tablet, 40px desktop
  - [ ] Spacing between sections: gap-8
  - [ ] Use design system colors: white background, purple accents
  - [ ] Section headers use consistent typography
  - [ ] Responsive layout:
    - Mobile (<768px): Single column, cards stack
    - Tablet (768px-1024px): Two columns if space allows
    - Desktop (≥1024px): Two columns (upload section + JD + prefs on right)

- [ ] Add loading states and error handling (AC: #4,5)
  - [ ] Show skeleton loader during analysis
  - [ ] Disable form inputs during analysis
  - [ ] Show ErrorDisplay on API failure
  - [ ] Show recovery actions (Retry, New Scan)
  - [ ] Handle timeout errors (LLM_TIMEOUT) with helpful message
  - [ ] No console errors or unhandled promises

- [ ] Create comprehensive tests (AC: All)
  - [ ] Create `/tests/unit/components/scan/PreferencesPanel.test.tsx`
    - Tests for Job Type radio selection
    - Tests for Modification Level selection
    - Tests for preference persistence
  - [ ] Create `/tests/unit/actions/start-new-scan.test.ts`
    - Tests for state clearing
    - Tests for preference loading
  - [ ] Create `/tests/integration/16-3-new-scan-page.spec.ts`
    - Test upload resume and enter JD
    - Test select preferences
    - Test click Analyze → redirects to results
    - Test error handling and retry
    - Test resume library integration
    - Test accessibility (keyboard nav, screen readers)

---

## Dev Notes

### Architecture Overview

Story 16.3 implements the dedicated page for starting a new resume optimization scan. It combines existing upload/JD components with new preferences configuration and orchestrates the analysis flow.

**Key Dependencies:**
- ResumeUploader component (exists in /components/shared - from old home page)
- JobDescriptionInput component (exists in /components/shared - from old home page)
- AnalyzeButton component (exists in /components/shared - from old home page)
- Privacy Consent Dialog (from Story 15.2 - checks consent before upload)
- V0.5 Preferences (Job Type, Modification Level from Epic 13)
- `/api/optimize` endpoint (existing LLM pipeline)

### Critical Patterns & Constraints

**State Management** [Source: project-context.md#Zustand-Store-Pattern]
- Use Zustand store for session state: resumeContent, jdContent, preferences
- Actions: setResumeContent, setJdContent, setPreferences, clearSession
- Server action `startNewScan()` clears store before new analysis

**Navigation Pattern** [Source: Story 16.1]
- Use `useRouter()` from `next/navigation`
- After successful analysis: `router.push(`/app/scan/${sessionId}`)`
- Route constants in `/lib/constants/routes.ts`

**API Pattern** [Source: project-context.md#API-Patterns]
- Call `/api/optimize` with resume, JD, preferences
- 60-second timeout for LLM operations
- Wrap user content in XML tags for prompt injection defense
- Response follows ActionResponse<AnalysisResult> pattern

**Error Handling** [Source: project-context.md#Error-Codes]
- INVALID_FILE_TYPE: Wrong file format
- FILE_TOO_LARGE: Exceeds 5MB
- PARSE_ERROR: Can't extract text
- LLM_TIMEOUT: 60s exceeded
- LLM_ERROR: API failure
- VALIDATION_ERROR: Bad input

**Component Architecture**
- Page is Server Component (auth protection)
- Upload, JD, Analyze use Client Components (interactivity)
- PreferencesPanel is Client Component (radio selections)
- AnalyzeButton handles API call and navigation

### File Structure & Components to Use/Create

```
/app/(dashboard)/scan/new/
  └── page.tsx                           (Main new scan page)

/components/scan/
  └── PreferencesPanel.tsx               (NEW: Job Type + Mod Level options)

/components/shared/
  ├── ResumeUploader.tsx                 (EXISTING: Reuse)
  ├── JobDescriptionInput.tsx            (EXISTING: Reuse)
  └── AnalyzeButton.tsx                  (EXISTING: Update with session redirect)

/actions/scan/
  └── start-new-scan.ts                  (NEW: Clear state before analysis)

/store/
  └── useOptimizationStore.ts            (UPDATE: Add preferences state if needed)

/tests/unit/components/scan/
  └── PreferencesPanel.test.tsx

/tests/unit/actions/
  └── start-new-scan.test.ts

/tests/integration/
  └── 16-3-new-scan-page.spec.ts
```

### Component Dependencies

**Existing Components to Reuse:**
- ResumeUploader: File upload with validation
- JobDescriptionInput: Text area for JD
- AnalyzeButton: Trigger analysis
- ErrorDisplay: Show errors on failure
- PrivacyConsentDialog: Check consent before upload (Story 15)

**shadcn/ui Components:**
- RadioGroup or Select for preferences
- Card or section containers
- Button variants (primary, destructive)

**Next.js Utilities:**
- `useRouter()` from `next/navigation`
- `useTransition()` for loading states
- Server actions for startNewScan()

**Supabase:**
- Get resume library (if needed for selection)
- Save new session after analysis

### Testing Approach

**Unit Tests:**
- PreferencesPanel: Radio selections work, values update
- startNewScan: Clears store, loads defaults

**Integration Tests:**
- Full flow: Upload resume → Enter JD → Select preferences → Click Analyze → Redirected to results
- Resume library selection works
- Error handling: File error → show ErrorDisplay
- Privacy consent: Dialog appears before upload (from Story 15)
- Accessibility: Keyboard nav, screen reader labels

### Previous Story Intelligence

**From Story 16.2 (Dashboard Home Page):**
- Component patterns: cards, sections, spacing
- Navigation patterns: useRouter() and link helpers
- Error handling: ActionResponse pattern

**From Story 16.1 (Dashboard Layout):**
- Page uses shared layout wrapper
- Auth protection at layout level
- Header shows page title

**From Epic 13 (Hybrid Preferences):**
- Job Type: 'coop' | 'fulltime'
- Modification Level: 'conservative' | 'moderate' | 'aggressive'
- Preference templates: buildPreferencePrompt()
- Query existing user preferences via Zustand store

**From Epic 15 (Privacy Consent):**
- Privacy consent check before upload
- Dialog appears if privacyAccepted = false
- acceptPrivacyConsent() action saves to database

**From existing optimization flow (Epics 3-6):**
- ResumeUploader already handles PDF/DOCX upload
- AnalyzeButton triggers `/api/optimize`
- Analysis returns score, breakdown, suggestions
- Results saved to database/session

### Git Intelligence

Recent commits (16.1, 16.2):
- File count: 10-16 per story
- Lines: 600-1200 per story (including tests)
- Average: 8-12 files created/modified

This story will likely:
- Reuse 3 existing components
- Create 1 new component (PreferencesPanel)
- Create 1 new page (page.tsx)
- Create 1 new server action (startNewScan)
- Create 3 test files (unit + integration)
- Estimated: 8-10 files, 500-800 lines (less than 16.1/16.2 due to component reuse)

### Latest Tech Information

**Next.js 16 Dynamic Routes:**
- `/app/scan/new` is static route (not dynamic) ✓
- Can coexist with `/app/scan/[sessionId]` (Next.js routes by specificity) ✓
- Server component can await data before rendering ✓

**React 19 useTransition:**
- Better loading state than manual loading flags ✓
- Integrates with Server Actions ✓
- Shows pending state while mutation runs ✓

**Tailwind 4 Grid:**
- Can use `md:grid-cols-2` for two-column layout on tablet+ ✓
- Gap utilities: `gap-6`, `gap-8` ✓
- Responsive text sizing with `sm:text-lg` ✓

### Project Context Reference

**Server Actions Pattern** [Source: project-context.md#API-Patterns]
- `startNewScan()` is server action (call from client)
- Returns ActionResponse<void> or success
- Cannot throw - return errors in response

**Component Location:** [Source: project-context.md#Directory-Structure-Rules]
- Scan-specific: `/components/scan/` ✓
- Shared: `/components/shared/` ✓
- Server actions: `/actions/scan/` ✓

**Store Pattern:** [Source: project-context.md#Zustand-Store-Pattern]
- State: resumeContent, jdContent, preferences
- Actions: setResumeContent, setJdContent, setPreferences
- Selectors: selectResumeContent, etc.
- Reset called from startNewScan()

---

## Implementation Checklist

### Pre-Dev Verification
- [ ] Current branch is `feature/16-3-new-scan-page`
- [ ] Pull latest main: `git pull origin main`
- [ ] Verify TypeScript: `npm run build` passes
- [ ] Verify tests: `npm run test:all` passes
- [ ] Review existing ResumeUploader, JobDescriptionInput, AnalyzeButton components

### Post-Implementation
- [ ] All TypeScript errors resolved
- [ ] All acceptance criteria verified
- [ ] Existing components (ResumeUploader, etc.) still work
- [ ] New PreferencesPanel component integrated
- [ ] startNewScan() clears state correctly

### Before Code Review
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing: Full flow from resume upload → analyze → redirect
- [ ] Resume library selection tested
- [ ] Error handling tested (file errors, API failures)
- [ ] Responsive design verified across breakpoints
- [ ] Privacy consent flow tested (if not already handled)

---

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5

### Debug Log References

None yet - ready for dev-story workflow

### Completion Notes

- Story created with comprehensive context for developer
- All patterns documented with source references
- Component reuse identified (3 existing components)
- New component architecture specified (PreferencesPanel)
- Testing approach outlined (unit + integration)
- Database/API patterns referenced

### File List

_To be populated after implementation_

---

## Questions for Clarification

1. **Resume library integration:** Should selecting from library automatically set resume, or show it in preview first? (Recommend: Automatically set, but show confirmation of which resume selected)

2. **Preferences defaults:** Should we load user's last-used preferences, or always start with defaults (fulltime, moderate)? (Recommend: Load from saved preferences if available, fallback to defaults)

3. **Page layout:** Should preferences be in a sidebar, collapsible panel, or inline with form? (Recommend: Inline below upload sections for simplicity)

4. **Session creation:** Should session be created before or after successful analysis? (Recommend: After successful analysis, store both analysis results and preferences in session)

5. **Loading experience:** Should we show skeleton loader during analysis, or disable inputs + show spinner? (Recommend: Both - disable inputs + show spinner on button)

---
