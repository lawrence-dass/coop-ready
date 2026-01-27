import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getOptimizationSession } from '@/actions/history/get-session';
import * as supabaseServer from '@/lib/supabase/server';
import * as sessionsLib from '@/lib/supabase/sessions';
import type { OptimizationSession } from '@/types';

/**
 * Story 10.2: Session Reload Server Action Tests
 *
 * Tests the getOptimizationSession server action for:
 * - User authorization
 * - Session data retrieval
 * - Error handling
 *
 * Priority Distribution:
 * - P0: 4 tests (auth, user isolation, session found, session not found)
 * - P1: 2 tests (invalid UUID, error handling)
 */

vi.mock('@/lib/supabase/server');
vi.mock('@/lib/supabase/sessions');

describe('Story 10.2: getOptimizationSession Server Action', () => {
  const mockUser = { id: 'user-123' };
  const mockSessionId = '550e8400-e29b-41d4-a716-446655440000';

  const mockSession: OptimizationSession = {
    id: mockSessionId,
    anonymousId: 'anon-123',
    userId: mockUser.id,
    resumeContent: {
      rawText: 'Mock Resume Content',
    },
    jobDescription: 'Mock Job Description',
    atsScore: {
      overall: 85,
      breakdown: {
        keywordScore: 70,
        sectionCoverageScore: 90,
        contentQualityScore: 95,
      },
      calculatedAt: new Date('2024-01-01').toISOString(),
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('[P0] 10.2-SA-001: should return session data for authenticated user', async () => {
    // GIVEN: User is authenticated and owns the session
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    };

    vi.mocked(supabaseServer.createClient).mockResolvedValue(
      mockSupabase as any
    );
    vi.mocked(sessionsLib.getSessionById).mockResolvedValue({
      data: mockSession,
      error: null,
    });

    // WHEN: Fetching session by ID
    const result = await getOptimizationSession(mockSessionId);

    // THEN: Should return session data
    expect(result.error).toBeNull();
    expect(result.data).toEqual(mockSession);
    expect(sessionsLib.getSessionById).toHaveBeenCalledWith(
      mockSessionId,
      mockUser.id
    );
  });

  test('[P0] 10.2-SA-002: should enforce user isolation (cannot access other users\' sessions)', async () => {
    // GIVEN: User is authenticated
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    };

    vi.mocked(supabaseServer.createClient).mockResolvedValue(
      mockSupabase as any
    );

    // AND: getSessionById returns null (user doesn't own session)
    vi.mocked(sessionsLib.getSessionById).mockResolvedValue({
      data: null,
      error: null,
    });

    // WHEN: Trying to fetch another user's session
    const result = await getOptimizationSession(mockSessionId);

    // THEN: Should return SESSION_NOT_FOUND error
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'Session not found or you do not have access to it',
      code: 'SESSION_NOT_FOUND',
    });
  });

  test('[P0] 10.2-SA-003: should return UNAUTHORIZED error when not authenticated', async () => {
    // GIVEN: User is not authenticated
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    };

    vi.mocked(supabaseServer.createClient).mockResolvedValue(
      mockSupabase as any
    );

    // WHEN: Trying to fetch session
    const result = await getOptimizationSession(mockSessionId);

    // THEN: Should return UNAUTHORIZED error
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'You must be logged in to view session history',
      code: 'UNAUTHORIZED',
    });
    expect(sessionsLib.getSessionById).not.toHaveBeenCalled();
  });

  test('[P0] 10.2-SA-004: should return SESSION_NOT_FOUND when session does not exist', async () => {
    // GIVEN: User is authenticated
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    };

    vi.mocked(supabaseServer.createClient).mockResolvedValue(
      mockSupabase as any
    );

    // AND: Session is not found in database
    vi.mocked(sessionsLib.getSessionById).mockResolvedValue({
      data: null,
      error: null,
    });

    // WHEN: Fetching non-existent session
    const result = await getOptimizationSession(mockSessionId);

    // THEN: Should return SESSION_NOT_FOUND error
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('SESSION_NOT_FOUND');
  });

  test('[P1] 10.2-SA-005: should validate session ID format (reject invalid UUIDs)', async () => {
    // GIVEN: Invalid session ID format
    const invalidSessionId = 'not-a-uuid';

    // WHEN: Trying to fetch with invalid ID
    const result = await getOptimizationSession(invalidSessionId);

    // THEN: Should return VALIDATION_ERROR
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'Invalid session ID format',
      code: 'VALIDATION_ERROR',
    });

    // AND: Should not attempt database query
    expect(supabaseServer.createClient).not.toHaveBeenCalled();
  });

  test('[P1] 10.2-SA-006: should handle database errors gracefully', async () => {
    // GIVEN: User is authenticated
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    };

    vi.mocked(supabaseServer.createClient).mockResolvedValue(
      mockSupabase as any
    );

    // AND: Database returns an error
    vi.mocked(sessionsLib.getSessionById).mockResolvedValue({
      data: null,
      error: {
        message: 'Database connection failed',
        code: 'GET_SESSION_ERROR',
      },
    });

    // WHEN: Fetching session
    const result = await getOptimizationSession(mockSessionId);

    // THEN: Should propagate database error
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('GET_SESSION_ERROR');
  });
});
