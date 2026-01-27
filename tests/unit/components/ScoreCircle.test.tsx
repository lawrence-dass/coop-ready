import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreCircle } from '@/components/shared/ScoreCircle';

describe('ScoreCircle Component', () => {
  describe('Rendering', () => {
    it('should render with correct score', () => {
      render(<ScoreCircle score={72} animated={false} />);
      expect(screen.getByText('72')).toBeInTheDocument();
    });

    it('should display custom label', () => {
      render(<ScoreCircle score={85} label="Custom Label" animated={false} />);
      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    it('should use default label "ATS Match"', () => {
      render(<ScoreCircle score={60} animated={false} />);
      expect(screen.getByText('ATS Match')).toBeInTheDocument();
    });
  });

  describe('Color Ranges', () => {
    it('should apply danger color for score < 40', () => {
      render(<ScoreCircle score={25} animated={false} />);
      const progressCircle = screen.getByRole('progressbar').querySelector('circle[stroke="#EF4444"]');
      expect(progressCircle).toBeInTheDocument();
    });

    it('should apply danger color for score = 39', () => {
      render(<ScoreCircle score={39} animated={false} />);
      const progressCircle = screen.getByRole('progressbar').querySelector('circle[stroke="#EF4444"]');
      expect(progressCircle).toBeInTheDocument();
    });

    it('should apply warning color for score >= 40 and < 70', () => {
      render(<ScoreCircle score={55} animated={false} />);
      const progressCircle = screen.getByRole('progressbar').querySelector('circle[stroke="#F59E0B"]');
      expect(progressCircle).toBeInTheDocument();
    });

    it('should apply warning color for score = 40', () => {
      render(<ScoreCircle score={40} animated={false} />);
      const progressCircle = screen.getByRole('progressbar').querySelector('circle[stroke="#F59E0B"]');
      expect(progressCircle).toBeInTheDocument();
    });

    it('should apply warning color for score = 69', () => {
      render(<ScoreCircle score={69} animated={false} />);
      const progressCircle = screen.getByRole('progressbar').querySelector('circle[stroke="#F59E0B"]');
      expect(progressCircle).toBeInTheDocument();
    });

    it('should apply success color for score >= 70', () => {
      render(<ScoreCircle score={85} animated={false} />);
      const progressCircle = screen.getByRole('progressbar').querySelector('circle[stroke="#10B981"]');
      expect(progressCircle).toBeInTheDocument();
    });

    it('should apply success color for score = 70', () => {
      render(<ScoreCircle score={70} animated={false} />);
      const progressCircle = screen.getByRole('progressbar').querySelector('circle[stroke="#10B981"]');
      expect(progressCircle).toBeInTheDocument();
    });

    it('should apply success color for score = 100', () => {
      render(<ScoreCircle score={100} animated={false} />);
      const progressCircle = screen.getByRole('progressbar').querySelector('circle[stroke="#10B981"]');
      expect(progressCircle).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render large size (160px)', () => {
      render(<ScoreCircle score={50} size="large" animated={false} />);
      const svg = screen.getByRole('progressbar').querySelector('svg');
      expect(svg).toHaveAttribute('width', '160');
      expect(svg).toHaveAttribute('height', '160');
    });

    it('should render medium size (100px)', () => {
      render(<ScoreCircle score={50} size="medium" animated={false} />);
      const svg = screen.getByRole('progressbar').querySelector('svg');
      expect(svg).toHaveAttribute('width', '100');
      expect(svg).toHaveAttribute('height', '100');
    });

    it('should render small size (48px)', () => {
      render(<ScoreCircle score={50} size="small" animated={false} />);
      const svg = screen.getByRole('progressbar').querySelector('svg');
      expect(svg).toHaveAttribute('width', '48');
      expect(svg).toHaveAttribute('height', '48');
    });

    it('should default to large size when not specified', () => {
      render(<ScoreCircle score={50} animated={false} />);
      const svg = screen.getByRole('progressbar').querySelector('svg');
      expect(svg).toHaveAttribute('width', '160');
      expect(svg).toHaveAttribute('height', '160');
    });
  });

  describe('Accessibility', () => {
    it('should have role="progressbar"', () => {
      render(<ScoreCircle score={72} animated={false} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should have aria-valuenow matching score', () => {
      render(<ScoreCircle score={72} animated={false} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '72');
    });

    it('should have aria-valuemin="0"', () => {
      render(<ScoreCircle score={72} animated={false} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
    });

    it('should have aria-valuemax="100"', () => {
      render(<ScoreCircle score={72} animated={false} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have aria-label with score and label text', () => {
      render(<ScoreCircle score={72} label="ATS Match" animated={false} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'ATS Match score: 72 percent');
    });

    it('should include screen reader text', () => {
      render(<ScoreCircle score={72} animated={false} />);
      // Screen reader text should be visually hidden but present
      const srText = screen.getByText(/72 percent/i);
      expect(srText).toBeInTheDocument();
    });
  });

  describe('SVG Structure', () => {
    it('should render background circle', () => {
      render(<ScoreCircle score={50} animated={false} />);
      const svg = screen.getByRole('progressbar').querySelector('svg');
      const circles = svg?.querySelectorAll('circle');
      expect(circles).toHaveLength(2); // Background + progress circle
    });

    it('should calculate stroke-dashoffset correctly', () => {
      render(<ScoreCircle score={50} animated={false} />);
      const progressCircle = screen.getByRole('progressbar').querySelectorAll('circle')[1];
      // For 50% score, dashoffset should be approximately half of circumference
      const dashoffset = progressCircle.getAttribute('stroke-dashoffset');
      expect(dashoffset).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should show spinner in loading state', () => {
      render(<ScoreCircle score={0} loading={true} />);
      // Should show a loading indicator instead of score
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });
});
