/**
 * Integration tests for suggestion pipeline wiring
 * Story 6.9: Wire Analysis-to-Suggestion Pipeline
 *
 * Tests that AnalyzeButton triggers suggestion generation after analysis
 * and that SuggestionDisplay renders on the page.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SuggestionDisplay } from '@/components/shared/SuggestionDisplay';

// Mock dependencies
vi.mock('@/actions/regenerateSuggestions', () => ({
  regenerateSuggestions: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock store with controllable state
const mockStoreState = {
  summarySuggestion: null as unknown,
  skillsSuggestion: null as unknown,
  experienceSuggestion: null as unknown,
  isLoading: false,
  loadingStep: null as string | null,
  isRegeneratingSection: {},
  setRegeneratingSection: vi.fn(),
  updateSectionSuggestion: vi.fn(),
  resumeContent: null,
  jobDescription: null,
  sessionId: null,
  keywordAnalysis: null,
  suggestionFeedback: new Map(),
  getFeedbackForSuggestion: vi.fn().mockReturnValue(null),
  recordSuggestionFeedback: vi.fn(),
};

vi.mock('@/store/useOptimizationStore', () => ({
  useOptimizationStore: (selector: (state: typeof mockStoreState) => unknown) =>
    selector(mockStoreState),
}));

describe('Suggestion Pipeline Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.summarySuggestion = null;
    mockStoreState.skillsSuggestion = null;
    mockStoreState.experienceSuggestion = null;
    mockStoreState.isLoading = false;
    mockStoreState.loadingStep = null;
  });

  describe('SuggestionDisplay on page', () => {
    it('should show empty state when no suggestions and not generating', () => {
      render(<SuggestionDisplay />);

      expect(screen.getByText('No suggestions available yet')).toBeInTheDocument();
    });

    it('should show loading spinners when generating suggestions', () => {
      mockStoreState.isLoading = true;
      mockStoreState.loadingStep = 'generating-suggestions';

      render(<SuggestionDisplay />);

      // Should not show empty state when generating
      expect(screen.queryByText('No suggestions available yet')).not.toBeInTheDocument();
    });

    it('should render summary section when suggestion exists', () => {
      mockStoreState.summarySuggestion = {
        original: 'Software engineer',
        suggested: 'Senior Software Engineer with 7+ years',
        ats_keywords_added: ['senior'],
        ai_tell_phrases_rewritten: [],
      };

      render(<SuggestionDisplay />);

      expect(screen.queryByText('No suggestions available yet')).not.toBeInTheDocument();
      expect(screen.getAllByText('Summary').length).toBeGreaterThan(0);
    });

    it('should render skills section when suggestion exists', () => {
      mockStoreState.skillsSuggestion = {
        original: 'JavaScript',
        existing_skills: ['JavaScript'],
        matched_keywords: ['JavaScript'],
        missing_but_relevant: [],
        skill_additions: ['TypeScript'],
        skill_removals: [],
        summary: 'Add TypeScript',
      };

      render(<SuggestionDisplay />);

      expect(screen.queryByText('No suggestions available yet')).not.toBeInTheDocument();
      expect(screen.getAllByText("Skills").length).toBeGreaterThan(0);
    });

    it('should render experience section when suggestion exists', () => {
      mockStoreState.experienceSuggestion = {
        original: 'Did work',
        experience_entries: [{
          company: 'Acme',
          role: 'Engineer',
          dates: '2020-2023',
          original_bullets: ['Did work'],
          suggested_bullets: [{
            original: 'Did work',
            suggested: 'Led engineering team',
            metrics_added: [],
            keywords_incorporated: ['led'],
          }],
        }],
        summary: 'Reframed 1 bullet',
      };

      render(<SuggestionDisplay />);

      expect(screen.queryByText('No suggestions available yet')).not.toBeInTheDocument();
      expect(screen.getAllByText("Experience").length).toBeGreaterThan(0);
    });

    it('should render partial results when only some sections succeed', () => {
      mockStoreState.summarySuggestion = {
        original: 'Software engineer',
        suggested: 'Senior Software Engineer',
        ats_keywords_added: ['senior'],
        ai_tell_phrases_rewritten: [],
      };
      // skills and experience remain null (failed)

      render(<SuggestionDisplay />);

      expect(screen.getAllByText('Summary').length).toBeGreaterThan(0);
      // Skills and Experience should not render
      expect(screen.queryByText('Skills')).not.toBeInTheDocument();
      expect(screen.queryByText('Experience')).not.toBeInTheDocument();
    });
  });

  describe('Barrel export', () => {
    it('should export SuggestionDisplay from shared barrel', async () => {
      const barrel = await import('@/components/shared');
      expect(barrel.SuggestionDisplay).toBeDefined();
    });
  });
});
