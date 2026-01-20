import { test, expect } from '../support/fixtures';
import path from 'path';

/**
 * New Scan Page E2E Tests
 *
 * Tests for Story 3.6: New Scan Page Integration
 * Covers integrated layout, resume upload, JD input, button states, and persistence.
 *
 * Priority breakdown:
 * - P0: Page layout and components display (AC1) - 1 test
 * - P0: Button disabled without JD (AC2) - 1 test
 * - P0: Button disabled without resume (AC3) - 1 test
 * - P0: Full analysis workflow (AC4) - 1 test
 * - P1: Resume persistence (AC5) - 1 test
 * - P1: Responsive design (AC6) - 1 test
 *
 * NOTE: These tests will FAIL initially (RED phase) until implementation is complete.
 * This is expected and required for TDD red-green-refactor cycle.
 *
 * REQUIRED TEST FILES: Create these files in tests/support/fixtures/test-files/
 * - valid-resume.pdf (< 2MB PDF)
 */

test.describe('New Scan Page Integration', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // GIVEN: User is authenticated and has completed onboarding
    await authenticatedPage.goto('/scan/new');
  });

  test('[P0][AC1] should display scan page with all components', async ({
    authenticatedPage,
  }) => {
    // THEN: Page is displayed
    await expect(authenticatedPage.getByTestId('scan-new-page')).toBeVisible();

    // AND: Resume upload section is visible (left/top)
    await expect(authenticatedPage.getByTestId('resume-section')).toBeVisible();

    // AND: Job description section is visible (right/bottom)
    await expect(authenticatedPage.getByTestId('jd-section')).toBeVisible();

    // AND: Start Analysis button exists
    await expect(
      authenticatedPage.getByTestId('start-analysis-button')
    ).toBeVisible();

    // AND: Button is initially disabled
    await expect(
      authenticatedPage.getByTestId('start-analysis-button')
    ).toBeDisabled();
  });

  test('[P0][AC2] should disable button and show hint when resume uploaded but no JD', async ({
    authenticatedPage,
  }) => {
    // WHEN: User uploads a resume
    const testFilePath = path.join(__dirname, '../support/fixtures/test-files/valid-resume.pdf');
    const fileInput = authenticatedPage.getByTestId('file-input');
    await fileInput.setInputFiles(testFilePath);

    // Wait for upload to complete
    await expect(authenticatedPage.getByTestId('file-display')).toBeVisible({
      timeout: 10000,
    });

    // THEN: Start Analysis button is disabled
    await expect(
      authenticatedPage.getByTestId('start-analysis-button')
    ).toBeDisabled();

    // AND: Hint message is displayed
    await expect(
      authenticatedPage.getByText(/enter a job description to continue/i)
    ).toBeVisible();
  });

  test('[P0][AC3] should disable button and show hint when JD entered but no resume', async ({
    authenticatedPage,
  }) => {
    // GIVEN: Page is loaded but no resume uploaded

    // WHEN: User enters job description
    const jdTextarea = authenticatedPage.getByTestId('jd-textarea');
    await jdTextarea.fill(
      'Senior React Developer with 5+ years of experience. Must have TypeScript, Next.js skills.'
    );

    // THEN: Start Analysis button is disabled
    await expect(
      authenticatedPage.getByTestId('start-analysis-button')
    ).toBeDisabled();

    // AND: Hint message is displayed
    await expect(
      authenticatedPage.getByText(/upload your resume to continue/i)
    ).toBeVisible();
  });

  test('[P0][AC4] should enable button and create scan when both inputs are valid', async ({
    authenticatedPage,
  }) => {
    // WHEN: User uploads a resume
    const testFilePath = path.join(__dirname, '../support/fixtures/test-files/valid-resume.pdf');
    const fileInput = authenticatedPage.getByTestId('file-input');
    await fileInput.setInputFiles(testFilePath);

    // Wait for upload to complete
    await expect(authenticatedPage.getByTestId('file-display')).toBeVisible({
      timeout: 10000,
    });

    // AND: User enters job description
    const jdTextarea = authenticatedPage.getByTestId('jd-textarea');
    await jdTextarea.fill(
      'Senior React Developer with 5+ years of experience in building scalable web applications. ' +
      'Required skills include TypeScript, Next.js, React, and Node.js. ' +
      'Experience with Tailwind CSS and modern frontend architecture is a plus.'
    );

    // THEN: Start Analysis button is enabled
    await expect(
      authenticatedPage.getByTestId('start-analysis-button')
    ).toBeEnabled();

    // WHEN: User clicks Start Analysis
    await authenticatedPage.getByTestId('start-analysis-button').click();

    // THEN: User is redirected to scan results page
    await expect(authenticatedPage).toHaveURL(/\/scan\/[a-f0-9-]{36}$/i, {
      timeout: 10000,
    });

    // AND: Loading state is shown
    // Note: This test assumes scan/[scanId] page exists with loading indicator
    await expect(
      authenticatedPage.getByText(/analysis in progress|processing/i)
    ).toBeVisible();
  });

  test('[P1][AC5] should persist resume across page reloads', async ({
    authenticatedPage,
  }) => {
    // WHEN: User uploads a resume
    const testFilePath = path.join(__dirname, '../support/fixtures/test-files/valid-resume.pdf');
    const fileInput = authenticatedPage.getByTestId('file-input');
    await fileInput.setInputFiles(testFilePath);

    // Wait for upload to complete
    await expect(authenticatedPage.getByTestId('file-display')).toBeVisible({
      timeout: 10000,
    });

    // WHEN: User reloads the page
    await authenticatedPage.reload();

    // THEN: Previously uploaded resume is still displayed
    await expect(authenticatedPage.getByTestId('file-display')).toBeVisible();
    await expect(
      authenticatedPage.getByText(/valid-resume\.pdf/i)
    ).toBeVisible();

    // AND: User can remove and upload a different resume
    await authenticatedPage.getByTestId('remove-button').click();
    await expect(authenticatedPage.getByTestId('upload-zone')).toBeVisible();
  });

  test('[P1][AC6] should have responsive two-column layout', async ({
    authenticatedPage,
  }) => {
    // WHEN: Viewing on desktop (default viewport)
    await authenticatedPage.setViewportSize({ width: 1280, height: 720 });

    // THEN: Layout uses grid with columns
    const pageContainer = authenticatedPage.getByTestId('scan-layout');
    const classes = await pageContainer.getAttribute('class');

    // Verify responsive grid classes exist (lg:grid-cols-2)
    expect(classes).toContain('grid');

    // WHEN: Viewing on mobile
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });

    // THEN: Layout is still accessible
    await expect(authenticatedPage.getByTestId('resume-section')).toBeVisible();
    await expect(authenticatedPage.getByTestId('jd-section')).toBeVisible();
    await expect(
      authenticatedPage.getByTestId('start-analysis-button')
    ).toBeVisible();
  });

  test('[P0] should show contextual hints based on form state', async ({
    authenticatedPage,
  }) => {
    // GIVEN: Empty form
    // THEN: Both fields required hint or generic message
    await expect(
      authenticatedPage.getByTestId('start-analysis-button')
    ).toBeDisabled();

    // WHEN: Upload resume
    const testFilePath = path.join(__dirname, '../support/fixtures/test-files/valid-resume.pdf');
    await authenticatedPage.getByTestId('file-input').setInputFiles(testFilePath);
    await expect(authenticatedPage.getByTestId('file-display')).toBeVisible({
      timeout: 10000,
    });

    // THEN: Hint for JD
    await expect(
      authenticatedPage.getByText(/enter a job description to continue/i)
    ).toBeVisible();

    // WHEN: Remove resume and add JD
    await authenticatedPage.getByTestId('remove-button').click();
    await authenticatedPage
      .getByTestId('jd-textarea')
      .fill('Senior Developer role with React and TypeScript experience.');

    // THEN: Hint for resume
    await expect(
      authenticatedPage.getByText(/upload your resume to continue/i)
    ).toBeVisible();
  });

  test('[P0] should handle loading state during scan creation', async ({
    authenticatedPage,
  }) => {
    // WHEN: User completes form
    const testFilePath = path.join(__dirname, '../support/fixtures/test-files/valid-resume.pdf');
    await authenticatedPage.getByTestId('file-input').setInputFiles(testFilePath);
    await expect(authenticatedPage.getByTestId('file-display')).toBeVisible({
      timeout: 10000,
    });

    await authenticatedPage
      .getByTestId('jd-textarea')
      .fill('Full stack developer with modern JavaScript frameworks experience.');

    // WHEN: User clicks Start Analysis
    await authenticatedPage.getByTestId('start-analysis-button').click();

    // THEN: Button shows loading state
    // Note: Button text may change to "Starting..." or show spinner
    await expect(
      authenticatedPage.getByTestId('start-analysis-button')
    ).toBeDisabled();

    // AND: Eventually navigates to results page
    await expect(authenticatedPage).toHaveURL(/\/scan\/[a-f0-9-]{36}$/i, {
      timeout: 10000,
    });
  });
});
