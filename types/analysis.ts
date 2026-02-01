// Keyword Analysis Types for ATS Scoring
// Story 5.1: Implement Keyword Analysis

export enum KeywordCategory {
  SKILLS = 'skills',
  TECHNOLOGIES = 'technologies',
  QUALIFICATIONS = 'qualifications',
  EXPERIENCE = 'experience',
  SOFT_SKILLS = 'soft_skills',
  CERTIFICATIONS = 'certifications'
}

export interface ExtractedKeyword {
  keyword: string;
  category: KeywordCategory;
  importance: 'high' | 'medium' | 'low'; // How critical for the job
  requirement?: 'required' | 'preferred'; // V2.1: Whether required or preferred
}

export interface ExtractedKeywords {
  keywords: ExtractedKeyword[];
  totalCount: number;
}

export interface MatchedKeyword {
  keyword: string;
  category: KeywordCategory;
  found: boolean;
  context?: string; // Where in resume it was found
  matchType: 'exact' | 'fuzzy' | 'semantic'; // How it matched
  placement?: 'skills_section' | 'summary' | 'experience_bullet' | 'experience_paragraph' | 'education' | 'projects' | 'other'; // V2.1: Where keyword appears
}

export interface KeywordAnalysisResult {
  matched: MatchedKeyword[]; // Keywords found in resume
  missing: ExtractedKeyword[]; // Keywords not in resume (gaps)
  matchRate: number; // Percentage (0-100)
  analyzedAt: string; // ISO timestamp
}

// ATS Score Types
// Story 5.2: Implement ATS Score Calculation

export interface ScoreBreakdown {
  keywordScore: number; // 0-100 (50% weight)
  sectionCoverageScore: number; // 0-100 (25% weight)
  contentQualityScore: number; // 0-100 (25% weight)
}

export interface ATSScore {
  overall: number; // 0-100 weighted average
  breakdown: ScoreBreakdown;
  calculatedAt: string; // ISO timestamp
}

export const SCORE_WEIGHTS = {
  keyword: 0.50,
  section: 0.25,
  quality: 0.25,
} as const;

// ============================================================================
// V2 SCORE TYPES (Deterministic Scoring)
// Story: Implement Deterministic ATS Scoring
// ============================================================================

/**
 * V2 Score Weights
 * (Keywords × 50%) + (Experience × 20%) + (Section × 15%) + (Format × 15%)
 */
export const SCORE_WEIGHTS_V2 = {
  keywords: 0.50,
  experience: 0.20,
  sections: 0.15,
  format: 0.15,
} as const;

/**
 * Score tier classification
 */
export type ScoreTier = 'excellent' | 'strong' | 'moderate' | 'weak';

/**
 * V2 Keyword component breakdown
 */
export interface KeywordScoreBreakdown {
  score: number;
  matchedCount: number;
  totalCount: number;
  weightedMatchScore: number;
  missingHighImportance: number;
  penaltyApplied: number;
}

/**
 * V2 Experience component breakdown
 */
export interface ExperienceScoreBreakdown {
  score: number;
  quantificationScore: number;
  actionVerbScore: number;
  keywordDensityScore: number;
  bulletCount: number;
  bulletsWithMetrics: number;
  strongVerbCount: number;
  weakVerbCount: number;
}

/**
 * V2 Section component breakdown
 */
export interface SectionScoreBreakdown {
  score: number;
  summaryScore: number;
  skillsScore: number;
  experienceScore: number;
  summaryWordCount: number;
  skillsItemCount: number;
  experienceBulletCount: number;
}

/**
 * V2 Format component breakdown
 */
export interface FormatScoreBreakdown {
  score: number;
  hasEmail: boolean;
  hasPhone: boolean;
  hasDatePatterns: boolean;
  hasSectionHeaders: boolean;
  hasBulletStructure: boolean;
  contactScore: number;
  structureScore: number;
}

/**
 * V2 Complete breakdown
 */
export interface ScoreBreakdownV2 {
  keywords: KeywordScoreBreakdown;
  experience: ExperienceScoreBreakdown;
  sections: SectionScoreBreakdown;
  format: FormatScoreBreakdown;
}

/**
 * Role detection result
 */
export interface RoleContext {
  roleType: string;
  seniorityLevel: string;
  confidence: number;
  weights: {
    keywords: number;
    experience: number;
    sections: number;
    format: number;
  };
}

/**
 * V2 ATS Score (extends V1 for backward compatibility)
 *
 * Includes all V1 fields plus V2-specific detailed breakdowns.
 */
export interface ATSScoreV2 extends ATSScore {
  tier: ScoreTier;
  breakdownV2: ScoreBreakdownV2;
  roleContext: RoleContext;
  actionItems: string[];
  metadata: {
    version: 'v2';
    algorithmHash: string;
    processingTimeMs: number;
  };
}

/**
 * Type guard to check if a score is V2 format
 */
export function isATSScoreV2(score: ATSScore | ATSScoreV2): score is ATSScoreV2 {
  return 'metadata' in score && score.metadata?.version === 'v2';
}
