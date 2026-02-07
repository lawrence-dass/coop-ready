/**
 * generateAllSuggestions CandidateType Integration Tests
 * Story 18.10 Task 6
 *
 * Tests candidateType flows through generateAllSuggestions to all 5 generators,
 * co-op summary skip, career_changer summary force, and projects handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAllSuggestions } from '@/actions/generateAllSuggestions';
import * as generateSummary from '@/lib/ai/generateSummarySuggestion';
import * as generateSkills from '@/lib/ai/generateSkillsSuggestion';
import * as generateExperience from '@/lib/ai/generateExperienceSuggestion';
import * as generateEducation from '@/lib/ai/generateEducationSuggestion';
import * as generateProjects from '@/lib/ai/generateProjectsSuggestion';

// Mock all AI generators
vi.mock('@/lib/ai/generateSummarySuggestion');
vi.mock('@/lib/ai/generateSkillsSuggestion');
vi.mock('@/lib/ai/generateExperienceSuggestion');
vi.mock('@/lib/ai/generateEducationSuggestion');
vi.mock('@/lib/ai/generateProjectsSuggestion');
vi.mock('@/lib/ai/judgeSuggestion');

// Mock Supabase
const mockEq = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockMaybeSingle = vi.fn();

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
              return { error: null };
            },
          };
        },
        select: () => {
          mockSelect();
          return {
            eq: () => ({
              maybeSingle: () => {
                return mockMaybeSingle();
              },
            }),
          };
        },
      };
    },
  })),
}));

// Mock user context
vi.mock('@/lib/supabase/user-context', () => ({
  getUserContext: vi.fn().mockResolvedValue({ data: {}, error: null }),
}));

// Mock sessions
vi.mock('@/lib/supabase/sessions');

// ============================================================================
// TEST DATA
// ============================================================================

const mockSummarySuggestion = {
  original: 'Software engineer with experience.',
  suggested: 'Results-driven Software Engineer...',
  ats_keywords_added: ['results-driven'],
  ai_tell_phrases_rewritten: [],
};

const mockSkillsSuggestion = {
  original: 'JavaScript, React',
  existing_skills: ['JavaScript', 'React'],
  matched_keywords: ['JavaScript', 'React'],
  missing_but_relevant: [],
  skill_additions: ['TypeScript'],
  skill_removals: [],
  summary: 'Skills updated.',
};

const mockExperienceSuggestion = {
  original: 'Built apps.',
  experience_entries: [],
  summary: 'Experience updated.',
};

const mockEducationSuggestion = {
  original: 'BS CS',
  suggested: 'BS Computer Science — Relevant coursework: ...',
  improvements: [],
};

const mockProjectsSuggestion = {
  original: 'Built a React app',
  project_entries: [
    {
      title: 'React App',
      original_bullets: ['Built a React app'],
      suggested_bullets: [{ original: 'Built a React app', suggested: 'Developed React SPA...', keywords_incorporated: ['React'] }],
    },
  ],
  summary: 'Projects enhanced.',
};

const baseRequest = {
  sessionId: 'test-session-123',
  resumeSummary: 'Software engineer with experience.',
  resumeSkills: 'JavaScript, React',
  resumeExperience: 'Built apps at TechCo.',
  resumeEducation: 'BS Computer Science, StateU 2023',
  resumeContent: 'Full resume content here with all sections.',
  jobDescription: 'Looking for a senior engineer with React and TypeScript.',
  keywords: ['React', 'TypeScript'],
};

// ============================================================================
// TESTS
// ============================================================================

describe('[P0] generateAllSuggestions CandidateType Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: all generators succeed
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
    vi.mocked(generateEducation.generateEducationSuggestion).mockResolvedValue({
      data: mockEducationSuggestion,
      error: null,
    });
    vi.mocked(generateProjects.generateProjectsSuggestion).mockResolvedValue({
      data: mockProjectsSuggestion,
      error: null,
    });

    // ATS context fetch returns empty (no session data)
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  describe('6.2: Co-op with empty resumeSummary skips summary generation', () => {
    it('should not call generateSummarySuggestion for coop with empty summary', async () => {
      const result = await generateAllSuggestions({
        ...baseRequest,
        resumeSummary: '',
        candidateType: 'coop',
      });

      expect(result.error).toBeNull();
      expect(generateSummary.generateSummarySuggestion).not.toHaveBeenCalled();
      expect(result.data?.summary).toBeNull();
    });

    it('should still call other generators for coop', async () => {
      await generateAllSuggestions({
        ...baseRequest,
        resumeSummary: '',
        candidateType: 'coop',
      });

      expect(generateSkills.generateSkillsSuggestion).toHaveBeenCalled();
      expect(generateExperience.generateExperienceSuggestion).toHaveBeenCalled();
    });
  });

  describe('6.3: Career changer always generates summary', () => {
    it('should call generateSummarySuggestion for career_changer even with empty summary', async () => {
      const result = await generateAllSuggestions({
        ...baseRequest,
        resumeSummary: '',
        candidateType: 'career_changer',
      });

      expect(result.error).toBeNull();
      expect(generateSummary.generateSummarySuggestion).toHaveBeenCalled();
      expect(result.data?.summary).toEqual(mockSummarySuggestion);
    });

    it('should call generateSummarySuggestion for career_changer with existing summary', async () => {
      await generateAllSuggestions({
        ...baseRequest,
        candidateType: 'career_changer',
      });

      expect(generateSummary.generateSummarySuggestion).toHaveBeenCalled();
    });
  });

  describe('6.4: candidateType passed to all generators', () => {
    it('should pass candidateType as last argument to summary generator', async () => {
      await generateAllSuggestions({
        ...baseRequest,
        candidateType: 'fulltime',
      });

      const summaryArgs = vi.mocked(generateSummary.generateSummarySuggestion).mock.calls[0];
      // Last argument should be the candidateType
      expect(summaryArgs[summaryArgs.length - 1]).toBe('fulltime');
    });

    it('should pass candidateType as last argument to skills generator', async () => {
      await generateAllSuggestions({
        ...baseRequest,
        candidateType: 'coop',
      });

      const skillsArgs = vi.mocked(generateSkills.generateSkillsSuggestion).mock.calls[0];
      expect(skillsArgs[skillsArgs.length - 1]).toBe('coop');
    });

    it('should pass candidateType as last argument to experience generator', async () => {
      await generateAllSuggestions({
        ...baseRequest,
        candidateType: 'career_changer',
      });

      const expArgs = vi.mocked(generateExperience.generateExperienceSuggestion).mock.calls[0];
      expect(expArgs[expArgs.length - 1]).toBe('career_changer');
    });

    it('should pass candidateType as last argument to education generator', async () => {
      await generateAllSuggestions({
        ...baseRequest,
        candidateType: 'fulltime',
      });

      const eduArgs = vi.mocked(generateEducation.generateEducationSuggestion).mock.calls[0];
      expect(eduArgs[eduArgs.length - 1]).toBe('fulltime');
    });

    it('should pass candidateType as last argument to projects generator', async () => {
      await generateAllSuggestions({
        ...baseRequest,
        resumeProjects: 'Built a React app for class project',
        candidateType: 'coop',
      });

      const projArgs = vi.mocked(generateProjects.generateProjectsSuggestion).mock.calls[0];
      expect(projArgs[projArgs.length - 1]).toBe('coop');
    });
  });

  describe('6.5: resumeProjects handling', () => {
    it('should generate projects suggestion when resumeProjects is provided', async () => {
      const result = await generateAllSuggestions({
        ...baseRequest,
        resumeProjects: 'Built a React app for class project',
        candidateType: 'coop',
      });

      expect(result.error).toBeNull();
      expect(generateProjects.generateProjectsSuggestion).toHaveBeenCalled();
      expect(result.data?.projects).toEqual(mockProjectsSuggestion);
    });

    it('should not call projects generator when resumeProjects is empty and no projects in resume', async () => {
      const result = await generateAllSuggestions({
        ...baseRequest,
        resumeProjects: '',
        resumeContent: 'Skills: React\nExperience: Built apps\nEducation: BS CS',
        candidateType: 'fulltime',
      });

      expect(result.error).toBeNull();
      // Projects generator should not be called since no projects section found
      expect(generateProjects.generateProjectsSuggestion).not.toHaveBeenCalled();
      expect(result.data?.projects).toBeNull();
    });

    it('should extract projects from resumeContent when resumeProjects is not provided', async () => {
      const result = await generateAllSuggestions({
        ...baseRequest,
        resumeProjects: undefined,
        resumeContent: 'Skills: React\nPROJECTS\nBuilt a React app\nEDUCATION\nBS CS',
        candidateType: 'coop',
      });

      expect(result.error).toBeNull();
      // Should extract projects from resume content via regex
      expect(generateProjects.generateProjectsSuggestion).toHaveBeenCalled();
    });
  });

  describe('6.6: Default candidateType derivation', () => {
    it('should default to fulltime when no candidateType provided', async () => {
      await generateAllSuggestions({
        ...baseRequest,
        candidateType: undefined,
      });

      // Summary should be generated (fulltime generates summary)
      expect(generateSummary.generateSummarySuggestion).toHaveBeenCalled();

      // The derived type should be 'fulltime' passed to all generators
      const skillsArgs = vi.mocked(generateSkills.generateSkillsSuggestion).mock.calls[0];
      expect(skillsArgs[skillsArgs.length - 1]).toBe('fulltime');
    });

    it('should derive coop from preferences when candidateType not provided', async () => {
      await generateAllSuggestions({
        ...baseRequest,
        resumeSummary: '',
        candidateType: undefined,
        preferences: { jobType: 'coop' } as never,
      });

      // Summary should be SKIPPED for co-op with empty summary
      expect(generateSummary.generateSummarySuggestion).not.toHaveBeenCalled();
    });
  });
});
