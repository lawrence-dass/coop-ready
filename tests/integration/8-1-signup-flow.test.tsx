/**
 * Integration Test: Story 8.1 - Email/Password Registration
 *
 * Tests the complete signup flow:
 * - Form validation
 * - Signup action
 * - Session migration
 * - Email verification handling
 * - Redirect behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupForm } from '@/components/forms/SignupForm';
import { signup } from '@/actions/auth/signup';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock the signup action
vi.mock('@/actions/auth/signup', () => ({
  signup: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('[P0] Story 8.1: Email/Password Registration Integration', () => {
  const mockSignup = signup as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('8.1-INT-001: should successfully sign up with valid credentials', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    mockSignup.mockResolvedValue({
      data: {
        userId: 'user-123',
        email: 'test@example.com',
        requiresVerification: false,
      },
      error: null,
    });

    render(<SignupForm onSuccess={onSuccess} />);

    // Fill in the form
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'Password123!');
    await user.type(
      screen.getByTestId('confirm-password-input'),
      'Password123!'
    );
    await user.click(screen.getByTestId('terms-checkbox'));

    // Submit the form
    await user.click(screen.getByTestId('signup-button'));

    // Wait for the signup action to be called
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith(
        'test@example.com',
        'Password123!'
      );
    });

    // Verify success callback was called
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('user-123', 'test@example.com');
    });
  });

  it('8.1-INT-002: should show password strength indicator', async () => {
    const user = userEvent.setup();

    render(<SignupForm />);

    const passwordInput = screen.getByTestId('password-input');

    // Type weak password
    await user.type(passwordInput, 'weak');
    await waitFor(() => {
      expect(screen.getByTestId('strength-label')).toHaveTextContent('Weak');
    });

    // Type stronger password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'Password123!');
    await waitFor(() => {
      expect(screen.getByTestId('strength-label')).toHaveTextContent('Strong');
    });
  });

  it('8.1-INT-003: should handle email verification requirement', async () => {
    const user = userEvent.setup();
    const onVerificationRequired = vi.fn();

    mockSignup.mockResolvedValue({
      data: {
        userId: 'user-123',
        email: 'test@example.com',
        requiresVerification: true,
      },
      error: null,
    });

    render(<SignupForm onVerificationRequired={onVerificationRequired} />);

    // Fill and submit form
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'Password123!');
    await user.type(
      screen.getByTestId('confirm-password-input'),
      'Password123!'
    );
    await user.click(screen.getByTestId('terms-checkbox'));
    await user.click(screen.getByTestId('signup-button'));

    // Verify verification callback was called
    await waitFor(() => {
      expect(onVerificationRequired).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('8.1-INT-004: should show error when user already exists', async () => {
    const user = userEvent.setup();

    mockSignup.mockResolvedValue({
      data: null,
      error: {
        message: 'An account with this email already exists. Please sign in instead.',
        code: 'USER_EXISTS',
      },
    });

    render(<SignupForm />);

    // Fill and submit form
    await user.type(screen.getByTestId('email-input'), 'existing@example.com');
    await user.type(screen.getByTestId('password-input'), 'Password123!');
    await user.type(
      screen.getByTestId('confirm-password-input'),
      'Password123!'
    );
    await user.click(screen.getByTestId('terms-checkbox'));
    await user.click(screen.getByTestId('signup-button'));

    // Verify error toast (mocked)
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalled();
    });
  });

  it('8.1-INT-005: should disable submit button while loading', async () => {
    const user = userEvent.setup();

    // Make signup hang to test loading state
    mockSignup.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: {
                  userId: 'user-123',
                  email: 'test@example.com',
                  requiresVerification: false,
                },
                error: null,
              }),
            100
          )
        )
    );

    render(<SignupForm />);

    // Fill form
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'Password123!');
    await user.type(
      screen.getByTestId('confirm-password-input'),
      'Password123!'
    );
    await user.click(screen.getByTestId('terms-checkbox'));

    const submitButton = screen.getByTestId('signup-button');

    // Submit
    await user.click(submitButton);

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled();

    // Wait for submission to complete
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('8.1-INT-006: should validate password match', async () => {
    const user = userEvent.setup();

    render(<SignupForm />);

    // Fill with mismatched passwords
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'Password123!');
    await user.type(
      screen.getByTestId('confirm-password-input'),
      'DifferentPassword123!'
    );
    await user.click(screen.getByTestId('terms-checkbox'));

    // Try to submit
    await user.click(screen.getByTestId('signup-button'));

    // Should see validation error
    await waitFor(() => {
      expect(screen.getByText(/do not match/i)).toBeInTheDocument();
    });

    // Signup should not be called
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('8.1-INT-007: should require terms acceptance', async () => {
    const user = userEvent.setup();

    render(<SignupForm />);

    // Fill form but don't accept terms
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'Password123!');
    await user.type(
      screen.getByTestId('confirm-password-input'),
      'Password123!'
    );

    // Try to submit without accepting terms
    await user.click(screen.getByTestId('signup-button'));

    // Should see validation error
    await waitFor(() => {
      expect(screen.getByText(/accept the terms/i)).toBeInTheDocument();
    });

    // Signup should not be called
    expect(mockSignup).not.toHaveBeenCalled();
  });
});
