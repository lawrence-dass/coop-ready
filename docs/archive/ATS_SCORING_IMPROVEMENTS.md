# ATS Scoring System: Current vs. Proposed Improvements

**Version:** 1.0
**Date:** January 2026
**Status:** Technical Documentation for Implementation Planning

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Implementation](#2-current-implementation)
3. [Identified Leniency Issues](#3-identified-leniency-issues)
4. [Proposed Improvements](#4-proposed-improvements)
5. [Comparison Tables](#5-comparison-tables)
6. [Technical Specification](#6-technical-specification)
7. [Implementation Plan](#7-implementation-plan)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. Executive Summary

### Problem Statement

The current SubmitSmart ATS scoring system produces **inflated scores (~15-20 points higher than expected)**. A resume that should realistically score 50-60% against a job description is scoring 71-73%.

### Root Causes Identified

| Cause | Impact |
|-------|--------|
| Semantic matches treated equally to exact matches | +10-15 points |
| No penalty for missing critical keywords | +5-10 points |
| Content Quality measures human criteria, not ATS signals | +5-8 points |
| All keywords weighted equally (soft skills = technical skills) | +3-5 points |
| Binary section coverage (exists = full credit) | +2-3 points |

### Proposed Solution

Replace the current LLM-generated scoring with a **deterministic, programmatic calculation** that:

1. **Weights keywords by importance and match type** (exact vs. fuzzy vs. semantic)
2. **Penalizes missing critical keywords** rather than only crediting found ones
3. **Measures ATS-specific signals** (metrics, action verbs, format) instead of subjective human criteria
4. **Provides transparent breakdowns** so users understand their score
5. **Supports role-aware weight adjustments** for different job types

### Expected Impact

| Resume Profile | Current Score | Projected Score | Delta |
|----------------|---------------|-----------------|-------|
| Weak keyword match (8/15, all semantic) | 71-73% | 48-52% | -20 to -23 |
| Moderate match (10/15, mixed types) | 68-72% | 55-60% | -12 to -13 |
| Strong match (12/15, mostly exact) | 85-90% | 80-88% | -2 to -5 |

---

## 2. Current Implementation

### 2.1 Scoring Formula

The current implementation uses a **3-component weighted formula**:

```
Overall = (Keyword × 0.50) + (Section × 0.25) + (Quality × 0.25)
```

**Source:** `lib/ai/calculateATSScore.ts:8-10`

```typescript
const KEYWORD_WEIGHT = 0.50;
const SECTION_WEIGHT = 0.25;
const QUALITY_WEIGHT = 0.25;
```

### 2.2 Keyword Score Calculation

**Current approach:** Simple match rate with no weighting.

**Source:** `lib/ai/calculateATSScore.ts:25-27`

```typescript
function calculateKeywordScore(keywordAnalysis: KeywordAnalysisResult): number {
  return Math.round(keywordAnalysis.matchRate);
}
```

**Issues:**
- `matchRate` is calculated as `(matchedCount / totalKeywords) * 100`
- No distinction between importance levels (high/medium/low)
- No distinction between match types (exact/fuzzy/semantic)
- "teamwork" counts the same as "Python"
- A semantic match ("worked with data" → "data analytics") counts as 100%

### 2.3 Section Coverage Calculation

**Current approach:** Binary presence check.

**Source:** `lib/ai/calculateATSScore.ts:41-51`

```typescript
const REQUIRED_SECTIONS = ['summary', 'skills', 'experience'] as const;

function calculateSectionCoverageScore(parsedResume: Resume): number {
  const presentSections = REQUIRED_SECTIONS.filter(
    (section) => {
      const content = parsedResume[section];
      return content && content.trim().length > 0;
    }
  );

  const coverageRate = presentSections.length / REQUIRED_SECTIONS.length;
  return Math.round(coverageRate * 100);
}
```

**Issues:**
- A section with 1 character gets full credit
- No content density evaluation
- No minimum thresholds for meaningful content

### 2.4 Content Quality Calculation

**Current approach:** LLM judges human-readable criteria.

**Source:** `lib/ai/judgeContentQuality.ts:48-58`

```typescript
Rate this section 0-100 on:
- Relevance: How well does it match the job requirements?
- Clarity: Is it clear, concise, and professional?
- Impact: Does it demonstrate value and achievements?
```

**Issues:**
- **Relevance**: Subjective, overlaps with keyword matching
- **Clarity**: Human readability, not ATS parseability
- **Impact**: Human persuasion metric, ATS doesn't evaluate "impact"
- LLM produces variable scores across runs
- Cost: ~$0.003 per evaluation (3 LLM calls)

### 2.5 Keyword Matching Details

**Source:** `lib/ai/matchKeywords.ts:27-48`

The current keyword matching prompt correctly identifies match types:

```typescript
- matchType: "exact" (exact string match), "fuzzy" (abbreviation/variation), or "semantic" (similar meaning)
```

**However**, the score calculation ignores `matchType` entirely - all matches count equally.

---

## 3. Identified Leniency Issues

### 3.1 Issue Matrix

| Issue | Current Behavior | Impact | Example |
|-------|------------------|--------|---------|
| **No importance weighting** | All keywords equal | +3-5 pts | "communication" = "Kubernetes" |
| **No match type weighting** | semantic = exact | +10-15 pts | "worked with data" = "data analytics" at 100% |
| **No missing keyword penalty** | Only credit for found | +5-10 pts | Missing 3 critical skills → no deduction |
| **Binary section check** | exists = full credit | +2-3 pts | 1 character = 100% section score |
| **Human quality criteria** | LLM judges clarity/impact | +5-8 pts | "Clear writing" not an ATS signal |
| **LLM score variance** | Non-deterministic | ±5 pts | Same resume scores differently |

### 3.2 Real-World Score Inflation Example

**Scenario:** Resume with 8/12 keywords matched (all semantic), well-written content

| Component | Current Calculation | Current Score |
|-----------|---------------------|---------------|
| Keywords | 8/12 = 67% | 67 |
| Sections | 3/3 present | 100 |
| Quality | LLM: "Clear, good impact" | 80 |
| **Overall** | 67×0.5 + 100×0.25 + 80×0.25 | **78%** |

**Expected realistic score:** ~50-55% (semantic matches shouldn't count full value)

---

## 4. Proposed Improvements

### 4.1 New 4-Component Formula

```
Overall = (Keyword × 0.50) + (Experience × 0.20) + (Section × 0.15) + (Format × 0.15)
```

| Component | Weight | Rationale |
|-----------|--------|-----------|
| Keywords | 50% | ATS primarily filters on keyword matching |
| Experience | 20% | Quality signals for ranking after filter pass |
| Sections | 15% | Structure affects parseability |
| Format | 15% | Technical parsing success |

### 4.2 Weighted Keyword Scoring

**Importance Weights:**

```typescript
const IMPORTANCE_WEIGHTS = {
  high: 1.0,    // Required skills, must-have qualifications
  medium: 0.6,  // Preferred skills, nice-to-have
  low: 0.3      // Soft skills, general terms
} as const;
```

**Match Type Weights:**

```typescript
const MATCH_TYPE_WEIGHTS = {
  exact: 1.0,     // "Python" matches "Python"
  fuzzy: 0.85,    // "JS" matches "JavaScript"
  semantic: 0.65  // "data pipelines" matches "ETL processes"
} as const;
```

**Calculation:**

```typescript
interface KeywordMatch {
  keyword: string;
  category: 'skills' | 'technologies' | 'qualifications' | 'experience' | 'soft_skills' | 'certifications';
  importance: 'high' | 'medium' | 'low';
  found: boolean;
  matchType?: 'exact' | 'fuzzy' | 'semantic';
  context?: string;
}

function calculateKeywordScore(keywords: KeywordMatch[]): KeywordScoreResult {
  let achievedPoints = 0;
  let possiblePoints = 0;
  let missingHighCount = 0;

  for (const kw of keywords) {
    const importanceWeight = IMPORTANCE_WEIGHTS[kw.importance];
    possiblePoints += importanceWeight;

    if (kw.found && kw.matchType) {
      const matchWeight = MATCH_TYPE_WEIGHTS[kw.matchType];
      achievedPoints += importanceWeight * matchWeight;
    } else if (kw.importance === 'high') {
      missingHighCount++;
    }
  }

  // Base score: percentage of weighted keywords matched
  const matchRate = possiblePoints > 0 ? achievedPoints / possiblePoints : 0;

  // Apply penalty for missing critical keywords
  const penaltyMultiplier = Math.max(
    MIN_PENALTY_MULTIPLIER,  // 0.40 floor
    1 - (missingHighCount * MISSING_HIGH_PENALTY)  // 0.15 per missing
  );

  return {
    score: matchRate * penaltyMultiplier,
    // ... breakdown details
  };
}
```

### 4.3 Missing Keyword Penalty System

```typescript
// Penalty for each missing high-importance keyword
const MISSING_HIGH_PENALTY = 0.15;

// Minimum score multiplier (floor after penalties)
const MIN_PENALTY_MULTIPLIER = 0.40;
```

**Example:**
- 2 missing high-importance keywords → 0.70 multiplier (30% penalty)
- 4 missing high-importance keywords → 0.40 multiplier (capped at floor)

### 4.4 NEW: Experience Score Component (20%)

Replaces the LLM-based "Content Quality" with deterministic ATS-relevant metrics.

```typescript
interface ExperienceScoreResult {
  score: number; // 0.00 to 1.00
  breakdown: {
    quantificationScore: number;    // 35% weight - bullets with metrics
    actionVerbScore: number;        // 30% weight - strong vs weak verbs
    keywordDensityScore: number;    // 35% weight - JD keywords in experience
  };
}
```

**Metric Detection Patterns:**

```typescript
const METRIC_PATTERNS: RegExp[] = [
  /\d+%/,                                          // Percentages: "30%", "150%"
  /\d+x/i,                                         // Multipliers: "3x", "10X"
  /\$[\d,]+(?:\.\d{2})?[KMB]?/i,                  // Currency: "$50K", "$1.2M"
  /\b\d{1,3}(?:,\d{3})+\b/,                       // Large numbers: "1,000", "50,000"
  /\b\d+\+?\s*(?:years?|months?|weeks?|days?)\b/i, // Time: "3 years", "6+ months"
  /team\s+of\s+\d+/i,                             // Team size: "team of 5"
  /\b\d+\s*(?:clients?|customers?|users?)\b/i,   // Counts: "500 users"
];
```

**Strong Action Verbs:**

```typescript
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
]);

const WEAK_ACTION_VERBS = new Set([
  'helped', 'worked', 'was responsible for', 'handled', 'dealt with',
  'involved in', 'participated in', 'assisted with', 'tasked with'
]);
```

### 4.5 NEW: Format Score Component (15%)

Detects ATS parseability signals using pattern matching.

```typescript
interface FormatScoreResult {
  score: number;
  breakdown: {
    hasEmail: boolean;           // -10% if missing
    hasPhone: boolean;           // -5% if missing
    hasParseableDates: boolean;  // -15% if missing (with experience)
    hasSectionHeaders: boolean;  // -10% if < 3 headers
    hasBulletStructure: boolean; // -10% if missing (with experience)
    appropriateLength: boolean;  // -15% if < 150 words, -5% if > 1000
  };
}
```

**Date Pattern Recognition:**

```typescript
const datePatterns = [
  /\b(?:Jan(?:uary)?|Feb(?:ruary)?|...|Dec(?:ember)?)\s+\d{4}\b/gi,
  /\b\d{1,2}\/\d{4}\b/g,
  /\b\d{4}\s*[-–—]\s*(?:\d{4}|Present|Current|Now)\b/gi,
  /\b(?:Expected|Graduating?)\s+(?:Month)\s+\d{4}\b/gi
];
```

### 4.6 Role-Aware Weight Adjustments

Different job types weight components differently:

```typescript
type JobRole =
  | 'software_engineer'
  | 'data_analyst'
  | 'product_manager'
  | 'designer'
  | 'general';

type SeniorityLevel = 'entry' | 'mid' | 'senior' | 'executive';

function getRoleWeights(role: JobRole, seniority: SeniorityLevel): RoleWeights {
  const baseWeights: Record<JobRole, RoleWeights> = {
    software_engineer: { keywords: 0.50, experience: 0.20, sections: 0.15, format: 0.15 },
    product_manager:   { keywords: 0.40, experience: 0.30, sections: 0.15, format: 0.15 },
    designer:          { keywords: 0.35, experience: 0.25, sections: 0.20, format: 0.20 },
    // ...
  };

  // Seniority adjustments
  if (seniority === 'entry') {
    // Keywords matter most, experience less (they don't have much)
    weights.keywords += 0.05;
    weights.experience -= 0.05;
  }

  return normalizeWeights(weights);
}
```

---

## 5. Comparison Tables

### 5.1 Component Weight Changes

| Component | Current | Proposed | Change |
|-----------|---------|----------|--------|
| Keywords | 50% | 50% | — |
| Section Coverage | 25% | 15% | -10% |
| Content Quality | 25% | REMOVED | -25% |
| Experience (NEW) | — | 20% | +20% |
| Format (NEW) | — | 15% | +15% |

### 5.2 Scoring Method Changes

| Aspect | Current | Proposed |
|--------|---------|----------|
| Keyword weighting | None (all equal) | By importance + match type |
| Missing keyword penalty | None | -15% per missing high-importance |
| Section evaluation | Binary (exists/not) | Density thresholds |
| Quality assessment | LLM (subjective) | Programmatic (objective) |
| Score variance | ±5 points (LLM) | 0 (deterministic) |
| Cost per score | ~$0.003 (3 LLM calls) | ~$0 (programmatic) |

### 5.3 Match Type Impact Examples

| Keyword | Match Type | Current Value | Proposed Value |
|---------|------------|---------------|----------------|
| "Python" | exact | 100% | 100% |
| "JS" → "JavaScript" | fuzzy | 100% | 85% |
| "worked with data" → "data analytics" | semantic | 100% | 65% |

### 5.4 Scoring Examples (Before/After)

| Scenario | Current | Proposed | Delta |
|----------|---------|----------|-------|
| 8/12 keywords, all semantic, 0 missing high | 67% | 43% | -24 |
| 8/12 keywords, all exact, 2 missing high | 67% | 47% | -20 |
| 10/15 keywords, mixed types, good metrics | 75% | 68% | -7 |
| 14/15 keywords, all exact, great format | 93% | 90% | -3 |

---

## 6. Technical Specification

### 6.1 Type Definitions

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
  jdText: string;
}

// ============================================
// Output Types
// ============================================

type ScoreTier = 'excellent' | 'strong' | 'good' | 'fair' | 'weak' | 'poor';

interface ATSScoreResult {
  overall: number; // 0-100
  tier: ScoreTier;
  breakdown: {
    keywords: { score: number; weight: number; weighted: number; details: KeywordDetails };
    experience: { score: number; weight: number; weighted: number; details: ExperienceDetails };
    sections: { score: number; weight: number; weighted: number; details: SectionDetails };
    format: { score: number; weight: number; weighted: number; issues: string[] };
  };
  metadata: {
    detectedRole: JobRole;
    detectedSeniority: SeniorityLevel;
    weightsUsed: RoleWeights;
  };
  actionItems: string[]; // Top 3-5 things to improve
}
```

### 6.2 Constants

```typescript
// Keyword importance weights
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

// Penalty constants
const MISSING_HIGH_PENALTY = 0.15;
const MIN_PENALTY_MULTIPLIER = 0.40;

// Score tier thresholds
const TIER_THRESHOLDS = {
  excellent: 90,
  strong: 80,
  good: 70,
  fair: 60,
  weak: 50,
  poor: 0
} as const;
```

### 6.3 Score Tier Definitions

| Score | Tier | ATS Outcome | User Action |
|-------|------|-------------|-------------|
| 90-100 | Excellent | Auto-advanced to recruiter | Minor polish only |
| 80-89 | Strong | High likelihood of review | Optimize 2-3 bullets |
| 70-79 | Good | Good chance of review | Add missing keywords |
| 60-69 | Fair | May be filtered | Significant tailoring |
| 50-59 | Weak | Likely filtered | Substantial rewrite |
| <50 | Poor | Almost certainly rejected | Major overhaul |

---

## 7. Implementation Plan

### Phase 1: Core Scoring Module (3-4 days)

**Files to create:**

| File | Purpose |
|------|---------|
| `lib/scoring/types.ts` | All type definitions |
| `lib/scoring/constants.ts` | Weight constants, patterns, verb lists |
| `lib/scoring/keywordScore.ts` | Weighted keyword scoring logic |
| `lib/scoring/experienceScore.ts` | Quantification, verbs, density |
| `lib/scoring/sectionScore.ts` | Density-based section evaluation |
| `lib/scoring/formatScore.ts` | ATS parseability checks |
| `lib/scoring/roleDetection.ts` | Role and seniority detection |
| `lib/scoring/atsScore.ts` | Main entry point |
| `lib/scoring/projectedScore.ts` | Post-suggestion projection |

### Phase 2: Pipeline Integration (2-3 days)

**Files to modify:**

| File | Change |
|------|--------|
| `lib/ai/calculateATSScore.ts` | Delegate to new scoring module |
| `actions/analyzeResume.ts` | Wire new scoring into pipeline |
| `lib/ai/matchKeywords.ts` | Ensure `matchType` consistency |

### Phase 3: Prompt Updates (1-2 days)

**Changes:**
1. Update keyword matching prompt for stricter `matchType` classification
2. Remove `point_value` from suggestion prompts (calculated programmatically)
3. Remove or repurpose Content Quality prompt

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

## 8. Testing Strategy

### 8.1 Unit Tests

**Keyword Scoring:**

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
    expect(result.score).toBeCloseTo(0.23, 1);
  });

  it('should weight low importance keywords less', () => {
    const keywords = [
      { keyword: 'Python', importance: 'high', found: false },
      { keyword: 'teamwork', importance: 'low', found: true, matchType: 'exact' },
    ];
    const result = calculateKeywordScore(keywords);
    // Achieved: 0.3, Possible: 1.3, Rate: 0.23, Penalty: 0.85
    expect(result.score).toBeCloseTo(0.20, 1);
  });
});
```

**Experience Scoring:**

```typescript
describe('calculateExperienceScore', () => {
  it('should detect metrics in bullets', () => {
    const bullets = [
      'Increased sales by 30%',
      'Managed team of 5 engineers',
      'Reduced costs by $50K annually',
    ];
    const result = calculateExperienceScore({ bullets, jdKeywords: [] });
    expect(result.breakdown.bulletsWithMetrics).toBe(3);
  });

  it('should identify strong action verbs', () => {
    const bullets = [
      'Led development of new feature',
      'Helped with testing',
      'Delivered project on time',
    ];
    const result = calculateExperienceScore({ bullets, jdKeywords: [] });
    expect(result.breakdown.bulletsWithStrongVerbs).toBe(2);
  });
});
```

### 8.2 Integration Tests

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

  it('should be deterministic (same input = same output)', () => {
    const input = createTestResume();
    const result1 = calculateATSScore(input);
    const result2 = calculateATSScore(input);
    expect(result1.overall).toBe(result2.overall);
  });
});
```

### 8.3 Calibration Test Fixtures

Create known resume profiles with expected scores:

| Fixture | Profile | Expected Score |
|---------|---------|----------------|
| `weak-semantic-match.json` | 8/15 semantic, no metrics | 45-52% |
| `moderate-mixed-match.json` | 10/15 mixed, some metrics | 58-65% |
| `strong-exact-match.json` | 13/15 exact, good metrics | 78-85% |
| `excellent-full-match.json` | 15/15 exact, great format | 88-95% |

---

## Related Documents

- [ATS Scoring System Specification](./ats-scoring-system-specification.md) - Full technical spec
- [LLM Prompts Documentation](./LLM_PROMPTS.md) - Current prompt implementations
- [Product Overview](./PRODUCT_OVERVIEW.md) - System context

---

*Document created: January 2026*
*Last updated: January 2026*
