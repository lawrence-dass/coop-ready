# Story 5-3: Action Verb & Quantification Suggestions

**Status:** ready-for-dev
**Epic:** 5 - Suggestions & Optimization Workflow
**Branch:** feat/5-3-action-verb-quantification-suggestions
**Dependency:** Story 5-1 (Bullet Point Rewrite Generation) - for suggestions table

---

## User Story

As a **user**,
I want **suggestions to improve my action verbs and add quantification**,
So that **my resume has more impact**.

---

## Acceptance Criteria

### AC1: Weak Action Verb Detection
**Given** I have a bullet starting with a weak verb (e.g., "Responsible for", "Helped with")
**When** the AI generates suggestions
**Then** I receive an action verb improvement suggestion
**And** example: "Responsible for development" → "Developed", "Led", "Architected"

**Weak Verb List to Flag:**
- "Responsible for"
- "Helped with"
- "Assisted with"
- "Worked on"
- "Was involved in"
- "Participated in"
- "Contributed to" (weak context)
- "Did"
- "Made"
- "Got"

### AC2: Strong Verb Alternatives by Category
**Then** suggestions provide context-appropriate strong verbs:

**Leadership Verbs:**
- Led, Directed, Managed, Orchestrated, Supervised, Guided, Mentored, Championed, Spearheaded

**Technical Verbs:**
- Engineered, Built, Designed, Architected, Developed, Implemented, Deployed, Optimized, Scaled

**Analysis Verbs:**
- Analyzed, Identified, Diagnosed, Evaluated, Assessed, Investigated, Investigated, Discovered

**Communication Verbs:**
- Presented, Communicated, Articulated, Conveyed, Explained, Documented, Authored, Wrote

### AC3: Quantification Detection
**Given** I have achievements without numbers
**When** the AI generates suggestions
**Then** I receive quantification prompts
**And** example: "Improved performance" → "Improved performance by X%" with prompt to add the number

### AC4: Contextual Quantification Prompts
**Given** quantification opportunities are identified
**When** I view the suggestion
**Then** I see the original text highlighted
**And** I see contextual prompts like:
- For performance: "Consider adding: percentage improvement, time saved, users impacted"
- For scaling: "Consider adding: number of users, data volume, deployment scale"
- For savings: "Consider adding: cost savings percentage, time saved per unit"
- For growth: "Consider adding: growth percentage, user acquisition rate"

### AC5: Strong Bullet Handling
**Given** I have a bullet that already uses strong verbs and numbers
**When** the AI analyzes it
**Then** no action verb or quantification suggestion is generated for that bullet
**Example:** "Led migration of 2M user database to new architecture, reducing query latency by 40%"
→ No suggestions (already strong)

### AC6: Suggestion Type Classification
**Given** suggestions are generated
**When** they are saved
**Then** action verb suggestions have `suggestion_type: 'action_verb'`
**And** quantification suggestions have `suggestion_type: 'quantification'`

---

## Technical Implementation

### Database Schema (Reusing Story 5-1)

```sql
-- suggestions table created in Story 5-1
-- For Story 5-3, we use:
-- - suggestion_type: 'action_verb' or 'quantification'
-- - section: 'experience' (typically, though could be projects)
-- - original_text: the original bullet point
-- - suggested_text: improved version OR quantification prompt
-- - reasoning: explanation of why this improves the bullet
```

### New Files to Create

1. **`lib/validations/verbs.ts`**
   - List of weak verbs to flag
   - Strong verb categories and alternatives
   - Helper functions for verb analysis

2. **`lib/openai/prompts/action-verbs.ts`**
   - Action verb and quantification detection prompt
   - Context-aware suggestions by achievement type
   - Quantification prompt generation

3. **`actions/suggestions.ts` (extend existing)**
   - New function: `generateActionVerbSuggestions` - analyzes and suggests verb improvements
   - New function: `generateQuantificationSuggestions` - identifies missing metrics
   - Both return structured suggestions for database persistence

### Implementation Strategy

#### Step 1: Create Verb Registry (`lib/validations/verbs.ts`)

```typescript
export const WEAK_VERBS = [
  "responsible for",
  "helped with",
  "assisted with",
  "worked on",
  "was involved in",
  "participated in",
  "contributed to",
  "did",
  "made",
  "got",
  "handled",
  "took care of",
  "dealt with",
  "managed to",
  "able to",
];

export const STRONG_VERBS_BY_CATEGORY = {
  leadership: [
    "Led",
    "Directed",
    "Managed",
    "Orchestrated",
    "Supervised",
    "Guided",
    "Mentored",
    "Championed",
    "Spearheaded",
    "Presided",
    "Commanded",
  ],
  technical: [
    "Engineered",
    "Built",
    "Designed",
    "Architected",
    "Developed",
    "Implemented",
    "Deployed",
    "Optimized",
    "Scaled",
    "Refactored",
    "Modernized",
    "Automated",
  ],
  analysis: [
    "Analyzed",
    "Identified",
    "Diagnosed",
    "Evaluated",
    "Assessed",
    "Investigated",
    "Discovered",
    "Determined",
    "Measured",
    "Compared",
    "Reviewed",
  ],
  communication: [
    "Presented",
    "Communicated",
    "Articulated",
    "Conveyed",
    "Explained",
    "Documented",
    "Authored",
    "Wrote",
    "Advised",
    "Briefed",
    "Reported",
  ],
  improvement: [
    "Improved",
    "Enhanced",
    "Increased",
    "Accelerated",
    "Optimized",
    "Streamlined",
    "Simplified",
    "Refined",
    "Elevated",
    "Boosted",
  ],
};

export function hasWeakVerb(text: string): boolean {
  const lowerText = text.toLowerCase();
  return WEAK_VERBS.some(verb => lowerText.includes(verb));
}

export function extractVerbContext(text: string): {
  verb: string | null;
  category: string | null;
} {
  const words = text.split(/\s+/);
  const firstWord = words[0]?.toLowerCase() || "";

  for (const [category, verbs] of Object.entries(STRONG_VERBS_BY_CATEGORY)) {
    if (verbs.some(v => v.toLowerCase() === firstWord)) {
      return { verb: firstWord, category };
    }
  }

  if (hasWeakVerb(text)) {
    return { verb: null, category: null }; // weak verb detected
  }

  return { verb: firstWord, category: null };
}
```

#### Step 2: Create OpenAI Prompt (`lib/openai/prompts/action-verbs.ts`)

```typescript
import { STRONG_VERBS_BY_CATEGORY } from "@/lib/validations/verbs";

export const ACTION_VERB_AND_QUANTIFICATION_PROMPT = (
  bulletPoints: string[],
  achievementTypes: string[] // e.g., ["performance_improvement", "team_leadership", "project_delivery"]
) => {
  const verbCategories = Object.entries(STRONG_VERBS_BY_CATEGORY)
    .map(([category, verbs]) => `${category}: ${verbs.join(", ")}`)
    .join("\n");

  return `You are an expert resume writer specializing in action verbs and achievement quantification.

Your task is to analyze the following bullet points and provide TWO types of suggestions:
1. ACTION VERB improvements - replace weak verbs with strong alternatives
2. QUANTIFICATION suggestions - identify missing metrics and provide prompts

Strong Verb Categories:
${verbCategories}

Weak Verbs to Replace: "Responsible for", "Helped with", "Assisted with", "Worked on", "Was involved in", "Participated in", "Contributed to", "Did", "Made", "Got"

Bullet Points to Analyze:
${bulletPoints.map((bp, i) => `${i + 1}. ${bp}\n   Achievement Type: ${achievementTypes[i] || "general"}`).join("\n\n")}

For each bullet point, respond with:

1. ACTION VERB SUGGESTION (if applicable):
   - Only suggest if the bullet starts with a weak verb
   - If it starts with a strong verb, skip
   - Provide 2-3 alternatives from the strong verb categories

2. QUANTIFICATION SUGGESTION (if applicable):
   - Only suggest if the bullet lacks specific numbers or metrics
   - Provide contextual prompts based on achievement type:
     * performance: "Consider adding: percentage improvement, time saved, users impacted"
     * scaling: "Consider adding: number of users, data volume, deployment scale"
     * savings: "Consider adding: cost savings percentage, time saved per unit"
     * team: "Consider adding: team size, scope, impact"
     * delivery: "Consider adding: timeline, scope, complexity metrics"
   - Explain why the metric matters

Respond as valid JSON:
{
  "suggestions": [
    {
      "original": "the original bullet point",
      "action_verb_suggestion": null or {
        "improved": "improved version with strong verb",
        "alternatives": ["verb1", "verb2"],
        "reasoning": "why this verb is stronger"
      },
      "quantification_suggestion": null or {
        "prompt": "specific prompt for user",
        "example": "example of how to add metrics",
        "metrics_to_consider": ["metric1", "metric2"]
      }
    }
  ]
}`;
};
```

#### Step 3: Create Server Actions (`actions/suggestions.ts` - extend)

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { ACTION_VERB_AND_QUANTIFICATION_PROMPT } from "@/lib/openai/prompts/action-verbs";
import z from "zod";

const generateActionVerbAndQuantificationSchema = z.object({
  scanId: z.string().uuid(),
  bulletPoints: z.array(z.string()).min(1),
  achievementTypes: z.array(z.string()).optional(), // defaults to 'general'
});

type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } };

export async function generateActionVerbAndQuantificationSuggestions(
  input: z.infer<typeof generateActionVerbAndQuantificationSchema>
): Promise<
  ActionResponse<{
    scanId: string;
    suggestions: Array<{
      original: string;
      actionVerbSuggestion: {
        improved: string;
        alternatives: string[];
        reasoning: string;
      } | null;
      quantificationSuggestion: {
        prompt: string;
        example: string;
        metricsToConsider: string[];
      } | null;
    }>;
  }>
> {
  const parsed = generateActionVerbAndQuantificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: "Invalid input", code: "VALIDATION_ERROR" },
    };
  }

  try {
    const { scanId, bulletPoints, achievementTypes = [] } = parsed.data;

    // Pad achievement types with 'general' if not enough provided
    const types = [
      ...achievementTypes,
      ...Array(bulletPoints.length - achievementTypes.length).fill("general"),
    ];

    const prompt = ACTION_VERB_AND_QUANTIFICATION_PROMPT(bulletPoints, types);

    const response = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.7,
    });

    let suggestions;
    try {
      const parsed = JSON.parse(response.text);
      suggestions = parsed.suggestions;
    } catch {
      console.error(
        "[generateActionVerbAndQuantificationSuggestions] Failed to parse OpenAI response",
        response.text
      );
      return {
        data: null,
        error: { message: "Failed to parse AI response", code: "PARSE_ERROR" },
      };
    }

    return {
      data: { scanId, suggestions },
      error: null,
    };
  } catch (e) {
    console.error("[generateActionVerbAndQuantificationSuggestions]", e);
    return {
      data: null,
      error: {
        message: "Failed to generate suggestions",
        code: "GENERATION_ERROR",
      },
    };
  }
}

// Helper to convert API response to saveSuggestions format
export function transformActionVerbSuggestions(
  scanId: string,
  suggestions: Array<{
    original: string;
    actionVerbSuggestion: {
      improved: string;
      alternatives: string[];
      reasoning: string;
    } | null;
    quantificationSuggestion: {
      prompt: string;
      example: string;
      metricsToConsider: string[];
    } | null;
  }>
): Array<{
  section: string;
  itemIndex: number;
  originalText: string;
  suggestedText: string;
  suggestionType: string;
  reasoning?: string;
}> {
  const transformed: Array<{
    section: string;
    itemIndex: number;
    originalText: string;
    suggestedText: string;
    suggestionType: string;
    reasoning?: string;
  }> = [];

  suggestions.forEach((sugg, index) => {
    // Add action verb suggestion
    if (sugg.actionVerbSuggestion) {
      transformed.push({
        section: "experience",
        itemIndex: index,
        originalText: sugg.original,
        suggestedText: sugg.actionVerbSuggestion.improved,
        suggestionType: "action_verb",
        reasoning: `${sugg.actionVerbSuggestion.reasoning}\nAlternatives: ${sugg.actionVerbSuggestion.alternatives.join(", ")}`,
      });
    }

    // Add quantification suggestion
    if (sugg.quantificationSuggestion) {
      transformed.push({
        section: "experience",
        itemIndex: index,
        originalText: sugg.original,
        suggestedText: sugg.quantificationSuggestion.prompt,
        suggestionType: "quantification",
        reasoning: `${sugg.quantificationSuggestion.prompt}\n\nExample: ${sugg.quantificationSuggestion.example}\n\nMetrics to consider: ${sugg.quantificationSuggestion.metricsToConsider.join(", ")}`,
      });
    }
  });

  return transformed;
}
```

#### Step 4: Integration with `runAnalysis`

```typescript
// In the runAnalysis workflow:
async function runAnalysis(scanId: string, userId: string) {
  try {
    // ... existing analysis code ...

    // After ATS analysis, bullet rewrites, and skill mappings
    // Generate action verb and quantification suggestions
    const bulletPoints = extractBulletPoints(parsedResume);
    const achievementTypes = classifyAchievements(bulletPoints); // helper function

    const actionVerbResult = await generateActionVerbAndQuantificationSuggestions({
      scanId,
      bulletPoints,
      achievementTypes,
    });

    if (actionVerbResult.error) {
      console.error("[runAnalysis] Failed to generate action verb suggestions", actionVerbResult.error);
    } else {
      const suggestions = transformActionVerbSuggestions(
        scanId,
        actionVerbResult.data.suggestions
      );
      await saveSuggestions(scanId, suggestions);
    }

    // ... continue with analysis ...
  } catch (e) {
    console.error("[runAnalysis]", e);
  }
}

// Helper to classify achievement type from bullet text
function classifyAchievements(bulletPoints: string[]): string[] {
  return bulletPoints.map(bullet => {
    const lower = bullet.toLowerCase();
    if (lower.includes("led") || lower.includes("managed") || lower.includes("directed")) {
      return "team";
    }
    if (lower.includes("improved") || lower.includes("optimized") || lower.includes("enhanced")) {
      return "performance";
    }
    if (lower.includes("scaled") || lower.includes("deployed") || lower.includes("built")) {
      return "scaling";
    }
    if (lower.includes("saved") || lower.includes("reduced")) {
      return "savings";
    }
    if (lower.includes("delivered") || lower.includes("completed") || lower.includes("finished")) {
      return "delivery";
    }
    return "general";
  });
}
```

---

## Examples by Achievement Type

### Performance Improvement
- **Original:** "Improved system performance"
- **Action Verb:** "Optimized system performance" (replaced weak "improved" with strong "optimized")
- **Quantification:** Suggest: "Improved system performance by X% / reduced latency by X ms"

### Team Leadership
- **Original:** "Responsible for team of developers"
- **Action Verb:** "Led team of 8 developers" (replaced "responsible for" with "led")
- **Quantification:** Already includes team size, no quantification needed

### Project Delivery
- **Original:** "Participated in mobile app development"
- **Action Verb:** "Architected mobile app" or "Developed mobile app" (replaced "participated")
- **Quantification:** Suggest: "Add timeline: delivered in X weeks / shipped to X users"

### Cost Savings
- **Original:** "Helped reduce infrastructure costs"
- **Action Verb:** "Reduced infrastructure costs" (removed "helped")
- **Quantification:** Suggest: "Reduced infrastructure costs by $X / by X%"

---

## Acceptance Testing

### Test 1: Weak Verb Detection
- Input: "Responsible for team management"
- Verify: "Responsible for" flagged as weak verb
- Verify: Suggestions include strong alternatives: "Led", "Managed", "Directed"

### Test 2: Strong Verb Recognition
- Input: "Engineered scalable API serving 10M requests/day"
- Verify: No action verb suggestion (already strong)
- Verify: No quantification suggestion (already has metrics)

### Test 3: Quantification Opportunity
- Input: "Improved database query performance"
- Verify: Action verb "improved" → "optimized" suggestion
- Verify: Quantification suggestion: "Add percentage or latency improvement"

### Test 4: Achievement Type Classification
- Input: Mixed bullet types (team, performance, delivery, savings)
- Verify: Each suggestion has appropriate prompts for its type
- Verify: Quantification suggestions are contextual

### Test 5: Combined Suggestions
- Input: "Helped optimize team workflow"
- Verify: Action verb suggestion: "Led optimization" or "Optimized workflow"
- Verify: Quantification suggestion for team size or efficiency metrics

### Test 6: Database Persistence
- Generate suggestions for a scan
- Verify: Suggestions saved with `suggestion_type: 'action_verb'` or `'quantification'`
- Verify: Reasoning includes alternatives and prompts
- Verify: Can retrieve via suggestions API

### Test 7: RLS Security
- Create suggestions for User 1's scan
- Verify: User 1 can access
- Verify: User 2 cannot access

---

## Implementation Considerations

1. **Verb Context:** Some verbs are contextually weak (e.g., "Contributed" might be weak vs. "Contributed a novel algorithm" which is strong)
2. **Achievement Classification:** May need to refine classification to better categorize achievements
3. **Quantification Judgment:** Not all bullets need numbers - some achievements are inherently qualitative
4. **Multiple Suggestions:** A single bullet might have both action verb AND quantification suggestions
5. **Ordering:** Action verb suggestion should come before quantification (verb first, then metrics)

---

## Definition of Done

- [ ] `lib/validations/verbs.ts` with weak verb list and strong verb categories
- [ ] `lib/openai/prompts/action-verbs.ts` implements action verb and quantification prompt
- [ ] `generateActionVerbAndQuantificationSuggestions` server action created
- [ ] `transformActionVerbSuggestions` helper function converts API response to database format
- [ ] Weak verb detection works correctly
- [ ] Strong verb alternatives provided by category
- [ ] Quantification prompts contextual to achievement type
- [ ] Suggestions saved with correct `suggestion_type` field
- [ ] All acceptance tests pass
- [ ] No TypeScript errors
- [ ] Code follows project-context.md conventions
- [ ] Story marked as `done` in sprint-status.yaml

---

## Related Stories

- **Story 5-1:** Bullet Point Rewrite Generation (first-pass improvement)
- **Story 5-2:** Transferable Skills Detection (skill mapping)
- **Story 5-3:** This story (specific verb and metric improvements)
- **Story 5-4:** Skills Expansion Suggestions (expands skill list)
- **Story 5-6:** Suggestions Display by Section (displays all suggestions)

---

## Notes

- This story provides targeted suggestions to complement 5-1's general bullet rewrites
- Focuses on two specific improvements: action verbs and quantification
- Reuses existing suggestions table schema
- Can batch multiple bullets in single API call for efficiency
- Integration with runAnalysis deferred to allow independent testing
