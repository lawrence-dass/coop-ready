/**
 * Unit tests for SuggestionCard component
 * Story 6.5: Implement Suggestion Display UI
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SuggestionCard } from '@/components/shared/SuggestionCard';

describe('SuggestionCard', () => {
  it('should render original and suggested text', () => {
    render(
      <SuggestionCard
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
