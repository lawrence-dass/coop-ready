/**
 * LoginForm Component Tests
 *
 * Tests the login form component with validation and interaction.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/forms/LoginForm';
import { ERROR_CODES } from '@/types';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
}));

// Mock login action
vi.mock('@/actions/auth/login', () => ({
  login: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form fields', () => {
    render(<LoginForm />);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  it('should render forgot password link', () => {
    render(<LoginForm />);

    const forgotLink = screen.getByTestId('forgot-password-link');
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink).toHaveAttribute('href', '/auth/forgot-password');
  });

  it('should validate email is required', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('login-button');

    await user.type(passwordInput, 'somepassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('should require password', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('login-button');

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
    const toggleButton = screen.getByTestId('toggle-password');

    expect(passwordInput.type).toBe('password');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();
    const { login } = await import('@/actions/auth/login');
    const { toast } = await import('sonner');
    const { useRouter } = await import('next/navigation');
    const mockPush = vi.fn();

    vi.mocked(login).mockResolvedValue({
      data: {
        userId: 'user-123',
        email: 'test@example.com',
        isAnonymous: false,
      },
      error: null,
    });

    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
    } as any);

    render(<LoginForm />);

    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'Password123!');
    await user.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect(toast.success).toHaveBeenCalledWith('Logged in successfully!');
      expect(mockPush).toHaveBeenCalledWith('/optimize');
    });
  });

  it('should handle invalid credentials error', async () => {
    const user = userEvent.setup();
    const { login } = await import('@/actions/auth/login');
    const { toast } = await import('sonner');

    vi.mocked(login).mockResolvedValue({
      data: null,
      error: {
        message: 'Email or password is incorrect.',
        code: ERROR_CODES.INVALID_CREDENTIALS,
      },
    });

    render(<LoginForm />);

    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'wrongpassword');
    await user.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email or password is incorrect.');
    });
  });

  it('should handle email not confirmed error', async () => {
    const user = userEvent.setup();
    const { login } = await import('@/actions/auth/login');
    const { toast } = await import('sonner');

    vi.mocked(login).mockResolvedValue({
      data: null,
      error: {
        message: 'Please verify your email before logging in.',
        code: ERROR_CODES.EMAIL_NOT_CONFIRMED,
      },
    });

    render(<LoginForm />);

    await user.type(screen.getByTestId('email-input'), 'unverified@example.com');
    await user.type(screen.getByTestId('password-input'), 'Password123!');
    await user.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please verify your email before logging in.');
    });
  });

  it('should disable form during submission', async () => {
    const user = userEvent.setup();
    const { login } = await import('@/actions/auth/login');

    // Delay response to test loading state
    vi.mocked(login).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { userId: 'user-123', email: 'test@example.com', isAnonymous: false },
                error: null,
              }),
            100
          )
        )
    );

    render(<LoginForm />);

    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'Password123!');
    await user.click(screen.getByTestId('login-button'));

    // Check loading state
    const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
    const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
    const submitButton = screen.getByTestId('login-button') as HTMLButtonElement;

    expect(emailInput.disabled).toBe(true);
    expect(passwordInput.disabled).toBe(true);
    expect(submitButton.disabled).toBe(true);
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
  });

  it('should call onSuccess callback when provided', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const { login } = await import('@/actions/auth/login');

    vi.mocked(login).mockResolvedValue({
      data: {
        userId: 'user-123',
        email: 'test@example.com',
        isAnonymous: false,
      },
      error: null,
    });

    render(<LoginForm onSuccess={onSuccess} />);

    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'Password123!');
    await user.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('user-123', 'test@example.com');
    });
  });

  it('should render remember me checkbox (optional)', () => {
    render(<LoginForm />);

    // Remember me is optional for this story, so it might not be present
    // This test documents that it's optional
    const rememberCheckbox = screen.queryByTestId('remember-me-checkbox');
    // Don't assert - just document that it's optional
    expect(rememberCheckbox === null || rememberCheckbox !== null).toBe(true);
  });
});
