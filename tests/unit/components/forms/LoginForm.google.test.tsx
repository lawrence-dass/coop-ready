/**
 * Tests for Google OAuth button in LoginForm
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/forms/LoginForm';

// Mock the Google OAuth action
vi.mock('@/actions/auth/google', () => ({
  signInWithGoogle: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LoginForm - Google OAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  it('should render Google sign-in button', () => {
    render(<LoginForm />);

    const googleButton = screen.getByTestId('google-signin-button');
    expect(googleButton).toBeInTheDocument();
    expect(googleButton).toHaveTextContent('Sign in with Google');
  });

  it('should call signInWithGoogle and redirect on success', async () => {
    const { signInWithGoogle } = await import('@/actions/auth/google');
    vi.mocked(signInWithGoogle).mockResolvedValue({
      data: { url: 'https://accounts.google.com/oauth' },
      error: null,
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    const googleButton = screen.getByTestId('google-signin-button');
    await user.click(googleButton);

    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe('https://accounts.google.com/oauth');
    });
  });

  it('should show error toast when OAuth fails', async () => {
    const { signInWithGoogle } = await import('@/actions/auth/google');
    const { toast } = await import('sonner');

    vi.mocked(signInWithGoogle).mockResolvedValue({
      data: null,
      error: { message: 'OAuth failed', code: 'AUTH_ERROR' },
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    const googleButton = screen.getByTestId('google-signin-button');
    await user.click(googleButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('OAuth failed');
    });
  });

  it('should disable button during OAuth flow', async () => {
    const { signInWithGoogle } = await import('@/actions/auth/google');
    vi.mocked(signInWithGoogle).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { url: 'test' }, error: null }), 100))
    );

    const user = userEvent.setup();
    render(<LoginForm />);

    const googleButton = screen.getByTestId('google-signin-button');
    await user.click(googleButton);

    // Button should be disabled during request
    expect(googleButton).toBeDisabled();
  });

  it('should show loading state during OAuth', async () => {
    const { signInWithGoogle } = await import('@/actions/auth/google');
    vi.mocked(signInWithGoogle).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { url: 'test' }, error: null }), 100))
    );

    const user = userEvent.setup();
    render(<LoginForm />);

    const googleButton = screen.getByTestId('google-signin-button');
    await user.click(googleButton);

    // Should show loading text
    expect(googleButton).toHaveTextContent('Signing in with Google...');
  });
});
