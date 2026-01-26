/**
 * Unit tests for SuggestionSection component
 * Story 6.5: Implement Suggestion Display UI
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SuggestionSection } from '@/components/shared/SuggestionSection';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
} from '@/types/suggestions';

describe('SuggestionSection', () => {
  const summarySuggestion: SummarySuggestion = {
    original: 'Junior developer',
    suggested: 'Results-driven software engineer',
    ats_keywords_added: ['software engineer', 'results-driven'],
    ai_tell_phrases_rewritten: [],
  };

  const skillsSuggestion: SkillsSuggestion = {
    original: 'JavaScript, HTML, CSS',
    existing_skills: ['JavaScript', 'HTML', 'CSS'],
    matched_keywords: ['JavaScript'],
    missing_but_relevant: [],
    skill_additions: ['React', 'TypeScript'],
    skill_removals: [],
    summary: 'Consider adding React and TypeScript',
  };

  const experienceSuggestion: ExperienceSuggestion = {
    original: 'Worked on web projects',
    experience_entries: [
      {
        company: 'Tech Corp',
        role: 'Developer',
        dates: '2020 - 2023',
        original_bullets: ['Built applications'],
        suggested_bullets: [
          {
            original: 'Built applications',
            suggested: 'Built 5+ enterprise applications using React',
            metrics_added: ['5+'],
            keywords_incorporated: ['enterprise', 'React'],
          },
        ],
      },
    ],
    summary: 'Added metrics and keywords',
  };

  it('should render summary section with label', () => {
    render(
      <SuggestionSection
        section="summary"
        suggestion={summarySuggestion}
        sectionLabel="Summary"
      />
    );

    expect(screen.getByText('Summary')).toBeInTheDocument();
    // Text appears in both desktop grid and mobile tabs
    expect(screen.getAllByText(/Junior developer/i).length).toBeGreaterThanOrEqual(1);
  });

  it('should render skills section with label', () => {
    render(
      <SuggestionSection
        section="skills"
        suggestion={skillsSuggestion}
        sectionLabel="Skills"
      />
    );

    expect(screen.getByText('Skills')).toBeInTheDocument();
    // Text appears in both desktop grid and mobile tabs
    expect(screen.getAllByText(/JavaScript, HTML, CSS/i).length).toBeGreaterThanOrEqual(1);
  });

  it('should render experience section with label', () => {
    render(
      <SuggestionSection
        section="experience"
        suggestion={experienceSuggestion}
        sectionLabel="Experience"
      />
    );

    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText(/Tech Corp/i)).toBeInTheDocument();
  });

  it('should display loading state when loading prop is true', () => {
    render(
      <SuggestionSection
        section="summary"
        suggestion={null}
        sectionLabel="Summary"
        loading={true}
      />
    );

    expect(screen.getByText(/Generating/i)).toBeInTheDocument();
  });

  it('should not render when suggestion is null and not loading', () => {
    const { container } = render(
      <SuggestionSection
        section="summary"
        suggestion={null}
        sectionLabel="Summary"
        loading={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render section icon when provided', () => {
    render(
      <SuggestionSection
        section="summary"
        suggestion={summarySuggestion}
        sectionLabel="Summary"
        sectionIcon={<span data-testid="test-icon">Icon</span>}
      />
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should stack cards vertically', () => {
    const { container } = render(
      <SuggestionSection
        section="skills"
        suggestion={skillsSuggestion}
        sectionLabel="Skills"
      />
    );

    const cardsContainer = container.querySelector('.space-y-4');
    expect(cardsContainer).toBeInTheDocument();
  });
});
