/**
 * Story 14.1: Test explanation field backward compatibility
 *
 * This test ensures that:
 * 1. New suggestion types include optional explanation field
 * 2. Existing suggestions without explanation still work
 * 3. Type system enforces explanation as optional string
 */

import { describe, it, expect } from 'vitest';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
  BulletSuggestion,
} from '@/types/suggestions';

describe('Explanation Field - Type Compatibility', () => {
  describe('SummarySuggestion', () => {
    it('should accept suggestion without explanation field', () => {
      const suggestion: SummarySuggestion = {
        original: 'Original summary',
        suggested: 'Optimized summary',
        ats_keywords_added: ['keyword1'],
        ai_tell_phrases_rewritten: [],
      };

      expect(suggestion).toBeDefined();
      expect(suggestion.explanation).toBeUndefined();
    });

    it('should accept suggestion with explanation field', () => {
      const suggestion: SummarySuggestion = {
        original: 'Original summary',
        suggested: 'Optimized summary',
        ats_keywords_added: ['keyword1'],
        ai_tell_phrases_rewritten: [],
        explanation: 'This helps by incorporating relevant keywords.',
      };

      expect(suggestion).toBeDefined();
      expect(suggestion.explanation).toBe('This helps by incorporating relevant keywords.');
    });

    it('should accept explanation as undefined explicitly', () => {
      const suggestion: SummarySuggestion = {
        original: 'Original summary',
        suggested: 'Optimized summary',
        ats_keywords_added: ['keyword1'],
        ai_tell_phrases_rewritten: [],
        explanation: undefined,
      };

      expect(suggestion).toBeDefined();
      expect(suggestion.explanation).toBeUndefined();
    });
  });

  describe('SkillsSuggestion', () => {
    it('should accept suggestion without explanation field', () => {
      const suggestion: SkillsSuggestion = {
        original: 'Skills section',
        existing_skills: ['React'],
        matched_keywords: ['React'],
        missing_but_relevant: [],
        skill_additions: ['TypeScript'],
        skill_removals: [],
        summary: 'Add TypeScript',
      };

      expect(suggestion).toBeDefined();
      expect(suggestion.explanation).toBeUndefined();
    });

    it('should accept suggestion with explanation field', () => {
      const suggestion: SkillsSuggestion = {
        original: 'Skills section',
        existing_skills: ['React'],
        matched_keywords: ['React'],
        missing_but_relevant: [],
        skill_additions: ['TypeScript'],
        skill_removals: [],
        summary: 'Add TypeScript',
        explanation: 'TypeScript is mentioned in the job description and matches your experience.',
      };

      expect(suggestion).toBeDefined();
      expect(suggestion.explanation).toBe('TypeScript is mentioned in the job description and matches your experience.');
    });
  });

  describe('ExperienceSuggestion', () => {
    it('should accept suggestion without explanation field', () => {
      const suggestion: ExperienceSuggestion = {
        original: 'Experience section',
        experience_entries: [],
        summary: 'Optimized bullets',
      };

      expect(suggestion).toBeDefined();
      expect(suggestion.explanation).toBeUndefined();
    });

    it('should accept suggestion with explanation field', () => {
      const suggestion: ExperienceSuggestion = {
        original: 'Experience section',
        experience_entries: [],
        summary: 'Optimized bullets',
        explanation: 'Added quantifiable metrics to demonstrate impact.',
      };

      expect(suggestion).toBeDefined();
      expect(suggestion.explanation).toBe('Added quantifiable metrics to demonstrate impact.');
    });
  });

  describe('BulletSuggestion', () => {
    it('should accept bullet without explanation field', () => {
      const bullet: BulletSuggestion = {
        original: 'Led team',
        suggested: 'Led team of 5 engineers',
        metrics_added: ['5 engineers'],
        keywords_incorporated: ['team', 'leadership'],
      };

      expect(bullet).toBeDefined();
      expect(bullet.explanation).toBeUndefined();
    });

    it('should accept bullet with explanation field', () => {
      const bullet: BulletSuggestion = {
        original: 'Led team',
        suggested: 'Led team of 5 engineers',
        metrics_added: ['5 engineers'],
        keywords_incorporated: ['team', 'leadership'],
        explanation: 'Quantifying team size demonstrates scope of leadership.',
      };

      expect(bullet).toBeDefined();
      expect(bullet.explanation).toBe('Quantifying team size demonstrates scope of leadership.');
    });
  });

  describe('Explanation Field Type Safety', () => {
    it('explanation should be optional string type', () => {
      // This test validates TypeScript compilation
      const suggestion: SummarySuggestion = {
        original: 'test',
        suggested: 'test',
        ats_keywords_added: [],
        ai_tell_phrases_rewritten: [],
      };

      // Should compile without error
      const explicitlyOptional: string | undefined = suggestion.explanation;
      expect(explicitlyOptional).toBeUndefined();
    });
  });
});

describe('Backward Compatibility - Session Storage', () => {
  it('should handle old session data without explanation fields', () => {
    // Simulate loading old session data from database
    const oldSessionData = {
      summary_suggestion: {
        original: 'Old summary',
        suggested: 'New summary',
        ats_keywords_added: ['keyword'],
        ai_tell_phrases_rewritten: [],
        // No explanation field
      },
    };

    const summarySuggestion: SummarySuggestion = oldSessionData.summary_suggestion;

    expect(summarySuggestion).toBeDefined();
    expect(summarySuggestion.explanation).toBeUndefined();
  });

  it('should handle new session data with explanation fields', () => {
    const newSessionData = {
      summary_suggestion: {
        original: 'Old summary',
        suggested: 'New summary',
        ats_keywords_added: ['keyword'],
        ai_tell_phrases_rewritten: [],
        explanation: 'Explanation here',
      },
    };

    const summarySuggestion: SummarySuggestion = newSessionData.summary_suggestion;

    expect(summarySuggestion).toBeDefined();
    expect(summarySuggestion.explanation).toBe('Explanation here');
  });
});
