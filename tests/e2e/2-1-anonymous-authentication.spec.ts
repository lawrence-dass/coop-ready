import { test, expect } from '../support/fixtures';

/**
 * Story 2.1: Anonymous Authentication
 *
 * Tests anonymous session creation, authentication flow, and data isolation.
 *
 * Priority Distribution:
 * - P0: 2 tests (critical authentication flow)
 * - P1: 1 test (feature usage)
 * - P2: 1 test (performance)
 *
 * Note: Supabase-dependent tests are skipped in CI until real credentials are configured.
 * To enable in CI, configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * as GitHub secrets with real Supabase values.
 */

// Skip Supabase-dependent tests when using placeholder credentials
const isPlaceholderSupabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') ?? false;

test.describe('Story 2.1: Anonymous Authentication', () => {
  test('[P0] 2.1-E2E-001: should automatically create anonymous session on app visit', async ({
    page,
  }) => {
    // Skip in CI with placeholder Supabase - no real auth will occur
    test.skip(
      isPlaceholderSupabase,
      'Skipped: Requires real Supabase credentials'
    );

    // GIVEN: User navigates to the app
    await page.goto('/');

    // WHEN: Page loads and auth provider initializes
    // Wait for the app container to be visible (indicates auth complete)
    await expect(page.locator('body')).toBeVisible();

    // THEN: Anonymous session should be created
    // Verify that Supabase cookies exist (indicates anonymous session)
    const cookies = await page.context().cookies();
    const supabaseCookies = cookies.filter(
      (cookie) =>
        cookie.name.includes('sb-') || cookie.name.includes('supabase')
    );

    expect(supabaseCookies.length).toBeGreaterThan(0);
  });

  test('[P0] 2.1-E2E-004: should isolate sessions between different anonymous users', async ({
    browser,
  }) => {
    // Skip in CI with placeholder Supabase - no real auth will occur
    test.skip(
      isPlaceholderSupabase,
      'Skipped: Requires real Supabase credentials'
    );

    // GIVEN: Two different browser contexts (simulating two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // WHEN: Both users visit the app
    await page1.goto('/');
    await page2.goto('/');

    await expect(page1.locator('body')).toBeVisible();
    await expect(page2.locator('body')).toBeVisible();

    // THEN: Each user should have a different session
    const cookies1 = await context1.cookies();
    const cookies2 = await context2.cookies();

    const supabaseCookie1 = cookies1.find((c) => c.name.includes('sb-'));
    const supabaseCookie2 = cookies2.find((c) => c.name.includes('sb-'));

    expect(supabaseCookie1).toBeDefined();
    expect(supabaseCookie2).toBeDefined();
    expect(supabaseCookie1?.value).not.toBe(supabaseCookie2?.value);

    // Cleanup
    await context1.close();
    await context2.close();
  });

  test('[P1] 2.1-E2E-002: should access app features without login prompt', async ({
    page,
  }) => {
    // GIVEN: User visits the app
    await page.goto('/');

    // WHEN: Page loads
    await expect(page.locator('body')).toBeVisible();

    // THEN: No login/signup modal or redirect should appear
    // User should remain on the main page (not redirected to /login)
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).not.toHaveURL(/\/signup/);

    // No login modal should be visible
    const loginModal = page.locator('[data-testid="login-modal"]');
    await expect(loginModal).not.toBeVisible();
  });

  test('[P2] 2.1-PERF-001: should create session in less than 2 seconds', async ({
    page,
  }) => {
    // GIVEN: User is about to visit the app
    const startTime = Date.now();

    // WHEN: User navigates to the app
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // THEN: Session creation should complete in < 2 seconds
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(2000); // 2 seconds
  });
});
