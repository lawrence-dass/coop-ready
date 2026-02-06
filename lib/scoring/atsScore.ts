/**
 * ATS Score V2 and V2.1 - Main Orchestrator
 *
 * Combines all component scorers to produce a deterministic ATS score.
 *
 * V2 Formula: (Keywords × 50%) + (Experience × 20%) + (Section × 15%) + (Format × 15%)
 * V2.1 Formula: (Keywords × 40%) + (QualificationFit × 15%) + (ContentQuality × 20%) + (Section × 15%) + (Format × 10%)
 *
 * (Weights may be adjusted based on role detection)
 */

import type { KeywordAnalysisResult } from '@/types/analysis';
import type {
  ATSScoreV2,
  ATSScoreV2Input,
  ScoreBreakdownV2,
  RoleDetectionResult,
  ATSScoreV21,
  ScoreBreakdownV21,
  KeywordMatchV21,
  JDQualifications,
  ResumeQualifications,
  ComponentWeightsV21,
  ActionItem,
  JobType,
  JobRole,
  SeniorityLevel,
  CandidateType,
} from './types';
import { getScoreTier } from './types';
import {
  ALGORITHM_VERSION,
  ALGORITHM_VERSION_V21,
  COMPONENT_WEIGHTS,
  COMPONENT_WEIGHTS_V21,
  ROLE_WEIGHT_ADJUSTMENTS,
} from './constants';
import { calculateKeywordScore, calculateKeywordScoreV21, generateKeywordActionItems, generateKeywordActionItemsV21 } from './keywordScore';
import { calculateExperienceScore, generateExperienceActionItems } from './experienceScore';
import { calculateSectionScore, calculateSectionScoreV21, generateSectionActionItems, generateSectionActionItemsV21 } from './sectionScore';
import { calculateFormatScore, calculateFormatScoreV21, generateFormatActionItems, generateFormatActionItemsV21 } from './formatScore';
import { calculateQualificationFit, generateQualificationActionItems } from './qualificationFit';
import { calculateContentQuality, generateContentQualityActionItems } from './contentQuality';
import { detectRole } from './roleDetection';

/**
 * Extract keyword strings from keyword analysis for density calculations
 */
function extractKeywordStrings(keywordAnalysis: KeywordAnalysisResult): string[] {
  return [
    ...keywordAnalysis.matched.map(m => m.keyword),
    ...keywordAnalysis.missing.map(m => m.keyword),
  ];
}

/**
 * Calculate overall score from component scores and weights
 */
function calculateOverallScore(
  breakdown: ScoreBreakdownV2,
  weights: RoleDetectionResult['weights']
): number {
  const overall =
    breakdown.keywords.score * weights.keywords +
    breakdown.experience.score * weights.experience +
    breakdown.sections.score * weights.sections +
    breakdown.format.score * weights.format;

  return Math.round(Math.max(0, Math.min(100, overall)));
}

/**
 * Generate action items from all component results
 *
 * Prioritizes items by impact and limits to most important
 */
function generateActionItems(
  keywordAnalysis: KeywordAnalysisResult,
  breakdown: ScoreBreakdownV2
): string[] {
  const allItems: string[] = [];

  // Add keyword action items (highest priority)
  allItems.push(...generateKeywordActionItems(keywordAnalysis));

  // Add experience action items
  allItems.push(...generateExperienceActionItems(breakdown.experience));

  // Add section action items
  allItems.push(...generateSectionActionItems(breakdown.sections));

  // Add format action items
  allItems.push(...generateFormatActionItems(breakdown.format));

  // Limit to 5 most important items
  return allItems.slice(0, 5);
}

/**
 * Calculate ATS Score V2 (Deterministic)
 *
 * This is the main entry point for the V2 scoring system.
 * It orchestrates all component scorers and produces a final score.
 *
 * Key differences from V1:
 * - No LLM calls - fully deterministic
 * - Weighted keyword scoring (importance + match type)
 * - Experience quality scoring (quantification, verbs, density)
 * - Role-aware weight adjustments
 * - Actionable improvement suggestions
 *
 * @param input - ATSScoreV2Input with all required data
 * @returns ATSScoreV2 with score, breakdown, and action items
 */
export function calculateATSScoreV2(input: ATSScoreV2Input): ATSScoreV2 {
  const startTime = performance.now();

  const {
    keywordAnalysis,
    resumeText,
    parsedResume,
    jdContent,
  } = input;

  // Extract keyword strings for density calculations
  const jdKeywords = extractKeywordStrings(keywordAnalysis);

  // Detect role for weight adjustments
  const roleContext = detectRole(jdContent);

  // Calculate component scores
  const keywordScoreResult = calculateKeywordScore(keywordAnalysis);

  const experienceScoreResult = calculateExperienceScore(resumeText, jdKeywords);

  const sectionScoreResult = calculateSectionScore(parsedResume);

  const formatScoreResult = calculateFormatScore(resumeText);

  // Build breakdown
  const breakdownV2: ScoreBreakdownV2 = {
    keywords: keywordScoreResult,
    experience: experienceScoreResult,
    sections: sectionScoreResult,
    format: formatScoreResult,
  };

  // Calculate overall score with role-adjusted weights
  const overall = calculateOverallScore(breakdownV2, roleContext.weights);

  // Determine tier
  const tier = getScoreTier(overall);

  // Generate action items
  const actionItems = generateActionItems(keywordAnalysis, breakdownV2);

  // Calculate processing time
  const processingTimeMs = Math.round(performance.now() - startTime);

  // Build V1-compatible breakdown for backward compatibility
  const v1Breakdown = {
    keywordScore: keywordScoreResult.score,
    sectionCoverageScore: sectionScoreResult.score,
    contentQualityScore: experienceScoreResult.score, // Map experience to quality for V1
  };

  return {
    // V1 compatible fields
    overall,
    breakdown: v1Breakdown,
    calculatedAt: new Date().toISOString(),

    // V2 specific fields
    tier,
    breakdownV2,
    roleContext,
    actionItems,
    metadata: {
      version: 'v2',
      algorithmHash: ALGORITHM_VERSION,
      processingTimeMs,
    },
  };
}

/**
 * Convert V2 score to V1 format for backward compatibility
 *
 * Use this when integrating with code that expects the V1 ATSScore type.
 */
export function toV1Score(v2Score: ATSScoreV2): {
  overall: number;
  breakdown: {
    keywordScore: number;
    sectionCoverageScore: number;
    contentQualityScore: number;
  };
  calculatedAt: string;
} {
  return {
    overall: v2Score.overall,
    breakdown: v2Score.breakdown,
    calculatedAt: v2Score.calculatedAt,
  };
}

/**
 * Check if a score object is V2 format
 */
export function isV2Score(score: unknown): score is ATSScoreV2 {
  return (
    typeof score === 'object' &&
    score !== null &&
    'metadata' in score &&
    typeof (score as ATSScoreV2).metadata === 'object' &&
    (score as ATSScoreV2).metadata?.version === 'v2'
  );
}

// ============================================================================
// V2.1 SCORING
// ============================================================================

/**
 * V2.1 Score input with all required data
 */
export interface ATSScoreV21Input {
  /** Keywords with requirement and placement */
  keywords: KeywordMatchV21[];

  /** JD qualifications (degree, years, certs) */
  jdQualifications: JDQualifications;

  /** Resume qualifications */
  resumeQualifications: ResumeQualifications;

  /** All bullets combined (experience + projects + education) */
  allBullets: string[];

  /** Source tracking for bullets */
  bulletSources: {
    experience: number;
    projects: number;
    education: number;
  };

  /** Parsed sections */
  sections: {
    summary?: string;
    skills?: string[];
    experience?: string[];
    education?: string;
    projects?: string[];
    certifications?: string[];
  };

  /** Raw resume text for format check */
  resumeText: string;

  /** Job description text */
  jdText: string;

  /** Job type (affects thresholds) */
  jobType: JobType;

  /** Candidate type (optional, derived from jobType if not provided) */
  candidateType?: CandidateType;
}

/**
 * Get component weights based on role, seniority, and candidate type
 */
function getComponentWeightsV21(
  role: JobRole,
  seniority: SeniorityLevel,
  candidateType: CandidateType
): ComponentWeightsV21 {
  // Start with base weights
  let weights: ComponentWeightsV21 = { ...COMPONENT_WEIGHTS_V21 };

  // Adjustments for candidate type (highest priority)
  if (candidateType === 'coop') {
    weights = { ...ROLE_WEIGHT_ADJUSTMENTS.coop_entry };
  } else if (candidateType === 'career_changer') {
    weights = { ...ROLE_WEIGHT_ADJUSTMENTS.career_changer };
  } else if (seniority === 'entry') {
    // Fulltime entry level uses coop weights
    weights = { ...ROLE_WEIGHT_ADJUSTMENTS.coop_entry };
  }

  // Adjustments for senior/executive
  if (seniority === 'senior' || seniority === 'lead' || seniority === 'executive') {
    weights = { ...ROLE_WEIGHT_ADJUSTMENTS.senior_executive };
  }

  // Role-specific adjustments
  if (role === 'designer') {
    weights.format += 0.05;
    weights.keywords -= 0.05;
  }

  if (role === 'data_scientist' || role === 'software_engineer') {
    weights.keywords += 0.03;
    weights.sections -= 0.03;
  }

  // Normalize to ensure sum = 1.0
  const total =
    weights.keywords +
    weights.qualificationFit +
    weights.contentQuality +
    weights.sections +
    weights.format;

  weights.keywords = Math.round((weights.keywords / total) * 100) / 100;
  weights.qualificationFit = Math.round((weights.qualificationFit / total) * 100) / 100;
  weights.contentQuality = Math.round((weights.contentQuality / total) * 100) / 100;
  weights.sections = Math.round((weights.sections / total) * 100) / 100;
  weights.format = Math.round((weights.format / total) * 100) / 100;

  return weights;
}

/**
 * Detect job role from JD text
 */
function detectJobRole(jdText: string): JobRole {
  const jdLower = jdText.toLowerCase();

  const rolePatterns: [JobRole, RegExp[]][] = [
    ['software_engineer', [/software\s+engineer/i, /developer/i, /frontend/i, /backend/i, /full\s*stack/i, /swe\b/i]],
    ['data_scientist', [/data\s+scientist/i, /machine\s+learning/i, /ml\s+engineer/i, /ai\s+engineer/i]],
    ['data_analyst', [/data\s+analyst/i, /business\s+analyst/i, /\banalytics\b/i, /bi\s+analyst/i]],
    ['product_manager', [/product\s+manager/i, /program\s+manager/i, /project\s+manager/i, /\bpm\b/i]],
    ['designer', [/designer/i, /\bux\b/i, /\bui\b/i, /user\s+experience/i]],
    ['marketing', [/marketing/i, /growth/i, /content\s+(?:manager|strategist)/i]],
    ['finance', [/finance/i, /accounting/i, /financial\s+analyst/i]],
    ['operations', [/operations/i, /supply\s+chain/i, /logistics/i]],
  ];

  for (const [role, patterns] of rolePatterns) {
    if (patterns.some((p) => p.test(jdLower))) {
      return role;
    }
  }

  return 'general';
}

/**
 * Detect seniority level from JD text
 */
function detectSeniorityLevel(jdText: string, candidateType: CandidateType): SeniorityLevel {
  // Co-op and career changer default to entry for seniority detection purposes
  if (candidateType === 'coop' || candidateType === 'career_changer') return 'mid';

  const jdLower = jdText.toLowerCase();

  if (/\b(?:director|vp|vice\s+president|head\s+of|chief|principal)\b/i.test(jdLower)) {
    return 'executive';
  }
  if (/\b(?:senior|sr\.?|lead|staff)\b/i.test(jdLower)) {
    return 'senior';
  }
  if (/\b(?:junior|jr\.?|entry|associate|intern|co-?op)\b/i.test(jdLower)) {
    return 'entry';
  }
  if (/\b(?:7\+?\s*years?|10\+?\s*years?)\b/i.test(jdLower)) {
    return 'senior';
  }
  if (/\b(?:3-?5\s*years?|5\+?\s*years?)\b/i.test(jdLower)) {
    return 'mid';
  }
  if (/\b(?:0-?2\s*years?|1-?3\s*years?|entry\s*level)\b/i.test(jdLower)) {
    return 'entry';
  }

  return 'mid';
}

/**
 * Generate action items from all V2.1 component results
 */
function generateActionItemsV21(
  keywordResult: ReturnType<typeof calculateKeywordScoreV21>,
  qualificationResult: ReturnType<typeof calculateQualificationFit>,
  contentResult: ReturnType<typeof calculateContentQuality>,
  sectionResult: ReturnType<typeof calculateSectionScoreV21>,
  formatResult: ReturnType<typeof calculateFormatScoreV21>,
  weights: ComponentWeightsV21
): ActionItem[] {
  const items: ActionItem[] = [];

  // Keyword action items (highest impact)
  const keywordItems = generateKeywordActionItemsV21(keywordResult);
  for (const item of keywordItems) {
    items.push({
      priority: item.priority,
      category: 'Keywords',
      message: item.message,
      potentialImpact: item.priority === 'critical' ? 15 : item.priority === 'high' ? 10 : 5,
    });
  }

  // Qualification action items
  const qualItems = generateQualificationActionItems(qualificationResult);
  for (const msg of qualItems) {
    items.push({
      priority: 'high',
      category: 'Qualifications',
      message: msg,
      potentialImpact: 8,
    });
  }

  // Content quality action items
  const contentItems = generateContentQualityActionItems(contentResult);
  for (const item of contentItems) {
    items.push({
      priority: item.priority,
      category: 'Content',
      message: item.message,
      potentialImpact: item.priority === 'high' ? 10 : 5,
    });
  }

  // Section action items
  const sectionItems = generateSectionActionItemsV21(sectionResult);
  for (const item of sectionItems) {
    items.push({
      priority: item.priority,
      category: 'Sections',
      message: item.message,
      potentialImpact: item.priority === 'high' ? 8 : 4,
    });
  }

  // Format action items
  const formatItems = generateFormatActionItemsV21(formatResult);
  for (const item of formatItems) {
    items.push({
      priority: item.priority,
      category: 'Format',
      message: item.message,
      potentialImpact: item.priority === 'high' ? 5 : 2,
    });
  }

  // Sort by priority and potential impact
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.potentialImpact - a.potentialImpact;
  });

  return items.slice(0, 8); // Return top 8 action items
}

/**
 * Calculate ATS Score V2.1
 *
 * This is the main entry point for the V2.1 scoring system.
 * It orchestrates all 5 component scorers and produces a final score.
 *
 * Key differences from V2:
 * - 5 components instead of 4 (added qualification fit)
 * - Required vs preferred keyword distinction
 * - Placement weighting for keywords
 * - Quantification quality tiers
 * - Weak verb penalties
 * - Education quality for co-op
 *
 * @param input - ATSScoreV21Input with all required data
 * @returns ATSScoreV21 with score, breakdown, and action items
 */
export function calculateATSScoreV21(input: ATSScoreV21Input): ATSScoreV21 {
  const startTime = performance.now();

  const {
    keywords,
    jdQualifications,
    resumeQualifications,
    allBullets,
    bulletSources,
    sections,
    resumeText,
    jdText,
    jobType,
  } = input;

  // Derive candidate type from input (backward compatibility)
  const candidateType = input.candidateType ?? (jobType === 'coop' ? 'coop' : 'fulltime');

  // Detect role and seniority
  const detectedRole = detectJobRole(jdText);
  const detectedSeniority = detectSeniorityLevel(jdText, candidateType);
  const weights = getComponentWeightsV21(detectedRole, detectedSeniority, candidateType);

  // Extract JD keywords for various checks
  const jdKeywords = keywords.map((k) => k.keyword);

  // Calculate each component
  const keywordResult = calculateKeywordScoreV21(keywords);

  const qualificationResult = calculateQualificationFit(jdQualifications, resumeQualifications);

  const contentResult = calculateContentQuality({
    bullets: allBullets,
    bulletSources,
    jdKeywords,
    jobType,
  });

  const sectionResult = calculateSectionScoreV21({
    sections,
    candidateType,
    jdKeywords,
  });

  const formatResult = calculateFormatScoreV21({
    resumeText,
    hasExperience: (sections.experience?.length ?? 0) > 0,
    hasSummary: !!sections.summary,
  });

  // Calculate weighted overall score
  const overall = Math.round(
    keywordResult.score * weights.keywords +
      qualificationResult.score * weights.qualificationFit +
      contentResult.score * weights.contentQuality +
      sectionResult.score * weights.sections +
      formatResult.score * weights.format
  );

  // Determine tier
  const tier = getScoreTier(overall);

  // Generate prioritized action items
  const actionItems = generateActionItemsV21(
    keywordResult,
    qualificationResult,
    contentResult,
    sectionResult,
    formatResult,
    weights
  );

  // Calculate processing time
  const processingTimeMs = Math.round(performance.now() - startTime);

  // Build V2.1 breakdown
  const breakdownV21: ScoreBreakdownV21 = {
    keywords: {
      score: keywordResult.score,
      weight: weights.keywords,
      weighted: Math.round(keywordResult.score * weights.keywords),
      details: keywordResult,
    },
    qualificationFit: {
      score: qualificationResult.score,
      weight: weights.qualificationFit,
      weighted: Math.round(qualificationResult.score * weights.qualificationFit),
      details: qualificationResult,
    },
    contentQuality: {
      score: contentResult.score,
      weight: weights.contentQuality,
      weighted: Math.round(contentResult.score * weights.contentQuality),
      details: contentResult,
    },
    sections: {
      score: sectionResult.score,
      weight: weights.sections,
      weighted: Math.round(sectionResult.score * weights.sections),
      details: sectionResult,
    },
    format: {
      score: formatResult.score,
      weight: weights.format,
      weighted: Math.round(formatResult.score * weights.format),
      details: formatResult,
    },
  };

  // Build V1-compatible breakdown for backward compatibility
  const v1Breakdown = {
    keywordScore: keywordResult.score,
    sectionCoverageScore: sectionResult.score,
    contentQualityScore: contentResult.score,
  };

  return {
    // Core fields
    overall,
    tier,

    // V1 compatible breakdown
    breakdown: v1Breakdown,
    calculatedAt: new Date().toISOString(),

    // V2.1 specific fields
    breakdownV21,
    metadata: {
      version: 'v2.1',
      algorithmHash: ALGORITHM_VERSION_V21,
      processingTimeMs,
      detectedRole,
      detectedSeniority,
      weightsUsed: weights,
    },
    actionItems,
  };
}

/**
 * Check if a score object is V2.1 format
 */
export function isV21Score(score: unknown): score is ATSScoreV21 {
  return (
    typeof score === 'object' &&
    score !== null &&
    'metadata' in score &&
    typeof (score as ATSScoreV21).metadata === 'object' &&
    (score as ATSScoreV21).metadata?.version === 'v2.1'
  );
}
