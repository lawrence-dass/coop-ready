/**
 * Unit tests for SuggestionDisplay component
 * Story 6.5: Implement Suggestion Display UI
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SuggestionDisplay } from '@/components/shared/SuggestionDisplay';
import { useOptimizationStore } from '@/store/useOptimizationStore';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
} from '@/types/suggestions';

// Mock the Zustand store
vi.mock('@/store/useOptimizationStore', () => ({
  useOptimizationStore: vi.fn(),
}));

describe('SuggestionDisplay', () => {
  const mockSummarySuggestion: SummarySuggestion = {
    original: 'Junior developer',
    suggested: 'Results-driven software engineer',
    ats_keywords_added: ['software engineer'],
    ai_tell_phrases_rewritten: [],
  };

  const mockSkillsSuggestion: SkillsSuggestion = {
    original: 'JavaScript, HTML',
    existing_skills: ['JavaScript', 'HTML'],
    matched_keywords: ['JavaScript'],
    missing_but_relevant: [],
    skill_additions: ['React'],
    skill_removals: [],
    summary: 'Add React',
  };

  const mockExperienceSuggestion: ExperienceSuggestion = {
    original: 'Worked on projects',
    experience_entries: [
      {
        company: 'Tech Corp',
        role: 'Developer',
        dates: '2020 - 2023',
        original_bullets: ['Built apps'],
        suggested_bullets: [
          {
            original: 'Built apps',
            suggested: 'Built 5+ enterprise apps',
            metrics_added: ['5+'],
            keywords_incorporated: ['enterprise'],
          },
        ],
      },
    ],
    summary: 'Added metrics',
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  function mockStore(overrides: Record<string, unknown>) {
    const defaultState = {
      summarySuggestion: null,
      skillsSuggestion: null,
      experienceSuggestion: null,
      isLoading: false,
      loadingStep: null,
    };
    const state = { ...defaultState, ...overrides };
    (useOptimizationStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: typeof state) => unknown) => selector(state)
    );
  }

  it('should display all three sections when all suggestions available', () => {
    mockStore({
      summarySuggestion: mockSummarySuggestion,
      skillsSuggestion: mockSkillsSuggestion,
      experienceSuggestion: mockExperienceSuggestion,
    });

    render(<SuggestionDisplay />);

    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
  });

  it('should display only summary section when only summary available', () => {
    mockStore({
      summarySuggestion: mockSummarySuggestion,
    });

    render(<SuggestionDisplay />);

    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.queryByText('Skills')).not.toBeInTheDocument();
    expect(screen.queryByText('Experience')).not.toBeInTheDocument();
  });

  it('should display empty state when no suggestions available', () => {
    mockStore({});

    render(<SuggestionDisplay />);

    expect(screen.getByText(/No suggestions available/i)).toBeInTheDocument();
  });

  it('should render sections in order: Summary, Skills, Experience', () => {
    mockStore({
      summarySuggestion: mockSummarySuggestion,
      skillsSuggestion: mockSkillsSuggestion,
      experienceSuggestion: mockExperienceSuggestion,
    });

    const { container } = render(<SuggestionDisplay />);

    const sections = container.querySelectorAll('section');
    expect(sections).toHaveLength(3);

    // Verify order
    expect(sections[0].textContent).toContain('Summary');
    expect(sections[1].textContent).toContain('Skills');
    expect(sections[2].textContent).toContain('Experience');
  });

  it('should stack sections vertically', () => {
    mockStore({
      summarySuggestion: mockSummarySuggestion,
      skillsSuggestion: mockSkillsSuggestion,
    });

    const { container } = render(<SuggestionDisplay />);

    const mainContainer = container.querySelector('.space-y-8');
    expect(mainContainer).toBeInTheDocument();
  });

  it('should apply custom className when provided', () => {
    mockStore({
      summarySuggestion: mockSummarySuggestion,
    });

    const { container } = render(<SuggestionDisplay className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should show loading state when generating suggestions', () => {
    mockStore({
      isLoading: true,
      loadingStep: 'generating-suggestions',
    });

    render(<SuggestionDisplay />);

    // All three sections should show loading spinners
    expect(screen.getAllByText(/Generating suggestions/i)).toHaveLength(3);
  });

  it('should show loading only for sections without data yet', () => {
    mockStore({
      summarySuggestion: mockSummarySuggestion,
      isLoading: true,
      loadingStep: 'generating-suggestions',
    });

    render(<SuggestionDisplay />);

    // Summary should show content (not loading)
    expect(screen.getByText('Summary')).toBeInTheDocument();
    // Text appears in both desktop grid and mobile tabs
    expect(screen.getAllByText(/Junior developer/i).length).toBeGreaterThanOrEqual(1);

    // Skills and Experience should show loading
    expect(screen.getAllByText(/Generating suggestions/i)).toHaveLength(2);
  });
});
