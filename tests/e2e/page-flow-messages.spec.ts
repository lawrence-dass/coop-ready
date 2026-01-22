/**
 * E2E Tests for Page Flow and Messaging
 * Story 10.4: Fix Page Flow Issues
 *
 * Tests that "No changes accepted" messages appear only on appropriate pages
 * and that navigation flow is clear throughout the optimization journey.
 */

import { test, expect } from '@playwright/test'
import { TestDataHelper } from './helpers/test-data-helper'

test.describe('Page Flow and Messaging', () => {
  let helper: TestDataHelper

  test.beforeEach(async ({ page }) => {
    helper = new TestDataHelper(page)
  })

  test.afterEach(async () => {
    await helper.cleanup()
  })

  test('AC1: Analysis page does NOT show "No Changes Accepted" warning', async ({ page }) => {
    // Create authenticated user with completed scan
    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
    })

    // Navigate to analysis results page
    await page.goto(`/scan/${scan.id}`)

    // Wait for analysis to complete
    await page.waitForSelector('text=/Analysis Results/i', { timeout: 30000 })

    // Should NOT show "No changes accepted" message
    await expect(page.getByText(/no changes accepted/i)).not.toBeVisible()

    // Should show download button without warning
    await expect(page.getByRole('link', { name: /download resume/i })).toBeVisible()
  })

  test('AC2: Download page shows warning when no suggestions accepted', async ({ page }) => {
    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
    })

    // Create suggestions but don't accept any
    await helper.createSuggestion({
      scanId: scan.id,
      userId: user.id,
      status: 'pending',
    })

    // Navigate to download page
    await page.goto(`/analysis/${scan.id}/download`)

    // Click download button to trigger warning
    await page.getByRole('button', { name: /download/i }).click()

    // Should show "No changes accepted" warning
    await expect(page.getByText(/no changes accepted/i)).toBeVisible()

    // Should offer options: Download Original or Review Suggestions
    await expect(page.getByRole('button', { name: /download original/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /review suggestions/i })).toBeVisible()
  })

  test('AC3: Analysis page has clear navigation with breadcrumbs', async ({ page }) => {
    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
    })

    await page.goto(`/scan/${scan.id}`)
    await page.waitForSelector('text=/Analysis Results/i', { timeout: 30000 })

    // Check breadcrumbs exist
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumbs).toBeVisible()
    await expect(breadcrumbs.getByText(/dashboard/i)).toBeVisible()
    await expect(breadcrumbs.getByText(/scans/i)).toBeVisible()
    await expect(breadcrumbs.getByText(/results/i)).toBeVisible()
  })

  test('AC3: Suggestions page has clear navigation with breadcrumbs', async ({ page }) => {
    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
    })

    await page.goto(`/analysis/${scan.id}/suggestions`)

    // Check breadcrumbs
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumbs).toBeVisible()
    await expect(breadcrumbs.getByText(/dashboard/i)).toBeVisible()
    await expect(breadcrumbs.getByText(/analysis/i)).toBeVisible()
    await expect(breadcrumbs.getByText(/suggestions/i)).toBeVisible()
  })

  test('AC3: Preview page has clear navigation with breadcrumbs', async ({ page }) => {
    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
    })

    await page.goto(`/analysis/${scan.id}/preview`)

    // Check breadcrumbs
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumbs).toBeVisible()
    await expect(breadcrumbs.getByText(/dashboard/i)).toBeVisible()
    await expect(breadcrumbs.getByText(/analysis/i)).toBeVisible()
    await expect(breadcrumbs.getByText(/suggestions/i)).toBeVisible()
    await expect(breadcrumbs.getByText(/preview/i)).toBeVisible()
  })

  test('AC3: Download page has clear navigation with breadcrumbs', async ({ page }) => {
    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
    })

    await page.goto(`/analysis/${scan.id}/download`)

    // Check breadcrumbs
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumbs).toBeVisible()
    await expect(breadcrumbs.getByText(/dashboard/i)).toBeVisible()
    await expect(breadcrumbs.getByText(/analysis/i)).toBeVisible()
    await expect(breadcrumbs.getByText(/suggestions/i)).toBeVisible()
    await expect(breadcrumbs.getByText(/preview/i)).toBeVisible()
    await expect(breadcrumbs.getByText(/download/i)).toBeVisible()
  })

  test('AC4: Consistent messaging - all use "No changes accepted"', async ({ page }) => {
    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
    })

    // Check preview page message
    await page.goto(`/analysis/${scan.id}/preview`)
    await expect(page.getByText(/no changes accepted/i)).toBeVisible()
    // Should NOT use "No Changes Applied" anymore
    await expect(page.getByText(/no changes applied/i)).not.toBeVisible()

    // Check download page message
    await page.goto(`/analysis/${scan.id}/download`)
    await page.getByRole('button', { name: /download/i }).click()
    await expect(page.getByText(/no changes accepted/i)).toBeVisible()
  })

  test('AC5: Download page redirects for invalid scan', async ({ page }) => {
    const { user } = await helper.createAuthenticatedUser()

    // Navigate with fake scan ID
    await page.goto('/analysis/00000000-0000-0000-0000-000000000000/download')

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/)
  })

  test('Full flow: Messages appear at correct stages', async ({ page }) => {
    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
    })

    // Step 1: Analysis page - NO warning
    await page.goto(`/scan/${scan.id}`)
    await page.waitForSelector('text=/Analysis Results/i', { timeout: 30000 })
    await expect(page.getByText(/no changes accepted/i)).not.toBeVisible()

    // Step 2: Suggestions page - NO warning on page load
    await page.getByRole('link', { name: /view suggestions/i }).click()
    await expect(page.getByText(/no changes accepted/i)).not.toBeVisible()

    // Step 3: Preview page - Shows warning for 0 accepted
    await page.goto(`/analysis/${scan.id}/preview`)
    await expect(page.getByText(/no changes accepted/i)).toBeVisible()

    // Step 4: Download page - Shows warning when clicking download
    await page.goto(`/analysis/${scan.id}/download`)
    await page.getByRole('button', { name: /download/i }).click()
    await expect(page.getByText(/no changes accepted/i)).toBeVisible()
  })

  test('Download warning offers helpful options', async ({ page }) => {
    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
    })

    await page.goto(`/analysis/${scan.id}/download`)
    await page.getByRole('button', { name: /download/i }).click()

    // Warning should be helpful, not accusatory
    await expect(page.getByText(/haven't accepted any suggestions/i)).toBeVisible()

    // Test "Review Suggestions" option
    const reviewButton = page.getByRole('button', { name: /review suggestions/i })
    await expect(reviewButton).toBeVisible()
    await reviewButton.click()

    // Should navigate to suggestions page
    await expect(page).toHaveURL(/\/analysis\/.*\/suggestions/)
  })

  test('Download Original option works after warning', async ({ page }) => {
    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
    })

    await page.goto(`/analysis/${scan.id}/download`)
    await page.getByRole('button', { name: /download/i }).click()

    // Click "Download Original"
    const downloadOriginalButton = page.getByRole('button', { name: /download original/i })
    await expect(downloadOriginalButton).toBeVisible()
    await downloadOriginalButton.click()

    // Should show format selection modal
    await expect(page.getByText(/pdf/i)).toBeVisible()
    await expect(page.getByText(/docx/i)).toBeVisible()
  })
})
