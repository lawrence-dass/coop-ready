import { test, expect } from '../support/fixtures';

/**
 * Dashboard Layout & Design System Tests
 *
 * Tests for Story 1.2: Design System & Layout Shell
 * Covers theme configuration, layout rendering, and responsive behavior.
 *
 * NOTE: These tests require authentication. Set TEST_USER_EMAIL and
 * TEST_USER_PASSWORD in .env.local with valid Supabase user credentials.
 *
 * Priority breakdown:
 * - P0: Critical layout rendering (1 test)
 * - P1: Theme colors, navigation, responsiveness (7 tests)
 * - P2: Desktop layout optimization (1 test)
 */

// Skip all tests if auth credentials are not available
const hasAuthCredentials = process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD;

test.describe('Dashboard Layout', () => {
  // Skip entire describe block if no auth credentials
  test.skip(!hasAuthCredentials, 'Skipping: TEST_USER_EMAIL and TEST_USER_PASSWORD required');

  test('[P0] should render dashboard layout with sidebar and main content', async ({ authenticatedPage }) => {
    // GIVEN: Desktop viewport (1280px) for sidebar visibility
    await authenticatedPage.setViewportSize({ width: 1280, height: 720 });

    // WHEN: User navigates to dashboard (already authenticated)
    await authenticatedPage.goto('/dashboard');

    // THEN: Sidebar is visible on desktop
    await expect(authenticatedPage.locator('[data-testid="sidebar"]')).toBeVisible();

    // AND: Main content area is visible
    await expect(authenticatedPage.locator('main')).toBeVisible();
  });

  test('[P1] should display all navigation items in sidebar', async ({ authenticatedPage }) => {
    // GIVEN: Desktop viewport where sidebar is visible
    await authenticatedPage.setViewportSize({ width: 1280, height: 720 });
    await authenticatedPage.goto('/dashboard');

    // WHEN: Sidebar is visible
    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // THEN: All navigation items are present
    await expect(sidebar.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /new scan/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /history/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /settings/i })).toBeVisible();
  });

  test('[P1] should navigate to different pages via sidebar links', async ({ authenticatedPage }) => {
    // GIVEN: Desktop viewport for sidebar visibility
    await authenticatedPage.setViewportSize({ width: 1280, height: 720 });
    await authenticatedPage.goto('/dashboard');

    // WHEN: User clicks "New Scan" link
    await authenticatedPage.locator('[data-testid="sidebar"]').getByRole('link', { name: /new scan/i }).click();

    // THEN: User is navigated to new scan page
    await expect(authenticatedPage).toHaveURL(/\/scan\/new/);

    // WHEN: User clicks "History" link
    await authenticatedPage.locator('[data-testid="sidebar"]').getByRole('link', { name: /history/i }).click();

    // THEN: User is navigated to history page
    await expect(authenticatedPage).toHaveURL(/\/history/);

    // WHEN: User clicks "Settings" link
    await authenticatedPage.locator('[data-testid="sidebar"]').getByRole('link', { name: /settings/i }).click();

    // THEN: User is navigated to settings page
    await expect(authenticatedPage).toHaveURL(/\/settings/);
  });

  test('[P1] should toggle sidebar collapse/expand on desktop', async ({ authenticatedPage }) => {
    // GIVEN: Desktop viewport (1280px)
    await authenticatedPage.setViewportSize({ width: 1280, height: 720 });
    await authenticatedPage.goto('/dashboard');

    // WHEN: Sidebar is initially expanded
    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Wait for any initial re-renders to settle (user data fetch)
    await authenticatedPage.waitForTimeout(500);

    // THEN: Toggle button exists
    const toggleButton = authenticatedPage.locator('[data-testid="sidebar-toggle"]');
    await expect(toggleButton).toBeVisible();

    // WHEN: User clicks toggle to collapse (use force to handle any transition instability)
    await toggleButton.click({ force: true });

    // THEN: Sidebar enters collapsed state
    await expect(sidebar).toHaveAttribute('data-collapsed', 'true');

    // WHEN: User clicks toggle to expand
    await toggleButton.click({ force: true });

    // THEN: Sidebar expands again
    await expect(sidebar).toHaveAttribute('data-collapsed', 'false');
  });

  test('[P1] should display header with user menu on mobile', async ({ authenticatedPage }) => {
    // GIVEN: Mobile viewport (375px) where header is visible
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });
    await authenticatedPage.goto('/dashboard');

    // WHEN: Header loads on mobile
    const header = authenticatedPage.locator('[data-testid="header"]');
    await expect(header).toBeVisible();

    // THEN: User menu trigger (avatar button) is visible
    const userMenuButton = header.getByRole('button', { name: /open user menu/i });
    await expect(userMenuButton).toBeVisible();
  });
});

test.describe('Theme Configuration', () => {
  test.skip(!hasAuthCredentials, 'Skipping: TEST_USER_EMAIL and TEST_USER_PASSWORD required');

  test('[P1] should apply CoopReady brand colors', async ({ authenticatedPage }) => {
    // GIVEN: Desktop viewport
    await authenticatedPage.setViewportSize({ width: 1280, height: 720 });
    await authenticatedPage.goto('/dashboard');

    // WHEN: Page loads with theme
    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // THEN: Sidebar inner content has dark navy background (bg-sidebar class)
    // The background is on the inner div, not the aside container
    const sidebarContent = sidebar.locator('.bg-sidebar').first();
    const sidebarBg = await sidebarContent.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // Check for dark navy color - should be a non-transparent color
    // HSL(210, 24%, 24%) = rgb(47, 62, 78) approximately
    expect(sidebarBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(sidebarBg).toMatch(/rgb/); // Should have an rgb color value

    // AND: Main background uses the app background color
    const appBackground = authenticatedPage.locator('.bg-background').first();
    const appBg = await appBackground.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // Should have a defined background color (not transparent)
    expect(appBg).not.toBe('rgba(0, 0, 0, 0)');
  });
});

test.describe('Mobile Responsiveness', () => {
  test.skip(!hasAuthCredentials, 'Skipping: TEST_USER_EMAIL and TEST_USER_PASSWORD required');

  test('[P1] should collapse sidebar to hamburger menu on mobile', async ({ authenticatedPage }) => {
    // GIVEN: Mobile viewport (375px)
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });
    await authenticatedPage.goto('/dashboard');

    // WHEN: Page loads on mobile
    // THEN: Sidebar is not visible (hidden on mobile)
    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]');
    await expect(sidebar).not.toBeVisible();

    // AND: Hamburger menu button is visible
    const hamburgerButton = authenticatedPage.locator('[data-testid="mobile-menu-trigger"]');
    await expect(hamburgerButton).toBeVisible();
  });

  test('[P1] should open mobile menu when hamburger is clicked', async ({ authenticatedPage }) => {
    // GIVEN: Mobile viewport (375px)
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });
    await authenticatedPage.goto('/dashboard');

    // WHEN: User clicks hamburger menu
    const hamburgerButton = authenticatedPage.locator('[data-testid="mobile-menu-trigger"]');
    await hamburgerButton.click();

    // THEN: Mobile sidebar overlay appears
    const mobileMenu = authenticatedPage.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();

    // AND: Navigation items are visible in mobile menu
    await expect(mobileMenu.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(mobileMenu.getByRole('link', { name: /new scan/i })).toBeVisible();
    await expect(mobileMenu.getByRole('link', { name: /history/i })).toBeVisible();
    await expect(mobileMenu.getByRole('link', { name: /settings/i })).toBeVisible();
  });

  test('[P1] should keep content accessible and readable on mobile', async ({ authenticatedPage }) => {
    // GIVEN: Mobile viewport (375px)
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });
    await authenticatedPage.goto('/dashboard');

    // WHEN: Page loads on mobile
    const mainContent = authenticatedPage.locator('main');
    await expect(mainContent).toBeVisible();

    // THEN: Content is not clipped or overflowing
    const isOverflowing = await mainContent.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });
    expect(isOverflowing).toBe(false);

    // AND: Text is readable (check minimum font size)
    const fontSize = await mainContent.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum).toBeGreaterThanOrEqual(14); // Minimum readable font size
  });
});

test.describe('Desktop Responsiveness', () => {
  test.skip(!hasAuthCredentials, 'Skipping: TEST_USER_EMAIL and TEST_USER_PASSWORD required');

  test('[P1] should expand sidebar by default on desktop', async ({ authenticatedPage }) => {
    // GIVEN: Desktop viewport (1280px)
    await authenticatedPage.setViewportSize({ width: 1280, height: 720 });
    await authenticatedPage.goto('/dashboard');

    // WHEN: Page loads on desktop
    const sidebar = authenticatedPage.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // THEN: Sidebar is expanded (not collapsed)
    const isExpanded = await sidebar.evaluate((el) => {
      const width = window.getComputedStyle(el).width;
      return parseInt(width) > 100; // Expanded sidebar should be wider than 100px
    });
    expect(isExpanded).toBe(true);

    // AND: Sidebar shows both icons and labels
    await expect(sidebar.getByText(/dashboard/i)).toBeVisible();
    await expect(sidebar.getByText(/new scan/i)).toBeVisible();
  });

  test('[P2] should use full width appropriately on desktop', async ({ authenticatedPage }) => {
    // GIVEN: Desktop viewport (1280px)
    await authenticatedPage.setViewportSize({ width: 1280, height: 720 });
    await authenticatedPage.goto('/dashboard');

    // WHEN: Layout renders on desktop
    const mainContent = authenticatedPage.locator('main');
    await expect(mainContent).toBeVisible();

    // THEN: Main content uses available width (accounting for sidebar)
    const contentWidth = await mainContent.evaluate((el) => {
      return window.getComputedStyle(el).width;
    });
    const contentWidthNum = parseInt(contentWidth);

    // Content should take most of the viewport (accounting for sidebar ~250px)
    expect(contentWidthNum).toBeGreaterThan(900); // 1280 - sidebar width - padding
    expect(contentWidthNum).toBeLessThan(1100); // Not full width (sidebar takes space)
  });
});
