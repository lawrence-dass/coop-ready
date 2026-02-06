/**
 * Type Definitions for Deterministic ATS Scoring V2.1
 *
 * This module defines all types for the deterministic scoring system.
 *
 * V2.1 Formula: (Keywords × 40%) + (QualificationFit × 15%) + (ContentQuality × 20%) + (Section × 15%) + (Format × 10%)
 *
 * Changes from V2:
 * - Added qualification fit component (15%)
 * - Added required vs preferred keyword distinction
 * - Added placement weighting for keywords
 * - Reduced keyword weight from 50% to 40%
 * - Reduced format weight from 15% to 10%
 * - Renamed experience to contentQuality
 */

import type { KeywordAnalysisResult, MatchedKeyword, ExtractedKeyword } from '@/types/analysis';

// ============================================================================
// SCORE TIER TYPES
// ============================================================================

/**
 * Score tier classification for quick visual feedback
 */
export type ScoreTier = 'excellent' | 'strong' | 'moderate' | 'weak';

/**
 * Get tier based on overall score
 */
export function getScoreTier(score: number): ScoreTier {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'strong';
  if (score >= 55) return 'moderate';
  return 'weak';
}

// ============================================================================
// V2.1 KEYWORD TYPES
// ============================================================================

/**
 * Keyword requirement classification - required vs preferred
 */
export type KeywordRequirement = 'required' | 'preferred';

/**
 * Where a keyword was found in the resume
 */
export type PlacementLocation =
  | 'skills_section'
  | 'summary'
  | 'experience_bullet'
  | 'experience_paragraph'
  | 'education'
  | 'projects'
  | 'other';

/**
 * Extended keyword match with V2.1 fields
 */
export interface KeywordMatchV21 {
  keyword: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  requirement: KeywordRequirement;
  found: boolean;
  matchType?: 'exact' | 'fuzzy' | 'semantic';
  placement?: PlacementLocation;
  context?: string;
}

/**
 * V2.1 Keyword score result with required/preferred breakdown
 */
export interface KeywordScoreResultV21 {
  score: number; // 0-100
  breakdown: {
    requiredScore: number;      // Score from required keywords (0-1)
    preferredBonus: number;     // Bonus from preferred keywords (0-0.25)
    penaltyMultiplier: number;  // Penalty for missing required (0.30-1.0)
    missingRequiredCount: number;
    missingPreferredCount: number;
  };
  details: {
    matchedRequired: KeywordMatchV21[];
    matchedPreferred: KeywordMatchV21[];
    missingRequired: string[];    // Critical - shown prominently in UI
    missingPreferred: string[];   // Secondary - shown as opportunities
  };
}

// ============================================================================
// V2.1 QUALIFICATION FIT TYPES
// ============================================================================

/**
 * Degree level hierarchy
 */
export type DegreeLevel = 'high_school' | 'associate' | 'bachelor' | 'master' | 'phd';

/**
 * Job description qualification requirements
 */
export interface JDQualifications {
  degreeRequired?: {
    level: DegreeLevel;
    fields?: string[]; // e.g., ["Computer Science", "Software Engineering", "related field"]
    required: boolean; // true if "required", false if "preferred"
  };
  experienceRequired?: {
    minYears: number;
    maxYears?: number; // For "3-5 years" ranges
    required: boolean;
  };
  certificationsRequired?: {
    certifications: string[];
    required: boolean;
  };
}

/**
 * Resume qualifications extracted
 */
export interface ResumeQualifications {
  degree?: {
    level: DegreeLevel;
    field: string;
    institution?: string;
    gpa?: number;
  };
  totalExperienceYears: number;
  certifications: string[];
}

/**
 * Qualification fit scoring result
 */
export interface QualificationFitResult {
  score: number; // 0-100
  breakdown: {
    degreeScore: number;       // 0-100
    experienceScore: number;   // 0-100
    certificationScore: number; // 0-100
  };
  details: {
    degreeMet: boolean;
    degreeNote?: string;
    experienceMet: boolean;
    experienceNote?: string;
    certificationsMet: string[];
    certificationsMissing: string[];
  };
}

// ============================================================================
// V2.1 CONTENT QUALITY TYPES (replaces Experience)
// ============================================================================

/**
 * Quantification quality tiers
 */
export type QuantificationTier = 'high' | 'medium' | 'low';

/**
 * Quantification match details
 */
export interface QuantificationMatch {
  text: string;
  tier: QuantificationTier;
  type: 'currency' | 'percentage' | 'multiplier' | 'count' | 'time' | 'scale';
}

/**
 * Content quality scoring result (V2.1 - replaces ExperienceScoreResult)
 */
export interface ContentQualityResult {
  score: number; // 0-100
  breakdown: {
    quantificationScore: number;
    actionVerbScore: number;
    keywordDensityScore: number;
  };
  details: {
    totalBullets: number;
    bulletsWithMetrics: number;
    highTierMetrics: number;
    mediumTierMetrics: number;
    lowTierMetrics: number;
    strongVerbCount: number;
    moderateVerbCount: number;
    weakVerbCount: number;
    keywordsFound: string[];
    keywordsMissing: string[];
  };
}

// ============================================================================
// V2.1 SECTION TYPES
// ============================================================================

/**
 * Education quality evaluation result
 */
export interface EducationQualityResult {
  score: number;
  breakdown: {
    hasRelevantCoursework: boolean;
    courseworkMatchScore: number;
    hasGPA: boolean;
    gpaStrong: boolean; // 3.5+
    hasProjects: boolean;
    hasHonors: boolean;
    hasLocation: boolean;
    hasProperDateFormat: boolean;
  };
  suggestions: string[];
}

/**
 * V2.1 Section score result with education quality
 */
export interface SectionScoreResultV21 {
  score: number; // 0-100
  breakdown: {
    [sectionName: string]: {
      present: boolean;
      meetsThreshold: boolean;
      points: number;
      maxPoints: number;
      qualityScore?: number; // For education
      issues?: string[];
    };
  };
  educationQuality?: EducationQualityResult;
}

// ============================================================================
// V2.1 FORMAT TYPES
// ============================================================================

/**
 * V2.1 Format score result with modern/outdated format detection
 */
export interface FormatScoreResultV21 {
  score: number; // 0-100
  breakdown: {
    hasEmail: boolean;
    hasPhone: boolean;
    hasLinkedIn: boolean;
    hasGitHub: boolean;
    hasParseableDates: boolean;
    hasSectionHeaders: boolean;
    hasBulletStructure: boolean;
    appropriateLength: boolean;
    noOutdatedFormats: boolean;
  };
  issues: string[];
  warnings: string[];
}

// ============================================================================
// V2.1 ROLE TYPES
// ============================================================================

/**
 * Job role categories
 */
export type JobRole =
  | 'software_engineer'
  | 'data_analyst'
  | 'data_scientist'
  | 'product_manager'
  | 'designer'
  | 'marketing'
  | 'finance'
  | 'operations'
  | 'general';

/**
 * Job type (affects weight adjustments)
 */
export type JobType = 'coop' | 'fulltime';

/**
 * Candidate type classification - broader than JobType, includes career changers
 */
export type CandidateType = 'coop' | 'fulltime' | 'career_changer';

/**
 * Input parameters for candidate type detection
 */
export interface CandidateTypeInput {
  userJobType?: JobType; // From OptimizationPreferences.jobType
  careerGoal?: string; // From UserContext.careerGoal
  resumeRoleCount?: number; // Count of roles in experience section
  hasActiveEducation?: boolean; // Expected graduation date in future
  totalExperienceYears?: number; // Estimated total years of experience
}

/**
 * Result of candidate type detection with confidence metrics
 */
export interface CandidateTypeResult {
  candidateType: CandidateType;
  confidence: number; // 0.0 - 1.0
  detectedFrom: 'user_selection' | 'onboarding' | 'resume_analysis' | 'default';
}

/**
 * V2.1 Component weights
 */
export interface ComponentWeightsV21 {
  keywords: number;
  qualificationFit: number;
  contentQuality: number;
  sections: number;
  format: number;
}

// ============================================================================
// V2.1 ACTION ITEMS
// ============================================================================

/**
 * Priority levels for action items
 */
export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Structured action item
 */
export interface ActionItem {
  priority: ActionPriority;
  category: string;
  message: string;
  potentialImpact: number; // Estimated point improvement
}

// ============================================================================
// V2.1 ATS SCORE
// ============================================================================

/**
 * V2.1 Score breakdown with 5 components
 */
export interface ScoreBreakdownV21 {
  keywords: {
    score: number;
    weight: number;
    weighted: number;
    details: KeywordScoreResultV21;
  };
  qualificationFit: {
    score: number;
    weight: number;
    weighted: number;
    details: QualificationFitResult;
  };
  contentQuality: {
    score: number;
    weight: number;
    weighted: number;
    details: ContentQualityResult;
  };
  sections: {
    score: number;
    weight: number;
    weighted: number;
    details: SectionScoreResultV21;
  };
  format: {
    score: number;
    weight: number;
    weighted: number;
    details: FormatScoreResultV21;
  };
}

/**
 * V2.1 ATS Score with full breakdown and metadata
 */
export interface ATSScoreV21 {
  // Core fields
  overall: number; // 0-100 weighted average
  tier: ScoreTier;

  // V1 compatible breakdown (for backward compatibility)
  breakdown: {
    keywordScore: number;
    sectionCoverageScore: number;
    contentQualityScore: number;
  };
  calculatedAt: string; // ISO timestamp

  // V2.1 specific fields
  breakdownV21: ScoreBreakdownV21;
  metadata: {
    version: 'v2.1';
    algorithmHash: string;
    processingTimeMs: number;
    detectedRole: JobRole;
    detectedSeniority: SeniorityLevel;
    weightsUsed: ComponentWeightsV21;
  };
  actionItems: ActionItem[];
}

// ============================================================================
// COMPONENT SCORE TYPES
// ============================================================================

/**
 * Keyword component scoring details
 */
export interface KeywordScoreResult {
  score: number; // 0-100
  matchedCount: number;
  totalCount: number;
  weightedMatchScore: number; // Score considering importance & match type
  missingHighImportance: number; // Count of missing high-importance keywords
  penaltyApplied: number; // Penalty amount for missing high-importance
}

/**
 * Experience component scoring details
 */
export interface ExperienceScoreResult {
  score: number; // 0-100
  quantificationScore: number; // 0-100 (35% weight)
  actionVerbScore: number; // 0-100 (30% weight)
  keywordDensityScore: number; // 0-100 (35% weight)
  bulletCount: number;
  bulletsWithMetrics: number;
  strongVerbCount: number;
  weakVerbCount: number;
}

/**
 * Section component scoring details
 */
export interface SectionScoreResult {
  score: number; // 0-100
  summaryScore: number; // 0-100
  skillsScore: number; // 0-100
  experienceScore: number; // 0-100
  summaryWordCount: number;
  skillsItemCount: number;
  experienceBulletCount: number;
}

/**
 * Format component scoring details
 */
export interface FormatScoreResult {
  score: number; // 0-100
  hasEmail: boolean;
  hasPhone: boolean;
  hasDatePatterns: boolean;
  hasSectionHeaders: boolean;
  hasBulletStructure: boolean;
  contactScore: number; // 0-100
  structureScore: number; // 0-100
}

// ============================================================================
// ROLE DETECTION TYPES
// ============================================================================

/**
 * Detected role type from job description
 */
export type RoleType =
  | 'software_engineer'
  | 'data_scientist'
  | 'product_manager'
  | 'designer'
  | 'marketing'
  | 'sales'
  | 'operations'
  | 'finance'
  | 'hr'
  | 'general';

/**
 * Detected seniority level from job description
 */
export type SeniorityLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';

/**
 * Role detection result with weight adjustments
 */
export interface RoleDetectionResult {
  roleType: RoleType;
  seniorityLevel: SeniorityLevel;
  confidence: number; // 0-1
  weights: {
    keywords: number;
    experience: number;
    sections: number;
    format: number;
  };
}

// ============================================================================
// V2 SCORE BREAKDOWN
// ============================================================================

/**
 * Complete breakdown of V2 ATS score by component
 */
export interface ScoreBreakdownV2 {
  keywords: KeywordScoreResult;
  experience: ExperienceScoreResult;
  sections: SectionScoreResult;
  format: FormatScoreResult;
}

// ============================================================================
// V2 ATS SCORE (extends V1 for backward compatibility)
// ============================================================================

/**
 * V2 ATS Score with full breakdown and metadata
 *
 * This type extends the V1 ATSScore interface for backward compatibility
 * while adding the new V2-specific fields.
 */
export interface ATSScoreV2 {
  // V1 compatible fields
  overall: number; // 0-100 weighted average
  breakdown: {
    keywordScore: number; // Maps to keywords.score
    sectionCoverageScore: number; // Maps to sections.score
    contentQualityScore: number; // Maps to experience.score for V1 compat
  };
  calculatedAt: string; // ISO timestamp

  // V2 specific fields
  tier: ScoreTier;
  breakdownV2: ScoreBreakdownV2;
  roleContext: RoleDetectionResult;
  actionItems: string[];
  metadata: {
    version: 'v2';
    algorithmHash: string; // For versioning/debugging
    processingTimeMs: number;
  };
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Input required for V2 ATS score calculation
 */
export interface ATSScoreV2Input {
  /** Keyword analysis results from matchKeywords */
  keywordAnalysis: KeywordAnalysisResult;

  /** Raw resume text for bullet/content extraction */
  resumeText: string;

  /** Parsed resume sections */
  parsedResume: {
    summary?: string;
    skills?: string;
    experience?: string;
    education?: string;
  };

  /** Job description text for role detection */
  jdContent: string;
}

// ============================================================================
// BULLET EXTRACTION TYPES
// ============================================================================

/**
 * Extracted bullet point with metadata
 */
export interface ExtractedBullet {
  text: string;
  hasMetric: boolean;
  hasStrongVerb: boolean;
  firstWord: string;
  keywords: string[]; // JD keywords found in this bullet
}

/**
 * Bullet extraction result
 */
export interface BulletExtractionResult {
  bullets: ExtractedBullet[];
  rawBulletCount: number;
  source: 'pattern' | 'newline'; // Which extraction method was used
}
