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

describe('Preferences Pipeline Integration (11.2-AC2)', () => {
  const techSeniorPrefs: OptimizationPreferences = {
    tone: 'technical',
    verbosity: 'concise',
    emphasis: 'keywords',
    industry: 'tech',
    experienceLevel: 'senior',
  };

  const casualEntryPrefs: OptimizationPreferences = {
    tone: 'casual',
    verbosity: 'comprehensive',
    emphasis: 'skills',
    industry: 'healthcare',
    experienceLevel: 'entry',
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

    return {
      generateSummarySuggestion,
      generateSkillsSuggestion,
      generateExperienceSuggestion,
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

    // Verify preferences reached generateSummarySuggestion
    expect(mocks.generateSummarySuggestion).toHaveBeenCalledWith(
      baseRequest.resumeSummary,
      baseRequest.jobDescription,
      undefined, // keywords
      techSeniorPrefs
    );

    // Verify preferences reached generateSkillsSuggestion
    expect(mocks.generateSkillsSuggestion).toHaveBeenCalledWith(
      baseRequest.resumeSkills,
      baseRequest.jobDescription,
      baseRequest.resumeContent,
      techSeniorPrefs
    );

    // Verify preferences reached generateExperienceSuggestion
    expect(mocks.generateExperienceSuggestion).toHaveBeenCalledWith(
      baseRequest.resumeExperience,
      baseRequest.jobDescription,
      baseRequest.resumeContent,
      techSeniorPrefs
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

    // Verify the different preferences were passed through
    expect(mocks.generateSummarySuggestion).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      undefined,
      casualEntryPrefs
    );

    expect(mocks.generateSkillsSuggestion).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      casualEntryPrefs
    );

    expect(mocks.generateExperienceSuggestion).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      casualEntryPrefs
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

    // Verify undefined/null is passed when no preferences
    expect(mocks.generateSummarySuggestion).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      undefined,
      undefined
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
      null
    );
  });
});

describe('buildPreferencePrompt Integration', () => {
  it('should generate prompt section containing all 5 preference instructions', async () => {
    const { buildPreferencePrompt } = await import('@/lib/ai/preferences');

    const prefs: OptimizationPreferences = {
      tone: 'technical',
      verbosity: 'concise',
      emphasis: 'keywords',
      industry: 'tech',
      experienceLevel: 'senior',
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
  });

  it('should generate different prompts for different preferences', async () => {
    const { buildPreferencePrompt } = await import('@/lib/ai/preferences');

    const techPrompt = buildPreferencePrompt({
      tone: 'technical',
      verbosity: 'concise',
      emphasis: 'keywords',
      industry: 'tech',
      experienceLevel: 'senior',
    });

    const casualPrompt = buildPreferencePrompt({
      tone: 'casual',
      verbosity: 'comprehensive',
      emphasis: 'skills',
      industry: 'healthcare',
      experienceLevel: 'entry',
    });

    // Prompts should be meaningfully different
    expect(techPrompt).not.toBe(casualPrompt);
    expect(techPrompt).toContain('technical');
    expect(casualPrompt).toContain('conversational');
    expect(casualPrompt).toContain('healthcare');
    expect(casualPrompt).toContain('entry');
  });
});
