/**
 * Integration Tests for Preferences-to-LLM Pipeline
 * Epic 11, Story 11.2 AC2: Preferences passed to LLM pipeline
 *
 * Verifies that user preferences flow through generateAllSuggestions
 * and reach each individual LLM generation function.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { OptimizationPreferences } from '@/types';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
} from '@/types/suggestions';

// Mock LLM generation functions
vi.mock('@/lib/ai/generateSummarySuggestion');
vi.mock('@/lib/ai/generateSkillsSuggestion');
vi.mock('@/lib/ai/generateExperienceSuggestion');
vi.mock('@/lib/supabase/sessions');
vi.mock('@/lib/supabase/user-context');

describe('Preferences Pipeline Integration (11.2-AC2)', () => {
  const techSeniorPrefs: OptimizationPreferences = {
    tone: 'technical',
    verbosity: 'concise',
    emphasis: 'keywords',
    industry: 'tech',
    experienceLevel: 'senior',
    jobType: 'fulltime',
    modificationLevel: 'moderate',
  };

  const casualEntryPrefs: OptimizationPreferences = {
    tone: 'casual',
    verbosity: 'comprehensive',
    emphasis: 'skills',
    industry: 'healthcare',
    experienceLevel: 'entry',
    jobType: 'coop',
    modificationLevel: 'conservative',
  };

  const baseRequest = {
    sessionId: 'sess-integration-test',
    resumeSummary: 'Software engineer with experience',
    resumeSkills: 'JavaScript, Python',
    resumeExperience: 'Built web applications at Tech Corp',
    resumeContent: 'Full resume content for context',
    jobDescription: 'Looking for senior full-stack developer',
  };

  const mockSummary: SummarySuggestion = {
    original: 'Software engineer',
    suggested: 'Senior software engineer',
    ats_keywords_added: ['senior'],
    ai_tell_phrases_rewritten: [],
  };

  const mockSkills: SkillsSuggestion = {
    original: 'JavaScript, Python',
    existing_skills: ['JavaScript', 'Python'],
    matched_keywords: ['JavaScript'],
    missing_but_relevant: [],
    skill_additions: ['TypeScript'],
    skill_removals: [],
    summary: 'Add TypeScript',
  };

  const mockExperience: ExperienceSuggestion = {
    original: 'Built apps',
    experience_entries: [
      {
        company: 'Tech Corp',
        role: 'Engineer',
        dates: '2020-2023',
        original_bullets: ['Built apps'],
        suggested_bullets: [
          {
            original: 'Built apps',
            suggested: 'Built 5+ apps',
            metrics_added: ['5+'],
            keywords_incorporated: [],
          },
        ],
      },
    ],
    summary: 'Added metrics',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function setupMocks() {
    const { generateSummarySuggestion } = await import(
      '@/lib/ai/generateSummarySuggestion'
    );
    const { generateSkillsSuggestion } = await import(
      '@/lib/ai/generateSkillsSuggestion'
    );
    const { generateExperienceSuggestion } = await import(
      '@/lib/ai/generateExperienceSuggestion'
    );
    const { updateSession } = await import('@/lib/supabase/sessions');
    const { getUserContext } = await import('@/lib/supabase/user-context');

    vi.mocked(generateSummarySuggestion).mockResolvedValue({
      data: mockSummary,
      error: null,
    });
    vi.mocked(generateSkillsSuggestion).mockResolvedValue({
      data: mockSkills,
      error: null,
    });
    vi.mocked(generateExperienceSuggestion).mockResolvedValue({
      data: mockExperience,
      error: null,
    });
    vi.mocked(updateSession).mockResolvedValue({ data: null, error: null });
    // Mock getUserContext to return empty context (graceful fallback)
    vi.mocked(getUserContext).mockResolvedValue({ data: {}, error: null });

    return {
      generateSummarySuggestion,
      generateSkillsSuggestion,
      generateExperienceSuggestion,
      getUserContext,
    };
  }

  it('should pass preferences to all 3 LLM generation functions', async () => {
    const mocks = await setupMocks();

    const { generateAllSuggestions } = await import(
      '@/actions/generateAllSuggestions'
    );

    const result = await generateAllSuggestions({
      ...baseRequest,
      preferences: techSeniorPrefs,
    });

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();

    // Verify preferences reached generateSummarySuggestion (now with 8th arg: candidateType)
    expect(mocks.generateSummarySuggestion).toHaveBeenCalledWith(
      baseRequest.resumeSummary,
      baseRequest.jobDescription,
      undefined, // keywords
      techSeniorPrefs,
      {}, // userContext (empty from mock)
      undefined, // resumeEducation
      undefined, // atsContext (from mock DB)
      'fulltime' // candidateType (derived from techSeniorPrefs.jobType)
    );

    // Verify preferences reached generateSkillsSuggestion (now with 8th arg: candidateType)
    expect(mocks.generateSkillsSuggestion).toHaveBeenCalledWith(
      baseRequest.resumeSkills,
      baseRequest.jobDescription,
      baseRequest.resumeContent,
      techSeniorPrefs,
      {}, // userContext (empty from mock)
      undefined, // resumeEducation
      undefined, // atsContext (from mock DB)
      'fulltime' // candidateType
    );

    // Verify preferences reached generateExperienceSuggestion (now with 8th arg: candidateType)
    expect(mocks.generateExperienceSuggestion).toHaveBeenCalledWith(
      baseRequest.resumeExperience,
      baseRequest.jobDescription,
      baseRequest.resumeContent,
      techSeniorPrefs,
      {}, // userContext (empty from mock)
      undefined, // resumeEducation
      undefined, // atsContext (from mock DB)
      'fulltime' // candidateType
    );
  });

  it('should pass different preferences producing different calls', async () => {
    const mocks = await setupMocks();

    const { generateAllSuggestions } = await import(
      '@/actions/generateAllSuggestions'
    );

    await generateAllSuggestions({
      ...baseRequest,
      preferences: casualEntryPrefs,
    });

    // Verify the different preferences were passed through (with userContext, resumeEducation, atsContext, and candidateType)
    expect(mocks.generateSummarySuggestion).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      undefined,
      casualEntryPrefs,
      {}, // userContext (empty from mock)
      undefined, // resumeEducation
      undefined, // atsContext (from mock DB)
      'coop' // candidateType (derived from casualEntryPrefs.jobType)
    );

    expect(mocks.generateSkillsSuggestion).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      casualEntryPrefs,
      {}, // userContext (empty from mock)
      undefined, // resumeEducation
      undefined, // atsContext (from mock DB)
      'coop' // candidateType
    );

    expect(mocks.generateExperienceSuggestion).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      casualEntryPrefs,
      {}, // userContext (empty from mock)
      undefined, // resumeEducation
      undefined, // atsContext (from mock DB)
      'coop' // candidateType
    );
  });

  it('should pass null preferences when not provided', async () => {
    const mocks = await setupMocks();

    const { generateAllSuggestions } = await import(
      '@/actions/generateAllSuggestions'
    );

    await generateAllSuggestions({
      ...baseRequest,
      // No preferences field
    });

    // Verify undefined/null is passed when no preferences (with userContext, resumeEducation, atsContext, and candidateType)
    expect(mocks.generateSummarySuggestion).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      undefined,
      undefined,
      {}, // userContext (empty from mock)
      undefined, // resumeEducation
      undefined, // atsContext (from mock DB)
      'fulltime' // candidateType (derived from preferences - defaults to fulltime)
    );
  });

  it('should pass explicit null preferences through', async () => {
    const mocks = await setupMocks();

    const { generateAllSuggestions } = await import(
      '@/actions/generateAllSuggestions'
    );

    await generateAllSuggestions({
      ...baseRequest,
      preferences: null,
    });

    expect(mocks.generateSummarySuggestion).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      undefined,
      null,
      {}, // userContext (empty from mock)
      undefined, // resumeEducation
      undefined, // atsContext (from mock DB)
      'fulltime' // candidateType (derived from preferences - defaults to fulltime)
    );
  });
});

describe('buildPreferencePrompt Integration', () => {
  it('should generate prompt section containing all 7 preference instructions', async () => {
    const { buildPreferencePrompt } = await import('@/lib/ai/preferences');

    const prefs: OptimizationPreferences = {
      tone: 'technical',
      verbosity: 'concise',
      emphasis: 'keywords',
      industry: 'tech',
      experienceLevel: 'senior',
      jobType: 'fulltime',
      modificationLevel: 'moderate',
    };

    const prompt = buildPreferencePrompt(prefs);

    expect(prompt).toContain('User Preferences');
    expect(prompt).toContain('Tone');
    expect(prompt).toContain('technical');
    expect(prompt).toContain('Verbosity');
    expect(prompt).toContain('concise');
    expect(prompt).toContain('Emphasis');
    expect(prompt).toContain('ATS keyword');
    expect(prompt).toContain('Industry');
    expect(prompt).toContain('technology');
    expect(prompt).toContain('Experience Level');
    expect(prompt).toContain('senior');
    // Story 13.1: Verify new preferences are included
    expect(prompt).toContain('Job Type');
    expect(prompt).toContain('full-time');
    expect(prompt).toContain('Modification Level');
    expect(prompt).toContain('MODERATE');
  });

  it('should generate different prompts for different preferences', async () => {
    const { buildPreferencePrompt } = await import('@/lib/ai/preferences');

    const techPrompt = buildPreferencePrompt({
      tone: 'technical',
      verbosity: 'concise',
      emphasis: 'keywords',
      industry: 'tech',
      experienceLevel: 'senior',
      jobType: 'fulltime',
      modificationLevel: 'moderate',
    });

    const casualPrompt = buildPreferencePrompt({
      tone: 'casual',
      verbosity: 'comprehensive',
      emphasis: 'skills',
      industry: 'healthcare',
      experienceLevel: 'entry',
      jobType: 'coop',
      modificationLevel: 'conservative',
    });

    // Prompts should be meaningfully different
    expect(techPrompt).not.toBe(casualPrompt);
    expect(techPrompt).toContain('technical');
    expect(casualPrompt).toContain('conversational');
    expect(casualPrompt).toContain('healthcare');
    expect(casualPrompt).toContain('entry');
    // Story 13.1: Verify new preferences produce different prompts
    expect(techPrompt).toContain('full-time');
    expect(techPrompt).toContain('MODERATE');
    expect(casualPrompt).toContain('co-op/internship');
    expect(casualPrompt).toContain('CONSERVATIVE');
  });
});

/**
 * Story 13.4: Job Type and Modification Level Prompt Template Tests
 * Verifies specific AC requirements for language patterns and percentages
 */
describe('Story 13.4: Job Type Prompt Templates', () => {
  it('AC3: Co-op/Internship prompts use learning-focused language', async () => {
    const { buildPreferencePrompt } = await import('@/lib/ai/preferences');

    const coopPrompt = buildPreferencePrompt({
      tone: 'professional',
      verbosity: 'detailed',
      emphasis: 'impact',
      industry: 'generic',
      experienceLevel: 'entry',
      jobType: 'coop',
      modificationLevel: 'moderate',
    });

    // AC3: Verify learning-focused language patterns
    expect(coopPrompt).toContain('Contributed to');
    expect(coopPrompt).toContain('Developed');
    expect(coopPrompt).toContain('Learned');
    expect(coopPrompt).toContain('Gained experience');
    expect(coopPrompt).toContain('learning-focused');
    expect(coopPrompt).toContain('growth');
    expect(coopPrompt).toContain('development');
  });

  it('AC4: Full-time prompts use impact-focused language', async () => {
    const { buildPreferencePrompt } = await import('@/lib/ai/preferences');

    const fulltimePrompt = buildPreferencePrompt({
      tone: 'professional',
      verbosity: 'detailed',
      emphasis: 'impact',
      industry: 'generic',
      experienceLevel: 'mid',
      jobType: 'fulltime',
      modificationLevel: 'moderate',
    });

    // AC4: Verify impact-focused language patterns
    expect(fulltimePrompt).toContain('Led');
    expect(fulltimePrompt).toContain('Drove');
    expect(fulltimePrompt).toContain('Owned');
    expect(fulltimePrompt).toContain('Delivered');
    expect(fulltimePrompt).toContain('impact-focused');
    expect(fulltimePrompt).toContain('delivery');
    expect(fulltimePrompt).toContain('ownership');
  });
});

describe('Story 13.4: Modification Level Prompt Templates', () => {
  it('AC5: Conservative level instructs 15-25% change', async () => {
    const { buildPreferencePrompt } = await import('@/lib/ai/preferences');

    const conservativePrompt = buildPreferencePrompt({
      tone: 'professional',
      verbosity: 'detailed',
      emphasis: 'impact',
      industry: 'generic',
      experienceLevel: 'mid',
      jobType: 'fulltime',
      modificationLevel: 'conservative',
    });

    // AC5: Verify conservative 15-25% change instruction
    expect(conservativePrompt).toContain('15-25%');
    expect(conservativePrompt).toContain('CONSERVATIVE');
    expect(conservativePrompt).toContain('minimal');
    expect(conservativePrompt).toContain('Preserve');
    expect(conservativePrompt).toContain('original');
  });

  it('AC6: Moderate level instructs 35-50% change', async () => {
    const { buildPreferencePrompt } = await import('@/lib/ai/preferences');

    const moderatePrompt = buildPreferencePrompt({
      tone: 'professional',
      verbosity: 'detailed',
      emphasis: 'impact',
      industry: 'generic',
      experienceLevel: 'mid',
      jobType: 'fulltime',
      modificationLevel: 'moderate',
    });

    // AC6: Verify moderate 35-50% change instruction
    expect(moderatePrompt).toContain('35-50%');
    expect(moderatePrompt).toContain('MODERATE');
    expect(moderatePrompt).toContain('Restructure');
    expect(moderatePrompt).toContain('Balance');
    expect(moderatePrompt).toContain('authenticity');
  });

  it('AC7: Aggressive level instructs 60-75% change', async () => {
    const { buildPreferencePrompt } = await import('@/lib/ai/preferences');

    const aggressivePrompt = buildPreferencePrompt({
      tone: 'professional',
      verbosity: 'detailed',
      emphasis: 'impact',
      industry: 'generic',
      experienceLevel: 'mid',
      jobType: 'fulltime',
      modificationLevel: 'aggressive',
    });

    // AC7: Verify aggressive 60-75% change instruction
    expect(aggressivePrompt).toContain('60-75%');
    expect(aggressivePrompt).toContain('AGGRESSIVE');
    expect(aggressivePrompt).toContain('Full rewrite');
    expect(aggressivePrompt).toContain('reorganization');
    expect(aggressivePrompt).toContain('transformation');
  });
});

describe('Story 13.4: Precedence Rules (AC8)', () => {
  it('AC8: Job Type and Modification Level appear in prompt output', async () => {
    const { buildPreferencePrompt } = await import('@/lib/ai/preferences');

    const prompt = buildPreferencePrompt({
      tone: 'technical',
      verbosity: 'concise',
      emphasis: 'keywords',
      industry: 'tech',
      experienceLevel: 'senior',
      jobType: 'coop',
      modificationLevel: 'aggressive',
    });

    // AC8: Both Job Type and Modification Level are present in generated prompt
    expect(prompt).toContain('Job Type');
    expect(prompt).toContain('Modification Level');

    // Verify these are not overridden/missing when other prefs conflict conceptually
    // e.g., senior + coop or tech + aggressive should all appear
    expect(prompt).toContain('senior');
    expect(prompt).toContain('co-op/internship');
    expect(prompt).toContain('AGGRESSIVE');
  });

  it('AC8: All 7 preferences are independent (no conflicts)', async () => {
    const { buildPreferencePrompt } = await import('@/lib/ai/preferences');

    // Test an unusual but valid combination
    const prompt = buildPreferencePrompt({
      tone: 'casual',              // Style
      verbosity: 'comprehensive',   // Length
      emphasis: 'skills',           // Focus
      industry: 'healthcare',       // Domain
      experienceLevel: 'entry',     // Level
      jobType: 'fulltime',          // Position type
      modificationLevel: 'aggressive', // Change magnitude
    });

    // All 7 should appear - no preference should be omitted due to "conflicts"
    expect(prompt).toContain('conversational'); // 'casual' maps to 'conversational'
    expect(prompt).toContain('comprehensive');
    expect(prompt).toContain('technical skills'); // 'skills' emphasis maps to this phrase
    expect(prompt).toContain('healthcare');
    expect(prompt).toContain('entry');
    expect(prompt).toContain('full-time');
    expect(prompt).toContain('AGGRESSIVE');
  });
});

/**
 * User Context Integration Tests
 * Tests that career goal and target industries from onboarding are passed to LLM
 */
describe('UserContext Integration', () => {
  it('should include career goal in prompt when provided', async () => {
    const { buildPreferencePrompt } = await import('@/lib/ai/preferences');

    const prefs: OptimizationPreferences = {
      tone: 'professional',
      verbosity: 'detailed',
      emphasis: 'impact',
      industry: 'generic',
      experienceLevel: 'mid',
      jobType: 'fulltime',
      modificationLevel: 'moderate',
    };

    const promptWithGoal = buildPreferencePrompt(prefs, {
      careerGoal: 'switching-careers',
      targetIndustries: [],
    });

    expect(promptWithGoal).toContain('Career Goal');
    expect(promptWithGoal).toContain('transitioning to a new career');
    expect(promptWithGoal).toContain('transferable skills');
  });

  it('should include target industries in prompt when provided', async () => {
    const { buildPreferencePrompt } = await import('@/lib/ai/preferences');

    const prefs: OptimizationPreferences = {
      tone: 'professional',
      verbosity: 'detailed',
      emphasis: 'impact',
      industry: 'generic',
      experienceLevel: 'mid',
      jobType: 'fulltime',
      modificationLevel: 'moderate',
    };

    const promptWithIndustries = buildPreferencePrompt(prefs, {
      careerGoal: null,
      targetIndustries: ['technology', 'finance'],
    });

    expect(promptWithIndustries).toContain('Target Industries');
    expect(promptWithIndustries).toContain('Technology');
    expect(promptWithIndustries).toContain('Finance');
  });

  it('should include both career goal and target industries when provided', async () => {
    const { buildPreferencePrompt } = await import('@/lib/ai/preferences');

    const prefs: OptimizationPreferences = {
      tone: 'technical',
      verbosity: 'concise',
      emphasis: 'keywords',
      industry: 'tech',
      experienceLevel: 'senior',
      jobType: 'fulltime',
      modificationLevel: 'moderate',
    };

    const fullPrompt = buildPreferencePrompt(prefs, {
      careerGoal: 'advancing',
      targetIndustries: ['technology', 'finance', 'engineering'],
    });

    // Should have career goal section
    expect(fullPrompt).toContain('Career Goal');
    expect(fullPrompt).toContain('advancing in their current field');
    expect(fullPrompt).toContain('growth trajectory');

    // Should have target industries section
    expect(fullPrompt).toContain('Target Industries');
    expect(fullPrompt).toContain('Technology');
    expect(fullPrompt).toContain('Finance');
    expect(fullPrompt).toContain('Engineering');

    // Original preferences should still be present
    expect(fullPrompt).toContain('technical');
    expect(fullPrompt).toContain('senior');
  });

  it('should not include career goal section when not provided', async () => {
    const { buildPreferencePrompt } = await import('@/lib/ai/preferences');

    const prefs: OptimizationPreferences = {
      tone: 'professional',
      verbosity: 'detailed',
      emphasis: 'impact',
      industry: 'generic',
      experienceLevel: 'mid',
      jobType: 'fulltime',
      modificationLevel: 'moderate',
    };

    const promptWithoutContext = buildPreferencePrompt(prefs);
    const promptWithEmptyContext = buildPreferencePrompt(prefs, {});

    expect(promptWithoutContext).not.toContain('Career Goal');
    expect(promptWithoutContext).not.toContain('Target Industries');
    expect(promptWithEmptyContext).not.toContain('Career Goal');
    expect(promptWithEmptyContext).not.toContain('Target Industries');
  });

  it('should handle all career goal values correctly', async () => {
    const { buildPreferencePrompt } = await import('@/lib/ai/preferences');

    const prefs: OptimizationPreferences = {
      tone: 'professional',
      verbosity: 'detailed',
      emphasis: 'impact',
      industry: 'generic',
      experienceLevel: 'mid',
      jobType: 'fulltime',
      modificationLevel: 'moderate',
    };

    const careerGoalExpectations: Record<string, string> = {
      'first-job': 'first professional role',
      'switching-careers': 'transitioning to a new career',
      'advancing': 'advancing in their current field',
      'promotion': 'seeking a promotion',
      'returning': 'returning to the workforce',
    };

    for (const [goal, expectedText] of Object.entries(careerGoalExpectations)) {
      const prompt = buildPreferencePrompt(prefs, {
        careerGoal: goal as 'first-job' | 'switching-careers' | 'advancing' | 'promotion' | 'returning',
        targetIndustries: [],
      });
      expect(prompt).toContain(expectedText);
    }
  });
});
