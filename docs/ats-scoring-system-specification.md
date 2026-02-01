# SubmitSmart ATS Scoring System Specification

**Version:** 2.0  
**Date:** January 2026  
**Status:** Technical Specification (Ready for Implementation)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Diagnosis](#problem-diagnosis)
3. [Scoring Architecture Overview](#scoring-architecture-overview)
4. [Component 1: Keyword Score (50%)](#component-1-keyword-score-50)
5. [Component 2: Experience Score (20%)](#component-2-experience-score-20)
6. [Component 3: Section Score (15%)](#component-3-section-score-15)
7. [Component 4: Format Score (15%)](#component-4-format-score-15)
8. [Role-Aware Weight Adjustments](#role-aware-weight-adjustments)
9. [Combined Scoring Function](#combined-scoring-function)
10. [Score Tiers and Interpretation](#score-tiers-and-interpretation)
11. [Projected Score Calculation](#projected-score-calculation)
12. [Prompt Modifications](#prompt-modifications)
13. [UI Display Recommendations](#ui-display-recommendations)
14. [Implementation Plan](#implementation-plan)
15. [Expected Impact](#expected-impact)
16. [Type Definitions](#type-definitions)

---

## Executive Summary

The current SubmitSmart ATS scoring system produces inflated scores (~15-20 points higher than expected). A resume that should score 50-60% is scoring 71-73%. This specification defines a new programmatic scoring system that:

1. **Replaces LLM-generated scores** with deterministic calculations in code
2. **Weights keywords by importance and match type** (exact vs semantic)
3. **Penalizes missing critical keywords** rather than only crediting found ones
4. **Measures ATS-specific signals** instead of subjective human criteria
5. **Supports role-aware weight adjustments** for different job types
6. **Provides transparent breakdowns** so users understand their score

---

## Problem Diagnosis

### Root Causes of Score Inflation

| Cause | Current Behavior | Impact | Fix |
|-------|------------------|--------|-----|
| **Semantic matching treated equally** | "worked with data" = "data analytics" at full value | +10-15 points | Weight by match type (semantic = 0.65) |
| **No penalty for missing required keywords** | Only credit for found keywords | +5-10 points | Penalize missing high-importance keywords |
| **Content Quality measures human criteria** | "Clarity: 90" inflates score | +5-8 points | Replace with ATS-specific metrics |
| **All keywords weighted equally** | "teamwork" = "Python" | +3-5 points | Weight by importance tier |
| **No defined formula** | LLM outputs optimistic numbers | Variance | Deterministic calculation in code |
| **Generous section coverage** | Section exists = full credit | +2-3 points | Evaluate content density |

### Observed vs Expected Scores

| Resume Type | Current Score | Expected Score | Gap |
|-------------|---------------|----------------|-----|
| Weak keyword match, good writing | 71-73% | 50-60% | +15-18 |
| Moderate match, sparse content | 68-72% | 55-62% | +10-13 |
| Strong match, well-structured | 85-90% | 80-88% | +2-5 |

---

## Scoring Architecture Overview

### Master Formula

```
ATS_Score = (
  KeywordScore      × KeywordWeight +
  ExperienceScore   × ExperienceWeight +
  SectionScore      × SectionWeight +
  FormatScore       × FormatWeight
) × 100
```

### Default Weights

| Component | Weight | Rationale |
|-----------|--------|-----------|
| Keywords | 0.50 | ATS primarily filters on keyword matching |
| Experience | 0.20 | Quality signals for ranking after filter |
| Sections | 0.15 | Structure affects parseability |
| Format | 0.15 | Technical parsing success |

### Data Flow

```
[Resume] + [JD]
     ↓
[Keyword Extraction] → keywords with importance
     ↓
[Keyword Matching] → found/missing with matchType
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

## Component 1: Keyword Score (50%)

The keyword score is the primary driver of ATS filtering. This component applies weighted scoring based on keyword importance and match quality.

### Weight Constants

```typescript
const IMPORTANCE_WEIGHTS = {
  high: 1.0,    // Required skills, must-have qualifications
  medium: 0.6,  // Preferred skills, nice-to-have
  low: 0.3      // Soft skills, general terms
} as const;

const MATCH_TYPE_WEIGHTS = {
  exact: 1.0,     // "Python" matches "Python"
  fuzzy: 0.85,    // "JS" matches "JavaScript"
  semantic: 0.65  // "data pipelines" matches "ETL processes"
} as const;

// Penalty for each missing high-importance keyword
const MISSING_HIGH_PENALTY = 0.15;

// Minimum score multiplier (floor after penalties)
const MIN_PENALTY_MULTIPLIER = 0.40;
```

### Calculation Logic

```typescript
interface KeywordMatch {
  keyword: string;
  category: 'skills' | 'technologies' | 'qualifications' | 'experience' | 'soft_skills' | 'certifications';
  importance: 'high' | 'medium' | 'low';
  found: boolean;
  matchType?: 'exact' | 'fuzzy' | 'semantic';
  context?: string; // Where in resume it was found
}

interface KeywordScoreResult {
  score: number; // 0.00 to 1.00
  breakdown: {
    achievedPoints: number;
    possiblePoints: number;
    matchRate: number;
    penaltyMultiplier: number;
    missingHighCount: number;
  };
  details: {
    matched: KeywordMatch[];
    missing: KeywordMatch[];
    missingCritical: string[]; // High-importance keywords not found
  };
}

function calculateKeywordScore(keywords: KeywordMatch[]): KeywordScoreResult {
  let achievedPoints = 0;
  let possiblePoints = 0;
  let missingHighCount = 0;
  
  const matched: KeywordMatch[] = [];
  const missing: KeywordMatch[] = [];
  const missingCritical: string[] = [];
  
  for (const kw of keywords) {
    const importanceWeight = IMPORTANCE_WEIGHTS[kw.importance];
    possiblePoints += importanceWeight;
    
    if (kw.found && kw.matchType) {
      const matchWeight = MATCH_TYPE_WEIGHTS[kw.matchType];
      achievedPoints += importanceWeight * matchWeight;
      matched.push(kw);
    } else {
      missing.push(kw);
      if (kw.importance === 'high') {
        missingHighCount++;
        missingCritical.push(kw.keyword);
      }
    }
  }
  
  // Base score: percentage of weighted keywords matched
  const matchRate = possiblePoints > 0 ? achievedPoints / possiblePoints : 0;
  
  // Apply penalty for missing critical keywords
  // Each missing high-importance keyword reduces ceiling by 15%
  const penaltyMultiplier = Math.max(
    MIN_PENALTY_MULTIPLIER,
    1 - (missingHighCount * MISSING_HIGH_PENALTY)
  );
  
  const score = matchRate * penaltyMultiplier;
  
  return {
    score: Math.round(score * 100) / 100,
    breakdown: {
      achievedPoints: Math.round(achievedPoints * 100) / 100,
      possiblePoints: Math.round(possiblePoints * 100) / 100,
      matchRate: Math.round(matchRate * 100) / 100,
      penaltyMultiplier: Math.round(penaltyMultiplier * 100) / 100,
      missingHighCount
    },
    details: {
      matched,
      missing,
      missingCritical
    }
  };
}
```

### Score Impact Examples

| Scenario | Calculation | Result |
|----------|-------------|--------|
| 8/12 keywords, all exact matches, 0 missing high | (8/12) × 1.0 = 0.67 | **67%** |
| 8/12 keywords, all semantic matches, 0 missing high | (8×0.65)/(12×1.0) = 0.43 | **43%** |
| 8/12 keywords, all exact, 2 missing high | 0.67 × (1 - 0.30) = 0.47 | **47%** |
| 6/12 keywords, mixed matches, 3 missing high | ~0.45 × 0.55 = 0.25 | **25%** |

---

## Component 2: Experience Score (20%)

The experience score measures ATS-relevant signals in the experience section using programmatic detection (no LLM required for scoring).

### Metric Detection Patterns

```typescript
const METRIC_PATTERNS: RegExp[] = [
  /\d+%/,                                          // Percentages: "30%", "150%"
  /\d+x/i,                                         // Multipliers: "3x", "10X"
  /\$[\d,]+(?:\.\d{2})?[KMB]?/i,                  // Currency: "$50K", "$1.2M"
  /\b\d{1,3}(?:,\d{3})+\b/,                       // Large numbers: "1,000", "50,000"
  /\b\d+\+?\s*(?:years?|months?|weeks?|days?)\b/i, // Time: "3 years", "6+ months"
  /team\s+of\s+\d+/i,                             // Team size: "team of 5"
  /\b\d+\s*(?:clients?|customers?|users?)\b/i,   // Counts: "500 users"
  /\b\d+\s*(?:projects?|applications?|systems?)\b/i, // Project counts
  /\b\d+\s*(?:countries|regions|markets)\b/i,    // Geographic scope
  /(?:top|first)\s*\d+/i,                         // Rankings: "top 10", "first 3"
];

const STRONG_ACTION_VERBS = new Set([
  // Leadership & Ownership
  'led', 'drove', 'owned', 'spearheaded', 'directed', 'orchestrated',
  'managed', 'oversaw', 'supervised', 'headed',
  
  // Achievement & Delivery
  'delivered', 'achieved', 'accomplished', 'completed', 'exceeded',
  'generated', 'produced', 'launched', 'shipped',
  
  // Creation & Development
  'built', 'developed', 'created', 'designed', 'architected',
  'engineered', 'implemented', 'established', 'founded',
  
  // Improvement & Optimization
  'improved', 'increased', 'reduced', 'decreased', 'optimized',
  'streamlined', 'enhanced', 'accelerated', 'transformed',
  
  // Analysis & Strategy
  'analyzed', 'evaluated', 'assessed', 'identified', 'discovered',
  'researched', 'investigated', 'diagnosed',
  
  // Collaboration (appropriate for co-op/junior)
  'contributed', 'assisted', 'supported', 'collaborated', 'participated',
  'partnered', 'coordinated', 'facilitated'
]);

const WEAK_ACTION_VERBS = new Set([
  'helped', 'worked', 'was responsible for', 'handled', 'dealt with',
  'involved in', 'participated in', 'assisted with', 'tasked with'
]);
```

### Calculation Logic

```typescript
interface ExperienceScoreInput {
  bullets: string[];
  jdKeywords: string[]; // Keywords extracted from JD
}

interface ExperienceScoreResult {
  score: number; // 0.00 to 1.00
  breakdown: {
    quantificationScore: number;
    actionVerbScore: number;
    keywordDensityScore: number;
    bulletsWithMetrics: number;
    totalBullets: number;
    bulletsWithStrongVerbs: number;
    keywordsFoundInExperience: number;
  };
}

function calculateExperienceScore(input: ExperienceScoreInput): ExperienceScoreResult {
  const { bullets, jdKeywords } = input;
  
  if (bullets.length === 0) {
    return {
      score: 0,
      breakdown: {
        quantificationScore: 0,
        actionVerbScore: 0,
        keywordDensityScore: 0,
        bulletsWithMetrics: 0,
        totalBullets: 0,
        bulletsWithStrongVerbs: 0,
        keywordsFoundInExperience: 0
      }
    };
  }
  
  // 1. Quantification Score (35% of experience score)
  let bulletsWithMetrics = 0;
  for (const bullet of bullets) {
    if (METRIC_PATTERNS.some(pattern => pattern.test(bullet))) {
      bulletsWithMetrics++;
    }
  }
  const quantificationScore = bulletsWithMetrics / bullets.length;
  
  // 2. Action Verb Score (30% of experience score)
  let bulletsWithStrongVerbs = 0;
  let bulletsWithWeakVerbs = 0;
  
  for (const bullet of bullets) {
    const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
    if (STRONG_ACTION_VERBS.has(firstWord)) {
      bulletsWithStrongVerbs++;
    } else if (WEAK_ACTION_VERBS.has(firstWord)) {
      bulletsWithWeakVerbs++;
    }
  }
  
  // Strong verbs contribute full points, weak verbs contribute half
  const verbScore = (bulletsWithStrongVerbs + (bulletsWithWeakVerbs * 0.5)) / bullets.length;
  const actionVerbScore = Math.min(1, verbScore);
  
  // 3. Keyword Density Score (35% of experience score)
  const experienceText = bullets.join(' ').toLowerCase();
  let keywordsFound = 0;
  
  for (const kw of jdKeywords) {
    // Check for keyword presence (case-insensitive)
    const kwLower = kw.toLowerCase();
    if (experienceText.includes(kwLower)) {
      keywordsFound++;
    }
  }
  
  const keywordDensityScore = jdKeywords.length > 0 
    ? Math.min(1, keywordsFound / (jdKeywords.length * 0.6)) // Expect ~60% coverage for full score
    : 0.5; // Default if no keywords
  
  // Weighted combination
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
      keywordDensityScore: Math.round(keywordDensityScore * 100) / 100,
      bulletsWithMetrics,
      totalBullets: bullets.length,
      bulletsWithStrongVerbs,
      keywordsFoundInExperience: keywordsFound
    }
  };
}
```

---

## Component 3: Section Score (15%)

The section score evaluates resume structure and content density, not just presence.

### Section Configuration

```typescript
interface SectionConfig {
  required: boolean;
  minLength?: number;      // Minimum character count
  minItems?: number;       // Minimum list items
  minBullets?: number;     // Minimum bullet points
  maxPoints: number;       // Points this section can contribute
}

function getSectionConfig(jobType: 'coop' | 'fulltime'): Record<string, SectionConfig> {
  return {
    summary: {
      required: true,
      minLength: 50,
      maxPoints: 15
    },
    skills: {
      required: true,
      minItems: 5,
      maxPoints: 25
    },
    experience: {
      required: true,
      minBullets: jobType === 'coop' ? 2 : 4,
      maxPoints: jobType === 'coop' ? 25 : 35
    },
    education: {
      required: true,
      minLength: 30,
      maxPoints: jobType === 'coop' ? 25 : 15
    },
    projects: {
      required: false,
      minLength: 50,
      maxPoints: jobType === 'coop' ? 15 : 10
    },
    certifications: {
      required: false,
      minItems: 1,
      maxPoints: 10
    }
  };
}
```

### Calculation Logic

```typescript
interface SectionScoreInput {
  sections: {
    summary?: string;
    skills?: string[];
    experience?: string[];  // Array of bullet points
    education?: string;
    projects?: string;
    certifications?: string[];
  };
  jobType: 'coop' | 'fulltime';
}

interface SectionScoreResult {
  score: number;
  breakdown: {
    [sectionName: string]: {
      present: boolean;
      meetsThreshold: boolean;
      points: number;
      maxPoints: number;
      issues?: string[];
    };
  };
}

function calculateSectionScore(input: SectionScoreInput): SectionScoreResult {
  const { sections, jobType } = input;
  const config = getSectionConfig(jobType);
  
  let achievedPoints = 0;
  let possiblePoints = 0;
  const breakdown: SectionScoreResult['breakdown'] = {};
  
  // Summary
  const summaryConfig = config.summary;
  possiblePoints += summaryConfig.maxPoints;
  const summaryLength = sections.summary?.trim().length ?? 0;
  
  if (summaryLength >= summaryConfig.minLength!) {
    achievedPoints += summaryConfig.maxPoints;
    breakdown.summary = { present: true, meetsThreshold: true, points: summaryConfig.maxPoints, maxPoints: summaryConfig.maxPoints };
  } else if (summaryLength > 0) {
    const partial = summaryConfig.maxPoints * (summaryLength / summaryConfig.minLength!);
    achievedPoints += partial;
    breakdown.summary = { 
      present: true, 
      meetsThreshold: false, 
      points: Math.round(partial * 10) / 10, 
      maxPoints: summaryConfig.maxPoints,
      issues: [`Summary too short (${summaryLength}/${summaryConfig.minLength} chars)`]
    };
  } else {
    breakdown.summary = { present: false, meetsThreshold: false, points: 0, maxPoints: summaryConfig.maxPoints, issues: ['No summary section'] };
  }
  
  // Skills
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
  
  // Experience
  const expConfig = config.experience;
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
  
  // Education
  const eduConfig = config.education;
  possiblePoints += eduConfig.maxPoints;
  const eduLength = sections.education?.trim().length ?? 0;
  
  if (eduLength >= eduConfig.minLength!) {
    achievedPoints += eduConfig.maxPoints;
    breakdown.education = { present: true, meetsThreshold: true, points: eduConfig.maxPoints, maxPoints: eduConfig.maxPoints };
  } else if (eduLength > 0) {
    const partial = eduConfig.maxPoints * 0.6; // Partial credit for sparse education
    achievedPoints += partial;
    breakdown.education = { 
      present: true, 
      meetsThreshold: false, 
      points: Math.round(partial * 10) / 10, 
      maxPoints: eduConfig.maxPoints,
      issues: ['Education section is sparse - consider adding coursework, GPA, or projects']
    };
  } else {
    breakdown.education = { present: false, meetsThreshold: false, points: 0, maxPoints: eduConfig.maxPoints, issues: ['No education section'] };
  }
  
  // Projects (optional bonus)
  const projConfig = config.projects;
  const projLength = sections.projects?.trim().length ?? 0;
  
  if (projLength >= projConfig.minLength!) {
    possiblePoints += projConfig.maxPoints;
    achievedPoints += projConfig.maxPoints;
    breakdown.projects = { present: true, meetsThreshold: true, points: projConfig.maxPoints, maxPoints: projConfig.maxPoints };
  } else if (projLength > 0) {
    possiblePoints += projConfig.maxPoints;
    const partial = projConfig.maxPoints * 0.5;
    achievedPoints += partial;
    breakdown.projects = { 
      present: true, 
      meetsThreshold: false, 
      points: Math.round(partial * 10) / 10, 
      maxPoints: projConfig.maxPoints,
      issues: ['Projects section could be expanded']
    };
  }
  // If no projects, don't add to possible points (optional section)
  
  // Certifications (optional bonus)
  const certConfig = config.certifications;
  const certCount = sections.certifications?.length ?? 0;
  
  if (certCount >= certConfig.minItems!) {
    possiblePoints += certConfig.maxPoints;
    achievedPoints += certConfig.maxPoints;
    breakdown.certifications = { present: true, meetsThreshold: true, points: certConfig.maxPoints, maxPoints: certConfig.maxPoints };
  }
  // If no certifications, don't penalize
  
  const score = possiblePoints > 0 ? achievedPoints / possiblePoints : 0;
  
  return {
    score: Math.round(score * 100) / 100,
    breakdown
  };
}
```

---

## Component 4: Format Score (15%)

The format score detects ATS parseability signals using pattern matching.

### Calculation Logic

```typescript
interface FormatScoreInput {
  resumeText: string;
  hasExperience: boolean;
}

interface FormatScoreResult {
  score: number;
  breakdown: {
    hasEmail: boolean;
    hasPhone: boolean;
    hasParseableDates: boolean;
    hasSectionHeaders: boolean;
    hasBulletStructure: boolean;
    appropriateLength: boolean;
  };
  issues: string[];
}

function calculateFormatScore(input: FormatScoreInput): FormatScoreResult {
  const { resumeText, hasExperience } = input;
  
  let score = 1.0; // Start at 100%, deduct for issues
  const issues: string[] = [];
  
  // 1. Contact Information (15% of format score)
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
    issues.push('No phone number detected');
  }
  
  // 2. Date Format Recognition (20% of format score)
  const datePatterns = [
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/gi,
    /\b\d{1,2}\/\d{4}\b/g,
    /\b\d{4}\s*[-–—]\s*(?:\d{4}|Present|Current|Now)\b/gi,
    /\b(?:Expected|Graduating?)\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/gi
  ];
  
  const dateMatches = datePatterns.flatMap(p => resumeText.match(p) || []);
  const hasParseableDates = dateMatches.length > 0;
  
  if (!hasParseableDates && hasExperience) {
    score -= 0.15;
    issues.push('No parseable date formats found in experience section');
  }
  
  // 3. Section Headers (20% of format score)
  const sectionHeaderPatterns = [
    /\b(?:experience|work\s*experience|employment|professional\s*experience)\b/i,
    /\b(?:education|academic|qualifications)\b/i,
    /\b(?:skills|technical\s*skills|core\s*competencies)\b/i,
    /\b(?:summary|profile|objective|about)\b/i,
    /\b(?:projects|personal\s*projects|portfolio)\b/i,
    /\b(?:certifications?|licenses?|credentials?)\b/i
  ];
  
  let headersFound = 0;
  for (const pattern of sectionHeaderPatterns) {
    if (pattern.test(resumeText)) headersFound++;
  }
  
  const hasSectionHeaders = headersFound >= 3;
  if (headersFound < 3) {
    score -= 0.10;
    issues.push(`Only ${headersFound} section headers detected (recommend 3+)`);
  }
  
  // 4. Bullet Point Structure (15% of format score)
  const bulletPatterns = [
    /^[\u2022\u2023\u25E6\u2043\u2219•]\s/m,  // Bullet characters
    /^[-*]\s/m,                                 // Dash or asterisk
    /^\d+\.\s/m                                 // Numbered list
  ];
  
  const hasBulletStructure = bulletPatterns.some(p => p.test(resumeText));
  if (!hasBulletStructure && hasExperience) {
    score -= 0.10;
    issues.push('No bullet point structure detected');
  }
  
  // 5. Length Check (10% of format score)
  const wordCount = resumeText.split(/\s+/).filter(w => w.length > 0).length;
  let appropriateLength = true;
  
  if (wordCount < 150) {
    score -= 0.15;
    appropriateLength = false;
    issues.push(`Resume too sparse (${wordCount} words, recommend 200+)`);
  } else if (wordCount > 1000) {
    score -= 0.05;
    appropriateLength = false;
    issues.push(`Resume may be too long (${wordCount} words, recommend under 800)`);
  }
  
  // 6. Potential Parsing Issues (10% of format score)
  // Check for tables, columns, or complex formatting indicators
  const hasComplexFormatting = /\t{2,}|\|.*\|/.test(resumeText);
  if (hasComplexFormatting) {
    score -= 0.05;
    issues.push('Complex formatting detected (tables/columns may cause parsing issues)');
  }
  
  return {
    score: Math.max(0, Math.round(score * 100) / 100),
    breakdown: {
      hasEmail,
      hasPhone,
      hasParseableDates,
      hasSectionHeaders,
      hasBulletStructure,
      appropriateLength
    },
    issues
  };
}
```

---

## Role-Aware Weight Adjustments

Different job types and seniority levels should weight components differently.

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

interface RoleWeights {
  keywords: number;
  experience: number;
  sections: number;
  format: number;
}

function detectJobRole(jdText: string): JobRole {
  const jdLower = jdText.toLowerCase();
  
  const rolePatterns: [JobRole, RegExp[]][] = [
    ['software_engineer', [/software\s+engineer/i, /developer/i, /frontend/i, /backend/i, /full\s*stack/i, /swe/i]],
    ['data_scientist', [/data\s+scientist/i, /machine\s+learning/i, /ml\s+engineer/i, /ai\s+engineer/i]],
    ['data_analyst', [/data\s+analyst/i, /business\s+analyst/i, /analytics/i, /bi\s+analyst/i]],
    ['product_manager', [/product\s+manager/i, /program\s+manager/i, /project\s+manager/i, /\bpm\b/i]],
    ['designer', [/designer/i, /ux/i, /ui/i, /user\s+experience/i, /graphic/i]],
    ['marketing', [/marketing/i, /growth/i, /content/i, /seo/i, /brand/i]],
    ['finance', [/finance/i, /accounting/i, /financial\s+analyst/i, /controller/i]],
    ['operations', [/operations/i, /supply\s+chain/i, /logistics/i, /procurement/i]]
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
  
  if (/\b(?:director|vp|vice\s+president|head\s+of|chief)\b/i.test(jdLower)) {
    return 'executive';
  }
  if (/\b(?:senior|sr\.?|lead|principal|staff)\b/i.test(jdLower)) {
    return 'senior';
  }
  if (/\b(?:junior|jr\.?|entry|associate|intern|co-?op)\b/i.test(jdLower)) {
    return 'entry';
  }
  if (/\b(?:5\+?\s*years?|7\+?\s*years?|10\+?\s*years?)\b/i.test(jdLower)) {
    return 'senior';
  }
  if (/\b(?:2-?3\s*years?|3-?5\s*years?)\b/i.test(jdLower)) {
    return 'mid';
  }
  if (/\b(?:0-?2\s*years?|1-?2\s*years?|entry\s*level)\b/i.test(jdLower)) {
    return 'entry';
  }
  
  return 'mid';
}
```

### Weight Configuration by Role

```typescript
function getRoleWeights(role: JobRole, seniority: SeniorityLevel, jobType: 'coop' | 'fulltime'): RoleWeights {
  // Base weights
  const baseWeights: Record<JobRole, RoleWeights> = {
    software_engineer: { keywords: 0.50, experience: 0.20, sections: 0.15, format: 0.15 },
    data_analyst: { keywords: 0.50, experience: 0.20, sections: 0.15, format: 0.15 },
    data_scientist: { keywords: 0.50, experience: 0.20, sections: 0.15, format: 0.15 },
    product_manager: { keywords: 0.40, experience: 0.30, sections: 0.15, format: 0.15 },
    designer: { keywords: 0.35, experience: 0.25, sections: 0.20, format: 0.20 },
    marketing: { keywords: 0.45, experience: 0.25, sections: 0.15, format: 0.15 },
    finance: { keywords: 0.45, experience: 0.25, sections: 0.15, format: 0.15 },
    operations: { keywords: 0.45, experience: 0.25, sections: 0.15, format: 0.15 },
    general: { keywords: 0.50, experience: 0.20, sections: 0.15, format: 0.15 }
  };
  
  const weights = { ...baseWeights[role] };
  
  // Seniority adjustments
  if (seniority === 'entry' || jobType === 'coop') {
    // Entry level: keywords matter most, experience less (they don't have much)
    weights.keywords = Math.min(0.60, weights.keywords + 0.05);
    weights.experience = Math.max(0.10, weights.experience - 0.05);
    // Education becomes more important for entry level
    weights.sections = Math.min(0.20, weights.sections + 0.03);
  } else if (seniority === 'senior' || seniority === 'executive') {
    // Senior level: experience and impact matter more
    weights.experience = Math.min(0.30, weights.experience + 0.05);
    weights.keywords = Math.max(0.40, weights.keywords - 0.05);
  }
  
  // Normalize weights to ensure they sum to 1.0
  const total = weights.keywords + weights.experience + weights.sections + weights.format;
  weights.keywords = weights.keywords / total;
  weights.experience = weights.experience / total;
  weights.sections = weights.sections / total;
  weights.format = weights.format / total;
  
  return weights;
}
```

### Weight Summary Table

| Role | Seniority | Keywords | Experience | Sections | Format |
|------|-----------|----------|------------|----------|--------|
| **Software Engineer** | Entry/Co-op | 55% | 15% | 18% | 12% |
| **Software Engineer** | Mid | 50% | 20% | 15% | 15% |
| **Software Engineer** | Senior | 45% | 25% | 15% | 15% |
| **Data Analyst** | Entry/Co-op | 55% | 15% | 18% | 12% |
| **Data Analyst** | Mid | 50% | 20% | 15% | 15% |
| **Product Manager** | Mid | 40% | 30% | 15% | 15% |
| **Product Manager** | Senior | 35% | 35% | 15% | 15% |
| **Designer** | Any | 35% | 25% | 20% | 20% |
| **General** | Entry/Co-op | 55% | 15% | 18% | 12% |
| **General** | Mid | 50% | 20% | 15% | 15% |

---

## Combined Scoring Function

### Main Entry Point

```typescript
interface ATSScoreInput {
  keywords: KeywordMatch[];
  experienceBullets: string[];
  jdKeywords: string[];
  sections: {
    summary?: string;
    skills?: string[];
    experience?: string[];
    education?: string;
    projects?: string;
    certifications?: string[];
  };
  resumeText: string;
  jobType: 'coop' | 'fulltime';
  jdText: string; // Full JD text for role detection
}

interface ATSScoreResult {
  overall: number; // 0-100
  tier: 'excellent' | 'strong' | 'good' | 'fair' | 'weak' | 'poor';
  breakdown: {
    keywords: {
      score: number;      // Component score (0-100)
      weight: number;     // Weight used (0.0-1.0)
      weighted: number;   // Contribution to overall (0-100)
      details: KeywordScoreResult['details'];
    };
    experience: {
      score: number;
      weight: number;
      weighted: number;
      details: ExperienceScoreResult['breakdown'];
    };
    sections: {
      score: number;
      weight: number;
      weighted: number;
      details: SectionScoreResult['breakdown'];
    };
    format: {
      score: number;
      weight: number;
      weighted: number;
      issues: string[];
    };
  };
  metadata: {
    detectedRole: JobRole;
    detectedSeniority: SeniorityLevel;
    weightsUsed: RoleWeights;
  };
  actionItems: string[]; // Top 3-5 things to improve
}

function calculateATSScore(input: ATSScoreInput): ATSScoreResult {
  const {
    keywords,
    experienceBullets,
    jdKeywords,
    sections,
    resumeText,
    jobType,
    jdText
  } = input;
  
  // Detect role and seniority for weight selection
  const detectedRole = detectJobRole(jdText);
  const detectedSeniority = detectSeniorityLevel(jdText, jobType);
  const weights = getRoleWeights(detectedRole, detectedSeniority, jobType);
  
  // Calculate each component
  const keywordResult = calculateKeywordScore(keywords);
  const experienceResult = calculateExperienceScore({ bullets: experienceBullets, jdKeywords });
  const sectionResult = calculateSectionScore({ sections, jobType });
  const formatResult = calculateFormatScore({ resumeText, hasExperience: experienceBullets.length > 0 });
  
  // Calculate weighted overall score
  const overall = Math.round(
    (keywordResult.score * weights.keywords +
     experienceResult.score * weights.experience +
     sectionResult.score * weights.sections +
     formatResult.score * weights.format) * 100
  );
  
  // Determine tier
  const tier = getScoreTier(overall);
  
  // Generate action items based on weakest areas
  const actionItems = generateActionItems(keywordResult, experienceResult, sectionResult, formatResult, weights);
  
  return {
    overall,
    tier,
    breakdown: {
      keywords: {
        score: Math.round(keywordResult.score * 100),
        weight: weights.keywords,
        weighted: Math.round(keywordResult.score * weights.keywords * 100),
        details: keywordResult.details
      },
      experience: {
        score: Math.round(experienceResult.score * 100),
        weight: weights.experience,
        weighted: Math.round(experienceResult.score * weights.experience * 100),
        details: experienceResult.breakdown
      },
      sections: {
        score: Math.round(sectionResult.score * 100),
        weight: weights.sections,
        weighted: Math.round(sectionResult.score * weights.sections * 100),
        details: sectionResult.breakdown
      },
      format: {
        score: Math.round(formatResult.score * 100),
        weight: weights.format,
        weighted: Math.round(formatResult.score * weights.format * 100),
        issues: formatResult.issues
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

function getScoreTier(score: number): ATSScoreResult['tier'] {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'strong';
  if (score >= 70) return 'good';
  if (score >= 60) return 'fair';
  if (score >= 50) return 'weak';
  return 'poor';
}

function generateActionItems(
  keywordResult: KeywordScoreResult,
  experienceResult: ExperienceScoreResult,
  sectionResult: SectionScoreResult,
  formatResult: FormatScoreResult,
  weights: RoleWeights
): string[] {
  const items: { priority: number; text: string }[] = [];
  
  // Keyword issues (highest priority due to weight)
  if (keywordResult.details.missingCritical.length > 0) {
    const missing = keywordResult.details.missingCritical.slice(0, 3).join(', ');
    items.push({
      priority: weights.keywords * 100,
      text: `Add missing critical keywords: ${missing}`
    });
  }
  
  if (keywordResult.breakdown.matchRate < 0.5) {
    items.push({
      priority: weights.keywords * 80,
      text: 'Keyword match rate is low - review JD requirements and incorporate more relevant terms'
    });
  }
  
  // Experience issues
  if (experienceResult.breakdown.quantificationScore < 0.3) {
    items.push({
      priority: weights.experience * 90,
      text: 'Add metrics to experience bullets (%, $, numbers, timeframes)'
    });
  }
  
  if (experienceResult.breakdown.actionVerbScore < 0.5) {
    items.push({
      priority: weights.experience * 70,
      text: 'Start bullets with stronger action verbs (Led, Developed, Implemented)'
    });
  }
  
  // Section issues
  for (const [section, data] of Object.entries(sectionResult.breakdown)) {
    if (data.issues && data.issues.length > 0) {
      items.push({
        priority: weights.sections * 60,
        text: data.issues[0]
      });
    }
  }
  
  // Format issues
  for (const issue of formatResult.issues) {
    items.push({
      priority: weights.format * 50,
      text: issue
    });
  }
  
  // Sort by priority and return top 5
  return items
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
    .map(item => item.text);
}
```

---

## Score Tiers and Interpretation

### Tier Definitions

| Score | Tier | Description | ATS Outcome | Recommended Action |
|-------|------|-------------|-------------|-------------------|
| 90-100 | **Excellent** | Top 5% match rate | Auto-advanced to recruiter | Minor polish only |
| 80-89 | **Strong** | Above average match | High likelihood of review | Optimize 2-3 bullets |
| 70-79 | **Good** | Solid foundation | Good chance of review | Add missing keywords |
| 60-69 | **Fair** | Below average | May be filtered | Significant tailoring needed |
| 50-59 | **Weak** | Major gaps | Likely filtered | Substantial rewrite required |
| <50 | **Poor** | Critical misalignment | Almost certainly rejected | Reconsider fit or major overhaul |

### Tier Display Colors (for UI)

```typescript
const TIER_COLORS = {
  excellent: { bg: '#10B981', text: '#FFFFFF', label: 'Excellent Match' },
  strong: { bg: '#3B82F6', text: '#FFFFFF', label: 'Strong Match' },
  good: { bg: '#8B5CF6', text: '#FFFFFF', label: 'Good Match' },
  fair: { bg: '#F59E0B', text: '#000000', label: 'Fair Match' },
  weak: { bg: '#EF4444', text: '#FFFFFF', label: 'Needs Work' },
  poor: { bg: '#991B1B', text: '#FFFFFF', label: 'Major Gaps' }
} as const;
```

---

## Projected Score Calculation

To show users "Your score could improve to X%" after applying suggestions:

```typescript
interface Suggestion {
  section: 'summary' | 'skills' | 'experience' | 'education';
  keywordsAdded: string[];
  metricsAdded: number; // Count of new quantified statements
  bulletsAffected: number;
}

interface ProjectedScoreResult {
  currentScore: number;
  projectedScore: number;
  improvement: number;
  projectedTier: ATSScoreResult['tier'];
  improvementBreakdown: {
    fromKeywords: number;
    fromExperience: number;
    fromSections: number;
  };
}

function calculateProjectedScore(
  currentResult: ATSScoreResult,
  suggestions: Suggestion[],
  originalKeywords: KeywordMatch[]
): ProjectedScoreResult {
  
  // Clone keywords and mark suggested ones as "would be found"
  const allKeywordsToAdd = suggestions.flatMap(s => s.keywordsAdded);
  
  const projectedKeywords = originalKeywords.map(kw => {
    const wouldBeAdded = allKeywordsToAdd.some(
      added => added.toLowerCase() === kw.keyword.toLowerCase()
    );
    
    if (wouldBeAdded && !kw.found) {
      return {
        ...kw,
        found: true,
        matchType: 'exact' as const // Suggestions add exact matches
      };
    }
    return kw;
  });
  
  // Recalculate keyword score
  const projectedKeywordResult = calculateKeywordScore(projectedKeywords);
  const keywordImprovement = (projectedKeywordResult.score - currentResult.breakdown.keywords.score / 100);
  
  // Estimate experience improvement from added metrics
  const currentExpScore = currentResult.breakdown.experience.score / 100;
  const totalMetricsAdded = suggestions.reduce((sum, s) => sum + s.metricsAdded, 0);
  const metricsBoost = Math.min(0.20, totalMetricsAdded * 0.03); // Cap at 20% improvement
  const projectedExpScore = Math.min(1, currentExpScore + metricsBoost);
  const experienceImprovement = projectedExpScore - currentExpScore;
  
  // Section scores typically don't change much from suggestions
  // (content density stays similar)
  const sectionImprovement = 0;
  
  // Calculate projected overall
  const weights = currentResult.metadata.weightsUsed;
  const projectedOverall = Math.round(
    (projectedKeywordResult.score * weights.keywords +
     projectedExpScore * weights.experience +
     (currentResult.breakdown.sections.score / 100) * weights.sections +
     (currentResult.breakdown.format.score / 100) * weights.format) * 100
  );
  
  return {
    currentScore: currentResult.overall,
    projectedScore: projectedOverall,
    improvement: projectedOverall - currentResult.overall,
    projectedTier: getScoreTier(projectedOverall),
    improvementBreakdown: {
      fromKeywords: Math.round(keywordImprovement * weights.keywords * 100),
      fromExperience: Math.round(experienceImprovement * weights.experience * 100),
      fromSections: Math.round(sectionImprovement * weights.sections * 100)
    }
  };
}
```

---

## Prompt Modifications

### Changes Required

| Prompt | Change | Rationale |
|--------|--------|-----------|
| **Keyword Extraction (1.1)** | No change | Works correctly |
| **Keyword Matching (1.2)** | Ensure `matchType` always returned | Needed for weighted scoring |
| **Content Quality (1.3)** | Replace with ATS-specific prompt OR remove from pipeline | Currently measures human criteria |
| **Summary Suggestion (2.1)** | Remove `point_value` | Calculated programmatically |
| **Skills Suggestion (2.2)** | Remove `point_value` | Calculated programmatically |
| **Experience Suggestion (2.3)** | Remove `point_value` | Calculated programmatically |
| **Education Suggestion (2.4)** | Remove `point_value` | Calculated programmatically |
| **Judge Quality (3.1)** | Keep as-is | Quality gating still needed |

### Updated Keyword Matching Prompt (1.2)

Add explicit instruction for matchType:

```
For each keyword, you MUST specify matchType:
- "exact": The keyword appears verbatim (case-insensitive)
- "fuzzy": An abbreviation or minor variation (e.g., "JS" for "JavaScript", "React.js" for "React")
- "semantic": A conceptually similar term (e.g., "data pipelines" for "ETL", "team leadership" for "led teams")

IMPORTANT: Be conservative with semantic matches. Only mark as "semantic" if the resume content clearly demonstrates the skill, not just tangentially related text.
```

### Remove point_value from Suggestion Prompts

In each suggestion prompt (Summary, Skills, Experience, Education), remove:

```
Also assign a point_value for section-level calculations:
- critical = X-Y points
- high = X-Y points
- moderate = X-Y points
```

And remove `point_value` from the JSON schema.

Keep the `impact` tier (critical/high/moderate) for display purposes.

### New Content Quality Prompt (1.3) - Optional

If you want to keep an LLM-based quality check for diagnostics (not for scoring):

```
You are an ATS compatibility analyzer. Evaluate this resume section for ATS-specific signals.

<resume_section type="{sectionType}">
{sectionContent}
</resume_section>

<job_description>
{jdContent}
</job_description>

Analyze the following ATS-relevant factors:

1. **Keyword Coverage:** What percentage of critical JD keywords appear in this section?
2. **Quantification:** How many statements include metrics (%, $, numbers)?
3. **Action Verbs:** Do statements start with strong, parseable action verbs?
4. **Relevance:** Does the content directly address JD requirements?

Return ONLY valid JSON:
{
  "keyword_analysis": {
    "found": ["Python", "data analysis", "SQL"],
    "missing_critical": ["machine learning", "AWS"],
    "coverage_estimate": "medium"
  },
  "quantification": {
    "statements_with_metrics": 2,
    "total_statements": 6
  },
  "action_verbs": {
    "strong_verbs_used": ["Developed", "Implemented"],
    "weak_verbs_used": ["Helped", "Worked on"]
  },
  "relevance_notes": "Section focuses on backend development but JD emphasizes frontend skills"
}
```

This prompt provides diagnostic information but is **not used in score calculation**.

---

## UI Display Recommendations

### Score Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Your ATS Score                                             │
│  ┌─────────┐                                                │
│  │   54%   │  Fair Match                                    │
│  └─────────┘                                                │
│                                                             │
│  After suggestions: 78% (+24 points)  ← [See Suggestions]   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Score Breakdown                                            │
│                                                             │
│  Keywords        [████████░░░░░░░░░░░░]  52%  (×0.50 = 26)  │
│  Experience      [████████████░░░░░░░░]  65%  (×0.20 = 13)  │
│  Sections        [████████████████░░░░]  80%  (×0.15 = 12)  │
│  Format          [██████████████████░░]  90%  (×0.15 = 14)  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Missing Critical Keywords                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • machine learning  • AWS  • Docker  • Kubernetes   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Top Actions to Improve                                     │
│                                                             │
│  1. Add missing critical keywords: machine learning, AWS    │
│  2. Add metrics to 4+ experience bullets                    │
│  3. Education section is sparse - add coursework            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Display Details

**Keyword Score Card:**
```typescript
interface KeywordDisplayData {
  score: number;           // 52
  matched: number;         // 8
  total: number;           // 15
  matchedKeywords: string[]; // For expandable list
  missingCritical: string[]; // Highlighted in red
  missingOther: string[];    // Shown in gray
}
```

**Experience Score Card:**
```typescript
interface ExperienceDisplayData {
  score: number;
  quantificationRate: string; // "2 of 8 bullets have metrics"
  actionVerbRate: string;     // "5 of 8 bullets start with strong verbs"
  keywordDensity: string;     // "Found 6 of 15 JD keywords in experience"
}
```

**Section Score Card:**
```typescript
interface SectionDisplayData {
  score: number;
  sections: {
    name: string;
    status: 'complete' | 'partial' | 'missing';
    issue?: string;
  }[];
}
```

**Format Score Card:**
```typescript
interface FormatDisplayData {
  score: number;
  checks: {
    name: string;
    passed: boolean;
    detail?: string;
  }[];
}
```

---

## Implementation Plan

### Phase 1: Core Scoring Module (3-4 days)

**Files to create:**
- `lib/scoring/types.ts` - All type definitions
- `lib/scoring/constants.ts` - Weight constants, patterns, verb lists
- `lib/scoring/keywordScore.ts` - Keyword scoring logic
- `lib/scoring/experienceScore.ts` - Experience scoring logic
- `lib/scoring/sectionScore.ts` - Section scoring logic
- `lib/scoring/formatScore.ts` - Format scoring logic
- `lib/scoring/roleDetection.ts` - Role and seniority detection
- `lib/scoring/atsScore.ts` - Main entry point combining all components
- `lib/scoring/projectedScore.ts` - Projection calculation

**Tests:**
- `__tests__/scoring/keywordScore.test.ts`
- `__tests__/scoring/experienceScore.test.ts`
- `__tests__/scoring/atsScore.test.ts`

### Phase 2: Pipeline Integration (2-3 days)

**Changes:**
1. After keyword matching, call `calculateATSScore()` to get baseline
2. Store baseline in session/state
3. After suggestion generation, call `calculateProjectedScore()`
4. Store projected score for comparison display

**Integration points:**
- `lib/ai/analyzeResume.ts` (or equivalent pipeline file)
- Session storage to persist scores

### Phase 3: Prompt Updates (1-2 days)

**Changes:**
1. Update keyword matching prompt to ensure matchType consistency
2. Remove `point_value` from all suggestion prompts
3. Optionally replace Content Quality prompt

### Phase 4: UI Updates (3-4 days)

**Components:**
1. Score dashboard with breakdown visualization
2. Tier badge component
3. Missing keywords display
4. Action items list
5. Before/after comparison (current → projected)

### Timeline Summary

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Core Scoring | 3-4 days | None |
| Phase 2: Pipeline Integration | 2-3 days | Phase 1 |
| Phase 3: Prompt Updates | 1-2 days | Phase 1 |
| Phase 4: UI Updates | 3-4 days | Phase 2, 3 |
| **Total** | **9-13 days** | |

---

## Expected Impact

### Score Calibration

| Resume Profile | Current Score | New Score | Change |
|----------------|---------------|-----------|--------|
| Weak keyword match (8/15), all semantic | 71-73% | 48-52% | -20 to -23 |
| Moderate match (10/15), mixed types, 2 missing high | 68-72% | 55-60% | -12 to -13 |
| Strong match (12/15), most exact, good metrics | 82-88% | 78-85% | -3 to -5 |
| Excellent match (14/15), all exact, great format | 90-95% | 88-93% | -2 to -3 |

### User Experience Improvements

| Before | After |
|--------|-------|
| Single opaque score | Score with transparent breakdown |
| "Here are suggestions worth +35 points" | "Your score: 54% → After suggestions: 78%" |
| No explanation for score | "Missing critical keywords: AWS, Docker" |
| Generic advice | Prioritized action items based on impact |

### Technical Improvements

| Metric | Before | After |
|--------|--------|-------|
| Score variance between runs | High (LLM-generated) | Zero (deterministic) |
| Score calculation cost | ~$0.004 (LLM calls) | ~$0 (programmatic) |
| Explainability | None | Full breakdown available |
| Testability | Difficult | Unit testable |

---

## Type Definitions

### Complete Type Reference

```typescript
// ============================================
// Input Types
// ============================================

interface KeywordMatch {
  keyword: string;
  category: 'skills' | 'technologies' | 'qualifications' | 'experience' | 'soft_skills' | 'certifications';
  importance: 'high' | 'medium' | 'low';
  found: boolean;
  matchType?: 'exact' | 'fuzzy' | 'semantic';
  context?: string;
}

interface ExperienceScoreInput {
  bullets: string[];
  jdKeywords: string[];
}

interface SectionScoreInput {
  sections: {
    summary?: string;
    skills?: string[];
    experience?: string[];
    education?: string;
    projects?: string;
    certifications?: string[];
  };
  jobType: 'coop' | 'fulltime';
}

interface FormatScoreInput {
  resumeText: string;
  hasExperience: boolean;
}

interface ATSScoreInput {
  keywords: KeywordMatch[];
  experienceBullets: string[];
  jdKeywords: string[];
  sections: SectionScoreInput['sections'];
  resumeText: string;
  jobType: 'coop' | 'fulltime';
  jdText: string;
}

// ============================================
// Output Types
// ============================================

interface KeywordScoreResult {
  score: number;
  breakdown: {
    achievedPoints: number;
    possiblePoints: number;
    matchRate: number;
    penaltyMultiplier: number;
    missingHighCount: number;
  };
  details: {
    matched: KeywordMatch[];
    missing: KeywordMatch[];
    missingCritical: string[];
  };
}

interface ExperienceScoreResult {
  score: number;
  breakdown: {
    quantificationScore: number;
    actionVerbScore: number;
    keywordDensityScore: number;
    bulletsWithMetrics: number;
    totalBullets: number;
    bulletsWithStrongVerbs: number;
    keywordsFoundInExperience: number;
  };
}

interface SectionScoreResult {
  score: number;
  breakdown: {
    [sectionName: string]: {
      present: boolean;
      meetsThreshold: boolean;
      points: number;
      maxPoints: number;
      issues?: string[];
    };
  };
}

interface FormatScoreResult {
  score: number;
  breakdown: {
    hasEmail: boolean;
    hasPhone: boolean;
    hasParseableDates: boolean;
    hasSectionHeaders: boolean;
    hasBulletStructure: boolean;
    appropriateLength: boolean;
  };
  issues: string[];
}

type ScoreTier = 'excellent' | 'strong' | 'good' | 'fair' | 'weak' | 'poor';

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

interface RoleWeights {
  keywords: number;
  experience: number;
  sections: number;
  format: number;
}

interface ATSScoreResult {
  overall: number;
  tier: ScoreTier;
  breakdown: {
    keywords: {
      score: number;
      weight: number;
      weighted: number;
      details: KeywordScoreResult['details'];
    };
    experience: {
      score: number;
      weight: number;
      weighted: number;
      details: ExperienceScoreResult['breakdown'];
    };
    sections: {
      score: number;
      weight: number;
      weighted: number;
      details: SectionScoreResult['breakdown'];
    };
    format: {
      score: number;
      weight: number;
      weighted: number;
      issues: string[];
    };
  };
  metadata: {
    detectedRole: JobRole;
    detectedSeniority: SeniorityLevel;
    weightsUsed: RoleWeights;
  };
  actionItems: string[];
}

interface ProjectedScoreResult {
  currentScore: number;
  projectedScore: number;
  improvement: number;
  projectedTier: ScoreTier;
  improvementBreakdown: {
    fromKeywords: number;
    fromExperience: number;
    fromSections: number;
  };
}

// ============================================
// Constants
// ============================================

const IMPORTANCE_WEIGHTS = {
  high: 1.0,
  medium: 0.6,
  low: 0.3
} as const;

const MATCH_TYPE_WEIGHTS = {
  exact: 1.0,
  fuzzy: 0.85,
  semantic: 0.65
} as const;

const MISSING_HIGH_PENALTY = 0.15;
const MIN_PENALTY_MULTIPLIER = 0.40;

const TIER_THRESHOLDS = {
  excellent: 90,
  strong: 80,
  good: 70,
  fair: 60,
  weak: 50,
  poor: 0
} as const;
```

---

## Appendix: Testing Strategy

### Unit Test Cases for Keyword Scoring

```typescript
describe('calculateKeywordScore', () => {
  it('should return 100% for all keywords matched exactly', () => {
    const keywords = [
      { keyword: 'Python', importance: 'high', found: true, matchType: 'exact' },
      { keyword: 'SQL', importance: 'high', found: true, matchType: 'exact' },
    ];
    const result = calculateKeywordScore(keywords);
    expect(result.score).toBe(1.0);
  });

  it('should apply semantic match weight of 0.65', () => {
    const keywords = [
      { keyword: 'Python', importance: 'high', found: true, matchType: 'semantic' },
    ];
    const result = calculateKeywordScore(keywords);
    expect(result.score).toBe(0.65);
  });

  it('should apply penalty for missing high-importance keywords', () => {
    const keywords = [
      { keyword: 'Python', importance: 'high', found: true, matchType: 'exact' },
      { keyword: 'AWS', importance: 'high', found: false },
      { keyword: 'Docker', importance: 'high', found: false },
    ];
    const result = calculateKeywordScore(keywords);
    // 1/3 matched = 0.33, penalty for 2 missing = 0.70 multiplier
    // 0.33 * 0.70 = 0.23
    expect(result.score).toBeCloseTo(0.23, 1);
  });

  it('should weight low importance keywords less', () => {
    const keywords = [
      { keyword: 'Python', importance: 'high', found: false },
      { keyword: 'teamwork', importance: 'low', found: true, matchType: 'exact' },
    ];
    const result = calculateKeywordScore(keywords);
    // Possible: 1.0 + 0.3 = 1.3
    // Achieved: 0.3
    // Rate: 0.3 / 1.3 = 0.23
    // Penalty for 1 missing high: 0.85
    // Final: 0.23 * 0.85 = 0.20
    expect(result.score).toBeCloseTo(0.20, 1);
  });
});
```

### Integration Test Cases

```typescript
describe('calculateATSScore integration', () => {
  it('should produce score between 50-60 for weak keyword match', () => {
    const input = createWeakMatchResume();
    const result = calculateATSScore(input);
    expect(result.overall).toBeGreaterThanOrEqual(50);
    expect(result.overall).toBeLessThanOrEqual(60);
  });

  it('should detect software engineer role correctly', () => {
    const input = createSoftwareEngineerJD();
    const result = calculateATSScore(input);
    expect(result.metadata.detectedRole).toBe('software_engineer');
  });

  it('should weight education higher for co-op', () => {
    const coopInput = { ...baseInput, jobType: 'coop' };
    const fulltimeInput = { ...baseInput, jobType: 'fulltime' };
    
    const coopResult = calculateATSScore(coopInput);
    const fulltimeResult = calculateATSScore(fulltimeInput);
    
    expect(coopResult.breakdown.sections.weight)
      .toBeGreaterThan(fulltimeResult.breakdown.sections.weight);
  });
});
```

---

*End of Specification*
