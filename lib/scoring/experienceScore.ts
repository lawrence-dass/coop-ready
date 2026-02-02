/**
 * Experience Scoring for ATS V2
 *
 * Evaluates the quality of experience bullets based on:
 * - Quantification (35%): Bullets with metrics/numbers
 * - Action Verbs (30%): Strong vs weak first words
 * - Keyword Density (35%): JD keywords in bullets
 */

import type { ExperienceScoreResult, ExtractedBullet, BulletExtractionResult } from './types';
import { EXPERIENCE_WEIGHTS, STRONG_ACTION_VERBS, WEAK_ACTION_VERBS } from './constants';
import { extractBullets } from './bulletExtraction';

/**
 * Calculate quantification score based on bullets with metrics
 *
 * Target: At least 50% of bullets should have quantified achievements
 * Scoring:
 * - 50%+ bullets with metrics = 100
 * - 25-50% = 50-100 (linear)
 * - 0-25% = 0-50 (linear)
 */
function calculateQuantificationScore(bullets: ExtractedBullet[]): {
  score: number;
  bulletsWithMetrics: number;
} {
  if (bullets.length === 0) {
    return { score: 0, bulletsWithMetrics: 0 };
  }

  const bulletsWithMetrics = bullets.filter(b => b.hasMetric).length;
  const metricRate = bulletsWithMetrics / bullets.length;

  let score: number;
  if (metricRate >= 0.5) {
    score = 100;
  } else if (metricRate >= 0.25) {
    // Linear from 50 to 100 as rate goes from 0.25 to 0.5
    score = 50 + ((metricRate - 0.25) / 0.25) * 50;
  } else {
    // Linear from 0 to 50 as rate goes from 0 to 0.25
    score = (metricRate / 0.25) * 50;
  }

  return {
    score: Math.round(score),
    bulletsWithMetrics,
  };
}

/**
 * Calculate action verb score based on verb quality
 *
 * Scoring:
 * - Strong verbs: +1 point each
 * - Weak verbs: -0.5 points each
 * - Neutral verbs: 0 points
 *
 * Final score normalized to 0-100 based on proportion of strong verbs
 */
function calculateActionVerbScore(bullets: ExtractedBullet[]): {
  score: number;
  strongVerbCount: number;
  weakVerbCount: number;
} {
  if (bullets.length === 0) {
    return { score: 0, strongVerbCount: 0, weakVerbCount: 0 };
  }

  let strongVerbCount = 0;
  let weakVerbCount = 0;

  for (const bullet of bullets) {
    const firstWord = bullet.firstWord.toLowerCase();
    if (STRONG_ACTION_VERBS.has(firstWord)) {
      strongVerbCount++;
    } else if (WEAK_ACTION_VERBS.has(firstWord)) {
      weakVerbCount++;
    }
  }

  // Calculate score based on proportion
  // Target: 70%+ strong verbs = 100
  // Penalty for weak verbs
  const strongRate = strongVerbCount / bullets.length;
  const weakRate = weakVerbCount / bullets.length;

  let score: number;
  if (strongRate >= 0.7) {
    score = 100;
  } else if (strongRate >= 0.4) {
    // Linear from 50 to 100 as rate goes from 0.4 to 0.7
    score = 50 + ((strongRate - 0.4) / 0.3) * 50;
  } else {
    // Linear from 0 to 50 as rate goes from 0 to 0.4
    score = (strongRate / 0.4) * 50;
  }

  // Apply penalty for weak verbs (up to 20 points)
  const weakPenalty = Math.min(weakRate * 40, 20);
  score = Math.max(0, score - weakPenalty);

  return {
    score: Math.round(score),
    strongVerbCount,
    weakVerbCount,
  };
}

/**
 * Calculate keyword density score based on JD keywords in bullets
 *
 * Measures how well the experience section incorporates relevant keywords
 * Target: Average 2+ keywords per bullet = 100
 */
function calculateKeywordDensityScore(bullets: ExtractedBullet[]): number {
  if (bullets.length === 0) {
    return 0;
  }

  // Count total keywords across all bullets
  const totalKeywords = bullets.reduce(
    (sum, bullet) => sum + bullet.keywords.length,
    0
  );

  // Calculate average keywords per bullet
  const avgKeywordsPerBullet = totalKeywords / bullets.length;

  // Score based on density
  // 2+ keywords per bullet = 100
  // 1-2 keywords = 50-100
  // 0-1 keywords = 0-50
  let score: number;
  if (avgKeywordsPerBullet >= 2) {
    score = 100;
  } else if (avgKeywordsPerBullet >= 1) {
    score = 50 + (avgKeywordsPerBullet - 1) * 50;
  } else {
    score = avgKeywordsPerBullet * 50;
  }

  return Math.round(score);
}

/**
 * Calculate a baseline experience score when bullet detection fails
 * Uses text analysis to provide a non-zero score
 */
function calculateBaselineScore(
  resumeText: string,
  jdKeywords: string[]
): ExperienceScoreResult {
  // Return zero for truly empty/minimal text
  if (!resumeText || resumeText.trim().length < 50) {
    return {
      score: 0,
      quantificationScore: 0,
      actionVerbScore: 0,
      keywordDensityScore: 0,
      bulletCount: 0,
      bulletsWithMetrics: 0,
      strongVerbCount: 0,
      weakVerbCount: 0,
    };
  }

  const lowerText = resumeText.toLowerCase();

  // Check for presence of metrics in raw text
  let metricsFound = 0;
  if (lowerText.match(/\d+%/)) metricsFound++;
  if (lowerText.match(/\$[\d,]+/)) metricsFound++;
  if (lowerText.match(/\d+\s*(users?|customers?|clients?)/i)) metricsFound++;
  if (lowerText.match(/\d+x\s/i)) metricsFound++;

  // Check for strong verbs anywhere in text
  let strongVerbsFound = 0;
  for (const verb of STRONG_ACTION_VERBS) {
    if (lowerText.includes(verb)) strongVerbsFound++;
    if (strongVerbsFound >= 5) break;
  }

  // Check for keywords in text
  let keywordsFound = 0;
  for (const keyword of jdKeywords) {
    if (lowerText.includes(keyword.toLowerCase())) keywordsFound++;
  }

  // Calculate baseline scores (lower than bullet-based, but non-zero)
  const baseQuantificationScore = Math.min(40, metricsFound * 15);
  const baseVerbScore = Math.min(40, strongVerbsFound * 10);
  const baseKeywordScore = jdKeywords.length > 0
    ? Math.min(50, (keywordsFound / jdKeywords.length) * 60)
    : 30;

  const overallScore =
    baseQuantificationScore * EXPERIENCE_WEIGHTS.quantification +
    baseVerbScore * EXPERIENCE_WEIGHTS.actionVerbs +
    baseKeywordScore * EXPERIENCE_WEIGHTS.keywordDensity;

  return {
    score: Math.round(overallScore),
    quantificationScore: baseQuantificationScore,
    actionVerbScore: baseVerbScore,
    keywordDensityScore: Math.round(baseKeywordScore),
    bulletCount: 0,
    bulletsWithMetrics: 0,
    strongVerbCount: strongVerbsFound,
    weakVerbCount: 0,
  };
}

/**
 * Calculate experience score for ATS V2
 *
 * Combines three sub-scores with weights:
 * - Quantification: 35%
 * - Action Verbs: 30%
 * - Keyword Density: 35%
 *
 * @param resumeText - Raw resume text for bullet extraction
 * @param jdKeywords - Keywords from job description
 * @returns ExperienceScoreResult with score and breakdown
 */
export function calculateExperienceScore(
  resumeText: string,
  jdKeywords: string[]
): ExperienceScoreResult {
  // Extract bullets from resume
  const extraction = extractBullets(resumeText, jdKeywords);
  const { bullets } = extraction;

  // If no bullets found, use baseline scoring
  if (bullets.length === 0) {
    return calculateBaselineScore(resumeText, jdKeywords);
  }

  // Calculate sub-scores
  const { score: quantificationScore, bulletsWithMetrics } =
    calculateQuantificationScore(bullets);

  const { score: actionVerbScore, strongVerbCount, weakVerbCount } =
    calculateActionVerbScore(bullets);

  const keywordDensityScore = calculateKeywordDensityScore(bullets);

  // Calculate weighted overall score
  const overallScore =
    quantificationScore * EXPERIENCE_WEIGHTS.quantification +
    actionVerbScore * EXPERIENCE_WEIGHTS.actionVerbs +
    keywordDensityScore * EXPERIENCE_WEIGHTS.keywordDensity;

  return {
    score: Math.round(overallScore),
    quantificationScore,
    actionVerbScore,
    keywordDensityScore,
    bulletCount: bullets.length,
    bulletsWithMetrics,
    strongVerbCount,
    weakVerbCount,
  };
}

/**
 * Generate action items for experience section improvements
 *
 * @param result - Experience score result
 * @returns Array of actionable suggestions
 */
export function generateExperienceActionItems(
  result: ExperienceScoreResult
): string[] {
  const actionItems: string[] = [];

  // Low quantification
  if (result.quantificationScore < 60) {
    const needed = Math.max(1, Math.ceil(result.bulletCount * 0.5) - result.bulletsWithMetrics);
    actionItems.push(`Add metrics to ${needed} more bullet points (e.g., percentages, dollar amounts, team sizes)`);
  }

  // Weak action verbs
  if (result.actionVerbScore < 60 && result.weakVerbCount > 0) {
    actionItems.push(`Replace ${result.weakVerbCount} weak verbs (helped, assisted) with stronger alternatives (led, drove, built)`);
  }

  // Low keyword density
  if (result.keywordDensityScore < 50) {
    actionItems.push('Incorporate more job description keywords into your experience bullets');
  }

  // Low bullet count
  if (result.bulletCount < 8) {
    actionItems.push('Add more detailed accomplishments to your experience section');
  }

  return actionItems;
}
