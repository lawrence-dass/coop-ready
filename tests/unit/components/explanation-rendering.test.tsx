/**
 * Story 14.3: Test explanation rendering in SuggestionCard
 *
 * Tests that:
 * 1. Explanation section renders when explanation is provided
 * 2. Visual styling is correct (light blue background, lightbulb icon)
 * 3. Graceful degradation when explanation is missing/empty
 * 4. Text is readable and not truncated
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SuggestionCard } from '@/components/shared/SuggestionCard';

// Mock Zustand store
import { useOptimizationStore } from '@/store/useOptimizationStore';
import { vi } from 'vitest';

vi.mock('@/store/useOptimizationStore', () => ({
  useOptimizationStore: vi.fn((selector) => {
    const mockState = {
      getFeedbackForSuggestion: () => null,
      recordSuggestionFeedback: vi.fn(),
    };
    return selector(mockState);
  }),
}));

describe('Story 14.3: Explanation Rendering in SuggestionCard', () => {
  describe('AC #1: "Why this works" section displays', () => {
    it('should render explanation section when explanation is provided', () => {
      render(
        <SuggestionCard
          suggestionId="test-1"
          original="Original text"
          suggested="Suggested text"
          sectionType="summary"
          explanation="This change improves ATS score by incorporating required keywords like AWS and cloud architecture."
        />
      );

      // Check for "Why this works" heading
      expect(screen.getByText('Why this works')).toBeInTheDocument();

      // Check for explanation text
      expect(
        screen.getByText(/This change improves ATS score/)
      ).toBeInTheDocument();
    });

    it('should render explanation for summary suggestions', () => {
      render(
        <SuggestionCard
          suggestionId="test-summary"
          original="Engineer with experience"
          suggested="AWS-experienced engineer"
          sectionType="summary"
          explanation="Adding AWS highlights your infrastructure experience directly mentioned in JD's requirements."
        />
      );

      expect(screen.getByText('Why this works')).toBeInTheDocument();
      expect(screen.getByText(/Adding AWS highlights/)).toBeInTheDocument();
    });

    it('should render explanation for skills suggestions', () => {
      render(
        <SuggestionCard
          suggestionId="test-skills"
          original="React, JavaScript"
          suggested="React, JavaScript, TypeScript"
          sectionType="skills"
          explanation="TypeScript is explicitly required in the job description and complements your React expertise."
        />
      );

      expect(screen.getByText('Why this works')).toBeInTheDocument();
      expect(screen.getByText(/TypeScript is explicitly required/)).toBeInTheDocument();
    });

    it('should render explanation for experience suggestions', () => {
      render(
        <SuggestionCard
          suggestionId="test-experience"
          original="Led team"
          suggested="Led team of 5 engineers to deliver microservices architecture"
          sectionType="experience"
          explanation="Adding 'microservices architecture' directly addresses the JD requirement for distributed systems experience."
        />
      );

      expect(screen.getByText('Why this works')).toBeInTheDocument();
      expect(screen.getByText(/directly addresses the JD requirement/)).toBeInTheDocument();
    });
  });

  describe('AC #2: Visual styling is correct', () => {
    it('should have light blue background for explanation section', () => {
      const { container } = render(
        <SuggestionCard
          suggestionId="test-styling"
          original="Original"
          suggested="Suggested"
          sectionType="summary"
          explanation="Test explanation"
        />
      );

      // Find the explanation container (look for the outer div with all classes)
      const explanationHeading = screen.getByText('Why this works');
      const explanationSection = explanationHeading.closest('div')?.parentElement?.parentElement;

      expect(explanationSection).toHaveClass('bg-blue-50');
      expect(explanationSection).toHaveClass('border-blue-100');
      expect(explanationSection).toHaveClass('rounded-md');
    });

    it('should display lightbulb icon', () => {
      const { container } = render(
        <SuggestionCard
          suggestionId="test-icon"
          original="Original"
          suggested="Suggested"
          sectionType="summary"
          explanation="Test explanation"
        />
      );

      // Lucide React renders SVG with class containing 'lucide-lightbulb'
      const lightbulbIcon = container.querySelector('.lucide-lightbulb');
      expect(lightbulbIcon).toBeInTheDocument();
    });

    it('should have proper text styling for readability', () => {
      render(
        <SuggestionCard
          suggestionId="test-text"
          original="Original"
          suggested="Suggested"
          sectionType="summary"
          explanation="Test explanation with specific styling requirements."
        />
      );

      const heading = screen.getByText('Why this works');
      expect(heading).toHaveClass('text-xs');
      expect(heading).toHaveClass('font-semibold');
      expect(heading).toHaveClass('text-blue-900');

      const explanationText = screen.getByText(/Test explanation with specific/);
      expect(explanationText).toHaveClass('text-sm');
      expect(explanationText).toHaveClass('text-gray-700');
      expect(explanationText).toHaveClass('leading-relaxed');
    });
  });

  describe('AC #3: Text is readable and not truncated', () => {
    it('should display long explanations without truncation', () => {
      const longExplanation =
        'This is a very long explanation that tests whether the text wraps properly and remains readable. ' +
        'It should not be truncated or cut off, even on mobile devices. The leading-relaxed class ensures ' +
        'proper line height for readability across multiple lines of text.';

      render(
        <SuggestionCard
          suggestionId="test-long"
          original="Original"
          suggested="Suggested"
          sectionType="summary"
          explanation={longExplanation}
        />
      );

      // Check that the full text is rendered
      expect(screen.getByText(longExplanation)).toBeInTheDocument();
    });

    it('should handle text with line breaks properly', () => {
      const explanationWithNewlines = 'First line.\nSecond line.\nThird line.';

      render(
        <SuggestionCard
          suggestionId="test-newlines"
          original="Original"
          suggested="Suggested"
          sectionType="summary"
          explanation={explanationWithNewlines}
        />
      );

      // The text should be rendered (React treats \n as space in JSX)
      expect(screen.getByText(/First line/)).toBeInTheDocument();
    });
  });

  describe('AC #4: Graceful degradation for missing explanations', () => {
    it('should not render explanation section when explanation is undefined', () => {
      render(
        <SuggestionCard
          suggestionId="test-undefined"
          original="Original"
          suggested="Suggested"
          sectionType="summary"
          explanation={undefined}
        />
      );

      expect(screen.queryByText('Why this works')).not.toBeInTheDocument();
    });

    it('should not render explanation section when explanation is empty string', () => {
      render(
        <SuggestionCard
          suggestionId="test-empty"
          original="Original"
          suggested="Suggested"
          sectionType="summary"
          explanation=""
        />
      );

      expect(screen.queryByText('Why this works')).not.toBeInTheDocument();
    });

    it('should not render explanation section when explanation is whitespace only', () => {
      render(
        <SuggestionCard
          suggestionId="test-whitespace"
          original="Original"
          suggested="Suggested"
          sectionType="summary"
          explanation="   "
        />
      );

      expect(screen.queryByText('Why this works')).not.toBeInTheDocument();
    });

    it('should still render other card content when explanation is missing', () => {
      render(
        <SuggestionCard
          suggestionId="test-no-explanation"
          original="Original text"
          suggested="Suggested text"
          sectionType="summary"
          keywords={['keyword1', 'keyword2']}
          points={8}
        />
      );

      // Original and suggested text should still be present (use getAllByText since text appears in both desktop and mobile layouts)
      expect(screen.getAllByText('Original text').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Suggested text').length).toBeGreaterThan(0);

      // Point badge should still render
      expect(screen.getByText('+8 pts')).toBeInTheDocument();

      // Keywords should still render
      expect(screen.getByText('keyword1')).toBeInTheDocument();

      // But no explanation section
      expect(screen.queryByText('Why this works')).not.toBeInTheDocument();
    });
  });

  describe('Backward Compatibility', () => {
    it('should work with old suggestions that do not have explanation prop', () => {
      // Simulate old component usage without explanation prop
      render(
        <SuggestionCard
          suggestionId="test-old"
          original="Original content"
          suggested="Suggested content"
          sectionType="summary"
          keywords={['test']}
        />
      );

      // Card should render normally (use getAllByText since text appears in both layouts)
      expect(screen.getAllByText('Original content').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Suggested content').length).toBeGreaterThan(0);

      // No explanation section
      expect(screen.queryByText('Why this works')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle explanation with special characters', () => {
      const specialCharsExplanation = 'Adding "AWS", <cloud>, & {microservices} keywords.';

      render(
        <SuggestionCard
          suggestionId="test-special"
          original="Original"
          suggested="Suggested"
          sectionType="summary"
          explanation={specialCharsExplanation}
        />
      );

      expect(screen.getByText(specialCharsExplanation)).toBeInTheDocument();
    });

    it('should handle very short explanation (single word)', () => {
      render(
        <SuggestionCard
          suggestionId="test-short"
          original="Original"
          suggested="Suggested"
          sectionType="summary"
          explanation="Relevant."
        />
      );

      expect(screen.getByText('Relevant.')).toBeInTheDocument();
    });
  });
});
