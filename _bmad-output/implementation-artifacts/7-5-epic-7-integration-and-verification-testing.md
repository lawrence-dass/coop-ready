# Story 7.5: Epic 7 Integration and Verification Testing

Status: backlog

## Story

As a developer,
I want to verify that all Epic 7 stories (error display, retry, timeout recovery, and feedback) work correctly,
So that users have a smooth recovery experience when things go wrong.

## Acceptance Criteria

1. **Given** an error occurs during optimization
   **When** the user views the error message
   **Then** they see error type, plain-language explanation, and suggested recovery action

2. **Given** an error has occurred
   **When** I click retry
   **Then** the failed operation is retried without losing state

3. **Given** an LLM operation times out
   **When** the system recovers
   **Then** the user sees timeout error and can retry or proceed otherwise

4. **Given** Epic 7 is complete
   **When** I execute the verification checklist
   **Then** error handling works end-to-end and Epic 8 (authentication) is ready

## Tasks / Subtasks

- [ ] **Task 1: Error Display Verification** (AC: #1)
  - [ ] Trigger INVALID_FILE_TYPE error
  - [ ] Verify error message displays clearly
  - [ ] Verify recovery action suggested
  - [ ] Test all 7 error codes display correctly
  - [ ] Verify error styling is distinct from success

- [ ] **Task 2: Retry Functionality Verification** (AC: #2)
  - [ ] Simulate file upload failure
  - [ ] Click retry button
  - [ ] Verify operation retries with same inputs
  - [ ] Verify state not lost during retry
  - [ ] Test retry for different error types

- [ ] **Task 3: Timeout Recovery Verification** (AC: #3)
  - [ ] Simulate LLM timeout (60 seconds)
  - [ ] Verify timeout error displayed
  - [ ] Verify user can retry
  - [ ] Verify user can cancel and proceed
  - [ ] Test graceful handling

- [ ] **Task 4: Suggestion Feedback Verification** (AC: #4)
  - [ ] Verify thumbs up/down buttons present
  - [ ] Verify feedback recorded (if implemented in this epic)
  - [ ] Verify feedback doesn't break UI

- [ ] **Task 5: Create Verification Checklist** (AC: #4)
  - [ ] Create `/docs/EPIC-7-VERIFICATION.md`
  - [ ] Include error scenario test cases
  - [ ] Include recovery procedure tests
  - [ ] Update README with reference

## Dev Notes

### What Epic 7 Delivers

- **Story 7.1:** Error Display Component - User-friendly error UI
- **Story 7.2:** Retry Functionality - Recover from transient failures
- **Story 7.3:** Timeout Recovery - Handle 60-second timeout
- **Story 7.4:** Suggestion Feedback - Thumbs up/down on suggestions

### Error Codes to Test

- INVALID_FILE_TYPE
- FILE_TOO_LARGE
- PARSE_ERROR
- LLM_TIMEOUT
- LLM_ERROR
- RATE_LIMITED
- VALIDATION_ERROR

### Dependencies

- All previous epics (error handling is cross-cutting)
- Types: All ActionResponse error patterns

### Verification Success Criteria

✅ Error messages are clear and helpful
✅ Retry button works for transient errors
✅ Timeout handled gracefully
✅ State preserved during error recovery
✅ Feedback mechanism works
✅ UI doesn't crash on error
✅ All error codes tested
✅ Ready for user authentication in Epic 8
