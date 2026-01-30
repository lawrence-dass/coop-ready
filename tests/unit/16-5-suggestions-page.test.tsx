import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreComparisonSection } from '@/app/app/(dashboard)/scan/[sessionId]/suggestions/ScoreComparisonSection';
import { SectionSummaryCard } from '@/app/app/(dashboard)/scan/[sessionId]/suggestions/SectionSummaryCard';
import { SuggestionsLoadingState } from '@/app/app/(dashboard)/scan/[sessionId]/suggestions/SuggestionsLoadingState';
import '@testing-library/jest-dom/vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

/**
 * Story 16.5: Suggestions Page Component Unit Tests
 *
 * Tests the new components for the suggestions page.
 *
 * Priority Distribution:
 * - P0: 5 tests (core rendering and calculations)
 */

describe('Story 16.5: Suggestions Page Components', () => {
  describe('ScoreComparisonSection', () => {
    test('[P0] 16.5-UI-001: should display original and projected scores correctly', () => {
      // GIVEN: Original score of 45 and potential points of 27
      const originalScore = 45;
      const potentialPoints = 27;

      // WHEN: Rendering component
      render(
        <ScoreComparisonSection
          originalScore={originalScore}
          potentialPoints={potentialPoints}
        />
      );

      // THEN: Should display both scores
      const originalScoreEl = screen.getByTestId('original-score-display');
      const projectedScoreEl = screen.getByTestId('projected-score-display');

      expect(originalScoreEl).toHaveTextContent('45');
      expect(projectedScoreEl).toHaveTextContent('72'); // 45 + 27
    });

    test('[P0] 16.5-UI-002: should calculate improvement delta correctly', () => {
      // GIVEN: Original score of 50 and potential points of 20
      const originalScore = 50;
      const potentialPoints = 20;

      // WHEN: Rendering component
      const { container } = render(
        <ScoreComparisonSection
          originalScore={originalScore}
          potentialPoints={potentialPoints}
        />
      );

      // THEN: Should show +20 improvement
      expect(container.textContent).toContain('+20');
      expect(container.textContent).toContain('40.0%'); // (20/50) * 100
    });

    test('[P0] 16.5-UI-003: should cap projected score at 100', () => {
      // GIVEN: Original score of 90 and potential points of 30
      const originalScore = 90;
      const potentialPoints = 30;

      // WHEN: Rendering component
      render(
        <ScoreComparisonSection
          originalScore={originalScore}
          potentialPoints={potentialPoints}
        />
      );

      // THEN: Projected score should be capped at 100
      const projectedScoreEl = screen.getByTestId('projected-score-display');
      expect(projectedScoreEl).toHaveTextContent('100');
    });
  });

  describe('SectionSummaryCard', () => {
    test('[P0] 16.5-UI-004: should display section stats correctly', () => {
      // GIVEN: Summary section with 3 suggestions and 15 potential points
      const sectionName = 'Summary';
      const suggestionCount = 3;
      const potentialPoints = 15;
      const description = 'Test description';

      // WHEN: Rendering component
      const { container } = render(
        <SectionSummaryCard
          sectionName={sectionName}
          suggestionCount={suggestionCount}
          potentialPoints={potentialPoints}
          description={description}
        />
      );

      // THEN: Should display all stats
      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(container.textContent).toContain('3 suggestions');
      expect(container.textContent).toContain('+15 pts');
      expect(screen.getByText(description)).toBeInTheDocument();
    });

    test('[P0] 16.5-UI-005: should handle singular suggestion count', () => {
      // GIVEN: Section with 1 suggestion
      const suggestionCount = 1;

      // WHEN: Rendering component
      const { container } = render(
        <SectionSummaryCard
          sectionName="Skills"
          suggestionCount={suggestionCount}
          potentialPoints={5}
          description="Test"
        />
      );

      // THEN: Should display "1 suggestion" (singular)
      expect(container.textContent).toContain('1 suggestion');
      expect(container.textContent).not.toContain('1 suggestions');
    });
  });

  describe('SuggestionsLoadingState', () => {
    test('[P0] 16.5-UI-006: should display loading spinner and message', () => {
      // GIVEN: A session ID
      const sessionId = '123e4567-e89b-12d3-a456-426614174000';

      // WHEN: Rendering component
      render(<SuggestionsLoadingState sessionId={sessionId} />);

      // THEN: Should display loading state with spinner and message
      const loadingState = screen.getByTestId('suggestions-loading-state');
      expect(loadingState).toBeInTheDocument();
      expect(loadingState).toHaveAttribute('role', 'status');
      expect(screen.getByText('Generating suggestions...')).toBeInTheDocument();
    });

    test('[P0] 16.5-UI-007: should render skeleton placeholders for content areas', () => {
      // GIVEN: A session ID
      const sessionId = '123e4567-e89b-12d3-a456-426614174000';

      // WHEN: Rendering component
      const { container } = render(<SuggestionsLoadingState sessionId={sessionId} />);

      // THEN: Should display skeleton elements
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    test('[P0] 16.5-UI-008: should display page header', () => {
      // GIVEN: A session ID
      const sessionId = '123e4567-e89b-12d3-a456-426614174000';

      // WHEN: Rendering component
      render(<SuggestionsLoadingState sessionId={sessionId} />);

      // THEN: Should display page header
      expect(screen.getByText('Optimization Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Review and apply suggestions to improve your ATS score')).toBeInTheDocument();
    });
  });
});
