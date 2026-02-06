/**
 * Suggestion Types for Content Optimization
 * Story 6.2: Implement Summary Section Suggestions
 * Story 6.3: Implement Skills Section Suggestions
 * Story 6.4: Implement Experience Section Suggestions
 * Story 12.1: Add LLM-as-Judge fields
 * Story 14.1: Add explanation fields for reasoning output
 */

import type { JudgeCriteriaScores } from './judge';

// ============================================================================
// IMPACT TIER TYPE
// ============================================================================

/**
 * Impact tier for individual suggestions
 * Replaces numeric point_value for individual items to avoid false precision
 * Section-level total_point_value is still used for proportional calculations
 */
export type ImpactTier = 'critical' | 'high' | 'moderate';

/**
 * Impact tier display configuration
 */
export const IMPACT_TIER_CONFIG = {
  critical: {
    label: 'Critical',
    description: 'Required in job description',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    icon: '🔴',
  },
  high: {
    label: 'High',
    description: 'Strongly desired',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    icon: '🟠',
  },
  moderate: {
    label: 'Moderate',
    description: 'Nice-to-have',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    icon: '🟢',
  },
} as const;

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
  suggested: string; // Optimized version with keywords (alias to suggested_full for backward compat)
  ats_keywords_added: string[]; // Keywords from JD that were incorporated
  ai_tell_phrases_rewritten: AITellRewrite[]; // AI language that was fixed
  point_value?: number; // Estimated ATS score improvement (0-100) - used for section totals
  impact?: ImpactTier; // Impact tier for display (replaces point_value for individual display)

  /** Story 14.1: 1-2 sentence explanation of why this change helps */
  explanation?: string;

  // Dual-length suggestions (Phase 1: Summary only)
  /** Quick edit version - matches original length ±25%, highest-impact keywords only */
  suggested_compact?: string;
  /** Full rewrite version - comprehensive optimization (50-150 words) */
  suggested_full?: string;
  /** Word count of original summary */
  original_word_count?: number;
  /** Word count of compact version */
  compact_word_count?: number;
  /** Word count of full version */
  full_word_count?: number;

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
  point_value?: number; // Estimated ATS score improvement for this skill (0-100) - used for section totals
  impact?: ImpactTier; // Impact tier for display (replaces point_value for individual display)

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

  /** Story 14.1: 1-2 sentence explanation of why these skill changes help */
  explanation?: string;
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

  /** Optimized bullet with keywords and metrics (alias to suggested_full for backward compat) */
  suggested: string;

  /** Metrics or quantification added (e.g., ["30%", "5 engineers"]) */
  metrics_added: string[];

  /** Keywords from JD incorporated into this bullet */
  keywords_incorporated: string[];

  /** Estimated ATS score improvement for this bullet (0-100) - used for section totals */
  point_value?: number;

  /** Impact tier for display (replaces point_value for individual display) */
  impact?: ImpactTier;

  /** Story 14.1: 1-2 sentence explanation of why this change helps */
  explanation?: string;

  // Dual-length suggestions (Phase 2: Experience bullets)
  /** Quick edit version - matches original length ±25%, highest-impact changes only */
  suggested_compact?: string;
  /** Full rewrite version - comprehensive optimization */
  suggested_full?: string;
  /** Word count of original bullet */
  original_word_count?: number;
  /** Word count of compact version */
  compact_word_count?: number;
  /** Word count of full version */
  full_word_count?: number;

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

  /** Story 14.1: 1-2 sentence explanation of why these experience changes help */
  explanation?: string;
}

// ============================================================================
// EDUCATION SUGGESTION TYPES
// ============================================================================

/**
 * Individual education bullet suggestion
 * For coursework, projects, achievements, etc.
 */
export interface EducationBulletSuggestion {
  /** Original bullet text (or empty if new suggestion) */
  original: string;

  /** Optimized/suggested bullet with keywords */
  suggested: string;

  /** Keywords from JD incorporated into this bullet */
  keywords_incorporated: string[];

  /** Estimated ATS score improvement for this bullet (0-10) - used for section totals */
  point_value?: number;

  /** Impact tier for display (replaces point_value for individual display) */
  impact?: ImpactTier;

  /** Brief explanation of why this suggestion helps */
  explanation?: string;

  // Story 12.1: Judge fields (matching BulletSuggestion pattern)
  judge_score?: number; // Quality score from LLM judge (0-100)
  judge_passed?: boolean; // Whether suggestion passed validation
  judge_reasoning?: string; // Brief explanation of the score
  judge_criteria?: JudgeCriteriaScores; // Breakdown by criteria
}

/**
 * Individual education entry (degree/institution)
 */
export interface EducationEntry {
  /** Institution name */
  institution: string;

  /** Degree/certification (e.g., "B.S. Computer Science") */
  degree: string;

  /** Dates (e.g., "2020 - 2024" or "Expected May 2025") */
  dates: string;

  /** GPA if present */
  gpa?: string;

  /** Original bullets/details from resume */
  original_bullets: string[];

  /** Suggested optimizations for this entry */
  suggested_bullets: EducationBulletSuggestion[];
}

/**
 * Education optimization suggestion
 * Critical for co-op/internship candidates where education is primary credential
 */
export interface EducationSuggestion {
  /** User's original education section text */
  original: string;

  /** Array of education entries with suggestions */
  education_entries: EducationEntry[];

  /** Keywords from JD that match education (coursework, degree, etc.) */
  matched_keywords: string[];

  /** Relevant coursework to highlight based on JD */
  relevant_coursework: string[];

  /** Summary of the optimization */
  summary: string;

  /** Total estimated point value improvement */
  total_point_value?: number;

  /** Explanation of why these education changes help */
  explanation?: string;
}

// ============================================================================
// PROJECTS SUGGESTION TYPES (Story 18.5)
// ============================================================================

/**
 * Individual project bullet suggestion
 * For project descriptions, achievements, and technical details
 */
export interface ProjectBulletSuggestion {
  /** Original bullet text (or empty if new suggestion) */
  original: string;

  /** Optimized bullet with keywords and metrics (alias to suggested_full for backward compat) */
  suggested: string;

  /** Metrics or quantification added (e.g., ["1000 users", "3 month project"]) */
  metrics_added: string[];

  /** Keywords from JD incorporated into this bullet */
  keywords_incorporated: string[];

  /** Estimated ATS score improvement for this bullet (0-100) - used for section totals */
  point_value?: number;

  /** Impact tier for display (replaces point_value for individual display) */
  impact?: ImpactTier;

  /** 1-2 sentence explanation of why this change helps */
  explanation?: string;

  // Dual-length suggestions (matching experience pattern)
  /** Quick edit version - matches original length ±25%, highest-impact changes only */
  suggested_compact?: string;
  /** Full rewrite version - comprehensive optimization */
  suggested_full?: string;
  /** Word count of original bullet */
  original_word_count?: number;
  /** Word count of compact version */
  compact_word_count?: number;
  /** Word count of full version */
  full_word_count?: number;

  // Judge fields (optional for backward compatibility)
  judge_score?: number; // Quality score from LLM judge (0-100)
  judge_passed?: boolean; // Whether suggestion passed validation
  judge_reasoning?: string; // Brief explanation of the score
  judge_criteria?: JudgeCriteriaScores; // Breakdown by criteria
}

/**
 * Individual project entry
 */
export interface ProjectEntry {
  /** Project name/title */
  title: string;

  /** Technologies used in the project */
  technologies: string[];

  /** Date range or duration (e.g., "Spring 2024" or "3 months") */
  dates?: string;

  /** Original bullet points describing the project */
  original_bullets: string[];

  /** Suggested optimized bullets */
  suggested_bullets: ProjectBulletSuggestion[];
}

/**
 * Projects optimization suggestion
 * Critical for co-op/internship and career changers where projects demonstrate skills
 */
export interface ProjectsSuggestion {
  /** User's original projects section text */
  original: string;

  /** Array of project entries with suggestions */
  project_entries: ProjectEntry[];

  /** Total estimated point value improvement */
  total_point_value?: number;

  /** Explanation of why these project changes help */
  explanation?: string;

  /** Optional heading suggestion (e.g., "Project Experience" for co-op candidates) */
  heading_suggestion?: string;

  /** Summary of the optimization */
  summary: string;
}

// ============================================================================
// STRUCTURAL SUGGESTION TYPES (Story 18.3)
// ============================================================================

/**
 * Structural suggestion for resume section ordering and organization.
 * Generated by deterministic rules engine (no LLM).
 */
export interface StructuralSuggestion {
  /** Unique rule identifier (e.g., "rule-coop-exp-before-edu") */
  id: string;
  /** Suggestion priority */
  priority: 'critical' | 'high' | 'moderate';
  /** Category of structural issue */
  category: 'section_order' | 'section_heading' | 'section_presence';
  /** Human-readable suggestion message */
  message: string;
  /** Description of current state (what's wrong) */
  currentState: string;
  /** What the user should do */
  recommendedAction: string;
}
