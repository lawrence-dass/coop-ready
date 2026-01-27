# Story 9.4: Epic 9 Integration and Verification Testing

Status: done

## Story

As a developer,
I want to verify that all Epic 9 stories (resume library save, selection, and deletion) work correctly,
So that users can save up to 3 resumes and manage their resume collection.

## Acceptance Criteria

1. **Given** I have optimized a resume
   **When** I click save resume
   **Then** the resume is saved to my library (up to 3 total)

2. **Given** I have resumes in my library
   **When** I need to optimize another resume
   **Then** I can select from my library instead of uploading again

3. **Given** I have a resume in my library
   **When** I click delete
   **Then** the resume is removed from my library

4. **Given** Epic 9 is complete
   **When** I execute the verification checklist
   **Then** resume library works end-to-end and Epic 10 (history) is ready

## Tasks / Subtasks

- [x] **Task 1: Save Resume Verification** (AC: #1)
  - [x] Test saving resume after optimization
  - [x] Verify resume stored in database
  - [x] Verify save shows success message
  - [x] Test saving up to 3 resumes
  - [x] Test 4th save (should reject or replace oldest)

- [x] **Task 2: Resume Selection Verification** (AC: #2)
  - [x] Verify library dropdown/selector shows saved resumes
  - [x] Test selecting resume from library
  - [x] Verify selected resume loads correctly
  - [x] Test resume content reloads properly

- [x] **Task 3: Resume Deletion Verification** (AC: #3)
  - [x] Test delete button removes resume from library
  - [x] Verify confirmation prompt before delete
  - [x] Test resume no longer appears in library
  - [x] Test database updated correctly

- [x] **Task 4: Integration Verification** (AC: #4)
  - [x] Verify Epic 8 (auth) needed for library persistence
  - [x] Verify library data associated with user_id
  - [x] Verify each user has separate library
  - [x] Verify no data loss on reload

- [x] **Task 5: Create Verification Checklist** (AC: #4)
  - [x] Create `/docs/EPIC-9-VERIFICATION.md`
  - [x] Include CRUD test cases
  - [x] Update README with reference

## Dev Notes

### What Epic 9 Delivers

- **Story 9.1:** Save Resume to Library - Store in database
- **Story 9.2:** Resume Selection - Load from library
- **Story 9.3:** Resume Deletion - Remove from library

### Constraints

- Max 3 resumes per user
- Only for authenticated users
- Requires Epic 8 (user auth)

### Dependencies

- Epic 8: User authentication
- Database: Resumes table with user_id foreign key
- Types: Resume type

### Verification Success Criteria

✅ Resumes save to library
✅ Can select saved resumes
✅ Can delete resumes
✅ Library limited to 3 resumes
✅ Each user has separate library
✅ Data persists across sessions
✅ No console errors
