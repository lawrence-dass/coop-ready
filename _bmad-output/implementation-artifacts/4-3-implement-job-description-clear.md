# Story 4.3: Implement Job Description Clear

**Status:** ready-for-dev

## Story

As a user,
I want to clear the job description,
So that I can start over with a different job posting.

## Acceptance Criteria

1. **Given** I have entered a job description
   **When** I click the clear button
   **Then** the job description field is emptied
   **And** the state is updated
   **And** I can enter a new job description

## Tasks / Subtasks

- [ ] **Task 1: Implement Clear Button in JobDescriptionInput** (AC: #1)
  - [ ] Add "Clear" button to JobDescriptionInput component (appears only when JD has content)
  - [ ] Style button with appropriate icon (lucide-react: X or Trash icon)
  - [ ] Position button next to character count or in textarea footer
  - [ ] Add hover/active states consistent with design system
  - [ ] Implement onClick handler that calls onClear callback

- [ ] **Task 2: Connect Clear to Store Action** (AC: #1)
  - [ ] Ensure store.clearJobDescription() action exists (from Story 4.1)
  - [ ] Wire onClick handler to call store.clearJobDescription()
  - [ ] Verify state is cleared to null or empty string
  - [ ] Confirm persistence (Supabase session) is cleared as well

- [ ] **Task 3: Test Clear Button Interaction** (AC: #1)
  - [ ] Test clear button is hidden when JD is empty
  - [ ] Test clear button is visible when JD has content
  - [ ] Test clicking clear button empties the textarea
  - [ ] Test state in Zustand store is cleared
  - [ ] Test clearing triggers validation update (back to "required" state)
  - [ ] Test can immediately enter new JD after clearing

- [ ] **Task 4: Test Clear + Persistence Interaction** (AC: #1)
  - [ ] Test clear button clears Supabase session (via hooks)
  - [ ] Test reload after clear shows empty textarea
  - [ ] Test previous JD doesn't reappear after clear (durable deletion)
  - [ ] Test can enter different JD after clear + reload

- [ ] **Task 5: Test Clear + Validation Flow** (AC: #1)
  - [ ] Test character count resets to 0 after clear
  - [ ] Test validation status changes to "required" after clear
  - [ ] Test validation helper returns false for empty JD
  - [ ] Test multiple clear cycles work correctly

- [ ] **Task 6: Add Unit Tests** (AC: #1)
  - [ ] Test clear button renders when JD present
  - [ ] Test clear button hidden when JD empty
  - [ ] Test onClear callback fires correctly
  - [ ] Test store action clears state
  - [ ] Test character count resets

- [ ] **Task 7: Add Integration Tests** (AC: #1)
  - [ ] Test flow: paste → clear → verify empty
  - [ ] Test flow: paste → clear → paste different → verify new
  - [ ] Test flow: paste → clear → reload → verify persisted empty
  - [ ] Test multiple clear cycles in same session

## Dev Notes

### Job Description Clear Architecture

**Data Flow:**
```
User clicks Clear button
   → onClick event fires
   → Calls store.clearJobDescription()
   → Sets jdContent to null/empty string
   → Component re-renders textarea as empty
   → Character count resets to 0
   → Validation status back to "required"
   → Persistence hook updates Supabase session
   → Clear button hidden (no content)
   → Focus can be restored to textarea for immediate new input
```

### Component Changes: JobDescriptionInput

The "Clear" button already exists in JobDescriptionInput from Story 4.1:
```typescript
{value.length > 0 && (
  <button
    onClick={onClear}
    disabled={isDisabled}
    className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
  >
    Clear
  </button>
)}
```

**This story validates that:**
1. Clear button functions correctly
2. Store action properly clears state
3. UI updates after clearing
4. Persistence is cleared
5. No data leakage on clear

### Clear Button Behavior

**Button Visibility:**
- Hidden when JD is empty (value.length === 0)
- Visible when JD has content (value.length > 0)
- Disabled when component is loading/disabled

**Button Interaction:**
- Clicking fires onClear callback
- Callback calls store.clearJobDescription()
- Store clears jdContent field
- Component re-renders with empty textarea
- Character count shows "0 characters"
- Validation shows "required" state

**UX Pattern:**
- Non-intrusive: button only shows when needed
- Clear visual affordance (X or Trash icon)
- Immediate feedback (textarea empties instantly)
- No confirmation dialog (clearing is a reversible action - user can undo)

### Store Action: clearJobDescription

The store already has this action from Story 4.1:
```typescript
clearJobDescription: () => set({ jobDescription: null }),
```

This story verifies:
1. Action correctly sets state to null
2. Persistence hooks properly clear the field
3. Component re-renders after state change
4. No orphaned data remains

### Testing Strategy

**Unit Tests:**
1. Button visibility based on content
2. onClear callback fires correctly
3. Store action clears state
4. Character count resets
5. Validation state updates

**Integration Tests:**
1. Full clear flow: paste → clear → verify empty
2. Clear + new input: paste → clear → paste new → verify
3. Clear + persistence: paste → clear → reload → verify empty
4. Multiple clears: clear → input → clear → input → verify

### UX Specification Alignment

From UX Design:
- Clear, intuitive actions that don't require confirmation
- Immediate visual feedback on user interactions
- Non-destructive patterns (undo available)
- Consistent with design system colors and spacing

**Clear Button Design:**
- Position: Next to character count (bottom right of textarea)
- Icon: Trash or X icon (lucide-react)
- Color: Gray when neutral, darker on hover
- Text/Icon: Clear or just icon (minimize visual noise)
- Visibility: Only when needed (content present)

### Scope Clarification

**In Scope:**
- ✅ Clear button implementation
- ✅ Store action integration
- ✅ UI state updates after clear
- ✅ Persistence clearing
- ✅ Validation state updates

**Out of Scope:**
- ❌ Confirmation dialog (not needed for MVP)
- ❌ Undo after clear (browser native undo covers this)
- ❌ Batch clear (only clearing JD, not resume)

### Acceptance Criteria Mapping

**AC #1:** "Job description field is emptied"
- Covered by: store.clearJobDescription() sets jdContent to null ✓
- Tested by: Unit test verifying textarea is empty after clear

**AC #2:** "State is updated"
- Covered by: Zustand store updates state, triggers re-render ✓
- Tested by: Store test verifying state change

**AC #3:** "I can enter a new job description"
- Covered by: After clear, textarea is editable and accepts input ✓
- Tested by: Integration test paste → clear → paste flow

### Files Changed from Story 4.1

The JobDescriptionInput component and store already have the clear functionality:
- Component already has Clear button
- Store already has clearJobDescription action
- This story validates they work correctly

**This story adds:**
- Comprehensive tests for clear behavior
- Integration tests for clear + persistence
- Verification of validation updates

### File Structure After This Story

```
/tests/
├── unit/
│   └── 4-3-clear-button.test.tsx      ← NEW: Test clear button
└── integration/
    └── 4-3-clear-flow.test.tsx        ← NEW: Test complete clear workflow
```

### Previous Story Dependencies

- **Story 4.1:** JobDescriptionInput component with Clear button ✓
- **Story 2.2:** Session persistence (hooks auto-clear on store change) ✓
- **Story 4.2:** Editing behavior (clear after edits should work) ✓

### Edge Cases to Test

1. **Rapid Clear Clicks:** User clicks clear button multiple times rapidly
   - Should not cause issues, idempotent operation

2. **Clear with Validation Error:** User has invalid JD (< 50 chars), then clears
   - Should return to "required" state, not error state

3. **Clear During Load:** User clicks clear while analysis is running
   - Button should be disabled (isDisabled prop)
   - Clear shouldn't interfere with in-flight requests

4. **Clear with Undo:** User clears then presses Ctrl+Z
   - Browser native undo restores text (not our concern)
   - Our state should not re-populate on undo

5. **Clear Across Sessions:** User clears, closes browser, reopens
   - Empty state should persist in Supabase
   - Should not restore old value

### References

- [Source: epics.md#Story 4.3 Acceptance Criteria]
- [Source: components/shared/JobDescriptionInput.tsx] - Clear button implementation (Story 4.1)
- [Source: store/useOptimizationStore.ts] - clearJobDescription action (Story 4.1)
- [Source: CLAUDE.md#Testing] - Test structure and conventions

## File List

- `tests/unit/4-3-clear-button.test.tsx` (new)
- `tests/integration/4-3-clear-flow.test.tsx` (new)

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Implementation Status

**Story Created:** 2026-01-25
**Status:** ready-for-dev
**Context:** Epic 4, Story 3 - Job Description Clear
**Dependencies:** Story 4.1 ✅, Story 2.2 ✅

### Story Scope

Lightweight story focused on testing the clear functionality that already exists in the JobDescriptionInput component (from Story 4.1). The component and store already have:
- ✅ Clear button implementation
- ✅ Store action (clearJobDescription)
- ✅ Callback wiring

**Work:** Create comprehensive tests to verify clear behavior works correctly.

### Critical Implementation Path

1. Review Clear button in JobDescriptionInput (Story 4.1)
2. Verify store.clearJobDescription() action
3. Test clear button interaction
4. Test state updates after clear
5. Test persistence clears
6. Test validation state updates
7. Write unit + integration tests

### Known Patterns to Reuse

- Button testing pattern (React Testing Library)
- Store testing pattern (Zustand)
- Integration testing with persistence
- Validation testing

