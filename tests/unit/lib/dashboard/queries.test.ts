/**
 * Unit Tests: Dashboard Queries
 * Story 16.2: Implement Dashboard Home Page
 *
 * Tests for fetching recent optimization sessions from database
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRecentSessions } from '@/lib/dashboard/queries';
import type { HistorySession } from '@/types/history';
import { createClient } from '@/lib/supabase/server';

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
        analysis: { atsScore: 85 },
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
      code: 'VALIDATION_ERROR',
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
