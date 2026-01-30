/**
 * Integration Tests: Dashboard Home Page
 * Story 16.2: Implement Dashboard Home Page
 *
 * End-to-end tests for dashboard functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app - auth middleware should redirect to login
    await page.goto('/dashboard');
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    // Should be redirected to login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test.describe('Authenticated User', () => {
    test.beforeEach(async ({ page }) => {
      // TODO: Set up authenticated session
      // This will require test auth helpers from Story 8.x
      test.skip(true, 'Requires auth test helpers');
    });

    test('should display welcome message with user name', async ({ page }) => {
      await page.goto('/dashboard');

      // Should show welcome message
      await expect(
        page.getByRole('heading', { name: /welcome/i })
      ).toBeVisible();
    });

    test('should display quick action cards', async ({ page }) => {
      await page.goto('/dashboard');

      // Should show New Scan card
      await expect(page.getByText('New Scan')).toBeVisible();

      // Should show View History card
      await expect(page.getByText('View History')).toBeVisible();
    });

    test('should navigate to new scan when clicking New Scan card', async ({
      page,
    }) => {
      await page.goto('/dashboard');

      // Click New Scan button
      await page.getByRole('button', { name: /start scan/i }).first().click();

      // Should navigate to new scan page
      await expect(page).toHaveURL('/scan/new');
    });

    test('should navigate to history when clicking View History card', async ({
      page,
    }) => {
      await page.goto('/dashboard');

      // Click View History button
      await page.getByRole('button', { name: /view history/i }).click();

      // Should navigate to history page
      await expect(page).toHaveURL('/history');
    });

    test('should display progress stats', async ({ page }) => {
      await page.goto('/dashboard');

      // Should show Your Progress section
      await expect(page.getByText('Your Progress')).toBeVisible();

      // Should show stat labels
      await expect(page.getByText(/total scans/i)).toBeVisible();
    });

    test('should show Getting Started guide when no sessions exist', async ({
      page,
    }) => {
      // Assuming fresh user with no sessions
      await page.goto('/dashboard');

      // Should show getting started
      await expect(page.getByText(/getting started/i)).toBeVisible();

      // Should show 3 steps
      await expect(page.getByText(/upload resume/i)).toBeVisible();
      await expect(page.getByText(/paste job description/i)).toBeVisible();
      await expect(page.getByText(/get suggestions/i)).toBeVisible();

      // Should have Start Your First Scan button
      await expect(
        page.getByRole('button', { name: /start your first scan/i })
      ).toBeVisible();
    });

    test('should show Recent Scans when sessions exist', async ({ page }) => {
      // TODO: Create test session data
      test.skip(true, 'Requires test data setup');

      await page.goto('/dashboard');

      // Should show recent scans section
      await expect(page.getByText('Recent Scans')).toBeVisible();
    });

    test('should navigate to session when clicking recent scan', async ({
      page,
    }) => {
      // TODO: Create test session and verify navigation
      test.skip(true, 'Requires test data setup');
    });

    test('should be keyboard accessible', async ({ page }) => {
      await page.goto('/dashboard');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to activate buttons with keyboard
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A']).toContain(focused);
    });

    test('should be responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');

      // Quick action cards should stack vertically
      await expect(page.getByText('New Scan')).toBeVisible();
      await expect(page.getByText('View History')).toBeVisible();
    });

    test('should be responsive on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/dashboard');

      // Cards should be in 2-column layout
      await expect(page.getByText('New Scan')).toBeVisible();
      await expect(page.getByText('View History')).toBeVisible();
    });
  });
});
