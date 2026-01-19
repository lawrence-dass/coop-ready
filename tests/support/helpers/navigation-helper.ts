import { Page, expect } from '@playwright/test';

/**
 * Navigation Helper
 *
 * Pure functions for common navigation patterns.
 */

/**
 * Navigate to dashboard and verify load
 */
export async function goToDashboard(page: Page): Promise<void> {
  await page.goto('/dashboard');
  await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
}

/**
 * Navigate to scan page and verify load
 */
export async function goToScan(page: Page): Promise<void> {
  await page.goto('/scan');
  await expect(page.locator('[data-testid="scan-form"]')).toBeVisible();
}

/**
 * Navigate to results page for a specific scan
 */
export async function goToResults(page: Page, scanId: string): Promise<void> {
  await page.goto(`/results/${scanId}`);
  await expect(page.locator('[data-testid="results-container"]')).toBeVisible();
}

/**
 * Navigate to pricing page
 */
export async function goToPricing(page: Page): Promise<void> {
  await page.goto('/pricing');
  await expect(page.locator('[data-testid="pricing-plans"]')).toBeVisible();
}

/**
 * Navigate to profile/settings page
 */
export async function goToProfile(page: Page): Promise<void> {
  await page.goto('/profile');
  await expect(page.locator('[data-testid="profile-form"]')).toBeVisible();
}

/**
 * Wait for page to be fully loaded (no network activity)
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}
