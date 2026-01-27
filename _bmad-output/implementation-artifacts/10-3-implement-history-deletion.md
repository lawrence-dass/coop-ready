# Story 10.3: Implement History Deletion

Status: ready-for-dev

## Story

As a user,
I want to delete items from my history,
So that I can clean up old sessions.

## Acceptance Criteria

1. User can see a delete button/icon on each history entry
2. Clicking delete shows a confirmation dialog
3. Dialog asks "Are you sure? This action cannot be undone."
4. User can cancel or confirm deletion
5. Upon confirmation, the session is permanently removed from database
6. History list updates immediately after deletion (without page reload)
7. Deletion completes within 1 second
8. Error message shown if deletion fails
9. User cannot delete other users' sessions

## Tasks / Subtasks

- [ ] Task 1: Create server action to delete session (AC: #5, #7, #8, #9)
  - [ ] Implement `deleteOptimizationSession` server action
  - [ ] Verify user owns the session (user_id check)
  - [ ] Delete from `sessions` table by ID
  - [ ] Return ActionResponse<{ deleted: true }>
  - [ ] Handle not-found gracefully
  - [ ] Return `UNAUTHORIZED` if user doesn't own session
- [ ] Task 2: Add delete button to history entries (AC: #1)
  - [ ] Add delete icon/button to HistoryListView entry cards
  - [ ] Button appears on hover or always visible
  - [ ] Button has aria-label for accessibility
  - [ ] Button uses appropriate color (red/danger) for destructive action
- [ ] Task 3: Create confirmation dialog component (AC: #2, #3, #4)
  - [ ] Create `DeleteSessionDialog.tsx` component
  - [ ] Shows confirmation message: "Are you sure? This action cannot be undone."
  - [ ] Shows session details (date, resume name) for context
  - [ ] Has "Cancel" and "Delete" buttons
  - [ ] Dialog closes on cancel or successful delete
  - [ ] Uses shadcn Dialog or Alert Dialog component
- [ ] Task 4: Integrate deletion with history list (AC: #6)
  - [ ] Add state to track which session has delete dialog open
  - [ ] Call server action on delete confirmation
  - [ ] Remove deleted session from `historyItems` in store
  - [ ] Remove from UI without page reload
  - [ ] Show success toast notification
- [ ] Task 5: Add error handling (AC: #8, #9)
  - [ ] Handle network errors gracefully
  - [ ] Show toast with error message if deletion fails
  - [ ] Log error for debugging
  - [ ] Keep deleted session in list if error occurs (user can retry)
  - [ ] Handle permission errors (UNAUTHORIZED, DELETE_ERROR codes)
- [ ] Task 6: Write tests for history deletion (AC: all)
  - [ ] Test server action with valid session
  - [ ] Test server action with unauthorized user
  - [ ] Test server action with non-existent session
  - [ ] Test UI shows delete button
  - [ ] Test confirmation dialog opens/closes
  - [ ] Test UI updates after successful deletion
  - [ ] Test error handling and retry flow
  - [ ] Test E2E: click delete → confirm → verify removed

## Dev Notes

### Architecture Patterns

- **Database Access**: Use `/lib/supabase/` function to delete session. Follow RLS principles (user_id validation)
- **Error Handling**: Follow ActionResponse<T> pattern. Return `UNAUTHORIZED` or `DELETE_ERROR` codes
- **State Management**: Update Zustand store immediately after deletion (optimistic update OK, revert on error)
- **UI Feedback**: Use toast notifications (sonner) for success/error messages
- **Confirmation Dialog**: Use shadcn/ui Dialog or AlertDialog for consistency
- **Accessibility**: Ensure dialog is keyboard accessible, has proper focus management

### Source Tree Components to Touch

1. `/lib/supabase/` - Add function to delete session (DELETE with user_id check)
2. `/components/shared/` - Modify HistoryListView to add delete button and integrate dialog
3. `/components/shared/` - Create DeleteSessionDialog component
4. `/store/` - Add action to remove item from historyItems
5. `/actions/` - Create server action for deleting session
6. `/types/` - Add error codes for deletion (DELETE_ERROR if needed)
7. `/tests/` - Add unit and E2E tests

### Testing Standards Summary

- Test server action with three scenarios: success, unauthorized, not found
- Test UI button appears and dialog opens/closes
- Test optimistic update (remove from list before server responds)
- Test error rollback (restore item if deletion fails)
- E2E: navigate to history → click delete on entry → confirm → verify entry gone and toast shown
- Mock Supabase for unit tests

### Project Structure Notes

- Error code: `DELETE_ERROR` (add to types/error-codes.ts if not present)
- Dialog follows shadcn/ui patterns used elsewhere in project
- Delete action remains quick (< 1 second) since it's just a DB delete, no LLM involved
- Optimistic UI updates are safe here because delete is idempotent (can't delete twice)
- Keep track of "deleting" state to disable button while request in flight

### References

- **Server Actions**: [Source: _bmad-output/project-context.md#API Patterns]
- **ActionResponse Pattern**: [Source: _bmad-output/project-context.md#ActionResponse Pattern]
- **Zustand Pattern**: [Source: _bmad-output/project-context.md#Zustand Store Pattern]
- **Dialog Component**: shadcn/ui Dialog or AlertDialog
- **Toast Notifications**: sonner library (already in use)
- **User Isolation**: Supabase RLS via user_id column
- **Previous Deletion Patterns**: Review Story 9-3 (Resume Deletion) for similar implementation

## Dev Agent Record

### Agent Model Used

To be filled in by dev agent

### Debug Log References

(None yet)

### Completion Notes List

(None yet)

### File List

(Will be updated during implementation)
