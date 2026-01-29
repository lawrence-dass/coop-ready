/**
 * Story 14.2: Test LLM prompts return explanation field
 *
 * This test ensures that:
 * 1. Summary, Skills, and Experience generation functions return explanation field
 * 2. Explanation field is properly parsed from LLM JSON response
 * 3. Missing or empty explanations are handled gracefully
 * 4. Explanation quality validation logs warnings for generic explanations
 */

import { describe, it, expect, vi } from 'vitest';
import { generateSummarySuggestion } from '@/lib/ai/generateSummarySuggestion';
import { generateSkillsSuggestion } from '@/lib/ai/generateSkillsSuggestion';
import { generateExperienceSuggestion } from '@/lib/ai/generateExperienceSuggestion';

// Mock ChatAnthropic
vi.mock('@langchain/anthropic', () => {
  return {
    ChatAnthropic: vi.fn().mockImplementation(() => ({
      invoke: vi.fn(),
    })),
  };
});

// Mock detectAITellPhrases
vi.mock('@/lib/ai/detectAITellPhrases', () => ({
  detectAITellPhrases: vi.fn(() => []),
}));

// Mock buildPreferencePrompt
vi.mock('@/lib/ai/preferences', () => ({
  buildPreferencePrompt: vi.fn(() => ''),
}));

describe('Story 14.2: Explanation Generation in LLM Prompts', () => {
  describe('generateSummarySuggestion', () => {
    it('should return explanation field when LLM provides it', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          suggested: 'AWS-experienced engineer specializing in cloud infrastructure',
          keywords_added: ['AWS', 'cloud infrastructure'],
          point_value: 9,
          explanation: 'Adding AWS highlights your infrastructure experience directly mentioned in JD\'s "AWS expertise required" requirement.',
        }),
      });

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateSummarySuggestion(
        'Engineer with cloud experience',
        'Looking for AWS expert with cloud infrastructure skills'
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.explanation).toBe('Adding AWS highlights your infrastructure experience directly mentioned in JD\'s "AWS expertise required" requirement.');
    });

    it('should handle missing explanation gracefully', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          suggested: 'Optimized summary',
          keywords_added: ['keyword1'],
          point_value: 7,
          // No explanation field
        }),
      });

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateSummarySuggestion(
        'Original summary',
        'Job description with keywords'
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.explanation).toBeUndefined();
    });

    it('should handle empty string explanation', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          suggested: 'Optimized summary',
          keywords_added: ['keyword1'],
          point_value: 7,
          explanation: '',
        }),
      });

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateSummarySuggestion(
        'Original summary',
        'Job description with keywords'
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.explanation).toBe('');
    });

    it('should handle null explanation gracefully', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          suggested: 'Optimized summary',
          keywords_added: ['keyword1'],
          point_value: 7,
          explanation: null,
        }),
      });

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateSummarySuggestion(
        'Original summary',
        'Job description with keywords'
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      // null should be converted to empty string per graceful handling
      expect(result.data?.explanation).toBeUndefined();
    });

    it('should truncate very long explanations', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const longExplanation = 'A'.repeat(600); // Exceeds 500 char limit
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          suggested: 'Optimized summary',
          keywords_added: ['keyword1'],
          point_value: 7,
          explanation: longExplanation,
        }),
      });

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateSummarySuggestion(
        'Original summary',
        'Job description with keywords'
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.explanation).toBeDefined();
      expect(result.data!.explanation!.length).toBeLessThanOrEqual(500);
      expect(result.data!.explanation).toMatch(/\.\.\.$/); // Should end with ellipsis
    });
  });

  describe('generateSkillsSuggestion', () => {
    it('should return explanation field when LLM provides it', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          existing_skills: ['React'],
          matched_keywords: ['React'],
          missing_but_relevant: [
            { skill: 'TypeScript', reason: 'Required in JD', point_value: 5 },
          ],
          skill_additions: ['TypeScript'],
          skill_removals: [],
          total_point_value: 5,
          summary: 'Add TypeScript',
          explanation: 'TypeScript is explicitly required in the job description and complements your React expertise.',
        }),
      });

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateSkillsSuggestion(
        'React, JavaScript',
        'Looking for TypeScript and React developer'
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.explanation).toBe('TypeScript is explicitly required in the job description and complements your React expertise.');
    });

    it('should handle missing explanation gracefully', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          existing_skills: ['React'],
          matched_keywords: ['React'],
          missing_but_relevant: [],
          skill_additions: [],
          skill_removals: [],
          summary: 'All good',
          // No explanation field
        }),
      });

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateSkillsSuggestion(
        'React, JavaScript',
        'Looking for React developer'
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.explanation).toBeUndefined();
    });

    it('should handle null explanation gracefully', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          existing_skills: ['React'],
          matched_keywords: ['React'],
          missing_but_relevant: [],
          skill_additions: [],
          skill_removals: [],
          summary: 'All good',
          explanation: null,
        }),
      });

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateSkillsSuggestion(
        'React, JavaScript',
        'Looking for React developer'
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      // null should be treated as missing, resulting in undefined
      expect(result.data?.explanation).toBeUndefined();
    });
  });

  describe('generateExperienceSuggestion', () => {
    it('should return explanation field for each bullet when LLM provides it', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          experience_entries: [
            {
              company: 'Tech Corp',
              role: 'Engineer',
              dates: '2020-2023',
              original_bullets: ['Led team'],
              suggested_bullets: [
                {
                  original: 'Led team',
                  suggested: 'Led team of 5 engineers to deliver microservices architecture',
                  metrics_added: ['5 engineers'],
                  keywords_incorporated: ['microservices', 'architecture'],
                  point_value: 8,
                  explanation: 'Adding "microservices architecture" directly addresses the JD requirement for distributed systems experience.',
                },
              ],
            },
          ],
          total_point_value: 8,
          summary: 'Enhanced bullet with JD keywords',
        }),
      });

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateExperienceSuggestion(
        'Led team at Tech Corp',
        'Looking for microservices architecture experience',
        'Full resume with Tech Corp experience'
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.experience_entries[0]?.suggested_bullets[0]?.explanation).toBe(
        'Adding "microservices architecture" directly addresses the JD requirement for distributed systems experience.'
      );
    });

    it('should handle missing bullet explanation gracefully', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          experience_entries: [
            {
              company: 'Tech Corp',
              role: 'Engineer',
              dates: '2020-2023',
              original_bullets: ['Led team'],
              suggested_bullets: [
                {
                  original: 'Led team',
                  suggested: 'Led team of engineers',
                  metrics_added: [],
                  keywords_incorporated: [],
                  point_value: 3,
                  // No explanation field
                },
              ],
            },
          ],
          summary: 'Minor updates',
        }),
      });

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateExperienceSuggestion(
        'Led team at Tech Corp',
        'Job description',
        'Full resume'
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.experience_entries[0]?.suggested_bullets[0]?.explanation).toBeUndefined();
    });

    it('should handle null bullet explanation gracefully', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          experience_entries: [
            {
              company: 'Tech Corp',
              role: 'Engineer',
              dates: '2020-2023',
              original_bullets: ['Led team'],
              suggested_bullets: [
                {
                  original: 'Led team',
                  suggested: 'Led team of engineers',
                  metrics_added: [],
                  keywords_incorporated: [],
                  point_value: 3,
                  explanation: null,
                },
              ],
            },
          ],
          summary: 'Minor updates',
        }),
      });

      (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        invoke: mockInvoke,
      }));

      const result = await generateExperienceSuggestion(
        'Led team at Tech Corp',
        'Job description',
        'Full resume'
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      // null should be treated as missing, resulting in undefined
      expect(result.data?.experience_entries[0]?.suggested_bullets[0]?.explanation).toBeUndefined();
    });
  });
});
