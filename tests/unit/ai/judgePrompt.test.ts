/**
 * Judge Prompt Tests
 * Story 12.1: Unit tests for judge prompt template
 */

import { describe, it, expect } from 'vitest';
import { buildJudgePrompt } from '@/lib/ai/judgePrompt';
import type { SuggestionContext } from '@/types/judge';

describe('buildJudgePrompt', () => {
  const mockContext: SuggestionContext = {
    original_text: 'Senior software engineer with 5 years experience.',
    suggested_text:
      'Senior full-stack software engineer with 5 years experience building scalable web applications using React and Node.js.',
    jd_excerpt:
      'We are looking for a full-stack engineer with React and Node.js experience.',
    section_type: 'summary',
  };

  it('should include all context fields in prompt', () => {
    const prompt = buildJudgePrompt(mockContext.suggested_text, mockContext);

    expect(prompt).toContain(mockContext.original_text);
    expect(prompt).toContain(mockContext.suggested_text);
    expect(prompt).toContain(mockContext.jd_excerpt);
    expect(prompt).toContain(mockContext.section_type);
  });

  it('should include evaluation criteria in prompt', () => {
    const prompt = buildJudgePrompt(mockContext.suggested_text, mockContext);

    expect(prompt).toContain('Authenticity');
    expect(prompt).toContain('Clarity');
    expect(prompt).toContain('ATS Relevance');
    expect(prompt).toContain('Actionability');
  });

  it('should include scoring rubric with point ranges', () => {
    const prompt = buildJudgePrompt(mockContext.suggested_text, mockContext);

    expect(prompt).toMatch(/0-25/);
    expect(prompt).toMatch(/0-100/);
  });

  it('should request JSON format output', () => {
    const prompt = buildJudgePrompt(mockContext.suggested_text, mockContext);

    expect(prompt).toContain('JSON');
    expect(prompt).toContain('authenticity');
    expect(prompt).toContain('clarity');
    expect(prompt).toContain('ats_relevance');
    expect(prompt).toContain('actionability');
    expect(prompt).toContain('overall_score');
    expect(prompt).toContain('reasoning');
  });

  it('should include red flags to watch for', () => {
    const prompt = buildJudgePrompt(mockContext.suggested_text, mockContext);

    expect(prompt).toContain('Red Flags');
    expect(prompt).toContain('fabrication');
    expect(prompt).toContain('AI-tell');
  });

  it('should wrap user content in XML tags', () => {
    const prompt = buildJudgePrompt(mockContext.suggested_text, mockContext);

    expect(prompt).toMatch(/<original_text>/);
    expect(prompt).toMatch(/<\/original_text>/);
    expect(prompt).toMatch(/<suggested_text>/);
    expect(prompt).toMatch(/<\/suggested_text>/);
    expect(prompt).toMatch(/<job_description_excerpt>/);
    expect(prompt).toMatch(/<\/job_description_excerpt>/);
  });

  it('should be under 3500 characters for token efficiency', () => {
    const prompt = buildJudgePrompt(mockContext.suggested_text, mockContext);

    // Rough estimate: ~3500 chars ≈ 875 tokens
    // With user content, should stay under 5000 chars total
    const promptWithoutUserContent = prompt
      .replace(mockContext.original_text, '')
      .replace(mockContext.suggested_text, '')
      .replace(mockContext.jd_excerpt, '');

    expect(promptWithoutUserContent.length).toBeLessThan(3500);
  });

  it('should handle different section types', () => {
    const summaryContext: SuggestionContext = {
      ...mockContext,
      section_type: 'summary',
    };
    const skillsContext: SuggestionContext = {
      ...mockContext,
      section_type: 'skills',
    };
    const experienceContext: SuggestionContext = {
      ...mockContext,
      section_type: 'experience',
    };

    const summaryPrompt = buildJudgePrompt(
      mockContext.suggested_text,
      summaryContext
    );
    const skillsPrompt = buildJudgePrompt(
      mockContext.suggested_text,
      skillsContext
    );
    const experiencePrompt = buildJudgePrompt(
      mockContext.suggested_text,
      experienceContext
    );

    expect(summaryPrompt).toContain('summary');
    expect(skillsPrompt).toContain('skills');
    expect(experiencePrompt).toContain('experience');
  });

  it('should not leak sensitive data or API keys', () => {
    const prompt = buildJudgePrompt(mockContext.suggested_text, mockContext);

    expect(prompt).not.toContain('ANTHROPIC_API_KEY');
    expect(prompt).not.toContain('sk-ant-');
    expect(prompt).not.toContain('password');
    expect(prompt).not.toContain('secret');
  });

  it('should emphasize role as verifier, not generator', () => {
    const prompt = buildJudgePrompt(mockContext.suggested_text, mockContext);

    expect(prompt.toLowerCase()).toContain('verif');
    expect(prompt.toLowerCase()).toContain('evaluat');
  });
});
