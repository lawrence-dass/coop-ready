# Story 10.4: Epic 10 Integration and Verification Testing

Status: backlog

## Story

As a developer,
I want to verify that all Epic 10 stories (history view, session reload, and history deletion) work correctly,
So that users can view past optimizations and reload previous sessions.

## Acceptance Criteria

1. **Given** I have completed optimizations
   **When** I view my history
   **Then** I see up to 10 previous optimization sessions with metadata

2. **Given** I have a previous optimization in history
   **When** I click reload
   **Then** the session loads with all data (resume, JD, analysis, suggestions)

3. **Given** I have items in my history
   **When** I delete a history item
   **Then** the item is removed from history

4. **Given** Epic 10 is complete
   **When** I execute the verification checklist
   **Then** history tracking works end-to-end and Epic 11 (comparison) is ready

## Tasks / Subtasks

- [ ] **Task 1: History List Verification** (AC: #1)
  - [ ] Complete several optimizations
  - [ ] View history list
  - [ ] Verify up to 10 items shown
  - [ ] Verify metadata shown (date, JD preview, score)
  - [ ] Verify oldest items removed when limit exceeded

- [ ] **Task 2: Session Reload Verification** (AC: #2)
  - [ ] Click on history item to reload
  - [ ] Verify resume content loaded
  - [ ] Verify JD content loaded
  - [ ] Verify analysis results loaded
  - [ ] Verify suggestions loaded
  - [ ] Verify UI state restored

- [ ] **Task 3: History Deletion Verification** (AC: #3)
  - [ ] Delete history item
  - [ ] Verify confirmation before delete
  - [ ] Verify item removed from list
  - [ ] Verify database updated
  - [ ] Verify can't reload deleted session

- [ ] **Task 4: Integration Verification** (AC: #4)
  - [ ] Verify Epic 8 (auth) for persistent history
  - [ ] Verify history associated with user_id
  - [ ] Verify each user has separate history
  - [ ] Verify OptimizationSession type used

- [ ] **Task 5: Create Verification Checklist** (AC: #4)
  - [ ] Create `/docs/EPIC-10-VERIFICATION.md`
  - [ ] Include history flow tests
  - [ ] Update README with reference

## Dev Notes

### What Epic 10 Delivers

- **Story 10.1:** History List View - Display 10 most recent
- **Story 10.2:** Session Reload - Load previous optimization
- **Story 10.3:** History Deletion - Remove from history

### Constraints

- Max 10 sessions in history
- Requires authenticated user (Epic 8)
- Each user has separate history

### Dependencies

- Epic 8: User authentication
- Database: Optimizations/history table
- Types: OptimizationSession

### Verification Success Criteria

✅ History list shows sessions
✅ Can reload previous session
✅ Reloaded session has all data
✅ Can delete history items
✅ History limited to 10 items
✅ Oldest auto-removed when limit exceeded
✅ Each user separate history
✅ No console errors
