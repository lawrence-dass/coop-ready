/**
 * Tests for updated analysis types
 * Story 9.1: ATS Scoring Recalibration
 */

import type { ScoreBreakdown, DensityResult } from '@/lib/types/analysis';

describe('ScoreBreakdown (Story 9.1)', () => {
  it('should have all 5 new categories with weights', () => {
    const scoreBreakdown: ScoreBreakdown = {
      overall: 75,
      categories: {
        keywordAlignment: {
          score: 80,
          weight: 0.25,
          reason: 'Good keyword coverage',
        },
        contentRelevance: {
          score: 85,
          weight: 0.25,
          reason: 'Content aligns well with role',
        },
        quantificationImpact: {
          score: 60,
          weight: 0.20,
          reason: 'Low quantification density',
          quantificationDensity: 30,
        },
        formatStructure: {
          score: 90,
          weight: 0.15,
          reason: 'Clean formatting',
        },
        skillsCoverage: {
          score: 70,
          weight: 0.15,
          reason: 'Decent skills match',
        },
      },
    };

    // Verify structure exists
    expect(scoreBreakdown.overall).toBe(75);
    expect(scoreBreakdown.categories.keywordAlignment.weight).toBe(0.25);
    expect(scoreBreakdown.categories.contentRelevance.weight).toBe(0.25);
    expect(scoreBreakdown.categories.quantificationImpact.weight).toBe(0.20);
    expect(scoreBreakdown.categories.formatStructure.weight).toBe(0.15);
    expect(scoreBreakdown.categories.skillsCoverage.weight).toBe(0.15);

    // Verify weights sum to 1.0 (100%)
    const weightSum =
      scoreBreakdown.categories.keywordAlignment.weight +
      scoreBreakdown.categories.contentRelevance.weight +
      scoreBreakdown.categories.quantificationImpact.weight +
      scoreBreakdown.categories.formatStructure.weight +
      scoreBreakdown.categories.skillsCoverage.weight;

    expect(weightSum).toBeCloseTo(1.0, 2);
  });

  it('should include quantificationDensity in quantificationImpact category', () => {
    const scoreBreakdown: ScoreBreakdown = {
      overall: 80,
      categories: {
        keywordAlignment: { score: 80, weight: 0.25, reason: '' },
        contentRelevance: { score: 80, weight: 0.25, reason: '' },
        quantificationImpact: {
          score: 85,
          weight: 0.20,
          reason: 'High metrics usage',
          quantificationDensity: 85,
        },
        formatStructure: { score: 80, weight: 0.15, reason: '' },
        skillsCoverage: { score: 80, weight: 0.15, reason: '' },
      },
    };

    expect(scoreBreakdown.categories.quantificationImpact.quantificationDensity).toBe(85);
  });
});

describe('DensityResult type', () => {
  it('should be exported from types/analysis', () => {
    // Type check only - this test ensures DensityResult is properly exported
    const densityResult: DensityResult = {
      totalBullets: 10,
      bulletsWithMetrics: 8,
      density: 80,
      byCategory: {
        numbers: 5,
        percentages: 3,
        currency: 2,
        timeUnits: 1,
      },
    };

    expect(densityResult.density).toBe(80);
  });
});
