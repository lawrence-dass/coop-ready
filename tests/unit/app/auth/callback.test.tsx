/**
 * Tests for OAuth callback page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock Supabase client
const mockExchangeCodeForSession = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  })),
}));

// Mock Next.js request
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('OAuth Callback Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should exchange code for session and redirect to / on success', async () => {
    const mockSearchParams = Promise.resolve({
      code: 'oauth_code_123',
    });

    mockExchangeCodeForSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'token',
          user: { id: 'user-123' },
        },
      },
      error: null,
    });

    // Dynamic import to get the page component
    const { default: CallbackPage } = await import('@/app/auth/callback/page');
    await CallbackPage({ searchParams: mockSearchParams });

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('oauth_code_123');
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('should redirect to /auth/error when no code is provided', async () => {
    const mockSearchParams = Promise.resolve({});

    const { default: CallbackPage } = await import('@/app/auth/callback/page');
    await CallbackPage({ searchParams: mockSearchParams });

    expect(redirect).toHaveBeenCalledWith('/auth/error?message=No code provided');
  });

  it('should redirect to /auth/error when session exchange fails', async () => {
    const mockSearchParams = Promise.resolve({
      code: 'oauth_code_123',
    });

    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: {
        name: 'AuthError',
        message: 'Invalid OAuth code',
      },
    });

    const { default: CallbackPage } = await import('@/app/auth/callback/page');
    await CallbackPage({ searchParams: mockSearchParams });

    expect(redirect).toHaveBeenCalledWith('/auth/error?message=OAuth authentication failed');
  });
});
