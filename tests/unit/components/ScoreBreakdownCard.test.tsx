import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreBreakdownCard } from '@/components/shared/ScoreBreakdownCard';
import type { ScoreBreakdown } from '@/types/analysis';

describe('ScoreBreakdownCard Component', () => {
  const mockBreakdown: ScoreBreakdown = {
    keywordScore: 85,
    sectionCoverageScore: 67,
    contentQualityScore: 71,
  };

  describe('Rendering', () => {
    it('should render all three score categories', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      expect(screen.getByText('Keyword Alignment')).toBeInTheDocument();
      expect(screen.getByText('Section Coverage')).toBeInTheDocument();
      expect(screen.getByText('Content Quality')).toBeInTheDocument();
    });

    it('should display correct score values', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('67')).toBeInTheDocument();
      expect(screen.getByText('71')).toBeInTheDocument();
    });

    it('should show weight percentages', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      expect(screen.getByText('50% weight')).toBeInTheDocument();
      expect(screen.getAllByText('25% weight')).toHaveLength(2);
    });

    it('should render within a Card component', () => {
      const { container } = render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      // shadcn/ui Card adds data-slot="card"
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Progress Bars', () => {
    it('should render progress bar for each category', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      // Progress component from shadcn/ui
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(3);
    });

    it('should have aria labels for progress bars', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      expect(screen.getByLabelText(/Keyword Alignment score: 85 percent/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Section Coverage score: 67 percent/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Content Quality score: 71 percent/i)).toBeInTheDocument();
    });
  });

  describe('Category Descriptions', () => {
    it('should show description for Keyword Alignment', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      expect(
        screen.getByText(/keyword match between resume and job description/i)
      ).toBeInTheDocument();
    });

    it('should show description for Section Coverage', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      expect(
        screen.getByText(/essential sections.*summary.*skills.*experience/i)
      ).toBeInTheDocument();
    });

    it('should show description for Content Quality', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      expect(
        screen.getByText(/how relevant.*clear.*impactful/i)
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle score of 0', () => {
      const zeroBreakdown: ScoreBreakdown = {
        keywordScore: 0,
        sectionCoverageScore: 0,
        contentQualityScore: 0,
      };

      render(<ScoreBreakdownCard breakdown={zeroBreakdown} />);

      // Should show 0 three times (one for each category)
      expect(screen.getAllByText('0')).toHaveLength(3);
    });

    it('should handle score of 100', () => {
      const perfectBreakdown: ScoreBreakdown = {
        keywordScore: 100,
        sectionCoverageScore: 100,
        contentQualityScore: 100,
      };

      render(<ScoreBreakdownCard breakdown={perfectBreakdown} />);

      expect(screen.getAllByText('100')).toHaveLength(3);
    });

    it('should handle mixed score ranges', () => {
      const mixedBreakdown: ScoreBreakdown = {
        keywordScore: 25, // Low
        sectionCoverageScore: 55, // Medium
        contentQualityScore: 95, // High
      };

      render(<ScoreBreakdownCard breakdown={mixedBreakdown} />);

      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('55')).toBeInTheDocument();
      expect(screen.getByText('95')).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('should apply red color for scores below 40', () => {
      const lowBreakdown: ScoreBreakdown = {
        keywordScore: 25,
        sectionCoverageScore: 39,
        contentQualityScore: 0,
      };

      const { container } = render(<ScoreBreakdownCard breakdown={lowBreakdown} />);

      // Check that progress bars use red color class
      const redBars = container.querySelectorAll('.bg-red-500');
      expect(redBars).toHaveLength(3);
    });

    it('should apply amber color for scores between 40-69', () => {
      const midBreakdown: ScoreBreakdown = {
        keywordScore: 40,
        sectionCoverageScore: 55,
        contentQualityScore: 69,
      };

      const { container } = render(<ScoreBreakdownCard breakdown={midBreakdown} />);

      // Check that progress bars use amber color class
      const amberBars = container.querySelectorAll('.bg-amber-500');
      expect(amberBars).toHaveLength(3);
    });

    it('should apply green color for scores 70 and above', () => {
      const highBreakdown: ScoreBreakdown = {
        keywordScore: 70,
        sectionCoverageScore: 85,
        contentQualityScore: 100,
      };

      const { container } = render(<ScoreBreakdownCard breakdown={highBreakdown} />);

      // Check that progress bars use green color class
      const greenBars = container.querySelectorAll('.bg-green-500');
      expect(greenBars).toHaveLength(3);
    });

    it('should apply mixed colors for different score ranges', () => {
      const mixedBreakdown: ScoreBreakdown = {
        keywordScore: 25,  // Red
        sectionCoverageScore: 55,  // Amber
        contentQualityScore: 85,  // Green
      };

      const { container } = render(<ScoreBreakdownCard breakdown={mixedBreakdown} />);

      expect(container.querySelectorAll('.bg-red-500')).toHaveLength(1);
      expect(container.querySelectorAll('.bg-amber-500')).toHaveLength(1);
      expect(container.querySelectorAll('.bg-green-500')).toHaveLength(1);
    });
  });

  describe('Responsive Layout', () => {
    it('should render with proper spacing', () => {
      const { container } = render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      // Check for space-y class (vertical spacing)
      const categoryContainer = container.querySelector('.space-y-4');
      expect(categoryContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      // Category names should be properly labeled
      expect(screen.getByText('Keyword Alignment')).toBeInTheDocument();
      expect(screen.getByText('Section Coverage')).toBeInTheDocument();
      expect(screen.getByText('Content Quality')).toBeInTheDocument();
    });

    it('should include accessible labels for all categories', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      // Progress bars should have descriptive aria-labels
      expect(screen.getByLabelText(/Keyword Alignment score/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Section Coverage score/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Content Quality score/i)).toBeInTheDocument();
    });

    it('should have info button with accessible label', () => {
      render(<ScoreBreakdownCard breakdown={mockBreakdown} />);

      expect(screen.getByLabelText('More info about Keyword Alignment')).toBeInTheDocument();
      expect(screen.getByLabelText('More info about Section Coverage')).toBeInTheDocument();
      expect(screen.getByLabelText('More info about Content Quality')).toBeInTheDocument();
    });
  });
});
