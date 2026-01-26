// Story 5.2: ATS Score Calculation
import { ActionResponse } from '@/types';
import type { ATSScore, ScoreBreakdown, KeywordAnalysisResult } from '@/types/analysis';
import type { Resume } from '@/types/optimization';
import { judgeContentQuality } from './judgeContentQuality';

// Score weight constants
const KEYWORD_WEIGHT = 0.50;
const SECTION_WEIGHT = 0.25;
const QUALITY_WEIGHT = 0.25;

// Required resume sections for section coverage scoring
const REQUIRED_SECTIONS = ['summary', 'skills', 'experience'] as const;

/**
 * Calculate keyword alignment score (0-100)
 *
 * Based on match rate from keyword analysis:
 * - 100% match rate = 100 points
 * - 0% match rate = 0 points
 *
 * @param keywordAnalysis - Results from Story 5.1 keyword matching
 * @returns Score 0-100
 */
function calculateKeywordScore(keywordAnalysis: KeywordAnalysisResult): number {
  return Math.round(keywordAnalysis.matchRate);
}

/**
 * Calculate section coverage score (0-100)
 *
 * Checks if resume contains required sections:
 * - summary, skills, experience (all required)
 * - education (optional, not counted)
 *
 * Formula: (present_sections / required_sections) * 100
 *
 * @param parsedResume - Parsed resume with section fields
 * @returns Score 0-100
 */
function calculateSectionCoverageScore(parsedResume: Resume): number {
  const presentSections = REQUIRED_SECTIONS.filter(
    (section) => {
      const content = parsedResume[section];
      return content && content.trim().length > 0;
    }
  );

  const coverageRate = presentSections.length / REQUIRED_SECTIONS.length;
  return Math.round(coverageRate * 100);
}

/**
 * Calculate weighted overall ATS score (0-100)
 *
 * Combines three components with weights:
 * - Keyword alignment: 50%
 * - Section coverage: 25%
 * - Content quality: 25%
 *
 * @param breakdown - Individual component scores
 * @returns Weighted overall score 0-100
 */
function calculateOverallScore(breakdown: ScoreBreakdown): number {
  const overall =
    breakdown.keywordScore * KEYWORD_WEIGHT +
    breakdown.sectionCoverageScore * SECTION_WEIGHT +
    breakdown.contentQualityScore * QUALITY_WEIGHT;

  return Math.round(overall);
}

/**
 * Calculate ATS compatibility score for a resume-JD pair
 *
 * **Algorithm:**
 * 1. Keyword Score (50%): Match rate from keyword analysis
 * 2. Section Coverage (25%): Presence of required sections
 * 3. Content Quality (25%): LLM judge evaluation
 *
 * **Fallback Strategy:**
 * If quality scoring fails/times out, reweight to:
 * - Keyword: 67%
 * - Section: 33%
 *
 * @param keywordAnalysis - Results from Story 5.1
 * @param parsedResume - Parsed resume structure
 * @param jdContent - Job description text
 * @returns ActionResponse with ATSScore or error
 */
export async function calculateATSScore(
  keywordAnalysis: KeywordAnalysisResult,
  parsedResume: Resume,
  jdContent: string
): Promise<ActionResponse<ATSScore>> {
  try {
    // Validation
    if (!keywordAnalysis) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Keyword analysis is required'
        }
      };
    }

    if (!parsedResume || !parsedResume.rawText) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parsed resume is required'
        }
      };
    }

    if (!jdContent || jdContent.trim().length === 0) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Job description is required'
        }
      };
    }

    // Calculate keyword score (instant calculation)
    const keywordScore = calculateKeywordScore(keywordAnalysis);

    // Calculate section coverage score (instant calculation)
    const sectionCoverageScore = calculateSectionCoverageScore(parsedResume);

    // Calculate content quality score (LLM-based, may timeout)
    let contentQualityScore = 0;
    const qualityResult = await judgeContentQuality(parsedResume, jdContent);

    if (qualityResult.error) {
      // Fallback: Use keyword + section only, reweighted
      // Keyword: 0.50 / 0.75 = 0.67
      // Section: 0.25 / 0.75 = 0.33
      const fallbackOverall = Math.round(
        keywordScore * (KEYWORD_WEIGHT / (KEYWORD_WEIGHT + SECTION_WEIGHT)) +
        sectionCoverageScore * (SECTION_WEIGHT / (KEYWORD_WEIGHT + SECTION_WEIGHT))
      );

      return {
        data: {
          overall: fallbackOverall,
          breakdown: {
            keywordScore,
            sectionCoverageScore,
            contentQualityScore: 0 // Indicate quality scoring unavailable
          },
          calculatedAt: new Date().toISOString()
        },
        error: null
      };
    }

    contentQualityScore = qualityResult.data;

    // Calculate weighted overall score
    const breakdown: ScoreBreakdown = {
      keywordScore,
      sectionCoverageScore,
      contentQualityScore
    };

    const overall = calculateOverallScore(breakdown);

    return {
      data: {
        overall,
        breakdown,
        calculatedAt: new Date().toISOString()
      },
      error: null
    };

  } catch (error) {
    console.error('[calculateATSScore] Unexpected error:', error);
    return {
      data: null,
      error: {
        code: 'SCORE_CALCULATION_ERROR',
        message: 'Failed to calculate ATS score. Please try again.'
      }
    };
  }
}
