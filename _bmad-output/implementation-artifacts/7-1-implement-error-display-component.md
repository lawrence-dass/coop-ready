# Story 7.1: Implement Error Display Component

Status: ready-for-dev

---

## Story

As a user,
I want to see clear error messages when something goes wrong,
So that I understand what happened and what to do next.

## Acceptance Criteria

1. **Error type display:** Users see the error type/category (e.g., "Optimization Failed", "File Upload Error", "Network Error")
2. **Plain-language explanation:** Error message clearly explains what went wrong in user-friendly language (not technical jargon)
3. **Recovery suggestion:** Error message includes a specific suggested recovery action (e.g., "Try again", "Upload a different file", "Check your internet connection")
4. **Visual design compliance:** Error display follows UX design specification (red/danger color scheme, clear typography, accessible layout)
5. **Error code display:** Error code is shown (e.g., LLM_TIMEOUT, INVALID_FILE_TYPE) for debugging/support purposes
6. **Dismissible:** Users can dismiss/close the error message
7. **Accessibility:** Error messages are announced to screen readers (aria-live region)
8. **Context preservation:** Dismissing an error doesn't clear user input (resume, JD content preserved)

## Tasks / Subtasks

- [ ] Task 1: Analyze error types and create display mapping (AC: #1, #2, #3)
  - [ ] List all possible errors from project-context.md error codes
  - [ ] Map each error code to plain-language message
  - [ ] Define recovery action for each error type
  - [ ] Group errors by category (File errors, LLM errors, Validation errors, Network errors)

- [ ] Task 2: Create ErrorDisplay component (AC: #1-7)
  - [ ] Create `/components/shared/ErrorDisplay.tsx`
  - [ ] Import Alert/AlertCircle from lucide-react and shadcn/ui
  - [ ] Design TypeScript interface with error code, message, recovery action
  - [ ] Implement main error card layout with icon, title, message, recovery hint
  - [ ] Add dismissible X button functionality
  - [ ] Add aria-live="polite" and role="alert" for accessibility
  - [ ] Use danger color scheme (#EF4444) from design system
  - [ ] Add error code display in small monospace font for debugging

- [ ] Task 3: Implement error messaging service (AC: #1, #2, #3)
  - [ ] Create `/lib/errorMessages.ts` utility module
  - [ ] Export `getErrorDisplay(errorCode: string)` function
  - [ ] Return object: `{ title, message, recoveryAction }`
  - [ ] Handle all standardized error codes from project-context.md
  - [ ] Include LLM_TIMEOUT, LLM_ERROR, INVALID_FILE_TYPE, FILE_TOO_LARGE, PARSE_ERROR, RATE_LIMITED, VALIDATION_ERROR
  - [ ] Provide sensible defaults for unknown error codes

- [ ] Task 4: Integrate with existing error handling (AC: #4, #8)
  - [ ] Review current error handling in `/store/useOptimizationStore.ts`
  - [ ] Update store to track error with full error object (code + message)
  - [ ] Ensure error state resets when user inputs change
  - [ ] Test that dismissing error doesn't clear other state

- [ ] Task 5: Add ErrorDisplay to main layout (AC: #1-8)
  - [ ] Find optimal placement for error display in `/app/page.tsx` or `/components/OptimizationFlow.tsx`
  - [ ] Conditionally render ErrorDisplay when store.error is set
  - [ ] Wire up dismissal to `store.clearError()` action
  - [ ] Ensure error displays above other content
  - [ ] Test visibility on mobile (responsive placement)

- [ ] Task 6: Add context-aware error handling in API calls (AC: #1, #2, #3, #6)
  - [ ] Review `/app/api/optimize/route.ts` error responses
  - [ ] Ensure all error responses include standardized error code
  - [ ] Review `/actions/*.ts` server actions for proper error handling
  - [ ] Ensure no errors are thrown (use ActionResponse pattern)
  - [ ] Add logging for debugging (but no PII in logs)

- [ ] Task 7: Test error display with all error types (AC: #1-8)
  - [ ] Unit test: ErrorDisplay component renders with all error codes
  - [ ] Unit test: Error message getter provides proper text for each code
  - [ ] Unit test: Dismiss button clears error state
  - [ ] Integration test: File upload error shows in ErrorDisplay
  - [ ] Integration test: LLM timeout shows with recovery suggestion
  - [ ] Accessibility test: Screen reader can read error message
  - [ ] Manual test: Verify mobile responsiveness
  - [ ] Manual test: Verify error doesn't clear user input

## Dev Notes

### Architecture Compliance

**From project-context.md:**
- Pattern: Zustand store for error state management
- Component placement: `/components/shared/ErrorDisplay.tsx`
- Error codes: Must use exact codes defined in project-context.md
- Accessibility: aria-live for announcements, role="alert"
- Design: Use destructive/danger color (#EF4444), match FileValidationError.tsx pattern
- Directory structure: Components in `/components/shared/`, utilities in `/lib/`

**Error Codes (From project-context.md - Use Exactly):**
| Code | When to Use |
|------|-------------|
| INVALID_FILE_TYPE | Wrong file format (not PDF/DOCX) |
| FILE_TOO_LARGE | Exceeds 5MB |
| PARSE_ERROR | Can't extract text from file |
| LLM_TIMEOUT | 60s timeout exceeded |
| LLM_ERROR | API failure/unknown error |
| RATE_LIMITED | Too many requests |
| VALIDATION_ERROR | Bad/invalid input |

### Previous Story Intelligence

**Story 6.7 (Regenerate Suggestions) - Just Completed:**
- Error handling pattern: Toast notifications for quick feedback + error state in store
- Integration pattern: Error state cleared when successful operation completes
- Takeaway: Use toast for transient errors, ErrorDisplay component for persistent/blocking errors

**Story 6.6 (Copy to Clipboard):**
- Toast pattern: Use sonner for temporary success/error notifications
- Takeaway: Short-lived operations use toast, long operations use persistent error display

**Story 6.5 (Suggestion Display UI):**
- State management: Zustand store (useOptimizationStore)
- UI patterns: Card-based layout, skeleton loading, smooth transitions
- Takeaway: Error display should follow same card pattern as FileValidationError.tsx

**Story 3.2 (File Validation):**
- Existing component: FileValidationError.tsx handles file-specific errors
- Pattern: AlertCircle icon, red color scheme, dismissible X button
- Takeaway: ErrorDisplay should generalize this pattern for all error types

### Technical Requirements

**ErrorDisplay Component Structure:**
```typescript
interface ErrorDisplayProps {
  errorCode: string; // e.g., 'LLM_TIMEOUT'
  message?: string; // Optional custom message override
  onDismiss?: () => void;
  className?: string;
}

export function ErrorDisplay({
  errorCode,
  message,
  onDismiss,
  className
}: ErrorDisplayProps)
```

**Error Message Mapping Function:**
```typescript
interface ErrorDisplay {
  title: string; // e.g., "Optimization Failed"
  message: string; // e.g., "The optimization process took too long..."
  recoveryAction: string; // e.g., "Please try again"
  icon?: IconType; // AlertCircle, AlertTriangle, etc.
}

export function getErrorDisplay(errorCode: string): ErrorDisplay
```

**Zustand Store Updates:**
```typescript
interface OptimizationStore {
  error: {
    code: string;
    message?: string;
  } | null;
  setError: (error: { code: string; message?: string } | null) => void;
  // OR simpler:
  error: string | null; // Just the error code
  setError: (error: string | null) => void;
}
```

### File Structure & Changes

**New Files:**
1. `/components/shared/ErrorDisplay.tsx`
   - Main component for displaying errors
   - Reusable across all error scenarios
   - Follows design system (similar to FileValidationError.tsx)

2. `/lib/errorMessages.ts`
   - Mapping function: errorCode → { title, message, recoveryAction }
   - Centralized error messaging (easy to maintain/update)
   - Export `getErrorDisplay(code: string)`

**Modified Files:**
1. `/store/useOptimizationStore.ts`
   - Add or update `error` state (code or full object)
   - Add `setError(error)` and `clearError()` actions
   - Ensure error clears on new successful operations

2. `/app/page.tsx` or `/components/OptimizationFlow.tsx`
   - Add ErrorDisplay component render
   - Connect to store.error state
   - Wire up onDismiss to clearError

3. Review all API routes and server actions
   - Verify all errors return proper error codes
   - Ensure no thrown exceptions escape
   - Follow ActionResponse<T> pattern

### Error Type Mapping Examples

**File Upload Errors:**
- Code: INVALID_FILE_TYPE
- Title: "Invalid File Type"
- Message: "We only support PDF and Word documents (.pdf, .docx)"
- Recovery: "Try uploading a different file"

**File Size Errors:**
- Code: FILE_TOO_LARGE
- Title: "File Too Large"
- Message: "Your file is larger than 5MB. Try a more concise resume"
- Recovery: "Reduce your resume size and try again"

**LLM Timeout Errors:**
- Code: LLM_TIMEOUT
- Title: "Optimization Took Too Long"
- Message: "The optimization process exceeded the 60-second time limit"
- Recovery: "Please try again. Your inputs are preserved"

**LLM API Errors:**
- Code: LLM_ERROR
- Title: "Optimization Failed"
- Message: "We encountered an issue while optimizing your resume"
- Recovery: "Please try again in a few moments"

**Rate Limit Errors:**
- Code: RATE_LIMITED
- Title: "Too Many Requests"
- Message: "You've submitted too many optimization requests. Please wait a moment"
- Recovery: "Wait a few seconds and try again"

**Validation Errors:**
- Code: VALIDATION_ERROR
- Title: "Invalid Input"
- Message: "Please check your inputs and try again"
- Recovery: "Review your resume and job description content"

**Parse Errors:**
- Code: PARSE_ERROR
- Title: "Could Not Read File"
- Message: "We had trouble reading your file. It may be corrupted or in an unsupported format"
- Recovery: "Try uploading a different file or converting to PDF"

### Design System Integration

**Color Scheme (From UX Design Spec):**
- Background: #EF4444 (red/danger for errors)
- Use destructive color token from shadcn/ui
- Background tint: destructive/5 (very light red background)
- Border: 2px solid destructive color
- Text: destructive color for title, muted-foreground for details

**Component Pattern (From FileValidationError.tsx):**
- Card layout with flex row
- AlertCircle icon (h-5 w-5) on left
- Content section: title, message, error code, recovery suggestion
- Dismissible X button on right
- Proper spacing and alignment
- aria-live="polite" for accessibility

**Typography:**
- Title: font-medium text-sm (error code from title)
- Message: text-sm (main error message)
- Recovery hint: text-xs text-muted-foreground (helper text)
- Error code: text-xs font-mono text-muted-foreground/70 (for support)

### Testing Strategy

**Unit Tests (`/tests/unit/lib/errorMessages.test.ts`):**
- Test each error code maps to valid display object
- Test all required properties exist (title, message, recoveryAction)
- Test unknown error codes have sensible defaults
- Test error message retrieval function signature

**Unit Tests (`/tests/unit/components/ErrorDisplay.test.tsx`):**
- Component renders with required props
- Dismiss button works (calls onDismiss callback)
- Error code displays correctly
- Accessibility attributes present (role, aria-live)
- All error types display with proper styling

**Integration Tests:**
- ErrorDisplay integrates with Zustand store
- Error displayed when store.error is set
- Error dismissed when onDismiss called
- Error doesn't clear on other state changes
- Previous file upload errors still work with new display

**Accessibility Tests:**
- Screen reader announces error message
- Keyboard navigation to dismiss button
- Color not sole indicator (icon + text)
- Sufficient contrast ratio (WCAG AA)

### Git Tracking

**Source Epic Reference:**
- [Source: epics.md#Story 7.1](../_bmad-output/planning-artifacts/epics.md#l755)
- Requirement FR40: "Users can see error messages that include error type, plain-language explanation, and suggested recovery action"
- Version: V0.1 (included in initial release)

**Related Work:**
- Previous: Story 6.7 (Regenerate Suggestions) - Complete
- Parallel: Story 7.2 (Retry Functionality) - Will build on this
- Following: Story 7.3 (Timeout Recovery)
- Blocking: Stories 7.2+ depend on this error display

**Epic Progression:**
- Epic 6: Content Optimization - Complete (all 8 stories done)
- Epic 7: Error Handling & Feedback - Starting (Story 1 of 5)
- Total V0.1 progress: 25/31 stories complete (81%)

---

## References

**Core Documentation:**
- [project-context.md](../project-context.md) - Error codes, ActionResponse pattern, Zustand store pattern
- [epics.md](../planning-artifacts/epics.md#l751) - Epic 7 overview and story requirements
- [architecture.md](../planning-artifacts/architecture.md) - Design system, component patterns
- [ux-design-specification.md](../planning-artifacts/ux-design-specification.md) - Error color scheme, typography

**Existing Patterns:**
- [FileValidationError.tsx](/components/shared/FileValidationError.tsx) - Existing error component (generalize this)
- [useOptimizationStore.ts](/store/useOptimizationStore.ts) - Zustand store where error state lives
- [app/api/optimize/route.ts](/app/api/optimize/route.ts) - Where errors originate

**Related Completed Stories:**
- Story 3.2: File validation errors (INVALID_FILE_TYPE, FILE_TOO_LARGE)
- Story 6.1-6.4: LLM pipeline (generates LLM_TIMEOUT, LLM_ERROR)
- Story 6.7: Regenerate suggestions (error handling pattern)

---

## Developer Context

### What This Story Adds

This story creates a **generalized error display component** that shows clear, user-friendly error messages across the entire application. It's a foundation for graceful error handling that covers all error types (file validation, LLM timeouts, rate limits, network, etc.).

### Why It Matters

Currently, errors are handled inconsistently:
- File upload errors: FileValidationError component (good!)
- LLM errors: Toast notifications (brief, easy to miss)
- API errors: No consistent display
- Validation errors: Unclear messaging

This story:
1. Consolidates all error handling into ONE component
2. Provides **clear, actionable** error messages (not technical)
3. Includes **recovery suggestions** for each error type
4. Follows **accessibility standards** (screen reader support)
5. Maintains **consistent design** (matches existing error component)

### Common Mistakes to Avoid

**MISTAKE #1: Making errors too technical**
- WRONG: "LLM_TIMEOUT: Request exceeded 60000ms timeout"
- RIGHT: "Optimization took too long. Please try again"
- FIX: Use errorMessages.ts to map codes → friendly messages

**MISTAKE #2: Clearing user input when error shows**
- WRONG: Dismissing error also clears resume/JD content
- RIGHT: Only dismiss the error, preserve user inputs
- FIX: Keep error state separate from input state in store

**MISTAKE #3: Not showing error code for debugging**
- WRONG: No way for support to understand technical issue
- RIGHT: Show "Error code: LLM_TIMEOUT" in small text
- FIX: Always display error code (hidden in small font)

**MISTAKE #4: Forgetting accessibility**
- WRONG: Screen reader doesn't know error appeared
- RIGHT: aria-live="polite" announces error to screen readers
- FIX: Use proper ARIA attributes (role="alert", aria-live)

**MISTAKE #5: Inconsistent error handling across API routes**
- WRONG: Some routes throw errors, others return ActionResponse
- RIGHT: ALL routes follow ActionResponse pattern
- FIX: Audit all API routes and server actions before implementation

**MISTAKE #6: No recovery suggestion**
- WRONG: Error message with no path forward
- RIGHT: "Try again" or "Check your file size"
- FIX: Always include actionable next step in recovery hint

### Implementation Order

1. **Create errorMessages.ts mapping** (quick, no dependencies)
2. **Create ErrorDisplay component** (uses errorMessages)
3. **Update Zustand store** (add error state/actions)
4. **Add ErrorDisplay to page** (integrate with store)
5. **Audit and test** all error paths
6. **Test** with different error types

### Quick Checklist

Before marking done:
- [ ] ErrorDisplay renders with all 7 error codes
- [ ] Error messages are plain-language (no jargon)
- [ ] Recovery action is specific to each error type
- [ ] Dismiss button works and preserves user input
- [ ] Screen reader can read error
- [ ] Design matches FileValidationError (red, card-based)
- [ ] Error code shows in small monospace font
- [ ] Mobile layout looks good
- [ ] All error paths tested (file, LLM timeout, rate limit, etc.)

---

## Story Completion Status

**Status:** ready-for-dev

**Ultimate Context Engine Analysis:** Complete
- Epic analysis: ✓ (Epic 7: Error Handling & Feedback)
- Story requirements extracted: ✓ (8 acceptance criteria)
- Previous story intelligence gathered: ✓ (Stories 6.7, 6.6, 6.5, 3.2 patterns analyzed)
- Architecture guardrails identified: ✓ (Error codes, ActionResponse pattern, Zustand store, design tokens)
- Technical requirements defined: ✓ (Component structure, error message mapping, integration points)
- File structure mapped: ✓ (New: ErrorDisplay.tsx, errorMessages.ts; Modified: store, page)
- Testing strategy outlined: ✓ (Unit, integration, accessibility tests)
- Git intelligence included: ✓ (Recent commits analyzed, related stories identified)

**Developer Readiness:** 100%
The developer now has everything needed for flawless implementation:
- Clear error code mapping with friendly messages
- Reusable component pattern (based on FileValidationError.tsx)
- Integration points identified (Zustand store, page layout)
- Accessibility requirements documented
- Common mistakes highlighted with fixes
- Testing strategy outlined
- Implementation order provided

---

## Dev Agent Record

### Agent Model Used

Story Creation: Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Implementation Checklist (For Dev Agent)

Before implementation:
1. Read and understand all 8 acceptance criteria
2. Review FileValidationError.tsx (pattern to generalize)
3. List all error codes from project-context.md
4. Check current Zustand store structure
5. Identify where ErrorDisplay will be rendered (page.tsx or OptimizationFlow.tsx)

During implementation:
1. Create errorMessages.ts with complete error mapping
2. Create ErrorDisplay.tsx component (generalize FileValidationError.tsx)
3. Update Zustand store with error state/actions
4. Add ErrorDisplay to main page with store integration
5. Run full test suite
6. Manual testing with all error types

After implementation:
1. Verify build passes (no TypeScript errors)
2. Run tests: `npm run test:all`
3. Manual verification: Trigger each error type, verify display
4. Check accessibility: Tab navigation, screen reader
5. Check mobile: Responsive layout on small screens

### Completion Notes

Ready for dev agent to implement. All context, patterns, error mappings, and testing requirements are documented. The component generalizes the existing FileValidationError.tsx pattern to handle all error types across the application.

---

_Story created: 2026-01-26 | Epic 7 Progress: 1/5 stories ready-for-dev_
_Created on feature/7-1-error-display-component branch_
