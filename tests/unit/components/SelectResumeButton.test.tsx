/**
 * Story 9.2: SelectResumeButton Component Unit Tests
 *
 * Tests the select resume button and dialog component including:
 * - Button visibility based on auth state
 * - Dialog open/close behavior
 * - Resume list fetching and display
 * - Resume selection flow
 * - Delete button interaction
 * - Empty state display
 * - Error handling
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectResumeButton } from '@/components/resume/SelectResumeButton';
import { toast } from 'sonner';

// Mock server actions
vi.mock('@/actions/resume/get-user-resumes', () => ({
  getUserResumes: vi.fn(),
}));

vi.mock('@/actions/resume/get-resume-content', () => ({
  getResumeContent: vi.fn(),
}));

vi.mock('@/actions/resume/delete-resume', () => ({
  deleteResume: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Zustand store
vi.mock('@/store', () => ({
  useOptimizationStore: vi.fn(() => ({
    setResumeContent: vi.fn(),
    selectedResumeId: null,
    setSelectedResumeId: vi.fn(),
    clearSelectedResume: vi.fn(),
  })),
}));

describe('Story 9.2: SelectResumeButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('[P0] 9.2-COMPONENT-001: should not render when user is not authenticated', () => {
    const { container } = render(
      <SelectResumeButton isAuthenticated={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  test('[P0] 9.2-COMPONENT-002: should render button when authenticated', () => {
    render(<SelectResumeButton isAuthenticated={true} />);

    expect(screen.getByTestId('select-resume-button')).toBeInTheDocument();
    expect(screen.getByText(/select from library/i)).toBeInTheDocument();
  });

  test('[P0] 9.2-COMPONENT-003: should open dialog and fetch resumes when button is clicked', async () => {
    const { getUserResumes } = await import('@/actions/resume/get-user-resumes');
    vi.mocked(getUserResumes).mockResolvedValue({
      data: [
        {
          id: 'resume-1',
          name: 'Software Engineer Resume',
          created_at: '2026-01-27T10:00:00Z',
        },
        {
          id: 'resume-2',
          name: 'Product Manager Resume',
          created_at: '2026-01-26T15:30:00Z',
        },
      ],
      error: null,
    });

    render(<SelectResumeButton isAuthenticated={true} />);

    const button = screen.getByTestId('select-resume-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('select-resume-dialog')).toBeInTheDocument();
    });

    // Wait for resumes to load
    await waitFor(() => {
      expect(screen.getByText(/software engineer resume/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText(/product manager resume/i)).toBeInTheDocument();
    expect(screen.getByText(/you have 2 saved resumes/i)).toBeInTheDocument();
    expect(getUserResumes).toHaveBeenCalledTimes(1);
  });

  test('[P1] 9.2-COMPONENT-004: should show empty state when no resumes saved', async () => {
    const { getUserResumes } = await import('@/actions/resume/get-user-resumes');
    vi.mocked(getUserResumes).mockResolvedValue({
      data: [],
      error: null,
    });

    render(<SelectResumeButton isAuthenticated={true} />);

    fireEvent.click(screen.getByTestId('select-resume-button'));

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/no resumes saved yet/i)
    ).toBeInTheDocument();
  });

  test('[P1] 9.2-COMPONENT-005: should handle error when fetching resumes fails', async () => {
    const { getUserResumes } = await import('@/actions/resume/get-user-resumes');
    vi.mocked(getUserResumes).mockResolvedValue({
      data: null,
      error: {
        code: 'GET_RESUMES_ERROR',
        message: 'Failed to fetch resumes',
      },
    });

    render(<SelectResumeButton isAuthenticated={true} />);

    fireEvent.click(screen.getByTestId('select-resume-button'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to fetch resumes');
    });
  });

  test('[P0] 9.2-COMPONENT-006: should enable select button only when resume is chosen', async () => {
    const { getUserResumes } = await import('@/actions/resume/get-user-resumes');
    vi.mocked(getUserResumes).mockResolvedValue({
      data: [
        {
          id: 'resume-1',
          name: 'Software Engineer Resume',
          created_at: '2026-01-27T10:00:00Z',
        },
      ],
      error: null,
    });

    render(<SelectResumeButton isAuthenticated={true} />);

    fireEvent.click(screen.getByTestId('select-resume-button'));

    await waitFor(() => {
      expect(screen.getByText(/software engineer resume/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Select button should be disabled initially
    const selectButton = screen.getByTestId('select-button');
    expect(selectButton).toBeDisabled();

    // Click on radio button to select resume
    const radioButton = screen.getByRole('radio');
    fireEvent.click(radioButton);

    // Select button should now be enabled
    await waitFor(() => {
      expect(selectButton).not.toBeDisabled();
    }, { timeout: 3000 });
  });

  test('[P0] 9.2-COMPONENT-007: should call getResumeContent and update store on selection', async () => {
    const { getUserResumes } = await import('@/actions/resume/get-user-resumes');
    const { getResumeContent } = await import('@/actions/resume/get-resume-content');
    const { useOptimizationStore } = await import('@/store');

    const mockSetResumeContent = vi.fn();
    const mockSetSelectedResumeId = vi.fn();

    // Mock the store before rendering
    vi.mocked(useOptimizationStore).mockImplementation((selector: any) => {
      const store = {
        setResumeContent: mockSetResumeContent,
        selectedResumeId: null,
        setSelectedResumeId: mockSetSelectedResumeId,
        clearSelectedResume: vi.fn(),
      };
      return selector ? selector(store) : store;
    });

    vi.mocked(getUserResumes).mockResolvedValue({
      data: [
        {
          id: 'resume-1',
          name: 'Software Engineer Resume',
          created_at: '2026-01-27T10:00:00Z',
        },
      ],
      error: null,
    });

    vi.mocked(getResumeContent).mockResolvedValue({
      data: {
        id: 'resume-1',
        name: 'Software Engineer Resume',
        resumeContent: 'Sample resume content here',
      },
      error: null,
    });

    render(<SelectResumeButton isAuthenticated={true} />);

    fireEvent.click(screen.getByTestId('select-resume-button'));

    await waitFor(() => {
      expect(screen.getByText(/software engineer resume/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Select the resume
    const radioButton = screen.getByRole('radio');
    fireEvent.click(radioButton);

    // Click Select Resume button
    const selectButton = screen.getByTestId('select-button');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(getResumeContent).toHaveBeenCalledWith('resume-1');
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(mockSetResumeContent).toHaveBeenCalledWith({
        rawText: 'Sample resume content here',
        filename: 'Software Engineer Resume',
      });
      expect(mockSetSelectedResumeId).toHaveBeenCalledWith('resume-1');
      expect(toast.success).toHaveBeenCalledWith(
        'Resume "Software Engineer Resume" loaded successfully!'
      );
    }, { timeout: 3000 });
  });

  test('[P1] 9.2-COMPONENT-008: should handle error when loading resume content fails', async () => {
    const { getUserResumes } = await import('@/actions/resume/get-user-resumes');
    const { getResumeContent } = await import('@/actions/resume/get-resume-content');

    vi.mocked(getUserResumes).mockResolvedValue({
      data: [
        {
          id: 'resume-1',
          name: 'Software Engineer Resume',
          created_at: '2026-01-27T10:00:00Z',
        },
      ],
      error: null,
    });

    vi.mocked(getResumeContent).mockResolvedValue({
      data: null,
      error: {
        code: 'RESUME_NOT_FOUND',
        message: 'Resume not found or access denied',
      },
    });

    render(<SelectResumeButton isAuthenticated={true} />);

    fireEvent.click(screen.getByTestId('select-resume-button'));

    await waitFor(() => {
      expect(screen.getByText(/software engineer resume/i)).toBeInTheDocument();
    });

    // Select and try to load
    const radioButton = screen.getByRole('radio');
    fireEvent.click(radioButton);

    const selectButton = screen.getByTestId('select-button');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Resume not found or access denied'
      );
    });
  });

  test('[P1] 9.2-COMPONENT-009: should close dialog when cancel button is clicked', async () => {
    const { getUserResumes } = await import('@/actions/resume/get-user-resumes');
    vi.mocked(getUserResumes).mockResolvedValue({
      data: [
        {
          id: 'resume-1',
          name: 'Software Engineer Resume',
          created_at: '2026-01-27T10:00:00Z',
        },
      ],
      error: null,
    });

    render(<SelectResumeButton isAuthenticated={true} />);

    fireEvent.click(screen.getByTestId('select-resume-button'));

    await waitFor(() => {
      expect(screen.getByTestId('select-resume-dialog')).toBeInTheDocument();
    });

    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByTestId('select-resume-dialog')
      ).not.toBeInTheDocument();
    });
  });

  test('[P2] 9.2-COMPONENT-010: should show delete button on hover and open confirmation dialog', async () => {
    const { getUserResumes } = await import('@/actions/resume/get-user-resumes');
    vi.mocked(getUserResumes).mockResolvedValue({
      data: [
        {
          id: 'resume-1',
          name: 'Software Engineer Resume',
          created_at: '2026-01-27T10:00:00Z',
        },
      ],
      error: null,
    });

    render(<SelectResumeButton isAuthenticated={true} />);

    fireEvent.click(screen.getByTestId('select-resume-button'));

    await waitFor(() => {
      expect(screen.getByText(/software engineer resume/i)).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButton = screen.getByTestId('delete-resume-resume-1');
    expect(deleteButton).toBeInTheDocument();

    fireEvent.click(deleteButton);

    // Confirmation dialog should open
    await waitFor(() => {
      expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
    });

    expect(screen.getByText(/delete resume\?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to permanently delete/i)
    ).toBeInTheDocument();
  });

  test('[P1] 9.2-COMPONENT-011: should delete resume and update list on confirmation', async () => {
    const { getUserResumes } = await import('@/actions/resume/get-user-resumes');
    const { deleteResume } = await import('@/actions/resume/delete-resume');

    vi.mocked(getUserResumes).mockResolvedValue({
      data: [
        {
          id: 'resume-1',
          name: 'Software Engineer Resume',
          created_at: '2026-01-27T10:00:00Z',
        },
        {
          id: 'resume-2',
          name: 'Product Manager Resume',
          created_at: '2026-01-26T15:30:00Z',
        },
      ],
      error: null,
    });

    vi.mocked(deleteResume).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    render(<SelectResumeButton isAuthenticated={true} />);

    fireEvent.click(screen.getByTestId('select-resume-button'));

    await waitFor(() => {
      expect(screen.getByText(/software engineer resume/i)).toBeInTheDocument();
    });

    // Verify both resumes are shown
    expect(screen.getByText(/you have 2 saved resumes/i)).toBeInTheDocument();

    // Click delete button
    const deleteButton = screen.getByTestId('delete-resume-resume-1');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
    });

    // Confirm deletion
    const confirmButton = screen.getByTestId('confirm-delete-button');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(deleteResume).toHaveBeenCalledWith('resume-1');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Resume deleted');
    });

    // Verify resume was removed from list
    await waitFor(() => {
      expect(
        screen.queryByText(/software engineer resume/i)
      ).not.toBeInTheDocument();
    });

    // Should still show the other resume
    expect(screen.getByText(/product manager resume/i)).toBeInTheDocument();
    expect(screen.getByText(/you have 1 saved resume/i)).toBeInTheDocument();
  });

  test('[P1] 9.2-COMPONENT-012: should cancel delete operation when cancel is clicked', async () => {
    const { getUserResumes } = await import('@/actions/resume/get-user-resumes');
    const { deleteResume } = await import('@/actions/resume/delete-resume');

    vi.mocked(getUserResumes).mockResolvedValue({
      data: [
        {
          id: 'resume-1',
          name: 'Software Engineer Resume',
          created_at: '2026-01-27T10:00:00Z',
        },
      ],
      error: null,
    });

    render(<SelectResumeButton isAuthenticated={true} />);

    fireEvent.click(screen.getByTestId('select-resume-button'));

    await waitFor(() => {
      expect(screen.getByText(/software engineer resume/i)).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByTestId('delete-resume-resume-1');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
    });

    // Cancel deletion
    const cancelButton = screen.getByTestId('cancel-delete-button');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByTestId('confirm-delete-dialog')
      ).not.toBeInTheDocument();
    });

    // deleteResume should not have been called
    expect(deleteResume).not.toHaveBeenCalled();

    // Resume should still be in list
    expect(screen.getByText(/software engineer resume/i)).toBeInTheDocument();
  });

  test('[P1] 9.2-COMPONENT-013: should handle delete error gracefully', async () => {
    const { getUserResumes } = await import('@/actions/resume/get-user-resumes');
    const { deleteResume } = await import('@/actions/resume/delete-resume');

    vi.mocked(getUserResumes).mockResolvedValue({
      data: [
        {
          id: 'resume-1',
          name: 'Software Engineer Resume',
          created_at: '2026-01-27T10:00:00Z',
        },
      ],
      error: null,
    });

    vi.mocked(deleteResume).mockResolvedValue({
      data: null,
      error: {
        code: 'DELETE_RESUME_ERROR',
        message: 'Failed to delete resume',
      },
    });

    render(<SelectResumeButton isAuthenticated={true} />);

    fireEvent.click(screen.getByTestId('select-resume-button'));

    await waitFor(() => {
      expect(screen.getByText(/software engineer resume/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click delete and confirm
    const deleteButton = screen.getByTestId('delete-resume-resume-1');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
    }, { timeout: 3000 });

    const confirmButton = screen.getByTestId('confirm-delete-button');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to delete resume');
    }, { timeout: 3000 });

    // Close the confirmation dialog first
    const cancelDeleteButton = screen.getByTestId('cancel-delete-button');
    fireEvent.click(cancelDeleteButton);

    // Resume should still be in list in the main dialog
    await waitFor(() => {
      expect(screen.queryByText(/software engineer resume/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('[P2] 9.2-COMPONENT-014: should clear selected resume from store when deleting currently selected resume', async () => {
    const { getUserResumes } = await import('@/actions/resume/get-user-resumes');
    const { deleteResume } = await import('@/actions/resume/delete-resume');
    const { useOptimizationStore } = await import('@/store');

    const mockClearSelectedResume = vi.fn();
    const mockSetResumeContent = vi.fn();

    // Mock the store with proper selector handling
    vi.mocked(useOptimizationStore).mockImplementation((selector: any) => {
      const store = {
        setResumeContent: mockSetResumeContent,
        selectedResumeId: 'resume-1', // This resume is currently selected
        setSelectedResumeId: vi.fn(),
        clearSelectedResume: mockClearSelectedResume,
      };
      return selector ? selector(store) : store;
    });

    vi.mocked(getUserResumes).mockResolvedValue({
      data: [
        {
          id: 'resume-1',
          name: 'Software Engineer Resume',
          created_at: '2026-01-27T10:00:00Z',
        },
      ],
      error: null,
    });

    vi.mocked(deleteResume).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    render(<SelectResumeButton isAuthenticated={true} />);

    fireEvent.click(screen.getByTestId('select-resume-button'));

    await waitFor(() => {
      expect(screen.getByText(/software engineer resume/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Delete the currently selected resume
    const deleteButton = screen.getByTestId('delete-resume-resume-1');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
    }, { timeout: 3000 });

    const confirmButton = screen.getByTestId('confirm-delete-button');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockClearSelectedResume).toHaveBeenCalled();
      expect(mockSetResumeContent).toHaveBeenCalledWith(null);
    }, { timeout: 3000 });
  });
});
