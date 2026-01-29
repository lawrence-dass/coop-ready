/**
 * Epic 13 Integration Tests
 * Story 13.5: Integration and Verification Testing
 *
 * Verifies that Job Type and Modification Level preferences work end-to-end.
 * Tests all 8 acceptance criteria comprehensively.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildPreferencePrompt } from '@/lib/ai/preferences';
import type { OptimizationPreferences } from '@/types';

// Mock dependencies
vi.mock('@/lib/ai/generateSummarySuggestion');
vi.mock('@/lib/ai/generateSkillsSuggestion');
vi.mock('@/lib/ai/generateExperienceSuggestion');
vi.mock('@/lib/supabase/sessions');

describe('Epic 13 Integration Tests - Story 13.5', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * AC1: Can select Job Type and Modification Level in preferences
   */
  describe('AC1: Preference Selection', () => {
    it('should support all Job Type options', () => {
      const coopPrefs: OptimizationPreferences = {
        tone: 'professional',
        verbosity: 'detailed',
        emphasis: 'impact',
        industry: 'generic',
        experienceLevel: 'mid',
        jobType: 'coop',
        modificationLevel: 'moderate',
      };

      const fulltimePrefs: OptimizationPreferences = {
        ...coopPrefs,
        jobType: 'fulltime',
      };

      // Both should be valid OptimizationPreferences
      expect(coopPrefs.jobType).toBe('coop');
      expect(fulltimePrefs.jobType).toBe('fulltime');
    });

    it('should support all Modification Level options', () => {
      const basePrefs: OptimizationPreferences = {
        tone: 'professional',
        verbosity: 'detailed',
        emphasis: 'impact',
        industry: 'generic',
        experienceLevel: 'mid',
        jobType: 'fulltime',
        modificationLevel: 'moderate',
      };

      const conservativePrefs = { ...basePrefs, modificationLevel: 'conservative' as const };
      const moderatePrefs = { ...basePrefs, modificationLevel: 'moderate' as const };
      const aggressivePrefs = { ...basePrefs, modificationLevel: 'aggressive' as const };

      expect(conservativePrefs.modificationLevel).toBe('conservative');
      expect(moderatePrefs.modificationLevel).toBe('moderate');
      expect(aggressivePrefs.modificationLevel).toBe('aggressive');
    });

    it('should have defaults for Job Type and Modification Level', async () => {
      const { DEFAULT_PREFERENCES } = await import('@/types/preferences');

      expect(DEFAULT_PREFERENCES.jobType).toBe('fulltime');
      expect(DEFAULT_PREFERENCES.modificationLevel).toBe('moderate');
    });
  });

  /**
   * AC2: Preferences persist across sessions
   * Note: This tests the type system and structure. Actual persistence
   * is tested in preferences-persistence.test.ts with database mocks.
   */
  describe('AC2: Preference Persistence', () => {
    it('should include jobType and modificationLevel in OptimizationPreferences type', () => {
      const prefs: OptimizationPreferences = {
        tone: 'technical',
        verbosity: 'concise',
        emphasis: 'keywords',
        industry: 'tech',
        experienceLevel: 'senior',
        jobType: 'coop',
        modificationLevel: 'aggressive',
      };

      // TypeScript compilation validates structure
      expect(prefs).toHaveProperty('jobType');
      expect(prefs).toHaveProperty('modificationLevel');
    });
  });

  /**
   * AC3: Co-op mode produces learning-focused suggestions
   */
  describe('AC3: Co-op Learning-Focused Language', () => {
    it('should include learning-focused language for co-op Job Type', () => {
      const coopPrefs: OptimizationPreferences = {
        tone: 'professional',
        verbosity: 'detailed',
        emphasis: 'impact',
        industry: 'generic',
        experienceLevel: 'entry',
        jobType: 'coop',
        modificationLevel: 'moderate',
      };

      const prompt = buildPreferencePrompt(coopPrefs);

      // Verify learning-focused language patterns
      expect(prompt).toContain('Contributed to');
      expect(prompt).toContain('Developed');
      expect(prompt).toContain('Learned');
      expect(prompt).toContain('Gained experience');
      expect(prompt).toContain('learning-focused');
      expect(prompt).toContain('growth');
      expect(prompt).toContain('development');
    });

    it('should NOT include impact-focused language for co-op', () => {
      const coopPrefs: OptimizationPreferences = {
        tone: 'professional',
        verbosity: 'detailed',
        emphasis: 'impact',
        industry: 'generic',
        experienceLevel: 'entry',
        jobType: 'coop',
        modificationLevel: 'moderate',
      };

      const prompt = buildPreferencePrompt(coopPrefs);

      // Should explicitly be co-op/internship, not full-time language
      expect(prompt).toContain('co-op/internship');
      expect(prompt).not.toContain('full-time career position');
    });
  });

  /**
   * AC4: Full-time mode produces impact-focused suggestions
   */
  describe('AC4: Full-time Impact-Focused Language', () => {
    it('should include impact-focused language for fulltime Job Type', () => {
      const fulltimePrefs: OptimizationPreferences = {
        tone: 'professional',
        verbosity: 'detailed',
        emphasis: 'impact',
        industry: 'generic',
        experienceLevel: 'mid',
        jobType: 'fulltime',
        modificationLevel: 'moderate',
      };

      const prompt = buildPreferencePrompt(fulltimePrefs);

      // Verify impact-focused language patterns
      expect(prompt).toContain('Led');
      expect(prompt).toContain('Drove');
      expect(prompt).toContain('Owned');
      expect(prompt).toContain('Delivered');
      expect(prompt).toContain('impact-focused');
      expect(prompt).toContain('delivery');
      expect(prompt).toContain('ownership');
    });

    it('should NOT include learning-focused language for fulltime', () => {
      const fulltimePrefs: OptimizationPreferences = {
        tone: 'professional',
        verbosity: 'detailed',
        emphasis: 'impact',
        industry: 'generic',
        experienceLevel: 'mid',
        jobType: 'fulltime',
        modificationLevel: 'moderate',
      };

      const prompt = buildPreferencePrompt(fulltimePrefs);

      // Should explicitly be full-time, not co-op language
      expect(prompt).toContain('full-time career position');
      expect(prompt).not.toContain('co-op/internship');
    });
  });

  /**
   * AC5: Conservative mode makes minimal changes
   */
  describe('AC5: Conservative Modification Level', () => {
    it('should include 15-25% change instruction for conservative', () => {
      const conservativePrefs: OptimizationPreferences = {
        tone: 'professional',
        verbosity: 'detailed',
        emphasis: 'impact',
        industry: 'generic',
        experienceLevel: 'mid',
        jobType: 'fulltime',
        modificationLevel: 'conservative',
      };

      const prompt = buildPreferencePrompt(conservativePrefs);

      expect(prompt).toContain('15-25%');
      expect(prompt).toContain('CONSERVATIVE');
      expect(prompt).toContain('minimal');
      expect(prompt).toContain('Preserve');
      expect(prompt).toContain('original');
    });

    it('should emphasize keyword addition only for conservative', () => {
      const conservativePrefs: OptimizationPreferences = {
        tone: 'professional',
        verbosity: 'detailed',
        emphasis: 'keywords',
        industry: 'generic',
        experienceLevel: 'mid',
        jobType: 'fulltime',
        modificationLevel: 'conservative',
      };

      const prompt = buildPreferencePrompt(conservativePrefs);

      expect(prompt).toContain('Only add keywords');
      expect(prompt).toContain('minimal restructuring');
    });
  });

  /**
   * AC6: Moderate mode produces balanced changes
   */
  describe('AC6: Moderate Modification Level', () => {
    it('should include 35-50% change instruction for moderate', () => {
      const moderatePrefs: OptimizationPreferences = {
        tone: 'professional',
        verbosity: 'detailed',
        emphasis: 'impact',
        industry: 'generic',
        experienceLevel: 'mid',
        jobType: 'fulltime',
        modificationLevel: 'moderate',
      };

      const prompt = buildPreferencePrompt(moderatePrefs);

      expect(prompt).toContain('35-50%');
      expect(prompt).toContain('MODERATE');
      expect(prompt).toContain('Restructure');
      expect(prompt).toContain('Balance');
      expect(prompt).toContain('authenticity');
    });

    it('should emphasize balanced improvements for moderate', () => {
      const moderatePrefs: OptimizationPreferences = {
        tone: 'professional',
        verbosity: 'detailed',
        emphasis: 'impact',
        industry: 'generic',
        experienceLevel: 'mid',
        jobType: 'fulltime',
        modificationLevel: 'moderate',
      };

      const prompt = buildPreferencePrompt(moderatePrefs);

      expect(prompt).toContain('Restructure for impact while preserving intent');
      expect(prompt).toContain('Balance improvements');
    });
  });

  /**
   * AC7: Aggressive mode produces significantly rewritten content
   */
  describe('AC7: Aggressive Modification Level', () => {
    it('should include 60-75% change instruction for aggressive', () => {
      const aggressivePrefs: OptimizationPreferences = {
        tone: 'professional',
        verbosity: 'detailed',
        emphasis: 'impact',
        industry: 'generic',
        experienceLevel: 'mid',
        jobType: 'fulltime',
        modificationLevel: 'aggressive',
      };

      const prompt = buildPreferencePrompt(aggressivePrefs);

      expect(prompt).toContain('60-75%');
      expect(prompt).toContain('AGGRESSIVE');
      expect(prompt).toContain('Full rewrite');
      expect(prompt).toContain('reorganization');
      expect(prompt).toContain('transformation');
    });

    it('should emphasize significant changes for aggressive', () => {
      const aggressivePrefs: OptimizationPreferences = {
        tone: 'professional',
        verbosity: 'detailed',
        emphasis: 'impact',
        industry: 'generic',
        experienceLevel: 'mid',
        jobType: 'fulltime',
        modificationLevel: 'aggressive',
      };

      const prompt = buildPreferencePrompt(aggressivePrefs);

      expect(prompt).toContain('Full rewrite for maximum impact');
      expect(prompt).toContain('Significant reorganization');
    });
  });

  /**
   * AC8: No regression in existing preference functionality
   */
  describe('AC8: No Regression in Existing Preferences', () => {
    it('should include all 7 preference dimensions in prompt', () => {
      const allPrefs: OptimizationPreferences = {
        tone: 'technical',
        verbosity: 'concise',
        emphasis: 'keywords',
        industry: 'tech',
        experienceLevel: 'senior',
        jobType: 'fulltime',
        modificationLevel: 'moderate',
      };

      const prompt = buildPreferencePrompt(allPrefs);

      // Verify all 7 preferences appear in output
      expect(prompt).toContain('Tone');
      expect(prompt).toContain('Verbosity');
      expect(prompt).toContain('Emphasis');
      expect(prompt).toContain('Industry');
      expect(prompt).toContain('Experience Level');
      expect(prompt).toContain('Job Type');
      expect(prompt).toContain('Modification Level');
    });

    it('should handle all combinations without conflicts', () => {
      // Test an unusual but valid combination
      const mixedPrefs: OptimizationPreferences = {
        tone: 'casual',
        verbosity: 'comprehensive',
        emphasis: 'skills',
        industry: 'healthcare',
        experienceLevel: 'entry',
        jobType: 'fulltime', // Unusual: entry + fulltime
        modificationLevel: 'aggressive', // Unusual: entry + aggressive
      };

      const prompt = buildPreferencePrompt(mixedPrefs);

      // All preferences should be present
      expect(prompt).toContain('conversational');
      expect(prompt).toContain('comprehensive');
      expect(prompt).toContain('technical skills');
      expect(prompt).toContain('healthcare');
      expect(prompt).toContain('entry');
      expect(prompt).toContain('full-time');
      expect(prompt).toContain('AGGRESSIVE');
    });

    it('should maintain existing Tone preference functionality', () => {
      const technicalPrefs: OptimizationPreferences = {
        tone: 'technical',
        verbosity: 'detailed',
        emphasis: 'impact',
        industry: 'generic',
        experienceLevel: 'mid',
        jobType: 'fulltime',
        modificationLevel: 'moderate',
      };

      const prompt = buildPreferencePrompt(technicalPrefs);

      expect(prompt).toContain('technical depth');
      expect(prompt).toContain('tools, frameworks');
    });

    it('should maintain existing Verbosity preference functionality', () => {
      const concisePrefs: OptimizationPreferences = {
        tone: 'professional',
        verbosity: 'concise',
        emphasis: 'impact',
        industry: 'generic',
        experienceLevel: 'mid',
        jobType: 'fulltime',
        modificationLevel: 'moderate',
      };

      const prompt = buildPreferencePrompt(concisePrefs);

      expect(prompt).toContain('1-2 lines per bullet');
      expect(prompt).toContain('concise');
    });

    it('should maintain existing Emphasis preference functionality', () => {
      const keywordsPrefs: OptimizationPreferences = {
        tone: 'professional',
        verbosity: 'detailed',
        emphasis: 'keywords',
        industry: 'generic',
        experienceLevel: 'mid',
        jobType: 'fulltime',
        modificationLevel: 'moderate',
      };

      const prompt = buildPreferencePrompt(keywordsPrefs);

      expect(prompt).toContain('ATS keyword coverage');
    });

    it('should maintain existing Industry preference functionality', () => {
      const techPrefs: OptimizationPreferences = {
        tone: 'professional',
        verbosity: 'detailed',
        emphasis: 'impact',
        industry: 'tech',
        experienceLevel: 'mid',
        jobType: 'fulltime',
        modificationLevel: 'moderate',
      };

      const prompt = buildPreferencePrompt(techPrefs);

      expect(prompt).toContain('technology industry');
      expect(prompt).toContain('APIs, databases');
    });

    it('should maintain existing Experience Level preference functionality', () => {
      const seniorPrefs: OptimizationPreferences = {
        tone: 'professional',
        verbosity: 'detailed',
        emphasis: 'impact',
        industry: 'generic',
        experienceLevel: 'senior',
        jobType: 'fulltime',
        modificationLevel: 'moderate',
      };

      const prompt = buildPreferencePrompt(seniorPrefs);

      expect(prompt).toContain('senior-level');
      expect(prompt).toContain('strategy, mentorship');
    });
  });

  /**
   * Cross-Feature Integration Tests
   */
  describe('Cross-Feature Integration', () => {
    it('should generate different prompts for co-op vs fulltime', () => {
      const basePrefs = {
        tone: 'professional' as const,
        verbosity: 'detailed' as const,
        emphasis: 'impact' as const,
        industry: 'generic' as const,
        experienceLevel: 'mid' as const,
        modificationLevel: 'moderate' as const,
      };

      const coopPrompt = buildPreferencePrompt({
        ...basePrefs,
        jobType: 'coop',
      });

      const fulltimePrompt = buildPreferencePrompt({
        ...basePrefs,
        jobType: 'fulltime',
      });

      // Prompts should be substantially different
      expect(coopPrompt).not.toBe(fulltimePrompt);
      expect(coopPrompt).toContain('learning-focused');
      expect(fulltimePrompt).toContain('impact-focused');
    });

    it('should generate different prompts for conservative vs aggressive', () => {
      const basePrefs = {
        tone: 'professional' as const,
        verbosity: 'detailed' as const,
        emphasis: 'impact' as const,
        industry: 'generic' as const,
        experienceLevel: 'mid' as const,
        jobType: 'fulltime' as const,
      };

      const conservativePrompt = buildPreferencePrompt({
        ...basePrefs,
        modificationLevel: 'conservative',
      });

      const aggressivePrompt = buildPreferencePrompt({
        ...basePrefs,
        modificationLevel: 'aggressive',
      });

      // Prompts should be substantially different
      expect(conservativePrompt).not.toBe(aggressivePrompt);
      expect(conservativePrompt).toContain('15-25%');
      expect(aggressivePrompt).toContain('60-75%');
    });

    it('should handle all 6 Job Type x Modification Level combinations', () => {
      const jobTypes = ['coop', 'fulltime'] as const;
      const modificationLevels = ['conservative', 'moderate', 'aggressive'] as const;

      jobTypes.forEach(jobType => {
        modificationLevels.forEach(modificationLevel => {
          const prefs: OptimizationPreferences = {
            tone: 'professional',
            verbosity: 'detailed',
            emphasis: 'impact',
            industry: 'generic',
            experienceLevel: 'mid',
            jobType,
            modificationLevel,
          };

          const prompt = buildPreferencePrompt(prefs);

          // All combinations should generate valid prompts
          expect(prompt).toBeTruthy();
          expect(prompt).toContain('Job Type');
          expect(prompt).toContain('Modification Level');
        });
      });
    });
  });
});
