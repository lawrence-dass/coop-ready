/**
 * Save Resume Action Unit Tests
 *
 * Tests the save-resume server action following TDD principles
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveResume } from '@/actions/resume/save-resume';
import { ERROR_CODES } from '@/types';

// Mock Supabase client
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

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

describe('saveResume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return UNAUTHORIZED when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await saveResume('Sample resume content', 'My Resume');

    expect(result.error).toBeTruthy();
    expect(result.error?.code).toBe(ERROR_CODES.UNAUTHORIZED);
    expect(result.data).toBeNull();
  });

  it('should return VALIDATION_ERROR when resume content is empty', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const result = await saveResume('   ', 'My Resume');

    expect(result.error).toBeTruthy();
    expect(result.error?.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(result.error?.message).toContain('empty');
  });

  it('should return VALIDATION_ERROR when resume name is empty', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const result = await saveResume('Sample resume content', '   ');

    expect(result.error).toBeTruthy();
    expect(result.error?.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(result.error?.message).toContain('name');
  });

  it('should return VALIDATION_ERROR when resume name exceeds 100 characters', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const longName = 'a'.repeat(101);
    const result = await saveResume('Sample resume content', longName);

    expect(result.error).toBeTruthy();
    expect(result.error?.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  it('should return RESUME_LIMIT_EXCEEDED when user has 3 resumes', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockEq.mockResolvedValue({
      count: 3,
      data: [],
      error: null,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    const result = await saveResume('Sample resume content', 'My Resume');

    expect(result.error).toBeTruthy();
    expect(result.error?.code).toBe(ERROR_CODES.RESUME_LIMIT_EXCEEDED);
    expect(result.error?.message).toContain('maximum');
    // Verify count query uses head: true for performance (no row data fetched)
    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
  });

  it('should successfully save resume when all validations pass', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock count check
    const mockEqForCount = vi.fn().mockResolvedValue({
      count: 1,
      data: [],
      error: null,
    });

    const mockSelectForCount = vi.fn().mockReturnValue({
      eq: mockEqForCount,
    });

    // Mock insert
    mockSingle.mockResolvedValue({
      data: { id: 'resume-456', name: 'My Resume' },
      error: null,
    });

    const mockSelectForInsert = vi.fn().mockReturnValue({
      single: mockSingle,
    });

    mockInsert.mockReturnValue({
      select: mockSelectForInsert,
    });

    // Mock from() calls
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call is for count
        return { select: mockSelectForCount };
      } else {
        // Second call is for insert
        return { insert: mockInsert };
      }
    });

    const result = await saveResume('Sample resume content', 'My Resume');

    expect(result.data).toBeTruthy();
    expect(result.data?.id).toBe('resume-456');
    expect(result.data?.name).toBe('My Resume');
    expect(result.error).toBeNull();
  });

  it('should return SAVE_RESUME_ERROR when database insert fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock count check
    const mockEqForCount = vi.fn().mockResolvedValue({
      count: 1,
      data: [],
      error: null,
    });

    const mockSelectForCount = vi.fn().mockReturnValue({
      eq: mockEqForCount,
    });

    // Mock insert failure
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const mockSelectForInsert = vi.fn().mockReturnValue({
      single: mockSingle,
    });

    mockInsert.mockReturnValue({
      select: mockSelectForInsert,
    });

    // Mock from() calls
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockSelectForCount };
      } else {
        return { insert: mockInsert };
      }
    });

    const result = await saveResume('Sample resume content', 'My Resume');

    expect(result.error).toBeTruthy();
    expect(result.error?.code).toBe(ERROR_CODES.SAVE_RESUME_ERROR);
    expect(result.data).toBeNull();
  });

  it('should pass fileName to database insert when provided', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock count check
    const mockEqForCount = vi.fn().mockResolvedValue({
      count: 0,
      data: [],
      error: null,
    });

    const mockSelectForCount = vi.fn().mockReturnValue({
      eq: mockEqForCount,
    });

    // Mock insert - capture the insert payload
    const capturedInsert = vi.fn();
    mockSingle.mockResolvedValue({
      data: { id: 'resume-789', name: 'My Resume' },
      error: null,
    });

    const mockSelectForInsert = vi.fn().mockReturnValue({
      single: mockSingle,
    });

    capturedInsert.mockReturnValue({
      select: mockSelectForInsert,
    });

    // Mock from() calls
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockSelectForCount };
      } else {
        return { insert: capturedInsert };
      }
    });

    const result = await saveResume('Resume text', 'My Resume', 'resume.pdf');

    expect(result.data).toBeTruthy();
    expect(capturedInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        file_name: 'resume.pdf',
      })
    );
  });

  it('should pass null for file_name when fileName is not provided', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock count check
    const mockEqForCount = vi.fn().mockResolvedValue({
      count: 0,
      data: [],
      error: null,
    });

    const mockSelectForCount = vi.fn().mockReturnValue({
      eq: mockEqForCount,
    });

    // Mock insert - capture the insert payload
    const capturedInsert = vi.fn();
    mockSingle.mockResolvedValue({
      data: { id: 'resume-789', name: 'My Resume' },
      error: null,
    });

    const mockSelectForInsert = vi.fn().mockReturnValue({
      single: mockSingle,
    });

    capturedInsert.mockReturnValue({
      select: mockSelectForInsert,
    });

    // Mock from() calls
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockSelectForCount };
      } else {
        return { insert: capturedInsert };
      }
    });

    const result = await saveResume('Resume text', 'My Resume');

    expect(result.data).toBeTruthy();
    expect(capturedInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        file_name: null,
      })
    );
  });

  it('should handle duplicate resume names', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock count check
    const mockEqForCount = vi.fn().mockResolvedValue({
      count: 1,
      data: [],
      error: null,
    });

    const mockSelectForCount = vi.fn().mockReturnValue({
      eq: mockEqForCount,
    });

    // Mock insert with duplicate key error
    mockSingle.mockResolvedValue({
      data: null,
      error: {
        message: 'duplicate key value violates unique constraint',
        code: '23505',
      },
    });

    const mockSelectForInsert = vi.fn().mockReturnValue({
      single: mockSingle,
    });

    mockInsert.mockReturnValue({
      select: mockSelectForInsert,
    });

    // Mock from() calls
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockSelectForCount };
      } else {
        return { insert: mockInsert };
      }
    });

    const result = await saveResume('Sample resume content', 'My Resume');

    expect(result.error).toBeTruthy();
    expect(result.error?.code).toBe(ERROR_CODES.SAVE_RESUME_ERROR);
    expect(result.error?.message).toContain('already exists');
  });
});
