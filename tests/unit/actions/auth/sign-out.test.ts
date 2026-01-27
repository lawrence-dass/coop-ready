/**
 * Sign-Out Server Action Tests
 *
 * Tests the sign-out server action following ActionResponse pattern.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signOut } from '@/actions/auth/sign-out';
import { ERROR_CODES } from '@/types';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signOut: vi.fn(),
    },
  })),
}));

describe('signOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful sign-out', () => {
    it('returns success when sign-out succeeds', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSignOut = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(createClient).mockReturnValue({
        auth: {
          signOut: mockSignOut,
        },
      } as any);

      const result = await signOut();

      expect(result).toEqual({
        data: { success: true },
        error: null,
      });
      expect(mockSignOut).toHaveBeenCalledOnce();
    });

    it('calls supabase.auth.signOut()', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSignOut = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(createClient).mockReturnValue({
        auth: {
          signOut: mockSignOut,
        },
      } as any);

      await signOut();

      expect(mockSignOut).toHaveBeenCalledWith();
    });
  });

  describe('error handling', () => {
    it('returns error response when Supabase signOut fails', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const supabaseError = {
        message: 'Failed to sign out',
        status: 500,
      };
      const mockSignOut = vi.fn().mockResolvedValue({ error: supabaseError });

      vi.mocked(createClient).mockReturnValue({
        auth: {
          signOut: mockSignOut,
        },
      } as any);

      const result = await signOut();

      expect(result).toEqual({
        data: null,
        error: {
          message: 'Failed to sign out',
          code: ERROR_CODES.SIGN_OUT_ERROR,
        },
      });
    });

    it('handles network errors gracefully', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSignOut = vi.fn().mockRejectedValue(new Error('Network error'));

      vi.mocked(createClient).mockReturnValue({
        auth: {
          signOut: mockSignOut,
        },
      } as any);

      const result = await signOut();

      expect(result).toEqual({
        data: null,
        error: {
          message: 'Sign out failed: Network error',
          code: ERROR_CODES.SIGN_OUT_ERROR,
        },
      });
    });

    it('handles unexpected errors with generic message', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSignOut = vi.fn().mockRejectedValue('Unknown error');

      vi.mocked(createClient).mockReturnValue({
        auth: {
          signOut: mockSignOut,
        },
      } as any);

      const result = await signOut();

      expect(result).toEqual({
        data: null,
        error: {
          message: 'Sign out failed: Unknown error',
          code: ERROR_CODES.SIGN_OUT_ERROR,
        },
      });
    });
  });

  describe('ActionResponse pattern compliance', () => {
    it('never throws errors', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSignOut = vi.fn().mockRejectedValue(new Error('Critical failure'));

      vi.mocked(createClient).mockReturnValue({
        auth: {
          signOut: mockSignOut,
        },
      } as any);

      // Should not throw - must return error response
      await expect(signOut()).resolves.toBeDefined();
    });

    it('always returns discriminated union type', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSignOut = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(createClient).mockReturnValue({
        auth: {
          signOut: mockSignOut,
        },
      } as any);

      const result = await signOut();

      // Must have either data or error, but not both
      expect(
        (result.data !== null && result.error === null) ||
        (result.data === null && result.error !== null)
      ).toBe(true);
    });
  });
});
