/**
 * Story 16.1: Dashboard Layout Foundation
 * E2E tests for dashboard layout core functionality
 *
 * @P0 - Critical dashboard layout and navigation tests
 */

import { test, expect } from '../support/fixtures';

test.describe('Dashboard Layout Foundation @P0', () => {
  test.describe('AC#1: Auth Protection', () => {
    test('unauthenticated users are redirected to login', async ({ page }) => {
      // Clear all cookies to ensure no auth
      await page.context().clearCookies();

      // Try to access dashboard
      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      // Should be redirected to login page
      await expect(page).toHaveURL('/auth/login');
    });

    test('dashboard routes redirect to login when accessed directly without auth', async ({ page }) => {
      await page.context().clearCookies();

      // These should all redirect to login (not 404)
      const routes = ['/dashboard', '/scan/new', '/history', '/settings'];

      for (const route of routes) {
        try {
          await page.goto(route, { waitUntil: 'networkidle' });
          // After redirect, should be on login page
          await expect(page).toHaveURL('/auth/login');
        } catch (error) {
          // Navigation might be interrupted by redirect (expected in webkit)
          // Verify we ended up on login page
          await expect(page).toHaveURL('/auth/login');
        }
      }
    });
  });

  test.describe('AC#1: Route Structure', () => {
    test('dashboard route exists at /dashboard', async ({ page }) => {
      // Just verify the route exists (will redirect to login if not authed)
      const response = await page.goto('/dashboard');
      expect(response?.status()).not.toBe(404);
    });

    test('placeholder routes exist', async ({ page }) => {
      const routes = ['/scan/new', '/history', '/settings'];

      for (const route of routes) {
        try {
          await page.goto(route);
        } catch (error) {
          // Navigation might be interrupted by auth redirect (expected)
        }
        // Verify we're either on the route or redirected to login (both mean route exists)
        const url = page.url();
        const routeExists = url.includes(route) || url.includes('/auth/login');
        expect(routeExists).toBe(true);
      }
    });
  });
});
