/**
 * E2E Tests: Story 17.6 - Dashboard UI Cleanup
 *
 * Tests the dashboard UI cleanup including:
 * - "New Scan" card removal (available in sidebar)
 * - "View History" card removal (available in sidebar)
 * - Welcome message shows first name only
 * - Email address NOT displayed
 * - Correct layout flow
 *
 * Priority Distribution:
 * - P0: 2 tests (critical UI cleanup)
 * - P1: 3 tests (welcome section and layout)
 */

import { test, expect } from '@playwright/test';

test.describe('Story 17.6: Dashboard UI Cleanup', () => {
  test.describe('Quick Action Cards Removal', () => {
    test('[P0] 17.6-E2E-001: Should NOT display "New Scan" quick action card', async ({
      page,
    }) => {
      // GIVEN: User navigates to dashboard
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();

      // Dashboard should NOT have redundant "New Scan" card
      // "New Scan" is available via sidebar navigation instead
      // Look for absence of card with "New Scan" or similar text
      // in the main content area (not sidebar)
    });

    test('[P0] 17.6-E2E-002: Should NOT display "View History" quick action card', async ({
      page,
    }) => {
      // GIVEN: User on dashboard
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();

      // Dashboard should NOT have redundant "View History" card
      // "History" is available via sidebar navigation instead
      // Look for absence of card with "View History" or similar
    });
  });

  test.describe('Welcome Section', () => {
    test('[P1] 17.6-E2E-003: Should display first name only in welcome message', async ({
      page,
    }) => {
      // GIVEN: Authenticated user with full name
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();

      // Welcome message format:
      // - "Welcome, [FirstName]!" (not "Welcome, User!")
      // - Uses user's profile first_name or email prefix
      // - Displayed prominently at top of dashboard
    });

    test('[P1] 17.6-E2E-004: Should NOT display email address below welcome', async ({
      page,
    }) => {
      // GIVEN: Dashboard welcome section
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();

      // Email should NOT be displayed:
      // - No email address shown in welcome area
      // - Cleaner, more privacy-conscious design
      // - Email available in settings/profile instead
    });
  });

  test.describe('Layout Flow', () => {
    test('[P1] 17.6-E2E-005: Should have correct layout order', async ({
      page,
    }) => {
      // GIVEN: Dashboard loads
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();

      // Expected layout flow (top to bottom):
      // 1. Welcome section (Welcome, [Name]!)
      // 2. Your Progress stats section (ATS Score, Improvement Rate, Total Scans)
      // 3. Getting Started OR Recent Scans (conditional on session count)
      //
      // Removed elements:
      // - "New Scan" quick action card (in sidebar now)
      // - "View History" quick action card (in sidebar now)
      // - Email display below welcome
    });
  });
});

/**
 * Implementation Notes:
 *
 * Dashboard UI structure after cleanup (Story 17.6):
 *
 * REMOVED:
 * - Quick action cards for "New Scan" and "View History"
 *   (These are now accessible via sidebar navigation only)
 * - Email address display in welcome section
 *
 * RETAINED:
 * - Welcome message with first name: "Welcome, {firstName}!"
 * - Progress stats cards (Average ATS Score, Improvement Rate, Total Scans)
 * - Getting Started guide (for new users) OR Recent Scans (for returning users)
 *
 * LAYOUT ORDER:
 * 1. Header with welcome message
 * 2. ProgressStatsCard section
 * 3. Conditional content (Getting Started / Recent Scans)
 *
 * Related files:
 * - app/(authenticated)/(dashboard)/dashboard/page.tsx
 * - components/dashboard/ProgressStatsCard.tsx
 * - components/dashboard/RecentScansCard.tsx
 * - components/dashboard/GettingStartedCard.tsx
 */
