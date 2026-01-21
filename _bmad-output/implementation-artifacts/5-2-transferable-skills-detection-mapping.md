# Story 5-2: Transferable Skills Detection & Mapping

**Status:** ready-for-dev
**Epic:** 5 - Suggestions & Optimization Workflow
**Branch:** feat/5-2-transferable-skills-detection-mapping
**Dependency:** Story 5-1 (Bullet Point Rewrite Generation) - for suggestions table

---

## User Story

As a **career changer**,
I want **my non-tech experience mapped to tech terminology**,
So that **hiring managers see the relevance of my background**.

---

## Acceptance Criteria

### AC1: Non-Tech Experience Mapping
**Given** I have non-tech work experience (e.g., retail manager)
**When** the AI analyzes my resume
**Then** it detects transferable skills in my experience
**And** maps them to tech-equivalent terminology

**Example mappings:**
- Retail Manager → Technical Project Management, Cross-functional Collaboration
- Restaurant Manager → Operations Management, Team Leadership
- Teacher → Technical Communication, Knowledge Transfer

### AC2: Context-Specific Quantification
**Given** I managed inventory of 10,000+ SKUs
**When** the mapping is generated
**Then** I see a suggestion mapping this to "Database management, inventory optimization systems"

**Given** I led a team of 12 associates
**When** the mapping is generated
**Then** I see a suggestion mapping this to "Cross-functional team leadership, performance coaching"

### AC3: Skill Mapping Display with Reasoning
**Given** transferable skills are detected
**When** I view the suggestions
**Then** each mapping shows: Original skill/context → Tech equivalent
**And** includes reasoning for why this mapping is relevant

**Example:**
- Original: "Managed supply chain for retail store"
- Mapped: "Supply chain optimization, systems coordination"
- Reasoning: "Technical hiring managers value operational efficiency mindset essential for deployment pipelines and release coordination"

### AC4: Student-Specific Mapping
**Given** I am a Student (not Career Changer)
**When** analysis runs
**Then** transferable skills mapping still runs but focuses on academic-to-professional translation
**And** TA experience maps to "Technical mentorship", group projects map to "Cross-functional collaboration"

**Example mappings:**
- TA for CS course → "Technical mentorship, knowledge transfer, debugging support"
- Group project lead → "Cross-functional collaboration, requirements gathering"
- Research assistant → "Data analysis, scientific rigor, documentation"

### AC5: Suggestions Persistence
**Given** mappings are generated
**When** they are saved
**Then** suggestions are stored in `suggestions` table with:
- `suggestion_type: 'skill_mapping'`
- `section: 'experience'` or `'education'` or `'projects'`
- Both original context and mapped terminology
- Clear reasoning for the mapping

---

## Technical Implementation

### Reusing Existing Schema

The `suggestions` table created in Story 5-1 is reused:

```sql
-- Suggestions table structure (created in Story 5-1)
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  section VARCHAR(50) NOT NULL, -- 'experience', 'education', 'projects', 'skills', 'format'
  item_index INTEGER,
  suggestion_type VARCHAR(50) NOT NULL, -- 'bullet_rewrite', 'skill_mapping', 'action_verb', etc.
  original_text TEXT NOT NULL,
  suggested_text TEXT NOT NULL,
  reasoning TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

For Story 5-2, we'll use:
- `suggestion_type: 'skill_mapping'`
- `section: 'experience'` (for career changer mappings)
- `section: 'education'` or `'projects'` (for student mappings)
- `original_text`: The original experience/context
- `suggested_text`: The tech-equivalent skills
- `reasoning`: Why this mapping is relevant

### New Files to Create

1. **`lib/openai/prompts/skills.ts`**
   - Transferable skills detection and mapping prompt
   - Context-aware (career changer vs student)
   - Industry-specific mapping knowledge
   - Target role consideration

2. **`actions/suggestions.ts` (extend existing)**
   - New function: `generateSkillMappings` - detects and maps transferable skills
   - Handles both career changer and student contexts

### Implementation Strategy

#### Step 1: Create OpenAI Prompt (`lib/openai/prompts/skills.ts`)

```typescript
export const TRANSFERABLE_SKILLS_PROMPT = (
  experiences: Array<{ text: string; context: string }>,
  userProfile: {
    experience_level: string;
    is_student: boolean;
    background: string; // e.g., "retail", "education", "finance"
    target_role: string;
  },
  jdKeywords: string[]
) => {
  const contextGuidance = userProfile.is_student
    ? `
For students:
- Map academic experiences, TA roles, and group projects to professional terminology
- Focus on skills that translate across domains: communication, collaboration, problem-solving
- Emphasize technical foundation if CS-related, or transferable thinking if non-CS
- TA experience = technical mentorship, knowledge transfer capability
- Group projects = cross-functional collaboration, requirements gathering
- Research = data analysis, scientific rigor, documentation practices
    `.trim()
    : `
For career changers:
- Identify non-tech backgrounds (retail, management, education, etc.)
- Map operational/business skills to tech equivalents
- Emphasize transferable problem-solving and systems thinking
- Business management → technical project management
- Team leadership → cross-functional team leadership
- Operations → systems coordination, optimization thinking
- Customer service → user empathy, requirement clarification
    `.trim();

  return `You are an expert career coach specializing in helping career changers and new professionals map their experience to technology industry terminology.

${contextGuidance}

User Profile:
- Experience Level: ${userProfile.experience_level}
- Background: ${userProfile.background}
- Target Role: ${userProfile.target_role}
- Job Description Keywords: ${jdKeywords.join(", ")}

Your task is to identify transferable skills in the following experiences and map them to tech-industry terminology that hiring managers understand.

Experiences to analyze:
${experiences.map((exp, i) => `${i + 1}. ${exp.text}\n   Context: ${exp.context}`).join("\n\n")}

For each experience:
1. Identify the core skills and achievements
2. Map these to tech-industry terminology
3. Explain why this mapping is relevant for a ${userProfile.target_role} role
4. Include specific keywords that match the job description if applicable

Respond as valid JSON:
{
  "mappings": [
    {
      "original": "the original experience text",
      "mapped_skills": ["skill 1", "skill 2", "skill 3"],
      "tech_equivalent": "how to frame this for tech industry",
      "reasoning": "why this mapping is relevant for a [target_role]",
      "jd_keywords_matched": ["keyword1", "keyword2"]
    }
  ]
}`;
};
```

#### Step 2: Create Server Action (`actions/suggestions.ts` - extend)

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { TRANSFERABLE_SKILLS_PROMPT } from "@/lib/openai/prompts/skills";
import z from "zod";

const generateSkillMappingsSchema = z.object({
  scanId: z.string().uuid(),
  experiences: z.array(
    z.object({
      text: z.string(),
      context: z.string(),
      section: z.enum(["experience", "education", "projects"]),
    })
  ).min(1),
  experienceLevel: z.enum(["entry", "mid", "senior"]),
  isStudent: z.boolean(),
  background: z.string(),
  targetRole: z.string(),
  jdKeywords: z.array(z.string()),
});

type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } };

export async function generateSkillMappings(
  input: z.infer<typeof generateSkillMappingsSchema>
): Promise<
  ActionResponse<{
    scanId: string;
    mappings: Array<{
      original: string;
      mapped_skills: string[];
      tech_equivalent: string;
      reasoning: string;
      jd_keywords_matched: string[];
    }>;
  }>
> {
  const parsed = generateSkillMappingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: "Invalid input", code: "VALIDATION_ERROR" },
    };
  }

  try {
    const {
      scanId,
      experiences,
      experienceLevel,
      isStudent,
      background,
      targetRole,
      jdKeywords,
    } = parsed.data;

    const prompt = TRANSFERABLE_SKILLS_PROMPT(
      experiences.map(exp => ({ text: exp.text, context: exp.context })),
      {
        experience_level: experienceLevel,
        is_student: isStudent,
        background,
        target_role: targetRole,
      },
      jdKeywords
    );

    const response = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.7,
    });

    let mappings;
    try {
      const parsed = JSON.parse(response.text);
      mappings = parsed.mappings;
    } catch {
      console.error("[generateSkillMappings] Failed to parse OpenAI response", response.text);
      return {
        data: null,
        error: { message: "Failed to parse AI response", code: "PARSE_ERROR" },
      };
    }

    return {
      data: { scanId, mappings },
      error: null,
    };
  } catch (e) {
    console.error("[generateSkillMappings]", e);
    return {
      data: null,
      error: { message: "Failed to generate skill mappings", code: "GENERATION_ERROR" },
    };
  }
}

// Extend the saveSuggestions function to handle skill_mapping type
// (reusing existing saveSuggestions from Story 5-1)
```

#### Step 3: Integration with `runAnalysis`

The `runAnalysis` function should be extended to call `generateSkillMappings`:

```typescript
// In the runAnalysis workflow, after bullet rewrites:
async function runAnalysis(scanId: string, userId: string) {
  try {
    // ... existing analysis code ...

    // After ATS analysis and bullet rewrites, generate skill mappings
    const experiences = extractExperiences(parsedResume); // existing function
    const jdKeywords = extractKeywords(jobDescription); // existing function

    const mappingResult = await generateSkillMappings({
      scanId,
      experiences: experiences.map(exp => ({
        text: exp.text,
        context: exp.description,
        section: exp.section, // 'experience', 'education', 'projects'
      })),
      experienceLevel: userProfile.experience_level,
      isStudent: userProfile.background === "student",
      background: userProfile.background,
      targetRole: userProfile.target_role,
      jdKeywords,
    });

    if (mappingResult.error) {
      console.error("[runAnalysis] Failed to generate skill mappings", mappingResult.error);
      // Don't fail the whole analysis - mappings are optional
    } else {
      // Transform and save skill mapping suggestions
      const suggestions = mappingResult.data.mappings.map((mapping, index) => ({
        section: experiences[index]?.section || 'experience',
        itemIndex: index,
        originalText: mapping.original,
        suggestedText: mapping.tech_equivalent,
        suggestionType: 'skill_mapping',
        reasoning: `${mapping.reasoning}\n\nMapped skills: ${mapping.mapped_skills.join(", ")}`,
      }));

      await saveSuggestions(scanId, suggestions);
    }

    // ... continue with other analysis ...
  } catch (e) {
    console.error("[runAnalysis]", e);
    await updateScanStatus(scanId, "failed");
  }
}
```

---

## Context Examples by Background

### Career Changer Example: Retail Manager
- **Original:** "Managed daily operations for retail store with 50+ employees and $2M revenue"
- **Mapped Skills:** Operations Management, Team Leadership, P&L Responsibility
- **Tech Equivalent:** "Technical program management, cross-functional team coordination, resource optimization"
- **Reasoning:** "Operations management translates to technical project management - managing deployments, releases, and cross-team coordination similar to retail operations management"

### Career Changer Example: Finance Professional
- **Original:** "Analyzed financial data and generated quarterly reports"
- **Mapped Skills:** Data Analysis, Reporting, Financial Systems
- **Tech Equivalent:** "Data analysis, reporting automation, database query optimization"
- **Reasoning:** "Financial analysis skills demonstrate database work, query optimization, and reporting automation valuable for backend and data engineering roles"

### Student Example: TA
- **Original:** "Teaching Assistant for Data Structures course, helped 200+ students debug code"
- **Mapped Skills:** Technical Mentorship, Knowledge Transfer, Debugging Support
- **Tech Equivalent:** "Technical mentorship, code review experience, debugging and problem-solving"
- **Reasoning:** "TA experience demonstrates ability to help others solve technical problems, similar to code review and pair programming in professional settings"

### Student Example: Group Project
- **Original:** "Led group project building e-commerce website with 4 team members"
- **Mapped Skills:** Project Leadership, Cross-functional Collaboration, Requirements Gathering
- **Tech Equivalent:** "Cross-functional team collaboration, requirements gathering, technical leadership"
- **Reasoning:** "Group project leadership demonstrates ability to work with teams and gather technical requirements, essential for senior engineering roles"

---

## Acceptance Testing

### Test 1: Career Changer (Retail Manager)
- Input: Resume with retail management experience
- Verify: AI detects operations, team leadership, inventory management
- Verify: Maps to "operations management, technical program management, resource optimization"
- Verify: Suggestions saved with `suggestion_type: 'skill_mapping'`

### Test 2: Career Changer (Finance)
- Input: Resume with financial analysis experience
- Verify: AI detects data analysis, reporting
- Verify: Maps to "data analysis, reporting automation, database optimization"
- Verify: Reasoning explains connection to tech role

### Test 3: Student (TA Experience)
- Input: Resume with TA for CS course
- Verify: AI maps to "technical mentorship, code review, debugging"
- Verify: Reasoning emphasizes problem-solving and knowledge transfer

### Test 4: Student (Group Project)
- Input: Resume with group software project
- Verify: AI maps to "cross-functional collaboration, requirements gathering"
- Verify: Recognizes leadership experience

### Test 5: Job Description Keyword Matching
- Input: Resume + job description mentioning "Agile", "distributed systems", "database optimization"
- Verify: Skill mappings prioritize keywords from job description
- Verify: `jd_keywords_matched` field includes relevant keywords

### Test 6: Database Persistence
- Generate skill mappings for a scan
- Verify: Suggestions saved in `suggestions` table
- Verify: `suggestion_type` is 'skill_mapping'
- Verify: `reasoning` includes mapped skills
- Verify: Can retrieve via API as suggestions

### Test 7: RLS Security
- Create mappings for User 1's scan
- Verify: User 1 can see mappings
- Verify: User 2 cannot see User 1's mappings

---

## Implementation Considerations

1. **Extraction Logic:** Need to extract experiences from parsed resume with context (what was accomplished)
2. **Batching:** Group multiple experiences in single API call to minimize OpenAI calls
3. **Background Detection:** System should infer user's background from resume history or user profile
4. **Target Role Clarity:** Ensure target_role is available from user profile (from Story 2.1)
5. **Deduplication:** Don't map the same experience twice if it appears in multiple sections

---

## Definition of Done

- [ ] `lib/openai/prompts/skills.ts` implements transferable skills detection prompt
- [ ] `generateSkillMappings` server action created with validation
- [ ] Handles career changer context appropriately
- [ ] Handles student context appropriately
- [ ] JD keyword matching works correctly
- [ ] Suggestions saved to database with correct fields
- [ ] `reasoning` field includes mapped skills and relevance explanation
- [ ] All acceptance tests pass
- [ ] No TypeScript errors
- [ ] Code follows project-context.md conventions
- [ ] Story marked as `done` in sprint-status.yaml

---

## Related Stories

- **Story 5-1:** Bullet Point Rewrite Generation (creates suggestions table)
- **Story 5-3:** Action Verb & Quantification Suggestions (complements skill mapping)
- **Story 5-6:** Suggestions Display by Section (displays these mappings to user)

---

## Notes

- This story reuses the `suggestions` table schema from Story 5-1
- No new database migrations needed
- Focus on context-aware prompting for different user backgrounds
- Skill mappings are optional enhancements (don't block analysis completion)
- Integration with `runAnalysis` can be deferred if needed
