import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientHistoryPage } from '@/app/(authenticated)/(dashboard)/history/ClientHistoryPage';
import { deleteOptimizationSession } from '@/actions/history/delete-optimization-session';
import type { HistorySession } from '@/types/history';
import '@testing-library/jest-dom/vitest';

/**
 * Story 16.6: History Page Integration Tests
 *
 * Tests the history page loading, display, navigation, and delete functionality.
 *
 * Priority Distribution:
 * - P0: 5 tests (session display, navigation, delete, empty state, error handling)
 * - P1: 2 tests (sorting, mobile responsive)
 */

// Mock actions
vi.mock('@/actions/history/delete-optimization-session', () => ({
  deleteOptimizationSession: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock Next.js router
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe('Story 16.6: History Page Integration', () => {
  const mockSessions: HistorySession[] = [
    {
      id: 'session-1',
      createdAt: new Date('2026-01-29T10:00:00Z'),
      resumeName: 'John Doe Resume',
      jobTitle: 'Senior Developer',
      companyName: 'TechCorp',
      jdPreview: 'We are seeking a talented developer with...',
      atsScore: 85,
      suggestionCount: 5,
    },
    {
      id: 'session-2',
      createdAt: new Date('2026-01-28T15:00:00Z'),
      resumeName: 'Jane Smith Resume',
      jobTitle: 'Data Scientist',
      companyName: null,
      jdPreview: 'Looking for an experienced data scientist...',
      atsScore: 72,
      suggestionCount: 3,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('[P0] 16.6-HIST-001: should display list of history sessions correctly', () => {
    // WHEN: Rendering ClientHistoryPage with sessions
    render(<ClientHistoryPage sessions={mockSessions} error={null} />);

    // THEN: Should display all sessions with details
    expect(screen.getByText('John Doe Resume')).toBeInTheDocument();
    expect(screen.getByText('Senior Developer')).toBeInTheDocument();
    expect(screen.getByText(/TechCorp/i)).toBeInTheDocument();
    expect(screen.getByText('Jane Smith Resume')).toBeInTheDocument();
    expect(screen.getByText('Data Scientist')).toBeInTheDocument();

    // THEN: Should show ATS scores
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  test('[P0] 16.6-HIST-002: should navigate to session when clicked', async () => {
    // GIVEN: User clicks on a session card
    const user = userEvent.setup();
    render(<ClientHistoryPage sessions={mockSessions} error={null} />);

    // WHEN: Clicking on first session
    const firstSession = screen.getByText('John Doe Resume').closest('div');
    if (firstSession) {
      await user.click(firstSession);
    }

    // THEN: Should navigate to session results page
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('session-1'));
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/scan/'));
    });
  });

  test('[P0] 16.6-HIST-003: should delete session when delete button clicked', async () => {
    // GIVEN: Mock successful deletion
    vi.mocked(deleteOptimizationSession).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const user = userEvent.setup();
    render(<ClientHistoryPage sessions={mockSessions} error={null} />);

    // WHEN: Clicking delete button on first session
    const deleteButtons = screen.getAllByLabelText(/Delete session/i);
    await user.click(deleteButtons[0]);

    // Confirm deletion in dialog
    const confirmButton = await screen.findByRole('button', { name: /Delete/i });
    await user.click(confirmButton);

    // THEN: Should call deleteOptimizationSession and refresh (no userId - gets from auth)
    await waitFor(() => {
      expect(deleteOptimizationSession).toHaveBeenCalledWith('session-1');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  test('[P0] 16.6-HIST-004: should show empty state when no sessions', () => {
    // WHEN: Rendering with no sessions
    render(<ClientHistoryPage sessions={[]} error={null} />);

    // THEN: Should show empty state message
    expect(screen.getByText(/No optimization history yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Start New Scan/i)).toBeInTheDocument();
  });

  test('[P0] 16.6-HIST-005: should display error state when error provided', () => {
    // GIVEN: Error loading sessions
    const error = {
      message: 'Failed to load history',
      code: 'VALIDATION_ERROR',
    };

    // WHEN: Rendering with error
    render(<ClientHistoryPage sessions={[]} error={error} />);

    // THEN: Should show error display
    expect(screen.getByText(/Failed to load history/i)).toBeInTheDocument();
  });

  test('[P1] 16.6-HIST-006: should display sessions sorted by most recent first', () => {
    // WHEN: Rendering sessions
    const { container } = render(<ClientHistoryPage sessions={mockSessions} error={null} />);

    // THEN: First session should be the most recent (session-1)
    const sessionCards = container.querySelectorAll('[data-testid^="history-session"]');
    const firstCard = sessionCards[0];

    expect(firstCard).toHaveTextContent('John Doe Resume'); // Most recent
  });

  test('[P1] 16.6-HIST-007: should handle delete session error gracefully', async () => {
    // GIVEN: Mock failed deletion
    vi.mocked(deleteOptimizationSession).mockResolvedValue({
      data: null,
      error: { message: 'Failed to delete session', code: 'VALIDATION_ERROR' },
    });

    const user = userEvent.setup();
    const { toast } = await import('sonner');
    render(<ClientHistoryPage sessions={mockSessions} error={null} />);

    // WHEN: Trying to delete session
    const deleteButtons = screen.getAllByLabelText(/Delete session/i);
    await user.click(deleteButtons[0]);

    const confirmButton = await screen.findByRole('button', { name: /Delete/i });
    await user.click(confirmButton);

    // THEN: Should show error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to delete session');
    });
  });

  test('[P1] 16.6-HIST-008: should display formatted dates correctly', () => {
    // WHEN: Rendering sessions with dates
    render(<ClientHistoryPage sessions={mockSessions} error={null} />);

    // THEN: Should format dates as "Jan XX, YYYY"
    expect(screen.getByText(/Jan 29/i)).toBeInTheDocument();
    expect(screen.getByText(/Jan 28/i)).toBeInTheDocument();
  });
});
