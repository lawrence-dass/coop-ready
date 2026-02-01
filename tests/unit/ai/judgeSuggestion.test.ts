/**
 * Judge Suggestion Tests
 * Story 12.1: Unit tests for judge LLM function
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { judgeSuggestion } from '@/lib/ai/judgeSuggestion';
import type { SuggestionContext } from '@/types/judge';
import { DEFAULT_QUALITY_THRESHOLD } from '@/types/judge';

// Mock the ChatAnthropic and buildJudgePrompt
vi.mock('@langchain/anthropic', () => ({
  ChatAnthropic: vi.fn().mockImplementation(() => ({
    invoke: vi.fn(),
  })),
}));

vi.mock('@/lib/ai/judgePrompt', () => ({
  buildJudgePrompt: vi.fn((suggestion, context) => 'mocked prompt'),
}));

describe('judgeSuggestion', () => {
  const mockContext: SuggestionContext = {
    original_text: 'Senior software engineer with 5 years experience.',
    suggested_text:
      'Senior full-stack engineer with 5+ years building scalable React and Node.js applications.',
    jd_excerpt: 'Looking for React and Node.js experience.',
    section_type: 'summary',
  };

  const mockValidResponse = {
    authenticity: 20,
    clarity: 22,
    ats_relevance: 21,
    actionability: 19,
    overall_score: 82,
    reasoning: 'Strong reframing with natural keyword integration.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error for empty suggestion', async () => {
    const result = await judgeSuggestion('', mockContext, 'test-id');

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('VALIDATION_ERROR');
    expect(result.error?.message).toContain('required');
  });

  it('should parse valid JSON response correctly', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify(mockValidResponse),
    });
    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({ invoke: mockInvoke })
    );

    const result = await judgeSuggestion(
      'Test suggestion',
      mockContext,
      'test-id'
    );

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data?.quality_score).toBe(82);
    expect(result.data?.passed).toBe(true);
    expect(result.data?.criteria_breakdown.authenticity).toBe(20);
  });

  it('should handle JSON with markdown code blocks', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockResolvedValue({
      content: '```json\n' + JSON.stringify(mockValidResponse) + '\n```',
    });
    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({ invoke: mockInvoke })
    );

    const result = await judgeSuggestion(
      'Test suggestion',
      mockContext,
      'test-id'
    );

    expect(result.error).toBeNull();
    expect(result.data?.quality_score).toBe(82);
  });

  it('should validate scores are within 0-25 range', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const invalidResponse = {
      ...mockValidResponse,
      authenticity: 30, // Invalid (>25)
    };
    const mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify(invalidResponse),
    });
    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({ invoke: mockInvoke })
    );

    const result = await judgeSuggestion(
      'Test suggestion',
      mockContext,
      'test-id'
    );

    expect(result.data?.quality_score).toBe(0);
    expect(result.data?.passed).toBe(false);
  });

  it('should validate overall_score is within 0-100 range', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const invalidResponse = {
      ...mockValidResponse,
      overall_score: 150, // Invalid (>100)
    };
    const mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify(invalidResponse),
    });
    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({ invoke: mockInvoke })
    );

    const result = await judgeSuggestion(
      'Test suggestion',
      mockContext,
      'test-id'
    );

    expect(result.data?.quality_score).toBe(0);
    expect(result.data?.passed).toBe(false);
  });

  it('should handle invalid JSON gracefully', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockResolvedValue({
      content: 'This is not valid JSON',
    });
    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({ invoke: mockInvoke })
    );

    const result = await judgeSuggestion(
      'Test suggestion',
      mockContext,
      'test-id'
    );

    expect(result.data?.quality_score).toBe(0);
    expect(result.data?.passed).toBe(false);
    expect(result.data?.recommendation).toBe('regenerate');
  });

  it('should handle empty JSON response', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockResolvedValue({
      content: '',
    });
    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({ invoke: mockInvoke })
    );

    const result = await judgeSuggestion(
      'Test suggestion',
      mockContext,
      'test-id'
    );

    expect(result.data?.quality_score).toBe(0);
    expect(result.data?.passed).toBe(false);
  });

  it('should determine pass/fail correctly with default threshold', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');

    // Pass case
    const passResponse = { ...mockValidResponse, overall_score: 70 };
    let mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify(passResponse),
    });
    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({ invoke: mockInvoke })
    );

    let result = await judgeSuggestion(
      'Test suggestion',
      mockContext,
      'test-id'
    );
    expect(result.data?.passed).toBe(true);
    expect(result.data?.recommendation).toBe('accept');

    // Fail case
    const failResponse = { ...mockValidResponse, overall_score: 50 };
    mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify(failResponse),
    });
    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({ invoke: mockInvoke })
    );

    result = await judgeSuggestion('Test suggestion', mockContext, 'test-id');
    expect(result.data?.passed).toBe(false);
    expect(result.data?.recommendation).toBe('regenerate');
  });

  it('should support custom threshold', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const response = { ...mockValidResponse, overall_score: 75 };
    const mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify(response),
    });
    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({ invoke: mockInvoke })
    );

    // Should pass with threshold 70
    let result = await judgeSuggestion(
      'Test suggestion',
      mockContext,
      'test-id',
      70
    );
    expect(result.data?.passed).toBe(true);

    // Should fail with threshold 80
    result = await judgeSuggestion(
      'Test suggestion',
      mockContext,
      'test-id',
      80
    );
    expect(result.data?.passed).toBe(false);
  });

  it('should identify borderline suggestions (55-60)', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const borderlineResponse = { ...mockValidResponse, overall_score: 57 };
    const mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify(borderlineResponse),
    });
    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({ invoke: mockInvoke })
    );

    const result = await judgeSuggestion(
      'Test suggestion',
      mockContext,
      'test-id'
    );

    expect(result.data?.passed).toBe(false);
    expect(result.data?.recommendation).toBe('flag'); // Borderline
  });

  it('should provide default reasoning if missing', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const responseWithoutReasoning = {
      ...mockValidResponse,
      reasoning: '',
    };
    const mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify(responseWithoutReasoning),
    });
    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({ invoke: mockInvoke })
    );

    const result = await judgeSuggestion(
      'Test suggestion',
      mockContext,
      'test-id'
    );

    expect(result.data?.reasoning).toBe('No reasoning provided');
  });

  it('should gracefully handle timeout (return pass)', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockRejectedValue(new Error('TIMEOUT: Judge evaluation timed out'));
    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({ invoke: mockInvoke })
    );

    const result = await judgeSuggestion(
      'Test suggestion',
      mockContext,
      'test-id'
    );

    expect(result.data?.passed).toBe(true); // Graceful degradation
    expect(result.data?.quality_score).toBe(DEFAULT_QUALITY_THRESHOLD);
    expect(result.data?.reasoning).toContain('timed out');
  });

  it('should return error for non-timeout LLM failures', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockRejectedValue(new Error('API rate limit exceeded'));
    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({ invoke: mockInvoke })
    );

    const result = await judgeSuggestion(
      'Test suggestion',
      mockContext,
      'test-id'
    );

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('LLM_ERROR');
    expect(result.error?.message).toContain('API rate limit exceeded');
  });

  it('should return suggestion_id in result', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify(mockValidResponse),
    });
    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => ({ invoke: mockInvoke })
    );

    const result = await judgeSuggestion(
      'Test suggestion',
      mockContext,
      'my-test-id'
    );

    expect(result.data?.suggestion_id).toBe('my-test-id');
  });

  // Near-duplicate detection (cheap gate) tests
  describe('near-duplicate detection', () => {
    it('should detect exact duplicates and skip LLM call', async () => {
      const context: SuggestionContext = {
        original_text: 'Senior software engineer with 5 years experience.',
        suggested_text: 'Senior software engineer with 5 years experience.',
        jd_excerpt: 'Looking for experience.',
        section_type: 'summary',
      };

      const result = await judgeSuggestion(
        context.original_text, // Same as original
        context,
        'test-duplicate'
      );

      expect(result.error).toBeNull();
      expect(result.data?.quality_score).toBe(25);
      expect(result.data?.passed).toBe(false);
      expect(result.data?.recommendation).toBe('regenerate');
      expect(result.data?.reasoning).toContain('Near-duplicate');
    });

    it('should detect near-duplicates with only whitespace differences', async () => {
      const context: SuggestionContext = {
        original_text: 'Senior software engineer with 5 years experience.',
        suggested_text: '  Senior   software  engineer   with 5   years experience.  ',
        jd_excerpt: 'Looking for experience.',
        section_type: 'summary',
      };

      const result = await judgeSuggestion(
        context.suggested_text,
        context,
        'test-whitespace'
      );

      expect(result.data?.reasoning).toContain('Near-duplicate');
      expect(result.data?.passed).toBe(false);
    });

    it('should detect near-duplicates with case differences', async () => {
      const context: SuggestionContext = {
        original_text: 'Senior Software Engineer with 5 years experience.',
        suggested_text: 'senior software engineer with 5 years experience.',
        jd_excerpt: 'Looking for experience.',
        section_type: 'summary',
      };

      const result = await judgeSuggestion(
        context.suggested_text,
        context,
        'test-case'
      );

      expect(result.data?.reasoning).toContain('Near-duplicate');
      expect(result.data?.passed).toBe(false);
    });

    it('should NOT flag legitimately different suggestions as duplicates', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify(mockValidResponse),
      });
      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        () => ({ invoke: mockInvoke })
      );

      const context: SuggestionContext = {
        original_text: 'Worked on data analysis.',
        suggested_text: 'Led data analysis initiatives, driving 20% efficiency improvements through Python automation.',
        jd_excerpt: 'Python, data analysis, automation.',
        section_type: 'experience',
      };

      const result = await judgeSuggestion(
        context.suggested_text,
        context,
        'test-legitimate'
      );

      // Should NOT be flagged as near-duplicate
      expect(result.data?.reasoning).not.toContain('Near-duplicate');
      // Should call LLM and get proper score
      expect(mockInvoke).toHaveBeenCalled();
    });
  });

  // Context-aware judging tests
  describe('context-aware judging', () => {
    it('should accept job_type in context', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify(mockValidResponse),
      });
      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        () => ({ invoke: mockInvoke })
      );

      const contextWithJobType: SuggestionContext = {
        ...mockContext,
        job_type: 'coop',
      };

      const result = await judgeSuggestion(
        'Assisted with data analysis tasks',
        contextWithJobType,
        'test-coop'
      );

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
    });

    it('should accept modification_level in context', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify(mockValidResponse),
      });
      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        () => ({ invoke: mockInvoke })
      );

      const contextWithModLevel: SuggestionContext = {
        ...mockContext,
        modification_level: 'aggressive',
      };

      const result = await judgeSuggestion(
        'Completely rewritten suggestion with major changes',
        contextWithModLevel,
        'test-aggressive'
      );

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
    });
  });
});
