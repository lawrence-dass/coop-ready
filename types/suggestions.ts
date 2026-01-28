/**
 * Suggestion Types for Content Optimization
 * Story 6.2: Implement Summary Section Suggestions
 * Story 6.3: Implement Skills Section Suggestions
 * Story 6.4: Implement Experience Section Suggestions
 * Story 12.1: Add LLM-as-Judge fields
 */

import type { JudgeCriteriaScores } from './judge';

// ============================================================================
// SUMMARY SUGGESTION TYPES
// ============================================================================

/**
 * AI-tell phrase detection result
 * Identifies AI-generated language and provides natural rewrites
 */
export interface AITellRewrite {
  detected: string; // The AI-tell phrase that was found
  rewritten: string; // The more natural replacement
}

/**
 * Summary optimization suggestion
 * Contains original vs optimized summary with details
 */
export interface SummarySuggestion {
  original: string; // User's original summary
  suggested: string; // Optimized version with keywords
  ats_keywords_added: string[]; // Keywords from JD that were incorporated
  ai_tell_phrases_rewritten: AITellRewrite[]; // AI language that was fixed
  point_value?: number; // Estimated ATS score improvement (0-100)

  // Story 12.1: Judge fields (optional for backward compatibility)
  judge_score?: number; // Quality score from LLM judge (0-100)
  judge_passed?: boolean; // Whether suggestion passed validation
  judge_reasoning?: string; // Brief explanation of the score
  judge_criteria?: JudgeCriteriaScores; // Breakdown by criteria
}

// ============================================================================
// SKILLS SUGGESTION TYPES (Story 6.3)
// ============================================================================

/**
 * Individual skill with metadata
 */
export interface SkillItem {
  skill: string; // The skill name
  reason?: string; // Why this skill is relevant or suggested
  point_value?: number; // Estimated ATS score improvement for this skill (0-100)

  // Story 12.1: Judge fields (optional for backward compatibility)
  judge_score?: number; // Quality score from LLM judge (0-100)
  judge_passed?: boolean; // Whether suggestion passed validation
  judge_reasoning?: string; // Brief explanation of the score
  judge_criteria?: JudgeCriteriaScores; // Breakdown by criteria
}

/**
 * Skills optimization suggestion
 * Contains analysis and recommendations for skills section
 */
export interface SkillsSuggestion {
  /** User's original skills section text */
  original: string;

  /** Skills currently in the resume */
  existing_skills: string[];

  /** Keywords from JD that matched existing skills */
  matched_keywords: string[];

  /** Skills from JD that are missing but relevant based on user's experience */
  missing_but_relevant: SkillItem[];

  /** Recommended skills to add */
  skill_additions: string[];

  /** Skills that might be less relevant for this role */
  skill_removals: SkillItem[];

  /** Summary of the analysis */
  summary: string;

  /** Total estimated point value improvement for all skill additions */
  total_point_value?: number;
}

// ============================================================================
// EXPERIENCE SUGGESTION TYPES (Story 6.4)
// ============================================================================

/**
 * Individual bullet point with optimization details
 */
export interface BulletSuggestion {
  /** Original bullet text */
  original: string;

  /** Optimized bullet with keywords and metrics */
  suggested: string;

  /** Metrics or quantification added (e.g., ["30%", "5 engineers"]) */
  metrics_added: string[];

  /** Keywords from JD incorporated into this bullet */
  keywords_incorporated: string[];

  /** Estimated ATS score improvement for this bullet (0-100) */
  point_value?: number;

  // Story 12.1: Judge fields (optional for backward compatibility)
  judge_score?: number; // Quality score from LLM judge (0-100)
  judge_passed?: boolean; // Whether suggestion passed validation
  judge_reasoning?: string; // Brief explanation of the score
  judge_criteria?: JudgeCriteriaScores; // Breakdown by criteria
}

/**
 * Individual work experience entry
 */
export interface ExperienceEntry {
  /** Company name */
  company: string;

  /** Job title/role */
  role: string;

  /** Employment dates (e.g., "2020 - 2023") */
  dates: string;

  /** Original bullet points */
  original_bullets: string[];

  /** Suggested optimized bullets */
  suggested_bullets: BulletSuggestion[];
}

/**
 * Experience optimization suggestion
 * Contains reframed bullets with keywords and quantification
 */
export interface ExperienceSuggestion {
  /** User's original experience section text */
  original: string;

  /** Array of work experience entries with suggestions */
  experience_entries: ExperienceEntry[];

  /** Summary of the optimization */
  summary: string;

  /** Total estimated point value improvement for all experience optimizations */
  total_point_value?: number;
}
