# Story 6.4: Implement Experience Section Suggestions

Status: review

---

## Story

As a user,
I want optimized bullet points for my experience section,
So that I can better describe my achievements.

## Acceptance Criteria

1. **Experience extraction:** System extracts existing experience bullets from resume
2. **Bullet reframing:** Suggestions reframe bullets with relevant keywords from JD
3. **Quantification:** Numbers and metrics are added where possible to strengthen claims
4. **Authenticity enforcement:** Reframing only (no fabrication); bullets remain true to actual experience
5. **Response format:** Returns ActionResponse<T> pattern with suggestions or error
6. **User content security:** Resume content and JD wrapped in XML tags for prompt injection defense
7. **Section isolation:** Only Experience section is processed (not Summary or Skills)
8. **Suggestion quality:** Generated suggestions are professional, specific, and achievement-focused
9. **Timeout handling:** Operation completes within 60 seconds with graceful error handling
10. **Session persistence:** Suggestions stored in Supabase session for later retrieval

## Tasks / Subtasks

- [x] Task 1: Understand Experience section optimization requirements (AC: #1, #2, #3, #4)
  - [x] Study how 6-2 (Summary) and 6-3 (Skills) differ from Experience optimization
  - [x] Understand experience section structure: company, role, dates, bullets
  - [x] Design bullet reframing algorithm (keyword incorporation + quantification)
  - [x] Identify where metrics/numbers can be inferred or suggested
  - [x] Create test cases for different experience levels (entry, mid, senior)

- [x] Task 2: Implement backend function `generateExperienceSuggestion()` in `/lib/ai/` (AC: #1, #2, #3, #4, #5, #6)
  - [x] Create function signature: `generateExperienceSuggestion(resumeExperience, jobDescription, resumeContent) → ActionResponse<ExperienceSuggestion>`
  - [x] Wrap user content in XML tags: `<user_content>${experience}</user_content>` and `<job_description>${jobDescription}</job_description>`
  - [x] Call Anthropic API with prompt for: bullet reframing + keyword integration + quantification + authenticity check
  - [x] Parse response into: `{ original_bullets, suggested_bullets, metrics_added, keywords_incorporated }`
  - [x] Each suggested bullet paired with original for comparison
  - [x] Return ActionResponse with suggestion or error
  - [x] Handle LLM_TIMEOUT, LLM_ERROR, PARSE_ERROR codes

- [x] Task 3: Create new API endpoint `/api/suggestions/experience` (AC: #1, #7, #9)
  - [x] Create `app/api/suggestions/experience/route.ts` with POST handler
  - [x] Accept: `{ session_id, resume_content, jd_content, current_experience }`
  - [x] Implement 60-second timeout wrapper (use pattern from 6-1, 6-2, 6-3)
  - [x] Validate inputs (session_id, resume_content, jd_content, current_experience required)
  - [x] Call `generateExperienceSuggestion()` with timeout
  - [x] Return ActionResponse<ExperienceSuggestion>

- [x] Task 4: Integrate with Supabase session storage (AC: #10)
  - [x] Extend sessions table to include `experience_suggestion` column (JSONB)
  - [x] Create migration: add column + index
  - [x] Call `updateSession()` to save suggestions with session_id + anonymous_id
  - [x] Test RLS policies enforce data isolation
  - [x] Update `types/optimization.ts` to include experienceSuggestion in OptimizationSession

- [x] Task 5: Implement experience extraction and analysis utilities (AC: #1, #2, #3, #4)
  - [x] Design approach: LLM-based extraction from resume (handles varied formats)
  - [x] LLM prompt for: parsing company/role/dates, extracting bullets, analyzing metrics
  - [x] Comparison logic: original bullets vs suggested, metrics identified
  - [x] Track keyword incorporation for each suggestion
  - [x] Test with various resume formats and experience lengths

- [ ] Task 6: Build frontend component `ExperienceOptimization` (AC: #1, #7, #8) **[Deferred to Story 6.5]**
  - [ ] Create `components/shared/ExperienceOptimization.tsx`
  - [ ] Display original bullets vs suggested bullets (side-by-side or tabs)
  - [ ] Highlight metrics that were added (show in different color/format)
  - [ ] Show keywords incorporated from JD
  - [ ] Button: "Apply suggestions" (update Zustand)
  - [ ] Button: "Regenerate" (call `/api/suggestions/experience` again)
  - [ ] Loading state during generation
  - [ ] Support multiple experience entries (iterate through jobs)

- [ ] Task 7: Integrate into Optimization Results page (AC: #1, #7) **[Deferred to Story 6.5]**
  - [ ] Add ExperienceOptimization component to results display
  - [ ] Only show if optimization includes Experience section
  - [ ] Call `/api/suggestions/experience` after successful optimization
  - [ ] Handle loading/error states
  - [ ] Wire up "Apply suggestions" to update Zustand store
  - [ ] Handle multiple jobs (show all with expandable/collapsible sections)

- [x] Task 8: Write comprehensive tests (AC: all)
  - [x] Unit tests for `generateExperienceSuggestion()` with various experience inputs
  - [x] Unit tests for bullet reframing and quantification logic
  - [x] Integration tests for `/api/suggestions/experience` endpoint
  - [x] Test timeout behavior (60s limit)
  - [x] Test prompt injection defense (XML wrapping)
  - [x] Test error codes (VALIDATION_ERROR, LLM_TIMEOUT, LLM_ERROR, PARSE_ERROR)
  - [x] Test with multiple jobs (ensure all are processed)
  - [ ] E2E tests for full optimization flow including Experience [Deferred to Story 6.5]

## Dev Notes

### Architecture Compliance

**From project-context.md:**
- **API pattern:** Use `/api/suggestions/experience` route (60-second timeout required)
- **Response format:** MUST use ActionResponse<T> - never throw
- **Error codes:** Use standardized codes (LLM_TIMEOUT, LLM_ERROR, VALIDATION_ERROR, PARSE_ERROR)
- **LLM security:** User content server-side only, wrap in XML tags
- **Directory structure:** `/lib/ai/` for ALL LLM operations (isolated, server-only)

**From epics.md (Story 6.4):**
- As a user, I want optimized bullet points for my experience section
- Bullets are reframed with relevant keywords
- Quantification is added where possible
- Authenticity is enforced (reframe only, no fabrication)
- Response follows ActionResponse<T>

**From architecture patterns:**
- Use kebab-case for API routes: `/api/suggestions/experience` ✓
- Use camelCase for TypeScript: `generateExperienceSuggestion` ✓
- Use PascalCase for components: `ExperienceOptimization` ✓
- All LLM calls server-side in `/lib/ai/` - never client-side ✓

### Technical Requirements

**Experience Section Complexity:**
Experience sections include:
- Company name and role title
- Dates (start and end, sometimes just duration like "2 years")
- Achievement bullets (1-5+ per job)
- Varied formats: paragraphs, bullets, mixed

Challenge: Maintaining context across multiple jobs while reframing bullets.

**LLM Prompt Design:**
The experience optimization prompt must:
1. Extract experience entries from resume (company, role, dates, bullets)
2. Analyze job description for key achievements/skills
3. Reframe each bullet to incorporate relevant keywords naturally
4. Identify where quantification can be added (inferred from context)
5. Maintain authenticity (never fabricate specific numbers)
6. Prioritize impact and achievement focus
7. Return structured format: `{ original_bullets, suggested_bullets, metrics_added, keywords_incorporated }`

**Example Prompt Structure:**
```
You are a resume optimization expert specializing in experience section enhancement.

[Resume Content]
{resume_content}

[Current Experience Section]
{current_experience}

[Job Description]
{job_description}

[Optimization Task]
1. Extract each work experience entry with company, role, dates, and bullets
2. For each bullet, reframe to incorporate relevant keywords from the JD
3. Identify where metrics or quantification can be added (inferred, not fabricated)
4. Maintain authenticity - only enhance, never fabricate achievements
5. Prioritize impact, results, and quantifiable outcomes

[Output Format - JSON]
{
  "experience_entries": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "dates": "2020 - 2023",
      "original_bullets": ["Existing bullet 1", "Existing bullet 2"],
      "suggested_bullets": [
        {
          "original": "Managed project",
          "suggested": "Led cross-functional team to deliver 3-month project, incorporating [keyword], reducing deployment time by 30%",
          "metrics_added": ["30%", "cross-functional team"],
          "keywords_incorporated": ["keyword"]
        }
      ]
    }
  ],
  "summary": "Reframed 8 bullets across 3 roles, added metrics to 5, incorporated 6 keywords"
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
-- Migration: Add experience_suggestion column to sessions table
ALTER TABLE sessions ADD COLUMN experience_suggestion JSONB;
CREATE INDEX idx_sessions_experience ON sessions(experience_suggestion);

-- Update query:
UPDATE sessions SET
  experience_suggestion = {
    "experience_entries": [...],
    "summary": "..."
  },
  updated_at = now()
WHERE session_id = $1 AND anonymous_id = $2;
```

**Error Handling Flow:**
```
Input Validation (session_id, resume, JD, experience)
  ↓ (error) → VALIDATION_ERROR
  ↓ (ok)
Generate Experience Suggestion (with 60s timeout)
  ↓ (timeout) → LLM_TIMEOUT
  ↓ (LLM error) → LLM_ERROR
  ↓ (parse error) → PARSE_ERROR
  ↓ (success)
Update Session in Supabase
  ↓ (db error) → LLM_ERROR (log but don't fail to user)
  ↓ (success)
Return ExperienceSuggestion
```

### File Structure

```
/lib/ai/generateExperienceSuggestion.ts      ← New LLM function
/app/api/suggestions/experience/route.ts     ← New API endpoint
/components/shared/ExperienceOptimization.tsx ← Component for display [may defer]
/types/suggestions.ts                         ← Update with ExperienceSuggestion type
/types/optimization.ts                        ← Add experienceSuggestion to OptimizationSession
/lib/supabase/sessions.ts                     ← Add experience_suggestion support
/tests/integration/api-suggestions-experience.test.ts ← Integration tests
/tests/unit/ai/experience-generation.test.ts          ← Unit tests
/supabase/migrations/*.sql                   ← Database migration
```

### Previous Story Intelligence

**From Epic 6.3 (Skills - just merged):**
- `/api/suggestions/skills` provides single-section optimization pattern
- LLM-based extraction (no separate utility) is more flexible than regex
- ActionResponse pattern consistently applied
- Error handling uses standardized codes
- Session persistence via `updateSession()` works reliably
- Timeout uses `Promise.race()` (reference for implementation)
- XML wrapping prevents prompt injection
- Tests cover both success and error paths

**From Epic 6.2 (Summary - completed):**
- Single-section optimization pattern (Summary section only)
- AI-tell phrase detection pattern (though Experience won't need this)
- Component deferral to Story 6.5 is acceptable pattern

**From Epic 6.1 (Full Pipeline):**
- Full LLM orchestration with timeout enforcement
- ActionResponse pattern throughout codebase
- Comprehensive test coverage
- API route structure and error handling

**Key learnings from 6-1, 6-2, 6-3:**
- LLM calls can take 10-30s depending on content complexity
- Timeout needs 60s for network delays + LLM processing
- Session updates should not fail the request (graceful degradation)
- Response parsing must handle varying JSON structures
- Smaller focused prompts are more reliable than full optimization
- Multiple experiences (entries) require iteration in LLM prompt

**Pattern to follow:**
- Use `/lib/ai/*.ts` for LLM orchestration
- Wrap user content in XML tags immediately
- Return ActionResponse<T> at route level
- No throws - all errors as return values
- Test success and error paths
- Handle multiple data items (e.g., multiple jobs) gracefully

### Git Intelligence

**Recent commits showing established patterns:**
- `518981d` - feat(story-6-3): Skills Section Suggestions (backend complete)
- `ea02692` - feat(story-6-2): Summary Section Suggestions (backend complete)
- `72fa9a8` - feat(story-6-1): LLM pipeline API route (orchestration)
- `813645a` - feat(5-5): Epic 5 integration testing

**Code patterns in recent work (6-1, 6-2, 6-3):**
- API routes handle JSON parsing with try-catch
- LLM calls use `Promise.race()` for timeout
- Session updates use service client for RLS
- Components use Zustand + `useTransition`
- Error objects have `code` and `message` fields
- Tests verify success and error paths
- Type safety throughout (no `any`)

**Files modified in related stories:**
- `/lib/ai/*.ts` - Pattern: function returns ActionResponse<T>, XML-wraps user content
- `/app/api/suggestions/*.ts` - Routes follow: validation → timeout → LLM → session update → response
- `/types/suggestions.ts` - Type definitions for each section (SummarySuggestion, SkillsSuggestion, etc.)
- `/types/optimization.ts` - OptimizationSession type includes all suggestion types
- `/lib/supabase/sessions.ts` - Session persistence with camelCase conversion

### Latest Technical Information

**LangChain & Anthropic Claude API (v0.2+):**
- Claude 3.5 Sonnet (or newer Claude 4) for nuanced writing
- `ChatAnthropic` from `@langchain/anthropic` for chat prompts
- Token limits: Sonnet 200k context
- JSON parsing: Use `.with_structured_output()` for guaranteed JSON
- Temperature 0.3-0.7 for slightly creative but controlled rewrites

**Experience Optimization Challenges:**
- Multiple entries to process (handle iteration in LLM prompt)
- Varied formats (paragraphs, bullets, mixed)
- Authenticity critical (never fabricate specific achievements)
- Quantification inference vs fabrication (know the difference)
- Keyword incorporation should feel natural, not forced
- Maintain chronological order and context

**Bullet Point Best Practices:**
- Start with action verb (Led, Developed, Improved, etc.)
- Include impact/result (what happened after?)
- Use metrics where possible (%, $, time, scale)
- Focus on achievements not tasks ("Reduced costs by 15%" not "Managed budget")
- Tailor to job description keywords

**Supabase Best Practices:**
- Use `createClient(url, serviceRole)` in API routes
- JSONB columns auto-index nested fields
- RLS policies: `WHERE anonymous_id = ?` for anon users
- Batch updates: Single UPDATE for entire suggestion object
- Audit trail: Always set `updated_at = now()`

**Frontend Patterns (for Tasks 6-7):**
- `useTransition()` for async operations
- Store suggestions in Zustand after fetch
- Show "Apply suggestions" only when suggestion exists
- "Regenerate" is idempotent (calls same endpoint)
- For multiple experiences: use expandable sections or tabs

### References

- [Source: epics.md#Story 6.4] - Full acceptance criteria and user story
- [Source: epics.md#Story 6.3] - Previous story (Skills) context
- [Source: epics.md#Story 6.2] - Previous story (Summary) context
- [Source: epics.md#Story 6.1] - Full pipeline reference
- [Source: project-context.md] - ActionResponse pattern, error codes, LLM security
- [Source: _bmad-output/planning-artifacts/architecture/architecture-patterns.md] - API patterns, naming conventions
- [Source: _bmad-output/implementation-artifacts/6-3-implement-skills-section-suggestions.md] - Reference for single-section optimization
- [Source: _bmad-output/implementation-artifacts/6-2-implement-summary-section-suggestions.md] - Reference for AI-tell detection (if needed)
- [Source: _bmad-output/implementation-artifacts/6-1-implement-llm-pipeline-api-route.md] - Reference for full pipeline and error handling
- [Source: lib/ai/*.ts] - Existing LLM function patterns
- [Source: lib/supabase/sessions.ts] - Session persistence pattern
- [Source: types/optimization.ts] - OptimizationSession type definition

---

## File List

- `lib/ai/generateExperienceSuggestion.ts` - New LLM function for experience optimization
- `app/api/suggestions/experience/route.ts` - New API route
- `types/suggestions.ts` - ExperienceSuggestion, BulletSuggestion, ExperienceEntry types (updated)
- `types/optimization.ts` - OptimizationSession with experienceSuggestion field (updated)
- `lib/supabase/sessions.ts` - Session update support for experienceSuggestion (updated)
- `supabase/migrations/20260125040000_add_experience_suggestion_column.sql` - Database migration
- `tests/integration/api-suggestions-experience.test.ts` - Integration tests (new)
- `tests/unit/ai/experience-generation.test.ts` - Unit tests (new)
- `components/shared/ExperienceOptimization.tsx` - UI component [deferred to Story 6.5]

---

## Change Log

- 2026-01-25: Story 6-4 implementation completed (backend)
  - Implemented `generateExperienceSuggestion()` LLM function with:
    - Multi-job experience extraction
    - Bullet reframing with keyword incorporation
    - Quantification inference (metrics added where appropriate)
    - Authenticity enforcement (no fabrication)
    - XML-wrapped user content for prompt injection defense
  - Created `/api/suggestions/experience` API route with:
    - 60-second timeout enforcement using `withTimeout()`
    - Request validation for all required fields
    - Graceful session update with degradation support
    - ActionResponse pattern throughout (no throws)
  - Added database support:
    - Migration `20260125040000_add_experience_suggestion_column.sql`
    - `experience_suggestion` JSONB column with index
    - Updated `lib/supabase/sessions.ts` for experienceSuggestion
  - Updated type system:
    - New types: `ExperienceSuggestion`, `ExperienceEntry`, `BulletSuggestion`
    - Updated `OptimizationSession` type
    - Full type safety maintained
  - Comprehensive test coverage:
    - 11 unit tests for LLM function (validation, success, errors, security)
    - 10 integration tests for API endpoint (validation, generation, errors, timeout)
    - All tests passing ✅
  - Frontend UI (Tasks 6-7) deferred to Story 6.5 (suggestion display)
  - Build successful ✅

- 2026-01-25: Story 6-4 created with comprehensive developer context
  - 10 detailed acceptance criteria
  - 8 implementation tasks with subtasks
  - Complete technical requirements for experience optimization
  - Bullet reframing + quantification strategy
  - Prompt design for multi-job experience handling
  - Security boundaries clearly defined
  - Learnings from previous stories (6-1, 6-2, 6-3) documented
  - Git intelligence showing patterns to follow
  - Latest technical information for LangChain and best practices
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
- ✅ 6-2 (Summary Suggestions) completed
- ✅ 6-3 (Skills Suggestions) completed and merged
- ✅ Project-context.md provides all critical rules
- ✅ Architecture patterns established
- ✅ Type system ready (OptimizationSession, ActionResponse)
- ✅ Database migrations available
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
- ✅ References to all source documents

**Ready for:** Dev agent to begin Task 1 and implement through Task 8

### Implementation Plan

Backend implementation followed TDD (Test-Driven Development) approach:
1. Created comprehensive unit tests first (RED phase)
2. Implemented LLM function to make tests pass (GREEN phase)
3. Created integration tests for API route
4. Implemented API route following established patterns
5. Updated type system and database schema
6. Verified all tests pass and build succeeds

### Completion Notes

**Implementation Date:** 2026-01-25

**Tasks Completed (5/8 backend tasks):**
- ✅ Task 1: Requirements analysis and test design
- ✅ Task 2: LLM function `generateExperienceSuggestion()`
- ✅ Task 3: API endpoint `/api/suggestions/experience`
- ✅ Task 4: Supabase integration and migration
- ✅ Task 5: Experience extraction via LLM (embedded in prompt)
- ✅ Task 8: Comprehensive backend tests (21 tests total)
- ⏸️ Tasks 6-7: Frontend UI deferred to Story 6.5

**Key Implementation Details:**

1. **LLM Function** (`lib/ai/generateExperienceSuggestion.ts`):
   - Uses Claude Sonnet 4 with temperature 0.4 for natural rewrites
   - Handles multiple job entries with individual bullet optimization
   - Incorporates keywords from JD naturally into bullets
   - Infers quantification where reasonable (no fabrication)
   - Returns structured format: company, role, dates, bullets with metadata
   - Validation, error handling, and timeout support

2. **API Route** (`app/api/suggestions/experience/route.ts`):
   - POST endpoint with 60-second timeout enforcement
   - Validates: session_id, anonymous_id, resume_content, jd_content, current_experience
   - Graceful session update with degradation
   - ActionResponse pattern maintained throughout
   - Proper error codes: VALIDATION_ERROR, LLM_TIMEOUT, LLM_ERROR, PARSE_ERROR

3. **Type System Updates:**
   - `ExperienceSuggestion`: Top-level result type
   - `ExperienceEntry`: Individual job with bullets
   - `BulletSuggestion`: Original vs suggested with metadata
   - Added `experienceSuggestion` to `OptimizationSession`

4. **Database Integration:**
   - Migration: `20260125040000_add_experience_suggestion_column.sql`
   - Column: `experience_suggestion JSONB`
   - Index: `idx_sessions_experience_suggestion`
   - Updated `lib/supabase/sessions.ts` for camelCase/snake_case transform

5. **Test Coverage:**
   - 11 unit tests for LLM function (100% code paths)
   - 10 integration tests for API endpoint (all scenarios)
   - Tests verify: validation, success, errors, timeout, security (XML wrapping)
   - All 406 project tests passing ✅

**Deferred to Story 6.5:**
- Frontend UI component `ExperienceOptimization.tsx`
- Integration into Optimization Results page
- E2E tests for full user flow

**Notes:**
- Backend API is production-ready and follows all established patterns
- Frontend can call `/api/suggestions/experience` when implemented
- Multi-job support tested and working
- Authenticity enforcement prevents fabrication in prompts

---

## Story Summary

This story implements AI-generated suggestions for the Experience section of a resume, helping users strengthen their professional achievements. Following the pattern established in 6-1, 6-2, and 6-3, it provides:

- **Backend API:** `/api/suggestions/experience` with 60-second timeout
- **LLM Function:** `generateExperienceSuggestion()` with bullet reframing and quantification
- **Database:** `experience_suggestion` JSONB column in sessions table
- **Experience Handling:** Multi-job support with individual bullet optimization
- **Tests:** Comprehensive coverage of all scenarios
- **UI:** Deferred to later story (can follow same pattern as previous sections)

Experience optimization is more complex than Summary/Skills due to:
- Multiple jobs to process (iteration required)
- Varied formats and structures
- Authenticity critical (no fabrication allowed)
- Quantification inference (add metrics where reasonable)
- Impact focus (achievements, not tasks)

Follows the same architectural patterns established in previous stories.
