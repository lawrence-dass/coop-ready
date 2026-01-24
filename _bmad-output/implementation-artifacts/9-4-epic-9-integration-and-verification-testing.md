# Story 9.4: Epic 9 Integration and Verification Testing

Status: backlog

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

- [ ] **Task 1: Save Resume Verification** (AC: #1)
  - [ ] Test saving resume after optimization
  - [ ] Verify resume stored in database
  - [ ] Verify save shows success message
  - [ ] Test saving up to 3 resumes
  - [ ] Test 4th save (should reject or replace oldest)

- [ ] **Task 2: Resume Selection Verification** (AC: #2)
  - [ ] Verify library dropdown/selector shows saved resumes
  - [ ] Test selecting resume from library
  - [ ] Verify selected resume loads correctly
  - [ ] Test resume content reloads properly

- [ ] **Task 3: Resume Deletion Verification** (AC: #3)
  - [ ] Test delete button removes resume from library
  - [ ] Verify confirmation prompt before delete
  - [ ] Test resume no longer appears in library
  - [ ] Test database updated correctly

- [ ] **Task 4: Integration Verification** (AC: #4)
  - [ ] Verify Epic 8 (auth) needed for library persistence
  - [ ] Verify library data associated with user_id
  - [ ] Verify each user has separate library
  - [ ] Verify no data loss on reload

- [ ] **Task 5: Create Verification Checklist** (AC: #4)
  - [ ] Create `/docs/EPIC-9-VERIFICATION.md`
  - [ ] Include CRUD test cases
  - [ ] Update README with reference

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
