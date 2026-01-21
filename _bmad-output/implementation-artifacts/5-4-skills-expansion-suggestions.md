# Story 5.4: Skills Expansion Suggestions

**Status:** ready-for-dev
**Epic:** 5 - Suggestions & Optimization Workflow
**Branch:** feat/5-4-skills-expansion-suggestions
**Dependency:** Story 5-1 (Bullet Point Rewrite Generation) - for suggestions table
**Related Stories:** Stories 5-2, 5-3 (previous suggestion types)

---

## User Story

As a **user**,
I want **suggestions to expand my listed skills**,
So that **ATS systems match more specific keywords**.

---

## Acceptance Criteria

### AC1: Generic Skill Expansion Detection
**Given** I have a generic skill listed (e.g., "Python")
**When** the AI generates suggestions
**Then** I receive a skill expansion suggestion
**And** example: "Python" → "Python (pandas, scikit-learn, TensorFlow)"

### AC2: Job Description Keyword Alignment
**Given** the job description mentions specific technologies
**When** skill expansion runs
**Then** suggestions prioritize expansions that match JD keywords
**And** example: If JD mentions "React", suggest "JavaScript" → "JavaScript (React, Node.js)"

### AC3: Non-Expandable Skills Handling
**Given** I have a skill that can't be meaningfully expanded
**When** the AI analyzes it
**Then** no expansion suggestion is generated

### AC4: Suggestion Display with JD Matching
**Given** expansions are suggested
**When** I view the suggestion
**Then** I see the original skill and the expanded version
**And** I see which JD keywords this expansion would match

### AC5: Suggestion Type Classification
**Given** suggestions are generated
**When** they are saved
**Then** skill expansion suggestions have `suggestion_type: 'skill_expansion'`
**And** include `keywords_matched` in the suggestion data

### AC6: Expandable Skills Framework
**Given** the system processes skills
**When** expansions are generated
**Then** expansions are technically accurate and professionally honest
**And** only suggested expansions the user can reasonably claim

---

## Technical Implementation

### Database Schema (Reusing Story 5-1)

The `suggestions` table created in Story 5-1 handles skill expansion suggestions:
- `suggestion_type: 'skill_expansion'`
- `section: 'skills'` (new section for this story type)
- `original_text: 'Python'` (the original skill)
- `suggested_text: 'Python (pandas, scikit-learn, TensorFlow)'` (expanded version)
- `reasoning: '{...}'` (includes keyword matches and technical context)

### New Files to Create

1. **`lib/validations/skills.ts`**
   - Skill expansion mappings for common technologies
   - Technology families and their typical libraries/frameworks
   - Helper functions for skill classification

2. **`lib/openai/prompts/skills-expansion.ts`**
   - Skill expansion prompt that's aware of JD keywords
   - Context-aware expansion suggestions
   - Keyword matching logic

3. **`actions/suggestions.ts` (extend existing)**
   - New function: `generateSkillExpansionSuggestions` - analyzes skills and suggests expansions
   - Integrates with extracted JD keywords
   - Returns structured suggestions for database persistence

### Implementation Strategy

#### Step 1: Create Skill Expansion Mappings (`lib/validations/skills.ts`)

```typescript
export const SKILL_EXPANSION_MAPPINGS = {
  // Programming Languages
  python: {
    family: "Python",
    expandTo: "Python (pandas, NumPy, scikit-learn, TensorFlow, Django, FastAPI)",
    categories: ["data-science", "backend", "ml"],
    relatedSkills: ["NumPy", "pandas", "Django", "FastAPI"],
  },
  javascript: {
    family: "JavaScript",
    expandTo: "JavaScript (React, Node.js, Express, Vue.js)",
    categories: ["frontend", "backend"],
    relatedSkills: ["React", "Node.js", "Express", "Vue.js"],
  },
  java: {
    family: "Java",
    expandTo: "Java (Spring, Spring Boot, Maven, JUnit)",
    categories: ["backend"],
    relatedSkills: ["Spring", "Spring Boot", "Maven"],
  },
  csharp: {
    family: "C#",
    expandTo: "C# (.NET, ASP.NET Core, Entity Framework)",
    categories: ["backend"],
    relatedSkills: [".NET", "ASP.NET Core", "Entity Framework"],
  },
  typescript: {
    family: "TypeScript",
    expandTo: "TypeScript (React, Next.js, Express, NestJS)",
    categories: ["frontend", "backend"],
    relatedSkills: ["React", "Next.js", "Express", "NestJS"],
  },
  golang: {
    family: "Go",
    expandTo: "Go (Gin, gRPC, Docker)",
    categories: ["backend", "devops"],
    relatedSkills: ["Gin", "gRPC", "Docker"],
  },
  rust: {
    family: "Rust",
    expandTo: "Rust (Tokio, Actix, WebAssembly)",
    categories: ["backend", "systems"],
    relatedSkills: ["Tokio", "Actix", "WebAssembly"],
  },

  // Frontend Frameworks
  react: {
    family: "React",
    expandTo: "React (Redux, React Router, Next.js, Material-UI)",
    categories: ["frontend"],
    relatedSkills: ["Redux", "React Router", "Next.js", "Material-UI"],
  },
  vue: {
    family: "Vue.js",
    expandTo: "Vue.js (Vuex, Vue Router, Nuxt.js)",
    categories: ["frontend"],
    relatedSkills: ["Vuex", "Vue Router", "Nuxt.js"],
  },
  angular: {
    family: "Angular",
    expandTo: "Angular (RxJS, TypeScript, Material)",
    categories: ["frontend"],
    relatedSkills: ["RxJS", "TypeScript", "Angular Material"],
  },

  // Backend Frameworks
  django: {
    family: "Django",
    expandTo: "Django (Django REST Framework, Celery, PostgreSQL)",
    categories: ["backend"],
    relatedSkills: ["Django REST Framework", "Celery", "PostgreSQL"],
  },
  spring: {
    family: "Spring",
    expandTo: "Spring (Spring Boot, Spring Security, Spring Data)",
    categories: ["backend"],
    relatedSkills: ["Spring Boot", "Spring Security", "Spring Data"],
  },
  express: {
    family: "Express",
    expandTo: "Express (Node.js, MongoDB, JWT, REST APIs)",
    categories: ["backend"],
    relatedSkills: ["Node.js", "MongoDB", "JWT"],
  },

  // Databases
  sql: {
    family: "SQL",
    expandTo: "SQL (PostgreSQL, MySQL, T-SQL, Query Optimization)",
    categories: ["database"],
    relatedSkills: ["PostgreSQL", "MySQL", "Database Design"],
  },
  mongodb: {
    family: "MongoDB",
    expandTo: "MongoDB (Mongoose, Aggregation, NoSQL Design)",
    categories: ["database"],
    relatedSkills: ["Mongoose", "NoSQL Design", "Document Databases"],
  },
  postgres: {
    family: "PostgreSQL",
    expandTo: "PostgreSQL (Advanced Queries, Indexing, Replication)",
    categories: ["database"],
    relatedSkills: ["SQL", "Query Optimization", "Database Design"],
  },

  // Cloud & DevOps
  aws: {
    family: "AWS",
    expandTo: "AWS (EC2, S3, Lambda, RDS, CloudFront)",
    categories: ["cloud", "devops"],
    relatedSkills: ["EC2", "S3", "Lambda", "RDS"],
  },
  gcp: {
    family: "Google Cloud",
    expandTo: "Google Cloud (Compute Engine, Cloud Storage, BigQuery)",
    categories: ["cloud"],
    relatedSkills: ["Compute Engine", "Cloud Storage", "BigQuery"],
  },
  azure: {
    family: "Azure",
    expandTo: "Azure (App Service, Azure SQL, Azure DevOps)",
    categories: ["cloud"],
    relatedSkills: ["App Service", "Azure SQL", "Azure DevOps"],
  },
  docker: {
    family: "Docker",
    expandTo: "Docker (Docker Compose, Container Orchestration, Kubernetes)",
    categories: ["devops"],
    relatedSkills: ["Docker Compose", "Kubernetes", "Container Registries"],
  },
  kubernetes: {
    family: "Kubernetes",
    expandTo: "Kubernetes (Helm, Docker, Microservices, Orchestration)",
    categories: ["devops"],
    relatedSkills: ["Helm", "Docker", "Microservices"],
  },

  // Data & Analytics
  datascience: {
    family: "Data Science",
    expandTo: "Data Science (Python, R, Machine Learning, Statistics)",
    categories: ["data-science"],
    relatedSkills: ["Python", "R", "Machine Learning", "Statistics"],
  },
  machinelearning: {
    family: "Machine Learning",
    expandTo: "Machine Learning (TensorFlow, PyTorch, Scikit-learn, NLP)",
    categories: ["ml"],
    relatedSkills: ["TensorFlow", "PyTorch", "Scikit-learn"],
  },
  tensorflow: {
    family: "TensorFlow",
    expandTo: "TensorFlow (Keras, Deep Learning, Computer Vision)",
    categories: ["ml"],
    relatedSkills: ["Keras", "Deep Learning", "Computer Vision"],
  },

  // General
  git: {
    family: "Git",
    expandTo: "Git (GitHub, GitLab, Version Control, CI/CD)",
    categories: ["devtools"],
    relatedSkills: ["GitHub", "GitLab", "GitHub Actions"],
  },
  rest: {
    family: "REST APIs",
    expandTo: "REST APIs (HTTP, JSON, API Design, OpenAPI)",
    categories: ["backend"],
    relatedSkills: ["HTTP", "JSON", "API Design"],
  },
};

export type SkillExpansion = typeof SKILL_EXPANSION_MAPPINGS[keyof typeof SKILL_EXPANSION_MAPPINGS];

/**
 * Find skill expansion mapping by original skill name (case-insensitive)
 */
export function findSkillExpansion(skill: string): SkillExpansion | null {
  const normalized = skill.toLowerCase().replace(/\s+/g, "");

  for (const [key, expansion] of Object.entries(SKILL_EXPANSION_MAPPINGS)) {
    if (key === normalized) {
      return expansion;
    }
    // Also check against the family name
    if (expansion.family.toLowerCase().replace(/\s+/g, "") === normalized) {
      return expansion;
    }
  }

  return null;
}

/**
 * Get all expandable skills (returns list of skill names that can be expanded)
 */
export function getExpandableSkills(): string[] {
  return Object.values(SKILL_EXPANSION_MAPPINGS).map(e => e.family);
}

/**
 * Check if a skill can be expanded
 */
export function isExpandableSkill(skill: string): boolean {
  return findSkillExpansion(skill) !== null;
}

/**
 * Filter skills that can be expanded
 */
export function filterExpandableSkills(skills: string[]): string[] {
  return skills.filter(isExpandableSkill);
}
```

#### Step 2: Create OpenAI Prompt (`lib/openai/prompts/skills-expansion.ts`)

```typescript
export const SKILL_EXPANSION_PROMPT = (
  skills: string[],
  jdContent?: string,
  jdKeywords?: string[]
) => {
  const keywordContext = jdKeywords?.length
    ? `\n\nJob Description Keywords: ${jdKeywords.join(", ")}\n\nPrioritize expansions that include these keywords.`
    : "";

  const jdContext = jdContent
    ? `\n\nJob Description excerpt: "${jdContent.substring(0, 500)}..."`
    : "";

  return `You are an expert ATS and resume optimization specialist.

Your task is to analyze the following skills and suggest specific expansions that will help the resume match ATS keyword searches and job descriptions more effectively.

Skills to analyze:
${skills.map((s, i) => `${i + 1}. ${s}`).join("\n")}
${keywordContext}
${jdContext}

For EACH skill, respond with:
1. CAN_EXPAND: true/false (is this skill expandable with commonly used libraries/frameworks/tools?)
2. EXPANSION: if true, provide the expanded version with commonly-used libraries/frameworks/tools
3. KEYWORDS_MATCHED: list of JD keywords this expansion would help match
4. REASONING: brief explanation of why these specific technologies are paired with this skill

IMPORTANT RULES:
- Only suggest expansions that are technically accurate and honest
- Include only tools/libraries/frameworks commonly used with this skill
- Do NOT make up technologies or create false associations
- If the skill cannot be meaningfully expanded (e.g., "Communication", "Leadership"), set CAN_EXPAND to false
- Generic skills like "Problem Solving" don't expand
- Base expansions on industry standards and actual usage patterns

Respond as valid JSON:
{
  "suggestions": [
    {
      "original": "original skill name",
      "can_expand": true/false,
      "expansion": null or "expanded skill (with specific tools/libraries)",
      "keywords_matched": ["keyword1", "keyword2"],
      "reasoning": "brief explanation"
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
import { SKILL_EXPANSION_PROMPT } from "@/lib/openai/prompts/skills-expansion";
import { findSkillExpansion } from "@/lib/validations/skills";
import z from "zod";

const generateSkillExpansionSchema = z.object({
  scanId: z.string().uuid(),
  skills: z.array(z.string()).min(1),
  jdKeywords: z.array(z.string()).optional(),
  jdContent: z.string().optional(),
});

type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } };

export async function generateSkillExpansionSuggestions(
  input: z.infer<typeof generateSkillExpansionSchema>
): Promise<
  ActionResponse<{
    scanId: string;
    suggestions: Array<{
      original: string;
      expansion: string | null;
      keywordsMatched: string[];
      reasoning: string;
    }>;
  }>
> {
  const parsed = generateSkillExpansionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: "Invalid input", code: "VALIDATION_ERROR" },
    };
  }

  try {
    const { scanId, skills, jdKeywords, jdContent } = parsed.data;

    // First, try local skill expansion mappings for known skills
    const localExpansions = new Map<string, typeof SKILL_EXPANSION_MAPPINGS[keyof typeof SKILL_EXPANSION_MAPPINGS] | null>();
    const unknownSkills: string[] = [];

    for (const skill of skills) {
      const expansion = findSkillExpansion(skill);
      if (expansion) {
        localExpansions.set(skill, expansion);
      } else {
        unknownSkills.push(skill);
      }
    }

    // If all skills are known, use local mappings
    let suggestions: Array<{
      original: string;
      expansion: string | null;
      keywordsMatched: string[];
      reasoning: string;
    }> = [];

    if (unknownSkills.length === 0) {
      // Use local mappings for all skills
      suggestions = skills.map(skill => {
        const expansion = localExpansions.get(skill);
        if (expansion) {
          return {
            original: skill,
            expansion: expansion.expandTo,
            keywordsMatched: jdKeywords
              ? expansion.relatedSkills.filter(rs =>
                  jdKeywords.some(kw => kw.toLowerCase().includes(rs.toLowerCase()))
                )
              : expansion.relatedSkills,
            reasoning: `Expanded to include commonly-used libraries and frameworks: ${expansion.relatedSkills.join(", ")}`,
          };
        }
        return {
          original: skill,
          expansion: null,
          keywordsMatched: [],
          reasoning: "Cannot be meaningfully expanded",
        };
      });
    } else {
      // Use AI for unknown skills
      const prompt = SKILL_EXPANSION_PROMPT(
        unknownSkills,
        jdContent,
        jdKeywords
      );

      const response = await generateText({
        model: openai("gpt-4o-mini"),
        prompt,
        temperature: 0.7,
      });

      let aiSuggestions;
      try {
        const parsed = JSON.parse(response.text);
        aiSuggestions = parsed.suggestions;
      } catch {
        console.error(
          "[generateSkillExpansionSuggestions] Failed to parse OpenAI response",
          response.text
        );
        return {
          data: null,
          error: { message: "Failed to parse AI response", code: "PARSE_ERROR" },
        };
      }

      // Combine local and AI suggestions
      suggestions = skills.map(skill => {
        const localExpansion = localExpansions.get(skill);
        if (localExpansion) {
          return {
            original: skill,
            expansion: localExpansion.expandTo,
            keywordsMatched: jdKeywords
              ? localExpansion.relatedSkills.filter(rs =>
                  jdKeywords.some(kw => kw.toLowerCase().includes(rs.toLowerCase()))
                )
              : localExpansion.relatedSkills,
            reasoning: `Expanded to include commonly-used libraries and frameworks: ${localExpansion.relatedSkills.join(", ")}`,
          };
        }

        // Find AI suggestion for this skill
        const aiSugg = aiSuggestions?.find(
          (s: any) => s.original.toLowerCase() === skill.toLowerCase()
        );
        if (aiSugg && aiSugg.can_expand && aiSugg.expansion) {
          return {
            original: skill,
            expansion: aiSugg.expansion,
            keywordsMatched: aiSugg.keywords_matched || [],
            reasoning: aiSugg.reasoning,
          };
        }

        return {
          original: skill,
          expansion: null,
          keywordsMatched: [],
          reasoning: "Cannot be meaningfully expanded",
        };
      });
    }

    // Filter to only suggestions where expansion was found
    const expandedSuggestions = suggestions.filter(s => s.expansion !== null);

    return {
      data: { scanId, suggestions: expandedSuggestions },
      error: null,
    };
  } catch (e) {
    console.error("[generateSkillExpansionSuggestions]", e);
    return {
      data: null,
      error: {
        message: "Failed to generate skill expansion suggestions",
        code: "GENERATION_ERROR",
      },
    };
  }
}

/**
 * Transform AI response to database save format
 */
export function transformSkillExpansionSuggestions(
  scanId: string,
  suggestions: Array<{
    original: string;
    expansion: string | null;
    keywordsMatched: string[];
    reasoning: string;
  }>
): Array<{
  section: string;
  itemIndex: number;
  originalText: string;
  suggestedText: string;
  suggestionType: string;
  reasoning?: string;
}> {
  return suggestions
    .filter(sugg => sugg.expansion !== null)
    .map((sugg, index) => ({
      section: "skills",
      itemIndex: index,
      originalText: sugg.original,
      suggestedText: sugg.expansion!,
      suggestionType: "skill_expansion",
      reasoning: `${sugg.reasoning}\n\nKeywords matched: ${sugg.keywordsMatched.join(", ") || "none"}`,
    }));
}
```

#### Step 4: Integration with `runAnalysis`

```typescript
// In the runAnalysis workflow:
async function runAnalysis(scanId: string, userId: string) {
  try {
    // ... existing analysis code ...

    // After ATS analysis, bullet rewrites, skill mappings, and action verbs
    // Generate skill expansion suggestions

    // Extract skills from parsed resume
    const skills = parsedResume.skills || [];

    // Extract JD keywords from previous analysis
    const jdKeywords = extractedJdKeywords; // from previous analysis step

    const skillExpansionResult = await generateSkillExpansionSuggestions({
      scanId,
      skills,
      jdKeywords,
      jdContent: jobDescription,
    });

    if (skillExpansionResult.error) {
      console.error(
        "[runAnalysis] Failed to generate skill expansion suggestions",
        skillExpansionResult.error
      );
    } else {
      const suggestions = transformSkillExpansionSuggestions(
        scanId,
        skillExpansionResult.data!.suggestions
      );
      await saveSuggestions(scanId, suggestions);
    }

    // ... continue with analysis ...
  } catch (e) {
    console.error("[runAnalysis]", e);
  }
}
```

---

## Examples of Skill Expansions

### Technology Skills

| Original | Expanded | Keywords Matched |
|----------|----------|------------------|
| Python | Python (pandas, NumPy, scikit-learn, TensorFlow, Django, FastAPI) | pandas, scikit-learn, TensorFlow if in JD |
| JavaScript | JavaScript (React, Node.js, Express, Vue.js) | React, Node.js if in JD |
| React | React (Redux, React Router, Next.js, Material-UI) | Redux, Next.js if in JD |
| PostgreSQL | PostgreSQL (Advanced Queries, Indexing, Replication) | Database, SQL, Queries |
| AWS | AWS (EC2, S3, Lambda, RDS, CloudFront) | EC2, Lambda, S3 if in JD |
| Docker | Docker (Docker Compose, Container Orchestration, Kubernetes) | Kubernetes, Orchestration if in JD |

### Non-Expandable Skills

| Original | Reason |
|----------|--------|
| Communication | Too generic, can't be meaningfully expanded |
| Leadership | Behavioral skill, not technical |
| Problem Solving | Behavioral skill, not technical |
| Attention to Detail | Behavioral skill, not technical |
| Project Management | Could expand but typically remains as-is |

---

## Acceptance Testing

### Test 1: Known Skill Expansion (Local Mapping)
- Input: ["Python", "JavaScript", "React"]
- Verify: Uses local skill mappings from `SKILL_EXPANSION_MAPPINGS`
- Verify: No AI call made (optimization)
- Verify: Suggestions include related libraries

### Test 2: Unknown Skill (AI Fallback)
- Input: ["SomeNewFramework"]
- Verify: Makes AI call for unknown skill
- Verify: AI determines if expandable
- Verify: Returns reasonable expansion or null

### Test 3: JD Keyword Matching
- Input: skills = ["Python"], jdKeywords = ["TensorFlow", "pandas"]
- Verify: Keywords matched includes TensorFlow and pandas
- Verify: Expansion shows "Python (pandas, NumPy, scikit-learn, TensorFlow, ...)"

### Test 4: Non-Expandable Skills
- Input: ["Communication", "Leadership", "Problem Solving"]
- Verify: No suggestions generated (all return null expansion)
- Verify: Reasoning explains why not expandable

### Test 5: Mixed Skills (Expandable + Non-Expandable)
- Input: ["Python", "Communication", "React", "Leadership"]
- Verify: Returns suggestions only for Python and React
- Verify: Communication and Leadership have null expansions

### Test 6: Database Persistence
- Generate suggestions for a scan
- Verify: Suggestions saved with `suggestion_type: 'skill_expansion'`
- Verify: `section: 'skills'`
- Verify: Keywords matched included in reasoning
- Verify: Can retrieve via suggestions API

### Test 7: RLS Security
- Create suggestions for User 1's scan
- Verify: User 1 can access
- Verify: User 2 cannot access

### Test 8: Optimization: Local Mappings Only
- Input: ["Python", "JavaScript", "React"] (all known)
- Verify: No AI call made
- Verify: Response time < 100ms
- Verify: Suggestions returned from local mappings

---

## Implementation Considerations

1. **Hybrid Approach:** Use local mappings for known skills (fast, no API cost), fall back to AI for unknown skills
2. **Honest Expansions:** Only suggest tools/libraries commonly used with the skill
3. **JD Keyword Matching:** If JD keywords provided, prioritize related skills that appear in JD
4. **Non-Expandable Skills:** Many soft skills cannot be expanded - be clear why
5. **Ordering:** Skills should be processed in order, suggestions maintain original skill order
6. **Performance:** Local mappings provide instant suggestions for ~50 common technologies

---

## Definition of Done

- [ ] `lib/validations/skills.ts` with skill expansion mappings and helpers
- [ ] `lib/openai/prompts/skills-expansion.ts` implements skill expansion prompt
- [ ] `generateSkillExpansionSuggestions` server action created
- [ ] `transformSkillExpansionSuggestions` helper function converts API response
- [ ] Hybrid approach implemented (local mappings + AI fallback)
- [ ] Expandable skills detection works correctly
- [ ] JD keyword matching integrated
- [ ] Suggestions saved with correct `suggestion_type: 'skill_expansion'` field
- [ ] All acceptance tests pass (8 tests)
- [ ] No TypeScript errors
- [ ] Code follows project-context.md conventions
- [ ] Story marked as `review` in sprint-status.yaml

---

## Tasks/Subtasks

- [ ] Create `lib/validations/skills.ts` with skill expansion mappings
- [ ] Create `lib/openai/prompts/skills-expansion.ts` for skill expansion prompt
- [ ] Extend `actions/suggestions.ts` with `generateSkillExpansionSuggestions` function
- [ ] Create `transformSkillExpansionSuggestions` helper function
- [ ] Write unit tests for skill validation (estimate 15 tests)
- [ ] Write unit tests for skill expansion suggestions (estimate 20 tests)
- [ ] Validate all tests pass
- [ ] Mark story as review

---

## Dev Agent Record

### Agent Model Used
Haiku 4.5

### Debug Log References
(To be filled during implementation)

### Completion Notes List
(To be filled during implementation)

### File List
(To be filled during implementation)

---

## Related Stories

- **Story 5-1:** Bullet Point Rewrite Generation (foundational suggestion type)
- **Story 5-2:** Transferable Skills Detection (maps non-tech skills to tech)
- **Story 5-3:** Action Verb & Quantification Suggestions (improves wording and metrics)
- **Story 5-4:** This story (expands skill list with specific technologies)
- **Story 5-5:** Format & Content Removal Suggestions (cleanup suggestions)
- **Story 5-6:** Suggestions Display by Section (displays all suggestions)

---

## Key Context for Developer

### ATS Keyword Matching Strategy
This story focuses on **specific technology expansion** to help ATS systems match job description keywords. Unlike Story 5-2 (which maps soft skills to tech), this story **expands known tech skills** with their commonly-used tools.

### Examples of What Works
- "Python" → "Python (pandas, NumPy, scikit-learn, TensorFlow, Django, FastAPI)"
- "React" → "React (Redux, React Router, Next.js, Material-UI)"
- "AWS" → "AWS (EC2, S3, Lambda, RDS, CloudFront)"

### Examples of What Doesn't Work (Don't Do This)
- "Communication" → Don't expand behavioral skills
- "Python" → "Python, Java, C++" (Don't add unrelated languages)
- "JavaScript" → "JavaScript (Leadership, Teamwork)" (Don't add soft skills)

### Local Mapping Optimization
The local skill expansion mappings provide ~50 common tech skills. This gives:
1. **Speed:** No API call needed for known skills
2. **Cost:** No OpenAI API cost for common skills
3. **Reliability:** Consistent, high-quality expansions

Fall back to AI only for unknown skills, which is rare.

### Previous Story Learnings
From Story 5-3 (Action Verb & Quantification):
- Use `ActionResponse<T>` pattern consistently
- Transform snake_case suggestions to camelCase at boundaries
- Test both positive cases (suggestions found) and negative cases (no suggestions)
- Use `suggestion_type` field for classification in database
- Include comprehensive reasoning for suggestions

---

## Notes

- This story complements Story 5-2 (which handles transferable skills from non-tech backgrounds)
- Skills expansion helps with ATS matching by including specific tools and libraries
- Focus on honest expansions that the user can reasonably claim
- Local mappings cover ~50 common technologies; AI handles the rest
- Integration with runAnalysis deferred to allow independent testing

---
