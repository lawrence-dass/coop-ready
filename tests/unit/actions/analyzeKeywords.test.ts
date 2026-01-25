// Story 5.1: Tests for analyzeKeywords Server Action
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeKeywords } from '@/actions/analyzeKeywords';
import { KeywordCategory } from '@/types/analysis';

// Mock extractKeywords
vi.mock('@/lib/ai/extractKeywords', () => ({
  extractKeywords: vi.fn()
}));

// Mock matchKeywords
vi.mock('@/lib/ai/matchKeywords', () => ({
  matchKeywords: vi.fn()
}));

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}));

describe('Task 4: analyzeKeywords Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return VALIDATION_ERROR for empty session ID', async () => {
    const result = await analyzeKeywords('');

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('VALIDATION_ERROR');
    expect(result.error?.message).toContain('Session ID');
    expect(result.data).toBeNull();
  });

  it('should return VALIDATION_ERROR when session not found', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') })
    };

    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const result = await analyzeKeywords('invalid-session-id');

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('VALIDATION_ERROR');
    expect(result.error?.message).toContain('Session not found');
  });

  it('should return VALIDATION_ERROR when resume is missing', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          resume_content: '',
          job_description: 'Looking for Python developer'
        },
        error: null
      })
    };

    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const result = await analyzeKeywords('test-session-id');

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('VALIDATION_ERROR');
    expect(result.error?.message).toContain('upload a resume');
  });

  it('should return VALIDATION_ERROR when job description is missing', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          resume_content: 'Resume content here',
          job_description: ''
        },
        error: null
      })
    };

    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const result = await analyzeKeywords('test-session-id');

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('VALIDATION_ERROR');
    expect(result.error?.message).toContain('job description');
  });

  it('should successfully analyze keywords', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { extractKeywords } = await import('@/lib/ai/extractKeywords');
    const { matchKeywords } = await import('@/lib/ai/matchKeywords');

    const mockUpdate = vi.fn().mockReturnThis();
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          resume_content: 'Python developer with AWS experience',
          job_description: 'Looking for Python and AWS expert'
        },
        error: null
      }),
      update: mockUpdate
    };

    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null })
    });

    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    (extractKeywords as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        keywords: [
          { keyword: 'Python', category: KeywordCategory.TECHNOLOGIES, importance: 'high' },
          { keyword: 'AWS', category: KeywordCategory.TECHNOLOGIES, importance: 'high' }
        ],
        totalCount: 2
      },
      error: null
    });

    (matchKeywords as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        matched: [
          {
            keyword: 'Python',
            category: KeywordCategory.TECHNOLOGIES,
            found: true,
            context: 'Python developer',
            matchType: 'exact'
          },
          {
            keyword: 'AWS',
            category: KeywordCategory.TECHNOLOGIES,
            found: true,
            context: 'AWS experience',
            matchType: 'exact'
          }
        ],
        missing: [],
        matchRate: 100,
        analyzedAt: new Date().toISOString()
      },
      error: null
    });

    const result = await analyzeKeywords('test-session-id');

    expect(result.data).not.toBeNull();
    expect(result.error).toBeNull();
    expect(result.data?.matched).toHaveLength(2);
    expect(result.data?.matchRate).toBe(100);
  });

  it('should handle LLM_TIMEOUT error from extractKeywords', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { extractKeywords } = await import('@/lib/ai/extractKeywords');

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          resume_content: 'Resume content',
          job_description: 'Job description'
        },
        error: null
      })
    };

    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    (extractKeywords as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { code: 'LLM_TIMEOUT', message: 'Extraction timed out' }
    });

    const result = await analyzeKeywords('test-session-id');

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('LLM_TIMEOUT');
  });

  it('should handle LLM_ERROR from matchKeywords', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { extractKeywords } = await import('@/lib/ai/extractKeywords');
    const { matchKeywords } = await import('@/lib/ai/matchKeywords');

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          resume_content: 'Resume content',
          job_description: 'Job description'
        },
        error: null
      })
    };

    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    (extractKeywords as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        keywords: [
          { keyword: 'Python', category: KeywordCategory.TECHNOLOGIES, importance: 'high' }
        ],
        totalCount: 1
      },
      error: null
    });

    (matchKeywords as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { code: 'LLM_ERROR', message: 'Matching failed' }
    });

    const result = await analyzeKeywords('test-session-id');

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('LLM_ERROR');
  });

  it('should store results in session after successful analysis', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { extractKeywords } = await import('@/lib/ai/extractKeywords');
    const { matchKeywords } = await import('@/lib/ai/matchKeywords');

    const mockUpdate = vi.fn().mockReturnThis();
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          resume_content: 'Resume',
          job_description: 'JD'
        },
        error: null
      }),
      update: mockUpdate
    };

    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null })
    });

    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    (extractKeywords as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { keywords: [{ keyword: 'Python', category: KeywordCategory.TECHNOLOGIES, importance: 'high' }], totalCount: 1 },
      error: null
    });

    (matchKeywords as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        matched: [],
        missing: [{ keyword: 'Python', category: KeywordCategory.TECHNOLOGIES, importance: 'high' }],
        matchRate: 0,
        analyzedAt: new Date().toISOString()
      },
      error: null
    });

    await analyzeKeywords('test-session-id');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword_analysis: expect.any(Object),
        updated_at: expect.any(String)
      })
    );
  });
});
