/**
 * Unit Tests: Dashboard Queries
 * Story 16.2: Implement Dashboard Home Page
 *
 * Tests for fetching recent optimization sessions from database
 */

import { describe, it, expect, vi, beforeEach, test, Mock } from 'vitest';
import { getRecentSessions, getDashboardStats } from '@/lib/dashboard/queries';
import type { HistorySession } from '@/types/history';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES } from '@/types';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

describe('getRecentSessions', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                data: [],
                error: null,
              })),
            })),
          })),
        })),
      })),
    };

    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it('should fetch recent sessions for authenticated user', async () => {
    // Arrange
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    const mockSessions = [
      {
        id: 'session-1',
        created_at: '2026-01-29T10:00:00Z',
        resume_content: 'Resume content',
        jd_content: 'Job at TechCorp',
        ats_score: { overall: 85 }, // Correct JSONB structure
        suggestions: { summary: [], skills: [], experience: [] },
      },
    ];

    mockSupabase.from.mockReturnValue({
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
    });

    // Act
    const result = await getRecentSessions();

    // Assert
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]).toMatchObject({
      id: 'session-1',
      createdAt: expect.any(Date),
      atsScore: 85,
    });
    expect(result.error).toBeNull();
  });

  it('should return empty array when user has no sessions', async () => {
    // Arrange
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
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
    });

    // Act
    const result = await getRecentSessions();

    // Assert
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('should limit results to 5 sessions', async () => {
    // Arrange
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    const mockLimitFn = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: mockLimitFn,
          }),
        }),
      }),
    });

    // Act
    await getRecentSessions();

    // Assert
    expect(mockLimitFn).toHaveBeenCalledWith(5);
  });

  it('should handle database error gracefully', async () => {
    // Arrange
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      }),
    });

    // Act
    const result = await getRecentSessions();

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'Database connection failed',
      code: 'VALIDATION_ERROR',
    });
  });

  it('should handle unauthenticated user', async () => {
    // Arrange
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // Act
    const result = await getRecentSessions();

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'Unauthenticated',
      code: ERROR_CODES.UNAUTHORIZED,
    });
  });

  it('should transform snake_case DB fields to camelCase', async () => {
    // Arrange
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });

    const mockSessions = [
      {
        id: 'session-1',
        created_at: '2026-01-29T10:00:00Z',
        resume_content: 'Resume content',
        jd_content: 'Software Engineer at TechCorp',
        analysis: { atsScore: 85 },
        suggestions: { summary: [{ text: 'test' }] },
      },
    ];

    mockSupabase.from.mockReturnValue({
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
    });

    // Act
    const result = await getRecentSessions();

    // Assert
    expect(result.data?.[0]).toHaveProperty('createdAt');
    expect(result.data?.[0]).toHaveProperty('resumeName');
    expect(result.data?.[0]).toHaveProperty('jobTitle');
    expect(result.data?.[0]).not.toHaveProperty('created_at');
    expect(result.data?.[0]).not.toHaveProperty('resume_content');
  });
});

// ============================================================================
// Story 17.5: getDashboardStats Tests
// ============================================================================

describe('Story 17.5: getDashboardStats', () => {
  let mockSupabase: any;
  let mockAuth: any;
  let mockFrom: any;
  let mockSelect: any;
  let mockEq: any;
  let mockOrder: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock chain
    mockOrder = vi.fn();
    mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    mockAuth = {
      getUser: vi.fn(),
    };

    mockSupabase = {
      auth: mockAuth,
      from: mockFrom,
    };

    (createClient as Mock).mockResolvedValue(mockSupabase);
  });

  test('[P0] 17.5-STATS-001: Calculates average ATS score from sessions with scores (75, 80, 70 → 75)', async () => {
    // Mock authenticated user
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock sessions with scores: 75, 80, 70
    const mockSessions = [
      { id: '1', ats_score: { overall: 75 }, compared_ats_score: null },
      { id: '2', ats_score: { overall: 80 }, compared_ats_score: null },
      { id: '3', ats_score: { overall: 70 }, compared_ats_score: null },
    ];

    mockOrder.mockResolvedValue({ data: mockSessions, error: null });

    const { data, error } = await getDashboardStats();

    expect(error).toBeNull();
    expect(data).toEqual({
      totalScans: 3,
      averageAtsScore: 75, // (75 + 80 + 70) / 3 = 75
      improvementRate: null, // No comparisons
    });
  });

  test('[P0] 17.5-STATS-002: Calculates improvement rate from comparison sessions (+10, +5 → +7.5 pts)', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock sessions with comparisons
    const mockSessions = [
      {
        id: '1',
        ats_score: { overall: 65 },
        compared_ats_score: { overall: 75 }, // +10 improvement
      },
      {
        id: '2',
        ats_score: { overall: 70 },
        compared_ats_score: { overall: 75 }, // +5 improvement
      },
    ];

    mockOrder.mockResolvedValue({ data: mockSessions, error: null });

    const { data, error } = await getDashboardStats();

    expect(error).toBeNull();
    expect(data).toEqual({
      totalScans: 2,
      averageAtsScore: 67.5, // (65 + 70) / 2
      improvementRate: 7.5, // (10 + 5) / 2
    });
  });

  test('[P0] 17.5-STATS-003: Returns null for averageAtsScore when no sessions have scores', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock sessions with no scores
    const mockSessions = [
      { id: '1', ats_score: null, compared_ats_score: null },
      { id: '2', ats_score: null, compared_ats_score: null },
    ];

    mockOrder.mockResolvedValue({ data: mockSessions, error: null });

    const { data, error } = await getDashboardStats();

    expect(error).toBeNull();
    expect(data).toEqual({
      totalScans: 2,
      averageAtsScore: null,
      improvementRate: null,
    });
  });

  test('[P0] 17.5-STATS-004: Returns null for improvementRate when no comparison sessions', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock sessions with scores but no comparisons
    const mockSessions = [
      { id: '1', ats_score: { overall: 75 }, compared_ats_score: null },
      { id: '2', ats_score: { overall: 80 }, compared_ats_score: null },
    ];

    mockOrder.mockResolvedValue({ data: mockSessions, error: null });

    const { data, error } = await getDashboardStats();

    expect(error).toBeNull();
    expect(data?.averageAtsScore).toBe(77.5); // (75 + 80) / 2
    expect(data?.improvementRate).toBeNull();
  });

  test('[P0] 17.5-STATS-005: Returns error when user not authenticated', async () => {
    // Mock auth failure
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const { data, error } = await getDashboardStats();

    expect(data).toBeNull();
    expect(error).toEqual({
      message: 'You must be signed in to view dashboard stats.',
      code: ERROR_CODES.UNAUTHORIZED,
    });

    // Verify no database query was made
    expect(mockFrom).not.toHaveBeenCalled();
  });

  test('[P0] 17.5-STATS-006: Filters sessions by user_id (RLS verification)', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-456' } },
      error: null,
    });

    mockOrder.mockResolvedValue({ data: [], error: null });

    await getDashboardStats();

    // Verify query chain
    expect(mockFrom).toHaveBeenCalledWith('sessions');
    expect(mockSelect).toHaveBeenCalledWith('id, ats_score, compared_ats_score');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-456');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  test('[P1] 17.5-STATS-007: Handles database query error gracefully', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock database error
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' },
    });

    const { data, error } = await getDashboardStats();

    expect(data).toBeNull();
    expect(error).toEqual({
      message: 'Failed to load dashboard stats: Database connection failed',
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  });

  test('[P1] 17.5-STATS-008: Handles mixed sessions (some with scores, some without)', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock sessions: 2 with scores, 1 without, 1 with comparison
    const mockSessions = [
      { id: '1', ats_score: { overall: 80 }, compared_ats_score: null },
      { id: '2', ats_score: null, compared_ats_score: null }, // Should be excluded
      { id: '3', ats_score: { overall: 70 }, compared_ats_score: { overall: 75 } },
    ];

    mockOrder.mockResolvedValue({ data: mockSessions, error: null });

    const { data, error } = await getDashboardStats();

    expect(error).toBeNull();
    expect(data).toEqual({
      totalScans: 3,
      averageAtsScore: 75, // (80 + 70) / 2 - excludes null
      improvementRate: 5, // Only 1 comparison: 75 - 70 = 5
    });
  });

  test('[P1] 17.5-STATS-009: Handles empty sessions array', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockOrder.mockResolvedValue({ data: [], error: null });

    const { data, error } = await getDashboardStats();

    expect(error).toBeNull();
    expect(data).toEqual({
      totalScans: 0,
      averageAtsScore: null,
      improvementRate: null,
    });
  });
});
