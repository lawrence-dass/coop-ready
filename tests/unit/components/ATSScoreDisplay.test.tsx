import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ATSScoreDisplay } from '@/components/shared/ATSScoreDisplay';
import type { ATSScore } from '@/types/analysis';

describe('ATSScoreDisplay Component', () => {
  const mockScore: ATSScore = {
    overall: 72,
    breakdown: {
      keywordScore: 85,
      sectionCoverageScore: 67,
      contentQualityScore: 71,
    },
    calculatedAt: '2026-01-25T12:00:00Z',
  };

  describe('Rendering', () => {
    it('should render ScoreCircle with overall score', async () => {
      render(<ATSScoreDisplay score={mockScore} />);

      // Animation starts at 0, wait for it to complete
      await screen.findByText('72', {}, { timeout: 2000 });
      expect(screen.getByText('ATS Match')).toBeInTheDocument();
    });

    it('should render ScoreBreakdownCard', () => {
      render(<ATSScoreDisplay score={mockScore} />);

      expect(screen.getByText('Score Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Keyword Alignment')).toBeInTheDocument();
    });

    it('should show timestamp', () => {
      render(<ATSScoreDisplay score={mockScore} />);

      // Should show "Updated" text
      expect(screen.getByText(/updated/i)).toBeInTheDocument();
    });
  });

  describe('Score Interpretation Messages', () => {
    it('should show low score message (0-39%)', () => {
      const lowScore: ATSScore = {
        ...mockScore,
        overall: 35,
      };

      render(<ATSScoreDisplay score={lowScore} />);

      expect(
        screen.getByText(/room for improvement.*review the suggestions below/i)
      ).toBeInTheDocument();
    });

    it('should show medium score message (40-69%)', () => {
      const medScore: ATSScore = {
        ...mockScore,
        overall: 55,
      };

      render(<ATSScoreDisplay score={medScore} />);

      expect(
        screen.getByText(/good start.*improvements will boost your score/i)
      ).toBeInTheDocument();
    });

    it('should show high score message (70-100%)', () => {
      const highScore: ATSScore = {
        ...mockScore,
        overall: 85,
      };

      render(<ATSScoreDisplay score={highScore} />);

      expect(
        screen.getByText(/great match.*resume aligns well/i)
      ).toBeInTheDocument();
    });

    it('should handle edge case: score = 39', () => {
      const edgeScore: ATSScore = {
        ...mockScore,
        overall: 39,
      };

      render(<ATSScoreDisplay score={edgeScore} />);

      expect(screen.getByText(/room for improvement/i)).toBeInTheDocument();
    });

    it('should handle edge case: score = 40', () => {
      const edgeScore: ATSScore = {
        ...mockScore,
        overall: 40,
      };

      render(<ATSScoreDisplay score={edgeScore} />);

      expect(screen.getByText(/good start/i)).toBeInTheDocument();
    });

    it('should handle edge case: score = 69', () => {
      const edgeScore: ATSScore = {
        ...mockScore,
        overall: 69,
      };

      render(<ATSScoreDisplay score={edgeScore} />);

      expect(screen.getByText(/good start/i)).toBeInTheDocument();
    });

    it('should handle edge case: score = 70', () => {
      const edgeScore: ATSScore = {
        ...mockScore,
        overall: 70,
      };

      render(<ATSScoreDisplay score={edgeScore} />);

      expect(screen.getByText(/great match/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton', () => {
      render(<ATSScoreDisplay loading={true} />);

      // Should show loading indicators
      expect(screen.getByText('Calculating score...')).toBeInTheDocument();
    });

    it('should not show score when loading', () => {
      render(<ATSScoreDisplay loading={true} />);

      // Should not show actual score components
      expect(screen.queryByText('Score Breakdown')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message', () => {
      render(
        <ATSScoreDisplay
          error={{ message: 'Failed to calculate score', code: 'LLM_ERROR' }}
        />
      );

      expect(screen.getByText(/failed to calculate score/i)).toBeInTheDocument();
    });

    it('should not show score when error exists', () => {
      render(
        <ATSScoreDisplay
          error={{ message: 'Error', code: 'LLM_ERROR' }}
        />
      );

      expect(screen.queryByText('Score Breakdown')).not.toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should display ScoreCircle in large variant', () => {
      render(<ATSScoreDisplay score={mockScore} />);

      // Get the ScoreCircle progressbar (it has the aria-label with "ATS Match")
      const scoreCircle = screen.getByLabelText(/ATS Match score/i);
      const svg = scoreCircle.querySelector('svg');

      expect(svg).toHaveAttribute('width', '160');
      expect(svg).toHaveAttribute('height', '160');
    });

    it('should pass overall score to ScoreCircle', async () => {
      render(<ATSScoreDisplay score={mockScore} />);

      // Wait for animation to complete
      await screen.findByText('72', {}, { timeout: 2000 });
    });

    it('should pass breakdown to ScoreBreakdownCard', async () => {
      render(<ATSScoreDisplay score={mockScore} />);

      // ScoreBreakdownCard scores don't animate, should be immediate
      expect(await screen.findByText('85')).toBeInTheDocument(); // keywordScore
      expect(screen.getByText('67')).toBeInTheDocument(); // sectionCoverageScore
      expect(screen.getByText('71')).toBeInTheDocument(); // contentQualityScore
    });
  });

  describe('Accessibility', () => {
    it('should have semantic structure', () => {
      const { container } = render(<ATSScoreDisplay score={mockScore} />);

      // Should be wrapped in a section or container
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have accessible score display', () => {
      render(<ATSScoreDisplay score={mockScore} />);

      // ScoreCircle should have progressbar role with specific label
      expect(screen.getByLabelText(/ATS Match score/i)).toBeInTheDocument();
    });
  });

  describe('Timestamp Formatting', () => {
    it('should format timestamp as "just now" for < 1 minute', () => {
      const recentScore: ATSScore = {
        ...mockScore,
        calculatedAt: new Date(Date.now() - 30 * 1000).toISOString(), // 30 seconds ago
      };

      render(<ATSScoreDisplay score={recentScore} />);

      expect(screen.getByText(/updated just now/i)).toBeInTheDocument();
    });

    it('should format timestamp as "1 minute ago"', () => {
      const recentScore: ATSScore = {
        ...mockScore,
        calculatedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 minute ago
      };

      render(<ATSScoreDisplay score={recentScore} />);

      expect(screen.getByText(/updated 1 minute ago/i)).toBeInTheDocument();
    });

    it('should format timestamp as "X minutes ago" for < 60 minutes', () => {
      const recentScore: ATSScore = {
        ...mockScore,
        calculatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      };

      render(<ATSScoreDisplay score={recentScore} />);

      expect(screen.getByText(/updated 5 minutes ago/i)).toBeInTheDocument();
    });

    it('should format timestamp as "1 hour ago"', () => {
      const recentScore: ATSScore = {
        ...mockScore,
        calculatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      };

      render(<ATSScoreDisplay score={recentScore} />);

      expect(screen.getByText(/updated 1 hour ago/i)).toBeInTheDocument();
    });

    it('should format timestamp as "X hours ago" for < 24 hours', () => {
      const recentScore: ATSScore = {
        ...mockScore,
        calculatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      };

      render(<ATSScoreDisplay score={recentScore} />);

      expect(screen.getByText(/updated 5 hours ago/i)).toBeInTheDocument();
    });

    it('should format timestamp as "1 day ago"', () => {
      const recentScore: ATSScore = {
        ...mockScore,
        calculatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      };

      render(<ATSScoreDisplay score={recentScore} />);

      expect(screen.getByText(/updated 1 day ago/i)).toBeInTheDocument();
    });

    it('should format timestamp as "X days ago" for > 24 hours', () => {
      const recentScore: ATSScore = {
        ...mockScore,
        calculatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      };

      render(<ATSScoreDisplay score={recentScore} />);

      expect(screen.getByText(/updated 3 days ago/i)).toBeInTheDocument();
    });
  });
});
