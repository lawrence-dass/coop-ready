/**
 * Unit Tests for getUserContext Function
 * Tests the extraction of user context from onboarding answers for LLM personalization.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('getUserContext', () => {
  let mockSupabaseClient: {
    auth: {
      getUser: ReturnType<typeof vi.fn>;
    };
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.resetModules();

    // Create chainable mock for Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    };

    // Chain the query methods
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);

    // Setup createClient mock
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty context for anonymous users', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'anon-123', is_anonymous: true } },
      error: null,
    });

    const { getUserContext } = await import('@/lib/supabase/user-context');
    const result = await getUserContext();

    expect(result.error).toBeNull();
    expect(result.data).toEqual({});
    // Should not query the users table
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  it('should return empty context when auth error occurs', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    });

    const { getUserContext } = await import('@/lib/supabase/user-context');
    const result = await getUserContext();

    expect(result.error).toBeNull();
    expect(result.data).toEqual({});
  });

  it('should return empty context when user has no onboarding answers', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', is_anonymous: false } },
      error: null,
    });
    mockSupabaseClient.single.mockResolvedValue({
      data: { onboarding_answers: null },
      error: null,
    });

    const { getUserContext } = await import('@/lib/supabase/user-context');
    const result = await getUserContext();

    expect(result.error).toBeNull();
    expect(result.data).toEqual({});
  });

  it('should return career goal when provided in onboarding answers', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', is_anonymous: false } },
      error: null,
    });
    mockSupabaseClient.single.mockResolvedValue({
      data: {
        onboarding_answers: {
          careerGoal: 'switching-careers',
        },
      },
      error: null,
    });

    const { getUserContext } = await import('@/lib/supabase/user-context');
    const result = await getUserContext();

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      careerGoal: 'switching-careers',
      targetIndustries: [],
    });
  });

  it('should return target industries when provided in onboarding answers', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', is_anonymous: false } },
      error: null,
    });
    mockSupabaseClient.single.mockResolvedValue({
      data: {
        onboarding_answers: {
          targetIndustries: ['technology', 'finance', 'healthcare'],
        },
      },
      error: null,
    });

    const { getUserContext } = await import('@/lib/supabase/user-context');
    const result = await getUserContext();

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      careerGoal: null,
      targetIndustries: ['technology', 'finance', 'healthcare'],
    });
  });

  it('should return both career goal and target industries when both provided', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', is_anonymous: false } },
      error: null,
    });
    mockSupabaseClient.single.mockResolvedValue({
      data: {
        onboarding_answers: {
          careerGoal: 'advancing',
          targetIndustries: ['technology', 'engineering'],
        },
      },
      error: null,
    });

    const { getUserContext } = await import('@/lib/supabase/user-context');
    const result = await getUserContext();

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      careerGoal: 'advancing',
      targetIndustries: ['technology', 'engineering'],
    });
  });

  it('should validate career goal values', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', is_anonymous: false } },
      error: null,
    });
    mockSupabaseClient.single.mockResolvedValue({
      data: {
        onboarding_answers: {
          careerGoal: 'invalid-goal', // Invalid value
          targetIndustries: ['technology'],
        },
      },
      error: null,
    });

    const { getUserContext } = await import('@/lib/supabase/user-context');
    const result = await getUserContext();

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      careerGoal: null, // Invalid goal should be null
      targetIndustries: ['technology'],
    });
  });

  it('should filter out invalid target industries', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', is_anonymous: false } },
      error: null,
    });
    mockSupabaseClient.single.mockResolvedValue({
      data: {
        onboarding_answers: {
          targetIndustries: ['technology', '', null, 'finance', '  '],
        },
      },
      error: null,
    });

    const { getUserContext } = await import('@/lib/supabase/user-context');
    const result = await getUserContext();

    expect(result.error).toBeNull();
    expect(result.data?.targetIndustries).toEqual(['technology', 'finance']);
  });

  it('should return empty context when database query fails', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', is_anonymous: false } },
      error: null,
    });
    mockSupabaseClient.single.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const { getUserContext } = await import('@/lib/supabase/user-context');
    const result = await getUserContext();

    // Should gracefully return empty context, not fail
    expect(result.error).toBeNull();
    expect(result.data).toEqual({});
  });

  it('should validate all valid career goal values', async () => {
    const validGoals = ['first-job', 'switching-careers', 'advancing', 'promotion', 'returning'];

    for (const goal of validGoals) {
      vi.resetModules();

      // Re-setup mocks
      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as never);

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', is_anonymous: false } },
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          onboarding_answers: { careerGoal: goal },
        },
        error: null,
      });

      const { getUserContext } = await import('@/lib/supabase/user-context');
      const result = await getUserContext();

      expect(result.data?.careerGoal).toBe(goal);
    }
  });
});
