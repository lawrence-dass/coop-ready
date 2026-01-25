# Story 4.2: Implement Job Description Editing

**Status:** ready-for-dev

## Story

As a user,
I want to edit the job description before optimization,
So that I can clean up formatting or make adjustments.

## Acceptance Criteria

1. **Given** I have pasted a job description
   **When** I make changes to the text
   **Then** the changes are saved to state
   **And** I can undo/redo changes (browser native)
   **And** the textarea supports standard text editing

## Tasks / Subtasks

- [ ] **Task 1: Verify Textarea Supports Native Editing** (AC: #1)
  - [ ] Confirm JobDescriptionInput component (from Story 4.1) allows text editing
  - [ ] Verify onChange callback correctly captures edit events
  - [ ] Test that all standard textarea interactions work (cursor positioning, selection, deletion)
  - [ ] Confirm native undo/redo (Ctrl+Z/Cmd+Z) works automatically from browser

- [ ] **Task 2: Test Multi-Cycle Edit Behavior** (AC: #1)
  - [ ] Test paste → edit → paste again flow (multiple edits)
  - [ ] Verify state consistency after each edit (no loss of text)
  - [ ] Test rapid edits (fast typing) update state correctly
  - [ ] Confirm debouncing not needed (state updates immediately for UX feedback)

- [ ] **Task 3: Implement Edit History Tracking (Optional Enhancement)** (AC: #1)
  - [ ] Add simple edit tracking to store (before/after states for debugging)
  - [ ] Log edit timestamps for analytics (if needed for Story 10 history)
  - [ ] Note: Full undo/redo stack deferred to future enhancement (out of scope)
  - [ ] Confirm native browser undo/redo is sufficient for MVP

- [ ] **Task 4: Verify Form State Consistency** (AC: #1)
  - [ ] Test that edited JD remains in focus when component updates
  - [ ] Verify cursor position isn't lost during state updates (use controlled component pattern)
  - [ ] Test that clearing via Task 3.1 story (4.3) doesn't interfere with editing

- [ ] **Task 5: Add Unit Tests for Edit Behavior** (AC: #1)
  - [ ] Test onChange fires on user input (typing, pasting, deleting)
  - [ ] Test state updates reflect in textarea value
  - [ ] Test rapid successive edits don't cause race conditions
  - [ ] Test validation updates during editing (status changes as user types)
  - [ ] Test validation helper correctly identifies valid JD after edits

- [ ] **Task 6: Add Integration Tests** (AC: #1)
  - [ ] Test complete edit flow: paste → edit → verify state → verify persistence
  - [ ] Test multiple edit cycles in same session
  - [ ] Test edit + clear interaction (4.3 story dependency)
  - [ ] Test native undo/redo preserves component state correctly

## Dev Notes

### Job Description Editing Architecture

**Key Insight:** This story is primarily about validation and verification of existing functionality, not new feature development. The JobDescriptionInput component from Story 4.1 already supports editing via the native textarea element.

**Data Flow:**
```
User types/edits in textarea
   → onChange event fires
   → Captured text passed to store.setJDContent(text)
   → Component re-renders with updated value
   → Validation runs automatically
   → Cursor position maintained by controlled component
   → Native undo/redo works automatically
```

### What's Already Working (From Story 4.1)

The JobDescriptionInput component already has:
- ✅ Controlled textarea component (value prop)
- ✅ onChange callback that captures edits
- ✅ Real-time state updates via Zustand
- ✅ Validation that runs on every edit
- ✅ Character counter that updates dynamically
- ✅ Clear button to reset text

**This story validates and tests these features work correctly for editing.**

### What NOT to Implement

- ❌ Custom undo/redo (browser native is sufficient)
- ❌ Edit history logging (not required for MVP)
- ❌ Collaborative editing (out of scope)
- ❌ Rich text editing (plain text only)

### Testing Strategy

**Unit Tests (verify component behavior):**
1. onChange callback fires on input changes
2. State reflects typed characters
3. Validation updates during typing
4. Character count changes correctly
5. Multiple rapid edits processed in order

**Integration Tests (verify full workflow):**
1. User paste → edit → verify state flow
2. Edit cycles with validation checks
3. Interaction with Story 4.3 (Clear button)
4. Session persistence across edits (Story 2.2 integration)

### File Structure After This Story

```
/components/shared/
├── JobDescriptionInput.tsx  ← Already created in Story 4.1 (no changes)
├── index.ts                 ← Already exports JobDescriptionInput

/tests/
├── unit/
│   └── 4-2-edit-behavior.test.tsx ← NEW: Test edit functionality
└── integration/
    └── 4-2-edit-flow.test.tsx      ← NEW: Test complete edit workflow
```

### Previous Story Learnings (From Story 4.1)

**Component Pattern:**
- Use controlled textarea with value prop
- onChange captures all input changes
- Real-time state updates via store action
- Validation runs automatically on every change
- Component handles validation visual feedback

**Store Pattern:**
- Action naming: setJDContent (verb + noun)
- Direct state updates (no debouncing needed)
- Persistence via Supabase session (automatic via hooks)

**Testing Pattern:**
- Test component interaction (onChange, state)
- Test store state changes
- Test validation logic
- Test integration with session persistence

### Browser Native Undo/Redo

The textarea element automatically supports native undo/redo:
- **Undo:** Ctrl+Z (Windows) or Cmd+Z (Mac)
- **Redo:** Ctrl+Y or Ctrl+Shift+Z (Windows) or Cmd+Shift+Z (Mac)

This works automatically with the controlled component pattern because:
1. Textarea is standard HTML element
2. Browser maintains its own undo stack
3. Our onChange handler captures each keystroke
4. No need for custom implementation

**Testing:** User should be able to:
1. Type some text
2. Press Ctrl+Z (or Cmd+Z) → text disappears
3. Press Ctrl+Y (or Cmd+Shift+Z) → text reappears

This happens automatically in browsers and doesn't need testing in our code.

### Scope Clarification

**In Scope:**
- ✅ Testing that editing works (onChange, state updates)
- ✅ Validating multiple edits in sequence
- ✅ Confirming form state consistency during edits
- ✅ Testing interaction with persistence (Story 2.2)

**Out of Scope (Deferred):**
- ❌ Custom undo/redo UI (use browser native)
- ❌ Advanced edit tracking/analytics
- ❌ Collaborative editing
- ❌ Rich text formatting

### Acceptance Criteria Mapping

**AC #1:** "When I make changes to the text, changes are saved to state"
- Covered by: onChange callback → setJDContent action → state update ✓
- Tested by: Unit test verifying state updates on input change

**AC #2:** "I can undo/redo changes (browser native)"
- Covered by: Native textarea undo/redo (automatic in browsers) ✓
- Tested by: Manual browser testing (not automated)

**AC #3:** "The textarea supports standard text editing"
- Covered by: Native textarea element with standard editing ✓
- Tested by: Integration test verifying edit flow works

### References

- [Source: epics.md#Story 4.2 Acceptance Criteria]
- [Source: components/shared/JobDescriptionInput.tsx] - Component implementation (Story 4.1)
- [Source: store/useOptimizationStore.ts] - Store pattern
- [Source: CLAUDE.md#Testing] - Test structure and conventions

## File List

- `tests/unit/4-2-edit-behavior.test.tsx` (new)
- `tests/integration/4-2-edit-flow.test.tsx` (new)

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Implementation Status

**Story Created:** 2026-01-25
**Status:** ready-for-dev
**Context:** Epic 4, Story 2 - Job Description Editing
**Dependency:** Story 4.1 (JobDescriptionInput component) - ✅ Complete

### Story Scope

This is a lightweight story focused on validating and testing the editing functionality of the JobDescriptionInput component from Story 4.1. The component already supports all required functionality:
- Text input and editing
- State management
- Validation
- Browser native undo/redo

**Work:** Create tests to verify editing behavior works correctly.

### Critical Implementation Path

1. Review JobDescriptionInput component (from Story 4.1)
2. Verify onChange callback and state updates work
3. Test multiple edit cycles
4. Test interaction with validation
5. Test interaction with persistence (Story 2.2)
6. Verify browser native undo/redo works

### Known Patterns to Reuse

- Component testing pattern (React Testing Library)
- Store action testing (Zustand patterns)
- Validation testing
- Integration testing with store + persistence

