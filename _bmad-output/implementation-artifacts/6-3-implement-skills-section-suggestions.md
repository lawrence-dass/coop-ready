# Story 6.3: Implement Skills Section Suggestions

Status: ready-for-dev

---

## Story

As a user,
I want optimized suggestions for my skills section,
So that I can better align my skills with the job requirements.

## Acceptance Criteria

1. **Skill extraction:** System extracts existing skills from resume and job description
2. **Keyword alignment:** Suggestions prioritize skills that match JD requirements
3. **Skill addition:** Missing relevant skills (related to user's experience) are suggested
4. **Skill formatting:** Skills are organized by relevance and follow professional standards
5. **Response format:** Returns ActionResponse<T> pattern with suggestions or error
6. **User content security:** Resume content and JD wrapped in XML tags for prompt injection defense
7. **Section isolation:** Only Skills section is processed (not Summary or Experience)
8. **Suggestion quality:** Generated suggestions are authentic and relevant to user's background
9. **Timeout handling:** Operation completes within 60 seconds with graceful error handling
10. **Session persistence:** Suggestions stored in Supabase session for later retrieval

## Tasks / Subtasks

- [ ] Task 1: Analyze Skills section optimization requirements (AC: #1, #2, #3, #4)
  - [ ] Review how 6-2 (Summary) differs from Skills optimization
  - [ ] Understand the skills parsing approach from Epic 3.5
  - [ ] Design skill extraction/prioritization algorithm
  - [ ] Identify "missing but relevant" skills logic
  - [ ] Create test cases for different skill types (technical, soft skills, tools)

- [ ] Task 2: Implement backend function `generateSkillsSuggestion()` in `/lib/ai/` (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Create function signature: `generateSkillsSuggestion(resumeSkills, jobDescription, resumeContent) → ActionResponse<SkillsSuggestion>`
  - [ ] Wrap user content in XML tags: `<user_content>${skills}</user_content>` and `<job_description>${jobDescription}</job_description>`
  - [ ] Call Anthropic API with prompt for: skill matching + gap analysis + skill addition
  - [ ] Parse response into: `{ existing_skills, matched_keywords, missing_skills, skill_additions, skill_removals }`
  - [ ] Return ActionResponse with suggestion or error
  - [ ] Handle LLM_TIMEOUT, LLM_ERROR, PARSE_ERROR codes

- [ ] Task 3: Create new API endpoint `/api/suggestions/skills` (AC: #1, #7, #9)
  - [ ] Create `app/api/suggestions/skills/route.ts` with POST handler
  - [ ] Accept: `{ session_id, resume_content, jd_content, current_skills }`
  - [ ] Implement 60-second timeout wrapper (use pattern from 6-1, 6-2)
  - [ ] Validate inputs (session_id, resume_content, jd_content, current_skills required)
  - [ ] Call `generateSkillsSuggestion()` with timeout
  - [ ] Return ActionResponse<SkillsSuggestion>

- [ ] Task 4: Integrate with Supabase session storage (AC: #10)
  - [ ] Extend sessions table to include `skills_suggestion` column (JSONB)
  - [ ] Create migration: add column + index
  - [ ] Call `updateSession()` to save suggestions with session_id + anonymous_id
  - [ ] Test RLS policies enforce data isolation
  - [ ] Update `types/optimization.ts` to include skillsSuggestion in OptimizationSession

- [ ] Task 5: Implement skill extraction and analysis utilities (AC: #1, #2, #3, #4)
  - [ ] Create `/lib/ai/extractSkillsFromResume.ts` function
  - [ ] Parse existing resume skills section
  - [ ] Categorize skills (technical, tools, soft skills)
  - [ ] Extract keywords from job description
  - [ ] Compare and identify missing skills
  - [ ] Test with various resume formats

- [ ] Task 6: Build frontend component `SkillsOptimization` (AC: #1, #7, #8) **[May defer to later story]**
  - [ ] Create `components/shared/SkillsOptimization.tsx`
  - [ ] Display existing skills vs recommended skills
  - [ ] Show "matched" skills (already in resume)
  - [ ] Show "missing" skills (recommended to add)
  - [ ] Show skills to consider removing (lower relevance)
  - [ ] Button: "Apply suggestions" (update Zustand)
  - [ ] Button: "Regenerate" (call `/api/suggestions/skills` again)
  - [ ] Loading state during generation

- [ ] Task 7: Integrate into Optimization Results page (AC: #1, #7) **[May defer to later story]**
  - [ ] Add SkillsOptimization component to results display
  - [ ] Only show if optimization includes Skills section
  - [ ] Call `/api/suggestions/skills` after successful optimization
  - [ ] Handle loading/error states
  - [ ] Wire up "Apply suggestions" to update Zustand store

- [ ] Task 8: Write comprehensive tests (AC: all)
  - [ ] Unit tests for `generateSkillsSuggestion()` with various skill inputs
  - [ ] Unit tests for skill extraction and comparison logic
  - [ ] Integration tests for `/api/suggestions/skills` endpoint
  - [ ] Test timeout behavior (60s limit)
  - [ ] Test prompt injection defense (XML wrapping)
  - [ ] Test error codes (VALIDATION_ERROR, LLM_TIMEOUT, LLM_ERROR, PARSE_ERROR)
  - [ ] E2E tests for full optimization flow including Skills

## Dev Notes

### Architecture Compliance

**From project-context.md:**
- **API pattern:** Use `/api/suggestions/skills` route (60-second timeout required)
- **Response format:** MUST use ActionResponse<T> - never throw
- **Error codes:** Use standardized codes (LLM_TIMEOUT, LLM_ERROR, VALIDATION_ERROR, PARSE_ERROR)
- **LLM security:** User content server-side only, wrap in XML tags
- **Directory structure:** `/lib/ai/` for ALL LLM operations (isolated, server-only)

**From epics.md (Story 6.3):**
- As a user, I want optimized suggestions for my skills section
- Skills are organized and prioritized based on JD relevance
- Missing relevant skills are highlighted (if user has related experience)
- Format matches professional resume standards
- Response follows ActionResponse<T>

**From architecture patterns:**
- Use kebab-case for API routes: `/api/suggestions/skills` ✓
- Use camelCase for TypeScript: `generateSkillsSuggestion`, `extractSkillsFromResume` ✓
- Use PascalCase for components: `SkillsOptimization` ✓
- All LLM calls server-side in `/lib/ai/` - never client-side ✓

### Technical Requirements

**Skills Section Complexity:**
Skills sections can vary widely:
- Bullet list format: "Python, JavaScript, React"
- Tagged format: "Technical: Python, JavaScript; Soft Skills: Leadership, Communication"
- Paragraph format: "I am proficient in Python, JavaScript, and React"
- Hybrid with proficiency levels: "Python (Expert), JavaScript (Intermediate)"

The implementation must handle this variety.

**LLM Prompt Design:**
The skills optimization prompt must:
1. Extract skills from the resume content
2. Parse job description for required skills
3. Identify matching skills (already present)
4. Identify missing but relevant skills (user has experience with)
5. Suggest adding relevant skills (with confidence level)
6. Consider removing lower-relevance skills
7. Maintain authenticity (only include skills user actually has)
8. Return structured format: `{ existing, matched, missing, additions, removals }`

**Example Prompt Structure:**
```
You are a resume optimization expert specializing in skills section optimization.

[Resume Content]
{resume_content}

[Current Skills Section]
{current_skills}

[Job Description]
{job_description}

[Analysis Task]
1. Extract all skills mentioned in the resume
2. Identify which skills match the job description requirements
3. Identify which skills from the JD are missing from the resume
4. Based on the resume content, suggest additional skills the user likely has experience with
5. Suggest removing skills that are lower priority for this role

[Output Format - JSON]
{
  "existing_skills": ["skill1", "skill2"],
  "matched_keywords": ["keyword1", "keyword2"],
  "missing_but_relevant": [
    { "skill": "Docker", "reason": "used by DevOps role, you have containerization experience" }
  ],
  "skill_additions": ["skill1", "skill2"],
  "skill_removals": [{ "skill": "SkillName", "reason": "less relevant for this role" }],
  "summary": "You have 8/12 key skills. Consider adding Docker and Kubernetes."
}
```

**Security Boundaries:**
- Wrap resume content in `<user_content>${content}</user_content>`
- Wrap JD in `<job_description>${jd}</job_description>`
- Never expose Anthropic API key to frontend
- Use `/lib/ai/` functions only from API routes or server actions
- Validate all inputs on server before LLM call

**Database Integration:**
```sql
-- Migration: Add skills_suggestion column to sessions table
ALTER TABLE sessions ADD COLUMN skills_suggestion JSONB;
CREATE INDEX idx_sessions_skills ON sessions(skills_suggestion);

-- Update query:
UPDATE sessions SET
  skills_suggestion = {
    "existing_skills": [...],
    "matched_keywords": [...],
    "missing_but_relevant": [...],
    "skill_additions": [...],
    "skill_removals": [...],
    "summary": "..."
  },
  updated_at = now()
WHERE session_id = $1 AND anonymous_id = $2;
```

**Error Handling Flow:**
```
Input Validation (session_id, resume, JD, skills)
  ↓ (error) → VALIDATION_ERROR
  ↓ (ok)
Generate Skills Suggestion (with 60s timeout)
  ↓ (timeout) → LLM_TIMEOUT
  ↓ (LLM error) → LLM_ERROR
  ↓ (parse error) → PARSE_ERROR
  ↓ (success)
Update Session in Supabase
  ↓ (db error) → LLM_ERROR (log but don't fail to user)
  ↓ (success)
Return SkillsSuggestion
```

### File Structure

```
/lib/ai/generateSkillsSuggestion.ts       ← New LLM function
/lib/ai/extractSkillsFromResume.ts        ← Skill parsing utility
/app/api/suggestions/skills/route.ts      ← New API endpoint
/components/shared/SkillsOptimization.tsx ← Component for display [may defer]
/types/suggestions.ts                      ← Update with SkillsSuggestion type
/types/optimization.ts                     ← Add skillsSuggestion to OptimizationSession
/tests/api/suggestions-skills.spec.ts     ← API tests
/tests/unit/ai/skills-generation.spec.ts  ← Unit tests
/supabase/migrations/*.sql                 ← Database migration
```

### Previous Story Intelligence

**From Epic 6.2 (just completed):**
- `/api/suggestions/summary` provides single-section optimization pattern to follow
- ActionResponse pattern consistently applied throughout
- Error handling uses standardized codes
- Session persistence via `updateSession()` helper works reliably
- Timeout mechanism uses `Promise.race()` pattern (reference for implementation)
- XML wrapping for user content prevents prompt injection
- Zustand store updates happen after successful optimization
- Deferred frontend UI to later story (Tasks 6-7)

**From Epic 6.1:**
- Full LLM pipeline orchestration pattern
- 60-second timeout with graceful error handling
- Token usage logging infrastructure (if needed)
- Comprehensive test coverage for both success and error paths
- API route timeout handling using `Promise.race()`

**Key learnings from 6-1 and 6-2:**
- Smaller focused prompts (one section) are more reliable than full optimization
- LLM calls can take 10-30s depending on content length and complexity
- Timeout needs to be 60s to allow for network delays + LLM processing
- Session updates should not fail the request (graceful degradation)
- Response parsing must handle varying JSON structures from LLM
- Skills section requires special handling due to format variations

**Pattern to follow:**
- Use `/lib/ai/*.ts` for all LLM orchestration
- Wrap user content in XML tags immediately
- Return ActionResponse<T> at route level
- No throws - all errors as return values
- Test with both success and error paths
- Handle various input formats gracefully

### Git Intelligence

**Recent commits showing established patterns:**
- `ea02692` - feat(story-6-2): Summary Section Suggestions (backend API complete)
- `72fa9a8` - feat(story-6-1): LLM pipeline API route (full orchestration)
- `813645a` - feat(5-5): Epic 5 integration testing (comprehensive validation)
- `78800a8` - feat(5-4): Gap analysis display (keyword insights)

**Code patterns in recent work:**
- API routes accept parsed JSON with try-catch for malformed input
- LLM calls use `Promise.race(llmCall, timeoutPromise)` for timeout enforcement
- Session updates use service client (not anon key) for RLS enforcement
- Components use Zustand for state, `useTransition` for async operations
- All error objects have both `code` and `message` fields
- Tests verify both success and error paths comprehensively
- Type safety through TypeScript interfaces (no `any` types)

**Files modified in related stories:**
- `/lib/ai/*.ts` - Established pattern: function returns ActionResponse<T>, wraps user content in XML
- `/app/api/suggestions/*.ts` - Routes handle timeout, validation, error codes
- `/types/suggestions.ts` - Type definitions for suggestion responses
- `/types/optimization.ts` - Session type includes all suggestion types
- `/lib/supabase/sessions.ts` - Handles session persistence with camelCase transformation

**Timeout pattern established in 6-1 and 6-2:**
```typescript
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('LLM_TIMEOUT')), ms)
    )
  ]);
};
```

### Latest Technical Information

**LangChain & Anthropic Claude API (v0.2+):**
- Claude 3.5 Sonnet (newer: 4) recommended for nuanced writing tasks
- Use `ChatAnthropic` from `@langchain/anthropic` for chat-style prompts
- Token limits: Sonnet 200k context, track input/output separately
- System prompts vs messages: System for core instructions, messages for context
- JSON parsing: Use `.with_structured_output()` for guaranteed JSON returns
- Temperature: 0.3-0.7 for slightly creative but controlled suggestions (as in 6-2)

**Skills Parsing Approaches:**
1. **Regex-based:** Fast, deterministic, but misses context
2. **LLM-based:** Slower but handles natural language variations
3. **Hybrid:** Use heuristics for structured sections, LLM for paragraph format

Most resume skills sections are structured → recommend hybrid approach:
- Heuristic: If line starts with "Skills:" or bullets, parse directly
- LLM: If paragraph format, use LLM to extract

**Skill Categories:**
- Technical skills: Programming languages, frameworks, databases
- Tools/Platforms: AWS, Docker, GitHub, etc.
- Soft skills: Leadership, Communication, Teamwork
- Domain expertise: Industry-specific skills
- Language proficiency: Foreign languages, certification level

**Supabase Best Practices for this story:**
- Use `createClient(url, serviceRole)` in API routes (server-side only)
- JSONB columns automatically index nested fields
- RLS policies: `WHERE anonymous_id = ?` for anon users
- Batch updates: Single UPDATE for entire suggestion object
- Audit trail: Always set `updated_at = now()`

**Frontend Optimization Patterns (for Tasks 6-7):**
- `useTransition()` for async operations (built-in loading state)
- `startTransition(() => { const result = await action() })` pattern
- Store suggestions in Zustand immediately after fetch
- Show "Apply suggestions" button only when suggestion exists
- "Regenerate" calls same endpoint again (idempotent)
- Consider multi-select for skill additions (user can pick which to add)

### References

- [Source: epics.md#Story 6.3] - Full acceptance criteria and user story
- [Source: epics.md#Story 6.2] - Previous story context (6-2 just completed)
- [Source: epics.md#Story 6.1] - Full pipeline pattern reference
- [Source: project-context.md] - ActionResponse pattern, error codes, LLM security
- [Source: _bmad-output/planning-artifacts/architecture/architecture-patterns.md] - API patterns, naming conventions
- [Source: _bmad-output/implementation-artifacts/6-2-implement-summary-section-suggestions.md] - Reference for single-section optimization pattern
- [Source: _bmad-output/implementation-artifacts/6-1-implement-llm-pipeline-api-route.md] - Reference for full pipeline and error handling
- [Source: lib/ai/*.ts] - Existing LLM function patterns to follow
- [Source: lib/supabase/sessions.ts] - Session persistence pattern
- [Source: types/optimization.ts] - OptimizationSession type definition

---

## File List

- `lib/ai/generateSkillsSuggestion.ts` - New LLM function for skills optimization
- `lib/ai/extractSkillsFromResume.ts` - Utility for parsing skills from resume
- `app/api/suggestions/skills/route.ts` - New API route
- `types/suggestions.ts` - SkillsSuggestion type (update)
- `types/optimization.ts` - OptimizationSession with skillsSuggestion field (update)
- `lib/supabase/sessions.ts` - Session update support (update)
- `supabase/migrations/[timestamp]_add_skills_suggestion_column.sql` - Database migration
- `tests/api/suggestions-skills.spec.ts` - Integration tests
- `tests/unit/ai/skills-generation.spec.ts` - Unit tests
- `components/shared/SkillsOptimization.tsx` - UI component [may defer]

---

## Change Log

- 2026-01-25: Story 6-3 created with comprehensive developer context
  - 10 detailed acceptance criteria
  - 8 implementation tasks with subtasks
  - Complete technical requirements for skills optimization
  - Skill parsing strategy (hybrid approach)
  - Prompt design for skills matching and gap analysis
  - Security boundaries clearly defined
  - Learnings from previous stories (6-1, 6-2) documented
  - Git intelligence showing patterns to follow
  - Latest technical information for LangChain, skills parsing, and Supabase
  - Full file structure and references provided
  - Notes on deferring frontend UI (Tasks 6-7) to later story

---

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Implementation Readiness

**Status:** ready-for-dev - Comprehensive context provided for implementation

**Dependencies Satisfied:**
- ✅ 6-1 (LLM Pipeline API) completed
- ✅ 6-2 (Summary Suggestions) completed and merged
- ✅ Project-context.md provides all critical rules
- ✅ Architecture patterns established
- ✅ Type system ready (OptimizationSession, ActionResponse)
- ✅ Database migrations available (migration pattern from 6-2)
- ✅ Test framework ready (Vitest + Playwright)

**Context Completeness:**
- ✅ Clear acceptance criteria (10 items)
- ✅ Task breakdown (8 tasks with subtasks)
- ✅ Technical requirements documented
- ✅ Prompt design provided
- ✅ Error handling flow shown
- ✅ File structure specified
- ✅ Previous learnings documented
- ✅ Git patterns identified
- ✅ Latest tech info included

**Ready for:** Dev agent to begin Task 1 (analysis) and implement through Task 8 (testing)

---

## Story Summary

This story implements AI-generated suggestions for the Skills section of a resume, helping users better align their skills with job requirements. Following the pattern established in 6-1 and 6-2, it provides:

- **Backend API:** `/api/suggestions/skills` with 60-second timeout
- **LLM Function:** `generateSkillsSuggestion()` with skill matching and gap analysis
- **Database:** `skills_suggestion` JSONB column in sessions table
- **Utilities:** `extractSkillsFromResume()` for parsing various skill formats
- **Tests:** Comprehensive coverage of all scenarios
- **UI:** Deferred to later story (can follow same pattern as 6-2)

Skills optimization is more complex than Summary due to format variations, but follows the same architectural patterns established in previous stories.
