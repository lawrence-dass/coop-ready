/**
 * LLM-as-Judge Types
 * Story 12.1: Implement LLM-as-Judge Pipeline Step
 *
 * Types for suggestion quality validation before showing to users
 */

// ============================================================================
// JUDGE RESULT TYPES
// ============================================================================

/**
 * Quality criteria breakdown for a suggestion
 */
export interface JudgeCriteriaScores {
  /** No fabrication, reframing only (0-25 points) */
  authenticity: number;

  /** Clear, professional language (0-25 points) */
  clarity: number;

  /** Keywords and formatting for ATS (0-25 points) */
  ats_relevance: number;

  /** Specific, implementable suggestion (0-25 points) */
  actionability: number;
}

/**
 * Recommendation for handling a suggestion
 */
export type JudgeRecommendation = 'accept' | 'regenerate' | 'flag';

/**
 * Result of judging a single suggestion
 */
export interface JudgeResult {
  /** ID or reference to the suggestion being judged */
  suggestion_id: string;

  /** Overall quality score (0-100) */
  quality_score: number;

  /** Whether suggestion passed validation (score >= threshold) */
  passed: boolean;

  /** Brief explanation of the score */
  reasoning: string;

  /** Breakdown by evaluation criteria */
  criteria_breakdown: JudgeCriteriaScores;

  /** What to do with this suggestion */
  recommendation: JudgeRecommendation;
}

// ============================================================================
// JUDGE CONTEXT TYPES
// ============================================================================

/**
 * Context needed to judge a single suggestion
 */
export interface SuggestionContext {
  /** Original text from resume section */
  original_text: string;

  /** Suggested improvement text */
  suggested_text: string;

  /** Relevant excerpt from job description */
  jd_excerpt: string;

  /** Type of section (summary, skills, experience) */
  section_type: 'summary' | 'skills' | 'experience';
}

/**
 * Context for batch judging multiple suggestions
 */
export interface BatchJudgeContext {
  /** Full resume content for reference */
  resume_content: string;

  /** Full job description */
  jd_content: string;

  /** Extracted keywords from JD */
  keywords?: string[];
}

// ============================================================================
// JUDGE METRICS TYPES
// ============================================================================

/**
 * Aggregate metrics from judging a batch of suggestions
 */
export interface JudgeMetrics {
  /** Total number of suggestions judged */
  total_judged: number;

  /** Number that passed validation */
  passed: number;

  /** Number that failed validation */
  failed: number;

  /** Pass rate as percentage (0-100) */
  pass_rate: number;

  /** Average quality score across all suggestions */
  avg_score: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default quality threshold
 * Suggestions with score >= threshold pass validation
 */
export const DEFAULT_QUALITY_THRESHOLD = 60;

/**
 * Borderline zone for suggestions that might need attention
 */
export const BORDERLINE_THRESHOLD_LOW = 55;
export const BORDERLINE_THRESHOLD_HIGH = 60;
