/**
 * Tests for OAuth callback page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect } from 'next/navigation';

// Mock next/navigation
// redirect() in Next.js throws a NEXT_REDIRECT error to stop execution
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

// Mock Supabase client
const mockExchangeCodeForSession = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
    from: vi.fn(() => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          single: mockSingle,
        }),
      }),
    })),
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

  it('should redirect to /optimize when onboarding is complete', async () => {
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

    // Mock profile check - user has completed onboarding
    mockSingle.mockResolvedValue({
      data: { onboarding_complete: true },
      error: null,
    });

    // Dynamic import to get the page component
    const { default: CallbackPage } = await import('@/app/auth/callback/page');

    // redirect() throws to stop execution
    await expect(CallbackPage({ searchParams: mockSearchParams })).rejects.toThrow();

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('oauth_code_123');
    expect(redirect).toHaveBeenCalledWith('/optimize');
  });

  it('should redirect to /auth/onboarding when onboarding is not complete', async () => {
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

    // Mock profile check - user has NOT completed onboarding
    mockSingle.mockResolvedValue({
      data: { onboarding_complete: false },
      error: null,
    });

    const { default: CallbackPage } = await import('@/app/auth/callback/page');

    await expect(CallbackPage({ searchParams: mockSearchParams })).rejects.toThrow();

    expect(redirect).toHaveBeenCalledWith('/auth/onboarding');
  });

  it('should redirect to /auth/onboarding when profile does not exist', async () => {
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

    // Mock profile check - no profile found
    mockSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    const { default: CallbackPage } = await import('@/app/auth/callback/page');

    await expect(CallbackPage({ searchParams: mockSearchParams })).rejects.toThrow();

    expect(redirect).toHaveBeenCalledWith('/auth/onboarding');
  });

  it('should redirect to /auth/error when no code is provided', async () => {
    const mockSearchParams = Promise.resolve({});

    const { default: CallbackPage } = await import('@/app/auth/callback/page');

    // redirect() throws to stop execution
    await expect(CallbackPage({ searchParams: mockSearchParams })).rejects.toThrow();

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

    // redirect() throws to stop execution
    await expect(CallbackPage({ searchParams: mockSearchParams })).rejects.toThrow();

    expect(redirect).toHaveBeenCalledWith('/auth/error?message=OAuth authentication failed');
  });
});
