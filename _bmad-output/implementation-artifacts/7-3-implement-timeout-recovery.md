# Story 7.3: Implement Timeout Recovery

Status: ready-for-dev

---

## Story

As a user,
I want graceful handling when the optimization takes too long,
So that I'm not left waiting indefinitely.

## Acceptance Criteria

1. **Timeout detection:** System detects when optimization exceeds 60 seconds and cancels the request
2. **Clear error message:** User sees error code LLM_TIMEOUT with plain-language explanation ("Optimization took too long")
3. **Recovery options:** User sees "Retry" button and suggestion to "try with a smaller input"
4. **Graceful cancellation:** Request is cancelled immediately, no partial results displayed (all-or-nothing)
5. **State preservation:** User's resume and job description inputs are preserved after timeout
6. **Loading state clarity:** User sees clear indication that optimization is waiting/processing before timeout occurs
7. **Timeout value reference:** System uses consistent 60-second timeout (matches NFR4 and project constraint)
8. **No hanging UI:** Application remains responsive during timeout (not blocked)

## Tasks / Subtasks

- [ ] Task 1: Understand timeout handling in API route (AC: #1, #7)
  - [ ] Review `/app/api/optimize/route.ts` for current timeout implementation
  - [ ] Verify 60-second timeout is configured in route handler
  - [ ] Document how AbortController handles timeout cancellation
  - [ ] Confirm error code LLM_TIMEOUT returned on timeout

- [ ] Task 2: Implement client-side timeout detection (AC: #1, #2)
  - [ ] Create utility function `createTimeoutPromise(seconds: number)` that rejects after timeout
  - [ ] Update `/app/api/optimize` API call to use timeout promise race
  - [ ] Catch timeout rejection and set error code to LLM_TIMEOUT
  - [ ] Ensure timeout triggers before API route timeout (client-side first)
  - [ ] Test: Verify timeout error returned after ~60 seconds

- [ ] Task 3: Integrate LLM_TIMEOUT with existing error display (AC: #2, #3, #5)
  - [ ] Verify `/lib/errorMessages.ts` has LLM_TIMEOUT entry (should already exist from 7.1)
  - [ ] Verify message suggests retry and smaller input
  - [ ] Verify recovery action is specific to timeout: "Please try again with a smaller input"
  - [ ] Test: Trigger LLM_TIMEOUT, verify error displays correctly

- [ ] Task 4: Integrate retry button with timeout recovery (AC: #3, #5)
  - [ ] Verify ErrorDisplay has retry button (from story 7.2)
  - [ ] Verify retry button appears for LLM_TIMEOUT error (retriable)
  - [ ] Verify user inputs preserved when retry clicked
  - [ ] Verify retryCount resets after new input provided
  - [ ] Test: Timeout → Click Retry → Successful retry displays results

- [ ] Task 5: Handle exponential backoff on timeout retry (AC: #3, #8)
  - [ ] Verify exponential backoff is configured (from story 7.2: 1s → 2s → 4s)
  - [ ] Confirm retryOptimization action includes backoff delays
  - [ ] Test: Timeout → Click Retry, observe 1-second delay before retry starts
  - [ ] Test: Second retry, observe 2-second delay

- [ ] Task 6: Implement abort mechanism for clean cancellation (AC: #1, #4, #8)
  - [ ] Create AbortController in optimize store action
  - [ ] Pass AbortSignal to fetch request in API client
  - [ ] On timeout, call abort() to cancel request
  - [ ] Verify partial results not stored (all-or-nothing)
  - [ ] Test: Timeout during optimization, verify no partial suggestions displayed

- [ ] Task 7: Add clear loading states for timeout clarity (AC: #6, #8)
  - [ ] Review current loading states in store (isLoading, loadingStep)
  - [ ] Verify loadingStep shows "Analyzing resume...", "Generating suggestions...", etc.
  - [ ] Confirm UI shows progress during 60-second window
  - [ ] Test: Start optimization, observe loading indicators show progress

- [ ] Task 8: Test timeout recovery with different input sizes (AC: #2, #3, #7)
  - [ ] Unit test: createTimeoutPromise rejects after specified time
  - [ ] Integration test: API call times out at 60 seconds
  - [ ] Integration test: Timeout error code set to LLM_TIMEOUT
  - [ ] Integration test: Retry button appears for timeout
  - [ ] Manual test: Large resume (near limit) triggers timeout
  - [ ] Manual test: Normal resume does not timeout

- [ ] Task 9: Validate timeout messages match error display spec (AC: #2, #3)
  - [ ] Verify error title: "Optimization Took Too Long"
  - [ ] Verify error message mentions 60-second limit
  - [ ] Verify recovery action suggests retry or smaller input
  - [ ] Verify message is user-friendly (no technical jargon)

- [ ] Task 10: Test UI responsiveness during timeout (AC: #8)
  - [ ] Verify page doesn't freeze while waiting for timeout
  - [ ] Verify user can dismiss error and change inputs
  - [ ] Verify retry button responsive even during backoff delay
  - [ ] Verify loading spinner continues until timeout
  - [ ] Manual test: Try cancelling optimization before timeout (if cancel button exists)

## Dev Notes

### Architecture Compliance

**From project-context.md:**
- Pattern: Zustand store for state management (isLoading, loadingStep, error)
- ActionResponse pattern: API route returns standardized error response
- Error codes: Must use exact code "LLM_TIMEOUT" from project-context.md
- Timeout constraint: 60 seconds max (NFR4 and project constraint)
- Loading state: Use isLoading boolean and loadingStep string for progress
- Directory structure: Utilities in `/lib/`, components in `/components/shared/`

**Critical Implementation Rules:**
- NEVER throw from server actions (use ActionResponse pattern)
- Timeout should be client-side first, then API route backup
- All-or-nothing: No partial results on timeout
- State preservation: Resume and JD inputs must survive timeout
- Exponential backoff: Retry uses 1s → 2s → 4s delays (from story 7.2)

**Error Code Retry Logic:**
| Code | Retriable? | Reason |
|------|-----------|--------|
| LLM_TIMEOUT | Yes | Temporary timeout, worth retrying with backoff |

### Previous Story Intelligence

**Story 7.2 (Implement Retry Functionality) - Just Completed:**
- Retry pattern: retryOptimization() action with exponential backoff
- Error retriability: isErrorRetriable() checks error codes
- Backoff calculation: 1000 * Math.pow(2, retryCount - 1) ms
- Max retries: 3 automatic retries before disabling button
- Key learning: Exponential backoff crucial for transient failures like timeout
- Pattern to follow: Use existing retryOptimization action, no new retry logic needed
- Integration: ErrorDisplay already has retry button, just needs timeout handling

**Story 7.1 (Implement Error Display Component) - Recent:**
- Error display pattern: ErrorDisplay component with code, message, recovery action
- Error message mapping: getErrorDisplay(errorCode) returns {title, message, recoveryAction}
- State management: generalError state in Zustand store (getErrorDisplay mapping)
- Key learning: Error state separate from input state (must preserve user content)
- Pattern to follow: Leverage existing error display for LLM_TIMEOUT
- File structure: Error UI in components/shared/, logic in lib/ and store/

**Story 6.1 (Implement LLM Pipeline API Route):**
- API pattern: `/app/api/optimize/route.ts` is optimization endpoint
- Timeout: Currently has 60-second timeout built in (using context.timeout)
- Error codes: Already returns standardized error codes including LLM_TIMEOUT
- Takeaway: API route already handles timeout, may need client-side race condition

**Story 6.7 (Implement Regenerate Suggestions) - Pattern Reference:**
- Similar flow: Call action with same params, show loading, handle error
- Takeaway: Timeout recovery similar to regenerate pattern (same inputs, different error)

### Technical Requirements

**Timeout Detection Strategy:**
```typescript
// Client-side timeout (races with API call)
// If client timeout fires first, cancels request immediately
// If API timeout fires first, server returns LLM_TIMEOUT error code

async function callOptimizeWithTimeout(resume: string, jd: string, timeout: number = 60000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch('/api/optimize', {
      method: 'POST',
      body: JSON.stringify({ resume, jd }),
      signal: controller.signal
    });
    // Handle response
  } catch (error) {
    if (error?.name === 'AbortError') {
      // Timeout occurred
      return { data: null, error: { code: 'LLM_TIMEOUT', message: '...' } };
    }
    // Handle other errors
  } finally {
    clearTimeout(timeoutId);
  }
}
```

**Timeout Promise Utility:**
```typescript
// In /lib/timeoutUtils.ts
export function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms`));
    }, ms);
  });
}

// Usage with Promise.race
export async function fetchWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    createTimeoutPromise(timeoutMs)
  ]);
}
```

**Zustand Store Integration:**
```typescript
interface OptimizationStore {
  // Existing state
  isLoading: boolean;
  loadingStep: string | null;
  error: { code: string; message?: string } | null;
  resumeContent: string | null;
  jdContent: string | null;

  // Existing actions
  optimize: () => Promise<void>;
  retryOptimization: () => Promise<void>;
  clearError: () => void;
  resetRetryCount: () => void;

  // No new state/actions needed - timeout handled in optimize()
  // Just ensure LLM_TIMEOUT is treated as retriable error
}
```

**Abort Controller Integration:**
```typescript
// In store optimize action
const controller = new AbortController();
const timeoutId = setTimeout(() => {
  controller.abort();
}, TIMEOUT_MS); // 60000ms

try {
  const result = await fetch('/api/optimize', {
    method: 'POST',
    body: JSON.stringify({ resume: resumeContent, jd: jdContent }),
    signal: controller.signal
  });
  // Parse and handle response
} catch (error) {
  if (error?.name === 'AbortError') {
    setError({ code: 'LLM_TIMEOUT', message: 'Request cancelled' });
  } else {
    // Handle other errors
  }
} finally {
  clearTimeout(timeoutId);
}
```

### File Structure & Changes

**New Files:**
1. `/lib/timeoutUtils.ts`
   - Export `createTimeoutPromise(ms: number): Promise<never>`
   - Export `fetchWithTimeout<T>(promise, timeoutMs): Promise<T>`
   - Export `TIMEOUT_MS = 60000` constant
   - Can be reused for any timeout scenarios

**Modified Files:**
1. `/store/useOptimizationStore.ts`
   - Update `optimize()` action to implement AbortController
   - Add timeout handling: catch AbortError and set error code to LLM_TIMEOUT
   - Ensure error preserved for retry
   - No new state variables needed (error state already exists)

2. `/lib/errorMessages.ts`
   - Verify LLM_TIMEOUT entry exists (should from story 7.1)
   - Message should mention "60-second limit"
   - Recovery action should suggest "Please try again with a smaller input"
   - May need small update to message text if not optimal

3. `/components/shared/ErrorDisplay.tsx`
   - No changes needed (already has retry button from story 7.2)
   - Just verify it renders for LLM_TIMEOUT with retry option

4. `/app/api/optimize/route.ts`
   - Verify 60-second timeout is configured (should already be)
   - May already return LLM_TIMEOUT on timeout (verify)
   - No changes likely needed

### Integration Points

**Store → ErrorDisplay:**
- timeout error sets store.error to { code: 'LLM_TIMEOUT', ... }
- ErrorDisplay receives error via store subscription
- Retry button appears (error is retriable)

**Store → Loading UI:**
- store.isLoading = true during optimization (before timeout)
- store.loadingStep shows "Analyzing resume..." → "Generating suggestions..."
- User sees progress indicators during 60-second window
- On timeout, loading state cleared, error displayed

**Abort Controller → Request Cancellation:**
- Create AbortController in optimize() action
- Pass signal to fetch request
- On timeout, call abort() to cancel request immediately
- Prevents hanging connections, cleans up resources

**Exponential Backoff → Retry:**
- Retry uses existing retryOptimization() action
- retryOptimization() includes exponential backoff (1s → 2s → 4s)
- No new retry logic needed, just ensure timeout triggers recovery flow

### Design System Integration

**Timeout Error Display (from story 7.1):**
- Title: "Optimization Took Too Long"
- Message: "The optimization process exceeded the 60-second time limit. Try again with a smaller resume or job description."
- Recovery: "Please try again" (shown as retry button)
- Color: Red/danger (#EF4444)
- Icon: AlertCircle

**Loading State During Optimization:**
- Spinner icon (Loader2) with "Analyzing resume..." text
- Progress shows: Parse → Analyze → Optimize steps
- User sees action happening, not hanging
- Clear indication timeout window counting down (optional)

**Retry Button (from story 7.2):**
- Text: "Retry" or "Retry (Attempt 2/3)"
- Color: Primary
- Shows max 3 attempts before disabling
- Includes exponential backoff (1s delay before retry starts)

### Testing Strategy

**Unit Tests (`/tests/unit/lib/timeoutUtils.test.ts`):**
- Test `createTimeoutPromise` rejects after specified time
- Test `createTimeoutPromise` throws Error with timeout message
- Test `fetchWithTimeout` resolves if promise resolves before timeout
- Test `fetchWithTimeout` rejects if promise exceeds timeout
- Test `TIMEOUT_MS` constant is 60000ms

**Unit Tests for Store (`/tests/unit/store/timeoutRecovery.test.ts`):**
- Test optimize() action timeout handling (AbortController)
- Test error code set to LLM_TIMEOUT on abort
- Test resume/JD content preserved after timeout
- Test no partial results stored after timeout
- Test retry button appears after timeout error

**Integration Tests:**
- Test timeout detection at 60-second mark
- Test error display shows LLM_TIMEOUT
- Test retry button appears and is clickable
- Test exponential backoff on retry
- Test successful retry after timeout
- Test max retries (3) reached after multiple timeouts
- Test timeout with different input sizes
- Test UI remains responsive during 60-second wait

**Manual Testing Checklist:**
- [ ] Start optimization with normal resume, no timeout occurs
- [ ] Force timeout (can use slow API or large input), verify error displays
- [ ] Click Retry, observe 1-second delay before retry
- [ ] Retry succeeds, verify results displayed
- [ ] Trigger second timeout, click retry, observe 2-second delay
- [ ] Force 3 timeouts in a row, verify retry button disabled
- [ ] After timeout, verify resume/JD inputs unchanged
- [ ] After timeout, verify can dismiss error and change inputs
- [ ] Verify loading indicators show during optimization
- [ ] Test on mobile: Error display responsive, retry button accessible

**Mock/Stub Strategy:**
- Mock fetch to simulate 60+ second delay for testing
- Use jest fake timers for backoff testing
- Mock AbortController if needed for unit testing

### Git Tracking

**Source Epic Reference:**
- [Source: epics.md#Story 7.3](../_bmad-output/planning-artifacts/epics.md#l789)
- Requirement FR42: "System can recover gracefully from timeout errors"
- Version: V0.1 (included in initial release)

**Related Work:**
- Previous: Story 7.2 (Implement Retry Functionality) - Just Completed
- Previous: Story 7.1 (Implement Error Display Component) - Completed
- Following: Story 7.4 (Implement Suggestion Feedback)
- Depends on: Story 7.1 (error display), Story 7.2 (retry + exponential backoff)

**Epic Progression:**
- Epic 7: Error Handling & Feedback - In progress (Story 3 of 5)
- Total V0.1 progress: 27/31 stories complete (87% after this story)

**Expected Branches:**
- Created from: main (after story 7.2 merged)
- Feature branch: feature/7-3-timeout-recovery
- PR target: main

---

## Developer Context

### What This Story Adds

This story implements **timeout detection and graceful recovery** for the optimization pipeline. When the LLM optimization exceeds 60 seconds, the system detects it, cancels the request cleanly, and offers retry with exponential backoff.

### Why It Matters

Currently (after story 7.2), users can retry failed optimizations, but they have no protection against hanging forever:
- LLM API might be slow on large resumes
- Anthropic API might take 55+ seconds on complex analysis
- User might think the app is broken (no timeout feedback)

This story:
1. **Prevents indefinite waiting** - Timeout at 60 seconds (NFR4 constraint)
2. **Cancels cleanly** - AbortController stops request, releases resources
3. **Clear feedback** - User knows exactly what happened (LLM_TIMEOUT error)
4. **Sensible recovery** - Retry with exponential backoff, or try with smaller input
5. **Preserves state** - Resume/JD never lost (all-or-nothing, no partial results)

### Common Mistakes to Avoid

**MISTAKE #1: No client-side timeout**
- WRONG: Only API route has timeout, request might hang indefinitely
- RIGHT: Client-side timeout races with API timeout (client fires first)
- FIX: Implement AbortController + setTimeout in store optimize() action

**MISTAKE #2: Storing partial results**
- WRONG: If timeout during optimization, partial suggestions displayed
- RIGHT: All-or-nothing - either full results or error, never partial
- FIX: Clear results before optimize() starts, don't store if error occurs

**MISTAKE #3: Clearing user inputs on timeout**
- WRONG: User loses resume/JD on timeout, must re-enter
- RIGHT: Inputs preserved, user can retry immediately
- FIX: Keep resume/JD in store, only update error state

**MISTAKE #4: Not using existing retry infrastructure**
- WRONG: Implement new retry logic for timeout
- RIGHT: Reuse retryOptimization() from story 7.2
- FIX: Just set error code to LLM_TIMEOUT, let existing retry handle it

**MISTAKE #5: No exponential backoff on timeout retry**
- WRONG: User retries immediately after timeout (might timeout again)
- RIGHT: 1s → 2s → 4s backoff prevents hammering API
- FIX: Use existing exponential backoff from story 7.2

**MISTAKE #6: Timeout message too technical**
- WRONG: "LLM_TIMEOUT: AbortError after 60000ms"
- RIGHT: "Optimization took too long. Try again with a smaller input"
- FIX: Use errorMessages.ts mapping for user-friendly message

**MISTAKE #7: No loading indicators**
- WRONG: User sees blank screen for 60 seconds, doesn't know what's happening
- RIGHT: Loading indicators show "Analyzing resume...", "Generating suggestions..."
- FIX: Ensure loadingStep shows progress, spinner visible during wait

**MISTAKE #8: Ignoring AbortError handling**
- WRONG: AbortError thrown, not caught, crashes app
- RIGHT: Catch AbortError specifically, set LLM_TIMEOUT error
- FIX: Try/catch around fetch, check error?.name === 'AbortError'

### Implementation Order

1. **Create timeoutUtils.ts** (simple timeout promise logic)
2. **Update store optimize() action** (add AbortController + timeout handling)
3. **Verify error messages** (ensure LLM_TIMEOUT message is good)
4. **Test timeout detection** (mock slow API, verify error after 60s)
5. **Test retry flow** (timeout → retry → exponential backoff)
6. **Manual testing** (trigger real timeouts, verify recovery)

### Quick Checklist

Before marking done:
- [ ] createTimeoutPromise works (rejects after N ms)
- [ ] fetchWithTimeout races promise against timeout
- [ ] AbortController implemented in optimize() action
- [ ] AbortError caught and mapped to LLM_TIMEOUT
- [ ] LLM_TIMEOUT error message user-friendly (no jargon)
- [ ] Retry button appears for timeout error
- [ ] Resume/JD inputs preserved after timeout
- [ ] No partial results stored after timeout
- [ ] Exponential backoff works on retry (1s → 2s → 4s)
- [ ] Loading indicators show during optimization
- [ ] UI remains responsive (not frozen during 60-second wait)
- [ ] All tests passing (unit + integration + manual)

---

## References

**Core Documentation:**
- [project-context.md](../project-context.md) - Error codes (LLM_TIMEOUT), ActionResponse pattern, timeout constraint (60s)
- [epics.md](../planning-artifacts/epics.md#l789) - Epic 7 overview and story 7.3 requirements
- [architecture.md](../planning-artifacts/architecture.md) - Design system, component patterns, NFR4 (60s timeout)

**Related Completed Stories:**
- [Story 7.2: Implement Retry Functionality](./7-2-implement-retry-functionality.md) - Exponential backoff, retry state, error retriability
- [Story 7.1: Implement Error Display Component](./7-1-implement-error-display-component.md) - Error display, error message mapping, LLM_TIMEOUT entry
- [Story 6.1: Implement LLM Pipeline API Route](./6-1-implement-llm-pipeline-api-route.md) - `/api/optimize` endpoint, error codes

**Existing Code Patterns:**
- `store/useOptimizationStore.ts` - Where timeout handling will be added to optimize()
- `lib/errorMessages.ts` - Where LLM_TIMEOUT message is defined
- `components/shared/ErrorDisplay.tsx` - Already has retry button from story 7.2
- `app/api/optimize/route.ts` - API endpoint (verify timeout config)

**External References:**
- [AbortController API](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) - For request cancellation
- [Fetch AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) - Passing signal to fetch
- [Promise.race()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race) - Timeout pattern

---

## Story Completion Status

**Status:** ready-for-dev

**Ultimate Context Engine Analysis:** Complete
- Epic analysis: ✓ (Epic 7: Error Handling & Feedback)
- Story requirements extracted: ✓ (8 acceptance criteria)
- Previous story intelligence gathered: ✓ (Stories 7.2, 7.1, 6.1, 6.7 patterns analyzed)
- Architecture guardrails identified: ✓ (60-second timeout, AbortController, all-or-nothing results, exponential backoff)
- Technical requirements defined: ✓ (Timeout detection, client-side abort, error handling, retry integration)
- File structure mapped: ✓ (New: timeoutUtils.ts; Modified: store, errorMessages, no component changes)
- Testing strategy outlined: ✓ (Unit, integration, manual testing)
- Git intelligence included: ✓ (Recent commits analyzed, related stories identified)

**Developer Readiness:** 100%
The developer now has everything needed for flawless implementation:
- Clear timeout strategy (client-side race with API route)
- AbortController pattern for clean cancellation
- Integration points documented (store → error display → retry)
- Error message and retry button already exist from previous stories
- Common mistakes highlighted with fixes
- Testing strategy with specific test cases
- Implementation order provided

---

## Dev Agent Record

### Agent Model Used

Story Creation: Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Completion Notes List

_Story creation in progress - awaiting developer implementation_

### File List

_To be completed during implementation_

---

_Story created: 2026-01-26_
_Story Status: ready-for-dev_
_Created on feature/7-3-timeout-recovery branch_
