/**
 * Test ID: 7.5-INTEGRATION-004
 * Priority: P0 (BLOCKER)
 * Story: 7.5 - Epic 7 Integration and Verification Testing
 *
 * Purpose: Cross-epic integration tests - verify Epic 7 integrates with Epics 1-6
 * Coverage: AC-10 - V0.1 feature completeness (integration level)
 *
 * Gap: CRITICAL - No cross-epic integration tests
 * Impact: Cannot verify Epic 7 didn't break Epics 1-6
 * Risk Score: 9 (Probability=3: No coverage × Impact=3: Release blocking)
 */

import { test, expect } from '@playwright/test';

test.describe('[P0] Cross-Epic Integration Tests', () => {
  test('[P0] Epic 3 (Resume Upload) + Epic 7 (Error Handling) integration', async ({ page }) => {
    // GIVEN: User attempts to upload invalid file
    await page.goto('/');

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

    // WHEN: User uploads invalid file type
    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Plain text resume'),
    });

    // THEN: Epic 7 error handling integrates with Epic 3 validation
    // Error displayed (Epic 7)
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/PDF or DOCX/i);

    // No retry button for non-retriable error (Epic 7)
    await expect(page.locator('[data-testid="retry-button"]')).not.toBeVisible();

    // User can upload valid file (Epic 3)
    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            suggestions: {
              summary: ['Valid suggestion'],
              skills: ['Valid skills'],
              experience: ['Valid experience'],
            },
            analysis: { score: 85, matchedKeywords: [], missingKeywords: [], gaps: [] },
          },
          error: null,
        }),
      });
    });

    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Valid PDF content'),
    });

    // Error clears, resume parses (Epic 3 + Epic 7)
    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="error-display"]')).not.toBeVisible();
  });

  test('[P0] Epic 2 (Session Persistence) + Epic 7 (Error State) integration', async ({ page }) => {
    // GIVEN: User encounters error
    await page.goto('/');

    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: {
            code: 'LLM_TIMEOUT',
            message: 'Timeout error',
          },
        }),
      });
    });

    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer');
    await page.locator('[data-testid="optimize-button"]').click();

    // Error displayed
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();

    // WHEN: User refreshes page
    await page.reload();

    // THEN: Epic 2 session persistence + Epic 7 error state integrate
    // Resume persists (Epic 2)
    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible();

    // JD persists (Epic 2)
    await expect(page.locator('[data-testid="job-description-input"]')).toHaveValue('Software Engineer');

    // Error state persists (Epic 7)
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();

    // Retry button available (Epic 7)
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('[P0] Epic 6 (Optimization) + Epic 7 (Retry + Feedback) integration', async ({ page }) => {
    // GIVEN: User triggers optimization that initially fails
    await page.goto('/');

    let attemptCount = 0;

    await page.route('**/api/optimize', async (route) => {
      attemptCount++;

      if (attemptCount === 1) {
        // First attempt: Error (Epic 7)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: {
              code: 'LLM_ERROR',
              message: 'AI service error',
            },
          }),
        });
      } else {
        // Retry: Success (Epic 6)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              suggestions: {
                summary: ['Optimized summary suggestion'],
                skills: ['Optimized skills suggestion'],
                experience: ['Optimized experience suggestion'],
              },
              analysis: {
                score: 88,
                matchedKeywords: ['software', 'engineer'],
                missingKeywords: ['kubernetes'],
                gaps: ['Add cloud experience'],
              },
            },
            error: null,
          }),
        });
      }
    });

    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer role');
    await page.locator('[data-testid="optimize-button"]').click();

    // Error (Epic 7)
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();

    // WHEN: User retries
    await page.locator('[data-testid="retry-button"]').click();

    // THEN: Epic 6 optimization + Epic 7 feedback integrate
    // Suggestions displayed (Epic 6)
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // All suggestion sections present (Epic 6)
    await expect(page.locator('[data-testid="suggestions-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="suggestions-skills"]')).toBeVisible();
    await expect(page.locator('[data-testid="suggestions-experience"]')).toBeVisible();

    // Score displayed (Epic 5 + Epic 6)
    await expect(page.locator('[data-testid="score-display"]')).toContainText('88');

    // Gap analysis displayed (Epic 5 + Epic 6)
    await expect(page.locator('[data-testid="gap-analysis"]')).toContainText(/cloud experience/i);

    // Feedback buttons available (Epic 7)
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-down-summary-0"]')).toBeVisible();

    // User provides feedback (Epic 7)
    await page.locator('[data-testid="feedback-up-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);
  });

  test('[P0] Epic 5 (Analysis) + Epic 6 (Optimization) + Epic 7 (Error Recovery) integration', async ({ page }) => {
    // GIVEN: Full workflow with error and recovery
    await page.goto('/');

    let attemptCount = 0;

    await page.route('**/api/optimize', async (route) => {
      attemptCount++;

      if (attemptCount === 1) {
        // Timeout error
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: {
              code: 'LLM_TIMEOUT',
              message: 'Timeout after 60 seconds',
            },
          }),
        });
      } else {
        // Success with full analysis and optimization
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              suggestions: {
                summary: [
                  'Senior Software Engineer with 5+ years building distributed systems',
                  'Technical lead with expertise in microservices and cloud architecture',
                ],
                skills: [
                  'Added: Kubernetes, Docker, AWS, Terraform',
                  'Enhanced: System design, API development, DevOps',
                ],
                experience: [
                  'Led team of 5 engineers in microservices migration',
                  'Architected scalable API serving 10M+ requests/day',
                ],
              },
              analysis: {
                score: 92,
                matchedKeywords: [
                  'software',
                  'engineer',
                  'distributed',
                  'systems',
                  'microservices',
                  'API',
                ],
                missingKeywords: ['kubernetes', 'docker', 'cloud'],
                gaps: [
                  'Highlight container orchestration experience',
                  'Add cloud infrastructure projects',
                  'Emphasize DevOps practices',
                ],
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
      buffer: Buffer.from('Senior Software Engineer resume'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });

    const jd = `Senior Software Engineer
We need an engineer with:
- Distributed systems experience
- Microservices architecture
- Container orchestration (Kubernetes, Docker)
- Cloud infrastructure (AWS, Azure, GCP)`;

    await page.locator('[data-testid="job-description-input"]').fill(jd);

    // First attempt: Timeout
    await page.locator('[data-testid="optimize-button"]').click();
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();

    // WHEN: User retries
    await page.locator('[data-testid="retry-button"]').click();

    // THEN: All epics integrate successfully
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // Epic 5: Analysis displays correctly
    await expect(page.locator('[data-testid="score-display"]')).toContainText('92');
    await expect(page.locator('[data-testid="gap-analysis"]')).toContainText(/container orchestration/i);

    // Epic 6: Multiple suggestions per section
    const summarySection = page.locator('[data-testid="suggestions-summary"]');
    await expect(summarySection).toContainText(/distributed systems/i);
    await expect(summarySection).toContainText(/microservices/i);

    const skillsSection = page.locator('[data-testid="suggestions-skills"]');
    await expect(skillsSection).toContainText(/Kubernetes/i);
    await expect(skillsSection).toContainText(/Docker/i);

    // Epic 6: Copy functionality works
    await page.locator('[data-testid="copy-summary-0"]').click();
    await expect(
      page.locator('[data-testid="copy-success"]').or(page.locator(':has-text("Copied")')),
    ).toBeVisible({ timeout: 2000 });

    // Epic 7: Feedback works after error recovery
    await page.locator('[data-testid="feedback-up-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);

    // Epic 7: Error cleared
    await expect(page.locator('[data-testid="error-display"]')).not.toBeVisible();
  });

  test('[P0] All Epics 1-7 integration: Full V0.1 workflow with error handling', async ({ page }) => {
    // GIVEN: Fresh app load (Epic 2: Anonymous session)
    await page.goto('/');

    let optimizationAttempt = 0;

    await page.route('**/api/optimize', async (route) => {
      optimizationAttempt++;

      if (optimizationAttempt === 1) {
        // First optimization: Timeout error
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: {
              code: 'LLM_TIMEOUT',
              message: 'Optimization took too long',
            },
          }),
        });
      } else {
        // Retry: Success
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              suggestions: {
                summary: ['Full integration test summary'],
                skills: ['Full integration test skills'],
                experience: ['Full integration test experience'],
              },
              analysis: {
                score: 87,
                matchedKeywords: ['test'],
                missingKeywords: [],
                gaps: ['Integration test gap'],
              },
            },
            error: null,
          }),
        });
      }
    });

    // Epic 3: Upload resume
    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Full workflow resume'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });

    // Epic 4: Input job description
    await page.locator('[data-testid="job-description-input"]').fill('Full workflow job description');

    // Epic 5 + 6: Trigger optimization (hits timeout - Epic 7)
    await page.locator('[data-testid="optimize-button"]').click();

    // Epic 7: Error handling
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

    // Epic 7: Retry
    await page.locator('[data-testid="retry-button"]').click();

    // Epic 6: Suggestions displayed
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // Epic 5: Score and analysis
    await expect(page.locator('[data-testid="score-display"]')).toContainText('87');

    // Epic 7: Feedback
    await page.locator('[data-testid="feedback-up-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);

    // Epic 2: Session persistence
    await page.waitForTimeout(1000);
    await page.reload();

    // THEN: All state persists
    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible();
    await expect(page.locator('[data-testid="job-description-input"]')).toHaveValue('Full workflow job description');
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="score-display"]')).toContainText('87');
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="error-display"]')).not.toBeVisible();
  });
});
