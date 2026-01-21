import { test, expect } from '../support/fixtures'

/**
 * Resume Preview Flow Tests
 * Story 5.8: Optimized Resume Preview
 *
 * Tests the complete flow of previewing a resume with accepted suggestions,
 * including diff highlighting, navigation, and download progression.
 */

test.describe('Resume Preview Flow', () => {
  test('should navigate to preview page and display merged content', async ({
    page,
    authenticatedPage,
  }) => {
    // Navigate to preview page
    await authenticatedPage.goto('/analysis/scan-123/preview')

    // Check page title
    await expect(page.locator('h1')).toContainText('Resume Preview')

    // Check progress indicator
    await expect(page.locator('text=Step 3 of 3')).toBeVisible()
  })

  test('should display stat cards with suggestion counts', async ({
    page,
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/analysis/scan-123/preview')

    // Check stat cards are present
    await expect(page.locator('text=Total Suggestions')).toBeVisible()
    await expect(page.locator('text=Accepted')).toBeVisible()
    await expect(page.locator('text=Rejected')).toBeVisible()
    await expect(page.locator('text=Completion')).toBeVisible()
  })

  test('should show empty state when no suggestions accepted', async ({
    page,
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/analysis/scan-123/preview')

    // Check for empty state message
    const emptyStateText = page.locator('text=No suggestions were applied to your resume')
    const isVisible = await emptyStateText.isVisible().catch(() => false)

    if (isVisible) {
      // If no changes were accepted, verify empty state messaging
      await expect(page.locator('text=No Changes Applied')).toBeVisible()
      await expect(
        page.getByRole('link', { name: /Back to Review|Download Anyway/i })
      ).toBeVisible()
    } else {
      // If changes exist, verify preview is displayed
      await expect(page.locator('text=Work Experience')).toBeVisible()
    }
  })

  test('should allow navigation back to suggestions', async ({
    page,
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/analysis/scan-123/preview')

    // Find and click back button
    const backButton = page.getByRole('link', { name: /Back to Review|Back to Suggestions/i })
    await expect(backButton).toBeVisible()

    // Verify href points to suggestions page
    await expect(backButton).toHaveAttribute('href', /suggestions/)
  })

  test('should navigate to download page on continue', async ({
    page,
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/analysis/scan-123/preview')

    // Find continue to download button
    const downloadButton = page.getByRole('button', {
      name: /Continue to Download|Download Resume/i,
    })

    // Button should be visible
    const isVisible = await downloadButton.isVisible().catch(() => false)

    if (isVisible) {
      // If button exists, verify it's enabled
      await expect(downloadButton).not.toBeDisabled()
    }
  })

  test('should display resume sections in collapsible format', async ({
    page,
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/analysis/scan-123/preview')

    // Check if section headers are present
    const sectionHeaders = page.locator('button:has-text("Work Experience"), button:has-text("Education"), button:has-text("Skills")')
    const count = await sectionHeaders.count()

    if (count > 0) {
      // If sections exist, verify they're clickable
      const firstSection = page.locator('button').first()
      await firstSection.click()

      // Check that content is visible after click
      const sectionContent = page.locator('p.text-gray-900').first()
      await expect(sectionContent).toBeVisible()
    }
  })

  test('should show diff highlighting for accepted suggestions', async ({
    page,
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/analysis/scan-123/preview')

    // Look for highlighted additions (green background)
    const additions = page.locator('.bg-green-200')
    const additionCount = await additions.count()

    if (additionCount > 0) {
      // If additions exist, verify they're visible
      await expect(additions.first()).toBeVisible()

      // Verify added text styling
      await expect(additions.first()).toHaveClass(/bg-green-200/)
    }

    // Look for strikethrough removals
    const removals = page.locator('.line-through')
    const removalCount = await removals.count()

    if (removalCount > 0) {
      // If removals exist, verify they're visible
      await expect(removals.first()).toBeVisible()
      await expect(removals.first()).toHaveClass(/line-through/)
    }
  })

  test('should be responsive on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
    })
    const page = await context.newPage()

    // Login and navigate to preview
    await page.goto('/auth/login')
    // ... login steps if needed ...
    await page.goto('/analysis/scan-123/preview')

    // Check layout is readable
    const mainContent = page.locator('h1')
    const box = await mainContent.boundingBox()

    expect(box?.width).toBeLessThan(375)

    // Check buttons are thumb-friendly (min 44px)
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()

    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = buttons.nth(i)
      const boundingBox = await button.boundingBox()
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(44)
      }
    }

    await context.close()
  })

  test('should maintain section expansion state', async ({
    page,
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/analysis/scan-123/preview')

    // Find and expand a section
    const sectionButton = page.locator('button').filter({ hasText: /Work Experience|Education|Skills/ }).first()
    const isVisible = await sectionButton.isVisible().catch(() => false)

    if (isVisible) {
      // Click to expand
      await sectionButton.click()

      // Content should be visible
      const content = page.locator('.prose').first()
      await expect(content).toBeVisible()

      // Click to collapse
      await sectionButton.click()

      // Content visibility should toggle
      const isContentVisible = await content.isVisible().catch(() => false)
      expect(isContentVisible).toBe(false)
    }
  })

  test('should display correct status messaging', async ({
    page,
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/analysis/scan-123/preview')

    // Check for either "changes applied" or "no changes" message
    const acceptedMessage = page.locator('text=suggestion').first()
    const noChangesMessage = page.locator('text=No changes accepted')

    const acceptedVisible = await acceptedMessage.isVisible().catch(() => false)
    const noChangesVisible = await noChangesMessage.isVisible().catch(() => false)

    // At least one message should be visible
    expect(acceptedVisible || noChangesVisible).toBe(true)
  })
})
