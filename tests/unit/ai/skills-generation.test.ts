/**
 * Unit Tests for generateSkillsSuggestion
 * Story 6.3: Skills Suggestion Generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSkillsSuggestion } from '@/lib/ai/generateSkillsSuggestion';
import { ChatAnthropic } from '@langchain/anthropic';

// Mock LangChain ChatAnthropic
vi.mock('@langchain/anthropic', () => ({
  ChatAnthropic: vi.fn(),
}));

describe('generateSkillsSuggestion', () => {
  // Mock API key
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should return VALIDATION_ERROR when resumeSkills is empty', async () => {
      const result = await generateSkillsSuggestion('', 'Some job description');

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('skills section is required');
      expect(result.data).toBeNull();
    });

    it('should return VALIDATION_ERROR when jobDescription is empty', async () => {
      const result = await generateSkillsSuggestion(
        'Python, JavaScript, React',
        ''
      );

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('description is required');
      expect(result.data).toBeNull();
    });

    it('should accept valid inputs', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          existing_skills: ['Python', 'JavaScript'],
          matched_keywords: ['Python'],
          missing_but_relevant: [],
          skill_additions: ['TypeScript'],
          skill_removals: [],
          summary: 'Test summary',
        }),
      });

      vi.mocked(ChatAnthropic).mockImplementation(
        () =>
          ({
            invoke: mockInvoke,
          }) as unknown as ChatAnthropic
      );

      const result = await generateSkillsSuggestion(
        'Python, JavaScript',
        'Looking for TypeScript developer'
      );

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
    });
  });

  describe('LLM Response Parsing', () => {
    it('should parse valid LLM response correctly', async () => {
      const mockResponse = {
        existing_skills: ['Python', 'JavaScript', 'React'],
        matched_keywords: ['Python', 'React'],
        missing_but_relevant: [
          {
            skill: 'Docker',
            reason: 'Job requires containerization',
          },
        ],
        skill_additions: ['Docker', 'Kubernetes'],
        skill_removals: [
          {
            skill: 'jQuery',
            reason: 'Less relevant for modern stack',
          },
        ],
        summary: 'You have 8/12 key skills. Consider adding Docker.',
      };

      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify(mockResponse),
      });

      vi.mocked(ChatAnthropic).mockImplementation(
        () =>
          ({
            invoke: mockInvoke,
          }) as unknown as ChatAnthropic
      );

      const result = await generateSkillsSuggestion(
        'Python, JavaScript, React, jQuery',
        'Looking for Python/React developer with Docker experience'
      );

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.existing_skills).toHaveLength(3);
      expect(result.data?.matched_keywords).toContain('Python');
      expect(result.data?.matched_keywords).toContain('React');
      expect(result.data?.missing_but_relevant).toHaveLength(1);
      expect(result.data?.skill_additions).toContain('Docker');
      expect(result.data?.skill_removals).toHaveLength(1);
    });

    it('should return PARSE_ERROR for invalid JSON', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        content: 'This is not JSON',
      });

      vi.mocked(ChatAnthropic).mockImplementation(
        () =>
          ({
            invoke: mockInvoke,
          }) as unknown as ChatAnthropic
      );

      const result = await generateSkillsSuggestion(
        'Python, JavaScript',
        'Job description'
      );

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('PARSE_ERROR');
      expect(result.data).toBeNull();
    });

    it('should return PARSE_ERROR for missing existing_skills', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          matched_keywords: ['Python'],
          skill_additions: [],
          summary: 'Test',
        }),
      });

      vi.mocked(ChatAnthropic).mockImplementation(
        () =>
          ({
            invoke: mockInvoke,
          }) as unknown as ChatAnthropic
      );

      const result = await generateSkillsSuggestion(
        'Python',
        'Job description'
      );

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('PARSE_ERROR');
      expect(result.error?.message).toContain('existing_skills');
    });

    it('should return PARSE_ERROR for missing summary', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          existing_skills: ['Python'],
          matched_keywords: ['Python'],
          skill_additions: [],
        }),
      });

      vi.mocked(ChatAnthropic).mockImplementation(
        () =>
          ({
            invoke: mockInvoke,
          }) as unknown as ChatAnthropic
      );

      const result = await generateSkillsSuggestion(
        'Python',
        'Job description'
      );

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('PARSE_ERROR');
      expect(result.error?.message).toContain('summary');
    });
  });

  describe('Error Handling', () => {
    it('should return LLM_TIMEOUT on timeout error', async () => {
      const mockInvoke = vi
        .fn()
        .mockRejectedValue(new Error('Request timeout'));

      vi.mocked(ChatAnthropic).mockImplementation(
        () =>
          ({
            invoke: mockInvoke,
          }) as unknown as ChatAnthropic
      );

      const result = await generateSkillsSuggestion(
        'Python, JavaScript',
        'Job description'
      );

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('LLM_TIMEOUT');
      expect(result.data).toBeNull();
    });

    it('should return RATE_LIMITED on rate limit error', async () => {
      const mockInvoke = vi
        .fn()
        .mockRejectedValue(new Error('Rate limit exceeded'));

      vi.mocked(ChatAnthropic).mockImplementation(
        () =>
          ({
            invoke: mockInvoke,
          }) as unknown as ChatAnthropic
      );

      const result = await generateSkillsSuggestion(
        'Python, JavaScript',
        'Job description'
      );

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('RATE_LIMITED');
      expect(result.data).toBeNull();
    });

    it('should return LLM_ERROR for generic errors', async () => {
      const mockInvoke = vi
        .fn()
        .mockRejectedValue(new Error('Unknown API error'));

      vi.mocked(ChatAnthropic).mockImplementation(
        () =>
          ({
            invoke: mockInvoke,
          }) as unknown as ChatAnthropic
      );

      const result = await generateSkillsSuggestion(
        'Python, JavaScript',
        'Job description'
      );

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('LLM_ERROR');
      expect(result.data).toBeNull();
    });
  });

  describe('Input Truncation', () => {
    it('should truncate very long skills input', async () => {
      const longSkills = 'Python, JavaScript, '.repeat(500); // > 1000 chars

      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          existing_skills: ['Python'],
          matched_keywords: ['Python'],
          missing_but_relevant: [],
          skill_additions: [],
          skill_removals: [],
          summary: 'Test',
        }),
      });

      vi.mocked(ChatAnthropic).mockImplementation(
        () =>
          ({
            invoke: mockInvoke,
          }) as unknown as ChatAnthropic
      );

      const result = await generateSkillsSuggestion(
        longSkills,
        'Job description'
      );

      expect(result.error).toBeNull();
      expect(mockInvoke).toHaveBeenCalled();
    });

    it('should truncate very long job description', async () => {
      const longJD = 'Requirements: '.repeat(1000); // > 3000 chars

      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          existing_skills: ['Python'],
          matched_keywords: ['Python'],
          missing_but_relevant: [],
          skill_additions: [],
          skill_removals: [],
          summary: 'Test',
        }),
      });

      vi.mocked(ChatAnthropic).mockImplementation(
        () =>
          ({
            invoke: mockInvoke,
          }) as unknown as ChatAnthropic
      );

      const result = await generateSkillsSuggestion('Python', longJD);

      expect(result.error).toBeNull();
      expect(mockInvoke).toHaveBeenCalled();
    });
  });

  describe('Optional Resume Content', () => {
    it('should work without resume content', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          existing_skills: ['Python'],
          matched_keywords: ['Python'],
          missing_but_relevant: [],
          skill_additions: [],
          skill_removals: [],
          summary: 'Test',
        }),
      });

      vi.mocked(ChatAnthropic).mockImplementation(
        () =>
          ({
            invoke: mockInvoke,
          }) as unknown as ChatAnthropic
      );

      const result = await generateSkillsSuggestion(
        'Python',
        'Job description'
        // No resumeContent provided
      );

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
    });

    it('should include resume content in prompt when provided', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          existing_skills: ['Python'],
          matched_keywords: ['Python'],
          missing_but_relevant: [],
          skill_additions: ['Docker'],
          skill_removals: [],
          summary: 'Test',
        }),
      });

      vi.mocked(ChatAnthropic).mockImplementation(
        () =>
          ({
            invoke: mockInvoke,
          }) as unknown as ChatAnthropic
      );

      const result = await generateSkillsSuggestion(
        'Python',
        'Job description',
        'Full resume with Docker experience mentioned'
      );

      expect(result.error).toBeNull();
      expect(mockInvoke).toHaveBeenCalled();

      // Check that prompt includes resume content
      const promptArg = mockInvoke.mock.calls[0][0] as string;
      expect(promptArg).toContain('full_resume');
    });
  });
});
