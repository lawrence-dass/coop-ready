/**
 * Optimization Preferences Types
 *
 * These types define the 5 configurable preferences that users can set
 * to customize how LLM suggestions are generated.
 *
 * Story: 11.2 - Implement Optimization Preferences
 */

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

// ============================================================================
// OPTIMIZATION PREFERENCES INTERFACE
// ============================================================================

/**
 * Complete optimization preferences structure
 *
 * Combines all 5 preference dimensions that control suggestion generation.
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
};

// ============================================================================
// PREFERENCE DISPLAY METADATA
// ============================================================================

/**
 * Human-readable labels and descriptions for each preference option
 *
 * Used in the PreferencesDialog UI to help users understand each choice.
 */
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
} as const;
