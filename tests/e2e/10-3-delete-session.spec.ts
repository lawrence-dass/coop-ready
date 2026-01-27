/**
 * E2E Tests for History Deletion
 *
 * Story 10.3: Implement History Deletion
 *
 * **Test Coverage:**
 * - User can see delete button on each history entry
 * - Clicking delete shows confirmation dialog
 * - User can cancel deletion
 * - User can confirm deletion
 * - History list updates after deletion
 * - Success toast notification shown
 */

import { test, expect } from '@playwright/test';

test.describe('History Deletion - Story 10.3', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Sign in as test user (assumes test account exists)
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');

    // Wait for redirect to home page
    await page.waitForURL('/');
  });

  test('should show delete button on each history entry', async ({ page }) => {
    // Navigate to history page
    await page.goto('/history');

    // Wait for history to load
    await page.waitForSelector('[data-testid="history-list"]', { state: 'visible' });

    // Check that at least one session card exists
    const sessionCards = page.locator('[data-testid="history-session-card"]');
    const count = await sessionCards.count();
    expect(count).toBeGreaterThan(0);

    // Check that each card has a delete button
    for (let i = 0; i < count; i++) {
      const deleteButton = sessionCards.nth(i).locator('[data-testid="delete-session-button"]');
      await expect(deleteButton).toBeVisible();
    }
  });

  test('should open confirmation dialog when delete button is clicked', async ({ page }) => {
    // Navigate to history page
    await page.goto('/history');

    // Wait for history to load
    await page.waitForSelector('[data-testid="history-list"]', { state: 'visible' });

    // Click delete button on first session
    const firstCard = page.locator('[data-testid="history-session-card"]').first();
    await firstCard.locator('[data-testid="delete-session-button"]').click();

    // Verify dialog appears
    await expect(page.locator('role=dialog')).toBeVisible();
    await expect(page.locator('text="Delete Session"')).toBeVisible();
    await expect(page.locator('text="Are you sure? This action cannot be undone."')).toBeVisible();

    // Verify Cancel and Delete buttons exist
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();
  });

  test('should close dialog when cancel button is clicked', async ({ page }) => {
    // Navigate to history page
    await page.goto('/history');

    // Wait for history to load
    await page.waitForSelector('[data-testid="history-list"]', { state: 'visible' });

    // Count sessions before
    const sessionsBefore = await page.locator('[data-testid="history-session-card"]').count();

    // Click delete button
    const firstCard = page.locator('[data-testid="history-session-card"]').first();
    await firstCard.locator('[data-testid="delete-session-button"]').click();

    // Verify dialog appears
    await expect(page.locator('role=dialog')).toBeVisible();

    // Click Cancel
    await page.click('button:has-text("Cancel")');

    // Verify dialog disappears
    await expect(page.locator('role=dialog')).not.toBeVisible();

    // Verify session count unchanged
    const sessionsAfter = await page.locator('[data-testid="history-session-card"]').count();
    expect(sessionsAfter).toBe(sessionsBefore);
  });

  test('should delete session when confirmed', async ({ page }) => {
    // Navigate to history page
    await page.goto('/history');

    // Wait for history to load
    await page.waitForSelector('[data-testid="history-list"]', { state: 'visible' });

    // Count sessions before
    const sessionsBefore = await page.locator('[data-testid="history-session-card"]').count();
    expect(sessionsBefore).toBeGreaterThan(0);

    // Get the resume name of the first session (to verify it's gone)
    const firstCard = page.locator('[data-testid="history-session-card"]').first();
    const resumeName = await firstCard.locator('h3').textContent();

    // Click delete button
    await firstCard.locator('[data-testid="delete-session-button"]').click();

    // Verify dialog appears
    await expect(page.locator('role=dialog')).toBeVisible();

    // Click Delete
    await page.click('button:has-text("Delete")');

    // Wait for dialog to close
    await expect(page.locator('role=dialog')).not.toBeVisible();

    // Verify success toast appears
    await expect(page.locator('text="Session deleted successfully"')).toBeVisible({ timeout: 5000 });

    // Verify session count decreased by 1
    const sessionsAfter = await page.locator('[data-testid="history-session-card"]').count();
    expect(sessionsAfter).toBe(sessionsBefore - 1);

    // Verify the specific session was removed
    const remainingSessions = page.locator('[data-testid="history-session-card"] h3');
    const remainingCount = await remainingSessions.count();
    for (let i = 0; i < remainingCount; i++) {
      const text = await remainingSessions.nth(i).textContent();
      expect(text).not.toBe(resumeName);
    }
  });

  test('should verify dialog structure for error scenarios', async ({ page }) => {
    // Navigate to history page
    await page.goto('/history');

    // Wait for history to load
    await page.waitForSelector('[data-testid="history-list"]', { state: 'visible' });

    // Click delete button on first session
    const firstCard = page.locator('[data-testid="history-session-card"]').first();
    await firstCard.locator('[data-testid="delete-session-button"]').click();

    // Verify dialog has correct structure for error handling path
    await expect(page.locator('role=dialog')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).toBeEnabled();
    await expect(page.locator('button:has-text("Cancel")')).toBeEnabled();

    // Cancel to clean up (actual error path requires server-side mocking
    // which is not feasible for server actions in Playwright E2E tests)
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('role=dialog')).not.toBeVisible();
  });

  test('should show empty state after all sessions are deleted', async ({ page }) => {
    // Navigate to history page
    await page.goto('/history');

    // Wait for history to load
    await page.waitForSelector('[data-testid="history-list"]', { state: 'visible' });

    // Delete all sessions one by one until empty state appears
    let sessionCount = await page.locator('[data-testid="history-session-card"]').count();

    while (sessionCount > 0) {
      // Click delete on first card
      const firstCard = page.locator('[data-testid="history-session-card"]').first();
      await firstCard.locator('[data-testid="delete-session-button"]').click();

      // Confirm deletion
      await expect(page.locator('role=dialog')).toBeVisible();
      await page.click('button:has-text("Delete")');

      // Wait for success toast
      await expect(page.locator('text="Session deleted successfully"')).toBeVisible({ timeout: 5000 });

      // Recount remaining sessions
      sessionCount = await page.locator('[data-testid="history-session-card"]').count();
    }

    // Verify empty state is shown
    await expect(page.locator('text="No optimization history yet"')).toBeVisible();
  });

  test('should not navigate to session details when delete button is clicked', async ({ page }) => {
    // Navigate to history page
    await page.goto('/history');

    // Wait for history to load
    await page.waitForSelector('[data-testid="history-list"]', { state: 'visible' });

    // Click delete button (should NOT navigate)
    const firstCard = page.locator('[data-testid="history-session-card"]').first();
    await firstCard.locator('[data-testid="delete-session-button"]').click();

    // Verify we're still on history page (not navigated to /history/[sessionId])
    expect(page.url()).toBe(`${process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'}/history`);

    // Verify dialog opened instead
    await expect(page.locator('role=dialog')).toBeVisible();
  });
});
