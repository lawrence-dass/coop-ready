/**
 * getPrivacyConsent Server Action Tests
 *
 * Story 15.3: Gate Uploads Until Consent Accepted
 *
 * Tests the server action that fetches user privacy consent status
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Setup mocks before import
const mockCookieStore = {
  getAll: vi.fn(() => []),
  set: vi.fn(),
};

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

// Mock Supabase
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabase),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

import { getPrivacyConsent } from '@/actions/privacy/get-privacy-consent';

describe('getPrivacyConsent', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com', is_anonymous: false };
  const mockAnonymousUser = { id: 'anon-456', email: null, is_anonymous: true };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore.getAll.mockReturnValue([]);
  });

  describe('Authenticated User With Consent', () => {
    it('returns consent status when user has accepted', async () => {
      const mockTimestamp = new Date().toISOString();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                privacy_accepted: true,
                privacy_accepted_at: mockTimestamp,
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await getPrivacyConsent();

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        privacyAccepted: true,
        privacyAcceptedAt: new Date(mockTimestamp),
      });
    });

    it('returns false when user has not accepted consent', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                privacy_accepted: false,
                privacy_accepted_at: null,
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await getPrivacyConsent();

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        privacyAccepted: false,
        privacyAcceptedAt: null,
      });
    });

    it('returns false when privacy_accepted is null in database', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                privacy_accepted: null,
                privacy_accepted_at: null,
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await getPrivacyConsent();

      expect(result.error).toBeNull();
      expect(result.data?.privacyAccepted).toBe(false);
    });
  });

  describe('Anonymous User Handling', () => {
    it('returns null for anonymous users (no consent needed)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAnonymousUser },
        error: null,
      });

      const result = await getPrivacyConsent();

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it('returns null when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getPrivacyConsent();

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it('returns null when auth check fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' },
      });

      const result = await getPrivacyConsent();

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('returns VALIDATION_ERROR when database query fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      });

      const result = await getPrivacyConsent();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Database connection failed',
      });
    });

    it('returns VALIDATION_ERROR when unexpected error occurs', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Unexpected error'));

      const result = await getPrivacyConsent();

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('Unexpected error');
    });
  });

  describe('ActionResponse Pattern', () => {
    it('never throws - always returns ActionResponse structure', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Fatal error'));

      const result = await getPrivacyConsent();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      expect(typeof result).toBe('object');
    });
  });
});
