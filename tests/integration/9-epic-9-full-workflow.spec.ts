/**
 * Epic 9: Resume Library - Full Integration Test
 *
 * Tests the complete resume library workflow:
 * - Save resume to library
 * - Select resume from library
 * - Delete resume from library
 * - Verify state management across operations
 */

import { test, expect } from '@playwright/test';

test.describe('Epic 9: Resume Library Full Workflow @P1', () => {
  test.beforeEach(async ({ page }) => {
    // Start from homepage
    await page.goto('/');
  });

  test('[P1] 9-INT-001: should complete full save → select → delete workflow', async ({
    page,
  }) => {
    // ============================================================
    // PHASE 1: User Authentication
    // ============================================================

    // GIVEN: User creates an account
    const uniqueEmail = `workflow-test-${Date.now()}@example.com`;
    await page.goto('/auth/signup');
    await page.getByTestId('email-input').fill(uniqueEmail);
    await page.getByTestId('password-input').fill('TestPassword123!');
    await page.getByTestId('confirm-password-input').fill('TestPassword123!');
    await page.getByTestId('terms-checkbox').check();
    await page.getByTestId('signup-button').click();

    // Skip onboarding
    await expect(page).toHaveURL('/auth/onboarding');
    await page.getByTestId('skip-button').click();
    await expect(page).toHaveURL('/');

    // ============================================================
    // PHASE 2: Save Multiple Resumes to Library
    // ============================================================

    // Save first resume
    await page.goto('/');
    let fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'software-engineer-resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(
        'John Doe\nSoftware Engineer\nExperience: 5 years\nSkills: JavaScript, React, Node.js'
      ),
    });

    await expect(page.getByText(/upload successful/i)).toBeVisible();

    await page.getByTestId('save-resume-button').click();
    await expect(page.getByTestId('save-resume-dialog')).toBeVisible();
    await page.getByTestId('resume-name-input').fill('Software Engineer Resume');
    await page.getByTestId('save-button').click();
    await expect(page.getByText(/resume saved successfully/i)).toBeVisible();

    // Save second resume
    fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'product-manager-resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(
        'Jane Smith\nProduct Manager\nExperience: 7 years\nSkills: Strategy, Roadmaps, Analytics'
      ),
    });

    await expect(page.getByText(/upload successful/i)).toBeVisible();

    await page.getByTestId('save-resume-button').click();
    await expect(page.getByTestId('save-resume-dialog')).toBeVisible();
    await page.getByTestId('resume-name-input').fill('Product Manager Resume');
    await page.getByTestId('save-button').click();
    await expect(page.getByText(/resume saved successfully/i)).toBeVisible();

    // Save third resume
    fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'data-scientist-resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(
        'Alex Johnson\nData Scientist\nExperience: 4 years\nSkills: Python, ML, Statistics'
      ),
    });

    await expect(page.getByText(/upload successful/i)).toBeVisible();

    await page.getByTestId('save-resume-button').click();
    await expect(page.getByTestId('save-resume-dialog')).toBeVisible();
    await page.getByTestId('resume-name-input').fill('Data Scientist Resume');
    await page.getByTestId('save-button').click();
    await expect(page.getByText(/resume saved successfully/i)).toBeVisible();

    // ============================================================
    // PHASE 3: Verify Resume Library State
    // ============================================================

    // WHEN: User opens the select resume dialog
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();

    // THEN: All 3 resumes should be listed
    await expect(page.getByText(/you have 3 saved resumes/i)).toBeVisible();
    await expect(page.getByText(/software engineer resume/i)).toBeVisible();
    await expect(page.getByText(/product manager resume/i)).toBeVisible();
    await expect(page.getByText(/data scientist resume/i)).toBeVisible();

    // Close dialog
    await page.getByTestId('cancel-button').click();

    // ============================================================
    // PHASE 4: Select Resume from Library
    // ============================================================

    // WHEN: User selects "Product Manager Resume" from library
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();

    // Find and select the Product Manager Resume radio button
    const resumeOptions = page.locator('[data-testid^="resume-option-"]');
    const productManagerOption = resumeOptions.filter({
      hasText: 'Product Manager Resume',
    });
    const productManagerRadio = productManagerOption.locator('input[type="radio"]');
    await productManagerRadio.click();

    // Click Select Resume button
    await page.getByTestId('select-button').click();

    // THEN: Resume should be loaded into session
    await expect(
      page.getByText(/product manager resume.*loaded successfully/i)
    ).toBeVisible();
    await expect(page.getByTestId('select-resume-dialog')).not.toBeVisible();

    // Verify content is loaded (resume text should be available in the app state)
    // In a real scenario, you might check for specific UI elements showing the loaded resume

    // ============================================================
    // PHASE 5: Delete Non-Selected Resume
    // ============================================================

    // WHEN: User deletes "Software Engineer Resume" (not currently selected)
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();

    // Find the Software Engineer Resume and click its delete button
    const softwareEngineerOption = resumeOptions.filter({
      hasText: 'Software Engineer Resume',
    });
    const deleteButton = softwareEngineerOption.locator('[data-testid^="delete-resume-"]');
    await deleteButton.click();

    // Confirm deletion
    await expect(page.getByTestId('confirm-delete-dialog')).toBeVisible();
    await expect(page.getByText(/software engineer resume/i)).toBeVisible();
    await page.getByTestId('confirm-delete-button').click();

    // THEN: Resume should be deleted and list updated
    await expect(page.getByText(/resume deleted/i)).toBeVisible();
    await expect(page.getByText(/you have 2 saved resumes/i)).toBeVisible();
    await expect(page.getByText(/software engineer resume/i)).not.toBeVisible();
    await expect(page.getByText(/product manager resume/i)).toBeVisible();
    await expect(page.getByText(/data scientist resume/i)).toBeVisible();

    // Close dialog
    await page.getByTestId('cancel-button').click();

    // ============================================================
    // PHASE 6: Delete Currently Selected Resume
    // ============================================================

    // WHEN: User deletes "Product Manager Resume" (currently selected)
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();

    // Find and delete Product Manager Resume
    const productManagerOptionAgain = resumeOptions.filter({
      hasText: 'Product Manager Resume',
    });
    const deleteProductManagerButton = productManagerOptionAgain.locator(
      '[data-testid^="delete-resume-"]'
    );
    await deleteProductManagerButton.click();

    // Confirm deletion
    await expect(page.getByTestId('confirm-delete-dialog')).toBeVisible();
    await page.getByTestId('confirm-delete-button').click();

    // THEN: Resume should be deleted and selection cleared
    await expect(page.getByText(/resume deleted/i)).toBeVisible();
    await expect(page.getByText(/you have 1 saved resume/i)).toBeVisible();
    await expect(page.getByText(/product manager resume/i)).not.toBeVisible();
    await expect(page.getByText(/data scientist resume/i)).toBeVisible();

    // Close dialog
    await page.getByTestId('cancel-button').click();

    // Verify resume content is cleared (upload zone should be visible)
    await expect(page.locator('input[type="file"]')).toBeVisible();

    // ============================================================
    // PHASE 7: Delete Last Resume
    // ============================================================

    // WHEN: User deletes the last remaining resume
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();
    await expect(page.getByText(/you have 1 saved resume/i)).toBeVisible();

    // Delete Data Scientist Resume
    const lastDeleteButton = page.locator('[data-testid^="delete-resume-"]').first();
    await lastDeleteButton.click();

    await expect(page.getByTestId('confirm-delete-dialog')).toBeVisible();
    await page.getByTestId('confirm-delete-button').click();

    // THEN: Empty state should be displayed
    await expect(page.getByText(/resume deleted/i)).toBeVisible();
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByText(/no resumes saved yet/i)).toBeVisible();

    // Close dialog
    await page.getByTestId('cancel-button').click();

    // ============================================================
    // PHASE 8: Verify Library is Empty and Can Save Again
    // ============================================================

    // WHEN: User opens select dialog again
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();

    // THEN: Empty state should still be shown
    await expect(page.getByTestId('empty-state')).toBeVisible();

    // Close dialog
    await page.getByTestId('cancel-button').click();

    // WHEN: User uploads and saves a new resume
    fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'new-resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('New Resume After Cleanup'),
    });

    await expect(page.getByText(/upload successful/i)).toBeVisible();

    await page.getByTestId('save-resume-button').click();
    await expect(page.getByTestId('save-resume-dialog')).toBeVisible();
    await page.getByTestId('resume-name-input').fill('Fresh Start Resume');
    await page.getByTestId('save-button').click();
    await expect(page.getByText(/resume saved successfully/i)).toBeVisible();

    // THEN: Library should have 1 resume again
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();
    await expect(page.getByText(/you have 1 saved resume/i)).toBeVisible();
    await expect(page.getByText(/fresh start resume/i)).toBeVisible();
  });

  test('[P1] 9-INT-002: should maintain resume limit of 3 throughout workflow', async ({
    page,
  }) => {
    // GIVEN: User is authenticated
    const uniqueEmail = `limit-test-${Date.now()}@example.com`;
    await page.goto('/auth/signup');
    await page.getByTestId('email-input').fill(uniqueEmail);
    await page.getByTestId('password-input').fill('TestPassword123!');
    await page.getByTestId('confirm-password-input').fill('TestPassword123!');
    await page.getByTestId('terms-checkbox').check();
    await page.getByTestId('signup-button').click();
    await expect(page).toHaveURL('/auth/onboarding');
    await page.getByTestId('skip-button').click();
    await expect(page).toHaveURL('/');

    // Save 3 resumes (reaching the limit)
    for (let i = 1; i <= 3; i++) {
      await page.goto('/');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: `resume-${i}.txt`,
        mimeType: 'text/plain',
        buffer: Buffer.from(`Resume ${i} Content`),
      });

      await expect(page.getByText(/upload successful/i)).toBeVisible();

      await page.getByTestId('save-resume-button').click();
      await page.getByTestId('resume-name-input').fill(`Resume ${i}`);
      await page.getByTestId('save-button').click();
      await expect(page.getByText(/resume saved successfully/i)).toBeVisible();
    }

    // WHEN: User tries to save a 4th resume
    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume-4.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Resume 4 Content'),
    });

    await expect(page.getByText(/upload successful/i)).toBeVisible();

    await page.getByTestId('save-resume-button').click();
    await page.getByTestId('resume-name-input').fill('Resume 4');
    await page.getByTestId('save-button').click();

    // THEN: Should show limit error
    await expect(page.getByText(/limit.*reached|maximum.*3/i)).toBeVisible();

    // Delete one resume
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();
    await expect(page.getByText(/you have 3 saved resumes/i)).toBeVisible();

    const firstDeleteButton = page.locator('[data-testid^="delete-resume-"]').first();
    await firstDeleteButton.click();
    await expect(page.getByTestId('confirm-delete-dialog')).toBeVisible();
    await page.getByTestId('confirm-delete-button').click();
    await expect(page.getByText(/resume deleted/i)).toBeVisible();
    await page.getByTestId('cancel-button').click();

    // WHEN: User tries to save the 4th resume again
    await page.getByTestId('save-resume-button').click();
    await page.getByTestId('resume-name-input').fill('Resume 4 Retry');
    await page.getByTestId('save-button').click();

    // THEN: Should succeed now
    await expect(page.getByText(/resume saved successfully/i)).toBeVisible();

    // Verify library has 3 resumes again
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();
    await expect(page.getByText(/you have 3 saved resumes/i)).toBeVisible();
  });

  test('[P1] 9-INT-003: should handle session persistence across page refreshes', async ({
    page,
  }) => {
    // GIVEN: User saves a resume and selects it
    const uniqueEmail = `session-test-${Date.now()}@example.com`;
    await page.goto('/auth/signup');
    await page.getByTestId('email-input').fill(uniqueEmail);
    await page.getByTestId('password-input').fill('TestPassword123!');
    await page.getByTestId('confirm-password-input').fill('TestPassword123!');
    await page.getByTestId('terms-checkbox').check();
    await page.getByTestId('signup-button').click();
    await expect(page).toHaveURL('/auth/onboarding');
    await page.getByTestId('skip-button').click();

    // Save and select a resume
    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'persistent-resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Persistent Resume Content'),
    });

    await expect(page.getByText(/upload successful/i)).toBeVisible();

    await page.getByTestId('save-resume-button').click();
    await page.getByTestId('resume-name-input').fill('Persistent Resume');
    await page.getByTestId('save-button').click();
    await expect(page.getByText(/resume saved successfully/i)).toBeVisible();

    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();
    const radioButton = page.getByRole('radio').first();
    await radioButton.click();
    await page.getByTestId('select-button').click();
    await expect(page.getByText(/loaded successfully/i)).toBeVisible();

    // WHEN: User refreshes the page
    await page.reload();

    // THEN: User should still be authenticated
    await expect(page.getByTestId('select-resume-button')).toBeVisible();

    // Library should still contain the saved resume
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();
    await expect(page.getByText(/persistent resume/i)).toBeVisible();
  });
});
