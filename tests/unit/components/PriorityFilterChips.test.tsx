// Story 5.4: Unit tests for PriorityFilterChips component
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PriorityFilterChips } from '@/components/shared/PriorityFilterChips';
import { ExtractedKeyword, KeywordCategory } from '@/types/analysis';

describe('PriorityFilterChips', () => {
  const createKeyword = (importance: 'high' | 'medium' | 'low'): ExtractedKeyword => ({
    keyword: `Test ${importance}`,
    category: KeywordCategory.SKILLS,
    importance,
  });

  describe('filter options and counts', () => {
    it('should display all filter options', () => {
      const missing: ExtractedKeyword[] = [
        createKeyword('high'),
        createKeyword('medium'),
        createKeyword('low'),
      ];

      render(<PriorityFilterChips missing={missing} activeFilter="all" onFilterChange={() => {}} />);

      expect(screen.getByText(/All/)).toBeInTheDocument();
      expect(screen.getByText(/High Priority/)).toBeInTheDocument();
      expect(screen.getByText(/Medium Priority/)).toBeInTheDocument();
      expect(screen.getByText(/Low Priority/)).toBeInTheDocument();
    });

    it('should display correct counts for each filter', () => {
      const missing: ExtractedKeyword[] = [
        createKeyword('high'),
        createKeyword('high'),
        createKeyword('medium'),
        createKeyword('low'),
      ];

      render(<PriorityFilterChips missing={missing} activeFilter="all" onFilterChange={() => {}} />);

      expect(screen.getByText(/All.*4/)).toBeInTheDocument();
      expect(screen.getByText(/High Priority.*2/)).toBeInTheDocument();
      expect(screen.getByText(/Medium Priority.*1/)).toBeInTheDocument();
      expect(screen.getByText(/Low Priority.*1/)).toBeInTheDocument();
    });
  });

  describe('active filter highlighting', () => {
    it('should highlight active filter', () => {
      const missing: ExtractedKeyword[] = [createKeyword('high')];
      const { rerender } = render(
        <PriorityFilterChips missing={missing} activeFilter="all" onFilterChange={() => {}} />
      );

      const allButton = screen.getByText(/All/);
      expect(allButton).toHaveClass('bg-blue-600');

      rerender(
        <PriorityFilterChips missing={missing} activeFilter="high" onFilterChange={() => {}} />
      );

      const highButton = screen.getByText(/High Priority/);
      expect(highButton).toHaveClass('bg-blue-600');
    });
  });

  describe('filter interactions', () => {
    it('should call onFilterChange when filter is clicked', () => {
      const missing: ExtractedKeyword[] = [createKeyword('high')];
      const handleFilterChange = vi.fn();

      render(<PriorityFilterChips missing={missing} activeFilter="all" onFilterChange={handleFilterChange} />);

      const highButton = screen.getByText(/High Priority/);
      fireEvent.click(highButton);

      expect(handleFilterChange).toHaveBeenCalledWith('high');
    });

    it('should call onFilterChange with correct filter value for each button', () => {
      const missing: ExtractedKeyword[] = [createKeyword('high')];
      const handleFilterChange = vi.fn();

      render(<PriorityFilterChips missing={missing} activeFilter="all" onFilterChange={handleFilterChange} />);

      fireEvent.click(screen.getByText(/All/));
      expect(handleFilterChange).toHaveBeenCalledWith('all');

      fireEvent.click(screen.getByText(/Medium Priority/));
      expect(handleFilterChange).toHaveBeenCalledWith('medium');

      fireEvent.click(screen.getByText(/Low Priority/));
      expect(handleFilterChange).toHaveBeenCalledWith('low');
    });
  });

  describe('empty state', () => {
    it('should handle empty missing array', () => {
      render(<PriorityFilterChips missing={[]} activeFilter="all" onFilterChange={() => {}} />);

      expect(screen.getByText(/All.*0/)).toBeInTheDocument();
      expect(screen.getByText(/High Priority.*0/)).toBeInTheDocument();
      expect(screen.getByText(/Medium Priority.*0/)).toBeInTheDocument();
      expect(screen.getByText(/Low Priority.*0/)).toBeInTheDocument();
    });
  });
});
