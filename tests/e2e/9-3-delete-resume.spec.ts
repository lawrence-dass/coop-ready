/**
 * Story 9-3: Resume Deletion E2E Tests
 *
 * Tests the complete delete resume flow including:
 * - Delete button visibility and interaction
 * - Confirmation dialog flow
 * - Successful deletion with UI updates
 * - Selected resume deletion clears selection
 * - Last resume deletion shows empty state
 * - Network error handling
 */

import { test, expect } from '@playwright/test';

test.describe('Story 9-3: Resume Deletion @P2', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app homepage
    await page.goto('/');
  });

  test('[P2] 9.3-E2E-001: should show delete button on resume hover in library dialog', async ({
    page,
  }) => {
    // GIVEN: User is authenticated and has saved resumes
    // Sign up with unique email
    const uniqueEmail = `test-delete-${Date.now()}@example.com`;
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

    // Upload a resume and save it
    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('John Doe\nSoftware Engineer\nExperience: 5 years'),
    });

    // Wait for upload to complete
    await expect(page.getByText(/upload successful/i)).toBeVisible();

    // Save the resume
    await page.getByTestId('save-resume-button').click();
    await page.getByTestId('resume-name-input').fill('Test Resume 1');
    await page.getByTestId('save-button').click();
    await expect(page.getByText(/resume saved successfully/i)).toBeVisible();

    // WHEN: User opens the select resume dialog
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();

    // THEN: Delete button should be visible for the resume
    await expect(page.getByTestId('delete-resume-resume-1')).toBeVisible();
  });

  test('[P2] 9.3-E2E-002: should open confirmation dialog when delete button clicked', async ({
    page,
  }) => {
    // GIVEN: User is authenticated with saved resume
    // (Setup similar to previous test - creating user and saving resume)
    const uniqueEmail = `test-confirm-${Date.now()}@example.com`;
    await page.goto('/auth/signup');
    await page.getByTestId('email-input').fill(uniqueEmail);
    await page.getByTestId('password-input').fill('TestPassword123!');
    await page.getByTestId('confirm-password-input').fill('TestPassword123!');
    await page.getByTestId('terms-checkbox').check();
    await page.getByTestId('signup-button').click();
    await expect(page).toHaveURL('/auth/onboarding');
    await page.getByTestId('skip-button').click();

    // Upload and save resume
    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('John Doe\nSoftware Engineer'),
    });
    await expect(page.getByText(/upload successful/i)).toBeVisible();

    await page.getByTestId('save-resume-button').click();
    await page.getByTestId('resume-name-input').fill('Resume to Delete');
    await page.getByTestId('save-button').click();
    await expect(page.getByText(/resume saved successfully/i)).toBeVisible();

    // Open select dialog
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();

    // WHEN: User clicks the delete button
    const deleteButton = page.locator('[data-testid^="delete-resume-"]').first();
    await deleteButton.click();

    // THEN: Confirmation dialog should open
    await expect(page.getByTestId('confirm-delete-dialog')).toBeVisible();
    await expect(page.getByText(/delete resume\?/i)).toBeVisible();
    await expect(
      page.getByText(/are you sure you want to permanently delete/i)
    ).toBeVisible();
    await expect(page.getByText(/resume to delete/i)).toBeVisible();
  });

  test('[P2] 9.3-E2E-003: should delete resume and update UI on confirmation', async ({
    page,
  }) => {
    // GIVEN: User has 2 saved resumes
    const uniqueEmail = `test-multi-${Date.now()}@example.com`;
    await page.goto('/auth/signup');
    await page.getByTestId('email-input').fill(uniqueEmail);
    await page.getByTestId('password-input').fill('TestPassword123!');
    await page.getByTestId('confirm-password-input').fill('TestPassword123!');
    await page.getByTestId('terms-checkbox').check();
    await page.getByTestId('signup-button').click();
    await expect(page).toHaveURL('/auth/onboarding');
    await page.getByTestId('skip-button').click();

    // Save first resume
    await page.goto('/');
    let fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume1.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Resume 1 Content'),
    });
    await expect(page.getByText(/upload successful/i)).toBeVisible();
    await page.getByTestId('save-resume-button').click();
    await page.getByTestId('resume-name-input').fill('First Resume');
    await page.getByTestId('save-button').click();
    await expect(page.getByText(/resume saved successfully/i)).toBeVisible();

    // Save second resume
    fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume2.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Resume 2 Content'),
    });
    await expect(page.getByText(/upload successful/i)).toBeVisible();
    await page.getByTestId('save-resume-button').click();
    await page.getByTestId('resume-name-input').fill('Second Resume');
    await page.getByTestId('save-button').click();
    await expect(page.getByText(/resume saved successfully/i)).toBeVisible();

    // Open select dialog
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();

    // Verify both resumes are listed
    await expect(page.getByText(/you have 2 saved resumes/i)).toBeVisible();
    await expect(page.getByText(/first resume/i)).toBeVisible();
    await expect(page.getByText(/second resume/i)).toBeVisible();

    // WHEN: User deletes first resume
    const firstDeleteButton = page.locator('[data-testid^="delete-resume-"]').first();
    await firstDeleteButton.click();
    await expect(page.getByTestId('confirm-delete-dialog')).toBeVisible();
    await page.getByTestId('confirm-delete-button').click();

    // THEN: Resume should be deleted and UI updated
    await expect(page.getByText(/resume deleted/i)).toBeVisible();
    await expect(page.getByTestId('confirm-delete-dialog')).not.toBeVisible();

    // Should show only 1 resume now
    await expect(page.getByText(/you have 1 saved resume/i)).toBeVisible();
    await expect(page.getByText(/second resume/i)).toBeVisible();
    // First resume should be gone
    await expect(page.getByText(/first resume/i)).not.toBeVisible();
  });

  test('[P2] 9.3-E2E-004: should clear selection if currently selected resume is deleted', async ({
    page,
  }) => {
    // GIVEN: User has selected a resume from library
    const uniqueEmail = `test-selected-${Date.now()}@example.com`;
    await page.goto('/auth/signup');
    await page.getByTestId('email-input').fill(uniqueEmail);
    await page.getByTestId('password-input').fill('TestPassword123!');
    await page.getByTestId('confirm-password-input').fill('TestPassword123!');
    await page.getByTestId('terms-checkbox').check();
    await page.getByTestId('signup-button').click();
    await expect(page).toHaveURL('/auth/onboarding');
    await page.getByTestId('skip-button').click();

    // Save resume
    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'selected-resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Selected Resume Content'),
    });
    await expect(page.getByText(/upload successful/i)).toBeVisible();
    await page.getByTestId('save-resume-button').click();
    await page.getByTestId('resume-name-input').fill('Selected Resume');
    await page.getByTestId('save-button').click();
    await expect(page.getByText(/resume saved successfully/i)).toBeVisible();

    // Select the resume from library
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();
    const radioButton = page.getByRole('radio').first();
    await radioButton.click();
    await page.getByTestId('select-button').click();
    await expect(page.getByText(/loaded successfully/i)).toBeVisible();

    // Re-open the dialog and delete the selected resume
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();

    // WHEN: User deletes the currently selected resume
    const deleteButton = page.locator('[data-testid^="delete-resume-"]').first();
    await deleteButton.click();
    await expect(page.getByTestId('confirm-delete-dialog')).toBeVisible();
    await page.getByTestId('confirm-delete-button').click();

    // THEN: Selection should be cleared
    await expect(page.getByText(/resume deleted/i)).toBeVisible();

    // Close the dialog and verify resume state is cleared
    await page.getByTestId('cancel-button').click();

    // Upload zone should be visible again (resume content cleared)
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test('[P2] 9.3-E2E-005: should show empty state after deleting last resume', async ({
    page,
  }) => {
    // GIVEN: User has exactly 1 saved resume
    const uniqueEmail = `test-last-${Date.now()}@example.com`;
    await page.goto('/auth/signup');
    await page.getByTestId('email-input').fill(uniqueEmail);
    await page.getByTestId('password-input').fill('TestPassword123!');
    await page.getByTestId('confirm-password-input').fill('TestPassword123!');
    await page.getByTestId('terms-checkbox').check();
    await page.getByTestId('signup-button').click();
    await expect(page).toHaveURL('/auth/onboarding');
    await page.getByTestId('skip-button').click();

    // Save one resume
    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'last-resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Last Resume Content'),
    });
    await expect(page.getByText(/upload successful/i)).toBeVisible();
    await page.getByTestId('save-resume-button').click();
    await page.getByTestId('resume-name-input').fill('Last Resume');
    await page.getByTestId('save-button').click();
    await expect(page.getByText(/resume saved successfully/i)).toBeVisible();

    // Open select dialog
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();
    await expect(page.getByText(/you have 1 saved resume/i)).toBeVisible();

    // WHEN: User deletes the last resume
    const deleteButton = page.locator('[data-testid^="delete-resume-"]').first();
    await deleteButton.click();
    await expect(page.getByTestId('confirm-delete-dialog')).toBeVisible();
    await page.getByTestId('confirm-delete-button').click();

    // THEN: Empty state should be displayed
    await expect(page.getByText(/resume deleted/i)).toBeVisible();
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(
      page.getByText(/no resumes saved yet/i)
    ).toBeVisible();
  });

  test('[P2] 9.3-E2E-006: should handle network errors during deletion gracefully', async ({
    page,
    context,
  }) => {
    // GIVEN: User has saved resume but network will fail
    const uniqueEmail = `test-error-${Date.now()}@example.com`;
    await page.goto('/auth/signup');
    await page.getByTestId('email-input').fill(uniqueEmail);
    await page.getByTestId('password-input').fill('TestPassword123!');
    await page.getByTestId('confirm-password-input').fill('TestPassword123!');
    await page.getByTestId('terms-checkbox').check();
    await page.getByTestId('signup-button').click();
    await expect(page).toHaveURL('/auth/onboarding');
    await page.getByTestId('skip-button').click();

    // Save resume
    await page.goto('/');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'error-resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Error Test Resume Content'),
    });
    await expect(page.getByText(/upload successful/i)).toBeVisible();
    await page.getByTestId('save-resume-button').click();
    await page.getByTestId('resume-name-input').fill('Error Resume');
    await page.getByTestId('save-button').click();
    await expect(page.getByText(/resume saved successfully/i)).toBeVisible();

    // Intercept the delete API call and simulate an error
    await page.route('**/api/**', (route) => {
      if (route.request().method() === 'DELETE') {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    // Open select dialog and try to delete
    await page.getByTestId('select-resume-button').click();
    await expect(page.getByTestId('select-resume-dialog')).toBeVisible();

    // WHEN: User attempts to delete resume (will fail due to network error)
    const deleteButton = page.locator('[data-testid^="delete-resume-"]').first();
    await deleteButton.click();
    await expect(page.getByTestId('confirm-delete-dialog')).toBeVisible();
    await page.getByTestId('confirm-delete-button').click();

    // THEN: Error should be displayed and resume remains in list
    // Note: The actual error message may vary based on implementation
    await expect(
      page.getByText(/error|failed|unable/i)
    ).toBeVisible({ timeout: 5000 });

    // Resume should still be in the list
    await expect(page.getByText(/error resume/i)).toBeVisible();
  });
});
