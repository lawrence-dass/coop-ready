/**
 * Tests for save-onboarding action
 * Story 8-5: Implement Onboarding Flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveOnboarding, skipOnboarding } from '@/actions/auth/save-onboarding';
import type { OnboardingAnswers } from '@/types/auth';
import { ERROR_CODES } from '@/types';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('saveOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save onboarding answers successfully', async () => {
    const mockUser = { id: 'user-123' };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const answers: OnboardingAnswers = {
      careerGoal: 'advancing',
      experienceLevel: 'mid',
      targetIndustries: ['technology', 'finance'],
    };

    const result = await saveOnboarding(answers);

    expect(result.data).toEqual({ success: true });
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
  });

  it('should return error when user is not authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        }),
      },
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const answers: OnboardingAnswers = {
      careerGoal: 'advancing',
      experienceLevel: 'mid',
      targetIndustries: ['technology'],
    };

    const result = await saveOnboarding(answers);

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'Not authenticated',
      code: ERROR_CODES.AUTH_ERROR,
    });
  });

  it('should return error when database update fails', async () => {
    const mockUser = { id: 'user-123' };
    const dbError = { message: 'Database error' };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: dbError }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const answers: OnboardingAnswers = {
      careerGoal: 'advancing',
      experienceLevel: 'mid',
      targetIndustries: ['technology'],
    };

    const result = await saveOnboarding(answers);

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'Database error',
      code: ERROR_CODES.ONBOARDING_SAVE_ERROR,
    });
  });

  it('should save answers with all industries selected', async () => {
    const mockUser = { id: 'user-123' };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const answers: OnboardingAnswers = {
      careerGoal: 'first-job',
      experienceLevel: 'entry',
      targetIndustries: [
        'technology',
        'healthcare',
        'finance',
        'education',
        'marketing',
        'engineering',
        'retail',
        'other',
      ],
    };

    const result = await saveOnboarding(answers);

    expect(result.data).toEqual({ success: true });
    expect(result.error).toBeNull();
  });

  it('should return validation error for invalid career goal', async () => {
    const mockUser = { id: 'user-123' };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const answers = {
      careerGoal: 'invalid-goal',
      experienceLevel: 'mid',
      targetIndustries: ['technology'],
    } as unknown as OnboardingAnswers;

    const result = await saveOnboarding(answers);

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  it('should return validation error for empty target industries', async () => {
    const mockUser = { id: 'user-123' };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const answers: OnboardingAnswers = {
      careerGoal: 'advancing',
      experienceLevel: 'mid',
      targetIndustries: [],
    };

    const result = await saveOnboarding(answers);

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  it('should return validation error for invalid industry value', async () => {
    const mockUser = { id: 'user-123' };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const answers = {
      careerGoal: 'advancing',
      experienceLevel: 'mid',
      targetIndustries: ['technology', 'fake-industry'],
    } as unknown as OnboardingAnswers;

    const result = await saveOnboarding(answers);

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });
});

describe('skipOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should skip onboarding successfully', async () => {
    const mockUser = { id: 'user-123' };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const result = await skipOnboarding();

    expect(result.data).toEqual({ success: true });
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
  });

  it('should return error when user is not authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        }),
      },
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const result = await skipOnboarding();

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      message: 'Not authenticated',
      code: ERROR_CODES.AUTH_ERROR,
    });
  });

  it('should mark onboarding complete without answers', async () => {
    const mockUser = { id: 'user-123' };
    let updateData: any;

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockImplementation((data) => {
          updateData = data;
          return {
            eq: vi.fn().mockResolvedValue({ error: null }),
          };
        }),
      }),
    };

    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const result = await skipOnboarding();

    expect(result.data).toEqual({ success: true });
    expect(result.error).toBeNull();
    expect(updateData.onboarding_complete).toBe(true);
    expect(updateData.onboarding_answers).toBeUndefined();
  });
});
