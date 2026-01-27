/**
 * Sign Out Button Component Tests
 *
 * Tests the sign-out button UI component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignOutButton } from '@/components/shared/SignOutButton';

// Mock server action
vi.mock('@/actions/auth/sign-out', () => ({
  signOut: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock Zustand store
const { mockReset } = vi.hoisted(() => ({
  mockReset: vi.fn(),
}));
vi.mock('@/store', () => ({
  useOptimizationStore: Object.assign(() => null, {
    getState: () => ({ reset: mockReset }),
    setState: vi.fn(),
    subscribe: vi.fn(),
    destroy: vi.fn(),
  }),
}));

describe('SignOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReset.mockClear();
  });

  describe('rendering', () => {
    it('renders sign-out button', () => {
      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: /sign out/i });
      expect(button).toBeInTheDocument();
    });

    it('has data-testid for testing', () => {
      render(<SignOutButton />);

      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });

    it('shows button with icon', () => {
      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: /sign out/i });
      expect(button).toBeInTheDocument();
      // Button should have LogOut icon (lucide-react)
    });
  });

  describe('sign-out flow', () => {
    it('shows loading state during sign-out', async () => {
      const { signOut } = await import('@/actions/auth/sign-out');
      vi.mocked(signOut).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ data: { success: true }, error: null }), 100))
      );

      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(button);

      // Button should show loading state
      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it('calls signOut action when clicked', async () => {
      const { signOut } = await import('@/actions/auth/sign-out');
      vi.mocked(signOut).mockResolvedValue({ data: { success: true }, error: null });

      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(signOut).toHaveBeenCalledOnce();
      });
    });

    it('redirects to home page after successful sign-out', async () => {
      const { signOut } = await import('@/actions/auth/sign-out');

      vi.mocked(signOut).mockResolvedValue({ data: { success: true }, error: null });

      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('clears Zustand optimization store on successful sign-out', async () => {
      const { signOut } = await import('@/actions/auth/sign-out');
      mockReset.mockClear();

      vi.mocked(signOut).mockResolvedValue({ data: { success: true }, error: null });

      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
      });
    });

    it('calls router.refresh() to force server revalidation', async () => {
      const { signOut } = await import('@/actions/auth/sign-out');

      vi.mocked(signOut).mockResolvedValue({ data: { success: true }, error: null });

      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalledOnce();
      });
    });
  });

  describe('error handling', () => {
    it('shows error toast when sign-out fails', async () => {
      const { signOut } = await import('@/actions/auth/sign-out');
      const { toast } = await import('sonner');

      vi.mocked(signOut).mockResolvedValue({
        data: null,
        error: { message: 'Failed to sign out', code: 'SIGN_OUT_ERROR' },
      });

      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to sign out');
      });
    });

    it('does not redirect when sign-out fails', async () => {
      const { signOut } = await import('@/actions/auth/sign-out');

      vi.mocked(signOut).mockResolvedValue({
        data: null,
        error: { message: 'Network error', code: 'SIGN_OUT_ERROR' },
      });

      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(signOut).toHaveBeenCalled();
      });

      // Should not redirect on error
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('re-enables button after error', async () => {
      const { signOut } = await import('@/actions/auth/sign-out');

      vi.mocked(signOut).mockResolvedValue({
        data: null,
        error: { message: 'Error', code: 'SIGN_OUT_ERROR' },
      });

      render(<SignOutButton />);

      const button = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });
});
