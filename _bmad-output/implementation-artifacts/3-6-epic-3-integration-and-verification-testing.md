# Story 3.6: Epic 3 Integration and Verification Testing

Status: backlog

## Story

As a developer,
I want to verify that all Epic 3 stories (resume upload, validation, and parsing) work correctly end-to-end,
So that users can upload PDF/DOCX resumes with proper error handling and content extraction.

## Acceptance Criteria

1. **Given** Epic 3 stories are complete
   **When** I upload a valid PDF or DOCX file
   **Then** the file is validated, parsed, and text content is extracted successfully

2. **Given** I attempt invalid uploads
   **When** file format is wrong or exceeds 5MB
   **Then** appropriate error messages are shown with correct error codes

3. **Given** resume text is extracted
   **When** the parsing service processes it
   **Then** sections (Summary, Skills, Experience, Education) are identified and structured

4. **Given** Epic 3 is complete
   **When** I execute the verification checklist
   **Then** file upload pipeline works end-to-end and Epic 4 (job description) is unblocked

## Tasks / Subtasks

- [ ] **Task 1: File Upload Verification** (AC: #1, #2)
  - [ ] Test uploading valid PDF file → extracts text successfully
  - [ ] Test uploading valid DOCX file → extracts text successfully
  - [ ] Test upload UI shows validation feedback
  - [ ] Test drag-and-drop works
  - [ ] Test file picker selection works

- [ ] **Task 2: File Validation Verification** (AC: #2)
  - [ ] Test uploading .txt file → error code INVALID_FILE_TYPE
  - [ ] Test uploading .jpg file → error code INVALID_FILE_TYPE
  - [ ] Test uploading file > 5MB → error code FILE_TOO_LARGE
  - [ ] Test error messages are user-friendly
  - [ ] Test error messages include recovery suggestion

- [ ] **Task 3: Text Extraction Verification** (AC: #1)
  - [ ] Verify PDF extraction using unpdf library
  - [ ] Verify DOCX extraction using mammoth library
  - [ ] Test extraction with complex formatting (tables, bold, etc.)
  - [ ] Test extraction completes within 3 seconds
  - [ ] Verify extracted text is stored in session

- [ ] **Task 4: Resume Section Parsing Verification** (AC: #3)
  - [ ] Verify LLM parses sections correctly
  - [ ] Verify Resume type structure matches parsed data
  - [ ] Verify error handling if parsing fails (code: PARSE_ERROR)
  - [ ] Verify ActionResponse pattern used throughout

- [ ] **Task 5: Create Verification Checklist** (AC: #4)
  - [ ] Create `/docs/EPIC-3-VERIFICATION.md`
  - [ ] Include file upload test cases
  - [ ] Include validation error scenarios
  - [ ] Include extraction verification steps
  - [ ] Update README with reference

## Dev Notes

### What Epic 3 Delivers

- **Story 3.1:** Resume Upload UI - Drag-and-drop or file picker
- **Story 3.2:** File Validation - Format and size checks
- **Story 3.3:** PDF Text Extraction - Using unpdf
- **Story 3.4:** DOCX Text Extraction - Using mammoth
- **Story 3.5:** Resume Section Parsing - LLM structured output

### Critical Error Codes

- INVALID_FILE_TYPE - Format not PDF/DOCX
- FILE_TOO_LARGE - Exceeds 5MB limit
- PARSE_ERROR - Extraction or LLM parsing fails

### Integration Dependencies

- Epic 2: Anonymous session must exist before upload
- Epic 1: Type system, environment, database
- Error Codes: All 7 codes available from `/types`

### Verification Success Criteria

✅ PDF files upload and extract text
✅ DOCX files upload and extract text
✅ Invalid files rejected with correct error code
✅ Large files rejected with correct error code
✅ Extracted text is clean and usable
✅ Section parsing produces structured Resume type
✅ No console errors during upload/extraction
✅ Error handling follows ActionResponse pattern
