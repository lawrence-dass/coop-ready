/**
 * Unit tests for generateAllSuggestions server action
 * Story 6.9: Wire Analysis-to-Suggestion Pipeline
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAllSuggestions } from '@/actions/generateAllSuggestions';
import * as generateSummary from '@/lib/ai/generateSummarySuggestion';
import * as generateSkills from '@/lib/ai/generateSkillsSuggestion';
import * as generateExperience from '@/lib/ai/generateExperienceSuggestion';

// Mock dependencies
vi.mock('@/lib/ai/generateSummarySuggestion');
vi.mock('@/lib/ai/generateSkillsSuggestion');
vi.mock('@/lib/ai/generateExperienceSuggestion');

// Mock Supabase server client - track calls and control responses
const mockEq = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();
let mockDbError: { message: string } | null = null;

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: (table: string) => {
      mockFrom(table);
      return {
        update: (data: unknown) => {
          mockUpdate(data);
          return {
            eq: (field: string, value: string) => {
              mockEq(field, value);
              return { error: mockDbError };
            },
          };
        },
      };
    },
  })),
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockSummarySuggestion = {
  original: 'Software engineer with experience.',
  suggested: 'Results-driven Senior Software Engineer with 7+ years...',
  ats_keywords_added: ['senior', 'results-driven'],
  ai_tell_phrases_rewritten: [],
};

const mockSkillsSuggestion = {
  original: 'JavaScript, React',
  existing_skills: ['JavaScript', 'React'],
  matched_keywords: ['JavaScript', 'React'],
  missing_but_relevant: [{ skill: 'TypeScript', reason: 'In JD' }],
  skill_additions: ['TypeScript'],
  skill_removals: [],
  summary: 'You have 2/4 key skills.',
};

const mockExperienceSuggestion = {
  original: 'Did some work.',
  experience_entries: [
    {
      company: 'Acme',
      role: 'Engineer',
      dates: '2020-2023',
      original_bullets: ['Did some work'],
      suggested_bullets: [
        {
          original: 'Did some work',
          suggested: 'Led engineering team...',
          metrics_added: [],
          keywords_incorporated: ['led'],
        },
      ],
    },
  ],
  summary: 'Reframed 1 bullet.',
};

const validRequest = {
  sessionId: 'test-session-123',
  resumeSummary: 'Software engineer with experience.',
  resumeSkills: 'JavaScript, React',
  resumeExperience: 'Did some work.',
  resumeContent: 'Full resume content here',
  jobDescription: 'We need a senior engineer with React and TypeScript.',
  keywords: ['React', 'TypeScript'],
};

describe('generateAllSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: all generations succeed
    vi.mocked(generateSummary.generateSummarySuggestion).mockResolvedValue({
      data: mockSummarySuggestion,
      error: null,
    });
    vi.mocked(generateSkills.generateSkillsSuggestion).mockResolvedValue({
      data: mockSkillsSuggestion,
      error: null,
    });
    vi.mocked(generateExperience.generateExperienceSuggestion).mockResolvedValue({
      data: mockExperienceSuggestion,
      error: null,
    });

    // Reset supabase mocks
    mockFrom.mockClear();
    mockUpdate.mockClear();
    mockEq.mockClear();
    mockDbError = null;
  });

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  describe('validation', () => {
    it('should reject missing sessionId', async () => {
      const result = await generateAllSuggestions({
        ...validRequest,
        sessionId: '',
      });
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('Session ID');
      expect(result.data).toBeNull();
    });

    it('should reject missing jobDescription', async () => {
      const result = await generateAllSuggestions({
        ...validRequest,
        jobDescription: '',
      });
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('Job description');
      expect(result.data).toBeNull();
    });

    it('should reject missing resumeContent', async () => {
      const result = await generateAllSuggestions({
        ...validRequest,
        resumeContent: '',
      });
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('Resume content');
      expect(result.data).toBeNull();
    });
  });

  // ==========================================================================
  // SUCCESSFUL GENERATION
  // ==========================================================================

  describe('successful generation', () => {
    it('should return all 3 suggestions when all succeed', async () => {
      const result = await generateAllSuggestions(validRequest);

      expect(result.error).toBeNull();
      expect(result.data?.summary).toEqual(mockSummarySuggestion);
      expect(result.data?.skills).toEqual(mockSkillsSuggestion);
      expect(result.data?.experience).toEqual(mockExperienceSuggestion);
      expect(result.data?.sectionErrors).toEqual({});
    });

    it('should call all 3 generation functions with correct params', async () => {
      await generateAllSuggestions(validRequest);

      expect(generateSummary.generateSummarySuggestion).toHaveBeenCalledWith(
        validRequest.resumeSummary,
        validRequest.jobDescription,
        validRequest.keywords,
        undefined // preferences parameter (Story 11.2, optional)
      );
      expect(generateSkills.generateSkillsSuggestion).toHaveBeenCalledWith(
        validRequest.resumeSkills,
        validRequest.jobDescription,
        validRequest.resumeContent,
        undefined // preferences parameter (Story 11.2, optional)
      );
      expect(generateExperience.generateExperienceSuggestion).toHaveBeenCalledWith(
        validRequest.resumeExperience,
        validRequest.jobDescription,
        validRequest.resumeContent,
        undefined // preferences parameter (Story 11.2, optional)
      );
    });

    it('should save all suggestions to session', async () => {
      await generateAllSuggestions(validRequest);

      // Verify database update was called with correct data
      expect(mockFrom).toHaveBeenCalledWith('sessions');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          summary_suggestion: mockSummarySuggestion,
          skills_suggestion: mockSkillsSuggestion,
          experience_suggestion: mockExperienceSuggestion,
        })
      );
      expect(mockEq).toHaveBeenCalledWith('id', validRequest.sessionId);
    });
  });

  // ==========================================================================
  // PARTIAL SUCCESS (AC: Promise.allSettled)
  // ==========================================================================

  describe('partial success', () => {
    it('should return partial results when summary fails', async () => {
      vi.mocked(generateSummary.generateSummarySuggestion).mockResolvedValue({
        data: null,
        error: { code: 'LLM_ERROR', message: 'Summary generation failed' },
      });

      const result = await generateAllSuggestions(validRequest);

      expect(result.error).toBeNull();
      expect(result.data?.summary).toBeNull();
      expect(result.data?.skills).toEqual(mockSkillsSuggestion);
      expect(result.data?.experience).toEqual(mockExperienceSuggestion);
      expect(result.data?.sectionErrors.summary).toBe('Summary generation failed');
    });

    it('should return partial results when skills fails', async () => {
      vi.mocked(generateSkills.generateSkillsSuggestion).mockResolvedValue({
        data: null,
        error: { code: 'LLM_TIMEOUT', message: 'Skills timed out' },
      });

      const result = await generateAllSuggestions(validRequest);

      expect(result.error).toBeNull();
      expect(result.data?.summary).toEqual(mockSummarySuggestion);
      expect(result.data?.skills).toBeNull();
      expect(result.data?.experience).toEqual(mockExperienceSuggestion);
      expect(result.data?.sectionErrors.skills).toBe('Skills timed out');
    });

    it('should return partial results when experience fails', async () => {
      vi.mocked(generateExperience.generateExperienceSuggestion).mockResolvedValue({
        data: null,
        error: { code: 'LLM_ERROR', message: 'Experience error' },
      });

      const result = await generateAllSuggestions(validRequest);

      expect(result.error).toBeNull();
      expect(result.data?.summary).toEqual(mockSummarySuggestion);
      expect(result.data?.skills).toEqual(mockSkillsSuggestion);
      expect(result.data?.experience).toBeNull();
      expect(result.data?.sectionErrors.experience).toBe('Experience error');
    });

    it('should handle rejected promises gracefully', async () => {
      vi.mocked(generateSkills.generateSkillsSuggestion).mockRejectedValue(
        new Error('Network error')
      );

      const result = await generateAllSuggestions(validRequest);

      expect(result.error).toBeNull();
      expect(result.data?.summary).toEqual(mockSummarySuggestion);
      expect(result.data?.skills).toBeNull();
      expect(result.data?.experience).toEqual(mockExperienceSuggestion);
      expect(result.data?.sectionErrors.skills).toBe('Network error');
    });

    it('should return error when ALL sections fail', async () => {
      vi.mocked(generateSummary.generateSummarySuggestion).mockResolvedValue({
        data: null,
        error: { code: 'LLM_ERROR', message: 'Failed' },
      });
      vi.mocked(generateSkills.generateSkillsSuggestion).mockResolvedValue({
        data: null,
        error: { code: 'LLM_ERROR', message: 'Failed' },
      });
      vi.mocked(generateExperience.generateExperienceSuggestion).mockResolvedValue({
        data: null,
        error: { code: 'LLM_ERROR', message: 'Failed' },
      });

      const result = await generateAllSuggestions(validRequest);

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('LLM_ERROR');
      expect(result.error?.message).toContain('All suggestion sections failed');
    });

    it('should only save successful suggestions to session', async () => {
      vi.mocked(generateSummary.generateSummarySuggestion).mockResolvedValue({
        data: null,
        error: { code: 'LLM_ERROR', message: 'Failed' },
      });

      await generateAllSuggestions(validRequest);

      // Verify only successful suggestions were saved
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          skills_suggestion: mockSkillsSuggestion,
          experience_suggestion: mockExperienceSuggestion,
        })
      );

      // Summary should NOT be in the update
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).not.toHaveProperty('summary_suggestion');
    });
  });

  // ==========================================================================
  // MISSING RESUME SECTIONS (FALLBACK BEHAVIOR)
  // ==========================================================================

  describe('missing resume sections', () => {
    it('should use full resume as fallback when resumeSummary is empty', async () => {
      const result = await generateAllSuggestions({
        ...validRequest,
        resumeSummary: '',
      });

      // Should call with full resume content as fallback
      expect(generateSummary.generateSummarySuggestion).toHaveBeenCalledWith(
        validRequest.resumeContent, // fallback to full resume
        validRequest.jobDescription,
        validRequest.keywords,
        undefined
      );
      expect(result.data?.summary).toEqual(mockSummarySuggestion);
      expect(result.data?.skills).toEqual(mockSkillsSuggestion);
      expect(result.data?.experience).toEqual(mockExperienceSuggestion);
    });

    it('should use full resume as fallback when resumeSkills is empty', async () => {
      const result = await generateAllSuggestions({
        ...validRequest,
        resumeSkills: '',
      });

      // Should call with full resume content as fallback
      expect(generateSkills.generateSkillsSuggestion).toHaveBeenCalledWith(
        validRequest.resumeContent, // fallback to full resume
        validRequest.jobDescription,
        validRequest.resumeContent,
        undefined
      );
      expect(result.data?.skills).toEqual(mockSkillsSuggestion);
    });

    it('should use full resume as fallback when resumeExperience is empty', async () => {
      const result = await generateAllSuggestions({
        ...validRequest,
        resumeExperience: '',
      });

      // Should call with full resume content as fallback
      expect(generateExperience.generateExperienceSuggestion).toHaveBeenCalledWith(
        validRequest.resumeContent, // fallback to full resume
        validRequest.jobDescription,
        validRequest.resumeContent,
        undefined
      );
      expect(result.data?.experience).toEqual(mockExperienceSuggestion);
    });
  });

  // ==========================================================================
  // SESSION PERSISTENCE
  // ==========================================================================

  describe('session persistence', () => {
    it('should continue when session save fails', async () => {
      // Simulate database error
      mockDbError = { message: 'Session save failed' };

      const result = await generateAllSuggestions(validRequest);

      // Should still return suggestions even if save failed
      expect(result.error).toBeNull();
      expect(result.data?.summary).toEqual(mockSummarySuggestion);
    });

    it('should not call database update when no sections succeed', async () => {
      vi.mocked(generateSummary.generateSummarySuggestion).mockResolvedValue({
        data: null,
        error: { code: 'LLM_ERROR', message: 'Failed' },
      });
      vi.mocked(generateSkills.generateSkillsSuggestion).mockResolvedValue({
        data: null,
        error: { code: 'LLM_ERROR', message: 'Failed' },
      });
      vi.mocked(generateExperience.generateExperienceSuggestion).mockResolvedValue({
        data: null,
        error: { code: 'LLM_ERROR', message: 'Failed' },
      });

      await generateAllSuggestions(validRequest);

      // Database update should not be called when nothing succeeded
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
