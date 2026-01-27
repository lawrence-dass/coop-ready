/**
 * Tests for Google OAuth server action
 *
 * @jest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mock functions
const mockSignInWithOAuth = vi.fn();

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  })),
}));

describe('signInWithGoogle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return OAuth URL on success', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: {
        provider: 'google',
        url: 'https://accounts.google.com/o/oauth2/v2/auth?...',
      },
      error: null,
    });

    const { signInWithGoogle } = await import('@/actions/auth/google');
    const result = await signInWithGoogle();

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      url: 'https://accounts.google.com/o/oauth2/v2/auth?...',
    });
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/auth/callback'),
      },
    });
  });

  it('should return error when OAuth initiation fails', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { provider: 'google', url: '' },
      error: {
        name: 'AuthError',
        message: 'OAuth provider error',
        status: 500,
      },
    });

    const { signInWithGoogle } = await import('@/actions/auth/google');
    const result = await signInWithGoogle();

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'OAuth provider error',
      code: 'AUTH_ERROR',
    });
  });

  it('should handle network errors gracefully', async () => {
    mockSignInWithOAuth.mockRejectedValue(new Error('Network error'));

    const { signInWithGoogle } = await import('@/actions/auth/google');
    const result = await signInWithGoogle();

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'Failed to initiate Google sign-in',
      code: 'AUTH_ERROR',
    });
  });

  it('should use correct redirect URL from environment', async () => {
    const originalEnv = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

    mockSignInWithOAuth.mockResolvedValue({
      data: {
        provider: 'google',
        url: 'https://accounts.google.com/o/oauth2/v2/auth?...',
      },
      error: null,
    });

    const { signInWithGoogle } = await import('@/actions/auth/google');
    await signInWithGoogle();

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://example.com/auth/callback',
      },
    });

    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
  });
});
