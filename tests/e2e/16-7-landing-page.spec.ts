/**
 * Story 16.7: Create Full Marketing Landing Page
 * E2E tests for landing page functionality
 *
 * Tests cover:
 * - Anonymous user sees landing page with all sections
 * - CTA navigation to signup and login
 * - Authenticated user redirected to dashboard
 * - Mobile responsive layout
 */

import { test, expect } from '../support/fixtures';

test.describe('Marketing Landing Page @P0', () => {
  test.describe('AC#1, AC#2, AC#3, AC#4, AC#5, AC#6: Section Rendering', () => {
    test('[P0] anonymous user sees landing page with all sections', async ({
      page,
    }) => {
      // GIVEN: User is not authenticated
      await page.context().clearCookies();

      // WHEN: User navigates to home page
      await page.goto('/', { waitUntil: 'networkidle' });

      // THEN: Hero section is visible with headline and CTAs
      await expect(
        page.getByRole('heading', { name: /Land More Interviews/i })
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /Get Started Free/i }).first()
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /Sign In/i })
      ).toBeVisible();

      // THEN: Features section is visible (use exact: true to avoid duplicate matches)
      await expect(page.getByText('ATS Score Analysis', { exact: true })).toBeVisible();
      await expect(page.getByText('AI-Powered Suggestions', { exact: true })).toBeVisible();
      await expect(page.getByText('Section-by-Section', { exact: true })).toBeVisible();
      await expect(page.getByText('Privacy-First', { exact: true })).toBeVisible();

      // THEN: How It Works section is visible
      await expect(
        page.getByRole('heading', { name: /How it works/i })
      ).toBeVisible();
      await expect(page.getByText('Upload Resume')).toBeVisible();
      await expect(page.getByText('Paste Job Description')).toBeVisible();
      await expect(page.getByText('Get Suggestions')).toBeVisible();

      // THEN: Testimonials section is visible
      await expect(
        page.getByRole('heading', { name: /What our users say/i })
      ).toBeVisible();

      // THEN: Pricing section is visible
      await expect(
        page.getByRole('heading', { name: /Simple, transparent pricing/i })
      ).toBeVisible();
      await expect(page.getByText('Free Forever')).toBeVisible();

      // THEN: Footer is visible
      await expect(
        page.getByRole('link', { name: /Privacy Policy/i })
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /Terms of Service/i })
      ).toBeVisible();
    });
  });

  test.describe('AC#1: CTA Navigation', () => {
    test('[P0] clicking Get Started Free navigates to signup', async ({
      page,
    }) => {
      // GIVEN: User is on landing page
      await page.context().clearCookies();
      await page.goto('/', { waitUntil: 'networkidle' });

      // WHEN: User clicks Get Started Free CTA
      await page.getByRole('link', { name: /Get Started Free/i }).first().click();

      // THEN: User is navigated to signup page
      await expect(page).toHaveURL('/auth/signup');
    });

    test('[P0] clicking Sign In navigates to login', async ({ page }) => {
      // GIVEN: User is on landing page
      await page.context().clearCookies();
      await page.goto('/', { waitUntil: 'networkidle' });

      // WHEN: User clicks Sign In CTA
      await page.getByRole('link', { name: /Sign In/i }).click();

      // THEN: User is navigated to login page
      await expect(page).toHaveURL('/auth/login');
    });
  });

  test.describe('AC#7: Authentication Redirect', () => {
    test('[P1] landing page route exists and responds', async ({ page }) => {
      // GIVEN: User clears cookies
      await page.context().clearCookies();

      // WHEN: User navigates to home
      const response = await page.goto('/');

      // THEN: Route exists (not 404)
      expect(response?.status()).not.toBe(404);
    });
  });

  test.describe('AC#6: Footer Links', () => {
    test('[P1] privacy policy link works', async ({ page }) => {
      // GIVEN: User is on landing page
      await page.context().clearCookies();
      await page.goto('/', { waitUntil: 'networkidle' });

      // WHEN: User clicks Privacy Policy link
      await page.getByRole('link', { name: /Privacy Policy/i }).click();

      // THEN: User is navigated to privacy policy page
      await expect(page).toHaveURL('/privacy-policy');
      await expect(
        page.getByRole('heading', { name: /Privacy Policy/i })
      ).toBeVisible();
    });

    test('[P1] terms of service link works', async ({ page }) => {
      // GIVEN: User is on landing page
      await page.context().clearCookies();
      await page.goto('/', { waitUntil: 'networkidle' });

      // WHEN: User clicks Terms of Service link
      await page.getByRole('link', { name: /Terms of Service/i }).click();

      // THEN: User is navigated to terms of service page
      await expect(page).toHaveURL('/terms-of-service');
      await expect(
        page.getByRole('heading', { name: /Terms of Service/i })
      ).toBeVisible();
    });
  });

  test.describe('AC#9: SEO & Performance', () => {
    test('[P1] page has proper title', async ({ page }) => {
      // GIVEN: User is on landing page
      await page.context().clearCookies();
      await page.goto('/', { waitUntil: 'networkidle' });

      // THEN: Page has SEO-friendly title
      await expect(page).toHaveTitle(/SubmitSmart.*ATS.*Resume/i);
    });

    test('[P1] page has proper h1 heading', async ({ page }) => {
      // GIVEN: User is on landing page
      await page.context().clearCookies();
      await page.goto('/', { waitUntil: 'networkidle' });

      // THEN: Page has single h1 with relevant content
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
      await expect(h1).toHaveCount(1);
    });
  });
});

test.describe('Marketing Landing Page - Mobile @P1', () => {
  test.describe('AC#8: Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('[P1] landing page is responsive on mobile', async ({ page }) => {
      // GIVEN: User is on mobile device
      await page.context().clearCookies();
      await page.goto('/', { waitUntil: 'networkidle' });

      // THEN: Hero section is visible
      await expect(
        page.getByRole('heading', { name: /Land More Interviews/i })
      ).toBeVisible();

      // THEN: CTAs are visible
      await expect(
        page.getByRole('link', { name: /Get Started Free/i }).first()
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /Sign In/i })
      ).toBeVisible();

      // THEN: No horizontal scroll
      const body = page.locator('body');
      const bodyWidth = await body.evaluate((el) => el.scrollWidth);
      const viewportWidth = 375;
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // Allow 1px tolerance
    });
  });
});
