import { test, expect } from '../support/fixtures';
import path from 'path';

/**
 * Job Description Input E2E Tests
 *
 * Tests for Story 3.5: Job Description Input
 * Covers JD input UI, character counting, validation, warnings, and keyword preview.
 *
 * Priority breakdown:
 * - P0: JD Input UI displays (AC1) - 1 test
 * - P0: Character counter real-time update (AC2) - 1 test
 * - P0: Max length validation (AC3) - 1 test
 * - P0: Min length validation (AC4) - 1 test
 * - P0: Short JD warning (AC5) - 1 test
 * - P0: Keyword preview (AC6) - 1 test
 * - P0: Form submission with valid JD - 1 test
 *
 * NOTE: These tests will FAIL initially (RED phase) until implementation is complete.
 * This is expected and required for TDD red-green-refactor cycle.
 */

test.describe('Job Description Input', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // GIVEN: User is authenticated and on the new scan page
    await authenticatedPage.goto('/scan/new');

    // AND: User has uploaded a resume
    const pdfFilePath = path.join(
      __dirname,
      '../support/fixtures/test-files/valid-resume.pdf'
    );
    const fileInput = authenticatedPage.getByTestId('file-input');
    await fileInput.setInputFiles(pdfFilePath);

    // WAIT: For resume upload to complete
    await expect(
      authenticatedPage.getByTestId('file-display')
    ).toBeVisible({ timeout: 15000 });
  });

  test('[P0][AC1] should display job description input UI correctly', async ({
    authenticatedPage,
  }) => {
    // THEN: JD input section is visible
    await expect(authenticatedPage.getByTestId('jd-section')).toBeVisible();

    // AND: JD textarea is visible
    await expect(authenticatedPage.getByTestId('jd-textarea')).toBeVisible();

    // AND: Character counter shows 0/5000
    await expect(authenticatedPage.getByTestId('char-counter')).toContainText(
      '0 / 5000'
    );

    // AND: Helper text is visible
    await expect(authenticatedPage.getByTestId('helper-text')).toContainText(
      'Paste the full job description'
    );
  });

  test('[P0][AC2] should update character counter in real-time', async ({
    authenticatedPage,
  }) => {
    // GIVEN: JD textarea is visible
    const textarea = authenticatedPage.getByTestId('jd-textarea');

    // WHEN: User types text in the textarea
    const testText = 'Senior React Developer position with TypeScript experience required.';
    await textarea.fill(testText);

    // THEN: Character counter updates in real-time
    const expectedCount = testText.length;
    await expect(authenticatedPage.getByTestId('char-counter')).toContainText(
      `${expectedCount} / 5000`
    );

    // AND: Text is accepted without error
    await expect(authenticatedPage.getByTestId('error-message')).not.toBeVisible();
  });

  test('[P0][AC3] should show error for text exceeding 5000 characters', async ({
    authenticatedPage,
  }) => {
    // GIVEN: JD textarea is visible
    const textarea = authenticatedPage.getByTestId('jd-textarea');

    // WHEN: User pastes text exceeding 5000 characters
    const longText = 'A'.repeat(5001);
    await textarea.fill(longText);

    // THEN: Character counter shows over-limit count
    await expect(authenticatedPage.getByTestId('char-counter')).toContainText(
      '5001 / 5000'
    );

    // AND: Character counter shows warning color (red)
    const counter = authenticatedPage.getByTestId('char-counter');
    await expect(counter).toHaveClass(/text-red-600/);

    // AND: Error message is displayed per AC3 requirement
    await expect(authenticatedPage.getByTestId('error-message')).toBeVisible();
    await expect(authenticatedPage.getByTestId('error-message')).toContainText(
      'Job description must be under 5000 characters'
    );

    // AND: User cannot proceed (button disabled)
    const submitButton = authenticatedPage.getByTestId('start-analysis-button');
    await expect(submitButton).toBeDisabled();
  });

  test('[P0][AC4] should show error for empty job description on submit', async ({
    authenticatedPage,
  }) => {
    // GIVEN: JD textarea is empty
    const textarea = authenticatedPage.getByTestId('jd-textarea');
    await expect(textarea).toHaveValue('');

    // WHEN: User tries to submit (click Start Analysis button)
    const submitButton = authenticatedPage.getByTestId('start-analysis-button');

    // THEN: Button is disabled when JD is empty
    await expect(submitButton).toBeDisabled();

    // AND: Button hint shows "Enter a job description to continue"
    await expect(authenticatedPage.getByTestId('button-hint')).toContainText(
      'Enter a job description to continue'
    );
  });

  test('[P0][AC5] should show warning for short job description (<100 chars)', async ({
    authenticatedPage,
  }) => {
    // GIVEN: JD textarea is visible
    const textarea = authenticatedPage.getByTestId('jd-textarea');

    // WHEN: User pastes a short job description (< 100 characters)
    const shortJD = 'Senior Developer position';
    await textarea.fill(shortJD);

    // THEN: Warning message is displayed
    await expect(authenticatedPage.getByTestId('short-warning')).toBeVisible();
    await expect(authenticatedPage.getByTestId('short-warning')).toContainText(
      'Job description seems short. Include the full posting for best results'
    );

    // AND: User can still proceed (warning, not error)
    const submitButton = authenticatedPage.getByTestId('start-analysis-button');

    // Wait for resume processing to complete first
    await expect(
      authenticatedPage.getByText(/processing resume/i)
    ).not.toBeVisible({ timeout: 30000 });

    // Then button should be enabled
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
  });

  test('[P0][AC6] should display keyword preview for valid job description', async ({
    authenticatedPage,
  }) => {
    // GIVEN: JD textarea is visible
    const textarea = authenticatedPage.getByTestId('jd-textarea');

    // WHEN: User pastes a valid job description with keywords
    const validJD = `
      We are looking for a Senior React Developer with experience in TypeScript,
      Node.js, and MongoDB. The ideal candidate will have strong Python skills
      and knowledge of GraphQL, Docker, and Kubernetes. Experience with AWS
      and CI/CD pipelines is a plus.
    `;
    await textarea.fill(validJD);

    // THEN: Keyword preview section is visible
    await expect(authenticatedPage.getByTestId('keyword-preview')).toBeVisible();

    // AND: Detected keywords are displayed
    await expect(authenticatedPage.getByTestId('keyword-list')).toBeVisible();

    // AND: Technical keywords are extracted and shown
    const keywordList = authenticatedPage.getByTestId('keyword-list');
    await expect(keywordList).toContainText('React');
    await expect(keywordList).toContainText('TypeScript');
    await expect(keywordList).toContainText('Python');
  });

  test('[P0] should submit form with valid resume and job description', async ({
    authenticatedPage,
  }) => {
    // GIVEN: Resume is uploaded and processed
    await expect(
      authenticatedPage.getByText(/processing resume/i)
    ).not.toBeVisible({ timeout: 30000 });

    // AND: Valid job description is entered
    const textarea = authenticatedPage.getByTestId('jd-textarea');
    const validJD = `
      We are looking for a Senior React Developer with 5+ years of experience.
      The role requires strong TypeScript skills, experience with Next.js,
      and knowledge of modern testing frameworks like Playwright and Jest.
      You'll work on building scalable web applications using React, Node.js,
      and PostgreSQL. Familiarity with CI/CD, Docker, and cloud platforms (AWS)
      is highly desirable.
    `.trim();
    await textarea.fill(validJD);

    // WHEN: User clicks Start Analysis button
    const submitButton = authenticatedPage.getByTestId('start-analysis-button');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // THEN: Success toast is displayed
    await expect(
      authenticatedPage.getByText(/scan created successfully/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('[P0] should show character counter color coding', async ({
    authenticatedPage,
  }) => {
    // GIVEN: JD textarea is visible
    const textarea = authenticatedPage.getByTestId('jd-textarea');
    const counter = authenticatedPage.getByTestId('char-counter');

    // WHEN: User types 100 characters (green zone)
    await textarea.fill('A'.repeat(100));

    // THEN: Counter is in muted color (default)
    await expect(counter).toHaveClass(/text-muted-foreground/);

    // WHEN: User types 3500 characters (yellow zone)
    await textarea.fill('A'.repeat(3600));

    // THEN: Counter is yellow
    await expect(counter).toHaveClass(/text-yellow-600/);

    // WHEN: User types 4500 characters (red zone)
    await textarea.fill('A'.repeat(4600));

    // THEN: Counter is red
    await expect(counter).toHaveClass(/text-red-600/);
  });
});
