/**
 * E2E Tests for Download Page
 * Story 10.2: Fix Download Resume Error
 *
 * Tests that the download page route exists and functions correctly.
 */

import { test, expect } from '@playwright/test'
import { TestDataHelper } from './helpers/test-data-helper'

test.describe('Download Page Route', () => {
  let helper: TestDataHelper

  test.beforeEach(async ({ page }) => {
    helper = new TestDataHelper(page)
  })

  test.afterEach(async () => {
    await helper.cleanup()
  })

  test('AC1: Download page exists and loads', async ({ page }) => {
    // Create authenticated user with completed scan
    const { user, profile } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
    })

    // Navigate to download page
    await page.goto(`/analysis/${scan.id}/download`)

    // Page should load without 404
    await expect(page).not.toHaveURL(/404/)

    // Should show download header
    await expect(page.getByRole('heading', { name: /download/i })).toBeVisible()

    // Should show download button
    await expect(page.getByRole('button', { name: /download/i })).toBeVisible()
  })

  test('AC1: Download page has breadcrumb navigation', async ({ page }) => {
    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
    })

    await page.goto(`/analysis/${scan.id}/download`)

    // Check breadcrumb links exist
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /analysis/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /suggestions/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /preview/i })).toBeVisible()
  })

  test('AC4: Shows no suggestions warning when none accepted', async ({ page }) => {
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

    await page.goto(`/analysis/${scan.id}/download`)

    // Click download button
    await page.getByRole('button', { name: /download/i }).click()

    // Should show warning about no accepted suggestions
    await expect(page.getByText(/no changes accepted/i)).toBeVisible()

    // Should offer options
    await expect(page.getByRole('button', { name: /download original/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /review suggestions/i })).toBeVisible()
  })

  test('AC2: Format selection modal appears for PDF download', async ({ page }) => {
    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
    })

    // Create accepted suggestion
    await helper.createSuggestion({
      scanId: scan.id,
      userId: user.id,
      status: 'accepted',
    })

    await page.goto(`/analysis/${scan.id}/download`)

    // Click download button
    await page.getByRole('button', { name: /download/i }).click()

    // Format selection modal should appear
    await expect(page.getByText(/pdf/i)).toBeVisible()
    await expect(page.getByText(/docx/i)).toBeVisible()
  })

  test('redirects to dashboard for invalid scan', async ({ page }) => {
    const { user } = await helper.createAuthenticatedUser()

    // Navigate to download page with fake scan ID
    await page.goto('/analysis/00000000-0000-0000-0000-000000000000/download')

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/)
  })

  test('redirects to login for unauthenticated user', async ({ page }) => {
    // Navigate to download page without authentication
    await page.goto('/analysis/00000000-0000-0000-0000-000000000000/download')

    // Should redirect to login
    await expect(page).toHaveURL(/login|auth/)
  })
})
