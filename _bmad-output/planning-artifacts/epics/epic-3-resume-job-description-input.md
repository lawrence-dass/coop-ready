# Epic 3: Resume & Job Description Input

Users can upload their resume, input a job description, and view extracted content ready for AI analysis.

## Story 3.1: Resume Upload with Validation

As a **user**,
I want **to upload my resume file**,
So that **I can have it analyzed against job descriptions**.

**Acceptance Criteria:**

**Given** I am on the new scan page
**When** I view the resume upload area
**Then** I see a drag-and-drop zone with clear instructions
**And** I see a "Browse files" button as an alternative
**And** I see accepted formats listed (PDF, DOCX)
**And** I see the max file size (2MB)

**Given** I drag a valid PDF file (< 2MB) into the upload zone
**When** I drop the file
**Then** the file is uploaded to Supabase Storage
**And** I see a progress indicator during upload
**And** I see the filename displayed after successful upload
**And** I can remove/replace the uploaded file

**Given** I drag a valid DOCX file (< 2MB) into the upload zone
**When** I drop the file
**Then** the file is uploaded successfully
**And** I see the same success experience as PDF

**Given** I try to upload a file larger than 2MB
**When** the validation runs
**Then** I see an error "File size must be under 2MB"
**And** the file is not uploaded

**Given** I try to upload an unsupported file type (e.g., .txt, .jpg)
**When** the validation runs
**Then** I see an error "Please upload a PDF or DOCX file"
**And** the file is not uploaded

**Given** I click "Browse files"
**When** the file picker opens
**Then** it is filtered to only show PDF and DOCX files

**Technical Notes:**
- Create `components/forms/ResumeUpload.tsx` with drag-drop
- Create `resumes` table: `id`, `user_id`, `file_path`, `file_name`, `file_type`, `file_size`, `created_at`
- Use Supabase Storage with signed URLs
- Add RLS policy: users can only access their own resumes
- Validate on client AND server (AR7 Zod)
- Create `actions/resume.ts` with `uploadResume` action

---

## Story 3.2: Resume Text Extraction

As a **system**,
I want **to extract text content from uploaded resume files**,
So that **the content can be analyzed by the AI**.

**Acceptance Criteria:**

**Given** a PDF file has been uploaded
**When** the extraction process runs
**Then** all text content is extracted from the PDF
**And** the extracted text preserves paragraph structure
**And** the text is stored in the database linked to the resume record

**Given** a DOCX file has been uploaded
**When** the extraction process runs
**Then** all text content is extracted from the DOCX
**And** formatting (headers, bullets) is converted to plain text structure
**And** the text is stored in the database

**Given** a PDF file is image-based (scanned document)
**When** the extraction process runs
**Then** extraction fails gracefully
**And** an error is returned "Unable to extract text. Please upload a text-based PDF"
**And** the user sees this error message (FR45)

**Given** a corrupted or password-protected file is uploaded
**When** the extraction process runs
**Then** extraction fails gracefully
**And** an appropriate error message is shown to the user

**Given** extraction completes successfully
**When** the result is saved
**Then** the `resumes` table is updated with `extracted_text` column
**And** extraction status is marked as `completed`

**Technical Notes:**
- Use `pdf-parse` for PDF extraction
- Use `mammoth` for DOCX extraction
- Add columns to `resumes`: `extracted_text`, `extraction_status` (pending/completed/failed), `extraction_error`
- Create extraction logic in `lib/parsers/pdf.ts` and `lib/parsers/docx.ts`
- Run extraction server-side in `actions/resume.ts`

---

## Story 3.3: Resume Section Parsing

As a **system**,
I want **to parse the extracted resume text into sections**,
So that **analysis can be performed on specific parts of the resume**.

**Acceptance Criteria:**

**Given** text has been extracted from a resume
**When** the parsing process runs
**Then** the text is categorized into sections: Contact, Summary/Objective, Education, Experience, Skills, Projects, Other
**And** each section contains the relevant text content

**Given** a resume has a clear "Experience" or "Work Experience" header
**When** parsing identifies this section
**Then** individual job entries are identified
**And** each entry captures: company, title, dates, bullet points

**Given** a resume has an "Education" section
**When** parsing identifies this section
**Then** educational entries are identified
**And** each entry captures: institution, degree, dates, GPA (if present)

**Given** a resume has a "Skills" section
**When** parsing identifies this section
**Then** skills are extracted as a list
**And** technical skills are identified separately from soft skills

**Given** a resume has non-standard section headers
**When** parsing runs
**Then** the system makes best-effort categorization
**And** unrecognized sections are placed in "Other"

**Given** parsing completes
**When** results are saved
**Then** parsed sections are stored as JSON in `resumes.parsed_sections`
**And** parsing status is marked as `completed`

**Technical Notes:**
- Create `lib/parsers/resume.ts` for section parsing logic
- Use regex patterns + heuristics for section detection
- Add column `parsed_sections` (JSONB) to `resumes` table
- Consider using OpenAI for complex parsing (optional, can be enhanced later)
- Store structured data for each section type

---

## Story 3.4: Resume Preview Display

As a **user**,
I want **to view my extracted resume content before analysis**,
So that **I can verify the content was captured correctly**.

**Acceptance Criteria:**

**Given** my resume has been uploaded and processed
**When** I view the resume preview
**Then** I see my resume content organized by section
**And** each section (Contact, Education, Experience, Skills, Projects) is clearly labeled
**And** the content matches what's in my original resume

**Given** I am viewing the resume preview
**When** I look at the Experience section
**Then** I see each job entry with company, title, and dates
**And** bullet points are displayed in a readable format

**Given** I am viewing the resume preview
**When** I look at the Skills section
**Then** I see my skills listed clearly
**And** technical skills are visually distinguished (if categorized)

**Given** extraction or parsing failed
**When** I view the preview area
**Then** I see the error message explaining what went wrong
**And** I see an option to re-upload my resume

**Given** processing is still in progress
**When** I view the preview area
**Then** I see a loading skeleton or spinner
**And** the UI updates automatically when processing completes

**Technical Notes:**
- Create `components/analysis/ResumePreview.tsx`
- Display sections in expandable/collapsible cards
- Use skeleton loading states (shadcn Skeleton)
- Highlight any parsing warnings or issues
- Allow user to proceed even if some sections weren't detected

---

## Story 3.5: Job Description Input

As a **user**,
I want **to paste a job description**,
So that **my resume can be analyzed against it**.

**Acceptance Criteria:**

**Given** I am on the new scan page
**When** I view the job description input area
**Then** I see a large textarea for pasting the JD
**And** I see a character counter showing current/max (0/5000)
**And** I see helper text "Paste the full job description"

**Given** I paste a job description under 5000 characters
**When** the text is entered
**Then** the character counter updates in real-time
**And** the text is accepted without error

**Given** I paste or type text exceeding 5000 characters
**When** the validation runs
**Then** I see an error "Job description must be under 5000 characters"
**And** the character counter shows red/warning color
**And** I cannot proceed until I reduce the length

**Given** I try to proceed with an empty job description
**When** validation runs
**Then** I see an error "Please enter a job description"
**And** I cannot proceed

**Given** I paste a job description under 100 characters
**When** validation runs
**Then** I see a warning "Job description seems short. Include the full posting for best results"
**And** I can still proceed (warning, not error)

**Given** a valid job description is entered
**When** keyword extraction runs (client-side preview)
**Then** I see a preview of detected keywords/skills
**And** this helps me verify I pasted the right content

**Technical Notes:**
- Create `components/forms/JDInput.tsx`
- Use Zod schema: `z.string().min(100).max(5000)`
- Create `lib/validations/scan.ts` for scan input schemas
- Basic keyword extraction can be simple regex for preview (full extraction in Epic 4)
- Store JD in `scans` table (created in next story)

---

## Story 3.6: New Scan Page Integration

As a **user**,
I want **a single page to upload my resume and enter a job description**,
So that **I can initiate a scan with one streamlined experience**.

**Acceptance Criteria:**

**Given** I am logged in and have completed onboarding
**When** I click "New Scan" from the dashboard or sidebar
**Then** I am taken to `/scan/new`
**And** I see the resume upload component
**And** I see the job description input component
**And** I see a "Start Analysis" button (disabled until both inputs are valid)

**Given** I have uploaded a resume but not entered a JD
**When** I look at the "Start Analysis" button
**Then** it is disabled
**And** I see a hint "Enter a job description to continue"

**Given** I have entered a JD but not uploaded a resume
**When** I look at the "Start Analysis" button
**Then** it is disabled
**And** I see a hint "Upload your resume to continue"

**Given** I have both a valid resume and valid JD
**When** I click "Start Analysis"
**Then** a new scan record is created in the database
**And** the scan status is set to "pending"
**And** I am redirected to `/scan/[scanId]` to view results
**And** I see a loading state indicating analysis is in progress

**Given** I previously uploaded a resume in this session
**When** I return to the new scan page
**Then** I see my previously uploaded resume still selected
**And** I can choose to use it or upload a different one

**Given** I am on the new scan page
**When** I view the layout
**Then** resume upload is on the left (or top on mobile)
**And** JD input is on the right (or bottom on mobile)
**And** the design follows the card-based layout from UX screenshots

**Technical Notes:**
- Create `app/(dashboard)/scan/new/page.tsx`
- Create `scans` table: `id`, `user_id`, `resume_id`, `job_description`, `status` (pending/processing/completed/failed), `created_at`, `updated_at`
- Add RLS policy: users can only access their own scans
- Create `actions/scan.ts` with `createScan` action
- The actual analysis will be triggered in Epic 4

---
