/**
 * Story 16.1: Dashboard Layout Foundation
 * Integration tests for dashboard layout, auth protection, and navigation
 */

import { test, expect } from '../support/fixtures';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
};

test.describe('Story 16.1: Dashboard Layout Foundation', () => {

  test.describe('AC#1: Auth Protection', () => {
    test('should redirect unauthenticated users to /auth/login', async ({ page }) => {
      await page.goto('/app/dashboard');

      // Should be redirected to login
      await expect(page).toHaveURL('/auth/login');
    });

    test('should allow authenticated users to access /app routes', async ({ page }) => {
      // Login as test user
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('/');

      // Navigate to dashboard
      await page.goto('/app/dashboard');

      // Should NOT be redirected
      await expect(page).toHaveURL('/app/dashboard');

      // Should see dashboard layout
      await expect(page.getByRole('navigation')).toBeVisible();
    });
  });

  test.describe('AC#1,5,6: Sidebar Navigation (Desktop)', () => {
    test.beforeEach(async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1440, height: 900 });

      // Login
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('/');
      await page.goto('/app/dashboard');
    });

    test('should display sidebar with all navigation links', async ({ page }) => {
      const sidebar = page.getByRole('navigation');

      await expect(sidebar).toBeVisible();
      await expect(sidebar.getByRole('link', { name: /dashboard/i })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: /new scan/i })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: /history/i })).toBeVisible();
      await expect(sidebar.getByRole('link', { name: /settings/i })).toBeVisible();
    });

    test('should display Sign Out button at bottom of sidebar', async ({ page }) => {
      const sidebar = page.getByRole('navigation');

      await expect(sidebar.getByRole('button', { name: /sign out/i })).toBeVisible();
    });

    test('should highlight active route', async ({ page }) => {
      // Check Dashboard link has active indicator
      const dashboardLink = page.getByRole('link', { name: /dashboard/i });

      // Should have visual indicator (aria-current or special class)
      await expect(dashboardLink).toHaveAttribute('aria-current', 'page');

      // Navigate to History
      await page.getByRole('link', { name: /history/i }).click();
      await expect(page).toHaveURL('/app/history');

      const historyLink = page.getByRole('link', { name: /history/i });
      await expect(historyLink).toHaveAttribute('aria-current', 'page');
    });

    test('should navigate between dashboard pages', async ({ page }) => {
      await page.getByRole('link', { name: /new scan/i }).click();
      await expect(page).toHaveURL('/app/scan/new');

      await page.getByRole('link', { name: /history/i }).click();
      await expect(page).toHaveURL('/app/history');

      await page.getByRole('link', { name: /settings/i }).click();
      await expect(page).toHaveURL('/app/settings');

      await page.getByRole('link', { name: /dashboard/i }).click();
      await expect(page).toHaveURL('/app/dashboard');
    });

    test('should sign out and redirect to login', async ({ page }) => {
      await page.getByRole('button', { name: /sign out/i }).click();

      // Should be redirected to login
      await expect(page).toHaveURL('/auth/login');

      // Attempt to access dashboard should redirect again
      await page.goto('/app/dashboard');
      await expect(page).toHaveURL('/auth/login');
    });
  });

  test.describe('AC#1: Header Component', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('/');
      await page.goto('/app/dashboard');
    });

    test('should display header with page title', async ({ page }) => {
      // Header should be visible
      const header = page.locator('header');
      await expect(header).toBeVisible();

      // Should show page title
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    });

    test('should display correct title for each page', async ({ page }) => {
      await page.goto('/app/dashboard');
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

      await page.goto('/app/scan/new');
      await expect(page.getByRole('heading', { name: /new scan/i })).toBeVisible();

      await page.goto('/app/history');
      await expect(page.getByRole('heading', { name: /history/i })).toBeVisible();

      await page.goto('/app/settings');
      await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    });
  });

  test.describe('AC#6: Mobile Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('/');
      await page.goto('/app/dashboard');
    });

    test('should hide sidebar on mobile', async ({ page }) => {
      // Sidebar should not be visible on mobile
      const sidebar = page.getByRole('navigation');

      // Either hidden or not in viewport
      const isVisible = await sidebar.isVisible();
      expect(isVisible).toBe(false);
    });

    test('should show hamburger menu button', async ({ page }) => {
      const menuButton = page.getByRole('button', { name: /menu/i });
      await expect(menuButton).toBeVisible();
    });

    test('should open mobile menu when hamburger clicked', async ({ page }) => {
      await page.getByRole('button', { name: /menu/i }).click();

      // Mobile menu (drawer) should appear
      const mobileNav = page.getByRole('dialog');
      await expect(mobileNav).toBeVisible();

      // Should show navigation links
      await expect(mobileNav.getByRole('link', { name: /dashboard/i })).toBeVisible();
      await expect(mobileNav.getByRole('link', { name: /new scan/i })).toBeVisible();
      await expect(mobileNav.getByRole('link', { name: /history/i })).toBeVisible();
      await expect(mobileNav.getByRole('link', { name: /settings/i })).toBeVisible();
      await expect(mobileNav.getByRole('button', { name: /sign out/i })).toBeVisible();
    });

    test('should close mobile menu when link clicked', async ({ page }) => {
      await page.getByRole('button', { name: /menu/i }).click();

      const mobileNav = page.getByRole('dialog');
      await expect(mobileNav).toBeVisible();

      // Click a navigation link
      await mobileNav.getByRole('link', { name: /history/i }).click();

      // Menu should close
      await expect(mobileNav).not.toBeVisible();

      // Should navigate to History page
      await expect(page).toHaveURL('/app/history');
    });
  });

  test.describe('AC#6: Responsive Design', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('/');
    });

    test('should display sidebar on desktop (≥1024px)', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/app/dashboard');

      const sidebar = page.getByRole('navigation');
      await expect(sidebar).toBeVisible();
    });

    test('should hide sidebar on mobile (<1024px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/app/dashboard');

      const sidebar = page.getByRole('navigation').first();
      const isVisible = await sidebar.isVisible();

      // Sidebar should be hidden on tablet/mobile
      expect(isVisible).toBe(false);
    });

    test('should show hamburger menu on tablet/mobile', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/app/dashboard');

      const menuButton = page.getByRole('button', { name: /menu/i });
      await expect(menuButton).toBeVisible();
    });

    test('should have no horizontal scroll on any breakpoint', async ({ page }) => {
      const breakpoints = [
        { width: 375, height: 667 },  // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1440, height: 900 }, // Desktop
      ];

      for (const viewport of breakpoints) {
        await page.setViewportSize(viewport);
        await page.goto('/app/dashboard');

        // Check for horizontal scrollbar
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

        expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      }
    });
  });

  test.describe('AC#1: Placeholder Pages', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('/');
    });

    test('should render Dashboard placeholder page', async ({ page }) => {
      await page.goto('/app/dashboard');

      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    });

    test('should render New Scan placeholder page', async ({ page }) => {
      await page.goto('/app/scan/new');

      await expect(page.getByRole('heading', { name: /new scan/i })).toBeVisible();
    });

    test('should render History placeholder page', async ({ page }) => {
      await page.goto('/app/history');

      await expect(page.getByRole('heading', { name: /history/i })).toBeVisible();
    });

    test('should render Settings placeholder page', async ({ page }) => {
      await page.goto('/app/settings');

      await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    });
  });
});
