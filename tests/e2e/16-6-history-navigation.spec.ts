import { test, expect } from '@playwright/test';

/**
 * Story 16.6: History Page E2E Tests
 *
 * Tests the complete flow of history page navigation, session viewing, and deletion.
 *
 * Priority Distribution:
 * - P0: 3 tests (navigate to history, click session, delete session)
 * - P1: 2 tests (redirect from old route, mobile responsive)
 *
 * @P0
 */

test.describe('Story 16.6: History Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as authenticated user
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app');
  });

  test('[P0] 16.6-E2E-001: should navigate to history page from sidebar', async ({ page }) => {
    // WHEN: Clicking history link in sidebar
    await page.click('a[href="/app/history"]');

    // THEN: Should navigate to history page
    await expect(page).toHaveURL('/app/history');
    await expect(page.locator('h1')).toContainText(/History/i);
  });

  test('[P0] 16.6-E2E-002: should display history sessions and navigate to session', async ({ page }) => {
    // GIVEN: User is on history page
    await page.goto('/app/history');

    // WHEN: Clicking on a history session
    const firstSession = page.locator('[data-testid^="history-session"]').first();
    await expect(firstSession).toBeVisible();

    const sessionId = await firstSession.getAttribute('data-session-id');
    await firstSession.click();

    // THEN: Should navigate to session results page
    await expect(page).toHaveURL(`/app/scan/${sessionId}`);
  });

  test('[P0] 16.6-E2E-003: should delete session from history', async ({ page }) => {
    // GIVEN: User is on history page with sessions
    await page.goto('/app/history');
    await page.waitForSelector('[data-testid^="history-session"]');

    // Count initial sessions
    const initialCount = await page.locator('[data-testid^="history-session"]').count();

    // WHEN: Clicking delete button on first session
    await page.click('[aria-label="Delete session"]');

    // Confirm deletion in dialog
    await page.click('button:has-text("Delete")');

    // THEN: Session should be removed
    await page.waitForTimeout(1000); // Wait for deletion to complete
    const finalCount = await page.locator('[data-testid^="history-session"]').count();
    expect(finalCount).toBeLessThan(initialCount);
  });

  test('[P0] 16.6-E2E-004: should show empty state when no sessions', async ({ page }) => {
    // GIVEN: User has no history sessions (delete all first)
    await page.goto('/app/history');

    // Delete all sessions
    while (await page.locator('[aria-label="Delete session"]').count() > 0) {
      await page.click('[aria-label="Delete session"]');
      await page.click('button:has-text("Delete")');
      await page.waitForTimeout(500);
    }

    // THEN: Should show empty state
    await expect(page.locator('text=/No optimization history yet/i')).toBeVisible();
    await expect(page.locator('text=/Start New Scan/i')).toBeVisible();
  });

  test('[P1] 16.6-E2E-005: should redirect old /history route to /app/history', async ({ page }) => {
    // WHEN: Navigating to old history route
    await page.goto('/history');

    // THEN: Should redirect to new dashboard history route
    await expect(page).toHaveURL('/app/history');
  });

  test('[P1] 16.6-E2E-006: should be responsive on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // WHEN: Navigating to history page
    await page.goto('/app/history');

    // THEN: Page should be usable on mobile
    // Sidebar should collapse to hamburger
    await expect(page.locator('button[aria-label*="menu"]')).toBeVisible();

    // History cards should stack vertically
    const sessionCard = page.locator('[data-testid^="history-session"]').first();
    await expect(sessionCard).toBeVisible();

    // Delete buttons should remain accessible
    await expect(page.locator('[aria-label="Delete session"]').first()).toBeVisible();
  });
});
