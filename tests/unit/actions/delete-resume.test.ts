/**
 * Delete Resume Server Action Tests
 *
 * Tests the deleteResume server action following the ActionResponse pattern.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteResume } from '@/actions/resume/delete-resume';
import { ERROR_CODES } from '@/types';

// Mock Supabase client methods
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    })
  ),
}));

/**
 * Helper to build the chained Supabase mock for delete().eq().eq().select().single()
 */
function mockDeleteChain(result: { data: unknown; error: unknown }) {
  mockFrom.mockReturnValue({
    delete: () => ({
      eq: (_col1: string, _val1: string) => ({
        eq: (_col2: string, _val2: string) => ({
          select: () => ({
            single: () => Promise.resolve(result),
          }),
        }),
      }),
    }),
  });
}

describe('deleteResume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error if user is not authenticated', async () => {
    // Mock unauthenticated user
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const { data, error } = await deleteResume('some-resume-id');

    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.code).toBe(ERROR_CODES.UNAUTHORIZED);
    expect(error?.message).toContain('signed in');
  });

  it('should successfully delete a resume that belongs to the user', async () => {
    const mockUserId = 'user-123';
    const resumeId = 'resume-456';

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // Mock successful delete (single() returns the deleted row)
    mockDeleteChain({
      data: { id: resumeId, user_id: mockUserId, name: 'My Resume' },
      error: null,
    });

    const { data, error } = await deleteResume(resumeId);

    expect(error).toBeNull();
    expect(data).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('user_resumes');
  });

  it('should return RESUME_NOT_FOUND error when resume does not exist', async () => {
    const mockUserId = 'user-123';
    const resumeId = 'non-existent-resume';

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // Mock PGRST116 error (not found - triggered by .single() on zero rows)
    mockDeleteChain({
      data: null,
      error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
    });

    const { data, error } = await deleteResume(resumeId);

    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.code).toBe(ERROR_CODES.RESUME_NOT_FOUND);
    expect(error?.message).toContain('not found');
  });

  it('should return DELETE_RESUME_ERROR for database errors', async () => {
    const mockUserId = 'user-123';
    const resumeId = 'resume-456';

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // Mock database error
    mockDeleteChain({
      data: null,
      error: { message: 'Database connection failed', code: 'DB_ERROR' },
    });

    const { data, error } = await deleteResume(resumeId);

    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.code).toBe(ERROR_CODES.DELETE_RESUME_ERROR);
    expect(error?.message).toBe('Failed to delete resume. Please try again.');
  });

  it('should handle resume that belongs to another user (RLS blocks)', async () => {
    const mockUserId = 'user-123';
    const resumeId = 'resume-owned-by-another-user';

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // RLS blocks the delete - .single() returns PGRST116 when zero rows match
    mockDeleteChain({
      data: null,
      error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
    });

    const { data, error } = await deleteResume(resumeId);

    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.code).toBe(ERROR_CODES.RESUME_NOT_FOUND);
  });

  it('should validate resume ID is provided', async () => {
    const mockUserId = 'user-123';

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    const { data, error } = await deleteResume('');

    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  it('should catch unexpected thrown errors', async () => {
    const mockUserId = 'user-123';
    const resumeId = 'resume-456';

    // Mock authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // Mock Supabase throwing an unexpected error
    mockFrom.mockReturnValue({
      delete: () => {
        throw new Error('Network failure');
      },
    });

    const { data, error } = await deleteResume(resumeId);

    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.code).toBe(ERROR_CODES.DELETE_RESUME_ERROR);
    expect(error?.message).toBe('Failed to delete resume. Please try again.');
  });
});
