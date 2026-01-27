import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getResumeContent } from '@/actions/resume/get-resume-content';
import { ERROR_CODES } from '@/types';

/**
 * Story 9.2: Get Resume Content Unit Tests
 *
 * Tests the getResumeContent server action in isolation.
 *
 * Priority Distribution:
 * - P0: 4 tests (success, auth, not-found, database error)
 */

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Story 9.2: getResumeContent Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('[P0] 9.2-UNIT-005: should return resume content on success', async () => {
    // GIVEN: Authenticated user requests their own resume
    const mockUser = { id: 'user-123' };
    const mockResumeDb = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Software Engineer Resume',
      resume_content: 'John Doe\\nSoftware Engineer\\n...',
    };
    const expectedResume = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Software Engineer Resume',
      resumeContent: 'John Doe\\nSoftware Engineer\\n...',
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockResumeDb,
            error: null,
          }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    // WHEN: Fetching resume content
    const result = await getResumeContent('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

    // THEN: Should return resume with content (in camelCase)
    expect(result.error).toBeNull();
    expect(result.data).toEqual(expectedResume);
    expect(mockSupabase.from).toHaveBeenCalledWith('user_resumes');
  });

  test('[P0] 9.2-UNIT-006: should return UNAUTHORIZED error when not authenticated', async () => {
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

    // WHEN: Attempting to fetch resume content
    const result = await getResumeContent('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

    // THEN: Should return UNAUTHORIZED error
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'You must be signed in to view resume content.',
      code: ERROR_CODES.UNAUTHORIZED,
    });
  });

  test('[P0] 9.2-UNIT-007: should return RESUME_NOT_FOUND when resume does not exist', async () => {
    // GIVEN: Authenticated user requests non-existent resume
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
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
          }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    // WHEN: Fetching non-existent resume
    const result = await getResumeContent('b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22');

    // THEN: Should return RESUME_NOT_FOUND error
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe(ERROR_CODES.RESUME_NOT_FOUND);
  });

  test('[P0] 9.2-UNIT-008a: should return VALIDATION_ERROR for invalid resume ID format', async () => {
    // GIVEN: An invalid (non-UUID) resume ID
    // WHEN: Attempting to fetch resume content with invalid ID
    const result = await getResumeContent('not-a-valid-uuid');

    // THEN: Should return VALIDATION_ERROR without hitting database
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(result.error?.message).toContain('Invalid resume ID');
  });

  test('[P0] 9.2-UNIT-008: should return GET_RESUME_CONTENT_ERROR on database error', async () => {
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
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'CONNECTION_ERROR', message: 'Database timeout' },
          }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    // WHEN: Fetching resume content fails
    const result = await getResumeContent('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

    // THEN: Should return GET_RESUME_CONTENT_ERROR
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe(ERROR_CODES.GET_RESUME_CONTENT_ERROR);
    expect(result.error?.message).toContain('Database timeout');
  });
});
