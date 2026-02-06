/**
 * Constants for Deterministic ATS Scoring V2.1
 *
 * All weights, patterns, and thresholds are defined here for easy tuning.
 *
 * V2.1 Changes:
 * - 5 components instead of 4 (added qualification fit)
 * - Required vs preferred keyword distinction
 * - Placement weighting for keywords
 * - Quantification quality tiers
 * - Weak verb penalties
 * - Outdated format detection
 */

// ============================================================================
// COMPONENT WEIGHTS (must sum to 1.0)
// ============================================================================

/**
 * V2 scoring formula weights (legacy - kept for backward compatibility)
 * (Keywords × 50%) + (Experience × 20%) + (Section × 15%) + (Format × 15%)
 */
export const COMPONENT_WEIGHTS = {
  keywords: 0.50,
  experience: 0.20,
  sections: 0.15,
  format: 0.15,
} as const;

/**
 * V2.1 scoring formula weights (5 components)
 * (Keywords × 40%) + (QualificationFit × 15%) + (ContentQuality × 20%) + (Section × 15%) + (Format × 10%)
 */
export const COMPONENT_WEIGHTS_V21 = {
  keywords: 0.40,
  qualificationFit: 0.15,
  contentQuality: 0.20,
  sections: 0.15,
  format: 0.10,
} as const;

/**
 * Role-aware weight adjustments for V2.1
 */
export const ROLE_WEIGHT_ADJUSTMENTS = {
  coop_entry: {
    keywords: 0.42,
    qualificationFit: 0.10,
    contentQuality: 0.18,
    sections: 0.20,
    format: 0.10,
  },
  mid: {
    keywords: 0.40,
    qualificationFit: 0.15,
    contentQuality: 0.20,
    sections: 0.15,
    format: 0.10,
  },
  senior_executive: {
    keywords: 0.35,
    qualificationFit: 0.20,
    contentQuality: 0.25,
    sections: 0.10,
    format: 0.10,
  },
  career_changer: {
    keywords: 0.40,
    qualificationFit: 0.14,
    contentQuality: 0.18,
    sections: 0.18,
    format: 0.10,
  },
} as const;

// ============================================================================
// KEYWORD SCORING WEIGHTS
// ============================================================================

/**
 * Weight multipliers based on keyword importance level
 */
export const IMPORTANCE_WEIGHTS = {
  high: 1.0,
  medium: 0.6,
  low: 0.3,
} as const;

/**
 * Weight multipliers based on match type quality
 */
export const MATCH_TYPE_WEIGHTS = {
  exact: 1.0,
  fuzzy: 0.85,
  semantic: 0.65,
} as const;

/**
 * Penalty for each missing high-importance keyword (percentage points)
 */
export const MISSING_HIGH_PENALTY = 0.15;

/**
 * Minimum score multiplier after penalties (floor at 30% of calculated score)
 */
export const MIN_PENALTY_MULTIPLIER = 0.30;

/**
 * Penalty for each missing REQUIRED keyword (V2.1)
 * Each missing required keyword reduces score ceiling by 12%
 */
export const MISSING_REQUIRED_PENALTY = 0.12;

/**
 * Bonus cap for PREFERRED keywords (V2.1)
 * Preferred keywords can add up to 25% bonus
 */
export const PREFERRED_BONUS_CAP = 0.25;

/**
 * Placement weights - where keyword appears affects score (V2.1)
 */
export const PLACEMENT_WEIGHTS = {
  skills_section: 1.0,      // Listed in dedicated Skills section
  summary: 0.90,            // Mentioned in professional summary
  experience_bullet: 0.85,  // In an experience bullet point
  experience_paragraph: 0.70, // Buried in paragraph text
  education: 0.80,          // In education section
  projects: 0.85,           // In projects section
  other: 0.65,              // Elsewhere (footer, interests, etc.)
} as const;

// ============================================================================
// EXPERIENCE SCORING WEIGHTS
// ============================================================================

/**
 * Sub-component weights for experience scoring (must sum to 1.0)
 */
export const EXPERIENCE_WEIGHTS = {
  quantification: 0.35,
  actionVerbs: 0.30,
  keywordDensity: 0.35,
} as const;

/**
 * Strong action verbs that indicate leadership and impact
 * These are highly valued by ATS systems and recruiters
 */
export const STRONG_ACTION_VERBS = new Set([
  // Leadership verbs
  'led', 'directed', 'managed', 'supervised', 'headed', 'oversaw',
  'coordinated', 'orchestrated', 'spearheaded', 'championed',

  // Achievement verbs
  'achieved', 'accomplished', 'delivered', 'exceeded', 'surpassed',
  'attained', 'earned', 'won', 'secured',

  // Growth verbs
  'grew', 'increased', 'expanded', 'scaled', 'accelerated',
  'boosted', 'elevated', 'enhanced', 'maximized', 'optimized',

  // Creation verbs
  'built', 'created', 'developed', 'designed', 'established',
  'founded', 'launched', 'initiated', 'pioneered', 'introduced',

  // Improvement verbs
  'improved', 'streamlined', 'transformed', 'revamped', 'modernized',
  'upgraded', 'refined', 'restructured', 'reengineered',

  // Problem-solving verbs
  'solved', 'resolved', 'fixed', 'addressed', 'eliminated',
  'reduced', 'minimized', 'prevented', 'mitigated',

  // Impact verbs
  'drove', 'generated', 'produced', 'saved', 'cut',
  'recovered', 'captured', 'negotiated', 'influenced',

  // Technical verbs
  'implemented', 'architected', 'engineered', 'automated',
  'integrated', 'deployed', 'migrated', 'configured',
]);

/**
 * Weak/passive verbs that should be replaced with stronger alternatives
 */
export const WEAK_ACTION_VERBS = new Set([
  'helped', 'assisted', 'supported', 'participated', 'contributed',
  'worked', 'was', 'had', 'did', 'made',
  'handled', 'dealt', 'used', 'involved', 'responsible',
]);

/**
 * Extended weak action verbs for V2.1 (includes multi-word phrases)
 */
export const WEAK_ACTION_VERBS_V21 = new Set([
  // Single words
  'helped', 'assisted', 'supported', 'participated', 'contributed',
  'worked', 'was', 'had', 'did', 'made',
  'handled', 'dealt', 'used', 'involved', 'responsible',
  'tried', 'attempted', 'learned', 'studied', 'observed',
  'watched', 'saw', 'knew', 'understood', 'familiarized',
]);

/**
 * Multi-word weak phrases that indicate passive voice (V2.1)
 */
export const WEAK_VERB_PHRASES = [
  'was responsible for',
  'was involved in',
  'dealt with',
  'tasked with',
  'in charge of',
  'looked after',
];

/**
 * Moderate action verbs - acceptable for junior/co-op roles (V2.1)
 */
export const MODERATE_ACTION_VERBS = new Set([
  // Collaboration (appropriate for junior/co-op)
  'contributed', 'collaborated', 'partnered', 'coordinated', 'facilitated',
  'supported', 'assisted', 'participated', 'engaged',
  // Standard professional
  'managed', 'maintained', 'handled', 'processed', 'performed',
  'conducted', 'completed', 'prepared', 'organized', 'documented',
  'wrote', 'tested', 'reviewed', 'updated', 'modified',
]);

// ============================================================================
// METRIC DETECTION PATTERNS
// ============================================================================

/**
 * Regex patterns to detect quantified achievements in bullet points
 */
export const METRIC_PATTERNS = [
  // Percentage patterns
  /\d+\.?\d*\s*%/,
  /\d+\.?\d*\s*percent/i,

  // Dollar/currency patterns
  /\$[\d,]+(?:\.\d{2})?(?:\s*[KMBkmb])?/,
  /[\d,]+(?:\.\d{2})?\s*(?:dollars?|USD)/i,

  // Multiplier patterns
  /\d+\.?\d*[xX]\s+(?:increase|improvement|growth|faster|more)/i,

  // Number patterns with context
  /\d+\+?\s*(?:users?|customers?|clients?|employees?|team\s*members?)/i,
  /\d+\+?\s*(?:projects?|applications?|systems?|features?)/i,
  /\d+\+?\s*(?:hours?|days?|weeks?|months?|years?)/i,

  // Rankings and positions
  /(?:top|#)\s*\d+/i,
  /\d+(?:st|nd|rd|th)\s+(?:place|rank|position)/i,

  // General numeric achievements
  /(?:increased|decreased|reduced|improved|grew|saved)\s+(?:by\s+)?\d+/i,
];

/**
 * Quantification patterns with quality tiers (V2.1)
 * Ordered from high to low value
 */
export const QUANTIFICATION_PATTERNS_V21: Array<{
  pattern: RegExp;
  tier: 'high' | 'medium' | 'low';
  type: 'currency' | 'percentage' | 'multiplier' | 'count' | 'time' | 'scale';
}> = [
  // HIGH TIER - Business impact, large scale
  { pattern: /\$[\d,]+(?:\.\d+)?[MBT]/i, tier: 'high', type: 'currency' },       // $50M, $1.2B
  { pattern: /\b9\d(?:\.\d+)?%/i, tier: 'high', type: 'percentage' },             // 90%+, 99.99%
  { pattern: /\b\d{2,}x\b/i, tier: 'high', type: 'multiplier' },                   // 10x, 100x
  { pattern: /\b\d{1,3}(?:,\d{3}){2,}\+?\b/, tier: 'high', type: 'count' },       // 1,000,000+
  { pattern: /team\s+of\s+\d{2,}/i, tier: 'high', type: 'scale' },                 // team of 10+
  { pattern: /\b\d+\s*(?:countries|regions|markets)\b/i, tier: 'high', type: 'scale' },

  // MEDIUM TIER - Good impact
  { pattern: /\$[\d,]+(?:\.\d+)?K/i, tier: 'medium', type: 'currency' },          // $200K
  { pattern: /\b[5-8]\d%/i, tier: 'medium', type: 'percentage' },                  // 50-89%
  { pattern: /\b[2-9]x\b/i, tier: 'medium', type: 'multiplier' },                  // 2x-9x
  { pattern: /\b\d{1,3}(?:,\d{3})\+?\s*(?:users?|customers?|requests?)/i, tier: 'medium', type: 'count' },
  { pattern: /team\s+of\s+\d/i, tier: 'medium', type: 'scale' },                   // team of 5

  // LOW TIER - Basic quantification
  { pattern: /\$[\d,]+(?:\.\d+)?(?!\d)/i, tier: 'low', type: 'currency' },        // $5000
  { pattern: /\b[1-4]?\d%/i, tier: 'low', type: 'percentage' },                    // 1-49%
  { pattern: /\b\d+\+?\s*(?:users?|customers?|clients?)/i, tier: 'low', type: 'count' },
];

// ============================================================================
// SECTION SCORING THRESHOLDS
// ============================================================================

/**
 * Minimum content thresholds for full section scores
 */
export const SECTION_THRESHOLDS = {
  /** Minimum word count for summary to get full score */
  summaryMinWords: 30,

  /** Minimum number of skill items for full score */
  skillsMinItems: 6,

  /** Minimum bullets per role for full experience score */
  experienceMinBulletsPerRole: 4,

  /** Minimum total experience bullets for meaningful score */
  experienceMinTotalBullets: 8,
} as const;

// ============================================================================
// FORMAT SCORING PATTERNS
// ============================================================================

/**
 * Email detection pattern
 */
export const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/**
 * Phone number detection patterns (various formats)
 */
export const PHONE_PATTERNS = [
  // US formats
  /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
  /\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
  // International format
  /\+\d{1,3}[-.\s]?\d{6,14}/,
];

/**
 * Date pattern detection for experience timeline
 */
export const DATE_PATTERNS = [
  // Month Year - Month Year or Present
  /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}/i,
  // MM/YYYY or MM-YYYY
  /\d{1,2}[\/\-]\d{4}/,
  // YYYY only
  /\b20[0-2]\d\b|\b19[89]\d\b/,
  // Present/Current
  /\b(?:present|current|now|ongoing)\b/i,
];

/**
 * Common section header patterns
 */
export const SECTION_HEADER_PATTERNS = [
  /^(?:professional\s+)?summary/im,
  /^(?:career\s+)?objective/im,
  /^(?:core\s+)?skills/im,
  /^(?:technical\s+)?skills/im,
  /^(?:work\s+)?experience/im,
  /^(?:professional\s+)?experience/im,
  /^employment(?:\s+history)?/im,
  /^education/im,
  /^certifications?/im,
  /^(?:professional\s+)?qualifications?/im,
  /^awards?(?:\s+(?:and|&)\s+achievements?)?/im,
  /^projects?/im,
  /^publications?/im,
];

/**
 * Bullet point patterns for structure detection
 */
export const BULLET_PATTERNS = [
  /^[\s]*[-•*▪▸►]\s+.+$/gm,
  /^[\s]*[○◦◇]\s+.+$/gm,
  /^[\s]*\d+\.\s+.+$/gm,
];

// ============================================================================
// ROLE DETECTION KEYWORDS
// ============================================================================

/**
 * Keywords for detecting role type from job description
 */
export const ROLE_KEYWORDS = {
  software_engineer: [
    'software engineer', 'developer', 'programmer', 'full stack',
    'frontend', 'backend', 'devops', 'sre', 'platform engineer',
    'coding', 'programming', 'software development',
  ],
  data_scientist: [
    'data scientist', 'machine learning', 'ml engineer', 'data analyst',
    'ai engineer', 'deep learning', 'analytics', 'data science',
    'statistician', 'quantitative analyst',
  ],
  product_manager: [
    'product manager', 'product owner', 'program manager', 'ppm',
    'product lead', 'product strategy', 'roadmap',
  ],
  designer: [
    'designer', 'ux', 'ui', 'user experience', 'user interface',
    'visual design', 'product design', 'graphic design', 'creative',
  ],
  marketing: [
    'marketing', 'growth', 'seo', 'sem', 'content', 'brand',
    'digital marketing', 'social media', 'campaign', 'acquisition',
  ],
  sales: [
    'sales', 'account executive', 'business development', 'bdr', 'sdr',
    'account manager', 'revenue', 'quota', 'pipeline',
  ],
  operations: [
    'operations', 'supply chain', 'logistics', 'procurement',
    'process improvement', 'lean', 'six sigma',
  ],
  finance: [
    'finance', 'accounting', 'financial analyst', 'controller',
    'treasury', 'audit', 'tax', 'cpa', 'cfa',
  ],
  hr: [
    'human resources', 'hr', 'recruiting', 'talent acquisition',
    'people operations', 'compensation', 'benefits', 'hrbp',
  ],
} as const;

/**
 * Keywords for detecting seniority level
 */
export const SENIORITY_KEYWORDS = {
  entry: [
    'entry level', 'junior', 'associate', 'intern', 'graduate',
    '0-2 years', '1-2 years', 'new grad', 'early career',
  ],
  mid: [
    'mid-level', 'mid level', '3-5 years', '2-5 years', '3+ years',
  ],
  senior: [
    'senior', 'sr', 'experienced', '5+ years', '5-7 years',
    '7+ years', 'advanced',
  ],
  lead: [
    'lead', 'principal', 'staff', 'architect', 'team lead',
    '10+ years', 'expert',
  ],
  executive: [
    'director', 'vp', 'vice president', 'head of', 'chief',
    'c-level', 'cto', 'ceo', 'cfo', 'coo', 'executive',
  ],
} as const;

// ============================================================================
// ALGORITHM VERSION
// ============================================================================

/**
 * Algorithm version hash for tracking changes
 * Update this when making changes to scoring logic
 */
export const ALGORITHM_VERSION = 'v2.0.0-2024.01';

/**
 * V2.1 Algorithm version
 */
export const ALGORITHM_VERSION_V21 = 'v2.1.0-2026.01';

// ============================================================================
// V2.1 FORMAT PATTERNS
// ============================================================================

/**
 * Outdated format indicators that should be penalized (V2.1)
 */
export const OUTDATED_FORMATS = {
  objective: /\b(?:objective|career\s+objective)\s*[:|\n]/i,
  references: /\breferences\s+(?:available\s+)?(?:upon|on)\s+request\b/i,
  photo: /\b(?:photo|picture|headshot)\b/i,
} as const;

/**
 * Modern format indicators that provide bonuses (V2.1)
 */
export const MODERN_FORMAT_SIGNALS = {
  linkedin: /linkedin\.com\/in\//i,
  github: /github\.com\//i,
  portfolio: /(?:portfolio|website)[:\s]+https?:\/\//i,
  professionalEmail: /[\w.-]+@(?!yahoo|aol|hotmail)[\w.-]+\.\w+/i,
} as const;

// ============================================================================
// V2.1 QUALIFICATION FIT CONSTANTS
// ============================================================================

/**
 * Degree level hierarchy for qualification matching
 */
export const DEGREE_LEVELS = {
  high_school: 1,
  associate: 2,
  bachelor: 3,
  master: 4,
  phd: 5,
} as const;

/**
 * Degree field matching aliases
 */
export const DEGREE_FIELD_MATCHES: Record<string, string[]> = {
  computer_science: [
    'computer science', 'cs', 'computing', 'computational',
  ],
  software_engineering: [
    'software engineering', 'software development',
  ],
  information_technology: [
    'information technology', 'it', 'information systems', 'mis',
  ],
  engineering: [
    'engineering', 'electrical engineering', 'computer engineering',
  ],
  related: [
    'mathematics', 'math', 'physics', 'data science', 'statistics',
  ],
};

// ============================================================================
// V2.1 SECTION SCORING THRESHOLDS
// ============================================================================

/**
 * Section configuration for co-op vs fulltime vs career_changer (V2.1)
 */
export const SECTION_CONFIG_V21 = {
  coop: {
    summary: { required: false, minLength: 50, maxPoints: 15 },
    skills: { required: true, minItems: 8, maxPoints: 25 },
    experience: { required: false, minBullets: 3, maxPoints: 20 },
    education: { required: true, minLength: 30, maxPoints: 25 },
    projects: { required: true, minBullets: 2, maxPoints: 20 },
    certifications: { required: false, minItems: 1, maxPoints: 10 },
  },
  fulltime: {
    summary: { required: true, minLength: 50, maxPoints: 15 },
    skills: { required: true, minItems: 8, maxPoints: 25 },
    experience: { required: true, minBullets: 6, maxPoints: 30 },
    education: { required: true, minLength: 30, maxPoints: 15 },
    projects: { required: false, minBullets: 2, maxPoints: 10 },
    certifications: { required: false, minItems: 1, maxPoints: 10 },
  },
  career_changer: {
    summary: { required: true, minLength: 80, maxPoints: 20 },
    skills: { required: true, minItems: 8, maxPoints: 25 },
    experience: { required: true, minBullets: 4, maxPoints: 20 },
    education: { required: true, minLength: 30, maxPoints: 20 },
    projects: { required: true, minBullets: 2, maxPoints: 15 },
    certifications: { required: false, minItems: 1, maxPoints: 10 },
  },
} as const;

// ============================================================================
// V2.1 CONTENT QUALITY WEIGHTS
// ============================================================================

/**
 * V2.1 Content quality component weights (sum to 1.0)
 */
export const CONTENT_QUALITY_WEIGHTS = {
  quantification: 0.35,
  actionVerbs: 0.30,
  keywordDensity: 0.35,
} as const;
