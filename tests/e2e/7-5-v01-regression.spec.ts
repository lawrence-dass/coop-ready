/**
 * Test ID: 7.5-E2E-004
 * Priority: P0 (BLOCKER)
 * Story: 7.5 - Epic 7 Integration and Verification Testing
 *
 * Purpose: Verify all 31 V0.1 stories work together; no regressions in Epics 1-6
 * Coverage: AC-10 - V0.1 feature completeness
 *
 * Gap: CRITICAL - No comprehensive regression suite for V0.1 release
 * Impact: Cannot verify Epic 7 didn't break Epics 1-6; production regressions likely
 * Risk Score: 9 (Probability=3: No coverage × Impact=3: Release blocking)
 */

import { test, expect } from '@playwright/test';

test.describe('[P0] V0.1 Regression Suite - Full Workflow', () => {
  test('[P0] should complete full V0.1 workflow: upload → parse → analyze → optimize → feedback', async ({
    page,
  }) => {
    // GIVEN: User navigates to app (Epic 2 - Anonymous access)
    await page.goto('/');

    // Verify app loads and anonymous session created (Epic 2)
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveTitle(/SubmitSmart/);

    // ============================================================================
    // EPIC 3: Resume Upload & Parsing
    // ============================================================================

    // Mock successful optimization for later
    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            suggestions: {
              summary: [
                'Senior Software Engineer with extensive experience in distributed systems',
              ],
              skills: ['Added: Kubernetes, Docker, Terraform'],
              experience: [
                'Led team of 5 engineers in building microservices architecture',
              ],
            },
            analysis: {
              score: 87,
              matchedKeywords: ['software', 'engineer', 'distributed', 'systems'],
              missingKeywords: ['kubernetes', 'docker'],
              gaps: [
                'Add cloud infrastructure experience',
                'Highlight containerization skills',
              ],
            },
          },
          error: null,
        }),
      });
    });

    // Story 3.1: Upload resume (PDF)
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();

    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\nMock resume content\nSoftware Engineer with 5 years experience'),
    });

    // Story 3.2: File validation (valid PDF)
    // Should not show error
    await expect(page.locator('[data-testid="error-display"]')).not.toBeVisible();

    // Story 3.3, 3.4: PDF parsing and text extraction
    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 5000 });

    // Story 3.5: Resume section parsing (verify sections detected)
    // This is implicit - resume is parsed into sections for analysis

    // ============================================================================
    // EPIC 4: Job Description Input
    // ============================================================================

    // Story 4.1: Input job description
    const jobDescriptionInput = page.locator('[data-testid="job-description-input"]');
    await expect(jobDescriptionInput).toBeVisible();

    const jobDescription = `Senior Software Engineer

We are seeking a Senior Software Engineer with experience in:
- Distributed systems
- Cloud infrastructure
- Kubernetes and Docker
- Team leadership
- Microservices architecture`;

    await jobDescriptionInput.fill(jobDescription);

    // Story 4.2: Edit job description (verify editable)
    await jobDescriptionInput.fill(jobDescription + '\n- Additional requirement');
    await expect(jobDescriptionInput).toHaveValue(/Additional requirement/);

    // Story 4.3: Clear job description
    const clearButton = page.locator('[data-testid="clear-jd-button"]');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await expect(jobDescriptionInput).toHaveValue('');
      // Re-enter JD for rest of test
      await jobDescriptionInput.fill(jobDescription);
    }

    // ============================================================================
    // EPIC 5: ATS Analysis & Scoring
    // ============================================================================

    // Trigger optimization (combines Epic 5 and Epic 6)
    const optimizeButton = page.locator('[data-testid="optimize-button"]');
    await expect(optimizeButton).toBeVisible();
    await expect(optimizeButton).toBeEnabled();

    await optimizeButton.click();

    // Wait for optimization to complete
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 10000 });

    // Story 5.1: Keyword analysis
    // Verify matched and missing keywords detected
    // (This is done by the API, results displayed in suggestions)

    // Story 5.3: Score display with breakdown
    const scoreDisplay = page.locator('[data-testid="score-display"]');
    await expect(scoreDisplay).toBeVisible();
    await expect(scoreDisplay).toContainText('87');

    // Story 5.4: Gap analysis display
    const gapAnalysis = page.locator('[data-testid="gap-analysis"]');
    await expect(gapAnalysis).toBeVisible();
    await expect(gapAnalysis).toContainText(/cloud infrastructure|containerization/i);

    // ============================================================================
    // EPIC 6: Content Optimization
    // ============================================================================

    // Story 6.1: LLM pipeline API route (implicit - called by optimize button)

    // Story 6.2, 6.3, 6.4: Suggestions for summary, skills, experience
    const summarySuggestions = page.locator('[data-testid="suggestions-summary"]');
    await expect(summarySuggestions).toBeVisible();
    await expect(summarySuggestions).toContainText(/Senior Software Engineer/i);

    const skillsSuggestions = page.locator('[data-testid="suggestions-skills"]');
    await expect(skillsSuggestions).toBeVisible();
    await expect(skillsSuggestions).toContainText(/Kubernetes|Docker/i);

    const experienceSuggestions = page.locator('[data-testid="suggestions-experience"]');
    await expect(experienceSuggestions).toBeVisible();
    await expect(experienceSuggestions).toContainText(/microservices/i);

    // Story 6.5: Suggestion display UI
    // Verified above - all sections visible

    // Story 6.6: Copy to clipboard
    const copyButton = page.locator('[data-testid="copy-summary-0"]').first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // Verify copy feedback (toast or button state change)
    await expect(page.locator('[data-testid="copy-success"]').or(page.locator(':has-text("Copied")'))).toBeVisible({
      timeout: 2000,
    });

    // Story 6.7: Regenerate suggestions (if implemented)
    const regenerateButton = page.locator('[data-testid="regenerate-button"]');
    if (await regenerateButton.isVisible()) {
      await regenerateButton.click();
      // Wait for new suggestions
      await page.waitForTimeout(1000);
    }

    // ============================================================================
    // EPIC 7: Error Handling & Feedback
    // ============================================================================

    // Story 7.4: Suggestion feedback
    // Provide thumbs up on summary suggestion
    const thumbsUpButton = page.locator('[data-testid="feedback-up-summary-0"]');
    await expect(thumbsUpButton).toBeVisible();
    await thumbsUpButton.click();

    // Verify feedback recorded (button shows active state)
    await expect(thumbsUpButton).toHaveClass(/active/);

    // Provide thumbs down on skills suggestion
    const thumbsDownButton = page.locator('[data-testid="feedback-down-skills-0"]');
    await expect(thumbsDownButton).toBeVisible();
    await thumbsDownButton.click();
    await expect(thumbsDownButton).toHaveClass(/active/);

    // ============================================================================
    // EPIC 2: Session Persistence (across refresh)
    // ============================================================================

    // WHEN: User refreshes page
    await page.reload();

    // THEN: All state persists
    // Resume still parsed
    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible();

    // Job description still present
    await expect(jobDescriptionInput).toHaveValue(jobDescription);

    // Suggestions still visible
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();

    // Score still displayed
    await expect(scoreDisplay).toBeVisible();
    await expect(scoreDisplay).toContainText('87');

    // Feedback still recorded
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-down-skills-0"]')).toHaveClass(/active/);
  });

  test('[P0] should handle error scenarios without breaking existing functionality', async ({ page }) => {
    // GIVEN: User navigates to app
    await page.goto('/');

    // ============================================================================
    // EPIC 7: Error Handling (Stories 7.1, 7.2, 7.3)
    // ============================================================================

    let attemptCount = 0;

    await page.route('**/api/optimize', async (route) => {
      attemptCount++;

      if (attemptCount === 1) {
        // Story 7.1, 7.3: First attempt times out
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: {
              code: 'LLM_TIMEOUT',
              message: 'The optimization process took too long and was cancelled.',
            },
          }),
        });
      } else if (attemptCount === 2) {
        // Story 7.2: Second attempt has LLM error (retry)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: {
              code: 'LLM_ERROR',
              message: 'The AI service encountered an error. Please try again.',
            },
          }),
        });
      } else {
        // Third attempt succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              suggestions: {
                summary: ['Improved summary after retry'],
                skills: ['Enhanced skills after retry'],
                experience: ['Better experience after retry'],
              },
              analysis: {
                score: 82,
                matchedKeywords: ['engineer'],
                missingKeywords: [],
                gaps: [],
              },
            },
            error: null,
          }),
        });
      }
    });

    // Upload resume and JD
    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume content'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer position');

    // First attempt: timeout error
    await page.locator('[data-testid="optimize-button"]').click();

    // Story 7.1: Error displays correctly
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-title"]')).toContainText(/Took Too Long/i);

    // Story 7.2: Retry button shows for retriable error
    const retryButton = page.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    // Second attempt: LLM error
    await retryButton.click();

    // Error updates
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();

    // Retry again
    await retryButton.click();

    // Third attempt: success
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 10000 });

    // Verify all Epic 6 functionality still works after errors
    await expect(page.locator('[data-testid="score-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="suggestions-summary"]')).toBeVisible();

    // Story 7.4: Feedback still works after error recovery
    await page.locator('[data-testid="feedback-up-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);
  });

  test('[P0] should handle file validation errors (Epic 3 + Epic 7)', async ({ page }) => {
    // GIVEN: User navigates to app
    await page.goto('/');

    // ============================================================================
    // EPIC 3 + EPIC 7: File validation error handling
    // ============================================================================

    // Story 3.2: Invalid file type
    const fileInput = page.locator('input[type="file"]');

    // Simulate uploading invalid file type
    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Please upload a PDF or DOCX file.',
          },
        }),
      });
    });

    await fileInput.setInputFiles({
      name: 'resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Plain text resume'),
    });

    // Story 7.1: Error displays
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/PDF or DOCX/i);

    // Story 7.2: No retry button for non-retriable error
    await expect(page.locator('[data-testid="retry-button"]')).not.toBeVisible();

    // User can still interact with app - upload valid file
    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            suggestions: { summary: ['Fixed'], skills: ['Fixed'], experience: ['Fixed'] },
            analysis: { score: 75, matchedKeywords: [], missingKeywords: [], gaps: [] },
          },
          error: null,
        }),
      });
    });

    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Valid PDF content'),
    });

    // Error clears, resume parses successfully
    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="error-display"]')).not.toBeVisible();
  });
});
