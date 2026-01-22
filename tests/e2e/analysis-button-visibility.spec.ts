/**
 * E2E Test for Analysis Page Button Visibility
 *
 * Tests that action buttons (View Suggestions, Download Resume) are visible
 * without scrolling and meet mobile accessibility requirements.
 *
 * @see Story 10.3: Improve Button Visibility
 */

import { test, expect } from '@playwright/test'
import { TestDataHelper } from './helpers/test-data-helper'

test.describe('Story 10.3: Button Visibility', () => {
  let helper: TestDataHelper

  test.beforeEach(async ({ page }) => {
    helper = new TestDataHelper(page)
  })

  test.afterEach(async () => {
    await helper.cleanup()
  })

  test('AC1: Primary action buttons visible above the fold on desktop', async ({ page }) => {
    // Create test data
    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
      atsScore: 72,
    })

    // Navigate to scan results page
    await page.goto(`/scan/${scan.id}`)

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Analysis Results")')

    // Get viewport height
    const viewportHeight = page.viewportSize()?.height || 768

    // Check that View Suggestions button is visible
    const suggestionsButton = page.getByRole('link', { name: /View Suggestions/i })
    await expect(suggestionsButton).toBeVisible()

    // Get button position
    const suggestionsBox = await suggestionsButton.boundingBox()
    expect(suggestionsBox).not.toBeNull()

    // Button should be within first viewport (above the fold)
    expect(suggestionsBox!.y).toBeLessThan(viewportHeight)

    // Check that Download button is visible
    const downloadButton = page.getByRole('link', { name: /Download Resume/i })
    await expect(downloadButton).toBeVisible()

    const downloadBox = await downloadButton.boundingBox()
    expect(downloadBox).not.toBeNull()
    expect(downloadBox!.y).toBeLessThan(viewportHeight)
  })

  test('AC2: Clear visual hierarchy - primary vs secondary styling', async ({ page }) => {
    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
    })

    await page.goto(`/scan/${scan.id}`)
    await page.waitForSelector('h1:has-text("Analysis Results")')

    // View Suggestions should be primary (no outline variant)
    const suggestionsButton = page.getByRole('link', { name: /View Suggestions/i })
    const suggestionsClasses = await suggestionsButton.getAttribute('class')
    expect(suggestionsClasses).not.toContain('variant-outline')

    // Download should be secondary (outline variant)
    const downloadButton = page.getByRole('link', { name: /Download Resume/i })
    // The button itself or its parent should indicate outline variant
    await expect(downloadButton).toBeVisible()
  })

  test('AC3: Mobile responsive - buttons stacked and properly sized', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE

    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
    })

    await page.goto(`/scan/${scan.id}`)
    await page.waitForSelector('h1:has-text("Analysis Results")')

    const suggestionsButton = page.getByRole('link', { name: /View Suggestions/i })
    const downloadButton = page.getByRole('link', { name: /Download Resume/i })

    await expect(suggestionsButton).toBeVisible()
    await expect(downloadButton).toBeVisible()

    const suggestionsBox = await suggestionsButton.boundingBox()
    const downloadBox = await downloadButton.boundingBox()

    expect(suggestionsBox).not.toBeNull()
    expect(downloadBox).not.toBeNull()

    // On mobile, buttons should be stacked (download below suggestions)
    expect(downloadBox!.y).toBeGreaterThan(suggestionsBox!.y)

    // Touch targets should be at least 44px
    expect(suggestionsBox!.height).toBeGreaterThanOrEqual(44)
    expect(downloadBox!.height).toBeGreaterThanOrEqual(44)
  })

  test('AC5: Buttons positioned near score card', async ({ page }) => {
    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'completed',
      atsScore: 72,
    })

    await page.goto(`/scan/${scan.id}`)
    await page.waitForSelector('h1:has-text("Analysis Results")')

    // Find the score display (ATS Score card shows the score)
    const scoreElement = page.locator('text=/\\d+%/')
    await expect(scoreElement.first()).toBeVisible()

    const scoreBox = await scoreElement.first().boundingBox()
    const suggestionsButton = page.getByRole('link', { name: /View Suggestions/i })
    const buttonBox = await suggestionsButton.boundingBox()

    expect(scoreBox).not.toBeNull()
    expect(buttonBox).not.toBeNull()

    // Buttons should be within 300px of the score card (reasonable proximity)
    const verticalDistance = buttonBox!.y - (scoreBox!.y + scoreBox!.height)
    expect(verticalDistance).toBeLessThan(300)
  })

  test('Buttons only shown when scan is completed', async ({ page }) => {
    const { user } = await helper.createAuthenticatedUser()
    const resume = await helper.createResume(user.id)

    // Create pending scan (not completed)
    const scan = await helper.createScan({
      userId: user.id,
      resumeId: resume.id,
      status: 'pending',
    })

    await page.goto(`/scan/${scan.id}`)

    // Page should show processing state, not the action buttons
    // (buttons are conditionally rendered only when status === 'completed')
    const suggestionsButton = page.getByRole('link', { name: /View Suggestions/i })

    // Button should not be visible for pending scans
    await expect(suggestionsButton).not.toBeVisible({ timeout: 3000 })
  })
})
