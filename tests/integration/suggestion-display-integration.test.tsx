/**
 * Integration tests for SuggestionDisplay component
 * Story 6.5: Implement Suggestion Display UI
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { SuggestionDisplay } from '@/components/shared/SuggestionDisplay';
import { useOptimizationStore } from '@/store/useOptimizationStore';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
} from '@/types/suggestions';

describe('SuggestionDisplay Integration', () => {
  it('should render complete suggestion display with all sections', () => {
    // Setup store with test data
    const { setState } = useOptimizationStore;

    const summarySuggestion: SummarySuggestion = {
      original: 'Junior developer with 2 years of experience',
      suggested:
        'Results-driven software engineer with 2+ years of experience delivering scalable web applications',
      ats_keywords_added: ['software engineer', 'scalable', 'web applications'],
      ai_tell_phrases_rewritten: [],
    };

    const skillsSuggestion: SkillsSuggestion = {
      original: 'JavaScript, HTML, CSS',
      existing_skills: ['JavaScript', 'HTML', 'CSS'],
      matched_keywords: ['JavaScript'],
      missing_but_relevant: [],
      skill_additions: ['React', 'TypeScript', 'Node.js'],
      skill_removals: [],
      summary: 'Consider adding React, TypeScript, and Node.js to strengthen your profile',
    };

    const experienceSuggestion: ExperienceSuggestion = {
      original: 'Worked on various web development projects',
      experience_entries: [
        {
          company: 'Tech Corp',
          role: 'Software Developer',
          dates: '2020 - 2023',
          original_bullets: [
            'Built web applications',
            'Worked with team on projects',
          ],
          suggested_bullets: [
            {
              original: 'Built web applications',
              suggested:
                'Developed 5+ enterprise web applications using React and Node.js, serving 10K+ users',
              metrics_added: ['5+', '10K+'],
              keywords_incorporated: ['enterprise', 'React', 'Node.js'],
            },
            {
              original: 'Worked with team on projects',
              suggested:
                'Collaborated with cross-functional team of 8 engineers to deliver mission-critical features',
              metrics_added: ['8'],
              keywords_incorporated: ['cross-functional', 'mission-critical'],
            },
          ],
        },
      ],
      summary: 'Added quantifiable metrics and relevant keywords to experience bullets',
    };

    setState({
      summarySuggestion,
      skillsSuggestion,
      experienceSuggestion,
    });

    render(<SuggestionDisplay />);

    // Verify all sections are rendered
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();

    // Verify summary content (text appears in both desktop grid and mobile tabs)
    expect(
      screen.getAllByText(/Junior developer with 2 years of experience/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/Results-driven software engineer/i).length
    ).toBeGreaterThanOrEqual(1);

    // Verify skills content
    expect(screen.getAllByText(/JavaScript, HTML, CSS/i).length).toBeGreaterThanOrEqual(1);

    // Verify experience content - use more flexible matcher
    expect(screen.getByText(/Tech Corp/i)).toBeInTheDocument();
    expect(screen.getByText(/Software Developer/i)).toBeInTheDocument();
  });

  it('should handle partial suggestions (only summary)', () => {
    const { setState } = useOptimizationStore;

    const summarySuggestion: SummarySuggestion = {
      original: 'Developer with experience',
      suggested: 'Experienced full-stack developer',
      ats_keywords_added: ['full-stack'],
      ai_tell_phrases_rewritten: [],
    };

    setState({
      summarySuggestion,
      skillsSuggestion: null,
      experienceSuggestion: null,
    });

    render(<SuggestionDisplay />);

    // Only summary should render
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.queryByText('Skills')).not.toBeInTheDocument();
    expect(screen.queryByText('Experience')).not.toBeInTheDocument();
  });

  it('should display keywords as badges in suggestion cards', () => {
    const { setState } = useOptimizationStore;

    const summarySuggestion: SummarySuggestion = {
      original: 'Developer',
      suggested: 'Full-stack developer',
      ats_keywords_added: ['full-stack', 'React', 'Node.js'],
      ai_tell_phrases_rewritten: [],
    };

    setState({
      summarySuggestion,
      skillsSuggestion: null,
      experienceSuggestion: null,
    });

    render(<SuggestionDisplay />);

    // Verify keywords are displayed
    expect(screen.getByText('full-stack')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
  });

  it('should display metrics badges in experience suggestions', () => {
    const { setState } = useOptimizationStore;

    const experienceSuggestion: ExperienceSuggestion = {
      original: 'Improved performance',
      experience_entries: [
        {
          company: 'Tech Corp',
          role: 'Developer',
          dates: '2020 - 2023',
          original_bullets: ['Improved system performance'],
          suggested_bullets: [
            {
              original: 'Improved system performance',
              suggested: 'Improved system performance by 40% through optimization',
              metrics_added: ['40%'],
              keywords_incorporated: ['optimization'],
            },
          ],
        },
      ],
      summary: 'Added metrics',
    };

    setState({
      summarySuggestion: null,
      skillsSuggestion: null,
      experienceSuggestion,
    });

    render(<SuggestionDisplay />);

    // Verify metrics are displayed
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('should render empty state when no suggestions', () => {
    const { setState } = useOptimizationStore;

    setState({
      summarySuggestion: null,
      skillsSuggestion: null,
      experienceSuggestion: null,
    });

    render(<SuggestionDisplay />);

    expect(screen.getByText(/No suggestions available yet/i)).toBeInTheDocument();
  });

  it('should maintain vertical spacing between sections', () => {
    const { setState } = useOptimizationStore;

    const summarySuggestion: SummarySuggestion = {
      original: 'Test',
      suggested: 'Test improved',
      ats_keywords_added: [],
      ai_tell_phrases_rewritten: [],
    };

    const skillsSuggestion: SkillsSuggestion = {
      original: 'Skills test',
      existing_skills: ['JavaScript'],
      matched_keywords: ['JavaScript'],
      missing_but_relevant: [],
      skill_additions: [],
      skill_removals: [],
      summary: 'Test summary',
    };

    setState({
      summarySuggestion,
      skillsSuggestion,
      experienceSuggestion: null,
    });

    const { container } = render(<SuggestionDisplay />);

    // Verify vertical spacing class
    const mainContainer = container.querySelector('.space-y-8');
    expect(mainContainer).toBeInTheDocument();
  });
});
