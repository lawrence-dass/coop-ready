// Story 5.4: Unit tests for GapSummaryCard component
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GapSummaryCard } from '@/components/shared/GapSummaryCard';
import { ExtractedKeyword, KeywordCategory } from '@/types/analysis';

describe('GapSummaryCard', () => {
  const createKeyword = (importance: 'high' | 'medium' | 'low'): ExtractedKeyword => ({
    keyword: `Test ${importance}`,
    category: KeywordCategory.SKILLS,
    importance,
  });

  describe('priority counts', () => {
    it('should display correct high priority count', () => {
      const missing: ExtractedKeyword[] = [
        createKeyword('high'),
        createKeyword('high'),
        createKeyword('medium'),
      ];

      render(<GapSummaryCard missing={missing} />);

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('High Priority')).toBeInTheDocument();
    });

    it('should display correct medium priority count', () => {
      const missing: ExtractedKeyword[] = [
        createKeyword('high'),
        createKeyword('medium'),
        createKeyword('medium'),
        createKeyword('medium'),
      ];

      render(<GapSummaryCard missing={missing} />);

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Medium Priority')).toBeInTheDocument();
    });

    it('should display correct low priority count', () => {
      const missing: ExtractedKeyword[] = [
        createKeyword('low'),
        createKeyword('low'),
      ];

      render(<GapSummaryCard missing={missing} />);

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Low Priority')).toBeInTheDocument();
    });

    it('should display zero counts when no keywords of that priority', () => {
      const missing: ExtractedKeyword[] = [
        createKeyword('high'),
      ];

      render(<GapSummaryCard missing={missing} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      // Check for medium and low priority being 0
      const zeroCounts = screen.getAllByText('0');
      expect(zeroCounts).toHaveLength(2); // medium and low should be 0
    });
  });

  describe('quick wins section', () => {
    it('should show top 3 keywords', () => {
      const missing: ExtractedKeyword[] = [
        { keyword: 'Python', category: KeywordCategory.SKILLS, importance: 'high' },
        { keyword: 'React', category: KeywordCategory.TECHNOLOGIES, importance: 'high' },
        { keyword: 'TypeScript', category: KeywordCategory.TECHNOLOGIES, importance: 'medium' },
        { keyword: 'AWS', category: KeywordCategory.TECHNOLOGIES, importance: 'medium' },
        { keyword: 'Docker', category: KeywordCategory.TECHNOLOGIES, importance: 'low' },
      ];

      render(<GapSummaryCard missing={missing} />);

      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      // Docker should not appear (only top 3)
      expect(screen.queryByText('Docker')).not.toBeInTheDocument();
    });

    it('should prioritize high importance keywords first', () => {
      const missing: ExtractedKeyword[] = [
        { keyword: 'Low1', category: KeywordCategory.SKILLS, importance: 'low' },
        { keyword: 'High1', category: KeywordCategory.SKILLS, importance: 'high' },
        { keyword: 'Medium1', category: KeywordCategory.SKILLS, importance: 'medium' },
        { keyword: 'High2', category: KeywordCategory.SKILLS, importance: 'high' },
      ];

      render(<GapSummaryCard missing={missing} />);

      // Both high priority should appear in top 3
      expect(screen.getByText('High1')).toBeInTheDocument();
      expect(screen.getByText('High2')).toBeInTheDocument();
    });

    it('should not show quick wins section when no keywords', () => {
      render(<GapSummaryCard missing={[]} />);

      expect(screen.queryByText(/Quick Wins/i)).not.toBeInTheDocument();
    });
  });

  describe('rendering', () => {
    it('should render title and description', () => {
      const missing: ExtractedKeyword[] = [createKeyword('high')];

      render(<GapSummaryCard missing={missing} />);

      expect(screen.getByText('Gap Analysis Summary')).toBeInTheDocument();
      // Singular form when 1 keyword
      expect(screen.getByText(/1 keyword from the job description is missing/i)).toBeInTheDocument();
    });

    it('should handle empty missing array', () => {
      render(<GapSummaryCard missing={[]} />);

      expect(screen.getByText('Gap Analysis Summary')).toBeInTheDocument();
      // Plural form when 0 keywords
      expect(screen.getByText(/0 keywords from the job description are missing/i)).toBeInTheDocument();
    });
  });
});
