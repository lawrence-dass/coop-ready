import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getOptimizationHistory } from '@/actions/history/get-optimization-history';
import { ERROR_CODES } from '@/types';

/**
 * Story 10.1: Get Optimization History Unit Tests
 *
 * Tests the getOptimizationHistory server action in isolation.
 *
 * Priority Distribution:
 * - P0: 3 tests (success, auth, database error)
 * - P1: 2 tests (empty list, metadata extraction)
 */

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Story 10.1: getOptimizationHistory Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('[P0] 10.1-UNIT-001: should return list of optimization sessions on success', async () => {
    // GIVEN: Authenticated user with 2 optimization sessions
    const mockUser = { id: 'user-123' };
    const mockSessions = [
      {
        id: 'session-1',
        created_at: '2026-01-27T10:00:00Z',
        resume_content: 'John Smith\nSoftware Engineer\nExperience...',
        jd_content: 'Senior Developer\nat TechCorp\nWe are seeking...',
        analysis: { atsScore: { overall: 85 } },
        summary_suggestion: { suggestedText: 'Improved summary' },
        skills_suggestion: { suggestedText: 'Add React, TypeScript' },
        experience_suggestion: null,
      },
      {
        id: 'session-2',
        created_at: '2026-01-26T15:30:00Z',
        resume_content: 'Jane Doe\nData Scientist\nSkills...',
        jd_content: 'Data Analyst\nRequired skills: Python, SQL',
        analysis: { atsScore: { overall: 72 } },
        summary_suggestion: null,
        skills_suggestion: { suggestedText: 'Add Python' },
        experience_suggestion: { suggestedText: 'Highlight ML projects' },
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
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockSessions,
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    // WHEN: Fetching optimization history
    const result = await getOptimizationHistory();

    // THEN: Should return transformed history sessions
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data![0]).toMatchObject({
      id: 'session-1',
      createdAt: new Date('2026-01-27T10:00:00Z'),
      atsScore: 85,
      suggestionCount: 2,
    });
    expect(result.data![1]).toMatchObject({
      id: 'session-2',
      atsScore: 72,
      suggestionCount: 2,
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('sessions');
  });

  test('[P0] 10.1-UNIT-002: should return UNAUTHORIZED error when not authenticated', async () => {
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

    // WHEN: Attempting to fetch history
    const result = await getOptimizationHistory();

    // THEN: Should return UNAUTHORIZED error
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'You must be signed in to view your optimization history.',
      code: ERROR_CODES.UNAUTHORIZED,
    });
  });

  test('[P0] 10.1-UNIT-003: should return GET_HISTORY_ERROR on database error', async () => {
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
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Connection timeout' },
              }),
            }),
          }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    // WHEN: Fetching history fails
    const result = await getOptimizationHistory();

    // THEN: Should return GET_HISTORY_ERROR
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe(ERROR_CODES.GET_HISTORY_ERROR);
    expect(result.error?.message).toContain('Connection timeout');
  });

  test('[P1] 10.1-UNIT-004: should return empty array when user has no optimization history', async () => {
    // GIVEN: Authenticated user with no optimization sessions
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
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    // WHEN: Fetching history
    const result = await getOptimizationHistory();

    // THEN: Should return empty array (not an error)
    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  test('[P1] 10.1-UNIT-005: should extract resume name, job title, and company from content', async () => {
    // GIVEN: Authenticated user with session containing extractable metadata
    const mockUser = { id: 'user-123' };
    const mockSessions = [
      {
        id: 'session-1',
        created_at: '2026-01-27T10:00:00Z',
        resume_content: 'John Smith\nSoftware Engineer\n\nExperience:\nDeveloped...',
        jd_content: 'Senior Full Stack Developer\nat TechCorp Inc.\n\nRequirements:\nWe are seeking...',
        analysis: { atsScore: { overall: 88 } },
        summary_suggestion: { suggestedText: 'Improved summary' },
        skills_suggestion: null,
        experience_suggestion: null,
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
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockSessions,
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    // WHEN: Fetching history
    const result = await getOptimizationHistory();

    // THEN: Should extract metadata correctly
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0]).toMatchObject({
      id: 'session-1',
      resumeName: 'John Smith',
      jobTitle: 'Senior Full Stack Developer',
      companyName: 'TechCorp Inc.',
      atsScore: 88,
      suggestionCount: 1,
    });
  });
});
