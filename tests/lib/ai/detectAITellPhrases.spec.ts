/**
 * Unit tests for AI-tell phrase detector
 * Story 6.2: Detect and rewrite AI-generated language patterns
 *
 * Tests cover:
 * - Detection of common AI-tell phrases
 * - Case-insensitive matching
 * - Proper rewrite suggestions
 * - Multiple detections in single text
 */

import { describe, it, expect } from 'vitest';
import { detectAITellPhrases, applyAITellRewrites } from '@/lib/ai/detectAITellPhrases';

describe('detectAITellPhrases', () => {
  it('should detect "I have the pleasure of"', () => {
    const text = 'I have the pleasure of leading development teams.';
    const result = detectAITellPhrases(text);

    expect(result).toHaveLength(1);
    expect(result[0].detected).toBe('I have the pleasure of');
    expect(result[0].rewritten).toBe('I');
  });

  it('should detect "leverage my expertise"', () => {
    const text = 'I leverage my expertise in software development.';
    const result = detectAITellPhrases(text);

    expect(result).toHaveLength(1);
    expect(result[0].detected).toBe('leverage my expertise');
    expect(result[0].rewritten).toBe('use my skills');
  });

  it('should detect "synergize"', () => {
    const text = 'I work to synergize with cross-functional teams.';
    const result = detectAITellPhrases(text);

    expect(result).toHaveLength(1);
    expect(result[0].detected).toBe('synergize');
    expect(result[0].rewritten).toBe('collaborate');
  });

  it('should detect "passionate about"', () => {
    const text = 'I am passionate about software development.';
    const result = detectAITellPhrases(text);

    expect(result).toHaveLength(1);
    expect(result[0].detected).toBe('passionate about');
    expect(result[0].rewritten).toBe('experienced in');
  });

  it('should be case-insensitive', () => {
    const text = 'I HAVE THE PLEASURE of working here.';
    const result = detectAITellPhrases(text);

    expect(result).toHaveLength(1);
    expect(result[0].detected).toBe('I have the pleasure of');
  });

  it('should detect multiple AI-tell phrases', () => {
    const text = 'I have the pleasure of being a passionate about technology professional who leverages my expertise.';
    const result = detectAITellPhrases(text);

    expect(result.length).toBeGreaterThan(1);
    const detectedPhrases = result.map(r => r.detected);
    expect(detectedPhrases).toContain('I have the pleasure of');
    expect(detectedPhrases).toContain('passionate about');
    expect(detectedPhrases).toContain('leverage my expertise');
  });

  it('should return empty array for clean text', () => {
    const text = 'Experienced software engineer with 5 years in full-stack development.';
    const result = detectAITellPhrases(text);

    expect(result).toHaveLength(0);
  });

  it('should detect "dynamic environment"', () => {
    const text = 'Thrive in dynamic environment with changing priorities.';
    const result = detectAITellPhrases(text);

    expect(result).toHaveLength(1);
    expect(result[0].detected).toBe('dynamic environment');
    expect(result[0].rewritten).toBe('fast-paced environment');
  });

  it('should detect "proven track record"', () => {
    const text = 'I have a proven track record of success.';
    const result = detectAITellPhrases(text);

    expect(result).toHaveLength(1);
    expect(result[0].detected).toBe('proven track record');
    expect(result[0].rewritten).toBe('track record');
  });
});

describe('applyAITellRewrites', () => {
  it('should rewrite "I have the pleasure of"', () => {
    const text = 'I have the pleasure of leading teams.';
    const result = applyAITellRewrites(text);

    expect(result).toBe('I leading teams.');
  });

  it('should rewrite "leverage my expertise" to "use my skills"', () => {
    const text = 'I leverage my expertise in development.';
    const result = applyAITellRewrites(text);

    expect(result).toBe('I use my skills in development.');
  });

  it('should rewrite multiple phrases', () => {
    const text = 'I have the pleasure of being passionate about technology.';
    const result = applyAITellRewrites(text);

    expect(result).not.toContain('I have the pleasure');
    expect(result).not.toContain('passionate about');
    expect(result).toContain('experienced in');
  });

  it('should preserve text without AI-tell phrases', () => {
    const text = 'Experienced software engineer with strong skills.';
    const result = applyAITellRewrites(text);

    expect(result).toBe(text);
  });

  it('should handle case-insensitive rewrites', () => {
    const text = 'I LEVERAGE MY EXPERTISE in software.';
    const result = applyAITellRewrites(text);

    expect(result.toLowerCase()).toContain('use my skills');
  });

  it('should rewrite "synergize" to "collaborate"', () => {
    const text = 'I synergize with cross-functional teams.';
    const result = applyAITellRewrites(text);

    expect(result).toBe('I collaborate with cross-functional teams.');
  });
});
