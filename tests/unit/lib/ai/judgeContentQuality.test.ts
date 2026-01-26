// Unit Tests for Content Quality Judge
// Story 5.2: Implement ATS Score Calculation

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { judgeContentQuality } from '@/lib/ai/judgeContentQuality';
import { ChatAnthropic } from '@langchain/anthropic';
import type { Resume } from '@/types/optimization';

// Mock LangChain
vi.mock('@langchain/anthropic');

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
      // Mock three LLM calls for summary, skills, experience
      const mockInvoke = vi.fn()
        .mockResolvedValueOnce({
          content: JSON.stringify({ relevance: 85, clarity: 90, impact: 80 }) // Avg: 85
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({ relevance: 90, clarity: 85, impact: 88 }) // Avg: 87.67 → 88
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({ relevance: 80, clarity: 82, impact: 85 }) // Avg: 82.33 → 82
        });

      vi.mocked(ChatAnthropic).mockImplementation(() => ({
        invoke: mockInvoke
      }) as any);

      const result = await judgeContentQuality(mockResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      // Overall average: (85 + 88 + 82) / 3 = 85
      expect(result.data).toBe(85);
      expect(mockInvoke).toHaveBeenCalledTimes(3);
    });

    it('[P0] should handle perfect scores (100)', async () => {
      const mockInvoke = vi.fn()
        .mockResolvedValueOnce({
          content: JSON.stringify({ relevance: 100, clarity: 100, impact: 100 })
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({ relevance: 100, clarity: 100, impact: 100 })
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({ relevance: 100, clarity: 100, impact: 100 })
        });

      vi.mocked(ChatAnthropic).mockImplementation(() => ({
        invoke: mockInvoke
      }) as any);

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
      const mockInvoke = vi.fn()
        .mockResolvedValueOnce({
          content: JSON.stringify({ relevance: 80, clarity: 85, impact: 75 }) // Avg: 80
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({ relevance: 70, clarity: 75, impact: 80 }) // Avg: 75
        });

      vi.mocked(ChatAnthropic).mockImplementation(() => ({
        invoke: mockInvoke
      }) as any);

      const result = await judgeContentQuality(resumeWithEmptySections, mockJD);

      expect(result.error).toBeNull();
      expect(mockInvoke).toHaveBeenCalledTimes(2); // Only 2 sections evaluated
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

      const mockInvoke = vi.fn();

      vi.mocked(ChatAnthropic).mockImplementation(() => ({
        invoke: mockInvoke
      }) as any);

      const result = await judgeContentQuality(emptyResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data).toBe(0);
      expect(mockInvoke).not.toHaveBeenCalled(); // No LLM calls for empty sections
    });

    it('[P2] should handle markdown-wrapped JSON response', async () => {
      const mockInvoke = vi.fn()
        .mockResolvedValueOnce({
          content: '```json\n{"relevance": 85, "clarity": 90, "impact": 80}\n```'
        })
        .mockResolvedValueOnce({
          content: '```json\n{"relevance": 90, "clarity": 85, "impact": 88}\n```'
        })
        .mockResolvedValueOnce({
          content: '```json\n{"relevance": 80, "clarity": 82, "impact": 85}\n```'
        });

      vi.mocked(ChatAnthropic).mockImplementation(() => ({
        invoke: mockInvoke
      }) as any);

      const result = await judgeContentQuality(mockResume, mockJD);

      expect(result.error).toBeNull();
      expect(result.data).toBe(85);
    });
  });

  describe('Error Handling', () => {
    it('[P1] should return error when section evaluation fails', async () => {
      const mockInvoke = vi.fn()
        .mockRejectedValueOnce(new Error('LLM API error'));

      vi.mocked(ChatAnthropic).mockImplementation(() => ({
        invoke: mockInvoke
      }) as any);

      const result = await judgeContentQuality(mockResume, mockJD);

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error!.code).toBe('LLM_ERROR');
    });

    it('[P1] should return timeout error when LLM times out', async () => {
      const mockInvoke = vi.fn()
        .mockRejectedValueOnce(new Error('timeout: Quality evaluation timed out'));

      vi.mocked(ChatAnthropic).mockImplementation(() => ({
        invoke: mockInvoke
      }) as any);

      const result = await judgeContentQuality(mockResume, mockJD);

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error!.code).toBe('LLM_TIMEOUT');
    });

    it('[P1] should return parse error for invalid JSON', async () => {
      const mockInvoke = vi.fn()
        .mockResolvedValueOnce({
          content: 'This is not valid JSON'
        });

      vi.mocked(ChatAnthropic).mockImplementation(() => ({
        invoke: mockInvoke
      }) as any);

      const result = await judgeContentQuality(mockResume, mockJD);

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error!.code).toBe('PARSE_ERROR');
    });

    it('[P1] should return parse error for invalid score values', async () => {
      const mockInvoke = vi.fn()
        .mockResolvedValueOnce({
          content: JSON.stringify({ relevance: 150, clarity: -10, impact: 'invalid' })
        });

      vi.mocked(ChatAnthropic).mockImplementation(() => ({
        invoke: mockInvoke
      }) as any);

      const result = await judgeContentQuality(mockResume, mockJD);

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error!.code).toBe('PARSE_ERROR');
    });

    it('[P2] should return parse error for missing score fields', async () => {
      const mockInvoke = vi.fn()
        .mockResolvedValueOnce({
          content: JSON.stringify({ relevance: 80 }) // Missing clarity and impact
        });

      vi.mocked(ChatAnthropic).mockImplementation(() => ({
        invoke: mockInvoke
      }) as any);

      const result = await judgeContentQuality(mockResume, mockJD);

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error!.code).toBe('PARSE_ERROR');
    });
  });

  describe('Prompt Injection Defense', () => {
    it('[P0] should wrap user content in XML tags', async () => {
      let capturedPrompt = '';
      const mockInvoke = vi.fn().mockImplementation((prompt: string) => {
        capturedPrompt = prompt;
        return Promise.resolve({
          content: JSON.stringify({ relevance: 85, clarity: 90, impact: 80 })
        });
      });

      vi.mocked(ChatAnthropic).mockImplementation(() => ({
        invoke: mockInvoke
      }) as any);

      await judgeContentQuality(mockResume, mockJD);

      // Check that user content is wrapped in XML tags
      expect(capturedPrompt).toContain('<resume_section type=');
      expect(capturedPrompt).toContain('</resume_section>');
      expect(capturedPrompt).toContain('<job_description>');
      expect(capturedPrompt).toContain('</job_description>');
    });
  });

  describe('Model Selection', () => {
    it('[P1] should use Claude Haiku for cost efficiency', async () => {
      const mockInvoke = vi.fn()
        .mockResolvedValue({
          content: JSON.stringify({ relevance: 85, clarity: 90, impact: 80 })
        });

      let capturedModelName = '';
      vi.mocked(ChatAnthropic).mockImplementation((config: any) => {
        capturedModelName = config.modelName;
        return {
          invoke: mockInvoke
        } as any;
      });

      await judgeContentQuality(mockResume, mockJD);

      expect(capturedModelName).toBe('claude-haiku-4-20250514');
    });
  });
});
