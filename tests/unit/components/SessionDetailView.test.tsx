import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionDetailView } from '@/components/shared/SessionDetailView';
import type { OptimizationSession } from '@/types';
import { KeywordCategory } from '@/types/analysis';
import '@testing-library/jest-dom/vitest';

/**
 * Story 10.2: SessionDetailView Component Tests
 *
 * Tests the SessionDetailView component for:
 * - Loading state display
 * - Error state display
 * - Session data rendering
 * - Copy-to-clipboard functionality
 * - "Optimize Again" interaction
 *
 * Priority Distribution:
 * - P0: 5 tests (loading, error, data display, copy, optimize again)
 * - P1: 2 tests (empty state, back button)
 */

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/store/useOptimizationStore', () => ({
  useOptimizationStore: vi.fn((selector) => {
    const state = {
      getFeedbackForSuggestion: () => null,
      recordSuggestionFeedback: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

// Mock child components to simplify testing
vi.mock('@/components/shared/ATSScoreDisplay', () => ({
  ATSScoreDisplay: () => <div data-testid="ats-score-display">ATS Score</div>,
}));

vi.mock('@/components/shared/KeywordAnalysisDisplay', () => ({
  KeywordAnalysisDisplay: () => (
    <div data-testid="keyword-analysis-display">Keyword Analysis</div>
  ),
}));

const mockSession: OptimizationSession = {
  id: 'session-123',
  anonymousId: 'anon-123',
  userId: 'user-123',
  resumeContent: {
    rawText: 'Software Engineer with 5 years of experience.',
  },
  jobDescription: 'Looking for a Senior Software Engineer with React experience.',
  atsScore: {
    overall: 85,
    breakdown: {
      keywordScore: 70,
      sectionCoverageScore: 90,
      contentQualityScore: 95,
    },
    calculatedAt: new Date('2024-01-15').toISOString(),
  },
  keywordAnalysis: {
    matched: [
      { keyword: 'React', category: KeywordCategory.TECHNOLOGIES, found: true, matchType: 'exact' as const },
      { keyword: 'JavaScript', category: KeywordCategory.TECHNOLOGIES, found: true, matchType: 'exact' as const },
    ],
    missing: [
      { keyword: 'TypeScript', category: KeywordCategory.TECHNOLOGIES, importance: 'high' as const },
      { keyword: 'GraphQL', category: KeywordCategory.TECHNOLOGIES, importance: 'medium' as const },
    ],
    matchRate: 50,
    analyzedAt: new Date('2024-01-15').toISOString(),
  },
  summarySuggestion: {
    original: 'Software Engineer with 5 years.',
    suggested: 'Senior Software Engineer with 5+ years in React.',
    ats_keywords_added: ['React', 'Senior'],
    ai_tell_phrases_rewritten: [],
  },
  skillsSuggestion: {
    original: 'JavaScript, HTML, CSS',
    existing_skills: ['JavaScript', 'HTML', 'CSS'],
    matched_keywords: ['JavaScript'],
    missing_but_relevant: [{ skill: 'TypeScript', reason: 'Required by JD' }],
    skill_additions: ['TypeScript', 'React'],
    skill_removals: [],
    summary: 'Add TypeScript and React to match JD requirements.',
  },
  experienceSuggestion: {
    original: 'Built web applications.',
    experience_entries: [
      {
        company: 'TechCorp',
        role: 'Software Engineer',
        dates: '2020 - 2024',
        original_bullets: ['Built web applications.'],
        suggested_bullets: [
          {
            original: 'Built web applications.',
            suggested: 'Built scalable web applications using React and TypeScript.',
            metrics_added: ['scalable'],
            keywords_incorporated: ['React', 'TypeScript'],
          },
        ],
      },
    ],
    summary: 'Enhanced bullets with keywords and metrics.',
  },
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

describe('Story 10.2: SessionDetailView Component', () => {
  test('[P0] 10.2-UI-001: should show loading skeleton while fetching session', () => {
    // GIVEN: Session is loading
    render(<SessionDetailView session={null} isLoading={true} />);

    // THEN: Should display loading skeleton
    const loadingSkeleton = screen.getByTestId('session-detail-loading');
    expect(loadingSkeleton).toBeInTheDocument();

    // AND: Should not show session content
    expect(screen.queryByTestId('session-detail-view')).not.toBeInTheDocument();
  });

  test('[P0] 10.2-UI-002: should show error state when session not found', () => {
    // GIVEN: Error occurred while fetching
    const error = { message: 'Session not found', code: 'SESSION_NOT_FOUND' };

    render(<SessionDetailView session={null} error={error} />);

    // THEN: Should display error message
    expect(screen.getByText('Session not found')).toBeInTheDocument();

    // AND: Should not show session content
    expect(screen.queryByTestId('session-detail-view')).not.toBeInTheDocument();
  });

  test('[P0] 10.2-UI-003: should render session data correctly (AC #2)', () => {
    // GIVEN: Session data is loaded
    render(<SessionDetailView session={mockSession} />);

    // THEN: Should display session detail view
    expect(screen.getByTestId('session-detail-view')).toBeInTheDocument();

    // AND: Should display resume content (AC #2)
    const resumeCard = screen.getByTestId('resume-content-card');
    expect(resumeCard).toBeInTheDocument();
    expect(resumeCard).toHaveTextContent(/Software Engineer with 5 years/);

    // AND: Should display job description (AC #2)
    const jdCard = screen.getByTestId('job-description-card');
    expect(jdCard).toBeInTheDocument();
    expect(jdCard).toHaveTextContent(/Looking for a Senior Software Engineer/);

    // AND: Should display analysis results (AC #2)
    expect(screen.getByText('Previous Analysis')).toBeInTheDocument();

    // AND: Should display suggestions (AC #2)
    expect(screen.getByText('Previous Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Summary Section')).toBeInTheDocument();
    expect(screen.getByText('Skills Section')).toBeInTheDocument();
    expect(screen.getByText('Experience Section')).toBeInTheDocument();
  });

  test('[P0] 10.2-UI-004: should allow copying suggestions to clipboard (AC #5)', async () => {
    // GIVEN: User is viewing session with suggestions
    const user = userEvent.setup();

    // Mock clipboard API
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });

    render(<SessionDetailView session={mockSession} />);

    // WHEN: User clicks a copy button (summary, skills, or experience)
    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);

    await user.click(copyButtons[0]);

    // THEN: Should copy text to clipboard (AC #5)
    expect(writeTextMock).toHaveBeenCalled();
  });

  test('[P0] 10.2-UI-005: should trigger optimize again callback (AC #4)', async () => {
    // GIVEN: User is viewing session details
    const mockOptimizeAgain = vi.fn();
    const user = userEvent.setup();

    render(
      <SessionDetailView
        session={mockSession}
        onOptimizeAgain={mockOptimizeAgain}
      />
    );

    // WHEN: User clicks "Optimize Again" button
    const optimizeButton = screen.getByTestId('optimize-again-button');
    await user.click(optimizeButton);

    // THEN: Should call the callback (AC #4)
    expect(mockOptimizeAgain).toHaveBeenCalledOnce();
  });

  test('[P1] 10.2-UI-006: should show empty state when session has no data', () => {
    // GIVEN: Session exists but has no content
    const emptySession: OptimizationSession = {
      id: 'session-456',
      anonymousId: 'anon-456',
      userId: 'user-456',
      resumeContent: null,
      jobDescription: null,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    };

    render(<SessionDetailView session={emptySession} />);

    // THEN: Should show empty state message
    expect(
      screen.getByText(/No optimization data available/)
    ).toBeInTheDocument();
  });

  test('[P1] 10.2-UI-007: should handle back button click', async () => {
    // GIVEN: User is viewing session details with back button
    const mockOnBack = vi.fn();
    const user = userEvent.setup();

    render(<SessionDetailView session={mockSession} onBack={mockOnBack} />);

    // WHEN: User clicks back button
    const backButton = screen.getByRole('button', { name: /back/i });
    await user.click(backButton);

    // THEN: Should call onBack callback
    expect(mockOnBack).toHaveBeenCalledOnce();
  });
});
