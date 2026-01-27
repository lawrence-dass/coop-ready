/**
 * Unit tests for SuggestionCard component
 * Story 6.5: Implement Suggestion Display UI
 * Story 7.4: Updated for feedback buttons
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SuggestionCard } from '@/components/shared/SuggestionCard';

// Mock the store
vi.mock('@/store/useOptimizationStore', () => ({
  useOptimizationStore: vi.fn((selector) => {
    const state = {
      getFeedbackForSuggestion: () => null,
      recordSuggestionFeedback: vi.fn().mockResolvedValue(undefined),
    };
    return selector ? selector(state) : state;
  }),
}));

describe('SuggestionCard', () => {
  it('should render original and suggested text', () => {
    render(
      <SuggestionCard
        suggestionId="sug_summary_0"
        original="Junior developer with 2 years experience"
        suggested="Results-driven software engineer with 2+ years of experience delivering scalable web applications"
        sectionType="summary"
      />
    );

    // Text appears in both desktop (grid) and mobile (tabs) views
    expect(screen.getAllByText(/Junior developer with 2 years experience/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Results-driven software engineer/i).length).toBeGreaterThanOrEqual(1);
  });

  it('should display point badge when points provided', () => {
    render(
      <SuggestionCard
        suggestionId="sug_exp_0"
        original="Worked on projects"
        suggested="Led development of 5+ enterprise applications"
        points={8}
        sectionType="experience"
      />
    );

    expect(screen.getByText('+8 pts')).toBeInTheDocument();
  });

  it('should not display point badge when points not provided', () => {
    render(
      <SuggestionCard
        suggestionId="sug_exp_1"
        original="Worked on projects"
        suggested="Led development of enterprise applications"
        sectionType="experience"
      />
    );

    expect(screen.queryByText(/pts/i)).not.toBeInTheDocument();
  });

  it('should render with section type data attribute', () => {
    const { container } = render(
      <SuggestionCard
        suggestionId="sug_summary_1"
        original="Test original"
        suggested="Test suggested"
        sectionType="summary"
      />
    );

    expect(container.firstChild).toHaveAttribute('data-section', 'summary');
  });

  it('should have aria-label for accessibility', () => {
    render(
      <SuggestionCard
        suggestionId="sug_exp_2"
        original="Test"
        suggested="Test improved"
        sectionType="experience"
      />
    );

    expect(screen.getByLabelText('experience suggestion')).toBeInTheDocument();
  });

  it('should display keywords when provided', () => {
    render(
      <SuggestionCard
        suggestionId="sug_skills_0"
        original="Developer with experience"
        suggested="Full-stack developer with cloud computing experience"
        keywords={['full-stack', 'cloud computing']}
        sectionType="skills"
      />
    );

    expect(screen.getByText('full-stack')).toBeInTheDocument();
    expect(screen.getByText('cloud computing')).toBeInTheDocument();
  });

  it('should display metrics when provided', () => {
    render(
      <SuggestionCard
        suggestionId="sug_exp_3"
        original="Improved performance"
        suggested="Improved application performance by 30%"
        metrics={['30%']}
        sectionType="experience"
      />
    );

    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('should render desktop two-column layout', () => {
    const { container } = render(
      <SuggestionCard
        suggestionId="sug_summary_2"
        original="Test"
        suggested="Test improved"
        sectionType="summary"
      />
    );

    // Desktop layout uses hidden md:grid
    const desktopGrid = container.querySelector('.hidden.md\\:grid');
    expect(desktopGrid).toBeInTheDocument();
  });

  it('should render mobile tabs layout', () => {
    const { container } = render(
      <SuggestionCard
        suggestionId="sug_summary_3"
        original="Test"
        suggested="Test improved"
        sectionType="summary"
      />
    );

    // Mobile layout uses md:hidden wrapper with tabs
    const mobileWrapper = container.querySelector('.md\\:hidden');
    expect(mobileWrapper).toBeInTheDocument();

    // Should have Original and Suggested tab triggers
    const tabTriggers = screen.getAllByRole('tab');
    expect(tabTriggers).toHaveLength(2);
    expect(tabTriggers[0]).toHaveTextContent('Original');
    expect(tabTriggers[1]).toHaveTextContent('Suggested');
  });
});
