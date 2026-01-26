# Story 6.1: Implement LLM Pipeline API Route

Status: ready-for-dev

---

## Story

As a developer,
I want an API route that orchestrates the LLM optimization pipeline,
So that the frontend can trigger optimization with proper timeout handling and cost tracking.

## Acceptance Criteria

1. **Route created and accessible:** `/api/optimize` endpoint accepts POST requests
2. **Pipeline orchestration:** Sequential execution of Parse → Analyze → Optimize steps using LangChain
3. **Timeout handling:** 60-second timeout with graceful error handling (LLM_TIMEOUT error code)
4. **Response format:** All responses follow ActionResponse<T> pattern (never throw)
5. **Input validation:** Resume and job description validated before LLM calls
6. **Prompt injection defense:** User content wrapped in XML tags
7. **Cost tracking:** Token usage logged for monitoring
8. **Error handling:** Standardized error codes (LLM_TIMEOUT, LLM_ERROR, VALIDATION_ERROR)
9. **Type safety:** Full TypeScript typing with no `any` types
10. **Session linkage:** Results stored in Supabase session with anonymous_id tracking

## Tasks / Subtasks

- [ ] Task 1: Set up `/app/api/optimize/route.ts` file structure (AC: #1)
  - [ ] Create route.ts with POST handler
  - [ ] Define request/response types
  - [ ] Implement ActionResponse pattern

- [ ] Task 2: Implement input validation and security (AC: #3, #5, #6)
  - [ ] Validate resume_content and jd_content presence
  - [ ] Wrap user inputs in XML tags for prompt injection defense
  - [ ] Return VALIDATION_ERROR if inputs missing/invalid

- [ ] Task 3: Implement 60-second timeout wrapper (AC: #3, #8)
  - [ ] Create timeout mechanism (Promise.race with 60s timer)
  - [ ] Return LLM_TIMEOUT error code when exceeded
  - [ ] Test timeout behavior

- [ ] Task 4: Orchestrate LLM pipeline using LangChain (AC: #2)
  - [ ] Call `extractKeywords(jd_content)` to parse job description
  - [ ] Call `matchKeywords(resume_content, keywords)` to find matches
  - [ ] Call `calculateATSScore(matches)` to compute score
  - [ ] Chain operations sequentially

- [ ] Task 5: Integrate with Supabase session storage (AC: #10)
  - [ ] Extract session_id and anonymous_id from request
  - [ ] Save results to sessions table (ats_score, keyword_analysis)
  - [ ] Use Supabase service client (not anon)
  - [ ] Handle session update errors gracefully

- [ ] Task 6: Implement token usage tracking (AC: #7)
  - [ ] Extract token_usage from LangChain response
  - [ ] Calculate cost (tokens × rate)
  - [ ] Log to analytics or audit table
  - [ ] Do NOT log user content

- [ ] Task 7: Error handling and edge cases (AC: #8)
  - [ ] Handle LLM_ERROR (API failure, rate limiting)
  - [ ] Handle PARSE_ERROR if LLM returns unexpected format
  - [ ] Test with invalid/empty inputs
  - [ ] Test with network failures

- [ ] Task 8: Testing and validation (AC: #9, #10)
  - [ ] Write unit tests for timeout mechanism
  - [ ] Write integration test with mock LLM calls
  - [ ] Verify ActionResponse pattern compliance
  - [ ] Test error code consistency

## Dev Notes

### Architecture Compliance

**From project-context.md:**
- **API pattern:** Use `/api/optimize` route (60-second timeout required)
- **Response format:** MUST use ActionResponse<T> - never throw
- **Error codes:** Use standardized codes (LLM_TIMEOUT, LLM_ERROR, VALIDATION_ERROR)
- **LLM security:** User content server-side only, wrap in XML tags
- **Token tracking:** Log for cost monitoring

**From epics.md (Story 6.1):**
- Parse → Analyze → Optimize sequential pipeline
- Timeout handling with graceful degradation
- User content treated as data, not instructions
- Response follows ActionResponse<T>
- Token usage logged for cost tracking

### Technical Requirements

**LangChain Pipeline:**
- Use `@langchain/core` for SequentialChain or similar composition
- Call existing functions from `/lib/ai/`:
  - `extractKeywords()` - parses JD into keywords
  - `matchKeywords()` - finds resume matches
  - `calculateATSScore()` - computes score
- Capture LLM token usage from each step
- Handle partial failures gracefully

**Security Boundaries:**
- Wrap resume_content and jd_content in XML tags before passing to LLM
- Example: `<user_content>${resumeContent}</user_content>`
- Never expose Anthropic API key to frontend
- Use Supabase service client for session updates

**Database Integration:**
```typescript
// Update sessions table with results
UPDATE sessions SET
  ats_score = calculated_score,
  keyword_analysis = { matched: [...], missing: [...] },
  updated_at = now()
WHERE session_id = $1 AND anonymous_id = $2
```

**Error Handling Flow:**
```
Input Validation
  ↓ (error) → return { data: null, error: { code: 'VALIDATION_ERROR', ... } }
  ↓ (ok)
LLM Pipeline with 60s timeout
  ↓ (timeout) → return { data: null, error: { code: 'LLM_TIMEOUT', ... } }
  ↓ (LLM error) → return { data: null, error: { code: 'LLM_ERROR', ... } }
  ↓ (success)
Session Update
  ↓ (db error) → return { data: null, error: { code: 'LLM_ERROR', ... } }
  ↓ (success)
Return OptimizationResult
```

### File Structure

```
/app/api/optimize/route.ts      ← This file (new)
/lib/ai/*.ts                     ← Existing functions (reuse)
/lib/supabase/client.ts          ← Session table updates
/types/optimization.ts           ← Response types (may exist)
/tests/api/optimize.spec.ts      ← Test file
```

### Previous Story Intelligence

**From Epic 5 (just completed):**
- Keyword analysis, matching, and ATS score calculation are already implemented
- LLM pipeline steps (`extractKeywords`, `matchKeywords`, `calculateATSScore`) exist in `/lib/ai/`
- Score calculation uses methodology: keywords (40%) + section coverage (35%) + content quality (25%)
- This story orchestrates those components into a single API route

**Key learnings from Epic 5 stories:**
- Token tracking is important for cost monitoring
- Timeout handling is critical for long operations
- Session persistence requires both Zustand (client) and Supabase (server)
- Error messages must be user-friendly while preserving code

### Git Intelligence

**Recent commits relevant to this story:**
- `813645a` - Epic 5 integration testing (ATS score complete)
- `78800a8` - Gap analysis display (keyword analysis working)
- `ef05374` - ATS score display with breakdown (core logic proven)
- `901bc28` - ATS score calculation (implementation patterns established)

**Files modified in previous stories:**
- `/lib/ai/extractKeywords.ts` - Keyword extraction from JD
- `/lib/ai/matchKeywords.ts` - Resume-to-keyword matching
- `/lib/ai/calculateATSScore.ts` - Score computation
- `/lib/supabase/client.ts` - Session management

**Code patterns to follow:**
- ActionResponse<T> return type used throughout
- Error handling via return objects (no throws)
- Zustand for client state, Supabase for persistence
- LangChain for sequential orchestration

### Latest Technical Information

**LangChain Sequential Orchestration (v0.2+):**
```typescript
// Modern approach: RunnableSequence
const pipeline = inputPrompt
  .pipe(llm)
  .pipe(outputParser);

// Or compose multiple steps:
const step1 = RunnablePassthrough.assign({
  keywords: (input) => extractKeywords(input.jd)
});
const step2 = RunnablePassthrough.assign({
  matches: (input) => matchKeywords(input.resume, input.keywords)
});
```

**Anthropic API Error Handling (Claude 3.x):**
- Rate limits return 429 status
- Timeouts return specific error codes
- Token overflow on long context
- Use exponential backoff for retries

**Supabase Session Management:**
- Use `createClient(url, serviceRole)` for server-side updates (not anon key)
- RLS policies enforce anonymous_id isolation
- Sessions table has created_at, updated_at for audit trails
- Use service client only in API routes, never in client code

### References

- [Source: epics.md#Story 6.1] - Full acceptance criteria and user story
- [Source: project-context.md] - ActionResponse pattern, error codes, LLM security
- [Source: _bmad-output/planning-artifacts/architecture/architecture-patterns.md] - API patterns, directory structure
- [Source: lib/ai/*.ts] - Existing LLM pipeline functions to orchestrate
- [Source: lib/supabase/client.ts] - Database client for session updates

---

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Completion Notes

- Ultimate context engine analysis completed - comprehensive developer guide created
- Story 6-1 is ready for implementation
- All dependencies (AI functions, database schemas) already in place from previous epics
- No external blockers identified

### Story Status

✅ **ready-for-dev** - Full context provided, no external dependencies, ready for dev-story workflow

---

