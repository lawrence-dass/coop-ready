/**
 * Unit Tests for Score Calculation Utilities
 * Story 11.3: Implement Score Comparison
 */

import { describe, it, expect } from 'vitest';
import {
  calculateProjectedScore,
  calculateScoreDelta,
  calculateCategoryDeltas,
  type AllSuggestions,
} from '@/lib/utils/scoreCalculation';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
} from '@/types/suggestions';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockSummarySuggestion: SummarySuggestion = {
  original: 'Original summary',
  suggested: 'Optimized summary',
  ats_keywords_added: ['keyword1'],
  ai_tell_phrases_rewritten: [],
  point_value: 5,
};

const mockSkillsSuggestion: SkillsSuggestion = {
  original: 'Original skills',
  existing_skills: ['Skill A'],
  matched_keywords: ['Skill A'],
  missing_but_relevant: [],
  skill_additions: ['Skill B'],
  skill_removals: [],
  summary: 'Skills analysis',
  total_point_value: 12,
};

const mockExperienceSuggestion: ExperienceSuggestion = {
  original: 'Original experience',
  experience_entries: [
    {
      company: 'Company A',
      role: 'Engineer',
      dates: '2020-2023',
      original_bullets: ['Original bullet'],
      suggested_bullets: [
        {
          original: 'Original bullet',
          suggested: 'Optimized bullet',
          metrics_added: ['30%'],
          keywords_incorporated: ['keyword'],
          point_value: 6,
        },
        {
          original: 'Original bullet 2',
          suggested: 'Optimized bullet 2',
          metrics_added: [],
          keywords_incorporated: [],
          point_value: 4,
        },
      ],
    },
    {
      company: 'Company B',
      role: 'Senior Engineer',
      dates: '2023-Present',
      original_bullets: ['Original bullet 3'],
      suggested_bullets: [
        {
          original: 'Original bullet 3',
          suggested: 'Optimized bullet 3',
          metrics_added: [],
          keywords_incorporated: [],
          point_value: 8,
        },
      ],
    },
  ],
  summary: 'Experience analysis',
  total_point_value: 18,
};

// ============================================================================
// TEST: calculateProjectedScore
// ============================================================================

describe('calculateProjectedScore', () => {
  it('should calculate correct projected score with all suggestions', () => {
    const originalScore = 72;
    const suggestions: AllSuggestions = {
      summary: mockSummarySuggestion,
      skills: mockSkillsSuggestion,
      experience: mockExperienceSuggestion,
    };

    const result = calculateProjectedScore(originalScore, suggestions);

    // 72 + 5 + 12 + 18 = 107, capped at 100
    expect(result).toBe(100);
  });

  it('should calculate correct projected score below cap', () => {
    const originalScore = 60;
    const suggestions: AllSuggestions = {
      summary: { ...mockSummarySuggestion, point_value: 5 },
      skills: { ...mockSkillsSuggestion, total_point_value: 10 },
      experience: { ...mockExperienceSuggestion, total_point_value: 15 },
    };

    const result = calculateProjectedScore(originalScore, suggestions);

    // 60 + 5 + 10 + 15 = 90
    expect(result).toBe(90);
  });

  it('should cap projected score at 100', () => {
    const originalScore = 95;
    const suggestions: AllSuggestions = {
      summary: { ...mockSummarySuggestion, point_value: 10 },
      skills: null,
      experience: null,
    };

    const result = calculateProjectedScore(originalScore, suggestions);

    // 95 + 10 = 105, capped at 100
    expect(result).toBe(100);
  });

  it('should return original score when no suggestions', () => {
    const originalScore = 72;
    const suggestions: AllSuggestions = {
      summary: null,
      skills: null,
      experience: null,
    };

    const result = calculateProjectedScore(originalScore, suggestions);

    expect(result).toBe(72);
  });

  it('should handle suggestions with undefined point_value (backward compatibility)', () => {
    const originalScore = 70;
    const suggestions: AllSuggestions = {
      summary: { ...mockSummarySuggestion, point_value: undefined },
      skills: { ...mockSkillsSuggestion, total_point_value: undefined },
      experience: { ...mockExperienceSuggestion, total_point_value: undefined },
    };

    const result = calculateProjectedScore(originalScore, suggestions);

    // Experience falls back to summing bullets: 6 + 4 + 8 = 18
    // 70 + 0 + 0 + 18 = 88
    expect(result).toBe(88);
  });

  it('should calculate experience points from bullets when total_point_value is missing', () => {
    const originalScore = 70;
    const suggestions: AllSuggestions = {
      summary: null,
      skills: null,
      experience: {
        ...mockExperienceSuggestion,
        total_point_value: undefined, // Force bullet summation
      },
    };

    const result = calculateProjectedScore(originalScore, suggestions);

    // 70 + 0 + 0 + (6 + 4 + 8) = 88
    expect(result).toBe(88);
  });

  it('should handle empty suggestion arrays', () => {
    const originalScore = 50;
    const suggestions: AllSuggestions = {
      summary: { ...mockSummarySuggestion, point_value: 0 },
      skills: { ...mockSkillsSuggestion, total_point_value: 0 },
      experience: {
        ...mockExperienceSuggestion,
        experience_entries: [],
        total_point_value: 0,
      },
    };

    const result = calculateProjectedScore(originalScore, suggestions);

    expect(result).toBe(50);
  });

  it('should handle very large point values without overflow', () => {
    const originalScore = 50;
    const suggestions: AllSuggestions = {
      summary: { ...mockSummarySuggestion, point_value: 200 },
      skills: { ...mockSkillsSuggestion, total_point_value: 300 },
      experience: { ...mockExperienceSuggestion, total_point_value: 500 },
    };

    const result = calculateProjectedScore(originalScore, suggestions);

    // Should cap at 100 regardless of overflow
    expect(result).toBe(100);
  });

  it('should handle negative point values gracefully', () => {
    const originalScore = 70;
    const suggestions: AllSuggestions = {
      summary: { ...mockSummarySuggestion, point_value: -5 },
      skills: null,
      experience: null,
    };

    const result = calculateProjectedScore(originalScore, suggestions);

    // 70 + (-5) = 65
    expect(result).toBe(65);
  });
});

// ============================================================================
// TEST: calculateScoreDelta
// ============================================================================

describe('calculateScoreDelta', () => {
  it('should calculate positive delta correctly', () => {
    const result = calculateScoreDelta(72, 100);
    expect(result).toBe(28);
  });

  it('should calculate zero delta when scores are equal', () => {
    const result = calculateScoreDelta(85, 85);
    expect(result).toBe(0);
  });

  it('should handle negative delta (shouldn\'t happen in practice)', () => {
    const result = calculateScoreDelta(90, 85);
    expect(result).toBe(-5);
  });

  it('should handle small improvements', () => {
    const result = calculateScoreDelta(99, 100);
    expect(result).toBe(1);
  });

  it('should handle large improvements', () => {
    const result = calculateScoreDelta(40, 95);
    expect(result).toBe(55);
  });
});

// ============================================================================
// TEST: calculateCategoryDeltas
// ============================================================================

describe('calculateCategoryDeltas', () => {
  it('should calculate deltas for all categories', () => {
    const suggestions: AllSuggestions = {
      summary: mockSummarySuggestion,
      skills: mockSkillsSuggestion,
      experience: mockExperienceSuggestion,
    };

    const result = calculateCategoryDeltas(suggestions);

    expect(result).toEqual({
      summary: 5,
      skills: 12,
      experience: 18,
    });
  });

  it('should return zeros when no suggestions', () => {
    const suggestions: AllSuggestions = {
      summary: null,
      skills: null,
      experience: null,
    };

    const result = calculateCategoryDeltas(suggestions);

    expect(result).toEqual({
      summary: 0,
      skills: 0,
      experience: 0,
    });
  });

  it('should handle partial suggestions', () => {
    const suggestions: AllSuggestions = {
      summary: mockSummarySuggestion,
      skills: null,
      experience: mockExperienceSuggestion,
    };

    const result = calculateCategoryDeltas(suggestions);

    expect(result).toEqual({
      summary: 5,
      skills: 0,
      experience: 18,
    });
  });

  it('should handle undefined point values (backward compatibility)', () => {
    const suggestions: AllSuggestions = {
      summary: { ...mockSummarySuggestion, point_value: undefined },
      skills: { ...mockSkillsSuggestion, total_point_value: undefined },
      experience: { ...mockExperienceSuggestion, total_point_value: undefined },
    };

    const result = calculateCategoryDeltas(suggestions);

    // Experience falls back to summing bullets: 6 + 4 + 8 = 18
    expect(result).toEqual({
      summary: 0,
      skills: 0,
      experience: 18,
    });
  });

  it('should sum experience bullet points when total_point_value is missing', () => {
    const suggestions: AllSuggestions = {
      summary: null,
      skills: null,
      experience: {
        ...mockExperienceSuggestion,
        total_point_value: undefined,
      },
    };

    const result = calculateCategoryDeltas(suggestions);

    // Sum of bullets: 6 + 4 + 8 = 18
    expect(result).toEqual({
      summary: 0,
      skills: 0,
      experience: 18,
    });
  });

  it('should handle empty experience entries', () => {
    const suggestions: AllSuggestions = {
      summary: null,
      skills: null,
      experience: {
        ...mockExperienceSuggestion,
        experience_entries: [],
        total_point_value: undefined,
      },
    };

    const result = calculateCategoryDeltas(suggestions);

    expect(result).toEqual({
      summary: 0,
      skills: 0,
      experience: 0,
    });
  });

  it('should handle experience bullets with undefined point_value', () => {
    const suggestions: AllSuggestions = {
      summary: null,
      skills: null,
      experience: {
        ...mockExperienceSuggestion,
        experience_entries: [
          {
            company: 'Test Co',
            role: 'Role',
            dates: '2020-2023',
            original_bullets: ['bullet'],
            suggested_bullets: [
              {
                original: 'bullet',
                suggested: 'optimized',
                metrics_added: [],
                keywords_incorporated: [],
                point_value: undefined, // Missing value
              },
            ],
          },
        ],
        total_point_value: undefined,
      },
    };

    const result = calculateCategoryDeltas(suggestions);

    // Should treat undefined as 0
    expect(result).toEqual({
      summary: 0,
      skills: 0,
      experience: 0,
    });
  });
});
