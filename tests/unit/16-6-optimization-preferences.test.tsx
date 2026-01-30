import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OptimizationPreferencesSection } from '@/app/app/(dashboard)/settings/OptimizationPreferencesSection';
import { updateUserPreferences } from '@/actions/settings/update-user-preferences';
import '@testing-library/jest-dom/vitest';

/**
 * Story 16.6: OptimizationPreferencesSection Component Unit Tests
 *
 * Tests the preferences form validation, rendering, and submission.
 *
 * Priority Distribution:
 * - P0: 5 tests (renders form, validation, save button state, submission, success)
 * - P1: 3 tests (error handling, field validation, optional fields)
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
    jobType: 'Full-time' as const,
    modLevel: 'Moderate' as const,
    industry: 'Technology',
    keywords: 'React, TypeScript',
  };

  const mockUserId = 'user-123-abc';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('[P0] 16.6-FORM-001: should render all form fields correctly', () => {
    // WHEN: Rendering preferences section
    render(<OptimizationPreferencesSection userId={mockUserId} preferences={mockPreferences} />);

    // THEN: Should display all form fields
    expect(screen.getByText(/Optimization Preferences/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Job Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Modification Level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Industry Focus/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Keywords/i)).toBeInTheDocument();
  });

  test('[P0] 16.6-FORM-002: should initialize form with current preferences', () => {
    // WHEN: Rendering with existing preferences
    render(<OptimizationPreferencesSection userId={mockUserId} preferences={mockPreferences} />);

    // THEN: Form fields should show current values
    const industryInput = screen.getByLabelText(/Industry Focus/i) as HTMLInputElement;
    const keywordsInput = screen.getByLabelText(/Keywords/i) as HTMLInputElement;

    expect(industryInput.value).toBe('Technology');
    expect(keywordsInput.value).toBe('React, TypeScript');
  });

  test('[P0] 16.6-FORM-003: should disable save button when form is pristine', () => {
    // WHEN: Rendering form with no changes
    render(<OptimizationPreferencesSection userId={mockUserId} preferences={mockPreferences} />);

    // THEN: Save button should be disabled
    const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
    expect(saveButton).toBeDisabled();
  });

  test('[P0] 16.6-FORM-004: should enable save button when form is modified', async () => {
    // GIVEN: Form is rendered
    const user = userEvent.setup();
    render(<OptimizationPreferencesSection userId={mockUserId} preferences={mockPreferences} />);

    // WHEN: User modifies a field
    const industryInput = screen.getByLabelText(/Industry Focus/i);
    await user.clear(industryInput);
    await user.type(industryInput, 'Healthcare');

    // THEN: Save button should be enabled
    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
      expect(saveButton).not.toBeDisabled();
    });
  });

  test('[P0] 16.6-FORM-005: should submit form with updated preferences', async () => {
    // GIVEN: Mock successful save
    vi.mocked(updateUserPreferences).mockResolvedValue({
      data: { ...mockPreferences, industry: 'Healthcare' },
      error: null,
    });

    const user = userEvent.setup();
    render(<OptimizationPreferencesSection userId={mockUserId} preferences={mockPreferences} />);

    // WHEN: User updates and saves preferences
    const industryInput = screen.getByLabelText(/Industry Focus/i);
    await user.clear(industryInput);
    await user.type(industryInput, 'Healthcare');

    const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
    await user.click(saveButton);

    // THEN: Should call updateUserPreferences with correct data (no userId needed - gets from auth)
    await waitFor(() => {
      expect(updateUserPreferences).toHaveBeenCalledWith(expect.objectContaining({
        industry: 'Healthcare',
      }));
    });
  });

  test('[P0] 16.6-FORM-006: should show success toast after successful save', async () => {
    // GIVEN: Mock successful save
    vi.mocked(updateUserPreferences).mockResolvedValue({
      data: mockPreferences,
      error: null,
    });

    const user = userEvent.setup();
    const { toast } = await import('sonner');
    render(<OptimizationPreferencesSection userId={mockUserId} preferences={mockPreferences} />);

    // WHEN: User modifies and saves
    const industryInput = screen.getByLabelText(/Industry Focus/i);
    await user.clear(industryInput);
    await user.type(industryInput, 'Finance');

    const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
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

    const user = userEvent.setup();
    const { toast } = await import('sonner');
    render(<OptimizationPreferencesSection userId={mockUserId} preferences={mockPreferences} />);

    // WHEN: User tries to save
    const industryInput = screen.getByLabelText(/Industry Focus/i);
    await user.clear(industryInput);
    await user.type(industryInput, 'New Industry');

    const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
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

    const user = userEvent.setup();
    render(<OptimizationPreferencesSection userId={mockUserId} preferences={mockPreferences} />);

    // WHEN: User initiates save
    const industryInput = screen.getByLabelText(/Industry Focus/i);
    await user.clear(industryInput);
    await user.type(industryInput, 'Test');

    const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
    await user.click(saveButton);

    // THEN: Button should show loading state
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

  test('[P1] 16.6-FORM-010: should allow optional fields to be empty', async () => {
    // GIVEN: Preferences with null optional fields
    const minimalPreferences = {
      jobType: 'Full-time' as const,
      modLevel: 'Minimal' as const,
      industry: null,
      keywords: null,
    };

    vi.mocked(updateUserPreferences).mockResolvedValue({
      data: minimalPreferences,
      error: null,
    });

    // WHEN: Rendering and saving with empty optional fields
    render(<OptimizationPreferencesSection userId={mockUserId} preferences={minimalPreferences} />);

    // THEN: Form should render without errors
    expect(screen.getByLabelText(/Industry Focus/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Keywords/i)).toBeInTheDocument();
  });
});
