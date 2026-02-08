// Unit Tests for Content Quality Judge
// Story 5.2: Implement ATS Score Calculation

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { judgeContentQuality } from '@/lib/ai/judgeContentQuality';
import type { Resume } from '@/types/optimization';

// Shared mock for chain.invoke — hoisted so vi.mock factory can reference it
const { mockChainInvoke } = vi.hoisted(() => ({
  mockChainInvoke: vi.fn(),
}));

vi.mock('@/lib/ai/models', () => ({
  getHaikuModel: vi.fn(() => ({
    pipe: vi.fn(() => ({
      pipe: vi.fn(() => ({
        invoke: mockChainInvoke,
      })),
    })),
  })),
  getSonnetModel: vi.fn(() => ({
    pipe: vi.fn(() => ({
      pipe: vi.fn(() => ({
        invoke: mockChainInvoke,
      })),
    })),
  })),
}));

vi.mock('@/lib/ai/chains', () => ({
  ChatPromptTemplate: {
    fromTemplate: vi.fn(() => ({
      pipe: vi.fn(() => ({
        pipe: vi.fn(() => ({
          pipe: vi.fn(() => ({
            invoke: mockChainInvoke,
          })),
          invoke: mockChainInvoke,
        })),
      })),
    })),
  },
  RunnableLambda: {
    from: vi.fn((fn: Function) => ({
      invoke: fn,
      pipe: vi.fn(() => ({ invoke: mockChainInvoke })),
    })),
  },
  RunnableParallel: {
    from: vi.fn((evaluators: Record<string, { invoke: Function }>) => ({
      invoke: async (input: unknown) => {
        // Execute all evaluators in parallel, simulating RunnableParallel behavior
        const results: Record<string, unknown> = {};
        const entries = Object.entries(evaluators);
        await Promise.all(
          entries.map(async ([key, evaluator]) => {
            results[key] = await evaluator.invoke(input);
          })
        );
        return results;
      },
    })),
  },
  createJsonParser: vi.fn(),
  invokeWithActionResponse: vi.fn(async (fn: () => Promise<unknown>, options?: { timeoutMs?: number }) => {
    try {
      const data = await fn();
      return { data, error: null };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      if (e instanceof SyntaxError) {
        return { data: null, error: { code: 'PARSE_ERROR', message } };
      }
      if (e instanceof Error && e.message.includes('timeout')) {
        return { data: null, error: { code: 'LLM_TIMEOUT', message: 'Operation timed out' } };
      }
      return { data: null, error: { code: 'LLM_ERROR', message } };
    }
  }),
}));

vi.mock('@/lib/ai/redactPII', () => ({
  redactPII: vi.fn((text: string) => ({
    redactedText: text,
    redactionMap: new Map(),
    stats: { emails: 0, phones: 0, urls: 0, addresses: 0 },
  })),
  restorePII: vi.fn((text: string) => text),
}));

describe('judgeContentQuality', () => {
  const mockJD = 'Software Engineer position requiring Python, React, and AWS experience.';

  const mockResume: Resume = {
    rawText: 'Full resume text',
    summary: 'Experienced software engineer with 5 years in full-stack development',
    skills: 'Python, React, AWS, Docker, Kubernetes',
    experience: 'Led development of web applications using React and Python. Deployed on AWS.'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Quality Evaluation Success Cases', () => {
    it('[P0] should average quality scores across sections', async () => {
      // mockChainInvoke is called by each section's LCEL chain.
      // The chain is: prompt → model → jsonParser → scoreCalculator
      // In our mock, scoreCalculator is a RunnableLambda.from that executes its fn directly.
      // The chain.invoke returns a number (the averaged score from scoreCalculator).
      // Each section evaluation calls invokeWithActionResponse which calls chain.invoke.
      mockChainInvoke
        .mockResolvedValueOnce(85)  // summary section score
        .mockResolvedValueOnce(88)  // skills section score
        .mockResolvedValueOnce(82); // experience section score

      const result = await judgeContentQuality(mockResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      // Overall average: (85 + 88 + 82) / 3 = 85
      expect(result.data).toBe(85);
    });

    it('[P0] should handle perfect scores (100)', async () => {
      mockChainInvoke
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(100);

      const result = await judgeContentQuality(mockResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data).toBe(100);
    });

    it('[P1] should skip empty sections', async () => {
      const resumeWithEmptySections: Resume = {
        rawText: 'Resume text',
        summary: 'Summary section',
        skills: '', // Empty
        experience: 'Experience section'
      };

      // Should only call for summary and experience (2 calls, not 3)
      mockChainInvoke
        .mockResolvedValueOnce(80)  // summary
        .mockResolvedValueOnce(75); // experience

      const result = await judgeContentQuality(resumeWithEmptySections, mockJD);

      expect(result.error).toBeNull();
      // Overall: (80 + 75) / 2 = 77.5 → 78
      expect(result.data).toBe(78);
    });

    it('[P2] should return 0 when all sections are empty', async () => {
      const emptyResume: Resume = {
        rawText: 'Just raw text',
        summary: undefined,
        skills: undefined,
        experience: undefined
      };

      const result = await judgeContentQuality(emptyResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data).toBe(0);
      expect(mockChainInvoke).not.toHaveBeenCalled(); // No LLM calls for empty sections
    });
  });

  describe('Error Handling', () => {
    it('[P1] should return error when all section evaluations fail', async () => {
      // All three sections fail
      mockChainInvoke
        .mockRejectedValueOnce(new Error('LLM API error'))
        .mockRejectedValueOnce(new Error('LLM API error'))
        .mockRejectedValueOnce(new Error('LLM API error'));

      const result = await judgeContentQuality(mockResume, mockJD);

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error!.code).toBe('LLM_ERROR');
    });

    it('[P1] should return timeout error when LLM times out', async () => {
      // All three sections timeout
      mockChainInvoke
        .mockRejectedValueOnce(new Error('timeout: Quality evaluation timed out'))
        .mockRejectedValueOnce(new Error('timeout: Quality evaluation timed out'))
        .mockRejectedValueOnce(new Error('timeout: Quality evaluation timed out'));

      const result = await judgeContentQuality(mockResume, mockJD);

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error!.code).toBe('LLM_ERROR');
      expect(result.error!.message).toContain('All quality evaluations failed');
    });

    it('[P1] should return error for invalid JSON (parse error)', async () => {
      // All three sections fail with parse error
      mockChainInvoke
        .mockRejectedValueOnce(new SyntaxError('Unexpected token'))
        .mockRejectedValueOnce(new SyntaxError('Unexpected token'))
        .mockRejectedValueOnce(new SyntaxError('Unexpected token'));

      const result = await judgeContentQuality(mockResume, mockJD);

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error!.code).toBe('LLM_ERROR');
      expect(result.error!.message).toContain('All quality evaluations failed');
    });

    it('[P2] should gracefully handle partial failures', async () => {
      // First section succeeds, rest fail
      mockChainInvoke
        .mockResolvedValueOnce(80)  // summary succeeds
        .mockRejectedValueOnce(new Error('LLM API error'))  // skills fails
        .mockRejectedValueOnce(new Error('LLM API error')); // experience fails

      const result = await judgeContentQuality(mockResume, mockJD);

      // Should return the successful score since at least one section succeeded
      expect(result.error).toBeNull();
      expect(result.data).toBe(80);
    });
  });
});
