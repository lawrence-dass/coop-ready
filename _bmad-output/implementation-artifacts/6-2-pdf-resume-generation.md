# Story 6.2: PDF Resume Generation

**Status:** ready-for-dev
**Epic:** 6 - Resume Export & Download
**Dependencies:** Story 6-1 (Resume Content Merging) - provides merged content
**Blocking:** Story 6-4 (Download UI) - needs PDF generation capability
**Related Stories:** Story 6-3 (DOCX generation - parallel work possible)

---

## Problem Statement

Story 6-1 provides merged resume content ready for export, but there's no PDF generation capability. Users can't download their optimized resumes as PDF files. The infrastructure is ready—merged data flows from the merge engine—but we need to convert structured resume data into professional, ATS-friendly PDF documents.

---

## User Story

As a **user**,
I want **to download my optimized resume as a PDF**,
So that **I have a professional, universally readable document**.

---

## Acceptance Criteria

### AC1: PDF Generation from Merged Content
**Given** I have merged resume content ready
**When** PDF generation runs
**Then** a properly formatted PDF document is created
**And** the PDF follows ATS-friendly formatting standards
**And** file size is under 500KB

### AC2: Professional Formatting & Typography
**Given** the PDF is generated
**When** I view the document
**Then** section headers are clearly visible and consistent
**And** fonts are professional and readable (e.g., Arial, Calibri, Helvetica)
**And** font sizes are: headers 14-16pt, body text 10-12pt
**And** margins are appropriate (0.5-1 inch)
**And** line spacing is readable (1.15 or 1.5)
**And** the layout is clean and scannable

### AC3: Section Organization
**Given** the resume has multiple sections
**When** the PDF is generated
**Then** sections appear in standard order: Contact, Summary, Experience, Education, Skills, Projects
**And** each section has appropriate spacing between entries
**And** section titles are visually distinct from content

### AC4: Experience Section Formatting
**Given** experience entries have bullet points
**When** the PDF is generated
**Then** company name, title, and dates appear on the first line
**And** bullet points are properly formatted and aligned
**And** text wraps correctly within margins without cutting off
**And** bullet symbols are clear and consistent

### AC5: Skills Section Formatting
**Given** the resume has a skills section
**When** the PDF is generated
**Then** skills are presented clearly and professionally
**And** skill categories (if present) are visually organized
**And** no skills are cut off or truncated

### AC6: One-Page Constraint
**Given** the resume is one page
**When** the PDF is generated
**Then** content fits on one page without cutting off
**And** all text is visible and readable
**And** no content is pushed to a second page

### AC7: ATS Compatibility
**Given** an ATS system scans the PDF
**When** it processes the document
**Then** no tables or complex layouts confuse the parser
**And** text extraction produces readable resume text
**And** standard fonts are used (no special symbols or custom fonts)
**And** headers and bullets are properly structured

### AC8: Error Handling
**Given** PDF generation fails (invalid data, rendering issue)
**When** error handling runs
**Then** a clear error message is returned
**And** the error includes troubleshooting info (e.g., "Content too long for one page")
**And** the user can retry

### AC9: Download Delivery
**Given** PDF generation completes successfully
**When** the user initiates download
**Then** the file downloads with proper filename: `{FirstName}_{LastName}_Resume_Optimized.pdf`
**And** MIME type is `application/pdf`
**And** file can be opened in all major PDF readers

---

## Technical Implementation

### Architecture Context

**Input:** Merged resume data from Story 6-1 (via `generateMergedResume()` action)
**Output:** PDF blob ready for client-side download
**Constraint:** ATS-friendly = no tables, simple layouts, standard fonts
**Performance:** Generation should complete within 2-3 seconds

### New Files to Create

#### 1. PDF Generator: `lib/generators/pdf.ts`

```typescript
// Main PDF generation function
export async function generatePDF(
  mergedResume: ParsedResume,
  userName: string
): Promise<Buffer>

// Type for PDF generation options
export interface PDFGenerationOptions {
  fileName?: string
  fontSize?: {
    body: number
    header: number
    title: number
  }
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

// Error handling
export class PDFGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: 'CONTENT_TOO_LONG' | 'INVALID_DATA' | 'RENDER_ERROR'
  ) {
    super(message)
  }
}
```

**Responsibilities:**
- Take merged resume data (from Story 6-1)
- Apply professional formatting and typography
- Use React PDF components for structure
- Ensure ATS compatibility (no tables, standard fonts)
- Return PDF as Buffer ready for download
- Handle errors gracefully with specific error codes

#### 2. PDF Components: `components/pdf/` (New Directory)

Create reusable React PDF components for consistent formatting:

```typescript
// components/pdf/PDFDocument.tsx
export function PDFDocument({ resume }: { resume: ParsedResume }): React.ReactElement

// components/pdf/PDFHeader.tsx
export function PDFHeader({ resume }: { resume: ParsedResume }): React.ReactElement

// components/pdf/PDFSection.tsx
export function PDFSection({
  title: string
  children: React.ReactNode
}): React.ReactElement

// components/pdf/PDFBulletList.tsx
export function PDFBulletList({
  bullets: string[]
}): React.ReactElement

// components/pdf/PDFSkillsList.tsx
export function PDFSkillsList({
  skills: Skill[]
  categoryLabels?: boolean
}): React.ReactElement

// components/pdf/PDFExperienceEntry.tsx
export function PDFExperienceEntry({
  entry: JobEntry
}): React.ReactElement

// components/pdf/PDFEducationEntry.tsx
export function PDFEducationEntry({
  entry: EducationEntry
}): React.ReactElement
```

**Each component:**
- Handles one section of the resume
- Uses fixed styling (no inline conditional formatting)
- Properly spaced and formatted for readability
- ATS-friendly (text-based, no complex layouts)

#### 3. Server Action Integration: Update `actions/export.ts`

Add function to generate and serve PDF:

```typescript
export async function generateResumePDF(
  scanId: string,
  format: 'pdf'
): Promise<ActionResponse<{
  fileBlob: Buffer
  fileName: string
  mimeType: string
}>>
```

**Workflow:**
1. Validate scanId belongs to current user
2. Call `generateMergedResume(scanId)` from Story 6-1
3. Call `generatePDF(mergedData, userName)`
4. Return file blob with proper headers
5. Handle and log any errors

### Implementation Approach

**Library Choice: `@react-pdf/renderer`**
- Reason: React-based, declarative, good TypeScript support
- Alternative considered: `pdfkit` (lower-level, more control but verbose)
- Not using: `puppeteer` (too heavy, overkill for structured resume data)

**Styling Strategy:**
- Fixed margin/padding values (no responsive design—PDF is fixed-size)
- Professional font stack: Helvetica > Arial (widely supported, ATS-friendly)
- Consistent colors: Black text on white, gray for section headers
- Line heights: 1.15 for body, 1.2 for headers

**Content Layout:**
```
┌─────────────────────────────────────┐
│  Name                               │  (14pt, bold)
│  Email | Phone | Location           │  (10pt)
├─────────────────────────────────────┤
│ PROFESSIONAL SUMMARY                │  (12pt, bold)
│ [Summary text...]                   │  (11pt)
├─────────────────────────────────────┤
│ EXPERIENCE                          │  (12pt, bold)
│ Company | Title | Dates             │  (11pt, bold)
│ • Bullet point 1                    │  (10pt)
│ • Bullet point 2                    │
│                                     │
│ Company 2 | Title 2 | Dates         │  (11pt, bold)
│ • Bullet point 1                    │  (10pt)
├─────────────────────────────────────┤
│ EDUCATION                           │  (12pt, bold)
│ School | Degree | Graduation Date   │  (11pt, bold)
├─────────────────────────────────────┤
│ SKILLS                              │  (12pt, bold)
│ Category: Skill1, Skill2, Skill3    │  (10pt)
└─────────────────────────────────────┘
```

### Implementation Steps (for dev-story workflow)

1. **Install Dependencies**
   - Add `@react-pdf/renderer` to `package.json`
   - Add type definitions `@types/react-pdf__renderer`

2. **Create PDF Components**
   - `components/pdf/PDFDocument.tsx` (main wrapper)
   - `components/pdf/PDFHeader.tsx` (contact info section)
   - `components/pdf/PDFSection.tsx` (reusable section container)
   - `components/pdf/PDFBulletList.tsx` (experience bullets)
   - `components/pdf/PDFSkillsList.tsx` (skills formatting)
   - `components/pdf/PDFExperienceEntry.tsx` (job entry)
   - `components/pdf/PDFEducationEntry.tsx` (education entry)

3. **Create PDF Generator**
   - `lib/generators/pdf.ts` with `generatePDF()` function
   - Orchestrates components into a complete PDF
   - Handles page layout and pagination
   - Manages font sizing and margins
   - Error handling with specific error codes

4. **Integrate with Export Action**
   - Update `actions/export.ts` to add `generateResumePDF()`
   - Call `generateMergedResume()` to get data
   - Call `generatePDF()` to create PDF
   - Return Buffer with filename and MIME type
   - Proper error handling and logging

5. **Add Tests**
   - Unit tests: PDF component rendering
   - Unit tests: PDF generation options handling
   - Unit tests: Error scenarios (content too long, invalid data)
   - Integration tests: Full PDF generation from scan
   - Integration tests: File format and size validation

6. **Validation**
   - Ensure PDF is less than 500KB
   - Verify all content fits on one page
   - Check text is extractable from PDF (ATS compatibility)
   - Test in various PDF readers (Adobe, Preview, Chrome)

---

## Data Dependencies

### Input: ParsedResume (from Story 6-1 merge)

```typescript
interface ParsedResume {
  contact: string
  summary: string
  experience: JobEntry[]
  education: EducationEntry[]
  skills: Skill[]
  projects: string
  other: string
}

interface JobEntry {
  company: string
  title: string
  dates: string
  bulletPoints: string[]
}

interface EducationEntry {
  institution: string
  degree: string
  dates: string
  gpa?: string
}

interface Skill {
  name: string
  category: 'technical' | 'soft'
}
```

### Output: PDF File

- **Format:** PDF 1.4 (maximum compatibility)
- **Size:** < 500KB
- **Filename:** `{FirstName}_{LastName}_Resume_Optimized.pdf`
- **MIME Type:** `application/pdf`
- **Encoding:** UTF-8 for text content

---

## Project Context & Constraints

**From project-context.md:**
- Server Actions: Return `{ data: T, error: null }` or `{ data: null, error: {...} }`
- Never throw from Server Actions
- Use Zod validation for inputs
- Immutable data operations

**From Architecture:**
- Resume data flows: Parse → Analyze → Suggest → Merge → Export
- PDF generation is the first export formatter
- Must maintain ATS compatibility throughout
- Performance target: < 2 seconds generation time

**From Epic 6 Requirements:**
- ATS-friendly formatting (no tables, standard fonts)
- One-page constraint (all content must fit)
- Professional appearance (consistent typography, proper spacing)
- File size limit: < 500KB
- Standard naming convention with user's name

---

## Testing Strategy

### Unit Tests: `tests/unit/pdf-generation.test.ts`

```typescript
describe('PDF Generation', () => {
  describe('PDFDocument Component', () => {
    it('renders all resume sections', () => { ... })
    it('renders contact info at top', () => { ... })
    it('preserves section order', () => { ... })
  })

  describe('PDFBulletList', () => {
    it('formats bullet points with proper symbols', () => { ... })
    it('wraps long text correctly', () => { ... })
  })

  describe('generatePDF', () => {
    it('generates valid PDF buffer', () => { ... })
    it('keeps file size under 500KB', () => { ... })
    it('throws PDFGenerationError for invalid data', () => { ... })
    it('throws CONTENT_TOO_LONG for oversized resume', () => { ... })
  })
})
```

### Integration Tests: `tests/integration/pdf-export.test.ts`

```typescript
describe('PDF Export Integration', () => {
  it('generates PDF from merged resume data', () => { ... })
  it('PDF contains all resume content', () => { ... })
  it('PDF is properly formatted and readable', () => { ... })
  it('PDF is extractable by text readers', () => { ... })
  it('generateResumePDF action validates user ownership', () => { ... })
  it('generateResumePDF returns proper filename and MIME type', () => { ... })
})
```

### Manual QA Checklist

- [ ] Generate PDF from sample resume with all sections
- [ ] Open PDF in Adobe Reader, Preview, Chrome
- [ ] Verify formatting: margins, fonts, spacing
- [ ] Copy text from PDF and verify content accuracy
- [ ] Test with single-page resume (should fit)
- [ ] Test with longer resume (error handling for overflow)
- [ ] Check file size (< 500KB)
- [ ] Test filename generation with various user names (special chars, spaces)

---

## File Changes Summary

| File | Change | Type |
|------|--------|------|
| `lib/generators/pdf.ts` | NEW | Core PDF generation |
| `components/pdf/PDFDocument.tsx` | NEW | Main PDF component |
| `components/pdf/PDFHeader.tsx` | NEW | Header section |
| `components/pdf/PDFSection.tsx` | NEW | Reusable section |
| `components/pdf/PDFBulletList.tsx` | NEW | Bullet formatting |
| `components/pdf/PDFSkillsList.tsx` | NEW | Skills formatting |
| `components/pdf/PDFExperienceEntry.tsx` | NEW | Job entry |
| `components/pdf/PDFEducationEntry.tsx` | NEW | Education entry |
| `actions/export.ts` | ADD | `generateResumePDF()` function |
| `tests/unit/pdf-generation.test.ts` | NEW | Unit tests |
| `tests/integration/pdf-export.test.ts` | NEW | Integration tests |
| `package.json` | ADD | `@react-pdf/renderer` dependency |

---

## Dev Notes

### Key Points to Remember

1. **ATS First:** No tables, no complex layouts, standard fonts only. Text extraction must work cleanly.

2. **One Page Constraint:** All content must fit on a single letter-size page. If it doesn't, throw `CONTENT_TOO_LONG` error with context for user.

3. **Deterministic Rendering:** Use fixed sizes, margins, fonts. No responsive design for PDF.

4. **Performance:** Target < 2 seconds for generation. Profile if slower.

5. **Text Extractability:** Ensure all text in PDF is selectable and copy-able. Verify by extracting text programmatically in tests.

6. **Component Composition:** Use React PDF components declaratively. Each component handles its own styling and layout.

### Common Pitfalls to Avoid

- ❌ Using tables for layout (breaks ATS)
- ❌ Custom fonts or symbols (not ATS-friendly)
- ❌ Complex styling that breaks page breaks
- ❌ Not validating that content fits on one page
- ❌ Forgetting to test text extraction for ATS compatibility
- ❌ Not handling edge cases (empty sections, very long names)

### Testing Text Extraction

Use `pdf-parse` or `pdfjs-dist` to programmatically extract text from generated PDF and verify content:

```typescript
import pdfjsLib from 'pdfjs-dist'

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((item: any) => item.str).join(' ')
  }
  return text
}
```

### References

- **Merge Integration:** Story 6-1 provides `generateMergedResume()` action
- **Library Docs:** [@react-pdf/renderer](https://react-pdf.org/)
- **ATS Optimization:** `_bmad-output/planning-artifacts/architecture.md#ATS Compatibility`
- **Download Integration:** Story 6-4 consumes this PDF generation capability
- **Parallel Work:** Story 6-3 (DOCX) follows similar pattern, can work in parallel

---

## Acceptance Criteria Mapping

| AC # | Dev Task | Validation |
|------|----------|-----------|
| AC1 | Create PDF generation from merged data | Generated PDF is valid and < 500KB |
| AC2 | Implement typography component | Verify fonts, sizes, spacing in PDF |
| AC3 | Create section organization | PDF has correct section order |
| AC4 | Format experience bullets | Extract text and verify bullet structure |
| AC5 | Format skills section | Skills section renders correctly |
| AC6 | Enforce one-page layout | Content fits on single page |
| AC7 | Ensure ATS compatibility | Text extraction produces readable content |
| AC8 | Error handling | Specific error codes for different failures |
| AC9 | Download delivery | Correct filename, MIME type, downloadable |

---

## Completion Checklist

- [ ] `lib/generators/pdf.ts` created with main orchestration
- [ ] PDF components created in `components/pdf/` directory
- [ ] `actions/export.ts` updated with `generateResumePDF()` action
- [ ] All resume sections properly formatted (contact, summary, experience, education, skills)
- [ ] ATS compatibility verified (text extraction works, no tables)
- [ ] One-page constraint enforced (error if content too long)
- [ ] Error handling with specific error codes
- [ ] Filename generation working with user names
- [ ] Unit tests pass (PDF components, generation)
- [ ] Integration tests pass (full PDF export workflow)
- [ ] Manual QA complete (various resume sizes, PDF readers)
- [ ] File size validation (< 500KB)
- [ ] No TypeScript errors
- [ ] Story file linked to Stories 6-3, 6-4 for reference

---

**Created:** 2026-01-21
**Ready for Development:** Yes
