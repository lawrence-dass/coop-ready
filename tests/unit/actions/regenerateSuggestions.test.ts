/**
 * Unit tests for regenerateSuggestions server action
 * Story 6.7: Implement Regenerate Suggestions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { regenerateSuggestions } from '@/actions/regenerateSuggestions';
import * as generateSummary from '@/lib/ai/generateSummarySuggestion';
import * as generateSkills from '@/lib/ai/generateSkillsSuggestion';
import * as generateExperience from '@/lib/ai/generateExperienceSuggestion';
import * as sessions from '@/lib/supabase/sessions';

// Mock dependencies
vi.mock('@/lib/ai/generateSummarySuggestion');
vi.mock('@/lib/ai/generateSkillsSuggestion');
vi.mock('@/lib/ai/generateExperienceSuggestion');
vi.mock('@/lib/supabase/sessions');

describe('regenerateSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validation', () => {
    it('should reject missing currentContent', async () => {
      const result = await regenerateSuggestions({
        currentContent: '',
        jdContent: 'Job description',
        sectionType: 'summary',
        sessionId: 'test-session',
      });

      expect(result.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Section content is required',
      });
      expect(result.data).toBeNull();
    });

    it('should reject missing jdContent', async () => {
      const result = await regenerateSuggestions({
        currentContent: 'Current summary',
        jdContent: '',
        sectionType: 'summary',
        sessionId: 'test-session',
      });

      expect(result.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Job description is required',
      });
      expect(result.data).toBeNull();
    });

    it('should reject invalid sectionType', async () => {
      const result = await regenerateSuggestions({
        currentContent: 'Current summary',
        jdContent: 'Job description',
        sectionType: 'invalid' as any,
        sessionId: 'test-session',
      });

      expect(result.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Valid section type is required (summary, skills, or experience)',
      });
      expect(result.data).toBeNull();
    });

    it('should reject missing sessionId', async () => {
      const result = await regenerateSuggestions({
        currentContent: 'Current summary',
        jdContent: 'Job description',
        sectionType: 'summary',
        sessionId: '',
      });

      expect(result.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Session ID is required',
      });
      expect(result.data).toBeNull();
    });
  });

  describe('summary regeneration', () => {
    it('should successfully regenerate summary', async () => {
      const mockSuggestion = {
        original: 'Old summary',
        suggested: 'New summary with keywords',
        ats_keywords_added: ['leadership', 'strategic'],
        ai_tell_phrases_rewritten: [],
      };

      vi.spyOn(generateSummary, 'generateSummarySuggestion').mockResolvedValue({
        data: mockSuggestion,
        error: null,
      });

      vi.spyOn(sessions, 'updateSession').mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await regenerateSuggestions({
        currentContent: 'Old summary',
        jdContent: 'Job description',
        sectionType: 'summary',
        sessionId: 'test-session',
        keywords: ['leadership', 'strategic'],
      });

      expect(result.data).toEqual({
        section: 'summary',
        suggestion: mockSuggestion,
      });
      expect(result.error).toBeNull();

      expect(generateSummary.generateSummarySuggestion).toHaveBeenCalledWith(
        'Old summary',
        'Job description',
        ['leadership', 'strategic']
      );

      expect(sessions.updateSession).toHaveBeenCalledWith('test-session', {
        summarySuggestion: mockSuggestion,
      });
    });

    it('should handle LLM errors for summary', async () => {
      vi.spyOn(generateSummary, 'generateSummarySuggestion').mockResolvedValue({
        data: null,
        error: {
          code: 'LLM_ERROR',
          message: 'LLM failed',
        },
      });

      const result = await regenerateSuggestions({
        currentContent: 'Old summary',
        jdContent: 'Job description',
        sectionType: 'summary',
        sessionId: 'test-session',
      });

      expect(result.error).toEqual({
        code: 'LLM_ERROR',
        message: 'LLM failed',
      });
      expect(result.data).toBeNull();
    });
  });

  describe('skills regeneration', () => {
    it('should successfully regenerate skills', async () => {
      const mockSuggestion = {
        original: 'Old skills',
        existing_skills: ['Python', 'JavaScript'],
        matched_keywords: ['Python'],
        missing_but_relevant: [],
        skill_additions: ['TypeScript', 'React'],
        skill_removals: [],
        summary: 'Add TypeScript and React',
      };

      vi.spyOn(generateSkills, 'generateSkillsSuggestion').mockResolvedValue({
        data: mockSuggestion,
        error: null,
      });

      vi.spyOn(sessions, 'updateSession').mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await regenerateSuggestions({
        currentContent: 'Old skills',
        jdContent: 'Job description',
        sectionType: 'skills',
        sessionId: 'test-session',
        resumeContent: 'Full resume content',
      });

      expect(result.data).toEqual({
        section: 'skills',
        suggestion: mockSuggestion,
      });
      expect(result.error).toBeNull();

      expect(generateSkills.generateSkillsSuggestion).toHaveBeenCalledWith(
        'Old skills',
        'Job description',
        'Full resume content'
      );

      expect(sessions.updateSession).toHaveBeenCalledWith('test-session', {
        skillsSuggestion: mockSuggestion,
      });
    });
  });

  describe('experience regeneration', () => {
    it('should successfully regenerate experience', async () => {
      const mockSuggestion = {
        original: 'Old experience',
        experience_entries: [],
        summary: 'Experience optimized',
      };

      vi.spyOn(generateExperience, 'generateExperienceSuggestion').mockResolvedValue({
        data: mockSuggestion,
        error: null,
      });

      vi.spyOn(sessions, 'updateSession').mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await regenerateSuggestions({
        currentContent: 'Old experience',
        jdContent: 'Job description',
        sectionType: 'experience',
        sessionId: 'test-session',
        resumeContent: 'Full resume content',
      });

      expect(result.data).toEqual({
        section: 'experience',
        suggestion: mockSuggestion,
      });
      expect(result.error).toBeNull();

      expect(generateExperience.generateExperienceSuggestion).toHaveBeenCalledWith(
        'Old experience',
        'Job description',
        'Full resume content'
      );
    });

    it('should reject experience regeneration without resumeContent', async () => {
      const result = await regenerateSuggestions({
        currentContent: 'Old experience',
        jdContent: 'Job description',
        sectionType: 'experience',
        sessionId: 'test-session',
        // missing resumeContent
      });

      expect(result.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Resume content is required for experience regeneration',
      });
      expect(result.data).toBeNull();
    });
  });

  describe('session persistence', () => {
    it('should continue even if session update fails', async () => {
      const mockSuggestion = {
        original: 'Old summary',
        suggested: 'New summary',
        ats_keywords_added: [],
        ai_tell_phrases_rewritten: [],
      };

      vi.spyOn(generateSummary, 'generateSummarySuggestion').mockResolvedValue({
        data: mockSuggestion,
        error: null,
      });

      vi.spyOn(sessions, 'updateSession').mockResolvedValue({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session update failed',
        },
      });

      // Spy on console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await regenerateSuggestions({
        currentContent: 'Old summary',
        jdContent: 'Job description',
        sectionType: 'summary',
        sessionId: 'test-session',
      });

      // Should still return success
      expect(result.data).toEqual({
        section: 'summary',
        suggestion: mockSuggestion,
      });
      expect(result.error).toBeNull();

      // Should log error
      expect(consoleSpy).toHaveBeenCalledWith(
        '[regenerateSuggestions] Session update failed:',
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });
});
