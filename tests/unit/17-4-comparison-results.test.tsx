import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ComparisonResultsClient } from '@/components/scan/ComparisonResultsClient';
import type { ATSScoreV21 } from '@/lib/scoring/types';
import '@testing-library/jest-dom/vitest';

/**
 * Story 17.4: Comparison Results Display Unit Tests
 *
 * Tests verify comparison results UI displays correctly with:
 * - Positive improvements (green, celebratory)
 * - No improvement (gray, neutral)
 * - Decreases (amber, suggestions)
 * - Navigation functionality
 *
 * Priority Distribution:
 * - P0: 6 tests (core display, improvement types, navigation)
 * - P1: 2 tests (tier changes, percentage calculations)
 */

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock ScoreCircle to avoid rendering SVG internals
vi.mock('@/components/shared/ScoreCircle', () => ({
  ScoreCircle: ({ score }: { score: number }) => (
    <div data-testid="score-circle">{score}</div>
  ),
}));

// Mock ScoreBreakdownCard to avoid deep breakdown detail requirements
vi.mock('@/components/shared/ScoreBreakdownCard', () => ({
  ScoreBreakdownCard: () => <div data-testid="score-breakdown">Breakdown</div>,
}));

/**
 * Helper to create mock ATSScoreV21 for testing.
 * Uses type assertion since tests verify UI rendering, not type correctness.
 * The tier parameter matches what should display in the UI.
 */
function createMockScore(overall: number, tier: string): ATSScoreV21 {
  // Minimal mock that satisfies component rendering needs
  // Using 'as ATSScoreV21' to avoid verbose type definitions in tests
  return {
    overall,
    tier,
    breakdown: {
      keywordScore: overall,
      sectionCoverageScore: overall,
      contentQualityScore: overall,
    },
    breakdownV21: {
      keywords: { score: overall, weight: 0.4, weighted: overall * 0.4, details: {} },
      qualificationFit: { score: overall, weight: 0.15, weighted: overall * 0.15, details: {} },
      contentQuality: { score: overall, weight: 0.2, weighted: overall * 0.2, details: {} },
      sections: { score: overall, weight: 0.15, weighted: overall * 0.15, details: {} },
      format: { score: overall, weight: 0.1, weighted: overall * 0.1, details: {} },
    },
    metadata: {
      version: 'v2.1',
      algorithmHash: 'test-hash',
      processingTimeMs: 100,
      detectedRole: 'software_engineer',
      detectedSeniority: 'mid',
      weightsUsed: { keywords: 0.4, qualificationFit: 0.15, contentQuality: 0.2, sections: 0.15, format: 0.1 },
    },
    actionItems: [],
    calculatedAt: new Date().toISOString(),
  } as unknown as ATSScoreV21;
}

describe('Story 17.4: Comparison Results Display', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  test('[P0] 17.4-CRD-001: Renders with positive improvement', () => {
    // GIVEN: Improved scores (65 -> 78)
    const originalScore = createMockScore(65, 'Competitive');
    const comparedScore = createMockScore(78, 'Strong');

    // WHEN: Component renders
    render(
      <ComparisonResultsClient
        sessionId="test-session-123"
        originalScore={originalScore}
        comparedScore={comparedScore}
      />
    );

    // THEN: Shows improvement delta prominently
    expect(screen.getByText('+13')).toBeInTheDocument();
    expect(screen.getByText(/points gained/i)).toBeInTheDocument();

    // AND: Shows tiers
    expect(screen.getByText('Competitive')).toBeInTheDocument();
    expect(screen.getByText('Strong')).toBeInTheDocument();

    // AND: Shows page structure
    expect(screen.getByText('Original Score')).toBeInTheDocument();
    expect(screen.getByText('Updated Score')).toBeInTheDocument();
  });

  test('[P0] 17.4-CRD-002: Shows celebratory message for large improvement (20+ points)', () => {
    // GIVEN: Large improvement (60 -> 85)
    const originalScore = createMockScore(60, 'Competitive');
    const comparedScore = createMockScore(85, 'Excellent');

    // WHEN: Component renders
    render(
      <ComparisonResultsClient
        sessionId="test-session-123"
        originalScore={originalScore}
        comparedScore={comparedScore}
      />
    );

    // THEN: Shows excellent improvement message
    expect(screen.getByText(/excellent improvement/i)).toBeInTheDocument();

    // AND: Shows delta
    expect(screen.getByText('+25')).toBeInTheDocument();
  });

  test('[P1] 17.4-CRD-003: Highlights tier change', () => {
    // GIVEN: Score with tier change (Competitive -> Strong)
    const originalScore = createMockScore(65, 'Competitive');
    const comparedScore = createMockScore(78, 'Strong');

    // WHEN: Component renders
    render(
      <ComparisonResultsClient
        sessionId="test-session-123"
        originalScore={originalScore}
        comparedScore={comparedScore}
      />
    );

    // THEN: Shows tier change badge (uses literal arrow character)
    expect(screen.getByText(/Competitive.*→.*Strong/)).toBeInTheDocument();
  });

  test('[P0] 17.4-CRD-004: Handles no improvement gracefully', () => {
    // GIVEN: Identical scores (70 -> 70)
    const score = createMockScore(70, 'Strong');

    // WHEN: Component renders
    render(
      <ComparisonResultsClient
        sessionId="test-session-123"
        originalScore={score}
        comparedScore={score}
      />
    );

    // THEN: Shows zero improvement delta (specific to the center column)
    const deltaText = screen.getByText((content, element): boolean => {
      const htmlElement = element as HTMLElement | null;
      return Boolean(htmlElement?.className?.includes('text-4xl') && content === '0');
    });
    expect(deltaText).toBeInTheDocument();
    expect(screen.getByText(/points changed/i)).toBeInTheDocument();

    // AND: Shows neutral message
    expect(screen.getByText(/identical/i)).toBeInTheDocument();
    expect(screen.getByText(/consider applying more suggestions/i)).toBeInTheDocument();
  });

  test('[P0] 17.4-CRD-005: Shows appropriate message for score decrease', () => {
    // GIVEN: Decreased score (75 -> 68)
    const originalScore = createMockScore(75, 'Strong');
    const comparedScore = createMockScore(68, 'Competitive');

    // WHEN: Component renders
    render(
      <ComparisonResultsClient
        sessionId="test-session-123"
        originalScore={originalScore}
        comparedScore={comparedScore}
      />
    );

    // THEN: Shows negative delta
    expect(screen.getByText('-7')).toBeInTheDocument();
    expect(screen.getByText(/points changed/i)).toBeInTheDocument();

    // AND: Shows decrease message with suggestions
    expect(screen.getByText(/decreased/i)).toBeInTheDocument();
  });

  test('[P1] 17.4-CRD-006: Calculates percentage improvement correctly', () => {
    // GIVEN: 13 point improvement from base 65
    const originalScore = createMockScore(65, 'Competitive');
    const comparedScore = createMockScore(78, 'Strong');

    // WHEN: Component renders
    render(
      <ComparisonResultsClient
        sessionId="test-session-123"
        originalScore={originalScore}
        comparedScore={comparedScore}
      />
    );

    // THEN: Shows percentage (13/65 * 100 = 20%)
    expect(screen.getByText(/20\.0% improvement/i)).toBeInTheDocument();
  });

  test('[P0] 17.4-CRD-007: Back button navigates to suggestions page', async () => {
    // GIVEN: Rendered component
    const originalScore = createMockScore(65, 'Competitive');
    const comparedScore = createMockScore(78, 'Strong');

    render(
      <ComparisonResultsClient
        sessionId="test-session-123"
        originalScore={originalScore}
        comparedScore={comparedScore}
      />
    );

    // WHEN: User clicks back button
    const backButton = screen.getByRole('button', { name: /back to suggestions/i });
    await userEvent.click(backButton);

    // THEN: Navigates to suggestions page
    expect(mockPush).toHaveBeenCalledWith('/scan/test-session-123/suggestions');
  });

  test('[P0] 17.4-CRD-008: Page header and description render correctly', () => {
    // GIVEN: Any valid scores
    const originalScore = createMockScore(65, 'Competitive');
    const comparedScore = createMockScore(78, 'Strong');

    // WHEN: Component renders
    render(
      <ComparisonResultsClient
        sessionId="test-session-123"
        originalScore={originalScore}
        comparedScore={comparedScore}
      />
    );

    // THEN: Shows page title
    expect(screen.getByText('Resume Comparison Results')).toBeInTheDocument();

    // AND: Shows description
    expect(screen.getByText(/see how your updated resume compares/i)).toBeInTheDocument();
  });
});
