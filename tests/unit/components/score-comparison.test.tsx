/**
 * Component Tests for ScoreComparison
 * Story 11.3: Implement Score Comparison
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreComparison } from '@/components/shared/ScoreComparison';
import type { AllSuggestions } from '@/lib/utils/scoreCalculation';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
} from '@/types/suggestions';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockSummarySuggestion: SummarySuggestion = {
  original: 'Original summary',
  suggested: 'Optimized summary',
  ats_keywords_added: ['keyword1'],
  ai_tell_phrases_rewritten: [],
  point_value: 5,
};

const mockSkillsSuggestion: SkillsSuggestion = {
  original: 'Original skills',
  existing_skills: ['Skill A'],
  matched_keywords: ['Skill A'],
  missing_but_relevant: [],
  skill_additions: ['Skill B'],
  skill_removals: [],
  summary: 'Skills analysis',
  total_point_value: 12,
};

const mockExperienceSuggestion: ExperienceSuggestion = {
  original: 'Original experience',
  experience_entries: [
    {
      company: 'Company A',
      role: 'Engineer',
      dates: '2020-2023',
      original_bullets: ['Original bullet'],
      suggested_bullets: [
        {
          original: 'Original bullet',
          suggested: 'Optimized bullet',
          metrics_added: ['30%'],
          keywords_incorporated: ['keyword'],
          point_value: 6,
        },
      ],
    },
  ],
  summary: 'Experience analysis',
  total_point_value: 18,
};

// ============================================================================
// TESTS
// ============================================================================

describe('ScoreComparison', () => {
  it('should render original and projected scores', () => {
    const suggestions: AllSuggestions = {
      summary: mockSummarySuggestion,
      skills: mockSkillsSuggestion,
      experience: mockExperienceSuggestion,
    };

    render(<ScoreComparison originalScore={72} suggestions={suggestions} />);

    // Check original score
    expect(screen.getByTestId('original-score')).toHaveTextContent('72');

    // Check projected score (72 + 5 + 12 + 18 = 107, capped at 100)
    expect(screen.getByTestId('projected-score')).toHaveTextContent('100');
  });

  it('should display delta prominently', () => {
    const suggestions: AllSuggestions = {
      summary: mockSummarySuggestion,
      skills: mockSkillsSuggestion,
      experience: mockExperienceSuggestion,
    };

    render(<ScoreComparison originalScore={72} suggestions={suggestions} />);

    // Check delta (100 - 72 = 28)
    const delta = screen.getByTestId('score-delta');
    expect(delta).toHaveTextContent('+28');
    expect(delta).toHaveClass('text-green-600');
  });

  it('should show score breakdown by category', () => {
    const suggestions: AllSuggestions = {
      summary: mockSummarySuggestion,
      skills: mockSkillsSuggestion,
      experience: mockExperienceSuggestion,
    };

    render(<ScoreComparison originalScore={72} suggestions={suggestions} />);

    // Check category breakdown
    expect(screen.getByTestId('category-summary')).toHaveTextContent('+5');
    expect(screen.getByTestId('category-skills')).toHaveTextContent('+12');
    expect(screen.getByTestId('category-experience')).toHaveTextContent('+18');
  });

  it('should handle edge case: no original score improvement', () => {
    const suggestions: AllSuggestions = {
      summary: null,
      skills: null,
      experience: null,
    };

    render(<ScoreComparison originalScore={85} suggestions={suggestions} />);

    // Should show same score for both
    expect(screen.getByTestId('original-score')).toHaveTextContent('85');
    expect(screen.getByTestId('projected-score')).toHaveTextContent('85');

    // Should not show improvement indicator
    expect(screen.queryByText('point improvement')).not.toBeInTheDocument();
  });

  it('should handle edge case: only one category has suggestions', () => {
    const suggestions: AllSuggestions = {
      summary: mockSummarySuggestion,
      skills: null,
      experience: null,
    };

    render(<ScoreComparison originalScore={70} suggestions={suggestions} />);

    // Original score
    expect(screen.getByTestId('original-score')).toHaveTextContent('70');

    // Projected score (70 + 5 = 75)
    expect(screen.getByTestId('projected-score')).toHaveTextContent('75');

    // Delta (+5)
    expect(screen.getByTestId('score-delta')).toHaveTextContent('+5');

    // Only summary breakdown should appear
    expect(screen.getByTestId('category-summary')).toBeInTheDocument();
    expect(screen.queryByTestId('category-skills')).not.toBeInTheDocument();
    expect(screen.queryByTestId('category-experience')).not.toBeInTheDocument();
  });

  it('should handle suggestions with undefined point values', () => {
    const suggestions: AllSuggestions = {
      summary: { ...mockSummarySuggestion, point_value: undefined },
      skills: { ...mockSkillsSuggestion, total_point_value: undefined },
      experience: { ...mockExperienceSuggestion, total_point_value: undefined },
    };

    render(<ScoreComparison originalScore={70} suggestions={suggestions} />);

    // Should still render without crashing
    expect(screen.getByTestId('score-comparison')).toBeInTheDocument();
  });

  it('should apply responsive classes', () => {
    const suggestions: AllSuggestions = {
      summary: mockSummarySuggestion,
      skills: null,
      experience: null,
    };

    const { container } = render(
      <ScoreComparison originalScore={70} suggestions={suggestions} />
    );

    // Check for responsive grid classes
    const gridContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should handle very high original scores near cap', () => {
    const suggestions: AllSuggestions = {
      summary: { ...mockSummarySuggestion, point_value: 2 },
      skills: null,
      experience: null,
    };

    render(<ScoreComparison originalScore={99} suggestions={suggestions} />);

    // Should cap at 100
    expect(screen.getByTestId('projected-score')).toHaveTextContent('100');
    expect(screen.getByTestId('score-delta')).toHaveTextContent('+1');
  });

  it('should show breakdown only when there is improvement', () => {
    const noImprovementSuggestions: AllSuggestions = {
      summary: null,
      skills: null,
      experience: null,
    };

    const { rerender } = render(
      <ScoreComparison originalScore={75} suggestions={noImprovementSuggestions} />
    );

    // Should not show breakdown section
    expect(screen.queryByText('Improvement Breakdown by Section')).not.toBeInTheDocument();

    // Now with improvement
    const withImprovementSuggestions: AllSuggestions = {
      summary: mockSummarySuggestion,
      skills: null,
      experience: null,
    };

    rerender(
      <ScoreComparison originalScore={75} suggestions={withImprovementSuggestions} />
    );

    // Should show breakdown section
    expect(screen.getByText('Improvement Breakdown by Section')).toBeInTheDocument();
  });

  it('should use correct color coding for improved score', () => {
    const suggestions: AllSuggestions = {
      summary: mockSummarySuggestion,
      skills: null,
      experience: null,
    };

    render(<ScoreComparison originalScore={70} suggestions={suggestions} />);

    // Projected score should be green (improvement)
    const projectedScore = screen.getByTestId('projected-score');
    expect(projectedScore).toHaveClass('text-green-600');

    // Original score should be gray (neutral)
    const originalScore = screen.getByTestId('original-score');
    expect(originalScore).toHaveClass('text-gray-700');
  });

  it('should render accessibility labels', () => {
    const suggestions: AllSuggestions = {
      summary: mockSummarySuggestion,
      skills: null,
      experience: null,
    };

    render(<ScoreComparison originalScore={70} suggestions={suggestions} />);

    // Check for descriptive labels
    expect(screen.getByText('Original Score')).toBeInTheDocument();
    expect(screen.getByText('Projected Score')).toBeInTheDocument();
    expect(screen.getByText('point improvement')).toBeInTheDocument();
  });
});
