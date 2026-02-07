# Story 15.3: Gate Uploads Until Consent Accepted

**Status:** done

**Epic:** Epic 15: Privacy Consent (V0.5)

**Depends On:**
- Story 15.1 (Database Schema - COMPLETED ✓)
- Story 15.2 (Privacy Dialog Component - COMPLETED ✓)

---

## Story

As a user,
I want to be prevented from uploading until I accept the privacy disclosure,
So that I make an informed decision about my data.

---

## Acceptance Criteria

1. **Given** I have not accepted the privacy disclosure (`privacy_accepted = false`)
   **When** I attempt to upload a resume
   **Then** the Privacy Consent Dialog appears
   **And** the upload is blocked until I accept

2. **Given** the Privacy Consent Dialog is displayed
   **When** I click "I Agree" after confirming the checkbox
   **Then** `privacy_accepted` is set to true and `privacy_accepted_at` is recorded in database

3. **Given** I have already accepted the privacy disclosure (`privacy_accepted = true`)
   **When** I upload a resume
   **Then** the upload proceeds normally (no dialog appears)

4. **Given** I have accepted consent in this session
   **When** subsequent uploads are attempted
   **Then** the dialog does not re-appear (stored state is respected)

5. **Given** the feature is deployed
   **When** existing users (who pre-date this feature) upload
   **Then** they see the dialog once, then never again after accepting

---

## Tasks / Subtasks

- [x]Create server action to update privacy consent (AC: #2)
  - [x]File: `/actions/privacy/accept-privacy-consent.ts`
  - [x]Function: `acceptPrivacyConsent()` - authenticated users only
  - [x]Updates database: `privacy_accepted = true`, `privacy_accepted_at = NOW()`
  - [x]Returns: `ActionResponse<PrivacyConsentStatus>` with updated consent status
  - [x]Error handling for DB failures (return standard error)
  - [x]RLS enforced by Supabase (user can only update own profile)

- [x]Create hook to check privacy consent status (AC: #1, #3)
  - [x]File: `/hooks/usePrivacyConsent.ts`
  - [x]Returns: `{ privacyAccepted: boolean, isLoading: boolean, error?: Error }`
  - [x]Fetches consent status from user profile on mount
  - [x]Re-fetches after accepting consent
  - [x]Caches in Zustand store to avoid repeated API calls
  - [x]Works for authenticated users (unauthenticated users skip check per requirements)

- [x]Add privacy consent state to Zustand store (AC: #1-4)
  - [x]File: `/store/useOptimizationStore.ts` (update existing)
  - [x]Add state: `privacyAccepted: boolean`, `privacyAcceptedAt: Date | null | undefined`
  - [x]Add state: `showPrivacyDialog: boolean`
  - [x]Add actions: `setPrivacyAccepted(status)`, `setShowPrivacyDialog(open)`
  - [x]Add selectors: `selectPrivacyAccepted`, `selectShowPrivacyDialog`

- [x]Integrate Privacy Dialog with resume upload flow (AC: #1-5)
  - [x]File: `/app/page.tsx` (update main page)
  - [x]Import: `PrivacyConsentDialog`, privacy consent hook, consent actions
  - [x]Check consent status on component mount (for authenticated users)
  - [x]When file selected for upload: Check if `privacyAccepted` is false
  - [x]If false: Show `PrivacyConsentDialog` instead of processing upload
  - [x]If true: Proceed with normal upload flow
  - [x]`onAccept` callback: Call `acceptPrivacyConsent()` action, then allow upload
  - [x]Update Zustand store when consent status changes

- [x]Handle authentication state changes (AC: #1-3)
  - [x]When user logs in: Fetch their privacy consent status
  - [x]When user logs out: Clear privacy consent state
  - [x]For anonymous users: Skip privacy consent check (not authenticated)
  - [x]For anonymous → authenticated transition: Load consent from profile

- [x]Add error handling and edge cases (AC: #1-5)
  - [x]Handle database error when updating consent (show toast error, keep dialog open)
  - [x]Handle network timeout on consent update (retry UI or manual retry)
  - [x]Handle race condition: Multiple upload attempts while dialog open (block second attempt)
  - [x]Ensure dialog only shows once per session when accepted

- [x]Test consent flow end-to-end (AC: #1-5)
  - [x]Create unit test file: `/tests/unit/actions/accept-privacy-consent.test.ts`
  - [x]Test consent update server action (AC #2)
  - [x]Create integration test file: `/tests/integration/15-3-privacy-consent-flow.test.ts`
  - [x]Test: Unauthenticated upload → no dialog (skip for non-auth users)
  - [x]Test: First upload (no consent) → dialog shows (AC #1)
  - [x]Test: Accept consent → `privacy_accepted = true` (AC #2)
  - [x]Test: Second upload (consent accepted) → no dialog (AC #3-4)
  - [x]Test: Existing users with backfilled consent → proceed without dialog

- [x]Verify no regressions in upload flow (AC: #1-5)
  - [x]Run existing test suite (should pass without changes)
  - [x]Test file upload still works (validation, extraction, parsing)
  - [x]Test job description input still works
  - [x]Test analyze button still works
  - [x]Test suggestions still display correctly

---

## Dev Notes

### Architecture Patterns & Constraints

**Integration Points:**
- Zustand store (existing `useOptimizationStore`) - add privacy state
- Server action pattern (existing `/actions`) - add consent update
- PrivacyConsentDialog component (Story 15.2) - already built and tested
- ResumeUploader component (Story 3.1) - file selection trigger point
- Main app page (app/page.tsx) - orchestration layer

**Flow Architecture:**
```
User selects file
  ↓
Check: Is user authenticated?
  ├─ NO → Skip consent (proceed with upload)
  └─ YES → Check: Has user accepted consent?
    ├─ YES → Proceed with upload
    └─ NO → Show PrivacyConsentDialog
      ↓
      User clicks "I Agree"
        ↓
      Call acceptPrivacyConsent() action
        ↓
      Update database (privacy_accepted=true, privacy_accepted_at=NOW())
        ↓
      Update Zustand store
        ↓
      Proceed with upload
```

**State Management:**
- Store consent status in Zustand (single source of truth)
- Fetch from server on auth check
- Update locally + server on accept
- Persist across session (stored in database)

**Authentication Handling:**
- Only authenticated users need consent
- Anonymous users bypass consent check (per AC requirements)
- When anonymous → authenticated: Load consent from profile
- When authenticated → anonymous: Clear consent state

[Source: project-context.md#API-Patterns, Story 13.3 pattern]

### File Structure Requirements

```
/actions/privacy/
  └─ accept-privacy-consent.ts        ← NEW: Server action for consent update

/hooks/
  └─ usePrivacyConsent.ts             ← NEW: Hook for checking consent status

/store/
  └─ useOptimizationStore.ts          ← UPDATE: Add privacy consent state

/app/
  └─ page.tsx                         ← UPDATE: Integrate consent dialog

/tests/unit/actions/
  └─ accept-privacy-consent.test.ts   ← NEW: Server action tests

/tests/integration/
  └─ 15-3-privacy-consent-flow.test.ts ← NEW: End-to-end flow tests
```

**Server Action Pattern (from Story 15.1 database setup):**
```typescript
// /actions/privacy/accept-privacy-consent.ts
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { ActionResponse } from '@/types';
import type { PrivacyConsentStatus } from '@/types/auth';

export async function acceptPrivacyConsent(): Promise<ActionResponse<PrivacyConsentStatus>> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(/* ... */);

    // Get current user (RLS will enforce auth)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } };
    }

    // Update profile with consent status
    const { data, error } = await supabase
      .from('profiles')
      .update({
        privacy_accepted: true,
        privacy_accepted_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('privacy_accepted, privacy_accepted_at')
      .single();

    if (error) {
      return { data: null, error: { code: 'DB_ERROR', message: error.message } };
    }

    return {
      data: {
        privacyAccepted: data.privacy_accepted,
        privacyAcceptedAt: data.privacy_accepted_at ? new Date(data.privacy_accepted_at) : null,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: { code: 'INTERNAL_ERROR', message: String(err) } };
  }
}
```

**Zustand Store Pattern:**
```typescript
// Add to useOptimizationStore:
interface OptimizationStore {
  // ... existing state ...

  // Privacy consent state
  privacyAccepted: boolean | undefined;  // undefined = not loaded
  privacyAcceptedAt: Date | null | undefined;
  showPrivacyDialog: boolean;

  // Actions
  setPrivacyAccepted: (accepted: boolean, acceptedAt: Date | null) => void;
  setShowPrivacyDialog: (open: boolean) => void;
}
```

[Source: /store/useOptimizationStore.ts pattern, Story 13.3 reference]

### Testing Standards

**Unit Tests (Server Action):**
- Test `acceptPrivacyConsent()` with authenticated user
- Test update sets `privacy_accepted = true`
- Test update sets `privacy_accepted_at` to current timestamp
- Test RLS enforcement (unauthenticated requests fail)
- Test database error handling

**Integration Tests (Complete Flow):**
- Test: User not authenticated → no consent dialog (proceed with upload)
- Test: User authenticated, no consent → dialog shows (AC #1)
- Test: Accept consent → database updated (AC #2)
- Test: User with consent → no dialog on upload (AC #3)
- Test: Subsequent uploads → dialog doesn't re-appear (AC #4)
- Test: Error during consent save → error shown, dialog stays open

**Regression Tests:**
- Existing file upload tests still pass
- Job description input still works
- Analyze button still works
- Results still display
- Test suite: 1226+ tests should still pass

[Source: project-context.md#Critical-Rules]

---

## Previous Story Intelligence

**Story 15.2 (Privacy Dialog Component) - COMPLETED ✓:**
- Created PrivacyConsentDialog component with full TDD approach
- 21 comprehensive tests - all passing
- Component handles: dialog state, checkbox interaction, button actions
- Ready to be integrated into upload flow
- Takes `onAccept` callback - perfect for consent action

**Learning from Story 15.2:**
- Dialog component is thoroughly tested
- Just need to wire it to upload trigger and server action
- onAccept callback is ideal integration point

**Story 15.1 (Database Schema) - COMPLETED ✓:**
- Added `privacy_accepted` BOOLEAN column (DEFAULT false)
- Added `privacy_accepted_at` TIMESTAMP column (nullable)
- RLS policies allow users to update their own consent
- Types defined in `/types/auth.ts` (PrivacyConsentStatus)
- Migration tested and deployed

**Learning from Story 15.1:**
- Database is ready - just need UPDATE statement
- RLS is already in place - no security work needed
- Type definitions ready for this story

**Story 13.3 (Preferences Dialog Integration) - COMPLETED ✓:**
- Shows how to integrate dialog with app state
- Demonstrated useEffect for loading user data
- Showed Zustand store integration pattern
- Error handling with toast notifications

**Pattern from Story 13.3:**
- Load preferences on auth check
- Use Zustand for state management
- Show dialog on user action
- Update Zustand after server action succeeds

---

## Git Intelligence

**Recent Commits (Last 5):**
- **Latest** `feat(story-15-2)`: Create Privacy Consent Dialog (#131)
- **e5fbb89** `feat(story-15-1)`: Add privacy consent database columns (#130)
- **56c9b5e** `feat(story-14-4)`: Epic 14 integration testing
- **8bbf40b** `feat(story-14-3)`: Render explanations in UI
- **653f8dd** `feat(story-14-2)`: Update LLM prompts for explanations

**Reference Commits for Integration Pattern:**
- **ec7173a** `feat(story-13-3)`: Shows PreferencesDialog integration with page.tsx
- Look at: `/app/page.tsx` line 50-62 (preferences loading pattern)
- Look at: `/store/useOptimizationStore.ts` (how to add new state)

**Expected Git History for This Story:**
- New files: server action, hook, tests
- Updated files: `useOptimizationStore.ts`, `app/page.tsx`
- Story documentation: This file
- Status update: `sprint-status.yaml` (story → done)

---

## Latest Tech Information

**Supabase RLS with Update (2026):**
- UPDATE policy from Story 1.2 already allows authenticated users to update own profile
- New columns (privacy_accepted, privacy_accepted_at) automatically protected by existing RLS
- No new policies needed - existing policy covers all columns on profiles table
- RLS is enforced by calling `.eq('id', user.id)` - Supabase validates via auth token

**Zustand Store Best Practices (2026):**
- Create separate actions for each state mutation
- Use selectors to avoid unnecessary re-renders
- Clear state on logout or auth changes
- Initialize state with sensible defaults (undefined = not loaded)

**Server Action Error Handling (2026):**
- Never throw - always return ActionResponse<T>
- Use standard error codes (UNAUTHORIZED, DB_ERROR, etc.)
- Client side: Check for error, show toast, keep UI in valid state
- Retry logic: Let client handle retry (button or automatic)

[Source: project-context.md#ActionResponse-Pattern, Supabase RLS documentation]

---

## Project Context Reference

**Critical Rules:**
1. **ActionResponse Pattern:** MANDATORY - never throw, always return {data, error}
2. **RLS Security:** Supabase enforces at DB level - auth user can only update own profile
3. **State Management:** Zustand is source of truth for client state
4. **Error Codes:** Use standardized codes (UNAUTHORIZED, DB_ERROR, VALIDATION_ERROR, etc.)
5. **Authentication:** Check `user` object to determine auth status

**Constraints:**
- Only authenticated users need consent (anonymous users skip)
- Dialog must be non-blocking for non-auth users
- Cannot force consent for existing anonymous sessions
- Must not interrupt current optimization if user dismisses dialog

[Source: _bmad-output/project-context.md]

---

## Story Completion Status

### Implementation Readiness
- ✅ Story is ready for dev implementation
- ✅ All 5 AC are clear and testable
- ✅ Integration pattern established (reference: Story 13.3)
- ✅ Dependencies completed: Story 15.1 ✓, Story 15.2 ✓
- ✅ Server action pattern (ActionResponse) understood
- ✅ No breaking changes to existing flow

### Context Provided
- ✅ Flow architecture diagram documented
- ✅ Server action template provided (acceptPrivacyConsent)
- ✅ Zustand store extension pattern shown
- ✅ Integration points mapped in app/page.tsx
- ✅ Testing approach outlined (unit + integration + regression)
- ✅ Authentication state handling documented
- ✅ Reference commits identified

### Next Steps for Dev
1. Create server action: `acceptPrivacyConsent()`
2. Create hook: `usePrivacyConsent()` to check/fetch consent status
3. Update Zustand store with privacy consent state
4. Update main page (app/page.tsx) to check consent before upload
5. Integrate PrivacyConsentDialog component
6. Add error handling for all edge cases
7. Create unit and integration tests
8. Test full flow end-to-end
9. Verify no regressions
10. Commit and open PR for code review

---

## Dev Agent Record

### Agent Model Used
Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### References for Implementation
- **Server Action Pattern:** `/actions/parseResumeText.ts` (example)
- **Integration Reference:** `/app/page.tsx` lines 50-62 (preferences loading)
- **Store Pattern:** `/store/useOptimizationStore.ts`
- **Dialog Component:** `/components/shared/PrivacyConsentDialog.tsx` (Story 15.2)
- **Database Schema:** Story 15.1 (privacy_accepted, privacy_accepted_at columns)
- **Type Definitions:** `/types/auth.ts` (PrivacyConsentStatus)

### Debug Log References
- Watch for: Database update failures (show in server action logs)
- Watch for: RLS enforcement (user_id mismatch)
- Watch for: Race conditions on simultaneous uploads

### Completion Notes List
- [x]Server action created: acceptPrivacyConsent()
- [x]Hook created: usePrivacyConsent()
- [x]Zustand store updated with privacy state
- [x]Main page (app/page.tsx) updated to check consent
- [x]PrivacyConsentDialog integrated into upload flow
- [x]Error handling implemented (DB errors, network timeouts, race conditions)
- [x]Auth state changes handled (login/logout)
- [x]Unit tests created (server action)
- [x]Integration tests created (full flow)
- [x]Regression tests verified (1226+ tests passing)
- [x]End-to-end flow tested manually

### File List
- `/actions/privacy/accept-privacy-consent.ts` (new server action)
- `/actions/privacy/get-privacy-consent.ts` (new server action - fetches consent status)
- `/hooks/usePrivacyConsent.ts` (new hook)
- `/store/useOptimizationStore.ts` (updated with privacy state)
- `/app/page.tsx` (updated - integrate consent check)
- `/tests/unit/actions/accept-privacy-consent.test.ts` (new tests - 11 tests)
- `/tests/unit/actions/get-privacy-consent.test.ts` (new tests - 9 tests)
- `/tests/integration/15-3-privacy-consent-flow.test.tsx` (new integration tests - 6 tests)
- `/_bmad-output/implementation-artifacts/sprint-status.yaml` (update story to done)
- `/_bmad-output/implementation-artifacts/15-3-gate-uploads-until-consent-accepted.md` (this file)

---

## Change Log

- **2026-01-29**: Story created with comprehensive integration plan. Flow architecture documented for gating uploads based on privacy consent status. Server action template provided for acceptPrivacyConsent(). Zustand store extension pattern shown. Integration points mapped in app/page.tsx. All AC organized into 8 concrete tasks. Reference commit patterns identified (Story 13.3 for integration, Story 15.1 for DB, Story 15.2 for dialog). Testing approach specified (unit, integration, regression).
- **2026-01-29**: Code review completed by Claude Opus 4.5. Found and fixed 2 HIGH issues (missing get-privacy-consent.ts file in File List - added, dead code lib/supabase/privacy.ts removed), 1 MEDIUM issue (added missing unit tests for get-privacy-consent.ts - 9 tests). Total: 26 tests (11 accept + 9 get + 6 integration) - all passing. Status: done.
