/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect, Page } from '@playwright/test';
import { UserFactory } from './factories/user-factory';
import { ResumeFactory } from './factories/resume-factory';
import { ScanFactory } from './factories/scan-factory';
import { ProfileFactory } from './factories/profile-factory';

/**
 * CoopReady Test Fixtures
 *
 * Extends Playwright's base test with CoopReady-specific fixtures.
 * Uses pure function -> fixture -> mergeTests pattern.
 *
 * @see _bmad/bmm/testarch/knowledge/fixture-architecture.md
 */

type TestFixtures = {
  userFactory: UserFactory;
  resumeFactory: ResumeFactory;
  scanFactory: ScanFactory;
  profileFactory: ProfileFactory;
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  userFactory: async ({ request }, use) => {
    const factory = new UserFactory(request);
    await use(factory);
    await factory.cleanup();
  },

  resumeFactory: async ({ request }, use) => {
    const factory = new ResumeFactory(request);
    await use(factory);
    await factory.cleanup();
  },

  scanFactory: async ({ request }, use) => {
    const factory = new ScanFactory(request);
    await use(factory);
    await factory.cleanup();
  },

  profileFactory: async ({ request }, use) => {
    const factory = new ProfileFactory(request);
    await use(factory);
    await factory.cleanup();
  },

  /**
   * Authenticated Page Fixture
   *
   * Provides a page with an authenticated user session.
   * Logs in via the actual Supabase UI using test credentials.
   *
   * Requires TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.local
   *
   * Usage:
   * test('should access dashboard', async ({ authenticatedPage }) => {
   *   await authenticatedPage.goto('/dashboard');
   *   // Page is already authenticated
   * });
   */
  authenticatedPage: async ({ page }, use) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error(
        'TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local for authenticated tests. ' +
        'Create a test user in your Supabase project and add credentials to .env.local'
      );
    }

    // Navigate to login page
    await page.goto('/auth/login');

    // Fill in credentials and submit (using id selectors matching login-form.tsx)
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.click('button[type="submit"]');

    // Wait for either redirect to dashboard OR error message
    try {
      await page.waitForURL(/\/(dashboard|protected)/, { timeout: 30000 });
    } catch {
      // Check if there's an error message on the page
      const errorText = await page.locator('.text-red-500').textContent().catch(() => null);
      if (errorText) {
        throw new Error(`Login failed with error: ${errorText}`);
      }
      // Check current URL
      const currentUrl = page.url();
      throw new Error(`Login did not redirect. Current URL: ${currentUrl}. Check credentials.`);
    }

    // Use the authenticated page
    await use(page);

    // No explicit cleanup needed - browser context handles session
  },
});

export { expect };
