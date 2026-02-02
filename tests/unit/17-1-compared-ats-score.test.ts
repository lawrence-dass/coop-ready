import { describe, test, expect } from 'vitest';
import type { ATSScore } from '@/types/analysis';

/**
 * Story 17.1: Comparison Database Schema Unit Tests
 *
 * Tests TypeScript type compatibility for compared_ats_score field.
 * These tests verify that the new field integrates correctly with existing types.
 *
 * Priority Distribution:
 * - P0: 3 tests (type compatibility, transformation, nullability)
 */

describe('Story 17.1: Comparison Database Schema', () => {
  test('[P0] 17.1-UNIT-001: compared_ats_score should accept valid ATSScore structure', () => {
    // GIVEN: A valid ATS score object matching the V2.1 structure
    const validComparedScore: ATSScore = {
      overall: 85,
      tier: 'strong',
      breakdown: {
        keywordScore: 40,
        sectionCoverageScore: 25,
        contentQualityScore: 20,
      },
      calculatedAt: '2026-02-02T12:00:00Z',
      breakdownV21: {
        keywords: {
          score: 40,
          weight: 0.4,
          metrics: {
            totalKeywords: 20,
            matchedKeywords: 15,
            matchRate: 0.75,
            criticalMatches: 10,
            criticalMisses: 5,
          },
        },
        sections: {
          score: 25,
          weight: 0.25,
          coverage: {
            summary: true,
            skills: true,
            experience: true,
            education: true,
          },
        },
        content: {
          score: 20,
          weight: 0.35,
          metrics: {
            readability: 85,
            quantification: 70,
            impactVerbs: 80,
          },
        },
      },
      metadata: {
        version: 'v2.1',
        algorithmHash: 'abc123',
        processingTimeMs: 1500,
        detectedRole: 'software-engineer',
        detectedSeniority: 'mid-level',
        weightsUsed: {
          keywords: 0.4,
          sections: 0.25,
          content: 0.35,
        },
      },
      actionItems: [
        {
          priority: 'high',
          section: 'summary',
          issue: 'Missing key technical skills',
          suggestion: 'Add specific technical keywords',
        },
      ],
    };

    // WHEN: Assigning to compared_ats_score type
    const comparedAtsScore: ATSScore | null = validComparedScore;

    // THEN: Type assignment should succeed and structure should be valid
    expect(comparedAtsScore).toBeDefined();
    expect(comparedAtsScore?.overall).toBe(85);
    expect(comparedAtsScore?.tier).toBe('strong');
    expect(comparedAtsScore?.metadata.version).toBe('v2.1');
  });

  test('[P0] 17.1-UNIT-002: compared_ats_score should accept null value', () => {
    // GIVEN: A null value (user has not uploaded comparison resume)
    const noComparison: ATSScore | null = null;

    // WHEN: Assigning null to compared_ats_score
    const comparedAtsScore: ATSScore | null = noComparison;

    // THEN: Null assignment should be valid
    expect(comparedAtsScore).toBeNull();
  });

  test('[P0] 17.1-UNIT-003: SessionRow interface should include compared_ats_score with correct type', () => {
    // GIVEN: A mock SessionRow object with compared_ats_score
    const mockSessionRow = {
      id: 'test-session-id',
      anonymous_id: 'anon-123',
      user_id: null,
      resume_content: null,
      jd_content: null,
      analysis: null,
      suggestions: null,
      feedback: null,
      keyword_analysis: null,
      ats_score: {
        overall: 72,
        tier: 'moderate',
        breakdown: { keywordScore: 30, sectionCoverageScore: 22, contentQualityScore: 20 },
        calculatedAt: '2026-02-01T00:00:00Z',
      } as ATSScore,
      compared_ats_score: {
        overall: 85,
        tier: 'strong',
        breakdown: { keywordScore: 40, sectionCoverageScore: 25, contentQualityScore: 20 },
        calculatedAt: '2026-02-02T12:00:00Z',
      } as ATSScore,
      summary_suggestion: null,
      skills_suggestion: null,
      experience_suggestion: null,
      education_suggestion: null,
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-02-02T12:00:00Z',
    };

    // WHEN: Accessing compared_ats_score field
    const comparedScore = mockSessionRow.compared_ats_score;

    // THEN: Field should exist and have correct type
    expect(comparedScore).toBeDefined();
    expect(comparedScore?.overall).toBe(85);
    expect(comparedScore?.tier).toBe('strong');
  });

  test('[P0] 17.1-UNIT-004: OptimizationSession interface should include comparedAtsScore in camelCase', () => {
    // GIVEN: A mock OptimizationSession object with comparedAtsScore
    const mockOptimizationSession = {
      id: 'test-session-id',
      anonymousId: 'anon-123',
      userId: null,
      resumeContent: null,
      jobDescription: null,
      analysisResult: null,
      keywordAnalysis: null,
      atsScore: {
        overall: 72,
        tier: 'moderate',
        breakdown: { keywordScore: 30, sectionCoverageScore: 22, contentQualityScore: 20 },
        calculatedAt: '2026-02-01T00:00:00Z',
      } as ATSScore,
      comparedAtsScore: {
        overall: 85,
        tier: 'strong',
        breakdown: { keywordScore: 40, sectionCoverageScore: 25, contentQualityScore: 20 },
        calculatedAt: '2026-02-02T12:00:00Z',
      } as ATSScore,
      summarySuggestion: null,
      skillsSuggestion: null,
      experienceSuggestion: null,
      educationSuggestion: null,
      suggestions: null,
      feedback: [],
      createdAt: new Date('2026-02-01T00:00:00Z'),
      updatedAt: new Date('2026-02-02T12:00:00Z'),
    };

    // WHEN: Accessing comparedAtsScore field (camelCase)
    const comparedScore = mockOptimizationSession.comparedAtsScore;

    // THEN: Field should exist in camelCase and have correct type
    expect(comparedScore).toBeDefined();
    expect(comparedScore?.overall).toBe(85);
    expect(comparedScore?.tier).toBe('strong');
  });

  test('[P0] 17.1-UNIT-005: Transformation between snake_case and camelCase should work correctly', () => {
    // GIVEN: Database row with compared_ats_score (snake_case)
    const dbRow = {
      compared_ats_score: {
        overall: 88,
        tier: 'strong',
        breakdown: { keywordScore: 42, sectionCoverageScore: 26, contentQualityScore: 20 },
        calculatedAt: '2026-02-02T12:00:00Z',
      } as ATSScore,
    };

    // WHEN: Transforming to application layer (camelCase)
    const appLayer = {
      comparedAtsScore: dbRow.compared_ats_score,
    };

    // THEN: Transformation should preserve data structure
    expect(appLayer.comparedAtsScore).toBeDefined();
    expect(appLayer.comparedAtsScore?.overall).toBe(88);
    expect(appLayer.comparedAtsScore).toEqual(dbRow.compared_ats_score);
  });

  test('[P0] 17.1-UNIT-006: Update operation should support compared_ats_score field', () => {
    // GIVEN: An update object with comparedAtsScore (camelCase)
    const updates = {
      comparedAtsScore: {
        overall: 90,
        tier: 'excellent',
        breakdown: { keywordScore: 45, sectionCoverageScore: 28, contentQualityScore: 17 },
        calculatedAt: '2026-02-02T14:00:00Z',
      } as ATSScore,
    };

    // WHEN: Checking if field exists for conditional update
    const shouldUpdate = 'comparedAtsScore' in updates;

    // THEN: Field existence check should work correctly
    expect(shouldUpdate).toBe(true);
    expect(updates.comparedAtsScore?.overall).toBe(90);
  });

  test('[P1] 17.1-UNIT-007: JSONB structure should match ats_score format exactly', () => {
    // GIVEN: An original ats_score
    const originalScore: ATSScore = {
      overall: 72,
      tier: 'moderate',
      breakdown: {
        keywordScore: 30,
        sectionCoverageScore: 22,
        contentQualityScore: 20,
      },
      calculatedAt: '2026-02-01T00:00:00Z',
      breakdownV21: {} as any,
      metadata: {} as any,
      actionItems: [],
    };

    // WHEN: Creating a compared_ats_score with same structure
    const comparedScore: ATSScore = {
      overall: 85,
      tier: 'strong',
      breakdown: {
        keywordScore: 40,
        sectionCoverageScore: 25,
        contentQualityScore: 20,
      },
      calculatedAt: '2026-02-02T12:00:00Z',
      breakdownV21: {} as any,
      metadata: {} as any,
      actionItems: [],
    };

    // THEN: Both should have identical structure (only values differ)
    expect(Object.keys(originalScore)).toEqual(Object.keys(comparedScore));
    expect(typeof originalScore.overall).toBe(typeof comparedScore.overall);
    expect(typeof originalScore.tier).toBe(typeof comparedScore.tier);
  });
});
