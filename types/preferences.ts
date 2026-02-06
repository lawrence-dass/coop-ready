/**
 * Optimization Preferences Types
 *
 * These types define the 7 configurable preferences that users can set
 * to customize how LLM suggestions are generated.
 *
 * Story: 11.2 - Implement Optimization Preferences (5 original preferences)
 * Story: 13.1 - Add Job Type and Modification Level Types (2 new preferences)
 * Story: 18.1 - Add Candidate Type Detection and Classification
 */

// ============================================================================
// RE-EXPORTS FROM SCORING TYPES
// ============================================================================

export type {
  CandidateType,
  CandidateTypeInput,
  CandidateTypeResult,
} from '@/lib/scoring/types';

// ============================================================================
// PREFERENCE TYPE DEFINITIONS
// ============================================================================

/**
 * Tone Preference - How the resume "sounds"
 *
 * Controls the language style and formality level in suggestions.
 */
export type TonePreference =
  | 'professional' // Traditional corporate language, formal tone (Fortune 500, consulting)
  | 'technical' // Emphasize tools, frameworks, technical depth (software engineering)
  | 'casual'; // Conversational, approachable, less formal (startups, creative roles)

/**
 * Verbosity Preference - How detailed suggestions are
 *
 * Controls the length and detail level of generated bullet points.
 */
export type VerbosityPreference =
  | 'concise' // 1-2 lines per bullet, remove unnecessary words (ATS scanning)
  | 'detailed' // 2-3 lines, balanced detail and clarity (default/recommended)
  | 'comprehensive'; // 3-4 lines, extensive context and metrics (human reviewers)

/**
 * Emphasis Preference - What to focus on
 *
 * Controls what aspects of experience are prioritized in suggestions.
 */
export type EmphasisPreference =
  | 'skills' // Highlight technical skills, tools, frameworks, certifications
  | 'impact' // Emphasize quantifiable results, outcomes, business value
  | 'keywords'; // Maximize ATS keyword coverage from job description

/**
 * Industry Preference - Use industry-specific language
 *
 * Contextualizes suggestions with appropriate industry terminology.
 */
export type IndustryPreference =
  | 'tech' // Technology terminology (APIs, databases, CI/CD, scalability)
  | 'finance' // Finance terminology (ROI, financial modeling, compliance, risk)
  | 'healthcare' // Healthcare terminology (patient outcomes, HIPAA, clinical, care)
  | 'generic'; // Neutral, industry-agnostic language (default)

/**
 * Experience Level Preference - Frame content for career stage
 *
 * Adjusts language and framing based on professional experience level.
 */
export type ExperienceLevelPreference =
  | 'entry' // Emphasize learning, collaboration, potential, foundational skills
  | 'mid' // Balance execution and leadership, show depth and breadth (default)
  | 'senior'; // Emphasize strategic thinking, mentorship, business impact, innovation

/**
 * Job Type Preference - Controls audience and language framing
 *
 * Adjusts verb choice and impact framing based on job target type.
 */
export type JobTypePreference =
  | 'coop' // Co-op/Internship - Learning-focused language (e.g., "Contributed", "Developed", "Learned")
  | 'fulltime'; // Full-time Position - Impact-focused language (e.g., "Led", "Drove", "Owned", "Delivered")

/**
 * Modification Level Preference - Controls suggestion rewrite magnitude
 *
 * Determines how aggressively suggestions rewrite original content.
 */
export type ModificationLevelPreference =
  | 'conservative' // 15-25% change - Only adds keywords, minimal restructuring
  | 'moderate' // 35-50% change - Restructures for impact, balanced changes (default)
  | 'aggressive'; // 60-75% change - Full rewrite, significant reorganization

// ============================================================================
// USER CONTEXT INTERFACE
// ============================================================================

/**
 * Career goal options from onboarding
 */
export type CareerGoal =
  | 'first-job'
  | 'switching-careers'
  | 'advancing'
  | 'promotion'
  | 'returning';

/**
 * User context from onboarding for LLM personalization
 *
 * This provides additional context beyond OptimizationPreferences
 * to help the LLM generate more personalized suggestions.
 * Extracted from users.onboarding_answers JSONB column.
 */
export interface UserContext {
  /** User's primary career goal from onboarding */
  careerGoal?: CareerGoal | null;
  /** Target industries from onboarding (multiple allowed) */
  targetIndustries?: string[];
}

// ============================================================================
// OPTIMIZATION PREFERENCES INTERFACE
// ============================================================================

/**
 * Complete optimization preferences structure
 *
 * Combines all 7 preference dimensions that control suggestion generation.
 * Used both for storage (database) and runtime (LLM pipeline).
 */
export interface OptimizationPreferences {
  /** Language tone and formality */
  tone: TonePreference;

  /** Detail level and bullet point length */
  verbosity: VerbosityPreference;

  /** Primary focus of suggestions */
  emphasis: EmphasisPreference;

  /** Industry-specific terminology */
  industry: IndustryPreference;

  /** Career level framing */
  experienceLevel: ExperienceLevelPreference;

  /** Job target type (co-op vs full-time) */
  jobType: JobTypePreference;

  /** How aggressively to modify content */
  modificationLevel: ModificationLevelPreference;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Default optimization preferences
 *
 * These sensible defaults apply when:
 * - User hasn't customized preferences yet
 * - User clicks "Reset to Defaults"
 * - Anonymous users (no stored preferences)
 */
export const DEFAULT_PREFERENCES: OptimizationPreferences = {
  tone: 'professional',
  verbosity: 'detailed',
  emphasis: 'impact',
  industry: 'generic',
  experienceLevel: 'mid',
  jobType: 'fulltime',
  modificationLevel: 'moderate',
};

// ============================================================================
// PREFERENCE DISPLAY METADATA
// ============================================================================

// ============================================================================
// VALID VALUES (for runtime validation)
// ============================================================================

export const VALID_TONES: readonly TonePreference[] = ['professional', 'technical', 'casual'];
export const VALID_VERBOSITIES: readonly VerbosityPreference[] = ['concise', 'detailed', 'comprehensive'];
export const VALID_EMPHASES: readonly EmphasisPreference[] = ['skills', 'impact', 'keywords'];
export const VALID_INDUSTRIES: readonly IndustryPreference[] = ['tech', 'finance', 'healthcare', 'generic'];
export const VALID_EXPERIENCE_LEVELS: readonly ExperienceLevelPreference[] = ['entry', 'mid', 'senior'];
export const VALID_JOB_TYPES: readonly JobTypePreference[] = ['coop', 'fulltime'];
export const VALID_MODIFICATION_LEVELS: readonly ModificationLevelPreference[] = ['conservative', 'moderate', 'aggressive'];

/**
 * Validate that a preferences object contains only valid values
 *
 * @returns null if valid, error message string if invalid
 */
export function validatePreferences(prefs: unknown): string | null {
  if (!prefs || typeof prefs !== 'object') {
    return 'Preferences must be a non-null object';
  }

  const p = prefs as Record<string, unknown>;

  if (!VALID_TONES.includes(p.tone as TonePreference)) {
    return `Invalid tone: ${String(p.tone)}. Must be one of: ${VALID_TONES.join(', ')}`;
  }
  if (!VALID_VERBOSITIES.includes(p.verbosity as VerbosityPreference)) {
    return `Invalid verbosity: ${String(p.verbosity)}. Must be one of: ${VALID_VERBOSITIES.join(', ')}`;
  }
  if (!VALID_EMPHASES.includes(p.emphasis as EmphasisPreference)) {
    return `Invalid emphasis: ${String(p.emphasis)}. Must be one of: ${VALID_EMPHASES.join(', ')}`;
  }
  if (!VALID_INDUSTRIES.includes(p.industry as IndustryPreference)) {
    return `Invalid industry: ${String(p.industry)}. Must be one of: ${VALID_INDUSTRIES.join(', ')}`;
  }
  if (!VALID_EXPERIENCE_LEVELS.includes(p.experienceLevel as ExperienceLevelPreference)) {
    return `Invalid experienceLevel: ${String(p.experienceLevel)}. Must be one of: ${VALID_EXPERIENCE_LEVELS.join(', ')}`;
  }
  if (!VALID_JOB_TYPES.includes(p.jobType as JobTypePreference)) {
    return `Invalid jobType: ${String(p.jobType)}. Must be one of: ${VALID_JOB_TYPES.join(', ')}`;
  }
  if (!VALID_MODIFICATION_LEVELS.includes(p.modificationLevel as ModificationLevelPreference)) {
    return `Invalid modificationLevel: ${String(p.modificationLevel)}. Must be one of: ${VALID_MODIFICATION_LEVELS.join(', ')}`;
  }

  return null;
}

// ============================================================================
// PREFERENCE DISPLAY METADATA
// ============================================================================

export const PREFERENCE_METADATA = {
  tone: {
    label: 'Tone',
    description: 'How your resume "sounds"',
    options: {
      professional: {
        label: 'Professional',
        description: 'Traditional corporate language, formal tone',
        example: 'Managed cross-functional teams to deliver quarterly objectives',
      },
      technical: {
        label: 'Technical',
        description: 'Emphasize tools, frameworks, technical depth',
        example: 'Led microservices architecture migration using Kubernetes',
      },
      casual: {
        label: 'Casual',
        description: 'Conversational, approachable, less formal',
        example: 'Collaborated with team to ship features that users loved',
      },
    },
  },
  verbosity: {
    label: 'Verbosity',
    description: 'How detailed suggestions are',
    options: {
      concise: {
        label: 'Concise',
        description: 'Short, punchy bullets (1-2 lines)',
      },
      detailed: {
        label: 'Detailed',
        description: 'Standard length (2-3 lines) - recommended',
      },
      comprehensive: {
        label: 'Comprehensive',
        description: 'Extensive detail (3-4 lines with context)',
      },
    },
  },
  emphasis: {
    label: 'Emphasis',
    description: 'What to focus on',
    options: {
      skills: {
        label: 'Skills',
        description: 'Highlight technical skills and tools',
      },
      impact: {
        label: 'Impact',
        description: 'Emphasize quantifiable results and outcomes',
      },
      keywords: {
        label: 'Keywords',
        description: 'Maximize ATS keyword coverage',
      },
    },
  },
  industry: {
    label: 'Industry Focus',
    description: 'Use industry-specific language',
    options: {
      tech: {
        label: 'Technology',
        description: 'Tech terminology (APIs, databases, CI/CD)',
      },
      finance: {
        label: 'Finance',
        description: 'Finance terminology (ROI, compliance, risk)',
      },
      healthcare: {
        label: 'Healthcare',
        description: 'Healthcare terminology (HIPAA, clinical, care)',
      },
      generic: {
        label: 'Generic',
        description: 'Industry-agnostic language',
      },
    },
  },
  experienceLevel: {
    label: 'Experience Level',
    description: 'Frame content for your career stage',
    options: {
      entry: {
        label: 'Entry-Level',
        description: 'Emphasize learning and collaboration',
      },
      mid: {
        label: 'Mid-Level',
        description: 'Balance execution and leadership',
      },
      senior: {
        label: 'Senior',
        description: 'Emphasize strategy and mentorship',
      },
    },
  },
  jobType: {
    label: 'Job Type',
    description: 'Type of position you\'re applying for',
    options: {
      coop: {
        label: 'Co-op / Internship',
        description: 'Learning-focused opportunity, emphasize growth and development',
        example: 'Contributed to real-world projects under mentorship',
      },
      fulltime: {
        label: 'Full-time Position',
        description: 'Career position, emphasize impact and delivery',
        example: 'Led team to deliver major features on schedule',
      },
    },
  },
  modificationLevel: {
    label: 'Modification Level',
    description: 'How aggressively to modify content',
    options: {
      conservative: {
        label: 'Conservative',
        description: 'Minimal changes (15-25%) - Only adds keywords, light restructuring',
        example: 'Keeps your writing style, adds ATS keywords',
      },
      moderate: {
        label: 'Moderate',
        description: 'Balanced changes (35-50%) - Restructures for impact',
        example: 'Improves clarity and impact while preserving intent',
      },
      aggressive: {
        label: 'Aggressive',
        description: 'Major rewrite (60-75%) - Full reorganization for maximum impact',
        example: 'Completely rewrites for strongest possible presentation',
      },
    },
  },
} as const;
