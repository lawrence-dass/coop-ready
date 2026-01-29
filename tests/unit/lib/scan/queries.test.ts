import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSessionById } from '@/lib/scan/queries';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('getSessionById', () => {
  const mockCreateClient = vi.mocked(createClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return session data for valid sessionId', async () => {
    const mockSession = {
      id: 'session-123',
      created_at: '2026-01-24T12:00:00Z',
      resume_content: 'Test resume',
      jd_content: 'Test job description',
      analysis: {
        score: {
          overall: 75,
          breakdown: { keywordScore: 80, sectionCoverageScore: 70, contentQualityScore: 75 },
          calculatedAt: '2026-01-24T12:00:00Z',
        },
        keywordAnalysis: {
          matched: [{ keyword: 'React', category: 'technologies', found: true, matchType: 'exact' }],
          missing: [{ keyword: 'Angular', category: 'technologies', importance: 'medium' }],
          matchRate: 50,
          analyzedAt: '2026-01-24T12:00:00Z',
        },
      },
      suggestions: null,
      preferences: null,
      anonymous_id: null,
      user_id: 'user-123',
    };

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockSession,
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const result = await getSessionById('session-123', 'user-123');

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      id: 'session-123',
      createdAt: '2026-01-24T12:00:00Z',
      resumeContent: 'Test resume',
      jdContent: 'Test job description',
      analysis: {
        score: {
          overall: 75,
          breakdown: { keywordScore: 80, sectionCoverageScore: 70, contentQualityScore: 75 },
          calculatedAt: '2026-01-24T12:00:00Z',
        },
        keywordAnalysis: {
          matched: [{ keyword: 'React', category: 'technologies', found: true, matchType: 'exact' }],
          missing: [{ keyword: 'Angular', category: 'technologies', importance: 'medium' }],
          matchRate: 50,
          analyzedAt: '2026-01-24T12:00:00Z',
        },
      },
      suggestions: null,
      preferences: null,
      anonymousId: null,
      userId: 'user-123',
    });
  });

  it('should return error for invalid sessionId', async () => {
    const result = await getSessionById('', 'user-123');

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('VALIDATION_ERROR');
    expect(result.data).toBeNull();
  });

  it('should return error when session not found', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const result = await getSessionById('session-404', 'user-123');

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('SESSION_NOT_FOUND');
    expect(result.data).toBeNull();
  });

  it('should return error when database query fails', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const result = await getSessionById('session-123', 'user-123');

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('GET_SESSION_ERROR');
    expect(result.data).toBeNull();
  });

  it('should enforce RLS and filter by user_id', async () => {
    const mockEq = vi.fn().mockReturnThis();
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: mockEq,
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    await getSessionById('session-123', 'user-123');

    expect(mockSupabase.from).toHaveBeenCalledWith('sessions');
    // Verify both id and user_id filters are applied (defense in depth)
    expect(mockEq).toHaveBeenCalledWith('id', 'session-123');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(mockEq).toHaveBeenCalledTimes(2);
  });
});
