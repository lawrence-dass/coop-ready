/**
 * Login Server Action Tests
 *
 * Tests the email/password login server action following TDD approach.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login } from '@/actions/auth/login';
import { ERROR_CODES } from '@/types';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      getSession: vi.fn(),
    },
  })),
}));

describe('login server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validation', () => {
    it('should reject empty email', async () => {
      const result = await login('', 'password123');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(ERROR_CODES.INVALID_EMAIL);
    });

    it('should reject invalid email format', async () => {
      const result = await login('notanemail', 'password123');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(ERROR_CODES.INVALID_EMAIL);
    });

    it('should reject empty password', async () => {
      const result = await login('test@example.com', '');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('authentication', () => {
    it('should handle invalid credentials', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSignIn = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 401 },
      });

      vi.mocked(createClient).mockReturnValue({
        auth: {
          signInWithPassword: mockSignIn,
          getSession: vi.fn(),
        },
      } as any);

      const result = await login('test@example.com', 'wrongpassword');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(ERROR_CODES.INVALID_CREDENTIALS);
      expect(result.error?.message).toContain('incorrect');
    });

    it('should handle successful login', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: '2026-01-01',
      };

      const mockSignIn = vi.fn().mockResolvedValue({
        data: {
          user: mockUser,
          session: { access_token: 'token-123' },
        },
        error: null,
      });

      vi.mocked(createClient).mockReturnValue({
        auth: {
          signInWithPassword: mockSignIn,
          getSession: vi.fn(),
        },
      } as any);

      const result = await login('test@example.com', 'correct-password');

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.userId).toBe('user-123');
      expect(result.data?.email).toBe('test@example.com');
    });

    it('should handle unverified email', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSignIn = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed', code: 'email_not_confirmed' },
      });

      vi.mocked(createClient).mockReturnValue({
        auth: {
          signInWithPassword: mockSignIn,
          getSession: vi.fn(),
        },
      } as any);

      const result = await login('unverified@example.com', 'password123');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(ERROR_CODES.EMAIL_NOT_CONFIRMED);
    });

    it('should handle network/API errors', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSignIn = vi.fn().mockRejectedValue(new Error('Network error'));

      vi.mocked(createClient).mockReturnValue({
        auth: {
          signInWithPassword: mockSignIn,
          getSession: vi.fn(),
        },
      } as any);

      const result = await login('test@example.com', 'password123');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(ERROR_CODES.AUTH_ERROR);
    });
  });

  describe('ActionResponse pattern', () => {
    it('should never throw errors', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSignIn = vi.fn().mockRejectedValue(new Error('Catastrophic failure'));

      vi.mocked(createClient).mockReturnValue({
        auth: {
          signInWithPassword: mockSignIn,
          getSession: vi.fn(),
        },
      } as any);

      // Should not throw
      const result = await login('test@example.com', 'password');

      expect(result).toBeDefined();
      expect(result.error).toBeDefined();
    });

    it('should return correct discriminated union on success', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSignIn = vi.fn().mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com', email_confirmed_at: '2026-01-01' },
          session: { access_token: 'token' },
        },
        error: null,
      });

      vi.mocked(createClient).mockReturnValue({
        auth: {
          signInWithPassword: mockSignIn,
          getSession: vi.fn(),
        },
      } as any);

      const result = await login('test@example.com', 'password');

      // Type guard
      if (result.error) {
        throw new Error('Expected success');
      }

      // TypeScript should know data is not null here
      expect(result.data.userId).toBe('user-123');
      expect(result.error).toBeNull();
    });

    it('should return correct discriminated union on error', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSignIn = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid', status: 401 },
      });

      vi.mocked(createClient).mockReturnValue({
        auth: {
          signInWithPassword: mockSignIn,
          getSession: vi.fn(),
        },
      } as any);

      const result = await login('test@example.com', 'wrong');

      // Type guard
      if (result.data) {
        throw new Error('Expected error');
      }

      // TypeScript should know error is not null here
      expect(result.error.code).toBe(ERROR_CODES.INVALID_CREDENTIALS);
      expect(result.data).toBeNull();
    });
  });

  describe('performance', () => {
    it('should complete login in under 2 seconds', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSignIn = vi.fn().mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com', email_confirmed_at: '2026-01-01' },
          session: { access_token: 'token' },
        },
        error: null,
      });

      vi.mocked(createClient).mockReturnValue({
        auth: {
          signInWithPassword: mockSignIn,
          getSession: vi.fn(),
        },
      } as any);

      const start = Date.now();
      await login('test@example.com', 'password');
      const duration = Date.now() - start;

      // Should be very fast in tests (< 100ms)
      // In production with real Supabase, should be < 2000ms
      expect(duration).toBeLessThan(100);
    });
  });
});
