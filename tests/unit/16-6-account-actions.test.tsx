import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountActionsSection } from '@/app/(authenticated)/(dashboard)/settings/AccountActionsSection';
import { signOut } from '@/actions/auth/sign-out';
import '@testing-library/jest-dom/vitest';

/**
 * Story 16.6: AccountActionsSection Component Unit Tests
 *
 * Tests the account actions (sign out, delete account) rendering and functionality.
 *
 * Priority Distribution:
 * - P0: 4 tests (renders both buttons, sign out functionality, loading state, delete disabled)
 * - P1: 2 tests (destructive styling, visual separation)
 */

// Mock the sign out action
vi.mock('@/actions/auth/sign-out', () => ({
  signOut: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('Story 16.6: AccountActionsSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('[P0] 16.6-ACTIONS-001: should render both account action buttons', () => {
    // WHEN: Rendering AccountActionsSection
    render(<AccountActionsSection />);

    // THEN: Should display both action buttons
    expect(screen.getByText(/Account Actions/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete Account/i })).toBeInTheDocument();
  });

  test('[P0] 16.6-ACTIONS-002: should call signOut action when sign out button clicked', async () => {
    // GIVEN: Mock successful sign out
    vi.mocked(signOut).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const user = userEvent.setup();

    // WHEN: User clicks sign out button
    render(<AccountActionsSection />);
    const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
    await user.click(signOutButton);

    // THEN: Should call signOut action
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });

  test('[P0] 16.6-ACTIONS-003: should show loading state during sign out', async () => {
    // GIVEN: Mock delayed sign out
    vi.mocked(signOut).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true }, error: null }), 100))
    );

    const user = userEvent.setup();

    // WHEN: User clicks sign out
    render(<AccountActionsSection />);
    const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
    await user.click(signOutButton);

    // THEN: Button should show loading state
    expect(signOutButton).toBeDisabled();
  });

  test('[P0] 16.6-ACTIONS-004: should have delete account button disabled', () => {
    // WHEN: Rendering AccountActionsSection
    render(<AccountActionsSection />);

    // THEN: Delete account button should be disabled
    const deleteButton = screen.getByRole('button', { name: /Delete Account/i });
    expect(deleteButton).toBeDisabled();
  });

  test('[P1] 16.6-ACTIONS-005: should use destructive styling for delete account', () => {
    // WHEN: Rendering AccountActionsSection
    const { container } = render(<AccountActionsSection />);

    // THEN: Delete button should have destructive variant styling
    const deleteButton = screen.getByRole('button', { name: /Delete Account/i });
    expect(deleteButton.className).toMatch(/destructive/i);
  });

  test('[P1] 16.6-ACTIONS-006: should have visual separation from other settings', () => {
    // WHEN: Rendering AccountActionsSection
    const { container } = render(<AccountActionsSection />);

    // THEN: Should have alert or warning styling
    const alert = container.querySelector('[class*="alert"]');
    expect(alert).toBeTruthy();
  });

  test('[P1] 16.6-ACTIONS-007: should show success toast after sign out', async () => {
    // GIVEN: Mock successful sign out
    vi.mocked(signOut).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const user = userEvent.setup();
    const { toast } = await import('sonner');

    // WHEN: User signs out
    render(<AccountActionsSection />);
    const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
    await user.click(signOutButton);

    // THEN: Should show success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Signed out'));
    });
  });

  test('[P1] 16.6-ACTIONS-008: should handle sign out error gracefully', async () => {
    // GIVEN: Mock failed sign out
    vi.mocked(signOut).mockResolvedValue({
      data: null,
      error: { message: 'Sign out failed', code: 'VALIDATION_ERROR' },
    });

    const user = userEvent.setup();
    const { toast } = await import('sonner');

    // WHEN: User tries to sign out
    render(<AccountActionsSection />);
    const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
    await user.click(signOutButton);

    // THEN: Should show error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Sign out failed');
    });
  });
});
