import { test, expect } from '../support/fixtures';

/**
 * Story 4.4: Epic 4 Integration & Verification Testing
 *
 * E2E tests verifying the complete Job Description Input epic works end-to-end.
 * Tests integration of Stories 4.1 (Input), 4.2 (Editing), and 4.3 (Clear).
 *
 * Priority Distribution:
 * - P0: 6 tests (core workflows A-F)
 * - P1: 4 tests (regression, accessibility, performance)
 */

test.describe('Epic 4: Job Description Input - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  // ============================================================================
  // STORY 4.1: JOB DESCRIPTION INPUT
  // ============================================================================

  test('[P0] 4.4-E2E-001: Story 4.1 - Input component renders and accepts text', async ({
    page,
  }) => {
    // Verify JobDescriptionInput component renders
    const textarea = page.locator('textarea#jd-input');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute(
      'placeholder',
      'Paste the job description here...'
    );

    // Paste text into textarea
    const testJD =
      'Senior Software Engineer with 5+ years of experience in React and TypeScript';
    await textarea.fill(testJD);

    // Verify character counter displays
    await expect(
      page.locator('text=' + testJD.length + ' characters')
    ).toBeVisible();
  });

  test('[P0] 4.4-E2E-002: Story 4.1 - Validation enforces 50 character minimum', async ({
    page,
  }) => {
    const textarea = page.locator('textarea#jd-input');

    // Enter text < 50 characters
    await textarea.fill('Short text');

    // Verify validation error message shows
    await expect(page.locator('text=/minimum 50 required/i')).toBeVisible();

    // Enter text >= 50 characters
    const validJD = 'a'.repeat(50);
    await textarea.fill(validJD);

    // Verify validation error disappears
    await expect(
      page.locator('text=/minimum 50 required/i')
    ).not.toBeVisible();
  });

  // ============================================================================
  // STORY 4.2: JOB DESCRIPTION EDITING
  // ============================================================================

  test('[P0] 4.4-E2E-003: Story 4.2 - Editing updates character count in real-time', async ({
    page,
  }) => {
    const textarea = page.locator('textarea#jd-input');

    // Type text incrementally and wait for each update
    await textarea.fill('First');
    await expect(page.getByText('5 characters (required)')).toBeVisible();

    await textarea.fill('First edit');
    await expect(page.getByText('10 characters (required)')).toBeVisible();

    await textarea.fill('First edit second');
    await expect(page.getByText('18 characters (required)')).toBeVisible();
  });

  test('[P1] 4.4-E2E-004: Story 4.2 - Multiple edits work correctly', async ({
    page,
  }) => {
    const textarea = page.locator('textarea#jd-input');

    // Paste initial text
    await textarea.fill('Initial job description text goes here');

    // Edit by appending
    await textarea.fill('Initial job description text goes here with more content');

    // Edit by replacing
    await textarea.fill('Completely different job description content');

    // Verify final text is correct
    await expect(textarea).toHaveValue(
      'Completely different job description content'
    );
  });

  // ============================================================================
  // STORY 4.3: JOB DESCRIPTION CLEAR
  // ============================================================================

  test('[P0] 4.4-E2E-005: Story 4.3 - Clear button visible only when JD has content', async ({
    page,
  }) => {
    const textarea = page.locator('textarea#jd-input');
    const clearButton = page.getByRole('button', { name: /clear job description/i });

    // Initially, clear button should NOT be visible (empty textarea)
    await expect(clearButton).not.toBeVisible();

    // Paste text
    await textarea.fill('Job description content');

    // Clear button should now be visible
    await expect(clearButton).toBeVisible();
  });

  test('[P0] 4.4-E2E-006: Story 4.3 - Clicking clear empties textarea and hides button', async ({
    page,
  }) => {
    const textarea = page.locator('textarea#jd-input');
    const clearButton = page.getByRole('button', { name: /clear job description/i });

    // Paste text
    await textarea.fill('Content to be cleared');
    await expect(clearButton).toBeVisible();

    // Click clear button
    await clearButton.click();

    // Verify textarea is empty
    await expect(textarea).toHaveValue('');

    // Verify clear button is hidden
    await expect(clearButton).not.toBeVisible();

    // Verify character count reset and validation shows "required" state
    await expect(page.locator('text=0 characters (required)')).toBeVisible();
  });

  // ============================================================================
  // COMPLETE USER WORKFLOWS
  // ============================================================================

  test('[P0] 4.4-E2E-007: Workflow A - Paste → Edit → Clear → Paste different', async ({
    page,
  }) => {
    const textarea = page.locator('textarea#jd-input');
    const clearButton = page.getByRole('button', { name: /clear job description/i });

    // Step 1: Paste initial JD
    const firstJD = 'Senior Software Engineer position requires 5+ years experience';
    await textarea.fill(firstJD);
    await expect(textarea).toHaveValue(firstJD);

    // Step 2: Edit the JD
    const editedJD = firstJD + ' in React and TypeScript frameworks';
    await textarea.fill(editedJD);
    await expect(textarea).toHaveValue(editedJD);

    // Step 3: Clear the JD
    await clearButton.click();
    await expect(textarea).toHaveValue('');

    // Step 4: Paste different JD
    const secondJD = 'Data Scientist role focused on machine learning and Python development';
    await textarea.fill(secondJD);
    await expect(textarea).toHaveValue(secondJD);

    // Verify character count matches new JD
    await expect(page.locator('text=' + secondJD.length + ' characters')).toBeVisible();
  });

  test('[P0] 4.4-E2E-008: Workflow B - Paste → Edit → Reload → Verify persisted', async ({
    page,
  }) => {
    const textarea = page.locator('textarea#jd-input');

    // Step 1: Paste JD
    const testJD =
      'Backend Engineer with expertise in Node.js, PostgreSQL, and microservices architecture';
    await textarea.fill(testJD);
    await expect(textarea).toHaveValue(testJD);

    // Step 2: Edit JD
    const editedJD = testJD + ' and Docker containerization';
    await textarea.fill(editedJD);

    // Wait for persistence (debounce delay: 500ms)
    await page.waitForTimeout(600);

    // Step 3: Reload page
    await page.reload();
    await expect(page.locator('body')).toBeVisible();

    // Step 4: Verify JD is restored
    const reloadedTextarea = page.locator('textarea#jd-input');
    await expect(reloadedTextarea).toHaveValue(editedJD);
  });

  test('[P0] 4.4-E2E-009: Workflow C - Multiple paste/edit/clear cycles', async ({
    page,
  }) => {
    const textarea = page.locator('textarea#jd-input');
    const clearButton = page.getByRole('button', { name: /clear job description/i });

    // Cycle 1
    await textarea.fill('First job description content here');
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await expect(textarea).toHaveValue('');

    // Cycle 2
    await textarea.fill('Second job description different from first');
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await expect(textarea).toHaveValue('');

    // Cycle 3
    await textarea.fill('Third and final job description for this test');
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await expect(textarea).toHaveValue('');

    // Verify final state is clean
    await expect(textarea).toHaveValue('');
    await expect(clearButton).not.toBeVisible();
    await expect(page.locator('text=0 characters (required)')).toBeVisible();
  });

  test('[P0] 4.4-E2E-010: Workflow D - Paste partial → Edit to 50+ chars', async ({
    page,
  }) => {
    const textarea = page.locator('textarea#jd-input');

    // Paste invalid (< 50 chars)
    const shortJD = 'Software Engineer position';
    await textarea.fill(shortJD);

    // Verify validation error
    await expect(page.locator('text=/minimum 50 required/i')).toBeVisible();

    // Edit to make valid (>= 50 chars)
    const validJD = shortJD + ' requiring extensive experience in web technologies';
    await textarea.fill(validJD);

    // Verify validation error disappears
    await expect(
      page.locator('text=/minimum 50 required/i')
    ).not.toBeVisible();

    // Verify character count shows valid state
    await expect(page.locator('text=' + validJD.length + ' characters')).toBeVisible();
  });

  test('[P0] 4.4-E2E-011: Workflow F - Clear → Reload → Verify empty persists', async ({
    page,
  }) => {
    const textarea = page.locator('textarea#jd-input');
    const clearButton = page.getByRole('button', { name: /clear job description/i });

    // Paste JD
    await textarea.fill('Content that will be cleared and should not return');

    // Clear JD
    await clearButton.click();
    await expect(textarea).toHaveValue('');

    // Wait for persistence
    await page.waitForTimeout(600);

    // Reload page
    await page.reload();
    await expect(page.locator('body')).toBeVisible();

    // Verify textarea is still empty (cleared state persisted)
    const reloadedTextarea = page.locator('textarea#jd-input');
    await expect(reloadedTextarea).toHaveValue('');
    await expect(page.locator('text=0 characters (required)')).toBeVisible();
  });

  // ============================================================================
  // REGRESSION TESTING
  // ============================================================================

  test('[P1] 4.4-E2E-012: No regressions - Resume upload still works', async ({
    page,
  }) => {
    // Verify resume uploader section is present (use heading role for uniqueness)
    const resumeHeading = page.getByRole('heading', { name: /Upload Resume/i });
    await expect(resumeHeading).toBeVisible();

    // Just verify the section renders - actual upload tested in Story 3 tests
    await expect(resumeHeading).toBeVisible();
  });

  test('[P1] 4.4-E2E-013: No console errors during normal usage', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const textarea = page.locator('textarea#jd-input');
    const clearButton = page.getByRole('button', { name: /clear job description/i });

    // Perform normal usage
    await textarea.fill('Test job description with sufficient length to pass validation');
    await clearButton.click();
    await textarea.fill('Another job description for testing purposes here');

    // Verify no console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });

  // ============================================================================
  // ACCESSIBILITY TESTING
  // ============================================================================

  test('[P1] 4.4-E2E-014: Accessibility - Keyboard navigation works', async ({
    page,
  }) => {
    const textarea = page.locator('textarea#jd-input');

    // Focus textarea directly and type
    await textarea.focus();
    await expect(textarea).toBeFocused();

    // Type using keyboard
    await textarea.type('Keyboard accessible job description input');

    // Verify text was entered
    await expect(textarea).toHaveValue('Keyboard accessible job description input');

    // Focus clear button and press Enter
    const clearButton = page.getByRole('button', { name: /clear job description/i });
    await clearButton.focus();
    await expect(clearButton).toBeFocused();

    // Press Enter to activate clear button
    await page.keyboard.press('Enter');

    // Verify textarea was cleared
    await expect(textarea).toHaveValue('');
  });
});
