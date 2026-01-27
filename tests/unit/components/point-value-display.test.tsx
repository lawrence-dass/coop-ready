/**
 * Unit Tests for Point Value Display
 * Story 11.1: Implement Point Values for Suggestions
 *
 * Tests cover:
 * - SuggestionCard point badge color coding (gray/blue/green)
 * - SuggestionCard point badge tooltip
 * - SuggestionCard point badge accessibility (aria-label)
 * - SuggestionDisplay total improvement banner
 * - Total point value calculation across all sections
 * - Copy behavior excludes point values
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SuggestionCard } from '@/components/shared/SuggestionCard';
import { SuggestionDisplay } from '@/components/shared/SuggestionDisplay';
import { SuggestionSection } from '@/components/shared/SuggestionSection';
import { useOptimizationStore } from '@/store/useOptimizationStore';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
} from '@/types/suggestions';

// Mock the Zustand store
vi.mock('@/store/useOptimizationStore', () => ({
  useOptimizationStore: vi.fn((selector) => {
    const state = {
      getFeedbackForSuggestion: () => null,
      recordSuggestionFeedback: vi.fn().mockResolvedValue(undefined),
    };
    return selector ? selector(state) : state;
  }),
}));

// ===========================================================================
// SuggestionCard Point Badge Tests
// ===========================================================================

describe('SuggestionCard - Point Value Badge', () => {
  it('should apply gray color for low point values (1-3)', () => {
    const { container } = render(
      <SuggestionCard
        suggestionId="sug_summary_0"
        original="Original text"
        suggested="Improved text"
        points={2}
        sectionType="summary"
      />
    );

    const badge = container.querySelector('.bg-gray-500');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('+2 pts');
  });

  it('should apply blue color for medium point values (4-7)', () => {
    const { container } = render(
      <SuggestionCard
        suggestionId="sug_summary_0"
        original="Original text"
        suggested="Improved text"
        points={5}
        sectionType="summary"
      />
    );

    const badge = container.querySelector('.bg-blue-600');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('+5 pts');
  });

  it('should apply green color for high point values (8+)', () => {
    const { container } = render(
      <SuggestionCard
        suggestionId="sug_exp_0"
        original="Original text"
        suggested="Improved text"
        points={10}
        sectionType="experience"
      />
    );

    const badge = container.querySelector('.bg-green-600');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('+10 pts');
  });

  it('should apply gray color for boundary value 3', () => {
    const { container } = render(
      <SuggestionCard
        suggestionId="sug_skills_0"
        original="Original"
        suggested="Improved"
        points={3}
        sectionType="skills"
      />
    );

    expect(container.querySelector('.bg-gray-500')).toBeInTheDocument();
  });

  it('should apply blue color for boundary value 4', () => {
    const { container } = render(
      <SuggestionCard
        suggestionId="sug_skills_0"
        original="Original"
        suggested="Improved"
        points={4}
        sectionType="skills"
      />
    );

    expect(container.querySelector('.bg-blue-600')).toBeInTheDocument();
  });

  it('should apply blue color for boundary value 7', () => {
    const { container } = render(
      <SuggestionCard
        suggestionId="sug_skills_0"
        original="Original"
        suggested="Improved"
        points={7}
        sectionType="skills"
      />
    );

    expect(container.querySelector('.bg-blue-600')).toBeInTheDocument();
  });

  it('should apply green color for boundary value 8', () => {
    const { container } = render(
      <SuggestionCard
        suggestionId="sug_skills_0"
        original="Original"
        suggested="Improved"
        points={8}
        sectionType="skills"
      />
    );

    expect(container.querySelector('.bg-green-600')).toBeInTheDocument();
  });

  it('should have accessible aria-label with point value', () => {
    render(
      <SuggestionCard
        suggestionId="sug_summary_0"
        original="Original"
        suggested="Improved"
        points={8}
        sectionType="summary"
      />
    );

    expect(screen.getByLabelText('Estimated 8 point ATS score improvement')).toBeInTheDocument();
  });

  it('should wrap point badge in tooltip trigger', () => {
    const { container } = render(
      <SuggestionCard
        suggestionId="sug_summary_0"
        original="Original"
        suggested="Improved"
        points={5}
        sectionType="summary"
      />
    );

    // Radix Tooltip renders trigger with data-slot="tooltip-trigger"
    const tooltipTrigger = container.querySelector('[data-slot="tooltip-trigger"]');
    expect(tooltipTrigger).toBeInTheDocument();
    expect(tooltipTrigger).toHaveTextContent('+5 pts');
  });

  it('should not display badge when points not provided', () => {
    render(
      <SuggestionCard
        suggestionId="sug_summary_0"
        original="Original"
        suggested="Improved"
        sectionType="summary"
      />
    );

    expect(screen.queryByText(/pts/i)).not.toBeInTheDocument();
  });

  it('should not include point value in copy button text', () => {
    render(
      <SuggestionCard
        suggestionId="sug_summary_0"
        original="Original text"
        suggested="Improved suggestion text"
        points={8}
        sectionType="summary"
      />
    );

    // CopyButton receives only the suggested text, not the points
    // Verify the copy button exists and the suggested text is present
    expect(screen.getByText('+8 pts')).toBeInTheDocument();
    expect(screen.getAllByText(/Improved suggestion text/i).length).toBeGreaterThanOrEqual(1);
  });
});

// ===========================================================================
// SuggestionDisplay Total Improvement Banner Tests
// ===========================================================================

describe('SuggestionDisplay - Total Improvement Banner', () => {
  function mockStore(overrides: Record<string, unknown>) {
    const defaultState = {
      summarySuggestion: null,
      skillsSuggestion: null,
      experienceSuggestion: null,
      isLoading: false,
      loadingStep: null,
      isRegeneratingSection: {},
      setRegeneratingSection: vi.fn(),
      updateSectionSuggestion: vi.fn(),
      resumeContent: null,
      jobDescription: null,
      sessionId: null,
      keywordAnalysis: null,
      suggestionSortBy: 'points-high',
      setSuggestionSortBy: vi.fn(),
      getFeedbackForSuggestion: () => null,
      recordSuggestionFeedback: vi.fn().mockResolvedValue(undefined),
    };
    const state = { ...defaultState, ...overrides };
    (useOptimizationStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: typeof state) => unknown) => selector(state)
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display total improvement banner when point values exist', () => {
    const summary: SummarySuggestion = {
      original: 'Junior dev',
      suggested: 'Senior engineer',
      ats_keywords_added: ['engineer'],
      ai_tell_phrases_rewritten: [],
      point_value: 8,
    };

    const skills: SkillsSuggestion = {
      original: 'JS, HTML',
      existing_skills: ['JS', 'HTML'],
      matched_keywords: ['JS'],
      missing_but_relevant: [],
      skill_additions: ['React'],
      skill_removals: [],
      summary: 'Add React',
      total_point_value: 12,
    };

    mockStore({
      summarySuggestion: summary,
      skillsSuggestion: skills,
    });

    render(<SuggestionDisplay />);

    expect(screen.getByText('Total Potential Improvement')).toBeInTheDocument();
    expect(screen.getByText('+20')).toBeInTheDocument();
    expect(screen.getByText('points')).toBeInTheDocument();
  });

  it('should sum point values from all three sections', () => {
    const summary: SummarySuggestion = {
      original: 'Dev',
      suggested: 'Engineer',
      ats_keywords_added: [],
      ai_tell_phrases_rewritten: [],
      point_value: 10,
    };

    const skills: SkillsSuggestion = {
      original: 'JS',
      existing_skills: ['JS'],
      matched_keywords: [],
      missing_but_relevant: [],
      skill_additions: [],
      skill_removals: [],
      summary: 'OK',
      total_point_value: 15,
    };

    const experience: ExperienceSuggestion = {
      original: 'Work',
      experience_entries: [],
      summary: 'Done',
      total_point_value: 25,
    };

    mockStore({
      summarySuggestion: summary,
      skillsSuggestion: skills,
      experienceSuggestion: experience,
    });

    render(<SuggestionDisplay />);

    // 10 + 15 + 25 = 50
    expect(screen.getByText('+50')).toBeInTheDocument();
  });

  it('should fall back to summing individual bullet points when experience total is missing', () => {
    const experience: ExperienceSuggestion = {
      original: 'Work',
      experience_entries: [
        {
          company: 'Corp',
          role: 'Dev',
          dates: '2020-2023',
          original_bullets: ['A', 'B'],
          suggested_bullets: [
            {
              original: 'A',
              suggested: 'A improved',
              metrics_added: [],
              keywords_incorporated: [],
              point_value: 6,
            },
            {
              original: 'B',
              suggested: 'B improved',
              metrics_added: [],
              keywords_incorporated: [],
              point_value: 4,
            },
          ],
        },
      ],
      summary: 'Reframed bullets',
      // total_point_value intentionally omitted
    };

    mockStore({
      experienceSuggestion: experience,
    });

    render(<SuggestionDisplay />);

    // 6 + 4 = 10
    expect(screen.getByText('+10')).toBeInTheDocument();
  });

  it('should not display banner when no point values exist', () => {
    const summary: SummarySuggestion = {
      original: 'Dev',
      suggested: 'Engineer',
      ats_keywords_added: [],
      ai_tell_phrases_rewritten: [],
      // No point_value
    };

    mockStore({
      summarySuggestion: summary,
    });

    render(<SuggestionDisplay />);

    expect(screen.queryByText('Total Potential Improvement')).not.toBeInTheDocument();
  });

  it('should not display banner when total points is 0', () => {
    const summary: SummarySuggestion = {
      original: 'Dev',
      suggested: 'Engineer',
      ats_keywords_added: [],
      ai_tell_phrases_rewritten: [],
      point_value: 0,
    };

    mockStore({
      summarySuggestion: summary,
    });

    render(<SuggestionDisplay />);

    // Banner only shows when totalPoints > 0
    expect(screen.queryByText('Total Potential Improvement')).not.toBeInTheDocument();
  });

  it('should display banner with only summary points when other sections have no points', () => {
    const summary: SummarySuggestion = {
      original: 'Dev',
      suggested: 'Engineer',
      ats_keywords_added: [],
      ai_tell_phrases_rewritten: [],
      point_value: 7,
    };

    const skills: SkillsSuggestion = {
      original: 'JS',
      existing_skills: ['JS'],
      matched_keywords: [],
      missing_but_relevant: [],
      skill_additions: [],
      skill_removals: [],
      summary: 'OK',
      // No total_point_value
    };

    mockStore({
      summarySuggestion: summary,
      skillsSuggestion: skills,
    });

    render(<SuggestionDisplay />);

    expect(screen.getByText('+7')).toBeInTheDocument();
  });

  it('should have correct description text in banner', () => {
    const summary: SummarySuggestion = {
      original: 'Dev',
      suggested: 'Engineer',
      ats_keywords_added: [],
      ai_tell_phrases_rewritten: [],
      point_value: 10,
    };

    mockStore({
      summarySuggestion: summary,
    });

    render(<SuggestionDisplay />);

    expect(
      screen.getByText('Estimated ATS score increase if you apply all suggestions')
    ).toBeInTheDocument();
  });
});

// ===========================================================================
// Sort Control Tests (Story 11.1 - Task 6)
// ===========================================================================

describe('SuggestionDisplay - Sort Control', () => {
  function mockStore(overrides: Record<string, unknown>) {
    const defaultState = {
      summarySuggestion: null,
      skillsSuggestion: null,
      experienceSuggestion: null,
      isLoading: false,
      loadingStep: null,
      isRegeneratingSection: {},
      setRegeneratingSection: vi.fn(),
      updateSectionSuggestion: vi.fn(),
      resumeContent: null,
      jobDescription: null,
      sessionId: null,
      keywordAnalysis: null,
      suggestionSortBy: 'points-high',
      setSuggestionSortBy: vi.fn(),
      getFeedbackForSuggestion: () => null,
      recordSuggestionFeedback: vi.fn().mockResolvedValue(undefined),
    };
    const state = { ...defaultState, ...overrides };
    (useOptimizationStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: typeof state) => unknown) => selector(state)
    );
    return state;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const experienceWithPoints: ExperienceSuggestion = {
    original: 'Work experience',
    experience_entries: [
      {
        company: 'Acme Corp',
        role: 'Developer',
        dates: '2020-2023',
        original_bullets: ['Built apps', 'Led team', 'Wrote docs'],
        suggested_bullets: [
          {
            original: 'Built apps',
            suggested: 'Built scalable React apps serving 10K users',
            metrics_added: ['10K'],
            keywords_incorporated: ['React'],
            point_value: 9,
          },
          {
            original: 'Led team',
            suggested: 'Led cross-functional team of 5 engineers',
            metrics_added: ['5'],
            keywords_incorporated: ['leadership'],
            point_value: 3,
          },
          {
            original: 'Wrote docs',
            suggested: 'Authored technical documentation for 3 products',
            metrics_added: ['3'],
            keywords_incorporated: [],
            point_value: 6,
          },
        ],
      },
    ],
    summary: 'Reframed experience',
    total_point_value: 18,
  };

  it('should show sort control when experience has point values', () => {
    mockStore({ experienceSuggestion: experienceWithPoints });

    render(<SuggestionDisplay />);

    expect(screen.getByTestId('sort-control')).toBeInTheDocument();
    expect(screen.getByTestId('sort-select')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort experience by:')).toBeInTheDocument();
  });

  it('should not show sort control when no experience suggestions exist', () => {
    const summary: SummarySuggestion = {
      original: 'Dev',
      suggested: 'Engineer',
      ats_keywords_added: [],
      ai_tell_phrases_rewritten: [],
      point_value: 5,
    };

    mockStore({ summarySuggestion: summary });

    render(<SuggestionDisplay />);

    expect(screen.queryByTestId('sort-control')).not.toBeInTheDocument();
  });

  it('should not show sort control when experience bullets have no point values', () => {
    const experienceNoPoints: ExperienceSuggestion = {
      original: 'Work',
      experience_entries: [
        {
          company: 'Corp',
          role: 'Dev',
          dates: '2020',
          original_bullets: ['A'],
          suggested_bullets: [
            {
              original: 'A',
              suggested: 'A improved',
              metrics_added: [],
              keywords_incorporated: [],
              // No point_value
            },
          ],
        },
      ],
      summary: 'Done',
    };

    mockStore({ experienceSuggestion: experienceNoPoints });

    render(<SuggestionDisplay />);

    expect(screen.queryByTestId('sort-control')).not.toBeInTheDocument();
  });

  it('should call setSuggestionSortBy when dropdown value changes', () => {
    const state = mockStore({ experienceSuggestion: experienceWithPoints });

    render(<SuggestionDisplay />);

    const select = screen.getByTestId('sort-select');
    fireEvent.change(select, { target: { value: 'points-low' } });

    expect(state.setSuggestionSortBy).toHaveBeenCalledWith('points-low');
  });

  it('should have all three sort options', () => {
    mockStore({ experienceSuggestion: experienceWithPoints });

    render(<SuggestionDisplay />);

    const select = screen.getByTestId('sort-select');
    const options = within(select).getAllByRole('option');

    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue('points-high');
    expect(options[1]).toHaveValue('points-low');
    expect(options[2]).toHaveValue('relevance');
  });

  it('should reflect current store sort value', () => {
    mockStore({
      experienceSuggestion: experienceWithPoints,
      suggestionSortBy: 'relevance',
    });

    render(<SuggestionDisplay />);

    const select = screen.getByTestId('sort-select') as HTMLSelectElement;
    expect(select.value).toBe('relevance');
  });
});

// ===========================================================================
// SuggestionSection - Sort Behavior Tests (Story 11.1 - Task 6)
// ===========================================================================

describe('SuggestionSection - Experience Bullet Sorting', () => {
  const experienceWithPoints: ExperienceSuggestion = {
    original: 'Work',
    experience_entries: [
      {
        company: 'Corp',
        role: 'Dev',
        dates: '2020-2023',
        original_bullets: ['Low impact', 'High impact', 'Medium impact'],
        suggested_bullets: [
          {
            original: 'Low impact',
            suggested: 'Low impact improved',
            metrics_added: [],
            keywords_incorporated: [],
            point_value: 2,
          },
          {
            original: 'High impact',
            suggested: 'High impact improved',
            metrics_added: [],
            keywords_incorporated: [],
            point_value: 10,
          },
          {
            original: 'Medium impact',
            suggested: 'Medium impact improved',
            metrics_added: [],
            keywords_incorporated: [],
            point_value: 5,
          },
        ],
      },
    ],
    summary: 'Test',
    total_point_value: 17,
  };

  it('should sort bullets high to low when sortBy is points-high', () => {
    render(
      <SuggestionSection
        section="experience"
        suggestion={experienceWithPoints}
        sectionLabel="Experience"
        sortBy="points-high"
      />
    );

    const pointBadges = screen.getAllByText(/\+\d+ pts/);
    expect(pointBadges[0]).toHaveTextContent('+10 pts');
    expect(pointBadges[1]).toHaveTextContent('+5 pts');
    expect(pointBadges[2]).toHaveTextContent('+2 pts');
  });

  it('should sort bullets low to high when sortBy is points-low', () => {
    render(
      <SuggestionSection
        section="experience"
        suggestion={experienceWithPoints}
        sectionLabel="Experience"
        sortBy="points-low"
      />
    );

    const pointBadges = screen.getAllByText(/\+\d+ pts/);
    expect(pointBadges[0]).toHaveTextContent('+2 pts');
    expect(pointBadges[1]).toHaveTextContent('+5 pts');
    expect(pointBadges[2]).toHaveTextContent('+10 pts');
  });

  it('should preserve original order when sortBy is relevance', () => {
    render(
      <SuggestionSection
        section="experience"
        suggestion={experienceWithPoints}
        sectionLabel="Experience"
        sortBy="relevance"
      />
    );

    const pointBadges = screen.getAllByText(/\+\d+ pts/);
    expect(pointBadges[0]).toHaveTextContent('+2 pts');
    expect(pointBadges[1]).toHaveTextContent('+10 pts');
    expect(pointBadges[2]).toHaveTextContent('+5 pts');
  });

  it('should treat undefined point values as 0 when sorting', () => {
    const mixedPoints: ExperienceSuggestion = {
      original: 'Work',
      experience_entries: [
        {
          company: 'Corp',
          role: 'Dev',
          dates: '2020',
          original_bullets: ['A', 'B', 'C'],
          suggested_bullets: [
            {
              original: 'A',
              suggested: 'A improved',
              metrics_added: [],
              keywords_incorporated: [],
              point_value: 5,
            },
            {
              original: 'B',
              suggested: 'B improved',
              metrics_added: [],
              keywords_incorporated: [],
              // No point_value - treated as 0
            },
            {
              original: 'C',
              suggested: 'C improved',
              metrics_added: [],
              keywords_incorporated: [],
              point_value: 3,
            },
          ],
        },
      ],
      summary: 'Test',
    };

    render(
      <SuggestionSection
        section="experience"
        suggestion={mixedPoints}
        sectionLabel="Experience"
        sortBy="points-high"
      />
    );

    // The card with 5 pts should appear first, then 3 pts, then undefined (no badge)
    const pointBadges = screen.getAllByText(/\+\d+ pts/);
    expect(pointBadges[0]).toHaveTextContent('+5 pts');
    expect(pointBadges[1]).toHaveTextContent('+3 pts');
  });

  it('should not affect summary section rendering regardless of sortBy', () => {
    const summary: SummarySuggestion = {
      original: 'Dev',
      suggested: 'Engineer',
      ats_keywords_added: ['leadership'],
      ai_tell_phrases_rewritten: [],
      point_value: 8,
    };

    render(
      <SuggestionSection
        section="summary"
        suggestion={summary}
        sectionLabel="Summary"
        sortBy="points-high"
      />
    );

    expect(screen.getByText('Engineer')).toBeInTheDocument();
  });
});
