/**
 * Keyword Scoring for ATS V2 and V2.1
 *
 * V2 Calculates weighted keyword score based on:
 * - Importance level (high/medium/low)
 * - Match type (exact/fuzzy/semantic)
 * - Penalties for missing high-importance keywords
 *
 * V2.1 Adds:
 * - Required vs preferred keyword distinction
 * - Placement weighting (skills section > experience paragraph)
 * - Separate required penalty and preferred bonus
 */

import type { KeywordAnalysisResult, MatchedKeyword, ExtractedKeyword } from '@/types/analysis';
import type { KeywordScoreResult, KeywordMatchV21, KeywordScoreResultV21, PlacementLocation } from './types';
import {
  IMPORTANCE_WEIGHTS,
  MATCH_TYPE_WEIGHTS,
  MISSING_HIGH_PENALTY,
  MIN_PENALTY_MULTIPLIER,
  MISSING_REQUIRED_PENALTY,
  PREFERRED_BONUS_CAP,
  PLACEMENT_WEIGHTS,
} from './constants';

/**
 * Get importance weight for a keyword
 *
 * Looks up the keyword in the original extracted list to find importance,
 * since matched keywords may not include this field.
 */
function getImportanceWeight(
  keyword: string,
  extractedKeywords: ExtractedKeyword[]
): number {
  const extracted = extractedKeywords.find(
    k => k.keyword.toLowerCase() === keyword.toLowerCase()
  );
  if (!extracted) return IMPORTANCE_WEIGHTS.medium; // Default to medium

  return IMPORTANCE_WEIGHTS[extracted.importance] ?? IMPORTANCE_WEIGHTS.medium;
}

/**
 * Get match type weight for a matched keyword
 */
function getMatchTypeWeight(matchType: 'exact' | 'fuzzy' | 'semantic'): number {
  return MATCH_TYPE_WEIGHTS[matchType] ?? MATCH_TYPE_WEIGHTS.semantic;
}

/**
 * Calculate the weighted score for matched keywords
 *
 * Formula:
 * For each matched keyword: importance_weight × match_type_weight
 * Sum all weighted scores
 * Divide by max possible score (all keywords matched exactly)
 */
function calculateWeightedMatchScore(
  matched: MatchedKeyword[],
  allKeywords: ExtractedKeyword[]
): number {
  if (allKeywords.length === 0) return 0;

  // Calculate max possible score (all keywords matched exactly with high importance)
  let maxScore = 0;
  for (const keyword of allKeywords) {
    const importanceWeight = IMPORTANCE_WEIGHTS[keyword.importance] ?? IMPORTANCE_WEIGHTS.medium;
    maxScore += importanceWeight * MATCH_TYPE_WEIGHTS.exact;
  }

  if (maxScore === 0) return 0;

  // Calculate actual weighted score
  let actualScore = 0;
  for (const match of matched) {
    const importanceWeight = getImportanceWeight(match.keyword, allKeywords);
    const matchTypeWeight = getMatchTypeWeight(match.matchType);
    actualScore += importanceWeight * matchTypeWeight;
  }

  // Return as percentage
  return (actualScore / maxScore) * 100;
}

/**
 * Count missing high-importance keywords
 */
function countMissingHighImportance(missing: ExtractedKeyword[]): number {
  return missing.filter(k => k.importance === 'high').length;
}

/**
 * Apply penalty for missing high-importance keywords
 *
 * Each missing high-importance keyword reduces the score by MISSING_HIGH_PENALTY
 * Score cannot go below MIN_PENALTY_MULTIPLIER of original
 */
function applyMissingPenalty(score: number, missingHighCount: number): {
  penalizedScore: number;
  penaltyApplied: number;
} {
  if (missingHighCount === 0) {
    return { penalizedScore: score, penaltyApplied: 0 };
  }

  const penaltyPercent = missingHighCount * MISSING_HIGH_PENALTY;
  const multiplier = Math.max(1 - penaltyPercent, MIN_PENALTY_MULTIPLIER);
  const penalizedScore = score * multiplier;
  const penaltyApplied = score - penalizedScore;

  return { penalizedScore, penaltyApplied };
}

/**
 * Calculate keyword score for ATS V2
 *
 * Algorithm:
 * 1. Calculate weighted match score considering importance and match type
 * 2. Count missing high-importance keywords
 * 3. Apply penalty for missing high-importance keywords
 * 4. Return final score and breakdown
 *
 * @param keywordAnalysis - Results from keyword matching
 * @returns KeywordScoreResult with score and breakdown
 */
export function calculateKeywordScore(
  keywordAnalysis: KeywordAnalysisResult
): KeywordScoreResult {
  const { matched, missing } = keywordAnalysis;

  // Reconstruct all keywords from matched + missing for importance lookup
  const allKeywords: ExtractedKeyword[] = [
    ...matched.map(m => ({
      keyword: m.keyword,
      category: m.category,
      importance: 'medium' as const, // Will be looked up from missing if available
    })),
    ...missing,
  ];

  // Update matched keywords with correct importance from missing list
  // (since matchKeywords returns matches without importance)
  for (const match of matched) {
    const original = missing.find(
      k => k.keyword.toLowerCase() === match.keyword.toLowerCase()
    );
    if (original) {
      const idx = allKeywords.findIndex(
        k => k.keyword.toLowerCase() === match.keyword.toLowerCase()
      );
      if (idx >= 0) {
        allKeywords[idx].importance = original.importance;
      }
    }
  }

  // Calculate weighted match score
  const weightedMatchScore = calculateWeightedMatchScore(matched, allKeywords);

  // Count missing high-importance keywords
  const missingHighImportance = countMissingHighImportance(missing);

  // Apply penalty
  const { penalizedScore, penaltyApplied } = applyMissingPenalty(
    weightedMatchScore,
    missingHighImportance
  );

  // Round final score
  const finalScore = Math.round(Math.max(0, Math.min(100, penalizedScore)));

  return {
    score: finalScore,
    matchedCount: matched.length,
    totalCount: matched.length + missing.length,
    weightedMatchScore: Math.round(weightedMatchScore),
    missingHighImportance,
    penaltyApplied: Math.round(penaltyApplied),
  };
}

/**
 * Generate action items for keyword improvements
 *
 * @param keywordAnalysis - Results from keyword matching
 * @returns Array of actionable suggestions
 */
export function generateKeywordActionItems(
  keywordAnalysis: KeywordAnalysisResult
): string[] {
  const actionItems: string[] = [];
  const { missing, matched } = keywordAnalysis;

  // High-priority: Missing high-importance keywords
  const missingHigh = missing.filter(k => k.importance === 'high');
  if (missingHigh.length > 0) {
    const keywords = missingHigh.slice(0, 3).map(k => k.keyword).join(', ');
    actionItems.push(`Add critical keywords: ${keywords}`);
  }

  // Medium-priority: Missing medium-importance keywords
  const missingMedium = missing.filter(k => k.importance === 'medium');
  if (missingMedium.length > 0) {
    const keywords = missingMedium.slice(0, 3).map(k => k.keyword).join(', ');
    actionItems.push(`Consider adding: ${keywords}`);
  }

  // Upgrade semantic matches to exact matches
  const semanticMatches = matched.filter(m => m.matchType === 'semantic');
  if (semanticMatches.length > 0) {
    const keywords = semanticMatches.slice(0, 2).map(k => k.keyword).join(', ');
    actionItems.push(`Use exact terminology for: ${keywords}`);
  }

  return actionItems;
}

// ============================================================================
// V2.1 KEYWORD SCORING
// ============================================================================

/**
 * Get placement weight for a keyword match
 */
function getPlacementWeight(placement?: PlacementLocation): number {
  if (!placement) return PLACEMENT_WEIGHTS.other;
  return PLACEMENT_WEIGHTS[placement] ?? PLACEMENT_WEIGHTS.other;
}

/**
 * Calculate keyword score for ATS V2.1
 *
 * Algorithm:
 * 1. Separate keywords into required and preferred
 * 2. Calculate required score with placement weighting
 * 3. Apply penalty for missing required keywords (12% each, floor 30%)
 * 4. Calculate preferred bonus (capped at 25%)
 * 5. Combine: (required × penalty) + preferred bonus
 *
 * @param keywords - Array of KeywordMatchV21 with requirement and placement
 * @returns KeywordScoreResultV21 with score and detailed breakdown
 */
export function calculateKeywordScoreV21(
  keywords: KeywordMatchV21[]
): KeywordScoreResultV21 {
  // Separate required vs preferred
  const requiredKeywords = keywords.filter((k) => k.requirement === 'required');
  const preferredKeywords = keywords.filter((k) => k.requirement === 'preferred');

  // === REQUIRED KEYWORDS (base score) ===
  let requiredAchieved = 0;
  let requiredPossible = 0;
  let missingRequiredCount = 0;
  const matchedRequired: KeywordMatchV21[] = [];
  const missingRequired: string[] = [];

  for (const kw of requiredKeywords) {
    const importanceWeight = IMPORTANCE_WEIGHTS[kw.importance] ?? IMPORTANCE_WEIGHTS.medium;
    requiredPossible += importanceWeight;

    if (kw.found && kw.matchType && kw.placement) {
      const matchWeight = MATCH_TYPE_WEIGHTS[kw.matchType];
      const placementWeight = getPlacementWeight(kw.placement);
      requiredAchieved += importanceWeight * matchWeight * placementWeight;
      matchedRequired.push(kw);
    } else if (kw.found && kw.matchType) {
      // Found but no placement info - use default placement weight
      const matchWeight = MATCH_TYPE_WEIGHTS[kw.matchType];
      requiredAchieved += importanceWeight * matchWeight * PLACEMENT_WEIGHTS.other;
      matchedRequired.push(kw);
    } else {
      missingRequired.push(kw.keyword);
      missingRequiredCount++;
    }
  }

  const requiredScore = requiredPossible > 0 ? requiredAchieved / requiredPossible : 1;

  // === PENALTY FOR MISSING REQUIRED ===
  // Each missing required keyword reduces the score ceiling
  const penaltyMultiplier = Math.max(
    MIN_PENALTY_MULTIPLIER,
    1 - missingRequiredCount * MISSING_REQUIRED_PENALTY
  );

  // === PREFERRED KEYWORDS (bonus) ===
  let preferredAchieved = 0;
  let preferredPossible = 0;
  const matchedPreferred: KeywordMatchV21[] = [];
  const missingPreferred: string[] = [];

  for (const kw of preferredKeywords) {
    const importanceWeight = IMPORTANCE_WEIGHTS[kw.importance] ?? IMPORTANCE_WEIGHTS.medium;
    preferredPossible += importanceWeight;

    if (kw.found && kw.matchType) {
      const matchWeight = MATCH_TYPE_WEIGHTS[kw.matchType];
      const placementWeight = getPlacementWeight(kw.placement);
      preferredAchieved += importanceWeight * matchWeight * placementWeight;
      matchedPreferred.push(kw);
    } else {
      missingPreferred.push(kw.keyword);
    }
  }

  // Preferred keywords contribute a bonus (capped at PREFERRED_BONUS_CAP)
  const preferredRatio = preferredPossible > 0 ? preferredAchieved / preferredPossible : 0;
  const preferredBonus = preferredRatio * PREFERRED_BONUS_CAP;

  // === FINAL SCORE ===
  // Base score from required, multiplied by penalty, plus preferred bonus
  const baseScore = requiredScore * penaltyMultiplier;
  const finalScore = Math.min(1, baseScore + preferredBonus);

  return {
    score: Math.round(finalScore * 100),
    breakdown: {
      requiredScore: Math.round(requiredScore * 100) / 100,
      preferredBonus: Math.round(preferredBonus * 100) / 100,
      penaltyMultiplier: Math.round(penaltyMultiplier * 100) / 100,
      missingRequiredCount,
      missingPreferredCount: missingPreferred.length,
    },
    details: {
      matchedRequired,
      matchedPreferred,
      missingRequired,
      missingPreferred,
    },
  };
}

/**
 * Generate action items for keyword improvements (V2.1)
 *
 * @param result - V2.1 keyword score result
 * @returns Array of actionable suggestions with priorities
 */
export function generateKeywordActionItemsV21(
  result: KeywordScoreResultV21
): { priority: 'critical' | 'high' | 'medium'; message: string }[] {
  const actionItems: { priority: 'critical' | 'high' | 'medium'; message: string }[] = [];

  // Critical: Missing required keywords
  if (result.details.missingRequired.length > 0) {
    const keywords = result.details.missingRequired.slice(0, 4).join(', ');
    actionItems.push({
      priority: 'critical',
      message: `Add missing REQUIRED keywords: ${keywords}`,
    });
  }

  // High: Semantic matches that should be exact
  const semanticRequired = result.details.matchedRequired.filter(
    (m) => m.matchType === 'semantic'
  );
  if (semanticRequired.length > 0) {
    const keywords = semanticRequired.slice(0, 2).map((k) => k.keyword).join(', ');
    actionItems.push({
      priority: 'high',
      message: `Use exact terminology for required skills: ${keywords}`,
    });
  }

  // Medium: Missing preferred keywords
  if (result.details.missingPreferred.length > 3) {
    const keywords = result.details.missingPreferred.slice(0, 3).join(', ');
    actionItems.push({
      priority: 'medium',
      message: `Consider adding preferred keywords: ${keywords}`,
    });
  }

  return actionItems;
}
