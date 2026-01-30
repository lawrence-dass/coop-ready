# Story 17.6: Dashboard UI Cleanup

Status: done

## Story

As a **user**,
I want a cleaner dashboard without redundant elements,
so that I can focus on my progress and key actions.

## Acceptance Criteria

1. **AC1: Remove Quick Action Cards**
   - Given I am viewing the dashboard
   - When the page loads
   - Then the "New Scan" quick action card is NOT displayed (available in sidebar)
   - And the "View History" quick action card is NOT displayed (available in sidebar)

2. **AC2: Clean Welcome Section**
   - Given I am viewing the dashboard welcome section
   - When the page loads
   - Then I see "Welcome, [First Name]!" (not "Welcome, User!")
   - And the email address is NOT displayed below the welcome message

3. **AC3: Simplified Layout Flow**
   - Given I am viewing the dashboard
   - When the page loads
   - Then the dashboard starts with the "Your Progress" stats section
   - And the layout flows: Welcome → Your Progress → Getting Started/Recent Scans

## Tasks / Subtasks

- [x] Task 1: Remove Quick Action Cards from Dashboard (AC: #1)
  - [x] 1.1: Remove QuickActionCardClient imports from dashboard/page.tsx
  - [x] 1.2: Remove Quick Action Cards grid section from JSX
  - [x] 1.3: Verify sidebar still contains New Scan and History links (confirmed: NAVIGATION_ITEMS includes both)

- [x] Task 2: Update WelcomeHeader Component (AC: #2)
  - [x] 2.1: Remove email display from WelcomeHeader component
  - [x] 2.2: Update WelcomeHeader props interface (kept userEmail for extractFirstName, just removed display)
  - [x] 2.3: Update dashboard page.tsx to not pass email to WelcomeHeader (N/A - still passes email for name extraction)

- [x] Task 3: Update Dashboard Layout Order (AC: #3)
  - [x] 3.1: Reorder JSX so ProgressStatsCard comes immediately after WelcomeHeader
  - [x] 3.2: Verify Getting Started/Recent Scans section follows Progress Stats

- [x] Task 4: Update Tests (AC: #1, #2, #3)
  - [x] 4.1: Update WelcomeHeader unit tests to not expect email
  - [x] 4.2: Update dashboard page tests to verify new layout structure (N/A - no page-level tests existed)
  - [x] 4.3: Ensure no tests reference removed Quick Action Cards (QuickActionCard.test.tsx still tests the component itself, which is fine)

## Dev Notes

### Key Files to Modify

| File | Changes |
|------|---------|
| `app/app/(dashboard)/dashboard/page.tsx` | Remove QuickActionCardClient usage, update WelcomeHeader props, reorder layout |
| `components/dashboard/WelcomeHeader.tsx` | Remove email display paragraph |
| `tests/unit/components/dashboard/WelcomeHeader.test.tsx` | Update tests (if exists, or create) |

### Current Implementation Analysis

**Dashboard Page (`app/app/(dashboard)/dashboard/page.tsx`):**
- Lines 43-61: Quick Action Cards section to be REMOVED
- Line 43: `<WelcomeHeader userEmail={user.email || 'user@example.com'} />` - needs update
- Line 64: `<ProgressStatsCard totalScans={totalScans} />` - will be moved up

**WelcomeHeader Component (`components/dashboard/WelcomeHeader.tsx`):**
- Line 26: `<p className="text-muted-foreground">{userEmail}</p>` - REMOVE this line
- The `extractFirstName` function is already working correctly

### Architecture Compliance

- Follow ActionResponse<T> pattern (not applicable - UI only changes)
- Maintain TypeScript strict mode
- Use existing component patterns from `/components/dashboard/`
- Maintain test coverage for modified components

### Testing Requirements

- Update unit tests for WelcomeHeader to not assert email presence
- Update integration tests for dashboard layout
- Run existing test suite to ensure no regressions

### Project Structure Notes

- `/components/dashboard/` - Dashboard-specific components
- `/app/app/(dashboard)/dashboard/` - Dashboard page route
- `/tests/unit/components/dashboard/` - Unit tests for dashboard components

### References

- [Source: epic-17-compare-dashboard-stats.md - Story 17.6]
- [Source: GitHub Issue #144 - Dashboard UI cleanup]
- [Source: project-context.md - Implementation patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- Build: Successful (npm run build)
- Dashboard component tests: All 35 tests passing
- WelcomeHeader tests: All 7 tests passing (including updated test for no email display)

### Completion Notes List

1. Removed QuickActionCardClient import and usage from dashboard/page.tsx
2. Removed email display paragraph from WelcomeHeader component
3. Reordered layout: Welcome → Progress Stats → Recent Scans/Getting Started
4. Updated WelcomeHeader test to verify email is NOT displayed
5. Sidebar already contains New Scan and History links (verified in NAVIGATION_ITEMS)
6. WelcomeHeader still extracts first name from email (extractFirstName function unchanged)

### File List

**Modified:**
- `app/app/(dashboard)/dashboard/page.tsx` - Removed Quick Action Cards, reordered layout
- `components/dashboard/WelcomeHeader.tsx` - Removed email display paragraph, added Story 17.6 reference
- `components/dashboard/index.ts` - Removed QuickActionCard export, added Story 17.6 reference
- `tests/unit/components/dashboard/WelcomeHeader.test.tsx` - Updated test for no email display

**Deleted (Code Review Cleanup):**
- `app/app/(dashboard)/dashboard/QuickActionCardClient.tsx` - Orphaned after removal from dashboard
- `components/dashboard/QuickActionCard.tsx` - No longer used after dashboard cleanup
- `tests/unit/components/dashboard/QuickActionCard.test.tsx` - Tests for deleted component

**Note:** `lib/design-tokens.ts` was added on this branch in a separate commit but is unrelated to Story 17.6 scope. Consider moving to separate PR.
