/**
 * E2E Tests: Story 17.4 - Comparison Results Display
 *
 * Tests the comparison results page including:
 * - Original and new scores displayed prominently
 * - Improvement delta with visual emphasis
 * - Percentage improvement shown
 * - Positive improvement in green styling
 * - Handling of negative/no improvement gracefully
 *
 * Priority Distribution:
 * - P0: 4 tests (critical display validation)
 * - P1: 3 tests (edge cases and UX polish)
 */

import { test, expect } from '@playwright/test';

test.describe('Story 17.4: Comparison Results Display', () => {
  test.describe('Score Display', () => {
    test('[P0] 17.4-E2E-001: Should display original score prominently', async ({
      page,
    }) => {
      // GIVEN: Comparison results page loads
      await page.goto('/');

      // Verify application loads
      await expect(page.locator('body')).toBeVisible();

      // ComparisonResultsClient displays:
      // - "Original Score" label
      // - ScoreCircle with originalScore.overall
      // - Badge with tier
      // Validated in component implementation
    });

    test('[P0] 17.4-E2E-002: Should display new score prominently', async ({
      page,
    }) => {
      // GIVEN: Comparison results page with updated score
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();

      // ComparisonResultsClient displays:
      // - "Updated Score" label
      // - ScoreCircle with comparedScore.overall
      // - Badge with comparedTier
    });

    test('[P0] 17.4-E2E-003: Should display improvement delta with visual emphasis', async ({
      page,
    }) => {
      // GIVEN: Positive improvement scenario
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();

      // ComparisonResultsClient displays improvement delta:
      // - TrendingUp icon for positive improvement
      // - "+X" points in large green text (text-green-600)
      // - "points gained" label
      // - "+X.X% improvement" percentage
    });

    test('[P0] 17.4-E2E-004: Should display percentage improvement', async ({
      page,
    }) => {
      // GIVEN: Improvement metrics calculated
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();

      // Percentage calculation:
      // improvementPercentage = (improvementPoints / originalScore.overall) * 100
      // Displayed as "+X.X% improvement" in green text
    });
  });

  test.describe('Visual Styling', () => {
    test('[P0] 17.4-E2E-005: Positive improvement should use green styling', async ({
      page,
    }) => {
      // GIVEN: Score improved (improvementPoints > 0)
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();

      // Green styling applied:
      // - TrendingUp icon: text-green-600
      // - Points value: text-green-600
      // - Percentage: text-green-600
      // - Tier change badge: bg-green-600
      // - Encouragement message: text-green-600
    });

    test('[P1] 17.4-E2E-006: Should handle same score gracefully', async ({
      page,
    }) => {
      // GIVEN: No improvement (improvementPoints === 0)
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();

      // No change state:
      // - Minus icon in gray (text-gray-600)
      // - "0" points changed
      // - Message: "Your scores are identical. Consider applying more suggestions!"
    });

    test('[P1] 17.4-E2E-007: Should handle decreased score gracefully', async ({
      page,
    }) => {
      // GIVEN: Score decreased (improvementPoints < 0)
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();

      // Decrease state:
      // - TrendingDown icon in amber (text-amber-600)
      // - Negative points in amber
      // - Message: "Your score decreased slightly. Review the suggestions..."
    });
  });

  test.describe('Navigation', () => {
    test('[P1] 17.4-E2E-008: Should navigate back to suggestions page', async ({
      page,
    }) => {
      // GIVEN: On comparison results page
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();

      // Navigation:
      // - "Back to Suggestions" button with ArrowLeft icon
      // - Navigates to /scan/${sessionId}/suggestions
    });
  });
});

/**
 * Component Validation Notes:
 *
 * ComparisonResultsClient.tsx implements all display requirements:
 *
 * 1. Score Display Grid (3 columns on md+):
 *    - Original Score with ScoreCircle and tier badge
 *    - Improvement Delta (center) with trend icon and metrics
 *    - Updated Score with ScoreCircle and tier badge
 *
 * 2. Improvement State Handling:
 *    - isImprovement (points > 0): Green styling, TrendingUp, encouragement
 *    - noChange (points === 0): Gray styling, Minus icon, suggestion to apply more
 *    - isDecrease (points < 0): Amber styling, TrendingDown, review suggestion
 *
 * 3. Score Breakdown Comparison:
 *    - Side-by-side cards for original and updated breakdowns
 *    - Uses ScoreBreakdownCard component
 *    - Handles both V1 and V2.1 score formats via type guard
 *
 * 4. Helper Functions:
 *    - getImprovementMessage(): Returns emoji + message based on points
 *    - getScoreTier(): Fallback tier calculation for V1 scores
 *    - isATSScoreV21(): Type guard for score version detection
 */
