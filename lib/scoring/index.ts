/**
 * ATS Scoring V2 and V2.1 Module
 *
 * Deterministic ATS scoring that replaces LLM-based content quality scoring.
 *
 * V2 Formula: (Keywords × 50%) + (Experience × 20%) + (Section × 15%) + (Format × 15%)
 * V2.1 Formula: (Keywords × 40%) + (QualificationFit × 15%) + (ContentQuality × 20%) + (Section × 15%) + (Format × 10%)
 *
 * @example
 * ```typescript
 * import { calculateATSScoreV2, calculateATSScoreV21 } from '@/lib/scoring';
 *
 * // V2 scoring (legacy)
 * const scoreV2 = calculateATSScoreV2({
 *   keywordAnalysis,
 *   resumeText: parsedResume.rawText,
 *   parsedResume: { summary, skills, experience },
 *   jdContent,
 * });
 *
 * // V2.1 scoring (with qualification fit and enhanced features)
 * const scoreV21 = calculateATSScoreV21({
 *   keywords,
 *   jdQualifications,
 *   resumeQualifications,
 *   allBullets,
 *   bulletSources,
 *   sections,
 *   resumeText,
 *   jdText,
 *   jobType,
 * });
 *
 * console.log(`Score: ${scoreV21.overall} (${scoreV21.tier})`);
 * console.log('Action items:', scoreV21.actionItems);
 * ```
 */

// Main scorers
export { calculateATSScoreV2, calculateATSScoreV21, toV1Score, isV2Score, isV21Score } from './atsScore';
export type { ATSScoreV21Input } from './atsScore';

// Types - V2
export type {
  ATSScoreV2,
  ATSScoreV2Input,
  ScoreBreakdownV2,
  ScoreTier,
  KeywordScoreResult,
  ExperienceScoreResult,
  SectionScoreResult,
  FormatScoreResult,
  RoleDetectionResult,
  RoleType,
  SeniorityLevel,
  ExtractedBullet,
  BulletExtractionResult,
} from './types';

// Types - V2.1
export type {
  ATSScoreV21,
  ScoreBreakdownV21,
  KeywordRequirement,
  PlacementLocation,
  KeywordMatchV21,
  KeywordScoreResultV21,
  DegreeLevel,
  JDQualifications,
  ResumeQualifications,
  QualificationFitResult,
  QuantificationTier,
  QuantificationMatch,
  ContentQualityResult,
  EducationQualityResult,
  SectionScoreResultV21,
  FormatScoreResultV21,
  JobRole,
  JobType,
  ComponentWeightsV21,
  ActionPriority,
  ActionItem,
  CandidateType,
  CandidateTypeInput,
  CandidateTypeResult,
} from './types';

export { getScoreTier } from './types';

// Component scorers - V2
export { calculateKeywordScore, generateKeywordActionItems } from './keywordScore';
export { calculateExperienceScore, generateExperienceActionItems } from './experienceScore';
export { calculateSectionScore, generateSectionActionItems } from './sectionScore';
export { calculateFormatScore, generateFormatActionItems } from './formatScore';
export { detectRole, extractRoleTitle } from './roleDetection';
export { extractBullets, classifyVerb } from './bulletExtraction';

// Component scorers - V2.1
export { calculateKeywordScoreV21, generateKeywordActionItemsV21 } from './keywordScore';
export { calculateQualificationFit, extractExperienceYears, checkFieldMatch, generateQualificationActionItems } from './qualificationFit';
export { calculateContentQuality, extractQuantifications, classifyActionVerb, generateContentQualityActionItems } from './contentQuality';
export { calculateSectionScoreV21, evaluateEducationQuality, generateSectionActionItemsV21 } from './sectionScore';
export { calculateFormatScoreV21, generateFormatActionItemsV21 } from './formatScore';
export { detectJobType } from './jobTypeDetection';
export { detectCandidateType } from './candidateTypeDetection';

// Constants - V2
export {
  COMPONENT_WEIGHTS,
  IMPORTANCE_WEIGHTS,
  MATCH_TYPE_WEIGHTS,
  MISSING_HIGH_PENALTY,
  MIN_PENALTY_MULTIPLIER,
  EXPERIENCE_WEIGHTS,
  STRONG_ACTION_VERBS,
  WEAK_ACTION_VERBS,
  METRIC_PATTERNS,
  SECTION_THRESHOLDS,
  ALGORITHM_VERSION,
} from './constants';

// Constants - V2.1
export {
  COMPONENT_WEIGHTS_V21,
  ROLE_WEIGHT_ADJUSTMENTS,
  MISSING_REQUIRED_PENALTY,
  PREFERRED_BONUS_CAP,
  PLACEMENT_WEIGHTS,
  WEAK_ACTION_VERBS_V21,
  WEAK_VERB_PHRASES,
  MODERATE_ACTION_VERBS,
  QUANTIFICATION_PATTERNS_V21,
  ALGORITHM_VERSION_V21,
  OUTDATED_FORMATS,
  MODERN_FORMAT_SIGNALS,
  DEGREE_LEVELS,
  DEGREE_FIELD_MATCHES,
  SECTION_CONFIG_V21,
  CONTENT_QUALITY_WEIGHTS,
} from './constants';
