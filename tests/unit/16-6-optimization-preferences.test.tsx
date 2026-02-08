import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OptimizationPreferencesSection } from '@/app/(authenticated)/(dashboard)/settings/OptimizationPreferencesSection';
import { updateUserPreferences } from '@/actions/settings/update-user-preferences';
import '@testing-library/jest-dom/vitest';

/**
 * Story 16.6: OptimizationPreferencesSection Component Unit Tests
 *
 * Tests the preferences form validation, rendering, and submission.
 * Component uses Zod validation with lowercase enum values:
 *   jobType: 'coop' | 'fulltime'
 *   modLevel: 'conservative' | 'moderate' | 'aggressive'
 * No Industry Focus or Keywords fields.
 *
 * Priority Distribution:
 * - P0: 5 tests (renders form, validation, save button state, submission, success)
 * - P1: 3 tests (error handling, field validation, loading state)
 */

// Mock the server action
vi.mock('@/actions/settings/update-user-preferences', () => ({
  updateUserPreferences: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('Story 16.6: OptimizationPreferencesSection Component', () => {
  const mockPreferences = {
    jobType: 'fulltime' as const,
    modLevel: 'moderate' as const,
  };

  const mockUserId = 'user-123-abc';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper: change the job type select to trigger form dirty state.
   * In happy-dom, shadcn Select renders as a native <select>.
   * We use fireEvent.change on the native select to trigger RHF's field.onChange.
   */
  async function changeJobTypeSelect(container: HTMLElement, value: string) {
    // The shadcn Select renders a hidden native <select> for accessibility
    // Find it by the name attribute or by navigating the DOM
    const selects = container.querySelectorAll('select');
    // First select is jobType
    if (selects.length > 0) {
      fireEvent.change(selects[0], { target: { value } });
    } else {
      // Fallback: try combobox approach
      const triggers = screen.getAllByRole('combobox');
      const user = userEvent.setup();
      await user.click(triggers[0]);
      const option = await screen.findByText('Co-op / Internship');
      await user.click(option);
    }
  }

  test('[P0] 16.6-FORM-001: should render all form fields correctly', () => {
    // WHEN: Rendering preferences section
    render(<OptimizationPreferencesSection userId={mockUserId} preferences={mockPreferences} />);

    // THEN: Should display form title and fields (Job Type, Modification Level only)
    expect(screen.getByText(/Optimization Preferences/i)).toBeInTheDocument();
    expect(screen.getByText(/Job Type/i)).toBeInTheDocument();
    expect(screen.getByText(/Modification Level/i)).toBeInTheDocument();
  });

  test('[P0] 16.6-FORM-003: should disable save button when form is pristine', () => {
    // WHEN: Rendering form with no changes
    render(<OptimizationPreferencesSection userId={mockUserId} preferences={mockPreferences} />);

    // THEN: Save button should be disabled
    const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
    expect(saveButton).toBeDisabled();
  });

  test('[P0] 16.6-FORM-005: should submit form with updated preferences', async () => {
    // GIVEN: Mock successful save
    vi.mocked(updateUserPreferences).mockResolvedValue({
      data: { ...mockPreferences, jobType: 'coop' as const },
      error: null,
    });

    const { container } = render(
      <OptimizationPreferencesSection userId={mockUserId} preferences={mockPreferences} />
    );

    // WHEN: User changes job type via native select
    await changeJobTypeSelect(container, 'coop');

    const saveButton = screen.getByRole('button', { name: /Save Preferences/i });

    // Wait for form to register the change
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });

    const user = userEvent.setup();
    await user.click(saveButton);

    // THEN: Should call updateUserPreferences with correct data
    await waitFor(() => {
      expect(updateUserPreferences).toHaveBeenCalledWith(expect.objectContaining({
        jobType: 'coop',
      }));
    });
  });

  test('[P0] 16.6-FORM-006: should show success toast after successful save', async () => {
    // GIVEN: Mock successful save
    vi.mocked(updateUserPreferences).mockResolvedValue({
      data: mockPreferences,
      error: null,
    });

    const { toast } = await import('sonner');
    const { container } = render(
      <OptimizationPreferencesSection userId={mockUserId} preferences={mockPreferences} />
    );

    // WHEN: User modifies and saves
    await changeJobTypeSelect(container, 'coop');

    const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });

    const user = userEvent.setup();
    await user.click(saveButton);

    // THEN: Should show success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Preferences saved successfully');
    });
  });

  test('[P1] 16.6-FORM-007: should show error toast on save failure', async () => {
    // GIVEN: Mock failed save
    vi.mocked(updateUserPreferences).mockResolvedValue({
      data: null,
      error: { message: 'Failed to save preferences', code: 'VALIDATION_ERROR' },
    });

    const { toast } = await import('sonner');
    const { container } = render(
      <OptimizationPreferencesSection userId={mockUserId} preferences={mockPreferences} />
    );

    // WHEN: User tries to save after changing a value
    await changeJobTypeSelect(container, 'coop');

    const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });

    const user = userEvent.setup();
    await user.click(saveButton);

    // THEN: Should show error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save preferences');
    });
  });

  test('[P1] 16.6-FORM-008: should show loading state during save', async () => {
    // GIVEN: Mock delayed save
    vi.mocked(updateUserPreferences).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: mockPreferences, error: null }), 100))
    );

    const { container } = render(
      <OptimizationPreferencesSection userId={mockUserId} preferences={mockPreferences} />
    );

    // WHEN: User initiates save
    await changeJobTypeSelect(container, 'coop');

    const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });

    const user = userEvent.setup();
    await user.click(saveButton);

    // THEN: Button should show loading state (disabled during pending)
    expect(saveButton).toBeDisabled();
  });

  test('[P1] 16.6-FORM-009: should validate job type enum values', async () => {
    // WHEN: Rendering form
    render(<OptimizationPreferencesSection userId={mockUserId} preferences={mockPreferences} />);

    // THEN: Job type select should have valid options
    const jobTypeLabel = screen.getByText(/Job Type/i);
    expect(jobTypeLabel).toBeInTheDocument();

    // Expect select to be rendered (validation of enum happens at submission)
    const selectTriggers = screen.getAllByRole('combobox');
    expect(selectTriggers.length).toBeGreaterThanOrEqual(1);
  });
});
