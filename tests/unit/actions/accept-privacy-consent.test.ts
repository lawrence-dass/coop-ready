/**
 * acceptPrivacyConsent Server Action Tests
 *
 * Story 15.3: Gate Uploads Until Consent Accepted
 *
 * Tests the server action that updates user privacy consent status
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

import { acceptPrivacyConsent } from '@/actions/privacy/accept-privacy-consent';

describe('acceptPrivacyConsent', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore.getAll.mockReturnValue([]);
  });

  describe('AC #2: Update privacy consent when user accepts', () => {
    it('returns success when consent is successfully updated', async () => {
      const mockTimestamp = new Date().toISOString();

      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock database update
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
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

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });

      const result = await acceptPrivacyConsent();

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        privacyAccepted: true,
        privacyAcceptedAt: new Date(mockTimestamp),
      });

      // Verify database was updated correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith({
        privacy_accepted: true,
        privacy_accepted_at: expect.any(String),
      });
    });

    it('sets privacy_accepted to true in database', async () => {
      const mockTimestamp = new Date().toISOString();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
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

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });

      const result = await acceptPrivacyConsent();

      expect(result.data?.privacyAccepted).toBe(true);
    });

    it('records privacy_accepted_at timestamp', async () => {
      const mockTimestamp = new Date().toISOString();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
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

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });

      const result = await acceptPrivacyConsent();

      expect(result.data?.privacyAcceptedAt).toBeInstanceOf(Date);
      expect(result.data?.privacyAcceptedAt).toEqual(new Date(mockTimestamp));
    });
  });

  describe('Error Handling', () => {
    it('returns UNAUTHORIZED error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await acceptPrivacyConsent();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    });

    it('returns UNAUTHORIZED error when auth check fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth failed' },
      });

      const result = await acceptPrivacyConsent();

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });

    it('returns VALIDATION_ERROR when database update fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
              }),
            }),
          }),
        }),
      });

      const result = await acceptPrivacyConsent();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Database connection failed',
      });
    });

    it('returns VALIDATION_ERROR when unexpected error occurs', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Unexpected error'));

      const result = await acceptPrivacyConsent();

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('Unexpected error');
    });
  });

  describe('RLS Enforcement', () => {
    it('updates only the authenticated user profile', async () => {
      const mockTimestamp = new Date().toISOString();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              privacy_accepted: true,
              privacy_accepted_at: mockTimestamp,
            },
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      await acceptPrivacyConsent();

      // Verify RLS enforcement via .eq('id', user.id)
      expect(mockEq).toHaveBeenCalledWith('id', mockUser.id);
    });
  });

  describe('ActionResponse Pattern', () => {
    it('never throws - always returns ActionResponse structure', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Fatal error'));

      const result = await acceptPrivacyConsent();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      expect(typeof result).toBe('object');
    });

    it('returns data=null when error occurs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user' },
      });

      const result = await acceptPrivacyConsent();

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
    });

    it('returns error=null when success occurs', async () => {
      const mockTimestamp = new Date().toISOString();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  privacy_accepted: true,
                  privacy_accepted_at: mockTimestamp,
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await acceptPrivacyConsent();

      expect(result.data).not.toBeNull();
      expect(result.error).toBeNull();
    });
  });
});
