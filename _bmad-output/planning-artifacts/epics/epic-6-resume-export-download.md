# Epic 6: Resume Export & Download

Users can download their optimized resume with all accepted suggestions applied in their preferred format (PDF or DOCX).

## Story 6.1: Resume Content Merging

As a **system**,
I want **to merge accepted suggestions into the final resume content**,
So that **the exported document reflects all user-approved changes**.

**Acceptance Criteria:**

**Given** a user has accepted suggestions for their scan
**When** the merge process runs
**Then** each accepted suggestion is applied to the corresponding resume section
**And** the merged content maintains proper structure

**Given** a bullet rewrite suggestion was accepted
**When** merging occurs
**Then** the original bullet text is replaced with the suggested text
**And** the bullet's position in the experience entry is preserved

**Given** a skill expansion suggestion was accepted
**When** merging occurs
**Then** the original skill is replaced with the expanded version
**And** other skills in the list remain unchanged

**Given** a removal suggestion was accepted
**When** merging occurs
**Then** the flagged content is removed from the merged result
**And** surrounding content flows naturally

**Given** a suggestion was rejected
**When** merging occurs
**Then** the original content is preserved unchanged

**Given** no suggestions were accepted
**When** merging occurs
**Then** the original parsed resume content is returned unchanged

**Given** merging completes
**When** the result is prepared
**Then** the merged content is structured for document generation
**And** section order follows standard resume conventions

**Technical Notes:**
- Create `lib/generators/merge.ts` for merge logic
- Input: parsed resume sections + accepted suggestions
- Output: merged resume data structure ready for generation
- Handle edge cases: overlapping suggestions, removed sections
- Do not persist merged content (generate on-demand)

---

## Story 6.2: PDF Resume Generation

As a **user**,
I want **to download my optimized resume as a PDF**,
So that **I have a professional, universally readable document**.

**Acceptance Criteria:**

**Given** I have merged resume content ready
**When** PDF generation runs
**Then** a properly formatted PDF document is created
**And** the PDF follows ATS-friendly formatting standards

**Given** the PDF is generated
**When** I view the document
**Then** section headers are clearly visible and consistent
**And** fonts are professional and readable (e.g., Arial, Calibri, or similar)
**And** margins are appropriate (0.5-1 inch)
**And** the layout is clean and scannable

**Given** the resume has multiple sections
**When** the PDF is generated
**Then** sections appear in standard order: Contact, Summary, Experience, Education, Skills, Projects
**And** each section has appropriate spacing

**Given** experience entries have bullet points
**When** the PDF is generated
**Then** bullets are properly formatted and aligned
**And** text wraps correctly within margins

**Given** the resume is one page
**When** the PDF is generated
**Then** content fits on one page without cutting off
**And** font size is readable (10-12pt body, 14-16pt headers)

**Given** generation fails
**When** error handling runs
**Then** a clear error message is returned
**And** the user can retry (FR47)

**Technical Notes:**
- Create `lib/generators/pdf.ts`
- Use `@react-pdf/renderer` for PDF generation
- Create reusable PDF components: Header, Section, BulletList, SkillsList
- Ensure ATS compatibility: no tables, simple formatting, standard fonts
- Target file size: < 500KB

---

## Story 6.3: DOCX Resume Generation

As a **user**,
I want **to download my optimized resume as a DOCX**,
So that **I can make additional edits in Word if needed**.

**Acceptance Criteria:**

**Given** I have merged resume content ready
**When** DOCX generation runs
**Then** a properly formatted Word document is created
**And** the document is editable in Microsoft Word and Google Docs

**Given** the DOCX is generated
**When** I open it in Word
**Then** formatting is preserved (fonts, sizes, spacing)
**And** I can easily edit any text
**And** styles are applied to headers and body text

**Given** the resume has bullet points
**When** the DOCX is generated
**Then** bullets use native Word bullet formatting
**And** I can add/remove bullets easily when editing

**Given** the resume has multiple sections
**When** the DOCX is generated
**Then** sections use Word heading styles
**And** I can navigate using the document outline

**Given** I download and re-upload the DOCX
**When** CoopReady parses it again
**Then** the content is extracted correctly
**And** the cycle can repeat for future optimizations

**Given** generation fails
**When** error handling runs
**Then** a clear error message is returned
**And** the user can retry (FR47)

**Technical Notes:**
- Create `lib/generators/docx.ts`
- Use `docx` package for DOCX generation
- Apply consistent styling: Heading1 for name, Heading2 for sections, Normal for body
- Ensure cross-platform compatibility (Word, Google Docs, LibreOffice)
- Target file size: < 100KB

---

## Story 6.4: Download UI & Format Selection

As a **user**,
I want **to choose my download format and download my optimized resume**,
So that **I get the file in my preferred format**.

**Acceptance Criteria:**

**Given** I am on the scan results page with accepted suggestions
**When** I click "Download Resume"
**Then** I see a format selection modal or dropdown
**And** options are: PDF and DOCX
**And** each option has a brief description

**Given** I select PDF format
**When** I click "Download"
**Then** the PDF is generated with merged content
**And** the file downloads with name "{MyName}_Resume_Optimized.pdf"
**And** I see a success toast "Resume downloaded!"

**Given** I select DOCX format
**When** I click "Download"
**Then** the DOCX is generated with merged content
**And** the file downloads with name "{MyName}_Resume_Optimized.docx"
**And** I see a success toast "Resume downloaded!"

**Given** generation is in progress
**When** I am waiting
**Then** the download button shows a loading spinner
**And** I cannot click download again until complete

**Given** generation fails
**When** error handling runs
**Then** I see an error message "Download failed. Please try again."
**And** I see a "Retry" button (FR47)
**And** clicking retry attempts generation again

**Given** I have no accepted suggestions
**When** I click "Download Resume"
**Then** I see a warning "No changes accepted. Download original resume?"
**And** I can proceed to download the original or go back to review suggestions

**Given** I am on mobile
**When** I download a file
**Then** the download works correctly on iOS and Android browsers
**And** the file is saved to the device's downloads

**Technical Notes:**
- Create download UI in scan results page
- Create `actions/export.ts` with `generateResume` action
- Action takes: `scanId`, `format` ('pdf' | 'docx')
- Return file as blob for client-side download
- Use `useTransition` for loading state
- Track downloads in `scans` table: `downloaded_at`, `download_format`

---
