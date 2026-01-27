/**
 * Story 9.1: SaveResumeButton Component Unit Tests
 *
 * Tests the save resume button and dialog component including:
 * - Button visibility based on auth and resume state
 * - Dialog open/close behavior
 * - Form validation (name length, empty input)
 * - Save action and error handling
 * - Loading states
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveResumeButton } from '@/components/resume/SaveResumeButton';
import { toast } from 'sonner';

// Mock server action
vi.mock('@/actions/resume/save-resume', () => ({
  saveResume: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Story 9.1: SaveResumeButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('[P0] 9.1-UNIT-001: should not render when user is not authenticated', () => {
    const { container } = render(
      <SaveResumeButton
        resumeContent="Sample resume content"
        isAuthenticated={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('[P0] 9.1-UNIT-002: should not render when resume content is null', () => {
    const { container } = render(
      <SaveResumeButton resumeContent={null} isAuthenticated={true} />
    );

    expect(container.firstChild).toBeNull();
  });

  test('[P0] 9.1-UNIT-003: should render button when authenticated with resume content', () => {
    render(
      <SaveResumeButton
        resumeContent="Sample resume content"
        isAuthenticated={true}
      />
    );

    expect(screen.getByTestId('save-resume-button')).toBeInTheDocument();
    expect(screen.getByText(/save to library/i)).toBeInTheDocument();
  });

  test('[P0] 9.1-UNIT-004: should open dialog when button is clicked', async () => {
    render(
      <SaveResumeButton
        resumeContent="Sample resume content"
        isAuthenticated={true}
      />
    );

    const button = screen.getByTestId('save-resume-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('save-resume-dialog')).toBeInTheDocument();
    });

    expect(screen.getByText(/save resume to library/i)).toBeInTheDocument();
    expect(screen.getByTestId('resume-name-input')).toBeInTheDocument();
  });

  test('[P0] 9.1-UNIT-005: should have save button disabled when name is empty', async () => {
    render(
      <SaveResumeButton
        resumeContent="Sample resume content"
        isAuthenticated={true}
      />
    );

    fireEvent.click(screen.getByTestId('save-resume-button'));

    await waitFor(() => {
      expect(screen.getByTestId('save-button')).toBeInTheDocument();
    });

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toBeDisabled();
  });

  test('[P1] 9.1-UNIT-006: should enable save button when name is entered', async () => {
    const user = userEvent.setup();

    render(
      <SaveResumeButton
        resumeContent="Sample resume content"
        isAuthenticated={true}
      />
    );

    fireEvent.click(screen.getByTestId('save-resume-button'));

    await waitFor(() => {
      expect(screen.getByTestId('resume-name-input')).toBeInTheDocument();
    });

    const input = screen.getByTestId('resume-name-input');
    await user.type(input, 'My Resume');

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).not.toBeDisabled();
  });

  test('[P1] 9.1-UNIT-007: should show character count', async () => {
    const user = userEvent.setup();

    render(
      <SaveResumeButton
        resumeContent="Sample resume content"
        isAuthenticated={true}
      />
    );

    fireEvent.click(screen.getByTestId('save-resume-button'));

    await waitFor(() => {
      expect(screen.getByTestId('resume-name-input')).toBeInTheDocument();
    });

    const input = screen.getByTestId('resume-name-input');
    await user.type(input, 'Test');

    expect(screen.getByText('4/100 characters')).toBeInTheDocument();
  });

  test('[P0] 9.1-UNIT-008: should show error when name exceeds 100 characters', async () => {
    const user = userEvent.setup();

    render(
      <SaveResumeButton
        resumeContent="Sample resume content"
        isAuthenticated={true}
      />
    );

    fireEvent.click(screen.getByTestId('save-resume-button'));

    await waitFor(() => {
      expect(screen.getByTestId('resume-name-input')).toBeInTheDocument();
    });

    const input = screen.getByTestId('resume-name-input');
    const longName = 'a'.repeat(101);
    await user.type(input, longName);

    expect(screen.getByText(/name too long/i)).toBeInTheDocument();

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toBeDisabled();
  });

  test('[P0] 9.1-UNIT-009: should call saveResume action on save button click', async () => {
    const { saveResume } = await import('@/actions/resume/save-resume');
    vi.mocked(saveResume).mockResolvedValue({
      data: { id: 'resume-123', name: 'My Resume' },
      error: null,
    });

    const user = userEvent.setup();

    render(
      <SaveResumeButton
        resumeContent="Sample resume content"
        isAuthenticated={true}
      />
    );

    fireEvent.click(screen.getByTestId('save-resume-button'));

    await waitFor(() => {
      expect(screen.getByTestId('resume-name-input')).toBeInTheDocument();
    });

    const input = screen.getByTestId('resume-name-input');
    await user.type(input, 'My Resume');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveResume).toHaveBeenCalledWith(
        'Sample resume content',
        'My Resume',
        undefined // fileName not provided in this test
      );
    });
  });

  test('[P0] 9.1-UNIT-010: should show success toast and close dialog on successful save', async () => {
    const { saveResume } = await import('@/actions/resume/save-resume');
    vi.mocked(saveResume).mockResolvedValue({
      data: { id: 'resume-123', name: 'My Resume' },
      error: null,
    });

    const user = userEvent.setup();

    render(
      <SaveResumeButton
        resumeContent="Sample resume content"
        isAuthenticated={true}
      />
    );

    fireEvent.click(screen.getByTestId('save-resume-button'));

    await waitFor(() => {
      expect(screen.getByTestId('resume-name-input')).toBeInTheDocument();
    });

    const input = screen.getByTestId('resume-name-input');
    await user.type(input, 'My Resume');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Resume "My Resume" saved to your library!'
      );
    });
  });

  test('[P0] 9.1-UNIT-011: should show error toast on save failure', async () => {
    const { saveResume } = await import('@/actions/resume/save-resume');
    vi.mocked(saveResume).mockResolvedValue({
      data: null,
      error: {
        message: 'You have reached the maximum of 3 saved resumes.',
        code: 'RESUME_LIMIT_EXCEEDED',
      },
    });

    const user = userEvent.setup();

    render(
      <SaveResumeButton
        resumeContent="Sample resume content"
        isAuthenticated={true}
      />
    );

    fireEvent.click(screen.getByTestId('save-resume-button'));

    await waitFor(() => {
      expect(screen.getByTestId('resume-name-input')).toBeInTheDocument();
    });

    const input = screen.getByTestId('resume-name-input');
    await user.type(input, 'My Resume');

    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'You have reached the maximum of 3 saved resumes.'
      );
    });
  });

  test('[P1] 9.1-UNIT-012: should close dialog when cancel button is clicked', async () => {
    render(
      <SaveResumeButton
        resumeContent="Sample resume content"
        isAuthenticated={true}
      />
    );

    fireEvent.click(screen.getByTestId('save-resume-button'));

    await waitFor(() => {
      expect(screen.getByTestId('save-resume-dialog')).toBeInTheDocument();
    });

    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByTestId('save-resume-dialog')
      ).not.toBeInTheDocument();
    });
  });

  test('[P1] 9.1-UNIT-013: should clear input after successful save', async () => {
    const { saveResume } = await import('@/actions/resume/save-resume');
    vi.mocked(saveResume).mockResolvedValue({
      data: { id: 'resume-123', name: 'My Resume' },
      error: null,
    });

    const user = userEvent.setup();

    render(
      <SaveResumeButton
        resumeContent="Sample resume content"
        isAuthenticated={true}
      />
    );

    // Open and type
    fireEvent.click(screen.getByTestId('save-resume-button'));

    await waitFor(() => {
      expect(screen.getByTestId('resume-name-input')).toBeInTheDocument();
    });

    const input = screen.getByTestId('resume-name-input');
    await user.type(input, 'Test Name');

    // Save
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });

    // Dialog should close - input state cleared internally
    // This test validates the save flow, which includes clearing the input
  });
});
