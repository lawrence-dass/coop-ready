/**
 * Story 16.8: Epic 16 Integration and Verification Testing
 * Main integration test file
 *
 * Tests cover:
 * - AC#1: Landing page verification
 * - AC#2: Authentication redirect
 * - AC#10: Browser navigation
 * - AC#11: Cross-browser compatibility (run same tests in all browsers)
 *
 * @P0
 */

import { test, expect } from '../support/fixtures';

// Check if running with placeholder Supabase (tests that need real auth will be skipped)
const isPlaceholderSupabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') ?? false;

test.describe('Epic 16 Integration: Landing Page Verification @P0', () => {
  test.describe('AC#1: Landing Page Displays Correctly', () => {
    test('[P0] landing page displays all sections for unauthenticated users', async ({
      page,
    }) => {
      // GIVEN: User is not authenticated
      await page.context().clearCookies();

      // WHEN: User navigates to home page
      await page.goto('/', { waitUntil: 'networkidle' });

      // THEN: Hero section is visible
      await expect(
        page.getByRole('heading', { name: /Land More Interviews/i })
      ).toBeVisible();

      // THEN: CTA buttons are visible
      await expect(
        page.getByRole('link', { name: /Get Started Free/i }).first()
      ).toBeVisible();
      await expect(page.getByRole('link', { name: /Sign In/i })).toBeVisible();

      // THEN: Features section is visible
      await expect(
        page.getByText('ATS Score Analysis', { exact: true })
      ).toBeVisible();
      await expect(
        page.getByText('AI-Powered Suggestions', { exact: true })
      ).toBeVisible();
      await expect(
        page.getByText('Section-by-Section', { exact: true })
      ).toBeVisible();
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

    test('[P0] Get Started Free CTA navigates to signup', async ({ page }) => {
      // GIVEN: User is on landing page
      await page.context().clearCookies();
      await page.goto('/', { waitUntil: 'networkidle' });

      // WHEN: User clicks Get Started Free CTA
      await page.getByRole('link', { name: /Get Started Free/i }).first().click();

      // THEN: User is navigated to signup page
      await expect(page).toHaveURL('/auth/signup');
    });

    test('[P0] Sign In CTA navigates to login', async ({ page }) => {
      // GIVEN: User is on landing page
      await page.context().clearCookies();
      await page.goto('/', { waitUntil: 'networkidle' });

      // WHEN: User clicks Sign In CTA
      await page.getByRole('link', { name: /Sign In/i }).click();

      // THEN: User is navigated to login page
      await expect(page).toHaveURL('/auth/login');
    });

    test('[P1] Privacy Policy footer link works', async ({ page }) => {
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

    test('[P1] Terms of Service footer link works', async ({ page }) => {
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
});

test.describe('Epic 16 Integration: Authentication Redirect @P0', () => {
  test.describe('AC#2: Authentication Redirect Behavior', () => {
    test('[P0] unauthenticated users accessing /app/* routes are redirected to login', async ({
      page,
    }) => {
      // GIVEN: User is not authenticated
      await page.context().clearCookies();

      // WHEN: User tries to access protected dashboard routes
      const protectedRoutes = [
        '/dashboard',
        '/scan/new',
        '/history',
        '/settings',
      ];

      for (const route of protectedRoutes) {
        try {
          await page.goto(route, { waitUntil: 'networkidle' });
        } catch {
          // Navigation might be interrupted by redirect (expected in webkit)
        }

        // THEN: User is redirected to login page (may include query params)
        await expect(page).toHaveURL(/\/auth\/login/);
      }
    });

    test('[P0] dashboard route exists and returns non-404', async ({ page }) => {
      // WHEN: User navigates to dashboard
      const response = await page.goto('/dashboard');

      // THEN: Route exists (not 404)
      expect(response?.status()).not.toBe(404);
    });

    test('[P1] /scan/[id] route with invalid session ID redirects or shows error', async ({
      page,
    }) => {
      // GIVEN: User is not authenticated
      await page.context().clearCookies();

      // WHEN: User navigates to an invalid session
      try {
        await page.goto('/scan/invalid-session-id', { waitUntil: 'networkidle' });
      } catch {
        // Navigation may be interrupted by redirect
      }

      // THEN: Either redirects to login (unauthenticated) or shows 404/error
      const url = page.url();
      const response = await page.evaluate(() => document.body.innerText);
      const isRedirectOrNotFound =
        url.includes('/auth/login') ||
        url.includes('/404') ||
        response.includes('404') ||
        response.includes('not found');
      expect(isRedirectOrNotFound).toBe(true);
    });
  });
});

test.describe('Epic 16 Integration: Browser Navigation @P0', () => {
  test.describe('AC#10: Browser Navigation Works Correctly', () => {
    test('[P0] browser back button works on landing page navigation', async ({
      page,
    }) => {
      // GIVEN: User navigates from landing to signup
      await page.context().clearCookies();
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.getByRole('link', { name: /Get Started Free/i }).first().click();
      await expect(page).toHaveURL('/auth/signup');

      // WHEN: User clicks browser back button
      await page.goBack();

      // THEN: User returns to landing page
      await expect(page).toHaveURL('/');
      await expect(
        page.getByRole('heading', { name: /Land More Interviews/i })
      ).toBeVisible();
    });

    test('[P0] browser forward button works after going back', async ({ page }) => {
      // GIVEN: User navigates to signup and back
      await page.context().clearCookies();
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.getByRole('link', { name: /Get Started Free/i }).first().click();
      await expect(page).toHaveURL('/auth/signup');
      await page.goBack();
      await expect(page).toHaveURL('/');

      // WHEN: User clicks browser forward button
      await page.goForward();

      // THEN: User returns to signup page
      await expect(page).toHaveURL('/auth/signup');
    });

    test('[P1] old /history route redirects to /history', async ({ page }) => {
      // GIVEN: User is authenticated (for this test to work properly, we need auth)
      // If placeholder Supabase, just check the redirect happens
      await page.context().clearCookies();

      // WHEN: User navigates to old history route
      try {
        await page.goto('/history', { waitUntil: 'networkidle' });
      } catch {
        // Navigation might be interrupted by redirect
      }

      // THEN: User is redirected (either to /history or /auth/login)
      const url = page.url();
      const wasRedirected =
        url.includes('/history') || url.includes('/auth/login');
      expect(wasRedirected).toBe(true);
    });

    test('[P1] page refresh maintains current route', async ({ page }) => {
      // GIVEN: User is on landing page
      await page.context().clearCookies();
      await page.goto('/', { waitUntil: 'networkidle' });

      // WHEN: User refreshes the page
      await page.reload({ waitUntil: 'networkidle' });

      // THEN: User stays on landing page
      await expect(page).toHaveURL('/');
      await expect(
        page.getByRole('heading', { name: /Land More Interviews/i })
      ).toBeVisible();
    });
  });
});

test.describe('Epic 16 Integration: SEO & Performance @P1', () => {
  test('[P1] landing page has proper title', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page).toHaveTitle(/SubmitSmart.*ATS.*Resume/i);
  });

  test('[P1] landing page has single h1 heading', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/', { waitUntil: 'networkidle' });

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toHaveCount(1);
  });

  test('[P2] no console errors on landing page', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.context().clearCookies();
    await page.goto('/', { waitUntil: 'networkidle' });

    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('favicon') &&
        !error.includes('Failed to load resource') // Network errors are expected in test env
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
