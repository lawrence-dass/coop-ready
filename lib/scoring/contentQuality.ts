/**
 * Content Quality Scoring for ATS V2.1
 *
 * Evaluates ALL bullet-point content across experience, projects, and education:
 * - Quantification (35%): Quality tiers (high/medium/low)
 * - Action Verbs (30%): Strong vs weak with penalties
 * - Keyword Density (35%): JD keywords in bullets
 *
 * Key differences from V2 experienceScore:
 * - Evaluates all bullets, not just experience
 * - Quality tiers for quantification (not just presence)
 * - Weak verb penalties (not just strong verb bonuses)
 * - Job-type-aware expectations (co-op vs full-time)
 */

import type {
  ContentQualityResult,
  QuantificationTier,
  QuantificationMatch,
  JobType,
} from './types';
import {
  STRONG_ACTION_VERBS,
  WEAK_ACTION_VERBS_V21,
  WEAK_VERB_PHRASES,
  MODERATE_ACTION_VERBS,
  QUANTIFICATION_PATTERNS_V21,
  CONTENT_QUALITY_WEIGHTS,
} from './constants';

/**
 * Input for content quality calculation
 */
export interface ContentQualityInput {
  /** ALL bullet-point content combined */
  bullets: string[];
  /** Source tracking for weighting */
  bulletSources: {
    experience: number;
    projects: number;
    education: number;
  };
  /** JD keywords for density check */
  jdKeywords: string[];
  /** Job type affects verb expectations */
  jobType: JobType;
}

/**
 * Extract quantification matches with quality tiers from text
 */
export function extractQuantifications(text: string): QuantificationMatch[] {
  const matches: QuantificationMatch[] = [];

  for (const { pattern, tier, type } of QUANTIFICATION_PATTERNS_V21) {
    const found = text.match(pattern);
    if (found) {
      matches.push({ text: found[0], tier, type });
    }
  }

  return matches;
}

/**
 * Get the best (highest) tier from a list of quantification matches
 */
function getBestTier(matches: QuantificationMatch[]): QuantificationTier {
  const tierOrder: Record<QuantificationTier, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  return matches.reduce((best, m) => {
    return tierOrder[m.tier] > tierOrder[best] ? m.tier : best;
  }, 'low' as QuantificationTier);
}

/**
 * Classify an action verb's strength
 */
type VerbStrength = 'strong' | 'moderate' | 'weak' | 'unknown';

export function classifyActionVerb(bullet: string): VerbStrength {
  const trimmed = bullet.trim().toLowerCase();

  // Check multi-word phrases first
  for (const phrase of WEAK_VERB_PHRASES) {
    if (trimmed.startsWith(phrase)) {
      return 'weak';
    }
  }

  // Get first word
  const words = trimmed.split(/\s+/);
  const firstWord = words[0]?.replace(/[^a-z]/g, '');

  if (!firstWord) return 'unknown';

  // Check single word categories
  if (STRONG_ACTION_VERBS.has(firstWord)) return 'strong';
  if (MODERATE_ACTION_VERBS.has(firstWord)) return 'moderate';
  if (WEAK_ACTION_VERBS_V21.has(firstWord)) return 'weak';

  return 'unknown';
}

/**
 * Calculate quantification score with quality tiers
 *
 * Weights both coverage (how many bullets have metrics) and
 * quality (tier of metrics)
 */
function calculateQuantificationScore(bullets: string[]): {
  score: number;
  bulletsWithMetrics: number;
  highTierMetrics: number;
  mediumTierMetrics: number;
  lowTierMetrics: number;
} {
  if (bullets.length === 0) {
    return {
      score: 0,
      bulletsWithMetrics: 0,
      highTierMetrics: 0,
      mediumTierMetrics: 0,
      lowTierMetrics: 0,
    };
  }

  let quantificationPoints = 0;
  let bulletsWithMetrics = 0;
  let highTierMetrics = 0;
  let mediumTierMetrics = 0;
  let lowTierMetrics = 0;

  for (const bullet of bullets) {
    const quants = extractQuantifications(bullet);
    if (quants.length > 0) {
      bulletsWithMetrics++;
      const bestTier = getBestTier(quants);

      if (bestTier === 'high') {
        quantificationPoints += 1.0;
        highTierMetrics++;
      } else if (bestTier === 'medium') {
        quantificationPoints += 0.7;
        mediumTierMetrics++;
      } else {
        quantificationPoints += 0.4;
        lowTierMetrics++;
      }
    }
  }

  // Score based on both coverage and quality
  const quantCoverage = bulletsWithMetrics / bullets.length;
  const quantQuality =
    bulletsWithMetrics > 0 ? quantificationPoints / bulletsWithMetrics : 0;
  const score = quantCoverage * 0.6 + quantQuality * 0.4;

  return {
    score: Math.round(score * 100),
    bulletsWithMetrics,
    highTierMetrics,
    mediumTierMetrics,
    lowTierMetrics,
  };
}

/**
 * Calculate action verb score with job-type awareness
 */
function calculateActionVerbScore(
  bullets: string[],
  jobType: JobType
): {
  score: number;
  strongVerbCount: number;
  moderateVerbCount: number;
  weakVerbCount: number;
} {
  if (bullets.length === 0) {
    return {
      score: 0,
      strongVerbCount: 0,
      moderateVerbCount: 0,
      weakVerbCount: 0,
    };
  }

  let strongVerbCount = 0;
  let moderateVerbCount = 0;
  let weakVerbCount = 0;

  for (const bullet of bullets) {
    const strength = classifyActionVerb(bullet);
    if (strength === 'strong') strongVerbCount++;
    else if (strength === 'moderate') moderateVerbCount++;
    else if (strength === 'weak') weakVerbCount++;
  }

  // Scoring depends on job type
  let score: number;

  if (jobType === 'coop') {
    // Co-op: moderate verbs are acceptable, weak verbs slight penalty
    const goodVerbs = strongVerbCount + moderateVerbCount;
    score = goodVerbs / bullets.length - weakVerbCount * 0.05;
  } else {
    // Full-time: strong verbs expected, moderate acceptable, weak penalized
    const verbPoints =
      strongVerbCount * 1.0 + moderateVerbCount * 0.6 - weakVerbCount * 0.2;
    score = verbPoints / bullets.length;
  }

  return {
    score: Math.round(Math.max(0, Math.min(1, score)) * 100),
    strongVerbCount,
    moderateVerbCount,
    weakVerbCount,
  };
}

/**
 * Calculate keyword density score
 */
function calculateKeywordDensityScore(
  bullets: string[],
  jdKeywords: string[]
): {
  score: number;
  keywordsFound: string[];
  keywordsMissing: string[];
} {
  if (bullets.length === 0 || jdKeywords.length === 0) {
    return {
      score: jdKeywords.length === 0 ? 50 : 0,
      keywordsFound: [],
      keywordsMissing: jdKeywords,
    };
  }

  const allText = bullets.join(' ').toLowerCase();
  const keywordsFound: string[] = [];
  const keywordsMissing: string[] = [];

  for (const kw of jdKeywords) {
    if (allText.includes(kw.toLowerCase())) {
      keywordsFound.push(kw);
    } else {
      keywordsMissing.push(kw);
    }
  }

  // Expect ~50% keyword coverage in content for full score
  const score = Math.min(1, keywordsFound.length / jdKeywords.length / 0.5);

  return {
    score: Math.round(score * 100),
    keywordsFound,
    keywordsMissing,
  };
}

/**
 * Calculate content quality score for ATS V2.1
 *
 * Combines three sub-scores with weights:
 * - Quantification: 35% (with quality tiers)
 * - Action Verbs: 30% (with weak verb penalties)
 * - Keyword Density: 35%
 *
 * @param input - Content quality input with bullets, sources, and context
 * @returns ContentQualityResult with score and detailed breakdown
 */
export function calculateContentQuality(
  input: ContentQualityInput
): ContentQualityResult {
  const { bullets, jdKeywords, jobType } = input;

  if (bullets.length === 0) {
    return {
      score: 0,
      breakdown: {
        quantificationScore: 0,
        actionVerbScore: 0,
        keywordDensityScore: 0,
      },
      details: {
        totalBullets: 0,
        bulletsWithMetrics: 0,
        highTierMetrics: 0,
        mediumTierMetrics: 0,
        lowTierMetrics: 0,
        strongVerbCount: 0,
        moderateVerbCount: 0,
        weakVerbCount: 0,
        keywordsFound: [],
        keywordsMissing: jdKeywords,
      },
    };
  }

  // Calculate sub-scores
  const quantResult = calculateQuantificationScore(bullets);
  const verbResult = calculateActionVerbScore(bullets, jobType);
  const keywordResult = calculateKeywordDensityScore(bullets, jdKeywords);

  // Calculate weighted overall score
  const overallScore = Math.round(
    quantResult.score * CONTENT_QUALITY_WEIGHTS.quantification +
      verbResult.score * CONTENT_QUALITY_WEIGHTS.actionVerbs +
      keywordResult.score * CONTENT_QUALITY_WEIGHTS.keywordDensity
  );

  return {
    score: overallScore,
    breakdown: {
      quantificationScore: quantResult.score,
      actionVerbScore: verbResult.score,
      keywordDensityScore: keywordResult.score,
    },
    details: {
      totalBullets: bullets.length,
      bulletsWithMetrics: quantResult.bulletsWithMetrics,
      highTierMetrics: quantResult.highTierMetrics,
      mediumTierMetrics: quantResult.mediumTierMetrics,
      lowTierMetrics: quantResult.lowTierMetrics,
      strongVerbCount: verbResult.strongVerbCount,
      moderateVerbCount: verbResult.moderateVerbCount,
      weakVerbCount: verbResult.weakVerbCount,
      keywordsFound: keywordResult.keywordsFound,
      keywordsMissing: keywordResult.keywordsMissing,
    },
  };
}

/**
 * Generate action items for content quality improvements
 */
export function generateContentQualityActionItems(
  result: ContentQualityResult
): { priority: 'high' | 'medium' | 'low'; message: string }[] {
  const actionItems: { priority: 'high' | 'medium' | 'low'; message: string }[] = [];

  // High: Low quantification
  if (result.breakdown.quantificationScore < 40) {
    actionItems.push({
      priority: 'high',
      message: `Add metrics to bullets (only ${result.details.bulletsWithMetrics}/${result.details.totalBullets} have quantification)`,
    });
  }

  // High: Too many weak verbs
  if (result.details.weakVerbCount > result.details.strongVerbCount) {
    actionItems.push({
      priority: 'high',
      message: `Replace weak verbs ("Helped", "Worked on") with strong verbs ("Led", "Developed", "Built")`,
    });
  }

  // Medium: Could improve quantification quality
  if (
    result.details.lowTierMetrics > result.details.highTierMetrics &&
    result.details.bulletsWithMetrics > 0
  ) {
    actionItems.push({
      priority: 'medium',
      message: 'Upgrade metrics to higher-impact numbers ($, %, large scale)',
    });
  }

  // Low: Keyword density could be better
  if (result.breakdown.keywordDensityScore < 50) {
    actionItems.push({
      priority: 'low',
      message: 'Incorporate more JD keywords into your experience bullets',
    });
  }

  return actionItems;
}
