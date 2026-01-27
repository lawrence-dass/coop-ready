import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HistoryListView } from '@/components/shared/HistoryListView';
import { useOptimizationStore } from '@/store/useOptimizationStore';
import type { HistorySession } from '@/types/history';
import '@testing-library/jest-dom/vitest';

/**
 * Story 10.1: History List View Component Unit Tests
 *
 * Tests the HistoryListView component rendering and state handling.
 *
 * Priority Distribution:
 * - P0: 3 tests (loading, empty state, history display)
 * - P1: 1 test (metadata formatting)
 */

// Mock getOptimizationHistory action
vi.mock('@/actions/history/get-optimization-history', () => ({
  getOptimizationHistory: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('Story 10.1: HistoryListView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state before each test
    useOptimizationStore.setState({
      historyItems: [],
      isLoadingHistory: false,
    });
  });

  test('[P0] 10.1-UI-001: should show loading skeleton while fetching history', async () => {
    // GIVEN: History is loading
    useOptimizationStore.setState({
      isLoadingHistory: true,
      historyItems: [],
    });

    // Mock the fetch to never resolve (simulating loading state)
    const { getOptimizationHistory } = await import('@/actions/history/get-optimization-history');
    vi.mocked(getOptimizationHistory).mockImplementation(() => new Promise(() => {}));

    // WHEN: Rendering component
    const { container } = render(<HistoryListView />);

    // THEN: Should show skeleton loaders (check for skeleton class)
    await waitFor(() => {
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  test('[P0] 10.1-UI-002: should show empty state when no history exists', async () => {
    // GIVEN: No history items
    useOptimizationStore.setState({
      isLoadingHistory: false,
      historyItems: [],
    });

    // Mock the fetch to return empty array
    const { getOptimizationHistory } = await import('@/actions/history/get-optimization-history');
    vi.mocked(getOptimizationHistory).mockResolvedValue({
      data: [],
      error: null,
    });

    // WHEN: Rendering component
    render(<HistoryListView />);

    // THEN: Should show empty state message
    await waitFor(() => {
      expect(screen.getByText(/No optimization history yet/i)).toBeInTheDocument();
    });
  });

  test('[P0] 10.1-UI-003: should display list of history sessions', async () => {
    // GIVEN: History items exist
    const mockHistory: HistorySession[] = [
      {
        id: 'session-1',
        createdAt: new Date('2026-01-27T10:00:00Z'),
        resumeName: 'John Smith',
        jobTitle: 'Senior Developer',
        companyName: 'TechCorp',
        jdPreview: 'We are seeking a talented developer...',
        atsScore: 85,
        suggestionCount: 3,
      },
      {
        id: 'session-2',
        createdAt: new Date('2026-01-26T15:30:00Z'),
        resumeName: 'Jane Doe',
        jobTitle: 'Data Scientist',
        companyName: null,
        jdPreview: 'Looking for a data expert...',
        atsScore: 72,
        suggestionCount: 2,
      },
    ];

    useOptimizationStore.setState({
      isLoadingHistory: false,
      historyItems: mockHistory,
    });

    // Mock the fetch
    const { getOptimizationHistory } = await import('@/actions/history/get-optimization-history');
    vi.mocked(getOptimizationHistory).mockResolvedValue({
      data: mockHistory,
      error: null,
    });

    // WHEN: Rendering component
    render(<HistoryListView />);

    // THEN: Should display both sessions
    await waitFor(() => {
      expect(screen.getByTestId('history-list')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Senior Developer')).toBeInTheDocument();
      expect(screen.getByText('at TechCorp')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Data Scientist')).toBeInTheDocument();
    });

    // THEN: Should show ATS scores
    const badges = screen.getAllByText(/\d+/);
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  test('[P1] 10.1-UI-004: should format dates correctly', async () => {
    // GIVEN: History with specific date
    const mockHistory: HistorySession[] = [
      {
        id: 'session-1',
        createdAt: new Date('2026-01-27T14:30:00Z'),
        resumeName: 'Test Resume',
        jobTitle: 'Test Job',
        companyName: null,
        jdPreview: 'Test preview',
        atsScore: 80,
        suggestionCount: 1,
      },
    ];

    useOptimizationStore.setState({
      isLoadingHistory: false,
      historyItems: mockHistory,
    });

    // WHEN: Rendering component
    render(<HistoryListView />);

    // THEN: Should format date as "Jan 27, X:XX PM" (time depends on timezone)
    await waitFor(() => {
      const dateText = screen.getByText(/Jan 27/i);
      expect(dateText).toBeInTheDocument();
      expect(dateText.textContent).toMatch(/\d{1,2}:\d{2}\s[AP]M/); // Matches time format
    });
  });
});
