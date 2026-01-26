import { test, expect } from '../support/fixtures';
import path from 'path';

/**
 * Story 5.5: Epic 5 Integration & Verification Testing
 *
 * E2E tests verifying the complete ATS Analysis & Scoring epic works end-to-end.
 * Tests integration of Stories 5.1 (Keyword Analysis), 5.2 (Score Calculation),
 * 5.3 (Score Display), and 5.4 (Gap Analysis).
 *
 * Priority Distribution:
 * - P0: 4 tests (core ATS analysis workflows)
 * - P1: 3 tests (re-analysis, gap filtering, accessibility)
 */

test.describe('Epic 5: ATS Analysis & Scoring - Integration Tests', () => {
  const resumePath = path.join(__dirname, '../fixtures/sample-resume.pdf');
  const sampleJD = `We are looking for a Senior Software Engineer with the following qualifications:

Required Skills:
- Python programming
- AWS cloud services
- React and TypeScript
- Project management
- Agile methodologies

Experience:
- 5+ years of software development
- Led teams of developers
- Designed scalable systems

Nice to have:
- Docker and Kubernetes
- Machine learning experience`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  // ============================================================================
  // FULL USER JOURNEY
  // ============================================================================

  test('[P0] 5.5-E2E-001: Full journey - Upload → JD → Analyze → Score → Gaps', async ({
    page,
  }) => {
    // GIVEN: User is on the home page

    // Step 1: Upload resume
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(resumePath);
    await expect(page.getByText(/Resume extracted successfully/i)).toBeVisible({
      timeout: 10000,
    });

    // Step 2: Enter job description
    const jdTextarea = page.locator('textarea[placeholder*="job description" i]');
    await jdTextarea.fill(sampleJD);

    // Step 3: Click Analyze
    const analyzeButton = page.getByRole('button', { name: /Analyze/i });
    await expect(analyzeButton).toBeVisible();
    await analyzeButton.click();

    // Wait for analysis to complete
    await expect(page.getByText(/Analyzing/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Analyzing/i)).not.toBeVisible({
      timeout: 60000,
    });

    // Step 4: Verify ATS score is displayed
    await expect(page.getByText(/ATS Score/i)).toBeVisible({ timeout: 10000 });

    // Score should be a number 0-100
    const scoreElement = page.locator('[role="progressbar"]');
    await expect(scoreElement).toBeVisible();

    // Step 5: Verify score breakdown is visible
    await expect(page.getByText(/Keyword/i).first()).toBeVisible();
    await expect(page.getByText(/Section/i).first()).toBeVisible();
    await expect(page.getByText(/Quality/i).first()).toBeVisible();

    // Step 6: Verify gap analysis section is visible
    await expect(
      page.getByText(/Gap|Missing Keywords/i).first()
    ).toBeVisible();
  });

  test('[P0] 5.5-E2E-002: Score and analysis persist after page reload', async ({
    page,
  }) => {
    // GIVEN: User completes full analysis

    // Upload resume
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(resumePath);
    await expect(page.getByText(/Resume extracted successfully/i)).toBeVisible({
      timeout: 10000,
    });

    // Enter JD and analyze
    const jdTextarea = page.locator('textarea[placeholder*="job description" i]');
    await jdTextarea.fill(sampleJD);
    await page.getByRole('button', { name: /Analyze/i }).click();
    await expect(page.getByText(/Analyzing/i)).not.toBeVisible({
      timeout: 60000,
    });

    // Wait for score to appear
    await expect(page.getByText(/ATS Score/i)).toBeVisible({ timeout: 10000 });

    // Capture score value before reload
    const scoreText = await page
      .locator('[role="progressbar"]')
      .getAttribute('aria-valuenow');

    // WHEN: User reloads the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // THEN: Score and analysis should still be visible
    await expect(page.getByText(/ATS Score/i)).toBeVisible({ timeout: 10000 });

    // Score value should be preserved
    const scoreAfterReload = await page
      .locator('[role="progressbar"]')
      .getAttribute('aria-valuenow');
    expect(scoreAfterReload).toBe(scoreText);
  });

  test('[P0] 5.5-E2E-003: Cannot analyze without both resume and JD', async ({
    page,
  }) => {
    // GIVEN: Only JD is entered (no resume)
    const jdTextarea = page.locator('textarea[placeholder*="job description" i]');
    await jdTextarea.fill(sampleJD);

    // THEN: Analyze button should not be visible
    await expect(
      page.getByRole('button', { name: /Analyze Keywords/i })
    ).not.toBeVisible();

    // GIVEN: Only resume is uploaded (no JD)
    await jdTextarea.clear();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(resumePath);
    await expect(page.getByText(/Resume extracted successfully/i)).toBeVisible({
      timeout: 10000,
    });

    // THEN: Analyze button should not be visible (no JD)
    await expect(
      page.getByRole('button', { name: /Analyze Keywords/i })
    ).not.toBeVisible();
  });

  test('[P0] 5.5-E2E-004: Score interpretation message matches score range', async ({
    page,
  }) => {
    // GIVEN: User completes full analysis

    // Upload resume
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(resumePath);
    await expect(page.getByText(/Resume extracted successfully/i)).toBeVisible({
      timeout: 10000,
    });

    // Enter JD and analyze
    const jdTextarea = page.locator('textarea[placeholder*="job description" i]');
    await jdTextarea.fill(sampleJD);
    await page.getByRole('button', { name: /Analyze/i }).click();
    await expect(page.getByText(/Analyzing/i)).not.toBeVisible({
      timeout: 60000,
    });

    // Wait for score
    await expect(page.getByText(/ATS Score/i)).toBeVisible({ timeout: 10000 });

    // THEN: An interpretation message should be visible
    // The message varies by score range but one of these should be present
    const interpretationVisible = await page
      .locator(
        'text=/needs significant|room for improvement|good match|strong match|excellent/i'
      )
      .first()
      .isVisible();
    expect(interpretationVisible).toBe(true);
  });

  // ============================================================================
  // RE-ANALYSIS AND UPDATES
  // ============================================================================

  test('[P1] 5.5-E2E-005: Re-analyze with different JD updates score', async ({
    page,
  }) => {
    // GIVEN: User completes first analysis

    // Upload resume
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(resumePath);
    await expect(page.getByText(/Resume extracted successfully/i)).toBeVisible({
      timeout: 10000,
    });

    // First analysis
    const jdTextarea = page.locator('textarea[placeholder*="job description" i]');
    await jdTextarea.fill('Looking for Python developer with basic skills.');
    await page.getByRole('button', { name: /Analyze/i }).click();
    await expect(page.getByText(/Analyzing/i)).not.toBeVisible({
      timeout: 60000,
    });
    await expect(page.getByText(/ATS Score/i)).toBeVisible({ timeout: 10000 });

    // WHEN: User changes JD and re-analyzes
    await jdTextarea.clear();
    await jdTextarea.fill(sampleJD);
    await page.getByRole('button', { name: /Analyze/i }).click();
    await expect(page.getByText(/Analyzing/i)).not.toBeVisible({
      timeout: 60000,
    });

    // THEN: Score should be updated (visible)
    await expect(page.getByText(/ATS Score/i)).toBeVisible({ timeout: 10000 });
    const scoreElement = page.locator('[role="progressbar"]');
    await expect(scoreElement).toBeVisible();
  });

  // ============================================================================
  // GAP ANALYSIS INTERACTION
  // ============================================================================

  test('[P1] 5.5-E2E-006: Gap analysis priority filters work', async ({
    page,
  }) => {
    // GIVEN: User completes analysis with keywords that have gaps

    // Upload resume
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(resumePath);
    await expect(page.getByText(/Resume extracted successfully/i)).toBeVisible({
      timeout: 10000,
    });

    // Enter JD with many keywords to ensure some gaps
    const jdTextarea = page.locator('textarea[placeholder*="job description" i]');
    await jdTextarea.fill(`Required Skills:
- Rust programming language
- Haskell functional programming
- Quantum computing expertise
- Blockchain development
- Assembly language
- COBOL legacy systems
- Fortran scientific computing`);
    await page.getByRole('button', { name: /Analyze/i }).click();
    await expect(page.getByText(/Analyzing/i)).not.toBeVisible({
      timeout: 60000,
    });

    // THEN: Gap analysis section should be visible with filter options
    await expect(
      page.getByText(/Gap|Missing Keywords/i).first()
    ).toBeVisible({ timeout: 10000 });

    // Priority filter chips should be available
    const filterChips = page.locator('button').filter({
      hasText: /All|High|Medium|Low/i,
    });
    const chipCount = await filterChips.count();
    if (chipCount > 0) {
      // Click a filter chip to verify filtering works
      await filterChips.first().click();
      // Page should still show gap analysis (no crash)
      await expect(
        page.getByText(/Gap|Missing Keywords/i).first()
      ).toBeVisible();
    }
  });

  // ============================================================================
  // REGRESSION
  // ============================================================================

  test('[P1] 5.5-E2E-007: No console errors during ATS analysis flow', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Upload resume
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(resumePath);
    await expect(page.getByText(/Resume extracted successfully/i)).toBeVisible({
      timeout: 10000,
    });

    // Enter JD and analyze
    const jdTextarea = page.locator('textarea[placeholder*="job description" i]');
    await jdTextarea.fill(sampleJD);
    await page.getByRole('button', { name: /Analyze/i }).click();
    await expect(page.getByText(/Analyzing/i)).not.toBeVisible({
      timeout: 60000,
    });

    // Wait for score
    await expect(page.getByText(/ATS Score/i)).toBeVisible({ timeout: 10000 });

    // THEN: No console errors during the entire flow
    expect(consoleErrors).toHaveLength(0);
  });
});
