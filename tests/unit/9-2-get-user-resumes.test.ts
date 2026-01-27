import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getUserResumes } from '@/actions/resume/get-user-resumes';
import { ERROR_CODES } from '@/types';

/**
 * Story 9.2: Get User Resumes Unit Tests
 *
 * Tests the getUserResumes server action in isolation.
 *
 * Priority Distribution:
 * - P0: 3 tests (success, auth, database error)
 * - P1: 1 test (empty list)
 */

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Story 9.2: getUserResumes Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('[P0] 9.2-UNIT-001: should return list of user resumes on success', async () => {
    // GIVEN: Authenticated user with 2 saved resumes
    const mockUser = { id: 'user-123' };
    const mockResumes = [
      {
        id: 'resume-1',
        name: 'Software Engineer Resume',
        created_at: '2026-01-26T10:00:00Z',
      },
      {
        id: 'resume-2',
        name: 'Data Scientist Resume',
        created_at: '2026-01-25T15:30:00Z',
      },
    ];

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockResumes,
              error: null,
            }),
          }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    // WHEN: Fetching user resumes
    const result = await getUserResumes();

    // THEN: Should return resumes list ordered by created_at DESC
    expect(result.error).toBeNull();
    expect(result.data).toEqual(mockResumes);
    expect(mockSupabase.from).toHaveBeenCalledWith('user_resumes');
  });

  test('[P0] 9.2-UNIT-002: should return UNAUTHORIZED error when not authenticated', async () => {
    // GIVEN: No authenticated user
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    // WHEN: Attempting to fetch resumes
    const result = await getUserResumes();

    // THEN: Should return UNAUTHORIZED error
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'You must be signed in to view your resumes.',
      code: ERROR_CODES.UNAUTHORIZED,
    });
  });

  test('[P0] 9.2-UNIT-003: should return GET_RESUMES_ERROR on database error', async () => {
    // GIVEN: Authenticated user but database error occurs
    const mockUser = { id: 'user-123' };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Connection timeout' },
            }),
          }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    // WHEN: Fetching resumes fails
    const result = await getUserResumes();

    // THEN: Should return GET_RESUMES_ERROR
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe(ERROR_CODES.GET_RESUMES_ERROR);
    expect(result.error?.message).toContain('Connection timeout');
  });

  test('[P1] 9.2-UNIT-004: should return empty array when user has no saved resumes', async () => {
    // GIVEN: Authenticated user with no saved resumes
    const mockUser = { id: 'user-123' };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    // WHEN: Fetching resumes
    const result = await getUserResumes();

    // THEN: Should return empty array (not an error)
    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });
});
