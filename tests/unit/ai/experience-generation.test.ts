/**
 * Unit Tests for Experience Suggestion Generation
 * Story 6.4: Implement Experience Section Suggestions
 *
 * Tests the generateExperienceSuggestion() function
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateExperienceSuggestion } from '@/lib/ai/generateExperienceSuggestion';
import type { ExperienceSuggestion } from '@/types/suggestions';

// Mock the ChatAnthropic
vi.mock('@langchain/anthropic', () => ({
  ChatAnthropic: vi.fn().mockImplementation(() => ({
    invoke: vi.fn(),
  })),
}));

describe('generateExperienceSuggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation (AC #5)', () => {
    it('should return VALIDATION_ERROR when experience is empty', async () => {
      const result = await generateExperienceSuggestion('', 'Valid JD', 'Valid resume');

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('experience');
      expect(result.data).toBeNull();
    });

    it('should return VALIDATION_ERROR when job description is empty', async () => {
      const result = await generateExperienceSuggestion('Valid experience', '', 'Valid resume');

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('description');
      expect(result.data).toBeNull();
    });

    it('should return VALIDATION_ERROR when resume content is empty', async () => {
      const result = await generateExperienceSuggestion('Valid experience', 'Valid JD', '');

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('Resume');
      expect(result.data).toBeNull();
    });
  });

  describe('Successful Generation (AC #1, #2, #3, #4)', () => {
    it('should generate experience suggestions with bullet reframing', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          experience_entries: [
            {
              company: 'Tech Corp',
              role: 'Software Engineer',
              dates: '2020 - 2023',
              original_bullets: ['Built features', 'Managed team'],
              suggested_bullets: [
                {
                  original: 'Built features',
                  suggested: 'Developed 15+ features using React and Node.js, improving user engagement by 30%',
                  metrics_added: ['15+', '30%'],
                  keywords_incorporated: ['React', 'Node.js'],
                },
                {
                  original: 'Managed team',
                  suggested: 'Led cross-functional team of 5 engineers to deliver projects on time',
                  metrics_added: ['5 engineers'],
                  keywords_incorporated: ['cross-functional'],
                },
              ],
            },
          ],
          summary: 'Reframed 2 bullets, added metrics to 2, incorporated 3 keywords',
        }),
      });

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateExperienceSuggestion(
        'Experience section text',
        'Job requires React and Node.js experience',
        'Full resume content'
      );

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.experience_entries).toHaveLength(1);
      expect(result.data?.experience_entries[0].company).toBe('Tech Corp');
      expect(result.data?.experience_entries[0].suggested_bullets).toHaveLength(2);
      expect(result.data?.summary).toContain('Reframed 2 bullets');
    });

    it('should handle multiple experience entries', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          experience_entries: [
            {
              company: 'Company A',
              role: 'Senior Dev',
              dates: '2021 - 2023',
              original_bullets: ['Task 1'],
              suggested_bullets: [
                {
                  original: 'Task 1',
                  suggested: 'Enhanced task 1',
                  metrics_added: [],
                  keywords_incorporated: ['keyword'],
                },
              ],
            },
            {
              company: 'Company B',
              role: 'Junior Dev',
              dates: '2019 - 2021',
              original_bullets: ['Task 2'],
              suggested_bullets: [
                {
                  original: 'Task 2',
                  suggested: 'Enhanced task 2',
                  metrics_added: [],
                  keywords_incorporated: [],
                },
              ],
            },
          ],
          summary: 'Processed 2 roles',
        }),
      });

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateExperienceSuggestion(
        'Multi-job experience',
        'Job description',
        'Full resume'
      );

      expect(result.error).toBeNull();
      expect(result.data?.experience_entries).toHaveLength(2);
    });
  });

  describe('Error Handling (AC #5, #9)', () => {
    it('should return PARSE_ERROR when LLM returns invalid JSON', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: 'Not valid JSON',
      });

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateExperienceSuggestion('Experience', 'JD', 'Resume');

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('PARSE_ERROR');
      expect(result.data).toBeNull();
    });

    it('should return PARSE_ERROR when experience_entries is missing', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          summary: 'Missing entries',
        }),
      });

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateExperienceSuggestion('Experience', 'JD', 'Resume');

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('PARSE_ERROR');
    });

    it('should return LLM_TIMEOUT on timeout', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockRejectedValue(new Error('timeout occurred'));

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateExperienceSuggestion('Experience', 'JD', 'Resume');

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('LLM_TIMEOUT');
    });

    it('should return RATE_LIMITED on rate limit error', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockRejectedValue(new Error('Rate limit exceeded'));

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateExperienceSuggestion('Experience', 'JD', 'Resume');

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('RATE_LIMITED');
    });

    it('should return LLM_ERROR on generic error', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockRejectedValue(new Error('Generic LLM error'));

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateExperienceSuggestion('Experience', 'JD', 'Resume');

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('LLM_ERROR');
    });
  });

  describe('Security (AC #6)', () => {
    it('should wrap user content in XML tags', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          experience_entries: [],
          summary: 'Test',
        }),
      });

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      await generateExperienceSuggestion('Experience', 'JD', 'Resume');

      const callArg = mockInvoke.mock.calls[0][0];
      expect(callArg).toContain('<user_content>');
      expect(callArg).toContain('</user_content>');
      expect(callArg).toContain('<job_description>');
      expect(callArg).toContain('</job_description>');
    });
  });
});
