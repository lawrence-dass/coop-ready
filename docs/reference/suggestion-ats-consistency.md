# Suggestion-ATS Consistency Architecture

> **Version:** 1.0
> **Date:** February 2026
> **Status:** Implemented

## Problem Statement

The ATS analysis and suggestion generation were operating independently, causing inconsistencies:

### Observed Issues

| ATS Analysis Found | Suggestions Generated | Problem |
|-------------------|----------------------|---------|
| Missing REQUIRED: Django, CI/CD | Added PREFERRED: TypeScript, Docker | Wrong priority |
| "Problem-Solving" not detected | No mention of problem-solving | Keyword in resume but not surfaced |
| "No education section" | Formatting suggestions only | Analysis bug - section exists |
| 2 years below requirement | No acknowledgment | Unfixable gap ignored |

### Root Cause

```
┌─────────────────────────────────────────────────────────┐
│ ATS ANALYSIS                                            │
│ • Produces: scores, keywords, actionItems               │
│ • Knows: what's missing, priorities, impact            │
└─────────────────────────────────────────────────────────┘
                    ↓ NOT CONNECTED ↓
┌─────────────────────────────────────────────────────────┐
│ SUGGESTION GENERATION                                   │
│ • Receives: resume, JD, generic keywords               │
│ • Doesn't know: priorities, what analysis found        │
│ • Result: suggestions don't address critical gaps      │
└─────────────────────────────────────────────────────────┘
```

---

## Solution Approaches Evaluated

### Approach 1: Structured ATS Context Injection

**Concept:** Pass a summary of ATS findings to suggestion prompts.

**Pros:**
- Direct: LLM sees gaps and addresses them
- Efficient: Single pass generation

**Cons:**
- Doesn't distinguish fixable vs unfixable gaps
- Could suggest fabricating skills candidate doesn't have
- LLMs may still ignore instructions

**Verdict:** Good concept, but lacks honesty guardrails.

---

### Approach 2: ActionItems-Driven Generation

**Concept:** Use existing `actionItems[]` array to drive suggestions.

**Example actionItems:**
```typescript
[
  { priority: 'critical', message: 'Add Django, CI/CD...', potentialImpact: 15 },
  { priority: 'high', message: 'Use exact terminology...', potentialImpact: 10 },
]
```

**Pros:**
- Reuses existing computation
- Clear priority ordering

**Cons:**
- Too coarse: "Add Django" doesn't specify WHERE or WHETHER it's honest
- actionItems are for UI display, not LLM guidance
- Some actionItems are unfixable (years of experience, degree)

**Verdict:** actionItems too coarse for section-specific guidance.

---

### Approach 3: Two-Pass Generation with Validation

**Concept:** Generate suggestions first, then validate against ATS gaps.

**Pass 1:** Generate suggestions (current way)
**Pass 2:** Score each suggestion against gaps, reorder/filter

**Pros:**
- Maintains creative freedom
- Post-hoc validation is deterministic

**Cons:**
- Wasteful: May generate 10 suggestions where only 2 address gaps
- Can't create new suggestions if Pass 1 misses gaps
- Double cost and latency

**Verdict:** Too wasteful, can't guarantee gap coverage.

---

### Approach 4: Hybrid Constraint + Freedom (60/40 Split)

**Concept:** 60% of suggestions MUST address gaps, 40% can be free.

**Pros:**
- Guarantees some gap coverage
- Allows creative improvements

**Cons:**
- Arbitrary ratio doesn't adapt to actual gap count
- What if 2 gaps exist? Forces 6 repetitive suggestions
- What if 10 gaps exist? Only addresses 6

**Verdict:** Too rigid, doesn't adapt to reality.

---

## Chosen Solution: Addressability-Aware Context Injection

### Key Insight

The critical distinction missing from all approaches: **gaps have different addressability levels**.

| Addressability | Definition | Example | Action |
|---------------|------------|---------|--------|
| **Terminology** | Resume has the skill, just different wording | "REST APIs" → "RESTful APIs" | Change wording |
| **Potential** | Resume might have related experience | Python dev might know Django | Add only if evidence exists |
| **Unfixable** | Genuine gap, can't address honestly | Different degree, fewer years | Acknowledge, don't fabricate |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ATS Analysis (existing)                                      │
│    Input: resume, job description                               │
│    Output: ATSScoreV21, keywordAnalysis, actionItems            │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Gap Addressability Processor (NEW)                           │
│    Input: keywordAnalysis, resume text, parsed sections         │
│    Output: ProcessedGap[] with addressability categorization    │
│                                                                 │
│    Logic:                                                       │
│    - For each missing keyword, check if resume has evidence     │
│    - Categorize: terminology | potential | unfixable            │
│    - Generate section-specific instructions                     │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Section Context Builder (NEW)                                │
│    Input: ProcessedGap[], target section                        │
│    Output: ATSSectionContext for prompt injection               │
│                                                                 │
│    Logic:                                                       │
│    - Filter gaps relevant to section (skills, experience, etc.) │
│    - Format as structured prompt context                        │
│    - Include instructions, not just gap names                   │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Suggestion Generator (modified)                              │
│    Input: section content, JD, ATSSectionContext                │
│    Output: suggestions with ATS-aware "Why this works"          │
│                                                                 │
│    Prompt includes:                                             │
│    - TERMINOLOGY FIXES: high confidence, make these changes     │
│    - POTENTIAL ADDITIONS: only if evidence supports             │
│    - DO NOT FABRICATE: skills not evident in resume             │
│    - ALSO CONSIDER: lower priority preferred keywords           │
└─────────────────────────────────────────────────────────────────┘
```

### Data Structures

```typescript
// Gap addressability categorization
type GapAddressability = 'terminology' | 'potential' | 'unfixable';

// Processed gap with actionable guidance
interface ProcessedGap {
  keyword: string;                    // "Django"
  priority: 'critical' | 'high' | 'medium' | 'low';
  requirement: 'required' | 'preferred';
  potentialImpact: number;            // +12 pts
  addressability: GapAddressability;

  // Why this addressability was assigned
  reason: string;                     // "No Python web framework mentioned"

  // Evidence found in resume (for terminology/potential)
  evidence: string | null;            // "Uses REST APIs" → can change to RESTful

  // Which sections can address this gap
  targetSections: SectionType[];      // ['skills', 'experience']

  // Specific instruction for LLM
  instruction: string;                // "Change 'REST APIs' to 'RESTful APIs'"
}

// Section-specific context for suggestion generation
interface ATSSectionContext {
  section: 'summary' | 'skills' | 'experience' | 'education';

  // Component scores relevant to this section
  relevantScores: {
    component: string;
    score: number;
    isWeakest: boolean;
  }[];

  // Categorized gaps for this section
  terminologyFixes: ProcessedGap[];   // High confidence, make these changes
  potentialAdditions: ProcessedGap[]; // Medium confidence, only if evidence
  cannotFix: ProcessedGap[];          // Acknowledge but don't fabricate
  opportunities: ProcessedGap[];      // Preferred keywords, lower priority

  // Additional section-specific guidance
  quantificationNeeded: boolean;
  actionVerbsWeak: boolean;
  sectionMissing: boolean;
}
```

### Example Prompt Context

For Skills section with processed gaps:

```markdown
## ATS Analysis Context for Skills Section

Current ATS Score: 55/100

**⚠️ PRIORITY ORDER - READ CAREFULLY:**
- REQUIRED keywords below are worth +36 pts total
- PREFERRED keywords are only worth +8 pts total
- Missing REQUIRED keywords CAP your maximum score - address these FIRST
- You MUST suggest REQUIRED keywords before suggesting any PREFERRED keywords

### 🔴 REQUIRED KEYWORDS - TERMINOLOGY FIXES (Must Address)
These are REQUIRED by the job and you have equivalent experience. Change wording to match exactly:
- "RESTful APIs" (related to "REST APIs" in resume) [+5 pts] [REQUIRED - MUST ADD]
   → Change "REST APIs" to "RESTful APIs" for exact JD match

### 🔴 REQUIRED KEYWORDS - CRITICAL PRIORITY (Address First)
These are REQUIRED by the job. Resume shows related experience - suggest adding if candidate has this skill:
- "Django" (related to "Python" in resume) [+12 pts] [REQUIRED - HIGH IMPACT]
   → Only add "Django" if candidate genuinely has this experience
- "CI/CD" (related to "Git" in resume) [+12 pts] [REQUIRED - HIGH IMPACT]
   → Only add "CI/CD" if candidate genuinely has this experience
- "Communication" (related to "team" in resume) [+7 pts] [REQUIRED - HIGH IMPACT]
   → Add "Communication" alongside existing "team collaboration"

### 🟡 PREFERRED KEYWORDS - OPTIONAL (Lower Priority)
These are nice-to-have ONLY. Address REQUIRED keywords above BEFORE suggesting these:
- "TypeScript" [+4 pts] [preferred - optional]
- "Docker" [+4 pts] [preferred - optional]
- "Kubernetes" [+4 pts] [preferred - optional]

### ⛔ CANNOT FIX (Do Not Fabricate)
These gaps cannot be addressed by rewording - do not suggest adding:
- "Computer Science" - This is a qualification/certification that cannot be fabricated

### MANDATORY Instructions for Suggestions
1. **FIRST: Address ALL 🔴 REQUIRED keywords** - these have the highest impact and cap your score if missing
2. **SECOND: Address terminology fixes** - these are safe, just wording changes
3. **ONLY THEN: Consider 🟡 PREFERRED keywords** - only if you have addressed all required keywords
4. **Do NOT fabricate** skills, certifications, or experience not evident in resume
5. **Explain ATS impact** - in "Why this works", reference which gap each suggestion addresses
6. **Potential impact**: Up to +36 pts if all addressable gaps fixed

**VERIFICATION:** Before finalizing, confirm you have suggested ALL 🔴 REQUIRED keywords listed above.
```

### Balance Achieved

| Aspect | How It's Balanced |
|--------|-------------------|
| **Consistency** | Suggestions directly reference analysis findings |
| **Creativity** | LLM decides HOW to implement fixes, not rigidly scripted |
| **Honesty** | Categorization prevents fabricating skills |
| **Priority** | Critical/required gaps listed before preferred |
| **Efficiency** | Single generation pass with rich context |

Expected suggestion distribution (emerges naturally):
- ~60-70% address specific ATS gaps (guided by context)
- ~30-40% general quality improvements (LLM judgment)

---

## Implementation Files

| File | Purpose |
|------|---------|
| `lib/scoring/gapAddressability.ts` | Categorize gaps by addressability |
| `lib/ai/buildSectionATSContext.ts` | Build section-specific prompt context |
| `lib/ai/generateSummarySuggestion.ts` | Modified to accept ATS context |
| `lib/ai/generateSkillsSuggestion.ts` | Modified to accept ATS context |
| `lib/ai/generateExperienceSuggestion.ts` | Modified to accept ATS context |
| `lib/ai/generateEducationSuggestion.ts` | Modified to accept ATS context |
| `app/api/suggestions/summary/route.ts` | Pass ATS context to summary generator |
| `app/api/suggestions/skills/route.ts` | Pass ATS context to skills generator |
| `app/api/suggestions/experience/route.ts` | Pass ATS context to experience generator |
| `lib/supabase/sessions.ts` | Added `getSessionForAPI` for fetching session data |

---

## Changelog

### February 2026 - Priority Enforcement Update

**Problem Identified:** LLMs were choosing PREFERRED keywords (+2-4 pts) over REQUIRED keywords (+12 pts) because the prompt section naming didn't clearly communicate priority.

**Changes Made:**
1. **Prompt section renaming:**
   - "POTENTIAL ADDITIONS (Medium Confidence)" → "🔴 REQUIRED KEYWORDS - CRITICAL PRIORITY"
   - "OPPORTUNITIES (Lower Priority)" → "🟡 PREFERRED KEYWORDS - OPTIONAL"

2. **Added explicit priority explanation:**
   - Shows point differential between required and preferred
   - Explains that missing required keywords CAP the score

3. **Added mandatory verification instruction:**
   - "VERIFICATION: Before finalizing, confirm you have suggested ALL 🔴 REQUIRED keywords"

4. **Strengthened generator instructions:**
   - Added `⚠️ MANDATORY - ATS Context Priority` section to all generators
   - Explicit instruction that REQUIRED must be addressed before PREFERRED

---

## Future Considerations

### Potential Enhancements

1. **Feedback loop to analysis:** If addressability processor finds the resume HAS a keyword that analysis said was missing, flag potential analysis bug.

2. **User confirmation for potential additions:** For "potential" gaps, could ask user: "Do you have Django experience?" before suggesting to add it.

3. **Learning from outcomes:** Track which suggestions users accept/reject to improve addressability categorization.

### Known Limitations

1. **Evidence detection is heuristic:** Checking if "Python web development" implies "Django knowledge" is imperfect.

2. **Section mapping isn't perfect:** Some keywords could go in multiple sections (skills vs experience).

3. **Impact estimates are approximations:** "+12 pts" is based on scoring algorithm but actual impact depends on other factors.

---

## References

- ATS Scoring Specification: `docs/reference/ats-scoring-system-specification-v2.1.md`
- Keyword Analysis Types: `lib/scoring/types.ts`
- Suggestion Generation: `lib/ai/generate*Suggestion.ts`
