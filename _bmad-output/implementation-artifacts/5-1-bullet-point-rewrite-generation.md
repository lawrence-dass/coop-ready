# Story 5-1: Bullet Point Rewrite Generation

**Status:** ready-for-dev
**Epic:** 5 - Suggestions & Optimization Workflow
**Branch:** feat/5-1-bullet-point-rewrite-generation

---

## User Story

As a **user**,
I want **AI-generated rewrites of my experience bullet points**,
So that **my achievements are presented more effectively**.

---

## Acceptance Criteria

### AC1: Rewrite Generation on Analysis Completion
**Given** analysis is running on my resume
**When** the suggestion generation completes
**Then** I receive before/after rewrites for each experience bullet point
**And** each rewrite improves clarity, impact, and keyword alignment

### AC2: Vague Bullet Enhancement
**Given** I have a vague bullet like "Worked on machine learning project"
**When** the AI generates a rewrite
**Then** the suggestion adds specificity, action verbs, and impact
**And** example: "Designed and deployed ML recommendation engine improving prediction accuracy by 23%"

### AC3: Strong Bullet Handling
**Given** I have a bullet that's already strong
**When** the AI analyzes it
**Then** it may suggest minor improvements or mark it as "No changes recommended"
**And** the original is preserved as an option

### AC4: Suggestions Persistence
**Given** rewrites are generated
**When** they are saved
**Then** a `suggestions` table stores each suggestion with:
- `scan_id`
- `section`
- `original_text`
- `suggested_text`
- `suggestion_type: 'bullet_rewrite'`
- `status` (pending/accepted/rejected)
- `reasoning` (optional explanation for the rewrite)

### AC5: Student-Specific Context
**Given** I am a Student
**When** rewrites are generated
**Then** academic projects are rewritten with professional impact language
**And** course work is framed as practical experience

---

## Technical Implementation

### Database Schema

**Table: suggestions** (if not already created in Epic 4)

```sql
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  section VARCHAR(50) NOT NULL, -- 'experience', 'education', 'projects', 'skills', 'format'
  item_index INTEGER, -- for ordering within section (e.g., job 0, job 1, bullet point 0)
  suggestion_type VARCHAR(50) NOT NULL, -- 'bullet_rewrite', 'skill_mapping', 'action_verb', 'quantification', 'skill_expansion', 'format', 'removal'
  original_text TEXT NOT NULL,
  suggested_text TEXT NOT NULL,
  reasoning TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_section CHECK (section IN ('experience', 'education', 'projects', 'skills', 'format')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected'))
);

-- RLS Policy: Users can see suggestions for their own scans
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own suggestions"
  ON suggestions FOR SELECT
  USING (
    scan_id IN (
      SELECT id FROM scans WHERE user_id = auth.uid()
    )
  );

-- Index for performance
CREATE INDEX idx_suggestions_scan_id ON suggestions(scan_id);
CREATE INDEX idx_suggestions_section ON suggestions(section);
CREATE INDEX idx_suggestions_type ON suggestions(suggestion_type);
```

### New Files to Create

1. **`lib/openai/prompts/suggestions.ts`**
   - Rewrite generation prompt
   - Context-aware prompt that considers user profile (Student vs Professional)
   - Handles vague vs already-strong bullets differently

2. **`lib/validations/suggestions.ts`**
   - Zod schema for suggestion input/output
   - Validate rewrite quality

3. **`actions/suggestions.ts`**
   - Server Action: `generateBulletRewrites` - generates rewrites for experience bullets
   - Server Action: `saveSuggestions` - persists suggestions to database

### Implementation Strategy

#### Step 1: Create OpenAI Prompt (`lib/openai/prompts/suggestions.ts`)

```typescript
export const BULLET_REWRITE_PROMPT = (
  bulletPoints: string[],
  userProfile: { experience_level: string; target_role: string; is_student: boolean },
  jdKeywords: string[]
) => {
  const contextGuidance = userProfile.is_student
    ? "For academic projects and coursework, translate academic achievements into professional language that technical hiring managers understand."
    : "Focus on business impact, metrics, and technical achievement for a professional audience.";

  return `You are an expert resume writer specializing in ATS optimization and impact maximization.

Given the following experience bullet points, generate improved rewrites that:
1. Add specific metrics, percentages, or quantifiable outcomes
2. Use strong action verbs appropriate for the context
3. Maintain accuracy and honesty
4. Align with these job description keywords: ${jdKeywords.join(", ")}
5. Match the user's experience level: ${userProfile.experience_level}

Context: ${contextGuidance}

For each bullet point:
- If it's vague or weak, provide a significant improvement
- If it's already strong, either suggest minor improvements or respond with "No changes recommended"
- Preserve the user's original achievements (don't fabricate metrics)

Bullet points to rewrite:
${bulletPoints.map((bp, i) => `${i + 1}. ${bp}`).join("\n")}

Respond as valid JSON:
{
  "rewrites": [
    {
      "original": "string",
      "suggested": "string or 'No changes recommended'",
      "reasoning": "why this rewrite improves the bullet"
    }
  ]
}`;
};
```

#### Step 2: Create Server Action (`actions/suggestions.ts`)

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { BULLET_REWRITE_PROMPT } from "@/lib/openai/prompts/suggestions";
import { supabase } from "@/lib/supabase/server";
import z from "zod";

const generateBulletRewritesSchema = z.object({
  scanId: z.string().uuid(),
  bulletPoints: z.array(z.string()).min(1),
  experienceLevel: z.enum(["entry", "mid", "senior"]),
  targetRole: z.string(),
  isStudent: z.boolean(),
  jdKeywords: z.array(z.string()),
});

type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } };

export async function generateBulletRewrites(
  input: z.infer<typeof generateBulletRewritesSchema>
): Promise<
  ActionResponse<{
    scanId: string;
    rewrites: Array<{
      original: string;
      suggested: string;
      reasoning: string;
    }>;
  }>
> {
  const parsed = generateBulletRewritesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: "Invalid input", code: "VALIDATION_ERROR" },
    };
  }

  try {
    const { scanId, bulletPoints, experienceLevel, targetRole, isStudent, jdKeywords } = parsed.data;

    const prompt = BULLET_REWRITE_PROMPT(bulletPoints, {
      experience_level: experienceLevel,
      target_role: targetRole,
      is_student: isStudent,
    }, jdKeywords);

    const response = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.7,
    });

    let rewrites;
    try {
      const parsed = JSON.parse(response.text);
      rewrites = parsed.rewrites;
    } catch {
      console.error("[generateBulletRewrites] Failed to parse OpenAI response", response.text);
      return {
        data: null,
        error: { message: "Failed to parse AI response", code: "PARSE_ERROR" },
      };
    }

    return {
      data: { scanId, rewrites },
      error: null,
    };
  } catch (e) {
    console.error("[generateBulletRewrites]", e);
    return {
      data: null,
      error: { message: "Failed to generate rewrites", code: "GENERATION_ERROR" },
    };
  }
}

export async function saveSuggestions(
  scanId: string,
  suggestions: Array<{
    section: string;
    itemIndex: number;
    originalText: string;
    suggestedText: string;
    suggestionType: string;
    reasoning?: string;
  }>
): Promise<ActionResponse<{ savedCount: number }>> {
  try {
    const client = await createClient();

    const data = suggestions.map((s) => ({
      scan_id: scanId,
      section: s.section,
      item_index: s.itemIndex,
      original_text: s.originalText,
      suggested_text: s.suggestedText,
      suggestion_type: s.suggestionType,
      reasoning: s.reasoning || null,
      status: "pending",
    }));

    const { error, count } = await client
      .from("suggestions")
      .insert(data)
      .select("count");

    if (error) throw error;

    return { data: { savedCount: count || 0 }, error: null };
  } catch (e) {
    console.error("[saveSuggestions]", e);
    return {
      data: null,
      error: { message: "Failed to save suggestions", code: "SAVE_ERROR" },
    };
  }
}
```

#### Step 3: Integration with `runAnalysis`

The `runAnalysis` function (from Story 4.1) should be extended to call `generateBulletRewrites`:

```typescript
// In app/api/analyze or wherever runAnalysis is located
async function runAnalysis(scanId: string, userId: string) {
  try {
    // ... existing analysis code ...

    // After ATS analysis is complete, generate suggestions
    const bulletPoints = extractBulletPoints(parsedResume); // existing function
    const jdKeywords = extractKeywords(jobDescription); // existing function

    const rewriteResult = await generateBulletRewrites({
      scanId,
      bulletPoints,
      experienceLevel: userProfile.experience_level,
      targetRole: userProfile.target_role,
      isStudent: userProfile.experience_level === "entry" && userProfile.background === "student",
      jdKeywords,
    });

    if (rewriteResult.error) {
      console.error("[runAnalysis] Failed to generate rewrites", rewriteResult.error);
      // Don't fail the whole analysis - suggestions are optional
    } else {
      await saveSuggestions(scanId, transformRewrites(rewriteResult.data.rewrites));
    }

    // Mark scan as complete
    await updateScanStatus(scanId, "completed");
  } catch (e) {
    console.error("[runAnalysis]", e);
    await updateScanStatus(scanId, "failed");
  }
}
```

---

## Acceptance Testing

### Test 1: Vague Bullet Rewriting
- Input: "Worked on a project with machine learning"
- Verify: AI generates a specific rewrite with metrics/impact
- Example output: "Designed ML recommendation system using TensorFlow, improving prediction accuracy by 18%"

### Test 2: Strong Bullet Handling
- Input: "Led cross-functional team of 8 engineers to deliver cloud infrastructure migration, reducing deployment time by 40%"
- Verify: AI either suggests minor improvements or returns "No changes recommended"

### Test 3: Student Context
- Input: "Completed Machine Learning course project: built image classifier"
- Verify: Rewrite emphasizes technical skills and professional framing
- Example: "Architected image classification system using convolutional neural networks, achieving 92% accuracy on dataset of 10,000+ images"

### Test 4: Database Persistence
- Generate rewrites for a scan
- Verify: Suggestions are saved in `suggestions` table with correct fields
- Verify: `status` is set to 'pending'
- Verify: `section` is 'experience' and `suggestion_type` is 'bullet_rewrite'

### Test 5: RLS Security
- Create suggestions for Scan A (User 1)
- Verify: User 1 can see suggestions
- Verify: User 2 cannot see suggestions

---

## Implementation Considerations

1. **Performance:** Batch bullet point rewrites (all experience bullets in one API call) to minimize OpenAI calls
2. **Streaming:** Consider streaming the response for better UX if generating many rewrites
3. **Error Handling:** If rewrite generation fails, the scan shouldn't fail - mark suggestions as unavailable
4. **Duplicate Prevention:** Check if suggestions already exist for a scan before generating
5. **Context Windows:** For very long resumes, may need to paginate bullet points across multiple API calls

---

## Definition of Done

- [ ] `suggestions` table created in Supabase with RLS policies
- [ ] `lib/openai/prompts/suggestions.ts` implements bullet rewrite prompt
- [ ] `actions/suggestions.ts` implements server actions
- [ ] `generateBulletRewrites` handles both strong and weak bullets appropriately
- [ ] Student profile context correctly influences rewrites
- [ ] `runAnalysis` integrated to call suggestion generation
- [ ] Suggestions saved to database with correct fields and status
- [ ] All acceptance tests pass
- [ ] No TypeScript errors
- [ ] Code follows project-context.md conventions
- [ ] Story marked as `done` in sprint-status.yaml
