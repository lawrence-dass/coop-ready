/**
 * Analysis Response Parsing V2
 * Story 9.1: ATS Scoring Recalibration
 *
 * Parses and validates OpenAI analysis responses with new score structure.
 */

import type { AnalysisResult, ScoreBreakdown } from '@/lib/types/analysis';

/**
 * Clamp score to valid 0-100 range
 */
function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Expected weights for V2 scoring
 */
const EXPECTED_WEIGHTS = {
  keywordAlignment: 0.25,
  contentRelevance: 0.25,
  quantificationImpact: 0.20,
  formatStructure: 0.15,
  skillsCoverage: 0.15,
} as const;

/**
 * Validate that weights sum to approximately 1.0 (allowing for rounding)
 */
function validateWeights(breakdown: ScoreBreakdown): boolean {
  const weightSum =
    breakdown.categories.keywordAlignment.weight +
    breakdown.categories.contentRelevance.weight +
    breakdown.categories.quantificationImpact.weight +
    breakdown.categories.formatStructure.weight +
    breakdown.categories.skillsCoverage.weight;

  // Allow for small floating point errors
  return Math.abs(weightSum - 1.0) < 0.01;
}

/**
 * Normalize weights to expected values if they are invalid
 * This ensures consistent scoring even if AI returns wrong weights
 */
function normalizeWeights(breakdown: ScoreBreakdown): void {
  breakdown.categories.keywordAlignment.weight = EXPECTED_WEIGHTS.keywordAlignment;
  breakdown.categories.contentRelevance.weight = EXPECTED_WEIGHTS.contentRelevance;
  breakdown.categories.quantificationImpact.weight = EXPECTED_WEIGHTS.quantificationImpact;
  breakdown.categories.formatStructure.weight = EXPECTED_WEIGHTS.formatStructure;
  breakdown.categories.skillsCoverage.weight = EXPECTED_WEIGHTS.skillsCoverage;
}

/**
 * Calculate overall score from category scores and weights
 */
function calculateOverallScore(breakdown: ScoreBreakdown): number {
  const weighted =
    breakdown.categories.keywordAlignment.score * breakdown.categories.keywordAlignment.weight +
    breakdown.categories.contentRelevance.score * breakdown.categories.contentRelevance.weight +
    breakdown.categories.quantificationImpact.score *
      breakdown.categories.quantificationImpact.weight +
    breakdown.categories.formatStructure.score * breakdown.categories.formatStructure.weight +
    breakdown.categories.skillsCoverage.score * breakdown.categories.skillsCoverage.weight;

  return clampScore(weighted);
}

/**
 * Parse OpenAI analysis response V2 with new score structure
 *
 * @param responseContent - Raw content from OpenAI response
 * @returns Parsed and validated AnalysisResult
 * @throws Error if response is completely unparseable
 */
export function parseAnalysisResponseV2(responseContent: string): AnalysisResult {
  try {
    // Remove any markdown code block wrappers if present
    const cleanedContent = responseContent
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '');

    // Parse JSON
    const parsed = JSON.parse(cleanedContent);

    // Validate structure
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Response is not a valid object');
    }

    if (typeof parsed.overallScore !== 'number') {
      throw new Error('Missing or invalid overallScore');
    }

    if (!parsed.scoreBreakdown || typeof parsed.scoreBreakdown !== 'object') {
      throw new Error('Missing or invalid scoreBreakdown');
    }

    // Validate new scoreBreakdown structure
    const sb = parsed.scoreBreakdown;
    if (!sb.categories || typeof sb.categories !== 'object') {
      throw new Error('Missing or invalid scoreBreakdown.categories');
    }

    // Validate each category
    const requiredCategories = [
      'keywordAlignment',
      'contentRelevance',
      'quantificationImpact',
      'formatStructure',
      'skillsCoverage',
    ] as const;

    for (const category of requiredCategories) {
      if (!sb.categories[category]) {
        throw new Error(`Missing category: ${category}`);
      }
      if (typeof sb.categories[category].score !== 'number') {
        throw new Error(`Invalid score for category: ${category}`);
      }
      if (typeof sb.categories[category].weight !== 'number') {
        throw new Error(`Invalid weight for category: ${category}`);
      }
    }

    if (typeof parsed.justification !== 'string' || !parsed.justification.trim()) {
      throw new Error('Missing or invalid justification');
    }

    if (!Array.isArray(parsed.strengths)) {
      throw new Error('Missing or invalid strengths array');
    }

    if (!Array.isArray(parsed.weaknesses)) {
      throw new Error('Missing or invalid weaknesses array');
    }

    // Clamp all category scores to valid range (0-100)
    const scoreBreakdown: ScoreBreakdown = {
      overall: 0, // Will be calculated below
      categories: {
        keywordAlignment: {
          score: clampScore(sb.categories.keywordAlignment.score),
          weight: sb.categories.keywordAlignment.weight,
          reason: sb.categories.keywordAlignment.reason || '',
        },
        contentRelevance: {
          score: clampScore(sb.categories.contentRelevance.score),
          weight: sb.categories.contentRelevance.weight,
          reason: sb.categories.contentRelevance.reason || '',
        },
        quantificationImpact: {
          score: clampScore(sb.categories.quantificationImpact.score),
          weight: sb.categories.quantificationImpact.weight,
          reason: sb.categories.quantificationImpact.reason || '',
          quantificationDensity: sb.categories.quantificationImpact.quantificationDensity ?? 0,
        },
        formatStructure: {
          score: clampScore(sb.categories.formatStructure.score),
          weight: sb.categories.formatStructure.weight,
          reason: sb.categories.formatStructure.reason || '',
        },
        skillsCoverage: {
          score: clampScore(sb.categories.skillsCoverage.score),
          weight: sb.categories.skillsCoverage.weight,
          reason: sb.categories.skillsCoverage.reason || '',
        },
      },
    };

    // Validate weights sum to 1.0 - normalize if invalid
    if (!validateWeights(scoreBreakdown)) {
      console.warn(
        '[parseAnalysisV2] Weights do not sum to 1.0, normalizing to expected values'
      );
      normalizeWeights(scoreBreakdown);
    }

    // Calculate overall score from weighted categories
    scoreBreakdown.overall = calculateOverallScore(scoreBreakdown);

    // Limit arrays to reasonable size (max 5 items each)
    const strengths = parsed.strengths.slice(0, 5).filter((s: unknown) => typeof s === 'string');
    const weaknesses = parsed.weaknesses
      .slice(0, 5)
      .filter((w: unknown) => typeof w === 'string');

    // Build final result
    const result: AnalysisResult = {
      overallScore: clampScore(parsed.overallScore),
      scoreBreakdown,
      justification: parsed.justification.trim(),
      strengths,
      weaknesses,
    };

    // Add optional fields if present
    if (parsed.keywords) {
      result.keywords = parsed.keywords;
    }

    if (parsed.sectionScores) {
      result.sectionScores = parsed.sectionScores;
    }

    if (parsed.experienceLevelContext) {
      result.experienceLevelContext = parsed.experienceLevelContext;
    }

    if (parsed.formatIssues && Array.isArray(parsed.formatIssues)) {
      result.formatIssues = parsed.formatIssues;
    }

    return result;
  } catch (error) {
    // If parsing fails completely, throw error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse analysis response: ${errorMessage}`);
  }
}
