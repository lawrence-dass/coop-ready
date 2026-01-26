# Story 6.2: Implement Summary Section Suggestions

Status: ready-for-dev

---

## Story

As a user,
I want optimized suggestions for my professional summary,
So that I can improve my resume's opening statement.

## Acceptance Criteria

1. **Suggestion generation:** Frontend triggers optimization for Summary section only
2. **Keyword integration:** Suggestions incorporate relevant keywords from the job description
3. **Authenticity enforcement:** Suggestions reframe existing experience (no fabrication allowed)
4. **AI-tell detection:** AI-generated phrases are detected and rewritten for natural language
5. **Response format:** Returns ActionResponse<T> pattern with suggestions or error
6. **User content security:** Resume summary and JD wrapped in XML tags for prompt injection defense
7. **Section isolation:** Only Summary section is processed (not Skills or Experience)
8. **Suggestion quality:** Generated suggestions are coherent, professional, and relevant
9. **Timeout handling:** Operation completes within 60 seconds with graceful error handling
10. **Session persistence:** Suggestions stored in Supabase session for later retrieval

## Tasks / Subtasks

- [ ] Task 1: Understand the LLM prompt structure for Summary optimization (AC: #2, #3, #4)
  - [ ] Review existing LLM functions from Epic 5/6 for pattern consistency
  - [ ] Design prompt that reframes summary with keywords (no fabrication)
  - [ ] Design AI-tell phrase detection mechanism
  - [ ] Create test prompts to validate approach

- [ ] Task 2: Implement backend function `generateSummarySuggestion()` in `/lib/ai/` (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Create function signature: `generateSummarySuggestion(resumeSummary, jobDescription, keywords) → ActionResponse<SummarySuggestion>`
  - [ ] Wrap user content in XML tags: `<user_content>${resumeSummary}</user_content>` and `<job_description>${jobDescription}</job_description>`
  - [ ] Call Anthropic API with prompt for: reframing with keywords + authenticity check + AI-tell detection
  - [ ] Parse response into: `{ original, suggested, ats_keywords_added, ai_tell_phrases_rewritten }`
  - [ ] Return ActionResponse with suggestion or error
  - [ ] Handle LLM_TIMEOUT, LLM_ERROR, PARSE_ERROR codes

- [ ] Task 3: Create new API endpoint `/api/suggestions/summary` (AC: #1, #7, #9)
  - [ ] Create `app/api/suggestions/summary/route.ts` with POST handler
  - [ ] Accept: `{ session_id, resume_content, jd_content, current_summary }`
  - [ ] Implement 60-second timeout wrapper (use pattern from 6-1)
  - [ ] Validate inputs (session_id, resume_content, jd_content, current_summary required)
  - [ ] Call `generateSummarySuggestion()` with timeout
  - [ ] Return ActionResponse<SummarySuggestion>

- [ ] Task 4: Integrate with Supabase session storage (AC: #10)
  - [ ] Extend sessions table to include `summary_suggestion` column (JSONB)
  - [ ] Create migration: add column + index
  - [ ] Call `updateSession()` to save suggestions with session_id + anonymous_id
  - [ ] Test RLS policies enforce data isolation

- [ ] Task 5: Create AI-tell phrase detector utility (AC: #4)
  - [ ] Create `/lib/ai/detectAITellPhrases.ts` function
  - [ ] Common phrases to detect: "I have the pleasure...", "leverage my expertise...", "synergize...", etc.
  - [ ] Implement regex or LLM-based detection
  - [ ] Return detected phrases + suggested rewrites
  - [ ] Test with known AI-tell phrases

- [ ] Task 6: Build frontend component `SummaryOptimization` (AC: #1, #7, #8)
  - [ ] Create `components/shared/SummaryOptimization.tsx`
  - [ ] Display original summary + suggested summary side-by-side
  - [ ] Show which keywords from JD were added
  - [ ] Show AI-tell phrases that were rewritten
  - [ ] Button: "Use this suggestion" (copy to store)
  - [ ] Button: "Regenerate" (call /api/suggestions/summary again)
  - [ ] Loading state during generation

- [ ] Task 7: Integrate into Optimization Results page (AC: #1, #7)
  - [ ] Add SummaryOptimization component to results display
  - [ ] Only show if optimization includes Summary section
  - [ ] Call `/api/suggestions/summary` after successful optimization
  - [ ] Handle loading/error states
  - [ ] Wire up "Use this suggestion" to update resume in Zustand store

- [ ] Task 8: Write comprehensive tests (AC: all)
  - [ ] Unit tests for `generateSummarySuggestion()` with various inputs
  - [ ] Unit tests for AI-tell phrase detection
  - [ ] Integration tests for `/api/suggestions/summary` endpoint
  - [ ] Test timeout behavior (60s limit)
  - [ ] Test prompt injection defense (XML wrapping)
  - [ ] Test error codes (VALIDATION_ERROR, LLM_TIMEOUT, LLM_ERROR, PARSE_ERROR)
  - [ ] E2E tests for full optimization flow including Summary

## Dev Notes

### Architecture Compliance

**From project-context.md:**
- **API pattern:** Use `/api/suggestions/summary` route (60-second timeout required)
- **Response format:** MUST use ActionResponse<T> - never throw
- **Error codes:** Use standardized codes (LLM_TIMEOUT, LLM_ERROR, VALIDATION_ERROR, PARSE_ERROR)
- **LLM security:** User content server-side only, wrap in XML tags
- **Directory structure:** `/lib/ai/` for ALL LLM operations (isolated, server-only)

**From epics.md (Story 6.2):**
- As a user, I want optimized suggestions for my professional summary
- Suggestions incorporate relevant keywords from the JD
- Reframes existing experience (no fabrication)
- AI-tell phrases detected and rewritten
- Response follows ActionResponse<T>

**From architecture patterns:**
- Use kebab-case for API routes: `/api/suggestions/summary` ✓
- Use camelCase for TypeScript: `generateSummarySuggestion`, `detectAITellPhrases` ✓
- Use PascalCase for components: `SummaryOptimization` ✓
- All LLM calls server-side in `/lib/ai/` - never client-side ✓

### Technical Requirements

**LLM Prompt Design:**
The summary optimization prompt must:
1. Take original summary as input
2. Extract keywords from job description
3. Reframe the summary to incorporate 2-3 relevant keywords naturally
4. Maintain authenticity (only reframe, never fabricate skills)
5. Detect and rewrite AI-tell phrases for natural language
6. Return structured format: `{ original, suggested, keywords_added, ai_tell_rewrites }`

**Example Prompt Structure:**
```
You are a resume optimization expert. Your job is to improve resume summaries.

[Resume Summary]
{original_summary}

[Job Description]
{job_description}

[Key Requirements]
Identify 2-3 most relevant keywords from the job description.
Reframe the summary to naturally incorporate these keywords.
ONLY reframe existing experience - never fabricate or exaggerate.
Detect AI-generated phrases and rewrite them to sound more natural.

[Output Format]
Return JSON:
{
  "suggested": "New summary text incorporating keywords",
  "keywords_added": ["keyword1", "keyword2"],
  "ai_tell_rewrites": [
    { "detected": "I have the pleasure...", "rewritten": "I..." }
  ]
}
```

**Security Boundaries:**
- Wrap resume summary in `<user_content>${summary}</user_content>`
- Wrap JD in `<job_description>${jd}</job_description>`
- Never expose Anthropic API key to frontend
- Use `/lib/ai/` functions only from API routes or server actions
- Validate all inputs on server before LLM call

**Database Integration:**
```sql
-- Migration: Add summary_suggestion column to sessions table
ALTER TABLE sessions ADD COLUMN summary_suggestion JSONB;
CREATE INDEX idx_sessions_summary ON sessions(summary_suggestion);

-- Update query:
UPDATE sessions SET
  summary_suggestion = {
    "original": "...",
    "suggested": "...",
    "keywords_added": [...],
    "ai_tell_rewrites": [...]
  },
  updated_at = now()
WHERE session_id = $1 AND anonymous_id = $2;
```

**Error Handling Flow:**
```
Input Validation (session_id, resume, JD, summary)
  ↓ (error) → VALIDATION_ERROR
  ↓ (ok)
Generate Summary Suggestion (with 60s timeout)
  ↓ (timeout) → LLM_TIMEOUT
  ↓ (LLM error) → LLM_ERROR
  ↓ (parse error) → PARSE_ERROR
  ↓ (success)
Update Session in Supabase
  ↓ (db error) → LLM_ERROR (log but don't fail to user)
  ↓ (success)
Return SummarySuggestion
```

### File Structure

```
/lib/ai/generateSummarySuggestion.ts    ← New LLM function
/lib/ai/detectAITellPhrases.ts          ← Utility for phrase detection
/app/api/suggestions/summary/route.ts   ← New API endpoint
/components/shared/SummaryOptimization.tsx  ← Component for display
/types/suggestions.ts                   ← Type definitions (may exist)
/tests/api/suggestions-summary.spec.ts  ← API tests
/tests/lib/ai/summary-generation.spec.ts ← Unit tests
```

### Previous Story Intelligence

**From Epic 6.1 (just completed):**
- `/api/optimize` orchestrates the full pipeline: Parse → Analyze → Optimize
- ActionResponse pattern is consistently applied throughout
- Error handling uses standardized codes
- Session persistence via `updateSession()` helper works reliably
- Timeout mechanism uses `Promise.race()` pattern (reference for implementation)
- XML wrapping for user content prevents prompt injection
- Zustand store updates happen after successful optimization

**Key learnings from 6-1:**
- LLM calls can take 10-30s depending on content length
- Timeout needs to be 60s to allow for network delays + LLM processing
- Session updates should not fail the request (graceful degradation)
- Smaller focused prompts (Summary only) are more reliable than full optimization
- Response parsing must handle varying JSON structures from LLM

**Pattern established in 6-1 to follow:**
- Use `/lib/ai/*.ts` for all LLM orchestration
- Wrap user content in XML tags immediately
- Return ActionResponse<T> at route level
- No throws - all errors as return values
- Test with both success and error paths

### Git Intelligence

**Recent commits showing patterns:**
- `b033416` - feat(6-1): LLM pipeline with timeout + XML wrapping + token tracking
- `813645a` - feat(5-5): Epic 5 integration testing (end-to-end validation)
- `78800a8` - feat(5-4): Gap analysis with keyword insights
- `ef05374` - feat(5-3): ATS score display with visualization

**Code patterns in recent work:**
- API routes use `const response = await request.json()` with try-catch
- LLM calls use `Promise.race(llmCall, timeoutPromise)` for timeout
- Session updates use service client (not anon) for RLS
- Components use Zustand for state, `useTransition` for async
- All error objects have `code` and `message` fields
- Tests verify both success and error paths

**Files modified in related stories:**
- `/lib/ai/*.ts` - Established pattern for LLM functions
- `/app/api/optimize/route.ts` - Reference implementation for API route structure
- `/components/shared/*.tsx` - Pattern for suggestion display components
- `/store/*.ts` - Zustand store patterns for state management

### Latest Technical Information

**LangChain & Anthropic Claude API (v0.2+):**
- Claude 3.5 Sonnet recommended for nuanced writing tasks (faster than Opus)
- Use `ChatAnthropic` for conversation-style prompts
- Token limits: Sonnet 200k context, track input/output separately
- System prompts vs messages: Use system for core instructions, messages for context
- JSON parsing: Use `.with_structured_output()` for guaranteed JSON returns

**AI-Tell Phrase Detection Approaches:**
1. **Regex-based:** Fast, deterministic, limited coverage
2. **LLM-based:** Slower but catches nuanced cases
3. **Hybrid:** Check common phrases first (regex), use LLM for edge cases

Common AI-tell phrases to detect:
- "I have the pleasure..."
- "I am excited to..."
- "I am committed to..."
- "leverage my expertise"
- "synergize"
- "maximize efficiency"
- "utilize best practices"
- "passionate about"
- "dynamic environment"
- "multifaceted approach"

**Supabase Best Practices for this story:**
- Use `createClient(url, serviceRole)` in API routes (never expose anon key in backend)
- JSONB columns automatically index nested fields
- RLS policies: `WHERE user_id = auth.uid()` or `WHERE anonymous_id = ?` for anon users
- Batch updates: Single UPDATE for entire suggestion object, not multiple columns
- Audit trail: Always set `updated_at = now()` for traceability

**Frontend Optimization Patterns:**
- `useTransition()` for async operations (built-in loading state)
- `startTransition(() => { const result = await action() })` pattern
- Store suggestions in Zustand immediately after fetch (not in component state)
- Show "Use this suggestion" button only when suggestion exists
- "Regenerate" should call same endpoint again (idempotent)

### References

- [Source: epics.md#Story 6.2] - Full acceptance criteria and user story
- [Source: epics.md#Story 6.1] - Previous story context + patterns
- [Source: project-context.md] - ActionResponse pattern, error codes, LLM security
- [Source: _bmad-output/planning-artifacts/architecture/architecture-patterns.md] - API patterns, naming conventions
- [Source: _bmad-output/implementation-artifacts/6-1-implement-llm-pipeline-api-route.md] - Reference implementation for API route + error handling
- [Source: lib/ai/*.ts] - Existing LLM function patterns to follow
- [Source: components/shared/*.tsx] - Suggestion display component patterns

---

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Implementation Notes

This story builds directly on 6-1 by adding focused optimization for the Summary section. The main difference from the full pipeline is:
- Single section optimization (Summary only)
- Simpler prompt design (fewer steps)
- Faster execution (5-15s instead of 30s)
- New feature: AI-tell phrase detection and rewrite

The implementation should closely follow the patterns established in 6-1:
1. Create LLM function in `/lib/ai/`
2. Create API endpoint with timeout
3. Integrate with session storage
4. Build frontend component
5. Write comprehensive tests

### Story Status

✅ **ready-for-dev** - Comprehensive context created, all technical details documented, ready for implementation

---

## Change Log

- 2026-01-25: Story 6-2 created with comprehensive developer context
  - 10 detailed acceptance criteria
  - 8 implementation tasks with subtasks
  - Complete technical requirements for LLM prompt design
  - Security boundaries clearly defined
  - Learnings from previous story (6-1) documented
  - Git intelligence showing patterns to follow
  - Latest technical information for LangChain & Anthropic
  - Full file structure and references provided

---

## Story Files

| File | Purpose |
|------|---------|
| `/lib/ai/generateSummarySuggestion.ts` | Core LLM function for summary optimization |
| `/lib/ai/detectAITellPhrases.ts` | Utility for detecting AI-generated phrases |
| `/app/api/suggestions/summary/route.ts` | API endpoint for Summary suggestions |
| `/components/shared/SummaryOptimization.tsx` | UI component for displaying suggestions |
| `/types/suggestions.ts` | Type definitions for suggestion responses |
| `/tests/api/suggestions-summary.spec.ts` | Integration tests for API endpoint |
| `/tests/lib/ai/summary-generation.spec.ts` | Unit tests for LLM function |
