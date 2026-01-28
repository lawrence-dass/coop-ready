/**
 * Score Calculation Utilities
 * Story 11.3: Implement Score Comparison
 *
 * Provides utilities for calculating projected ATS scores based on suggestions.
 */

import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
} from '@/types/suggestions';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * All suggestion types combined for score calculation
 */
export interface AllSuggestions {
  summary: SummarySuggestion | null;
  skills: SkillsSuggestion | null;
  experience: ExperienceSuggestion | null;
}

/**
 * Contribution breakdown by category
 */
export interface CategoryDeltas {
  summary: number;
  skills: number;
  experience: number;
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate projected ATS score based on original score and suggestions
 *
 * Algorithm:
 * - Start with original score
 * - Add point values from all suggestion categories
 * - Cap final score at 100 (cannot exceed perfect score)
 *
 * @param originalScore - Original ATS score (0-100)
 * @param suggestions - All available suggestions
 * @returns Projected score (0-100), capped at 100
 *
 * @example
 * ```typescript
 * const originalScore = 72;
 * const suggestions = {
 *   summary: { point_value: 5, ... },
 *   skills: { total_point_value: 12, ... },
 *   experience: { total_point_value: 18, ... }
 * };
 * const projected = calculateProjectedScore(originalScore, suggestions);
 * // Returns: 100 (72 + 5 + 12 + 18 = 107, capped at 100)
 * ```
 */
export function calculateProjectedScore(
  originalScore: number,
  suggestions: AllSuggestions
): number {
  // Calculate point values from each section
  const summaryPoints =
    suggestions.summary?.point_value ?? 0;
  const skillsPoints =
    suggestions.skills?.total_point_value ?? 0;

  // Experience points: use total_point_value if available, otherwise sum bullets
  let experiencePoints = 0;
  if (suggestions.experience?.total_point_value !== undefined) {
    experiencePoints = suggestions.experience.total_point_value;
  } else if (suggestions.experience?.experience_entries) {
    // Fallback: sum individual bullet point values
    suggestions.experience.experience_entries.forEach((entry) => {
      entry.suggested_bullets.forEach((bullet) => {
        experiencePoints += bullet.point_value ?? 0;
      });
    });
  }

  // Calculate total improvement
  const totalImprovement = summaryPoints + skillsPoints + experiencePoints;

  // Calculate projected score (capped at 100, floored at original)
  const projectedScore = Math.min(100, Math.max(originalScore, originalScore + totalImprovement));

  return projectedScore;
}

/**
 * Calculate the delta (improvement) between original and projected scores
 *
 * @param originalScore - Original ATS score (0-100)
 * @param projectedScore - Projected ATS score (0-100)
 * @returns Score improvement (can be 0 or positive)
 *
 * @example
 * ```typescript
 * const delta = calculateScoreDelta(72, 100);
 * // Returns: 28
 * ```
 */
export function calculateScoreDelta(
  originalScore: number,
  projectedScore: number
): number {
  return projectedScore - originalScore;
}

/**
 * Calculate contribution to score improvement from each suggestion category
 *
 * @param suggestions - All available suggestions
 * @returns Object with point values from each category
 *
 * @example
 * ```typescript
 * const deltas = calculateCategoryDeltas(suggestions);
 * // Returns: { summary: 5, skills: 12, experience: 18 }
 * ```
 */
export function calculateCategoryDeltas(
  suggestions: AllSuggestions
): CategoryDeltas {
  // Summary contribution
  const summary = suggestions.summary?.point_value ?? 0;

  // Skills contribution
  const skills = suggestions.skills?.total_point_value ?? 0;

  // Experience contribution
  let experience = 0;
  if (suggestions.experience?.total_point_value !== undefined) {
    experience = suggestions.experience.total_point_value;
  } else if (suggestions.experience?.experience_entries) {
    // Fallback: sum individual bullet point values
    suggestions.experience.experience_entries.forEach((entry) => {
      entry.suggested_bullets.forEach((bullet) => {
        experience += bullet.point_value ?? 0;
      });
    });
  }

  return {
    summary,
    skills,
    experience,
  };
}
