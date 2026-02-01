# SubmitSmart ATS Scoring System Specification v2.1

**Version:** 2.1  
**Date:** January 2026  
**Status:** Technical Specification (Ready for Implementation)  
**Changes from v2.0:** Added qualification fit, keyword placement, certification scoring, quantification quality tiers, weak verb penalties, required vs preferred keyword distinction

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Diagnosis](#problem-diagnosis)
3. [Calibration Analysis](#calibration-analysis)
4. [Scoring Architecture Overview](#scoring-architecture-overview)
5. [Component 1: Keyword Score (40%)](#component-1-keyword-score-40)
6. [Component 2: Qualification Fit Score (15%)](#component-2-qualification-fit-score-15)
7. [Component 3: Content Quality Score (20%)](#component-3-content-quality-score-20)
8. [Component 4: Section Score (15%)](#component-4-section-score-15)
9. [Component 5: Format Score (10%)](#component-5-format-score-10)
10. [Role-Aware Weight Adjustments](#role-aware-weight-adjustments)
11. [Combined Scoring Function](#combined-scoring-function)
12. [Score Tiers and Interpretation](#score-tiers-and-interpretation)
13. [Projected Score Calculation](#projected-score-calculation)
14. [Prompt Modifications](#prompt-modifications)
15. [UI Display Recommendations](#ui-display-recommendations)
16. [Implementation Plan](#implementation-plan)
17. [Validation Strategy](#validation-strategy)
18. [Type Definitions](#type-definitions)

---

## Executive Summary

The current SubmitSmart ATS scoring system produces inflated scores (~15-20 points higher than expected). A resume that should score 50-60% is scoring 71-73%. This specification defines a new programmatic scoring system that:

1. **Replaces LLM-generated scores** with deterministic calculations in code
2. **Distinguishes required vs preferred keywords** with different penalty structures
3. **Weights keywords by importance, match type, AND placement** (Skills section > Experience paragraphs)
4. **Penalizes missing critical requirements** (keywords, qualifications, experience years)
5. **Evaluates ALL bullet content** (experience + projects + education), not just experience section
6. **Measures quantification quality**, not just presence
7. **Penalizes weak action verbs**, not just credits strong ones
8. **Includes certification detection and scoring**
9. **Supports role-aware weight adjustments** for different job types and seniority levels
10. **Provides transparent breakdowns** so users understand their score

---

## Problem Diagnosis

### Root Causes of Score Inflation

| Cause | Current Behavior | Impact | Fix |
|-------|------------------|--------|-----|
| **No required vs preferred distinction** | All high-importance keywords treated equally | +5-10 points | Separate required (penalty for missing) vs preferred (bonus for having) |
| **Semantic matching treated equally** | "worked with data" = "data analytics" at full value | +10-15 points | Weight by match type (semantic = 0.65) |
| **No penalty for missing required keywords** | Only credit for found keywords | +5-10 points | Hard penalty for missing required skills |
| **Keyword placement ignored** | Keyword in Skills = keyword buried in paragraph | +3-5 points | Weight by placement location |
| **Content Quality measures human criteria** | "Clarity: 90" inflates score | +5-8 points | Replace with ATS-specific metrics |
| **All keywords weighted equally** | "teamwork" = "Python" | +3-5 points | Weight by importance tier |
| **No defined formula** | LLM outputs optimistic numbers | Variance | Deterministic calculation in code |
| **Generous section coverage** | Section exists = full credit | +2-3 points | Evaluate content density |
| **No qualification fit check** | Degree type, years ignored | +5-8 points | Penalize underqualification |
| **Weak verbs not penalized** | "Helped" same as "Led" | +3-5 points | Penalize weak, passive verbs |
| **Quantification presence only** | "2,000 users" same as "$50M revenue" | +2-3 points | Quality tiers for metrics |
| **Certifications ignored** | No scoring component | +3-5 points | Add certification detection |

### Observed vs Expected Scores

| Resume Profile | Current Score | Expected Score | Gap |
|----------------|---------------|----------------|-----|
| Casey Brown (weak match, missing required) | 71-73% | 50-60% | +15-18 |
| Morgan Davis (moderate, some gaps) | 68-72% | 60-70% | +5-8 |
| Taylor Williams (good, no preferred) | 75-80% | 70-80% | +0-5 |
| Alex Chen (excellent, complete) | 90-95% | 90-100% | ~0 |

---

## Calibration Analysis

Based on analysis of 4 calibration resumes against a Software Engineer job description:

### Score Tier Characteristics

| Tier | Keywords (Req) | Keywords (Pref) | Quantification | Action Verbs | Certifications | Projects |
|------|----------------|-----------------|----------------|--------------|----------------|----------|
| **90-100%** | 100% (all present) | 100% (all present) | 25+ high-quality metrics | "Architected", "Led", "Drove" | 3-4 relevant | Detailed with metrics |
| **70-80%** | 90%+ (most present) | 30-50% (some) | 10-15 moderate metrics | Mixed strong/weak | 0 | None or vague |
| **60-70%** | 75-85% (gaps exist) | 10-20% (few) | 8-12 basic metrics | Mixed, more weak | 0 | Mentioned vaguely |
| **50-60%** | 60-75% (major gaps) | 0-10% (almost none) | 5-10 weak metrics | Dominated by weak | 0 | None |

### Key Discriminating Factors

1. **Missing REQUIRED keywords = 20+ point drop**
   - Casey (50-60%) missing Django AND Angular AND CI/CD
   - Alex (90-100%) has ALL required keywords

2. **PREFERRED keywords separate good from excellent**
   - Alex: Docker, Kubernetes, TypeScript, MongoDB, GraphQL, TDD, microservices (all present)
   - Taylor: Only AWS mentioned, missing most preferred
   - Casey: "Basic AWS" only (weak signal)

3. **Weak action verbs correlate with lower scores**
   - Casey: "Worked on", "Helped", "Assisted" dominate (12+ weak verbs)
   - Alex: "Architected", "Led", "Built", "Designed" dominate (2 weak verbs)

4. **Quantification quality matters, not just presence**
   - Alex: "$50M+ monthly transactions", "99.99% uptime", "40% cost reduction ($200K)"
   - Casey: "2,000+ users", "50+ queries", "20% reduction"

5. **Certifications provide significant boost**
   - Alex: 4 certifications (AWS Pro, AWS Associate, MongoDB, Scrum)
   - Everyone else: 0 certifications

6. **Degree relevance affects score**
   - Alex: BS Computer Science (exact match)
   - Casey: BS Information Technology (related but not exact)

---

## Scoring Architecture Overview

### Master Formula

```
ATS_Score = (
  KeywordScore          × 0.40 +
  QualificationFitScore × 0.15 +
  ContentQualityScore   × 0.20 +
  SectionScore          × 0.15 +
  FormatScore           × 0.10
) × 100
```

### Component Summary

| Component | Weight | What It Measures |
|-----------|--------|------------------|
| **Keyword Score** | 40% | Required vs preferred keywords, match type, placement |
| **Qualification Fit** | 15% | Degree match, years of experience, required certifications |
| **Content Quality** | 20% | Quantification quality, action verbs, keyword density (all bullets) |
| **Section Score** | 15% | Structure, content density, education quality for co-op |
| **Format Score** | 10% | Parseability, contact info, modern formatting |

### Data Flow

```
[Resume] + [JD]
     ↓
[Keyword Extraction] → keywords with importance + required/preferred flag
     ↓
[Keyword Matching] → found/missing with matchType + placement
     ↓
[Qualification Extraction] → degree, years, certifications from both
     ↓
[Programmatic Scoring] ← No LLM needed for score calculation
     ↓
[Baseline Score] → "Your current ATS score: 54%"
     ↓
[Suggestion Generation] → LLM generates content
     ↓
[Projected Score] → "After suggestions: 78% (+24)"
```

---

## Component 1: Keyword Score (40%)

The keyword score is the primary driver of ATS filtering. This component distinguishes required vs preferred keywords, applies weighted scoring based on importance, match type, and placement.

### Keyword Classification

```typescript
type KeywordRequirement = 'required' | 'preferred';

interface ExtractedKeyword {
  keyword: string;
  category: 'skills' | 'technologies' | 'qualifications' | 'experience' | 'soft_skills' | 'certifications';
  importance: 'high' | 'medium' | 'low';
  requirement: KeywordRequirement; // NEW: required vs preferred
}
```

**Classification Rules:**
- **Required:** Appears in "Required Qualifications" section, or phrases like "must have", "required", "essential"
- **Preferred:** Appears in "Preferred Qualifications" section, or phrases like "nice to have", "preferred", "bonus"
- **Default:** If unclear, high-importance = required, medium/low = preferred

### Weight Constants

```typescript
// Importance weights
const IMPORTANCE_WEIGHTS = {
  high: 1.0,
  medium: 0.6,
  low: 0.3
} as const;

// Match type weights
const MATCH_TYPE_WEIGHTS = {
  exact: 1.0,
  fuzzy: 0.85,
  semantic: 0.65
} as const;

// Placement weights (NEW)
const PLACEMENT_WEIGHTS = {
  skills_section: 1.0,      // Listed in dedicated Skills section
  summary: 0.90,            // Mentioned in professional summary
  experience_bullet: 0.85,  // In an experience bullet point
  experience_paragraph: 0.70, // Buried in paragraph text
  education: 0.80,          // In education section
  projects: 0.85,           // In projects section
  other: 0.65               // Elsewhere (footer, interests, etc.)
} as const;

// Penalty for missing REQUIRED keywords
const MISSING_REQUIRED_PENALTY = 0.12; // Each missing required keyword reduces score ceiling by 12%

// Bonus cap for PREFERRED keywords
const PREFERRED_BONUS_CAP = 0.25; // Preferred keywords can add up to 25% bonus

// Minimum score multiplier (floor after penalties)
const MIN_PENALTY_MULTIPLIER = 0.30;
```

### Calculation Logic

```typescript
interface KeywordMatch {
  keyword: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  requirement: 'required' | 'preferred';
  found: boolean;
  matchType?: 'exact' | 'fuzzy' | 'semantic';
  placement?: keyof typeof PLACEMENT_WEIGHTS;
  context?: string;
}

interface KeywordScoreResult {
  score: number; // 0.00 to 1.00
  breakdown: {
    requiredScore: number;      // Score from required keywords (0-1)
    preferredBonus: number;     // Bonus from preferred keywords (0-0.25)
    penaltyMultiplier: number;  // Penalty for missing required (0.30-1.0)
    missingRequiredCount: number;
    missingPreferredCount: number;
  };
  details: {
    matchedRequired: KeywordMatch[];
    matchedPreferred: KeywordMatch[];
    missingRequired: string[];    // Critical - shown prominently in UI
    missingPreferred: string[];   // Secondary - shown as opportunities
  };
}

function calculateKeywordScore(keywords: KeywordMatch[]): KeywordScoreResult {
  // Separate required vs preferred
  const requiredKeywords = keywords.filter(k => k.requirement === 'required');
  const preferredKeywords = keywords.filter(k => k.requirement === 'preferred');
  
  // === REQUIRED KEYWORDS (base score) ===
  let requiredAchieved = 0;
  let requiredPossible = 0;
  let missingRequiredCount = 0;
  const matchedRequired: KeywordMatch[] = [];
  const missingRequired: string[] = [];
  
  for (const kw of requiredKeywords) {
    const importanceWeight = IMPORTANCE_WEIGHTS[kw.importance];
    requiredPossible += importanceWeight;
    
    if (kw.found && kw.matchType && kw.placement) {
      const matchWeight = MATCH_TYPE_WEIGHTS[kw.matchType];
      const placementWeight = PLACEMENT_WEIGHTS[kw.placement];
      requiredAchieved += importanceWeight * matchWeight * placementWeight;
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
    1 - (missingRequiredCount * MISSING_REQUIRED_PENALTY)
  );
  
  // === PREFERRED KEYWORDS (bonus) ===
  let preferredAchieved = 0;
  let preferredPossible = 0;
  const matchedPreferred: KeywordMatch[] = [];
  const missingPreferred: string[] = [];
  
  for (const kw of preferredKeywords) {
    const importanceWeight = IMPORTANCE_WEIGHTS[kw.importance];
    preferredPossible += importanceWeight;
    
    if (kw.found && kw.matchType && kw.placement) {
      const matchWeight = MATCH_TYPE_WEIGHTS[kw.matchType];
      const placementWeight = PLACEMENT_WEIGHTS[kw.placement];
      preferredAchieved += importanceWeight * matchWeight * placementWeight;
      matchedPreferred.push(kw);
    } else {
      missingPreferred.push(kw.keyword);
    }
  }
  
  // Preferred keywords contribute a bonus (capped at 25%)
  const preferredRatio = preferredPossible > 0 ? preferredAchieved / preferredPossible : 0;
  const preferredBonus = preferredRatio * PREFERRED_BONUS_CAP;
  
  // === FINAL SCORE ===
  // Base score from required, multiplied by penalty, plus preferred bonus
  const baseScore = requiredScore * penaltyMultiplier;
  const finalScore = Math.min(1, baseScore + preferredBonus);
  
  return {
    score: Math.round(finalScore * 100) / 100,
    breakdown: {
      requiredScore: Math.round(requiredScore * 100) / 100,
      preferredBonus: Math.round(preferredBonus * 100) / 100,
      penaltyMultiplier: Math.round(penaltyMultiplier * 100) / 100,
      missingRequiredCount,
      missingPreferredCount: missingPreferred.length
    },
    details: {
      matchedRequired,
      matchedPreferred,
      missingRequired,
      missingPreferred
    }
  };
}
```

### Score Impact Examples

| Scenario | Calculation | Result |
|----------|-------------|--------|
| All 10 required exact, all 8 preferred exact | (1.0 × 1.0) + 0.25 = 1.0 (capped) | **100%** |
| All 10 required exact, 0 preferred | (1.0 × 1.0) + 0 = 1.0 | **100%** |
| 8/10 required exact, 0 preferred | (0.8 × 0.76) = 0.61 | **61%** |
| 8/10 required semantic, 4/8 preferred exact | (0.52 × 0.76) + 0.125 = 0.52 | **52%** |
| 6/10 required exact, missing 4 high-importance | (0.6 × 0.52) = 0.31 | **31%** |
| Alex Chen (all keywords) | ~1.0 × 1.0 + 0.25 | **~95-100%** |
| Casey Brown (missing Django, Angular, CI/CD) | ~0.65 × 0.64 + 0.02 | **~44%** |

---

## Component 2: Qualification Fit Score (15%)

This component checks if the resume meets the JD's explicit requirements for degree, years of experience, and required certifications.

### Qualification Extraction

```typescript
interface JDQualifications {
  degreeRequired?: {
    level: 'high_school' | 'associate' | 'bachelor' | 'master' | 'phd';
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

interface ResumeQualifications {
  degree?: {
    level: 'high_school' | 'associate' | 'bachelor' | 'master' | 'phd';
    field: string;
    institution?: string;
    gpa?: number;
  };
  totalExperienceYears: number;
  certifications: string[];
}
```

### Degree Level Hierarchy

```typescript
const DEGREE_LEVELS = {
  high_school: 1,
  associate: 2,
  bachelor: 3,
  master: 4,
  phd: 5
} as const;

const DEGREE_FIELD_MATCHES: Record<string, string[]> = {
  'computer_science': [
    'computer science', 'cs', 'computing', 'computational'
  ],
  'software_engineering': [
    'software engineering', 'software development'
  ],
  'information_technology': [
    'information technology', 'it', 'information systems', 'mis'
  ],
  'engineering': [
    'engineering', 'electrical engineering', 'computer engineering'
  ],
  'related': [
    'mathematics', 'math', 'physics', 'data science', 'statistics'
  ]
};
```

### Calculation Logic

```typescript
interface QualificationFitResult {
  score: number; // 0.00 to 1.00
  breakdown: {
    degreeScore: number;       // 0-1
    experienceScore: number;   // 0-1
    certificationScore: number; // 0-1
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

function calculateQualificationFit(
  jdQuals: JDQualifications,
  resumeQuals: ResumeQualifications
): QualificationFitResult {
  
  // === DEGREE FIT (40% of qualification score) ===
  let degreeScore = 1.0; // Default if not required
  let degreeMet = true;
  let degreeNote: string | undefined;
  
  if (jdQuals.degreeRequired) {
    const requiredLevel = DEGREE_LEVELS[jdQuals.degreeRequired.level];
    const hasLevel = resumeQuals.degree ? DEGREE_LEVELS[resumeQuals.degree.level] : 0;
    
    if (hasLevel >= requiredLevel) {
      // Check field match
      const fieldMatch = checkFieldMatch(
        resumeQuals.degree?.field || '',
        jdQuals.degreeRequired.fields || []
      );
      
      if (fieldMatch === 'exact') {
        degreeScore = 1.0;
        degreeNote = 'Degree fully matches requirements';
      } else if (fieldMatch === 'related') {
        degreeScore = 0.85;
        degreeNote = 'Degree in related field';
      } else {
        degreeScore = 0.70;
        degreeNote = 'Degree level met but field differs';
      }
    } else if (hasLevel === requiredLevel - 1) {
      // One level below (e.g., Bachelor's when Master's required)
      degreeScore = jdQuals.degreeRequired.required ? 0.50 : 0.75;
      degreeMet = false;
      degreeNote = 'Degree level below requirement';
    } else {
      // Significantly below or missing
      degreeScore = jdQuals.degreeRequired.required ? 0.20 : 0.50;
      degreeMet = false;
      degreeNote = resumeQuals.degree ? 'Degree level significantly below requirement' : 'No degree listed';
    }
  }
  
  // === EXPERIENCE FIT (40% of qualification score) ===
  let experienceScore = 1.0;
  let experienceMet = true;
  let experienceNote: string | undefined;
  
  if (jdQuals.experienceRequired) {
    const required = jdQuals.experienceRequired.minYears;
    const has = resumeQuals.totalExperienceYears;
    
    if (has >= required) {
      experienceScore = 1.0;
      experienceNote = `${has} years meets ${required}+ requirement`;
    } else if (has >= required * 0.75) {
      // Within 75% of requirement
      experienceScore = 0.75;
      experienceMet = false;
      experienceNote = `${has} years slightly below ${required}+ requirement`;
    } else if (has >= required * 0.5) {
      // Within 50% of requirement
      experienceScore = jdQuals.experienceRequired.required ? 0.40 : 0.60;
      experienceMet = false;
      experienceNote = `${has} years below ${required}+ requirement`;
    } else {
      // Significantly below
      experienceScore = jdQuals.experienceRequired.required ? 0.15 : 0.40;
      experienceMet = false;
      experienceNote = `${has} years significantly below ${required}+ requirement`;
    }
  }
  
  // === CERTIFICATION FIT (20% of qualification score) ===
  let certificationScore = 1.0;
  const certificationsMet: string[] = [];
  const certificationsMissing: string[] = [];
  
  if (jdQuals.certificationsRequired && jdQuals.certificationsRequired.certifications.length > 0) {
    const required = jdQuals.certificationsRequired.certifications;
    const has = resumeQuals.certifications.map(c => c.toLowerCase());
    
    for (const reqCert of required) {
      const found = has.some(c => 
        c.includes(reqCert.toLowerCase()) || 
        reqCert.toLowerCase().includes(c)
      );
      if (found) {
        certificationsMet.push(reqCert);
      } else {
        certificationsMissing.push(reqCert);
      }
    }
    
    certificationScore = required.length > 0 
      ? certificationsMet.length / required.length 
      : 1.0;
  }
  
  // === COMBINED SCORE ===
  const score = (
    degreeScore * 0.40 +
    experienceScore * 0.40 +
    certificationScore * 0.20
  );
  
  return {
    score: Math.round(score * 100) / 100,
    breakdown: {
      degreeScore: Math.round(degreeScore * 100) / 100,
      experienceScore: Math.round(experienceScore * 100) / 100,
      certificationScore: Math.round(certificationScore * 100) / 100
    },
    details: {
      degreeMet,
      degreeNote,
      experienceMet,
      experienceNote,
      certificationsMet,
      certificationsMissing
    }
  };
}

function checkFieldMatch(resumeField: string, requiredFields: string[]): 'exact' | 'related' | 'none' {
  const fieldLower = resumeField.toLowerCase();
  
  // Check for exact match
  for (const [category, aliases] of Object.entries(DEGREE_FIELD_MATCHES)) {
    if (aliases.some(alias => fieldLower.includes(alias))) {
      if (requiredFields.some(req => 
        req.toLowerCase().includes(category.replace('_', ' ')) ||
        aliases.some(alias => req.toLowerCase().includes(alias))
      )) {
        return 'exact';
      }
    }
  }
  
  // Check for "related field" allowance
  if (requiredFields.some(req => req.toLowerCase().includes('related'))) {
    // Check if resume field is in any technical category
    for (const aliases of Object.values(DEGREE_FIELD_MATCHES)) {
      if (aliases.some(alias => fieldLower.includes(alias))) {
        return 'related';
      }
    }
  }
  
  return 'none';
}
```

### Experience Year Extraction

```typescript
function extractExperienceYears(experienceSection: string): number {
  // Pattern: "Month Year - Month Year" or "Year - Year" or "Year - Present"
  const dateRangePattern = /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+)?(\d{4})\s*[-–—]\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+)?(\d{4}|Present|Current|Now)/gi;
  
  let totalMonths = 0;
  let match;
  const currentYear = new Date().getFullYear();
  
  while ((match = dateRangePattern.exec(experienceSection)) !== null) {
    const startYear = parseInt(match[1]);
    const endYear = match[2].toLowerCase() === 'present' || 
                    match[2].toLowerCase() === 'current' ||
                    match[2].toLowerCase() === 'now'
                      ? currentYear 
                      : parseInt(match[2]);
    
    if (!isNaN(startYear) && !isNaN(endYear) && endYear >= startYear) {
      totalMonths += (endYear - startYear) * 12 + 6; // Assume mid-year average
    }
  }
  
  return Math.round(totalMonths / 12 * 10) / 10; // Return years with 1 decimal
}
```

---

## Component 3: Content Quality Score (20%)

This component evaluates ALL bullet-point content across experience, projects, and education sections. It measures quantification quality (not just presence), action verb strength (with penalties for weak verbs), and keyword density.

### Quantification Quality Tiers

```typescript
// Quality tiers for quantification
type QuantificationTier = 'high' | 'medium' | 'low';

interface QuantificationMatch {
  text: string;
  tier: QuantificationTier;
  type: 'currency' | 'percentage' | 'multiplier' | 'count' | 'time' | 'scale';
}

const QUANTIFICATION_PATTERNS: Array<{
  pattern: RegExp;
  tier: QuantificationTier;
  type: QuantificationMatch['type'];
}> = [
  // HIGH TIER - Business impact, large scale
  { pattern: /\$[\d,]+(?:\.\d+)?[MBT]/i, tier: 'high', type: 'currency' },       // $50M, $1.2B
  { pattern: /\$[\d,]+(?:\.\d+)?K/i, tier: 'medium', type: 'currency' },          // $200K
  { pattern: /\$[\d,]+(?:\.\d+)?(?!\d)/i, tier: 'low', type: 'currency' },        // $5000
  
  { pattern: /\b9\d(?:\.\d+)?%/i, tier: 'high', type: 'percentage' },             // 90%+, 99.99%
  { pattern: /\b[5-8]\d%/i, tier: 'medium', type: 'percentage' },                  // 50-89%
  { pattern: /\b[1-4]?\d%/i, tier: 'low', type: 'percentage' },                    // 1-49%
  
  { pattern: /\b\d{2,}x\b/i, tier: 'high', type: 'multiplier' },                   // 10x, 100x
  { pattern: /\b[2-9]x\b/i, tier: 'medium', type: 'multiplier' },                  // 2x-9x
  
  { pattern: /\b\d{1,3}(?:,\d{3}){2,}\+?\b/, tier: 'high', type: 'count' },       // 1,000,000+
  { pattern: /\b\d{1,3}(?:,\d{3})\+?\s*(?:users?|customers?|requests?)/i, tier: 'medium', type: 'count' }, // 10,000 users
  { pattern: /\b\d+\+?\s*(?:users?|customers?|clients?)/i, tier: 'low', type: 'count' }, // 500 users
  
  { pattern: /team\s+of\s+\d{2,}/i, tier: 'high', type: 'scale' },                 // team of 10+
  { pattern: /team\s+of\s+\d/i, tier: 'medium', type: 'scale' },                   // team of 5
  
  { pattern: /\b\d+\s*(?:countries|regions|markets)\b/i, tier: 'high', type: 'scale' }, // 15 countries
];

function extractQuantifications(text: string): QuantificationMatch[] {
  const matches: QuantificationMatch[] = [];
  
  for (const { pattern, tier, type } of QUANTIFICATION_PATTERNS) {
    const found = text.match(pattern);
    if (found) {
      matches.push({ text: found[0], tier, type });
    }
  }
  
  return matches;
}
```

### Action Verb Classification

```typescript
const STRONG_ACTION_VERBS = new Set([
  // Leadership & Strategic Impact
  'architected', 'spearheaded', 'pioneered', 'transformed', 'revolutionized',
  'orchestrated', 'championed', 'drove', 'directed', 'headed',
  
  // Ownership & Delivery
  'led', 'owned', 'delivered', 'launched', 'shipped', 'executed',
  'established', 'founded', 'built', 'created', 'developed',
  
  // Achievement & Results
  'achieved', 'exceeded', 'surpassed', 'generated', 'produced',
  'increased', 'decreased', 'reduced', 'improved', 'optimized',
  'accelerated', 'streamlined', 'enhanced', 'maximized', 'minimized',
  
  // Technical Excellence
  'designed', 'engineered', 'implemented', 'integrated', 'automated',
  'migrated', 'scaled', 'refactored', 'debugged', 'deployed',
  
  // Analysis & Strategy
  'analyzed', 'evaluated', 'assessed', 'identified', 'discovered',
  'researched', 'investigated', 'diagnosed', 'solved', 'resolved'
]);

const MODERATE_ACTION_VERBS = new Set([
  // Collaboration (appropriate for junior/co-op)
  'contributed', 'collaborated', 'partnered', 'coordinated', 'facilitated',
  'supported', 'assisted', 'participated', 'engaged',
  
  // Standard professional
  'managed', 'maintained', 'handled', 'processed', 'performed',
  'conducted', 'completed', 'prepared', 'organized', 'documented',
  'wrote', 'tested', 'reviewed', 'updated', 'modified'
]);

const WEAK_ACTION_VERBS = new Set([
  // Passive / Vague
  'helped', 'worked', 'was responsible for', 'was involved in',
  'dealt with', 'tasked with', 'in charge of', 'looked after',
  
  // Low-impact
  'tried', 'attempted', 'learned', 'studied', 'observed',
  'watched', 'saw', 'knew', 'understood', 'familiarized'
]);

type VerbStrength = 'strong' | 'moderate' | 'weak' | 'unknown';

function classifyActionVerb(bullet: string): VerbStrength {
  const words = bullet.trim().toLowerCase().split(/\s+/);
  const firstWord = words[0]?.replace(/[^a-z]/g, '');
  const firstTwoWords = words.slice(0, 2).join(' ');
  
  // Check multi-word phrases first
  if (WEAK_ACTION_VERBS.has(firstTwoWords)) return 'weak';
  
  // Check single word
  if (STRONG_ACTION_VERBS.has(firstWord)) return 'strong';
  if (MODERATE_ACTION_VERBS.has(firstWord)) return 'moderate';
  if (WEAK_ACTION_VERBS.has(firstWord)) return 'weak';
  
  return 'unknown';
}
```

### Calculation Logic

```typescript
interface ContentQualityInput {
  // ALL bullet-point content combined
  bullets: string[];
  // Source tracking for weighting
  bulletSources: {
    experience: number;
    projects: number;
    education: number;
  };
  // JD keywords for density check
  jdKeywords: string[];
  // Job type affects verb expectations
  jobType: 'coop' | 'fulltime';
}

interface ContentQualityResult {
  score: number; // 0.00 to 1.00
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

function calculateContentQuality(input: ContentQualityInput): ContentQualityResult {
  const { bullets, bulletSources, jdKeywords, jobType } = input;
  
  if (bullets.length === 0) {
    return {
      score: 0,
      breakdown: { quantificationScore: 0, actionVerbScore: 0, keywordDensityScore: 0 },
      details: {
        totalBullets: 0, bulletsWithMetrics: 0,
        highTierMetrics: 0, mediumTierMetrics: 0, lowTierMetrics: 0,
        strongVerbCount: 0, moderateVerbCount: 0, weakVerbCount: 0,
        keywordsFound: [], keywordsMissing: jdKeywords
      }
    };
  }
  
  // === QUANTIFICATION SCORE (35%) ===
  let quantificationPoints = 0;
  let bulletsWithMetrics = 0;
  let highTierMetrics = 0;
  let mediumTierMetrics = 0;
  let lowTierMetrics = 0;
  
  for (const bullet of bullets) {
    const quants = extractQuantifications(bullet);
    if (quants.length > 0) {
      bulletsWithMetrics++;
      // Take best tier from bullet
      const bestTier = quants.reduce((best, q) => {
        const tierValue = { high: 3, medium: 2, low: 1 };
        return tierValue[q.tier] > tierValue[best] ? q.tier : best;
      }, 'low' as QuantificationTier);
      
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
  const quantQuality = bulletsWithMetrics > 0 ? quantificationPoints / bulletsWithMetrics : 0;
  const quantificationScore = (quantCoverage * 0.6) + (quantQuality * 0.4);
  
  // === ACTION VERB SCORE (30%) ===
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
  let actionVerbScore: number;
  if (jobType === 'coop') {
    // Co-op: moderate verbs are acceptable, weak verbs slight penalty
    const goodVerbs = strongVerbCount + moderateVerbCount;
    actionVerbScore = (goodVerbs / bullets.length) - (weakVerbCount * 0.05);
  } else {
    // Full-time: strong verbs expected, moderate acceptable, weak penalized
    const verbPoints = (strongVerbCount * 1.0) + (moderateVerbCount * 0.6) - (weakVerbCount * 0.2);
    actionVerbScore = verbPoints / bullets.length;
  }
  actionVerbScore = Math.max(0, Math.min(1, actionVerbScore));
  
  // === KEYWORD DENSITY SCORE (35%) ===
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
  const keywordDensityScore = jdKeywords.length > 0
    ? Math.min(1, (keywordsFound.length / jdKeywords.length) / 0.5)
    : 0.5;
  
  // === COMBINED SCORE ===
  const score = (
    quantificationScore * 0.35 +
    actionVerbScore * 0.30 +
    keywordDensityScore * 0.35
  );
  
  return {
    score: Math.round(score * 100) / 100,
    breakdown: {
      quantificationScore: Math.round(quantificationScore * 100) / 100,
      actionVerbScore: Math.round(actionVerbScore * 100) / 100,
      keywordDensityScore: Math.round(keywordDensityScore * 100) / 100
    },
    details: {
      totalBullets: bullets.length,
      bulletsWithMetrics,
      highTierMetrics,
      mediumTierMetrics,
      lowTierMetrics,
      strongVerbCount,
      moderateVerbCount,
      weakVerbCount,
      keywordsFound,
      keywordsMissing
    }
  };
}
```

---

## Component 4: Section Score (15%)

The section score evaluates resume structure and content density. For co-op students, it also evaluates education quality.

### Section Configuration

```typescript
interface SectionConfig {
  required: boolean;
  minLength?: number;
  minItems?: number;
  minBullets?: number;
  maxPoints: number;
}

function getSectionConfig(jobType: 'coop' | 'fulltime'): Record<string, SectionConfig> {
  const isCoOp = jobType === 'coop';
  
  return {
    summary: {
      required: true,
      minLength: 50,
      maxPoints: 15
    },
    skills: {
      required: true,
      minItems: 8,  // Increased from 5
      maxPoints: 25
    },
    experience: {
      required: !isCoOp, // Not required for co-op if they have projects
      minBullets: isCoOp ? 3 : 6,
      maxPoints: isCoOp ? 20 : 30
    },
    education: {
      required: true,
      minLength: 30,
      maxPoints: isCoOp ? 25 : 15
    },
    projects: {
      required: isCoOp, // Required for co-op
      minBullets: 2,
      maxPoints: isCoOp ? 20 : 10
    },
    certifications: {
      required: false,
      minItems: 1,
      maxPoints: 10
    }
  };
}
```

### Education Quality Evaluation (Co-op Focus)

```typescript
interface EducationQualityInput {
  educationText: string;
  jdKeywords: string[];
  jobType: 'coop' | 'fulltime';
}

interface EducationQualityResult {
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

function evaluateEducationQuality(input: EducationQualityInput): EducationQualityResult {
  const { educationText, jdKeywords, jobType } = input;
  const textLower = educationText.toLowerCase();
  
  // Check for relevant coursework
  const courseworkPattern = /(?:relevant\s+)?coursework[:\s]+([^.]+)/i;
  const courseworkMatch = educationText.match(courseworkPattern);
  const hasRelevantCoursework = !!courseworkMatch;
  
  // Match coursework against JD keywords
  let courseworkMatchScore = 0;
  if (courseworkMatch) {
    const courseworkText = courseworkMatch[1].toLowerCase();
    const matchedKeywords = jdKeywords.filter(kw => 
      courseworkText.includes(kw.toLowerCase())
    );
    courseworkMatchScore = jdKeywords.length > 0 
      ? matchedKeywords.length / Math.min(jdKeywords.length, 10) 
      : 0;
  }
  
  // Check for GPA
  const gpaPattern = /gpa[:\s]*(\d+\.?\d*)/i;
  const gpaMatch = educationText.match(gpaPattern);
  const hasGPA = !!gpaMatch;
  const gpaStrong = hasGPA && parseFloat(gpaMatch![1]) >= 3.5;
  
  // Check for projects/capstone
  const hasProjects = /(?:capstone|project|thesis|research)/i.test(textLower);
  
  // Check for honors
  const hasHonors = /(?:dean'?s?\s*list|honors?|cum\s*laude|magna|summa|distinction)/i.test(textLower);
  
  // Check for location
  const hasLocation = /[A-Z][a-z]+,\s*[A-Z]{2}\b/.test(educationText);
  
  // Check for proper date format
  const hasProperDateFormat = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}|Expected|Graduated/i.test(educationText);
  
  // Calculate score (weights depend on job type)
  let score: number;
  const suggestions: string[] = [];
  
  if (jobType === 'coop') {
    // For co-op, education is critical
    score = (
      (hasRelevantCoursework ? 0.30 : 0) +
      (courseworkMatchScore * 0.25) +
      (hasGPA ? (gpaStrong ? 0.15 : 0.08) : 0) +
      (hasProjects ? 0.15 : 0) +
      (hasHonors ? 0.10 : 0) +
      (hasProperDateFormat ? 0.05 : 0)
    );
    
    if (!hasRelevantCoursework) suggestions.push('Add relevant coursework matching JD requirements');
    if (!hasGPA) suggestions.push('Add GPA if 3.0+ (critical for co-op applications)');
    if (!hasProjects) suggestions.push('Add capstone project or academic projects');
    if (!hasHonors && gpaStrong) suggestions.push('Add Dean\'s List or honors if applicable');
  } else {
    // For full-time, education is less critical
    score = (
      (hasRelevantCoursework ? 0.20 : 0) +
      (courseworkMatchScore * 0.15) +
      (hasGPA && gpaStrong ? 0.15 : 0) +
      (hasProjects ? 0.15 : 0) +
      (hasHonors ? 0.10 : 0) +
      (hasProperDateFormat ? 0.10 : 0) +
      0.15 // Base credit for having education section
    );
  }
  
  return {
    score: Math.min(1, Math.round(score * 100) / 100),
    breakdown: {
      hasRelevantCoursework,
      courseworkMatchScore: Math.round(courseworkMatchScore * 100) / 100,
      hasGPA,
      gpaStrong,
      hasProjects,
      hasHonors,
      hasLocation,
      hasProperDateFormat
    },
    suggestions
  };
}
```

### Section Score Calculation

```typescript
interface SectionScoreInput {
  sections: {
    summary?: string;
    skills?: string[];
    experience?: string[];
    education?: string;
    projects?: string[];
    certifications?: string[];
  };
  jobType: 'coop' | 'fulltime';
  jdKeywords: string[];
}

interface SectionScoreResult {
  score: number;
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

function calculateSectionScore(input: SectionScoreInput): SectionScoreResult {
  const { sections, jobType, jdKeywords } = input;
  const config = getSectionConfig(jobType);
  
  let achievedPoints = 0;
  let possiblePoints = 0;
  const breakdown: SectionScoreResult['breakdown'] = {};
  
  // === SUMMARY ===
  const summaryConfig = config.summary;
  possiblePoints += summaryConfig.maxPoints;
  const summaryLength = sections.summary?.trim().length ?? 0;
  
  if (summaryLength >= summaryConfig.minLength!) {
    achievedPoints += summaryConfig.maxPoints;
    breakdown.summary = { present: true, meetsThreshold: true, points: summaryConfig.maxPoints, maxPoints: summaryConfig.maxPoints };
  } else if (summaryLength > 0) {
    const partial = summaryConfig.maxPoints * Math.min(1, summaryLength / summaryConfig.minLength!);
    achievedPoints += partial;
    breakdown.summary = { 
      present: true, 
      meetsThreshold: false, 
      points: Math.round(partial * 10) / 10, 
      maxPoints: summaryConfig.maxPoints,
      issues: [`Summary too short (${summaryLength}/${summaryConfig.minLength} chars)`]
    };
  } else {
    // Check for "OBJECTIVE" (outdated format)
    breakdown.summary = { 
      present: false, 
      meetsThreshold: false, 
      points: 0, 
      maxPoints: summaryConfig.maxPoints, 
      issues: ['No professional summary section'] 
    };
  }
  
  // === SKILLS ===
  const skillsConfig = config.skills;
  possiblePoints += skillsConfig.maxPoints;
  const skillCount = sections.skills?.length ?? 0;
  
  if (skillCount >= skillsConfig.minItems!) {
    achievedPoints += skillsConfig.maxPoints;
    breakdown.skills = { present: true, meetsThreshold: true, points: skillsConfig.maxPoints, maxPoints: skillsConfig.maxPoints };
  } else if (skillCount > 0) {
    const partial = skillsConfig.maxPoints * (skillCount / skillsConfig.minItems!);
    achievedPoints += partial;
    breakdown.skills = { 
      present: true, 
      meetsThreshold: false, 
      points: Math.round(partial * 10) / 10, 
      maxPoints: skillsConfig.maxPoints,
      issues: [`Only ${skillCount} skills listed (recommend ${skillsConfig.minItems}+)`]
    };
  } else {
    breakdown.skills = { present: false, meetsThreshold: false, points: 0, maxPoints: skillsConfig.maxPoints, issues: ['No skills section'] };
  }
  
  // === EXPERIENCE ===
  const expConfig = config.experience;
  if (expConfig.required || (sections.experience && sections.experience.length > 0)) {
    possiblePoints += expConfig.maxPoints;
    const bulletCount = sections.experience?.length ?? 0;
    
    if (bulletCount >= expConfig.minBullets!) {
      achievedPoints += expConfig.maxPoints;
      breakdown.experience = { present: true, meetsThreshold: true, points: expConfig.maxPoints, maxPoints: expConfig.maxPoints };
    } else if (bulletCount > 0) {
      const partial = expConfig.maxPoints * (bulletCount / expConfig.minBullets!);
      achievedPoints += partial;
      breakdown.experience = { 
        present: true, 
        meetsThreshold: false, 
        points: Math.round(partial * 10) / 10, 
        maxPoints: expConfig.maxPoints,
        issues: [`Only ${bulletCount} experience bullets (recommend ${expConfig.minBullets}+)`]
      };
    } else {
      breakdown.experience = { present: false, meetsThreshold: false, points: 0, maxPoints: expConfig.maxPoints, issues: ['No experience section'] };
    }
  }
  
  // === EDUCATION (with quality evaluation) ===
  const eduConfig = config.education;
  possiblePoints += eduConfig.maxPoints;
  
  let educationQuality: EducationQualityResult | undefined;
  
  if (sections.education && sections.education.length >= eduConfig.minLength!) {
    educationQuality = evaluateEducationQuality({
      educationText: sections.education,
      jdKeywords,
      jobType
    });
    
    // Score is combination of presence and quality
    const presenceScore = 0.4;
    const qualityBonus = educationQuality.score * 0.6;
    const eduScore = presenceScore + qualityBonus;
    
    const points = eduConfig.maxPoints * eduScore;
    achievedPoints += points;
    
    breakdown.education = { 
      present: true, 
      meetsThreshold: educationQuality.score >= 0.5, 
      points: Math.round(points * 10) / 10, 
      maxPoints: eduConfig.maxPoints,
      qualityScore: educationQuality.score,
      issues: educationQuality.suggestions
    };
  } else if (sections.education) {
    const partial = eduConfig.maxPoints * 0.3; // Minimal credit for sparse education
    achievedPoints += partial;
    breakdown.education = { 
      present: true, 
      meetsThreshold: false, 
      points: Math.round(partial * 10) / 10, 
      maxPoints: eduConfig.maxPoints,
      issues: ['Education section is sparse - add coursework, GPA, or projects']
    };
  } else {
    breakdown.education = { present: false, meetsThreshold: false, points: 0, maxPoints: eduConfig.maxPoints, issues: ['No education section'] };
  }
  
  // === PROJECTS ===
  const projConfig = config.projects;
  if (projConfig.required || (sections.projects && sections.projects.length > 0)) {
    possiblePoints += projConfig.maxPoints;
    const projCount = sections.projects?.length ?? 0;
    
    if (projCount >= projConfig.minBullets!) {
      achievedPoints += projConfig.maxPoints;
      breakdown.projects = { present: true, meetsThreshold: true, points: projConfig.maxPoints, maxPoints: projConfig.maxPoints };
    } else if (projCount > 0) {
      const partial = projConfig.maxPoints * (projCount / projConfig.minBullets!);
      achievedPoints += partial;
      breakdown.projects = { 
        present: true, 
        meetsThreshold: false, 
        points: Math.round(partial * 10) / 10, 
        maxPoints: projConfig.maxPoints,
        issues: [`Only ${projCount} project entries (recommend ${projConfig.minBullets}+)`]
      };
    } else if (projConfig.required) {
      breakdown.projects = { present: false, meetsThreshold: false, points: 0, maxPoints: projConfig.maxPoints, issues: ['No projects section (important for co-op)'] };
    }
  }
  
  // === CERTIFICATIONS (bonus) ===
  const certConfig = config.certifications;
  const certCount = sections.certifications?.length ?? 0;
  
  if (certCount >= certConfig.minItems!) {
    possiblePoints += certConfig.maxPoints;
    achievedPoints += certConfig.maxPoints;
    breakdown.certifications = { present: true, meetsThreshold: true, points: certConfig.maxPoints, maxPoints: certConfig.maxPoints };
  }
  // Don't penalize for missing certifications (optional section)
  
  const score = possiblePoints > 0 ? achievedPoints / possiblePoints : 0;
  
  return {
    score: Math.round(score * 100) / 100,
    breakdown,
    educationQuality
  };
}
```

---

## Component 5: Format Score (10%)

The format score detects ATS parseability signals, including penalties for outdated formats.

### Format Patterns and Penalties

```typescript
// Outdated format indicators
const OUTDATED_FORMATS = {
  objective: /\b(?:objective|career\s+objective)\s*[:|\n]/i,
  references: /\breferences\s+(?:available\s+)?(?:upon|on)\s+request\b/i,
  photo: /\b(?:photo|picture|headshot)\b/i, // Should not have photo reference
};

// Modern format indicators
const MODERN_FORMAT_SIGNALS = {
  linkedin: /linkedin\.com\/in\//i,
  github: /github\.com\//i,
  portfolio: /(?:portfolio|website)[:\s]+https?:\/\//i,
  professionalEmail: /[\w.-]+@(?!yahoo|aol|hotmail)[\w.-]+\.\w+/i, // Not outdated email providers
};
```

### Calculation Logic

```typescript
interface FormatScoreInput {
  resumeText: string;
  hasExperience: boolean;
  hasSummary: boolean;
}

interface FormatScoreResult {
  score: number;
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

function calculateFormatScore(input: FormatScoreInput): FormatScoreResult {
  const { resumeText, hasExperience, hasSummary } = input;
  
  let score = 1.0;
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // === CONTACT INFORMATION (20%) ===
  const emailPattern = /[\w.-]+@[\w.-]+\.\w{2,}/;
  const hasEmail = emailPattern.test(resumeText);
  if (!hasEmail) {
    score -= 0.10;
    issues.push('No email address detected');
  }
  
  const phonePattern = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const hasPhone = phonePattern.test(resumeText);
  if (!hasPhone) {
    score -= 0.05;
    warnings.push('No phone number detected');
  }
  
  // LinkedIn (bonus for having, no penalty for missing)
  const hasLinkedIn = MODERN_FORMAT_SIGNALS.linkedin.test(resumeText);
  if (hasLinkedIn) {
    score += 0.03;
  }
  
  // GitHub (bonus for tech roles)
  const hasGitHub = MODERN_FORMAT_SIGNALS.github.test(resumeText);
  if (hasGitHub) {
    score += 0.02;
  }
  
  // === DATE FORMAT RECOGNITION (15%) ===
  const datePatterns = [
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/gi,
    /\b\d{1,2}\/\d{4}\b/g,
    /\b\d{4}\s*[-–—]\s*(?:\d{4}|Present|Current|Now)\b/gi,
  ];
  
  const dateMatches = datePatterns.flatMap(p => resumeText.match(p) || []);
  const hasParseableDates = dateMatches.length >= 2;
  
  if (!hasParseableDates && hasExperience) {
    score -= 0.10;
    issues.push('Few or no parseable date formats found');
  }
  
  // === SECTION HEADERS (15%) ===
  const sectionHeaderPatterns = [
    /\b(?:experience|work\s*experience|employment|professional\s*experience)\b/i,
    /\b(?:education|academic)\b/i,
    /\b(?:skills|technical\s*skills|core\s*competencies)\b/i,
    /\b(?:summary|profile|professional\s*summary)\b/i,
  ];
  
  let headersFound = 0;
  for (const pattern of sectionHeaderPatterns) {
    if (pattern.test(resumeText)) headersFound++;
  }
  
  const hasSectionHeaders = headersFound >= 3;
  if (headersFound < 3) {
    score -= 0.08;
    warnings.push(`Only ${headersFound} standard section headers detected`);
  }
  
  // === BULLET STRUCTURE (10%) ===
  const bulletPatterns = [
    /^[\u2022\u2023\u25E6\u2043\u2219•]\s/m,
    /^[-*]\s/m,
    /^\d+\.\s/m
  ];
  
  const hasBulletStructure = bulletPatterns.some(p => p.test(resumeText));
  if (!hasBulletStructure && hasExperience) {
    score -= 0.07;
    warnings.push('No clear bullet point structure detected');
  }
  
  // === LENGTH CHECK (10%) ===
  const wordCount = resumeText.split(/\s+/).filter(w => w.length > 0).length;
  let appropriateLength = true;
  
  if (wordCount < 200) {
    score -= 0.12;
    appropriateLength = false;
    issues.push(`Resume too sparse (${wordCount} words, recommend 300+)`);
  } else if (wordCount > 1000) {
    score -= 0.05;
    appropriateLength = false;
    warnings.push(`Resume may be too long (${wordCount} words, recommend under 800)`);
  }
  
  // === OUTDATED FORMAT PENALTIES (20%) ===
  let noOutdatedFormats = true;
  
  if (OUTDATED_FORMATS.objective.test(resumeText) && !hasSummary) {
    score -= 0.10;
    noOutdatedFormats = false;
    issues.push('"Objective" section is outdated - use "Professional Summary" instead');
  }
  
  if (OUTDATED_FORMATS.references.test(resumeText)) {
    score -= 0.05;
    noOutdatedFormats = false;
    warnings.push('"References available upon request" is outdated - remove this line');
  }
  
  // === COMPLEX FORMATTING CHECK (5%) ===
  const hasComplexFormatting = /\t{2,}|\|.*\|.*\|/.test(resumeText);
  if (hasComplexFormatting) {
    score -= 0.05;
    warnings.push('Complex formatting detected (tables/columns may cause parsing issues)');
  }
  
  return {
    score: Math.max(0, Math.min(1, Math.round(score * 100) / 100)),
    breakdown: {
      hasEmail,
      hasPhone,
      hasLinkedIn,
      hasGitHub,
      hasParseableDates,
      hasSectionHeaders,
      hasBulletStructure,
      appropriateLength,
      noOutdatedFormats
    },
    issues,
    warnings
  };
}
```

---

## Role-Aware Weight Adjustments

Different job types and seniority levels weight components differently.

### Role Detection

```typescript
type JobRole = 
  | 'software_engineer'
  | 'data_analyst'
  | 'data_scientist'
  | 'product_manager'
  | 'designer'
  | 'marketing'
  | 'finance'
  | 'operations'
  | 'general';

type SeniorityLevel = 'entry' | 'mid' | 'senior' | 'executive';

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
    ['operations', [/operations/i, /supply\s+chain/i, /logistics/i]]
  ];
  
  for (const [role, patterns] of rolePatterns) {
    if (patterns.some(p => p.test(jdLower))) {
      return role;
    }
  }
  
  return 'general';
}

function detectSeniorityLevel(jdText: string, jobType: 'coop' | 'fulltime'): SeniorityLevel {
  if (jobType === 'coop') return 'entry';
  
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
```

### Weight Configuration

```typescript
interface ComponentWeights {
  keywords: number;
  qualificationFit: number;
  contentQuality: number;
  sections: number;
  format: number;
}

function getComponentWeights(
  role: JobRole,
  seniority: SeniorityLevel,
  jobType: 'coop' | 'fulltime'
): ComponentWeights {
  
  // Base weights
  let weights: ComponentWeights = {
    keywords: 0.40,
    qualificationFit: 0.15,
    contentQuality: 0.20,
    sections: 0.15,
    format: 0.10
  };
  
  // Adjustments for co-op/entry level
  if (jobType === 'coop' || seniority === 'entry') {
    weights = {
      keywords: 0.42,
      qualificationFit: 0.10,  // Less experience to verify
      contentQuality: 0.18,
      sections: 0.20,          // Education/projects matter more
      format: 0.10
    };
  }
  
  // Adjustments for senior/executive
  if (seniority === 'senior' || seniority === 'executive') {
    weights = {
      keywords: 0.35,
      qualificationFit: 0.20,  // Experience years matter more
      contentQuality: 0.25,    // Quality of achievements matters more
      sections: 0.10,
      format: 0.10
    };
  }
  
  // Role-specific adjustments
  if (role === 'designer') {
    weights.format += 0.05;    // Visual presentation matters
    weights.keywords -= 0.05;
  }
  
  if (role === 'data_scientist' || role === 'software_engineer') {
    weights.keywords += 0.03;  // Technical skills critical
    weights.sections -= 0.03;
  }
  
  // Normalize to ensure sum = 1.0
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  for (const key of Object.keys(weights) as (keyof ComponentWeights)[]) {
    weights[key] = Math.round((weights[key] / total) * 100) / 100;
  }
  
  return weights;
}
```

### Weight Summary Table

| Context | Keywords | Qual Fit | Content | Sections | Format |
|---------|----------|----------|---------|----------|--------|
| **Co-op / Entry** | 42% | 10% | 18% | 20% | 10% |
| **Mid-level (default)** | 40% | 15% | 20% | 15% | 10% |
| **Senior / Executive** | 35% | 20% | 25% | 10% | 10% |
| **Designer (any level)** | 35% | 15% | 20% | 15% | 15% |

---

## Combined Scoring Function

### Main Entry Point

```typescript
interface ATSScoreInput {
  // From keyword extraction + matching
  keywords: KeywordMatch[];
  
  // For qualification fit
  jdQualifications: JDQualifications;
  resumeQualifications: ResumeQualifications;
  
  // For content quality (all bullets combined)
  allBullets: string[];
  bulletSources: { experience: number; projects: number; education: number };
  
  // For section scoring
  sections: {
    summary?: string;
    skills?: string[];
    experience?: string[];
    education?: string;
    projects?: string[];
    certifications?: string[];
  };
  
  // For format scoring
  resumeText: string;
  
  // Context
  jobType: 'coop' | 'fulltime';
  jdText: string;
}

interface ATSScoreResult {
  overall: number; // 0-100
  tier: ScoreTier;
  breakdown: {
    keywords: {
      score: number;
      weight: number;
      weighted: number;
      details: KeywordScoreResult;
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
      details: SectionScoreResult;
    };
    format: {
      score: number;
      weight: number;
      weighted: number;
      details: FormatScoreResult;
    };
  };
  metadata: {
    detectedRole: JobRole;
    detectedSeniority: SeniorityLevel;
    weightsUsed: ComponentWeights;
  };
  actionItems: ActionItem[];
}

interface ActionItem {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  potentialImpact: number; // Estimated point improvement
}

type ScoreTier = 'excellent' | 'strong' | 'good' | 'fair' | 'weak' | 'poor';

function calculateATSScore(input: ATSScoreInput): ATSScoreResult {
  const {
    keywords,
    jdQualifications,
    resumeQualifications,
    allBullets,
    bulletSources,
    sections,
    resumeText,
    jobType,
    jdText
  } = input;
  
  // Detect role and seniority
  const detectedRole = detectJobRole(jdText);
  const detectedSeniority = detectSeniorityLevel(jdText, jobType);
  const weights = getComponentWeights(detectedRole, detectedSeniority, jobType);
  
  // Extract JD keywords for various checks
  const jdKeywords = keywords.map(k => k.keyword);
  
  // Calculate each component
  const keywordResult = calculateKeywordScore(keywords);
  
  const qualificationResult = calculateQualificationFit(jdQualifications, resumeQualifications);
  
  const contentResult = calculateContentQuality({
    bullets: allBullets,
    bulletSources,
    jdKeywords,
    jobType
  });
  
  const sectionResult = calculateSectionScore({
    sections,
    jobType,
    jdKeywords
  });
  
  const formatResult = calculateFormatScore({
    resumeText,
    hasExperience: (sections.experience?.length ?? 0) > 0,
    hasSummary: !!sections.summary
  });
  
  // Calculate weighted overall score
  const overall = Math.round(
    (keywordResult.score * weights.keywords +
     qualificationResult.score * weights.qualificationFit +
     contentResult.score * weights.contentQuality +
     sectionResult.score * weights.sections +
     formatResult.score * weights.format) * 100
  );
  
  // Determine tier
  const tier = getScoreTier(overall);
  
  // Generate prioritized action items
  const actionItems = generateActionItems(
    keywordResult,
    qualificationResult,
    contentResult,
    sectionResult,
    formatResult,
    weights
  );
  
  return {
    overall,
    tier,
    breakdown: {
      keywords: {
        score: Math.round(keywordResult.score * 100),
        weight: weights.keywords,
        weighted: Math.round(keywordResult.score * weights.keywords * 100),
        details: keywordResult
      },
      qualificationFit: {
        score: Math.round(qualificationResult.score * 100),
        weight: weights.qualificationFit,
        weighted: Math.round(qualificationResult.score * weights.qualificationFit * 100),
        details: qualificationResult
      },
      contentQuality: {
        score: Math.round(contentResult.score * 100),
        weight: weights.contentQuality,
        weighted: Math.round(contentResult.score * weights.contentQuality * 100),
        details: contentResult
      },
      sections: {
        score: Math.round(sectionResult.score * 100),
        weight: weights.sections,
        weighted: Math.round(sectionResult.score * weights.sections * 100),
        details: sectionResult
      },
      format: {
        score: Math.round(formatResult.score * 100),
        weight: weights.format,
        weighted: Math.round(formatResult.score * weights.format * 100),
        details: formatResult
      }
    },
    metadata: {
      detectedRole,
      detectedSeniority,
      weightsUsed: weights
    },
    actionItems
  };
}

function getScoreTier(score: number): ScoreTier {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'strong';
  if (score >= 70) return 'good';
  if (score >= 60) return 'fair';
  if (score >= 50) return 'weak';
  return 'poor';
}

function generateActionItems(
  keywordResult: KeywordScoreResult,
  qualificationResult: QualificationFitResult,
  contentResult: ContentQualityResult,
  sectionResult: SectionScoreResult,
  formatResult: FormatScoreResult,
  weights: ComponentWeights
): ActionItem[] {
  const items: ActionItem[] = [];
  
  // === KEYWORD ISSUES (highest priority) ===
  if (keywordResult.details.missingRequired.length > 0) {
    const missing = keywordResult.details.missingRequired.slice(0, 4).join(', ');
    items.push({
      priority: 'critical',
      category: 'Keywords',
      message: `Add missing REQUIRED keywords: ${missing}`,
      potentialImpact: Math.min(20, keywordResult.details.missingRequired.length * 5)
    });
  }
  
  if (keywordResult.details.missingPreferred.length > 3) {
    const missing = keywordResult.details.missingPreferred.slice(0, 3).join(', ');
    items.push({
      priority: 'medium',
      category: 'Keywords',
      message: `Consider adding preferred keywords: ${missing}`,
      potentialImpact: Math.min(10, keywordResult.details.missingPreferred.length * 2)
    });
  }
  
  // === QUALIFICATION ISSUES ===
  if (!qualificationResult.details.experienceMet) {
    items.push({
      priority: 'high',
      category: 'Qualifications',
      message: qualificationResult.details.experienceNote || 'Experience years below requirement',
      potentialImpact: 8
    });
  }
  
  if (!qualificationResult.details.degreeMet) {
    items.push({
      priority: 'high',
      category: 'Qualifications',
      message: qualificationResult.details.degreeNote || 'Degree does not match requirement',
      potentialImpact: 6
    });
  }
  
  // === CONTENT QUALITY ISSUES ===
  if (contentResult.breakdown.quantificationScore < 0.4) {
    items.push({
      priority: 'high',
      category: 'Content',
      message: `Add metrics to bullets (only ${contentResult.details.bulletsWithMetrics}/${contentResult.details.totalBullets} have quantification)`,
      potentialImpact: 10
    });
  }
  
  if (contentResult.details.weakVerbCount > contentResult.details.strongVerbCount) {
    items.push({
      priority: 'medium',
      category: 'Content',
      message: `Replace weak verbs ("Helped", "Worked on") with strong verbs ("Led", "Developed", "Built")`,
      potentialImpact: 5
    });
  }
  
  // === SECTION ISSUES ===
  for (const [section, data] of Object.entries(sectionResult.breakdown)) {
    if (data.issues && data.issues.length > 0 && !data.meetsThreshold) {
      items.push({
        priority: data.present ? 'medium' : 'high',
        category: 'Sections',
        message: data.issues[0],
        potentialImpact: Math.round((data.maxPoints - data.points) * weights.sections * 10)
      });
    }
  }
  
  // === FORMAT ISSUES ===
  for (const issue of formatResult.issues) {
    items.push({
      priority: 'high',
      category: 'Format',
      message: issue,
      potentialImpact: 5
    });
  }
  
  for (const warning of formatResult.warnings) {
    items.push({
      priority: 'low',
      category: 'Format',
      message: warning,
      potentialImpact: 2
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
```

---

## Score Tiers and Interpretation

### Tier Definitions

| Score | Tier | Description | ATS Outcome | Action |
|-------|------|-------------|-------------|--------|
| 90-100 | **Excellent** | All requirements met, strong preferred coverage | Auto-advanced | Minor polish |
| 80-89 | **Strong** | Most requirements met, good preferred coverage | High review chance | Optimize 2-3 areas |
| 70-79 | **Good** | Requirements mostly met, gaps in preferred | Good review chance | Add missing keywords |
| 60-69 | **Fair** | Some required keywords missing | May be filtered | Significant tailoring |
| 50-59 | **Weak** | Multiple required keywords missing | Likely filtered | Substantial rewrite |
| <50 | **Poor** | Major requirement gaps | Almost certainly rejected | Reconsider fit |

### Calibration Validation

Expected scores for calibration samples:

| Sample | Expected | Key Characteristics |
|--------|----------|---------------------|
| Alex Chen | 90-100% | All required + preferred keywords, 4 certs, strong metrics |
| Taylor Williams | 70-80% | Most required, few preferred, no certs, moderate metrics |
| Morgan Davis | 60-70% | Missing Django, weak preferred, no certs |
| Casey Brown | 50-60% | Missing Django + Angular + CI/CD, weak verbs, no certs |

---

## Projected Score Calculation

```typescript
interface Suggestion {
  section: 'summary' | 'skills' | 'experience' | 'education' | 'projects';
  keywordsAdded: string[];
  keywordsAddedRequired: string[];
  keywordsAddedPreferred: string[];
  metricsAdded: number;
  weakVerbsReplaced: number;
}

interface ProjectedScoreResult {
  currentScore: number;
  projectedScore: number;
  improvement: number;
  projectedTier: ScoreTier;
  improvementBreakdown: {
    fromKeywords: number;
    fromContent: number;
    fromSections: number;
  };
}

function calculateProjectedScore(
  currentResult: ATSScoreResult,
  suggestions: Suggestion[],
  originalKeywords: KeywordMatch[]
): ProjectedScoreResult {
  
  // Aggregate keywords added across all suggestions
  const allRequiredAdded = new Set(suggestions.flatMap(s => s.keywordsAddedRequired));
  const allPreferredAdded = new Set(suggestions.flatMap(s => s.keywordsAddedPreferred));
  
  // Project keyword score
  const projectedKeywords = originalKeywords.map(kw => {
    const wouldBeAdded = 
      allRequiredAdded.has(kw.keyword) || 
      allPreferredAdded.has(kw.keyword);
    
    if (wouldBeAdded && !kw.found) {
      return {
        ...kw,
        found: true,
        matchType: 'exact' as const,
        placement: 'skills_section' as const
      };
    }
    return kw;
  });
  
  const projectedKeywordResult = calculateKeywordScore(projectedKeywords);
  const keywordImprovement = (projectedKeywordResult.score - currentResult.breakdown.keywords.score / 100);
  
  // Project content quality improvement
  const totalMetricsAdded = suggestions.reduce((sum, s) => sum + s.metricsAdded, 0);
  const totalWeakVerbsFixed = suggestions.reduce((sum, s) => sum + s.weakVerbsReplaced, 0);
  
  const currentContentScore = currentResult.breakdown.contentQuality.score / 100;
  const contentBoost = Math.min(0.25, (totalMetricsAdded * 0.03) + (totalWeakVerbsFixed * 0.02));
  const projectedContentScore = Math.min(1, currentContentScore + contentBoost);
  const contentImprovement = projectedContentScore - currentContentScore;
  
  // Section improvement (minimal from suggestions alone)
  const sectionImprovement = 0.02; // Small boost from better content
  
  // Calculate projected overall
  const weights = currentResult.metadata.weightsUsed;
  const projectedOverall = Math.round(
    (projectedKeywordResult.score * weights.keywords +
     (currentResult.breakdown.qualificationFit.score / 100) * weights.qualificationFit +
     projectedContentScore * weights.contentQuality +
     (currentResult.breakdown.sections.score / 100 + sectionImprovement) * weights.sections +
     (currentResult.breakdown.format.score / 100) * weights.format) * 100
  );
  
  return {
    currentScore: currentResult.overall,
    projectedScore: projectedOverall,
    improvement: projectedOverall - currentResult.overall,
    projectedTier: getScoreTier(projectedOverall),
    improvementBreakdown: {
      fromKeywords: Math.round(keywordImprovement * weights.keywords * 100),
      fromContent: Math.round(contentImprovement * weights.contentQuality * 100),
      fromSections: Math.round(sectionImprovement * weights.sections * 100)
    }
  };
}
```

---

## Prompt Modifications

### 1. Keyword Extraction Prompt (Updated)

Add required vs preferred distinction:

```
You are a resume optimization expert analyzing job descriptions.

Extract the most important keywords from this job description.

<job_description>
{jobDescription}
</job_description>

For EACH keyword, identify:
1. **category**: skills, technologies, qualifications, experience, soft_skills, certifications
2. **importance**: high, medium, low
3. **requirement**: "required" or "preferred"

**Requirement Classification Rules:**
- "required" = Appears in "Required Qualifications" section, OR uses language like "must have", "required", "essential", "minimum"
- "preferred" = Appears in "Preferred/Nice to Have" section, OR uses language like "preferred", "bonus", "plus", "ideally"
- Default: If unclear, high importance = required, medium/low = preferred

Return ONLY valid JSON:
{
  "keywords": [
    { "keyword": "Python", "category": "technologies", "importance": "high", "requirement": "required" },
    { "keyword": "Docker", "category": "technologies", "importance": "medium", "requirement": "preferred" }
  ]
}
```

### 2. Keyword Matching Prompt (Updated)

Add placement detection:

```
You are a resume optimization expert analyzing keyword matches.

Find which of these keywords appear in the resume. For each match, identify WHERE in the resume it appears.

<keywords>
{keywords}
</keywords>

<resume_content>
{resumeContent}
</resume_content>

For each keyword:
- **found**: true/false
- **matchType**: "exact", "fuzzy", or "semantic"
- **placement**: Where the keyword appears (if found):
  - "skills_section" = In a dedicated Skills/Technical Skills section
  - "summary" = In professional summary/profile
  - "experience_bullet" = In a bullet point under experience
  - "experience_paragraph" = In paragraph text under experience
  - "education" = In education section
  - "projects" = In projects section
  - "other" = Elsewhere
- **context**: The exact phrase where found (max 100 chars)

Return ONLY valid JSON:
{
  "matches": [
    {
      "keyword": "Python",
      "found": true,
      "matchType": "exact",
      "placement": "skills_section",
      "context": "Python, JavaScript, TypeScript"
    }
  ]
}
```

### 3. Qualification Extraction Prompt (New)

```
You are analyzing a job description to extract qualification requirements.

<job_description>
{jobDescription}
</job_description>

Extract the following requirements:

1. **Degree Requirement** (if mentioned):
   - level: high_school, associate, bachelor, master, phd
   - fields: Array of acceptable fields (e.g., ["Computer Science", "Software Engineering", "related field"])
   - required: true if explicitly required, false if preferred

2. **Experience Requirement** (if mentioned):
   - minYears: Minimum years required (number)
   - maxYears: Maximum years if range given (number or null)
   - required: true if explicitly required, false if preferred

3. **Certification Requirements** (if mentioned):
   - certifications: Array of certification names
   - required: true if explicitly required, false if preferred

Return ONLY valid JSON:
{
  "degreeRequired": {
    "level": "bachelor",
    "fields": ["Computer Science", "Software Engineering", "related field"],
    "required": true
  },
  "experienceRequired": {
    "minYears": 3,
    "maxYears": 5,
    "required": true
  },
  "certificationsRequired": {
    "certifications": ["AWS Certified"],
    "required": false
  }
}

If a requirement is not mentioned, omit that field entirely.
```

### 4. Remove point_value from Suggestion Prompts

In all suggestion prompts (Summary, Skills, Experience, Education), remove:

```
Also assign a point_value for section-level calculations:
- critical = X-Y points
- high = X-Y points
- moderate = X-Y points
```

Keep the `impact` tier for display purposes only.

Add instead:

```
For each suggestion, identify:
- **keywords_added_required**: Required JD keywords this suggestion adds
- **keywords_added_preferred**: Preferred JD keywords this suggestion adds
- **metrics_added**: Count of new quantified statements (0 if none)
- **weak_verbs_replaced**: Count of weak verbs replaced with strong verbs (0 if none)
```

---

## UI Display Recommendations

### Score Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Your ATS Score                                                 │
│  ┌─────────┐                                                    │
│  │   54%   │  Fair Match                                        │
│  └─────────┘                                                    │
│                                                                 │
│  After applying suggestions: 78% (+24)  ← [See Suggestions]     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Score Breakdown                                                │
│                                                                 │
│  Keywords         [████████░░░░░░░░░░░░]  44%  (×0.40 = 18)     │
│  Qualifications   [████████████████░░░░]  80%  (×0.15 = 12)     │
│  Content Quality  [██████████░░░░░░░░░░]  55%  (×0.20 = 11)     │
│  Sections         [████████████████░░░░]  78%  (×0.15 =  9)     │
│  Format           [██████████████████░░]  90%  (×0.10 =  9)     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️ Missing REQUIRED Keywords                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • Django  • Angular  • CI/CD pipelines                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  💡 Missing Preferred Keywords                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • Docker  • Kubernetes  • TypeScript  • MongoDB         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  🎯 Top Actions to Improve                                      │
│                                                                 │
│  1. 🔴 Add missing REQUIRED keywords: Django, Angular, CI/CD    │
│     Potential impact: +15 points                                │
│                                                                 │
│  2. 🟠 Add metrics to experience bullets (2/8 have metrics)     │
│     Potential impact: +8 points                                 │
│                                                                 │
│  3. 🟠 Replace weak verbs with strong action verbs              │
│     Potential impact: +5 points                                 │
│                                                                 │
│  4. 🟡 "Objective" section is outdated - use Summary            │
│     Potential impact: +4 points                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Priority Colors

```typescript
const PRIORITY_COLORS = {
  critical: { bg: '#DC2626', label: '🔴' },  // Red
  high: { bg: '#F97316', label: '🟠' },      // Orange
  medium: { bg: '#EAB308', label: '🟡' },    // Yellow
  low: { bg: '#22C55E', label: '🟢' }        // Green
} as const;
```

---

## Implementation Plan

### Phase 1: Core Scoring Module (4-5 days)

**Files to create:**
```
lib/scoring/
├── types.ts              # All type definitions
├── constants.ts          # Weight constants, patterns, verb lists
├── keywordScore.ts       # Keyword scoring with required/preferred
├── qualificationFit.ts   # Degree, experience, certification matching
├── contentQuality.ts     # Quantification + verbs + density
├── sectionScore.ts       # Structure + education quality
├── formatScore.ts        # Parseability + modern format checks
├── roleDetection.ts      # Role and seniority detection
├── weights.ts            # Weight configuration by role/seniority
├── atsScore.ts           # Main entry combining all components
├── projectedScore.ts     # Projection calculation
└── index.ts              # Public exports
```

### Phase 2: Prompt Updates (2 days)

1. Update keyword extraction prompt (add requirement field)
2. Update keyword matching prompt (add placement field)
3. Create qualification extraction prompt
4. Remove point_value from all suggestion prompts
5. Add keywords_added_required/preferred to suggestion outputs

### Phase 3: Pipeline Integration (3 days)

1. Run qualification extraction after keyword extraction
2. Calculate baseline ATS score before suggestions
3. Track which keywords each suggestion adds
4. Calculate projected score after suggestions
5. Store scores in session

### Phase 4: UI Updates (3-4 days)

1. Score dashboard with 5-component breakdown
2. Required vs Preferred keyword display
3. Prioritized action items with impact estimates
4. Before/After comparison
5. Tier badge and color coding

### Timeline Summary

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Core Scoring | 4-5 days | None |
| Phase 2: Prompt Updates | 2 days | Phase 1 |
| Phase 3: Pipeline Integration | 3 days | Phase 1, 2 |
| Phase 4: UI Updates | 3-4 days | Phase 3 |
| **Total** | **12-14 days** | |

---

## Validation Strategy

### Without Jobscan

Since you're not using Jobscan, validate using:

1. **Calibration Samples:** Run the 4 provided samples through the system
   - Alex Chen should score 90-100%
   - Taylor Williams should score 70-80%
   - Morgan Davis should score 60-70%
   - Casey Brown should score 50-60%

2. **Manual Review:** Create 10-15 additional test cases with expected ranges

3. **Edge Cases:** Test:
   - Co-op student with no experience (should rely on education/projects)
   - Senior engineer with 10+ years
   - Career changer (unrelated degree)
   - Perfect keyword match but weak content
   - Strong content but missing required keywords

4. **A/B Comparison:** Run same resumes through current system vs new system, verify new scores are 10-20 points lower for weak matches

### Test Script

```typescript
const CALIBRATION_TESTS = [
  { name: 'Alex Chen', expectedMin: 90, expectedMax: 100 },
  { name: 'Taylor Williams', expectedMin: 70, expectedMax: 80 },
  { name: 'Morgan Davis', expectedMin: 60, expectedMax: 70 },
  { name: 'Casey Brown', expectedMin: 50, expectedMax: 60 },
];

async function validateCalibration() {
  const jd = loadJD('00_job_description.pdf');
  
  for (const test of CALIBRATION_TESTS) {
    const resume = loadResume(`${test.name}.pdf`);
    const result = await calculateATSScore({ resume, jd, jobType: 'fulltime' });
    
    const passed = result.overall >= test.expectedMin && result.overall <= test.expectedMax;
    console.log(`${test.name}: ${result.overall}% (expected ${test.expectedMin}-${test.expectedMax}%) - ${passed ? '✅' : '❌'}`);
  }
}
```

---

## Type Definitions Summary

See individual component sections for full type definitions. Key types:

```typescript
// Keyword types
type KeywordRequirement = 'required' | 'preferred';
type MatchType = 'exact' | 'fuzzy' | 'semantic';
type PlacementLocation = 'skills_section' | 'summary' | 'experience_bullet' | 'experience_paragraph' | 'education' | 'projects' | 'other';

// Score result types
interface ATSScoreResult { ... }
interface KeywordScoreResult { ... }
interface QualificationFitResult { ... }
interface ContentQualityResult { ... }
interface SectionScoreResult { ... }
interface FormatScoreResult { ... }
interface ProjectedScoreResult { ... }

// Context types
type JobRole = 'software_engineer' | 'data_analyst' | 'data_scientist' | 'product_manager' | 'designer' | 'marketing' | 'finance' | 'operations' | 'general';
type SeniorityLevel = 'entry' | 'mid' | 'senior' | 'executive';
type ScoreTier = 'excellent' | 'strong' | 'good' | 'fair' | 'weak' | 'poor';
```

---

## Summary of Changes from v2.0

| Area | v2.0 | v2.1 |
|------|------|------|
| **Components** | 4 (Keywords, Experience, Sections, Format) | 5 (Keywords, Qualification Fit, Content Quality, Sections, Format) |
| **Keywords** | Single importance tier | Required vs Preferred distinction |
| **Keyword Placement** | Not considered | Weighted by location |
| **Qualification Fit** | Not included | Degree, years, certifications checked |
| **Content Scope** | Experience only | All bullets (experience + projects + education) |
| **Quantification** | Presence only | Quality tiers (high/medium/low) |
| **Action Verbs** | Strong verb bonus only | Strong bonus + weak verb penalty |
| **Certifications** | Not scored | Included in qualification fit |
| **Format** | Basic checks | Outdated format penalties added |
| **Weights** | 50/20/15/15 | 40/15/20/15/10 (adjusted by role) |

---

*End of Specification v2.1*
