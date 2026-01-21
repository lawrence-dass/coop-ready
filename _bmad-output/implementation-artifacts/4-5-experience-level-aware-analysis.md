# Story 4.5: Experience-Level-Aware Analysis

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**, I want **the analysis to consider my experience level** so that **I get relevant feedback for my situation**.

## Acceptance Criteria

1. ✓ Analysis considers user's experience level (Student/Recent Graduate, Career Changer, or Experienced)
2. ✓ Student level: Academic projects and education weighted more heavily
3. ✓ Student level: Not penalized for limited years of experience
4. ✓ Student level: Feedback focuses on translating academic work to professional language
5. ✓ Career Changer level: Transferable skills from previous career emphasized
6. ✓ Career Changer level: Existing experience mapped to tech terminology
7. ✓ Career Changer level: Bootcamp/certification projects valued appropriately
8. ✓ Score justification references the user's experience level context
9. ✓ Suggestions are tailored to the user's situation
10. ✓ `scans` table updated with `experience_level_context` (text) storing the context used for analysis

## Tasks / Subtasks

- [ ] **Task 1: Update Profile Schema** (AC: 1)
  - [ ] Verify user profiles have `experience_level` column (should exist from Epic 2)
  - [ ] Options: "student", "career-changer", "experienced"
  - [ ] Add migration if column doesn't exist
  - [ ] Set default to "student" for new users
  - [ ] Add index on experience_level for filtering

- [ ] **Task 2: Add Database Column** (AC: 10)
  - [ ] Create migration: add `experience_level_context` (text) to `scans` table
  - [ ] Column stores the narrative context passed to OpenAI (not just the level)
  - [ ] Nullable initially (set during analysis)
  - [ ] Verify RLS policies allow users to see own experience context
  - [ ] Add comments documenting the context field purpose

- [ ] **Task 3: Fetch User Profile** (AC: 1)
  - [ ] Update `lib/supabase/queries.ts` with `getUserProfile(userId: string)` function
  - [ ] Return user profile with `experience_level` and `target_role`
  - [ ] Handle missing profile (return default "student" level)
  - [ ] Cache/memoize profile fetch to avoid multiple queries
  - [ ] Include error logging for profile fetch failures

- [ ] **Task 4: Create Experience Context Builder** (AC: 1-9)
  - [ ] Create `lib/openai/prompts/experienceContext.ts`
  - [ ] Export `buildExperienceContext(experienceLevel: string, targetRole?: string): string` function
  - [ ] For Student level: Include context about valuing internships, academic projects, coursework, certifications
  - [ ] For Career Changer level: Include context about identifying transferable skills, emphasizing learning ability
  - [ ] For Experienced level: Include context about valuing leadership, impact at scale, architectural decisions
  - [ ] Context should be narrative (not bullet points) for better prompt integration
  - [ ] Include role-specific guidance when targetRole is provided

- [ ] **Task 5: Extend Analysis Prompt** (AC: 1-9)
  - [ ] Update `lib/openai/prompts/scoring.ts` to include experience context
  - [ ] Integrate experience context into system prompt
  - [ ] Add experience-level-specific scoring guidelines section
  - [ ] Modify score interpretation examples for each level
  - [ ] For Student: Example showing "limited but relevant" experience valued
  - [ ] For Career Changer: Example showing transferable skills mapping
  - [ ] Ensure prompt instructs AI to reference experience level in justifications
  - [ ] Temperature remains 0.3 for consistency
  - [ ] Add instruction to generate experience-aware section scoring

- [ ] **Task 6: Update runAnalysis Action** (AC: 1-10)
  - [ ] Modify `actions/analysis.ts` to:
    - Fetch user profile with experience level
    - Build experience context using buildExperienceContext()
    - Pass experience context to analysis prompt
    - Parse experience_level_context from response
    - Store experience_level_context in scans table
    - Include experience context in returned AnalysisResult
  - [ ] Handle missing experience level gracefully (default to "student")
  - [ ] Log experience level for debugging/analytics
  - [ ] Ensure error handling includes profile fetch failures

- [ ] **Task 7: Create Type Definitions** (AC: All)
  - [ ] Update `lib/types/analysis.ts` with experience context types
  - [ ] Export `ExperienceLevel` type: `"student" | "career-changer" | "experienced"`
  - [ ] Export `ExperienceContext` interface: `{ level: ExperienceLevel, narrative: string, targetRole?: string }`
  - [ ] Update `AnalysisResult` type to include `experienceLevelContext: string`
  - [ ] Update `ScanRecord` type with `experience_level_context` column

- [ ] **Task 8: Unit Tests** (AC: All)
  - [ ] Create `tests/unit/lib/openai/prompts/experienceContext.test.ts`
    - Test building context for each experience level
    - Test context includes role-specific guidance when provided
    - Test Student context emphasizes academic work and internships
    - Test Career Changer context emphasizes transferable skills
    - Test Experienced context emphasizes impact and leadership
    - Test context is narrative (suitable for prompt injection)
  - [ ] Update `tests/unit/actions/analysis.test.ts`
    - Mock user profile with different experience levels
    - Test experience context is built correctly
    - Test experience context is stored in database
    - Test experience context is included in returned AnalysisResult
    - Test experience level affects score justification (spot check AI response)
    - Test missing experience level defaults to "student"
  - [ ] Verify all 50+ existing tests still pass

- [ ] **Task 9: Integration Tests** (AC: All)
  - [ ] Update `tests/e2e/analysis-flow.spec.ts`
    - Test full flow with Student level: verify academic projects valued
    - Test full flow with Career Changer level: verify transferable skills mentioned
    - Test full flow with Experienced level: verify impact/leadership metrics mentioned
    - Verify experience context stored in database matches what was used
    - Test with different target roles
  - [ ] Test profile fetch integration (handle missing profile)

- [ ] **Task 10: Documentation** (AC: All)
  - [ ] Update `README.md` with "Experience-Level-Aware Analysis" subsection
  - [ ] Document the three experience levels and what they optimize for
  - [ ] Document how user sets their experience level (from Epic 2 - Profile Settings)
  - [ ] Explain how experience level affects scoring and feedback
  - [ ] Add examples of how feedback differs by experience level
  - [ ] Document target role usage in personalization

## Dev Notes

### Architecture Context

**Story Dependencies:**
- **Depends On**: Story 4.4 (Section-Level Score Breakdown) - builds on established prompt pattern
- **Depends On**: Story 4.2 (ATS Score Calculation) - extends analysis prompt
- **Depends On**: Story 4.1 (OpenAI Integration) - uses OpenAI client
- **Depends On**: Epic 2 (User Profile Management) - experience_level field must exist
- **Feeds Into**: Story 4.7 (Results Page) - displays experience-aware results
- **Feeds Into**: Story 5-x (Suggestions) - suggestions should be experience-aware

**Why This Story Fifth:**
- Stories 4.1-4.4 established analysis patterns (prompts, parsing, database persistence)
- Epic 2 established user profile structure with experience level
- This story personalizes analysis based on user context (minimal new complexity)
- Prerequisite for Stories 4.6-4.7 which refine analysis output
- Enables more effective suggestions in Epic 5

**Integration Points:**
- Extends analysis prompt from Story 4.2 with experience context section
- Fetches user profile (Epic 2 integration)
- Adds experience_level_context to scans table (schema evolution)
- Experience context informs all downstream analysis (sections, keywords, format)

### Technical Context

**Experience Levels & Weighting:**

| Level | Definition | Score Weighting Adjustments | Feedback Focus |
|-------|------------|------------------------------|-----------------|
| **Student** | Currently in school, recently graduated (<2 years), internship-focused | Increase Education+Projects weight, decrease Experience weight, remove years penalty | Translating academic to professional language, relevant coursework value |
| **Career Changer** | Transitioning from non-tech background, bootcamp graduate | Emphasize transferable skills, value bootcamp/certs, focus on tech skill growth | Mapping existing experience to tech terminology, demonstrating tech commitment |
| **Experienced** | 2+ years tech work experience, established professional | Standard weighting, add leadership/impact emphasis | Quantified metrics, architectural decisions, scale of impact |

**Example Experience Context Strings:**

For Student:
```
"This candidate is a student or recent graduate (within 2 years). When scoring,
emphasize the value of academic projects, coursework, and internships. Do not
penalize for limited years of professional experience. Instead, translate
academic achievements into professional language. Value relevant certifications
and school prestige. The goal is helping this candidate bridge from academia to
professional tech roles."
```

For Career Changer:
```
"This candidate is transitioning to tech from a non-tech background. When
scoring, focus on identifying and emphasizing transferable skills from their
previous career. Value bootcamp training, online certifications, and personal
projects that demonstrate tech capability. Map existing experience to tech
terminology. The goal is helping them articulate how their unique background
strengthens the team while demonstrating genuine tech skills."
```

For Experienced:
```
"This candidate has 2+ years of tech experience. When scoring, emphasize
quantified impact, architectural decisions, and leadership contributions. Look
for evidence of growth and scale. The goal is helping them craft a resume that
showcases their professional impact and readiness for senior or specialized roles."
```

**Database Schema Update:**

```sql
ALTER TABLE scans
  ADD COLUMN experience_level_context TEXT;

-- Store narrative context used for this scan, e.g.:
-- "This candidate is a student or recent graduate..."
```

**Prompt Engineering Integration:**

The experience context is injected into the system prompt:
```
System: You are an expert ATS resume analyzer. [existing system message]

${experienceContext}

Resume: [resume text]
Job Description: [job description text]
Target Role: [optional role]
```

**User Profile Integration:**

Fetch from `profiles` table during analysis:
```typescript
const profile = await getUserProfile(userId)
const experienceLevel = profile?.experience_level ?? 'student'
const targetRole = profile?.target_role ?? null
const context = buildExperienceContext(experienceLevel, targetRole)
```

### Implementation Considerations

**Experience Context Timing:**
- Fetch user profile at start of runAnalysis
- Build experience context before calling OpenAI
- Pass context through entire analysis pipeline
- Store context in database for audit/debugging

**Default Behavior:**
- If profile doesn't exist or experience_level missing: default to "student"
- If target_role not set: omit from context (still valid)
- If profile fetch fails: log error and proceed with default

**Prompt Injection Safety:**
- Experience context is developer-defined (not user input)
- Safe to inject directly into prompt
- No user-controlled data in context string

**AI Response Integration:**
- Prompt instructs AI to reference experience level in score justification
- AI will naturally incorporate context into explanations
- No parsing needed for context itself (stored as-is)

**Performance:**
- One additional database query per analysis (getUserProfile)
- Can be optimized with profile caching in future
- OpenAI latency unchanged (same prompt length)

### Testing Strategy

**Unit Tests Priority:**
1. Experience context building (all three levels, with/without role)
2. Context injection into prompt
3. Profile fetch integration (happy path and missing profile)
4. Type validation for experience levels

**Integration Test Priority:**
1. Full flow: User with Student level → scores reflect that context
2. Full flow: User with Career Changer level → transferable skills mentioned
3. Full flow: User with Experienced level → impact emphasized
4. E2E: Multiple users with different levels show appropriately different feedback

**Edge Cases to Test:**
- Missing user profile (default to student)
- Missing experience_level field in profile
- Missing target_role (context still valid)
- Profile fetch timeout/error (graceful degradation)

### Previous Story Learnings

**From Story 4.4 (Section-Level Score Breakdown):**
- Prompt extensions for additional analysis dimensions
- Only process data that exists (only score sections that exist)
- Database JSONB for complex nested data

**From Story 4.3 (Missing Keywords Detection):**
- Context-aware analysis (keyword importance varies by role)
- Sorting and prioritization of results
- Fallback handling when data is incomplete

**From Story 4.2 (ATS Score Calculation):**
- Analysis prompt structure with few-shot examples
- Response parsing with fallback scoring
- Temperature 0.3 for consistency

**From Story 4.1 (OpenAI Integration):**
- Client reliability patterns (retry, timeout)
- User-friendly error messages (never expose internals)
- Logging for debugging

### Git Intelligence

**Related Implementation Patterns:**
- User profile queries in `lib/supabase/queries.ts`
- Prompt extensions in `lib/openai/prompts/scoring.ts`
- Experience-aware context builder pattern
- Database migration pattern for new columns
- Server Action pattern in `actions/analysis.ts`

**Recent Epic 2 Commits:**
- User profile established with `experience_level` field
- Profile settings page allows users to set their level
- Target role field available in profiles

**Recent Story 4.4 Commits:**
- Showed how to extend prompts with additional context sections
- Demonstrated JSONB storage in database
- Showed pattern for context-aware analysis

### References

- Story 4.4: `_bmad-output/implementation-artifacts/4-4-section-level-score-breakdown.md`
- Story 4.2: `_bmad-output/implementation-artifacts/4-2-ats-score-calculation.md`
- Story 4.1: `_bmad-output/implementation-artifacts/4-1-openai-integration-setup.md`
- Epic 2: User profiles with `experience_level` field
- Project Context: `_bmad-output/project-context.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Debug Log References

Story context created 2026-01-20 23:45 UTC

### Completion Notes List

- [ ] Profile schema verification/update with experience_level index
- [ ] Database migration: add experience_level_context to scans table
- [ ] User profile fetching function in lib/supabase/queries.ts
- [ ] Experience context builder utility (lib/openai/prompts/experienceContext.ts)
- [ ] Analysis prompt extended with experience-level-specific guidelines
- [ ] runAnalysis action updated to fetch profile and build context
- [ ] Type definitions for ExperienceLevel and ExperienceContext
- [ ] Unit tests for experience context building and profile integration
- [ ] Integration tests for experience-level-aware analysis
- [ ] Documentation updated with experience-level details in README

---

**Implementation Ready:** This story is ready for development. All acceptance criteria are defined, technical patterns established from previous stories, and integration points identified.

The core implementation involves:
1. Fetching user experience level from profile
2. Building narrative context describing what to optimize for
3. Injecting context into analysis prompt
4. Storing context in database for reference

This enables personalized, experience-aware feedback tailored to each user's situation.
