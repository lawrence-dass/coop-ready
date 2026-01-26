// Story 5.4: Unit tests for MissingKeywordItem component
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MissingKeywordItem } from '@/components/shared/MissingKeywordItem';
import { ExtractedKeyword, KeywordCategory } from '@/types/analysis';

describe('MissingKeywordItem', () => {
  const createKeyword = (importance: 'high' | 'medium' | 'low', keyword = 'Test'): ExtractedKeyword => ({
    keyword,
    category: KeywordCategory.SKILLS,
    importance,
  });

  describe('basic rendering', () => {
    it('should display keyword name', () => {
      const keyword = createKeyword('high', 'Python');

      render(<MissingKeywordItem keyword={keyword} />);

      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    it('should display importance level', () => {
      const keyword = createKeyword('medium');

      render(<MissingKeywordItem keyword={keyword} />);

      expect(screen.getByText('medium priority')).toBeInTheDocument();
    });

    it('should apply correct styling for high priority', () => {
      const keyword = createKeyword('high');

      const { container } = render(<MissingKeywordItem keyword={keyword} />);

      const outerDiv = container.querySelector('.border-red-200');
      expect(outerDiv).toBeInTheDocument();
      expect(outerDiv).toHaveClass('bg-red-50');
    });

    it('should apply correct styling for medium priority', () => {
      const keyword = createKeyword('medium');

      const { container } = render(<MissingKeywordItem keyword={keyword} />);

      const outerDiv = container.querySelector('.border-amber-200');
      expect(outerDiv).toBeInTheDocument();
      expect(outerDiv).toHaveClass('bg-amber-50');
    });

    it('should apply correct styling for low priority', () => {
      const keyword = createKeyword('low');

      const { container } = render(<MissingKeywordItem keyword={keyword} />);

      const outerDiv = container.querySelector('.border-yellow-200');
      expect(outerDiv).toBeInTheDocument();
      expect(outerDiv).toHaveClass('bg-yellow-50');
    });
  });

  describe('expandable details', () => {
    it('should show "Show tips" button by default', () => {
      const keyword = createKeyword('high');

      render(<MissingKeywordItem keyword={keyword} />);

      expect(screen.getByText('Show tips')).toBeInTheDocument();
    });

    it('should not show guidance details by default', () => {
      const keyword = createKeyword('high');

      render(<MissingKeywordItem keyword={keyword} />);

      expect(screen.queryByText(/Why it matters:/)).not.toBeInTheDocument();
    });

    it('should expand and show guidance when "Show tips" is clicked', () => {
      const keyword = createKeyword('high');

      render(<MissingKeywordItem keyword={keyword} />);

      const showTipsButton = screen.getByText('Show tips');
      fireEvent.click(showTipsButton);

      expect(screen.getByText('Why it matters:')).toBeInTheDocument();
      expect(screen.getByText('Where to add:')).toBeInTheDocument();
      expect(screen.getByText('Example:')).toBeInTheDocument();
    });

    it('should change button text to "Hide details" when expanded', () => {
      const keyword = createKeyword('high');

      render(<MissingKeywordItem keyword={keyword} />);

      const showTipsButton = screen.getByText('Show tips');
      fireEvent.click(showTipsButton);

      expect(screen.getByText('Hide details')).toBeInTheDocument();
      expect(screen.queryByText('Show tips')).not.toBeInTheDocument();
    });

    it('should collapse when "Hide details" is clicked', () => {
      const keyword = createKeyword('high');

      render(<MissingKeywordItem keyword={keyword} />);

      const showTipsButton = screen.getByText('Show tips');
      fireEvent.click(showTipsButton);
      expect(screen.getByText('Why it matters:')).toBeInTheDocument();

      const hideDetailsButton = screen.getByText('Hide details');
      fireEvent.click(hideDetailsButton);

      expect(screen.queryByText('Why it matters:')).not.toBeInTheDocument();
      expect(screen.getByText('Show tips')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have aria-expanded attribute', () => {
      const keyword = createKeyword('high');

      render(<MissingKeywordItem keyword={keyword} />);

      const button = screen.getByText('Show tips');
      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
