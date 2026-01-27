/**
 * Unit Tests for Point Value Calculation and Validation
 * Story 11.1: Implement Point Values for Suggestions
 *
 * Tests cover:
 * - Point value validation in generateSummarySuggestion (0-100 range)
 * - Point value validation in generateSkillsSuggestion (individual + total)
 * - Point value validation in generateExperienceSuggestion (individual + total)
 * - Graceful handling of invalid/missing point values
 * - Total point value calculation across sections
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSummarySuggestion } from '@/lib/ai/generateSummarySuggestion';
import { generateSkillsSuggestion } from '@/lib/ai/generateSkillsSuggestion';
import { generateExperienceSuggestion } from '@/lib/ai/generateExperienceSuggestion';
import { ChatAnthropic } from '@langchain/anthropic';

// Mock LangChain ChatAnthropic
vi.mock('@langchain/anthropic', () => ({
  ChatAnthropic: vi.fn(),
}));

// Mock detectAITellPhrases (used by summary generation)
vi.mock('@/lib/ai/detectAITellPhrases', () => ({
  detectAITellPhrases: vi.fn(() => []),
}));

// Helper to create a mock LLM that returns the given JSON
function mockLLMResponse(responseObj: unknown) {
  const mockInvoke = vi.fn().mockResolvedValue({
    content: JSON.stringify(responseObj),
  });
  vi.mocked(ChatAnthropic).mockImplementation(
    () => ({ invoke: mockInvoke }) as unknown as ChatAnthropic
  );
  return mockInvoke;
}

describe('Point Value Validation', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // SUMMARY SUGGESTION POINT VALUES
  // ==========================================================================

  describe('generateSummarySuggestion - Point Values', () => {
    const validSummary = 'Experienced software engineer with 5 years in full-stack development.';
    const validJD = 'Looking for a senior software engineer with React and TypeScript experience.';

    it('should include valid point_value in response', async () => {
      mockLLMResponse({
        suggested: 'Results-driven software engineer with 5+ years of full-stack development in React and TypeScript.',
        keywords_added: ['React', 'TypeScript'],
        point_value: 8,
      });

      const result = await generateSummarySuggestion(validSummary, validJD);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.point_value).toBe(8);
    });

    it('should accept point_value of 0', async () => {
      mockLLMResponse({
        suggested: 'Same summary with minimal changes.',
        keywords_added: [],
        point_value: 0,
      });

      const result = await generateSummarySuggestion(validSummary, validJD);

      expect(result.error).toBeNull();
      expect(result.data?.point_value).toBe(0);
    });

    it('should accept point_value of 100', async () => {
      mockLLMResponse({
        suggested: 'Completely rewritten summary.',
        keywords_added: ['React', 'TypeScript', 'AWS'],
        point_value: 100,
      });

      const result = await generateSummarySuggestion(validSummary, validJD);

      expect(result.error).toBeNull();
      expect(result.data?.point_value).toBe(100);
    });

    it('should ignore negative point_value', async () => {
      mockLLMResponse({
        suggested: 'Optimized summary.',
        keywords_added: ['React'],
        point_value: -5,
      });

      const result = await generateSummarySuggestion(validSummary, validJD);

      expect(result.error).toBeNull();
      expect(result.data?.point_value).toBeUndefined();
    });

    it('should ignore point_value exceeding 100', async () => {
      mockLLMResponse({
        suggested: 'Optimized summary.',
        keywords_added: ['React'],
        point_value: 150,
      });

      const result = await generateSummarySuggestion(validSummary, validJD);

      expect(result.error).toBeNull();
      expect(result.data?.point_value).toBeUndefined();
    });

    it('should ignore non-numeric point_value', async () => {
      mockLLMResponse({
        suggested: 'Optimized summary.',
        keywords_added: ['React'],
        point_value: 'high',
      });

      const result = await generateSummarySuggestion(validSummary, validJD);

      expect(result.error).toBeNull();
      expect(result.data?.point_value).toBeUndefined();
    });

    it('should handle missing point_value gracefully (backwards compatible)', async () => {
      mockLLMResponse({
        suggested: 'Optimized summary without point value.',
        keywords_added: ['React'],
      });

      const result = await generateSummarySuggestion(validSummary, validJD);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.point_value).toBeUndefined();
    });
  });

  // ==========================================================================
  // SKILLS SUGGESTION POINT VALUES
  // ==========================================================================

  describe('generateSkillsSuggestion - Point Values', () => {
    const validSkills = 'Python, JavaScript, React, Node.js';
    const validJD = 'Senior developer with Python, React, Docker, and Kubernetes experience.';

    it('should include valid point_value on individual skills', async () => {
      mockLLMResponse({
        existing_skills: ['Python', 'JavaScript', 'React', 'Node.js'],
        matched_keywords: ['Python', 'React'],
        missing_but_relevant: [
          { skill: 'Docker', reason: 'Required by JD', point_value: 5 },
          { skill: 'Kubernetes', reason: 'Required by JD', point_value: 4 },
        ],
        skill_additions: ['Docker', 'Kubernetes'],
        skill_removals: [],
        total_point_value: 9,
        summary: 'Add Docker and Kubernetes.',
      });

      const result = await generateSkillsSuggestion(validSkills, validJD);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.missing_but_relevant[0].point_value).toBe(5);
      expect(result.data?.missing_but_relevant[1].point_value).toBe(4);
      expect(result.data?.total_point_value).toBe(9);
    });

    it('should ignore invalid point_value on individual skills', async () => {
      mockLLMResponse({
        existing_skills: ['Python'],
        matched_keywords: ['Python'],
        missing_but_relevant: [
          { skill: 'Docker', reason: 'Required', point_value: -3 },
          { skill: 'K8s', reason: 'Required', point_value: 'high' },
        ],
        skill_additions: ['Docker', 'K8s'],
        skill_removals: [],
        total_point_value: 10,
        summary: 'Test',
      });

      const result = await generateSkillsSuggestion(validSkills, validJD);

      expect(result.error).toBeNull();
      expect(result.data?.missing_but_relevant[0].point_value).toBeUndefined();
      expect(result.data?.missing_but_relevant[1].point_value).toBeUndefined();
    });

    it('should accept total_point_value exceeding 100 (sum of many skills)', async () => {
      mockLLMResponse({
        existing_skills: ['Python'],
        matched_keywords: ['Python'],
        missing_but_relevant: [],
        skill_additions: [],
        skill_removals: [],
        total_point_value: 120,
        summary: 'Large total',
      });

      const result = await generateSkillsSuggestion(validSkills, validJD);

      expect(result.error).toBeNull();
      expect(result.data?.total_point_value).toBe(120);
    });

    it('should ignore negative total_point_value', async () => {
      mockLLMResponse({
        existing_skills: ['Python'],
        matched_keywords: ['Python'],
        missing_but_relevant: [],
        skill_additions: [],
        skill_removals: [],
        total_point_value: -10,
        summary: 'Negative total',
      });

      const result = await generateSkillsSuggestion(validSkills, validJD);

      expect(result.error).toBeNull();
      expect(result.data?.total_point_value).toBeUndefined();
    });

    it('should handle missing point values gracefully (backwards compatible)', async () => {
      mockLLMResponse({
        existing_skills: ['Python', 'JavaScript'],
        matched_keywords: ['Python'],
        missing_but_relevant: [
          { skill: 'Docker', reason: 'Required by JD' },
        ],
        skill_additions: ['Docker'],
        skill_removals: [],
        summary: 'Add Docker.',
      });

      const result = await generateSkillsSuggestion(validSkills, validJD);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.missing_but_relevant[0].point_value).toBeUndefined();
      expect(result.data?.total_point_value).toBeUndefined();
    });
  });

  // ==========================================================================
  // EXPERIENCE SUGGESTION POINT VALUES
  // ==========================================================================

  describe('generateExperienceSuggestion - Point Values', () => {
    const validExperience = 'Senior Developer at Tech Corp (2020-2023)\n- Built web applications\n- Managed team';
    const validJD = 'Looking for engineer with React, AWS, and leadership experience.';
    const validResume = 'Full resume content with experience and skills sections.';

    it('should include valid point_value on individual bullets', async () => {
      mockLLMResponse({
        experience_entries: [
          {
            company: 'Tech Corp',
            role: 'Senior Developer',
            dates: '2020-2023',
            original_bullets: ['Built web applications', 'Managed team'],
            suggested_bullets: [
              {
                original: 'Built web applications',
                suggested: 'Developed scalable React web applications on AWS',
                metrics_added: [],
                keywords_incorporated: ['React', 'AWS'],
                point_value: 7,
              },
              {
                original: 'Managed team',
                suggested: 'Led cross-functional team of 5 engineers',
                metrics_added: ['5'],
                keywords_incorporated: ['leadership'],
                point_value: 9,
              },
            ],
          },
        ],
        total_point_value: 16,
        summary: 'Reframed 2 bullets.',
      });

      const result = await generateExperienceSuggestion(validExperience, validJD, validResume);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      const bullets = result.data!.experience_entries[0].suggested_bullets;
      expect(bullets[0].point_value).toBe(7);
      expect(bullets[1].point_value).toBe(9);
      expect(result.data?.total_point_value).toBe(16);
    });

    it('should ignore invalid point_value on individual bullets', async () => {
      mockLLMResponse({
        experience_entries: [
          {
            company: 'Tech Corp',
            role: 'Developer',
            dates: '2020-2023',
            original_bullets: ['Built apps'],
            suggested_bullets: [
              {
                original: 'Built apps',
                suggested: 'Built React apps',
                metrics_added: [],
                keywords_incorporated: ['React'],
                point_value: -5,
              },
            ],
          },
        ],
        total_point_value: 10,
        summary: 'Test',
      });

      const result = await generateExperienceSuggestion(validExperience, validJD, validResume);

      expect(result.error).toBeNull();
      expect(result.data!.experience_entries[0].suggested_bullets[0].point_value).toBeUndefined();
    });

    it('should accept total_point_value exceeding 100 (sum of many bullets)', async () => {
      mockLLMResponse({
        experience_entries: [
          {
            company: 'Corp',
            role: 'Dev',
            dates: '2020-2023',
            original_bullets: ['A'],
            suggested_bullets: [
              {
                original: 'A',
                suggested: 'B',
                metrics_added: [],
                keywords_incorporated: [],
                point_value: 80,
              },
            ],
          },
        ],
        total_point_value: 150,
        summary: 'Large total from many entries.',
      });

      const result = await generateExperienceSuggestion(validExperience, validJD, validResume);

      expect(result.error).toBeNull();
      expect(result.data?.total_point_value).toBe(150);
    });

    it('should ignore negative total_point_value', async () => {
      mockLLMResponse({
        experience_entries: [
          {
            company: 'Corp',
            role: 'Dev',
            dates: '2020-2023',
            original_bullets: ['A'],
            suggested_bullets: [
              {
                original: 'A',
                suggested: 'B',
                metrics_added: [],
                keywords_incorporated: [],
              },
            ],
          },
        ],
        total_point_value: -20,
        summary: 'Negative total',
      });

      const result = await generateExperienceSuggestion(validExperience, validJD, validResume);

      expect(result.error).toBeNull();
      expect(result.data?.total_point_value).toBeUndefined();
    });

    it('should handle missing point values gracefully (backwards compatible)', async () => {
      mockLLMResponse({
        experience_entries: [
          {
            company: 'Tech Corp',
            role: 'Developer',
            dates: '2020-2023',
            original_bullets: ['Built apps'],
            suggested_bullets: [
              {
                original: 'Built apps',
                suggested: 'Built enterprise React applications',
                metrics_added: [],
                keywords_incorporated: ['React'],
              },
            ],
          },
        ],
        summary: 'No point values provided.',
      });

      const result = await generateExperienceSuggestion(validExperience, validJD, validResume);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.experience_entries[0].suggested_bullets[0].point_value).toBeUndefined();
      expect(result.data?.total_point_value).toBeUndefined();
    });

    it('should accept point_value of 0 on bullets', async () => {
      mockLLMResponse({
        experience_entries: [
          {
            company: 'Corp',
            role: 'Dev',
            dates: '2020-2023',
            original_bullets: ['Wrote code'],
            suggested_bullets: [
              {
                original: 'Wrote code',
                suggested: 'Wrote code (unchanged)',
                metrics_added: [],
                keywords_incorporated: [],
                point_value: 0,
              },
            ],
          },
        ],
        total_point_value: 0,
        summary: 'No improvement.',
      });

      const result = await generateExperienceSuggestion(validExperience, validJD, validResume);

      expect(result.error).toBeNull();
      expect(result.data!.experience_entries[0].suggested_bullets[0].point_value).toBe(0);
      expect(result.data?.total_point_value).toBe(0);
    });
  });
});
