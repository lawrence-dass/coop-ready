import { test, expect } from '@playwright/test';

/**
 * Story 16.6: Settings Page E2E Tests
 *
 * Tests the complete flow of settings page, preference updates, and sign out.
 *
 * Priority Distribution:
 * - P0: 4 tests (navigate to settings, update preferences, sign out, profile display)
 * - P1: 2 tests (form validation, mobile responsive)
 *
 * @P0
 */

// Test credentials - in CI, these should be set via environment variables
const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'test@example.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'password123';

test.describe('Story 16.6: Settings Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as authenticated user
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|scan|history|settings)/);
  });

  test('[P0] 16.6-E2E-SETTINGS-001: should navigate to settings page from sidebar', async ({ page }) => {
    // WHEN: Clicking settings link in sidebar
    await page.click('a[href="/settings"]');

    // THEN: Should navigate to settings page
    await expect(page).toHaveURL('/settings');
    await expect(page.locator('h1, h2').filter({ hasText: /Settings/i }).first()).toBeVisible();
  });

  test('[P0] 16.6-E2E-SETTINGS-002: should display all settings sections', async ({ page }) => {
    // GIVEN: User is on settings page
    await page.goto('/settings');

    // THEN: Should show all four sections
    await expect(page.locator('text=/Profile Information/i')).toBeVisible();
    await expect(page.locator('text=/Optimization Preferences/i')).toBeVisible();
    await expect(page.locator('text=/Privacy Settings/i')).toBeVisible();
    await expect(page.locator('text=/Account Actions/i')).toBeVisible();
  });

  test('[P0] 16.6-E2E-SETTINGS-003: should update preferences successfully', async ({ page }) => {
    // GIVEN: User is on settings page
    await page.goto('/settings');

    // WHEN: User updates industry focus
    const industryInput = page.locator('input[name="industry"]');
    await industryInput.clear();
    await industryInput.fill('Healthcare');

    // Save button should become enabled
    const saveButton = page.locator('button:has-text("Save Preferences")');
    await expect(saveButton).toBeEnabled();

    // Click save
    await saveButton.click();

    // THEN: Should show success toast
    await expect(page.locator('text=/Preferences saved successfully/i')).toBeVisible({ timeout: 5000 });

    // Save button should be disabled again (form pristine)
    await expect(saveButton).toBeDisabled();
  });

  test('[P0] 16.6-E2E-SETTINGS-004: should display user profile information', async ({ page }) => {
    // GIVEN: User is on settings page
    await page.goto('/settings');

    // THEN: Should show user email and account creation date
    await expect(page.locator('text=/test@example.com/i')).toBeVisible();
    await expect(page.locator('text=/Member since/i')).toBeVisible();
    await expect(page.locator('text=/User ID/i')).toBeVisible();
  });

  test('[P0] 16.6-E2E-SETTINGS-005: should sign out successfully', async ({ page }) => {
    // GIVEN: User is on settings page
    await page.goto('/settings');

    // WHEN: Clicking sign out button
    await page.click('button:has-text("Sign Out")');

    // THEN: Should redirect to login page
    await expect(page).toHaveURL('/auth/login', { timeout: 5000 });
  });

  test('[P0] 16.6-E2E-SETTINGS-006: should display privacy consent status', async ({ page }) => {
    // GIVEN: User is on settings page
    await page.goto('/settings');

    // THEN: Should show privacy consent section
    await expect(page.locator('text=/Privacy consent/i')).toBeVisible();
    await expect(page.locator('text=/Review Privacy Policy/i')).toBeVisible();
  });

  test('[P1] 16.6-E2E-SETTINGS-007: should validate form changes before enabling save', async ({ page }) => {
    // GIVEN: User is on settings page
    await page.goto('/settings');

    // WHEN: Form is not modified
    const saveButton = page.locator('button:has-text("Save Preferences")');

    // THEN: Save button should be disabled
    await expect(saveButton).toBeDisabled();

    // WHEN: User makes a change
    const industryInput = page.locator('input[name="industry"]');
    await industryInput.fill('New Industry');

    // THEN: Save button should be enabled
    await expect(saveButton).toBeEnabled();
  });

  test('[P1] 16.6-E2E-SETTINGS-008: should be responsive on mobile', async ({ page }) => {
    // GIVEN: Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // WHEN: Navigating to settings page
    await page.goto('/settings');

    // THEN: Page should be usable on mobile
    // Sidebar should collapse to hamburger
    await expect(page.locator('button[aria-label*="menu"]')).toBeVisible();

    // All sections should be visible (stacked vertically)
    await expect(page.locator('text=/Profile Information/i')).toBeVisible();
    await expect(page.locator('text=/Optimization Preferences/i')).toBeVisible();

    // Form fields should be full width
    const industryInput = page.locator('input[name="industry"]');
    await expect(industryInput).toBeVisible();

    // Buttons should be accessible
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
  });

  test('[P1] 16.6-E2E-SETTINGS-009: should have delete account button disabled', async ({ page }) => {
    // GIVEN: User is on settings page
    await page.goto('/settings');

    // THEN: Delete account button should be disabled
    const deleteButton = page.locator('button:has-text("Delete Account")');
    await expect(deleteButton).toBeDisabled();
  });

  test('[P1] 16.6-E2E-SETTINGS-010: should open privacy policy in new tab', async ({ page }) => {
    // GIVEN: User is on settings page
    await page.goto('/settings');

    // WHEN: Clicking privacy policy link
    const [newPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('text=/Review Privacy Policy/i'),
    ]);

    // THEN: Should open privacy policy in new tab
    await expect(newPage).toHaveURL(/privacy/i);
  });
});
