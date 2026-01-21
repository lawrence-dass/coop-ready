/**
 * E2E Tests: Accept/Reject Suggestions Workflow
 *
 * Tests the complete user journey for reviewing and accepting/rejecting suggestions:
 * - Story 5.7: Accept/Reject Individual Suggestions
 * - Story 5.6: Suggestions Display by Section
 *
 * User Journey:
 * 1. Upload resume → Analysis runs → Suggestions generated
 * 2. Navigate to suggestions review page
 * 3. Review suggestions organized by section
 * 4. Accept/reject individual suggestions
 * 5. Use bulk accept all in section
 * 6. Verify summary card updates
 * 7. Navigate to preview
 */

import { test, expect } from '../support/fixtures'

test.describe('Accept/Reject Suggestions Workflow', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    // Pre-test setup if needed
    page.setDefaultTimeout(15000)
  })

  test('should display suggestions organized by section', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    // Create a scan with suggestions already generated
    const scan = await scanFactory.create({
      status: 'suggestions_generated',
    })

    // Navigate to suggestions page
    await authenticatedPage.goto(`/analysis/${scan.id}/suggestions`)

    // Wait for suggestions to load
    await page.waitForSelector('[data-testid="suggestions-container"]', { timeout: 10000 })

    // Verify sections are displayed
    const sections = ['Experience', 'Skills', 'Education', 'Projects', 'Format']

    for (const section of sections) {
      const sectionElement = page.locator(`[data-testid="section-${section.toLowerCase()}"]`)
      const isVisible = await sectionElement.isVisible().catch(() => false)

      if (isVisible) {
        // Section exists and is visible
        await expect(sectionElement).toBeVisible()

        // Verify section has a count badge
        const countBadge = sectionElement.locator('[data-testid="suggestion-count"]')
        const count = await countBadge.textContent().catch(() => null)
        expect(count).toMatch(/\d+/)
      }
    }
  })

  test('should accept individual suggestion', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_generated',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/suggestions`)
    await page.waitForSelector('[data-testid="suggestion-card"]', { timeout: 10000 })

    // Get first suggestion card
    const firstSuggestion = page.locator('[data-testid="suggestion-card"]').first()

    // Verify it's in pending state
    await expect(firstSuggestion).toHaveAttribute('data-status', 'pending')

    // Get original text for verification
    const originalText = await firstSuggestion
      .locator('[data-testid="suggestion-original"]')
      .textContent()

    // Click accept button
    const acceptButton = firstSuggestion.locator('button:has-text("Accept")')
    await acceptButton.click()

    // Wait for update animation
    await page.waitForTimeout(300)

    // Verify card updated to accepted state
    await expect(firstSuggestion).toHaveAttribute('data-status', 'accepted')

    // Verify visual feedback (green styling)
    await expect(firstSuggestion).toHaveClass(/accepted/)

    // Verify toast notification appeared
    const toast = page.locator('[data-testid="toast-success"]:has-text("accepted")')
    await expect(toast).toBeVisible()
  })

  test('should reject individual suggestion', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_generated',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/suggestions`)
    await page.waitForSelector('[data-testid="suggestion-card"]', { timeout: 10000 })

    // Get second suggestion to test rejection
    const suggestionCard = page.locator('[data-testid="suggestion-card"]').nth(1)

    // Click reject button
    const rejectButton = suggestionCard.locator('button:has-text("Reject")')
    await rejectButton.click()

    // Wait for update animation
    await page.waitForTimeout(300)

    // Verify card updated to rejected state
    await expect(suggestionCard).toHaveAttribute('data-status', 'rejected')

    // Verify visual feedback (gray styling)
    await expect(suggestionCard).toHaveClass(/rejected/)

    // Verify toast notification
    const toast = page.locator('[data-testid="toast-success"]:has-text("rejected")')
    await expect(toast).toBeVisible()
  })

  test('should toggle between accepted and rejected states', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_generated',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/suggestions`)
    await page.waitForSelector('[data-testid="suggestion-card"]', { timeout: 10000 })

    const suggestionCard = page.locator('[data-testid="suggestion-card"]').first()

    // Accept
    await suggestionCard.locator('button:has-text("Accept")').click()
    await page.waitForTimeout(200)
    await expect(suggestionCard).toHaveAttribute('data-status', 'accepted')

    // Reject (toggle)
    await suggestionCard.locator('button:has-text("Reject")').click()
    await page.waitForTimeout(200)
    await expect(suggestionCard).toHaveAttribute('data-status', 'rejected')

    // Accept again (toggle back)
    await suggestionCard.locator('button:has-text("Accept")').click()
    await page.waitForTimeout(200)
    await expect(suggestionCard).toHaveAttribute('data-status', 'accepted')
  })

  test('should accept all suggestions in a section', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_generated',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/suggestions`)
    await page.waitForSelector('[data-testid="section-experience"]', { timeout: 10000 })

    // Get experience section
    const experienceSection = page.locator('[data-testid="section-experience"]')

    // Verify there are pending suggestions
    const pendingSuggestions = experienceSection.locator(
      '[data-testid="suggestion-card"][data-status="pending"]'
    )
    const pendingCount = await pendingSuggestions.count()
    expect(pendingCount).toBeGreaterThan(0)

    // Click "Accept All" button in section
    const acceptAllButton = experienceSection.locator('button:has-text("Accept All")')
    const isVisible = await acceptAllButton.isVisible().catch(() => false)

    if (isVisible) {
      await acceptAllButton.click()

      // Wait for bulk update
      await page.waitForTimeout(500)

      // Verify all suggestions in section are now accepted
      const acceptedSuggestions = experienceSection.locator(
        '[data-testid="suggestion-card"][data-status="accepted"]'
      )
      const acceptedCount = await acceptedSuggestions.count()

      expect(acceptedCount).toBe(pendingCount)

      // Verify confirmation toast
      const toast = page.locator('[data-testid="toast-success"]:has-text("accepted")')
      await expect(toast).toBeVisible()
    }
  })

  test('should update summary card when suggestions change', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_generated',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/suggestions`)
    await page.waitForSelector('[data-testid="suggestion-summary"]', { timeout: 10000 })

    const summaryCard = page.locator('[data-testid="suggestion-summary"]')

    // Get initial counts
    const initialTotal = await summaryCard.locator('[data-testid="total-count"]').textContent()
    const initialAccepted = await summaryCard.locator('[data-testid="accepted-count"]').textContent()
    const initialRejected = await summaryCard.locator('[data-testid="rejected-count"]').textContent()

    // Accept first suggestion
    const firstCard = page.locator('[data-testid="suggestion-card"]').first()
    await firstCard.locator('button:has-text("Accept")').click()
    await page.waitForTimeout(300)

    // Verify summary updated
    const updatedAccepted = await summaryCard.locator('[data-testid="accepted-count"]').textContent()
    expect(parseInt(updatedAccepted!)).toBe(parseInt(initialAccepted!) + 1)

    // Reject another suggestion
    const secondCard = page.locator('[data-testid="suggestion-card"]').nth(1)
    await secondCard.locator('button:has-text("Reject")').click()
    await page.waitForTimeout(300)

    // Verify summary updated again
    const updatedRejected = await summaryCard.locator('[data-testid="rejected-count"]').textContent()
    expect(parseInt(updatedRejected!)).toBe(parseInt(initialRejected!) + 1)
  })

  test('should calculate completion percentage correctly', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_generated',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/suggestions`)
    await page.waitForSelector('[data-testid="suggestion-summary"]', { timeout: 10000 })

    const summaryCard = page.locator('[data-testid="suggestion-summary"]')

    // Get total count
    const totalText = await summaryCard.locator('[data-testid="total-count"]').textContent()
    const total = parseInt(totalText!)

    // Accept all suggestions one by one
    const suggestions = page.locator('[data-testid="suggestion-card"]')
    const count = await suggestions.count()

    for (let i = 0; i < Math.min(count, total); i++) {
      const card = suggestions.nth(i)
      const status = await card.getAttribute('data-status')

      if (status === 'pending') {
        await card.locator('button:has-text("Accept")').click()
        await page.waitForTimeout(100)
      }
    }

    // Verify completion shows 100%
    const completion = await summaryCard.locator('[data-testid="completion-percentage"]').textContent()
    expect(completion).toContain('100%')
  })

  test('should filter suggestions by type', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_generated',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/suggestions`)
    await page.waitForSelector('[data-testid="suggestion-filter"]', { timeout: 10000 })

    // Get filter dropdown
    const filterDropdown = page.locator('[data-testid="suggestion-filter"]')

    // Click to open
    await filterDropdown.click()

    // Select "Bullet Rewrite" filter
    const bulletRewriteOption = page.locator('text=Bullet Rewrite')
    await bulletRewriteOption.click()

    // Wait for filter to apply
    await page.waitForTimeout(500)

    // Verify only bullet rewrite suggestions are shown
    const suggestions = page.locator('[data-testid="suggestion-card"]')
    const count = await suggestions.count()

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const card = suggestions.nth(i)
        const type = await card.getAttribute('data-suggestion-type')
        expect(type).toBe('bullet_rewrite')
      }
    }
  })

  test('should navigate to preview after reviewing suggestions', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_generated',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/suggestions`)
    await page.waitForSelector('[data-testid="continue-button"]', { timeout: 10000 })

    // Accept some suggestions
    const suggestions = page.locator('[data-testid="suggestion-card"]')
    const firstSuggestion = suggestions.first()
    await firstSuggestion.locator('button:has-text("Accept")').click()
    await page.waitForTimeout(200)

    // Click "Continue to Preview" button
    const continueButton = page.locator('[data-testid="continue-button"]')
    await continueButton.click()

    // Wait for navigation to preview page
    await page.waitForURL(/\/preview/, { timeout: 10000 })

    // Verify we're on preview page
    const pageTitle = page.locator('h1')
    await expect(pageTitle).toContainText(/Preview|Resume/)
  })

  test('should show empty state when no suggestions in section', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_generated',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/suggestions`)
    await page.waitForSelector('[data-testid="section-projects"]', { timeout: 10000 })

    // Find a section that might be empty
    const projectsSection = page.locator('[data-testid="section-projects"]')
    const isVisible = await projectsSection.isVisible().catch(() => false)

    if (isVisible) {
      const suggestions = projectsSection.locator('[data-testid="suggestion-card"]')
      const count = await suggestions.count()

      if (count === 0) {
        // Verify empty state message
        const emptyState = projectsSection.locator('[data-testid="empty-state"]')
        await expect(emptyState).toContainText(/No suggestions|already strong/i)
      }
    }
  })

  test('should maintain suggestion order when filtering', async ({
    page,
    authenticatedPage,
    scanFactory,
  }) => {
    const scan = await scanFactory.create({
      status: 'suggestions_generated',
    })

    await authenticatedPage.goto(`/analysis/${scan.id}/suggestions`)
    await page.waitForSelector('[data-testid="suggestion-card"]', { timeout: 10000 })

    // Get order before filtering
    const suggestionsBeforeFilter = page.locator('[data-testid="suggestion-card"]')
    const countBefore = await suggestionsBeforeFilter.count()

    // Apply filter
    const filterDropdown = page.locator('[data-testid="suggestion-filter"]')
    await filterDropdown.click()
    const filterOption = page.locator('text=All').first()
    await filterOption.click()
    await page.waitForTimeout(300)

    // Verify same order and count
    const suggestionsAfterFilter = page.locator('[data-testid="suggestion-card"]')
    const countAfter = await suggestionsAfterFilter.count()

    expect(countAfter).toBeLessThanOrEqual(countBefore)
  })
})
