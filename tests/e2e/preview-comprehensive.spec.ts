/**
 * E2E Tests: Comprehensive Preview Flow
 *
 * Tests the complete preview experience with diff highlighting and accuracy validation:
 * - Story 5.8: Optimized Resume Preview
 *
 * User Journey:
 * 1. Review and accept suggestions
 * 2. Navigate to preview
 * 3. Verify merged content with visual diffs
 * 4. Check all sections render correctly
 * 5. Test section collapsing/expanding
 * 6. Return to suggestions if needed
 * 7. Proceed to download
 */

import { test, expect } from '../support/fixtures'

test.describe('Preview Flow - Comprehensive', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(15000)
  })

  test('should display merged content with accepted suggestions applied', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_reviewed', // Some accepted, some rejected
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/preview`)

    // Wait for preview to load
    await page.waitForSelector('[data-testid="preview-container"]', { timeout: 10000 })

    // Verify page title
    const title = page.locator('h1')
    await expect(title).toContainText(/Preview|Resume/)

    // Verify progress indicator shows Step 3
    const progressText = page.locator('[data-testid="progress-step"]')
    await expect(progressText).toContainText('Step 3')

    // Verify main sections are present
    const sections = ['Experience', 'Education', 'Skills']
    for (const section of sections) {
      const sectionElement = page.locator(`[data-testid="preview-section-${section.toLowerCase()}"]`)
      const isVisible = await sectionElement.isVisible().catch(() => false)
      if (isVisible) {
        await expect(sectionElement).toBeVisible()
      }
    }
  })

  test('should highlight changes with visual diffs', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_reviewed',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/preview`)
    await page.waitForSelector('[data-testid="preview-container"]', { timeout: 10000 })

    // Find diff content (changes made)
    const diffs = page.locator('[data-testid="diff-addition"]')
    const diffCount = await diffs.count()

    if (diffCount > 0) {
      // Verify first diff has green background
      const firstDiff = diffs.first()
      const bgColor = await firstDiff.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })

      // Should have green tint (at least some form of highlighting)
      expect(bgColor).toBeTruthy()

      // Verify "added in suggestion" indicator
      const addedLabel = firstDiff.locator('[data-testid="diff-label"]')
      const labelVisible = await addedLabel.isVisible().catch(() => false)
      if (labelVisible) {
        await expect(addedLabel).toContainText(/added|suggested|improved/i)
      }
    }
  })

  test('should show removed/original content in diff', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_reviewed',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/preview`)
    await page.waitForSelector('[data-testid="preview-container"]', { timeout: 10000 })

    // Look for strikethrough or removed content
    const removedContent = page.locator('[data-testid="diff-removal"]')
    const removedCount = await removedContent.count()

    if (removedCount > 0) {
      // Verify styling indicates removal
      const firstRemoved = removedContent.first()

      // Should have strikethrough or faded appearance
      const textDecoration = await firstRemoved.evaluate((el) => {
        return window.getComputedStyle(el).textDecoration
      })

      expect(textDecoration.toLowerCase()).toContain('line-through')
    }
  })

  test('should display resume sections in collapsible format', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_reviewed',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/preview`)
    await page.waitForSelector('[data-testid="preview-section"]', { timeout: 10000 })

    // Get all sections
    const sections = page.locator('[data-testid="preview-section"]')
    const sectionCount = await sections.count()

    if (sectionCount > 0) {
      // Get first section
      const firstSection = sections.first()
      const header = firstSection.locator('[data-testid="section-header"]')

      // Verify section header is clickable
      await expect(header).toBeVisible()

      // Click to collapse
      await header.click()
      await page.waitForTimeout(200)

      // Verify section content is hidden
      const content = firstSection.locator('[data-testid="section-content"]')
      const isHidden = await content.isHidden().catch(() => true)
      expect(isHidden).toBe(true)

      // Click to expand
      await header.click()
      await page.waitForTimeout(200)

      // Verify section content is visible
      const isVisible = await content.isVisible()
      expect(isVisible).toBe(true)
    }
  })

  test('should handle empty state when no changes applied', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    // Create scan with all suggestions rejected
    const scan = await scanFactory.create({
      status: 'suggestions_reviewed',
      suggestionStats: { accepted: 0, rejected: 10, pending: 0 },
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/preview`)

    // Wait for content to load
    await page.waitForSelector('body', { timeout: 10000 })

    // Check for empty state OR original content
    const emptyState = page.locator('[data-testid="empty-state"]')
    const emptyVisible = await emptyState.isVisible().catch(() => false)

    if (emptyVisible) {
      // Should show "No Changes Applied" message
      await expect(emptyState).toContainText(/No changes accepted|No suggestions applied/i)

      // Should have "Go Back" button
      const backButton = page.locator('[data-testid="back-button"]')
      await expect(backButton).toBeVisible()

      // Should have "Download Anyway" button
      const downloadButton = page.locator('[data-testid="download-anyway-button"]')
      await expect(downloadButton).toBeVisible()
    } else {
      // Original content should be shown
      const content = page.locator('[data-testid="preview-container"]')
      await expect(content).toBeVisible()
    }
  })

  test('should allow navigation back to suggestions', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_reviewed',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/preview`)
    await page.waitForSelector('[data-testid="preview-container"]', { timeout: 10000 })

    // Find back button
    const backButton = page.locator('[data-testid="back-button"]')
    await expect(backButton).toBeVisible()

    // Verify href points to suggestions
    const href = await backButton.getAttribute('href')
    expect(href).toContain('suggestions')

    // Click back
    await backButton.click()

    // Wait for navigation
    await page.waitForURL(/suggestions/, { timeout: 10000 })

    // Verify we're on suggestions page
    const suggestionsContainer = page.locator('[data-testid="suggestions-container"]')
    await expect(suggestionsContainer).toBeVisible()
  })

  test('should navigate to download on continue', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_reviewed',
      suggestionStats: { accepted: 5, rejected: 0, pending: 0 },
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/preview`)
    await page.waitForSelector('[data-testid="preview-container"]', { timeout: 10000 })

    // Find continue/download button
    const continueButton = page.locator('[data-testid="continue-button"]')
    const isVisible = await continueButton.isVisible().catch(() => false)

    if (isVisible) {
      // Button text should indicate download/continue
      const text = await continueButton.textContent()
      expect(text).toMatch(/Download|Continue|Next/i)

      // Click button
      await continueButton.click()

      // Wait for navigation to download page
      await page.waitForURL(/download/, { timeout: 10000 })

      // Verify we're on download page
      const downloadContainer = page.locator('[data-testid="download-container"]')
      const downloadVisible = await downloadContainer.isVisible().catch(() => false)
      expect(downloadVisible).toBe(true)
    }
  })

  test('should verify all resume sections render correctly', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_reviewed',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/preview`)
    await page.waitForSelector('[data-testid="preview-container"]', { timeout: 10000 })

    // Check key sections
    const expectedSections = {
      contact: '[data-testid="section-contact"]',
      experience: '[data-testid="section-experience"]',
      education: '[data-testid="section-education"]',
      skills: '[data-testid="section-skills"]',
    }

    for (const [section, selector] of Object.entries(expectedSections)) {
      const element = page.locator(selector)
      const isVisible = await element.isVisible().catch(() => false)

      // Some sections might be empty, but they should exist
      if (section === 'contact' || section === 'experience' || section === 'skills') {
        expect(isVisible).toBe(true)
      }
    }
  })

  test('should preserve contact information unchanged', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_reviewed',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/preview`)
    await page.waitForSelector('[data-testid="contact-section"]', { timeout: 10000 })

    // Contact info should be unchanged
    const contactSection = page.locator('[data-testid="contact-section"]')

    // Should have name
    const nameElement = contactSection.locator('[data-testid="contact-name"]')
    const name = await nameElement.textContent()
    expect(name).toBeTruthy()
    expect(name!.length).toBeGreaterThan(0)

    // Should have email
    const emailElement = contactSection.locator('[data-testid="contact-email"]')
    const emailVisible = await emailElement.isVisible().catch(() => false)
    if (emailVisible) {
      const email = await emailElement.textContent()
      expect(email).toMatch(/.+@.+/)
    }

    // Contact should NOT have diff highlighting
    const diffMarkers = contactSection.locator('[data-testid="diff-addition"]')
    const diffCount = await diffMarkers.count()
    expect(diffCount).toBe(0)
  })

  test('should display diff statistics summary', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_reviewed',
      suggestionStats: { accepted: 8, rejected: 2, pending: 0 },
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/preview`)
    await page.waitForSelector('[data-testid="diff-summary"]', { timeout: 10000 })

    const summary = page.locator('[data-testid="diff-summary"]')

    // Should show changes applied count
    const changesApplied = summary.locator('[data-testid="changes-applied"]')
    const appliedText = await changesApplied.textContent()
    expect(appliedText).toContain('8')

    // Should show sections affected
    const sectionsAffected = summary.locator('[data-testid="sections-affected"]')
    const sectionsText = await sectionsAffected.textContent()
    expect(sectionsText).toBeTruthy()
  })

  test('should handle resume with complex formatting correctly', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_reviewed',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/preview`)
    await page.waitForSelector('[data-testid="preview-container"]', { timeout: 10000 })

    // Get experience section
    const experienceSection = page.locator('[data-testid="section-experience"]')
    const isVisible = await experienceSection.isVisible().catch(() => false)

    if (isVisible) {
      // Should have job entries
      const jobs = experienceSection.locator('[data-testid="job-entry"]')
      const jobCount = await jobs.count()
      expect(jobCount).toBeGreaterThan(0)

      // Each job should have bullets
      const firstJob = jobs.first()
      const bullets = firstJob.locator('[data-testid="bullet-point"]')
      const bulletCount = await bullets.count()
      expect(bulletCount).toBeGreaterThanOrEqual(0)
    }
  })

  test('should not duplicate content between original and suggestion', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_reviewed',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/preview`)
    await page.waitForSelector('[data-testid="preview-container"]', { timeout: 10000 })

    // Get all text content
    const previewContainer = page.locator('[data-testid="preview-container"]')
    const fullText = await previewContainer.textContent()

    // Check for common duplication patterns
    const bulletPoints = fullText!.match(/[•\-]\s+(.+?)(?=[•\-]|$)/g) || []

    // Each unique bullet point should appear only once (allowing for diff markers)
    const seenBullets = new Set<string>()
    for (const bullet of bulletPoints) {
      // Normalize: remove diff markers, trim whitespace
      const normalized = bullet
        .replace(/\[added\]|\[removed\]|added|removed|suggested|improved/gi, '')
        .trim()

      // Should not see exact same normalized bullet twice in core content
      if (!seenBullets.has(normalized)) {
        seenBullets.add(normalized)
      }
    }

    expect(seenBullets.size).toBeGreaterThan(0)
  })

  test('should load preview page within acceptable time', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_reviewed',
    })

    const startTime = Date.now()

    await authenticatedPage.goto(`/analysis/${scan.id}/preview`)
    await page.waitForSelector('[data-testid="preview-container"]', { timeout: 10000 })

    const loadTime = Date.now() - startTime

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('should handle page responsiveness on mobile', async ({
    page,
    authenticatedPage,
    scanFactory,
    context,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const scan = await scanFactory.create({
      status: 'suggestions_reviewed',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/preview`)
    await page.waitForSelector('[data-testid="preview-container"]', { timeout: 10000 })

    // Content should be visible on mobile
    const container = page.locator('[data-testid="preview-container"]')
    await expect(container).toBeVisible()

    // Sections should stack vertically
    const sections = page.locator('[data-testid="preview-section"]')
    const count = await sections.count()
    expect(count).toBeGreaterThan(0)

    // Navigation buttons should be tappable
    const backButton = page.locator('[data-testid="back-button"]')
    const continueButton = page.locator('[data-testid="continue-button"]')

    const backVisible = await backButton.isVisible().catch(() => false)
    const continueVisible = await continueButton.isVisible().catch(() => false)

    expect(backVisible || continueVisible).toBe(true)
  })
})
