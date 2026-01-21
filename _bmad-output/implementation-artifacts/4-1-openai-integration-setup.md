# Story 4.1: OpenAI Integration Setup

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**, I want **a configured OpenAI client with proper error handling** so that **the AI analysis features work reliably**.

## Acceptance Criteria

1. ✓ OpenAI API key configured in environment variables
2. ✓ OpenAI client initialized successfully on application startup
3. ✓ Client can make API calls to GPT-4o-mini
4. ✓ Successful API responses are parsed and returned correctly
5. ✓ Token usage is logged for cost monitoring
6. ✓ Rate limiting (429) handled with exponential backoff (max 3 retries)
7. ✓ Network errors handled with single retry, user-friendly error returned
8. ✓ Request timeouts (> 30 seconds) cancelled with user-friendly error
9. ✓ Invalid/missing API key returns clear server-side error log
10. ✓ All error paths covered with unit tests

## Tasks / Subtasks

- [x] **Task 1: Setup OpenAI Environment & Package** (AC: 1)
  - [x] Add `OPENAI_API_KEY` to `.env.local` template and documentation
  - [x] Verify `openai` package installed (version check in package.json)
  - [x] Document API key setup instructions in `README.md` under "Configuration"
  - [x] Add `OPENAI_API_KEY` validation on app startup (log warning if missing)
  - [x] Verify TypeScript types available from `openai` package

- [x] **Task 2: Create OpenAI Client with Singleton Pattern** (AC: 2, 3, 5)
  - [x] Create `lib/openai/client.ts`
  - [x] Implement singleton pattern to ensure single client instance
  - [x] Initialize client with `OPENAI_API_KEY` from environment
  - [x] Set timeout to 30 seconds (prevent hanging requests)
  - [x] Create client initialization function that validates API key existence
  - [x] Log initialization success at INFO level
  - [x] Log initialization failure at ERROR level with context
  - [x] Export initialized client as default export

- [x] **Task 3: Implement Retry Logic with Exponential Backoff** (AC: 6, 7)
  - [x] Create `lib/openai/retry.ts` with retry utility
  - [x] Implement exponential backoff function: `delay = Math.pow(2, attempt) * 1000` (1s, 2s, 4s)
  - [x] Rate limiting (429) errors: retry up to 3 times with exponential backoff
  - [x] Network errors (connection, DNS): retry once with 1-second delay
  - [x] Return user-friendly error after all retries exhausted:
    - Rate limit: "The AI service is busy. Please wait a moment and try again."
    - Network: "Analysis service temporarily unavailable. Please check your connection and try again."
  - [x] Add `isRateLimitError` and `isNetworkError` helper functions
  - [x] Log each retry attempt with error details for debugging

- [x] **Task 4: Implement Response Parsing & Token Logging** (AC: 4, 5)
  - [x] Create `lib/openai/parseResponse.ts`
  - [x] Export `parseOpenAIResponse(response)` function
  - [x] Extract `choices[0].message.content` from response
  - [x] Extract `usage.prompt_tokens`, `usage.completion_tokens`, `usage.total_tokens`
  - [x] Log token usage at DEBUG level: `[OpenAI] Tokens - Prompt: X, Completion: Y, Total: Z`
  - [x] Calculate cost estimate: `(promptTokens * 0.15 + completionTokens * 0.60) / 1000000` (GPT-4o-mini pricing)
  - [x] Log cost estimate at DEBUG level: `[OpenAI] Cost: $0.00X`
  - [x] Handle malformed responses with meaningful error message
  - [x] Return parsed response with token usage metadata

- [x] **Task 5: Implement Timeout Handling** (AC: 8)
  - [x] Utilize OpenAI client's built-in timeout (set in Task 2)
  - [x] Catch timeout errors (identify by error type/code)
  - [x] Return user-friendly error: "Analysis is taking longer than expected. Please try again."
  - [x] Log timeout with context for investigation
  - [x] Ensure timeout applies to all API calls through client

- [x] **Task 6: Implement Configuration Error Handling** (AC: 9)
  - [x] Check for invalid/missing `OPENAI_API_KEY` on client initialization
  - [x] Log clear server-side error: `[OpenAI] FATAL: Missing OPENAI_API_KEY environment variable`
  - [x] Do NOT expose raw API errors to client (security)
  - [x] Return sanitized user error: "Analysis service configuration error"
  - [x] Add ERROR log with suggestion to check server logs if this error occurs

- [x] **Task 7: Create Type Definitions** (AC: All)
  - [x] Create `lib/openai/types.ts`
  - [x] Export `OpenAIResponse` type with `content: string, usage: TokenUsage` structure
  - [x] Export `TokenUsage` type: `{ promptTokens: number, completionTokens: number, totalTokens: number }`
  - [x] Export `OpenAIError` type with error classification (rate_limit, network, timeout, config)
  - [x] Ensure all type exports are used consistently in Task 2-5

- [x] **Task 8: Unit Tests for Error Handling** (AC: 10)
  - [x] Create `tests/unit/lib/openai/client.test.ts`
  - [x] Test successful API call flow (mock OpenAI response)
  - [x] Test rate limit (429) error with 3 retries
  - [x] Test network error with 1 retry
  - [x] Test timeout error (30+ second request)
  - [x] Test missing API key error on initialization
  - [x] Test invalid API key error on API call
  - [x] Test malformed response handling
  - [x] Test token logging (verify logs contain usage info)
  - [x] Test cost calculation accuracy
  - [x] Verify all error paths return user-friendly messages (never raw API errors)

- [x] **Task 9: Documentation & Environment Setup** (AC: All)
  - [x] Update `README.md` with "OpenAI Setup" section
  - [x] Document how to obtain OpenAI API key
  - [x] Document `.env.local` required variables
  - [x] Add `.env.example` with `OPENAI_API_KEY=` placeholder
  - [x] Create `docs/OPENAI_SETUP.md` with troubleshooting guide
  - [x] Document error codes returned to frontend
  - [x] Add comment in `lib/openai/client.ts` explaining timeout strategy

## Dev Notes

### Architecture Context

**Integration Points:**
- Story 4.2 (ATS Score Calculation) depends on this client for API calls
- Story 4.3+ (Keyword Detection, Section Scoring) use same client
- Story 4.7 (Results Page) displays errors from these calls
- Test infrastructure (Story 8-3) provides test-only API endpoints, but production uses real OpenAI

**Why This Story First:**
- All subsequent analysis stories (4.2-4.6) require a working OpenAI client
- Error handling established here applies to all downstream stories
- Token logging enables cost monitoring from day one
- Provides foundation for reliable AI features

**No blocking dependencies:**
- This story is independent of Epics 1-3 implementation
- Does not depend on database schema changes
- Can be developed alongside other stories

### Technical Context

**Server Actions Pattern** (project-context.md:40-57):
All OpenAI interactions should wrap calls in Server Actions that follow `ActionResponse<T>`:
```typescript
export async function analyzeResume(input: AnalysisInput): Promise<ActionResponse<AnalysisResult>> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } }
  }
  try {
    const result = await openaiClient.chat.completions.create(...)
    const parsed = parseOpenAIResponse(result)
    return { data: parsed, error: null }
  } catch (e) {
    console.error('[analyzeResume]', e)
    return { data: null, error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' } }
  }
}
```

**Environment Variable Handling:**
- Never check API keys in browser code (always server-side)
- Use `process.env.OPENAI_API_KEY` in server components/actions only
- Never expose raw errors from OpenAI to client (security)
- Log full errors server-side for debugging

**Error Handling Strategy:**
1. **Rate Limiting (429)**: Temporary, retry with backoff (OpenAI might be overloaded)
2. **Network Errors**: Temporary, retry once (connection issues)
3. **Timeout (30s)**: User gets feedback to retry (don't retry automatically, might compound issue)
4. **Configuration (missing key)**: Fatal, log clearly for admin
5. **Malformed Response**: Log with full response for debugging

**Naming Conventions** (from project-context.md:65-77):
- Client file: `client.ts` (singleton)
- Helper utilities: `parseResponse.ts`, `retry.ts`
- Types: `types.ts`
- Tests: `client.test.ts`
- Constants: `OPENAI_TIMEOUT_MS`, `MAX_RETRIES`, etc. (SCREAMING_SNAKE)

**File Organization** (from project-context.md:79-97):
```
lib/openai/
├── client.ts          # Singleton OpenAI client
├── retry.ts           # Retry logic with exponential backoff
├── parseResponse.ts   # Response parsing and token logging
└── types.ts           # TypeScript type definitions
```

### Implementation Considerations

**Timeout Strategy:**
- OpenAI API has built-in timeout (~30 seconds for requests)
- Set client timeout explicitly to 30 seconds to ensure consistency
- If request exceeds 30 seconds, catch timeout error and return user-friendly message
- Do NOT automatically retry on timeout (could compound the problem)

**Cost Monitoring:**
- GPT-4o-mini pricing (as of 2026-01-20):
  - Input: $0.15 per 1M tokens
  - Output: $0.60 per 1M tokens
- Log every API call's token usage for cost tracking
- Formula: `(promptTokens * 0.15 + completionTokens * 0.60) / 1000000`
- Consider adding optional cost logging to Supabase for dashboard visibility (future enhancement)

**Retry Logic Math:**
```
Attempt 1: immediate
Attempt 2: 2^1 * 1000ms = 2 seconds
Attempt 3: 2^2 * 1000ms = 4 seconds
Total max wait: 6 seconds before giving up
```

**Testing Considerations:**
- Mock OpenAI responses using `jest.mock('openai')`
- Test each error path independently
- Verify exponential backoff timing (don't actually wait, use fake timers)
- Verify user-friendly error messages (no API error details leaked)
- Verify token logging without making real API calls

### Previous Epic Learnings

**From Epics 1-3 Implementation:**
- Server Actions are the standard way to handle backend work
- TypeScript strict mode requires explicit type definitions
- Error handling must be defensive (never throw from Server Actions)
- Test infrastructure in Epic 8 provides Playwright fixtures for E2E testing
- Environment variables should be documented and validated on startup

**From Story 8-3 (Test API Endpoints):**
- Understand difference between test endpoints and real API clients
- This story creates the real production OpenAI client
- Later, test endpoints supplement this for data seeding in tests

### Git Intelligence

**Recent API Integration Commits:**
- Epics 1-3 established API route patterns and Server Actions
- Test infrastructure (Epic 8) provides CI/CD and test fixtures
- No existing OpenAI integration (this is first AI feature)
- Project uses `openai` npm package (already included in package.json)

**OpenAI Package Status:**
- Check `package.json` for `openai` package version
- Use latest stable version with TypeScript support
- Verify `@types/openai` or built-in types are available

### References

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [OpenAI Node.js SDK](https://github.com/openai/node-sdk)
- [GPT-4o-mini Model Documentation](https://platform.openai.com/docs/models#gpt-4-and-gpt-4-turbo)
- [OpenAI Error Handling](https://platform.openai.com/docs/guides/error-codes)
- [OpenAI Retry Strategy](https://platform.openai.com/docs/guides/rate-limits)
- Project Context: `_bmad-output/project-context.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Epic 4: `_bmad-output/planning-artifacts/epics/epic-4-ats-analysis-engine.md`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

Implementation completed 2026-01-20

### Implementation Plan

Followed TDD approach with comprehensive test coverage:
1. Created type definitions first (types.ts) to establish contracts
2. Implemented core client with singleton pattern and timeout handling
3. Built retry logic with exponential backoff for rate limits and network errors
4. Added response parsing with automatic token usage and cost logging
5. Wrote 55 unit tests covering all error paths, edge cases, and client initialization
6. Created comprehensive documentation for setup and troubleshooting

Key technical decisions:
- Singleton pattern prevents multiple OpenAI client instances
- Exponential backoff: 1s, 2s, 4s for rate limits (max 3 retries)
- Network errors: 1 retry with 1s delay
- Timeout: 30s threshold, no retry (prevents compounding issues)
- User-friendly error messages never expose API internals
- All errors structured as OpenAIError type for consistency

### Completion Notes List

- [x] OpenAI environment variable configured in .env.example (already existed)
- [x] OpenAI client created with singleton pattern in lib/openai/client.ts
- [x] Client timeout set to 30 seconds with explanatory comment
- [x] Exponential backoff retry logic implemented for rate limiting (2^n * 1000ms)
- [x] Network error retry logic implemented (1 retry with 1s delay)
- [x] Response parsing with token logging implemented in lib/openai/parseResponse.ts
- [x] Cost calculation formula verified: (prompt*0.15 + completion*0.60)/1M tokens
- [x] Configuration error handling implemented with clear logging
- [x] Timeout error handling implemented with user-friendly messages
- [x] Type definitions created in lib/openai/types.ts (TokenUsage, OpenAIResponse, OpenAIError)
- [x] Comprehensive unit tests created - 55 tests, 100% pass rate
- [x] Documentation updated in README.md with OpenAI Setup section
- [x] Comprehensive troubleshooting guide created in docs/OPENAI_SETUP.md
- [x] Index file created (lib/openai/index.ts) for clean exports
- [x] All error types tested: rate_limit, network, timeout, config, malformed
- [x] Cost monitoring enabled with automatic logging
- [x] Integration ready for Story 4.2 (ATS Score Calculation)

### File List

**Files Created:**
- `lib/openai/client.ts` - Singleton OpenAI client with initialization validation
- `lib/openai/retry.ts` - Retry logic with exponential backoff and error classification
- `lib/openai/parseResponse.ts` - Response parsing, token logging, cost calculation
- `lib/openai/types.ts` - TypeScript type definitions (TokenUsage, OpenAIResponse, OpenAIError, constants)
- `lib/openai/index.ts` - Main export file for clean imports
- `tests/unit/lib/openai/client.test.ts` - Comprehensive unit tests (55 tests)
- `docs/OPENAI_SETUP.md` - Complete setup and troubleshooting guide

**Files Updated:**
- `README.md` - Added "OpenAI Setup" section (lines 73-98)
- `.env.example` - Already contained OPENAI_API_KEY (verified, no changes needed)
- `jest.config.js` - Added lib/openai to coverage collection (code review fix)

**Files Verified (No Changes):**
- `package.json` - Confirmed openai@6.16.0 installed

### Change Log

- **2026-01-20**: Code review fixes applied (Claude Opus 4.5)
  - Fixed misleading backoff delay comment in retry.ts (1s, 2s, 4s not "immediate")
  - Fixed log data exposure in parseResponse.ts (logs structural info only, not full response)
  - Fixed error object logging in client.ts (extracts safe fields only)
  - Added 9 unit tests for client initialization (55 total tests)
  - Updated jest.config.js to include lib/openai in coverage collection
  - Fixed test comments for clarity

- **2026-01-20**: Story 4.1 implementation completed
  - Created OpenAI client library with singleton pattern and 30s timeout
  - Implemented retry logic: exponential backoff for rate limits (3 retries), single retry for network errors
  - Added response parsing with automatic token usage and cost logging
  - Built comprehensive error handling with user-friendly messages (never exposes API internals)
  - Wrote 46 unit tests covering all error paths (100% pass rate)
  - Created setup documentation in README.md and troubleshooting guide in docs/OPENAI_SETUP.md
  - All 10 acceptance criteria satisfied
  - Ready for integration in Story 4.2 (ATS Score Calculation)

