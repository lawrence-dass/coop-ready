# Story 4.4: Epic 4 Integration and Verification Testing

Status: backlog

## Story

As a developer,
I want to verify that all Epic 4 stories (job description input, editing, and clearing) work correctly,
So that users can input and manage job descriptions for optimization analysis.

## Acceptance Criteria

1. **Given** Epic 4 stories are complete
   **When** I paste a job description into the input field
   **Then** the text is captured, validated, and stored in the Zustand store

2. **Given** I have entered a job description
   **When** I edit the text
   **Then** changes are saved to state and I can undo/redo (browser native)

3. **Given** I have entered a job description
   **When** I click the clear button
   **Then** the field is emptied and state is reset

4. **Given** Epic 4 is complete
   **When** I execute the verification checklist
   **Then** job description input works end-to-end and Epic 5 (ATS analysis) is unblocked

## Tasks / Subtasks

- [ ] **Task 1: Job Description Input Verification** (AC: #1)
  - [ ] Test pasting text into JD field
  - [ ] Test typing directly into JD field
  - [ ] Test text is stored in Zustand store
  - [ ] Test character count or validation status displays
  - [ ] Test max length limits (if any)

- [ ] **Task 2: Job Description Editing Verification** (AC: #2)
  - [ ] Test editing existing JD text
  - [ ] Test changes save to state immediately
  - [ ] Test browser undo (Ctrl+Z) works
  - [ ] Test browser redo (Ctrl+Y) works
  - [ ] Test copy/paste within field works

- [ ] **Task 3: Job Description Clear Verification** (AC: #3)
  - [ ] Test clear button removes all text
  - [ ] Test state is reset after clear
  - [ ] Test can enter new JD after clear
  - [ ] Test error handling if clear fails

- [ ] **Task 4: Integration Points Verification** (AC: #4)
  - [ ] Verify JD integrates with Epic 2 session (saved to Supabase)
  - [ ] Verify JD data flows to Epic 5 (analysis) correctly
  - [ ] Verify JobDescription type is used correctly
  - [ ] Verify no console errors

- [ ] **Task 5: Create Verification Checklist** (AC: #4)
  - [ ] Create `/docs/EPIC-4-VERIFICATION.md`
  - [ ] Include input/edit/clear test cases
  - [ ] Include edge cases (very long JD, special characters, etc.)
  - [ ] Update README with reference

## Dev Notes

### What Epic 4 Delivers

- **Story 4.1:** Job Description Input - Text area for JD
- **Story 4.2:** Job Description Editing - Text editing capabilities
- **Story 4.3:** Job Description Clear - Button to reset

### Dependencies

- Epic 2: Session must exist
- Epic 3: Resume must be uploaded first (typical flow)
- Types: JobDescription type from `/types`

### Verification Success Criteria

✅ Can input job description text
✅ Text persists in Zustand store
✅ Can edit JD without errors
✅ Browser undo/redo works
✅ Can clear and start over
✅ Data saves to session
✅ No console errors
✅ Ready for analysis in Epic 5
