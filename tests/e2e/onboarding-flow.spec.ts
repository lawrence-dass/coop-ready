import { test, expect } from '../support/fixtures';

/**
 * Onboarding Flow E2E Tests
 *
 * Tests for Story 2.1: Onboarding Flow - Experience Level & Target Role
 * Covers first-time user onboarding, profile creation, and returning user behavior.
 *
 * Priority breakdown:
 * - P0: First-time login redirect to onboarding (AC1) - 1 test
 * - P0: Experience level selection (AC2) - 1 test
 * - P0: Target role selection (AC3) - 2 tests (standard + custom)
 * - P0: Profile save and redirect (AC4) - 1 test
 * - P0: Skip onboarding for existing users (AC5) - 1 test
 *
 * NOTE: These tests will FAIL initially (RED phase) until implementation is complete.
 * This is expected and required for TDD red-green-refactor cycle.
 *
 * @see _bmad-output/implementation-artifacts/2-1-onboarding-flow-experience-level-target-role.md
 */

test.describe('Onboarding Flow - Experience Level & Target Role', () => {
  test('[P0][AC1] should redirect new user to onboarding after first login', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: A new user has just registered and verified email
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
      // NOTE: User factory should create WITHOUT onboarding_completed flag
    });

    // AND: User logs in for the first time
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);

    // Register session expectation BEFORE clicking (network-first pattern)
    const sessionPromise = page.waitForResponse((resp) =>
      resp.url().includes('/auth/v1/token') && resp.request().method() === 'POST'
    );

    await page.click('[data-testid="login-button"]');

    // WHEN: Login succeeds
    const sessionResponse = await sessionPromise;
    expect(sessionResponse.status()).toBe(200);

    // THEN: User is redirected to /onboarding (NOT /dashboard)
    await expect(page).toHaveURL('/onboarding', { timeout: 10000 });

    // AND: Onboarding page displays
    await expect(page.getByTestId('onboarding-container')).toBeVisible();
  });

  test('[P0][AC1] should block access to protected routes until onboarding complete', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: A new user is authenticated but has not completed onboarding
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    // WHEN: User tries to navigate to protected routes directly
    const protectedRoutes = ['/dashboard', '/settings', '/history', '/scan/new'];

    for (const route of protectedRoutes) {
      await page.goto(route);

      // THEN: User is redirected back to /onboarding
      await expect(page).toHaveURL('/onboarding', { timeout: 5000 });
    }
  });

  test('[P0][AC2] should display experience level selection with two options', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is on the onboarding page
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    // THEN: Experience level selection is visible
    await expect(
      page.getByRole('heading', { name: /experience level/i })
    ).toBeVisible();

    // AND: "Student/Recent Graduate" option is visible with description
    await expect(page.getByTestId('experience-level-student')).toBeVisible();
    await expect(
      page.getByText(/currently studying or graduated within/i)
    ).toBeVisible();

    // AND: "Career Changer" option is visible with description
    await expect(
      page.getByTestId('experience-level-career-changer')
    ).toBeVisible();
    await expect(
      page.getByText(/transitioning from another field/i)
    ).toBeVisible();
  });

  test('[P0][AC2] should require experience level selection to proceed', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is on onboarding page
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    // WHEN: User tries to proceed without selecting experience level
    const nextButton = page.getByTestId('onboarding-next-button');

    // THEN: Next button should be disabled (or show validation error if clicked)
    await expect(nextButton).toBeDisabled();
  });

  test('[P0][AC2] should enable next button when experience level is selected', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is on onboarding page
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    // WHEN: User selects "Student/Recent Graduate"
    await page.click('[data-testid="experience-level-student"]');

    // THEN: Next button becomes enabled
    await expect(page.getByTestId('onboarding-next-button')).toBeEnabled();
  });

  test('[P0][AC3] should display target role selection after experience level', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User has selected experience level
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    await page.click('[data-testid="experience-level-student"]');

    // WHEN: User clicks Next
    await page.click('[data-testid="onboarding-next-button"]');

    // THEN: Target role selection step is displayed
    await expect(
      page.getByRole('heading', { name: /target role/i })
    ).toBeVisible();

    // AND: Role selection dropdown is visible
    await expect(page.getByTestId('target-role-select')).toBeVisible();

    // AND: Common tech roles are available
    const roleSelect = page.getByTestId('target-role-select');
    await roleSelect.click();

    await expect(page.getByText('Software Engineer', { exact: true })).toBeVisible();
    await expect(page.getByText('Data Analyst', { exact: true })).toBeVisible();
    await expect(page.getByText('Product Manager', { exact: true })).toBeVisible();
    await expect(page.getByText('UX Designer', { exact: true })).toBeVisible();
    await expect(page.getByText('Other', { exact: true })).toBeVisible();
  });

  test('[P0][AC3] should allow selecting a standard target role', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is on target role step
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    await page.click('[data-testid="experience-level-career-changer"]');
    await page.click('[data-testid="onboarding-next-button"]');

    // WHEN: User selects "Software Engineer"
    await page.click('[data-testid="target-role-select"]');
    await page.click('text=Software Engineer');

    // THEN: Selection is displayed
    await expect(page.getByTestId('target-role-select')).toContainText(
      'Software Engineer'
    );

    // AND: Complete button is enabled
    await expect(page.getByTestId('onboarding-complete-button')).toBeEnabled();
  });

  test('[P0][AC3] should show custom role input when "Other" is selected', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is on target role step
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    await page.click('[data-testid="experience-level-student"]');
    await page.click('[data-testid="onboarding-next-button"]');

    // WHEN: User selects "Other"
    await page.click('[data-testid="target-role-select"]');
    await page.click('text=Other');

    // THEN: Custom role input field appears
    await expect(page.getByTestId('custom-role-input')).toBeVisible();

    // AND: Input field is focused for immediate typing
    await expect(page.getByTestId('custom-role-input')).toBeFocused();

    // WHEN: User types custom role
    await page.fill('[data-testid="custom-role-input"]', 'Blockchain Developer');

    // THEN: Complete button becomes enabled
    await expect(page.getByTestId('onboarding-complete-button')).toBeEnabled();
  });

  test('[P0][AC4] should save profile and redirect to dashboard on completion', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User has completed both onboarding steps
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    // Complete Step 1: Experience Level
    await page.click('[data-testid="experience-level-career-changer"]');
    await page.click('[data-testid="onboarding-next-button"]');

    // Complete Step 2: Target Role
    await page.click('[data-testid="target-role-select"]');
    await page.click('text=Data Analyst');

    // WHEN: User clicks "Complete Setup"
    await page.click('[data-testid="onboarding-complete-button"]');

    // AND: User is redirected to /dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // AND: Dashboard loads successfully
    await expect(page.getByTestId('dashboard-header')).toBeVisible();

    // AND: Welcome message acknowledges selections
    await expect(
      page.getByText(/career changer|data analyst/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('[P0][AC4] should display success toast after completing onboarding', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User completes onboarding successfully
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    await page.click('[data-testid="experience-level-student"]');
    await page.click('[data-testid="onboarding-next-button"]');

    await page.click('[data-testid="target-role-select"]');
    await page.click('text=Software Engineer');

    // WHEN: User completes setup
    await page.click('[data-testid="onboarding-complete-button"]');

    // THEN: Success toast is displayed
    await expect(
      page.getByText(/profile.*complete|setup.*complete|welcome/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('[P0][AC5] should skip onboarding for users with completed profiles', async ({
    page,
    userFactory,
    profileFactory,
  }) => {
    // GIVEN: An existing user with completed onboarding
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    // Create completed profile for this user
    await profileFactory.create({
      userId: user.id,
      experienceLevel: 'student',
      targetRole: 'Software Engineer',
      onboardingCompleted: true,
    });

    // WHEN: User logs in
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);

    const sessionPromise = page.waitForResponse((resp) =>
      resp.url().includes('/auth/v1/token') && resp.request().method() === 'POST'
    );

    await page.click('[data-testid="login-button"]');
    await sessionPromise;

    // THEN: User is taken directly to dashboard (NOT onboarding)
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // AND: Onboarding page is not shown
    await expect(page.getByTestId('onboarding-container')).not.toBeVisible();

    // AND: Dashboard content loads normally
    await expect(page.getByTestId('dashboard-header')).toBeVisible();
  });

  test('[P0][AC5] should prevent completed users from accessing /onboarding', async ({
    page,
    userFactory,
    profileFactory,
  }) => {
    // GIVEN: User with completed onboarding is logged in
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await profileFactory.create({
      userId: user.id,
      experienceLevel: 'career_changer',
      targetRole: 'Product Manager',
      onboardingCompleted: true,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/dashboard');

    // WHEN: User tries to access /onboarding directly
    await page.goto('/onboarding');

    // THEN: User is redirected to /dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });

  test('[P1] should allow back navigation between onboarding steps', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is on target role step (step 2)
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    await page.click('[data-testid="experience-level-student"]');
    await page.click('[data-testid="onboarding-next-button"]');

    // WHEN: User clicks Back button
    await page.click('[data-testid="onboarding-back-button"]');

    // THEN: User returns to experience level step (step 1)
    await expect(
      page.getByRole('heading', { name: /experience level/i })
    ).toBeVisible();

    // AND: Previous selection is still selected
    await expect(page.getByTestId('experience-level-student')).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  test('[P1] should validate custom role is not empty when Other is selected', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User selected "Other" for target role
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    await page.click('[data-testid="experience-level-student"]');
    await page.click('[data-testid="onboarding-next-button"]');

    await page.click('[data-testid="target-role-select"]');
    await page.click('text=Other');

    // WHEN: User leaves custom role input empty
    await page.fill('[data-testid="custom-role-input"]', '');

    // THEN: Complete button is disabled
    await expect(page.getByTestId('onboarding-complete-button')).toBeDisabled();

    // WHEN: User enters custom role
    await page.fill('[data-testid="custom-role-input"]', 'DevRel Engineer');

    // THEN: Complete button becomes enabled
    await expect(page.getByTestId('onboarding-complete-button')).toBeEnabled();
  });
});
